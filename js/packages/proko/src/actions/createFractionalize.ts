import {
  createAssociatedTokenAccountInstruction,
  createMint,
  programIds,
  sendTransactionWithRetry,
  WRAPPED_SOL_MINT,
} from '@oyster/common';
import { MintLayout, Token } from '@solana/spl-token';
import { WalletAdapter } from '@solana/wallet-base';
import {
  Connection,
  PublicKey,
  Keypair,
  TransactionInstruction,
} from '@solana/web3.js';
import { listMarket } from '../models';

export const createMintFractionalNFT = async (
  connection: Connection,
  wallet: WalletAdapter | undefined,
  metadata: {
    creatorTokens?: number;
    items?: any[];
    price?: number;
    priceInSolanas?: number;
    reservationPrice?: number;
    saleType?: string;
    serumPercentage?: number;
    serumTokens?: number;
    tokenDescription?: string;
    tokenSymbol?: string;
    tokens?: number;
  },
) => {
  if (!wallet?.publicKey) {
    return;
  }
  // Loaded token program's program id
  const TOKEN_PROGRAM_ID = programIds().token;
  const DEX_PROGRAM_ID = programIds().dex;

  // Allocate memory for the account
  const mintRent = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span,
  );

  const payerPublicKey = wallet.publicKey;
  const instructions: TransactionInstruction[] = [];
  const signers: Keypair[] = [];

  // This is only temporarily owned by wallet...
  const mintKey = createMint(
    instructions,
    wallet.publicKey,
    mintRent,
    0,
    // Some weird bug with phantom where it's public key doesnt mesh with data encode wellff
    payerPublicKey,
    payerPublicKey,
    signers,
  );

  const recipientKey: PublicKey = (
    await PublicKey.findProgramAddress(
      [
        wallet.publicKey.toBuffer(),
        programIds().token.toBuffer(),
        mintKey.toBuffer(),
      ],
      programIds().associatedToken,
    )
  )[0];

  createAssociatedTokenAccountInstruction(
    instructions,
    recipientKey,
    wallet.publicKey,
    wallet.publicKey,
    mintKey,
  );

  instructions.push(
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mintKey,
      recipientKey,
      payerPublicKey,
      [],
      metadata?.tokens || 1,
    ),
  );

  const { txid } = await sendTransactionWithRetry(
    connection,
    wallet,
    instructions,
    signers,
  );

  try {
    await connection.confirmTransaction(txid, 'max');
  } catch {
    // ignore
  }
  await connection.getParsedConfirmedTransaction(txid, 'confirmed');

  console.log('\x1b[33m Transaction ID: %s\x1b[0m', txid);
  console.log('\x1b[33m Mint Account: %s\x1b[0m', mintKey.toString());
  console.log('\x1b[33m Recipient Account: %s\x1b[0m', recipientKey.toString());
  console.log('\x1b[33m Wallet Account: %s\x1b[0m', payerPublicKey.toString());

  const marketPublicKey = await listMarket({
    connection,
    wallet,
    baseMint: mintKey,
    quoteMint: WRAPPED_SOL_MINT,
    baseLotSize: 1,
    quoteLotSize: 0.1,
    dexProgramId: DEX_PROGRAM_ID,
  });

  console.log('\x1b[33m Market: %s\x1b[0m', marketPublicKey.toString());

  return { txid };
};
