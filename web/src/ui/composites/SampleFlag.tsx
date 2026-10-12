import { Badge } from '../primitives/Badge';

/** "Sample data" flag (canvas chip), for any number or row that is filler until its integration lands. */
export function SampleFlag({ children = 'Sample data' }: { children?: string }) {
  return <Badge>{children}</Badge>;
}
