import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { EventAddForm } from './EventAddForm';
import { example } from './EventAddForm.example';

const roles = [{ value: 'hosting', label: 'Hosting' }, { value: 'speaking', label: 'Speaking' }];

describe('D94 EventAddForm', () => {
  it('renders with no axe violations, including with errors shown', async () => {
    const { container } = renderWithRouter(example.render());
    await userEvent.click(screen.getByRole('button', { name: 'Add event' }));
    await expectNoAxeViolations(container);
  });

  it('shows every error, clears each as it is fixed, and submits only when valid', async () => {
    const onSubmit = vi.fn();
    renderWithRouter(<EventAddForm roles={roles} onSubmit={onSubmit} onCancel={() => undefined} />);
    expect(screen.getByLabelText('Your role')).toHaveValue('');
    await userEvent.click(screen.getByRole('button', { name: 'Add event' }));
    expect(screen.getByText('Name the event.')).toBeInTheDocument();
    expect(screen.getByText('Choose your role: it picks the content plan.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText('Event name'), '[[City] builders meetup');
    expect(screen.queryByText('Name the event.')).toBeNull();
    await userEvent.type(screen.getByLabelText(/^Place/), 'Melbourne');
    await userEvent.type(screen.getByLabelText('Date'), '2026-11-04');
    await userEvent.type(screen.getByLabelText('Starts at'), '18:00');
    await userEvent.selectOptions(screen.getByLabelText('Your role'), 'hosting');
    await userEvent.click(screen.getByRole('button', { name: 'Add event' }));
    expect(onSubmit).toHaveBeenCalledWith({ name: '[City] builders meetup', place: 'Melbourne', date: '2026-11-04', time: '18:00', role: 'hosting' });
  });
});
