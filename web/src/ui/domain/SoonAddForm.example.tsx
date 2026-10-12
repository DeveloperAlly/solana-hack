import type { WorkbenchExample } from '../../system/example';
import { SoonAddForm } from './SoonAddForm';

export const example: WorkbenchExample = {
  id: 'D-UI5',
  name: 'SoonAddForm',
  description: 'An Add button that opens an inline form; it closes on a valid submit or Cancel.',
  render: () => (
    <SoonAddForm triggerLabel="Add a source" label="Add a source" fields={[{ name: 'name', label: 'Source' }]} submitLabel="Add source" onSubmit={() => {}} />
  ),
};
