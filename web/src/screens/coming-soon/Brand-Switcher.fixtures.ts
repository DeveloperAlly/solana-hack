// Sample data for Brand-Switcher. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), board
// Brand-Switcher, issue #51; backend map §3 data model (brands, memberships) and §4 row "Onboard-2-Domain" (domain verified).
import type { BrandSwitcherData } from './types';

export const brandSwitcher: BrandSwitcherData = {
  brands: [
    { id: 'jamjam', name: 'JamJam', detail: 'jamjam.tech', status: 'self-declared' },
    { id: 'adna', name: 'aDNA', detail: 'adna.network', status: 'domain-verified' },
    { id: 'founder', name: '[Founder name]', detail: 'founder profile, linked to JamJam', status: 'person' },
  ],
  currentId: 'jamjam',
  founderId: 'founder',
};
