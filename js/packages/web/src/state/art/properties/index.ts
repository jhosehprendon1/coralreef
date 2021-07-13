import { atom } from 'recoil';

interface ArtProperties {
  top: number;
  left: number;
  width: number;
  height: number;
  detailTop: number;
  detailLeft: number;
  detailWidth: number;
  detailHeight: number;
  artId: string;
  src: string;
  image?: Element | null;
}

const defaultProperties: ArtProperties = {
  top: 0,
  left: 0,
  width: 0,
  height: 0,
  detailTop: 0,
  detailLeft: 0,
  detailWidth: 0,
  detailHeight: 0,
  artId: '',
  src: '',
  image: null,
};

export default atom({
  key: 'artProperties',
  default: defaultProperties,
});
