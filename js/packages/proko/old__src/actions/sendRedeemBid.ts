import {
  Keypair,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  actions,
  ParsedAccount,
  programIds,
  models,
  TokenAccount,
  createMint,
  mintNewEditionFromMasterEditionViaToken,
  SafetyDepositBox,
  SequenceType,
  sendTransactions,
  cache,
  ensureWrappedAccount,
  sendTransactionWithRetry,
  updatePrimarySaleHappenedViaToken,
  getMetadata,
  getReservationList,
} from '@oyster/common';

import { AccountLayout, MintLayout, Token } from '@solana/spl-token';
import { AuctionView, AuctionViewItem } from '../hooks';
import {
  WinningConfigType,
  NonWinningConstraint,
  redeemBid,
  redeemFullRightsTransferBid,
  redeemParticipationBid,
  WinningConfig,
  WinningConstraint,
  WinningConfigItem,
} from '../models/metaplex';
import { claimBid } from '../models/metaplex/claimBid';
import { setupCancelBid } from './cancelBid';
const { createTokenAccount } = actions;
const { approve } = models;

export function eligibleForParticipationPrizeGivenWinningIndex(
  winnerIndex: number | null,
  auctionView: AuctionView,
) {
  return (
    (winnerIndex === null &&
      auctionView.auctionManager.info.settings.participationConfig
        ?.nonWinningConstraint !== NonWinningConstraint.NoParticipationPrize) ||
    (winnerIndex !== null &&
      auctionView.auctionManager.info.settings.participationConfig
        ?.winnerConstraint !== WinningConstraint.NoParticipationPrize)
  );
}

export async function sendRedeemBid(
  connection: Connection,
  wallet: any,
  auctionView: AuctionView,
  accountsByMint: Map<string, TokenAccount>,
) {
  let signers: Array<Keypair[]> = [];
  let instructions: Array<TransactionInstruction[]> = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  const mintRentExempt = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span,
  );

  let winnerIndex = null;
  if (auctionView.myBidderPot?.pubkey)
    winnerIndex = auctionView.auction.info.bidState.getWinnerIndex(
      auctionView.myBidderPot?.info.bidderAct,
    );
  console.log('Winner index', winnerIndex);

  if (winnerIndex !== null) {
    const winningConfig =
      auctionView.auctionManager.info.settings.winningConfigs[winnerIndex];
    const winningSet = auctionView.items[winnerIndex];

    if (
      (auctionView.myBidRedemption?.info.itemsRedeemed || 0) <
      winningConfig.items.length
    ) {
      for (
        let i = auctionView.myBidRedemption?.info.itemsRedeemed || 0;
        i < winningSet.length;
        i++
      ) {
        const item = winningSet[i];
        const safetyDeposit = item.safetyDeposit;
        // In principle it is possible to have two winning config items of same safety deposit box
        // so we cover for that possibility by doing an array not a find
        const winningConfigItems = winningConfig.items.filter(
          i => i.safetyDepositBoxIndex == safetyDeposit.info.order,
        );
        for (let j = 0; j < winningConfigItems.length; j++) {
          const winningConfigItem = winningConfigItems[j];
          switch (winningConfigItem.winningConfigType) {
            case WinningConfigType.Printing:
              console.log('Redeeming printing');
              await setupRedeemPrintingInstructions(
                auctionView,
                accountsByMint,
                accountRentExempt,
                mintRentExempt,
                wallet,
                safetyDeposit,
                item,
                signers,
                instructions,
                i,
                winningConfigItem,
              );
              break;
            case WinningConfigType.FullRightsTransfer:
              console.log('Redeeming Full Rights');
              await setupRedeemFullRightsTransferInstructions(
                auctionView,
                accountsByMint,
                accountRentExempt,
                wallet,
                safetyDeposit,
                item,
                signers,
                instructions,
              );
              break;
            case WinningConfigType.TokenOnlyTransfer:
              console.log('Redeeming Token only');
              await setupRedeemInstructions(
                auctionView,
                accountsByMint,
                accountRentExempt,
                wallet,
                safetyDeposit,
                signers,
                instructions,
              );
              break;
          }
        }
      }
    }

    if (auctionView.myBidderMetadata && auctionView.myBidderPot) {
      let claimSigners: Keypair[] = [];
      let claimInstructions: TransactionInstruction[] = [];
      instructions.push(claimInstructions);
      signers.push(claimSigners);
      console.log('Claimed');
      await claimBid(
        auctionView.auctionManager.info.acceptPayment,
        auctionView.myBidderMetadata.info.bidderPubkey,
        auctionView.myBidderPot?.info.bidderPot,
        auctionView.vault.pubkey,
        auctionView.auction.info.tokenMint,
        claimInstructions,
      );
    }
  } else {
    // If you didnt win, you must have a bid we can refund before we check for open editions.
    await setupCancelBid(
      auctionView,
      accountsByMint,
      accountRentExempt,
      wallet,
      signers,
      instructions,
    );
  }

  if (
    auctionView.participationItem &&
    eligibleForParticipationPrizeGivenWinningIndex(winnerIndex, auctionView)
  ) {
    const item = auctionView.participationItem;
    const safetyDeposit = item.safetyDeposit;
    await setupRedeemParticipationInstructions(
      auctionView,
      accountsByMint,
      accountRentExempt,
      mintRentExempt,
      wallet,
      safetyDeposit,
      item,
      signers,
      instructions,
    );
  }

  instructions.length === 1
    ? await sendTransactionWithRetry(
        connection,
        wallet,
        instructions[0],
        signers[0],
        'single',
      )
    : await sendTransactions(
        connection,
        wallet,
        instructions,
        signers,
        SequenceType.StopOnFailure,
        'single',
      );
}

async function setupRedeemInstructions(
  auctionView: AuctionView,
  accountsByMint: Map<string, TokenAccount>,
  accountRentExempt: number,
  wallet: any,
  safetyDeposit: ParsedAccount<SafetyDepositBox>,
  signers: Array<Keypair[]>,
  instructions: Array<TransactionInstruction[]>,
) {
  let winningPrizeSigner: Keypair[] = [];
  let winningPrizeInstructions: TransactionInstruction[] = [];

  signers.push(winningPrizeSigner);
  instructions.push(winningPrizeInstructions);
  if (auctionView.myBidderMetadata) {
    let newTokenAccount = accountsByMint.get(
      safetyDeposit.info.tokenMint.toBase58(),
    )?.pubkey;
    if (!newTokenAccount)
      newTokenAccount = createTokenAccount(
        winningPrizeInstructions,
        wallet.publicKey,
        accountRentExempt,
        safetyDeposit.info.tokenMint,
        wallet.publicKey,
        winningPrizeSigner,
      );

    await redeemBid(
      auctionView.auctionManager.info.vault,
      safetyDeposit.info.store,
      newTokenAccount,
      safetyDeposit.pubkey,
      auctionView.vault.info.fractionMint,
      auctionView.myBidderMetadata.info.bidderPubkey,
      wallet.publicKey,
      undefined,
      undefined,
      false,
      winningPrizeInstructions,
    );

    const metadata = await getMetadata(safetyDeposit.info.tokenMint);
    await updatePrimarySaleHappenedViaToken(
      metadata,
      wallet.publicKey,
      newTokenAccount,
      winningPrizeInstructions,
    );
  }
}

async function setupRedeemFullRightsTransferInstructions(
  auctionView: AuctionView,
  accountsByMint: Map<string, TokenAccount>,
  accountRentExempt: number,
  wallet: any,
  safetyDeposit: ParsedAccount<SafetyDepositBox>,
  item: AuctionViewItem,
  signers: Array<Keypair[]>,
  instructions: Array<TransactionInstruction[]>,
) {
  let winningPrizeSigner: Keypair[] = [];
  let winningPrizeInstructions: TransactionInstruction[] = [];

  signers.push(winningPrizeSigner);
  instructions.push(winningPrizeInstructions);
  if (auctionView.myBidderMetadata) {
    let newTokenAccount = accountsByMint.get(
      safetyDeposit.info.tokenMint.toBase58(),
    )?.pubkey;
    if (!newTokenAccount)
      newTokenAccount = createTokenAccount(
        winningPrizeInstructions,
        wallet.publicKey,
        accountRentExempt,
        safetyDeposit.info.tokenMint,
        wallet.publicKey,
        winningPrizeSigner,
      );

    await redeemFullRightsTransferBid(
      auctionView.auctionManager.info.vault,
      safetyDeposit.info.store,
      newTokenAccount,
      safetyDeposit.pubkey,
      auctionView.vault.info.fractionMint,
      auctionView.myBidderMetadata.info.bidderPubkey,
      wallet.publicKey,
      winningPrizeInstructions,
      item.metadata.pubkey,
      wallet.publicKey,
    );

    const metadata = await getMetadata(safetyDeposit.info.tokenMint);
    await updatePrimarySaleHappenedViaToken(
      metadata,
      wallet.publicKey,
      newTokenAccount,
      winningPrizeInstructions,
    );
  }
}

async function setupRedeemPrintingInstructions(
  auctionView: AuctionView,
  accountsByMint: Map<string, TokenAccount>,
  accountRentExempt: number,
  mintRentExempt: number,
  wallet: any,
  safetyDeposit: ParsedAccount<SafetyDepositBox>,
  item: AuctionViewItem,
  signers: Array<Keypair[]>,
  instructions: Array<TransactionInstruction[]>,
  winningConfigItemIndex: number,
  winningConfigItem: WinningConfigItem,
) {
  const updateAuth = item.metadata.info.updateAuthority;

  if (item.masterEdition && updateAuth && auctionView.myBidderMetadata) {
    let newTokenAccount: PublicKey | undefined = accountsByMint.get(
      item.masterEdition.info.printingMint.toBase58(),
    )?.pubkey;

    // Items redeemed is always off by 1 - ie itemsRedeemed is 0 when
    // the 0th index hasnt been redeemed yet, so subtract by one
    if (
      (auctionView.myBidRedemption?.info.itemsRedeemed || 0) - 1 <
      winningConfigItemIndex
    ) {
      let winningPrizeSigner: Keypair[] = [];
      let winningPrizeInstructions: TransactionInstruction[] = [];

      signers.push(winningPrizeSigner);
      instructions.push(winningPrizeInstructions);
      if (!newTokenAccount)
        // TODO: switch to ATA
        newTokenAccount = createTokenAccount(
          winningPrizeInstructions,
          wallet.publicKey,
          accountRentExempt,
          item.masterEdition.info.printingMint,
          wallet.publicKey,
          winningPrizeSigner,
        );

      const reservationList = await getReservationList(
        item.masterEdition.pubkey,
        auctionView.auctionManager.pubkey,
      );

      await redeemBid(
        auctionView.auctionManager.info.vault,
        safetyDeposit.info.store,
        newTokenAccount,
        safetyDeposit.pubkey,
        auctionView.vault.info.fractionMint,
        auctionView.myBidderMetadata.info.bidderPubkey,
        wallet.publicKey,
        item.masterEdition.pubkey,
        reservationList,
        true,
        winningPrizeInstructions,
      );

      for (let i = 0; i < winningConfigItem.amount; i++) {
        let cashInLimitedPrizeAuthorizationTokenSigner: Keypair[] = [];
        let cashInLimitedPrizeAuthorizationTokenInstruction: TransactionInstruction[] = [];
        signers.push(cashInLimitedPrizeAuthorizationTokenSigner);
        instructions.push(cashInLimitedPrizeAuthorizationTokenInstruction);

        const newLimitedEditionMint = createMint(
          cashInLimitedPrizeAuthorizationTokenInstruction,
          wallet.publicKey,
          mintRentExempt,
          0,
          wallet.publicKey,
          wallet.publicKey,
          cashInLimitedPrizeAuthorizationTokenSigner,
        );
        const newLimitedEdition = createTokenAccount(
          cashInLimitedPrizeAuthorizationTokenInstruction,
          wallet.publicKey,
          accountRentExempt,
          newLimitedEditionMint,
          wallet.publicKey,
          cashInLimitedPrizeAuthorizationTokenSigner,
        );

        cashInLimitedPrizeAuthorizationTokenInstruction.push(
          Token.createMintToInstruction(
            programIds().token,
            newLimitedEditionMint,
            newLimitedEdition,
            wallet.publicKey,
            [],
            1,
          ),
        );

        const burnAuthority = approve(
          cashInLimitedPrizeAuthorizationTokenInstruction,
          [],
          newTokenAccount,
          wallet.publicKey,
          1,
        );

        cashInLimitedPrizeAuthorizationTokenSigner.push(burnAuthority);

        mintNewEditionFromMasterEditionViaToken(
          newLimitedEditionMint,
          item.metadata.info.mint,
          wallet.publicKey,
          item.masterEdition.info.printingMint,
          newTokenAccount,
          burnAuthority.publicKey,
          updateAuth,
          reservationList,
          cashInLimitedPrizeAuthorizationTokenInstruction,
          wallet.publicKey,
        );
      }
    }
  }
}

async function setupRedeemParticipationInstructions(
  auctionView: AuctionView,
  accountsByMint: Map<string, TokenAccount>,
  accountRentExempt: number,
  mintRentExempt: number,
  wallet: any,
  safetyDeposit: ParsedAccount<SafetyDepositBox>,
  item: AuctionViewItem,
  signers: Array<Keypair[]>,
  instructions: Array<TransactionInstruction[]>,
) {
  const updateAuth = item.metadata.info.updateAuthority;
  let tokenAccount = accountsByMint.get(
    auctionView.auction.info.tokenMint.toBase58(),
  );
  const mint = cache.get(auctionView.auction.info.tokenMint);

  if (
    item.masterEdition &&
    updateAuth &&
    auctionView.myBidderMetadata &&
    mint
  ) {
    let newTokenAccount: PublicKey | undefined = accountsByMint.get(
      item.masterEdition.info.printingMint.toBase58(),
    )?.pubkey;

    if (!auctionView.myBidRedemption?.info.participationRedeemed) {
      let winningPrizeSigner: Keypair[] = [];
      let winningPrizeInstructions: TransactionInstruction[] = [];
      let cleanupInstructions: TransactionInstruction[] = [];

      if (!newTokenAccount) {
        // made a separate txn because we're over the txn limit by like 10 bytes.
        let newTokenAccountSigner: Keypair[] = [];
        let newTokenAccountInstructions: TransactionInstruction[] = [];
        signers.push(newTokenAccountSigner);
        instructions.push(newTokenAccountInstructions);
        newTokenAccount = createTokenAccount(
          newTokenAccountInstructions,
          wallet.publicKey,
          accountRentExempt,
          item.masterEdition.info.printingMint,
          wallet.publicKey,
          newTokenAccountSigner,
        );
      }
      signers.push(winningPrizeSigner);

      let price: number = auctionView.auctionManager.info.settings
        .participationConfig?.fixedPrice
        ? auctionView.auctionManager.info.settings.participationConfig?.fixedPrice.toNumber()
        : auctionView.myBidderMetadata.info.lastBid.toNumber() || 0;

      const payingSolAccount = ensureWrappedAccount(
        winningPrizeInstructions,
        cleanupInstructions,
        tokenAccount,
        wallet.publicKey,
        price + accountRentExempt,
        winningPrizeSigner,
      );

      const transferAuthority = approve(
        winningPrizeInstructions,
        cleanupInstructions,
        payingSolAccount,
        wallet.publicKey,
        price,
      );

      winningPrizeSigner.push(transferAuthority);

      await redeemParticipationBid(
        auctionView.auctionManager.info.vault,
        safetyDeposit.info.store,
        newTokenAccount,
        safetyDeposit.pubkey,
        auctionView.vault.info.fractionMint,
        auctionView.myBidderMetadata.info.bidderPubkey,
        wallet.publicKey,
        winningPrizeInstructions,
        item.metadata.info.mint,
        item.masterEdition.info.printingMint,
        transferAuthority.publicKey,
        auctionView.auctionManager.info.acceptPayment,
        payingSolAccount,
      );

      instructions.push([...winningPrizeInstructions, ...cleanupInstructions]);
    }

    if (newTokenAccount) {
      let cashInOpenPrizeAuthorizationTokenSigner: Keypair[] = [];
      let cashInOpenPrizeAuthorizationTokenInstruction: TransactionInstruction[] = [];
      signers.push(cashInOpenPrizeAuthorizationTokenSigner);
      instructions.push(cashInOpenPrizeAuthorizationTokenInstruction);

      const newOpenEditionMint = createMint(
        cashInOpenPrizeAuthorizationTokenInstruction,
        wallet.publicKey,
        mintRentExempt,
        0,
        wallet.publicKey,
        wallet.publicKey,
        cashInOpenPrizeAuthorizationTokenSigner,
      );
      const newOpenEdition = createTokenAccount(
        cashInOpenPrizeAuthorizationTokenInstruction,
        wallet.publicKey,
        accountRentExempt,
        newOpenEditionMint,
        wallet.publicKey,
        cashInOpenPrizeAuthorizationTokenSigner,
      );

      cashInOpenPrizeAuthorizationTokenInstruction.push(
        Token.createMintToInstruction(
          programIds().token,
          newOpenEditionMint,
          newOpenEdition,
          wallet.publicKey,
          [],
          1,
        ),
      );

      const burnAuthority = approve(
        cashInOpenPrizeAuthorizationTokenInstruction,
        [],
        newTokenAccount,
        wallet.publicKey,
        1,
      );

      cashInOpenPrizeAuthorizationTokenSigner.push(burnAuthority);

      await mintNewEditionFromMasterEditionViaToken(
        newOpenEditionMint,
        item.metadata.info.mint,
        wallet.publicKey,
        item.masterEdition.info.printingMint,
        newTokenAccount,
        burnAuthority.publicKey,
        updateAuth,
        undefined,
        cashInOpenPrizeAuthorizationTokenInstruction,
        wallet.publicKey,
      );
    }
  }
}
