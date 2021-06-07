import {
  contexts,
  notify,
  ParsedAccountBase,
  sendTransactionWithRetry,
  sleep,
} from '@oyster/common';
import {
  DexInstructions,
  Market,
  MARKETS,
  Orderbook,
  parseInstructionErrorResponse,
  TokenInstructions,
} from '@project-serum/serum';
import {
  Account,
  AccountInfo,
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js';
import BN from 'bn.js';
import { Buffer } from 'buffer';

const { MintParser, cache } = contexts.Accounts;

export const OrderBookParser = (id: PublicKey, acc: AccountInfo<Buffer>) => {
  const decoded = Orderbook.LAYOUT.decode(acc.data);

  const details = {
    pubkey: id,
    account: {
      ...acc,
    },
    info: decoded,
  } as ParsedAccountBase;

  return details;
};

const DEFAULT_DEX_ID = new PublicKey(
  'EUqojwWA2rd19FZrzeBncJsm38Jm1hEhE3zsmX3bRc2o',
);

export const DexMarketParser = (
  pubkey: PublicKey,
  acc: AccountInfo<Buffer>,
) => {
  const market = MARKETS.find(m => m.address.equals(pubkey));
  const decoded = Market.getLayout(market?.programId || DEFAULT_DEX_ID).decode(
    acc.data,
  );

  const details = {
    pubkey,
    account: {
      ...acc,
    },
    info: decoded,
  } as ParsedAccountBase;

  cache.registerParser(details.info.baseMint, MintParser);
  cache.registerParser(details.info.quoteMint, MintParser);
  cache.registerParser(details.info.bids, OrderBookParser);
  cache.registerParser(details.info.asks, OrderBookParser);

  return details;
};

export async function listMarket({
  connection,
  wallet,
  baseMint,
  quoteMint,
  baseLotSize,
  quoteLotSize,
  dexProgramId,
}: {
  connection: Connection;
  wallet: any;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseLotSize: number;
  quoteLotSize: number;
  dexProgramId: PublicKey;
}): Promise<PublicKey> {
  const market = Keypair.generate();
  const requestQueue = Keypair.generate();
  const eventQueue = Keypair.generate();
  const bids = Keypair.generate();
  const asks = Keypair.generate();
  const baseVault = Keypair.generate();
  const quoteVault = Keypair.generate();
  const feeRateBps = 0;
  const quoteDustThreshold = new BN(100);

  console.log('Public Key 1:', market.publicKey.toString());

  async function getVaultOwnerAndNonce() {
    const nonce = new BN(0);
    while (true) {
      try {
        const vaultOwner = await PublicKey.createProgramAddress(
          [market.publicKey.toBuffer(), nonce.toArrayLike(Buffer, 'le', 8)],
          dexProgramId,
        );
        return [vaultOwner, nonce];
      } catch (e) {
        nonce.iaddn(1);
      }
    }
  }
  console.log('Works 0');
  const [vaultOwner, vaultSignerNonce] = await getVaultOwnerAndNonce();

  console.log('Works 1');
  const instructionsTx1: TransactionInstruction[] = [];
  instructionsTx1.push(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: baseVault.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(165),
      space: 165,
      programId: TokenInstructions.TOKEN_PROGRAM_ID,
    }),
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: quoteVault.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(165),
      space: 165,
      programId: TokenInstructions.TOKEN_PROGRAM_ID,
    }),
    TokenInstructions.initializeAccount({
      account: baseVault.publicKey,
      mint: baseMint,
      owner: vaultOwner,
    }),
    TokenInstructions.initializeAccount({
      account: quoteVault.publicKey,
      mint: quoteMint,
      owner: vaultOwner,
    }),
  );
  console.log('Works 2');

  const instructionsTx2: TransactionInstruction[] = [];
  instructionsTx2.push(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: market.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        Market.getLayout(dexProgramId).span,
      ),
      space: Market.getLayout(dexProgramId).span,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: requestQueue.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(5120 + 12),
      space: 5120 + 12,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: eventQueue.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(262144 + 12),
      space: 262144 + 12,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: bids.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(65536 + 12),
      space: 65536 + 12,
      programId: dexProgramId,
    }),
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: asks.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(65536 + 12),
      space: 65536 + 12,
      programId: dexProgramId,
    }),
    DexInstructions.initializeMarket({
      market: market.publicKey,
      requestQueue: requestQueue.publicKey,
      eventQueue: eventQueue.publicKey,
      bids: bids.publicKey,
      asks: asks.publicKey,
      baseVault: baseVault.publicKey,
      quoteVault: quoteVault.publicKey,
      baseMint,
      quoteMint,
      baseLotSize: new BN(baseLotSize),
      quoteLotSize: new BN(quoteLotSize),
      feeRateBps,
      vaultSignerNonce,
      quoteDustThreshold,
      programId: dexProgramId,
    }),
  );

  // console.log('Works 3');
  // const transactionsAndSigners = [
  //     { instructions: instructionsTx1, signers: [baseVault, quoteVault] },
  //     {
  //       instructions: instructionsTx2,
  //       signers: [market, requestQueue, eventQueue, bids, asks],
  //     },
  //   ]
  // }
  // const signedTransactions = await signTransactions();

  // console.log('Works 4');
  // for (let signedTransaction of signedTransactions) {
  //   await sendSignedTransaction({
  //     signedTransaction,
  //     connection,
  //   });
  // }

  console.log('Works 3');
  const { txid: tx1id } = await sendTransactionWithRetry(
    connection,
    wallet,
    instructionsTx1,
    [baseVault, quoteVault],
  );

  try {
    await connection.confirmTransaction(tx1id, 'max');
  } catch {
    // ignore
  }
  await connection.getParsedConfirmedTransaction(tx1id, 'confirmed');

  console.log('Works 4');
  const { txid: tx2id } = await sendTransactionWithRetry(
    connection,
    wallet,
    instructionsTx2,
    [market, requestQueue, eventQueue, bids, asks],
  );

  try {
    await connection.confirmTransaction(tx2id, 'max');
  } catch {
    // ignore
  }
  await connection.getParsedConfirmedTransaction(tx2id, 'confirmed');

  console.log('Works 3');
  // const signers: Array<Keypair[]> = [
  //   [baseVault, quoteVault],
  //   [market, requestQueue, eventQueue, bids, asks],
  // ];

  // console.log('Works 4');
  // await sendTransactions(
  //   connection,
  //   wallet,
  //   [instructionsTx1, instructionsTx2],
  //   signers,
  //   SequenceType.StopOnFailure,
  //   'single',
  // );

  console.log('Works 5');

  console.log('Public Key 2:', market.publicKey.toString());

  return market.publicKey;
}

export const getUnixTs = () => {
  return new Date().getTime() / 1000;
};

const DEFAULT_TIMEOUT = 15000;

export async function signTransactions({
  transactionsAndSigners,
  wallet,
  connection,
}: {
  transactionsAndSigners: {
    transaction: Transaction;
    signers?: Array<Account>;
  }[];
  wallet: any;
  connection: Connection;
}) {
  console.log('Works 3.1');
  const blockhash = (await connection.getRecentBlockhash('max')).blockhash;
  console.log('Works 3.2');
  transactionsAndSigners.forEach(({ transaction, signers = [] }) => {
    transaction.recentBlockhash = blockhash;
    transaction.setSigners(wallet.publicKey, ...signers.map(s => s.publicKey));
    if (signers?.length > 0) {
      transaction.partialSign(...signers);
    }
  });
  console.log('Works 3.3');

  const transactions = transactionsAndSigners.map(
    ({ transaction }) => transaction,
  );

  console.log('Works 3.4', transactions);
  console.log('Wallet', wallet);
  console.log('Wallet provider', wallet.signAllTransactions);
  const result = await wallet.signAllTransactions(transactions);
  console.log('Works 3.5');
  return result;
}

export async function sendSignedTransaction({
  signedTransaction,
  connection,
  sendingMessage = 'Sending transaction...',
  sentMessage = 'Transaction sent',
  successMessage = 'Transaction confirmed',
  timeout = DEFAULT_TIMEOUT,
  sendNotification = true,
}: {
  signedTransaction: Transaction;
  connection: Connection;
  sendingMessage?: string;
  sentMessage?: string;
  successMessage?: string;
  timeout?: number;
  sendNotification?: boolean;
}): Promise<string> {
  const rawTransaction = signedTransaction.serialize();
  const startTime = getUnixTs();
  if (sendNotification) {
    notify({ message: sendingMessage });
  }
  const txid: TransactionSignature = await connection.sendRawTransaction(
    rawTransaction,
    {
      skipPreflight: true,
    },
  );
  if (sendNotification) {
    notify({ message: sentMessage, type: 'success', txid });
  }

  console.log('Started awaiting confirmation for', txid);

  let done = false;
  (async () => {
    while (!done && getUnixTs() - startTime < timeout) {
      connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
      });
      await sleep(300);
    }
  })();
  try {
    await awaitTransactionSignatureConfirmation(txid, timeout, connection);
  } catch (err) {
    if (err.timeout) {
      throw new Error('Timed out awaiting confirmation on transaction');
    }
    let simulateResult: SimulatedTransactionResponse | null = null;
    try {
      simulateResult = (
        await simulateTransaction(connection, signedTransaction, 'single')
      ).value;
    } catch (e) {}
    if (simulateResult && simulateResult.err) {
      if (simulateResult.logs) {
        for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
          const line = simulateResult.logs[i];
          if (line.startsWith('Program log: ')) {
            throw new Error(
              'Transaction failed: ' + line.slice('Program log: '.length),
            );
          }
        }
      }
      let parsedError;
      if (
        typeof simulateResult.err == 'object' &&
        'InstructionError' in simulateResult.err
      ) {
        const parsedErrorInfo = parseInstructionErrorResponse(
          signedTransaction,
          simulateResult.err['InstructionError'],
        );
        parsedError = parsedErrorInfo.error;
      } else {
        parsedError = JSON.stringify(simulateResult.err);
      }
      throw new Error(parsedError);
    }
    throw new Error('Transaction failed');
  } finally {
    done = true;
  }
  if (sendNotification) {
    notify({ message: successMessage, type: 'success', txid });
  }

  console.log('Latency', txid, getUnixTs() - startTime);
  return txid;
}

async function awaitTransactionSignatureConfirmation(
  txid: TransactionSignature,
  timeout: number,
  connection: Connection,
) {
  let done = false;
  const result = await new Promise((resolve, reject) => {
    (async () => {
      setTimeout(() => {
        if (done) {
          return;
        }
        done = true;
        console.log('Timed out for txid', txid);
        reject({ timeout: true });
      }, timeout);
      try {
        connection.onSignature(
          txid,
          result => {
            console.log('WS confirmed', txid, result);
            done = true;
            if (result.err) {
              reject(result.err);
            } else {
              resolve(result);
            }
          },
          'recent',
        );
        console.log('Set up WS connection', txid);
      } catch (e) {
        done = true;
        console.log('WS error in setup', txid, e);
      }
      while (!done) {
        // eslint-disable-next-line no-loop-func
        (async () => {
          try {
            const signatureStatuses = await connection.getSignatureStatuses([
              txid,
            ]);
            const result = signatureStatuses && signatureStatuses.value[0];
            if (!done) {
              if (!result) {
                console.log('REST null result for', txid, result);
              } else if (result.err) {
                console.log('REST error for', txid, result);
                done = true;
                reject(result.err);
              } else if (!result.confirmations) {
                console.log('REST no confirmations for', txid, result);
              } else {
                console.log('REST confirmation for', txid, result);
                done = true;
                resolve(result);
              }
            }
          } catch (e) {
            if (!done) {
              console.log('REST connection error: txid', txid, e);
            }
          }
        })();
        await sleep(300);
      }
    })();
  });
  done = true;
  return result;
}

/** Copy of Connection.simulateTransaction that takes a commitment parameter. */
async function simulateTransaction(
  connection: Connection,
  transaction: Transaction,
  commitment: Commitment,
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
  // @ts-ignore
  transaction.recentBlockhash = await connection._recentBlockhash(
    // @ts-ignore
    connection._disableBlockhashCaching,
  );

  const signData = transaction.serializeMessage();
  // @ts-ignore
  const wireTransaction = transaction._serialize(signData);
  const encodedTransaction = wireTransaction.toString('base64');
  const config: any = { encoding: 'base64', commitment };
  const args = [encodedTransaction, config];

  // @ts-ignore
  const res = await connection._rpcRequest('simulateTransaction', args);
  if (res.error) {
    throw new Error('failed to simulate transaction: ' + res.error.message);
  }
  return res.result;
}
