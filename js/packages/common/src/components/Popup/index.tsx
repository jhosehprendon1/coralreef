import React, { useEffect, useRef, useState } from 'react';
import chain from '../../utils/chainable';
import './styles.css';


function useClickOutside(ref: any, isOpen: boolean, callback: Function) {
  useEffect(() => {

    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(event: any) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback(isOpen);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, isOpen]);
}


export default (props: {
  children: JSX.Element,
  content?: JSX.Element,
  transition?: string
}) => {
  const [isPopupVisble, togglePopup] = useState(false);
  const [isPopupInUpperLayer, togglePopupLayer] = useState(false);
  const popupRef = useRef(null);
  
  function fadePopup() {
    chain()
      .start()
      .step(() => {
        togglePopupLayer(!isPopupInUpperLayer);
      }, '.5s');
  }

  useClickOutside(popupRef, isPopupVisble, (isOpen: boolean) => {
    if (isOpen) {
      togglePopup(false);
      fadePopup();
    }
  });
  
  return (<div className="popup" ref={popupRef}>
    {React.cloneElement(props.children, {
      onClick: () => {
        togglePopup(!isPopupVisble);
        if (isPopupInUpperLayer) {
          fadePopup();
        } else {
          togglePopupLayer(!isPopupInUpperLayer);
        }
      },
      ...props.children.props
    })}
    <div className={`popup__element${props.transition ? ' popup__element--smooth' : ''}`} style={{
      opacity: isPopupVisble ? 1 : 0,
      zIndex: isPopupInUpperLayer ? 100 : -100
    }}>{props.content}</div>
  </div>);
};
