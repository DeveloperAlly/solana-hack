// Live product: jamjam.tech with real integrations, driven with the configured test site (EVAL_SITE).
import { seesText, controlState, urlIs, visibleText } from '../lib/harness.mjs';
import { evalConfig } from '../lib/config.mjs';

const { site: SITE, host } = evalConfig();

export default {
  id: 'live-first-run',
  title: `Live first run: landing to the furthest reachable step (${host})`,
  section: 'live',
  target: 'live',
  notes: 'Real Worker, Supabase, OpenRouter and workflow engine. No email code is entered: the journey stops at any sign-in wall that needs one.',
  async run(j) {
    await j.step({
      did: `Open ${j.url('/')} (first screen, by URL).`,
      expected: 'Landing page with a "Your website" field and a "Read my site" button (canvas note n-main: URL field carries into Read with no sign-up).',
      source: 'n-main',
      action: (p) => p.goto(j.url('/'), { waitUntil: 'networkidle' }),
      checks: async (p) => [
        await controlState(p, 'Website field present', p.locator('input[type=url]'), 'present'),
        await controlState(p, '"Read my site" enabled', p.getByRole('button', { name: 'Read my site' }), 'enabled'),
      ],
    });

    await j.step({
      did: `Type "${SITE}" into "Your website" and click "Read my site".`,
      expected: `The Read step opens with no sign-up and says it is reading ${host}; an extract run starts (n-j1-read).`,
      source: 'n-j1-read, n-j2-save (D1: read before sign-in)',
      action: async (p) => {
        await p.locator('input[type=url]').first().fill(SITE);
        await p.getByRole('button', { name: 'Read my site' }).first().click();
        await p.waitForURL(/journey|read|build/, { timeout: 20000 }).catch(() => {});
      },
      wait: 3000,
      checks: async (p) => [
        await urlIs(p, 'Moved to the Read step', /\/journey\/read/),
        await seesText(p, `Heading names ${host}`, new RegExp('Reading .*' + host.replace('.', '\\.'))),
        await controlState(p, 'No email asked before value', p.locator('main input[type=email]'), 'absent'),
      ],
    });

    await j.step({
      did: 'Wait while the site is read (up to 3 minutes), watching the Sources panel.',
      expected: 'Facts appear, each with the exact quote from the site and a link to the page it came from (n-j1-read: "Facts stream in as each page is read; each card shows the quote and the page").',
      source: 'n-j1-read',
      // Done when the extract run the page polls has finished (the source can show "Read" before facts are saved).
      action: async (p, jj) => {
        const finished = () => jj.network.some((x) => { if (!/\/api\/runs\//.test(x.path)) return false; try { return ['done', 'failed', 'error'].includes(JSON.parse(x.responseBody).run?.status); } catch { return false; } });
        const deadline = Date.now() + 180000;
        while (Date.now() < deadline && !finished()) await p.waitForTimeout(3000);
        await p.waitForTimeout(6000); // let the page take its next poll and render the saved facts
      },
      wait: 1500,
      focus: (p) => p.getByText(/kit sections found/),
      checks: async (p) => {
        const sources = await visibleText(p.getByText(/Read · \d+ facts?/), 200);
        const m = /Read · (\d+) fact/.exec(sources);
        const n = m ? Number(m[1]) : 0;
        const coverage = await visibleText(p.getByText(/kit sections found/), 200);
        const empty = await visibleText(p.getByText(/Nothing to keep yet/), 200);
        // Each fact card's source link ("Open the page"); the app's own navigation is not a source.
        const links = await p.locator('main a').evaluateAll((as) => as.filter((a) => /Open the page/.test(a.innerText)).map((a) => a.href));
        // The run the page itself polled (workflow engine): its final output and per-step trace, verbatim from the API.
        const runStatus = (x) => { try { return JSON.parse(x.responseBody).run?.status; } catch { return null; } };
        const runRes = [...j.network].reverse().find((x) => /\/api\/runs\//.test(x.path) && ['done', 'failed', 'error'].includes(runStatus(x)));
        let runLine = 'no finished run seen in the API responses';
        let runFacts = 0;
        if (runRes) {
          try {
            const r = JSON.parse(runRes.responseBody);
            runFacts = r.run?.output?.facts ?? 0;
            const steps = (r.steps || []).map((s) => `${s.step}: ${s.type} ${s.outcome}${s.model ? ` model=${s.model} tokens_in=${s.tokens_in} tokens_out=${s.tokens_out}` : ''} ${s.duration_ms}ms`).join('; ');
            runLine = `GET ${runRes.path} → run.status ${JSON.stringify(r.run?.status)}, run.output ${JSON.stringify(r.run?.output)}; steps: ${steps}`;
          } catch { runLine = 'run response not JSON'; }
        }
        return [
          { label: 'Extract run kept at least one fact (API)', pass: runFacts > 0, actual: runLine },
          { label: 'At least one fact found', pass: n > 0, actual: `Sources panel: ${sources}; coverage: ${coverage}; ${empty}` },
          { label: `Every fact links to a page on ${host}`, pass: links.length > 0 && links.every((h) => new URL(h).host === host), actual: links.length ? `${links.length} source links: ` + [...new Set(links)].join(', ') : 'no source links on page' },
        ];
      },
    });

    await j.step({
      did: 'Click "Keep these and continue".',
      expected: 'Moves on to Save (email after value, n-j2-save).',
      source: 'n-j2-save',
      action: async (p) => {
        const b = p.getByRole('button', { name: 'Keep these and continue' });
        if (await b.isDisabled()) throw new Error('"Keep these and continue" is disabled, so the user cannot continue');
        await b.click();
      },
      checks: async (p) => [
        await controlState(p, 'Email field shown', p.locator('input[type=email]'), 'present'),
      ],
    });

    await j.step({
      did: 'Stop at the sign-in wall (needs an emailed code; not worked around).',
      expected: 'Sign-in wall reached after value was shown.',
      source: 'brief: stop at an emailed-code wall',
      action: async () => {},
      checks: async (p) => [await seesText(p, 'Wall text', /email/i)],
    });
  },
};
