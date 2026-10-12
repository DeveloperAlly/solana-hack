import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { Select } from './Select';
import { example } from './Select.example';

describe('P13 Select', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByRole('combobox', { name: 'Industry' })).toHaveValue('Developer tools');
    expect(screen.getByRole('combobox', { name: 'Region' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Choose who approves posts.');
    expect(screen.getByRole('combobox', { name: 'Approval' })).toHaveAttribute('aria-invalid', 'true');
    await expectNoAxeViolations(container);
  });

  it('wires the hint to aria-describedby and accepts string options', () => {
    renderWithRouter(<Select label="Industry" hint="Pick the closest one." options={['A', 'B']} />);
    const select = screen.getByRole('combobox', { name: 'Industry' });
    expect(select).toHaveAccessibleDescription('Pick the closest one.');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['A', 'B']);
  });

  it('calls both onChange (event) and onValueChange (value)', async () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    renderWithRouter(<Select label="Sort" layout="inline" options={[{ value: 'a', label: 'First' }, { value: 'b', label: 'Second' }]} onChange={onChange} onValueChange={onValueChange} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sort' }), 'b');
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('puts className on the field wrapper and passes native props to the select', () => {
    renderWithRouter(<Select label="Format" className="placed" name="format" required options={['Zip']} />);
    const select = screen.getByRole('combobox', { name: 'Format' });
    expect(select.parentElement).toHaveClass('placed');
    expect(select).not.toHaveClass('placed');
    expect(select).toHaveAttribute('name', 'format');
    expect(select).toBeRequired();
  });

  it('works controlled in the inline sort layout', async () => {
    renderWithRouter(example.render());
    const sort = screen.getByRole('combobox', { name: 'Sort' });
    await userEvent.selectOptions(sort, 'payout');
    expect(sort).toHaveValue('payout');
  });
});
