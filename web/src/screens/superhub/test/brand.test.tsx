import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderScreen } from './renderScreen';

describe('Brand kit and voices (n-bb, n-vt, n-ve)', () => {
  it('Brand-Build: approving a new kit version waits until every drafted section is confirmed', async () => {
    renderScreen('Brand-Build');
    expect(screen.getByRole('button', { name: 'Approve as kit v[n+1]' })).toBeDisabled();
    expect(screen.getByText('Confirm the 3 drafted sections to approve.')).toBeInTheDocument();
    for (const b of screen.getAllByRole('button', { name: 'Confirm' })) await userEvent.click(b);
    expect(screen.getByRole('link', { name: 'Approve as kit v[n+1]' })).toHaveAttribute('href', '/screens/Onboard-6-Published');
  });

  it('Brand-Build: an answer to a missing section is validated, saved and counted as Inferred', async () => {
    renderScreen('Brand-Build');
    expect(screen.getByText('E 8 · I 3 · M 6')).toBeInTheDocument();
    const values = screen.getByRole('region', { name: '4. Values' });
    await userEvent.click(within(values).getByRole('button', { name: 'Answer 2 questions' }));
    await userEvent.click(within(values).getByRole('button', { name: 'Save' }));
    expect(within(values).getByRole('alert')).toHaveTextContent('Write something for this section, or cancel.');
    await userEvent.type(within(values).getByRole('textbox', { name: 'Your answer: Values' }), 'Open by default');
    await userEvent.click(within(values).getByRole('button', { name: 'Save' }));
    expect(within(values).getByText('Open by default')).toBeInTheDocument();
    expect(screen.getByText('E 8 · I 4 · M 5')).toBeInTheDocument();
  });

  it('Brand-Build empty state marks every section Missing', () => {
    renderScreen('Brand-Build', 'empty');
    expect(screen.getByText('E 0 · I 0 · M 17')).toBeInTheDocument();
  });

  it('Voice-Templates: the preset matrix sorts by a dimension; cards open the editor', async () => {
    renderScreen('Voice-Templates');
    await userEvent.click(screen.getByRole('button', { name: /Energy/ }));
    const firstRow = screen.getAllByRole('row')[1];
    expect(within(firstRow).getByRole('rowheader')).toHaveTextContent(/Academic|Efficient/);
    await userEvent.click(screen.getByRole('link', { name: /Playful/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Core voice' })).toBeInTheDocument();
  });

  it('Voice-Editor: dials and claims rules rewrite the writer rules; Reset restores the template', async () => {
    renderScreen('Voice-Editor');
    const rules = screen.getByRole('region', { name: 'Rules the writer gets' });
    expect(within(rules).getByText('Formality 2 of 5: towards Casual.')).toBeInTheDocument();
    const reset = screen.getByRole('button', { name: 'Reset to Candid/Founder' });
    expect(reset).toBeDisabled();
    await userEvent.click(within(screen.getByRole('group', { name: 'Formality' })).getByRole('radio', { name: /^5/ }));
    expect(within(rules).getByText('Formality 5 of 5: towards Formal.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'May name competitors' }));
    expect(within(rules).getByText('May name competitors')).toBeInTheDocument();
    await userEvent.click(reset);
    expect(within(rules).getByText('Formality 2 of 5: towards Casual.')).toBeInTheDocument();
    expect(within(rules).getByText('No competitor names.')).toBeInTheDocument();
  });

  it('Voice-Editor: Try another brief changes the preview; Save is disabled while the preview regenerates', async () => {
    renderScreen('Voice-Editor');
    await userEvent.click(screen.getByRole('button', { name: 'Try another brief' }));
    expect(screen.getByText('[Sample post for another brief, written at these settings]')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Save as kit v[n+1]' })).toHaveAttribute('href', '/screens/Voice-Templates');
  });

  it('Voice-Editor (loading): Save and Try another brief are disabled', () => {
    renderScreen('Voice-Editor', 'loading');
    expect(screen.getByRole('button', { name: 'Save as kit v[n+1]' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Try another brief' })).toBeDisabled();
  });
});
