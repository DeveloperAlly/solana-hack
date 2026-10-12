import type { ReactElement } from 'react';

/**
 * A workbench entry. Every `*.example.tsx` under src/ui exports `example` of this type, and /system picks it up
 * through import.meta.glob, so adding a component never edits the workbench (issue #46).
 */
export interface WorkbenchExample {
  /** Component inventory ID, e.g. "C10" (.agentic/what/context/component_inventory.md). */
  id: string;
  name: string;
  /** One line on what the example shows (variants and states). */
  description?: string;
  render: () => ReactElement;
}

/** Sort key for inventory IDs: layer letter order P, C, L, D, then the number. */
export function exampleOrder(a: WorkbenchExample, b: WorkbenchExample): number {
  const layer = (id: string) => 'PCLDM'.indexOf(id[0]);
  const num = (id: string) => Number.parseInt(id.slice(1), 10) || 0;
  return layer(a.id) - layer(b.id) || num(a.id) - num(b.id) || a.name.localeCompare(b.name);
}
