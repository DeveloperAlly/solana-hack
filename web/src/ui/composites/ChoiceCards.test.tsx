import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { ChoiceCards } from './ChoiceCards';
import { example } from './ChoiceCards.example';

describe('C7 ChoiceCards', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    await expectNoAxeViolations(container);
  });

  it('names each input from title and tag and describes it with the body', async () => {
    const onChange = vi.fn();
    renderWithRouter(<ChoiceCards legend="Pick" value="" onChange={onChange} options={[{ value: 'a', title: 'A', tag: 'Plain', body: 'Body text' }]} />);
    const radio = screen.getByRole('radio', { name: 'A Plain' });
    expect(radio).toHaveAccessibleDescription('Body text');
    await userEvent.click(radio);
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('toggles values in checkbox mode', async () => {
    const onChange = vi.fn();
    renderWithRouter(<ChoiceCards multiple legend="Where" value={['x']} onChange={onChange} options={[{ value: 'x', title: 'X' }, { value: 'y', title: 'Y' }]} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Y' }));
    expect(onChange).toHaveBeenLastCalledWith(['x', 'y']);
    await userEvent.click(screen.getByRole('checkbox', { name: 'X' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
