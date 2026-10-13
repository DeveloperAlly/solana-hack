// Renders the evidence as one self-contained report.html (screenshots inlined) plus report.md.
import fs from 'node:fs';
import path from 'node:path';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SECTION = { live: 'Live product (jamjam.tech, real integrations)', poc: 'UI proof of concept (preview /screens): sample data' };

function stepOrder(steps) {
  // Failing steps first, highlighted; then the rest in journey order.
  const fail = steps.filter((s) => !s.pass && !s.skipped);
  const rest = steps.filter((s) => s.pass || s.skipped);
  return [...fail, ...rest];
}

function firstFail(j) { return j.steps.find((s) => !s.pass && !s.skipped); }

function checkLines(s) {
  if (s.error && !s.checks.length) return [`ERROR: ${s.error}`];
  return s.checks.map((c) => `${c.inconclusive ? 'INCONCLUSIVE' : c.pass ? 'PASS' : 'FAIL'} ${c.label}: ${c.actual}`).concat(s.error ? [`ERROR: ${s.error}`] : []);
}

export function renderMarkdown(run) {
  const L = [];
  L.push(`# Product-outcome evals`, '', `Run ${run.startedAt} → ${run.finishedAt}. Target: ${run.base} (build ${run.build}, mode ${run.mode}). Live: ${run.liveBase}. Test site: ${run.site}.`, '');
  if (run.note) L.push(run.note, '');
  L.push('| # | Journey | Section | Result | First failing step |', '|---|---|---|---|---|');
  run.journeys.forEach((j, i) => {
    const f = firstFail(j);
    L.push(`| ${i + 1} | ${j.title} | ${j.section === 'live' ? 'Live' : 'POC (sample data)'} | ${j.status} | ${f ? `step ${f.n}: ${f.did.replace(/\|/g, '/')}` : (j.status === 'NOT DEPLOYED' ? j.notes : '-')} |`);
  });
  for (const sec of ['live', 'poc']) {
    L.push('', `## ${SECTION[sec]}`, '');
    if (sec === 'poc') L.push('The /screens gallery runs on fixtures with no integrations, so these journeys make no API calls by design; evidence is screen captures and DOM text only.', '');
    for (const j of run.journeys.filter((x) => x.section === sec)) {
      L.push(`### ${j.status}: ${j.title}`, '');
      if (j.notes) L.push(j.notes, '');
      if (j.stopped) L.push(`Stopped: ${j.stopped}`, '');
      for (const s of stepOrder(j.steps)) {
        // Terse: failing steps in full (expected, every check's verbatim actual, screenshot); passing steps on one line.
        if (s.pass) { L.push(`- Step ${s.n} PASS: ${s.did} (${s.shot})`); continue; }
        L.push(`- **Step ${s.n} ${s.skipped ? 'NOT REACHED' : 'FAIL'}.** Did: ${s.did}`);
        if (s.skipped) { L.push(`  - ${s.error}`); continue; }
        L.push(`  - Expected: ${s.expected}`);
        for (const c of checkLines(s)) L.push(`  - ${c}`);
        if (s.shot) L.push(`  - Screenshot: ${s.shot} (${s.url}, ${s.at})`);
        if (s.network?.length) L.push(`  - API calls: ${s.network.map((n) => `${n.method} ${n.path} ${n.status} ${n.ms}ms`).join('; ')}`);
      }
      L.push('');
    }
  }
  return L.join('\n');
}

function img(outDir, rel) {
  if (!rel) return '';
  const p = path.join(outDir, rel);
  if (!fs.existsSync(p)) return '';
  return `data:image/jpeg;base64,${fs.readFileSync(p).toString('base64')}`;
}

function pretty(body) {
  if (!body) return '(empty)';
  try { return JSON.stringify(JSON.parse(body), null, 2); } catch { return body; }
}

export function renderHtml(run, outDir) {
  const rows = run.journeys.map((j, i) => {
    const f = firstFail(j);
    return `<tr class="${j.status.replace(' ', '-')}"><td>${i + 1}</td><td><a href="#${j.id}">${esc(j.title)}</a></td><td>${j.section === 'live' ? 'Live' : 'POC · sample data'}</td><td><b>${j.status}</b></td><td>${f ? `Step ${f.n}: ${esc(f.did)}` : esc(j.status === 'NOT DEPLOYED' ? j.notes : '')}</td></tr>`;
  }).join('');
  const sec = (key) => {
    const js = run.journeys.filter((j) => j.section === key);
    if (!js.length) return '';
    return `<h2>${esc(SECTION[key])}</h2>${key === 'poc' ? '<p class="note">The /screens gallery runs on fixtures with no integrations, so these journeys make no API calls by design. Evidence is raw screen captures and verbatim DOM text.</p>' : '<p class="note">Every API call the page made is listed under the step that triggered it: method, path, status, timing, and request and response bodies verbatim (auth tokens, cookies and keys redacted).</p>'}${js.map((j) => journeyHtml(j, outDir)).join('')}`;
  };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Product outcome evals</title>
<style>
:root{--bg:#fff;--fg:#111;--mute:#555;--line:#ddd;--fail:#b00020;--failbg:#fde8ec;--pass:#0a6b2d;--skip:#777;--code:#f5f5f5}
@media (prefers-color-scheme:dark){:root{--bg:#111;--fg:#eee;--mute:#aaa;--line:#333;--fail:#ff6b81;--failbg:#3a1018;--pass:#5fd38a;--skip:#999;--code:#1c1c1c}}
body{background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;margin:0;padding:24px 16px;max-width:1080px;margin:auto}
h1{font-size:24px;margin:0 0 4px}h2{margin-top:40px;border-bottom:2px solid var(--fg);padding-bottom:4px}h3{margin:32px 0 8px}
.meta,.note{color:var(--mute)}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
tr.FAIL b{color:var(--fail)}tr.PASS b{color:var(--pass)}tr.NOT-DEPLOYED b{color:var(--skip)}
.badge{display:inline-block;padding:1px 8px;border-radius:3px;font-weight:700;font-size:13px;border:1px solid}
.b-FAIL{color:var(--fail)}.b-PASS{color:var(--pass)}.b-SKIP,.b-NOT-DEPLOYED{color:var(--skip)}
.step{border:1px solid var(--line);border-radius:6px;padding:12px;margin:12px 0}.step.fail{border:2px solid var(--fail);background:var(--failbg)}
.step.skip{opacity:.7}.k{font-weight:600}ul.checks{margin:4px 0;padding-left:20px}li.f{color:var(--fail)}li.p{color:var(--pass)}li.i{color:var(--skip)}
img{max-width:1000px;width:100%;border:1px solid var(--line);display:block;margin-top:8px}.cap{font-size:12px;color:var(--mute);word-break:break-all}
details{margin:4px 0}summary{cursor:pointer}pre{background:var(--code);padding:8px;overflow:auto;max-height:420px;font-size:12px;white-space:pre-wrap;word-break:break-word}
code{font-size:13px}
</style></head><body>
<h1>Product outcome evals</h1>
<p class="meta">Run ${esc(run.startedAt)} to ${esc(run.finishedAt)} · real Chromium (Playwright ${esc(run.playwright)}) · target ${esc(run.base)} (build ${esc(run.build)}, mode ${esc(run.mode)}) · live ${esc(run.liveBase)} · test site ${esc(run.site)}</p>
${run.note ? `<p class="meta">${esc(run.note)}</p>` : ''}
<p class="meta">Screenshots are raw Playwright captures. "Actual" text is quoted verbatim from the page DOM (whitespace collapsed). Labels before each quote are the check's name.</p>
<table><thead><tr><th>#</th><th>Journey</th><th>Section</th><th>Result</th><th>First failing step</th></tr></thead><tbody>${rows}</tbody></table>
${sec('live')}${sec('poc')}
</body></html>`;
}

function journeyHtml(j, outDir) {
  const steps = stepOrder(j.steps).map((s) => {
    const st = s.skipped ? 'SKIP' : s.pass ? 'PASS' : 'FAIL';
    const checks = s.skipped ? `<p>${esc(s.error)}</p>` : `<ul class="checks">${s.checks.map((c) => `<li class="${c.inconclusive ? 'i' : c.pass ? 'p' : 'f'}"><b>${c.inconclusive ? 'INCONCLUSIVE' : c.pass ? 'PASS' : 'FAIL'}</b> ${esc(c.label)}: <code>${esc(c.actual)}</code></li>`).join('')}${s.error ? `<li class="f"><b>ERROR</b> ${esc(s.error)}</li>` : ''}</ul>`;
    const net = s.network?.length ? `<details><summary>${s.network.length} API call${s.network.length > 1 ? 's' : ''} this step triggered</summary>${s.network.map((n) => `<details><summary><code>${esc(n.method)} ${esc(n.path)}</code> → ${esc(n.status)} · ${n.ms} ms · ${esc(n.startedAt)}</summary><div class="k">Request body</div><pre>${esc(pretty(n.requestBody))}</pre><div class="k">Response body</div><pre>${esc(pretty(n.responseBody))}</pre></details>`).join('')}</details>` : '';
    const im = img(outDir, s.shot);
    return `<div class="step ${st === 'FAIL' ? 'fail' : st === 'SKIP' ? 'skip' : ''}"><div><span class="badge b-${st}">${st === 'SKIP' ? 'NOT REACHED' : st}</span> <b>Step ${s.n}.</b> ${esc(s.did)}</div>
<div><span class="k">Expected:</span> ${esc(s.expected)}</div><div><span class="k">Actual:</span>${checks}</div>${net}
${im ? `<img loading="lazy" alt="Step ${s.n} capture" src="${im}"><div class="cap">Loaded URL: ${esc(s.url)} · captured ${esc(s.at)}</div>` : ''}</div>`;
  }).join('');
  const dl = j.downloads?.length ? `<details><summary>Downloaded files (${j.downloads.length})</summary>${j.downloads.map((d) => `<div class="k">${esc(d.name)} (${d.bytes} bytes)</div><pre>${esc(d.listing)}</pre>`).join('')}</details>` : '';
  return `<h3 id="${j.id}"><span class="badge b-${j.status.replace(' ', '-')}">${j.status}</span> ${esc(j.title)}</h3>${j.notes ? `<p class="note">${esc(j.notes)}</p>` : ''}${j.stopped ? `<p class="note">Stopped: ${esc(j.stopped)}</p>` : ''}${dl}${steps}`;
}
