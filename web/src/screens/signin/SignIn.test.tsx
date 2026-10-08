import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter as renderAt } from '../../test/render';
import { SignIn } from './SignIn';

describe('SignIn', () => {
  it('asks for an email and rejects a malformed one without calling Supabase', async () => {
    renderAt(<SignIn />);
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in to build your brand' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Email me a code' }));
    expect(screen.getAllByRole('alert').some((a) => a.textContent?.includes('Enter an email address'))).toBe(true);
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });
  it('says so when the build has no Supabase settings', () => {
    renderAt(<SignIn />);
    expect(screen.getByText('Sign-in is not configured on this build')).toBeInTheDocument();
  });
});
