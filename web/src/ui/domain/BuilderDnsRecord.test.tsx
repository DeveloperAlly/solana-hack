import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderDnsRecord.example';

describe('BuilderDnsRecord', () => {
  it('shows the record with a copy action and the not-found causes, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByRole('table', { name: 'TXT record for jamjam.tech' })).toHaveTextContent('jamjam-verify=[unique value]');
    expect(screen.getByRole('button', { name: 'Copy value' })).toBeInTheDocument();
    expect(screen.getByText('Status: waiting for record')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent("We couldn't find the record on jamjam.tech");
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    await expectNoAxeViolations(container);
  });
});
