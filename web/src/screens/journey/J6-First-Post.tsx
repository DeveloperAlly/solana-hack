/*
 * Data contract: J6-First-Post, "First post, claims backed (AHA 4)" (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
 * board J6-First-Post, note n-j6-first-post; issue #48). Shape: FirstPostData in ./types. Backend map:
 * .agentic/what/context/backend_map.md §4, rows "Create-NewDraft" and "Draft-Review".
 *
 * | Field         | Source                                                                                            | Empty when |
 * |---------------|---------------------------------------------------------------------------------------------------|------------|
 * | channels[]    | The first draft from kit v1: POST /api/brands/:id/posts {brief, channel} (web/worker/api.ts, draftPost), one per channel; claim spans from the claims gate | never: drafted automatically, no blank brief |
 * | claims[]      | Each claim with the `evidence` row that backs it (H9)                                               | [] for a post with no claims |
 * | checks[]      | The post's slop pass, claims gate and voice-fit score (`posts` row). Voice fit is self-graded today | never      |
 * | blocked       | A claim the gate refused: it has no evidence, so Approve stays blocked until it is sourced or removed | unset when every claim is backed |
 * | polishActions | Static: POST /api/brands/:id/posts/:id/polish {action}, undo via POST …/undo                        | never      |
 *
 * States: success only (the board draws one state; its blocked-claim panel is an example inside it).
 */
import { useState } from 'react';
import { Button, Heading, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { Tabs } from '../../ui/composites/Tabs';
import { JourneyAha } from '../../ui/domain/JourneyAha';
import { JourneyClaimText } from '../../ui/domain/JourneyClaimText';
import { JourneyCopyButton } from '../../ui/domain/JourneyCopyButton';
import { JourneyFactCard } from '../../ui/domain/JourneyFactCard';
import { JourneyPolishBar } from '../../ui/domain/JourneyPolishBar';
import { JourneySplit } from '../../ui/domain/JourneySplit';
import { JourneyStatusList } from '../../ui/domain/JourneyStatusList';
import { JourneyStepFrame } from './JourneyStepFrame';
import { useJourneyHref } from './paths';
import type { FirstPostData } from './types';

export function J6FirstPost({ data }: { data: FirstPostData }) {
  const to = useJourneyHref();
  const [channel, setChannel] = useState(data.channels[0].id);
  const [claimId, setClaimId] = useState(data.claims[0]?.id);
  const [applied, setApplied] = useState<string[]>([]);
  const claim = data.claims.find((c) => c.id === claimId);
  const text = (data.channels.find((c) => c.id === channel) ?? data.channels[0]).segments.map((s) => s.text).join('');
  return (
    <JourneyStepFrame step="firstPost" title="Your first post, from kit v1" intro="Written in your approved voice. Every claim is linked to the evidence behind it.">
      <JourneySplit
        ratio="7-5"
        first={
          <Card variant="selected" as="div">
            <Tabs
              label="Channel"
              value={channel}
              onChange={(id) => setChannel(id as typeof channel)}
              items={data.channels.map((c) => ({ id: c.id, label: c.label, panel: <JourneyClaimText segments={c.segments} selected={claimId} onSelect={setClaimId} /> }))}
            />
            <Text variant="caption" tone="secondary">Sample draft for the wireframe. Highlighted = a claim linked to evidence; select one to see it.</Text>
            {/* INTEGRATION: POST /api/brands/:id/posts/:id/polish {action, rev}; Undo is POST …/undo {rev}. */}
            <JourneyPolishBar actions={data.polishActions} applied={applied} onApply={(a) => setApplied((x) => [...x, a])} onUndo={() => setApplied((x) => x.slice(0, -1))} />
          </Card>
        }
        second={
          <>
            <JourneyAha n={4}>It's my voice, and every claim is backed.</JourneyAha>
            <JourneyStatusList title="Checks" rows={data.checks} />
            {claim?.evidence && (
              <Card labelledBy="post-claim">
                <Heading level={2} size="lg" id="post-claim">Claim → evidence</Heading>
                <Text variant="small"><strong>"{claim.text}"</strong></Text>
                <JourneyFactCard fact={claim.evidence} />
              </Card>
            )}
            <Card variant="emphasis" as="div">
              <Text variant="small"><strong>Example: an unsupported claim is blocked</strong></Text>
              <Text variant="small">"{data.blocked.claim}" {data.blocked.message}</Text>
            </Card>
            {/* INTEGRATION: POST /api/brands/:id/posts/:id/approve {rev}, then POST …/register (web/worker/api.ts). */}
            <Button href={to('proof')}>Approve and register</Button>
            <JourneyCopyButton label="Copy text" text={text} />
          </>
        }
      />
    </JourneyStepFrame>
  );
}
