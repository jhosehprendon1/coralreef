import React, { useEffect, useState } from 'react';
import {
  Button,
  Modal,
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
  connection: Connection
}) => {
  const [isConfirmVisible, toggleConfirm] = useState(false);

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
            }) => {

              return <ArtCard
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
        <header>
          <img src={FishesImages} alt=""/>
          <p className="review__confirm_msg">Congratulations, your NFT has been fractionalized</p>
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
        </div>
      </Modal>
      <Button
        type="primary"
        size="large"
        className="art_ctas__cta"
        onClick={() => {
          toggleConfirm(true);
          props.confirm();
        }}
      >Next</Button>
    </section>
  </>;
};
