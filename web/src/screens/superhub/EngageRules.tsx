/*
 * Data contract: Engage-Rules (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Engage-Rules,
 * note n-er). Shape: EngageRulesData in ./types.ts. Backend map §4 Roadmap line "Engage-Rules: rules table; replies
 * still queue for a person by default". Not built yet.
 *
 * | Field      | Source                                                                                              |
 * |------------|-----------------------------------------------------------------------------------------------------|
 * | rules[]    | rules table: when / where / then / on (n-er 1)                                                      |
 * | autoReply  | Opt-in auto-reply: keyword, channels, wording, when you approved it (n-er 2; open question noted)    |
 * | lists[]    | Suggested lists: name, accounts, why; you review and add members yourself (n-er 3)                  |
 * | windows    | Posting windows suggested from analytics (metrics; Roadmap "Analytics")                            |
 *
 * Empty: no rules yet (the table says so). States drawn: success only.
 */
import { Button, Heading, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { DataTable } from '../../ui/composites/DataTable';
import { HubPage } from './parts/HubPage';
import { PageHeader } from '../../ui/layouts/PageHeader';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import { RuleTable } from './parts/RuleTable';
import { AutoReplyCard } from './parts/AutoReplyCard';
import { useEngageRules } from './hooks/useEngageRules';
import { useHubLinks } from './paths';
import type { EngageRulesData } from './types';

export function EngageRules({ data }: { data: EngageRulesData }) {
  const links = useHubLinks();
  const state = useEngageRules(data);
  return (
    <HubPage artboard="Engage-Rules">
      <PageHeader badges={<ComingSoonFlag tag="ROADMAP" />} title="Rules, lists and auto-replies" back={{ href: links.engageQueue, label: '← Reply queue' }} />
      <RuleTable state={state} />
      <AutoReplyCard autoReply={data.autoReply} state={state} />
      <Card labelledBy="rules-lists" header={<Heading level={2} size="lg" id="rules-lists">Suggested lists</Heading>}>
        <Text variant="small" tone="secondary">We suggest; you review the members and add them yourself.</Text>
        <DataTable
          caption="Lists to review"
          hideCaption
          rows={data.lists}
          rowKey={(l) => l.id}
          columns={[{ key: 'name', header: 'List', rowHeader: true }, { key: 'accounts', header: 'Accounts', align: 'end', sort: (a, b) => a.accounts - b.accounts }, { key: 'why', header: 'Why' }]}
          actions={(l) => (state.isReviewing(l.id)
            ? <Text as="span" variant="small" role="status">{l.accounts} accounts to review; you add each one yourself.</Text>
            : <Button variant="secondary" onClick={() => state.review(l.id)}>Review members</Button>)}
        />
      </Card>
      <Card labelledBy="rules-windows" header={<Heading level={2} size="lg" id="rules-windows">Posting windows</Heading>}>
        <Text variant="small">{data.windows} <Text as="span" variant="small" tone="secondary">(suggested from your analytics; edit any)</Text></Text>
      </Card>
    </HubPage>
  );
}
