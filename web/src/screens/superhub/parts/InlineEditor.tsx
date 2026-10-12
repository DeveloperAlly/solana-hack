import { Button, Field, Stack } from '../../../ui/primitives';

export interface InlineEditorProps {
  label: string;
  value: string;
  error?: string | null;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
}

/** A multiline field with Save and Cancel, used wherever a drafted text is edited in place (replies, captions, wording). */
export function InlineEditor({ label, value, error, onChange, onSave, onCancel, saveLabel = 'Save' }: InlineEditorProps) {
  return (
    <Stack gap={2}>
      <Field label={label} multiline rows={3} value={value} error={error} onChange={(e) => onChange(e.target.value)} />
      <Stack direction="row" gap={2}>
        <Button onClick={onSave}>{saveLabel}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </Stack>
    </Stack>
  );
}
