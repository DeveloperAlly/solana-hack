/*
 * Data contract: BB-5-Audience (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-5-Audience, note n-bb5;
 * issue #50). Backend map §4, row "BB-2 to BB-6" (POST …/draft-section for personas; audiences table). Shape: AudienceData.
 *
 * | Field    | Source                                                                                      | Empty                    |
 * |----------|---------------------------------------------------------------------------------------------|--------------------------|
 * | brand    | brands, profiles                                                                            | never                    |
 * | opinion  | POST …/interview/answer                                                                     | blank textarea           |
 * | people   | audiences.real_people (private flag; never contacted, never in prompts: backend map §3)       | three blank fields       |
 * | personas | POST …/draft-section (personas) -> audiences; "Assumption" until validated                  | "No personas left" text  |
 *
 * States: success. Edit, Remove and Mark validated work locally on the persona cards.
 */
import { useState } from 'react';
import { Button, Field, Grid, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { BuilderPersonaCard } from '../../ui/domain/BuilderPersonaCard';
import { BuilderSection } from './BuilderSection';
import { BuilderStep } from './BuilderStep';
import { BuilderStepFooter } from './BuilderStepFooter';
import { useBuilderFlow } from './useBuilderFlow';
import type { AudienceData, Persona } from './types';

export function BB5Audience({ data }: { data: AudienceData }) {
  const { back, next, skip } = useBuilderFlow('audience');
  const [personas, setPersonas] = useState<Persona[]>(data.personas);
  // INTEGRATION: persona edits save through POST /api/brands/:id/interview/answer (backend map §4, row "BB-2 to BB-6").
  const change = (p: Persona) => setPersonas((all) => all.map((x) => (x.id === p.id ? p : x)));
  const remove = (id: string) => setPersonas((all) => all.filter((x) => x.id !== id));
  return (
    <BuilderStep
      flow="audience"
      brand={data.brand}
      tag="FALLBACK"
      title="Who it's for"
      estimate="About 2 minutes · about 5 left"
      footer={<BuilderStepFooter back={back} skip={skip ? { href: skip, label: 'Skip for now' } : undefined}><Button href={next ?? ''}>Continue</Button></BuilderStepFooter>}
    >
      <Field label="Whose opinion do you care about most?" multiline rows={2} defaultValue={data.opinion} />
      <Card as="div">
        <Stack role="group" aria-labelledby="bb5-people" gap={3}>
          <Text variant="label" id="bb5-people">Name 1–3 real people who fit (optional)</Text>
          {data.people.map((p, i) => <Field key={i} label={`Real person ${i + 1}`} defaultValue={p} placeholder="Name, role" />)}
          <Text variant="small" tone="secondary">Used only to check the personas below. Never contacted, never published.</Text>
        </Stack>
      </Card>
      <BuilderSection title="Draft personas" badge="Assumptions until validated">
        {personas.length ? (
          <Grid as="ul" min="sm" gap={4}>
            {personas.map((p) => <BuilderPersonaCard key={p.id} persona={p} onChange={change} onRemove={remove} />)}
          </Grid>
        ) : (
          <Text tone="secondary">No personas left. Continue, and we&apos;ll draft new ones from your answers.</Text>
        )}
        <Text variant="small" tone="secondary">A persona loses the &ldquo;Assumption&rdquo; label only after you mark it validated against real people.</Text>
      </BuilderSection>
    </BuilderStep>
  );
}
