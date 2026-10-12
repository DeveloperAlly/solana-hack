import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { CollapsibleText } from './CollapsibleText';
import { example } from './CollapsibleText.example';

describe('C33 CollapsibleText', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getAllByRole('button')).toHaveLength(2);
    await expectNoAxeViolations(container);
  });

  it('toggles between collapsed and expanded', async () => {
    renderWithRouter(<CollapsibleText text="Long text" collapsible lines={3} />);
    const button = screen.getByRole('button', { name: 'Read more' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Long text')).toHaveClass('clamped', 'l3');
    await userEvent.click(button);
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Long text')).not.toHaveClass('clamped');
  });

  it('shows the full text with no button when not collapsible', () => {
    renderWithRouter(<CollapsibleText text="Short" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
