import { Grid, Button } from '../../../ui/primitives';
import { QuestCard } from '../../../ui/domain/QuestCard';
import type { QuestsFlow } from '../useQuests';

/** The quests as cards; Submissions shows that quest's submissions below (and again shows all). */
export function QuestList({ flow }: { flow: QuestsFlow }) {
  return (
    <Grid min="md">
      {flow.quests.map(({ quest, state, waiting, terms }) => {
        const focused = flow.focus === quest.id;
        return (
          <QuestCard key={quest.id} task={quest.task} state={state} waiting={waiting} terms={terms} selected={focused}
            actions={state !== 'coming-soon' && (
              <Button variant="secondary" aria-pressed={focused} onClick={() => flow.setFocus(focused ? null : quest.id)}>
                {focused ? 'All submissions' : 'Submissions'}
              </Button>
            )} />
        );
      })}
    </Grid>
  );
}
