import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderScreen } from './renderScreen';

async function completeGoal() {
  await userEvent.click(screen.getByRole('radio', { name: /Launch/ }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Campaign name' }), 'Spring launch');
  await userEvent.type(screen.getByRole('textbox', { name: 'Dates' }), '1–7 Nov');
  await userEvent.click(screen.getByRole('checkbox', { name: /LinkedIn/ }));
  await userEvent.click(screen.getByRole('radio', { name: 'Brand accounts only' }));
}

describe('Campaign v2 wizard (n-c1, n-c2)', () => {
  it('chooses nothing for the person: Next is disabled and says what is missing', () => {
    renderScreen('Campaign-v2-1-Goal');
    expect(screen.getAllByRole('radio').every((r) => !(r as HTMLInputElement).checked)).toBe(true);
    expect(screen.getAllByRole('checkbox').every((c) => !(c as HTMLInputElement).checked)).toBe(true);
    expect(screen.getByRole('button', { name: 'Next: success metrics' })).toBeDisabled();
    expect(screen.getByText(/To continue: choose a purpose; name the campaign/)).toBeInTheDocument();
  });

  it('a custom purpose needs a description before Next', async () => {
    renderScreen('Campaign-v2-1-Goal');
    await completeGoal();
    await userEvent.click(screen.getByRole('radio', { name: /Custom/ }));
    expect(screen.getByRole('button', { name: 'Next: success metrics' })).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox', { name: 'Describe it' }), 'A partner week');
    expect(screen.getByRole('button', { name: 'Next: success metrics' })).toBeEnabled();
  });

  it('warns that X is never a paid ambassador format', async () => {
    renderScreen('Campaign-v2-1-Goal');
    await userEvent.click(screen.getByRole('checkbox', { name: /^X/ }));
    expect(screen.queryByText(/never a paid ambassador format/)).toBeNull();
    await userEvent.click(screen.getByRole('radio', { name: 'Both' }));
    expect(screen.getByText(/never a paid ambassador format/)).toBeInTheDocument();
  });

  it('moves to the success step only after step 1 is complete, carrying the campaign name', async () => {
    renderScreen('Campaign-v2-1-Goal');
    await completeGoal();
    await userEvent.click(screen.getByRole('button', { name: 'Next: success metrics' }));
    expect(screen.getByRole('heading', { level: 1, name: 'How will you know it worked?' })).toBeInTheDocument();
    expect(screen.getByText(/^Spring launch: Pick one main goal/)).toBeInTheDocument();
  });

  it('Measure: Next waits for a main goal and its target, caps supporting numbers at 3, then goes to Audience', async () => {
    renderScreen('Campaign-v2-2-Measure');
    const next = screen.getByRole('button', { name: 'Next: audience' });
    expect(next).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: 'Main goal: Verified ambassador posts' }));
    expect(screen.getByText(/set a target for the main goal/)).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: 'Target for Verified ambassador posts' }), '40');
    for (const m of ['Clicks to adna.network', 'Engagement rate', 'Reach']) await userEvent.click(screen.getByRole('checkbox', { name: `Use ${m}` }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Use Qualified leads' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Pick up to 3 supporting numbers.');
    expect(screen.getByRole('checkbox', { name: 'Use Qualified leads' })).not.toBeChecked();
    expect(next).toBeEnabled();
    await userEvent.click(next);
    // Campaign-v2-3-Audience is built on page #51; until that merges the gallery says it is not registered.
    expect(screen.getByText(/Campaign-v2-3-Audience/)).toBeInTheDocument();
  });

  it('Back on Measure returns to Goal; Cancel on Goal returns to Content', async () => {
    renderScreen('Campaign-v2-2-Measure');
    await userEvent.click(screen.getByRole('link', { name: 'Back' }));
    expect(screen.getByRole('heading', { level: 1, name: "What's this campaign for?" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Cancel' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Content' })).toBeInTheDocument();
  });
});
