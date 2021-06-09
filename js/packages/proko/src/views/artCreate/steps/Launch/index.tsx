import React, { useEffect, useState } from 'react';
import {
  Steps,
  Button,
  Upload,
  Input,
  Statistic,
  Slider,
  Progress,
  Spin,
  InputNumber,
  Form,
} from 'antd';
import { IMetadataExtension, MAX_METADATA_LEN } from '@oyster/common';
import { Connection } from '@solana/web3.js';
import { MintLayout } from '@solana/spl-token';
import { getAssetCostToStore, LAMPORT_MULTIPLIER } from '../../../../utils/assets';
import { ArtCard } from '../../../../components/ArtCard';
import { AmountLabel } from '../../../../components/AmountLabel';
import './index.less';

export default (props: {
  confirm: () => void;
  attributes: IMetadataExtension;
  connection: Connection;
  progress: number;
}) => {
  const files = (props.attributes.properties?.files || []).filter(f => typeof f !== 'string') as File[];
  const fileNames = (props.attributes.properties?.files || []).map(f => typeof f === 'string' ? f : f?.name);
  const metadata = {
    ...(props.attributes as any),
    files: fileNames,
  };
  const [cost, setCost] = useState(0);
  useEffect(() => {
    const rentCall = Promise.all([
      props.connection.getMinimumBalanceForRentExemption(MintLayout.span),
      props.connection.getMinimumBalanceForRentExemption(MAX_METADATA_LEN),
    ]);
    if (files.length && props.progress <= 0)
      getAssetCostToStore([
        ...files,
        new File([JSON.stringify(metadata)], 'metadata.json'),
      ]).then(async lamports => {
        const sol = lamports / LAMPORT_MULTIPLIER;

        // TODO: cache this and batch in one call
        const [mintRent, metadataRent] = await rentCall;

        // const uriStr = 'x';
        // let uriBuilder = '';
        // for (let i = 0; i < MAX_URI_LENGTH; i++) {
        //   uriBuilder += uriStr;
        // }

        const additionalSol = (metadataRent + mintRent) / LAMPORT_MULTIPLIER;

        console.log(props.progress);
        // TODO: add fees based on number of transactions and signers
        if (sol + additionalSol !== cost) {
          setCost(sol + additionalSol);
        }
        
      });
  }, [files, setCost]);

  return (
    <>
      <div className="launch">
        <div className="grid">
          <div className="grid--3_cols grid--4_offset">
            {props.attributes.image && (
              <ArtCard
                image={props.attributes.image}
                file={fileNames?.[0] || ''}
                category={props.attributes.properties?.category}
                name={props.attributes.name}
                symbol={props.attributes.symbol}
                small={true}
              />
            )}
          </div>
          <div className="grid--3_cols">
            <Statistic
              className="launch__royalty_percentage"
              title="Royalty Percentage"
              value={props.attributes.seller_fee_basis_points}
              precision={2}
              suffix="%"
            />
            {cost ? (
              <AmountLabel
                title="Cost to Create"
                newClasses="launch__royalty_percentage"
                amount={cost.toFixed(5)} />
            ) : (
              <Spin />
            )}
            <div className="launch__royalty_ctas">
              <div className="launch__royalty_cta_el">
                <Button
                  type="primary"
                  size="large"
                  onClick={props.confirm}
                  className="next_cta"
                >
                  Pay with SOL
                </Button>
              </div>
              <div className="launch__royalty_cta_el">
                <Button
                  disabled={true}
                  size="large"
                  onClick={props.confirm}
                  className="next_cta"
                >
                  Pay with Credit Card
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
