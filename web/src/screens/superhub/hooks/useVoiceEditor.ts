import { useState } from 'react';
import type { VoiceDimension, VoiceEditorData } from '../types';

/** Plain-language reading of one dial, from its end labels (n-ve 4: the rules update from the dials). */
export function describeDial(d: VoiceDimension, value: number, steps = 5): string {
  const mid = Math.ceil(steps / 2);
  const lean = value === mid ? 'balanced' : `towards ${value < mid ? d.start : d.end}`;
  return `${d.legend} ${value} of ${steps}: ${lean}.`;
}

/**
 * Voice-Editor state (n-ve): the 8 dial values, the ticked claims rules, reset to the template preset, the preview
 * sample, and the rules the writer gets, derived from the dials and the claims gate.
 */
export function useVoiceEditor(data: VoiceEditorData) {
  const [values, setValues] = useState(data.values);
  const [checked, setChecked] = useState(data.claimsChecked);
  const [sample, setSample] = useState(0);

  const rules = [
    ...data.dimensions.map((d) => describeDial(d, values[d.id])),
    ...data.claimsRules.map((r) => (checked.includes(r.id) ? r.label : r.offRule)),
  ];
  const changed = data.dimensions.some((d) => values[d.id] !== data.preset[d.id]) || [...checked].sort().join() !== [...data.claimsChecked].sort().join();

  return {
    values, checked, rules, changed,
    setValue: (id: string, v: number) => setValues((all) => ({ ...all, [id]: v })),
    toggleRule: (id: string) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id])),
    reset: () => { setValues(data.preset); setChecked(data.claimsChecked); },
    sample: data.samples[sample % data.samples.length],
    // INTEGRATION: POST /api/voices/:id/preview with the dials (backend map row "Voice-Editor"); here it cycles samples.
    nextSample: () => setSample((s) => s + 1),
  };
}
