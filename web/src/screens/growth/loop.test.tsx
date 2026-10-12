import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { GalleryScreen } from '../../gallery/Gallery';
import { screenPath } from '../../gallery/screenPath';
import { planTemplates } from '../../domain/event';
import { growthSession } from './session';
import { growthArtboards } from './paths';
import { loopStore } from '../../flows/loop/store';
import { Quests as QuestsScreen } from './Quests';
import { quests } from './quests.fixtures';
import { EventsBoard as EventsBoardScreen } from './Events-Board';
import { eventsBoard } from './board.fixtures';
import { DistributeAdapt as AdaptScreen } from './Distribute-Adapt';
import { adapt } from './adapt.fixtures';
import { gateFor, type GateContext } from '../../domain/queue';
import { approveSubmission, questWithPaid } from '../../domain/quest';

vi.mock('../../lib/supabase', () => ({ supabase: null }));

// Flow tests for the ADR-012 loop screens built on the growth page (Grow-Home, Distribute-Adapt, Events, Event-Detail,
// Events-Board, Event-Rating). Nothing may touch the network (issue #45).
let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  growthSession.reset();
  loopStore.reset();
  fetchSpy = vi.fn(() => { throw new Error('the loop screens must not call fetch'); });
  vi.stubGlobal('fetch', fetchSpy);
});
afterEach(() => {
  expect(fetchSpy).toHaveBeenCalledTimes(0);
  vi.unstubAllGlobals();
});

function at(path: string) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/screens/:artboard" element={<GalleryScreen />} />
      </Routes>
    </MemoryRouter>,
  );
  return user;
}

const h1 = (name: string | RegExp) => screen.getByRole('heading', { level: 1, name });
const withParam = (artboard: Parameters<typeof screenPath>[0], key: string, value: string) => `${screenPath(artboard)}${screenPath(artboard).includes('?') ? '&' : '?'}${key}=${value}`;

describe('Grow-Home', () => {
  it('uses the Grow stage with Overview current, and every card opens its board', async () => {
    const user = at(screenPath('Grow-Home'));
    expect(h1('Grow your reach')).toBeInTheDocument();
    const tabs = screen.getByRole('navigation', { name: 'Grow' });
    expect(within(tabs).getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
    const events = screen.getByRole('region', { name: 'Events' });
    await user.click(within(events).getByRole('link', { name: 'Events' }));
    expect(h1('Events')).toBeInTheDocument();
  });

  it('every card link points at a typed board', () => {
    at(screenPath('Grow-Home'));
    for (const name of ['Ambassadors', 'Campaigns', 'Engage', 'Partners and leads', 'Referrals and team']) {
      for (const link of within(screen.getByRole('region', { name })).getAllByRole('link')) expect(link.getAttribute('href')).toMatch(/^\/screens\//);
    }
  });

  it('the Events tile counts the events Events shows, including one added there', async () => {
    const user = at(screenPath('Grow-Home'));
    expect(screen.getByText('next: Tue, you’re attending')).toBeInTheDocument();
    const tile = () => screen.getByText(/^next: /).closest('a')!;
    const before = Number(within(tile()).getByText(/^\d+$/).textContent);
    await user.click(within(screen.getByRole('region', { name: 'Events' })).getByRole('link', { name: 'Events' }));
    await user.click(screen.getByRole('button', { name: 'Add an event' }));
    await user.type(screen.getByLabelText('Event name'), '[[Meetup] agent night');
    await user.type(screen.getByLabelText(/^Place/), 'Online');
    await user.type(screen.getByLabelText('Date'), '2026-12-01');
    await user.type(screen.getByLabelText('Starts at'), '18:00');
    await user.selectOptions(screen.getByLabelText('Your role'), 'hosting');
    await user.click(screen.getByRole('button', { name: 'Add event' }));
    await user.click(within(screen.getByRole('navigation', { name: 'Grow' })).getByRole('link', { name: 'Overview' }));
    expect(within(tile()).getByText(String(before + 1))).toBeInTheDocument();
  });

  it('first run teaches each card’s first action', () => {
    at(screenPath('Grow-Home', 'empty'));
    expect(screen.getByText('Add your first event to get a content plan for it.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add an event' })).toBeInTheDocument();
    expect(screen.getByText('None coming up')).toBeInTheDocument();
  });
});

describe('Distribute-Adapt', () => {
  it('Schedule waits for every version to be approved and free of conflicts, then schedules', async () => {
    const user = at(screenPath('Distribute-Adapt'));
    expect(within(screen.getByRole('navigation', { name: 'Distribute' })).getByRole('link', { name: 'Adapt and schedule' })).toHaveAttribute('aria-current', 'page');
    const schedule = screen.getByRole('button', { name: 'Schedule 3' });
    expect(schedule).toBeDisabled();
    expect(schedule).toHaveAccessibleDescription('Approve LinkedIn, Threads first.');
    await user.click(screen.getByRole('button', { name: 'Approve LinkedIn' }));
    await user.click(screen.getByRole('button', { name: 'Approve Threads' }));
    expect(schedule).toHaveAccessibleDescription(/LinkedIn: Tue 09:30 \(best time\) is taken by another aDNA post/);
    expect(screen.getByText('Taken by another aDNA post. Pick another time.')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('When on LinkedIn'), 'Tue 13:00');
    expect(schedule).toBeEnabled();
    await user.click(schedule);
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  it('editing the original makes every approval stale and the original needs approving again', async () => {
    const user = at(screenPath('Distribute-Adapt'));
    const x = screen.getByRole('region', { name: 'X' });
    expect(within(x).getByText('Approved')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit original' }));
    await user.type(screen.getByLabelText('Original post'), ' Try it.');
    await user.click(screen.getByRole('button', { name: 'Save original' }));
    expect(within(screen.getByRole('region', { name: 'X' })).getByText('Stale: approve again')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve original' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule 3' })).toHaveAccessibleDescription('The original’s approval is stale. Approve it again first.');
    await user.click(screen.getByRole('button', { name: 'Approve original' }));
    expect(screen.getByRole('button', { name: 'Schedule 3' })).toHaveAccessibleDescription(/^Approve X, LinkedIn, Threads first/);
  });

  it('a version failing a check shows the blocked badge and a disabled Approve', async () => {
    const user = at(screenPath('Distribute-Adapt'));
    await user.click(screen.getByRole('checkbox', { name: /Bluesky/ }));
    const bluesky = screen.getByRole('region', { name: 'Bluesky' });
    expect(within(bluesky).getByText('Blocked: 1 claim has no source')).toBeInTheDocument();
    expect(within(bluesky).getByRole('button', { name: 'Approve Bluesky' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Schedule 4' })).toHaveAccessibleDescription('Fix the Bluesky version first.');
  });

  it('an X version over 280 is blocked, counted the way X counts', async () => {
    const user = at(screenPath('Distribute-Adapt'));
    await user.click(screen.getByRole('button', { name: 'Edit X version' }));
    await user.type(screen.getByLabelText('X version'), ` ${'a'.repeat(120)}`);
    await user.click(screen.getByRole('button', { name: 'Save X version' }));
    const x = screen.getByRole('region', { name: 'X' });
    expect(within(x).getByText(/^Blocked: \d+ over X’s 280 limit$/)).toBeInTheDocument();
    expect(within(x).getByRole('button', { name: 'Approve X' })).toBeDisabled();
  });

  it('with no platforms chosen, Schedule is disabled', async () => {
    const user = at(screenPath('Distribute-Adapt'));
    for (const name of ['X', 'LinkedIn', 'Threads']) await user.click(screen.getByRole('checkbox', { name: new RegExp(`^${name}`) }));
    expect(screen.getByRole('button', { name: 'Schedule 0' })).toHaveAccessibleDescription('Choose at least one platform.');
    expect(screen.getByRole('heading', { name: 'No platforms chosen' })).toBeInTheDocument();
  });

  it('the error state shows the publish failed alert', () => {
    at(screenPath('Distribute-Adapt', 'error'));
    expect(screen.getByText('LinkedIn did not publish')).toBeInTheDocument();
  });
});

describe('Events', () => {
  it('switches Upcoming and Past, filters by role, and opens an event', async () => {
    const user = at(screenPath('Events'));
    const table = () => screen.getByRole('table');
    expect(within(table()).getByRole('link', { name: '[Conference] side event: agent tooling night' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Role'), 'hosting');
    expect(within(table()).queryByRole('link', { name: '[Conference] side event: agent tooling night' })).toBeNull();
    expect(within(table()).getByRole('link', { name: '[City] builders meetup' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Role'), 'all');
    await user.click(screen.getByRole('button', { name: /^Past/ }));
    expect(within(table()).getByText('6 posts verified · 4 leads')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Upcoming/ }));
    await user.click(within(table()).getByRole('link', { name: '[Conference] side event: agent tooling night' }));
    expect(h1('[Conference] side event: agent tooling night')).toBeInTheDocument();
  });

  it('accepting a Luma event asks for the role, and the role picks its plan', async () => {
    const user = at(screenPath('Events'));
    await user.click(screen.getByRole('button', { name: 'Accept [Summit] side event' }));
    expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Your role at [Summit] side event'), 'attending');
    await user.click(screen.getByRole('button', { name: 'Accept' }));
    expect(screen.queryByRole('heading', { name: 'New from your Luma calendar' })).toBeNull();
    await user.click(within(screen.getByRole('table')).getByRole('link', { name: '[Summit] side event' }));
    expect(screen.getAllByRole('region', { name: /^(Countdown|Recap|Follow up)$/ })).toHaveLength(planTemplates.attending.length);
  });

  it('Add an event validates on the client', async () => {
    const user = at(screenPath('Events'));
    await user.click(screen.getByRole('button', { name: 'Add an event' }));
    await user.click(screen.getByRole('button', { name: 'Add event' }));
    expect(screen.getByText('Name the event.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Name the event.')).toBeNull();
  });

  it('empty and error states', () => {
    at(screenPath('Events', 'empty'));
    expect(screen.getByRole('heading', { name: 'No events yet' })).toBeInTheDocument();
  });

  it('error says Luma is disconnected and the Luma card says what connecting needs', () => {
    at(screenPath('Events', 'error'));
    expect(screen.getByText('Luma is disconnected')).toBeInTheDocument();
    expect(screen.getByText(/Importing needs Luma Plus/)).toBeInTheDocument();
  });
});

describe('Event-Detail', () => {
  it('the role select swaps the plan template; drafts keep their phase', async () => {
    const user = at(screenPath('Event-Detail'));
    expect(screen.getByRole('region', { name: 'Announce' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Countdown' })).getByText('Needs you · 1 of 3 ready')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/^Change role/), 'attending');
    expect(screen.queryByRole('region', { name: 'Announce' })).toBeNull();
    expect(within(screen.getByRole('region', { name: 'Countdown' })).getByText('Needs you · 1 of 3 ready')).toBeInTheDocument();
    expect(screen.getByText(/you’re attending/)).toBeInTheDocument();
  });

  it('drafting a plan item makes ordinary drafts and the item takes their status', async () => {
    const user = at(withParam('Event-Detail', 'event', 'ev-meetup'));
    const announce = screen.getByRole('region', { name: 'Announce' });
    expect(within(announce).getByText('Not drafted')).toBeInTheDocument();
    await user.click(within(announce).getByRole('button', { name: 'Draft the post' }));
    expect(within(screen.getByRole('region', { name: 'Announce' })).getByText('Needs you')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review 1 post' })).toBeInTheDocument();
  });

  it('on the day and after are their own events; after shows results', () => {
    at(withParam('Event-Detail', 'event', 'ev-main-stage'));
    expect(screen.getByText('This event has ended')).toBeInTheDocument();
    expect(screen.getByText('Not available')).toBeInTheDocument();
  });

  it('error is Luma cancelling the event; empty makes the plan', async () => {
    at(screenPath('Event-Detail', 'error'));
    expect(screen.getByText('Luma says this event was cancelled')).toBeInTheDocument();
  });

  it('plan empty: Make the plan builds it from the role', async () => {
    const user = at(screenPath('Event-Detail', 'empty'));
    await user.click(screen.getByRole('button', { name: 'Make the plan' }));
    expect(screen.getByRole('region', { name: 'Announce' })).toBeInTheDocument();
  });

  it('rate this event opens the event’s rating page', async () => {
    const user = at(screenPath('Event-Detail'));
    await user.click(screen.getByRole('link', { name: 'Rate this event' }));
    expect(h1('[Conference] side event: agent tooling night')).toBeInTheDocument();
    expect(screen.getByText('Rating opens after the event ends.')).toBeInTheDocument();
  });
});

describe('Events-Board (public, roadmap)', () => {
  it('searches, filters by kind, sorts and opens an event', async () => {
    const user = at(screenPath('Events-Board'));
    expect(screen.getByRole('status')).toHaveTextContent('5 events');
    await user.type(screen.getByLabelText('Search events'), 'melbourne');
    expect(screen.getByRole('status')).toHaveTextContent('1 event');
    await user.clear(screen.getByLabelText('Search events'));
    await user.selectOptions(screen.getByLabelText('Kind'), 'side-event');
    expect(screen.getByRole('status')).toHaveTextContent('2 events');
    await user.selectOptions(screen.getByLabelText('Kind'), 'all');
    await user.selectOptions(screen.getByLabelText('Sort'), 'lowest');
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(within(rows[1]).getByRole('link')).toHaveTextContent('[Summit] VIP dinner');
    await user.click(within(rows[1]).getByRole('link'));
    expect(h1('[Summit] VIP dinner')).toBeInTheDocument();
  });

  it('empty state: no ratings yet', () => {
    at(screenPath('Events-Board', 'empty'));
    expect(screen.getByRole('heading', { name: 'No ratings yet' })).toBeInTheDocument();
  });
});

describe('Event-Rating (public, roadmap)', () => {
  it('shows the organiser reply under the rating it answers', () => {
    at(screenPath('Event-Rating'));
    expect(screen.getByText(/next year the investor table will be curated/)).toBeInTheDocument();
  });

  it('is locked until attendance is proven; a failed proof can be retried', async () => {
    const user = at(screenPath('Event-Rating'));
    expect(screen.getByLabelText('Talks worth it')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Prove I went with Luma' }));
    expect(screen.getByRole('button', { name: 'Prove I went with Luma' })).toBeDisabled();
    expect(await screen.findByText('We couldn’t confirm you went')).toBeInTheDocument();
    expect(screen.getByLabelText('Talks worth it')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Try another way' }));
    expect(screen.getByRole('button', { name: 'Prove I went with Luma' })).toBeEnabled();
  });

  it('after proof, Register waits for all five ratings, none pre-selected, then counts the rating', async () => {
    const user = at(withParam('Event-Rating', 'event', 'b-demo'));
    expect(screen.getAllByText(/96 registered · 96 shown/)[0]).toBeInTheDocument();
    await user.type(screen.getByLabelText('Guest-list email'), 'attendee@example.com');
    await user.click(screen.getByRole('button', { name: 'Check the guest list' }));
    expect(await screen.findByText('You went')).toBeInTheDocument();
    const register = screen.getByRole('button', { name: 'Register my rating' });
    for (const label of ['Talks worth it', 'Well run', 'Right people', 'Sponsor value', 'Would go again']) {
      expect(screen.getByLabelText(label)).toHaveValue('');
      expect(register).toBeDisabled();
      await user.selectOptions(screen.getByLabelText(label), '5');
    }
    await user.type(screen.getByLabelText('In a line'), 'Worth it');
    await user.click(register);
    expect(screen.getByText('You rated it 5.0 of 5')).toBeInTheDocument();
    expect(screen.getAllByText(/97 registered · 97 shown/)[0]).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit my rating' }));
    expect(screen.getByLabelText('Talks worth it')).toHaveValue('5');
  });

  it('an edit adds a version and keeps the old one; it never counts twice', async () => {
    const user = at(withParam('Event-Rating', 'event', 'b-demo'));
    const rateAll = async (score: string) => {
      for (const label of ['Talks worth it', 'Well run', 'Right people', 'Sponsor value', 'Would go again']) await user.selectOptions(screen.getByLabelText(label), score);
    };
    await user.type(screen.getByLabelText('Guest-list email'), 'attendee@example.com');
    await user.click(screen.getByRole('button', { name: 'Check the guest list' }));
    await screen.findByText('You went');
    await rateAll('5');
    await user.type(screen.getByLabelText('In a line'), 'First take');
    await user.click(screen.getByRole('button', { name: 'Register my rating' }));
    await user.click(screen.getByRole('button', { name: 'Edit my rating' }));
    await rateAll('3');
    await user.clear(screen.getByLabelText('In a line'));
    await user.type(screen.getByLabelText('In a line'), 'Second take');
    await user.click(screen.getByRole('button', { name: 'Register my edit' }));
    expect(screen.getByText('You rated it 3.0 of 5')).toBeInTheDocument();
    expect(screen.getByText('Edited, see earlier versions (1)')).toBeInTheDocument();
    expect(screen.getByText('“First take”')).toBeInTheDocument();
    expect(screen.getAllByText(/97 registered · 97 shown/)[0]).toBeInTheDocument();
  });

  it('a removed rating shows as a tombstone with its date and reason, and still counts as registered', () => {
    at(screenPath('Event-Rating'));
    expect(screen.getByText(/^Removed \[date\]: Named a private person/)).toBeInTheDocument();
    expect(screen.getByText(/41 registered · 40 shown/, { selector: 'p' })).toBeInTheDocument();
  });

  it('an upcoming event does not open rating yet', () => {
    at(withParam('Event-Rating', 'event', 'b-night'));
    expect(screen.getByText('Rating opens after the event ends.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Register my rating' })).toBeNull();
  });

  it('links back to the board', async () => {
    const user = at(screenPath('Event-Rating'));
    await user.click(screen.getByRole('link', { name: 'All events' }));
    expect(h1('Is this event worth it?')).toBeInTheDocument();
    expect(growthArtboards.eventsBoard).toBe('Events-Board');
  });
});

describe('Quests', () => {
  it('approves a submission through the shared queue; a blocked one cannot be approved', async () => {
    const user = at(screenPath('Quests'));
    expect(within(screen.getByRole('navigation', { name: 'Grow' })).getByRole('link', { name: 'Ambassadors' })).toHaveAttribute('aria-current', 'page');
    const answers = screen.getByRole('region', { name: 'Answer 5 setup questions in the community' });
    expect(within(answers).getByText('2 to review')).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Quest submissions' });
    const [first, second] = within(list).getAllByRole('button', { name: 'Approve and pay' });
    expect(second).toBeDisabled();
    expect(within(list).getByText('Blocked: Disclosure missing. Ask them to add it.')).toBeInTheDocument();
    await user.click(first);
    expect(within(list).getByText('Approved. The 10 USDC payout is queued.')).toBeInTheDocument();
    expect(loopStore.read().outcomes['q-quest-answers-1']).toMatch(/^Approved/);
    expect(screen.getByText('150 USDC')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Answer 5 setup questions in the community' })).getByText('1 to review')).toBeInTheDocument();
  });

  it('Submissions shows one quest’s submissions', async () => {
    const user = at(screenPath('Quests'));
    await user.click(within(screen.getByRole('region', { name: /set up aDNA in an existing repo/ })).getByRole('button', { name: 'Submissions' }));
    expect(screen.getByRole('heading', { name: 'No submissions here' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'All submissions' }));
    expect(screen.getByRole('list', { name: 'Quest submissions' })).toBeInTheDocument();
  });

  it('a new quest opens only when valid, then shows as Open', async () => {
    const user = at(screenPath('Quests'));
    await user.click(screen.getByRole('button', { name: 'New quest' }));
    const open = screen.getByRole('button', { name: 'Open quest' });
    expect(open).toBeDisabled();
    await user.type(screen.getByLabelText('Task'), 'Write an event recap');
    await user.selectOptions(screen.getByLabelText('Format'), 'recap');
    await user.type(screen.getByLabelText('Reward per completion (USDC)'), '20');
    await user.type(screen.getByLabelText('Slots'), '4');
    expect(screen.getByLabelText('Budget cap')).toHaveValue('80.00 USDC, held before the quest opens');
    await user.click(open);
    expect(within(screen.getByRole('region', { name: 'Write an event recap' })).getByText('Open')).toBeInTheDocument();
  });

  it('empty: suggestions from the kit prefill the form, format included', async () => {
    const user = at(screenPath('Quests', 'empty'));
    await user.click(screen.getByRole('button', { name: 'Record a 2-minute demo of an agent reading the folder' }));
    expect(screen.getByLabelText('Task')).toHaveValue('Record a 2-minute demo of an agent reading the folder');
    expect(screen.getByLabelText('Format')).toHaveValue('video');
    expect(screen.getByRole('button', { name: 'Open quest' })).toBeDisabled();
  });
});

describe('Quests: slots cap approvals (Codex review on PR #102)', () => {
  it('with one slot left and two pending submissions, approving one blocks the other', async () => {
    const user = userEvent.setup();
    const pending = quests.submissions.map((s) => ({ ...s, disclosure: 'present' as const }));
    const data = { ...quests, submissions: pending, quests: quests.quests.map((q) => (q.id === 'qst-answers' ? { ...q, slots: 3, paid: 2 } : q)) };
    render(<MemoryRouter><QuestsScreen data={data} /></MemoryRouter>);
    const list = screen.getByRole('list', { name: 'Quest submissions' });
    const [first, second] = within(list).getAllByRole('button', { name: 'Approve and pay' });
    expect(second).toBeEnabled();
    await user.click(first);
    expect(within(list).getByRole('button', { name: 'Approve and pay' })).toBeDisabled();
    expect(within(list).getByText('Blocked: All 3 slots are paid; the budget is reached.')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Answer 5 setup questions in the community' })).getByText('Paid · budget reached')).toBeInTheDocument();
  });
});

describe('Frames take the stage from the board home (Codex review on PR #102)', () => {
  it('Platforms is on Distribute, Badge-Embed and Tips-Received on Verify', () => {
    for (const [board, stage, tab] of [['Platforms', 'Distribute', 'Platforms'], ['Badge-Embed', 'Verify', 'Badge'], ['Tips-Received', 'Verify', 'Tips']] as const) {
      const { unmount } = render(<MemoryRouter initialEntries={[screenPath(board)]}><Routes><Route path="/screens/:artboard" element={<GalleryScreen />} /></Routes></MemoryRouter>);
      expect(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: stage })).toHaveAttribute('aria-current', 'page');
      expect(within(screen.getByRole('navigation', { name: stage })).getByRole('link', { name: tab })).toHaveAttribute('aria-current', 'page');
      unmount();
    }
  });

  it('public screens keep their nav in the gallery', () => {
    at(screenPath('Referral-Landing'));
    const nav = screen.getAllByRole('navigation', { name: 'Main' })[0];
    expect(within(nav).getByRole('link', { name: 'Ledger' }).getAttribute('href')).toMatch(/^\/screens\/Ledger/);
  });
});

describe('Codex round 2 on PR 102', () => {
  it('an edited version is re-checked, never passed: appending a space to the blocked Bluesky version keeps it blocked', async () => {
    const user = at(screenPath('Distribute-Adapt'));
    await user.click(screen.getByRole('checkbox', { name: /Bluesky/ }));
    await user.click(screen.getByRole('button', { name: 'Edit Bluesky version' }));
    await user.type(screen.getByLabelText('Bluesky version'), ' ');
    await user.click(screen.getByRole('button', { name: 'Save Bluesky version' }));
    const bluesky = () => screen.getByRole('region', { name: 'Bluesky' });
    expect(within(bluesky()).getByText('Blocked: re-checking claims')).toBeInTheDocument();
    expect(within(bluesky()).getByRole('button', { name: 'Approve Bluesky' })).toBeDisabled();
    expect(await within(bluesky()).findByText('Blocked: 1 claim has no source')).toBeInTheDocument();
    expect(within(bluesky()).getByRole('button', { name: 'Approve Bluesky' })).toBeDisabled();
  });

  it('removing the unsourced claim passes only after the re-check', async () => {
    const user = userEvent.setup();
    const data = { ...adapt, chosen: ['bluesky'] };
    render(<MemoryRouter><AdaptScreen data={data} /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Edit Bluesky version' }));
    await user.clear(screen.getByLabelText('Bluesky version'));
    await user.type(screen.getByLabelText('Bluesky version'), 'Your agent didn’t forget. It was never told.');
    await user.click(screen.getByRole('button', { name: 'Save Bluesky version' }));
    expect(screen.getByText('Blocked: re-checking claims')).toBeInTheDocument();
    expect(await screen.findByText('Checks passed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve Bluesky' })).toBeEnabled();
  });

  it('Upcoming sorts nearest first', async () => {
    const user = userEvent.setup();
    const later = { ...eventsBoard.events[4], id: 'b-later', name: '[Summit] later side event', endsOn: '2026-12-01' };
    const sooner = { ...eventsBoard.events[4], id: 'b-sooner', name: '[Meetup] sooner night', endsOn: '2026-10-20' };
    render(<MemoryRouter><EventsBoardScreen data={{ ...eventsBoard, events: [later, sooner] }} /></MemoryRouter>);
    await user.selectOptions(screen.getByLabelText('Sort'), 'upcoming');
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(within(rows[1]).getByRole('link')).toHaveTextContent('[Meetup] sooner night');
    expect(within(rows[2]).getByRole('link')).toHaveTextContent('[Summit] later side event');
  });

  it('a slot filled from Quests blocks Today’s Approve for the other submission (one gate, one action)', async () => {
    const user = userEvent.setup();
    const pending = quests.submissions.map((s) => ({ ...s, disclosure: 'present' as const }));
    const data = { ...quests, submissions: pending, quests: quests.quests.map((q) => (q.id === 'qst-answers' ? { ...q, slots: 3, paid: 2 } : q)) };
    render(<MemoryRouter><QuestsScreen data={data} /></MemoryRouter>);
    await user.click(within(screen.getByRole('list', { name: 'Quest submissions' })).getAllByRole('button', { name: 'Approve and pay' })[0]);
    // Today's path: the same gateFor, given the quests with the loop store's paid slots.
    const questOf = (paid: Record<string, number>) => (id: string) => { const q = data.quests.find((x) => x.id === id); return q && questWithPaid(q, paid); };
    const ctx: GateContext = { brainVersion: '3.1', proposal: () => undefined, quest: questOf(loopStore.read().questPaid) };
    const gate = gateFor(pending[1], ctx);
    expect(gate).toEqual({ blocking: true, label: 'All 3 slots are paid; the budget is reached.' });
    expect(approveSubmission(gate, 'qst-answers', ctx.quest('qst-answers'), pending[1].payout).ok).toBe(false);
    // And the other way: with the slot still free, Today's approval of it uses the same action and outcome.
    const fresh: GateContext = { ...ctx, quest: questOf({}) };
    expect(approveSubmission(gateFor(pending[1], fresh), 'qst-answers', fresh.quest('qst-answers'), pending[1].payout)).toEqual({ ok: true, paid: 3, outcome: 'Approved. The 10 USDC payout is queued.' });
  });

  it('an unknown quest, or a payout that is not the quest’s reward, is blocked in the gate and the action', () => {
    const item = { ...quests.submissions[0], disclosure: 'present' as const };
    const known = (id: string) => quests.quests.find((q) => q.id === id);
    const ctx: GateContext = { brainVersion: '3.1', proposal: () => undefined, quest: known };
    const forged = { blocking: false, label: 'forged pass' };
    const unknown = { ...item, questId: 'qst-missing' };
    expect(gateFor(unknown, ctx)).toEqual({ blocking: true, label: 'Quest not found.' });
    expect(approveSubmission(forged, 'qst-missing', known('qst-missing'), unknown.payout)).toEqual({ ok: false, label: 'Quest not found.' });
    const greedy = { ...item, payout: { amount: 500, unit: 'USDC' as const } };
    expect(gateFor(greedy, ctx).label).toMatch(/not this quest’s reward \(10 USDC\)/);
    expect(approveSubmission(forged, 'qst-answers', known('qst-answers'), greedy.payout).ok).toBe(false);
    expect(approveSubmission(gateFor(item, ctx), 'qst-answers', known('qst-answers'), item.payout).ok).toBe(true);
  });
});

describe('Brain-derived approvals follow the Brain version (Codex review on PR 102)', () => {
  it('a version approved before a rule is approved in Learn-Rules is stale after it', async () => {
    const user = userEvent.setup();
    const mount = (path: string) => render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/screens/:artboard" element={<GalleryScreen />} /></Routes></MemoryRouter>);
    let view = mount(screenPath('Distribute-Adapt'));
    await user.click(screen.getByRole('button', { name: 'Approve LinkedIn' }));
    expect(within(screen.getByRole('region', { name: 'LinkedIn' })).getByText('Approved')).toBeInTheDocument();
    view.unmount();
    view = mount(screenPath('Learn-Rules'));
    const rule = screen.getAllByRole('region').find((r) => within(r).queryByRole('button', { name: 'Approve rule' }))!;
    await user.click(within(rule).getByRole('button', { name: 'Approve rule' }));
    view.unmount();
    mount(screenPath('Distribute-Adapt'));
    expect(within(screen.getByRole('region', { name: 'LinkedIn' })).getByText('Stale: approve again')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'X' })).getByText('Stale: approve again')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve original' })).toBeInTheDocument();
  });
});

describe('Nothing is actionable before the data loads (Codex review on PR 102)', () => {
  it('Event-Rating hides the rate panel while loading and on error', () => {
    for (const state of ['loading', 'error'] as const) {
      const { unmount } = render(<MemoryRouter initialEntries={[screenPath('Event-Rating', state)]}><Routes><Route path="/screens/:artboard" element={<GalleryScreen />} /></Routes></MemoryRouter>);
      expect(screen.queryByRole('button', { name: 'Prove I went with Luma' })).toBeNull();
      expect(screen.queryByRole('heading', { name: 'Rate this event' })).toBeNull();
      unmount();
    }
  });

  it('the other screens show no actions while loading', () => {
    const cases = [
      ['Distribute-Adapt', /^Schedule/],
      ['Events', /^Add an event$/],
      ['Event-Detail', /^Change role/],
      ['Quests', /^New quest$/],
    ] as const;
    for (const [board, control] of cases) {
      const { unmount } = render(<MemoryRouter initialEntries={[screenPath(board, 'loading')]}><Routes><Route path="/screens/:artboard" element={<GalleryScreen />} /></Routes></MemoryRouter>);
      expect(screen.queryByRole('button', { name: control }) ?? screen.queryByLabelText(control)).toBeNull();
      unmount();
    }
    const { unmount } = render(<MemoryRouter initialEntries={[screenPath('Quests', 'error')]}><Routes><Route path="/screens/:artboard" element={<GalleryScreen />} /></Routes></MemoryRouter>);
    expect(screen.queryByRole('button', { name: 'New quest' })).toBeNull();
    unmount();
  });
});
