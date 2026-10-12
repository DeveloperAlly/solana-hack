import { Field } from '../../../ui/primitives';
import type { DraftState } from '../useDraft';

export interface AngleFieldProps {
  draft: DraftState;
  /** A textarea with the hint in the desktop rail (Amb-3); one line on mobile (M-3). */
  multiline: boolean;
}

/** "Your angle": the ambassador's own story, kept when the draft is regenerated (canvas note n-a3). */
export function AngleField({ draft, multiline }: AngleFieldProps) {
  const common = { label: 'Your angle', value: draft.angle };
  if (multiline) {
    return <Field {...common} multiline rows={5} hint="Your own story makes it yours. We keep the brand voice." onChange={(e) => draft.setAngle(e.target.value)} />;
  }
  return <Field {...common} onChange={(e) => draft.setAngle(e.target.value)} />;
}
