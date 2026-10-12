import { Button, Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { StatePanel } from '../../../ui/composites/StatePanel';
import type { ScreenState } from '../../../ui/composites/DemoStateSwitcher';
import { paths } from '../paths';
import { StateView } from './StateView';

export interface VoicePreviewProps {
  note: string;
  sample: string;
  rules: string[];
  state: ScreenState;
  onAnother: () => void;
}

/** D23 VoiceRulesPreview: sample output for the same brief, and the plain-language rules the writer gets (n-ve 4). */
export function VoicePreview({ note, sample, rules, state, onAnother }: VoicePreviewProps) {
  return (
    <Stack gap={4}>
      <Card variant="subtle" labelledBy="voice-preview" header={<Heading level={2} size="lg" id="voice-preview">Preview</Heading>}>
        <Text variant="small" tone="secondary">{note}</Text>
        <StateView
          state={state}
          views={{
            success: <Text>{sample}</Text>,
            loading: <StatePanel kind="loading" level={3} title="Regenerating the preview" />,
            error: <StatePanel kind="error" level={3} title="Preview failed" body="Your settings are kept." actions={<Button variant="secondary" href={paths.voiceEditor}>Retry</Button>} />,
          }}
        />
        <Button variant="secondary" onClick={onAnother} disabled={state !== 'success'}>Try another brief</Button>
      </Card>
      <Card labelledBy="voice-rules" header={<Heading level={2} size="lg" id="voice-rules">Rules the writer gets</Heading>}>
        <Stack as="ul" gap={1}>
          {rules.map((r) => <Text as="li" key={r} variant="small">{r}</Text>)}
        </Stack>
        <Text variant="small" tone="secondary">Generated from the dimensions and the claims gate. The no-AI-slop check runs on every draft as well.</Text>
      </Card>
    </Stack>
  );
}
