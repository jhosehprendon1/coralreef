import {
  Keypair,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  actions,
  Metadata,
  ParsedAccount,
  WinnerLimit,
  MasterEdition,
  SequenceType,
  sendTransactions,
  getSafetyDepositBox,
  Edition,
  getEdition,
  programIds,
  Creator,
} from '@oyster/common';

import { AccountLayout } from '@solana/spl-token';
import BN from 'bn.js';
import {
  AuctionManagerSettings,
  WinningConfigType,
  getAuctionKeys,
  getWhitelistedCreator,
  initAuctionManager,
  startAuction,
  validateSafetyDepositBox,
  WhitelistedCreator,
  WinningConfig,
  WinningConfigItem,
} from '../models/metaplex';
import { createVault } from './createVault';
import { closeVault } from './closeVault';
import {
  addTokensToVault,
  SafetyDepositInstructionConfig,
} from './addTokensToVault';
import { makeAuction } from './makeAuction';
import { createExternalPriceAccount } from './createExternalPriceAccount';
import { validateParticipation } from '../models/metaplex/validateParticipation';
import { createReservationListForTokens } from './createReservationListsForTokens';
const { createTokenAccount } = actions;

interface normalPattern {
  instructions: TransactionInstruction[];
  signers: Keypair[];
}
interface byType {
  addTokens: {
    instructions: Array<TransactionInstruction[]>;
    signers: Array<Keypair[]>;
  };
  createReservationList: {
    instructions: Array<TransactionInstruction[]>;
    signers: Array<Keypair[]>;
  };
  validateBoxes: {
    instructions: Array<TransactionInstruction[]>;
    signers: Array<Keypair[]>;
  };
  createVault: normalPattern;
  closeVault: normalPattern;
  makeAuction: normalPattern;
  initAuctionManager: normalPattern;
  startAuction: normalPattern;
  externalPriceAccount: normalPattern;
  validateParticipation?: normalPattern;
}

export interface SafetyDepositDraft {
  metadata: ParsedAccount<Metadata>;
  masterEdition?: ParsedAccount<MasterEdition>;
  edition?: ParsedAccount<Edition>;
  holding: PublicKey;
  printingMintHolding?: PublicKey;
}

// This is a super command that executes many transactions to create a Vault, Auction, and AuctionManager starting
// from some AuctionManagerSettings.
export async function createAuctionManager(
  connection: Connection,
  wallet: any,
  whitelistedCreatorsByCreator: Record<
    string,
    ParsedAccount<WhitelistedCreator>
  >,
  settings: AuctionManagerSettings,
  winnerLimit: WinnerLimit,
  endAuctionAt: BN,
  auctionGap: BN,
  safetyDepositDrafts: SafetyDepositDraft[],
  participationSafetyDepositDraft: SafetyDepositDraft | undefined,
  paymentMint: PublicKey,
): Promise<{
  vault: PublicKey;
  auction: PublicKey;
  auctionManager: PublicKey;
}> {
  const {
    externalPriceAccount,
    priceMint,
    instructions: epaInstructions,
    signers: epaSigners,
  } = await createExternalPriceAccount(connection, wallet);

  const {
    instructions: createVaultInstructions,
    signers: createVaultSigners,
    vault,
    fractionalMint,
    redeemTreasury,
    fractionTreasury,
  } = await createVault(connection, wallet, priceMint, externalPriceAccount);

  const {
    instructions: makeAuctionInstructions,
    signers: makeAuctionSigners,
    auction,
  } = await makeAuction(
    wallet,
    winnerLimit,
    vault,
    endAuctionAt,
    auctionGap,
    paymentMint,
  );

  let safetyDepositConfigs = buildSafetyDepositArray(
    safetyDepositDrafts,
    participationSafetyDepositDraft,
    settings.winningConfigs,
  );

  const {
    instructions: auctionManagerInstructions,
    signers: auctionManagerSigners,
    auctionManager,
  } = await setupAuctionManagerInstructions(
    connection,
    wallet,
    vault,
    paymentMint,
    settings,
  );

  const {
    instructions: addTokenInstructions,
    signers: addTokenSigners,
    safetyDepositTokenStores,
  } = await addTokensToVault(connection, wallet, vault, safetyDepositConfigs);

  const {
    instructions: createReservationInstructions,
    signers: createReservationSigners,
  } = await createReservationListForTokens(
    wallet,
    auctionManager,
    settings,
    safetyDepositConfigs,
  );

  let lookup: byType = {
    externalPriceAccount: {
      instructions: epaInstructions,
      signers: epaSigners,
    },
    createVault: {
      instructions: createVaultInstructions,
      signers: createVaultSigners,
    },
    closeVault: await closeVault(
      connection,
      wallet,
      vault,
      fractionalMint,
      fractionTreasury,
      redeemTreasury,
      priceMint,
      externalPriceAccount,
    ),
    addTokens: { instructions: addTokenInstructions, signers: addTokenSigners },
    createReservationList: {
      instructions: createReservationInstructions,
      signers: createReservationSigners,
    },
    makeAuction: {
      instructions: makeAuctionInstructions,
      signers: makeAuctionSigners,
    },
    initAuctionManager: {
      instructions: auctionManagerInstructions,
      signers: auctionManagerSigners,
    },
    startAuction: await setupStartAuction(wallet, vault),
    validateParticipation: participationSafetyDepositDraft
      ? await validateParticipationHelper(
          wallet,
          whitelistedCreatorsByCreator,
          vault,
          participationSafetyDepositDraft,
        )
      : undefined,
    validateBoxes: await validateBoxes(
      wallet,
      whitelistedCreatorsByCreator,
      vault,
      // Participation NFTs validate differently, with above
      safetyDepositConfigs.filter(
        c =>
          !participationSafetyDepositDraft ||
          c.draft.metadata.pubkey.toBase58() !==
            participationSafetyDepositDraft.metadata.pubkey.toBase58(),
      ),
      safetyDepositTokenStores,
      settings,
    ),
  };

  let signers: Keypair[][] = [
    lookup.externalPriceAccount.signers,
    lookup.createVault.signers,
    ...lookup.addTokens.signers,
    ...lookup.createReservationList.signers,
    lookup.closeVault.signers,
    lookup.makeAuction.signers,
    lookup.initAuctionManager.signers,
    lookup.validateParticipation?.signers || [],
    ...lookup.validateBoxes.signers,
    lookup.startAuction.signers,
  ];
  const toRemoveSigners: Record<number, boolean> = {};
  let instructions: TransactionInstruction[][] = [
    lookup.externalPriceAccount.instructions,
    lookup.createVault.instructions,
    ...lookup.addTokens.instructions,
    ...lookup.createReservationList.instructions,
    lookup.closeVault.instructions,
    lookup.makeAuction.instructions,
    lookup.initAuctionManager.instructions,
    lookup.validateParticipation?.instructions || [],
    ...lookup.validateBoxes.instructions,
    lookup.startAuction.instructions,
  ].filter((instr, i) => {
    if (instr.length > 0) {
      return true;
    } else {
      toRemoveSigners[i] = true;
      return false;
    }
  });

  const filteredSigners = signers.filter((_, i) => !toRemoveSigners[i]);

  let stopPoint = 0;
  while (stopPoint < instructions.length) {
    stopPoint = await sendTransactions(
      connection,
      wallet,
      instructions,
      filteredSigners,
      SequenceType.StopOnFailure,
      'max',
    );
  }

  return { vault, auction, auctionManager };
}

function buildSafetyDepositArray(
  safetyDeposits: SafetyDepositDraft[],
  participationSafetyDepositDraft: SafetyDepositDraft | undefined,
  winningConfigs: WinningConfig[],
): SafetyDepositInstructionConfig[] {
  let safetyDepositConfig: SafetyDepositInstructionConfig[] = [];
  safetyDeposits.forEach((w, i) => {
    // Configs where we are selling this safety deposit as a master edition or single nft
    let nonPrintingConfigs: WinningConfigItem[] = [];
    let printingConfigs: WinningConfigItem[] = [];

    winningConfigs.forEach(ow => {
      ow.items.forEach(it => {
        if (it.safetyDepositBoxIndex === i) {
          if (it.winningConfigType !== WinningConfigType.Printing)
            nonPrintingConfigs.push(it);
          // we may also have an auction where we are selling prints of the master too as secondary prizes
          else if (it.winningConfigType === WinningConfigType.Printing)
            printingConfigs.push(it);
        }
      });
    });

    const nonPrintingTotal = nonPrintingConfigs
      .map(ow => ow.amount)
      .reduce((sum, acc) => (sum += acc), 0);
    const printingTotal = printingConfigs
      .map(ow => ow.amount)
      .reduce((sum, acc) => (sum += acc), 0);

    if (nonPrintingTotal > 0) {
      safetyDepositConfig.push({
        tokenAccount: w.holding,
        tokenMint: w.metadata.info.mint,
        amount: new BN(nonPrintingTotal),
        draft: w,
      });
    }

    if (
      printingTotal > 0 &&
      w.masterEdition?.info.printingMint &&
      w.printingMintHolding
    ) {
      safetyDepositConfig.push({
        tokenAccount: w.printingMintHolding,
        tokenMint: w.masterEdition?.info.printingMint,
        amount: new BN(printingTotal),
        draft: w,
      });
    }
  });

  if (participationSafetyDepositDraft) {
    safetyDepositConfig.push({
      tokenAccount: participationSafetyDepositDraft.holding,
      tokenMint: participationSafetyDepositDraft.metadata.info.mint,
      amount: new BN(1),
      draft: participationSafetyDepositDraft,
    });
  }

  return safetyDepositConfig;
}

async function setupAuctionManagerInstructions(
  connection: Connection,
  wallet: any,
  vault: PublicKey,
  paymentMint: PublicKey,
  settings: AuctionManagerSettings,
): Promise<{
  instructions: TransactionInstruction[];
  signers: Keypair[];
  auctionManager: PublicKey;
}> {
  let signers: Keypair[] = [];
  let instructions: TransactionInstruction[] = [];
  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  const { auctionManagerKey } = await getAuctionKeys(vault);

  const acceptPayment = createTokenAccount(
    instructions,
    wallet.publicKey,
    accountRentExempt,
    paymentMint,
    auctionManagerKey,
    signers,
  );

  await initAuctionManager(
    vault,
    wallet.publicKey,
    wallet.publicKey,
    acceptPayment,
    programIds().store,
    settings,
    instructions,
  );

  return { instructions, signers, auctionManager: auctionManagerKey };
}

async function setupStartAuction(
  wallet: any,
  vault: PublicKey,
): Promise<{
  instructions: TransactionInstruction[];
  signers: Keypair[];
}> {
  let signers: Keypair[] = [];
  let instructions: TransactionInstruction[] = [];

  await startAuction(vault, wallet.publicKey, instructions);

  return { instructions, signers };
}

async function validateParticipationHelper(
  wallet: any,
  whitelistedCreatorsByCreator: Record<
    string,
    ParsedAccount<WhitelistedCreator>
  >,
  vault: PublicKey,
  participationSafetyDepositDraft: SafetyDepositDraft,
): Promise<{ instructions: TransactionInstruction[]; signers: Keypair[] }> {
  let instructions: TransactionInstruction[] = [];
  const whitelistedCreator = participationSafetyDepositDraft.metadata.info.data
    .creators
    ? await findValidWhitelistedCreator(
        whitelistedCreatorsByCreator,
        //@ts-ignore
        participationSafetyDepositDraft.metadata.info.data.creators,
      )
    : undefined;
  if (participationSafetyDepositDraft.masterEdition)
    await validateParticipation(
      vault,
      participationSafetyDepositDraft.metadata.pubkey,
      wallet.publicKey,
      participationSafetyDepositDraft.masterEdition?.pubkey,
      participationSafetyDepositDraft.metadata.info.mint,
      participationSafetyDepositDraft.masterEdition?.info.printingMint,
      wallet.publicKey,
      wallet.publicKey,
      programIds().store,
      whitelistedCreator,
      instructions,
    );

  return { instructions, signers: [] };
}

async function findValidWhitelistedCreator(
  whitelistedCreatorsByCreator: Record<
    string,
    ParsedAccount<WhitelistedCreator>
  >,
  creators: Creator[],
): Promise<PublicKey> {
  for (let i = 0; i < creators.length; i++) {
    const creator = creators[i];

    if (
      whitelistedCreatorsByCreator[creator.address.toBase58()]?.info.activated
    )
      return whitelistedCreatorsByCreator[creator.address.toBase58()].pubkey;
  }
  return await getWhitelistedCreator(creators[0]?.address);
}

async function validateBoxes(
  wallet: any,
  whitelistedCreatorsByCreator: Record<
    string,
    ParsedAccount<WhitelistedCreator>
  >,
  vault: PublicKey,
  safetyDeposits: SafetyDepositInstructionConfig[],
  safetyDepositTokenStores: PublicKey[],
  settings: AuctionManagerSettings,
): Promise<{
  instructions: TransactionInstruction[][];
  signers: Keypair[][];
}> {
  let signers: Keypair[][] = [];
  let instructions: TransactionInstruction[][] = [];

  for (let i = 0; i < safetyDeposits.length; i++) {
    let tokenSigners: Keypair[] = [];
    let tokenInstructions: TransactionInstruction[] = [];

    let safetyDepositBox: PublicKey;

    const flattenedItems = settings.winningConfigs.map(ow => ow.items).flat();
    // Any item will do - we just need the config type. They should all be identical for a given
    // safety deposit box.
    const winningConfigItem = flattenedItems.find(
      ow => ow.safetyDepositBoxIndex === i,
    );

    if (winningConfigItem) {
      if (
        winningConfigItem.winningConfigType === WinningConfigType.Printing &&
        safetyDeposits[i].draft.masterEdition &&
        safetyDeposits[i].draft.masterEdition?.info.printingMint
      )
        safetyDepositBox = await getSafetyDepositBox(
          vault,
          //@ts-ignore
          safetyDeposits[i].draft.masterEdition.info.printingMint,
        );
      else
        safetyDepositBox = await getSafetyDepositBox(
          vault,
          safetyDeposits[i].draft.metadata.info.mint,
        );
      const edition: PublicKey = await getEdition(
        safetyDeposits[i].draft.metadata.info.mint,
      );

      const whitelistedCreator = safetyDeposits[i].draft.metadata.info.data
        .creators
        ? await findValidWhitelistedCreator(
            whitelistedCreatorsByCreator,
            //@ts-ignore
            safetyDeposits[i].draft.metadata.info.data.creators,
          )
        : undefined;

      await validateSafetyDepositBox(
        vault,
        safetyDeposits[i].draft.metadata.pubkey,
        safetyDepositBox,
        safetyDepositTokenStores[i],
        //@ts-ignore
        winningConfigItem.winningConfigType === WinningConfigType.Printing
          ? safetyDeposits[i].draft.masterEdition?.info.printingMint
          : safetyDeposits[i].draft.metadata.info.mint,
        wallet.publicKey,
        wallet.publicKey,
        wallet.publicKey,
        tokenInstructions,
        edition,
        whitelistedCreator,
        programIds().store,
        safetyDeposits[i].draft.masterEdition?.info.printingMint,
        safetyDeposits[i].draft.masterEdition ? wallet.publicKey : undefined,
      );
    }
    signers.push(tokenSigners);
    instructions.push(tokenInstructions);
  }
  return { instructions, signers };
}
