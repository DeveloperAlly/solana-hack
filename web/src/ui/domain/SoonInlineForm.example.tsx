import type { WorkbenchExample } from '../../system/example';
import { SoonInlineForm } from './SoonInlineForm';

const required = (v: string) => (v ? null : 'Enter the brand name.');

export const example: WorkbenchExample = {
  id: 'D-UI5',
  name: 'SoonInlineForm',
  description: 'Fields with client validation (submit empty to see the error), submit and cancel.',
  render: () => (
    <SoonInlineForm label="Add a brand" fields={[{ name: 'name', label: 'Brand name', validate: required }]} submitLabel="Add brand" onSubmit={() => {}} onCancel={() => {}} />
  ),
};
