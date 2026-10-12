/*
 * Data contract: J6-First-Post, "First post, claims backed (AHA 4)" (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
 * board J6-First-Post, note n-j6-first-post; issue #48). Shape: FirstPostData in ./types. Backend map:
 * .agentic/what/context/backend_map.md §4, rows "Create-NewDraft" and "Draft-Review".
 *
 * | Field         | Source                                                                                            | Empty when |
 * |---------------|---------------------------------------------------------------------------------------------------|------------|
 * | channels[]    | The first draft from kit v1: POST /api/brands/:id/posts {brief, channel} (web/worker/api.ts, draftPost), one per channel; claim spans from the claims gate | never: drafted automatically, no blank brief |
 * | claims[]      | Each claim with the `evidence` row that backs it (H9)                                               | [] for a post with no claims |
 * | checks        | The post's slop pass, claims gate and voice-fit score (`posts` row). Voice fit is self-graded today | never      |
 * | blocked       | A claim the gate refused: it has no evidence, so Approve stays blocked until it is sourced or removed | unset when every claim is backed |
 * | polishActions | Static: POST /api/brands/:id/posts/:id/polish {action}, undo via POST …/undo                        | never      |
 * | channels[].polish | The rewrite each polish action returns (POST …/polish); applying one replaces the draft, Undo restores the previous | absent: no polish bar |
 *
 * The channel and the post approved come from useJourneyFlow; with kit v1 known not to be registered, the screen says to
 * register it first instead of drafting; claims count as backed only
 * while their evidence survives J3 (derive.ts), and Approve is enabled by the same function that renders the check badges (derive.ts postChecks).
 * States: success only (the board draws one state; its blocked-claim panel is an example inside it).
 */
import { useState } from 'react';
import { Button, Stack, Text } from '../../ui/primitives';
import { StatePanel } from '../../ui/composites/StatePanel';
import { Card } from '../../ui/composites/Card';
import { Tabs } from '../../ui/composites/Tabs';
import { JourneyAha } from '../../ui/domain/JourneyAha';
import { JourneyClaimText } from '../../ui/domain/JourneyClaimText';
import { CopyButton } from '../../ui/composites/CopyButton';
import { PolishBar } from '../../ui/domain/PolishBar';
import { Columns } from '../../ui/layouts/Columns';
import { StatusList } from '../../ui/composites/StatusList';
import { FirstPostClaimPanel } from './FirstPostClaimPanel';
import { JourneyNextButton } from './JourneyNextButton';
import { JourneyStepFrame } from './JourneyStepFrame';
import { draftClaims, postChecks, statusRows } from './derive';
import { useJourneyHref } from './paths';
import { useJourneyFlow } from './useJourneyFlow';
import type { FirstPostData } from './types';

export function J6FirstPost({ data }: { data: FirstPostData }) {
  const to = useJourneyHref();
  const { selections, actions } = useJourneyFlow('firstPost');
  const [chosen, setChosen] = useState<string>();
  // Polish actions applied per channel, oldest first; the draft on screen is the last one's revision, else the original.
  const [applied, setApplied] = useState<Record<string, string[]>>({});
  const channel = data.channels.find((c) => c.id === selections.postChannel) ?? data.channels[0];
  const steps = applied[channel.id] ?? [];
  const last = steps[steps.length - 1];
  const draft = { ...channel, segments: (last && channel.polish?.[last]) || channel.segments };
  const setSteps = (next: string[]) => setApplied((a) => ({ ...a, [channel.id]: next }));
  const claims = draftClaims(draft, data.claims, selections);
  // The evidence panel always describes the draft on screen: the chosen claim if it is in this draft, else its first.
  const claim = claims.find((c) => c.id === chosen) ?? claims[0];
  const checks = postChecks(data.checks, claims);
  const text = draft.segments.map((s) => s.text).join('');
  if (selections.kitRegistered === false) {
    // Drafting needs a registered kit (web/worker/posts.ts returns 409 "register your brand kit first").
    return (
      <JourneyStepFrame step="firstPost" title="Your first post, from kit v1">
        <StatePanel kind="error" title="Register kit v1 first" body="Your first post is drafted from the registered kit, and kit v1 is not registered yet." actions={<Button href={to('approveKit', 'error')}>Back to kit v1</Button>} />
      </JourneyStepFrame>
    );
  }
  return (
    <JourneyStepFrame step="firstPost" title="Your first post, from kit v1" intro="Written in your approved voice. Every claim is linked to the evidence behind it.">
      <Columns
        ratio="7-5"
        stackBelow="md"
        end={
          <Stack gap={3}>
            <JourneyAha n={4}>It's my voice, and every claim is backed.</JourneyAha>
            <StatusList label="Checks" title surface="card" rows={statusRows(checks.rows)} />
            {claim && <FirstPostClaimPanel claim={claim} />}
            <Card variant="emphasis" as="div">
              <Text variant="small"><strong>Example: an unsupported claim is blocked</strong></Text>
              <Text variant="small">"{data.blocked.claim}" {data.blocked.message}</Text>
            </Card>
            {/* INTEGRATION: POST /api/brands/:id/posts/:id/approve {rev}, then POST …/register (web/worker/api.ts). */}
            <JourneyNextButton
              href={to('proof')}
              ready={checks.ready}
              hint="Every check must pass first: source or remove each unsupported claim, and fix what the slop pass flags."
              onGo={() => actions.approvePost({ channelLabel: draft.label, text })}
            >
              Approve and register
            </JourneyNextButton>
            <CopyButton label="Copy text" value={text} />
          </Stack>
        }
      >
          <Card variant="selected" as="div">
            <Tabs
              label="Channel"
              value={draft.id}
              onChange={actions.setPostChannel}
              items={data.channels.map((c) => ({ id: c.id, label: c.label, panel: <JourneyClaimText segments={c.id === draft.id ? draft.segments : c.segments} selected={claim?.id} onSelect={setChosen} /> }))}
            />
            <Text variant="caption" tone="secondary">Sample draft for the wireframe. Highlighted = a claim linked to evidence; select one to see it.</Text>
            {/* INTEGRATION: POST /api/brands/:id/posts/:id/polish {action, rev}; Undo is POST …/undo {rev}. */}
            {channel.polish && <PolishBar actions={data.polishActions.map((a) => ({ id: a, label: a }))} applied={steps} onApply={(a) => setSteps([...steps, a])} onUndo={() => setSteps(steps.slice(0, -1))} />}
          </Card>
      </Columns>
    </JourneyStepFrame>
  );
}
