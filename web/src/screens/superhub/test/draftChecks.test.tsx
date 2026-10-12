import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { evaluateDraftChecks } from '../hooks/draftChecks';
import { draftBeautified, draftPolishError, draftReview } from '../DraftReview.fixtures';
import { renderScreen } from './renderScreen';

const publish = () => screen.getByRole('region', { name: 'Publish' });
const checks = () => screen.getByRole('region', { name: 'Checks' });

// Each blocking check alone turns its badge to "blocked" and disables Approve; clearing it enables Approve again.
const cases: { check: string; text: string; badge: RegExp }[] = [
  { check: 'No-AI-slop check', text: 'Agents get a revolutionary memory.', badge: /Fails · remove "revolutionary"/ },
  { check: 'Claims gate', text: 'Agents get 3x faster.', badge: /Blocked · unapproved: 3x/ },
  { check: 'Vocabulary', text: 'A seamless setup for agents.', badge: /Blocked · avoid "seamless"/ },
  { check: 'Length', text: 'a'.repeat(281), badge: /281 \/ 280 · over the limit/ },
];

describe('Draft checks: one mapping feeds the badges and the Approve gate', () => {
  it('the drawn draft (d1) of all three artboards has no blocking check', () => {
    for (const data of [draftReview, draftBeautified, draftPolishError]) {
      expect(evaluateDraftChecks(data.drafts.d1.versions.at(-1)!.text, data, data.drafts.d1).filter((c) => c.blocking)).toEqual([]);
    }
  });

  it('a dashboard draft with an unapproved number ("5 signs…") is held by the claims gate', () => {
    const d4 = draftReview.drafts.d4;
    expect(evaluateDraftChecks(d4.versions.at(-1)!.text, draftReview, d4).filter((c) => c.blocking).map((c) => c.label)).toEqual(['Claims gate']);
  });

  it('an empty post blocks', () => {
    expect(evaluateDraftChecks('  ', draftReview, draftReview.drafts.d1).find((c) => c.label === 'Length')).toMatchObject({ blocking: true, value: 'Empty' });
  });

  for (const artboard of ['Draft-Review', 'Draft-Review-PolishError'] as const) {
    for (const c of cases) {
      it(`${artboard}: ${c.check} alone disables Approve`, async () => {
        renderScreen(artboard, artboard === 'Draft-Review' ? undefined : 'error');
        await userEvent.click(within(publish()).getByRole('radio', { name: /Schedule/ }));
        const approve = within(publish()).getByRole('button', { name: 'Approve' });
        expect(approve).toBeEnabled();
        const post = screen.getByRole('textbox', { name: 'Post (editable)' });
        await userEvent.clear(post);
        await userEvent.click(post);
        await userEvent.paste(c.text);
        const row = within(checks()).getByText(c.check).closest('div')!;
        expect(row).toHaveTextContent(c.badge);
        expect(within(checks()).getAllByText(/^(Fails|Blocked)|over the limit$/)).toHaveLength(1);
        expect(approve).toBeDisabled();
        await userEvent.clear(post);
        await userEvent.paste('Agents read the file at the start of each session.');
        expect(approve).toBeEnabled();
      });
    }
  }

  it('Draft-Review-Beautified: badges and Approve come from the same checks', async () => {
    renderScreen('Draft-Review-Beautified');
    expect(within(checks()).queryByText(/^(Fails|Blocked)/)).toBeNull();
    await userEvent.click(within(publish()).getByRole('radio', { name: /Schedule/ }));
    expect(within(publish()).getByRole('button', { name: 'Approve' })).toBeEnabled();
  });
});

describe('Draft-Review: approval follows the Worker (web/worker/posts.ts)', () => {
  async function approveClean() {
    renderScreen('Draft-Review');
    await userEvent.click(within(publish()).getByRole('radio', { name: /Schedule/ }));
    await userEvent.click(within(publish()).getByRole('button', { name: 'Approve' }));
    expect(within(publish()).getByRole('heading', { name: 'Approved' })).toBeInTheDocument();
  }

  it('an edit after Approve resets the approval, and a blocking edit stops it being approved again', async () => {
    await approveClean();
    await userEvent.click(screen.getByRole('textbox', { name: 'Post (editable)' }));
    await userEvent.paste(' 10x');
    expect(within(publish()).queryByRole('button', { name: 'Register on Solana' })).toBeNull();
    expect(within(checks()).getByText(/Blocked · unapproved: 10x/)).toBeInTheDocument();
    expect(within(publish()).getByRole('button', { name: 'Approve' })).toBeDisabled();
  });

  it('a polish action after Approve resets the approval', async () => {
    await approveClean();
    await userEvent.click(screen.getByRole('button', { name: 'Clarify' }));
    expect(within(publish()).getByRole('button', { name: 'Approve' })).toBeInTheDocument();
  });

  it('an undo after Approve resets the approval', async () => {
    await approveClean();
    await userEvent.click(screen.getByRole('button', { name: 'Undo v2 · slop check fixes (automatic)' }));
    expect(within(publish()).getByRole('button', { name: 'Approve' })).toBeInTheDocument();
  });

  it('once registered the post is read-only: no edits, polish or undo', async () => {
    await approveClean();
    await userEvent.click(within(publish()).getByRole('button', { name: 'Register on Solana' }));
    const post = screen.getByRole('textbox', { name: 'Post (editable)' });
    expect(post).toHaveAttribute('readonly');
    await userEvent.click(post);
    await userEvent.paste(' more');
    expect((post as HTMLTextAreaElement).value).not.toContain('more');
    expect(screen.getByRole('button', { name: 'Shorten' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Undo v2 · slop check fixes (automatic)' })).toBeDisabled();
    expect(within(publish()).getByRole('heading', { name: 'Registered on Solana (devnet)' })).toBeInTheDocument();
  });
});
