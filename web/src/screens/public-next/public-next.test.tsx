import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { GalleryScreen } from '../../gallery/Gallery';
import { expectNoAxeViolations } from '../../test/axe';
import { screenStates } from '../../ui/composites/DemoStateSwitcher';
import { screens } from './registry';
import { screenPath } from '../../gallery/screenPath';
import { verifyArtboards } from './paths';

const verifyPaths = Object.fromEntries(Object.entries(verifyArtboards).map(([k, a]) => [k, screenPath(a)])) as Record<keyof typeof verifyArtboards, string>;
import { adnaLaunchPost, adnaStandardPost, jamjamRetractedPost } from './posts.fixtures';
import { renderWithRouter } from '../../test/render';
import { VerifyMatchResult } from './components/VerifyMatchResult';
import { VerifyRetractedResult } from './components/VerifyRetractedResult';
import { verifyEdited, verifyNoMatch } from './verify.fixtures';

vi.mock('../../lib/supabase', () => ({ supabase: null }));

// Nothing on this page may touch the network (issue #45).
let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchSpy = vi.fn(() => { throw new Error('the Verify screens must not call fetch'); });
  vi.stubGlobal('fetch', fetchSpy);
});
afterEach(() => {
  expect(fetchSpy).toHaveBeenCalledTimes(0);
  vi.unstubAllGlobals();
});

function at(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/screens/:artboard" element={<GalleryScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Replaces the text in the Verify box and presses Check (paste, so brackets and quotes go in as typed). */
async function checkText(text: string, label = 'Text or URL') {
  fireEvent.change(screen.getByLabelText(label), { target: { value: text } });
  await userEvent.click(screen.getByRole('button', { name: 'Check' }));
}

describe('Verify + ledger registry (issue #49)', () => {
  it('registers all six artboards with the canvas tags', () => {
    expect(screens.map((s) => [s.artboard, s.tag])).toEqual([
      ['Verify-1-Match', 'HACKATHON'],
      ['Verify-2-NoMatch', 'HACKATHON'],
      ['Verify-3-Edited', 'COMING SOON'],
      ['Ledger', 'HACKATHON'],
      ['Verify-4-Kit-Account-Claim', 'COMING SOON'],
      ['Verify-5-Retracted', 'COMING SOON'],
    ]);
  });

  for (const entry of screens) {
    for (const state of screenStates) {
      it(`${entry.artboard} (${state}) renders at its gallery route with no axe violations`, async () => {
        const { container } = at(`/screens/${entry.artboard}?state=${state}`);
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        if (entry.tag === 'COMING SOON') expect(screen.getAllByText('Coming soon').length).toBeGreaterThan(0);
        await expectNoAxeViolations(container);
      });
    }
  }
});

describe('Verify: the pasted text decides the result', () => {
  it('switches between match, not found and edited from the fixture inputs', async () => {
    at(verifyPaths.match);
    expect(screen.getByRole('heading', { name: 'Brand-approved: yes' })).toBeInTheDocument();
    expect(screen.getByText('aDNA · adna.network verified')).toBeInTheDocument();

    await checkText(verifyNoMatch.query);
    expect(screen.getByRole('heading', { name: 'Not found' })).toBeInTheDocument();

    await checkText(verifyEdited.query);
    expect(screen.getByRole('heading', { name: 'Edited from a brand-approved original' })).toBeInTheDocument();
    // The visible diff: removed words in the original, added words in the paste.
    expect(document.querySelector('del')).toHaveTextContent('that any agent can read');
    expect(document.querySelector('ins')).toHaveTextContent("It will 10x your team's output");
    expect(screen.getByText(/breaks a aDNA banned claim/)).toBeInTheDocument();

    await checkText(adnaLaunchPost.text);
    expect(screen.getByRole('heading', { name: 'Brand-approved: yes' })).toBeInTheDocument();
  });

  it('validates an empty check', async () => {
    at(`${verifyPaths.match}?state=empty`);
    expect(screen.getByRole('heading', { name: 'Paste a post to check it' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Paste the text of a post, or its URL, to check.')).toBeInTheDocument();
  });

  it('error state: Try again runs the check', async () => {
    at(`${verifyPaths.noMatch}?state=error`);
    expect(screen.getByRole('heading', { name: 'Could not check right now' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('heading', { name: 'Not found' })).toBeInTheDocument();
  });

  it('Verify-3 "View the original" opens Verify with the original, which matches', async () => {
    at(verifyPaths.edited);
    await userEvent.click(screen.getByRole('link', { name: 'View the original and its receipt' }));
    expect(screen.getByRole('heading', { name: 'Brand-approved: yes' })).toBeInTheDocument();
    expect(screen.getByLabelText('Text or URL')).toHaveValue(adnaStandardPost.text);
  });

  it('Verify-2 report form opens, validates and sends', async () => {
    at(verifyPaths.noMatch);
    await userEvent.click(screen.getByRole('button', { name: 'Report possible impersonation' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send report' }));
    expect(screen.getByText('Name the brand it claims to be from.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Which brand does it claim to be from?'), 'aDNA');
    await userEvent.type(screen.getByLabelText(/Where did you see it/), 'linkedin.com/company/acme');
    await userEvent.click(screen.getByRole('button', { name: 'Send report' }));
    expect(screen.getByText('Report sent')).toBeInTheDocument();
  });

  it('Verify-2 "Browse verified brands" opens the Ledger', async () => {
    at(verifyPaths.noMatch);
    await userEvent.click(screen.getByRole('link', { name: 'Browse verified brands' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Public ledger' })).toBeInTheDocument();
  });

  it('Verify-5 shows the retraction; Verify-1 links to the brand ledger', async () => {
    at(verifyPaths.retracted);
    expect(screen.getByRole('heading', { name: 'Retracted by JamJam' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Brand-approved' }));
    await userEvent.click(screen.getByRole('link', { name: "See aDNA's public ledger" }));
    expect(screen.getByRole('button', { name: 'aDNA, switch brand' })).toBeInTheDocument();
  });
});

describe('Ledger: filter, sort, paginate and check', () => {
  const rowHeaders = () => within(screen.getByRole('table')).getAllByRole('rowheader').map((c) => c.textContent);

  it('switches brand, filters, sorts and pages the fixture rows', async () => {
    at(verifyPaths.ledger);
    expect(screen.getByText('LinkedIn launch post', { exact: false })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Ledger pages' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'JamJam, switch brand' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: /aDNA/ }));
    // aDNA: three rows, two per page; newest first puts the bracketed dates (latest) first.
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(rowHeaders()).toEqual(['[date]', '[date]']);
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(rowHeaders()).toEqual(['5 Oct 2026, 16:18']);

    await userEvent.click(screen.getByRole('button', { name: 'Oldest first' }));
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(rowHeaders()[0]).toBe('5 Oct 2026, 16:18');

    await userEvent.click(screen.getByRole('button', { name: 'Kits' }));
    expect(screen.queryByRole('navigation', { name: 'Ledger pages' })).toBeNull();
    expect(rowHeaders()).toHaveLength(1);
    expect(within(screen.getByRole('table')).getByText(/Kit v1 · hash/)).toBeInTheDocument();
  });

  it('"Check it" opens Verify with the post, which matches', async () => {
    at(`${verifyPaths.ledger}?brand=adna`);
    await userEvent.click(screen.getByRole('button', { name: 'Posts' }));
    await userEvent.click(screen.getByRole('button', { name: 'Oldest first' }));
    await userEvent.click(within(screen.getByRole('table')).getAllByRole('link', { name: 'Check it' })[0]);
    expect(screen.getByRole('heading', { name: 'Brand-approved: yes' })).toBeInTheDocument();
    expect(screen.getByLabelText('Text or URL')).toHaveValue(adnaLaunchPost.text);
  });

  it('error state: Try again loads the rows', async () => {
    at(`${verifyPaths.ledger}?state=error`);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('LinkedIn launch post', { exact: false })).toBeInTheDocument();
  });

  it('empty state says nothing is registered', () => {
    at(`${verifyPaths.ledger}?state=empty`);
    expect(screen.getByText('JamJam has nothing registered yet.')).toBeInTheDocument();
  });
});

describe('links keep the gallery theme (Codex review, PR #68)', () => {
  it('sample, ledger and check links carry ?theme=', async () => {
    at(`${verifyPaths.match}?theme=wireframe-dark`);
    expect(screen.getByRole('link', { name: 'Not found' })).toHaveAttribute('href', '/screens/Verify-2-NoMatch?theme=wireframe-dark');
    expect(screen.getByRole('link', { name: "See aDNA's public ledger" })).toHaveAttribute('href', '/screens/Ledger?theme=wireframe-dark&brand=adna');
    await userEvent.click(screen.getByRole('link', { name: "See aDNA's public ledger" }));
    const check = within(screen.getByRole('table')).getAllByRole('link', { name: 'Check it' })[0];
    expect(check.getAttribute('href')).toMatch(/^\/screens\/Verify-1-Match\?theme=wireframe-dark&q=/);
  });
});

describe('receipts on results (Codex review, PR #68)', () => {
  it('a match links the registration transaction, or shows [tx] while pending', () => {
    const { unmount } = renderWithRouter(<VerifyMatchResult post={{ ...adnaLaunchPost, signature: 'ApproveSig' }} />);
    expect(screen.getByRole('link', { name: /Registration transaction/ })).toHaveAttribute('href', 'https://explorer.solana.com/tx/ApproveSig?cluster=devnet');
    unmount();
    renderWithRouter(<VerifyMatchResult post={adnaLaunchPost} />);
    expect(screen.queryByRole('link', { name: /Registration transaction/ })).toBeNull();
    expect(screen.getByText('[tx]')).toBeInTheDocument();
  });
  it('a retraction links both the registration and the retraction transactions', () => {
    const post = { ...jamjamRetractedPost, signature: 'ApproveSig', retraction: { at: null, reason: '[reason]', signature: 'RetractSig' } };
    renderWithRouter(<VerifyRetractedResult post={post} />);
    expect(screen.getByRole('link', { name: /Registration transaction/ })).toHaveAttribute('href', 'https://explorer.solana.com/tx/ApproveSig?cluster=devnet');
    expect(screen.getByRole('link', { name: /Retraction transaction/ })).toHaveAttribute('href', 'https://explorer.solana.com/tx/RetractSig?cluster=devnet');
    expect(screen.getByText('Registered')).toBeInTheDocument();
    expect(screen.getByText('The registration stays on the public record; the retraction changes its status.')).toBeInTheDocument();
  });
});

describe('Verify-4: account, kit version or claim', () => {
  it('checks an account, switches tabs and reports a claim as not found', async () => {
    at(verifyPaths.lookup);
    expect(screen.getByRole('tab', { name: 'Account', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Official account of JamJam' })).toBeInTheDocument();

    await checkText('linkedin.com/company/other', 'Account handle or link');
    expect(screen.getByRole('heading', { name: 'No registered account matches' })).toBeInTheDocument();
    await checkText('https://www.linkedin.com/company/[jamjam]/', 'Account handle or link');
    expect(screen.getByRole('heading', { name: 'Official account of JamJam' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Kit version' }));
    await checkText('[sha256]', 'Kit hash');
    expect(screen.getByRole('heading', { name: 'Kit v1 of JamJam' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Claim' }));
    await userEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Enter something to check.')).toBeInTheDocument();
    await checkText('Ships in 2026', 'Claim text');
    expect(screen.getByRole('heading', { name: 'No registered claim matches' })).toBeInTheDocument();
  });

  it('the Post tab opens Verify', async () => {
    at(verifyPaths.lookup);
    await userEvent.click(screen.getByRole('tab', { name: 'Post' }));
    await userEvent.click(within(screen.getByRole('tabpanel')).getByRole('link', { name: 'Check a post' }));
    expect(screen.getByRole('heading', { name: 'Brand-approved: yes' })).toBeInTheDocument();
  });
});
