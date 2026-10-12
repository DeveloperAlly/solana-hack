import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { ApprovalItem } from './ApprovalItem';
import { example } from './ApprovalItem.example';

describe('D1 ApprovalItem', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getAllByRole('article')).toHaveLength(4);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    await expectNoAxeViolations(container);
  });

  it('replaces the actions with the outcome once there is one', () => {
    renderWithRouter(<ApprovalItem meta="m" draft="d" actions={<button type="button">Approve</button>} outcome="Sent" />);
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Sent');
  });

  it('keeps a status line alongside the actions and renders the panel slot', () => {
    renderWithRouter(
      <ul>
        <ApprovalItem surface="row" meta="m" status="Approved · not paid yet" actions={<button type="button">Pay</button>}>
          <p>panel</p>
        </ApprovalItem>
      </ul>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Approved · not paid yet');
    expect(screen.getByRole('button', { name: 'Pay' })).toBeInTheDocument();
    expect(screen.getByText('panel')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('shows numeric 0 in its slots', () => {
    renderWithRouter(<ApprovalItem meta="m" note={0} draft={0} />);
    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  it('blocked cards take the emphasis variant', () => {
    const { container } = renderWithRouter(<ApprovalItem meta="m" blocked />);
    expect(container.querySelector('article')?.className).toMatch(/emphasis/);
  });
});
