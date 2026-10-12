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
import { resetMediaDraft } from './useMediaFlow';
import { resetSoonSession } from './useSoonSession';
import { MediaReview } from './Media-Review';
import { mediaComposer } from './Media-Composer.fixtures';

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
  resetMediaDraft();
  resetSoonSession();
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
    await user.click(screen.getByRole('button', { name: 'Pay [Solo price] and upgrade' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an email address');
    await user.clear(screen.getByLabelText('Billing email'));
    await user.type(screen.getByLabelText('Billing email'), 'owner@example.com');
    await user.click(screen.getByRole('button', { name: 'Pay [Solo price] and upgrade' }));
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
    // Slide 1 was edited, so its checks must run again on the new text before approval.
    expect(approve).toBeDisabled();
    expect(screen.getByText('Slide 1 changed since its checks ran. Re-run the checks to approve.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Re-run checks' }));
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
    expect(within(summary).getByText('[Audience segment 2]')).toBeInTheDocument();
    expect(within(summary).getByText('[n] brand posts · [n] ambassador pieces · days: Mon, Wed')).toBeInTheDocument();
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

// Values changed on one screen must show on every later screen; fixtures are only the defaults (coordinator audit,
// Codex review on PR #79).
describe('upstream values flow downstream', () => {
  it('Choose Team checks out Team, and the paid plan shows on Settings-Plan', async () => {
    const user = at('/screens/Pricing');
    await user.click(screen.getByRole('link', { name: 'Choose Team' }));
    expect(h1('Upgrade to Team')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Team, monthly' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Billing email'), 'owner@example.com');
    await user.click(screen.getByRole('button', { name: 'Pay [Team price] and upgrade' }));
    expect(screen.getByRole('heading', { name: "You're on Team" })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'See your plan' }));
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.queryByText('[Plan name]')).not.toBeInTheDocument();
  });

  it('composer edits, media type and format reach Media-Review', async () => {
    const user = at('/screens/Media-Composer');
    await user.clear(screen.getByLabelText('Slide 1 · Hook text'));
    await user.type(screen.getByLabelText('Slide 1 · Hook text'), 'Edited hook');
    await user.click(screen.getByRole('radio', { name: 'Image set' }));
    await user.click(screen.getByRole('button', { name: 'Check and review' }));
    expect(h1('Review your carousel')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Edited hook' })).toBeInTheDocument();
    expect(screen.getByText('Format: Image set. Exports one image per slide.')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Edit slides' }));
    expect(screen.getByLabelText('Slide 1 · Hook text')).toHaveValue('Edited hook');
    expect(screen.getByRole('radio', { name: 'Image set' })).toBeChecked();
    await user.click(screen.getByRole('tab', { name: 'Short video' }));
    expect(h1('Make a short video')).toBeInTheDocument();
  });

  it('a source attached on Media-Review approves the claim on Claims', async () => {
    const user = at('/screens/Media-Review');
    await user.click(screen.getByRole('button', { name: 'Add a source for slide 3' }));
    await user.type(screen.getByLabelText(/Evidence URL/), 'https://example.com/brands');
    await user.click(screen.getByRole('button', { name: 'Attach source' }));
    cleanup();
    at('/screens/Claims');
    expect(screen.getByRole('button', { name: 'Register "[n] brands use JamJam"' })).toBeInTheDocument();
    expect(screen.getByText('https://example.com/brands')).toBeInTheDocument();
  });

  it('the brand chosen on Brand-Switcher carries to the hub frame on other screens', async () => {
    const user = at('/screens/Brand-Switcher');
    await user.click(screen.getByRole('button', { name: 'Switch to aDNA' }));
    expect(screen.getByRole('button', { name: 'aDNA, switch brand' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Open [Founder name]' }));
    expect(screen.getByRole('button', { name: 'aDNA, switch brand' })).toBeInTheDocument();
  });

  it('a key saved on Settings-GetKey shows on Settings-AI; OpenRouter shows connected', async () => {
    const user = at('/screens/Settings-GetKey');
    await user.type(screen.getByLabelText('API key'), 'placeholder-key-1234');
    await user.click(screen.getByRole('button', { name: 'Save and test' }));
    await user.click(screen.getByRole('button', { name: 'Connect OpenRouter' }));
    await user.click(screen.getByRole('link', { name: '← Back to AI settings' }));
    expect(screen.getByText('Key ending …1234 · added [date]')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Connect OpenRouter' })).not.toBeInTheDocument();
  });

  it('reconnecting X on Settings-Connections lets the calendar retry the failed post', async () => {
    const user = at('/screens/Settings-Connections');
    await user.click(screen.getByRole('button', { name: 'Reconnect X' }));
    cleanup();
    const cal = at('/screens/Publish-Calendar');
    await cal.click(screen.getByRole('button', { name: 'Retry now' }));
    expect(screen.queryByText(/A post didn't go out/)).not.toBeInTheDocument();
    expect(screen.getByText('09:00 X · [title]')).toBeInTheDocument();
  });
});

describe('review fixes (Codex, PR #79)', () => {
  it('Cancel on the calendar clears the whole selection', async () => {
    const user = at('/screens/Publish-Calendar');
    await user.click(screen.getAllByRole('button', { name: '[open slot]' })[0]);
    await user.click(screen.getByRole('radio', { name: '[approved post 1]' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('radio', { name: '[approved post 1]' })).not.toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: '[open slot]' })[1]);
    expect(screen.getByRole('radio', { name: '[approved post 1]' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Schedule here' })).toBeDisabled();
  });

  it('added sources get unique ids, so removing one never removes another', async () => {
    const user = at('/screens/Founder-Profile?state=empty');
    for (const name of ['Talk A', 'Talk B']) {
      await user.click(screen.getByRole('button', { name: 'Add a source' }));
      await user.type(screen.getByLabelText('Source'), name);
      await user.click(screen.getByRole('button', { name: 'Add source' }));
    }
    await user.click(screen.getByRole('button', { name: 'Remove Talk A' }));
    await user.click(screen.getByRole('button', { name: 'Add a source' }));
    await user.type(screen.getByLabelText('Source'), 'Talk C');
    await user.click(screen.getByRole('button', { name: 'Add source' }));
    await user.click(screen.getByRole('button', { name: 'Remove Talk B' }));
    expect(screen.getByText('Talk C')).toBeInTheDocument();
    expect(screen.queryByText('Talk B')).not.toBeInTheDocument();
  });
});

describe('review fixes, round 3 (Codex, PR #79)', () => {
  it('a slop failure alone blocks approval, and its badge and the gate agree', () => {
    render(
      <MemoryRouter>
        <MediaReview data={{ formats: mediaComposer.formats, checks: { 1: { claims: 'backed', slop: 'failed', alt: '[alt]' } } }} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Failed · blocked')).toBeInTheDocument();
    expect(screen.getByText('Slide 1 failed the no-AI-slop check. Edit the slide to approve.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve and register' })).toBeDisabled();
  });

  it('checks follow the media type: an image card has one slide to check', async () => {
    const user = at('/screens/Media-Composer');
    await user.click(screen.getByRole('tab', { name: 'Image card' }));
    await user.click(screen.getByRole('radio', { name: 'Image set' }));
    await user.click(screen.getByRole('button', { name: 'Check and review' }));
    expect(h1('Review your image card')).toBeInTheDocument();
    expect(screen.getAllByRole('rowheader')).toHaveLength(1);
    expect(screen.getByRole('cell', { name: '[headline]' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve and register' })).toBeEnabled();
  });

  it('the carousel review checks every slide of the draft', () => {
    at('/screens/Media-Review');
    expect(screen.getAllByRole('rowheader')).toHaveLength(4);
    expect(screen.getAllByText('No claims')).toHaveLength(2);
  });

  it('a scheduled post leaves the other pickers and comes back when unscheduled', async () => {
    const user = at('/screens/Publish-Calendar');
    await user.click(screen.getAllByRole('button', { name: '[open slot]' })[0]);
    await user.click(screen.getByRole('radio', { name: '[approved post 1]' }));
    await user.click(screen.getByRole('button', { name: 'Schedule here' }));
    await user.click(screen.getByRole('button', { name: '[open slot]' }));
    expect(screen.queryByRole('radio', { name: '[approved post 1]' })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '[approved post 2]' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Unschedule [approved post 1]' }));
    expect(screen.getAllByRole('button', { name: '[open slot]' })).toHaveLength(2);
    await user.click(screen.getAllByRole('button', { name: '[open slot]' })[1]);
    expect(screen.getByRole('radio', { name: '[approved post 1]' })).toBeInTheDocument();
  });
});

describe('review fixes, round 4 (Codex, PR #79)', () => {
  it('editing the claim off slide 3 and re-running the checks clears the block', async () => {
    const user = at('/screens/Media-Composer');
    await user.click(screen.getByRole('button', { name: 'Edit slide 3 · Proof' }));
    await user.clear(screen.getByLabelText('Slide 3 · Proof text'));
    await user.type(screen.getByLabelText('Slide 3 · Proof text'), 'Every post is checked before it goes out');
    await user.click(screen.getByRole('radio', { name: 'Image set' }));
    await user.click(screen.getByRole('button', { name: 'Check and review' }));
    expect(screen.getAllByText('Re-run needed')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Approve and register' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Re-run checks' }));
    expect(screen.queryByText('Unsupported · blocked')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve and register' })).toBeEnabled();
  });

  it('session changes are scoped to the active brand', async () => {
    const user = at('/screens/Settings-Connections');
    await user.click(screen.getByRole('button', { name: 'Reconnect X' }));
    expect(screen.queryByText('Expired')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'JamJam, switch brand' }));
    await user.click(screen.getByRole('menuitemradio', { name: /aDNA/ }));
    expect(screen.getByText('Expired')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'aDNA, switch brand' }));
    await user.click(screen.getByRole('menuitemradio', { name: /JamJam/ }));
    expect(screen.queryByText('Expired')).not.toBeInTheDocument();
  });

  it('connecting OpenRouter moves "In use" to it and makes the default the fallback', async () => {
    const user = at('/screens/Settings-GetKey');
    await user.click(screen.getByRole('button', { name: 'Connect OpenRouter' }));
    await user.click(screen.getByRole('link', { name: '← Back to AI settings' }));
    const sources = screen.getByRole('list', { name: 'Model sources' });
    const rows = within(sources).getAllByRole('listitem');
    expect(within(rows[0]).getByText('In use')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Fallback')).toBeInTheDocument();
    expect(within(sources).getAllByText('In use')).toHaveLength(1);
  });
});
