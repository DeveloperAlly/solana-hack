import { useEffect, useMemo, useRef, useState } from 'react';
import wireframe from '../tokens/themes/wireframe.json';
import { contrastPairs, resolvedThemes, tokenMeta, tokenNames, type TokenName } from '../tokens/tokens';
import { contrastRatio, contrastThreshold, parseHex } from '../lib/contrast';
import { Button, Heading, Stack, Text } from '../ui/primitives';
import styles from './Workbench.module.css';

const base = resolvedThemes.wireframe;
const groups = Array.from(new Set(tokenNames.map((n) => tokenMeta[n].group)));

function toSixHex(value: string): string | null {
  const rgb = parseHex(value);
  return rgb ? '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('') : null;
}

/** Same-origin preview frames (data-theme-preview) get the same overrides as this document. */
function themeRoots(): HTMLElement[] {
  const roots: HTMLElement[] = [document.documentElement];
  document.querySelectorAll<HTMLIFrameElement>('iframe[data-theme-preview]').forEach((f) => {
    const root = f.contentDocument?.documentElement;
    if (root) roots.push(root);
  });
  return roots;
}

/** Copies this document's token overrides into a preview frame, e.g. when the frame (re)loads. */
export function syncThemeOverrides(frame: HTMLIFrameElement) {
  const target = frame.contentDocument?.documentElement;
  if (!target) return;
  const src = document.documentElement.style;
  for (let i = 0; i < src.length; i++) {
    const prop = src.item(i);
    if (prop.startsWith('--wl-')) target.style.setProperty(prop, src.getPropertyValue(prop));
  }
}

/** Theme editor: edit semantic tokens live, check contrast, export the theme as JSON. */
export function ThemeEditor() {
  const [edits, setEdits] = useState<Partial<Record<TokenName, string>>>({});
  const current = useMemo(() => ({ ...base, ...edits }), [edits]);
  // Every token this editor has overridden on the document, so the overrides never outlive the editor.
  const touched = useRef(new Set<TokenName>());

  function clearOverrides() {
    const roots = themeRoots();
    for (const n of touched.current) for (const r of roots) r.style.removeProperty(tokenMeta[n].cssVar);
    touched.current.clear();
  }
  useEffect(() => clearOverrides, []);

  function setToken(name: TokenName, value: string) {
    setEdits((e) => ({ ...e, [name]: value }));
    touched.current.add(name);
    for (const r of themeRoots()) r.style.setProperty(tokenMeta[name].cssVar, value);
  }
  function reset() {
    clearOverrides();
    setEdits({});
  }
  const exported = JSON.stringify({ ...wireframe, name: 'wireframe-edited', tokens: { ...wireframe.tokens, ...edits } }, null, 2);
  function download() {
    const url = URL.createObjectURL(new Blob([exported], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Stack gap={6}>
      <Stack direction="row" gap={3} wrap align="center">
        <Button onClick={download}>Export theme JSON</Button>
        <Button variant="secondary" onClick={reset}>
          Reset edits
        </Button>
        <Text variant="small" tone="secondary">
          {Object.keys(edits).length} token(s) edited
        </Text>
      </Stack>

      <section aria-labelledby="contrast-h">
        <Heading level={3} id="contrast-h">
          Contrast checks
        </Heading>
        <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="Contrast checks table">
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Foreground</th>
              <th scope="col">Background</th>
              <th scope="col">Kind</th>
              <th scope="col">Ratio</th>
              <th scope="col">Needs</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {contrastPairs.map((p) => {
              const r = contrastRatio(current[p.fg], current[p.bg]);
              const need = contrastThreshold[p.kind];
              const ok = r !== null && r >= need;
              return (
                <tr key={`${p.fg}|${p.bg}`}>
                  <td><code>{p.fg}</code></td>
                  <td><code>{p.bg}</code></td>
                  <td>{p.kind}</td>
                  <td>{r === null ? 'n/a' : `${r.toFixed(2)}:1`}</td>
                  <td>{need}:1</td>
                  <td>
                    <Text as="span" variant="label" tone={ok ? 'success' : 'danger'}>
                      {r === null ? 'Cannot check' : ok ? 'Pass' : 'Fail'}
                    </Text>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </section>

      {groups.map((g) => (
        <section key={g} aria-label={g}>
          <Heading level={3}>{g}</Heading>
          <div className={styles.tokenGrid}>
            {tokenNames
              .filter((n) => tokenMeta[n].group === g)
              .map((n) => {
                const id = `tok-${n.replace(/\./g, '-')}`;
                const hex = tokenMeta[n].type === 'color' ? toSixHex(current[n]) : null;
                return (
                  <div key={n} className={styles.tokenRow}>
                    <label htmlFor={id} className={styles.tokenLabel}>
                      <code>{n}</code>
                    </label>
                    {hex && (
                      <input
                        type="color"
                        aria-label={`${n} colour picker`}
                        className={styles.swatch}
                        value={hex}
                        onChange={(e) => setToken(n, e.target.value)}
                      />
                    )}
                    <input id={id} className={styles.input} value={current[n]} onChange={(e) => setToken(n, e.target.value)} />
                  </div>
                );
              })}
          </div>
        </section>
      ))}

      <section aria-labelledby="export-h">
        <Heading level={3} id="export-h">
          Theme JSON
        </Heading>
        <pre className={styles.pre} tabIndex={0} aria-label="Exported theme JSON">{exported}</pre>
      </section>
    </Stack>
  );
}
