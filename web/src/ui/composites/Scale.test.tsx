import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { Scale } from './Scale';
import { example } from './Scale.example';

describe('C6 Scale', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getAllByRole('group')).toHaveLength(4);
    await expectNoAxeViolations(container);
  });

  it('names the end steps and changes value on click', async () => {
    const onChange = vi.fn();
    renderWithRouter(<Scale legend="Formality" startLabel="Casual" endLabel="Formal" value={2} onChange={onChange} />);
    const group = screen.getByRole('group', { name: 'Formality' });
    expect(within(group).getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByRole('radio', { name: /^1 *\(Casual\)$/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^5 *\(Formal\)$/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '2' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: '4' }));
    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it('locks every step when disabled', () => {
    renderWithRouter(<Scale legend="Emoji" startLabel="None" endLabel="Lots" value={1} steps={3} onChange={() => undefined} disabled />);
    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled());
  });
});
