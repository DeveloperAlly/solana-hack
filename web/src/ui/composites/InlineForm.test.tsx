import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { InlineForm } from './InlineForm';
import { example } from './InlineForm.example';

const notEmpty = (v: string) => (v ? null : 'Required.');

describe('C30 InlineForm', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByRole('form', { name: 'Join with your email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add a brand' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('blocks an invalid submit, then clears the error as the person fixes it, and submits trimmed values', async () => {
    const onSubmit = vi.fn();
    renderWithRouter(<InlineForm label="F" fields={[{ name: 'a', label: 'A', validate: notEmpty }]} submitLabel="Save" onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Required.');
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.type(screen.getByRole('textbox', { name: 'A' }), '  hi ');
    expect(screen.queryByRole('alert')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({ a: 'hi' });
  });

  it('resets after a valid submit when asked', async () => {
    renderWithRouter(<InlineForm layout="row" resetOnSubmit fields={[{ name: 'url', label: 'Link' }]} submitLabel="Add" onSubmit={() => undefined} />);
    const input = screen.getByRole('textbox', { name: 'Link' });
    await userEvent.type(input, 'jamjam.tech');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(input).toHaveValue('');
  });

  it('opens from the trigger and closes on submit or Cancel', async () => {
    const onSubmit = vi.fn();
    renderWithRouter(<InlineForm triggerLabel="Add a brand" label="Add a brand" fields={[{ name: 'brand', label: 'Brand name' }]} submitLabel="Add brand" onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add a brand' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add a brand' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Brand name' }), 'aDNA');
    await userEvent.click(screen.getByRole('button', { name: 'Add brand' }));
    expect(onSubmit).toHaveBeenCalledWith({ brand: 'aDNA' });
    expect(screen.getByRole('button', { name: 'Add a brand' })).toBeInTheDocument();
  });

  it('disables submit while busy and shows the busy label', () => {
    renderWithRouter(<InlineForm label="F" fields={[{ name: 'a', label: 'A' }]} submitLabel="Save" busy busyLabel="Saving…" onSubmit={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(screen.getByRole('form', { name: 'F' })).toHaveAttribute('aria-busy', 'true');
  });

  it('drops a stale outside error once the person edits that field, and shows a new one from the parent', async () => {
    const field = [{ name: 'email', label: 'Email', validate: (v: string) => (v.includes('@') ? null : 'Enter an email.') }];
    const { rerender } = renderWithRouter(<InlineForm fields={field} errors={{ email: 'That email is taken.' }} submitLabel="Join" onSubmit={() => undefined} />);
    expect(screen.getByRole('alert')).toHaveTextContent('That email is taken.');
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'a@b.co');
    expect(screen.queryByRole('alert')).toBeNull();
    rerender(<InlineForm fields={field} errors={{ email: 'Still taken.' }} submitLabel="Join" onSubmit={() => undefined} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Still taken.');
  });

  it('shows outside errors, validates on mount, and renders a multiline field', () => {
    renderWithRouter(
      <InlineForm
        validateOnMount
        errors={{ voice: 'The server said no.' }}
        fields={[
          { name: 'url', label: 'Site', defaultValue: 'not a url', validate: (v) => (v.includes('.') ? null : 'Enter a web address.') },
          { name: 'voice', label: 'Voice', multiline: true, rows: 3 },
        ]}
        submitLabel="Go"
        onSubmit={() => undefined}
      />,
    );
    const alerts = screen.getAllByRole('alert').map((a) => a.textContent);
    expect(alerts).toEqual(['Enter a web address.', 'The server said no.']);
    expect(screen.getByRole('textbox', { name: 'Voice' }).tagName).toBe('TEXTAREA');
  });
});
