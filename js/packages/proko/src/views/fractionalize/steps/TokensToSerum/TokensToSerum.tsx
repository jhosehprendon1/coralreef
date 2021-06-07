import React, { useState } from 'react';
import {
  Row,
  Input,
  Button,
  Slider
} from 'antd';
import './TokensToSerum.less';

export default (props: {
  setAttributes: Function,
  confirm: Function,
  attributes: any
}) => {
  const [serumPercentage, updateSerumPercentage] = useState({
    value: props.attributes.serumPercentage,
    isValid: true,
    isAltered: false,
    serumTokens: props.attributes.serumTokens,
    creatorTokens: props.attributes.creatorTokens
  });
  const isFormValid = serumPercentage.isValid;
  const tokens = props.attributes.tokens || 0;

  return <>
    <form>
      <section>
        <header className="actions_header no_padding">
          <h2>What percent of the tokens do you want to sell?</h2>
        </header>
        <div className="tokens_to_serum">
          <div className="tokens_to_serum__block tokens_to_serum__block--3_cols tokens_to_serum__block--4_offset tokens_to_serum--flex_center_content">
            <label className="tokens_to_serum__label tokens_to_serum--flex_center tokens_to_serum--full_width">
              <span className="tokens_to_serum__label_text">
                0 - 100%
              </span>
              {serumPercentage.isValid || !serumPercentage.isAltered
                ? ''
                : <span className="field-info field-info--error">
                  The percentage value{serumPercentage.value}, is out of range
                </span>
              }
              <Slider
                min={0}
                max={100}
                className="tokens_to_serum__input_range"
                defaultValue={serumPercentage.value || 0}
                tooltipVisible={false}
                onChange={(value: any) => {
                const serumTokens = Math.round(tokens * ((value || 0) / 100));
                const creatorTokens = Math.round(tokens - serumTokens);

                  updateSerumPercentage({
                    value,
                    isValid: true,
                    isAltered: true,
                    serumTokens,
                    creatorTokens
                  });
                  props.setAttributes({
                    ...props.attributes,
                    serumTokens,
                    creatorTokens,
                    serumPercentage: serumPercentage.value
                  })
                }}
              />
            </label>
          </div>
          <div className="tokens_to_serum__block tokens_to_serum__block--3_cols">
            <div className="tokens_to_serum__text"><p>Number of tokens that will be sent to Serum</p> <span className="tokens_to_serum__info_box">{Math.round(serumPercentage.serumTokens || 0)}</span></div>
            <div className="tokens_to_serum__text"><p>Number of tokens that will be kept in your wallet</p> <span className="tokens_to_serum__info_box">{Math.round(serumPercentage.creatorTokens || 0)}</span></div>
          </div>
        </div>
      </section>
      <section className="art_ctas">
        <Button
          type="primary"
          size="large"
          className="art_ctas__cta"
          disabled={!isFormValid}
          onClick={() => {
            props.setAttributes({
              ...props.attributes,
              serumTokens: serumPercentage.serumTokens,
              creatorTokens: serumPercentage.creatorTokens,
              serumPercentage: serumPercentage.value
            });
            props.confirm();
          }}
        >Next</Button>
      </section>
    </form>
  </>;
};
