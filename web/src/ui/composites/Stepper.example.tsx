import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { Stepper } from './Stepper';

const steps = ['Read', 'Save', 'Confirm', 'Gaps + voice', 'Approve kit', 'First post', 'Prove'].map((label) => ({ label }));

export const example: WorkbenchExample = {
  id: 'C8',
  name: 'Stepper',
  description: 'Horizontal at the first and a middle step (done steps are links), and vertical.',
  render: () => (
    <Stack gap={5}>
      <Stepper steps={steps} current={0} label="First step" />
      <Stepper steps={steps} current={3} label="Middle step" hrefFor={(i) => `/system#step-${i + 1}`} />
      <Stepper steps={steps.slice(0, 4)} current={2} orientation="vertical" label="Vertical" />
    </Stack>
  ),
};
