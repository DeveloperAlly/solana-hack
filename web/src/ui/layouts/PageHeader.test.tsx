import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { PageHeader } from './PageHeader';
import { example } from './PageHeader.example';

describe('L5 PageHeader', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByRole('heading', { level: 4, name: 'Quests' })).toBeInTheDocument();
    expect(screen.getByText('Drawn, not built. Defined in: canvas page Coming soon')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('defaults to a level 1 heading and renders only what it is given', () => {
    const { container } = renderWithRouter(<PageHeader title="Home" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    expect(container.querySelectorAll('p')).toHaveLength(0);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders the back link, badges and actions', () => {
    renderWithRouter(<PageHeader title="AI model" back={{ href: '/settings', label: 'Settings' }} badges={<span>flag</span>} actions={<button type="button">Do</button>} />);
    expect(screen.getByRole('link', { name: /Settings/ })).toHaveAttribute('href', '/settings');
    expect(screen.getByText('flag')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Do' })).toBeInTheDocument();
  });
});
