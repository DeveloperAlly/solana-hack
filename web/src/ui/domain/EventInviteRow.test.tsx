import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { List } from '../composites/ListRow';
import { EventInviteRow } from './EventInviteRow';
import { example } from './EventInviteRow.example';

const roles = [{ value: 'speaking', label: 'Speaking' }, { value: 'attending', label: 'Attending' }];

describe('D95 EventInviteRow', () => {
  it('renders with no axe violations, closed and choosing', async () => {
    const { container } = renderWithRouter(example.render());
    await userEvent.click(screen.getByRole('button', { name: 'Accept [Hackathon] demo day' }));
    await expectNoAxeViolations(container);
  });

  it('asks for a role, keeps Accept disabled until one is chosen, then accepts with it', async () => {
    const onAccept = vi.fn();
    renderWithRouter(<List label="New"><EventInviteRow name="[Meetup] night" detail="Online" roles={roles} onAccept={onAccept} onSkip={() => undefined} /></List>);
    await userEvent.click(screen.getByRole('button', { name: 'Accept [Meetup] night' }));
    const accept = screen.getByRole('button', { name: 'Accept' });
    expect(accept).toBeDisabled();
    await userEvent.selectOptions(screen.getByLabelText('Your role at [Meetup] night'), 'speaking');
    await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
    expect(onAccept).toHaveBeenCalledWith('speaking');
  });

  it('skips', async () => {
    const onSkip = vi.fn();
    renderWithRouter(<List label="New"><EventInviteRow name="[Meetup] night" detail="Online" roles={roles} onAccept={() => undefined} onSkip={onSkip} /></List>);
    await userEvent.click(screen.getByRole('button', { name: 'Skip [Meetup] night' }));
    expect(onSkip).toHaveBeenCalled();
  });
});
