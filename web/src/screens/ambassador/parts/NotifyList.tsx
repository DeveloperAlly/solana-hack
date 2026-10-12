import { Stack, Text } from '../../../ui/primitives';
import { ToggleButton } from '../../../ui/composites/ToggleButton';

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
            <ToggleButton label="Notify me" pressedLabel="We'll email you" context={`about ${b}`} pressed={notified.has(b)} onToggle={() => onToggle(b)} />
          </Stack>
        </li>
      ))}
    </Stack>
  );
}
