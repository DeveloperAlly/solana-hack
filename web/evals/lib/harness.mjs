// Product-outcome eval harness: drives real Chromium like a user and records evidence.
// Every "actual" string is copied from the DOM; every screenshot is a raw Playwright capture.
import fs from 'node:fs';
import path from 'node:path';

const REDACT_KEYS = /^(access_token|refresh_token|provider_token|provider_refresh_token|token|token_hash|otp|code_verifier|password|apikey|api_key|authorization|cookie|set-cookie|secret|private_key)$/i;
const JWT = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;

export function redact(value) {
  if (value == null) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') return JSON.stringify(redactObj(parsed), null, 2);
    } catch { /* not JSON */ }
    return value.replace(JWT, '[redacted]');
  }
  return redactObj(value);
}
function redactObj(o) {
  if (Array.isArray(o)) return o.map(redactObj);
  if (o && typeof o === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(o)) out[k] = REDACT_KEYS.test(k) ? '[redacted]' : redactObj(v);
    return out;
  }
  if (typeof o === 'string') return o.replace(JWT, '[redacted]');
  return o;
}

/** Quote a DOM string verbatim, collapsing only whitespace runs, truncating long text with a marker. */
/**
 * Run mode: 'pr-head' when the target is the build of the commit under review (CI builds and serves it in the runner),
 * 'deployed' when it is an already deployed build (post-merge preview, live app, or any URL tested by hand).
 */
export function runMode() { return process.env.EVAL_MODE === 'pr-head' ? 'pr-head' : 'deployed'; }

/**
 * What landing on "No such screen" means. Against the PR's own build every screen the journey reaches must exist, so a
 * missing one is a regression the PR introduced: FAIL. Against an older deployed build it may simply not have shipped
 * yet: NOT DEPLOYED. Either way the journey stops at that step.
 */
export function missingScreenOutcome(mode, base, screen) {
  if (mode === 'pr-head') return { notDeployed: false, screen, error: `Regression: this PR's build at ${base} has no screen "${screen}" (a screen the journey reaches was removed or broken)` };
  return { notDeployed: true, screen, error: `Not deployed: ${base} has no screen "${screen}"` };
}

export function q(s, max = 400) {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return '"' + (t.length > max ? t.slice(0, max) + '" [truncated]' : t + '"');
}

export async function visibleText(locator, max) {
  try {
    if ((await locator.count()) === 0) return '(not on page)';
    return q(await locator.first().innerText({ timeout: 3000 }), max);
  } catch (e) { return '(unreadable: ' + e.message.split('\n')[0] + ')'; }
}

export class Journey {
  constructor(def, { browser, outDir, base, liveBase }) {
    this.def = def;
    this.browser = browser;
    this.outDir = outDir;
    this.base = def.target === 'live' ? liveBase : base;
    this.steps = [];
    this.status = 'PASS';
    this.stopped = null;
    this.network = [];
    this.netCursor = 0;
    this.downloads = [];
    this.missing = []; // screens a step landed on that the target does not serve ("No such screen")
    this.mode = runMode();
  }

  async open() {
    const vp = this.def.viewport || { width: 1280, height: 900 };
    this.context = await this.browser.newContext({ viewport: vp, acceptDownloads: true, deviceScaleFactor: 1, isMobile: !!this.def.mobile, hasTouch: !!this.def.mobile });
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(6000);
    const pending = new Map();
    this.page.on('request', (r) => {
      const t = r.resourceType();
      if (t === 'fetch' || t === 'xhr' || r.url().includes('/api/')) pending.set(r, Date.now());
    });
    const finish = async (r, failed) => {
      if (!pending.has(r)) return;
      const started = pending.get(r); pending.delete(r);
      const u = new URL(r.url());
      const rec = { method: r.method(), url: u.origin + u.pathname + u.search, path: u.pathname + u.search, host: u.host, startedAt: new Date(started).toISOString(), ms: Date.now() - started, requestBody: redact(r.postData() || ''), status: null, responseBody: '' };
      if (failed) { rec.status = 'FAILED ' + (r.failure()?.errorText || ''); }
      else {
        const res = await r.response().catch(() => null);
        rec.status = res ? res.status() : 'no response';
        if (res) { try { rec.responseBody = redact(await res.text()); } catch { rec.responseBody = '(body unavailable)'; } }
      }
      this.network.push(rec);
    };
    this.page.on('requestfinished', (r) => finish(r, false));
    this.page.on('requestfailed', (r) => finish(r, true));
  }

  url(p) { return this.base + p; }

  async settle(ms = 500) {
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await this.page.waitForTimeout(ms);
  }

  /**
   * One user step.
   * spec: { did, expected, source?, action: async(page,j), checks: async(page,j) => [{label, pass, actual}], focus?: (page)=>locator, wait?: ms }
   */
  async step(spec) {
    const n = this.steps.length + 1;
    const rec = { n, did: spec.did, expected: spec.expected, source: spec.source || '', checks: [], pass: false, url: '', at: '', shot: '', network: [], error: '' };
    this.steps.push(rec);
    if (this.stopped) { rec.skipped = true; rec.error = 'Not reached: ' + this.stopped; return rec; }
    try {
      if (spec.action) await spec.action(this.page, this);
      await this.settle(spec.wait ?? 500);
    } catch (e) {
      rec.error = 'Action failed: ' + e.message.split('\n')[0];
    }
    // Missing screens are detected from where the journey actually goes, so they cannot drift from a hand-kept list.
    if (!rec.error) {
      const m = /\/screens\/([^/?#]+)/.exec(this.page.url());
      if (m && (await this.page.getByText('No such screen', { exact: true }).count().catch(() => 0))) {
        const o = missingScreenOutcome(this.mode, this.base, decodeURIComponent(m[1]));
        rec.error = o.error;
        if (o.notDeployed) { this.missing.push(o.screen); rec.notDeployed = true; }
      }
    }
    if (!rec.error && spec.checks) {
      try { rec.checks = await spec.checks(this.page, this); }
      catch (e) { rec.error = 'Check failed to run: ' + e.message.split('\n')[0]; }
    }
    // Let in-flight API calls land in this step's window.
    await this.page.waitForTimeout(150);
    rec.network = this.network.slice(this.netCursor);
    this.netCursor = this.network.length;
    rec.url = this.page.url();
    rec.at = new Date().toISOString();
    try {
      if (spec.focus) { const f = spec.focus(this.page); if (f && (await f.count())) await f.first().scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {}); }
      const file = `${this.def.id}-${String(n).padStart(2, '0')}.jpg`;
      await this.page.screenshot({ path: path.join(this.outDir, 'shots', file), type: 'jpeg', quality: 70, fullPage: !!spec.fullPage });
      rec.shot = 'shots/' + file;
    } catch (e) { rec.error += ' (screenshot failed: ' + e.message.split('\n')[0] + ')'; }
    rec.pass = !rec.error && rec.checks.length > 0 && rec.checks.every((c) => c.pass);
    if (!rec.pass) this.status = 'FAIL';
    if (rec.error && !spec.continueOnError) this.stopped = `step ${n} could not be performed (${rec.error})`;
    return rec;
  }

  async close() { await this.context?.close(); }

  toJSON() {
    const notDeployed = this.missing.length > 0;
    return { id: this.def.id, title: this.def.title, section: this.def.section, target: this.def.target, status: notDeployed ? 'NOT DEPLOYED' : this.status, notes: notDeployed ? `Not deployed on ${this.base}: ${[...new Set(this.missing)].join(', ')}. ${this.def.notes || ''}`.trim() : this.def.notes || '', missing: this.missing, steps: this.steps, downloads: this.downloads, stopped: this.stopped };
  }
}

// ---------- check helpers (each returns {label, pass, actual}) ----------
export async function seesText(page, label, text, opts = {}) {
  const loc = page.getByText(text, { exact: !!opts.exact });
  const n = await loc.count();
  let vis = false;
  for (let i = 0; i < n && !vis; i++) vis = await loc.nth(i).isVisible().catch(() => false);
  const actual = vis ? await visibleText(loc.filter({ visible: true }), opts.max) : (opts.actualFrom ? await visibleText(opts.actualFrom(page), opts.max) : `no visible text matching ${JSON.stringify(String(text))}`);
  return { label, pass: opts.absent ? !vis : vis, actual };
}

export async function controlState(page, label, locator, want /* 'enabled'|'disabled'|'present'|'absent' */) {
  const n = await locator.count();
  if (n === 0) return { label, pass: want === 'absent', actual: 'control not on page' };
  const el = locator.first();
  const vis = await el.isVisible().catch(() => false);
  const tag = await el.evaluate((e) => e.tagName.toLowerCase()).catch(() => '?');
  const dis = await el.evaluate((e) => e.disabled === true || e.getAttribute('aria-disabled') === 'true').catch(() => false);
  const name = (await el.innerText().catch(() => '')) || (await el.getAttribute('aria-label')) || '';
  const actual = `${tag} ${q(name, 80)} ${vis ? 'visible' : 'hidden'}, ${dis ? 'disabled' : 'enabled'}${tag === 'a' ? ' (a link; links cannot be disabled), href=' + (await el.getAttribute('href')) : ''}`;
  const pass = want === 'present' ? vis : want === 'absent' ? !vis : want === 'disabled' ? vis && dis : vis && !dis;
  return { label, pass, actual };
}

export async function urlIs(page, label, re) {
  const u = page.url();
  return { label, pass: re.test(u), actual: 'page URL ' + u };
}

export function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }
