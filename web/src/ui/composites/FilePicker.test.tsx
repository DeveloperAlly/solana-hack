import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { FilePicker } from './FilePicker';
import { example } from './FilePicker.example';

describe('C14 FilePicker', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByLabelText('Browse files')).toHaveAccessibleDescription('PDF, Markdown or DOCX');
    expect(screen.getByLabelText('Upload it as a file')).toBeDisabled();
    await expectNoAxeViolations(container);
  });

  it('passes the chosen files and resets the input', async () => {
    const onFiles = vi.fn();
    renderWithRouter(<FilePicker label="Browse files" multiple onFiles={onFiles} />);
    const input = screen.getByLabelText('Browse files') as HTMLInputElement;
    const a = new File(['a'], 'a.pdf', { type: 'application/pdf' });
    const b = new File(['b'], 'b.md', { type: 'text/markdown' });
    await userEvent.upload(input, [a, b]);
    expect(onFiles).toHaveBeenCalledWith([a, b]);
    expect(input.value).toBe('');
  });
});
