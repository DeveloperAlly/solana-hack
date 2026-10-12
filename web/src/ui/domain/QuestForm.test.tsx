import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { emptyQuestDraft } from '../../domain/quest';
import { QuestForm } from './QuestForm';
import { example } from './QuestForm.example';

describe('D105 QuestForm', () => {
  it('renders with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    await expectNoAxeViolations(container);
  });

  it('keeps Open disabled until every field is valid, and computes the cap', async () => {
    const onOpen = vi.fn();
    renderWithRouter(<QuestForm initial={emptyQuestDraft} onOpen={onOpen} />);
    const open = screen.getByRole('button', { name: 'Open quest' });
    expect(screen.getByLabelText('Format')).toHaveValue('');
    expect(open).toHaveAccessibleDescription('Say what someone should do.');
    await userEvent.type(screen.getByLabelText('Task'), 'Write a tutorial');
    expect(open).toHaveAccessibleDescription('Choose a format.');
    await userEvent.selectOptions(screen.getByLabelText('Format'), 'tutorial');
    await userEvent.type(screen.getByLabelText('Reward per completion (USDC)'), '12.505');
    expect(open).toBeDisabled();
    await userEvent.clear(screen.getByLabelText('Reward per completion (USDC)'));
    await userEvent.type(screen.getByLabelText('Reward per completion (USDC)'), '12.50');
    await userEvent.type(screen.getByLabelText('Slots'), '4');
    expect(screen.getByLabelText('Budget cap')).toHaveValue('50.00 USDC, held before the quest opens');
    expect(open).toBeEnabled();
    await userEvent.click(open);
    expect(onOpen).toHaveBeenCalledWith({ task: 'Write a tutorial', format: 'tutorial', reward: '12.50', slots: '4', due: '' });
  });
});
