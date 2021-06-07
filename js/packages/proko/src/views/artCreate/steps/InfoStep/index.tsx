import { IMetadataExtension, useWallet } from '@oyster/common';
import React, { useEffect, useState } from 'react';
import { ArtCard } from '../../../../components/ArtCard';
import { UserValue } from '../../../../components/UserSearch';
import {
  Steps,
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
import './index.less';

interface Royalty {
  creatorKey: string;
  amount: number;
}

export default (props: {
  attributes: IMetadataExtension;
  setAttributes: (attr: IMetadataExtension) => void;
  confirm: () => void;
}) => {
  const [creators, setCreators] = useState<Array<UserValue>>([]);
  const [royalties, setRoyalties] = useState<Array<Royalty>>([]);
  const { wallet } = useWallet();

  const file = props.attributes.properties.files?.[0];
  const fileName = typeof file === 'string' ? file : file?.name;

  useEffect(() => {
    setRoyalties(
      creators.map(creator => ({
        creatorKey: creator.key,
        amount: Math.trunc(100 / creators.length),
      })),
    );
  }, [creators]);
  return (
    <>
      <div className="grid">
        <div className="grid--4_offset grid--3_cols">
          
            {props.attributes.image && (
              <ArtCard
                image={props.attributes.image}
                file={fileName || ''}
                category={props.attributes.properties?.category}
                name={props.attributes.name}
                symbol={props.attributes.symbol}
                small={true}
              />
            )}
        </div>
        <div className="grid--3_cols">
            <label className="info_step__label info_step__label--full_width">
              <span className="info_step__label_text">Title</span>
              <Input
                autoFocus
                className="info_step__input info_step__input--full_width"
                placeholder="Max 50 characters"
                allowClear
                value={props.attributes.name}
                onChange={info =>
                  props.setAttributes({
                    ...props.attributes,
                    name: info.target.value,
                  })
                }
              />
            </label>
            <label className="info_step__label info_step__label--full_width">
              <span className="info_step__label_text">Description</span>
              <Input.TextArea
                className="info_step__input info_step__input--full_width textarea"
                placeholder="Max 500 characters"
                value={props.attributes.description}
                onChange={info =>
                  props.setAttributes({
                    ...props.attributes,
                    description: info.target.value,
                  })
                }
                allowClear
              />
            </label>
            <label className="info_step__label info_step__label--full_width">
              <span className="info_step__label_text">Maximum Supply</span>
              <InputNumber
                placeholder="Quantity"
                value={props.attributes.properties.maxSupply}
                onChange={(val: number) => {
                  props.setAttributes({
                    ...props.attributes,
                    properties: {
                      ...props.attributes.properties,
                      maxSupply: val,
                    },
                  });
                }}
                className="info_step__input info_step__input--full_width"
              />
            </label>
          </div>
          <div className="grid--6_cols grid--4_offset info_step--final_row">
            <Button
              type="primary"
              size="large"
              onClick={() => {
                props.setAttributes({
                  ...props.attributes,
                });

                props.confirm();
              }}
              className="next_cta"
            >
              Next
          </Button>
          </div>
        </div>
    </>
  );
};
