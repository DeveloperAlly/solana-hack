import { beforeEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router';
import { expectNoAxeViolations } from '../../test/axe';
import { CampaignStepFrame } from './CampaignStepFrame';
import { campaignStore } from './draft';
import { selectBrand } from '../brand/activeBrand';
import { campaignSteps } from './steps';
import { useCampaignFlow } from './useCampaignFlow';

const inputs: Record<string, boolean> = {};

// A stand-in for each of the six screens: the shared frame, with one checkbox standing for the step's own input.
function StepScreen() {
  const { artboard } = useParams();
  const step = campaignSteps.find((s) => s.artboard === artboard)!;
  // Each step's input lives outside the screen, as a real screen's lives in the draft, so it survives navigation.
  const [ready, setReadyState] = useState(Boolean(inputs[step.id]));
  const setReady = (v: boolean) => {
    inputs[step.id] = v;
    setReadyState(v);
  };
  const flow = useCampaignFlow(step.id, { stepComplete: ready, cancelHref: '/content' });
  return (
    <CampaignStepFrame flow={flow} title={step.label} missing={ready ? [] : ['tick the box']}>
      <label><input type="checkbox" checked={ready} onChange={(e) => setReady(e.target.checked)} /> {step.label} done</label>
      {flow.launched && <p>Launched</p>}
    </CampaignStepFrame>
  );
}

// Each artboard is its own screen in the gallery, so each mounts fresh (as the real six screens do).
function Screen() {
  const { artboard } = useParams();
  return <StepScreen key={artboard} />;
}

function at(artboard: string) {
  return render(
    <MemoryRouter initialEntries={[`/screens/${artboard}`]}>
      <Routes>
        <Route path="/screens/:artboard" element={<Screen />} />
        <Route path="/content" element={<p>Content</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const heading = () => screen.getByRole('heading', { level: 1 }).textContent;
const stepItems = () => within(screen.getByRole('list', { name: /^Step \d of 6$/ })).getAllByRole('listitem');

beforeEach(() => {
  campaignStore.reset();
  for (const k of Object.keys(inputs)) delete inputs[k];
});

describe('Campaign v2 flow (one step table)', () => {
  it('the table is the canvas stepper order', () => {
    expect(campaignSteps.map((s) => s.artboard)).toEqual([
      'Campaign-v2-1-Goal',
      'Campaign-v2-3-Audience',
      'Campaign-v2-2-Measure',
      'Campaign-v2-4-Plan',
      'Campaign-v2-5-Budget',
      'Campaign-v2-6-Launch',
    ]);
  });

  it('clicks through Goal to Launch, marking each step done in the stepper', async () => {
    const { container } = at('Campaign-v2-1-Goal');
    await expectNoAxeViolations(container);
    for (let i = 0; i < campaignSteps.length; i++) {
      expect(heading()).toBe(campaignSteps[i].label);
      const next = screen.getByRole('button', { name: campaignSteps[i].nextLabel });
      expect(next).toBeDisabled();
      expect(screen.getByRole('status')).toHaveTextContent('To continue: tick the box.');
      await userEvent.click(screen.getByRole('checkbox'));
      expect(next).toBeEnabled();
      await userEvent.click(next);
      if (i < campaignSteps.length - 1) {
        const items = stepItems();
        items.slice(0, i + 1).forEach((li) => expect(li).toHaveTextContent('(done)'));
        expect(items[i + 1]).toHaveAttribute('aria-current', 'step');
      }
    }
    expect(screen.getByText('Launched')).toBeInTheDocument();
  });

  it('Back goes to the previous step from every step, and Cancel leaves from step 1', async () => {
    for (let i = 1; i < campaignSteps.length; i++) {
      campaignStore.reset();
      const { unmount } = at(campaignSteps[i].artboard);
      await userEvent.click(screen.getByRole('link', { name: 'Back' }));
      expect(heading()).toBe(campaignSteps[i - 1].label);
      unmount();
    }
    at('Campaign-v2-1-Goal');
    await userEvent.click(screen.getByRole('link', { name: 'Cancel' }));
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('done steps link back; steps not done do not, even before the current one', async () => {
    at('Campaign-v2-1-Goal');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Next: audience' }));
    const items = stepItems();
    expect(within(items[0]).getByRole('link')).toBeInTheDocument();
    expect(within(items[1]).queryByRole('link')).toBeNull();
    await userEvent.click(within(items[0]).getByRole('link'));
    expect(heading()).toBe('Goal and platforms');
  });

  it('un-completes a step, and every later one, when its input becomes incomplete again', async () => {
    at('Campaign-v2-1-Goal');
    for (let i = 0; i < 3; i++) {
      await userEvent.click(screen.getByRole('checkbox'));
      await userEvent.click(screen.getByRole('button', { name: campaignSteps[i].nextLabel }));
    }
    expect(heading()).toBe('Content plan');
    // Back to step 1 through the stepper, and untick it.
    await userEvent.click(within(stepItems()[0]).getByRole('link'));
    await userEvent.click(screen.getByRole('checkbox'));
    expect(campaignStore.read().completed).toEqual({});
  });

  it('changing a draft section un-completes the step that owns it and every later step', () => {
    campaignStore.complete('goal');
    campaignStore.complete('audience');
    campaignStore.complete('success');
    campaignStore.set('audience', ['devs']);
    expect(campaignStore.read().completed).toEqual({ goal: true });
    expect(campaignStore.read().draft.audience).toEqual(['devs']);
  });

  it('a fresh deep link to step 6 cannot launch, shows no false done marks, and links to the first missing step', async () => {
    at('Campaign-v2-6-Launch');
    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: 'Launch campaign' })).toBeDisabled();
    stepItems().slice(0, 5).forEach((li) => expect(li).not.toHaveTextContent('(done)'));
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Finish step 1: Goal and platforms first.');
    await userEvent.click(within(status).getByRole('link'));
    expect(heading()).toBe('Goal and platforms');
  });
});

describe('campaign draft is kept per brand (Codex review on PR #79)', () => {
  function DraftName() {
    const { draft } = campaignStore.use();
    return <p>{draft.goal.name || 'no name'}</p>;
  }

  it('switching brand shows that brand\'s own draft, and switching back restores the first', () => {
    render(<DraftName />);
    act(() => campaignStore.set('goal', { ...campaignStore.read().draft.goal, name: 'aDNA launch' }));
    act(() => campaignStore.complete('goal'));
    expect(screen.getByText('aDNA launch')).toBeInTheDocument();

    act(() => selectBrand('gamerslab'));
    expect(screen.getByText('no name')).toBeInTheDocument();
    expect(campaignStore.read().completed).toEqual({});
    act(() => campaignStore.set('goal', { ...campaignStore.read().draft.goal, name: 'GamersLab season' }));
    expect(screen.getByText('GamersLab season')).toBeInTheDocument();

    act(() => selectBrand('adna'));
    expect(screen.getByText('aDNA launch')).toBeInTheDocument();
    expect(campaignStore.read().completed).toEqual({ goal: true });
  });
});
