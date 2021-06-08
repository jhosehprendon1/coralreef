import React, { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  Progress,
} from 'antd';
import { getConversionRates } from '../../../../utils/assets';
import { Connection } from '@solana/web3.js';
import { ArtCard } from '../../../../components/ArtCard';
import { MetadataCategory } from '@oyster/common';
import FishesImages from '../../../../images/art/fishes.svg';
import './Review.less';

export default (props: {
  setAttributes: Function,
  confirm: Function,
  attributes: any,
  connection: Connection,
  progress?: number
}) => {
  const [isConfirmVisible, toggleConfirm] = useState(false);
  const [pkey, setPkey] = useState('');
  const [success, setSuccess] = useState(false);

  return <>
    <section className="review">
      <div className="review--3_cols review--3_offset">
          {
            props.attributes.items.map((item: {
              metadata: {
                info: {
                  extended: {
                    image: string;
                    category: MetadataCategory;
                  };
                  data: {
                    name: string;
                  };
                };
              }
            }, key: React.Key) => {

              return <ArtCard
                key={key}
                className="review__art_card"
                image={item.metadata.info.extended.image}
                file={item.metadata.info.data.name}
                category={item.metadata.info.extended.category}
                name={item.metadata.info.data.name}
                symbol={props.attributes.symbol}
                small={true}
                  />
              })
          }
        </div>
        <div className="review--4_cols">
          <div className="review__row">
            <p className="review__price">NFT PRICE:</p>
            <div className="review--flex review__feature_value">
              <span>${(props.attributes.price || 0).toFixed(2)}</span>
              <span>◎{(props.attributes.priceInSolanas || 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="review__row">
            <p className="review__feature"># Tokens</p>
            <p className="review__feature_value">{props.attributes.tokens}</p>
          </div>
          <div className="review__row">
            <p className="review__feature">Token Symbol</p>
            <p className="review__feature_value">{props.attributes.tokenSymbol}</p>
          </div>
          <div className="review__row">
            <p className="review__feature">Token Description</p>
            <p className="review__feature_value">{props.attributes.tokenDescription}</p>
          </div>
          <div className="review__row">
            <p className="review__feature">Number of tokens that will be sent to Serum</p>
            <p className="review__feature_value">{props.attributes.serumTokens}</p>
          </div>
          <div className="review__row">
            <p className="review__feature">Number of tokens that will be kept in your wallet</p>
            <p className="review__feature_value">{props.attributes.creatorTokens}</p>
          </div>
        </div>
    </section>
    <section className="art_ctas">
      <Modal className="review__modal" visible={isConfirmVisible} footer={null} onCancel={() => toggleConfirm(false)}>
        {!props.progress && success && <><header>
          <img src={FishesImages} alt=""/>
          <p className="review__confirm_msg">Congratulations, your NFT has been fractionalized</p>
          <p className="review__confirm_msg">This is your public key: {pkey}</p>
        </header>
        <div className="review__confirm_ctas">
          <Button
            type="primary"
            size="large"
            className="art_ctas__cta"
          >List Another Item</Button>
          <Button
            type="primary"
            size="large"
            className="art_ctas__cta secondary_cta"
          >View Transaction</Button>
        </div></>}
        {props.progress && 
        <>
        <div className="waiting-title">
            Your creation is being fractionalized...
        </div>
        <Progress trailColor="#23ACDB" strokeColor="#E5226F" type="circle" percent={props.progress} />
        <div className="waiting-subtitle">This can take up to 1 minute.</div>
        </>}
      </Modal>
      <Button
        type="primary"
        size="large"
        className="art_ctas__cta"
        onClick={() => {
          toggleConfirm(true);
          props.confirm((resp: any) => {
            setSuccess(true);
            setPkey(resp.marketPublicKey);
          });
        }}
      >Next</Button>
    </section>
  </>;
};
