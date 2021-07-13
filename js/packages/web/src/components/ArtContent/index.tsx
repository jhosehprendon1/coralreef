import React, { Ref, useCallback, useEffect, useState, useRef } from 'react';
import { Image } from 'antd';
import { MetadataCategory } from '@oyster/common';
import { MeshViewer } from '../MeshViewer';
import { ThreeDots } from '../MyLoader';
import { useCachedImage } from '../../hooks';
import { Stream, StreamPlayerApi } from '@cloudflare/stream-react';
import { useRecoilState } from 'recoil';
import { artProperties } from '../../state';
import { get, push } from '../../utils/cache';
import { LegacyRef } from 'react';

export const ArtContent = ({
  uri,
  artId,
  extension,
  category,
  className,
  preview,
  style,
  files,
  active,
  imgElRef,
  onClickImage,
}: {
  category?: MetadataCategory;
  artId?: string;
  extension?: string;
  uri?: string;
  className?: string;
  preview?: boolean;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  files?: string[];
  ref?: Ref<HTMLDivElement>;
  active?: boolean;
  imgElRef?: Ref<HTMLImageElement> | undefined;
  onClickImage?: Function
}) => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [playerApi, setPlayerApi] = useState<StreamPlayerApi>();
  const src = useCachedImage(uri || '');
  const artRef = useRef<HTMLDivElement>(null);
  const [artDOMProperties, updateArtDetailsState] = useRecoilState(artProperties);

  const playerRef = useCallback(
    ref => {
      setPlayerApi(ref);
    },
    [setPlayerApi],
  );

  useEffect(() => {
    if (playerApi) {
      playerApi.currentTime = 0;
    }
  }, [active, playerApi]);

  if (extension?.endsWith('.glb') || category === 'vr') {
    return <MeshViewer url={uri} className={className} style={style} />;
  }
  const likelyVideo = (files || []).filter((f, index, arr) => {
    // TODO: filter by fileType
    return arr.length >= 2 ? index === 1 : index === 0;
  })[0];

  return category === 'video' ? (
    likelyVideo.startsWith('https://watch.videodelivery.net/') ? (
      <div className={`${className} square`}>
        <Stream
          streamRef={(e: any) => playerRef(e)}
          src={likelyVideo.replace('https://watch.videodelivery.net/', '')}
          loop={true}
          height={600}
          width={600}
          controls={false}
          videoDimensions={{
            videoHeight: 700,
            videoWidth: 400,
          }}
          autoplay={true}
          muted={true}
        />
      </div>
    ) : (
      <video
        className={className}
        playsInline={true}
        autoPlay={false}
        muted={true}
        controls={true}
        controlsList="nodownload"
        style={style}
        loop={true}
        poster={extension}
      >
        <source src={likelyVideo} type="video/mp4" style={style} />
      </video>
    )
  ) : (
    <img
      src={src}
      onLoad={e => {
        setLoaded(true);
      }}
      ref={imgElRef}
      {...(loaded ? {} : { height: 200 })}
    />
  );
};
