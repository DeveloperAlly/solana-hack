import type { WorkbenchExample } from '../../system/example';
import { useState } from 'react';
import { SoonWeekCalendar } from './SoonWeekCalendar';

function Demo() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <SoonWeekCalendar
      label="This week"
      days={['Mon', 'Tue', 'Wed']}
      slots={[
        { id: 'a', day: 'Mon', label: '09:00 X', status: 'failed' },
        { id: 'b', day: 'Tue', label: '12:30 LinkedIn', status: 'scheduled' },
        { id: 'c', day: 'Wed', label: '[open slot]', status: 'open' },
      ]}
      selectedId={picked}
      onSelect={setPicked}
    />
  );
}

export const example: WorkbenchExample = {
  id: 'D8',
  name: 'SoonWeekCalendar',
  description: 'Failed, scheduled and open slots; pick the open slot to select it.',
  render: () => <Demo />,
};
