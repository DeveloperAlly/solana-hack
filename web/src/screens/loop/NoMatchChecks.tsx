import { Button, Text } from '../../ui/primitives';
import { List, ListRow } from '../../ui/composites/ListRow';
import type { VerifyHomeData } from './types';

/**
 * Verify-Home's "Checks that found no match": an impersonation signal, shown to the owner only. With none, it says so
 * plainly rather than counting zero people.
 */
export function NoMatchChecks({ data, href }: { data: VerifyHomeData; href: string }) {
  const n = data.noMatch.length;
  if (n === 0) return <Text variant="small">No one has pasted text that claimed to be from {data.brandName} and wasn't registered. If someone does, it shows here, to you only.</Text>;
  return (
    <>
      <Text variant="small">{n} {n === 1 ? 'person' : 'people'} pasted text that claimed to be from {data.brandName} and wasn't registered. Each could be an impersonation. Only you see this.</Text>
      <List label="Checks that found no match">
        {data.noMatch.map((m) => <ListRow key={m.id} title={m.text} detail={m.when} actions={<Button variant="secondary" href={href}>See the check</Button>} />)}
      </List>
    </>
  );
}
