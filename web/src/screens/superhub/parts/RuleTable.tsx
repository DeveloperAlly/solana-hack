import { Button, Field, Grid, Heading, Stack } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { DataTable } from '../../../ui/composites/DataTable';
import type { EngageRulesState } from '../hooks/useEngageRules';

/** D43 RuleRow table (n-er 1): when / where / then / on, with the "+ Add rule" form. */
export function RuleTable({ state }: { state: EngageRulesState }) {
  return (
    <Card labelledBy="rules-queue" header={<><Heading level={2} size="lg" id="rules-queue">What goes to the reply queue</Heading>{!state.adding && <Button variant="secondary" onClick={state.startAdding}>+ Add rule</Button>}</>}>
      <DataTable
        caption="Reply queue rules"
        hideCaption
        rows={state.rules}
        rowKey={(r) => r.id}
        columns={[
          { key: 'when', header: 'When', rowHeader: true },
          { key: 'where', header: 'Where' },
          { key: 'then', header: 'Then' },
          { key: 'on', header: 'On', cell: (r) => <input type="checkbox" checked={r.on} aria-label={`Rule on: ${r.when}`} onChange={() => state.toggleRule(r.id)} /> },
        ]}
      />
      {state.adding && (
        <Stack gap={3}>
          <Grid min="sm" gap={3}>
            <Field label="When" value={state.form.when} error={state.formError} onChange={(e) => state.setField('when', e.target.value)} />
            <Field label="Where" value={state.form.where} onChange={(e) => state.setField('where', e.target.value)} />
            <Field label="Then" value={state.form.then} onChange={(e) => state.setField('then', e.target.value)} />
          </Grid>
          <Stack direction="row" gap={2}><Button onClick={state.addRule}>Add rule</Button><Button variant="secondary" onClick={state.cancelAdding}>Cancel</Button></Stack>
        </Stack>
      )}
    </Card>
  );
}
