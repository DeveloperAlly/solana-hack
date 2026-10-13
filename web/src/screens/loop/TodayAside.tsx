import { Heading, Link, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { useLoopLinks } from './paths';
import type { TodayData } from './types';

/** Today's side column (canvas Today): what the team did, what was learned, what's next, and proof at work. */
export function TodayAside({ data }: { data: TodayData }) {
  const { links } = useLoopLinks();
  // Each card says what there is, or what to do when there is nothing yet; a link appears only where it leads to
  // something (no "Evidence" link before Learn has learned anything; ADR-012 decision 6, teaching empty states).
  const cards = [
    { id: 'done', title: 'Done since yesterday', lines: data.done.length ? data.done : ['Nothing yet: drafts, posts and checks show here as they happen.'], link: data.done.length ? { label: 'See it on the ledger', href: links.ledger } : undefined },
    { id: 'learned', title: 'What we learned', lines: [data.learned ?? 'Nothing yet: Learn starts after 14 days of results.'], link: data.learned ? { label: 'Evidence and the proposed rule', href: links.learnRules } : undefined },
    { id: 'next', title: 'Next', lines: data.next.length ? data.next.map((n) => `${n.when} · ${n.what}`) : ['Nothing scheduled yet.'], link: { label: 'Calendar', href: links.calendar } },
    { id: 'proof', title: 'Your proof, live', lines: [data.proof ?? 'Put the check-it badge on your site, and see who checks your posts.'], link: { label: data.proof ? 'Badge' : 'Get the badge', href: links.badge } },
  ];
  return (
    <Stack as="aside" gap={4} aria-label="Today at a glance">
      {cards.map((c) => (
        <Card key={c.id} variant={c.id === 'proof' ? 'subtle' : 'default'} labelledBy={`today-${c.id}`}>
          <Stack gap={2}>
            <Heading level={2} size="lg" id={`today-${c.id}`}>{c.title}</Heading>
            {c.lines.map((l) => <Text key={l} variant="small">{l}</Text>)}
            {c.link && <Link href={c.link.href}>{c.link.label}</Link>}
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
