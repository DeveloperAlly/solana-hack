/*
 * Data contract: Settings-GetKey (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Settings-GetKey; issue #51)
 * Backend map §4 row "Settings › AI": PUT …/ai-settings (stores and tests the key), table ai_settings.
 * Shape: SettingsGetKeyData in ./types.
 *
 * | Field        | Source                                                          | Empty when            |
 * |--------------|-----------------------------------------------------------------|-----------------------|
 * | connectNote  | Static copy (canvas)                                            | never                 |
 * | whyOwnKey    | Static copy (canvas)                                            | never                 |
 * | keyError     | PUT …/ai-settings key test -> provider message                  | the key test passed   |
 *
 * The key is typed into a password field, sent once to the Worker and never shown again (canvas Settings-AI note).
 * States: success (ready), loading (testing the key), error (the key test failed).
 */
import { useState } from 'react';
import { Alert, Badge, Button, Grid, Heading, Link, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { SoonHubFrame } from '../../ui/domain/SoonHubFrame';
import { SoonInlineForm } from '../../ui/domain/SoonInlineForm';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { StateView } from './StateView';
import { soonRoutes } from './routes';
import { required } from './validate';
import type { SettingsGetKeyData } from './types';

type Outcome = 'none' | 'connected' | 'saved' | 'failed';
const alerts = (keyError: string): Record<Outcome, { tone: 'success' | 'danger'; title: string } | null> => ({
  none: null,
  connected: { tone: 'success', title: 'OpenRouter is connected. JamJam now writes on your key.' },
  saved: { tone: 'success', title: 'Key saved and tested. It will not be shown again in full.' },
  failed: { tone: 'danger', title: keyError },
});

export function SettingsGetKey({ data, state = 'success' }: { data: SettingsGetKeyData; state?: ScreenState }) {
  const [outcome, setOutcome] = useState<Outcome>(state === 'error' ? 'failed' : 'none');
  const banner = alerts(data.keyError)[outcome];
  return (
    <SoonHubFrame
      header={{
        title: 'Get an AI key in a minute',
        intro: 'One button connects your OpenRouter account. Prefer to paste a key? You can.',
        definedIn: 'delivery plan Phase 1 (Settings › AI); backend map (OpenRouter BYOK)',
        actions: <Link href={soonRoutes.settingsAI}>← Back to AI settings</Link>,
      }}
    >
      <StateView state={state} loading={{ title: 'Testing your key', body: 'Checking the key with the provider. Nothing is saved until it works.' }}>
        {banner && <Alert tone={banner.tone} title={banner.title} />}
        <Grid min="lg" gap={5}>
          <Card variant="selected" header={<Stack direction="row" gap={2} align="center" wrap><Heading level={2} size="lg">Connect OpenRouter</Heading><Badge tone="solid">Recommended</Badge></Stack>}>
            <Text tone="secondary">{data.connectNote}</Text>
            {/* INTEGRATION: OpenRouter OAuth (PKCE) redirect, then PUT …/ai-settings with the returned key. */}
            <Button onClick={() => setOutcome('connected')}>Connect OpenRouter</Button>
          </Card>
          <Card header={<Heading level={2} size="lg">Paste a key</Heading>}>
            {/* INTEGRATION: PUT …/ai-settings { key } then the key test; the error state shows the provider message. */}
            <SoonInlineForm
              label="Paste a key"
              fields={[{ name: 'key', label: 'API key', type: 'password', validate: required('your API key') }]}
              submitLabel="Save and test"
              onSubmit={() => setOutcome(state === 'error' ? 'failed' : 'saved')}
            />
          </Card>
        </Grid>
        <Card variant="subtle" header={<Heading level={2} size="lg">Why your own key?</Heading>}>
          <Text>{data.whyOwnKey}</Text>
        </Card>
      </StateView>
    </SoonHubFrame>
  );
}
