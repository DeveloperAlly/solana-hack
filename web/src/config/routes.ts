// M1: route and nav config. Shells and nav read from here; no nav markup is hand-written.
export type RouteTag = 'HACKATHON' | 'HACKATHON (THIN)' | 'COMING SOON' | 'EXPERIMENTAL' | 'ROADMAP';
export type RouteSection = 'public' | 'onboarding' | 'system' | 'hub';
export type ScreenId = 'landing' | 'workbench' | 'placeholder' | 'signin' | 'build';

export interface RouteDef {
  path: string;
  label: string;
  section: RouteSection;
  tag: RouteTag;
  screen: ScreenId;
}

export const routes: RouteDef[] = [
  { path: '/', label: 'Home', section: 'public', tag: 'HACKATHON', screen: 'landing' },
  { path: '/how-it-works', label: 'How it works', section: 'public', tag: 'HACKATHON', screen: 'placeholder' },
  { path: '/verify', label: 'Check a post', section: 'public', tag: 'HACKATHON', screen: 'placeholder' },
  { path: '/ledger', label: 'Ledger', section: 'public', tag: 'HACKATHON', screen: 'placeholder' },
  { path: '/sign-in', label: 'Sign in', section: 'onboarding', tag: 'HACKATHON', screen: 'signin' },
  { path: '/build/*', label: 'Build your brand', section: 'onboarding', tag: 'HACKATHON', screen: 'build' },
  { path: '/system', label: 'Workbench', section: 'system', tag: 'HACKATHON', screen: 'workbench' },
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
  { path: '/inbox', label: 'Inbox', tag: 'COMING SOON' },
  { path: '/brand', label: 'Brand', tag: 'HACKATHON' },
  { path: '/create', label: 'Create', tag: 'HACKATHON' },
  { path: '/grow', label: 'Grow', tag: 'HACKATHON' },
  { path: '/analytics', label: 'Analytics', tag: 'ROADMAP' },
  { path: '/ledger', label: 'Ledger', tag: 'HACKATHON' },
];
