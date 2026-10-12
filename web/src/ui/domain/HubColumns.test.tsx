import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../../test/axe';
import { HubColumns } from './HubColumns';

describe('L9 HubColumns', () => {
  it('lays out start, main and end in order with the right column classes, with no axe violations', async () => {
    const { container } = render(
      <HubColumns start={<nav aria-label="Rail">rail</nav>} end={<aside>pane</aside>} endWidth="equal"><p>main</p></HubColumns>,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveClass('cols', 'hasStart', 'equal');
    expect(root.textContent).toBe('railmainpane');
    expect(screen.getByRole('navigation', { name: 'Rail' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
  it('is a single main column without slots', () => {
    const { container } = render(<HubColumns><p>only</p></HubColumns>);
    expect(container.firstElementChild).toHaveClass('cols');
    expect(container.firstElementChild).not.toHaveClass('hasStart');
  });
});
