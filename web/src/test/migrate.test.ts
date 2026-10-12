import { describe, expect, it, vi } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrate, migrationFiles, planMigrations, projectRef } from '../../scripts/migrate.mjs';

// The migration runner (scripts/migrate.mjs): applies spec/db files the live project has not recorded, in order.
const REF = 'abcdefghijklmnopqrst';
const URL_OK = `https://${REF}.supabase.co`;
// The names migrations 001-008 carry on the live project (Supabase list_migrations, 2026-10-13).
const LIVE = ['spine_001', 'posts_002', 'posts_registering_003', 'posts_rev_004', 'posts_registration_times_005', 'posts_last_valid_block_height_006', 'kits_registered_at_007', 'sources_source_text_008'].map((name, i) => ({ version: `2026100800000${i}`, name }));

// spec/db as it stands with 009 and 010: numbered 001 to 010 without gaps.
const SPEC = ['001_spine.sql', '002_posts.sql', '003_posts_registering.sql', '004_posts_rev.sql', '005_posts_registration_times.sql', '006_posts_last_valid_block_height.sql', '007_kits_registered_at.sql', '008_sources_source_text.sql', '009_evidence_trust.sql', '010_workflow_engine.sql'];

describe('migration runner', () => {
  it('names files as the live project does and plans only what is missing, in order', () => {
    const files = migrationFiles([...SPEC].reverse().concat('README.md'));
    expect(files.map((f) => f.name)).toEqual(LIVE.map((m) => m.name).concat('evidence_trust_009', 'workflow_engine_010'));
    expect(planMigrations(files, LIVE).map((f) => f.file)).toEqual(['009_evidence_trust.sql', '010_workflow_engine.sql']);
    expect(planMigrations(files, [...LIVE, { name: 'evidence_trust_009' }, { name: 'workflow_engine_010' }])).toEqual([]);
  });
  it('refuses a .sql file that does not follow the naming, rather than skipping it', () => {
    expect(() => migrationFiles(['009_evidence_trust.sql', '010-workflow.sql'])).toThrow(/010-workflow\.sql/);
    expect(() => migrationFiles(['010_Workflow.sql'])).toThrow(/010_Workflow\.sql/);
    expect(migrationFiles(['009_evidence_trust.sql', 'README.md']).map((f) => f.file)).toEqual(['009_evidence_trust.sql']);
  });
  it('refuses to apply out of order or with a duplicated number', () => {
    const files = migrationFiles(SPEC);
    expect(() => planMigrations(files, [...LIVE, { name: 'workflow_engine_010' }])).toThrow(/009_evidence_trust\.sql is missing but a later one \(010\)/);
    expect(() => planMigrations(migrationFiles(['009_a.sql', '009_b.sql']), [])).toThrow(/share number 009/);
  });
  it('marks a file applied only when its full name is recorded (PR #87 review)', () => {
    const files = migrationFiles(SPEC);
    expect(() => planMigrations(files, [...LIVE, { name: 'evidence_trust_009' }, { name: 'hotfix_010' }])).toThrow(/010 is recorded as hotfix_010, not workflow_engine_010/);
  });
  it('refuses a gap in the numbering before applying anything (PR #87 review)', () => {
    const withGap = migrationFiles(SPEC.filter((f) => !f.startsWith('010')).concat('011_next.sql'));
    expect(() => planMigrations(withGap, LIVE)).toThrow(/expected 010, found 011_next\.sql/);
  });
  it('accepts only an exact project URL', () => {
    expect(projectRef(URL_OK)).toBe(REF);
    expect(() => projectRef('https://evil.test/?x=.supabase.co')).toThrow();
  });
  it('applies each missing file once, in order, and stops at the first failure', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'mig-'));
    for (const f of SPEC) writeFileSync(join(dir, f), `-- ${f}\nselect 1;`);
    const posted: { name: string; query: string }[] = [];
    const ok = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url.startsWith(`https://api.supabase.com/v1/projects/${REF}/database/migrations`)).toBe(true);
      expect((init?.headers as Record<string, string>).authorization).toBe('Bearer tok');
      if (init?.method === 'GET') return new Response(JSON.stringify(LIVE));
      posted.push(JSON.parse(String(init?.body)));
      return new Response('{}');
    });
    expect(await migrate({ token: 'tok', url: URL_OK, dir, fetchImpl: ok as unknown as typeof fetch, log: () => undefined })).toEqual(['evidence_trust_009', 'workflow_engine_010']);
    expect(posted.map((p) => p.name)).toEqual(['evidence_trust_009', 'workflow_engine_010']);
    expect(posted[0].query).toContain('009_evidence_trust.sql');

    const failing = vi.fn(async (_url: string, init?: RequestInit) => (init?.method === 'GET' ? new Response(JSON.stringify(LIVE)) : new Response('{"message":"syntax error"}', { status: 400 })));
    await expect(migrate({ token: 'tok', url: URL_OK, dir, fetchImpl: failing as unknown as typeof fetch, log: () => undefined })).rejects.toThrow(/HTTP 400: .*syntax error/);
    expect(failing.mock.calls.filter(([, i]) => i?.method === 'POST')).toHaveLength(1);

    const dry = vi.fn(async () => new Response(JSON.stringify(LIVE)));
    expect(await migrate({ token: 'tok', url: URL_OK, dir, dryRun: true, fetchImpl: dry as unknown as typeof fetch, log: () => undefined })).toEqual([]);
    expect(dry).toHaveBeenCalledTimes(1);
  });
  it('checks the repo: spec/db files are numbered without gaps or duplicates', async () => {
    const { readdirSync } = await import('node:fs');
    const files = migrationFiles(readdirSync(join(__dirname, '..', '..', '..', 'spec', 'db')));
    expect(files.length).toBeGreaterThanOrEqual(9);
    files.forEach((f, i) => expect(Number(f.number)).toBe(i + 1));
  });
});
