import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { GrowAreaCard } from './GrowAreaCard';
import { example } from './GrowAreaCard.example';

describe('D90 GrowAreaCard', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    await expectNoAxeViolations(container);
  });

  it('names the card by its heading and links to each board', () => {
    renderWithRouter(<GrowAreaCard title="Partners and leads" body="Agencies and leads." links={[{ label: 'Partners', href: '/p' }, { label: 'Leads', href: '/l' }]} />);
    const card = screen.getByRole('region', { name: 'Partners and leads' });
    expect(within(card).getByRole('link', { name: 'Leads' })).toHaveAttribute('href', '/l');
  });

  it('first run shows the first action in place of the links', () => {
    renderWithRouter(<GrowAreaCard title="Events" body="Events." firstAction={{ text: 'Add your first event.', link: { label: 'Add an event', href: '/e' } }} links={[{ label: 'Events', href: '/x' }]} />);
    expect(screen.getByText('Add your first event.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add an event' })).toHaveAttribute('href', '/e');
    expect(screen.queryByRole('link', { name: 'Events' })).toBeNull();
  });
});
