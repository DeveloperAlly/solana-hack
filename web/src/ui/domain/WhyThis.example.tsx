import type { WorkbenchExample } from '../../system/example';
import { adnaBrain } from '../../domain/fixtures/brain';
import { adnaPosts } from '../../domain/fixtures/posts';
import { Button } from '../primitives';
import { WhyThis } from './WhyThis';

// The "Why this?" panel of canvas v24 board Post-Detail (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'D71',
  name: 'WhyThis',
  description: "The board's draft: two facts with receipts, the Founder voice, two rules and the versions it was built with.",
  render: () => <WhyThis provenance={adnaPosts[0].provenance} brain={adnaBrain} level={3} footer={<Button variant="secondary" href="/system">Open the Brain</Button>} />,
};
