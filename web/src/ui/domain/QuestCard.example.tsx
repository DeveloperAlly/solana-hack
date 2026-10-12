import type { WorkbenchExample } from '../../system/example';
import { Button, Grid } from '../primitives';
import { QuestCard } from './QuestCard';

// Copy from canvas v24 Quests (aDNA's sample quests).
export const example: WorkbenchExample = {
  id: 'D53',
  name: 'QuestCard',
  description: 'A paid community task: coming soon, open, submitted (to review), paid.',
  render: () => (
    <Grid min="sm">
      <QuestCard task="Write an event recap for [City] builders meetup" state="coming-soon" waiting={0} terms="20 USDC each · 4 slots · opens Tue 4 Nov" />
      <QuestCard task="Write a tutorial: set up aDNA in an existing repo" state="open" waiting={0} terms="50 USDC each · 3 of 5 slots left · due Fri 24 Oct" actions={<Button variant="secondary">Submissions</Button>} />
      <QuestCard task="Answer 5 setup questions in the community" state="submitted" waiting={2} terms="10 USDC each · 2 submitted · ongoing" actions={<Button variant="secondary">Submissions</Button>} />
      <QuestCard task="Record a 2-minute demo of an agent reading the folder" state="paid" waiting={0} terms="30 USDC each · 3 of 3 paid" />
    </Grid>
  ),
};
