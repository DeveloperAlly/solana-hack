import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { GalleryScreen } from '../../gallery/Gallery';
import { effectiveGates, recordDecision, resetBuilderFlow, type FlowState } from './useBuilderFlow';
import { screenPath } from '../../gallery/screenPath';
import { boards } from './paths';
import { Onboard6Published } from './Onboard-6-Published';
import { publishedData } from './Onboard-6-Published.fixtures';

// Brand Builder flows (issue #50), run through the gallery routes the screens are registered on.
vi.mock('../../lib/supabase', () => ({ supabase: null }));

function at(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/screens/:artboard" element={<GalleryScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}
const h1 = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name });
const click = async (name: string | RegExp, role: 'button' | 'link' = 'button') => userEvent.click(await screen.findByRole(role, { name }));
const approveAndContinue = async (subject: string) => {
  await click(`Approve ${subject}`);
  await click('Continue', 'link');
};

beforeEach(() => resetBuilderFlow());

describe('Brand Builder: onboarding and wizard, end to end', () => {
  it('signs in, skips the domain, runs intake 1–6 through the three gates, approves kit v1', { timeout: 30000 }, async () => {
    at(screenPath(boards.signIn));
    await userEvent.type(screen.getByLabelText('Work email'), '{Control>}a{/Control}you@jamjam.tech');
    await click('Send code');
    await userEvent.type(screen.getByLabelText('Enter the code we sent'), '12345678');
    await click('Continue');
    await h1('Prove you own your domain');
    await click('Skip, continue unverified', 'link');
    await h1('The basics');
    expect(screen.getByText('Unverified')).toBeInTheDocument();
    expect(screen.getByText('Fallback')).toBeInTheDocument();
    const links = screen.getByLabelText(/^Links/);
    await userEvent.clear(links);
    await userEvent.type(links, 'jamjam.tech{Enter}docs.jamjam.tech');
    await click('Continue: read my links');
    await h1('What should we read?');
    expect(screen.getByText('docs.jamjam.tech')).toBeInTheDocument();
    expect(screen.queryByText('[2023 press or docs links]')).not.toBeInTheDocument();
    await click('Read my sources', 'link');
    await h1('Reading your sources');
    expect(screen.getByText('docs.jamjam.tech')).toBeInTheDocument();
    await click('Continue to the next question', 'link');
    await h1('How it started');
    await click('Continue', 'link');
    await h1('What, how and why');
    await click('Draft my purpose', 'link');
    await h1('Approve your purpose');
    await click('Approve purpose');
    expect(screen.getByText(/Decision recorded: you@jamjam\.tech/)).toBeInTheDocument();
    await click('Continue', 'link');
    await h1('Alternatives and your edge');
    await userEvent.click(screen.getByRole('radio', { name: /Option B/ }));
    await click('Continue with option B', 'link');
    await h1('Approve your positioning');
    expect(screen.getByText('AI draft from option B · confirm')).toBeInTheDocument();
    await approveAndContinue('positioning');
    await h1("Who it's for");
    await click('Continue', 'link');
    await h1('Pick the one that sounds like you');
    await userEvent.click(within(screen.getByRole('group', { name: 'Formality' })).getByRole('radio', { name: '4' }));
    await click('Continue', 'link');
    await h1('Approve your core voice');
    expect(screen.getByRole('table', { name: 'Voice dimensions' })).toHaveTextContent('4');
    await approveAndContinue('voice');
    await h1('What we found, and what we still need');
    await click('Approve kit v1', 'link');
    await h1('JamJam kit v1 is ready');
    expect(screen.getByText(/you@jamjam\.tech, \[date, time\]/)).toBeInTheDocument();
  });

  it('Back links walk the wizard backwards and done steps link from the stepper', async () => {
    at(screenPath(boards.voice));
    await click('Back', 'link');
    await h1("Who it's for");
    const progress = screen.getByRole('list', { name: /Step 5 of 6/ });
    await userEvent.click(within(progress).getByRole('link', { name: /2 Origin/ }));
    await h1('How it started');
  });
});

describe('Brand Builder: screen interactions', () => {
  it('sign-in checks the code on the client', async () => {
    at(screenPath(boards.signIn));
    await userEvent.type(screen.getByLabelText('Enter the code we sent'), '12345678');
    await click('Continue');
    expect(screen.getByRole('alert')).toHaveTextContent('Send a code to your email first.');
    await click('Send code');
    await userEvent.clear(screen.getByLabelText('Enter the code we sent'));
    await userEvent.type(screen.getByLabelText('Enter the code we sent'), '123');
    await click('Continue');
    expect(screen.getByRole('alert')).toHaveTextContent('6 to 10 digits');
    await h1('Sign in with email');
  });

  it('domain: Check now keeps the entered values; Check again records verified and the Unverified flag clears', async () => {
    at(screenPath(boards.domain));
    await h1('Prove you own your domain');
    expect(within(screen.getByRole('banner')).getByText('Unverified')).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Domain'));
    await userEvent.type(screen.getByLabelText('Domain'), 'brand.example');
    await userEvent.clear(screen.getByLabelText('Brand name'));
    await userEvent.type(screen.getByLabelText('Brand name'), 'Acme');
    await click('Check now', 'link');
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't find the record on brand.example");
    expect(screen.getByText('Build your brand: Acme')).toBeInTheDocument();
    await click('Check again', 'link');
    await h1('The basics');
    expect(screen.queryByText('Unverified')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Acme');
    await click('Continue: read my links');
    await h1('What should we read?');
    expect(screen.queryByText('Unverified')).not.toBeInTheDocument();
    expect(screen.getByText('brand.example')).toBeInTheDocument();
  });

  it('domain: editing the domain after verifying resets verification', async () => {
    at(screenPath(boards.domainFailed));
    await click('Check again', 'link');
    await h1('The basics');
    expect(screen.queryByText('Unverified')).not.toBeInTheDocument();
    await click('Back', 'link');
    await h1('Prove you own your domain');
    // The verified status, the card and the Continue action agree.
    expect(screen.getByText('Status: verified')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Check now' })).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Domain'), 'x');
    expect(within(screen.getByRole('banner')).getByText('Unverified')).toBeInTheDocument();
    expect(screen.getByText('Status: waiting for record')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue (when verified)' })).toBeDisabled();
  });

  it('domain: with no domain entered, the record is hidden and Check now says why it is off', async () => {
    at(screenPath(boards.domain));
    await userEvent.clear(await screen.findByLabelText('Domain'));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    const check = screen.getByRole('button', { name: 'Check now' });
    expect(check).toBeDisabled();
    expect(check).toHaveAccessibleDescription('Enter your domain to get the record to add.');
    await userEvent.type(screen.getByLabelText('Domain'), 'acme.example');
    expect(screen.getByRole('table', { name: 'TXT record for acme.example' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Check now' })).toBeInTheDocument();
  });

  it('gates: changing the voice picks after Gate 3 was approved makes it stale, and Coverage counts it open again', async () => {
    const gate = at(screenPath(boards.gateVoice));
    await click('Approve voice');
    expect(await screen.findByRole('heading', { name: 'Voice approved' })).toBeInTheDocument();
    gate.unmount();
    const voice = at(screenPath(boards.voice));
    await userEvent.click(within(await screen.findByRole('group', { name: 'Energy' })).getByRole('radio', { name: /^5/ }));
    voice.unmount();
    const again = at(screenPath(boards.gateVoice));
    expect(await screen.findByRole('alert')).toHaveTextContent('Needs a fresh approval');
    again.unmount();
    at(screenPath(boards.coverage));
    expect(await screen.findByRole('alert')).toHaveTextContent('voice');
  });

  it('gates: changing positioning after Gate 3 was approved makes Gate 2 and Gate 3 stale; re-approving Gate 2 leaves Gate 3 stale (Codex review on PR #73)', () => {
    const approved = { status: 'approved', by: '[approver]', at: '[date]' } as const;
    let s: FlowState = {
      brand: { brandName: 'aDNA' },
      gates: { purpose: { status: 'pending' }, positioning: { status: 'pending' }, voice: { status: 'pending' } },
      positioningOption: 'A',
      voice: { round1: 'B', round2: 'C' },
      dials: { formality: 2, energy: 3, humour: 2 },
    };
    for (const g of ['purpose', 'positioning', 'voice'] as const) s = { ...s, gates: recordDecision(s, g, approved) };
    expect(Object.values(effectiveGates(s)).map((d) => d.status)).toEqual(['approved', 'approved', 'approved']);
    s = { ...s, positioningOption: 'B' };
    expect(effectiveGates(s)).toMatchObject({ purpose: { status: 'approved' }, positioning: { status: 'stale' }, voice: { status: 'stale' } });
    s = { ...s, gates: recordDecision(s, 'positioning', approved) };
    expect(effectiveGates(s)).toMatchObject({ positioning: { status: 'approved' }, voice: { status: 'stale' } });
    s = { ...s, brand: { brandName: 'aDNA Network' } };
    expect(effectiveGates(s)).toMatchObject({ purpose: { status: 'stale' }, positioning: { status: 'stale' }, voice: { status: 'stale' } });
  });

  it('domain: the developer email is built from the current domain, record and causes', async () => {
    at(screenPath(boards.domain));
    await userEvent.clear(await screen.findByLabelText('Domain'));
    await userEvent.type(screen.getByLabelText('Domain'), 'acme.example');
    await click('Check now', 'link');
    const mail = decodeURIComponent((await screen.findByRole('link', { name: 'Email these steps to my developer' })).getAttribute('href') ?? '');
    expect(mail).toContain('subject=DNS record for acme.example');
    expect(mail).toContain('Please add this DNS record for acme.example:');
    expect(mail).toContain('Value: jamjam-verify=[unique value]');
    expect(mail).toContain('- DNS not updated yet? Try again in a few minutes.');
    expect(screen.getByRole('heading', { name: "We couldn't find the record on acme.example" })).toBeInTheDocument();
  });

  it('kit: the registration links to the explorer externally; Kit-Export marks its tab current', async () => {
    at(screenPath(boards.published));
    await h1('JamJam kit v1 is ready');
    expect(screen.getByText('[tx signature]')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /View on explorer/ })).not.toBeInTheDocument();
    await click(/^Download the kit/, 'link');
    await h1('Download your kit');
    expect(within(screen.getByRole('navigation', { name: 'Brand' })).getByRole('link', { name: 'Kit' })).toHaveAttribute('aria-current', 'page');
    // It opens on the kit just published: JamJam, v1.
    expect(screen.getByRole('button', { name: 'JamJam, switch brand' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Version' })).toHaveValue('v1 · [date]');
    expect(screen.getByText('[sha256 of JamJam kit v1]')).toBeInTheDocument();
  });

  it('kit: a known signature opens the registration transaction on Solana Explorer in a new tab', () => {
    render(<MemoryRouter><Onboard6Published data={{ ...publishedData, tx: '5sigExample' }} /></MemoryRouter>);
    const link = screen.getByRole('link', { name: /^Registration transaction/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('href')).toContain('explorer.solana.com/tx/5sigExample');
  });

  it('basics: an invalid link blocks Continue with an inline error', async () => {
    at(screenPath(boards.basics, 'error'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Not a web address: jamjam tech');
    await click('Continue: read my links');
    await h1('The basics');
  });

  it('sources: remove, add, and the empty state', async () => {
    at(screenPath(boards.sources));
    await click('Remove jamjam.tech');
    expect(screen.queryByText('jamjam.tech')).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Add a link'), 'docs.jamjam.tech');
    await click('Add link');
    expect(screen.getByText('docs.jamjam.tech')).toBeInTheDocument();
    await click('Connect for publishing: X');
    expect(screen.getByText('Connected for publishing')).toBeInTheDocument();
  });

  it('sources: the same link added twice gets two rows, and removing one keeps the other', async () => {
    at(screenPath(boards.sources));
    for (let i = 0; i < 2; i++) {
      await userEvent.type(await screen.findByLabelText('Add a link'), 'docs.jamjam.tech');
      await click('Add link');
    }
    expect(screen.getAllByText('docs.jamjam.tech')).toHaveLength(2);
    await userEvent.click(screen.getAllByRole('button', { name: 'Remove docs.jamjam.tech' })[0]);
    expect(screen.getAllByText('docs.jamjam.tech')).toHaveLength(1);
  });

  it('sources empty: nothing to read disables Read my sources', async () => {
    at(screenPath(boards.sources, 'empty'));
    expect(await screen.findByText(/Nothing to read yet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Read my sources' })).toBeDisabled();
    await click('Skip, nothing to read', 'link');
    await h1('How it started');
  });

  it('ingest error: Retry puts the source back to reading', async () => {
    at(screenPath(boards.ingestError));
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't open this page");
    await click('Retry');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Reading…')).toBeInTheDocument();
  });

  it('gate: Request changes needs a note; coverage stays blocked until every gate is approved', async () => {
    at(screenPath(boards.gatePurpose));
    await click('Try another draft');
    expect(screen.getByLabelText('Purpose statement')).toHaveValue('[Another purpose draft from the same answers]');
    await click('Request changes');
    await userEvent.type(screen.getByLabelText('What should change?'), 'Less abstract');
    await click('Send request');
    expect(screen.getByRole('alert')).toHaveTextContent('Changes requested');
    await click('Save, decide later', 'link');
    await h1('Alternatives and your edge');
  });

  it('coverage: the open-gates alert and the disabled Approve kit v1 agree as gates are approved', async () => {
    const gate = at(screenPath(boards.gatePurpose));
    await click('Approve purpose');
    gate.unmount();
    at(screenPath(boards.coverage));
    expect(await screen.findByRole('alert')).toHaveTextContent('Still open: positioning, voice.');
    expect(screen.getByRole('button', { name: 'Approve kit v1' })).toBeDisabled();
  });

  it('coverage: Approve kit v1 is disabled while gates are open, with links to them', async () => {
    at(screenPath(boards.coverage));
    const approve = await screen.findByRole('button', { name: 'Approve kit v1' });
    expect(approve).toBeDisabled();
    expect(approve).toHaveAccessibleDescription('Approve the three gates first.');
    expect(screen.getByRole('alert')).toHaveTextContent('Approve the three gates first');
    expect(screen.getByRole('table')).toHaveTextContent('E 0 · I 2 · M 15');
    await click('purpose', 'link');
    await h1('Approve your purpose');
  });

  it('registration failed: says drafting needs a registered kit; the other way out is the gaps, never drafting', async () => {
    at(screenPath(boards.registerFailed));
    await h1('Kit v1 is approved, but not registered yet');
    expect(screen.getByRole('alert')).toHaveTextContent('Drafting posts needs a registered kit, so retry registration.');
    expect(screen.queryByRole('link', { name: /Continue without registering/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Fill the gaps while you wait' })).toHaveAttribute('href', '/screens/Brand-Build');
  });

  it('registration failed: Retry goes back to the registered kit', async () => {
    at(screenPath(boards.registerFailed));
    await h1('Kit v1 is approved, but not registered yet');
    await click('Retry registration', 'link');
    await h1('JamJam kit v1 is ready');
    await click(/^Download the kit/, 'link');
    await h1('Download your kit');
  });

  it('options: nothing is chosen for the owner; Continue waits for a pick; a new set clears the pick', async () => {
    at(screenPath(boards.alternatives));
    const blocked = await screen.findByRole('button', { name: 'Continue' });
    expect(blocked).toBeDisabled();
    expect(blocked).toHaveAccessibleDescription('Pick one of the three options first.');
    await userEvent.click(screen.getByRole('radio', { name: /Option C/ }));
    expect(screen.getByRole('link', { name: 'Continue with option C' })).toBeInTheDocument();
    await click('Show three different options');
    expect(screen.getByRole('radio', { name: /Option D/ })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: /Option D/ }));
    expect(screen.getByRole('link', { name: 'Continue with option D' })).toBeInTheDocument();
  });

  it('options loading: Continue is disabled until drafting is done, and says why', async () => {
    at(screenPath(boards.alternatives, 'loading'));
    const blocked = await screen.findByRole('button', { name: 'Continue' });
    expect(blocked).toBeDisabled();
    expect(blocked).toHaveAccessibleDescription('Wait for the three options to finish drafting.');
  });

  it('dashboard: approve then pay; the empty variant offers one action per module', async () => {
    at(screenPath(boards.dashboard));
    await h1('aDNA');
    expect(screen.getByText('Stretch')).toBeInTheDocument();
    const first = screen.getAllByRole('button', { name: 'Approve' })[0];
    await userEvent.click(first);
    await userEvent.click(screen.getAllByRole('button', { name: 'Pay (owner only)' })[0]);
    expect(screen.getAllByRole('status').some((s) => s.textContent === 'Paid')).toBe(true);
  });

  it('hub: the brand switcher changes the brand the screens show', async () => {
    at(screenPath(boards.dashboard));
    await h1('aDNA');
    await userEvent.click(screen.getByRole('button', { name: 'aDNA, switch brand' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: /JamJam/ }));
    await h1('JamJam');
    expect(screen.getByRole('heading', { name: 'No campaigns yet' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });

  it('kit export: switching brand changes the kit file name and contents', async () => {
    at(screenPath(boards.kitExport));
    await h1('Download your kit');
    expect(screen.getByText('[sha256 of aDNA kit v[n]]')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'aDNA, switch brand' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: /film\.fun/ }));
    expect(await screen.findByText('[sha256 of film.fun kit v[n]]')).toBeInTheDocument();
    const tree = screen.getByText(/^filmfun-kit-v\[n\]\//);
    expect(tree).toHaveTextContent('film-fun.md');
    expect(tree).not.toHaveTextContent('jamjam-tech.md');
  });

  it('dashboard empty: modules say what will appear', async () => {
    at(screenPath(boards.dashboardEmpty));
    expect(await screen.findByRole('heading', { name: 'No campaigns yet' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nothing to review' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy your public page link' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'New campaign' })).not.toBeInTheDocument();
  });
});
