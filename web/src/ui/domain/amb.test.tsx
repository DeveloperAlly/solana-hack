// Amb* domain components (issue #53): each renders with 0 axe violations, and its states and interactions work.
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { Button } from '../primitives';
import { AmbAccountChip } from './AmbAccountChip';
import { AmbCampaignCard } from './AmbCampaignCard';
import { AmbChecksList } from './AmbChecksList';
import { DraftEditor, highlightRuns } from './DraftEditor';
import { AmbOnBrandMeter } from './AmbOnBrandMeter';
import { AmbPublishRouteCard } from './AmbPublishRouteCard';
import { sampleCampaign, sampleChecks, sampleClosedCampaign, sampleDraft } from './ambSamples';

describe('D4 AmbOnBrandMeter', () => {
  it.each([[74, 'Drifting'], [91, 'On brand']])('score %i reads %s as a labelled meter', async (score, label) => {
    const { container } = renderWithRouter(<AmbOnBrandMeter score={score} threshold={80} />);
    expect(screen.getByRole('meter', { name: 'On-brand score' })).toHaveAttribute('aria-valuenow', String(score));
    expect(screen.getByText(label)).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('D3 AmbChecksList', () => {
  it('lists flags with one-click fixes', async () => {
    const onFix = vi.fn();
    const { container } = renderWithRouter(<AmbChecksList checks={sampleChecks} onFix={onFix} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove line: Banned claim' }));
    expect(onFix).toHaveBeenCalledWith('banned');
    await expectNoAxeViolations(container);
  });
  it('badges a blocking check and shows no fix button for a check without a fix', () => {
    renderWithRouter(<AmbChecksList checks={[{ id: 'limit', title: 'Over the limit', label: 'Over by 12.', blocking: true }, sampleChecks[1]]} onFix={() => undefined} />);
    expect(screen.getAllByText('Blocks publishing')).toHaveLength(1);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
  it('is compact on mobile and says when nothing is flagged', () => {
    const { unmount } = renderWithRouter(<AmbChecksList compact checks={sampleChecks} onFix={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Remove: Banned claim' })).toBeInTheDocument();
    unmount();
    renderWithRouter(<AmbChecksList checks={[]} onFix={() => undefined} />);
    expect(screen.getByText('No flags.')).toBeInTheDocument();
  });
});

function EditorHarness({ limit }: { limit?: number }) {
  const [text, setText] = useState(sampleDraft);
  return <DraftEditor label="Draft" value={text} onChange={setText} highlights={['memory dump']} charLimit={limit} toolbar={<Button variant="secondary">Undo</Button>} />;
}

describe('D5 DraftEditor', () => {
  it('edits a real textarea and highlights flagged phrases', async () => {
    const { container } = renderWithRouter(<EditorHarness limit={3000} />);
    const box = screen.getByRole('textbox', { name: 'Draft' });
    await userEvent.type(box, '!');
    expect(box).toHaveValue(`${sampleDraft}!`);
    expect(container.querySelector('mark')).toHaveTextContent('memory dump');
    expect(screen.getByText(/\/ 3000 characters/)).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
  it('flags text over the limit, and shows a skeleton while generating', () => {
    const { unmount } = renderWithRouter(<EditorHarness limit={10} />);
    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveAttribute('aria-invalid', 'true');
    unmount();
    renderWithRouter(<DraftEditor label="Draft" value="" onChange={() => undefined} generating />);
    expect(screen.getByRole('status', { name: 'Generating your draft' })).toBeInTheDocument();
  });
  it('splits text into flagged runs case-insensitively', () => {
    expect(highlightRuns('A Memory Dump here', ['memory dump'])).toEqual([{ text: 'A ', flagged: false }, { text: 'Memory Dump', flagged: true }, { text: ' here', flagged: false }]);
  });
});

describe('D24 AmbCampaignCard and D30 AmbPublishRouteCard', () => {
  it('renders open and closed campaign rows, a stacked link card, a route card and columns', async () => {
    const { container } = renderWithRouter(
      <>
        <div>
          <AmbCampaignCard {...sampleCampaign} action={<Button href="/x">View</Button>} />
          <AmbCampaignCard {...sampleClosedCampaign} />
          <AmbCampaignCard {...sampleCampaign} layout="stack" href="/detail" />
        </div>
        <AmbPublishRouteCard title="Post to LinkedIn for me" badge="Fastest · for this post" selected><Button>Post now</Button></AmbPublishRouteCard>
      </>,
    );
    expect(screen.getByText('budget 39% used')).toBeInTheDocument();
    expect(screen.getAllByText('Budget reached')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /aDNA launch week/ })).toHaveAttribute('href', '/detail');
    expect(screen.getByRole('heading', { name: 'Post to LinkedIn for me' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('AmbAccountChip', () => {
  it('shows the name and balance, the balance alone, or a Sign in link', async () => {
    const account = { name: 'Mai T.', balance: '15 USDC' };
    const { container, unmount } = renderWithRouter(<AmbAccountChip account={account} signInHref="/sign-in" />);
    expect(screen.getByText('Mai T. · 15 USDC')).toBeInTheDocument();
    await expectNoAxeViolations(container);
    unmount();
    const second = renderWithRouter(<AmbAccountChip account={account} signInHref="/sign-in" withName={false} />);
    expect(screen.getByText('15 USDC')).toBeInTheDocument();
    second.unmount();
    renderWithRouter(<AmbAccountChip account={null} signInHref="/sign-in" />);
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in');
  });
});
