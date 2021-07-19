import { useEffect, useState } from 'react';
import { useSpring, animated } from 'react-spring';

function parseObjectToStr(
  attributes: { [index: string]: number | string },
  tpl: string,
) {
  return Object.keys(attributes)
    .map((attr: string) => {
      const value = attributes[attr];

      return tpl.replace('attr', attr).replace('value', `${value}`);
    })
    .join('');
}

export default (styleProps: Object) => {
  let [style, updateStyle] = useState({
    transform: 'scale(1) translateY(0)',
  });
  const transform = {
    scale: 1,
    translateY: '0',
  };
  let prevX = 0;
  let prevY = 0;

  const scrollHandle = () => {
    const x = window.scrollX;
    const y = window.scrollY;
    const deltaX = x - prevX;
    const deltaY = y - prevY;
    prevX = x;
    prevY = y;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      transform.translateY += (deltaY * 3) / 100;

      updateStyle({
        transform: parseObjectToStr(
          {
            ...transform,
            translateY: `${transform.translateY}%`,
          },
          ' attr(value)',
        ),
      });
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', scrollHandle);

    return () => {
      window.removeEventListener('scroll', scrollHandle);
    };
  });

  return style;
};
