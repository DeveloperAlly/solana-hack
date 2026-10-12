// Journey (v3) screens, issue #48: the flow clicks through Main and J1 to J8 on the gallery routes; each screen's main
// interactions change what is on screen; and the binding review rules hold (no dead or dishonest controls): toggles
// change the display, nothing is preselected, primary actions wait for loading or a real choice, each step opens only
// after the one before it finished, and labels claim only what the product does. The gallery test covers every state
// in every theme with axe.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { GalleryIndex, GalleryScreen } from '../../gallery/Gallery';
import { screenPath } from '../../gallery/screenPath';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { resetJourneyFlow } from './useJourneyFlow';
import { journeyBoards, type JourneyTarget } from './paths';

vi.mock('../../lib/supabase', () => ({ supabase: null }));

const path = (target: JourneyTarget, state?: ScreenState) => screenPath(journeyBoards[target], state);
function at(target: JourneyTarget, state?: ScreenState) {
  return render(
    <MemoryRouter initialEntries={[path(target, state)]}>
      <Routes>
        <Route path="/screens/:artboard" element={<GalleryScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}
/** Renders another state on its own, after clearing the previous render. */
const again = (target: JourneyTarget, state?: ScreenState) => { cleanup(); return at(target, state); };
const h1 = () => screen.getByRole('heading', { level: 1 });
const button = (name: string | RegExp) => screen.getByRole('button', { name });
const click = (name: string | RegExp) => userEvent.click(button(name));
const follow = (name: string | RegExp) => userEvent.click(screen.getByRole('link', { name }));
/** Main's site form button (the canvas repeats it lower down; both submit the same form). */
const readSite = () => userEvent.click(screen.getAllByRole('button', { name: 'Read my site' })[0]);

/** J4 finished: both answers, and a voice picked in each round. */
async function finishGapsVoice() {
  await userEvent.type(screen.getByLabelText('What can only you do?'), 'Reads first');
  await userEvent.type(screen.getByLabelText('Your answer'), 'Brand tools asked what my site said');
  await userEvent.click(screen.getByRole('radio', { name: 'B Candid founder' }));
  await click('Next round');
  await userEvent.click(screen.getAllByRole('radio')[1]);
}

beforeEach(() => {
  resetJourneyFlow();
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('the Journey screens must not call fetch'); }));
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(async () => undefined) }, configurable: true });
});

describe('Journey flow, Main to J8', () => {
  it('clicks through every step as one route, each step opening only when the last one finished', async () => {
    at('main');
    const site = screen.getByLabelText('Your website');
    expect(site).toHaveValue('');
    await userEvent.type(site, 'jamjam');
    await readSite();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a web address');
    await userEvent.type(site, '.tech');
    await readSite();
    expect(h1()).toHaveTextContent('Reading jamjam.tech');
    expect(screen.getByText('Aha 1')).toBeInTheDocument();

    await click('Keep these and continue');
    expect(h1()).toHaveTextContent('Keep what we found');
    await userEvent.type(screen.getByLabelText('Email'), 'ally@jamjam.tech');
    await click('Email me a sign-in link');
    await userEvent.type(screen.getByLabelText('Code from the email'), '12345678');
    await click('Continue');

    expect(h1()).toHaveTextContent('Confirm what we found');
    for (const b of screen.getAllByRole('button', { name: 'Accept' })) await userEvent.click(b);
    await click('Answer 2 questions');

    expect(h1()).toHaveTextContent('Two questions, then your voice');
    await finishGapsVoice();
    await click('Review my kit');

    expect(h1()).toHaveTextContent('Approve kit v1');
    for (const b of screen.getAllByRole('button', { name: 'Approve' })) await userEvent.click(b);
    await click('Approve and register kit v1');

    expect(h1()).toHaveTextContent('Your first post, from kit v1');
    await click('Approve and register');
    expect(h1()).toHaveTextContent('Your first post is registered');
    expect(screen.getByRole('heading', { name: 'Official' })).toBeInTheDocument();
    await follow('Plan the rest of my week');
    expect(h1()).toHaveTextContent('Welcome, JamJam');
  });

  it('keeps the gallery theme on links, links done steps back, and Save and exit returns to Main', async () => {
    render(
      <MemoryRouter initialEntries={[`${path('gapsVoice')}?theme=wireframe-dark`]}>
        <Routes><Route path="/screens/:artboard" element={<GalleryScreen />} /></Routes>
      </MemoryRouter>,
    );
    const steps = screen.getByRole('list', { name: 'Step 4 of 7' });
    expect(within(steps).getByRole('link', { name: /Read/ })).toHaveAttribute('href', '/screens/J1-Read?theme=wireframe-dark');
    await follow('Save and exit');
    expect(h1()).toHaveTextContent("Your brand, built from what you've already said");
  });
});

describe('Review rule: each step opens only after the one before it finished', () => {
  it('J2 accepts a code only after an email was sent', async () => {
    at('save');
    expect(screen.queryByLabelText('Code from the email')).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Email'), 'ally@jamjam.tech');
    await click('Email me a sign-in link');
    expect(screen.getByText(/We sent a link and a code to ally@jamjam.tech/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Code from the email'), '123');
    await click('Continue');
    expect(screen.getByRole('alert')).toHaveTextContent('6 to 10 digits');
    await click('Use a different email');
    expect(screen.queryByLabelText('Code from the email')).not.toBeInTheDocument();
  });

  it('J3 continues only once every found card has a decision', async () => {
    at('confirm');
    const next = button('Answer 2 questions');
    expect(next).toBeDisabled();
    const accepts = screen.getAllByRole('button', { name: 'Accept' });
    for (const b of accepts.slice(0, -1)) await userEvent.click(b);
    expect(next).toBeDisabled();
    await userEvent.click(screen.getAllByRole('button', { name: 'Reject' })[0]);
    expect(next).toBeEnabled();
  });

  it('J4 continues only once both questions are answered and the voice is set', async () => {
    at('gapsVoice');
    expect(button('Review my kit')).toBeDisabled();
    await finishGapsVoice();
    expect(button('Review my kit')).toBeEnabled();
  });

  it('J5 registers only once all three gates are approved', async () => {
    at('approveKit');
    const register = button('Approve and register kit v1');
    const approves = screen.getAllByRole('button', { name: 'Approve' });
    for (const b of approves.slice(0, 2)) await userEvent.click(b);
    expect(register).toBeDisabled();
    expect(screen.getByText('Approve all 3 gates first: 2 of 3 approved.')).toBeInTheDocument();
    await userEvent.click(approves[2]);
    expect(register).toBeEnabled();
  });
});

describe('Review rule: nothing preselected; primary actions wait for loading or a real choice', () => {
  it('J4 starts with no alternative and no voice picked; Next round waits for a pick', async () => {
    at('gapsVoice');
    for (const o of ['Pressmaster', 'Google Pomelli', 'Canva Brand Kit']) expect(button(o)).toHaveAttribute('aria-pressed', 'false');
    for (const r of screen.getAllByRole('radio')) expect(r).not.toBeChecked();
    expect(button('Next round')).toBeDisabled();
    expect(screen.queryByText('Aha 3')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'A Plainspoken' }));
    expect(button('Next round')).toBeEnabled();
    expect(screen.getByText('Aha 3')).toBeInTheDocument();
  });

  it('J1 cannot continue while nothing has been read yet', () => {
    at('read', 'loading');
    expect(button('Keep these and continue')).toBeDisabled();
    expect(screen.getByText('Nothing to keep yet: facts appear as each page is read.')).toBeInTheDocument();
  });

  it('J2 disables sending while a link is being sent', () => {
    at('save', 'loading');
    expect(button('Sending…')).toBeDisabled();
  });
});

describe('Review rule: toggles, tabs and checks change what is displayed', () => {
  it('J4 alternatives change the compared-against line, including one of your own', async () => {
    at('gapsVoice');
    expect(screen.getByText('Compared against: none picked yet')).toBeInTheDocument();
    await click('Google Pomelli');
    expect(screen.getByText('Compared against: Google Pomelli')).toBeInTheDocument();
    await click('+ Add');
    await userEvent.type(screen.getByLabelText('Another alternative'), 'Notion');
    await click('Add');
    expect(screen.getByText('Compared against: Google Pomelli, Notion')).toBeInTheDocument();
  });

  it('J6 channel tabs swap the draft, and a selected claim shows its evidence', async () => {
    at('firstPost');
    expect(screen.getByText('"drafts posts in your voice"')).toBeInTheDocument();
    await click('Claim: Anyone can check what really came from you');
    expect(screen.getByText('"Anyone can check what really came from you"')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'X' }));
    expect(screen.getByText('[X version of the first post, from kit v1]')).toBeInTheDocument();
  });

  it('J7 says an edited copy is not official', async () => {
    at('proof');
    const box = screen.getByLabelText('Text or URL');
    await userEvent.clear(box);
    await userEvent.type(box, 'JamJam posts for you automatically.');
    await click('Check');
    expect(screen.getByRole('heading', { name: 'Not an official post' })).toBeInTheDocument();
  });
});

describe('Review rule: labels claim only what the product does', () => {
  it('J5 records approval off-chain; only registration goes on Solana, and only hashes and ids', async () => {
    at('approveKit');
    const gate = screen.getByRole('region', { name: 'Purpose' });
    await userEvent.click(within(gate).getByRole('button', { name: 'Approve' }));
    // The approval record names who and when; it never says the approval itself went on-chain.
    expect(within(gate).getByText(/Approved by ally@…/).textContent).not.toMatch(/Solana|on-chain|registered/i);
    const onChain = screen.getByRole('region', { name: 'What goes on Solana' });
    expect(onChain).toHaveTextContent('Your words stay off-chain.');
  });

  it('J7 copies the public Check a post link, and keeps publishing and the edited-copy diff tagged coming soon', async () => {
    at('proof');
    expect(screen.getAllByText('Coming soon')).toHaveLength(2);
    fireEvent.click(button('Copy check link'));
    expect(await screen.findByRole('button', { name: 'Copy check link: copied' })).toBeInTheDocument();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://jamjam.tech/verify');
  });
});

describe('Journey screens: other interactions and states', () => {
  it('Main hides the example until it is registered, and shows the invalid address state', () => {
    at('main', 'empty');
    expect(screen.queryByText('Real example: JamJam built itself')).not.toBeInTheDocument();
    again('main', 'error');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a web address');
  });

  it('J1 skips a blocked source, adds a link, and validates pasted text', async () => {
    at('read');
    await click('Skip');
    expect(screen.getByText('Skipped')).toBeInTheDocument();
    await click('Another link');
    await userEvent.type(screen.getByLabelText('Another link'), 'jamjam.tech/blog');
    await click('Add');
    expect(screen.getByText('jamjam.tech/blog')).toBeInTheDocument();
    await click('Paste text');
    await click('Add');
    expect(screen.getByRole('alert')).toHaveTextContent('Paste the text first.');
  });

  it.each([
    ['loading', 'Reading jamjam.tech'],
    ['error', "We couldn't read jamjam.tech"],
    ['empty', 'Nothing to read on this site yet'],
  ] as const)('J1 %s state', (state, heading) => {
    at('read', state);
    expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
  });

  it('J2 shows the expired-link error', () => {
    at('save', 'error');
    expect(screen.getByText(/expired or was already used/)).toBeInTheDocument();
  });

  it('J3 edits, rejects and undoes a card, and readiness rises as cards are confirmed', async () => {
    at('confirm');
    expect(screen.getByRole('progressbar', { name: /Kit readiness 58%/ })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    const field = screen.getByLabelText('Edit: Positioning · Gate 2');
    await userEvent.clear(field);
    await userEvent.type(field, 'JamJam reads first.');
    await click('Save');
    expect(screen.getByText('JamJam reads first.')).toBeInTheDocument();
    expect(screen.getByText('Edited')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /Kit readiness 65%/ })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Reject' })[0]);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Undo' })[0]);
    expect(screen.queryByText('Edited')).not.toBeInTheDocument();
    // Undo clears the decision and the edit together (one record): the card shows the original wording again.
    expect(screen.queryByText('JamJam reads first.')).not.toBeInTheDocument();
    expect(screen.getByText('JamJam builds a brand kit, then drafts posts in that voice.')).toBeInTheDocument();
  });

  it('J4 takes one sentence instead of a pick', async () => {
    at('gapsVoice');
    await click('None of these: write one sentence');
    await userEvent.type(screen.getByLabelText('Your voice in one sentence'), 'Plain and direct.');
    await click('Use this');
    expect(screen.getByText('Your sentence: "Plain and direct."')).toBeInTheDocument();
  });

  it('J5 shows the failed registration with the kit still approved, and no way on to drafting', async () => {
    at('approveKit', 'error');
    expect(screen.getByRole('heading', { name: 'Kit v1 is approved, but not registered yet' })).toBeInTheDocument();
    expect(screen.getAllByText('Approved')).toHaveLength(3);
    expect(screen.queryByText('Continue without registering')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review the kit' })).toHaveAttribute('href', path('brandBuild'));
    await click('Retry registration');
    expect(screen.getByText('Not yet · last try just now')).toBeInTheDocument();
  });

  it('J6 polishing replaces the draft with the revision, and Undo restores it', async () => {
    at('firstPost');
    const panel = () => screen.getByRole('tabpanel');
    expect(panel()).toHaveTextContent('Every brand tool I tried asked me questions my website already answered. So JamJam reads first.');
    await click('Shorten');
    expect(panel()).toHaveTextContent('Brand tools kept asking what my website already said.');
    expect(panel()).not.toHaveTextContent('Built in public');
    await click('Clarify');
    expect(panel()).toHaveTextContent('JamJam reads your site first');
    await click('Undo Clarify');
    expect(panel()).toHaveTextContent('Brand tools kept asking what my website already said.');
    await click('Undo Shorten');
    expect(panel()).toHaveTextContent('So JamJam reads first.');
    expect(screen.queryByRole('button', { name: /^Undo/ })).not.toBeInTheDocument();
  });

  it('J8 links its checklist into the gallery', () => {
    at('hub');
    expect(screen.getByRole('link', { name: 'Start: Add 2 more sources' })).toHaveAttribute('href', path('read'));
    expect(screen.getByRole('progressbar', { name: '2 of 6 done' })).toBeInTheDocument();
    expect(screen.getByText(/Kit v1 registered · first post official · readiness 72%/)).toBeInTheDocument();
  });
});

describe('Truthfulness: status follows whether kit v1 really registered', () => {
  it('after a failed retry, J6 does not draft, its chip says not registered, and J8 shows the kit as approved only', async () => {
    at('approveKit', 'error');
    await click('Retry registration');
    again('firstPost');
    expect(screen.getByRole('heading', { name: 'Register kit v1 first' })).toBeInTheDocument();
    expect(screen.getByText('Kit v1 not registered')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve and register' })).not.toBeInTheDocument();
    again('hub');
    expect(screen.getByText(/Kit v1 approved, not registered · no post yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start: Register kit v1' })).toHaveAttribute('href', path('approveKit'));
    expect(screen.getAllByText('Not registered yet')).toHaveLength(2);
  });

  it('a successful registration leads on with the registered chip', async () => {
    at('approveKit');
    for (const b of screen.getAllByRole('button', { name: 'Approve' })) await userEvent.click(b);
    await click('Approve and register kit v1');
    expect(screen.getByText('Kit v1 registered ✓')).toBeInTheDocument();
  });
});

describe('Earlier choices carry to later screens (fixtures are only the defaults)', () => {
  it('the site typed on Main names J1 and its home source', async () => {
    at('main');
    await userEvent.type(screen.getByLabelText('Your website'), 'acme.example.com');
    await readSite();
    expect(h1()).toHaveTextContent('Reading acme.example.com');
    expect(within(screen.getByRole('region', { name: 'Sources' })).getByText('acme.example.com')).toBeInTheDocument();
  });

  it('the lower "Read my site" submits the same site form', async () => {
    at('main');
    await userEvent.click(screen.getAllByRole('button', { name: 'Read my site' })[1]);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your website address.');
  });

  it('a new read from Main starts a fresh journey', async () => {
    at('confirm');
    await userEvent.click(screen.getAllByRole('button', { name: 'Accept' })[0]);
    expect(screen.getByText('1 confirmed')).toBeInTheDocument();
    again('main');
    await userEvent.type(screen.getByLabelText('Your website'), 'jamjam.tech');
    await readSite();
    again('confirm');
    expect(screen.getByText('0 confirmed')).toBeInTheDocument();
  });

  it('J3 rejections and edits change what J5 cites and counts', async () => {
    at('confirm');
    // Cards: positioning, purpose, messaging (checked), messaging (gates). Edit purpose, reject messaging (checked).
    await userEvent.click(screen.getAllByRole('button', { name: 'Edit' })[1]);
    const field = screen.getByLabelText('Edit: Purpose · Gate 1');
    await userEvent.clear(field);
    await userEvent.type(field, 'Proof that posts came from the brand.');
    await click('Save');
    await userEvent.click(screen.getAllByRole('button', { name: 'Reject' })[1]);
    again('approveKit');
    const purpose = screen.getByRole('region', { name: 'Purpose' });
    expect(within(purpose).getByText(/Built from: 1 fact, 1 answer/)).toBeInTheDocument();
    expect(within(purpose).getByText('Proof that posts came from the brand.')).toBeInTheDocument();
    expect(within(purpose).queryByText('Every draft is checked, and a person approves before anything goes out.')).not.toBeInTheDocument();
  });

  it('J4 answers, alternatives and voice picks fill the J5 drafts', async () => {
    at('gapsVoice');
    await click('Google Pomelli');
    await finishGapsVoice();
    again('approveKit');
    expect(within(screen.getByRole('region', { name: 'Positioning' })).getByText(/Unlike Google Pomelli, Reads first\./)).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Positioning' })).getByText(/1 alternative/)).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Voice' })).getByText(/Candid founder, narrowed in round 2 by paragraph B/)).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Purpose' })).getByText('Brand tools asked what my site said')).toBeInTheDocument();
  });

  it('a fact rejected on J3 leaves its J6 claim unsupported, and Approve waits', async () => {
    at('confirm');
    await userEvent.click(screen.getAllByRole('button', { name: 'Reject' })[1]); // purpose backs "Anyone can check…"
    again('firstPost');
    expect(screen.getByText('Claims: 1 of 2 backed')).toBeInTheDocument();
    await click('Claim: Anyone can check what really came from you');
    expect(screen.getByText(/this claim is unsupported/)).toBeInTheDocument();
    expect(button('Approve and register')).toBeDisabled();
  });

  it('the J6 claim panel follows the channel on screen', async () => {
    at('firstPost');
    await click('Claim: drafts posts in your voice');
    await userEvent.click(screen.getByRole('tab', { name: 'X' }));
    expect(screen.queryByRole('heading', { name: 'Claim → evidence' })).not.toBeInTheDocument();
    expect(screen.getByText('Claims: 0 of 0 backed')).toBeInTheDocument();
  });

  it('the channel and polished text approved on J6 are what J7 records and checks', async () => {
    at('firstPost');
    await click('Shorten');
    await click('Approve and register');
    expect(h1()).toHaveTextContent('Your first post is registered');
    expect(screen.getByText('LinkedIn launch post')).toBeInTheDocument();
    expect(screen.getByLabelText('Text or URL')).toHaveValue('Brand tools kept asking what my website already said. JamJam reads first, drafts posts in your voice and waits for your approval. Anyone can check what really came from you.');
    fireEvent.click(button('Copy post'));
    expect(await screen.findByRole('button', { name: 'Copy post: copied' })).toBeInTheDocument();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringMatching(/^Brand tools kept asking/));
  });

  it('J7 matches like the Worker: rewrapped whitespace is still Official, a changed word is not', async () => {
    at('proof');
    const box = screen.getByLabelText('Text or URL');
    const text = (box as HTMLTextAreaElement).value;
    await userEvent.clear(box);
    await userEvent.type(box, `  ${text.replace('So JamJam', 'So\n\nJamJam')}  `);
    await click('Check');
    expect(screen.getByRole('heading', { name: 'Official' })).toBeInTheDocument();
  });

  it('J1 sources added one after another keep separate rows', async () => {
    at('read');
    for (const link of ['one.example.com', 'two.example.com']) {
      await click('Another link');
      await userEvent.type(screen.getByLabelText('Another link'), link);
      await click('Add');
    }
    const sources = within(screen.getByRole('region', { name: 'Sources' }));
    expect(sources.getByText('one.example.com')).toBeInTheDocument();
    expect(sources.getByText('two.example.com')).toBeInTheDocument();
  });
});

describe('Gallery index with Journey registered', () => {
  it('keeps the same J1 link node across a tick in a theme (no remount loop)', async () => {
    render(
      <MemoryRouter initialEntries={['/screens?theme=wireframe-dark']}>
        <Routes><Route path="/screens" element={<GalleryIndex />} /></Routes>
      </MemoryRouter>,
    );
    const first = screen.getByRole('link', { name: 'J1-Read' });
    expect(first).toHaveAttribute('href', '/screens/J1-Read?theme=wireframe-dark');
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByRole('link', { name: 'J1-Read' })).toBe(first);
  });
});
