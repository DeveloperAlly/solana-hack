import type { Post } from '../../../worker/posts';
import type { ClaimMap } from '../../../worker/claims';
import type { FirstPostData, JourneyClaim, JourneyClaimSegment, ProofData } from '../../screens/journey/types';

/** Link only exact spans from this revision's server claim map; never invent text or support. */
export function firstPostView(post: Post, map: ClaimMap | null): FirstPostData {
  const current = map?.rev === post.rev ? map : null;
  const claims: JourneyClaim[] = [];
  const segments: JourneyClaimSegment[] = [];
  let cursor = 0;
  for (const [i, item] of (current?.items || []).entries()) {
    if (item.kind !== 'factual' || item.status === 'not_required') continue;
    const start = post.body.indexOf(item.text, cursor);
    if (start < 0) continue;
    if (start > cursor) segments.push({ text: post.body.slice(cursor, start) });
    const id = `claim-${i}`;
    const fact = item.status === 'supported' ? item.facts[0] : undefined;
    claims.push({ id, text: item.text, ...(fact ? { evidence: { id: fact.id || `snapshot-${i}`, section: 'Registered kit evidence', status: 'found', statement: fact.claim, ...(fact.quote ? { quote: fact.quote } : {}) } } : {}) });
    segments.push({ text: item.text, claimId: id }); cursor = start + item.text.length;
  }
  if (cursor < post.body.length) segments.push({ text: post.body.slice(cursor) });
  const channel = post.channel?.toLowerCase().includes('x') ? 'x' : 'linkedin';
  const slop = post.checks.slop?.passed === true;
  const complete = !!current && !current.partial;
  const supported = complete && current.unsupported === 0;
  return { channels: [{ id: channel, label: post.channel || 'LinkedIn', segments }], claims,
    checks: { slop: { label: 'Slop check', passed: slop }, voiceFit: { label: 'Voice fit estimate', value: post.checks.voiceFit == null ? 'Not scored' : String(post.checks.voiceFit) } },
    checkRows: [{ label: 'Slop check', value: slop ? 'Passed' : 'Blocked', solid: slop }, { label: 'Claims review', value: !complete ? 'Review required' : supported ? 'Supported under your claims setting' : `${current.unsupported} unsupported`, solid: supported }, { label: 'Approval', value: post.status === 'approved' || post.status === 'registered' ? 'Approved' : 'Your decision required' }],
    approvalReady: slop && supported, notice: current?.partial ? 'This claim review is incomplete. Resolve it before approval.' : undefined,
    blocked: { claim: '', message: '' }, polishActions: ['Review', 'Shorten', 'Clarify', 'Beautify', 'Beautify (accessible)'] };
}
export function proofView(post: Post, name: string): ProofData {
  return { record: { post: `${name} · ${post.channel || 'post'}`, kit: `Kit v${post.kit_version || 1}`, approvedBy: post.approved_by || 'Brand owner', hash: post.hash || '' },
    signature: post.signature, network: 'Solana devnet', postText: post.body, checkLink: `${window.location.origin}/verify`,
    officialNote: `Exact text approved for ${name}. The brand name is self-declared; domain verification comes next.`, edited: { note: 'Changed text is checked against the registered fingerprint.', diff: [] } };
}
