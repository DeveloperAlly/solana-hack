/*
 * Data contract: Kit-Export (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Kit-Export, note n-kex; issue #50).
 * Backend map §4, row "Kit-Export" (GET …/kit/:version as JSON; the zip is built in the browser, gap G-ZIP). Shape: KitExportData.
 *
 * | Field    | Source                                                                       | Empty                        |
 * |----------|------------------------------------------------------------------------------|------------------------------|
 * | byBrand  | Per brand chosen in the switcher (flow): kit_versions, current first: label, hash (matches the onchain     | v1 only |
 * |          | registration), file name "<brand>-kit-<version>.zip", and the files (sections, sources, decisions, templates) |         |
 * | includes | Client options: source list, decisions, missing sections as empty files      | n/a                          |
 *
 * States: success (ready), loading (preparing the zip), error (could not build it). THIN: one zip of Markdown; no import
 * back yet (note n-kex).
 */
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { BuilderKitExport, type KitExportStatus } from '../../ui/domain/BuilderKitExport';
import { BuilderHubPage } from './BuilderHubPage';
import { brandSubnav } from './paths';
import { useExportVersion, useHubBrand } from './useBuilderFlow';
import type { KitExportData } from './types';

const statusFor: Partial<Record<ScreenState, KitExportStatus>> = { loading: 'preparing', error: 'failed' };

export function KitExport({ data, state = 'success' }: { data: KitExportData; state?: ScreenState }) {
  const [brandId, selectBrand] = useHubBrand(data.defaultBrandId);
  const versionId = useExportVersion();
  const kit = data.byBrand[brandId] ?? data.byBrand[data.defaultBrandId];
  return (
    <BuilderHubPage
      brandId={brandId}
      onSelectBrand={selectBrand}
      subnav={{ label: 'Brand', items: brandSubnav, current: 'kit' }}
      title="Download your kit"
      tag="HACKATHON (THIN)"
      intro="Your kit is yours. Take it as a folder of plain Markdown files you can read, edit or load into any AI tool."
    >
      <BuilderKitExport key={`${state}:${brandId}:${versionId ?? ''}`} versions={kit.versions} initialVersionId={versionId} includes={data.includes} status={statusFor[state] ?? 'ready'} />
    </BuilderHubPage>
  );
}
