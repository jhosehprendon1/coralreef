import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './index.css';

export default (props: {
  items: {href?: string, text?: string, isActive: boolean}[],
  prevIcon: JSX.Element,
  nextIcon: JSX.Element,
  step: number,
  onMoveToNextStep?: Function,
  onMoveToPreviousStep?: Function
}) => {
  // const [currentStep, changeStep] = useState(props.step || 0);
  const currentStep = props.step;
  const hideNextBtn = currentStep === props.items.length - 1;
  const hidePrevBtn = currentStep === 0;

  return (<div className="stepper">
    <button
        className={`stepper__btn stepper__btn--prev${hidePrevBtn ? ' stepper__btn--invisible' : ''}`}
        onClick={() => {
          props.onMoveToPreviousStep && props.onMoveToPreviousStep(currentStep);
        }}>
      {props.prevIcon}
    </button>
  <ul className="stepper__list">
    {props.items.map((item: any, key: number) => {
      return <li key={key} className={`stepper__item`}>
        <span className={`stepper__item_text${currentStep === key ? ' stepper__item_text--active' : ''}`}>{item.text}</span>
        {(key === props.items.length - 1) ? null : <span className="stepper__line"></span>}
      </li>;
    })}
  </ul>
    <button
      className={`stepper__btn${hideNextBtn ? ' stepper__btn--invisible' : '' }`}
      onClick={() => {
        props.onMoveToNextStep && props.onMoveToNextStep(currentStep);
      }}>
      {props.nextIcon}
    </button>
  </div>);
};
