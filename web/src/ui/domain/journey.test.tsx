// Journey components (issue #48): each renders, handles its interactions, and has 0 axe violations.
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { JourneyAha } from './JourneyAha';
import { JourneyQuote } from './JourneyQuote';
import { JourneyFactCard, type JourneyFact } from './JourneyFactCard';
import { JourneyAddableToggles } from './JourneyAddableToggles';
import { JourneyStepCards } from './JourneyStepCards';
import { JourneyClaimText } from './JourneyClaimText';
import { JourneyChecklist } from './JourneyChecklist';

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

describe('D86 JourneyChecklist', () => {
  it('counts done items and links open ones', async () => {
    const { container } = renderWithRouter(<JourneyChecklist title="Get set up" items={[{ id: 'a', label: 'Kit', hint: '', done: true }, { id: 'b', label: 'Add sources', hint: 'fewer questions', done: false, href: '/screens/J1-Read' }]} />);
    expect(screen.getByRole('progressbar', { name: '1 of 2 done' })).toHaveAttribute('value', '50');
    expect(screen.getByRole('link', { name: 'Start: Add sources' })).toHaveAttribute('href', '/screens/J1-Read');
    expect(screen.getByText('done')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
