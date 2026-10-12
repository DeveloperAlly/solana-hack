import { Stack, Text } from '../../../ui/primitives';
import { AmbNotifyButton } from '../../../ui/domain/AmbNotifyButton';

export interface NotifyListProps {
  brands: string[];
  notified: ReadonlySet<string>;
  onToggle: (brand: string) => void;
}

/** "Notify me" per brand when no campaign is open (canvas Amb-1b; note n-a1b). INTEGRATION: POST /api/campaigns/:id/notify. */
export function NotifyList({ brands, notified, onToggle }: NotifyListProps) {
  return (
    <Stack as="ul" gap={3} aria-label="Brands to follow">
      {brands.map((b) => (
        <li key={b}>
          <Stack direction="row" gap={3} align="center" justify="between" wrap>
            <Text>{b}</Text>
            <AmbNotifyButton brand={b} on={notified.has(b)} onToggle={() => onToggle(b)} />
          </Stack>
        </li>
      ))}
    </Stack>
  );
}
