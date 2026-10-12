import type { WorkbenchExample } from '../../system/example';
import { GrowthEmbedSnippet } from './GrowthEmbedSnippet';

export function GrowthEmbedSnippetDemo() {
  return (
    <GrowthEmbedSnippet
      label="HTML snippet"
      code={'<a href="https://jamjam.tech/verify?post=post-adna-li">Official aDNA post, checked on JamJam</a>'}
      hint="Paste it under the post on your site."
    />
  );
}

export const example: WorkbenchExample = {
  id: 'D63',
  name: 'GrowthEmbedSnippet',
  description: 'Labelled read-only code with a copy button; long lines wrap.',
  render: () => <GrowthEmbedSnippetDemo />,
};
