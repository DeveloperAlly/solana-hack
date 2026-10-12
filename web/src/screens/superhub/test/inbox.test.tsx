import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderScreen } from './renderScreen';

const messages = () => screen.getByRole('region', { name: 'Messages' });
const thread = () => screen.getByRole('region', { name: /^\[Name\]|^@|^Mai/ });

describe('Inbox (n-inb1–n-inb3)', () => {
  it('filters by source from the rail and by search text', async () => {
    renderScreen('Inbox-All');
    await userEvent.click(screen.getByRole('button', { name: /^Telegram/ }));
    expect(within(messages()).getAllByRole('listitem')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: /All inboxes/ }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search all messages' }), 'enterprise');
    expect(within(messages()).getAllByRole('listitem')).toHaveLength(1);
    await userEvent.clear(screen.getByRole('searchbox', { name: 'Search all messages' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search all messages' }), 'nothing matches this');
    expect(screen.getByText('No messages here')).toBeInTheDocument();
  });

  it('the Filters menu keeps unread messages only', async () => {
    renderScreen('Inbox-All');
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Unread only' }));
    expect(within(messages()).getAllByRole('listitem')).toHaveLength(3);
  });

  it('opens a thread, blocks sending a bracketed draft, sends a real one', async () => {
    renderScreen('Inbox-All');
    await userEvent.click(screen.getByRole('button', { name: /\[Customer\]/ }));
    expect(screen.getByRole('heading', { level: 2, name: '[Customer]' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Send on WhatsApp' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Replace the bracketed placeholder text before sending.');
    const reply = screen.getByRole('textbox', { name: 'Your reply' });
    await userEvent.clear(reply);
    await userEvent.type(reply, 'Yes, there is.');
    await userEvent.click(screen.getByRole('button', { name: 'Send on WhatsApp' }));
    expect(screen.getByText('Reply sent.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send on WhatsApp' })).toBeDisabled();
  });

  it('Snooze moves the thread to Snoozed, with Undo', async () => {
    renderScreen('Inbox-All');
    await userEvent.click(screen.getByRole('button', { name: 'Snooze' }));
    expect(screen.getByText('Snoozed.')).toBeInTheDocument();
    expect(within(messages()).queryByText('[Name] · [partner]')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /Snoozed/ }));
    expect(within(messages()).getByText('[Name] · [partner]')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByText('No messages here')).toBeInTheDocument();
  });

  it('labels and assigns a thread from its menus', async () => {
    renderScreen('Inbox-All');
    await userEvent.click(screen.getByRole('button', { name: 'Label' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Press' }));
    expect(within(thread()).getByText('Press')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Assign' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: '[Teammate 1]' }));
    expect(screen.getByRole('button', { name: 'Assigned: [Teammate 1]' })).toBeInTheDocument();
  });

  it('Needs reply: No reply needed and Snooze take items off the list; Draft all says nothing sends', async () => {
    renderScreen('Inbox-NeedsReply');
    expect(screen.getAllByRole('article')).toHaveLength(5);
    await userEvent.click(screen.getAllByRole('button', { name: 'No reply needed' })[0]);
    expect(screen.getAllByRole('article')).toHaveLength(4);
    expect(screen.getByText('[Name], [role]: no reply needed.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Draft all (4)' }));
    expect(screen.getByText(/Nothing sends without you/)).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('link', { name: 'Review draft reply' })[0]);
    expect(screen.getByRole('heading', { level: 1, name: 'Inbox' })).toBeInTheDocument();
  });

  it('Connect: Reconnect fixes the broken source and clears the error; Settings disconnects', async () => {
    renderScreen('Inbox-Connect', 'error');
    expect(screen.getByRole('alert')).toHaveTextContent('Discord stopped syncing');
    await userEvent.click(screen.getAllByRole('button', { name: 'Reconnect' })[0]);
    expect(screen.queryByRole('alert')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'X settings' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Disconnect' }));
    expect(screen.getAllByRole('button', { name: 'Connect' })).toHaveLength(4);
  });
});
