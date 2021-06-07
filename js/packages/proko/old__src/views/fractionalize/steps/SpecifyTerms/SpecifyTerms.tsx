import React, { useEffect, useState } from 'react';
import {
  Row,
  Input,
  Button
} from 'antd';
import { getConversionRates } from '../../../../utils/assets';
import './SpecifyTerms.less';

export default (props: {
  setAttributes: Function,
  confirm: Function,
  attributes: any
}) => {
  const currency = 'usd';
  const [conversionRates, updateConversionRates] = useState({
    solana: {
      [currency]: 0
    }
  });
  const [price, updatePrice] = useState({
    value: props.attributes.price || 0,
    isValid: true,
    isAltered: false
  });
  const [tokens, updateTokens] = useState({
    value: props.attributes.tokens || 0,
    isValid: true,
    isAltered: false
  });
  const [tokenSymbol, updateTokenSymbol] = useState({
    value: props.attributes.tokenSymbol || '',
    isValid: true,
    isAltered: false
  });
  const [tokenDescription, updateTokenDescription] = useState({
    value: props.attributes.tokenDescription || '',
    isValid: true,
    isAltered: false
  });
  const isFormValid = price.isValid && tokens.isValid && tokenSymbol.isValid && tokenDescription.isValid;
  const priceInSolanas = price.value / conversionRates.solana[currency];

  useEffect(() => {
    getConversionRates(['solana'], [currency], (rates: any) =>{
      if (rates.solana[currency] !== conversionRates.solana[currency]) {
        updateConversionRates(rates);
      }
    });
  }, [conversionRates]);

  return <>
    <form className="specify_terms">
      <section className="specify_terms__section">
          <h3 className="specify_terms__subheading">NFT Price</h3>
          <label className="specify_terms__label">
            <span className="specify_terms__label_text">
              Set the starting price of the NFT
            </span>
            {price.isValid || !price.isAltered
              ? ''
              : <span className="field-info field-info--error">
                  The price value ◎{priceInSolanas.toFixed(2)}, is out of range
              </span>
            }
            <div className="specify_terms__group">
              <Input
                type="number"
                min={0}
                autoFocus
                className="specify_terms__input"
                placeholder="Price"
                prefix="$"
                value={price.value || ''}
                onChange={info => {
                  const { target } = info;
                  const value = parseFloat(target.value);

                  updatePrice({
                    value,
                    isValid: target.checkValidity(),
                    isAltered: true
                  });

                  props.setAttributes({
                    ...props.attributes,
                    tokens: tokens.value,
                    price: value,
                    priceInSolanas,
                    tokenSymbol: tokenSymbol.value,
                    tokenDescription: tokenDescription.value
                  });
                }}
              />
              <span className="specify_terms__price_text">◎ {(priceInSolanas || 0).toFixed(2)}</span>
            </div>
          </label>
      </section>
      <section className="specify_terms__section">
        <h3 className="specify_terms__subheading">Number of tokens</h3>
        <p className="specify_terms__subtitle">Set the number of tokens in which you want to fractionalize the NFT</p>
        <div className="specify_terms__subsection">
          <label className="specify_terms__label">
            <span className="specify_terms__label_text">
              Min 5 max 1000
            </span>

            {tokens.isValid || !tokens.isAltered
              ? null
              : <span className="field-info field-info--error">
                The token value {tokens.value}, is out of range
              </span>
            }
            <div className="specify_terms__group">
              <Input
                type="number"
                min={5}
                max={1000}
                className="specify_terms__input"
                placeholder="Tokens"
                value={tokens.value || ''}
                onChange={info => {
                  const { target } = info;
                  const value = parseFloat(target.value);

                  updateTokens({
                    value,
                    isValid: target.checkValidity(),
                    isAltered: true
                  });

                  props.setAttributes({
                    ...props.attributes,
                    tokens: value,
                    price: price.value,
                    priceInSolanas,
                    tokenSymbol: tokenSymbol.value,
                    tokenDescription: tokenDescription.value
                  });
                }}
              />
              <div className="specify_terms__info_box">
                <span className="specify_terms__info_box_title">Total:</span> {tokens.value || 0}
              </div>
            </div>
          </label>
        </div>
        <div className="specify_terms__subsection">
          <label className="specify_terms__label">
            <span className="specify_terms__label_text">
              Token Symbol - Max 10 characters
            </span>

            {tokenSymbol.isValid || !tokenSymbol.isAltered
              ? ''
              : <span className="field-info field-info--error">
                The token characters has invalid characters
                </span>
            }

            <div>
              <Input
                maxLength={10}
                className="specify_terms__input"
                placeholder="Token characters"
                pattern={'\\w{1,10}'}
                value={tokenSymbol.value}
                onChange={info => {
                  const { target } = info;
                  const value = target.value;

                  updateTokenSymbol({
                    value,
                    isValid: target.checkValidity(),
                    isAltered: true
                  });

                  props.setAttributes({
                    ...props.attributes,
                    tokens: tokens.value,
                    price: price.value,
                    priceInSolanas,
                    tokenSymbol: value,
                    tokenDescription: tokenDescription.value
                  });
                }}
              />
            </div>
          </label>
        </div>
        <div className="specify_terms__subsection">
          <label className="specify_terms__label">
            <span className="specify_terms__label_text">
              Token Description
            </span>
            <div>
              <Input
                className="specify_terms__input specify_terms__input--mid"
                placeholder="Token description"
                value={tokenDescription.value}
                onChange={info => {
                  const { target } = info;
                  const { value } = target;
                  
                  updateTokenDescription({
                    value,
                    isValid: target.checkValidity(),
                    isAltered: true
                  });

                  props.setAttributes({
                    ...props.attributes,
                    tokens: tokens.value,
                    price: price.value,
                    priceInSolanas,
                    tokenSymbol: tokenSymbol.value,
                    tokenDescription: value
                  });
                }}
              />
            </div>
          </label>
        </div>
      </section>
      <section className="specify_terms__section art_ctas">
        <Button
          type="primary"
          size="large"
          className="art_ctas__cta"
          disabled={!isFormValid}
          onClick={() => {
            props.setAttributes({
              ...props.attributes,
              tokens: tokens.value,
              price: price.value,
              priceInSolanas,
              tokenSymbol: tokenSymbol.value,
              tokenDescription: tokenDescription.value
            });
            props.confirm();
          }}
          >Next</Button>
      </section>
    </form>
  </>;
};
