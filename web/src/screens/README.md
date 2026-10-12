# Screens: how to add a canvas artboard

Every artboard on the [wireframe canvas](https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn) is built here as a presentational screen with sample data, viewable at `/screens/<Artboard>` ([issue #45](https://github.com/DeveloperAlly/solana-hack/issues/45)). This file is the pattern ([issue #46](https://github.com/DeveloperAlly/solana-hack/issues/46)); `public-next/` is the worked example.

## Folders
- **Live screens** (`landing`, `signin`, `build`, `create`, `verify`, `ledger`, `hub`, `public`) serve jamjam.tech today. New-flow work never edits them (issue #45, "Decisions").
- **New-flow screens** go in one folder per canvas page. A folder holds the page's screens, one `fixtures.ts` and one `registry.ts`. Folder names are free, because the registry entry names the canvas page; `public-next/` is used for "Verify + ledger" so it does not collide with the live `public/`.
- **No stylesheets in screens.** `npm run lint:tokens` fails on a `.css` file under `screens/`. A screen only composes components from `src/ui`. A component that two or more pages use belongs in `src/ui`, never in a screen (issue #45, "Rules").

## A screen file
A screen takes one typed `data` prop plus the `state` to show, and opens with a data contract comment. It makes no network calls.

```tsx
/*
 * Data contract: <Artboard> (canvas page "<page>", artboard <Artboard>; issue #N)
 *
 * Backend map row: "<row name>" (.agentic/what/context/backend_map.md §4, "<section>").
 *
 * | Field        | Type    | Source                                              |
 * |--------------|---------|-----------------------------------------------------|
 * | brand.name   | string  | GET /api/brands/:id -> name                         |
 * | rows[]       | Row[]   | GET /api/ledger?brand= -> rows (not built yet: say so) |
 *
 * States (canvas notes <note ids>): success, empty, loading, error, and what each shows.
 */
export interface FooData { /* exactly the fields above */ }
export function Foo({ data, state = 'success' }: { data: FooData; state?: ScreenState }) { /* compose src/ui */ }
```

- Name each field's real source: the endpoint and response field, or the client.
- If the endpoint does not exist yet, write "not built yet". Do not invent one.
- Cite the [backend map](../../../.agentic/what/context/backend_map.md) row the screen comes from.

## Fixtures
- Sample data lives in the folder's `fixtures.ts`, typed with the screen's data interface. Cite where the filler text comes from (the canvas board) in a comment at the top.
- Use placeholders for ids, hashes and amounts (for example all-zero hashes, `[approver]`), and say they are placeholders.
- Text that reads as a claim by a real brand gets brackets, for example `[Sample impersonation] …`. The gallery frame also shows a "Sample data" flag on every screen.
- Images use `Placeholder` (`src/ui/domain/Placeholder.tsx`), a local SVG. Never point at a remote image.

## Registry
Each folder exports its screens from `registry.ts`. The gallery collects every `src/screens/*/registry.ts` with `import.meta.glob` (`src/gallery/registry.ts`), so a page PR never edits a shared file.

```ts
import { createElement } from 'react';
import type { ScreenEntry } from '../registry-types';

export const screens: ScreenEntry[] = [
  {
    artboard: 'Verify-2-NoMatch',      // the canvas file name without .dc.html; it is the URL
    page: 'public',                    // a canvasPages id (registry-types.ts)
    title: 'Verify: not found',        // canvas title without its tag prefix
    tag: 'HACKATHON',                  // RouteTag (config/routes.ts), the canvas tag
    states: ['success', 'empty', 'loading', 'error'], // the canvas states; the first is the default
    render: (state) => createElement(Verify2NoMatch, { data: verifyNoMatch, state }),
  },
];
```

Artboard names must be unique. The gallery throws on a duplicate when it loads.

## Links between screens
Added in [issue #46](https://github.com/DeveloperAlly/solana-hack/issues/46) after a Codex review finding on [PR #68](https://github.com/DeveloperAlly/solana-hack/pull/68): bare links reset the gallery theme.
- Link to another artboard with `ScreenLink` ([`../gallery/ScreenLink.tsx`](../gallery/ScreenLink.tsx)): `<ScreenLink artboard="Ledger" state="empty">`.
- Where a component needs an href string (for example a `Button`), use `useScreenHref()` or `screenPath(artboard, state, params)` ([`../gallery/screenPath.ts`](../gallery/screenPath.ts)).
- These keep the gallery theme (`?theme=`) and set a state only when asked.
- As a backstop, the gallery rewrites a theme-less `/screens/...` URL to the theme chosen earlier in the tab ([`../gallery/useGalleryTheme.ts`](../gallery/useGalleryTheme.ts)).
- [`../../scripts/check-gallery.mjs`](../../scripts/check-gallery.mjs) asserts that the theme survives navigation.

## States
- Every screen renders its canvas states (empty, loading, error, success) through `state`.
- The gallery's C28 DemoStateSwitcher puts the state in the URL: `/screens/<Artboard>?state=error`. Each state therefore has a link for demos and recordings.
- Use `EmptyState` (C3) for empty and `StatePanel` (C29) for loading, error and success, unless the canvas draws something more specific.

## Checks
These run in CI on every PR (`.github/workflows/web-ci.yml`):
- `npm test`: `src/gallery/gallery.test.tsx` renders the index and every registered screen in every state and theme, with `fetch` stubbed to throw. It asserts 0 calls and 0 axe violations. Colour contrast is off there, because jsdom cannot compute colours.
- `npm run check:gallery`: a real Chromium serves the build and finds every screen from `/screens`. It runs axe with colour contrast on, for every state in every theme, plus `/system`. It also checks that deep links and the back button work.
- A new screen is covered by both checks as soon as it is registered.

## Themes
- A theme is one JSON file in `src/tokens/themes/` that remaps semantic tokens (`src/tokens/semantic.json`) to primitives. `wireframe-dark.json` is the example.
- To add one, copy a theme file, give it a new `name`, and change the values. Then run `npm run tokens`.
- The token build fails if any contrast pair in `semantic.json` misses WCAG ([SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum), [SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast)).
- The new theme then appears in the gallery's theme switch (`?theme=<name>`), and `check:gallery` checks it. No code changes.
