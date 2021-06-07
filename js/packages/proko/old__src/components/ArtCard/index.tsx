import React, { useEffect, useMemo, useState } from 'react';
import { Card, Avatar, CardProps, Button, Badge } from 'antd';
import { Creator, MetadataCategory, useConnection } from '@oyster/common';
import { ArtContent } from './../ArtContent';
import './index.less';
import { getCountdown } from '../../utils/utils';
import { useArt } from '../../hooks';
import { PublicKey } from '@solana/web3.js';
import { Art, ArtType } from '../../types';
import { WinningConfigType } from '../../models/metaplex';

const { Meta } = Card;

export interface ArtCardProps extends CardProps {
  pubkey?: PublicKey;
  image?: string;
  file?: string;
  blob?: Blob;
  category?: MetadataCategory;
  name?: string;
  symbol?: string;
  description?: string;
  artist?: string;
  preview?: boolean;
  small?: boolean;
  close?: () => void;
  endAuctionAt?: number;
  onPick?: (event: any, art: Art) => void;
}

export const ArtCard = (props: ArtCardProps) => {
  let {
    className,
    small,
    category,
    image,
    file,
    name,
    preview,
    artist,
    description,
    close,
    pubkey,
    endAuctionAt,
    onPick,
    ...rest
  } = props;
  const art = useArt(pubkey);
  category = art?.category || category;
  image = art?.image || image;
  name = art?.title || name || ' ';
  artist = art?.artist || artist;
  description = art?.about || description;

  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [hasTimer, setHasTimer] = useState(false);

  useEffect(() => {
    const calc = () => {
      if (!endAuctionAt) return;
      const { hours, minutes, seconds } = getCountdown(endAuctionAt);

      setHours(hours);
      setMinutes(minutes);
      setSeconds(seconds);
      setHasTimer(true);
    };

    const interval = setInterval(() => {
      calc();
    }, 1000);

    calc();
    return () => clearInterval(interval);
  }, []);

  let badge = '';
  if (art.type === ArtType.NFT) {
    badge = 'Unique';
  } else if (art.type === ArtType.Master) {
    badge = 'NFT 0';
  } else if (art.type === ArtType.Print) {
    badge = `${art.edition} of ${art.supply}`;
  }

  const card = (
    <Card
      hoverable={true}
      className={`art-card ${small ? 'small' : ''} ${className ?? ''}`}
      onClick={(event) => {
        onPick && onPick(event, art);
      }}
      cover={
        <>
          {close && (
            <Button
              className="card-close-button"
              shape="circle"
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                close && close();
              }}
            >
              X
            </Button>
          )}
          <ArtContent category={category} extension={file} uri={image} preview={preview} />
        </>
      }
      {...rest}
    >
      <Meta
        title={`${name}`}
        description={
          <>
            {/*<Avatar src="img/artist1.jpeg" /> {artist}
             {art.type === ArtType.Master && (
              <>
                <br />
                {!endAuctionAt && (
                  <span style={{ padding: '24px' }}>
                    {(art.maxSupply || 0) - (art.supply || 0)}/
                    {art.maxSupply || 0} prints remaining
                  </span>
                )}
              </>
            )} */}
            
            {description && <div className="art-description">
              {description}
              </div>}
            <div className="edition-badge">{badge}</div>
            {endAuctionAt && hasTimer && (
              <div className="cd-container">
                {hours === 0 && minutes === 0 && seconds === 0 ? (
                  <div className="cd-title">Finished</div>
                ) : (
                  <>
                    <div className="cd-title">Ending in</div>
                    <div className="cd-time">
                      {hours}h {minutes}m {seconds}s
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        }
      />
    </Card>
  );

  return art.creators?.find(c => !c.verified) ? (
    <Badge.Ribbon text="Unverified">{card}</Badge.Ribbon>
  ) : (
    card
  );
};
