import React, { useEffect } from 'react';
import './index.less';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { Button } from 'antd';
import {
  ConnectButton,
  UserWalletBtn,
  useWallet,
  shortenAddress
} from '@oyster/common';
import { Notifications } from '../Notifications';
import { ReactComponent as CoralRefLogo} from '../../images/coralreef_logo.svg';
import WalletIcon from '../../images/icons/wallet_icon.svg';

const UserActions = () => {
  return (
    <>
      <Button className="app-btn">Bids</Button>
      <Link to={`/art/create`}>
        <Button className="app-btn">Create</Button>
      </Link>
      <Link to={`/auction/create/0`}>
        <Button type="primary">Sell</Button>
      </Link>
    </>
  );
};

export const AppBar = () => {
  const { connected, wallet } = useWallet();
  const location = useLocation();
  const history = useHistory();
  const { state } : any = location;

  const navItems = [{
    text: 'Dashboard',
    link: '/proko_fractionalize/',
    isActive: !state || state.site === 'dashboard',
    state: {
      site: 'dashboard'
    }
  }, {
    text: 'Create',
    link: '/proko_fractionalize/art/create/0',
    isActive: state && state.site === 'create',
    state: {
      site: 'create'
    }
  }, {
    text: 'Sell',
    link: '/proko_fractionalize/sell/0',
    isActive: state && state.site === 'sell',
    state: {
      site: 'sell' 
    }
  }];
  let walletKey = null;

  if (wallet && wallet.publicKey) {
    walletKey = <span className="app_bar__options_wallet_name">{shortenAddress(wallet?.publicKey.toBase58())}</span>;
  }

  return (
    <header className="app_bar">
      {/* <div className="app-left app-bar-box">
        <Notifications />
        <div className="divider" />
        <Link to={`/`}>
          <Button className="app-btn">Explore</Button>
        </Link>
        <Link to={`/artworks`}>
          <Button className="app-btn">Artworks</Button>
        </Link>
        <Link to={`/artists`}>
          <Button className="app-btn">Creators</Button>
        </Link>
      </div> */}
        <CoralRefLogo />
        <nav className="app_bar__nav">
          <ul className="app_bar__nav_items">
            {navItems.map((navItem, key) => 
              (<li className="app_bar__nav_item" key={key}>
                <Link
                  to={{
                    pathname: navItem.link,
                    state: navItem.state
                  }}
                  className={`app_bar__nav_link${navItem.isActive ? ' app_bar__nav_link--active' : ''}`}>
                    {navItem.text}
                </Link>
              </li>)
            )}
          </ul>
        </nav>
        <div className="app_bar__options">
          {!connected && <ConnectButton
            onConnect={() => {
              if (state && state.site === 'dashboard') {
                history.replace({
                  pathname: '/proko_fractionalize/sell/0',
                  state: {
                    site: 'sell'
                  }
                });
              }
            }} type="primary" className="app_bar__cta" />}
          {connected && (
            <div className="app_bar__options_info">
              {walletKey}
              <UserWalletBtn>
                <img src={WalletIcon} alt="" />
              </UserWalletBtn>
            </div>
          )}
        </div>
      </header>
  );
};
