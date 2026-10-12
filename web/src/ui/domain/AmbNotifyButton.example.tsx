import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { AmbNotifyButton } from './AmbNotifyButton';

function Demo() {
  const [on, setOn] = useState(false);
  return <AmbNotifyButton brand="GamersLab" on={on} onToggle={() => setOn((v) => !v)} />;
}

export const example: WorkbenchExample = {
  id: 'P8',
  name: 'AmbNotifyButton',
  description: 'Notify me, a pressed toggle per brand (canvas Amb-1b). Press it to switch on.',
  render: Demo,
};
