import type { Source } from '../../../config/platforms';
import { Link } from '../../../ui/primitives';

/** "(Source: label)", linked when the source has an address (AGENTS rule 6: every claim cites a source). */
export function GrowthSourceNote({ source }: { source: Source }) {
  return (
    <>
      (Source: {source.href ? <Link href={source.href} external>{source.label}</Link> : source.label})
    </>
  );
}
