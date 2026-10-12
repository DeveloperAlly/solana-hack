// Sample data for Onboard-2-Domain. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Onboard-2-Domain
// (note n-ob2); issue #50; backend map §4, row "Onboard-2-Domain, Onboard-2b-DomainFailed". Bracketed values stay bracketed.
import type { DomainData } from './types';
import { jamjamBrand } from './shared.fixtures';

const causes = [
  'Added to a subdomain? Use @ or leave the host blank.',
  'Extra quotes or spaces in the value? Paste it exactly as shown.',
  'DNS not updated yet? Try again in a few minutes.',
];

export const domainData: DomainData = {
  brand: jamjamBrand,
  domain: 'jamjam.tech',
  record: { type: 'TXT', host: '@', value: 'jamjam-verify=[unique value]' },
  check: 'waiting',
  causes,
};
