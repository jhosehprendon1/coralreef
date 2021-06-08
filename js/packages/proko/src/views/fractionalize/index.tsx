import React, { useEffect, useState } from 'react';
import {
  Divider,
  Steps,
  Row,
  Button,
  Col,
  Input,
  Statistic,
  Progress,
  Spin,
  InputNumber,
  Radio,
} from 'antd';
import { ArtCard } from '../../components/ArtCard';
import { QUOTE_MINT } from '../../constants';
import { Confetti } from '../../components/Confetti';
import { ArtSelector } from './artSelector';
// import './../styles.less';
import {
  MAX_METADATA_LEN,
  useConnection,
  useWallet,
  WinnerLimit,
  WinnerLimitType,
  toLamports,
  useMint,
  Creator,
  Stepper,
  MetaplexModal,
} from '@oyster/common';
import { Connection, PublicKey } from '@solana/web3.js';
import { MintLayout } from '@solana/spl-token';
import { useHistory, useParams } from 'react-router-dom';
import {
  AuctionManagerSettings,
  WinningConfigType,
  NonWinningConstraint,
  WinningConfig,
  WinningConstraint,
  ParticipationConfig,
  WinningConfigItem,
} from '../../models/metaplex';
import {
  createAuctionManager,
  SafetyDepositDraft,
} from '../../actions/createAuctionManager';
import BN from 'bn.js';
import { ZERO } from '@oyster/common/dist/lib/constants';
import { useMeta } from '../../contexts';
import useWindowDimensions from '../../utils/layout';
import {
  FractionalizeReview,
  FractionalizeSpecifyTerms,
  FractionalizeTokensToSerum
} from './steps';
import { createMintFractionalNFT } from '../../actions/createFractionalize';
import { useUserArts } from '../../hooks';
import ChevronIcon from '../../images/icons/chevron.svg';
import './index.less';
import { Art } from '../../types';

const { Step } = Steps;
const { TextArea } = Input;

export enum AuctionCategory {
  Limited,
  Single,
  Open,
  Tiered,
  Fractionalize,
}

export { Dashboard } from './dashboard/dashboard';

interface Tier {
  to: number;
  name: string;
  description?: string;
  items: SafetyDepositDraft[];
}

export interface FractionalizeState {
  // Min price required for the item to sell
  reservationPrice: number;

  // listed NFTs
  items: SafetyDepositDraft[];
  participationNFT?: SafetyDepositDraft;
  // number of editions for this auction (only applicable to limited edition)
  editions?: number;

  // date time when auction should start UTC+0
  startDate?: Date;

  // suggested date time when auction should end UTC+0
  endDate?: Date;

  //////////////////
  category: AuctionCategory;
  saleType?: 'auction' | 'sale';

  price?: number;
  priceFloor?: number;
  priceTick?: number;
  priceInSolanas?: number;


  tokens?: number;
  tokenSymbol?: string;
  tokenDescription?: string;

  serumTokens?: number;
  creatorTokens?: number;
  serumPercentage?: number;

  startSaleTS?: number;
  startListTS?: number;
  endTS?: number;

  auctionDuration?: number;
  gapTime?: number;
  tickSizeEndingPhase?: number;

  spots?: number;
  tiers?: Array<Tier>;

  winnersCount: number;
}

export const Actions = () => {
  const connection = useConnection();
  const { connected, wallet } = useWallet();
  const { whitelistedCreatorsByCreator } = useMeta();
  const { step_param }: { step_param: string } = useParams();
  const [progress, setProgress] = useState<number>(0);
  const history = useHistory();
  const mint = useMint(QUOTE_MINT);
  const { width } = useWindowDimensions();
  const steps = [{
    href: '/proko_fractionalize/sell/0',
    text: 'Select',
    isActive: true
  }, {
    href: '/proko_fractionalize/sell/1',
    text: 'Terms',
    isActive: false
  }, {
    href: '/proko_fractionalize/sell/2',
    text: 'Serum',
    isActive: false
  }, {
    href: '/proko_fractionalize/sell/3',
    text: 'Review',
    isActive: false
  }];
  const stepTitles = [
    'Select which item to sell',
    'Specify the terms of fractionalization',
    'Send tokens to Serum',
    'Review your listing before publishing'
  ]

  const [step, setStep] = useState<number>(0);
  const [stepsVisible, setStepsVisible] = useState<boolean>(true);
  const [auctionObj, setAuctionObj] =
    useState<
      | {
          vault: PublicKey;
          auction: PublicKey;
          auctionManager: PublicKey;
        }
      | undefined
    >(undefined);
  const [attributes, setAttributes] = useState<FractionalizeState>({
    reservationPrice: 0,
    items: [],
    category: AuctionCategory.Fractionalize,
    saleType: 'auction',
    winnersCount: 1,
    startSaleTS: undefined,
    startListTS: undefined,
  });

  useEffect(() => {
    if (step_param) setStep(parseInt(step_param));
    else gotoNextStep(0);
  }, [step_param]);

  const gotoNextStep = (_step?: number) => {
    const nextStep = _step === undefined ? step + 1 : _step;
    history.push(`/proko_fractionalize/sell/${nextStep.toString()}`);
  };

  const gotoPrevStep = (_step?: number) => {
    const nextStep = _step === undefined ? step - 1 : _step;
    history.push(`/proko_fractionalize/sell/${nextStep.toString()}`);
  };

  const copiesStep = (
    <CopiesStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
      connected={connected}
    />
  );

  const reviewFractionalize = (<FractionalizeReview
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={async (fn: Function) => {
        // const inte = setInterval(
        //   () => setProgress(prog => Math.min(prog + 1, 99)),
        //   600,
        // );

        const fractResp = await createMintFractionalNFT(connection, wallet, attributes);
        // setStepsVisible(false);
        // gotoNextStep();

        // clearInterval(inte);
        // setProgress(0);
        fn(fractResp);
      }}
      connection={connection}
      progress={progress} />)

  const specifyTerms = (<FractionalizeSpecifyTerms
    attributes={attributes}
    setAttributes={setAttributes}
    confirm={() => gotoNextStep()}
    />);

  const sendTokensToSerum = (<FractionalizeTokensToSerum
    attributes={attributes}
    setAttributes={setAttributes}
    confirm={() => gotoNextStep()}
  />);

  const congratsStep = <Congrats auction={auctionObj} />;

  const stepsByCategory: { [key: number]: any } = {
    [AuctionCategory.Fractionalize]: [
      ['Copies', copiesStep],
      ['Specify Terms', specifyTerms],
      ['Serum', sendTokensToSerum],
      ['Review', reviewFractionalize],
      [undefined, congratsStep],
    ],
  };

  return (
    <>
        {/* {stepsVisible && (
          <Col span={24} md={4}>
            <Steps
              progressDot
              direction={width < 768 ?setStep
                margin: '0 auto 30px auto',
                overflowX: 'auto',
                maxWidth: '100%',
              }}
            >
              {stepsByCategory[attributes.category]
                .filter((_:any) => !!_[0])
                .map((step: any, idx: any) => (
                  <Step title={step[0]} key={idx} />
                ))}
            </Steps>
          </Col>
        )} */}
      <div>
        <header className="actions_header">
          <h2>{stepTitles[step]}</h2>
          <div className="actions_header__stepper">
            <Stepper
              items={steps}
              step={step}
              prevIcon={<img src={ChevronIcon} alt="" />}
              nextIcon={<img src={ChevronIcon} alt="" />}
              onMoveToPreviousStep={() => gotoPrevStep()}
              onMoveToNextStep={() => gotoNextStep()}
            />
          </div>
        </header>
        {stepsByCategory[attributes.category][step][1]}
      </div>
    </>
  );
};


// const WaitingStep = (props: {
//   mint: Function;
//   progress: number;
//   confirm: Function;
//   artCreated: boolean;
//   visible: boolean;
//   nft?: {
//     metadataAccount: PublicKey;
//   };
// }) => {
//   const [isVisible, toggleVisible] = useState(props.visible || false);
//   useEffect(() => {
//     const func = async () => {
//       await props.mint();
//       props.confirm();
//     };
//     func();
//   }, []);

//   return (
//     <>
//       <MetaplexModal className="waiting_step" onCancel={() => toggleVisible(false)} visible={isVisible} width={null}>
//         {!props.artCreated &&
//           <>

//             <div className="waiting-title">
//               Your creation is being uploaded to the decentralized web...
//         </div>
//             <Progress trailColor="#23ACDB" strokeColor="#E5226F" type="circle" percent={props.progress} />
//             <div className="waiting-subtitle">This can take up to 1 minute.</div>
//           </>}
//         {props.artCreated &&
//           <>
//             <header>
//               <img src={FishesImages} alt="" />
//               <Congrats nft={props.nft} />
//             </header>
//           </>}
//       </MetaplexModal>
//     </>
//   );
// };

const CopiesStep = (props: {
  attributes: FractionalizeState;
  setAttributes: (attr: FractionalizeState) => void;
  confirm: () => void;
  connected?: boolean
}) => {
  const initialArt: any | null = props.attributes.items[0] || null;
  const [currentArtselected, selectCardArt] = useState(initialArt);
  let arts = useUserArts();
  let artistFilter = (i: SafetyDepositDraft) =>
    !(i.metadata.info.data.creators || []).find((c: Creator) => !c.verified);
  let filter: (i: SafetyDepositDraft) => boolean = (i: SafetyDepositDraft) =>
    true;
  if (props.attributes.category === AuctionCategory.Limited) {
    filter = (i: SafetyDepositDraft) =>
      !!i.masterEdition && !!i.masterEdition.info.maxSupply;
  } else if (props.attributes.category === AuctionCategory.Open) {
    filter = (i: SafetyDepositDraft) =>
      !!(
        i.masterEdition &&
        (i.masterEdition.info.maxSupply === undefined ||
          i.masterEdition.info.maxSupply === null)
      );
  };

  let overallFilter = (i: SafetyDepositDraft) => filter(i) && artistFilter(i);

  return (
    <>
      <div className="art_showcase">
        <div className="art_list">
          {
            arts.map((item, key) => {
              const pubKey = item?.metadata?.pubkey?.toBase58();
              const currentPubKey = currentArtselected?.metadata?.pubkey?.toBase58();
              return (
                <ArtCard
                  className={`art_list__card${pubKey === currentPubKey ? ' art_list__card--selected' : ''}`}
                  key={key}
                  pubkey={item.metadata.pubkey}
                  preview={false}
                  onPick={() => {
                    selectCardArt(item);
                    props.setAttributes({ ...props.attributes, items: [item] })
                  }}
                />
              );
            })
          }
          {!props.connected && <p className="art_list__no_arts">Please connect to a wallet</p>}
          {props.connected && !arts.length && <p className="art_list__no_arts">Please, first create an NFT</p>}
          {props.attributes.category === AuctionCategory.Limited && (
            <label className="action-field">
              <span className="field-title">
                How many copies do you want to create?
              </span>
              <span className="field-info">
                Each copy will be given unique edition number e.g. 1 of 30
              </span>
              <Input
                autoFocus
                className="input"
                placeholder="Enter number of copies sold"
                allowClear
                onChange={info =>
                  props.setAttributes({
                    ...props.attributes,
                    editions: parseInt(info.target.value),
                  })
                }
              />
            </label>
          )}
        </div>
      </div>
      <div className="art_ctas">
        <Button
          type="primary"
          size="large"
          disabled={!props.attributes.items.length}
          onClick={() => {
            props.setAttributes({
              ...props.attributes,
              tiers:
                !props.attributes.tiers || props.attributes.tiers?.length === 0
                  ? [
                      {
                        to: 0,
                        name: 'Default Tier',
                        // items: props.attributes.items,
                        items: [currentArtselected]
                      },
                    ]
                  : props.attributes.tiers,
            });
            props.confirm();
          }}
          className="art_ctas__cta"
        >
          Next
        </Button>
      </div>
    </>
  );
};

const Congrats = (props: {
  auction?: {
    vault: PublicKey;
    auction: PublicKey;
    auctionManager: PublicKey;
  };
}) => {
  const history = useHistory();

  const newTweetURL = () => {
    const params = {
      text: "I've created a new NFT auction on Metaplex, check it out!",
      url: `${
        window.location.origin
      }/#/auction/${props.auction?.auction.toString()}`,
      hashtags: 'NFT,Crypto,Metaplex',
      // via: "Metaplex",
      related: 'Metaplex,Solana',
    };
    const queryParams = new URLSearchParams(params).toString();
    return `https://twitter.com/intent/tweet?${queryParams}`;
  };

  return (
    <>
      <div
        style={{
          marginTop: 70,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div className="waiting-title1">
          Congratulations! Your auction is now live.
        </div>
        <div className="congrats-button-container">
          <Button
            className="ant-btn ant-btn-primary art_ctas__cta"
            onClick={_ => window.open(newTweetURL(), '_blank')}
          >
            <span>Share it on Twitter</span>
            <span>&gt;</span>
          </Button>
          <Button
            className="ant-btn ant-btn-primary art_ctas__cta"
            onClick={_ =>
              history.push(`/auction/${props.auction?.auction.toString()}`)
            }
          >
            <span>See it in your auctions</span>
            <span>&gt;</span>
          </Button>
        </div>
      </div>
      <Confetti />
    </>
  );
};
