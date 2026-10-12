import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { StatusTimeline } from './StatusTimeline';
import { example } from './StatusTimeline.example';

describe('C9 StatusTimeline', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByRole('list', { name: 'Post status' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('speaks each state and marks the current or failed step', () => {
    renderWithRouter(<StatusTimeline steps={[{ label: 'A', state: 'done' }, { label: 'B', state: 'failed', note: 'why' }, { label: 'C', state: 'todo' }]} />);
    const items = within(screen.getByRole('list', { name: 'Status' })).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('A (done)');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[1]).toHaveTextContent('B (failed)why');
    expect(items[2]).not.toHaveAttribute('aria-current');
  });
});
