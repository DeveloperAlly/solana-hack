import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderScreen } from './renderScreen';

describe('Hub navigation, home, content and analytics', () => {
  it('the hub nav links every section, keeps the gallery theme, and marks the current one', async () => {
    renderScreen('Hub-Home', undefined, 'wireframe-dark');
    const nav = screen.getByRole('navigation', { name: 'Hub' });
    for (const label of ['Home', 'Inbox', 'Brand', 'Create', 'Grow', 'Analytics', 'Ledger']) {
      expect(within(nav).getByRole('link', { name: new RegExp(`^${label}`) }).getAttribute('href')).toContain('theme=wireframe-dark');
    }
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(within(nav).getByRole('link', { name: /^Grow/ }));
    expect(screen.getByRole('heading', { level: 1, name: /Engagement/ })).toBeInTheDocument();
    const grow = screen.getByRole('navigation', { name: 'Grow' });
    await userEvent.click(within(grow).getByRole('link', { name: 'Partners' }));
    expect(screen.getByRole('heading', { level: 1, name: /Partners/ })).toBeInTheDocument();
  });

  it('Hub-Home: KPI tiles and Needs-you items open their queues', async () => {
    renderScreen('Hub-Home');
    await userEvent.click(screen.getByRole('link', { name: /Replies drafted/ }));
    expect(screen.getByRole('heading', { level: 1, name: /Engagement/ })).toBeInTheDocument();
  });

  it('Hub-Home: Review on the inbox item opens Needs reply', async () => {
    renderScreen('Hub-Home');
    await userEvent.click(screen.getAllByRole('link', { name: 'Review' })[0]);
    expect(screen.getByRole('heading', { level: 1, name: /Needs reply/ })).toBeInTheDocument();
  });

  it('Hub-Home: Review on the Blog item opens the Blog draft, not another one', async () => {
    renderScreen('Hub-Home');
    const blog = screen.getByText(/Why agents need shared project context/).closest('li') as HTMLElement;
    await userEvent.click(within(blog).getByRole('button', { name: 'Review' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Blog · Technical voice' })).toBeInTheDocument();
  });

  it('Draft-Review opened without a draft id says the draft was not found (no default draft)', async () => {
    const { draftReview } = await import('../DraftReview.fixtures');
    const { render } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router');
    const { DraftReview } = await import('../DraftReview');
    render(<MemoryRouter><DraftReview data={draftReview} /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1, name: 'Draft not found' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
  });

  it('the brand switcher changes the brand shown in the header', async () => {
    renderScreen('Hub-Home');
    await userEvent.click(screen.getByRole('button', { name: 'aDNA, switch brand' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: /film\.fun/ }));
    expect(screen.getByRole('button', { name: 'film.fun, switch brand' })).toBeInTheDocument();
    expect(within(screen.getByRole('banner')).getAllByText('film.fun').length).toBeGreaterThan(0);
  });

  it('Content: the channel filter and tabs change the list; Review opens the draft', async () => {
    renderScreen('Content-Dashboard');
    expect(screen.getAllByRole('button', { name: /^Review / })).toHaveLength(6);
    await userEvent.click(screen.getByRole('button', { name: 'X' }));
    expect(screen.getAllByRole('button', { name: /^Review / })).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: 'TikTok' }));
    expect(screen.getByText('Nothing in needs approval for TikTok')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Replies (4)' }));
    expect(screen.getByRole('link', { name: 'Open the reply queue' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: /Needs approval/ }));
    await userEvent.click(screen.getByRole('button', { name: 'All' }));
    await userEvent.click(screen.getAllByRole('button', { name: /^Review / })[0]);
    expect(screen.getByRole('heading', { level: 1, name: 'X post · Core voice' })).toBeInTheDocument();
  });

  it('Content-Dashboard-Empty offers three starts', async () => {
    renderScreen('Content-Dashboard-Empty', 'empty');
    expect(screen.getByRole('heading', { name: 'Nothing waiting for you' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Start a campaign' }));
    expect(screen.getByRole('heading', { level: 1, name: "What's this campaign for?" })).toBeInTheDocument();
  });

  it('Analytics: the range select changes the numbers shown; a suggestion applies with Undo', async () => {
    renderScreen('Analytics');
    expect(screen.getByText('64')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Range' }), 'Launch week');
    expect(screen.queryByText('64')).toBeNull();
    expect(screen.getAllByText('No numbers for this range yet.').length).toBeGreaterThan(0);
    expect(screen.getByText(/Launch week · all platforms/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: "Apply to next week's plan" }));
    expect(screen.getByText("Applied to next week's plan.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('button', { name: "Apply to next week's plan" })).toBeInTheDocument();
  });

  it('Analytics-Empty: Connect starts collecting; Reconnect clears the missing-dates error', async () => {
    renderScreen('Analytics-Empty', 'error');
    expect(screen.getByRole('alert')).toHaveTextContent('Instagram disconnected');
    await userEvent.click(screen.getByRole('button', { name: 'Connect Discord' }));
    expect(screen.getAllByText('Collecting…')).toHaveLength(2);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reconnect' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('Analytics links', () => {
  it('Analytics links to its connect view (Analytics-Empty), and back', async () => {
    renderScreen('Analytics');
    await userEvent.click(screen.getByRole('link', { name: 'Connected accounts' }));
    expect(screen.getByRole('heading', { name: 'Connect your accounts to see performance' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: "See what's working" }));
    expect(screen.getByText('64')).toBeInTheDocument();
  });
});
