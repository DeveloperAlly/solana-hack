import { describe, expect, it } from 'vitest';
import { createElement, Fragment } from 'react';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { allScreens, screenHome } from '../gallery/registry';
import { GalleryModeContext } from '../ui/hooks/galleryMode';
import { artboardPages, artboards } from './artboards';
import { homeForArtboard, homeForPage, loopSteps, mobileTabFor, mobileTabs, shells, stageById, stages, tabById, type HomeId, type ShellId } from './nav';

// The one navigation (ADR-012 decision 2, PR #86; issue #90 contracts), checked against canvas v24.
vi.mock('../lib/supabase', () => ({ supabase: null }));
const homeIds = new Set<HomeId>([...stages.map((s) => s.id), 'first-run']);

describe('config/nav', () => {
  it('holds Today, the six steps in loop order, then Inbox and Settings', () => {
    expect(stages.map((s) => s.label)).toEqual(['Today', 'Brand', 'Create', 'Distribute', 'Verify', 'Grow', 'Learn', 'Inbox', 'Settings']);
    expect(loopSteps.map((s) => s.step)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('draws each stage subnav exactly as the canvas does', () => {
    const tabs = Object.fromEntries(stages.map((s) => [s.label, s.tabs.map((t) => t.label)]));
    expect(tabs).toEqual({
      Today: [],
      Brand: ['Kit', 'The Brain', 'Voices', 'Claims', 'Founder'],
      Create: ['Drafts', 'Post', 'Media'],
      Distribute: ['Platforms', 'Adapt and schedule', 'Calendar', 'Connections'],
      Verify: ['Your proof', 'Badge', 'Tips', 'Public ledger'],
      Grow: ['Overview', 'Ambassadors', 'Campaigns', 'Events', 'Engage', 'Partners', 'Leads', 'Influencers', 'Referrals', 'Team'],
      Learn: ['Results', 'Suggested rules', 'Outcomes'],
      Inbox: ['All', 'Needs reply', 'Sources'],
      Settings: ['AI model', 'Connections', 'Plan and seats', 'Team'],
    });
    for (const s of stages) if (s.tabs.length) expect(s.tabs[0].artboard).toBe(s.artboard);
  });

  it('has five mobile tabs, and every stage sits under exactly one', () => {
    expect(mobileTabs.map((t) => t.label)).toEqual(['Today', 'Create', 'Verify', 'Grow', 'More']);
    for (const s of stages) expect(mobileTabs.filter((t) => t.stages.includes(s.id))).toHaveLength(1);
    expect(mobileTabFor('learn').id).toBe('more');
  });

  it('maps every canvas page to its home, splitting the utilities page by board', () => {
    expect(homeForPage('public', 'Ledger')).toBe('verify');
    expect(homeForPage('journey', 'J1-Read')).toBe('first-run');
    expect(homeForPage('loop', 'Today')).toBe('today');
    expect(homeForPage('loop', 'Brain')).toBe('today');
    expect(homeForPage('grow', 'Events-Board')).toBe('grow');
    expect(homeForPage('utilities', 'Inbox-Connect')).toBe('inbox');
    expect(homeForPage('utilities', 'Upgrade')).toBe('settings');
    for (const a of artboards) expect(homeIds.has(homeForArtboard(a)!), a).toBe(true);
  });

  it('throws on a stage tab the canvas does not draw', () => {
    expect(tabById('learn', 'rules').artboard).toBe('Learn-Rules');
    expect(() => tabById('learn', 'nope')).toThrow();
    expect(stageById('verify').label).toBe('Verify');
  });
});

/** The shells a screen renders (AppFrame / AppShell mark app or ambassador, PublicShell public). */
function renderedShells(entry: (typeof allScreens)[number]): Set<string> {
  const { container } = render(
    createElement(MemoryRouter, { initialEntries: [`/screens/${entry.artboard}`] },
      createElement(GalleryModeContext.Provider, { value: true }, createElement(Fragment, null, entry.render(entry.states[0])))),
  );
  const found = new Set([...container.querySelectorAll('[data-shell]')].map((e) => e.getAttribute('data-shell') ?? ''));
  cleanup();
  return found;
}

describe('registered screens: one home and one shell each (ADR-012)', () => {
  const product = allScreens.filter((e) => e.page !== 'licensee');
  it.each(product.map((e) => [e.artboard, e] as const))('%s', (_name, entry) => {
    expect(entry.page).toBe(artboardPages[entry.artboard]);
    expect(homeIds.has(screenHome(entry)!)).toBe(true);
    const rendered = renderedShells(entry);
    const shell: string[] = entry.shell ? [entry.shell] : [...rendered];
    if (entry.shell && rendered.size) expect([...rendered]).toEqual([entry.shell]);
    expect(shell).toHaveLength(1);
    expect(shells).toContain(shell[0] as ShellId);
  });
});
