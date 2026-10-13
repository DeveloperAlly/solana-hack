// Unit test for how a missing screen is classified, by run mode (no browser needed).
import { describe, it, expect, afterEach } from 'vitest';
import { missingScreenOutcome, runMode } from './harness.mjs';

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
