import { useState } from 'react';
import { Button, Field, Grid, Stack, Text } from '../primitives';
import { Card } from '../composites/Card';
import { Placeholder } from './Placeholder';

export interface SoonSlide {
  id: string;
  /** Slide role, e.g. "1 · Hook". */
  label: string;
  text: string;
}

export interface SoonSlideEditorProps {
  /** Accessible name of the slide list, e.g. "Carousel slides". */
  label: string;
  slides: SoonSlide[];
  onChange: (id: string, text: string) => void;
}

/**
 * Media slide editor (canvas Media-Composer): a grid of slides with a placeholder image each; pick a slide to
 * select it, then edit its text in place. The selected slide is highlighted and its text is required.
 */
export function SoonSlideEditor({ label, slides, onChange }: SoonSlideEditorProps) {
  const [selected, setSelected] = useState(slides[0]?.id ?? null);
  const current = slides.find((s) => s.id === selected);
  return (
    <Stack gap={4}>
      <Grid as="ul" min="sm" gap={3} aria-label={label}>
        {slides.map((s) => (
          <Card key={s.id} as="li" variant={s.id === selected ? 'selected' : 'default'}>
            <Stack gap={2}>
              <Placeholder label={`Slide ${s.label}`} ratio="square" />
              <Text variant="label">{s.label}</Text>
              <Text variant="small" tone="secondary" truncate>{s.text}</Text>
              <Button variant="secondary" aria-pressed={s.id === selected} onClick={() => setSelected(s.id)}>
                {s.id === selected ? 'Editing' : 'Edit'}<span className="wl-visually-hidden"> slide {s.label}</span>
              </Button>
            </Stack>
          </Card>
        ))}
      </Grid>
      {current && (
        <Field
          label={`Slide ${current.label} text`}
          multiline
          rows={3}
          value={current.text}
          error={current.text.trim() === '' ? 'A slide needs some text.' : null}
          onChange={(e: { target: { value: string } }) => onChange(current.id, e.target.value)}
        />
      )}
    </Stack>
  );
}
