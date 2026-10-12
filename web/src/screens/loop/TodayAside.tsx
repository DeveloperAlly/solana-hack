import { Heading, Link, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { useLoopLinks } from './paths';
import type { TodayData } from './types';

/** Today's side column (canvas Today): what the team did, what was learned, what's next, and proof at work. */
export function TodayAside({ data }: { data: TodayData }) {
  const { links } = useLoopLinks();
  const cards = [
    { id: 'done', title: 'Done since yesterday', lines: data.done, link: { label: 'See it on the ledger', href: links.ledger } },
    { id: 'learned', title: 'What we learned', lines: [data.learned], link: { label: 'Evidence and the proposed rule', href: links.learnRules } },
    { id: 'next', title: 'Next', lines: data.next.map((n) => `${n.when} · ${n.what}`), link: { label: 'Calendar', href: links.calendar } },
    { id: 'proof', title: 'Your proof, live', lines: [data.proof], link: { label: 'Badge', href: links.badge } },
  ];
  return (
    <Stack as="aside" gap={4} aria-label="Today at a glance">
      {cards.map((c) => (
        <Card key={c.id} variant={c.id === 'proof' ? 'subtle' : 'default'} labelledBy={`today-${c.id}`}>
          <Stack gap={2}>
            <Heading level={2} size="lg" id={`today-${c.id}`}>{c.title}</Heading>
            {c.lines.map((l) => <Text key={l} variant="small">{l}</Text>)}
            <Link href={c.link.href}>{c.link.label}</Link>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
