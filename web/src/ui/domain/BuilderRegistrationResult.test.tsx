import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderRegistrationResult.example';

describe('BuilderRegistrationResult', () => {
  it('shows the record, and the failure with retry and copy, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getAllByText('[sha256 of kit v1]')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent("We couldn't write the registration to Solana.");
    expect(screen.getByRole('link', { name: 'Retry registration' })).toHaveAttribute('href', '/system');
    expect(screen.getByRole('button', { name: 'Copy error details' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
