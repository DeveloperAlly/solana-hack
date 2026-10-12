/*
 * Data contract: M-Today (canvas v24 page "Start here: the loop", board M-Today; ADR-012 decision 1: every item has a
 * one-tap approve that works on a phone). Shape: TodayData in ./types.ts, the same data as Today (see Today.tsx).
 *
 * Shows the first three decisions that can be made in one tap (an action and no blocking check); the rest are on
 * Today ("n more"). States: as Today: success, empty (all clear), loading, error.
 */
import { Heading, Link, Text } from '../../ui/primitives';
import { StateView } from '../../ui/composites/StateView';
import { SampleFlag } from '../../ui/composites/SampleFlag';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { LoopPage } from './LoopPage';
import { TodayQueue } from './TodayQueue';
import { useLoopLinks } from './paths';
import { useToday } from './useToday';
import type { TodayData } from './types';

const PHONE_ITEMS = 3;

export function MToday({ data, state = 'success' }: { data: TodayData; state?: ScreenState }) {
  const t = useToday(data);
  const { links } = useLoopLinks();
  const oneTap = t.rows.filter((r) => r.act && !r.gate.blocking).slice(0, PHONE_ITEMS);
  const more = t.pending.length - oneTap.filter((r) => !r.outcome).length;
  return (
    <LoopPage tag="COMING SOON" stage="today" width="phone" brandName={data.brain.brandName}>
      <div>
        <Heading level={1} size="xl">{t.pending.length} decisions</Heading>
        <Text variant="small" tone="secondary">{t.progress} · <SampleFlag /></Text>
      </div>
      <StateView
        state={state}
        loading={{ title: 'Loading your decisions' }}
        error={{ title: "Couldn't load your decisions", body: 'Nothing was approved or sent.', actions: <Link href={links.today}>Open Today</Link> }}
      >
        <TodayQueue rows={oneTap} pending={t.pending.length} surface="card" footer={more > 0 && <Link href={links.today}>{more} more</Link>} />
      </StateView>
    </LoopPage>
  );
}
