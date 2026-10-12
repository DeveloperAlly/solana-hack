import type { WorkbenchExample } from '../../system/example';
import { Stack, Text } from '../primitives';
import { screenStates } from './DemoStateSwitcher';
import { StateView } from './StateView';

const copy = {
  loading: { title: 'Loading campaigns', level: 4 as const },
  error: { title: 'Campaigns did not load', body: 'Try again in a moment.', level: 4 as const },
  empty: { title: 'No campaigns yet', body: 'Start one from the content plan.', level: 4 as const },
};

export const example: WorkbenchExample = {
  id: 'C35',
  name: 'StateView',
  description: 'Every demo state from copy (StatePanel, EmptyState, success), and a custom view that wins over the copy.',
  render: () => (
    <Stack gap={4}>
      {screenStates.map((s) => (
        <StateView key={s} state={s} {...copy}>
          <Text>Success view: the campaign list.</Text>
        </StateView>
      ))}
      <StateView state="loading" loading={copy.loading} views={{ loading: <Text>Custom skeleton for this screen.</Text> }}>
        <Text>Success</Text>
      </StateView>
    </Stack>
  ),
};
