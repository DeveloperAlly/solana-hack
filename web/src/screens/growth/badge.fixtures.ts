// Sample data for Badge-Embed and Verify-Badge-Landing (issue #82). The posts are the Verify page's registered aDNA
// posts (screens/public-next/posts.fixtures.ts, canvas Verify-1-Match and Verify-3-Edited), so the badge points at the
// same record Verify shows. Source of the badge itself: pitch deck v2, Business model slide (Flywheel): "Verified posts
// carry a check-it badge back to JamJam." The badge image address is not built yet; the screen says so.
import { adnaLaunchPost, adnaStandardPost } from '../public-next/posts.fixtures';
import type { BadgeEmbedData, VerifyBadgeLandingData } from './types';

const posts = [adnaLaunchPost, adnaStandardPost];

export const badgeEmbed: BadgeEmbedData = {
  posts,
  verifyUrl: 'https://jamjam.tech/verify',
  imageUrl: 'https://jamjam.tech/badge',
};

export const badgeEmbedEmpty: BadgeEmbedData = { ...badgeEmbed, posts: [] };

export const verifyBadgeLanding: VerifyBadgeLandingData = {
  posts,
  defaultPostId: adnaLaunchPost.id,
  makeYoursHref: '/',
};

/** The badge's post is not registered (the empty state). */
export const verifyBadgeLandingEmpty: VerifyBadgeLandingData = { ...verifyBadgeLanding, posts: [] };
