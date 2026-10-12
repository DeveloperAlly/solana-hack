/*
 * Data contract: Platform-Detail (pending canvas board "Platform-Detail", page Growth; issue #82, sub-task "Platforms
 * page": "A detail screen per platform carries its posting rules"). Backend map §4, row "Settings › Connections"
 * (GET /api/connect/{x,linkedin}/start and /callback, DELETE /api/connections/:id; table connections) and §9.
 * Shapes: PlatformDetailData in ./types.ts; Platform in config/platforms.ts.
 *
 * | Field                 | Source                                                                    | Empty when             |
 * |-----------------------|---------------------------------------------------------------------------|------------------------|
 * | platform              | `?platform=` id looked up in the M2 registry; else `defaultId`            | never (falls back)     |
 * | platform.plans        | registry: planned capabilities                                            | never                  |
 * | platform.rules[]      | registry: each rule with its source; "[platform posting rules]" if none   | never (bracketed)      |
 * | platform.today        | registry: what works now, with its repo source                            | nothing works yet      |
 * | connected (session)   | connections row for this brand and platform (not built yet); preview here | not connected          |
 * | messagingNote         | canvas Inbox-Connect copy (Superhub, issue #52)                           | no inbox plan          |
 *
 * States (C28): success = the platform; loading = reading the connection; error = the connection could not be read.
 */
import { Select, Stack } from '../../ui/primitives';
import { Columns } from '../../ui/layouts/Columns';
import { StateView } from '../../ui/composites/StateView';
import { LoopFrame } from './components/LoopFrame';
import { GrowthCapabilityList } from './components/GrowthCapabilityList';
import { GrowthConnectPanel } from './components/GrowthConnectPanel';
import { GrowthRuleList } from './components/GrowthRuleList';
import { growthArtboards, useGrowthLinks } from './paths';
import { usePlatformDetail } from './usePlatformDetail';
import type { PlatformDetailData, ScreenProps } from './types';

export function PlatformDetail({ data, state = 'success' }: ScreenProps<PlatformDetailData>) {
  const flow = usePlatformDetail(data);
  const links = useGrowthLinks();
  const { platform } = flow;
  return (
    <LoopFrame
      artboard="Platform-Detail" under="Platforms"
      title={platform.name}
      tag="COMING SOON"
      back={{ href: links.to(growthArtboards.platforms), label: 'All platforms' }}
      intro="What JamJam plans to do here, the platform’s posting rules, and how to connect."
      meta="Drawn, not built. Defined in: issue #82 (Platforms page); M2 channel registry."
      actions={
        <Select label="Platform" layout="inline" value={platform.id} onValueChange={flow.choose} options={data.platforms.map((p) => ({ value: p.id, label: p.name }))} />
      }
    >
      <StateView
        state={state}
        loading={{ title: `Loading ${platform.name}`, body: 'Reading whether this account is connected.' }}
        error={{ title: 'Could not read this connection', body: 'Reload the page in a minute.' }}
      >
        <Columns end={<GrowthConnectPanel platform={platform} connected={flow.connected} onConnect={flow.connect} onDisconnect={flow.disconnect} messagingNote={data.messagingNote} />}>
          <Stack gap={5}>
            <GrowthCapabilityList platform={platform} />
            <GrowthRuleList rules={platform.rules} />
          </Stack>
        </Columns>
      </StateView>
    </LoopFrame>
  );
}
