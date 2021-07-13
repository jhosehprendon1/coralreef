import React, { useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import { chain } from '@oyster/common';
import { useArt } from '../../hooks';
import { artProperties } from '../../state';
import './index.less';
import { useEffect } from 'react';
import { getPositionInDocument } from '../../utils/dom';

export default (props: any) => {
  // const properties = useRecoilValue(artProperties);
  const [properties, updateArtDetailsState] = useRecoilState(artProperties);
  const [scaledModifier, updateScale] = useState('');
  const [descrModifier, updateDescrModifier] = useState('');
  const [descrStyle, updateDescrStyle] = useState<Object>({});
  const { id } = useParams<{ id: string }>();
  const art = useArt(id);
  const history = useHistory();
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgLoaded, updateImgLoaded] = useState(false);

  function updateGlobalArtState(top: number) {
    updateDescrStyle({
      top: `${top + 20}px`
    });

    updateDescrModifier(' art__description--visible');

    if (imgRef.current && !properties.artId) {
      const {
        width: detailWidth,
        height: detailHeight
      } = imgRef.current.getBoundingClientRect();
      const {
        top: detailTop,
        left: detailLeft
      } = getPositionInDocument(imgRef.current);

      updateArtDetailsState({
        ...properties,
        detailTop,
        detailLeft,
        detailWidth,
        detailHeight,
        artId: id,
        src: art.image
      });

    }
  }

  useEffect(() => {
    const steps = chain();

    if (imgLoaded) {
      if (scaledModifier === '') {
        steps.step(() => {
          updateScale(' art__media--scaled');
        }, '0.15s');
      }
      if (Object.keys(descrStyle).length <= 0 && imgRef.current) {
        const {
          bottom
        } = imgRef.current.getBoundingClientRect();

        steps.step(() => {
          updateGlobalArtState(bottom);
        }, '1s');
      }
    }
  }, [imgLoaded]);

  return <div className="art">
    <section>
      <img
        className={`art__media${scaledModifier}`}
        style={{
          position: 'fixed',
          top: properties.top,
          left: properties.left,
          width: `${properties.width}px`,
          height: `${properties.height}px`
        }}
        src={art.image}
        alt=""
        onLoad={() => {
          updateImgLoaded(true);
        }}
        ref={imgRef} />
    </section>
    <section className={`art__description${descrModifier}`} style={descrStyle || {}}>
      <h1>{art.title}</h1>
      <p>{art.about}</p>
    </section>
  </div>;
};
