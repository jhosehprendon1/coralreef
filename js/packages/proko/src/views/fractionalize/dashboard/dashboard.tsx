import React from 'react';
import TurtleImg from '../../../images/art/turtle.svg';
import CoralRefDashArt from '../../../images/art/coralreef_dash.svg';
import './dashboard.less';

const Dashboard = (props: any) => {
  return <div className="fr_dashboard">
    <header className="fr_dashboard__header">
      <div className="fr_dashboard__header_image">
        <img src={TurtleImg} alt="" />
      </div>
      <div className="fr_dashboard__header_title">
        <h1>We are Solana NFT Marketplace</h1>
      </div>
    </header>
    <section className="fr_dashboard__content">
      <div className="fr_dashboard__picture">
        <picture>
          <source srcSet={CoralRefDashArt}></source>
          <img src={CoralRefDashArt} alt="" />
        </picture>
      </div>
      <div className="fr_dashboard__text fr_dashboard__text--first"><span className="highlight">Fractionalization</span> it’s the concept of splitting up ownership of something so that many people can receive benefits from it in a proportion to the amount they own. It’s a traditional concept which already exists today. When applied to financial securities, fractionalisation has been around for hundreds of years — when you buy a share of a company, you are buying a fraction of ownership of it.</div>
      <div className="fr_dashboard__text fr_dashboard__text--last">For many shares, the price of one unit is investible by an average retail investor, costing maybe only a few dollars. So ownership (and control) of an asset can be, and often is, fractionalised. It’s worth remembering that even one share usually offers voting rights at company AGMs and most shares will pay a dividend based on asset performance.</div>
    </section>
  </div>;
};

export {
  Dashboard
} 
