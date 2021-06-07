import React from 'react';
import { Row, Col, Divider, Layout, Tag, Badge } from 'antd';
import { useParams } from 'react-router-dom';
import { useArt } from './../../hooks';

import './index.less';
import { Artist } from '../../types';
import { sampleArtist } from '../home/sampleData';
import { ArtContent } from '../../components/ArtContent';

const { Content } = Layout;

export const ArtView = () => {
  const { id } = useParams<{ id: string }>();
  const art = useArt(id);
  const artist: Artist = sampleArtist;

  return (
    <Content>
      <Col>
        <Row>
          <ArtContent category={art.category} extension={art.image} uri={art.image} className="artwork-image" />
        </Row>
        <Divider />
        <Row
          style={{ margin: '0 30px', textAlign: 'left', fontSize: '1.4rem' }}
        >
          <Col span={24}>
            {art.creators?.find(c => !c.verified) && (
              <>
                <div className="info-header">
                  <Tag color="blue">UNVERIFIED</Tag>
                </div>
                <div style={{ fontSize: 12 }}>
                  <i>
                    This artwork is still missing verification from{' '}
                    {art.creators?.filter(c => !c.verified).length} contributors
                    before it can be considered verified and sellable on the
                    platform.
                  </i>
                </div>
                <br />
              </>
            )}
            <div style={{ fontWeight: 700 }}>{art.title}</div>
            <br />
            <div className="info-header">CREATED BY</div>
            <div className="info-content">
              <img
                src={artist.image}
                className="artist-image"
                alt={art.artist}
              />{' '}
              @{art.artist}
            </div>
            <br />
            <div className="info-header">CREATOR ROYALTIES</div>
            <div className="royalties">
              {((art.seller_fee_basis_points || 0) / 100).toFixed(2)}%
            </div>
            <br />
            <div className="info-header">ABOUT THE CREATION</div>
            <div className="info-content">{art.about}</div>
            <br />
            <div className="info-header">ABOUT THE CREATOR</div>
            <div className="info-content">{artist.about}</div>
          </Col>
        </Row>
      </Col>
    </Content>
  );
};
