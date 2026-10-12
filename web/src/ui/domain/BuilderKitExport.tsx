import { useId, useState } from 'react';
import { Button } from '../primitives/Button';
import { Heading } from '../primitives/Heading';
import { Text } from '../primitives/Text';
import { Card } from '../composites/Card';
import { CheckboxRow } from '../composites/CheckboxRow';
import { StatePanel } from '../composites/StatePanel';
import { BuilderSelect } from './BuilderSelect';
import styles from './BuilderKitExport.module.css';

export type KitExportStatus = 'ready' | 'preparing' | 'failed';

export interface KitIncludeOption {
  id: string;
  label: string;
  checked: boolean;
}

/** One approved kit version: what the picker shows and what downloading it produces. */
export interface KitVersion {
  /** Picker label, e.g. "v1 · [date]". */
  label: string;
  /** Hash of this version (matches its onchain registration). */
  hash: string;
  /** Download file name, e.g. "jamjam-kit-v1.zip". */
  fileName: string;
  /** Folder tree preview (aDNA layout) for this version, one entry per line. */
  tree: string;
}

export interface BuilderKitExportProps {
  /** Approved versions, current first. */
  versions: KitVersion[];
  includes: KitIncludeOption[];
  status?: KitExportStatus;
}

/**
 * D49 KitExport (thin): version picker; the chosen version drives the folder tree, hash, file name and download. Include
 * options, then Download, with preparing and failed states. Canvas board Kit-Export (note n-kex: one zip of Markdown; no import back yet).
 */
export function BuilderKitExport({ versions, includes, status = 'ready' }: BuilderKitExportProps) {
  const treeId = useId();
  const [label, setLabel] = useState(versions[0]?.label ?? '');
  const version = versions.find((v) => v.label === label) ?? versions[0];
  const [current, setCurrent] = useState<KitExportStatus>(status);
  const [checked, setChecked] = useState(() => Object.fromEntries(includes.map((i) => [i.id, i.checked])));
  // INTEGRATION: GET /api/brands/:id/kit/:version for the chosen version (JSON), zipped in the browser (backend map §4, row Kit-Export; G-ZIP).
  const download = () => setCurrent('preparing');
  function pick(next: string) {
    setLabel(next);
    setCurrent('ready');
  }
  return (
    <div className={styles.grid}>
      <Card as="section" labelledBy={treeId}>
        <Heading level={2} size="lg" id={treeId}>What&apos;s in it (aDNA layout)</Heading>
        <Text as="pre" variant="mono" className={styles.tree}>{version.tree}</Text>
      </Card>
      <Card as="section">
        <BuilderSelect label="Version" options={versions.map((v) => v.label)} value={label} onChange={(e) => pick(e.target.value)} />
        <fieldset className={styles.includes}>
          <legend className={styles.legend}>Include</legend>
          {includes.map((i) => (
            <CheckboxRow key={i.id} label={i.label} checked={checked[i.id]} onChange={(e) => setChecked({ ...checked, [i.id]: e.target.checked })} />
          ))}
        </fieldset>
        <Text variant="small" tone="secondary">Hash of this version: <Text as="span" variant="mono">{version.hash}</Text>. Matches the onchain registration.</Text>
        {current === 'preparing' && <StatePanel kind="loading" level={3} title={`Preparing ${version.fileName}`} body="Building the folder from your kit. The download starts when it is ready." />}
        {current === 'failed' && <StatePanel kind="error" level={3} title="Could not build the download" body="Your kit is unchanged. Try again." />}
        <Button onClick={download} disabled={current === 'preparing'}>Download .zip</Button>
      </Card>
    </div>
  );
}
