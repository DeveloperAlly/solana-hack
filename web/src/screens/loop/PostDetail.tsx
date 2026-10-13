/*
 * Data contract: Post-Detail (canvas v24 page "Start here: the loop", board Post-Detail; ADR-012 decision 3, PR #86;
 * issue #90 row "PostLifecycle"). Shape: PostDetailData in ./types.ts; Post in src/domain/post.ts.
 *
 * | Field               | Source                                                                                      |
 * |---------------------|---------------------------------------------------------------------------------------------|
 * | posts[].text, checks| posts row (GET /api/posts/:id, web/worker/posts.ts): text, slop and claims results           |
 * | provenance          | the draft's provenance row (ADR-012 runtime section): not built yet                         |
 * | lifecycle.approval  | posts.approved_by, approved_at (built; an edit resets it); the fingerprint is client-side   |
 * | published[]         | publishing per platform (P7 adapter registry, ADR-013): not built                            |
 * | verified            | registrations row (Registrar, SAS on devnet; built for posts)                               |
 * | amplified[]         | ambassador posts (Grow): not built; results: analytics ingest (N1 to N4): not built         |
 * | brain               | X18 brand memory (resolves the provenance ids for Why this?): not built; fixtures           |
 *
 * States (canvas Post-Detail note): success shows the picked post; the picker holds the named variants (draft with
 * steps 2 to 6 to do, approval stale after an edit, publish failed on one platform, not verified, no ambassadors,
 * results ready). empty: no posts yet; loading; error.
 */
import { Button, Heading, Link, Select, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { StateView } from '../../ui/composites/StateView';
import { SampleFlag } from '../../ui/composites/SampleFlag';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { Columns } from '../../ui/layouts/Columns';
import { PageHeader } from '../../ui/layouts/PageHeader';
import { PostLifecycle } from '../../ui/domain/PostLifecycle';
import { WhyThis } from '../../ui/domain/WhyThis';
import { LoopFrame } from '../../ui/shells/LoopFrame';
import { PostPlatforms } from './PostPlatforms';
import { useLoopLinks } from './paths';
import { usePostDetail } from './usePostDetail';
import type { PostDetailData } from './types';

export function PostDetail({ data, state = 'success' }: { data: PostDetailData; state?: ScreenState }) {
  const f = usePostDetail(data);
  const { links } = useLoopLinks();
  const p = f.post;
  return (
    <LoopFrame artboard="Post-Detail" tag="COMING SOON" brandName={data.brain.brandName}>
      <StateView
        state={p ? state : 'empty'}
        empty={{ level: 1, title: 'No posts yet', body: 'Approve a first draft and it shows here, through every step of the loop.', actions: <Button href={links.contentDashboard}>Go to drafts</Button> }}
        loading={{ level: 1, title: 'Loading the post' }}
        error={{ level: 1, title: "Couldn't load this post", body: 'Nothing about it changed.', actions: <Button variant="secondary" href={links.post}>Try again</Button> }}
      >
        {p && (
          <>
            <PageHeader
              title={`Post · ${p.platform} · ${p.lifecycle.drafted.voiceLabel}`}
              intro={<>{p.campaign} · created from kit v{p.provenance.kitVersion} · <SampleFlag /></>}
              actions={<><Button variant="secondary" href={links.draftReview}>Edit</Button><Button variant="secondary" href={links.adapt}>Adapt for other platforms</Button></>}
            />
            <Select label="Post" layout="inline" options={f.options} value={f.postId} onValueChange={f.setPostId} />
            <Card labelledBy="lc-h" header={<Heading level={2} size="lg" id="lc-h">This post, through the loop</Heading>}>
              <PostLifecycle post={p} brainVersion={f.brain.version} actions={{ verified: p.lifecycle.verified && <Link href={links.verifyMatch}>check it</Link>, approved: f.approval !== 'valid' && <Link href={links.draftReview}>Review and approve</Link> }} />
            </Card>
            <Columns end={<Card><WhyThis provenance={p.provenance} brain={f.brain} footer={<Button variant="secondary" href={links.brain}>Open the Brain</Button>} /></Card>}>
              <Card labelledBy="post-h" header={<Heading level={2} size="lg" id="post-h">The post</Heading>}>
                <Text>{p.text}</Text>
                <Text variant="small" tone="secondary">{p.length} · {p.platform}</Text>
                <Text variant="small" tone={f.checks?.blocking ? 'warning' : 'secondary'}>Checks: {f.checks?.label}</Text>
                <PostPlatforms post={p} />
              </Card>
            </Columns>
          </>
        )}
      </StateView>
    </LoopFrame>
  );
}
