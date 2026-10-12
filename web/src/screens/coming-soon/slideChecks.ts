// Media-Review checks (issue #51): one check per real slide, and ONE status function that both the badges and the
// approve gate read, so a badge can never say "blocked" while approval stays open (Codex review on PR #79).
// Results belong to the text they were run on: a slide edited since its last run is "Re-run needed" (blocking) until
// the checks run again on the new text.
// INTEGRATION: GET /api/drafts/:id/checks (backend map §4 row "Amb-3, M-3"). In the gallery the fixture gives the
// first results, and a re-run is a local stand-in: the claim stays unsupported only while its claim text is still on
// the slide; slop is reported passed.
import type { Chip } from './status';
import type { CheckResult, Slide, SlideCheck, SlideCheckDefaults } from './types';

const results: Record<CheckResult, Chip & { blocking: boolean }> = {
  backed: { label: 'Backed', tone: 'success', blocking: false },
  none: { label: 'No claims', tone: 'neutral', blocking: false },
  passed: { label: 'Passed', tone: 'success', blocking: false },
  unsupported: { label: 'Unsupported · blocked', tone: 'warning', blocking: true },
  failed: { label: 'Failed · blocked', tone: 'warning', blocking: true },
  stale: { label: 'Re-run needed', tone: 'warning', blocking: true },
};

/** Badge and blocking flag for one result (claims or slop). */
export const resultStatus = (r: CheckResult) => results[r];

/** Whether a slide blocks approval, and the sentence that says why. */
export function checkStatus(c: SlideCheck): { blocking: boolean; label: string } {
  if (c.claims === 'stale' || c.slop === 'stale') return { blocking: true, label: `Slide ${c.slide} changed since its checks ran. Re-run the checks to approve.` };
  if (resultStatus(c.claims).blocking) return { blocking: true, label: `Slide ${c.slide} has a claim with no evidence. Add a source or change the slide to approve.` };
  if (resultStatus(c.slop).blocking) return { blocking: true, label: `Slide ${c.slide} failed the no-AI-slop check. Edit the slide to approve.` };
  return { blocking: false, label: `Slide ${c.slide} passed its checks.` };
}

const blank: SlideCheckDefaults = { claims: 'none', slop: 'passed', alt: '[alt]' };

export interface CheckInputs {
  /** The draft's slides now. */
  slides: Slide[];
  /** Fixture results by slide number, run on `fixtureText`. */
  defaults: Record<number, SlideCheckDefaults>;
  /** The text each slide had when the fixture results were produced (the default draft). */
  fixtureText: (slideId: string) => string | undefined;
  /** The text each slide had at its last re-run in this session. */
  rerunText: Record<string, string>;
  /** Whether a claim's Claims row is approved (session). */
  approvedClaim: (claimId: string) => boolean;
}

/** One result set per slide: fixture results, re-run results, or stale when the text changed since either. */
export function deriveChecks({ slides, defaults, fixtureText, rerunText, approvedClaim }: CheckInputs): SlideCheck[] {
  return slides.map((s, i) => {
    const d = defaults[i + 1] ?? blank;
    const base = { id: s.id, slide: i + 1, text: s.text, ...d };
    const rerun = rerunText[s.id];
    if (rerun === undefined && s.text !== fixtureText(s.id)) return { ...base, claims: 'stale', slop: 'stale' };
    if (rerun !== undefined && s.text !== rerun) return { ...base, claims: 'stale', slop: 'stale' };
    const claimStillThere = rerun === undefined || (d.claimPhrase !== undefined && s.text.includes(d.claimPhrase));
    const claims: CheckResult = claimStillThere ? d.claims : 'none';
    const slop: CheckResult = rerun === undefined ? d.slop : 'passed';
    const backed = claims === 'unsupported' && d.claimId !== undefined && approvedClaim(d.claimId);
    return { ...base, claims: backed ? 'backed' : claims, slop };
  });
}
