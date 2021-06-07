
import {
  Steps,
  Row,
  Button,
  Upload,
  Col,
  Input,
  Statistic,
  Slider,
  Progress,
  Spin,
  InputNumber,
  Form,
} from 'antd';
import { Creator, IMetadataExtension, MetaplexModal, shortenAddress, useWallet } from '@oyster/common';
import React, { useEffect, useState } from 'react';
import { UserSearch, UserValue } from '../../../../components/UserSearch';
import { PublicKey } from '@solana/web3.js';
import './index.less';
interface Royalty {
  creatorKey: string;
  amount: number;
}

const shuffle = (array: Array<any>) => {
  array.sort(() => Math.random() - 0.5);
};

const RoyaltiesSplitter = (props: {
  creators: Array<UserValue>;
  royalties: Array<Royalty>;
  setRoyalties: Function;
}) => {
  return (
    <div>
      {props.creators.map((creator, idx) => {
        const royalty = props.royalties.find(
          royalty => royalty.creatorKey === creator.key,
        );
        if (!royalty) return null;

        const amt = royalty.amount;
        const handleSlide = (newAmt: number) => {
          const othersRoyalties = props.royalties.filter(
            _royalty => _royalty.creatorKey !== royalty.creatorKey,
          );
          if (othersRoyalties.length < 1) return;
          shuffle(othersRoyalties);
          const others_n = props.royalties.length - 1;
          const sign = Math.sign(newAmt - amt);
          let remaining = Math.abs(newAmt - amt);
          let count = 0;
          while (remaining > 0 && count < 100) {
            const idx = count % others_n;
            const _royalty = othersRoyalties[idx];
            if (
              (0 < _royalty.amount && _royalty.amount < 100) || // Normal
              (_royalty.amount === 0 && sign < 0) || // Low limit
              (_royalty.amount === 100 && sign > 0) // High limit
            ) {
              _royalty.amount -= sign;
              remaining -= 1;
            }
            count += 1;
          }

          props.setRoyalties(
            props.royalties.map(_royalty => {
              const computed_amount = othersRoyalties.find(
                newRoyalty => newRoyalty.creatorKey === _royalty.creatorKey,
              )?.amount;
              return {
                ..._royalty,
                amount:
                  _royalty.creatorKey === royalty.creatorKey
                    ? newAmt
                    : computed_amount,
              };
            }),
          );
        };
        return (
          <div className="royalties__spliter" key={idx}>
            <div className="royalties__spliter_user">
              {creator.label}
            </div>
            <div className="royalties__spliter_slider">
              <Slider
                value={amt}
                onChange={handleSlide}
                className="royalties__input_range"
                />
            </div>
            <div className="royalties__spliter_percentage">
              {amt}%
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default (props: {
  attributes: IMetadataExtension;
  setAttributes: (attr: IMetadataExtension) => void;
  confirm: () => void;
}) => {
  // const file = props.attributes.image;
  const { wallet, connected } = useWallet();

  const [creators, setCreators] = useState<Array<UserValue>>([]);
  const [fixedCreators, setFixedCreators] = useState<Array<UserValue>>([]);
  const [royalties, setRoyalties] = useState<Array<Royalty>>([]);
  const [showCreatorsModal, setShowCreatorsModal] = useState<boolean>(false);

  useEffect(() => {
    if (wallet?.publicKey) {
      const key = wallet.publicKey.toBase58();
      setFixedCreators([
        {
          key,
          label: shortenAddress(key),
          value: key,
        },
      ]);
    }
  }, [connected, setCreators]);

  useEffect(() => {
    setRoyalties(
      [...fixedCreators, ...creators].map(creator => ({
        creatorKey: creator.key,
        amount: Math.trunc(100 / [...fixedCreators, ...creators].length),
      })),
    );
  }, [creators, fixedCreators]);

  return (
    <div className="royalties">
      <div className="grid">
        <div className="grid grid--12_cols">
          <div className="royalties__group grid--6_cols grid--4_offset">
            <div className="royalties__group_info">
              <span className="royalties__group_title">Royalty Percentage</span>
              <p className="royalties__group_descrp">
                This is how much of each secondary sale will be paid out to the
                creators.
              </p>
            </div>
            <div>
            <Slider
              autoFocus
              min={0}
              max={100}
              defaultValue={props.attributes.seller_fee_basis_points || 0}
              onChange={(val: number) => {
                props.setAttributes({
                  ...props.attributes,
                  seller_fee_basis_points: val,
                });
              }}
              className="royalties__input_range"
            />
            <div className="royalties__percentage">
                {(props.attributes.seller_fee_basis_points) || 0}%
            </div>
            </div>
          </div>
        </div>
        {[...fixedCreators, ...creators].length > 0 && (
        <div className="grid grid--12_cols">
          <div className="royalties__group grid--6_cols grid--4_offset">
            <div className="royalties__group_info">
              <span className="royalties__group_title">Creators Split</span>
              <p className="royalties__group_descrp">
                This is how much of the proceeds from the initial sale and any
                royalties will be split out amongst the creators.
              </p>
            </div>
            <RoyaltiesSplitter
              creators={[...fixedCreators, ...creators]}
              royalties={royalties}
              setRoyalties={setRoyalties}
            />
          </div>
        </div>
        )}
        <div className="grid grid--12_cols">
          <div className="grid--6_cols grid--4_offset">
            <span onClick={() => setShowCreatorsModal(true)}>
              <span className="royalties__add_creator_icon">+</span>
              <span className="royalties__add_creator_text">Add another creator</span>
            </span>
            <MetaplexModal
              visible={showCreatorsModal}
              onCancel={() => setShowCreatorsModal(false)}
            >
              <label className="royalties__label" style={{ width: '100%' }}>
                <span className="royalties__group_title">Creators</span>
                <UserSearch setCreators={setCreators} />
              </label>
            </MetaplexModal>
          </div>
        </div>
        <div className="grid grid--12_cols">
          <div className="grid--6_cols grid--4_offset royalties--final_row">
            <Button
              type="primary"
              size="large"
              onClick={() => {
                const creatorStructs: Creator[] = [
                  ...fixedCreators,
                  ...creators,
                ].map(
                  c =>
                    new Creator({
                      address: new PublicKey(c.value),
                      verified: c.value === wallet?.publicKey?.toBase58(),
                      share:
                        royalties.find(r => r.creatorKey === c.value)?.amount ||
                        Math.round(100 / royalties.length),
                    }),
                );

                const share = creatorStructs.reduce(
                  (acc, el) => (acc += el.share),
                  0,
                );
                if (share > 100 && creatorStructs.length) {
                  creatorStructs[0].share -= share - 100;
                }
                props.setAttributes({
                  ...props.attributes,
                  creators: creatorStructs,
                });
                props.confirm();
              }}
              className="next_cta"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
