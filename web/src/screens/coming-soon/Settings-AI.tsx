/*
 * Data contract: Settings-AI (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Settings-AI; issue #51)
 * Backend map §4 row "Settings › AI": GET/PUT …/ai-settings, table ai_settings; inventory D54 ModelSettings.
 * Shape: SettingsAIData in ./types.
 *
 * | Field              | Source                                                        | Empty when                     |
 * |--------------------|---------------------------------------------------------------|--------------------------------|
 * | sources[]          | GET …/ai-settings -> model sources in order, with status      | never (the default is listed)  |
 * | storedKey.last4    | ai_settings: last 4 characters of the stored key, never more  | no key stored (null)           |
 * | storedKey.addedOn  | ai_settings: when the key was added                           | no key stored                  |
 * | usage.calls/spend  | ai_settings usage this month (estimate on the brand's key)    | no calls yet: "[n]"            |
 * | keyError           | PUT …/ai-settings key test -> provider message                | the test passed                |
 *
 * States: success (key stored), empty (no key, defaults in use), loading, error (the key test failed).
 */
import { useState } from 'react';
import { Alert, Button, Heading, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { SoonPage } from './SoonPage';
import { SoonInlineForm } from '../../ui/domain/SoonInlineForm';
import { SoonStatusList } from '../../ui/domain/SoonStatusList';
import { SoonStatusRow } from '../../ui/domain/SoonStatusRow';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { SettingsNav } from './SettingsNav';
import { StateView } from './StateView';
import { useSoonSession } from './useSoonSession';
import { useSoonRoutes } from './routes';
import { soonStatus } from './status';
import { httpsUrl } from './validate';
import type { SettingsAIData, StatusRowItem } from './types';

type TestResult = 'none' | 'ok' | 'failed';

export function SettingsAI({ data, state = 'success' }: { data: SettingsAIData; state?: ScreenState }) {
  const routes = useSoonRoutes();
  const [session, set] = useSoonSession();
  // Fixtures are defaults; what was changed here or on Settings-GetKey (session) wins.
  const sources = data.sources.map((r): StatusRowItem => {
    if (r.id === 'openrouter' && session.openRouter) return { ...r, status: session.openRouter };
    if (r.id === 'endpoint' && session.endpoint) return { ...r, detail: session.endpoint, status: 'connected' };
    return r;
  });
  const storedKey = session.aiKey === undefined ? data.storedKey : session.aiKey && { last4: session.aiKey.last4, addedOn: '[date]' };
  const [adding, setAdding] = useState(false);
  const [test, setTest] = useState<TestResult>(state === 'error' ? 'failed' : 'none');

  const actionFor = (row: StatusRowItem) => {
    if (row.id === 'openrouter' && row.status !== 'connected') return <Button href={routes.settingsGetKey} variant="secondary">Connect OpenRouter</Button>;
    if (row.id === 'endpoint' && row.status === 'not-set') return <Button variant="secondary" onClick={() => setAdding(true)}>Add endpoint</Button>;
    return null;
  };
  // INTEGRATION: PUT …/ai-settings { endpoint } (backend map "Settings › AI").
  const saveEndpoint = (v: Record<string, string>) => {
    set({ endpoint: v.url });
    setAdding(false);
  };

  return (
    <SoonPage header={{ title: 'Settings', intro: 'Which AI model writes for you, and whose key pays for it.', definedIn: 'component inventory D54; backend map, Settings › AI; delivery plan Phase 1' }} nav={<SettingsNav value="ai" />}>
      <StateView state={state} loading={{ title: 'Loading AI settings', body: 'Reading your model sources and key.' }}>
        <Card header={<Heading level={2} size="lg">Model source, in order</Heading>}>
          <SoonStatusList label="Model sources">
            {sources.map((row) => <SoonStatusRow key={row.id} name={row.name} detail={row.detail} status={soonStatus[row.status]} actions={actionFor(row)} />)}
          </SoonStatusList>
          {adding && (
            <SoonInlineForm
              label="Add an OpenAI-compatible endpoint"
              fields={[{ name: 'url', label: 'Endpoint URL', type: 'url', hint: 'The base URL of an OpenAI-compatible API.', validate: httpsUrl }]}
              submitLabel="Save endpoint"
              onSubmit={saveEndpoint}
              onCancel={() => setAdding(false)}
            />
          )}
        </Card>
        <Card header={<Heading level={2} size="lg">Stored key</Heading>}>
          {storedKey ? (
            <Stack gap={3}>
              <Text>Key ending …{storedKey.last4} · added {storedKey.addedOn}</Text>
              <Stack direction="row" gap={3} wrap>
                {/* INTEGRATION: PUT …/ai-settings key test (OpenRouter, Anthropic or OpenAI). */}
                <Button variant="secondary" onClick={() => setTest(state === 'error' ? 'failed' : 'ok')}>Test key</Button>
                <Button href={routes.settingsGetKey} variant="secondary">Replace</Button>
                <Button variant="secondary" onClick={() => { set({ aiKey: null }); setTest('none'); }}>Remove</Button>
              </Stack>
              {test === 'ok' && <Alert tone="success" title="That key works." />}
              {test === 'failed' && <Alert tone="danger" title={data.keyError} />}
            </Stack>
          ) : (
            <Text tone="secondary">No key stored. JamJam's default models are in use.</Text>
          )}
          <Text variant="small" tone="secondary">Encrypted at rest per brand; never shown again in full, never sent to the browser.</Text>
        </Card>
        <Card header={<Heading level={2} size="lg">This month</Heading>}>
          <Text>{data.usage.calls} calls · estimated spend {data.usage.spend} on your key</Text>
        </Card>
      </StateView>
    </SoonPage>
  );
}
