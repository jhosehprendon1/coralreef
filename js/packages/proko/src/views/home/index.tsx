import React from 'react';
import { useParallax } from '../../hooks';
import './index.less';

export default (props: any) => {

  const styles = useParallax({});

  return <div className="home">
    <header className="hero">
      <div className="hero__info">
        <h1 className="hero__heading">UNIQUE & RARE DIGITAL ART</h1>
        <p className="hero__body">Create a beautiful NFT product. Explore the best collection from popular digital artists.</p>
      </div>
      <div className="hero__media">
        <img
          className="hero__media_image"
          style={styles}
          src="img/form_02.png"
          alt="" />
      </div>
      <div className="hero__ctas">
        <button className="hero__cta">Explore</button>
        <button className="hero__cta hero__cta--secondary">Create</button>
      </div>
    </header>
    <div style={{ visibility: 'hidden' }}>
      <img
        style={{}}
        src="img/hero_banner_1.jpg"
        alt="" />
    </div>
  </div>;
};
