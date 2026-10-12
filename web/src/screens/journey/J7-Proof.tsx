/*
 * Data contract: J7-Proof, "Prove: registered + Official (AHA 5)" (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
 * board J7-Proof, note n-j7-proof; issue #48). Shape: ProofData in ./types. Backend map:
 * .agentic/what/context/backend_map.md §4, rows "Publish and Registered" and "Verify-1, Verify-2, Verify-3".
 *
 * | Field        | Source                                                                                              | Empty when |
 * |--------------|-----------------------------------------------------------------------------------------------------|------------|
 * | record       | The registration: POST /api/brands/:id/posts/:id/register (web/worker/api.ts, registerPost) returns post, kit version, approver, time and hash (`registrations` row) | never: J7 follows registration |
 * | signature    | The registration's transaction signature; shown as a D32 receipt link to Solana Explorer (devnet)  | null until it has a transaction |
 * | network      | Static: devnet (the demo runs on devnet only)                                                       | never      |
 * | postText     | The approved post body (`posts` row)                                                                | never      |
 * | checkLink    | The public Check a post page for this post                                                          | never      |
 * | officialNote | POST /api/verify result for an exact match                                                          | never      |
 * | edited       | Static example: the edited-copy diff is COMING SOON (verifyText checks exact text only; G-MATCH)    | never      |
 *
 * The post's channel and text are the ones approved on J6 (useJourneyFlow); the fixture is the default.
 * States: success only (the board draws one state). Publishing from JamJam is coming soon (ADR-008).
 */
import { Badge, Button, Heading, Link, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { DiffView } from '../../ui/composites/DiffView';
import { KeyValueList } from '../../ui/composites/KeyValueList';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import { JourneyAha } from '../../ui/domain/JourneyAha';
import { CopyButton } from '../../ui/composites/CopyButton';
import { Columns } from '../../ui/layouts/Columns';
import { VerifyReceiptLink } from '../../ui/domain/VerifyReceiptLink';
import { JourneyStepFrame } from './JourneyStepFrame';
import { ProofCheck } from './ProofCheck';
import { useJourneyHref } from './paths';
import { useJourneyFlow } from './useJourneyFlow';
import type { ProofData } from './types';

export function J7Proof({ data }: { data: ProofData }) {
  const { selections } = useJourneyFlow('proof');
  const post = selections.post;
  const postText = post?.text ?? data.postText;
  const r = data.record;
  const record = [
    { label: 'Post', value: post ? `${post.channelLabel} launch post` : r.post },
    { label: 'Kit', value: r.kit },
    { label: 'Approved by', value: r.approvedBy },
    { label: 'Hash', value: r.hash },
  ];
  const to = useJourneyHref();
  const transaction = <VerifyReceiptLink signature={data.signature} placeholder="[explorer link once registered]">View on Solana Explorer</VerifyReceiptLink>;
  return (
    <JourneyStepFrame step="proof" title="Your first post is registered" footer={<Button href={to('hub')}>Plan the rest of my week</Button>}>
      <JourneyAha n={5} tone="inverse">Anyone can check this came from you.</JourneyAha>
      <Columns
        ratio="5-7"
        stackBelow="md"
        end={
          <Card variant="selected" labelledBy="proof-check" header={<><Heading level={2} size="xl" id="proof-check">Check a post</Heading><Badge>What anyone sees</Badge></>}>
            <ProofCheck key={postText} registeredText={postText} officialNote={data.officialNote} />
            <Card variant="subtle" as="div" header={<><Text variant="small"><strong>Someone edits it?</strong></Text><ComingSoonFlag tag="COMING SOON" /></>}>
              <Text variant="caption" tone="secondary">{data.edited.note}</Text>
              <DiffView segments={data.edited.diff} />
            </Card>
            <Link href={to('ledger')}>See JamJam's public ledger</Link>
          </Card>
        }
      >
          <Card labelledBy="proof-record">
            <Heading level={2} size="xl" id="proof-record">On the public record</Heading>
            <KeyValueList items={[...record, { label: 'Transaction', value: <>{transaction} <Badge>{data.network}</Badge></> }]} />
            <Stack direction="row" gap={2} wrap>
              <CopyButton variant="primary" label="Copy post" value={postText} />
              <CopyButton label="Copy check link" value={data.checkLink} />
            </Stack>
            <Text variant="caption" tone="secondary">
              Publishing to X and LinkedIn from JamJam: <ComingSoonFlag tag="COMING SOON" />. For now, paste the post and add its link back.
            </Text>
          </Card>
      </Columns>
    </JourneyStepFrame>
  );
}
