import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderScreen } from './renderScreen';

// What a person changes on one screen shows on the later screens (hub session); fixtures are only the defaults.
describe('Superhub: changes carry to later screens', () => {
  it('the chosen brand stays chosen on the next screen and names the brand there', async () => {
    renderScreen('Hub-Home');
    await userEvent.click(screen.getByRole('button', { name: 'aDNA, switch brand' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: /GamersLab/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Tuesday, GamersLab' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Finish your brand' }));
    expect(screen.getByRole('heading', { level: 1, name: 'GamersLab brand kit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'GamersLab, switch brand' })).toBeInTheDocument();
  });

  it('a reply sent in Inbox-All leaves Needs reply, and Review draft reply opens that thread', async () => {
    renderScreen('Inbox-NeedsReply');
    await userEvent.click(screen.getAllByRole('button', { name: 'Review draft reply' })[3]);
    expect(screen.getByRole('heading', { level: 2, name: '[Customer]' })).toBeInTheDocument();
    const reply = screen.getByRole('textbox', { name: 'Your reply' });
    await userEvent.clear(reply);
    await userEvent.type(reply, 'Yes, there is.');
    await userEvent.click(screen.getByRole('button', { name: 'Send on WhatsApp' }));
    await userEvent.click(screen.getByRole('link', { name: /Needs reply/ }));
    expect(screen.getAllByRole('article')).toHaveLength(4);
    expect(screen.getByText('[Customer]: replied.')).toBeInTheDocument();
  });

  it('a draft approved in Draft-Review moves out of Needs approval on the content dashboard', async () => {
    renderScreen('Content-Dashboard');
    expect(screen.getByRole('tab', { name: 'Needs approval (6)' })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: /^Review X thread/ })[0]);
    const publish = screen.getByRole('region', { name: 'Publish' });
    await userEvent.click(within(publish).getByRole('radio', { name: /Schedule/ }));
    await userEvent.click(within(publish).getByRole('button', { name: 'Approve' }));
    await userEvent.click(screen.getByRole('link', { name: 'Back to drafts awaiting approval' }));
    expect(screen.getByRole('tab', { name: 'Needs approval (5)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Scheduled (6)' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Review X thread/ })).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: 'Scheduled (6)' }));
    expect(screen.getByRole('button', { name: /^Review X thread/ })).toBeInTheDocument();
  });

  it('a rule switched off on Engage-Rules takes its items out of the reply queue', async () => {
    renderScreen('Engage-Rules');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Rule on: A question in #help' }));
    await userEvent.click(screen.getByRole('link', { name: '← Reply queue' }));
    expect(screen.getByRole('tab', { name: 'Reply queue (2)' })).toBeInTheDocument();
    expect(screen.getByText('1 hidden by rules that are off.')).toBeInTheDocument();
    expect(screen.queryByText(/template for monorepos/)).toBeNull();
  });

  it('the persona created in Influencer-Setup names the approval queue', async () => {
    renderScreen('Influencer-Setup');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Represents' }), '[Creator name] (brand)');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Voice' }), '[Persona voice]');
    const name = screen.getByRole('textbox', { name: 'Name' });
    await userEvent.clear(name);
    await userEvent.type(name, 'Sample persona');
    await userEvent.click(screen.getByRole('button', { name: 'Create persona' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Sample persona: this week' })).toBeInTheDocument();
    expect(screen.getByText('[Persona voice] · AI persona of [creator]')).toBeInTheDocument();
  });

  it('Cancel on the add-rule form clears it; added rules keep unique ids after more adds', async () => {
    renderScreen('Engage-Rules');
    await userEvent.click(screen.getByRole('button', { name: '+ Add rule' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'When' }), 'Half typed');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: '+ Add rule' }));
    expect(screen.getByRole('textbox', { name: 'When' })).toHaveValue('');
    for (const when of ['First new rule', 'Second new rule']) {
      await userEvent.type(screen.getByRole('textbox', { name: 'When' }), when);
      await userEvent.type(screen.getByRole('textbox', { name: 'Where' }), 'X');
      await userEvent.click(screen.getByRole('button', { name: 'Add rule' }));
      await userEvent.click(screen.getByRole('button', { name: '+ Add rule' }));
    }
    expect(screen.getByRole('rowheader', { name: 'First new rule' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Second new rule' })).toBeInTheDocument();
  });

  it('Draft-Review: undo then polish again never reuses a version id', async () => {
    renderScreen('Draft-Review');
    await userEvent.click(screen.getByRole('button', { name: 'Clarify' }));
    await userEvent.click(screen.getByRole('button', { name: 'Undo v3 · Clarify' }));
    await userEvent.click(screen.getByRole('button', { name: 'Shorten' }));
    expect(screen.getByText('v4 · Shorten')).toBeInTheDocument();
    expect(screen.queryByText(/^v3/)).toBeNull();
  });

  it('the lead CSV holds the rows as shown, statuses included, with formulas neutralised', async () => {
    const { leadsCsv } = await import('../hooks/useLeads');
    const csv = leadsCsv([
      { id: 'a', name: '=HYPERLINK("x")', fit: 'High', why: 'w', status: 'queued' },
    ]);
    expect(csv).toBe('"Lead","Fit","Why","Status"\n"\'=HYPERLINK(""x"")","High","w","Draft in queue"');
  });
});

describe('Review round 2 (Codex on PR #81)', () => {
  it('Campaign: going on and coming Back keeps everything entered on Goal', async () => {
    renderScreen('Campaign-v2-1-Goal');
    await userEvent.click(screen.getByRole('radio', { name: /Custom/ }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Describe it' }), 'Partner week');
    await userEvent.type(screen.getByRole('textbox', { name: 'Campaign name' }), 'Spring launch');
    await userEvent.type(screen.getByRole('textbox', { name: 'Dates' }), '1–7 Nov');
    await userEvent.click(screen.getByRole('checkbox', { name: /Blog/ }));
    await userEvent.click(screen.getByRole('radio', { name: 'Both' }));
    await userEvent.click(screen.getByRole('link', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('link', { name: 'Campaigns' }));
    expect(screen.getByRole('textbox', { name: 'Campaign name' })).toHaveValue('Spring launch');
    expect(screen.getByRole('textbox', { name: 'Dates' })).toHaveValue('1–7 Nov');
    expect(screen.getByRole('textbox', { name: 'Describe it' })).toHaveValue('Partner week');
    expect(screen.getByRole('checkbox', { name: /Blog/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Both' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Next: audience' })).toBeEnabled();
  });

  it('Draft-Review: undoing an older version drops the versions made after it and restores the text before it', async () => {
    renderScreen('Draft-Review');
    const before = (screen.getByRole('textbox', { name: 'Post (editable)' }) as HTMLTextAreaElement).value;
    await userEvent.click(screen.getByRole('button', { name: 'Clarify' }));
    await userEvent.click(screen.getByRole('button', { name: 'Shorten' }));
    await userEvent.click(screen.getByRole('button', { name: 'Undo v3 · Clarify' }));
    expect(screen.queryByText('v3 · Clarify')).toBeNull();
    expect(screen.queryByText('v4 · Shorten')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Post (editable)' })).toHaveValue(before);
    await userEvent.click(screen.getByRole('button', { name: 'Review' }));
    expect(screen.getByText('v5 · Review')).toBeInTheDocument();
  });

  it('Engage-Queue: Skip takes the reply out of the queue, with Undo', async () => {
    renderScreen('Engage-Queue');
    await userEvent.click(screen.getAllByRole('button', { name: 'Skip' })[0]);
    expect(screen.getByRole('tab', { name: 'Reply queue (2)' })).toBeInTheDocument();
    expect(screen.getByText('Skipped: @[handle].')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('tab', { name: 'Reply queue (3)' })).toBeInTheDocument();
  });
});

describe('Review round 3 (Codex on PR #81)', () => {
  it('Review on d2 shows d2, and approving it moves d2 (not d1) on the dashboard', async () => {
    renderScreen('Content-Dashboard');
    await userEvent.click(screen.getByRole('button', { name: /^Review Blog/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Blog · Technical voice' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Post (editable)' })).toHaveValue('"Why agents need shared project context"');
    const publish = screen.getByRole('region', { name: 'Publish' });
    await userEvent.click(within(publish).getByRole('radio', { name: /Schedule/ }));
    await userEvent.click(within(publish).getByRole('button', { name: 'Approve' }));
    await userEvent.click(screen.getByRole('link', { name: 'Back to drafts awaiting approval' }));
    expect(screen.queryByRole('button', { name: /^Review Blog/ })).toBeNull();
    expect(screen.getByRole('button', { name: /^Review X post/ })).toBeInTheDocument();
  });

  it('an unknown draft id shows "Draft not found" and no decisions', async () => {
    const { draftReview } = await import('../DraftReview.fixtures');
    const { render } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router');
    const { DraftReview } = await import('../DraftReview');
    render(<MemoryRouter initialEntries={[{ pathname: '/screens/Draft-Review', state: { draftId: 'gone' } }]}><DraftReview data={draftReview} /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1, name: 'Draft not found' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
  });

  it('state is kept per brand: another brand does not see this brand\'s rules or decisions', async () => {
    renderScreen('Engage-Rules');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Rule on: A question in #help' }));
    await userEvent.click(screen.getByRole('button', { name: 'aDNA, switch brand' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: /film\.fun/ }));
    expect(screen.getByRole('checkbox', { name: 'Rule on: A question in #help' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'film.fun, switch brand' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: /aDNA/ }));
    expect(screen.getByRole('checkbox', { name: 'Rule on: A question in #help' })).not.toBeChecked();
  });

  it('the X length is weighted as X counts it, for the count and the gate', async () => {
    renderScreen('Draft-Review');
    const post = screen.getByRole('textbox', { name: 'Post (editable)' });
    await userEvent.clear(post);
    await userEvent.click(post);
    await userEvent.paste('日'.repeat(141));
    expect(screen.getByText(/282 \/ 280 characters \(as X counts them\)/)).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Checks' })).getByText(/282 \/ 280 · over the limit/)).toBeInTheDocument();
  });
});
