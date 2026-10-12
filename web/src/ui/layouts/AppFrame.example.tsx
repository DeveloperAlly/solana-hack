import type { WorkbenchExample } from '../../system/example';
import { Badge, Box, Button, Link, Stack, Text } from '../primitives';
import { AppFrame } from './AppFrame';

// Frames from canvas boards Onboard-* / BB-* (wizard), Amb-* (desktop) and M-* (mobile); https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn.
const ambNav = [
  { id: 'campaigns', label: 'Campaigns', href: '/system#campaigns' },
  { id: 'posts', label: 'My posts', href: '/system#posts' },
  { id: 'earnings', label: 'Earnings', href: '/system#earnings' },
];

export const example: WorkbenchExample = {
  id: 'L11',
  name: 'AppFrame',
  description: 'Wizard frame (context, flag, one action), desktop with nav and account chip, and phone with back link, pinned row, sticky footer and tab bar. All in preview mode.',
  render: () => (
    <Stack gap={5}>
      <Box border="subtle" radius="box">
        <AppFrame preview homeHref="/system" context="Build your brand: JamJam" flags={<Badge>Unverified</Badge>} actions={<Link href="/system">Save and finish later</Link>}>
          <Text>Wizard body (WizardLayout goes here).</Text>
        </AppFrame>
      </Box>
      <Box border="subtle" radius="box">
        <AppFrame preview homeHref="/system" nav={{ label: 'Ambassador preview, desktop', items: ambNav, current: 'campaigns' }} actions={<Badge>Mai T. · 15 USDC</Badge>}>
          <Text>Desktop body.</Text>
        </AppFrame>
      </Box>
      <Box border="subtle" radius="box">
        <AppFrame
          preview
          width="phone"
          homeHref="/system"
          back={{ href: '/system', label: 'Back to campaigns' }}
          title="Write your post"
          pinned={<Text variant="small">On-brand 91%</Text>}
          footer={<Button fullWidth>Publish</Button>}
          nav={{ label: 'Ambassador preview, mobile', items: ambNav, current: 'posts', placement: 'tabs' }}
        >
          <Text>Phone body.</Text>
        </AppFrame>
      </Box>
    </Stack>
  ),
};
