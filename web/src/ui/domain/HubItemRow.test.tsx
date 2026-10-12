import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { HubItemRow } from './HubItemRow';

describe('D38 HubItemRow', () => {
  it('renders its slots and selected state with no axe violations', async () => {
    const { container } = render(
      <ul>
        <HubItemRow as="li" lead={<span>X post</span>} aside={<span>92%</span>} actions={<button type="button">Review</button>} selected>
          <p>Draft text</p>
        </HubItemRow>
      </ul>,
    );
    expect(screen.getByText('Draft text')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveClass('selected');
    expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
  it('opens the row with onSelect and reports selection', async () => {
    const onSelect = vi.fn();
    render(<HubItemRow onSelect={onSelect} selected><span>Open me</span></HubItemRow>);
    const button = screen.getByRole('button', { name: 'Open me' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(button);
    expect(onSelect).toHaveBeenCalled();
  });
});
