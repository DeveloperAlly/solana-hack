// Media-Review checks (issue #51): one check per real slide, and ONE status function that both the badges and the
// approve gate read, so a badge can never say "blocked" while approval stays open (Codex review on PR #79).
// INTEGRATION: GET /api/drafts/:id/checks (backend map §4 row "Amb-3, M-3"); here the results come from fixtures.
import type { Chip } from './status';
import type { CheckResult, Slide, SlideCheck, SlideCheckDefaults } from './types';

const results: Record<CheckResult, Chip & { blocking: boolean }> = {
  backed: { label: 'Backed', tone: 'success', blocking: false },
  none: { label: 'No claims', tone: 'neutral', blocking: false },
  passed: { label: 'Passed', tone: 'success', blocking: false },
  unsupported: { label: 'Unsupported · blocked', tone: 'warning', blocking: true },
  failed: { label: 'Failed · blocked', tone: 'warning', blocking: true },
};

/** Badge and blocking flag for one result (claims or slop). */
export const resultStatus = (r: CheckResult) => results[r];

/** Whether a slide blocks approval, and the sentence that says why. */
export function checkStatus(c: SlideCheck): { blocking: boolean; label: string } {
  if (resultStatus(c.claims).blocking) return { blocking: true, label: `Slide ${c.slide} has a claim with no evidence. Add a source or change the slide to approve.` };
  if (resultStatus(c.slop).blocking) return { blocking: true, label: `Slide ${c.slide} failed the no-AI-slop check. Edit the slide to approve.` };
  return { blocking: false, label: `Slide ${c.slide} passed its checks.` };
}

const blank: SlideCheckDefaults = { claims: 'none', slop: 'passed', alt: '[alt]' };

/**
 * One check per slide of the media draft. Fixture results are per-slide defaults by slide number; a claim whose
 * Claims row is approved (session) counts as backed.
 */
export function deriveChecks(slides: Slide[], defaults: Record<number, SlideCheckDefaults>, approvedClaims: (claimId: string) => boolean): SlideCheck[] {
  return slides.map((s, i) => {
    const d = defaults[i + 1] ?? blank;
    const backed = d.claimId !== undefined && approvedClaims(d.claimId);
    return { id: s.id, slide: i + 1, text: s.text, ...d, claims: backed ? 'backed' : d.claims };
  });
}
