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
      <div className="fr_dashboard__text fr_dashboard__text--first">A creator who has minted an NFT may use Coral Reef to fractionalize the ownership of their work to obtain liquidity. This fractionalization will represent a percentage of the ownership and not a specific part of the NFT.</div>
      <div className="fr_dashboard__text fr_dashboard__text--last">The creator chooses a number of tokens in which the property will be fractionalized, the starting price of the NFT, a range between 0-100% of the tokens to be sent to the exchange (Serum), which can be freely exchanged in the market before, during or after the auction.</div>
    </section>
  </div>;
};

export {
  Dashboard
}
