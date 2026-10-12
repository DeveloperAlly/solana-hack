import { useId, useState } from 'react';
import { Button } from '../primitives/Button';
import { Heading } from '../primitives/Heading';
import { Text } from '../primitives/Text';
import { Card } from '../composites/Card';
import { CheckboxRow } from '../composites/CheckboxRow';
import { StatePanel } from '../composites/StatePanel';
import { buildKitZip, kitFiles, kitTree, saveBlob, type KitFile } from '../../lib/kitZip';
import { BuilderSelect } from './BuilderSelect';
import styles from './BuilderKitExport.module.css';

export type KitExportStatus = 'ready' | 'preparing' | 'saved' | 'failed';

export interface KitIncludeOption {
  /** Matches the `group` of the files it adds (e.g. "sources" adds what/context/sources/). */
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
  /** Folder name inside the zip, e.g. "jamjam-kit-v1". */
  root: string;
  /** Every file this version can hold; include options add or remove the grouped ones. */
  files: KitFile[];
}

export interface BuilderKitExportProps {
  /** Approved versions, current first. */
  versions: KitVersion[];
  includes: KitIncludeOption[];
  status?: KitExportStatus;
}

/**
 * D49 KitExport (thin): version picker and include options; together they decide the files, so the tree preview, hash, file
 * name and the zip all follow them. Download builds the zip in the browser and saves it (preparing, then saved, or failed
 * with Try again). Canvas board Kit-Export
 * (note n-kex: one zip of Markdown; no import back yet).
 */
export function BuilderKitExport({ versions, includes, status = 'ready' }: BuilderKitExportProps) {
  const treeId = useId();
  const [label, setLabel] = useState(versions[0]?.label ?? '');
  const version = versions.find((v) => v.label === label) ?? versions[0];
  const [current, setCurrent] = useState<KitExportStatus>(status);
  const [checked, setChecked] = useState(() => Object.fromEntries(includes.map((i) => [i.id, i.checked])));
  const files = kitFiles(version.files, new Set(includes.filter((i) => checked[i.id]).map((i) => i.id)));

  function download() {
    setCurrent('preparing');
    // Built after the "preparing" render so the state shows while zipping.
    setTimeout(() => {
      try {
        // INTEGRATION: file contents will come from GET /api/brands/:id/kit/:version (backend map §4, row Kit-Export; G-ZIP);
        // until then each version's files are its fixture sample text.
        const bytes = buildKitZip(version.root, files);
        saveBlob(new Blob([bytes], { type: 'application/zip' }), version.fileName);
        setCurrent('saved');
      } catch {
        setCurrent('failed');
      }
    }, 0);
  }
  function toggle(id: string, on: boolean) {
    setChecked({ ...checked, [id]: on });
    setCurrent('ready');
  }
  function pick(next: string) {
    setLabel(next);
    setCurrent('ready');
  }

  return (
    <div className={styles.grid}>
      <Card as="section" labelledBy={treeId}>
        <Heading level={2} size="lg" id={treeId}>What&apos;s in it (aDNA layout)</Heading>
        <Text as="pre" variant="mono" className={styles.tree}>{kitTree(version.root, files)}</Text>
      </Card>
      <Card as="section">
        <BuilderSelect label="Version" options={versions.map((v) => v.label)} value={label} onChange={(e) => pick(e.target.value)} />
        <fieldset className={styles.includes}>
          <legend className={styles.legend}>Include</legend>
          {includes.map((i) => (
            <CheckboxRow key={i.id} label={i.label} checked={checked[i.id]} onChange={(e) => toggle(i.id, e.target.checked)} />
          ))}
        </fieldset>
        <Text variant="small" tone="secondary">Hash of this version: <Text as="span" variant="mono">{version.hash}</Text>. Matches the onchain registration.</Text>
        {current === 'preparing' && <StatePanel kind="loading" level={3} title={`Preparing ${version.fileName}`} body="Building the folder from your kit." />}
        {current === 'saved' && <StatePanel kind="success" level={3} title={`Saved ${version.fileName}`} body="Check your downloads folder." />}
        {current === 'failed' && (
          <StatePanel kind="error" level={3} title="Could not build the download" body="Your kit is unchanged." actions={<Button variant="secondary" onClick={download}>Try again</Button>} />
        )}
        <Button onClick={download} disabled={current === 'preparing'}>Download .zip</Button>
      </Card>
    </div>
  );
}
