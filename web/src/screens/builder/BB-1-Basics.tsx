/*
 * Data contract: BB-1-Basics (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-1-Basics, note n-bb1;
 * issue #50). Backend map §4, row "BB-1-Basics" (POST /api/brands -> brands, memberships, evidence, sources). Shape: BasicsData.
 *
 * | Field       | Source                                                           | Empty                                  |
 * |-------------|------------------------------------------------------------------|----------------------------------------|
 * | brand.name  | brands.name (carried from Main or sign-up)                       | blank field                            |
 * | description | brands.description                                               | blank field                            |
 * | type        | brands.type: company / person / founder-linked                   | company                                |
 * | links       | sources (kind link), one per line                                | "No links yet? That's fine."           |
 * | goal        | evidence (owner answer, 12-month goal)                           | blank field                            |
 * | channel     | brands.primary_channel                                           | first option                           |
 *
 * States: success; error (an invalid URL inline on the links field). Continue checks the links on the client and goes
 * to ingest so sources are read before the questions that need them (note n-bb1.4).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Field, Grid } from '../../ui/primitives';
import { BuilderChoiceCards } from '../../ui/domain/BuilderChoiceCards';
import { BuilderSelect } from '../../ui/domain/BuilderSelect';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { invalidLinks } from '../../lib/validation';
import { BuilderStep } from './BuilderStep';
import { BuilderStepFooter } from './BuilderStepFooter';
import { useBuilderFlow } from './useBuilderFlow';
import type { BasicsData } from './types';

const linkError = (text: string) => {
  const bad = invalidLinks(text);
  return bad.length ? `Not a web address: ${bad.join(', ')}. Use one link per line, like jamjam.tech.` : null;
};

export function BB1Basics({ data, state = 'success' }: { data: BasicsData; state?: ScreenState }) {
  const navigate = useNavigate();
  const { back, next, skip, brandFor, enterBrand } = useBuilderFlow('basics');
  const [type, setType] = useState(data.type);
  const [links, setLinks] = useState(data.links);
  const [error, setError] = useState(state === 'error' ? linkError(data.links) : null);
  function submit() {
    const e = linkError(links);
    setError(e);
    // INTEGRATION: POST /api/brands with these fields (backend map §4, row "BB-1-Basics").
    if (!e && next) navigate(next);
  }
  return (
    <BuilderStep
      flow="basics"
      brand={data.brand}
      tag="FALLBACK"
      title="The basics"
      intro="We read anything public you link, so we only ask about what's missing."
      estimate="About 15 minutes in all · about 2 minutes for this step · saved as you go"
      footer={<BuilderStepFooter back={back} skip={skip} next={{ label: 'Continue: read my links', onClick: submit }} />}
    >
      <Grid min="sm" gap={4}>
        <Field label="Name" value={brandFor(data.brand).name} onChange={(e: { target: { value: string } }) => enterBrand({ brandName: e.target.value })} />
        <Field label="One-line description" defaultValue={data.description} />
      </Grid>
      <BuilderChoiceCards legend="Type" options={data.typeOptions} value={type} onChange={setType} />
      <Field
        label="Links (site, docs, socials, press)"
        multiline
        rows={3}
        value={links}
        onChange={(e: { target: { value: string } }) => setLinks(e.target.value)}
        hint="No links yet? That's fine. We'll ask more questions instead."
        error={error}
      />
      <Grid min="sm" gap={4}>
        <Field label="Goal for the next 12 months" defaultValue={data.goal} />
        <BuilderSelect label="Primary channel" options={data.channels} defaultValue={data.channel} />
      </Grid>
    </BuilderStep>
  );
}
