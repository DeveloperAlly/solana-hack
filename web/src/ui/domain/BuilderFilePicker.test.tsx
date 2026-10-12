import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderFilePicker.example';

describe('BuilderFilePicker', () => {
  it('passes the chosen file names on, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    const input = screen.getByLabelText('Browse files');
    expect(input).toHaveAccessibleDescription('PDF, Markdown, DOCX.');
    await userEvent.upload(input, [new File(['# Guide'], 'brand-guide.md', { type: 'text/markdown' })]);
    expect(screen.getByText('Chosen: brand-guide.md')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
