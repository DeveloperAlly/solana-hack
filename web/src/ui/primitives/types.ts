export type SpaceStep = 0 | 'half' | 1 | 2 | '2-5' | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export const space = (s: SpaceStep | undefined): string | undefined =>
  s === undefined ? undefined : `var(--wl-space-${s})`;
