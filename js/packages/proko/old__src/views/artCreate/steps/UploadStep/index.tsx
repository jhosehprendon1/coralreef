import React, { useEffect, useState } from 'react';
import { IMetadataExtension, MetadataCategory } from '@oyster/common';
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
  Form,
} from 'antd';
import useWindowDimensions from '../../../../utils/layout';
import { cleanName } from '../../../../utils/utils';
import ImageLogo from '../../../../images/icons/image_icon.svg';
import AudioLogo from '../../../../images/icons/audio_icon.svg';
import VideoLogo from '../../../../images/icons/video_icon.svg';
import './index.less';

const { Dragger } = Upload;

export default (props: {
  attributes: IMetadataExtension;
  setAttributes: (attr: IMetadataExtension) => void;
  confirm: () => void;
}) => {
  const [mainFile, setMainFile] = useState<any>();
  const [coverFile, setCoverFile] = useState<any>();
  const [image, setImage] = useState<string>('');
  const [imageURL, setImageURL] = useState<string>('');
  const [imageURLErr, setImageURLErr] = useState<string>('');
  const [category, setCategory] = useState<MetadataCategory>(MetadataCategory.Image);
  const disableContinue = (!mainFile && !image) || !!imageURLErr;

  useEffect(() => {
    props.setAttributes({
      ...props.attributes,
      properties: {
        ...props.attributes.properties,
        files: [],
      },
    });
  }, []);

  const uploadMsg = (category: MetadataCategory) => {
    switch (category) {
      case MetadataCategory.Audio:
        return 'Upload your audio creation (MP3, FLAC, WAV)';
      case MetadataCategory.Image:
        return 'Upload your image creation (PNG, JPG, GIF)';
      case MetadataCategory.Video:
        return 'Upload your video creation (MP4, MOV, GLB)';
      case MetadataCategory.VR:
        return 'Upload your AR/VR creation (GLB)';
      default:
        return 'Please go back and choose a category';
    }
  };

  const acceptableFiles = (category: MetadataCategory) => {
    switch (category) {
      case MetadataCategory.Audio:
        return '.mp3,.flac,.wav';
      case MetadataCategory.Image:
        return '.png,.jpg,.gif';
      case MetadataCategory.Video:
        return '.mp4,.mov';
      case MetadataCategory.VR:
        return '.glb';
      default:
        return '';
    }
  };
  // <h3 className="upload__title">Now, let's upload your creation</h3>
  return (
    <div className="upload grid">
      <div className="grid--6_cols grid--4_offset">
        <h3 className="upload__file_type_title">Select the file type</h3>
        <div className="upload__file_type">
          <Button
            className="upload__btn"
            size="large"
            onClick={() => {
              setCategory(MetadataCategory.Image);
            }}
          >
            <div className="upload__btn_card">
              <img src={ImageLogo} alt="" />
              <div className="upload__btn_card_descr">
                <div className="upload__btn_card_name">Image</div>
                <div className="upload__btn_card_type">JPG, PNG, GIF</div>
              </div>
            </div>
          </Button>
          <Button
            className="upload__btn"
            size="large"
            onClick={() => {
              setCategory(MetadataCategory.Video);
            }}
          >
            <div className="upload__btn_card">
              <img src={AudioLogo} alt="" />
              <div className="upload__btn_card_descr">
                <div className="upload__btn_card_name">Video</div>
                <div className="upload__btn_card_type">MP4, MOV</div>
              </div>
            </div>
          </Button>
          <Button
            className="upload__btn"
            size="large"
            onClick={() => {
              setCategory(MetadataCategory.Audio);
            }}
          >
            <div className="upload__btn_card">
              <img src={VideoLogo} alt="" />
              <div className="upload__btn_card_descr">
                <div className="upload__btn_card_name">Audio</div>
                <div className="upload__btn_card_type">MP3, WAV, FLAC</div>
              </div>
            </div>
          </Button>
        </div>
      </div>
      <div className="upload__description grid--6_cols grid--4_offset">
        <h3 className="upload__title">Now, let's upload your creation</h3>
        <p className="upload__descr_text">
          Your file will be uploaded to the decentralized web via Arweave.
          Depending on file type, can take up to 1 minute. Arweave is a new type
          of storage that backs data with sustainable and perpetual endowments,
          allowing users and developers to truly store data forever – for the
          very first time.
        </p>
      </div>
      <div className="grid--6_cols grid--4_offset">
        <h3 className="upload__file_upload_title">{uploadMsg(category)}</h3>
        <div>
          <Dragger
          accept={acceptableFiles(category)}
          style={{ padding: 20, display: 'block', height: 150 }}
          multiple={false}
          customRequest={info => {
            // dont upload files here, handled outside of the control
            info?.onSuccess?.({}, null as any);
          }}
          fileList={mainFile ? [mainFile] : []}
          onChange={async info => {
            const file = info.file.originFileObj;

            // Reset image URL
            setImageURL('');
            setImageURLErr('');

            if (file) setMainFile(file);
            if (
              category !== MetadataCategory.Audio
            ) {
              const reader = new FileReader();
              reader.onload = function (event) {
                setImage((event.target?.result as string) || '');
              };
              if (file) reader.readAsDataURL(file);
            }
          }}
          onRemove={() => {
            setMainFile(null);
            setImage('');
          }}
        >
          <div className="ant-upload-drag-icon">
            <h3 style={{ fontWeight: 700 }}>Upload your creation</h3>
          </div>
          <p className="ant-upload-text">Drag and drop, or click to browse</p>
        </Dragger>
        </div>
      </div>
      <div className="grid--6_cols grid--4_offset">
        {
          category === MetadataCategory.Audio && (
            <div className="content-action">
              <h3 className="upload__file_upload_title">
                Optionally, you can upload a cover image or video (PNG, JPG, GIF,
                MP4)
              </h3>
              <Dragger
                accept=".png,.jpg,.gif,.mp4"
                style={{ padding: 20 }}
                multiple={false}
                customRequest={info => {
                  // dont upload files here, handled outside of the control
                  info?.onSuccess?.({}, null as any);
                }}
                fileList={coverFile ? [coverFile] : []}
                onChange={async info => {
                  const file = info.file.originFileObj;
                  if (file) setCoverFile(file);
                  if (
                    category === MetadataCategory.Audio
                  ) {
                    const reader = new FileReader();
                    reader.onload = function (event) {
                      setImage((event.target?.result as string) || '');
                    };
                    if (file) reader.readAsDataURL(file);
                  }
                }}
              >
                <div className="ant-upload-drag-icon">
                  <h3 style={{ fontWeight: 700 }}>
                    Upload your cover image or video (PNG, JPG, GIF, MP4)
                </h3>
                </div>
                <p className="ant-upload-text">Drag and drop, or click to browse</p>
              </Dragger>
            </div>
          )
        }
      </div>
      <div className="grid--6_cols grid--4_offset upload--final_row">
        <Button
          type="primary"
          size="large"
          disabled={disableContinue}
          onClick={() => {
            props.setAttributes({
              ...props.attributes,
              properties: {
                ...props.attributes.properties,
                files: imageURL
                  ? [imageURL]
                  : [mainFile, coverFile]
                    .filter(f => f)
                    .map(f => new File([f], cleanName(f.name), { type: f.type })),
              },
              image: imageURL || image,
            });
            props.confirm();
          }}
          style={{ marginTop: 24 }}
          className="next_cta"
        >
          Next
        </Button>
      </div>
    </div>
  );
};