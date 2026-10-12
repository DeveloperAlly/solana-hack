// Journey components (issue #48): each renders, handles its interactions, and has 0 axe violations.
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { JourneyAha } from './JourneyAha';
import { JourneyQuote } from './JourneyQuote';
import { JourneyFactCard, type JourneyFact } from './JourneyFactCard';
import { JourneyProgress } from './JourneyProgress';
import { JourneySplit } from './JourneySplit';
import { JourneyChoiceCards } from './JourneyChoiceCards';
import { JourneyInlineForm } from './JourneyInlineForm';
import { JourneyAddableToggles } from './JourneyAddableToggles';
import { JourneyCopyButton } from './JourneyCopyButton';
import { JourneyFileButton } from './JourneyFileButton';
import { JourneyStepCards } from './JourneyStepCards';
import { JourneyClaimText } from './JourneyClaimText';
import { JourneyGateCard } from './JourneyGateCard';
import { JourneyChecklist } from './JourneyChecklist';
import { JourneyStatusList } from './JourneyStatusList';
import { JourneyPolishBar } from './JourneyPolishBar';

const fact: JourneyFact = {
  id: 'p',
  section: 'Positioning · Gate 2',
  status: 'found',
  statement: 'JamJam builds a brand kit, then drafts posts in that voice.',
  quote: 'Build your brand. Then start creating.',
  source: { label: 'jamjam.tech · home page', url: 'https://jamjam.tech' },
};

describe('D80 JourneyAha', () => {
  it('labels the moment in text, in both tones', async () => {
    const { container } = renderWithRouter(<><JourneyAha n={1}>It already knows us.</JourneyAha><JourneyAha n={5} tone="inverse">Anyone can check.</JourneyAha></>);
    expect(screen.getByText('Aha 1')).toBeInTheDocument();
    expect(container.querySelector('.inverse')).toHaveTextContent('Aha 5');
    await expectNoAxeViolations(container);
  });
});

describe('D81 JourneyQuote', () => {
  it('wraps the line in quote marks', async () => {
    const { container } = renderWithRouter(<JourneyQuote size="xs">Build your brand.</JourneyQuote>);
    expect(container.querySelector('blockquote')).toHaveTextContent('“Build your brand.”');
    await expectNoAxeViolations(container);
  });
});

describe('D14 JourneyFactCard', () => {
  it('shows the section, status, quote, source link, decision and actions', async () => {
    const { container } = renderWithRouter(<JourneyFactCard fact={fact} decision="Accepted" actions={<button type="button">Undo</button>} />);
    expect(screen.getByText('Found')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open the page/ })).toHaveAttribute('href', 'https://jamjam.tech');
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
  it('replaces the statement with an editor, and has a dashed variant', () => {
    const { container } = renderWithRouter(<JourneyFactCard fact={fact} variant="dashed" editor={<p>editing</p>} />);
    expect(screen.queryByText(fact.statement)).not.toBeInTheDocument();
    expect(screen.getByText('editing')).toBeInTheDocument();
    expect(container.querySelector('article')).toHaveClass('dashed');
  });
});

describe('P24 JourneyProgress', () => {
  it('is a labelled progressbar, clamped to 0 to 100', async () => {
    const { container } = renderWithRouter(<><JourneyProgress label="Readiness" value={140} hint="Rises as you confirm." /><JourneyProgress label="Setup" value={-5} grow /></>);
    expect(screen.getByRole('progressbar', { name: 'Readiness' })).toHaveAttribute('value', '100');
    expect(screen.getByRole('progressbar', { name: 'Setup' })).toHaveAttribute('value', '0');
    expect(screen.getByText('Rises as you confirm.')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('L9 JourneySplit', () => {
  it.each(['rail', '6-5', '7-5', '5-7'] as const)('lays out two columns at %s', async (ratio) => {
    const { container } = renderWithRouter(<JourneySplit ratio={ratio} first={<p>one</p>} second={<p>two</p>} />);
    expect(container.firstChild).toHaveClass(`r${ratio}`);
    expect(screen.getByText('one')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('C7 JourneyChoiceCards', () => {
  function Demo() {
    const [v, setV] = useState('b');
    return <JourneyChoiceCards legend="Which sounds most like you?" value={v} onChange={setV} options={[{ value: 'a', title: 'A', tag: 'Plainspoken', body: 'Alpha.' }, { value: 'b', title: 'B', body: 'Beta.' }]} />;
  }
  it('selects one card at a time and highlights it', async () => {
    const { container } = renderWithRouter(<Demo />);
    const a = screen.getByRole('radio', { name: 'A Plainspoken' });
    await userEvent.click(a);
    expect(a).toBeChecked();
    expect(a.closest('label')).toHaveClass('selected');
    expect(screen.getByRole('group', { name: 'Which sounds most like you?' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('D84 JourneyInlineForm', () => {
  it('validates on submit, clears as the value is fixed, and submits the trimmed value', async () => {
    const onSubmit = vi.fn();
    const { container } = renderWithRouter(<JourneyInlineForm label="Your website" submitLabel="Read my site" validate={(v) => (v ? null : 'Enter it.')} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Read my site' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter it.');
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText('Your website'), '  jamjam.tech ');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Read my site' }));
    expect(onSubmit).toHaveBeenCalledWith('jamjam.tech');
    await expectNoAxeViolations(container);
  });
  it('shows errors from the first render, a busy label and Cancel', async () => {
    const onCancel = vi.fn();
    renderWithRouter(<JourneyInlineForm label="Email" submitLabel="Send" busy busyLabel="Sending…" showErrorsNow defaultValue="x" validate={() => 'Bad.'} onSubmit={vi.fn()} onCancel={onCancel} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Bad.');
    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('D87 JourneyAddableToggles', () => {
  function Demo() {
    const [options, setOptions] = useState(['Pressmaster', 'Canva Brand Kit']);
    const [selected, setSelected] = useState(['Pressmaster']);
    return <JourneyAddableToggles label="Alternatives" options={options} selected={selected} onChange={setSelected} onAdd={(o) => { setOptions((x) => [...x, o]); setSelected((s) => [...s, o]); }} />;
  }
  it('toggles options and adds a validated one of your own', async () => {
    const { container } = renderWithRouter(<Demo />);
    const canva = screen.getByRole('button', { name: 'Canva Brand Kit' });
    await userEvent.click(canva);
    expect(canva).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: '+ Add' }));
    await userEvent.type(screen.getByLabelText('Add your own'), 'Pressmaster');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('alert')).toHaveTextContent('already listed');
    await userEvent.clear(screen.getByLabelText('Add your own'));
    await userEvent.type(screen.getByLabelText('Add your own'), 'Notion');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('button', { name: 'Notion' })).toHaveAttribute('aria-pressed', 'true');
    await expectNoAxeViolations(container);
  });
});

describe('C13 JourneyCopyButton', () => {
  it('copies the text and confirms it', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { container } = renderWithRouter(<JourneyCopyButton label="Copy post" text="Every brand tool" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy post' }));
    expect(await screen.findByRole('button', { name: 'Copy post: copied' })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith('Every brand tool');
    await expectNoAxeViolations(container);
  });
  it('says so when the browser refuses', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(async () => { throw new Error('denied'); }) }, configurable: true });
    renderWithRouter(<JourneyCopyButton label="Copy" text="x" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await screen.findByText(/Couldn't copy/)).toBeInTheDocument();
  });
});

describe('D85 JourneyFileButton', () => {
  it('passes the chosen file on', async () => {
    const onFile = vi.fn();
    const { container } = renderWithRouter(<JourneyFileButton label="PDF or DOCX" accept=".pdf" onFile={onFile} />);
    await userEvent.upload(screen.getByLabelText('PDF or DOCX'), new File(['x'], 'brand.pdf', { type: 'application/pdf' }));
    expect(onFile).toHaveBeenCalledWith(expect.objectContaining({ name: 'brand.pdf' }));
    await expectNoAxeViolations(container);
  });
});

describe('D83 JourneyStepCards', () => {
  it('is an ordered, labelled list', async () => {
    const { container } = renderWithRouter(<JourneyStepCards label="Steps" items={[{ title: 'Read', body: 'a' }, { title: 'Confirm', body: 'b' }]} />);
    expect(screen.getByRole('list', { name: 'Steps' }).tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    await expectNoAxeViolations(container);
  });
});

describe('D82 JourneyClaimText', () => {
  it('selects a claim', async () => {
    const onSelect = vi.fn();
    const { container } = renderWithRouter(<JourneyClaimText selected="a" onSelect={onSelect} segments={[{ text: 'Plain ' }, { text: 'claim one', claimId: 'a' }, { text: ' and ' }, { text: 'claim two', claimId: 'b' }]} />);
    expect(screen.getByRole('button', { name: 'Claim: claim one' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Claim: claim two' }));
    expect(onSelect).toHaveBeenCalledWith('b');
    await expectNoAxeViolations(container);
  });
});

describe('D17 JourneyGateCard', () => {
  it('approves with a why, edits the draft, and reopens', async () => {
    const onApprove = vi.fn();
    const onEdit = vi.fn();
    const onReopen = vi.fn();
    const props = { gate: 1, title: 'Purpose', draft: '[Purpose draft]', builtFrom: '2 facts', evidence: <p>evidence</p>, onApprove, onEdit, onReopen };
    const { container, rerender } = renderWithRouter(<JourneyGateCard {...props} />);
    await userEvent.type(screen.getByLabelText('Why (optional)'), 'Fits');
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalledWith('Fits');
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.clear(screen.getByLabelText('Purpose draft'));
    await userEvent.type(screen.getByLabelText('Purpose draft'), 'New purpose');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onEdit).toHaveBeenCalledWith('New purpose');
    await expectNoAxeViolations(container);
    rerender(<JourneyGateCard {...props} decision={{ by: 'ally', at: 'now', why: 'Fits' }} />);
    expect(screen.getByText(/Approved by ally · now/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Change' }));
    expect(onReopen).toHaveBeenCalled();
  });
});

describe('D86 JourneyChecklist', () => {
  it('counts done items and links open ones', async () => {
    const { container } = renderWithRouter(<JourneyChecklist title="Get set up" items={[{ id: 'a', label: 'Kit', hint: '', done: true }, { id: 'b', label: 'Add sources', hint: 'fewer questions', done: false, href: '/screens/J1-Read' }]} />);
    expect(screen.getByRole('progressbar', { name: '1 of 2 done' })).toHaveAttribute('value', '50');
    expect(screen.getByRole('link', { name: 'Start: Add sources' })).toHaveAttribute('href', '/screens/J1-Read');
    expect(screen.getByText('done')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('D12 JourneyStatusList', () => {
  it('shows chips and links', async () => {
    const { container } = renderWithRouter(<JourneyStatusList title="Sources" rows={[{ label: 'jamjam.tech', value: 'Read · 4 facts', solid: true }, { label: 'Kit v1', value: 'Registered', href: '/screens/Ledger' }]} />);
    expect(screen.getByRole('region', { name: 'Sources' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registered' })).toHaveAttribute('href', '/screens/Ledger');
    await expectNoAxeViolations(container);
  });
});

describe('D6 JourneyPolishBar', () => {
  it('applies an action and offers Undo for the last one', async () => {
    function Demo() {
      const [applied, setApplied] = useState<string[]>([]);
      return <JourneyPolishBar actions={['Shorten', 'Clarify']} applied={applied} onApply={(a) => setApplied((x) => [...x, a])} onUndo={() => setApplied((x) => x.slice(0, -1))} />;
    }
    const { container } = renderWithRouter(<Demo />);
    await userEvent.click(screen.getByRole('button', { name: 'Shorten' }));
    expect(screen.getByRole('status')).toHaveTextContent('Shorten applied');
    await userEvent.click(screen.getByRole('button', { name: 'Undo Shorten' }));
    expect(screen.queryByRole('button', { name: /Undo/ })).not.toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
