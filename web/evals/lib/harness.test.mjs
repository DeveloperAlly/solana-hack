// Unit test for how a missing screen is classified, by run mode (no browser needed).
import { describe, it, expect, afterEach } from 'vitest';
import { missingScreenOutcome, runMode, journeyStatus } from './harness.mjs';

describe('missing screen outcome', () => {
  afterEach(() => { delete process.env.EVAL_MODE; });

  it('is a FAIL (regression) on the PR head build', () => {
    const o = missingScreenOutcome('pr-head', 'http://127.0.0.1:4173', 'Event-Detail');
    expect(o.notDeployed).toBe(false);
    expect(o.error).toMatch(/^Regression: .*"Event-Detail"/);
  });

  it('is NOT DEPLOYED on an older deployed build', () => {
    const o = missingScreenOutcome('deployed', 'https://preview.example', 'Event-Detail');
    expect(o.notDeployed).toBe(true);
    expect(o.error).toBe('Not deployed: https://preview.example has no screen "Event-Detail"');
  });

  it('reads the mode from EVAL_MODE, defaulting to deployed', () => {
    expect(runMode()).toBe('deployed');
    process.env.EVAL_MODE = 'pr-head';
    expect(runMode()).toBe('pr-head');
  });
});

describe('journey status', () => {
  const pass = { pass: true };
  const fail = { pass: false };
  const notDeployed = { pass: false, notDeployed: true };
  const notReached = { pass: false, skipped: true };

  it('keeps FAIL when a later step lands on a missing screen (deployed run)', () => {
    expect(journeyStatus([pass, fail, notDeployed, notReached])).toBe('FAIL');
  });
  it('turns PASS into NOT DEPLOYED when the only problem is a missing screen', () => {
    expect(journeyStatus([pass, pass, notDeployed, notReached])).toBe('NOT DEPLOYED');
  });
  it('is PASS when every step passed', () => {
    expect(journeyStatus([pass, pass])).toBe('PASS');
  });
  it('is FAIL on a PR-head run, where a missing screen is a regression and not marked not-deployed', () => {
    const o = missingScreenOutcome('pr-head', 'http://127.0.0.1:4173', 'Event-Detail');
    expect(journeyStatus([pass, { pass: false, notDeployed: o.notDeployed }])).toBe('FAIL');
  });
});
