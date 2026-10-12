import { Field, Grid, Stack } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import type { Answer } from './types';

export interface BuilderAnswersProps {
  answers: Answer[];
  /** stack: one under another; grid: side by side, each in a card (canvas BB-3 "ring" boxes). */
  layout?: 'stack' | 'grid';
}

/** The interview's free-text answers (canvas BB-2, BB-3, BB-4): one labelled textarea each, typed into freely. */
export function BuilderAnswers({ answers, layout = 'stack' }: BuilderAnswersProps) {
  const fields = answers.map((a) => <Field key={a.id} label={a.label} multiline rows={a.rows ?? 3} defaultValue={a.value} hint={a.hint} />);
  if (layout === 'stack') return <Stack gap={4}>{fields}</Stack>;
  return <Grid min="sm" gap={4}>{fields.map((f) => <Card key={f.key} as="div">{f}</Card>)}</Grid>;
}
