import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { BuilderScale } from './BuilderScale';

function Demo() {
  const [value, setValue] = useState(2);
  return <BuilderScale legend="Formality" low="Casual" high="Formal" value={value} onChange={setValue} />;
}

export const example: WorkbenchExample = {
  id: 'C6',
  name: 'BuilderScale',
  description: 'A 1–5 dial with end labels (canvas BB-6-Voice).',
  render: () => <Demo />,
};
