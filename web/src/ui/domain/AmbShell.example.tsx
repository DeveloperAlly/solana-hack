import type { WorkbenchExample } from '../../system/example';
import { Stack, Text } from '../primitives';
import { AmbShell } from './AmbShell';
import { sampleNav } from './ambSamples';

const common = { nav: sampleNav, homeHref: '/system', signInHref: '/system#sign-in', preview: true } as const;

export const example: WorkbenchExample = {
  id: 'L1',
  name: 'AmbShell',
  description: 'Desktop top nav with the balance chip (canvas Amb-1), and the mobile frame with tab bar (M-1), as previews.',
  render: () => (
    <Stack gap={5}>
      <AmbShell {...common} device="desktop" active="campaigns" account={{ name: 'Mai T.', balance: '15 USDC' }}>
        <Text>Desktop body</Text>
      </AmbShell>
      <AmbShell {...common} device="mobile" active="posts" account={{ name: 'Mai T.', balance: '25 USDC' }} tabs>
        <Text>Mobile body</Text>
      </AmbShell>
    </Stack>
  ),
};
