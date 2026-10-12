/*
 * Data contract: Quests (canvas v24 page "5 · Grow your reach", board Quests, COMING SOON; component inventory D53).
 * Backend map: .agentic/what/context/backend_map.md, payouts go to the doer's own wallet; quests have no table or
 * endpoint yet. Shapes: QuestsData in ./types.ts; Quest and the form gate in domain/quest.ts; submissions are
 * ambassador-post items of the one approval queue (domain/queue.ts), the union Today uses.
 *
 * | Field          | Source                                                                          | Empty when       |
 * |----------------|---------------------------------------------------------------------------------|------------------|
 * | quests[]       | GET /api/quests (not built yet)                                                 | no quests        |
 * | submissions[]  | the approval queue (GET /api/queue?kind=ambassadorPost, not built yet)          | nothing waiting  |
 * | paidThisMonth  | payouts this month (GET /api/payouts, not built yet)                            | 0                |
 * | suggestions[]  | quests suggested from the kit (not built yet)                                   | never            |
 *
 * States (canvas note on the board): success = a submission to review; empty = no quests (suggest three from the kit);
 * loading; error. Budget reached is a quest whose slots are all paid (approving the last submission closes it).
 */
import { Button, Grid } from '../../ui/primitives';
import { StatTile } from '../../ui/composites/StatTile';
import { StateView } from '../../ui/composites/StateView';
import { QuestForm } from '../../ui/domain/QuestForm';
import { LoopFrame } from './components/LoopFrame';
import { QuestList } from './components/QuestList';
import { QuestSubmissions } from './components/QuestSubmissions';
import { listState } from './listState';
import { useQuests } from './useQuests';
import type { QuestsData, ScreenProps } from './types';

export function Quests({ data, state = 'success' }: ScreenProps<QuestsData>) {
  const flow = useQuests(data);
  const suggestions = data.suggestions.map((s) => <Button key={s.task} variant="secondary" onClick={() => flow.openForm(s)}>{s.task}</Button>);
  return (
    <LoopFrame stage="grow" tab="ambassadors" title="Quests" tag="COMING SOON"
      intro="Paid tasks anyone in your community can take: a tutorial, a demo, answers. Every submission is checked against your kit, a person approves it, and the reward goes to the doer’s wallet in USDC."
      meta="Drawn, not built. A quest is a one-off paid task; an ambassador seat is ongoing. No paid posting on X. Defined in: canvas v24 Quests; component inventory D53."
      actions={<Button onClick={() => flow.openForm()} disabled={flow.form !== null}>New quest</Button>}>
      {flow.form && <QuestForm key={flow.form.key} initial={flow.form.initial} onOpen={flow.open} onCancel={flow.closeForm} />}
      <StateView state={listState(state, flow.quests.length)}
        loading={{ title: 'Loading quests', body: 'Reading quests, submissions and payouts.' }}
        error={{ title: 'Could not load quests', body: 'Quests could not be read. Reload the page in a minute.' }}
        empty={{ title: 'No quests yet', body: 'Start from one of these, suggested from your kit, or write your own.', actions: suggestions }}>
        <Grid min="sm">
          <StatTile label="Open quests" value={String(flow.quests.filter((q) => q.state === 'open' || q.state === 'submitted').length)} />
          <StatTile label="Waiting on you" value={String(flow.waiting)} sub="submissions" />
          <StatTile label="Paid this month" value={`${flow.paidThisMonth} USDC`} />
        </Grid>
        <QuestList flow={flow} />
        <QuestSubmissions flow={flow} />
      </StateView>
    </LoopFrame>
  );
}
