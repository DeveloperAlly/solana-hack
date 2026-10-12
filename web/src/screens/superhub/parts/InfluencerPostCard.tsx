import { Badge } from '../../../ui/primitives/Badge';
import { Button, Text } from '../../../ui/primitives';
import { ApprovalItem } from '../../../ui/domain/ApprovalItem';
import { HubWatermarkMedia } from '../../../ui/domain/HubWatermarkMedia';
import type { ReviewQueue } from '../hooks/useReviewQueue';
import type { InfluencerPost } from '../types';
import { InlineEditor } from './InlineEditor';

export interface InfluencerPostCardProps {
  post: InfluencerPost;
  /** True once the media carries the watermark (as drafted, or after Re-stamp). */
  stamped: boolean;
  onRestamp: () => void;
  queue: ReviewQueue<'approved'>;
}

/** D1 influencer post (n-iq): watermarked media, channel and slot, caption, checks; no watermark blocks approval. */
export function InfluencerPostCard({ post, stamped, onRestamp, queue }: InfluencerPostCardProps) {
  const caption = queue.textOf(post.id, post.caption);
  const editing = queue.editing === post.id;
  return (
    <ApprovalItem
      blocked={!stamped}
      media={<HubWatermarkMedia label={post.image} stamped={stamped} />}
      meta={<><Badge>{post.channel}</Badge><span>{post.when}</span></>}
      draft={editing ? <InlineEditor label={`Caption for ${post.channel}`} value={queue.draft} error={queue.error} onChange={queue.setDraft} onSave={queue.save} onCancel={queue.cancel} /> : caption}
      note={stamped ? <Text variant="small" tone="secondary">{post.checks}</Text> : <Text variant="small" tone="danger">{post.blockedReason}</Text>}
      outcome={queue.outcomeOf(post.id) && <>Approved · {post.channel} {post.when}<Button variant="secondary" onClick={() => queue.undo(post.id)}>Undo</Button></>}
      actions={
        stamped
          ? !editing && <><Button onClick={() => queue.act(post.id, 'approved')}>Approve</Button><Button variant="secondary" onClick={() => queue.edit(post.id, caption)}>Edit</Button></>
          // INTEGRATION: re-stamp the media with the AI watermark (watermarking not chosen yet, G-WATERMARK).
          : <Button onClick={onRestamp}>Re-stamp image</Button>
      }
    />
  );
}
