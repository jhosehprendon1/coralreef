import React, { useState } from 'react';

import { Identicon } from '../Identicon';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from '../../contexts/wallet';
import { useNativeAccount } from '../../contexts/accounts';
import { formatNumber, shortenAddress } from '../../utils';
import './styles.css';
import { Button, Popover } from 'antd';
import { Settings } from '../Settings';
import { Popup } from '..';

export const UserWalletBtn = (props: {
  showAddress?: boolean,
  children?: JSX.Element
}) => {
  const { wallet } = useWallet();
  const { account } = useNativeAccount();

  if (!wallet || !wallet.publicKey) {
    return null;
  }

  const baseWalletKey: React.CSSProperties = { cursor: 'pointer', userSelect: 'none' };
  const walletKeyStyle: React.CSSProperties = props.showAddress ?
  baseWalletKey
  :{ ...baseWalletKey, paddingLeft: 0 };

  let name = props.showAddress ? shortenAddress(`${wallet.publicKey}`) : '';
  const unknownWallet = wallet as any;
  if(unknownWallet.name) {
    name = unknownWallet.name;
  }

  return (
    <Popup
        content={<Settings />}
        transition="smooth"
      >
      <Button type="primary" className="wallet_btn">
        {/* <span>
        {formatNumber.format((account?.lamports || 0) / LAMPORTS_PER_SOL)} SOL
      </span> */}
        {props.children}
      </Button>
      {/* <div className="wallet-key" style={walletKeyStyle}>
        {name && (<span style={{ marginRight: '0.5rem' }}>{name}</span>)}
      </div> */}
    </Popup>
  );
};
