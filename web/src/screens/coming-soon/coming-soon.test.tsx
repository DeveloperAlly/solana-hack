// Flow and interaction tests for the "Coming soon" page (issue #51). Every screen renders through its registry entry at
// /screens/<Artboard>, as in the gallery; links to screens on other pages land on a probe that shows the path.
// axe for every screen, state and theme runs in src/gallery/gallery.test.tsx.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { screens } from './registry';
import { resetCampaignDraft } from './useCampaignFlow';

vi.mock('../../lib/supabase', () => ({ supabase: null }));

function Screen() {
  const { artboard } = useParams();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const entry = screens.find((s) => s.artboard === artboard);
  if (!entry) return <p>Probe: {pathname}</p>;
  return entry.render((params.get('state') as ScreenState | null) ?? entry.states[0]);
}

function at(path: string) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/screens/:artboard" element={<Screen />} />
        <Route path="*" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  );
  return user;
}
function Probe() {
  return <p>Probe: {useLocation().pathname}</p>;
}
const h1 = (name: string | RegExp) => screen.getByRole('heading', { level: 1, name });

let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  resetCampaignDraft();
  fetchSpy = vi.fn(() => { throw new Error('no network in the gallery'); });
  vi.stubGlobal('fetch', fetchSpy);
});
afterEach(() => {
  expect(fetchSpy).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe('registry', () => {
  it('registers all 17 artboards with the Coming soon tag', () => {
    expect(screens.map((s) => s.artboard).sort()).toEqual([
      'Brand-Switcher', 'Campaign-v2-3-Audience', 'Campaign-v2-4-Plan', 'Campaign-v2-5-Budget', 'Campaign-v2-6-Launch', 'Claims', 'Founder-Profile',
      'Media-Composer', 'Media-Review', 'Outcome-Log', 'Pricing', 'Publish-Calendar', 'Settings-AI', 'Settings-Connections', 'Settings-GetKey', 'Settings-Plan', 'Upgrade',
    ]);
    for (const s of screens) expect(s.tag).toBe('COMING SOON');
  });
  it.each(screens.map((s) => s.artboard))('%s shows the Coming soon flag', (artboard) => {
    at(`/screens/${artboard}`);
    expect(screen.getAllByText('Coming soon').length).toBeGreaterThan(0);
  });
});

describe('Settings flow', () => {
  it('tabs move between AI, Connections and Plan; connect and back work', async () => {
    const user = at('/screens/Settings-AI');
    await user.click(screen.getByRole('link', { name: 'Connections' }));
    expect(screen.getByRole('heading', { name: 'Publishing' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Plan' }));
    expect(screen.getByRole('heading', { name: 'Invoices' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'AI and keys' }));
    await user.click(screen.getByRole('link', { name: 'Connect OpenRouter' }));
    expect(h1('Get an AI key in a minute')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: '← Back to AI settings' }));
    expect(screen.getByRole('heading', { name: 'Model source, in order' })).toBeInTheDocument();
  });

  it('Settings-AI: adds an endpoint with validation, tests and removes the key', async () => {
    const user = at('/screens/Settings-AI');
    await user.click(screen.getByRole('button', { name: 'Add endpoint' }));
    await user.type(screen.getByLabelText(/Endpoint URL/), 'http://box.local');
    await user.click(screen.getByRole('button', { name: 'Save endpoint' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Use an https:// address.');
    await user.clear(screen.getByLabelText(/Endpoint URL/));
    await user.type(screen.getByLabelText(/Endpoint URL/), 'https://gpu.example.com/v1');
    await user.click(screen.getByRole('button', { name: 'Save endpoint' }));
    expect(screen.getByText('https://gpu.example.com/v1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Test key' }));
    expect(screen.getByText('That key works.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.getByText("No key stored. JamJam's default models are in use.")).toBeInTheDocument();
  });

  it('Settings-AI error state shows the key test failure', () => {
    at('/screens/Settings-AI?state=error');
    expect(screen.getByRole('alert')).toHaveTextContent("That key didn't work: [provider message]. Nothing was saved.");
  });

  it('Settings-GetKey: validates the pasted key, saves it, and connects OpenRouter', async () => {
    const user = at('/screens/Settings-GetKey');
    await user.click(screen.getByRole('button', { name: 'Save and test' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your API key.');
    await user.type(screen.getByLabelText('API key'), 'secret-key');
    await user.click(screen.getByRole('button', { name: 'Save and test' }));
    expect(screen.getByText(/Key saved and tested/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Connect OpenRouter' }));
    expect(screen.getByText(/OpenRouter is connected/)).toBeInTheDocument();
  });

  it('Settings-Connections: connect, reconnect and link the wallet change status', async () => {
    const user = at('/screens/Settings-Connections');
    await user.click(screen.getByRole('button', { name: 'Connect LinkedIn' }));
    await user.click(screen.getByRole('button', { name: 'Reconnect X' }));
    expect(screen.getAllByText('Connected')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Disconnect X' }));
    expect(screen.getAllByText('Connected')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Link wallet [address]' }));
    expect(screen.getByText('Linked')).toBeInTheDocument();
  });

  it('Settings-Plan: billing details toggle, invoice download, change plan goes to Pricing', async () => {
    const createObjectURL = vi.fn(() => 'blob:x');
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const user = at('/screens/Settings-Plan');
    await user.click(screen.getByRole('button', { name: 'Billing details' }));
    expect(screen.getByText(/Billing provider not chosen yet/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Download invoice [date]' }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    await user.click(screen.getByRole('link', { name: 'Change plan' }));
    expect(h1('Pricing')).toBeInTheDocument();
  });
});

describe('links keep the gallery theme', () => {
  it('every screen-to-screen link carries ?theme=', async () => {
    const user = at('/screens/Pricing?theme=wireframe-dark');
    expect(screen.getByRole('link', { name: 'Choose Solo' })).toHaveAttribute('href', '/screens/Upgrade?theme=wireframe-dark');
    await user.click(screen.getByRole('link', { name: 'Choose Solo' }));
    expect(screen.getByRole('link', { name: 'Compare plans' })).toHaveAttribute('href', '/screens/Pricing?theme=wireframe-dark');
  });
});

describe('Pricing to paid', () => {
  it('Choose Solo opens Upgrade; the email is validated; paying lands on the plan', async () => {
    const user = at('/screens/Pricing');
    expect(screen.getByRole('link', { name: 'Start free' })).toHaveAttribute('href', '/screens/Main');
    await user.click(screen.getByRole('link', { name: 'Choose Solo' }));
    expect(h1('Upgrade to Solo')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Billing email'), 'nope');
    await user.click(screen.getByRole('button', { name: 'Pay [price] and upgrade' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an email address');
    await user.clear(screen.getByLabelText('Billing email'));
    await user.type(screen.getByLabelText('Billing email'), 'owner@example.com');
    await user.click(screen.getByRole('button', { name: 'Pay [price] and upgrade' }));
    expect(screen.getByRole('heading', { name: "You're on Solo" })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'See your plan' }));
    expect(screen.getByRole('heading', { name: 'Invoices' })).toBeInTheDocument();
  });

  it('Upgrade error state says the payment failed and nothing was charged', () => {
    at('/screens/Upgrade?state=error');
    expect(screen.getByRole('alert')).toHaveTextContent("You haven't been charged.");
  });
});

describe('Media flow', () => {
  it('composer tabs switch, an empty slide blocks review, then review fixes the claim and approves', async () => {
    const user = at('/screens/Media-Composer');
    await user.click(screen.getByRole('tab', { name: 'Short video' }));
    expect(screen.getByRole('list', { name: 'Short video slides' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Carousel' }));
    // No format is pre-selected, and review waits for a real choice.
    expect(screen.getByRole('radio', { name: 'Image set' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'LinkedIn document (PDF)' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Check and review' })).toBeDisabled();
    expect(screen.getByText('Choose a format to continue.')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Image set' }));
    expect(screen.getByText('Exports one image per slide.')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'LinkedIn document (PDF)' }));
    expect(screen.getByText('Exports one PDF with a page per slide.')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Slide 1 · Hook text'));
    await user.click(screen.getByRole('button', { name: 'Check and review' }));
    expect(screen.getByText('Every slide needs text before review.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Slide 1 · Hook text'), 'New hook');
    await user.click(screen.getByRole('button', { name: 'Check and review' }));
    expect(h1('Review your carousel')).toBeInTheDocument();

    const approve = screen.getByRole('button', { name: 'Approve and register' });
    expect(approve).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Add a source for slide 3' }));
    await user.type(screen.getByLabelText(/Evidence URL/), 'https://example.com/customers');
    await user.click(screen.getByRole('button', { name: 'Attach source' }));
    expect(approve).toBeEnabled();
    await user.click(approve);
    expect(screen.getByRole('heading', { name: 'Approved and registered' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Schedule it' }));
    expect(h1('Schedule')).toBeInTheDocument();
  });

  it('Edit slides goes back to the composer', async () => {
    const user = at('/screens/Media-Review');
    await user.click(screen.getByRole('link', { name: 'Edit slides' }));
    expect(h1('Make a carousel')).toBeInTheDocument();
  });
});

describe('Campaign v2 flow (steps 2, 4, 5, 6 here; 1 and 3 on Superhub)', () => {
  it('audience: Back goes to Goal; Continue needs a segment and goes to Measure', async () => {
    const user = at('/screens/Campaign-v2-3-Audience');
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/screens/Campaign-v2-1-Goal');
    expect(screen.getByRole('checkbox', { name: /\[Audience segment 1\]/ })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: /\[Audience segment 1\]/ }));
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    await user.click(screen.getByRole('checkbox', { name: /\[Audience segment 1\]/ }));
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: /\[Audience segment 2\]/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Probe: /screens/Campaign-v2-2-Measure')).toBeInTheDocument();
  });

  it('plan, budget and launch chain, carrying the draft, and launch needs the cap approved', async () => {
    const user = at('/screens/Campaign-v2-3-Audience');
    await user.click(screen.getByRole('checkbox', { name: /\[Audience segment 2\]/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    // Measure (step 3) is a Superhub screen, so open step 4 directly; the draft carries over in memory.
    cleanup();
    const plan = at('/screens/Campaign-v2-4-Plan');
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/screens/Campaign-v2-2-Measure');
    await plan.click(screen.getByRole('button', { name: 'Remove Wed' }));
    expect(screen.queryByRole('rowheader', { name: 'Wed' })).not.toBeInTheDocument();
    await plan.click(screen.getByRole('button', { name: 'Restore removed items' }));
    expect(screen.getByRole('rowheader', { name: 'Wed' })).toBeInTheDocument();
    await plan.click(screen.getByRole('button', { name: 'Continue' }));
    expect(h1('New campaign: people and budget')).toBeInTheDocument();

    const payout = screen.getByRole('textbox', { name: 'Tutorial payout' });
    await plan.clear(payout);
    await plan.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Fix the payouts and the spending cap before you continue.')).toBeInTheDocument();
    await plan.type(payout, '40');
    await plan.clear(screen.getByLabelText('Spending cap (USDC)'));
    await plan.type(screen.getByLabelText('Spending cap (USDC)'), '300');
    await plan.click(screen.getByRole('button', { name: 'Continue' }));
    expect(h1('New campaign: review and launch')).toBeInTheDocument();

    const summary = screen.getByLabelText('Campaign summary');
    expect(within(summary).getByText('300 USDC')).toBeInTheDocument();
    expect(within(summary).getByText('1 segment(s) chosen')).toBeInTheDocument();
    // State machine: steps finished in this session link back from the stepper; the current step does not.
    const stepper = screen.getByRole('list', { name: 'Step 6 of 6' });
    expect(within(stepper).getByRole('link', { name: /People and budget/ })).toHaveAttribute('href', '/screens/Campaign-v2-5-Budget');
    expect(within(stepper).getByRole('link', { name: /Audience/ })).toBeInTheDocument();
    const launch = screen.getByRole('button', { name: 'Launch campaign' });
    expect(launch).toBeDisabled();
    await plan.click(screen.getByRole('checkbox', { name: 'I approve a spending cap of 300 USDC for this campaign.' }));
    await plan.click(launch);
    expect(screen.getByRole('heading', { name: 'Campaign launched' })).toBeInTheDocument();
    await plan.click(screen.getByRole('link', { name: 'Back' }));
    expect(h1('New campaign: people and budget')).toBeInTheDocument();
  });

  it('budget error state flags the cap; launch error state blocks launching', () => {
    at('/screens/Campaign-v2-5-Budget?state=error');
    expect(screen.getByText(/The cap is above your wallet balance/)).toBeInTheDocument();
    cleanup();
    at('/screens/Campaign-v2-6-Launch?state=error');
    expect(screen.getByText(/Blocked: the cap is above your wallet balance/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Launch campaign' })).toBeDisabled();
  });
});

describe('Publishing calendar', () => {
  it('picks an open slot and schedules an approved post; copy and reconnect work', async () => {
    const user = at('/screens/Publish-Calendar');
    await user.click(screen.getAllByRole('button', { name: '[open slot]' })[0]);
    expect(screen.getByRole('radio', { name: '[approved post 2]' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Schedule here' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: '[approved post 2]' }));
    await user.click(screen.getByRole('button', { name: 'Schedule here' }));
    expect(screen.getAllByRole('button', { name: '[open slot]' })).toHaveLength(1);
    expect(screen.getByText('[time] LinkedIn · [approved post 2]')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy and post myself' }));
    expect(await navigator.clipboard.readText()).toBe('[approved post text]');
    await user.click(screen.getByRole('link', { name: 'Reconnect and retry' }));
    expect(screen.getByRole('heading', { name: 'Publishing' })).toBeInTheDocument();
  });
});

describe('Claims', () => {
  it('filters by status, attaches evidence, registers and renews', async () => {
    const user = at('/screens/Claims');
    await user.click(screen.getByRole('button', { name: 'Pending' }));
    expect(screen.getAllByRole('rowheader')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'All' }));
    await user.click(screen.getByRole('button', { name: /^Add evidence for/ }));
    await user.click(screen.getByRole('button', { name: 'Attach and approve' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter the evidence.');
    await user.type(screen.getByLabelText(/^Evidence/), 'https://example.com/brands');
    await user.click(screen.getByRole('button', { name: 'Attach and approve' }));
    expect(screen.getAllByRole('button', { name: /^Register/ })).toHaveLength(2);
    await user.click(screen.getAllByRole('button', { name: /^Register/ })[0]);
    expect(screen.getByText('Registered')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Renew/ }));
    expect(screen.queryByRole('button', { name: /^Renew/ })).not.toBeInTheDocument();
  });
  it('empty state says claims start empty', () => {
    at('/screens/Claims?state=empty');
    expect(screen.getByText('No claims yet. Claims start empty until evidence is attached.')).toBeInTheDocument();
  });
});

describe('Brands and founder', () => {
  it('switches brand, adds one with validation, and opens the founder profile', async () => {
    const user = at('/screens/Brand-Switcher');
    await user.click(screen.getByRole('button', { name: 'Switch to aDNA' }));
    expect(screen.getByRole('button', { name: 'Switch to JamJam' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add a brand' }));
    await user.type(screen.getByLabelText('Brand name'), 'GamersLab');
    await user.type(screen.getByLabelText(/Website domain/), 'not a domain');
    await user.click(screen.getByRole('button', { name: 'Add brand' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a domain');
    await user.clear(screen.getByLabelText(/Website domain/));
    await user.type(screen.getByLabelText(/Website domain/), 'gamerslab.example');
    await user.click(screen.getByRole('button', { name: 'Add brand' }));
    expect(screen.getByRole('button', { name: 'Switch to GamersLab' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Open [Founder name]' }));
    expect(h1('Founder profile: [Founder name]')).toBeInTheDocument();
  });

  it('founder profile adds and removes sources and toggles shared stories', async () => {
    const user = at('/screens/Founder-Profile');
    await user.click(screen.getByRole('button', { name: 'Add a source' }));
    await user.type(screen.getByLabelText('Source'), 'Conference talk');
    await user.click(screen.getByRole('button', { name: 'Add source' }));
    expect(screen.getByText('Conference talk')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove Conference talk' }));
    expect(screen.queryByText('Conference talk')).not.toBeInTheDocument();
    const shared = screen.getByRole('checkbox', { name: 'Stories you approve can be used by both kits.' });
    expect(screen.getByText('Approved stories are shared with the linked brand kit.')).toBeInTheDocument();
    await user.click(shared);
    expect(shared).not.toBeChecked();
    expect(screen.getByText('Stories stay in this profile only.')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Your brands' }));
    expect(h1('Your brands')).toBeInTheDocument();
  });
});

describe('Outcome log', () => {
  it('filters by audience fit and sorts', async () => {
    const user = at('/screens/Outcome-Log');
    expect(screen.getAllByRole('rowheader')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Unsure' }));
    expect(screen.getAllByRole('row')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'All' }));
    await user.click(screen.getByRole('button', { name: /Fits your audience/ }));
    expect(screen.getByRole('columnheader', { name: /Fits your audience/ })).toHaveAttribute('aria-sort', 'ascending');
  });
});
