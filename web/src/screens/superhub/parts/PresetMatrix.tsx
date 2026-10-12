import { Card } from '../../../ui/composites/Card';
import { DataTable, type DataTableColumn } from '../../../ui/composites/DataTable';
import type { VoiceTemplate, VoiceTemplatesData } from '../types';

/** D22 PresetMatrix: templates × the 9 dimensions, each column sortable (C10 DataTable sort). */
export function PresetMatrix({ data }: { data: VoiceTemplatesData }) {
  const columns: DataTableColumn<VoiceTemplate>[] = [
    { key: 'name', header: 'Template', rowHeader: true, cell: (t) => `${t.name}${t.contentPolicy ? ' *' : ''}`, sort: (a, b) => a.name.localeCompare(b.name) },
    ...data.dimensions.map((d, i) => ({ key: `d${i}`, header: d, align: 'end' as const, cell: (t: VoiceTemplate) => String(t.values[i]), sort: (a: VoiceTemplate, b: VoiceTemplate) => a.values[i] - b.values[i] })),
  ];
  return (
    <Card as="div">
      <DataTable caption={data.matrixCaption} rows={data.templates} rowKey={(t) => t.id} columns={columns} />
    </Card>
  );
}
