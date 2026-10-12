import type { WorkbenchExample } from '../../system/example';
import { Link, Stack } from '../primitives';
import { DataTable, type DataTableColumn } from './DataTable';

interface Row { id: string; date: string; type: string; what: string; kit: string }
const rows: Row[] = [
  { id: '1', date: '5 Oct 2026', type: 'Post', what: 'LinkedIn launch post', kit: 'v1' },
  { id: '2', date: '4 Oct 2026', type: 'Kit', what: 'Kit v1', kit: 'v1' },
];
const columns: DataTableColumn<Row>[] = [
  { key: 'date', header: 'Date', rowHeader: true, sort: (a, b) => a.id.localeCompare(b.id) },
  { key: 'type', header: 'Type', sort: (a, b) => a.type.localeCompare(b.type) },
  { key: 'what', header: 'What' },
  { key: 'kit', header: 'Kit', align: 'end' },
];
const key = (r: Row) => r.id;
const filter = {
  label: 'Filter by type',
  options: [{ id: 'all', label: 'All' }, { id: 'Kit', label: 'Kits' }, { id: 'Post', label: 'Posts' }],
  match: (r: Row, id: string) => r.type === id,
};

export const example: WorkbenchExample = {
  id: 'C10',
  name: 'DataTable',
  description: 'Ready with filter chips, sortable Date and Type, row actions and a sticky header; then empty, loading and error.',
  render: () => (
    <Stack gap={5}>
      <DataTable caption="Registrations (ready)" columns={columns} rows={rows} rowKey={key} actions={(r) => <Link href="/system">Check {r.what}</Link>} stickyHeader filter={filter} initialSort={{ key: 'date', direction: 'descending' }} />
      <DataTable caption="Registrations (empty)" columns={columns} rows={[]} rowKey={key} />
      <DataTable caption="Registrations (loading)" columns={columns} rows={[]} rowKey={key} state="loading" />
      <DataTable caption="Registrations (error)" columns={columns} rows={[]} rowKey={key} state="error" />
    </Stack>
  ),
};
