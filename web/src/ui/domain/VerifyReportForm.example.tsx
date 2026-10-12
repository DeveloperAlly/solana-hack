import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { VerifyReportForm } from './VerifyReportForm';

export function VerifyReportFormDemo() {
  return (
    <Stack gap={4}>
      <VerifyReportForm triggerLabel="Report possible impersonation" />
      <VerifyReportForm triggerLabel="Report to aDNA" brandName="aDNA" defaultOpen />
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'D34',
  name: 'VerifyReportForm',
  description: 'Closed, and open with the brand filled in; validates on submit, then confirms.',
  render: () => <VerifyReportFormDemo />,
};
