// M1: route and nav config. Shells and nav read from here; no nav markup is hand-written.
// Every tag the wireframe canvas puts on a board title (canvas.json, 2026-10-12). Canvas spellings map to one tag each:
// "HACK" and "JOURNEY" boards are HACKATHON; "EXP" is EXPERIMENTAL; "STRETCH (H8, ADR-008)" is STRETCH;
// "FALLBACK (if H5 slips)" is FALLBACK. PARKED and ARCHIVED boards are on the Archive page, which is not built (issue #45).
export const routeTags = ['HACKATHON', 'HACKATHON (THIN)', 'STRETCH', 'FALLBACK', 'COMING SOON', 'EXPERIMENTAL', 'ROADMAP', 'PARKED', 'ARCHIVED'] as const;
export type RouteTag = (typeof routeTags)[number];

/**
 * The one tag-to-label record. `label` is the chip text (ComingSoonFlag); `flag` says whether screens with this tag
 * carry a chip at all (hackathon screens do not); `short` is the hub nav suffix (AppShell), where one is shown.
 */
export const routeTagLabels: Record<RouteTag, { label: string; flag: boolean; short?: string }> = {
  HACKATHON: { label: 'Hackathon', flag: false },
  'HACKATHON (THIN)': { label: 'Thin', flag: true },
  STRETCH: { label: 'Stretch', flag: true },
  FALLBACK: { label: 'Fallback', flag: true },
  'COMING SOON': { label: 'Coming soon', flag: true, short: 'soon' },
  EXPERIMENTAL: { label: 'Experimental', flag: true, short: 'beta' },
  ROADMAP: { label: 'Roadmap', flag: true, short: 'roadmap' },
  PARKED: { label: 'Parked', flag: true },
  ARCHIVED: { label: 'Archived', flag: true },
};
export type RouteSection = 'public' | 'onboarding' | 'system' | 'hub';
export type ScreenId = 'landing' | 'workbench' | 'placeholder' | 'signin' | 'build' | 'create' | 'verify' | 'ledger' | 'home' | 'brand' | 'settings' | 'soon' | 'how' | 'gallery' | 'gallery-screen' | 'preview';

export interface RouteDef {
  path: string;
  label: string;
  section: RouteSection;
  tag: RouteTag;
  screen: ScreenId;
}

export const routes: RouteDef[] = [
  { path: '/', label: 'Home', section: 'public', tag: 'HACKATHON', screen: 'landing' },
  { path: '/how-it-works', label: 'How it works', section: 'public', tag: 'HACKATHON', screen: 'how' },
  { path: '/verify', label: 'Check a post', section: 'public', tag: 'HACKATHON', screen: 'verify' },
  { path: '/ledger', label: 'Ledger', section: 'public', tag: 'HACKATHON', screen: 'ledger' },
  { path: '/create', label: 'Create', section: 'hub', tag: 'HACKATHON', screen: 'create' },
  { path: '/home', label: 'Home', section: 'hub', tag: 'HACKATHON', screen: 'home' },
  { path: '/brand', label: 'Brand', section: 'hub', tag: 'HACKATHON', screen: 'brand' },
  { path: '/settings', label: 'Settings', section: 'hub', tag: 'HACKATHON', screen: 'settings' },
  { path: '/grow', label: 'Grow', section: 'hub', tag: 'COMING SOON', screen: 'preview' },
  { path: '/inbox', label: 'Inbox', section: 'hub', tag: 'COMING SOON', screen: 'preview' },
  { path: '/analytics', label: 'Analytics', section: 'hub', tag: 'ROADMAP', screen: 'preview' },
  { path: '/distribute', label: 'Distribute', section: 'hub', tag: 'COMING SOON', screen: 'preview' },
  { path: '/verify-home', label: 'Your proof', section: 'hub', tag: 'COMING SOON', screen: 'preview' },
  { path: '/learn', label: 'Learn', section: 'hub', tag: 'COMING SOON', screen: 'preview' },
  { path: '/preview/:artboard', label: 'Product preview', section: 'system', tag: 'COMING SOON', screen: 'preview' },
  { path: '/sign-in', label: 'Sign in', section: 'onboarding', tag: 'HACKATHON', screen: 'signin' },
  { path: '/build/*', label: 'Build your brand', section: 'onboarding', tag: 'HACKATHON', screen: 'build' },
  { path: '/system', label: 'Workbench', section: 'system', tag: 'HACKATHON', screen: 'workbench' },
  // Screen gallery (issue #46): every canvas artboard with sample data; public, read-only, no network calls.
  { path: '/screens', label: 'Screens', section: 'system', tag: 'HACKATHON', screen: 'gallery' },
  { path: '/screens/:artboard', label: 'Screen', section: 'system', tag: 'HACKATHON', screen: 'gallery-screen' },
];

export interface NavItem {
  path: string;
  label: string;
  tag: RouteTag;
}

/** Public nav (L10). The last item renders as a button. */
export const publicNav: NavItem[] = ['/how-it-works', '/verify', '/ledger', '/sign-in'].map((p) => {
  const r = routes.find((x) => x.path === p);
  if (!r) throw new Error(`publicNav: no route ${p}`);
  return { path: r.path, label: r.label, tag: r.tag };
});

/** Hub top nav (L2). Defined now, rendered from S4. Tags follow the inventory screen map. */
export const hubNav: NavItem[] = [
  { path: '/home', label: 'Home', tag: 'HACKATHON' },
  { path: '/brand', label: 'Brand', tag: 'HACKATHON' },
  { path: '/create', label: 'Create', tag: 'HACKATHON' },
  { path: '/grow', label: 'Grow', tag: 'COMING SOON' },
  { path: '/inbox', label: 'Inbox', tag: 'COMING SOON' },
  { path: '/analytics', label: 'Analytics', tag: 'ROADMAP' },
  { path: '/ledger', label: 'Ledger', tag: 'HACKATHON' },
  { path: '/settings', label: 'Settings', tag: 'HACKATHON' },
];
