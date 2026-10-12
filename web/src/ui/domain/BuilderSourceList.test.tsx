import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderSourceList.example';

describe('BuilderSourceList', () => {
  it('lists rows with status, announces the failed one with its actions, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    const list = screen.getByRole('list', { name: 'Sources' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    const failed = screen.getByRole('alert');
    expect(failed).toHaveTextContent("Couldn't open this page");
    expect(within(failed.closest('li') as HTMLElement).getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.getByText('Done · 2 facts found')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
