import type { WorkbenchExample } from '../../system/example';
import { Alert, Box, Button, Link, Text } from '../primitives';
import { WizardLayout } from './WizardLayout';

const steps = ['Read', 'Save', 'Confirm', 'Gaps + voice', 'Approve kit'].map((label) => ({ label }));

export const example: WorkbenchExample = {
  id: 'L6',
  name: 'WizardLayout',
  description: 'Middle step, saving, with a step error and a footer (title at level 4 inside the workbench).',
  render: () => (
    <Box border="subtle" radius="box">
      <WizardLayout
        steps={steps}
        current={2}
        title="Confirm what we found"
        titleLevel={4}
        intro="Accept, edit or reject. Every card shows the line it came from."
        estimate="About 7 min left"
        saving
        headerActions={<Link href="/system">Save and finish later</Link>}
        error={<Alert tone="danger" title="That answer did not save">Try again; your text is still here.</Alert>}
        footer={<><Button variant="secondary">Back</Button><Button>Continue</Button></>}
        hrefFor={(i) => `/system#wizard-${i + 1}`}
      >
        <Text>Step body.</Text>
      </WizardLayout>
    </Box>
  ),
};
