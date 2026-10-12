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
