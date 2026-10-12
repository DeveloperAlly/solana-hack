import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { StatusList } from './StatusList';
import { example } from './StatusList.example';

describe('C32 StatusList', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByRole('heading', { name: 'Checks' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the ledger' })).toHaveAttribute('href', '/system');
    expect(screen.getByRole('alert')).toHaveTextContent('example.com/blocked');
    await expectNoAxeViolations(container);
  });

  it('labels the list and renders a chip per row, actions only where given', () => {
    renderWithRouter(<StatusList label="Sources" rows={[{ id: 'a', label: 'A', status: 'Done' }, { id: 'b', label: 'B' }]} actions={(r) => (r.id === 'a' ? <button type="button">Remove A</button> : null)} />);
    const list = screen.getByRole('list', { name: 'Sources' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
