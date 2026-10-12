import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { AppFrame } from './AppFrame';
import { example } from './AppFrame.example';

const items = [
  { id: 'a', label: 'Alpha', href: '/a' },
  { id: 'b', label: 'Beta', href: '/b' },
];

describe('L11 AppFrame', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByText('Build your brand: JamJam')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to campaigns' })).toBeInTheDocument();
    expect(screen.queryByRole('main')).toBeNull();
    await expectNoAxeViolations(container);
  });

  it('adds a skip link, a banner and one main landmark outside preview', async () => {
    const { container } = renderWithRouter(<AppFrame homeHref="/" context="Ctx"><p>body</p></AppFrame>);
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('body');
    await expectNoAxeViolations(container);
  });

  it('marks the current item from `current`, or from the URL when it is omitted', () => {
    const { unmount } = renderWithRouter(<AppFrame homeHref="/" nav={{ label: 'Top', items, current: 'b' }}>x</AppFrame>);
    expect(screen.getByRole('link', { name: 'Beta' })).toHaveAttribute('aria-current', 'page');
    unmount();
    renderWithRouter(<AppFrame homeHref="/" nav={{ label: 'Top', items }}>x</AppFrame>, '/a');
    expect(screen.getByRole('link', { name: 'Alpha' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Beta' })).not.toHaveAttribute('aria-current');
  });

  it('puts the nav in a bottom tab bar, after the main and footer, when placement is tabs', () => {
    renderWithRouter(<AppFrame homeHref="/" width="phone" footer={<button type="button">Join</button>} nav={{ label: 'Tabs', items, current: 'a', placement: 'tabs' }}>x</AppFrame>);
    const nav = screen.getByRole('navigation', { name: 'Tabs' });
    expect(within(screen.getByRole('banner')).queryByRole('navigation')).toBeNull();
    expect(screen.getByRole('main').compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
  });

  it('stacks the footer above the tab bar in one sticky bottom region, so they cannot overlap', () => {
    const { container } = renderWithRouter(<AppFrame homeHref="/" width="phone" footer={<button type="button">Publish</button>} nav={{ label: 'Tabs', items, current: 'a', placement: 'tabs' }}>x</AppFrame>);
    const regions = container.querySelectorAll('[data-frame-bottom]');
    expect(regions).toHaveLength(1);
    const [first, second] = Array.from(regions[0].children);
    expect(first).toContainElement(screen.getByRole('button', { name: 'Publish' }));
    expect(second).toBe(screen.getByRole('navigation', { name: 'Tabs' }));
    expect(regions[0]).toHaveClass('bottom');
  });

  it('puts the sticky footer in a footer landmark (axe region; PR #78)', async () => {
    const { container } = renderWithRouter(<AppFrame homeHref="/" width="phone" footer={<p>Publish is locked until the flags are fixed.</p>}><p>Body</p></AppFrame>);
    expect(within(screen.getByRole('contentinfo')).getByText(/Publish is locked/)).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
  it('keeps the pinned row inside the banner landmark (axe region; PR #78)', async () => {
    const { container } = renderWithRouter(<AppFrame homeHref="/" width="phone" pinned={<p>On-brand 74%</p>}><p>Body</p></AppFrame>);
    expect(within(screen.getByRole('banner')).getByText('On-brand 74%')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
  it('replaces the logo with a back link', () => {
    renderWithRouter(<AppFrame homeHref="/" back={{ href: '/list', label: 'Back' }} title="Detail">x</AppFrame>);
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/list');
    expect(screen.getByText('Detail')).toBeInTheDocument();
  });
});
