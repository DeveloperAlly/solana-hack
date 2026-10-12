import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { VerifyReceiptLink } from './VerifyReceiptLink';
import { VerifyReceiptLinkDemo } from './VerifyReceiptLink.example';

describe('D32 VerifyReceiptLink', () => {
  it('links a signature to the devnet explorer in a new tab', () => {
    renderWithRouter(<VerifyReceiptLink signature="abc">receipt</VerifyReceiptLink>);
    const link = screen.getByRole('link', { name: /receipt/ });
    expect(link).toHaveAttribute('href', 'https://explorer.solana.com/tx/abc?cluster=devnet');
    expect(link).toHaveAttribute('target', '_blank');
  });
  it('shows the placeholder while pending', () => {
    renderWithRouter(<VerifyReceiptLink signature={null} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('[tx]')).toBeInTheDocument();
  });
  it('has no axe violations', async () => {
    const { container } = renderWithRouter(<VerifyReceiptLinkDemo />);
    await expectNoAxeViolations(container);
  });
});
