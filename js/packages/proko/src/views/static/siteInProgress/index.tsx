import React from 'react';
import { TwitterCircleFilled } from '@ant-design/icons';
import CoralRefLogo from '../../../images/coralreef_logo.svg';
import './index.less';


export default (props: any) => {
  return <main className="main">
    <header className="header center">
      <h1 className="heading">We are a Solana NFT marketplace</h1>
      <img className="logo" src={CoralRefLogo} alt="" />
    </header>
    <section className="info">
      <p className="text">Please Follow us on Twitter for updates</p>
      <a className="link link--icon" href="https://twitter.com/CoralReefNFT?s=09" rel="noopener"><TwitterCircleFilled /></a>
      <a className="link link--squared link--large_text" href="https://twitter.com/CoralReefNFT?s=09" rel="noopener">Coming Soon</a>
    </section>
  </main>;
};
