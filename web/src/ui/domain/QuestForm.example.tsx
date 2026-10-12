import type { WorkbenchExample } from '../../system/example';
import { emptyQuestDraft } from '../../domain/quest';
import { QuestForm } from './QuestForm';

export const example: WorkbenchExample = {
  id: 'D105',
  name: 'QuestForm',
  description: 'New quest: no format pre-chosen; Open waits for task, format, reward and slots; cap = reward × slots.',
  render: () => <QuestForm initial={emptyQuestDraft} onOpen={() => undefined} />,
};
