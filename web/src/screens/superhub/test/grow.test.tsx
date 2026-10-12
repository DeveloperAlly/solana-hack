import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderScreen } from './renderScreen';

describe('Grow (n-eq, n-er, n-pa, n-le, n-is, n-iq)', () => {
  it('Engage-Queue: Approve and send moves a reply to Sent; a held item needs text before it can be sent', async () => {
    renderScreen('Engage-Queue');
    expect(screen.getByRole('tab', { name: 'Reply queue (3)' })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Approve and send' })[0]);
    expect(screen.getByRole('tab', { name: 'Reply queue (2)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sent (1)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Write reply' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Write the text before saving.');
    await userEvent.type(screen.getByRole('textbox', { name: 'Reply to [member]' }), 'Not yet; it is on the list.');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getAllByRole('button', { name: 'Approve and send' })).toHaveLength(2);
    await userEvent.click(screen.getByRole('tab', { name: 'Sent (1)' }));
    expect(screen.getByRole('status')).toHaveTextContent('Sent');
  });

  it('Engage-Queue: Draft a reply adds an editable reply to the queue; the count goes up by one and it can be sent', async () => {
    renderScreen('Engage-Queue');
    expect(screen.getByRole('tab', { name: 'Reply queue (3)' })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Draft a reply' })[0]);
    expect(screen.getAllByText('Reply drafted. It waits in your reply queue.').length).toBeGreaterThan(0);
    expect(screen.getByRole('tab', { name: 'Reply queue (4)' })).toBeInTheDocument();
    expect(within(screen.getByRole('tabpanel')).getByText(/posted about agents losing context mid-task/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Approve and send' })).toHaveLength(3);
    await userEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    const editor = screen.getByRole('textbox', { name: 'Reply to @[account]' });
    await userEvent.clear(editor);
    await userEvent.type(editor, 'Edited reply.');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Edited reply.')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Approve and send' })[0]);
    expect(screen.getByRole('tab', { name: 'Reply queue (3)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sent (1)' })).toBeInTheDocument();
  });

  it('Engage-Rules: rules toggle, a new rule is validated and added, and edited wording needs approval again', async () => {
    renderScreen('Engage-Rules');
    const toggle = screen.getByRole('checkbox', { name: 'Rule on: A question in #help' });
    await userEvent.click(toggle);
    expect(toggle).not.toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: '+ Add rule' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Say when the rule fires');
    await userEvent.type(screen.getByRole('textbox', { name: 'When' }), 'Someone asks for a demo');
    await userEvent.type(screen.getByRole('textbox', { name: 'Where' }), 'X');
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }));
    expect(screen.getByRole('rowheader', { name: 'Someone asks for a demo' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Edit wording' }));
    const wording = screen.getByRole('textbox', { name: 'Auto-reply wording' });
    await userEvent.clear(wording);
    await userEvent.type(wording, 'Guide: adna.network/docs');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Keep a way to stop');
    await userEvent.type(wording, ' Reply STOP to opt out.');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Changed: needs your approval')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Approve wording' }));
    expect(screen.getByText('Approved by you 3 Oct')).toBeInTheDocument();
  });

  it('Partners: Send invite waits for real choices, validates the email, then adds the partner', async () => {
    renderScreen('Partners');
    const send = screen.getByRole('button', { name: /Send invite/ });
    expect(send).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Voices they can use' })).toHaveValue('');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Voices they can use' }), 'Technical');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Approval' }), 'You approve every piece');
    await userEvent.click(send);
    expect(screen.getByRole('alert')).toHaveTextContent("Enter the partner's real email address.");
    const email = screen.getByRole('textbox', { name: 'Email' });
    await userEvent.clear(email);
    await userEvent.type(email, 'team@studio.example');
    await userEvent.click(send);
    expect(screen.getByRole('rowheader', { name: 'team@studio.example' })).toBeInTheDocument();
    expect(screen.getByText(/You approve every piece: their drafts come to your approval queue/)).toBeInTheDocument();
    expect(send).toBeDisabled();
    expect(screen.getByText('All 3 seats are in use.')).toBeInTheDocument();
  });

  it('Leads: Find leads validates the description; Draft outreach puts the lead in the queue', async () => {
    renderScreen('Leads');
    await userEvent.clear(screen.getByRole('textbox', { name: 'Who' }));
    await userEvent.click(screen.getByRole('button', { name: 'Find leads' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Describe who you are looking for.');
    await userEvent.type(screen.getByRole('textbox', { name: 'Who' }), 'Agent tool makers');
    await userEvent.click(screen.getByRole('button', { name: 'Find leads' }));
    expect(screen.getByText(/Searching public sources for: Agent tool makers/)).toBeInTheDocument();
    const rowA = screen.getByRole('rowheader', { name: '[Organisation A]' }).closest('tr')!;
    await userEvent.click(within(rowA as HTMLElement).getByRole('button', { name: 'Draft outreach' }));
    expect(within(rowA as HTMLElement).getByText('Draft in queue')).toBeInTheDocument();
    expect(within(rowA as HTMLElement).getByRole('link', { name: 'Review' })).toHaveAttribute('href', '/screens/Content-Dashboard');
  });

  it('Influencer-Setup: Create waits for brand and voice, the preview follows them, then the queue opens', async () => {
    renderScreen('Influencer-Setup');
    const create = screen.getByRole('button', { name: 'Create persona' });
    expect(create).toBeDisabled();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Represents' }), '[Creator name] (brand)');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Voice' }), '[Persona voice]');
    expect(screen.getByText(/AI persona of \[creator\] · \[Persona voice\]/)).toBeInTheDocument();
    await userEvent.click(create);
    expect(screen.getByRole('alert')).toHaveTextContent('Give the persona its own name.');
    const name = screen.getByRole('textbox', { name: 'Name' });
    await userEvent.clear(name);
    await userEvent.type(name, 'Sample persona');
    await userEvent.click(create);
    expect(screen.getByRole('heading', { level: 1, name: 'Sample persona: this week' })).toBeInTheDocument();
  });

  it('Influencer-Queue: a post with no watermark is blocked until it is re-stamped, then can be approved', async () => {
    renderScreen('Influencer-Queue');
    expect(screen.getByText('Label missing')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Approve' })).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: 'Re-stamp image' }));
    expect(screen.queryByText('Label missing')).toBeNull();
    const approves = screen.getAllByRole('button', { name: 'Approve' });
    expect(approves).toHaveLength(3);
    await userEvent.click(approves[2]);
    expect(screen.getByText(/Approved · Threads Fri 19:00/)).toBeInTheDocument();
  });
});
