import React from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Button } from 'antd';
import { AuctionCard } from '../../components/AuctionCard';
import { useArt, useAuction } from '../../hooks';
import { ArtContent } from '../../components/ArtContent';
import { sampleArtist } from '../home/sampleData';

import "./index.less";
import { useConnectionConfig } from '@oyster/common';

export const AuctionView = () => {
  const { id } = useParams<{ id: string }>();
  const { env } = useConnectionConfig();
  const auction = useAuction(id);
  const art = useArt(auction?.thumbnail.metadata.pubkey);
  const artist = sampleArtist;

  return <>
    <Row justify="space-around">
      <Col span={24} md={12}>
        <ArtContent
          category={art.category}
          uri={art.image}
          extension={art.image}
          className="artwork-image"
        />
      </Col>

      <Col span={24} md={12}>

        <h2 className="art-title">{art.title}</h2>
        <p>{art.about || <div style={{ fontStyle: "italic" }}>No description provided.</div>}</p>

        {auction && <AuctionCard auctionView={auction} />}

        <Row gutter={[50, 0]}>
          <Col>
            <h6>Edition</h6>
            <p>1 of 5</p>
          </Col>

          <Col>
            <h6>Created by</h6>
            <p>{artist.name}</p>
          </Col>

          <Col>
            <h6>View on</h6>
            <div style={{ display: "flex" }}>
              <Button className="tag" onClick={() => window.open(art.uri || '', '_blank')}>Arweave</Button>
              <Button className="tag" onClick={() => window.open(`https://explorer.solana.com/account/${art?.mint ||''}${env.indexOf('main') >= 0 ? '' : `?cluster=${env}`}`, '_blank')}>Solana</Button>
            </div>
          </Col>
        </Row>
      </Col>
    </Row>
  </>

};
