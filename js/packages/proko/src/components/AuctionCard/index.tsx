import React, { useEffect, useState } from 'react';
import { Row, Col, Button, InputNumber, Spin } from 'antd';
import { MemoryRouter, Route, Redirect, Link } from 'react-router-dom';

import './index.less';
import { getCountdown } from '../../utils/utils';
import {
  useConnection,
  useUserAccounts,
  contexts,
  MetaplexModal,
  formatAmount,
  formatTokenAmount,
  useMint,
  fromLamports,
  ParsedAccount,
  BidderMetadata,
  Identicon,
  shortenAddress,
} from '@oyster/common';
import {
  AuctionView,
  AuctionViewState,
  useBidsForAuction,
  useUserBalance,
} from '../../hooks';
import { sendPlaceBid } from '../../actions/sendPlaceBid';
import {
  sendRedeemBid,
  eligibleForParticipationPrizeGivenWinningIndex,
} from '../../actions/sendRedeemBid';
import { AmountLabel } from '../AmountLabel';
import { sendCancelBid } from '../../actions/cancelBid';
import BN from 'bn.js';
import { MintInfo } from '@solana/spl-token';

const { useWallet } = contexts.Wallet;

const AuctionNumbers = (props: { auctionView: AuctionView }) => {
  const { auctionView } = props;
  const bids = useBidsForAuction(auctionView.auction.pubkey);
  const mintInfo = useMint(auctionView.auction.info.tokenMint);

  const participationFixedPrice =
    auctionView.auctionManager.info.settings.participationConfig?.fixedPrice ||
    0;
  const isUpcoming = auctionView.state === AuctionViewState.Upcoming;
  const isStarted = auctionView.state === AuctionViewState.Live;

  return (
    <div style={{ minWidth: 350 }}>
      <Row>
        <Col span={12}>
          {(isUpcoming || bids.length == 0) && (
            <AmountLabel
              style={{ marginBottom: 10 }}
              containerStyle={{ flexDirection: 'column' }}
              title="Starting bid"
              amount={fromLamports(participationFixedPrice, mintInfo)}
            />
          )}
          {isStarted && bids.length > 0 && (
            <AmountLabel
              style={{ marginBottom: 10 }}
              containerStyle={{ flexDirection: 'column' }}
              title="Highest bid"
              amount={formatTokenAmount(bids[0].info.lastBid, mintInfo)}
            />
          )}
        </Col>

        <Col span={12}>
          <Countdown slot={auctionView.auction.info.endedAt?.toNumber() || 0} />
        </Col>
      </Row>
    </div>
  );
};

const Countdown = ({ slot }: { slot: number }) => {
  const [days, setDays] = useState<number>(99);
  const [hours, setHours] = useState<number>(23);
  const [minutes, setMinutes] = useState<number>(59);
  const [seconds, setSeconds] = useState<number>(59);

  useEffect(() => {
    const calc = () => {
      const { days, hours, minutes, seconds } = getCountdown(slot);

      setDays(Math.min(days, 99));
      setHours(hours);
      setMinutes(minutes);
      setSeconds(seconds);
    };

    const interval = setInterval(() => {
      calc();
    }, 1000);

    calc();
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div style={{ width: '100%' }}>
        <>
          <div
            className="info-header"
            style={{
              margin: '12px 0',
              fontSize: 18,
            }}
          >
            Time left
          </div>
          {days === 0 && hours === 0 && minutes === 0 && seconds === 0 ? (
            <Row style={{ width: '100%' }}>
              <div className="cd-number">ENDED</div>
            </Row>
          ) : (
            <Row style={{ width: '100%' }}>
              {days > 0 && (
                <Col span={8}>
                  <div className="cd-number">{days}</div>
                  <div className="cd-label">days</div>
                </Col>
              )}
              <Col span={8}>
                <div className="cd-number">{hours}</div>
                <div className="cd-label">hour</div>
              </Col>
              <Col span={8}>
                <div className="cd-number">{minutes}</div>
                <div className="cd-label">mins</div>
              </Col>
              {!days && (
                <Col span={8}>
                  <div className="cd-number">{seconds}</div>
                  <div className="cd-label">secs</div>
                </Col>
              )}
            </Row>
          )}
        </>
      </div>
    </>
  );
};

export const AuctionCard = ({ auctionView }: { auctionView: AuctionView }) => {
  const connection = useConnection();
  const { wallet, connected, connect } = useWallet();
  const mintInfo = useMint(auctionView.auction.info.tokenMint);

  const [value, setValue] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [showBidModal, setShowBidModal] = useState<boolean>(false);
  const [lastBid, setLastBid] = useState<{ amount: BN } | undefined>(undefined);
  const [modalHistory, setModalHistory] = useState<any>();

  const { accountByMint } = useUserAccounts();

  const mintKey = auctionView.auction.info.tokenMint;
  const balance = useUserBalance(mintKey);

  const myPayingAccount = balance.accounts[0];
  let winnerIndex = null;
  if (auctionView.myBidderPot?.pubkey)
    winnerIndex = auctionView.auction.info.bidState.getWinnerIndex(
      auctionView.myBidderPot?.info.bidderAct,
    );

  const eligibleForOpenEdition = eligibleForParticipationPrizeGivenWinningIndex(
    winnerIndex,
    auctionView,
  );

  const eligibleForAnything = winnerIndex !== null || eligibleForOpenEdition;
  const gapTime = (auctionView.auction.info.auctionGap?.toNumber() || 0) / 60;

  return (
    <div className="auction-container">
      <Col>
        <AuctionNumbers auctionView={auctionView} />
        <br />

        {connected && auctionView.state === AuctionViewState.Ended && (
          <Button
            type="primary"
            size="large"
            className="action-btn"
            disabled={!auctionView.myBidderMetadata || loading}
            onClick={async () => {
              setLoading(true);
              if (eligibleForAnything)
                await sendRedeemBid(
                  connection,
                  wallet,
                  auctionView,
                  accountByMint,
                );
              else
                await sendCancelBid(
                  connection,
                  wallet,
                  auctionView,
                  accountByMint,
                );
              setLoading(false);
            }}
            style={{ marginTop: 20 }}
          >
            {loading ? (
              <Spin />
            ) : eligibleForAnything ? (
              'Redeem bid'
            ) : (
              'Refund bid'
            )}
          </Button>
        )}

        {connected && auctionView.state !== AuctionViewState.Ended && (
          <Button
            type="primary"
            size="large"
            className="action-btn"
            disabled={loading}
            onClick={() => setShowBidModal(true)}
            style={{ marginTop: 20 }}
          >
            {loading ? <Spin /> : 'Place bid'}
          </Button>
        )}

        {!connected && (
          <Button
            type="primary"
            size="large"
            className="action-btn"
            onClick={connect}
            style={{ marginTop: 20 }}
          >
            Connect wallet to place bid
          </Button>
        )}
      </Col>

      <MetaplexModal
        visible={showBidModal}
        onCancel={() => setShowBidModal(false)}
        bodyStyle={{
          alignItems: 'start',
        }}
        afterClose={() => modalHistory.replace('/placebid')}
      >
        <MemoryRouter>
          <Redirect to="/placebid" />

          <Route
            exact
            path="/placebid"
            render={({ history }) => {
              setModalHistory(history);
              const placeBid = async () => {
                setLoading(true);
                if (myPayingAccount && value) {
                  const bid = await sendPlaceBid(
                    connection,
                    wallet,
                    myPayingAccount.pubkey,
                    auctionView,
                    value,
                  );
                  await setLastBid(bid);
                  history.replace('/congrats');
                  setLoading(false);
                }
              };

              return (
                <>
                  <h2 className="modal-title">Place a bid</h2>
                  {gapTime && (
                    <div
                      className="info-content"
                      style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.9rem',
                      }}
                    >
                      Bids placed in the last {gapTime} minutes will extend
                      bidding for another {gapTime} minutes.
                    </div>
                  )}
                  <br />
                  <AuctionNumbers auctionView={auctionView} />

                  <br />

                  <div
                    style={{
                      width: '100%',
                      background: '#242424',
                      borderRadius: 14,
                      color: 'rgba(0, 0, 0, 0.5);',
                    }}
                  >
                    <InputNumber
                      autoFocus
                      className="input"
                      value={value}
                      style={{
                        width: '100%',
                        background: '#393939',
                        borderRadius: 16,
                      }}
                      onChange={setValue}
                      formatter={value =>
                        value
                          ? `◎ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : ''
                      }
                      placeholder="Amount in SOL"
                    />
                    <div
                      style={{
                        display: 'inline-block',
                        margin: '5px 20px',
                        fontWeight: 700,
                      }}
                    >
                      ◎ {formatAmount(balance.balance, 2)}{' '}
                      <span style={{ color: '#717171' }}>available</span>
                    </div>
                    <Link
                      to="/addfunds"
                      style={{
                        float: 'right',
                        margin: '5px 20px',
                        color: '#5870EE',
                      }}
                    >
                      Add funds
                    </Link>
                  </div>

                  <br />
                  <Button
                    type="primary"
                    size="large"
                    className="action-btn"
                    onClick={placeBid}
                    disabled={
                      !myPayingAccount || value === undefined || loading
                    }
                  >
                    {loading ? <Spin /> : 'Place bid'}
                  </Button>
                </>
              );
            }}
          />

          <Route exact path="/congrats">
            <div style={{ maxWidth: "100%" }}>
              <h2>Congratulations!</h2>
              <p style={{ color: "white" }}>Your bid has been placed</p>
              <br />
              {lastBid && (
                <AmountLabel
                  amount={formatTokenAmount(lastBid.amount, mintInfo)}
                  style={{ marginBottom: 'unset' }}
                />
              )}
              <br />
              <Button
                className="metaplex-button"
                onClick={() => setShowBidModal(false)}
              >
                <span>Continue</span>
                <span>&gt;</span>
              </Button>
            </div>
          </Route>

          <Route exact path="/addfunds">
            <div style={{ maxWidth: "100%" }}>
              <h2>Add funds</h2>
              <p style={{ color: "white" }}>We partner with <b>FTX</b> to make it simple to start purchasing digital collectibles.</p>
              <InputNumber
                autoFocus
                className="input"
                value={value}
                style={{
                  width: '100%',
                  background: "#393939",
                  borderRadius: 16,
                  marginBottom: 10,
                }}
                onChange={setValue}
                formatter={value =>
                  value ? `◎ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''
                }
                placeholder="Amount in SOL"
              />
              <p>If you have not used FTX Pay before, it may take a few moments to get set up.</p>
              <Button
                onClick={() => setShowBidModal(false)}
                style={{
                  background: '#454545',
                  borderRadius: 14,
                  width: '30%',
                  padding: 10,
                  height: 'auto',
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  window.open(
                    `https://ftx.com/pay/request?coin=SOL&address=${wallet?.publicKey?.toBase58()}&tag=&wallet=sol&memoIsRequired=false`,
                    '_blank',
                    'resizable,width=680,height=860',
                  );
                }}
                style={{
                  background: 'black',
                  borderRadius: 14,
                  width: '68%',
                  marginLeft: '2%',
                  padding: 10,
                  height: 'auto',
                  borderColor: 'black',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    placeContent: 'center',
                    justifyContent: 'center',
                    alignContent: 'center',
                    alignItems: 'center',
                    fontSize: 16,
                  }}
                >
                  <span style={{ marginRight: 5 }}>Sign with</span>
                  <img src="/ftxpay.png" width="80" />
                </div>
              </Button>
            </div>
          </Route>
        </MemoryRouter>
      </MetaplexModal>
    </div>
  );
};

// <AuctionBids bids={bids} mint={mintInfo} />
export const AuctionBids = ({
  mint,
  bids,
}: {
  mint?: MintInfo;
  bids: ParsedAccount<BidderMetadata>[];
}) => {
  return (
    <Col style={{ width: '100%' }}>
      {bids.map((bid, index) => {
        const bidder = bid.info.bidderPubkey.toBase58();
        return (
          <Row key={index}>
            <Col span={1}>{index + 1}.</Col>
            <Col span={17}>
              <Row>
                <Identicon
                  style={{
                    width: 24,
                    height: 24,
                    marginRight: 10,
                    marginTop: 2,
                  }}
                  address={bidder}
                />{' '}
                {shortenAddress(bidder)}
              </Row>
            </Col>
            <Col span={5} style={{ textAlign: 'right' }}>
              ◎{formatTokenAmount(bid.info.lastBid, mint)}
            </Col>
          </Row>
        );
      })}
    </Col>
  );
};
