// Sample data for Kit-Export, one kit per demo brand. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
// Kit-Export (note n-kex: folders what/brand, what/decisions, what/context/sources, how/templates; version picker, include
// options, hash); the 17 sections and which are "not asked" come from board Coverage-Map (note n-cov); sources from board
// Onboard-3-Sources; gates from boards BB-Gate1/2/3. Issue #50; backend map §4, row "Kit-Export". Every section text, date
// and hash is a bracketed placeholder: no kit content is drawn on the canvas.
import type { KitFile } from '../../lib/kitZip';
import type { KitExportData, KitVersion } from './types';
import { coverageData } from './Coverage-Map.fixtures';
import { sourcesData } from './Onboard-3-Sources.fixtures';
import { perBrand, type HubBrand } from './hubBrands.fixtures';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const gates = ['Purpose', 'Positioning', 'Voice'];

function kitFilesFor(brand: HubBrand, version: string, hash: string): KitFile[] {
  const sections = coverageData.rows.map((r, i): KitFile => {
    const path = `what/brand/${String(i + 1).padStart(2, '0')}-${slug(r.section)}.md`;
    // Sections the intake does not ask stay Missing (note n-cov); they are written only as empty files when asked for.
    const missing = r.cells[0].action.startsWith('Not asked');
    return missing ? { path, content: '', group: 'missing' } : { path, content: `# ${r.section}\n\n[${brand.name} ${r.section.toLowerCase()} text, kit ${version}]\n` };
  });
  const sources = sourcesData.links.map((s): KitFile => ({
    path: `what/context/sources/${slug(s.name) || 'source'}.md`,
    content: `# ${s.name}\n\nRead [date]. Facts kept only where the quote appears on the page.\n`,
    group: 'sources',
  }));
  const decisions = gates.map((g, i): KitFile => ({
    path: `what/decisions/gate-${i + 1}-${slug(g)}.md`,
    content: `# Gate ${i + 1}: ${g}\n\nApproved by [owner email], [date]. Why: [optional reason].\n`,
    group: 'decisions',
  }));
  return [
    { path: 'MANIFEST.md', content: `# ${brand.name} kit ${version}\n\nhash: ${hash}\ndomain: ${brand.domain} (${brand.verified ? 'verified' : 'unverified'})\n` },
    ...sections,
    ...sources,
    ...decisions,
    { path: 'how/templates/voice.md', content: `# Voice\n\n[${brand.name} voice template + per-channel overrides]\n` },
  ];
}

function kitVersion(brand: HubBrand, version: string, label: string): KitVersion {
  const hash = `[sha256 of ${brand.name} kit ${version}]`;
  const root = `${brand.slug}-kit-${version}`;
  return { label, hash, fileName: `${root}.zip`, root, files: kitFilesFor(brand, version, hash) };
}

export const kitExportData: KitExportData = {
  defaultBrandId: 'adna',
  byBrand: perBrand((b) => ({ versions: [kitVersion(b, 'v[n]', 'v[n] (current) · [date]'), kitVersion(b, 'v1', 'v1 · [date]')] })),
  includes: [
    { id: 'sources', label: 'Source list', checked: true },
    { id: 'decisions', label: 'Decisions', checked: true },
    { id: 'missing', label: 'Missing sections as empty files', checked: false },
  ],
};
