import type { WorkbenchExample } from '../../system/example';
import { BuilderSelect } from './BuilderSelect';

// Options from canvas board BB-1-Basics (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, issue #50).
export const example: WorkbenchExample = {
  id: 'P13',
  name: 'BuilderSelect',
  description: 'Labelled native select with a hint.',
  render: () => <BuilderSelect label="Primary channel" hint="Where you post most." options={['X', 'LinkedIn', 'Blog or newsletter', 'Instagram', 'TikTok', 'Other']} defaultValue="X" />,
};
