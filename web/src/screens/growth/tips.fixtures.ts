// Sample data for Tip-Sheet and Tips-Received (issue #82).
// Sources (AGENTS rule 6): the 3% fee is pitch deck v2, Business model slide: "Tips and rewards · on USDC paid through
// JamJam · 3%"; "Fans tip the post they love, straight to your wallet" is deck slide 06 "Why Solana"; the creator's
// own wallet is ADR-006 (a wallet only for USDC payouts). The post is the Verify page's aDNA post (canvas
// Verify-1-Match). Sample amounts, wallets and receipts are placeholders, so they stay bracketed.
import { adnaLaunchPost, adnaStandardPost } from '../public-next/posts.fixtures';
import type { TipSheetData, TipsReceivedData } from './types';

export const tipFeeRate = 0.03;

export const tipSheet: TipSheetData = {
  posts: [adnaLaunchPost, adnaStandardPost],
  defaultPostId: adnaLaunchPost.id,
  creator: { name: adnaLaunchPost.brand.name, wallet: '[creator wallet address]' },
  feeRate: tipFeeRate,
};

/** The creator has not linked a wallet: tips are off (the empty state). */
export const tipSheetNoWallet: TipSheetData = { ...tipSheet, creator: { ...tipSheet.creator, wallet: null } };

export const tipsReceived: TipsReceivedData = {
  creator: adnaLaunchPost.brand.name,
  feeRate: tipFeeRate,
  tips: [
    { id: 'tip-sample-1', postId: adnaLaunchPost.id, postLabel: adnaLaunchPost.label, from: '[fan wallet]', amount: null, at: null, signature: null },
    { id: 'tip-sample-2', postId: adnaStandardPost.id, postLabel: adnaStandardPost.label, from: '[fan wallet]', amount: null, at: null, signature: null },
  ],
};

export const tipsReceivedEmpty: TipsReceivedData = { ...tipsReceived, tips: [] };
