import type { BadgeTone } from '../../ui/primitives/Badge';
import { capabilityShort, statusLabel, type Platform } from '../../config/platforms';

const tone: Record<Platform['status'], BadgeTone> = { live: 'success', soon: 'solid', planned: 'neutral' };

/** The status chip for a platform: its label from the registry and a tone (the words carry the meaning). */
export function platformStatusChip(p: Platform): { label: string; tone: BadgeTone } {
  return { label: statusLabel(p.status), tone: tone[p.status] };
}

/** "Plans: draft, publish, verify" (capabilities are plans, not facts; issue #82). */
export function platformPlansLine(p: Platform): string {
  return `Plans: ${p.plans.map((c) => capabilityShort[c]).join(', ')}`;
}
