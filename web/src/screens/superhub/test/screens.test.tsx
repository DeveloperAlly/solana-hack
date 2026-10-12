import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../../../test/axe';
import { screens } from '../registry';
import { renderScreen } from './renderScreen';

const artboards = [
  'Hub-Home', 'Inbox-All', 'Inbox-NeedsReply', 'Inbox-Connect', 'Brand-Build', 'Voice-Templates', 'Voice-Editor',
  'Content-Dashboard', 'Content-Dashboard-Empty', 'Draft-Review', 'Draft-Review-Beautified', 'Draft-Review-PolishError',
  'Campaign-v2-1-Goal', 'Campaign-v2-2-Measure', 'Engage-Queue', 'Engage-Rules', 'Partners', 'Leads',
  'Influencer-Setup', 'Influencer-Queue', 'Analytics', 'Analytics-Empty',
];

describe('Superhub registry (issue #52)', () => {
  it('registers all 22 artboards of the page, once each', () => {
    expect(screens.map((s) => s.artboard).sort()).toEqual([...artboards].sort());
  });

  // One test per artboard and state: it opens at /screens/<artboard>, shows the one main nav (ADR-012) and one h1, and axe finds 0 violations.
  for (const entry of screens) {
    for (const state of entry.states) {
      it(`${entry.artboard} (${state}) renders at its gallery route with no axe violations`, async () => {
        const { container } = renderScreen(entry.artboard, state);
        expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
        await expectNoAxeViolations(container);
      });
    }
  }
});
