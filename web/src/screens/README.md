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

## Shared components: use these, don't re-create
Added in [issue #46](https://github.com/DeveloperAlly/solana-hack/issues/46) after six page branches built the same components under page prefixes. Before you build a component, check this table and the [component inventory](../../../.agentic/what/context/component_inventory.md) (§6.9). If a shared one is close but not quite right, add a prop to it in `src/ui`; never copy it under a page prefix.

To migrate: delete the page copy (component, CSS module, example, test), change the import, and rename the props as below. Props not listed keep their name.

| Old (page branch) | New shared component | Props: old → new |
|---|---|---|
| `BuilderSelect` (50) | `Select` from `ui/primitives/Select` (P13) | `options: string[]` unchanged (strings are allowed); `hint`, native select props unchanged |
| `AmbSelect` (53) | `Select` (P13) | `onChange(value)` → `onValueChange(value)`; `layout` unchanged; options `{ value, label }` unchanged |
| `SelectField` + `FieldFrame` (52) | `Select` (P13); `FieldFrame` is in `ui/primitives/FieldFrame` | unchanged (`label`, `hint`, `error`, `options`, native props). Drop the 52 copies of `FieldFrame.tsx`, `Field.tsx` and the `index.ts` export: this branch has them |
| `BuilderCopyButton` (50) | `CopyButton` from `ui/composites/CopyButton` (C13) | unchanged (`value`, `label`, `variant`); default `feedback="status"` is its behaviour |
| `SoonCopyButton` (51) | `CopyButton` (C13) | `text` → `value`; add `feedback="label"` and `messages={{ copied: 'Copied to the clipboard.', failed: 'Could not copy. Select the text and copy it yourself.' }}` for the same wording |
| `BuilderProgressBar` (50) | `ProgressBar` from `ui/composites/ProgressBar` (P24) | tone `strong` → `primary`, `muted` → `secondary`; `label`, `segments`, `caption` unchanged |
| `AmbBar` (53) | `ProgressBar` (P24) | `segments [{ pct, tone }]` → `[{ value, label, tone }]` (add a `label` per segment); add `label`; `marker`, `size` unchanged; pass `decorative` where the numbers are already in text |
| `AmbBudgetBar` (53) | `BudgetBar` from `ui/domain/BudgetBar` (D25) | `AmbBudget` → `Budget`; `budgetLevel`, `caption` unchanged; `AMB_BUDGET_WARN_SHARE` → `BUDGET_WARN_SHARE` |
| `AmbOnBrandMeter` (53) | keep as the page's D4 preset, drawn with `Meter` from `ui/composites/Meter` (P25) | replace the inner `role="meter"` div and `AmbBar` with `<Meter label="On-brand score" value={score} threshold={threshold} valueText=… summary=… hint=… />` |
| `HubBarList` (52) | `BarList` from `ui/composites/BarList` (C22) | `HubBarItem` → `BarListItem`; props unchanged |
| `BuilderScale` (50) | `Scale` from `ui/composites/Scale` (C6) | `low` → `startLabel`, `high` → `endLabel`; `legend`, `value`, `onChange`, `steps` unchanged |
| `HubDial` (52) | `Scale` (C6) | `start` → `startLabel`, `end` → `endLabel`; add `layout="stacked"` for the dial look; `disabled` unchanged |
| `BuilderCoverageBadge` (50) | `CoverageBadge` from `ui/domain/CoverageBadge` (D51) | `state` `'E' / 'I' / 'M'` → `status` `'evidenced' / 'inferred' / 'missing'`; `withDetail` → `display="legend"`; `coverageMeaning` → `coverageMeta` |
| `HubCoverageBadge` (52) | `CoverageBadge` (D51) | `showWord` → `display="word"`; `coverageStatuses`, `coverageWord` unchanged. Drop the 52 change to `EvidenceChip.tsx`: this branch has it |
| `SoonInlineForm` (51) | `InlineForm` from `ui/composites/InlineForm` (C30) | add `surface="card"`; `SoonInlineField` → `InlineFormField`; other props unchanged |
| `SoonAddForm` (51) | `InlineForm` (C30) | unchanged (`triggerLabel` opens it in place); add `surface="card"` |
| `AmbInlineForm` (53) | `InlineForm` (C30) | single field → `fields={[{ name, label, type, placeholder, hint, defaultValue, validate }]}`; `variant` → `submitVariant`; `onSubmit(value)` → `onSubmit(values)` and read `values[name]` |
| `BuilderLinkAdder` (50) | `InlineForm` (C30) | `fields={[{ name: 'url', label, placeholder: 'Paste a URL', inputMode: 'url', validate }]}` with `layout="row"`, `resetOnSubmit`, `submitVariant="secondary"`, `submitLabel="Add link"`; `onAdd(url)` → `onSubmit(({ url }) => …)` |
| `JourneyCopyButton` (48) | `CopyButton` (C13) | `text` → `value`; `resetAfter` unchanged; add `feedback="both"`, `resultLabels={{ copied: \`${label}: copied\` }}` and `messages={{ failed: "Couldn't copy. Select the text and copy it instead." }}` |
| `JourneyProgress` (48) | `ProgressBar` (P24) | `value` → `segments={[{ value, label: 'Done' }]}`; `label` (string) with `showLabel`; `hint` → `caption`; `grow` unchanged |
| `JourneyInlineForm` (48) | `InlineForm` (C30) | single field → `fields={[{ name, label, type, placeholder, hint, defaultValue, inputMode, autoComplete, multiline, validate }]}`; `onSubmit(value)` → `onSubmit(values)`; `busy`, `busyLabel`, `onCancel` unchanged; `error` → `errors={{ [name]: error }}`; `showErrorsNow` → `validateOnMount` |
| `HubColumns` (52, also copied onto 53) | `Columns` from `ui/layouts/Columns` (L9) | `start`, `end` unchanged; `endWidth="aside"` → default `ratio="2-1"`; `endWidth="equal"` → `ratio="1-1"` |
| `AmbColumns` (53) | `Columns` (L9) | children list → slots: `layout="main-aside"` → `<Columns end={aside}>{main}</Columns>`; `layout="rail-main-rail"` → `<Columns start={left} startWidth="fluid" end={right} gap={6}>{main}</Columns>` |
| `JourneySplit` (48) | `Columns` (L9) with `stackBelow="md"` | `ratio="rail"` → `start={first}` and `{second}` as children; `ratio="6-5"` / `"7-5"` / `"5-7"` → `{first}` as children, `end={second}`, same `ratio` (add `gap={7}` for 6-5) |
| `JourneyChoiceCards` (48) | `ChoiceCards` from `ui/composites/ChoiceCards` (C7) | add `legendSize="lg"`; options `{ value, title, tag, body }` unchanged |
| `BuilderChoiceCards` (50) | `ChoiceCards` (C7) | unchanged (`legend`, `options { value, title, body, meta }`, `value`, `onChange`, `layout`); `multiple` adds checkbox mode |
| `JourneyFileButton` (48) | `FilePicker` from `ui/composites/FilePicker` (C14) | `onFile(file)` → `onFiles(([file]) => …)`; `label`, `accept` unchanged |
| `BuilderFilePicker` (50) | `FilePicker` (C14) | `onFiles(names)` → `onFiles(files)` and map `files.map((f) => f.name)`; other props unchanged |
| `JourneyGateCard` (48) | `DecisionGate` from `ui/domain/DecisionGate` (D17) with `variant="compact"` | `gate`, `title`, `builtFrom`, `evidence` unchanged; draft (or the edit form) → children; `decision` → `decision={{ status: 'approved', by, at, why }}` or `{ status: 'pending' }`; `onApprove` / `onReopen` → `onDecide`; Edit button → `actions`, and `approveDisabled` while editing |
| `BuilderDecisionGate` (50) | `DecisionGate` (D17) | `backHref` + `backLabel` → `back={{ href, label }}`; `subject`, `draftLabel`, `draftMeta`, `whyLabel`, `approver`, `decision`, `onDecide`, `nextHref`, children unchanged |
| `JourneyPolishBar` (48) | `PolishBar` from `ui/domain/PolishBar` (D6) | `actions: string[]` → `actions={[{ id, label }]}`; `applied`, `onApply`, `onUndo`, `busy` unchanged (ids) |
| `parts/PolishBar` (52) | `PolishBar` (D6) | from the review hook: `applied={versions.map((v) => v.action)}`, `onApply={polish}`, `failure={failed && { id: failed, reason, onRetry: retry, onDismiss: dismiss }}`, `accessibleMode={{ checked: accessible, onChange: setAccessible }}`, `note` for the help line |
| `JourneyStatusList` (48) | `StatusList` from `ui/composites/StatusList` (C32) | `title` → `label` with `title` on and `surface="card"`; rows `{ label, value, solid, href }` → `{ id, label, status: value, solid, href }`; `variant` → `cardVariant` |
| `AmbStatusTimeline` (53) | `StatusTimeline` from `ui/composites/StatusTimeline` (C9) | `AmbTimelineStep` → `TimelineStep`; props unchanged (default `label` is now "Status": pass `label="Post status"`) |
| `AmbSheet` (53) | `Sheet` from `ui/composites/Sheet` (C18) | unchanged (`open`, `onClose`, `title`, children); optional `footer`, `closeLabel` |
| `AmbCollapsibleText` (53) | `CollapsibleText` from `ui/composites/CollapsibleText` (C33) | unchanged (`text`, `collapsible`); optional `lines`, `moreLabel`, `lessLabel` |
| `AmbNotifyButton` (53) | `ToggleButton` from `ui/composites/ToggleButton` (C34) | `on` → `pressed`; `brand` → `context={\`about ${brand}\`}`; `label="Notify me"`, `pressedLabel="We'll email you"` |
| `SoonPageHeader` (51) | `PageHeader` from `ui/layouts/PageHeader` (L5) | `tag` → `badges={<ComingSoonFlag tag={tag} />}`; `definedIn` → `meta={\`Drawn, not built. Defined in: ${definedIn}\`}`; `title`, `intro`, `actions` unchanged |
| `SoonHubFrame` (51) | keep as a page composition of `AppShell` + `PageHeader` | swap its `SoonPageHeader` for `PageHeader` |
| `BuilderShell` (50) | `AppFrame` from `ui/layouts/AppFrame` (L11) | `context`, `flags`, `homeHref`, `preview` unchanged; `action` → `actions` |
| `AmbShell` / `AmbDesktopShell` (53) | `AppFrame` (L11) | `nav` + `active` → `nav={{ label: 'Ambassador', items: nav, current: active }}`; `flag` → `flags`; account chip → `actions={<AmbAccountChip … />}`; wrap the body in `Container width="app"` |
| `AmbMobileShell` + `AmbTabBar` (53) | `AppFrame` (L11) with `width="phone"` | `back`, `title`, `pinned`, `footer` unchanged; `tabs` → `nav={{ …, placement: 'tabs' }}` (omit `nav` when there is no tab bar); account chip → `actions`. Footer and tab bar share one sticky bottom region |
| `AppShell` changes (48: `navHref`; 52: `nav`, `homeHref`, `activePath`, `subnav`, `onSignOut`) | `AppShell` (L1) here, one prop set | revert both diffs. Props: `brandName`, `brandSlot` (slot), `subnav` (slot), `nav`, `navHref` (maps every nav path and the logo's `/home`), `activePath`, `preview`. `homeHref` → `navHref` (the logo uses `navHref('/home')`); `onSignOut` is gone: Sign out is inert in the gallery and in preview |
| `PublicShell` change (48: `navHref`, `actions`) | `PublicShell` (L10) here | revert: this branch has the `ui/48-journey` file byte for byte |
| `Field` / `FieldFrame` `hideLabel` (52) | `Field`, `FieldFrame`, `Select` here | revert: `Field.tsx` is the 52 file byte for byte; `FieldFrame` and `Select` take `hideLabel` too |
| `HubApprovalCard` (52) | `ApprovalItem` from `ui/domain/ApprovalItem` (D1) | unchanged (`meta`, `incoming`, `media`, `note`, `draft`, `actions`, `outcome`, `blocked`) |
| `BuilderApprovalItem` (50) | keep the page's ambassador-submission state, render it in `ApprovalItem` (D1) | `surface="row"`; kind / author / amount → `meta`; excerpt → `draft`; check chips + link → `checks`; status line → `status`; reject-reason form → children; buttons → `actions` |
| `SoonStatusRow` + `SoonStatusList` (51) | `ListRow` + `List` from `ui/composites/ListRow` (C31), or `StatusList` (C32) from data | `name` → `title`; `detail`, `status`, `actions`, `selected` unchanged |
| `HubItemRow` (52) | `ListRow` (C31) | children → `title`; `lead`, `aside`, `actions`, `selected`, `unread`, `onSelect`, `as` unchanged |
| `BuilderSourceList` (50) | `StatusList` (C32), keeping the D12 row mapping in the page | rows → `{ id, label: name, status, solid, tone, detail }`: `solid` for active or failed rows, `tone: 'muted'` for waiting, `tone: 'failed'` with `detail: error`; `actions` unchanged |
| `hooks/useCampaignFlow.ts`, `parts/CampaignStepFrame.tsx` (52); `useCampaignFlow.ts`, `CampaignStep.tsx` (51) | `flows/campaign/`: `campaignSteps` (`steps.ts`), `useCampaignFlow(step, { stepComplete, cancelHref })`, `CampaignStepFrame`, `campaignStore` (`draft.ts`) | delete both step tables, hooks and frames. Each screen: `const flow = useCampaignFlow('audience', { stepComplete })` (its own validation), then `<CampaignStepFrame flow={flow} title=… intro=… missing={[…]}>` inside the page's shell. Read and write the draft with `flow.draft` and `flow.set('audience', ids)`. The order is the table: 1 Goal (`Campaign-v2-1-Goal`), 2 Audience (`-3-Audience`), 3 Success (`-2-Measure`), 4 Content plan, 5 People and budget, 6 Review. Next waits for this step and every earlier step, and links to the first missing one |
| `parts/StateView.tsx` (52), `StateView.tsx` (51) | `StateView` from `ui/composites/StateView` (C35) | 52: `views={…}` unchanged; 51: `loading`, `error`, `empty` copy and children unchanged. Both forms work together |
| any `length + 1` or ad hoc id for a client-side item (all pages) | `uniqueId(prefix)` from `lib/id` | `uniqueId('src')` gives `src-7`; never derive an id from a list length (Codex review on PR #79). The file is byte-identical to the `ui/51-coming-soon` one |
| any raw `/screens/<X>` string or `string` artboard (all pages) | `screenPath`, `useScreenHref`, `ScreenLink` with an `ArtboardName` from `config/artboards` | a misspelled or missing board fails typecheck; `ScreenEntry.artboard` is an `ArtboardName` too |

**In the gallery, shell actions are inert.** `GalleryScreen` provides gallery mode (`ui/hooks/galleryMode.ts`); `AppShell` reads it and Sign out calls nothing. A page frame that adds its own auth or network action reads `useGalleryMode()` and does nothing (or calls a fixture) when it is true.

**Links between screens are typed and checked.** `config/artboards.ts` lists every non-archived canvas board (generated from the canvas's `canvas.json`) as the `ArtboardName` union. `src/gallery/links.test.tsx` fails on any raw `/screens/` string in `src/screens` or `src/ui`, on any rendered link to an unregistered artboard (so a page merges after the pages it links to), and on any registered artboard that is not a canvas board. Boards not registered yet show as `todo` entries, a list that shrinks to zero.

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
