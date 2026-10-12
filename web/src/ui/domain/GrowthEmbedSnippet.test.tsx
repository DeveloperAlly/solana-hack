import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe';
import { GrowthEmbedSnippet } from './GrowthEmbedSnippet';
import { GrowthEmbedSnippetDemo } from './GrowthEmbedSnippet.example';

afterEach(() => vi.restoreAllMocks());

describe('GrowthEmbedSnippet', () => {
  it('shows the code in a labelled region and copies it', async () => {
    const user = userEvent.setup();
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<GrowthEmbedSnippet label="HTML snippet" code="<a>x</a>" />);
    expect(screen.getByRole('region', { name: 'HTML snippet' })).toHaveTextContent('<a>x</a>');
    await user.click(screen.getByRole('button', { name: 'Copy snippet' }));
    expect(write).toHaveBeenCalledWith('<a>x</a>');
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
  });
  it('has no axe violations', async () => {
    const { container } = render(<GrowthEmbedSnippetDemo />);
    await expectNoAxeViolations(container);
  });
});
