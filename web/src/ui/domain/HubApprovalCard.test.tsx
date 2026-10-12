import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../../test/axe';
import { HubApprovalCard } from './HubApprovalCard';

describe('D1 HubApprovalCard', () => {
  it('shows actions until there is an outcome, with no axe violations', async () => {
    const { container, rerender } = render(
      <HubApprovalCard meta="X · mention" incoming="A question" draft="A reply" actions={<button type="button">Approve and send</button>} />,
    );
    expect(screen.getByText('A question').closest('blockquote')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Approve and send' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
    rerender(<HubApprovalCard meta="X · mention" draft="A reply" actions={<button type="button">Approve and send</button>} outcome="Sent" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Sent');
  });
  it('takes the emphasis style when blocked', () => {
    render(<HubApprovalCard meta="Threads" note="Blocked" blocked />);
    expect(screen.getByRole('article')).toHaveClass('emphasis');
  });
});
