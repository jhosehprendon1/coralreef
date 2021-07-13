import React, { useEffect, useState, useRef } from 'react';
import { ArtCard } from '../../components/ArtCard';
import { Layout, Row, Col, Tabs } from 'antd';
import Masonry from 'react-masonry-css';
import { Link, useHistory } from 'react-router-dom';
import { useUserArts } from '../../hooks';
import { useMeta } from '../../contexts';
import { CardLoader } from '../../components/MyLoader';
import { chain, useWallet } from '@oyster/common';
import './index.less';
import { useRecoilValue } from 'recoil';
import { artProperties } from '../../state';

const { TabPane } = Tabs;

const { Content } = Layout;

export enum ArtworkViewState {
  Metaplex = '0',
  Owned = '1',
  Created = '2',
}

export const ArtworksView = () => {
  const { connected } = useWallet();
  const ownedMetadata = useUserArts();
  const backdropRef = useRef<HTMLDivElement>(null);
  const { metadata, isLoading } = useMeta();
  const [activeKey, setActiveKey] = useState(ArtworkViewState.Metaplex);
  const currentArtProperties = useRecoilValue(artProperties);
  const [transitionArtCoords, updateTransitionArtCoords] = useState({
    style: {
      top: currentArtProperties.detailTop,
      left: currentArtProperties.detailLeft,
      width: `${currentArtProperties.detailWidth}px`,
      height: `${currentArtProperties.detailHeight}px`
    },
    loaded: false
  });
  const [transitionArtModifiers, updateTransitionArtMod] = useState('');
  const [backdropModifier, updateBackdropModifier] = useState('');
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  if (!transitionArtCoords.loaded) {
    let steps = chain();

    steps.step(() => {
      const style = {
        top: currentArtProperties.top,
        left: currentArtProperties.left,
        width: `${currentArtProperties.width}px`,
        height: `${currentArtProperties.height}px`
      };

      updateTransitionArtCoords({
        style,
        loaded: true
      });
      updateBackdropModifier(' backdrop--transparent');
      updateTransitionArtMod(' transition_image--transformed');
    }, '.1s')
    
    if (steps) {
      steps.step(() => {
        updateBackdropModifier(' backdrop--transparent backdrop--hidden');
        updateTransitionArtMod(' transition_image--hidden');
      }, '.6s');
    }
      
  }

  const items =
    activeKey === ArtworkViewState.Metaplex
      ? metadata
      : ownedMetadata.map(m => m.metadata);

  useEffect(() => {
    if(connected) {
      setActiveKey(ArtworkViewState.Owned);
    } else {
      setActiveKey(ArtworkViewState.Metaplex);
    }
  }, [connected, setActiveKey]);

  const artworkGrid = (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="my-masonry-grid"
      columnClassName="my-masonry-grid_column"
    >
      {!isLoading
        ? items.map((m, idx) => {
            const id = m.pubkey.toBase58();
            return (
              <Link to={`/art/${id}`} key={idx}>
                <ArtCard
                  key={id}
                  pubkey={m.pubkey}
                  preview={false}
                  height={250}
                  width={250}
                />
              </Link>
            );
          })
        : [...Array(10)].map((_, idx) => <CardLoader key={idx} />)}
    </Masonry>
  );

  return (
    <Layout style={{ margin: 0, marginTop: 30 }}>
      {currentArtProperties.artId !== ''
        ? <>
            <div className={`backdrop${backdropModifier}`} ref={backdropRef}></div>
            <div style={{
                  position: 'fixed',
                  ...transitionArtCoords.style
                }} className={`transition_image${transitionArtModifiers}`}>
              <img src={currentArtProperties.src} alt="" />
            </div>
          </>
        : null}
        <Content style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Col style={{ width: '100%', marginTop: 10 }}>
            <Row>
              <Tabs
                activeKey={activeKey}
                onTabClick={key => setActiveKey(key as ArtworkViewState)}
              >
                <TabPane
                  tab={<span className="tab-title">All</span>}
                  key={ArtworkViewState.Metaplex}
                >
                  {artworkGrid}
                </TabPane>
                {connected && (
                  <TabPane
                    tab={<span className="tab-title">Owned</span>}
                    key={ArtworkViewState.Owned}
                  >
                    {artworkGrid}
                  </TabPane>
                )}
                {connected && (
                  <TabPane
                    tab={<span className="tab-title">Created</span>}
                    key={ArtworkViewState.Created}
                  >
                    {artworkGrid}
                  </TabPane>
                )}
              </Tabs>
            </Row>
          </Col>
        </Content>
    </Layout>
  );
};
