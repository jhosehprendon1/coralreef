import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layout,
  Row,
  Col,
  Table,
  Switch,
  Spin,
  Modal,
  Button,
  Input,
  Radio,
} from 'antd';
import api from "../../apis/api.js"
import { SearchOutlined } from '@ant-design/icons';
import { useMeta } from '../../contexts';
import { Store, WhitelistedCreator } from '../../models/metaplex';
import {
  MasterEditionV1,
  notify,
  ParsedAccount,
  shortenAddress,
  useConnection,
  useUserAccounts,
  useWallet,
} from '@oyster/common';
import { Connection, PublicKey } from '@solana/web3.js';
import { saveAdmin } from '../../actions/saveAdmin';
import { WalletAdapter } from '@solana/wallet-base';
import { useMemo } from 'react';
import {
  convertMasterEditions,
  filterMetadata,
} from '../../actions/convertMasterEditions';
import { any } from 'prop-types';
import moment from 'moment';

const { Content } = Layout;
const { Search } = Input;
export const AdminView = () => {
  const { store, whitelistedCreatorsByCreator } = useMeta();
  const connection = useConnection();
  const { wallet, connected } = useWallet();
  const [mode, setMode] = useState('NFT')
  const [searchTerm, setSearchTerm] = useState('')
  const [nftList, setNftList] = useState([])

  useEffect(() => {
    api.get('/get-all-nfts', {
      headers: {
        'X-Api-Key': '4P8udxRbQ438cGHE2i0dTLsmQPtsNMN1G4q2UW47'
      }
    }).then((res) => {
      setNftList(res.data.map((el: object) => el.hasOwnProperty("name") ? el : {...el, name: ""}))

      // setNftList(res.data)
    }).catch(e => console.log('ERR', e))
  }, [])

  

  const handleModeChange = (e: any) => {
    const mode = e.target.value;
    setMode(mode);
  };

  return store && connection && wallet && connected ? (
    <>
    <Radio.Group onChange={handleModeChange} value={mode} className="tab-control">
      <Radio.Button value="NFT">NFTs</Radio.Button>
      <Radio.Button value="creators">Creators</Radio.Button>
    </Radio.Group>
    <InnerAdminView
      data={nftList}
      setNftList={setNftList}
      mode={mode}
      store={store}
      whitelistedCreatorsByCreator={whitelistedCreatorsByCreator}
      connection={connection}
      wallet={wallet}
      connected={connected}
    />
    </>
  ) : (
    <Spin />
  );
};

function ArtistModal({
  setUpdatedCreators,
  uniqueCreatorsWithUpdates,
  mode
}: {
  setUpdatedCreators: React.Dispatch<
    React.SetStateAction<Record<string, WhitelistedCreator>>
  >;
  uniqueCreatorsWithUpdates: Record<string, WhitelistedCreator>;
  mode: string
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAddress, setModalAddress] = useState<string>('');

  return (
    <>
      <Modal
        title="Add New Artist Address"
        visible={modalOpen}
        onOk={() => {
          const addressToAdd = modalAddress;
          setModalAddress('');
          setModalOpen(false);

          if (uniqueCreatorsWithUpdates[addressToAdd]) {
            notify({
              message: 'Artist already added!',
              type: 'error',
            });
            return;
          }

          let address: PublicKey;
          try {
            address = new PublicKey(addressToAdd);
            setUpdatedCreators(u => ({
              ...u,
              [modalAddress]: new WhitelistedCreator({
                address,
                activated: true,
              }),
            }));
          } catch {
            notify({
              message: 'Only valid Solana addresses are supported',
              type: 'error',
            });
          }
        }}
        onCancel={() => {
          setModalAddress('');
          setModalOpen(false);
        }}
      >
        <Input
          value={modalAddress}
          onChange={e => setModalAddress(e.target.value)}
        />
      </Modal>
      {mode === 'NFT' ? null : <Button onClick={() => setModalOpen(true)}>Add Creator</Button>}
    </>
  );
}

function InnerAdminView({
  store,
  whitelistedCreatorsByCreator,
  connection,
  wallet,
  connected,
  mode,
  data,
  setNftList
}: {
  store: ParsedAccount<Store>;
  whitelistedCreatorsByCreator: Record<
    string,
    ParsedAccount<WhitelistedCreator>
  >;
  connection: Connection;
  wallet: WalletAdapter;
  connected: boolean;
  mode: string;
  data: Array<object>;
  setNftList:Function
}) {
  const [newStore, setNewStore] = useState(
    store && store.info && new Store(store.info),
  );
  const [updatedCreators, setUpdatedCreators] = useState<
    Record<string, WhitelistedCreator>
  >({});
  const [filteredMetadata, setFilteredMetadata] = useState<{
    available: ParsedAccount<MasterEditionV1>[];
    unavailable: ParsedAccount<MasterEditionV1>[];
  }>();
  const [loading, setLoading] = useState<boolean>();
  const { metadata, masterEditions } = useMeta();
  const [searchTerm, setSearchTerm] = useState('')

  const { accountByMint } = useUserAccounts();
  useMemo(() => {
    const fn = async () => {
      setFilteredMetadata(
        await filterMetadata(
          connection,
          metadata,
          masterEditions,
          accountByMint,
        ),
      );
    };
    fn();
  }, [connected]);

  if (!store || !newStore) {
    return <p>Store is not defined</p>;
  }

  const uniqueCreators = Object.values(whitelistedCreatorsByCreator).reduce(
    (acc: Record<string, WhitelistedCreator>, e) => {
      acc[e.info.address.toBase58()] = e.info;
      return acc;
    },
    {},
  );

  const filteredNftList = data.filter((el: any) => el.title ? el.title.toLocaleLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 : null)

  const onChangeAction = (record: any) => {
    setLoading(true)
    const newStatus = record.status == 1 ? 0 : 1
    const newTitle = record.name ? record.name : record.title
    const newData = {...record, status: newStatus, title: newTitle, tags: [{name: record.tags[0].name, value: ""}]}
    delete newData['createdAt'];
    delete newData['name'];
    api.post('/put-nft', newData, {
      headers: {
        'X-Api-Key': '4P8udxRbQ438cGHE2i0dTLsmQPtsNMN1G4q2UW47'
      }
    }).then((res: any) => {
      const updatedNftList = data.map((el:any) => el.id === res.data.id ? res.data : el)
      setNftList(updatedNftList)
      setLoading(false)
    }).catch((e) => {
      setLoading(false)
    })
  }

  let uniqueCreatorsWithUpdates: any
  let columns

  if (mode=== 'NFT') {
    columns = [
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
      },
      {
        title: 'Address',
        dataIndex: 'address',
        // render: (val: PublicKey) => <span>{val.toBase58()}</span>,
        key: 'address',
        render: (text: any, record: any) => (
          <Link to={`/art/${text}`} style={{color: 'white'}}>
            {text ? text.substring(0, 10) + '...': ''}
          </Link>
         ),
      },
      {
        title: 'Date created',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: (a: any, b: any) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
        showSorterTooltip:false,
        render: (text: any, record: any) => (
          <p className="single-table-info custom-table-data">
            {text ? moment(text).format('MM/DD/YYYY') : ""}
          </p>
         ),
      },
      {
        title: 'Creator',
        dataIndex: 'creator',
        key: 'creator',
        render: (text: any, record: any) => (
          <p className="single-table-info custom-table-data">
            {text ? text.substring(0, 10) + '...' : ''}
          </p>
         ),
      },
      {
        title: 'State',
        dataIndex: 'status',
        key: 'status',
        render: (text: any, record: any) => (
          <p className={record.status === 1 ? "status-active custom-table-data" : "status-blocked custom-table-data"}>
            {record.status == 1 ? 'Active' : 'Inactive'}
          </p>
         ),
      },
      {
        title: 'Explicit',
        dataIndex: 'isNsfw',
        key: 'isNsfw',
        showSorterTooltip:false,
        sorter: (a: any, b: any) => a.isNsfw - b.isNsfw,
        render: (text: any, record: any) => (
          <p className="single-table-info custom-table-data">
            {record.isNsfw == 1 ? 'Yes' : 'No'}
          </p>
         ),
      },
      {
        title: 'Action',
        key: 'action',
        dataIndex: 'action',
        render: (text: any, record: any) => (
          <button className={record.status == 1 ? "button-status" : "button-status-blocked"} onClick={() => onChangeAction(record)}>
            {record.status == 1 ? "Block" : ""}
          </button>
        ),
      }
    ];
  } else {
    uniqueCreatorsWithUpdates = { ...uniqueCreators, ...updatedCreators };

    columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Address',
        dataIndex: 'address',
        render: (val: PublicKey) => <span>{val.toBase58()}</span>,
        key: 'address',
      },
      {
        title: 'Activated',
        dataIndex: 'activated',
        key: 'activated',
        render: (
          value: boolean,
          record: {
            address: PublicKey;
            activated: boolean;
            name: string;
            key: string;
          },
        ) => (
          <Switch
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            checked={value}
            onChange={val =>
              setUpdatedCreators(u => ({
                ...u,
                [record.key]: new WhitelistedCreator({
                  activated: val,
                  address: record.address,
                }),
              }))
            }
          />
        ),
      },
    ];
  }

  let dataSource:any

  if(mode === 'NFT') {
    dataSource = filteredNftList
  } else {
    dataSource = Object.keys(uniqueCreatorsWithUpdates).map(key => ({
      key,
      address: uniqueCreatorsWithUpdates[key].address,
      activated: uniqueCreatorsWithUpdates[key].activated,
      name:
        uniqueCreatorsWithUpdates[key].name ||
        shortenAddress(
          uniqueCreatorsWithUpdates[key].address.toBase58(),
        ),
      image: uniqueCreatorsWithUpdates[key].image,
    })).filter((el: any) => el.name.toLocaleLowerCase().indexOf(searchTerm.toLowerCase()) !== -1)
  }

  return (
    <>
    <div className="search-block">
      {loading ? <Spin size="default" className="nft-update-spinner"/> : null}
      <SearchOutlined className="input-search-icon"/><input className="input input-search-box" placeholder='Search by Title...' onChange={(e) => setSearchTerm(e.target.value)}/>
    </div>
    <Content>
      <Col style={{ marginTop: 10 }}>
        <Row>
          <Col span={21}>
            <ArtistModal
              mode={mode}
              setUpdatedCreators={setUpdatedCreators}
              uniqueCreatorsWithUpdates={uniqueCreatorsWithUpdates}
            />
            {
            mode === 'NFT' ? null 
            : <Button
              onClick={async () => {
                notify({
                  message: 'Saving...',
                  type: 'info',
                });
                await saveAdmin(
                  connection,
                  wallet,
                  newStore.public,
                  Object.values(updatedCreators),
                );
                notify({
                  message: 'Saved',
                  type: 'success',
                });
              }}
              type="primary"
            >
              Submit
            </Button>
            }
          </Col>
          { mode === 'NFT' ? null 
            : <Col span={3}>
            <Switch
              checkedChildren="Public"
              unCheckedChildren="Whitelist Only"
              checked={newStore.public}
              onChange={val => {
                setNewStore(_ => {
                  const newS = new Store(store.info);
                  newS.public = val;
                  return newS;
                });
              }}
            />
          </Col>
        }
        </Row>
        <Row>
          <Table
            className="artist-whitelist-table"
            columns={columns}
            dataSource={dataSource}
          ></Table>
        </Row>
      </Col>

      {/*
        Feature not enabled YET<>>>>>> @bhgames <3

      <h1>
        You have {filteredMetadata?.available.length} MasterEditionV1s that can
        be converted right now and {filteredMetadata?.unavailable.length} still
        in unfinished auctions that cannot be converted yet.
      </h1>
      <Col>
        <Row>
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await convertMasterEditions(
                connection,
                wallet,
                filteredMetadata?.available || [],
                accountByMint,
              );
              setLoading(false);
            }}
          >
            {loading ? <Spin /> : <span>Convert Eligible Master Editions</span>}
          </Button>
        </Row>
      </Col> */}
    </Content>
    </>
  );
}
