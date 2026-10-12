import type { WorkbenchExample } from '../../system/example';
import { Link, Stack } from '../primitives';
import { DataTable, type DataTableColumn } from './DataTable';

interface Row { id: string; date: string; type: string; what: string; kit: string }
const rows: Row[] = [
  { id: '1', date: '5 Oct 2026', type: 'Post', what: 'LinkedIn launch post', kit: 'v1' },
  { id: '2', date: '4 Oct 2026', type: 'Kit', what: 'Kit v1', kit: 'v1' },
];
const columns: DataTableColumn<Row>[] = [
  { key: 'date', header: 'Date', rowHeader: true },
  { key: 'type', header: 'Type' },
  { key: 'what', header: 'What' },
  { key: 'kit', header: 'Kit', align: 'end' },
];
const key = (r: Row) => r.id;

export const example: WorkbenchExample = {
  id: 'C10',
  name: 'DataTable',
  description: 'Ready with row actions and a sticky header, empty, loading and error.',
  render: () => (
    <Stack gap={5}>
      <DataTable caption="Registrations (ready)" columns={columns} rows={rows} rowKey={key} actions={(r) => <Link href="/system">Check {r.what}</Link>} stickyHeader />
      <DataTable caption="Registrations (empty)" columns={columns} rows={[]} rowKey={key} />
      <DataTable caption="Registrations (loading)" columns={columns} rows={[]} rowKey={key} state="loading" />
      <DataTable caption="Registrations (error)" columns={columns} rows={[]} rowKey={key} state="error" />
    </Stack>
  ),
};
