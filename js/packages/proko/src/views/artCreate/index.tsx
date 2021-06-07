import React, { useEffect, useState, useCallback } from 'react';
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
import { ArtCard } from '../../components/ArtCard';
import { UserSearch, UserValue } from '../../components/UserSearch';
import { Confetti } from '../../components/Confetti';
import '../styles.less';
import { mintNFT } from '../../actions';
import ChevronIcon from '../../images/icons/chevron.svg';
import {
  MAX_METADATA_LEN,
  useConnection,
  useWallet,
  IMetadataExtension,
  MetadataCategory,
  useConnectionConfig,
  Creator,
  shortenAddress,
  MetaplexModal,
  MetaplexOverlay,
  Stepper
} from '@oyster/common';
import './index.less';
import { getAssetCostToStore, LAMPORT_MULTIPLIER } from '../../utils/assets';
import { Connection, PublicKey } from '@solana/web3.js';
import { MintLayout } from '@solana/spl-token';
import { useHistory, useParams } from 'react-router-dom';
import { cleanName } from '../../utils/utils';
import { AmountLabel } from '../../components/AmountLabel';
import useWindowDimensions from '../../utils/layout';
import UploadStep from './steps/UploadStep';
import InfoStep from './steps/InfoStep';
import RoyaltiesStep from './steps/RoyaltiesStep';
import Launch from './steps/Launch';
import FishesImages from '../../images/art/fishes.svg';

const { Step } = Steps;
const { Dragger } = Upload;

export const ArtCreateView = () => {
  const connection = useConnection();
  const { env } = useConnectionConfig();
  const { wallet } = useWallet();
  const { step_param }: { step_param: string } = useParams();
  const history = useHistory();
  const { width } = useWindowDimensions();

  const [step, setStep] = useState<number>(0);
  const [stepsVisible, setStepsVisible] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [artConfirmed, confirmArt] = useState<boolean>(false);
  const [artCreated, confirmArtCreated] = useState<boolean>(false);
  const [nft, setNft] =
    useState<{ metadataAccount: PublicKey } | undefined>(undefined);
  const [attributes, setAttributes] = useState<IMetadataExtension>({
    name: '',
    symbol: '',
    description: '',
    external_url: '',
    image: '',
    seller_fee_basis_points: 0,
    creators: [],
    properties: {
      files: [],
      category: MetadataCategory.Image,
    },
  });
  const steps = [{
    href: 'proko_fractionalize/art/create/0',
    text: 'Upload',
    isActive: true
  }, {
    href: 'proko_fractionalize/art/create/1',
    text: 'Info',
    isActive: false
   },
   {
    href: 'proko_fractionalize/art/create/2',
    text: 'Royalties',
    isActive: false
  },
  {
    href: 'proko_fractionalize/art/create/2',
    text: 'Launch',
    isActive: false
  }];
  const uploadStep = <UploadStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoStep(1)}
      />;
  const infoStep = <InfoStep
    attributes={attributes}
    setAttributes={setAttributes}
    confirm={() => gotoStep(2)}
    />;
  const royaltiesStep = <RoyaltiesStep
    attributes={attributes}
    setAttributes={setAttributes}
    confirm={() => gotoStep(3)}/>;
  const launchStep = <Launch
    connection={connection}
    attributes={attributes}
    confirm={() => {
      confirmArt(true);
    }} />
  const stepsContent = [
    {
      title: 'Create a new item · First time creating on CoralReef? Read our creator’s guide.',
      subtitle: null,
      mainEl: uploadStep,
    },
    {
      title: 'Describe your item',
      subtitle: 'Provide a detailed description of your creative process to engage with your audience.',
      mainEl: infoStep,
    },
    {
      title: 'Set royalties and creator splits',
      subtitle: 'Royalties ensure that you continue to get compensated for your work after its initial sale.',
      mainEl: royaltiesStep,
    },
    {
      title: 'Launch your creation',
      subtitle: 'Detailed description of your creative process to engage with your audience.',
      mainEl: launchStep,
    }
  ];

  const gotoStep = useCallback(
    (_step: number) => {
      history.push(`/proko_fractionalize/art/create/${_step.toString()}`);
      if (_step === 0) setStepsVisible(true);
    },
    [history],
  );

  useEffect(() => {
    if (step_param) setStep(parseInt(step_param));
    else gotoStep(0);
  }, [step_param, gotoStep]);

  // store files
  const mint = async () => {
    const fileNames = (attributes?.properties?.files || []).map(f => typeof f === 'string' ? f : f.name);
    const files = (attributes?.properties?.files || []).filter(f => typeof f !== 'string') as File[];
    const metadata = {
      name: attributes.name,
      symbol: attributes.symbol,
      creators: attributes.creators,
      description: attributes.description,
      sellerFeeBasisPoints: attributes.seller_fee_basis_points,
      image:
        fileNames &&
        fileNames?.[0] &&
        fileNames[0],
      external_url: attributes.external_url,
      properties: {
        files: fileNames,
        category: attributes.properties?.category,
      },
    };
    setStepsVisible(false);
    const inte = setInterval(
      () => setProgress(prog => Math.min(prog + 1, 99)),
      600,
    );
    // Update progress inside mintNFT
    const _nft = await mintNFT(
      connection,
      wallet,
      env,
      files,
      metadata,
      attributes.properties?.maxSupply,
    );
    if (_nft) setNft(_nft);
    clearInterval(inte);
  };

  return (
    <div className="create">
      <header className="create_header">
        <h2>{stepsContent[step]['title']}</h2>
        <p className="create_header__subtitle">{stepsContent[step]['subtitle']}</p>
        <div className="create_header__stepper">
          <Stepper
            items={steps}
            step={step}
            prevIcon={<img src={ChevronIcon} alt="" />}
            nextIcon={<img src={ChevronIcon} alt="" />}
            onMoveToPreviousStep={() => gotoStep(step - 1)}
            onMoveToNextStep={() => gotoStep(step + 1)}
            />
        </div>
      </header>
      <section className="create_main">
        {stepsContent[step]['mainEl']}

        {artConfirmed && 
          <WaitingStep
            mint={mint}
            nft={nft}
            progress={progress}
            artCreated={artCreated}
            confirm={() => confirmArtCreated(true)}
            visible={artConfirmed}
          />}
        {/* {step === 1 && (
        )}
        {step === 3 && (
          <RoyaltiesStep
            attributes={attributes}
            confirm={() => gotoStep(4)}
            setAttributes={setAttributes}
          />
        )}
        {step === 4 && (
          <LaunchStep
            attributes={attributes}
            confirm={() => gotoStep(5)}
            connection={connection}
          />
        )}
        {step === 5 && (
          <WaitingStep
            mint={mint}
            progress={progress}
            confirm={() => gotoStep(6)}
          />
        )} */}
      </section>
      <MetaplexOverlay visible={step === 6}>
        <Congrats nft={nft} />
      </MetaplexOverlay>
    </div>
  );
};

// const CategoryStep = 

// const UploadStep = 

// const InfoStep =

// const RoyaltiesStep = 

// const LaunchStep = 
const WaitingStep = (props: {
  mint: Function;
  progress: number;
  confirm: Function;
  artCreated: boolean;
  visible: boolean;
  nft?: {
    metadataAccount: PublicKey;
  };
}) => {
  const [isVisible, toggleVisible] = useState(props.visible || false);
  useEffect(() => {
    const func = async () => {
      await props.mint();
      props.confirm();
    };
    func();
  }, []);

  return (
    <>
      <MetaplexModal className="waiting_step" onCancel={() => toggleVisible(false)} visible={isVisible} width={null}>
      {!props.artCreated &&
      <>
        
        <div className="waiting-title">
          Your creation is being uploaded to the decentralized web...
        </div>
          <Progress trailColor="#23ACDB" strokeColor="#E5226F" type="circle" percent={props.progress} />
        <div className="waiting-subtitle">This can take up to 1 minute.</div>
        </>}
      {props.artCreated &&
        <>
          <header>
            <img src={FishesImages} alt="" />
            <Congrats nft={props.nft} />
          </header>
        </>}
      </MetaplexModal>
    </>
  );
};

const Congrats = (props: {
  nft?: {
    metadataAccount: PublicKey;
  };
}) => {
  const history = useHistory();

  const newTweetURL = () => {
    const params = {
      text: "I've created a new NFT artwork on Metaplex, check it out!",
      url: `${window.location.origin
        }/#/art/${props.nft?.metadataAccount.toString()}`,
      hashtags: 'NFT,Crypto,Metaplex',
      // via: "Metaplex",
      related: 'Metaplex,Solana',
    };
    const queryParams = new URLSearchParams(params).toString();
    return `https://twitter.com/intent/tweet?${queryParams}`;
  };

  return (
    <>
      <div className="waiting-title">
        Congratulations, you created an NFT!
      </div>
      <div className="congrats_ctas">
        <Button
          className="cta"
          onClick={_ => window.open(newTweetURL(), '_blank')}
        >
          <span>Share it on Twitter</span>
          <span>&gt;</span>
        </Button>
        <Button
          className="cta"
          onClick={_ =>
            history.push(`/art/${props.nft?.metadataAccount.toString()}`)
          }
        >
          <span>See it in your collection</span>
          <span>&gt;</span>
        </Button>
        <Button
          className="cta"
          onClick={_ => history.push('/auction/create')}
        >
          <span>Sell it via auction</span>
          <span>&gt;</span>
        </Button>
      </div>
      {/* <Confetti /> */}
    </>
  );
};
