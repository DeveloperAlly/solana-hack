import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe';
import { VerifyPaginationDemo } from './VerifyPagination.example';

describe('C20 VerifyPagination', () => {
  it('moves between pages and disables the ends', async () => {
    render(<VerifyPaginationDemo pageCount={2} />);
    const prev = screen.getByRole('button', { name: 'Previous' });
    const next = screen.getByRole('button', { name: 'Next' });
    expect(prev).toBeDisabled();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    await userEvent.click(next);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(next).toBeDisabled();
    await userEvent.click(prev);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });
  it('renders nothing for one page', () => {
    render(<VerifyPaginationDemo pageCount={1} />);
    expect(screen.queryByRole('navigation')).toBeNull();
  });
  it('has no axe violations', async () => {
    const { container } = render(<VerifyPaginationDemo />);
    await expectNoAxeViolations(container);
  });
});
