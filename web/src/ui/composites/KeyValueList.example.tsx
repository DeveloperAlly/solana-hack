import type { WorkbenchExample } from '../../system/example';
import { Link } from '../primitives';
import { KeyValueList } from './KeyValueList';

export const example: WorkbenchExample = {
  id: 'C11',
  name: 'KeyValueList',
  description: 'Receipt rows, as on Verify-1.',
  render: () => (
    <KeyValueList
      label="Verify result (example)"
      items={[
        { label: 'Brand', value: 'aDNA · adna.network verified' },
        { label: 'Kit', value: 'v1' },
        { label: 'Approved by', value: '[approver] · 5 Oct 2026, 16:18' },
        { label: 'Published', value: <>LinkedIn · <Link href="/system">Open post</Link></> },
      ]}
    />
  ),
};
