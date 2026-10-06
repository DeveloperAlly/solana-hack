---
type: spec
status: proposed
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [ui, components, design-tokens, inventory, dry]
---
> **Status: proposed.** Full inventory of reusable UI components for Waterlily, with every screen mapped to its components and its build slice. Components are built in the slice where a screen first needs them ([UI build mission](../../how/missions/mission_ui_build.md)); progress is in [STATE.md](../../../STATE.md).

# Component inventory

**Sources:** the wireframe canvas as reworked on 2026-10-06 (Brand Builder page, landing, hub pages; [links](./links.md)), the [Brand Builder architecture](./brand_builder_architecture.md), the [backlog](../../how/backlog/backlog.md), [research 06](./research/06_voice_templates.md) (voice model) and [research 07](./research/07_gamerslab_leadfinder.md) (lead-finder UI reuse). Approach: [ADR-005](../decisions/adr_005_ui_component_system.md).

## Contents
1. [How to read this](#1-how-to-read-this)
2. [Layer 0: design tokens and themes](#2-layer-0-design-tokens-and-themes)
3. [Layer 1: primitives](#3-layer-1-primitives)
4. [Layer 2: composites](#4-layer-2-composites)
5. [Layer 3: shells and layouts](#5-layer-3-shells-and-layouts)
6. [Layer 4: domain patterns](#6-layer-4-domain-patterns)
7. [Shared config and data modules](#7-shared-config-and-data-modules)
8. [Screen-to-component map](#8-screen-to-component-map)
9. [Gaps and decisions needed](#9-gaps-and-decisions-needed)
10. [DRY rules](#10-dry-rules)

## 1. How to read this
- **Layers depend downwards only.** A primitive never imports a composite; a domain pattern may use anything below it; screens use anything but add no styles.
- **ID** is the stable reference used in the build plan (T, P, C, L, D, M).
- **States** lists what the workbench must show for the component. Every interactive component also has focus-visible and disabled states unless noted.
- **Used by** lists screens (by wireframe artboard name) or other components. A component used by one screen only is allowed only if it is domain-specific and listed here.
- **Tag** follows the [backlog](../../how/backlog/backlog.md): H = hackathon, E = experimental, CS = coming soon, R = roadmap, with priority H > E > CS > R. A component's tag is the highest tag of any screen that uses it (screen tags: §8). **Every component is H except those listed here**, so these are the only ones the cut order can drop. D40 NeedsReplyItem and D47 BreakdownCard (with C22 BarList) are H because the hackathon Hub-Home uses them:

| Tag | Components |
|---|---|
| E | D44 LeadRow / ScoreBadge / ConfidenceChip, D45 PersonaSetup, D46 WatermarkOverlay |
| CS | L7 SplitPane, D38 MessageRow, D39 ThreadView, D41 SourceConnectionRow, D53 QuestCard (becomes H, with the Quests screen, if mission Q2 includes the paid quest) |
| R | D43 RuleRow |
| Removed | C21 SplitBreakdown: licensing fee splits are dropped ([ADR-003](../decisions/adr_003_superhub_business_model.md)). Not built; budget allocation uses D25 BudgetBar |

## 1b. First slice per component
Components are built in the slice where a screen first needs them ([UI build mission](../../how/missions/mission_ui_build.md) §4), not as a library up front. A later slice that needs a new variant adds a prop to the existing component. Rule: a component's slice is no later than the first screen (§8) or component that requires it. Optional slots (for example D10's overlay, filled by D46) and the controls P17 Field wraps are not ordering dependencies. If the owner includes a paid quest in the demo (mission Q2), D53 and the Quests screen move from S8 to S7 and are tagged H.

| Slice | Built first in this slice |
|---|---|
| S0 Preflight | T1–T12 tokens and the `wireframe` theme; M1 routes; L10 PublicShell; workbench and theme editor at `/system` |
| S1 Land and sign in | P1–P8, P11, P17, P18; C1, C2, C8, C13; L5, L6; D36, D37; M6, M7 |
| S2 Basics and ingest | P12–P15, P21, P22, P24; C7, C14; D11, D12 |
| S3 Interview, gates, coverage | C6, C10; D13, D14, D15, D16, D17, D20, D51; M3, M4 |
| S4 Kit v1 | C3, C11, C16, C25, C29; D18, D32, D49, D50; L1, L2, L3, L4, L8, D48; M8 |
| S5 Create | P25, P27; C4, C5, C23; L9; D1–D10, D21–D23; M2, M5 |
| S6 Prove | C12, C19, C20; D19, D30, D33, D34, D35, D52 |
| S7 Grow | P19, P20, P26; C9, C15, C17, C18, C22, C24, C26, C27, C28; D24–D29, D31, D40, D42, D47 |
| S8 Everything else | P9, P10, P16, P23, P28; L7; D38, D39, D41, D43–D46, D53, D54, D55 |

## 2. Layer 0: design tokens and themes
Components read only **semantic** tokens. Themes remap semantic tokens to primitive values.

| ID | Token group | Contents |
|---|---|---|
| T1 | Colour primitives | Neutral scale 0–1000; accent scale; status hues (success, warning, danger, info); data series 1–6 |
| T2 | Colour semantic | `bg.canvas`, `bg.surface`, `bg.subtle`, `bg.inverse`; `text.primary`, `text.secondary`, `text.inverse`, `text.link`; `border.default`, `border.strong`, `border.focus`; `action.primary.{bg,fg,hover}`, `action.secondary.{bg,fg,border}`, `action.danger.{bg,fg}`; `status.{success,warning,danger,info}.{bg,fg,border}`; `flag.highlight` (drift and slop marks); `overlay.scrim`; `data.series.1–6` |
| T3 | Typography | `font.display`, `font.body`, `font.mono`; size scale xs–4xl; weights; line heights; letter spacing |
| T4 | Space | 4 px base scale, 0–12 |
| T5 | Radius | none, sm, md, lg, pill |
| T6 | Border width | hairline, default, strong |
| T7 | Elevation | 0–3 (shadows) |
| T8 | Motion | durations and easings; zeroed under reduced motion |
| T9 | Z-index | base, sticky, dropdown, sheet, modal, toast |
| T10 | Breakpoints | sm 480, md 768, lg 1024, xl 1280 |
| T11 | Layout | content max widths (720 reading, 1180 app), nav heights, rail widths |
| T12 | Control sizes | control heights 36 / 44; minimum touch target 44 |

**Themes**
| Theme | Purpose | When |
|---|---|---|
| `wireframe` | Grayscale, matches the canvas; lets the build start now | S0 |
| `waterlily` | The brand identity, once ratified | S8 |
| `dark` | Optional | After the hackathon |

Creating a theme = one JSON file in `tokens/themes/`. Every theme must pass the automatic contrast check: text 4.5:1 and large text 3:1 ([WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)); UI components and graphical objects 3:1 ([SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast)).

## 3. Layer 1: primitives
No domain knowledge. Each is a thin, accessible wrapper over HTML.

| ID | Component | Variants and props | States | Used by |
|---|---|---|---|---|
| P1 | Box | polymorphic `as`, padding, background, border from tokens | n/a | everything |
| P2 | Stack | direction, gap, align, justify, wrap | n/a | everything |
| P3 | Grid | columns (responsive), gap | n/a | KPI rows, card grids |
| P4 | Container | width: reading / app / full | n/a | all screens |
| P5 | Text | variant body / small / caption / label / mono; tone primary / secondary / inverse / status | truncated | everything |
| P6 | Heading | level 1–4, size independent of level | n/a | everything |
| P7 | Link | internal / external (adds "opens in new tab" label and ↗) | visited | everything |
| P8 | Button | primary / secondary / ghost / danger; size sm / md; full width; icon slot; renders as link | hover, loading, disabled | everything |
| P9 | IconButton | as Button; `aria-label` required | as Button | toolbars, rows |
| P10 | Icon | named stroke icon set; size; decorative or labelled | n/a | everything |
| P11 | Input | text / email / url / number; prefix / suffix; mono | error, read-only | forms |
| P12 | Textarea | autosize; optional character count and limit | error, over limit | briefs, editors |
| P13 | Select | native first | error | forms |
| P14 | Checkbox | with label and description | checked, indeterminate | tables, settings |
| P15 | Radio | with label and description | checked | groups |
| P16 | Switch | with label | on, off | rules, settings |
| P17 | Field | wraps P11–P16 with label, hint, error, required; wires `aria-describedby` | error | every form |
| P18 | Badge | tone neutral / solid / success / warning / danger / info / dashed; size | n/a | everywhere (status chips) |
| P19 | Avatar | image / initials; size | missing image | inbox, persona, rows |
| P20 | Divider | horizontal / vertical | n/a | lists |
| P21 | Spinner | size; labelled | n/a | loading states |
| P22 | Skeleton | text / rect / circle | n/a | loading states |
| P23 | VisuallyHidden | n/a | n/a | icon-only controls |
| P24 | ProgressBar | segments `[{value, tone, label}]` (spent / committed / remaining) | empty, full | budgets, kit completeness |
| P25 | Meter | value, min, max, threshold marker | below / above threshold | voice fit, scores |
| P26 | Tooltip | text; delay | open | receipts, icons |
| P27 | Highlight | flag / added / removed | n/a | editors, diffs |
| P28 | MediaFrame | aspect ratio; placeholder; overlay slot | loading, missing | influencer, post previews |

## 4. Layer 2: composites
Generic combinations; still no Waterlily data types.

| ID | Component | Variants and props | States | Used by |
|---|---|---|---|---|
| C1 | Card | default / subtle / selected / dashed (empty) / emphasis (error); header, footer, as link | hover (when link) | everywhere |
| C2 | Alert | tone; title, body, actions; inline or page-level | dismissible | errors, PoC unverified flag, blocks |
| C3 | EmptyState | title, body, up to 3 actions, optional icon | n/a | all empty states |
| C4 | Tabs | items with counts; link or state driven | active | content dashboard, engagement |
| C5 | ToggleGroup | single / multi; chip style | selected | channel filters |
| C6 | Scale | n steps, end labels, legend, value; keyboard arrows | selected, locked | voice dials, ratings |
| C7 | ChoiceCards | radio / checkbox mode; title, description, meta | selected | purposes, platforms, formats, templates, modes, pick-by-example |
| C8 | Stepper | steps done / current / todo; horizontal / vertical; completed steps clickable | n/a | wizards (onboarding, builder, campaign, studio) |
| C9 | StatusTimeline | steps done / current / failed / blocked / pending with timestamps; horizontal / vertical | per step | payout status, verification |
| C10 | DataTable | column config, responsive overflow box, row actions, optional editable cells, sticky header | empty, loading, error | ledger, payouts, metrics, leads, glossary, claims |
| C11 | KeyValueList | label / value rows | n/a | receipts, verify result, success screens |
| C12 | StatTile | label, value, sub, link, `sample` flag | loading | KPI rows (home, analytics, ledger, ambassadors) |
| C13 | CopyField | mono value + copy | copied | DNS record, public page URL |
| C14 | FileDropzone + FileList | accept list, per-file progress, remove | dragging, uploading, error | sources, avatar set |
| C15 | SearchInput | clear button | n/a | inbox, studio, leads |
| C16 | Menu | trigger + items; checkable | open | brand switcher, row overflow |
| C17 | Dialog | title, body, actions | open | confirmations (sign consent, approve cap) |
| C18 | Sheet | bottom sheet on mobile, side panel on desktop | open | mobile flags, receipt details |
| C19 | Toast | success / error; undo action | n/a | approve, send, copy |
| C20 | LoadMore | count shown / total | loading | ledger, inbox |
| C21 | SplitBreakdown | removed: licensing fee splits are dropped; not built | n/a | none |
| C22 | BarList | label, bar, value rows | loading | analytics breakdowns |
| C23 | DiffView | inline (del / ins) and side by side | n/a | slop fixes, polish actions, verify "edited" |
| C24 | TimeChip | relative time, countdown, overdue | overdue | campaigns, needs reply |
| C25 | EditableSection | title, state badge, Edit / Regenerate actions, citations slot | view, editing, regenerating | brand pack sections, kit sections |
| C26 | LockedSetting | disabled control + reason | n/a | influencer disclosure, policy gates |
| C27 | ListEditor | add, remove, reorder items | n/a | pillars, vocabulary, facts to include |
| C29 | StatePanel | loading / error / success panel for a whole screen or section; title, body, retry or next action; pairs with C3 EmptyState so every hub screen has four states | n/a | every hub screen (R15 in the mission) |
| C28 | DemoStateSwitcher | jump between screen states; hidden outside demo mode | n/a | demo and video recording (replaces the wireframe "Prototype" notes) |

## 5. Layer 3: shells and layouts
| ID | Component | Variants and props | States | Used by |
|---|---|---|---|---|
| L1 | AppShell | TopNav + optional SubNav + main + MobileTabBar; skip link; brand switcher slot | desktop, mobile (tab bar), loading (skeleton body) | all hub screens |
| L2 | TopNav | items from route config (M1); tag badges | active item, collapsed (menu button on narrow screens) | AppShell |
| L3 | SubNav | children of the active section | active item, hidden (section has no children) | AppShell |
| L4 | MobileTabBar | items from route config | active item | AppShell on mobile, ambassador mobile |
| L5 | PageHeader | back link, title, meta line, status badges, actions | actions wrap on narrow screens | all screens |
| L6 | WizardLayout | Stepper (C8) with time estimate ("about 15 minutes in all"), body, footer (Back / Skip for now / Continue), "Save and finish later" in the header, Unverified flag slot (D36) | first step, middle, last step, resumed (opens at last saved step), saving, step error | sign in and domain, Brand Builder intake and gates, campaign v2 |
| L7 | SplitPane | rail + list + reader | three panes (desktop), list only and reader only (mobile), empty reader | inbox |
| L8 | SideRail | section list with state markers; also used as TOC | active item, collapsed into a select on mobile | Build your brand, inbox rail |
| L9 | TwoColumn | main + aside | side by side, stacked (aside under main) | most hub screens |
| L10 | PublicShell | public nav (Verify, Ledger, For brands, Sign in) | signed out, signed in | landing, verify, ledger, ambassador browse |

## 6. Layer 4: domain patterns
Know Waterlily data types (M6). Grouped by area.

### 6.1 Approval family (the biggest reuse)
| ID | Component | Variants and props | States | Used by |
|---|---|---|---|---|
| D1 | ApprovalItem | kind: post / reply / ambassador post / outreach / influencer post / inbox reply; compact or expanded; header (D9 channel, author, time, tags), optional incoming message, draft body, D3 checks summary, D2 actions | default, editing, sending, sent, failed, held (low confidence), blocked (failed check) | Content-Dashboard, Draft-Review, Engage-Queue, Inbox-All, Inbox-NeedsReply, Dashboard (ambassador approvals), Leads, Influencer-Queue, Hub-Home |
| D2 | ApprovalActions | config per kind: Approve (+ schedule or send), Edit, Ask for rewrite, Reject, Skip, Snooze, No reply needed | busy | D1 |
| D3 | ChecksPanel | results `[{kind, status, detail, fix}]`; kinds: voice fit, claims, vocabulary, slop, platform, AI label, disclosure, content policy; compact chips or full list with Fix buttons | pass / warn / fail per check | D1, D6, Amb-3-Generate, Draft-Review |
| D4 | VoiceFitMeter | P25 preset with label and publish threshold | below / above | D3, D6 |
| D5 | DraftEditor | text with P27 highlights from checks, per-channel character limit (from M2), D6 polish bar | editing, generating (skeleton), over limit | Amb-3-Generate, Draft-Review, reply composer, M-3-Generate |
| D6 | PolishBar | Review, Shorten, Clarify, Beautify (accessible mode toggle); each reversible; shows C23 diff | working, applied, undone | D5 |
| D7 | SlopFixList | fixes applied with "Show original" (C23) | n/a | Draft-Review, D1 expanded |
| D8 | SchedulePicker | suggested best slot, now, custom | n/a | Draft-Review, campaign plan |
| D9 | ChannelBadge + ChannelPicker | from channel registry (M2) | n/a | everywhere a platform appears |
| D10 | PostPreview | renders a draft as the platform shows it (M2 formatting rules); optional `overlay` slot (D46 plugs in; not a build dependency) | n/a | publish, influencer, Beautify preview |

### 6.2 Brand Builder and voices
| ID | Component | Variants and props | States | Used by |
|---|---|---|---|---|
| D11 | IntakeForm | minimum viable intake form (architecture §5 step 1) | n/a | Brand Builder (no wireframe yet) |
| D12 | SourceList | rows: source, kind (link / upload / connected account), origin ("from step 1"), status done (facts found) / reading / waiting / failed (Retry, Skip, upload instead); connected accounts show "reading history: coming soon" | per row | Onboard-3-Sources, Onboard-3b-Profiling, Ingest-Error |
| D13 | CoverageMap | 17 sections with state (D51), gate marker and what the builder will do (confirm / confirm draft / ask in step n / drafted from answers / not asked); `compare` variant shows two brands side by side with totals | per section | Coverage-Map, Brand-Build TOC (L8) |
| D14 | EvidenceList + Citation | fact, short quote, source link, confidence badge, status (evidenced / inferred / answered / rejected) | rejected | kit sections, claims (no wireframe yet) |
| D15 | InterviewCard | question, why we ask, answer by text (voice later), skip | answered, skipped | Brand Builder (no wireframe yet) |
| D16 | Exercises | GoldenCircle (what / how / why), PositioningOptions (3 AI options with sources, uses C7), PickByExample (2 rounds of 3, uses C7), PersonaCard (dashed, "Assumption" until validated), CardSort (values), ValuePropCanvas | n/a | BB-3-GoldenCircle, BB-4-Alternatives, BB-5-Audience, BB-6-Voice, Brand-Build |
| D17 | DecisionGate | gate (purpose / positioning / voice), "Gate n of 3", AI draft with "based on" sources, Try another draft, optional "why" field; Approve / Save, decide later; records a Decision (who, when, why) | pending, deferred, approved, stale (an upstream gate changed) | BB-Gate1-Purpose, BB-Gate2-Positioning, BB-Gate3-Voice |
| D18 | KitVersionBadge | version, approved date and approver, hash, registered receipt (D32), download link (D49) | draft, approved, registered, registration failed | Brand-Build, Hub-Home, Onboard-6-Published, Kit-Export |
| D19 | ClaimTable | claim, evidence links, owner, expiry, status (approved / pending / expired), registered tx (D32), Register | empty, pending, approved, expired | Claims, Claims-Empty (canvas batch 4) |
| D20 | VoiceDials | all 9 dimensions from config (M3, [research 06](./research/06_voice_templates.md)): the 8 scaled ones rendered as C6 dials, and the ninth, claims strictness, rendered as a gate of rule checkboxes, not a slider; a subset (e.g. 3 dials) for intake step 6 | locked by channel cap | Voice-Editor, BB-6-Voice, BB-Gate3-Voice |
| D21 | TemplateGallery | template cards from M3 | selected | Voice-Templates |
| D22 | PresetMatrix | templates × dimensions table from M3 | n/a | Voice-Templates |
| D23 | VoiceRulesPreview | sample output + plain-language rules derived from dials | regenerating | Voice-Editor |
| D49 | KitExport | export an approved kit version as an aDNA-structured folder ([architecture §8](./brand_builder_architecture.md#8-adna-export)): folder tree preview (what/brand, what/decisions, what/context/sources, how/templates), version picker, include options, hash; thin for the hackathon: zip download only | preparing, ready, failed | Kit-Export, Brand-Build (Download action) |
| D50 | RegistrationResult | what was registered (kit, claim, account, content), version, hash, approver, tx (D32) with explorer link; failure shows plain reason, Retry, Copy error details, continue unregistered | registering, registered, failed | Onboard-6-Published, Kit-RegisterFailed, claim and post registration |
| D51 | CoverageBadge | E / I / M (Evidenced, Inferred, Missing) with an accessible label; solid, grey and dashed styles from tokens; legend variant | n/a | D13, Brand-Build sections, Coverage-Map |

### 6.3 Campaigns, ambassadors and payments
| ID | Component | Variants and props | States | Used by |
|---|---|---|---|---|
| D24 | CampaignCard | brand, title, payout range, time left (C24), slots, budget (D25) | open, closing soon, budget reached | Amb-1-Campaigns, M-1-Campaigns, Hub-Home, Campaign-Builder preview |
| D25 | BudgetBar | P24 preset: spent / committed / remaining + caption | empty, near cap, full | Dashboard, Amb-2-Detail, Amb-5d, Hub-Home |
| D26 | PayoutTable | format, channel, payout (editable) | n/a | Campaign v2 step 5, Amb-2-Detail |
| D27 | MetricPicker | main + supporting metrics, target, data source; "not available" for unshared numbers | n/a | Campaign-v2-2-Measure |
| D28 | ContentPlanTable | day × brand / ambassador rows | generating | Campaign-v2-2-Measure |
| D29 | PayoutStatus | C9 preset: Published, Verified, Approved, Paid | loading, failed, budget reached | Amb-5a/b/c/d, M-5-Status |
| D30 | PublishRouteCard | route: post on behalf / post or paste URL / submit page URL | connected, not connected | Amb-4-Publish, M-4-Publish |
| D31 | SpendingCapField | amount, balance, explanation | over balance (error) | Campaign v2, Campaign-Builder |

### 6.4 Proof: registry, verify, ledger
| ID | Component | Variants and props | States | Used by |
|---|---|---|---|---|
| D32 | ReceiptLink | opens the public record; never shows raw hashes by default | pending, confirmed | everywhere money or registration appears |
| D33 | VerifyInput | text or URL | checking | Main (landing), Verify-1/2/3 |
| D34 | VerifyResult | match / not found / edited (uses C11, C23); match shows brand, kit version, approver, where it was published and an explorer link (D32) | loading | Verify-1-Match, Verify-2-NoMatch, Verify-3-Edited |
| D35 | LedgerTable | C10 preset; registrations grouped by type (identity, account, kit, claim, content, persona) plus ambassador payouts; totals equal the sum of rows; no fees or splits | empty, loading, error | Ledger |
| D36 | OfficialStatus | verified / unverified (PoC skip) / pending; badge + explanation | n/a | brand switcher, Hub-Home, Onboard-2, registry |
| D37 | DnsRecordCard | C13 value + Check now + status | waiting, checking, verified, not found | Onboard-2-Domain, Onboard-2b-DomainFailed |

### 6.5 Inbox and engagement
| ID | Component | Variants and props | States | Used by |
|---|---|---|---|---|
| D38 | MessageRow | source, sender, preview, time, unread, selected | unread, selected | Inbox-All |
| D39 | ThreadView | message bubbles in / out; reply composer = D5 compact + send to channel | sending, failed | Inbox-All |
| D40 | NeedsReplyItem | D1 variant + reason + due (C24) | overdue, due today, later | Inbox-NeedsReply, Hub-Home |
| D41 | SourceConnectionRow | capability text from adapter (M2), status, action | connected, not connected, collecting, sync error | Inbox-Connect, Analytics-Empty |
| D42 | SuggestionCard | who to engage / suggested list / analytics suggestion; Apply or Draft | applied, dismissed | Engage-Queue, Engage-Rules, Analytics |
| D43 | RuleRow | when / where / then / on | on, off | Engage-Rules |

### 6.6 Experimental and analytics
| ID | Component | Variants and props | States | Used by |
|---|---|---|---|---|
| D44 | LeadRow, ScoreBadge, ConfidenceChip | lifted from the lead finder ([research 07](./research/07_gamerslab_leadfinder.md)) and re-themed onto tokens | new, draft in queue | Leads |
| D45 | PersonaSetup | persona fields + disclosure (C26 locked items) | draft, created | Influencer-Setup |
| D46 | WatermarkOverlay | P28 overlay "AI-generated"; blocks approval when missing | present, missing | Influencer-Setup, Influencer-Queue, D10 |
| D47 | BreakdownCard | C22 with title and sample-data flag | loading, empty | Analytics, Hub-Home (snapshot) |
| D48 | BrandSwitcher | C16 with D36 status per brand; brands come from the account (demo fixtures: Waterlily, aDNA, film.fun, GamersLab) | n/a | L1 |

### 6.7 Quests and settings
| ID | Component | Variants and props | States | Used by |
|---|---|---|---|---|
| D52 | PublishingConnection | per channel (X, LinkedIn from M2): connect for publishing, status; fallback row: copy to clipboard plus "paste the post URL" so verify still works | connected, not connected, expired, error | Settings: publishing, Amb-4-Publish, Draft-Review publish step |
| D53 | QuestCard | paid task (for example "write a tutorial about the brand"), USDC reward, slots, deadline; variants: coming soon (tagged) and paid (submit, approve, payout receipt D32) | coming soon, open, submitted, paid | Quests |
| D54 | ModelSettings | default free model; bring-your-own Claude or OpenAI key (storage per mission Q4); test key | default, key added, key invalid | Settings: AI model |
| D55 | PlanSeats | plan, seats (partners, agencies, ambassadors), billing summary | n/a | Settings: plan and seats |

## 7. Shared config and data modules
Not visual, but they are what keeps the UI DRY.

| ID | Module | Drives |
|---|---|---|
| M1 | Route and nav config: path, label, section, tag (H / E / CS / R), screen | L2, L3, L4, page tag badges, "coming soon" pages |
| M2 | Channel registry: id, name, icon, character limits, formatting rules (Beautify), capabilities (read, post, DM, post on behalf), verification method | D5, D6, D9, D10, D30, D41 |
| M3 | Voice model: dimensions (with end labels), templates and preset values, channel caps, claims strictness levels ([research 06](./research/06_voice_templates.md)) | D20, D21, D22, D23 |
| M4 | Brand Kit sections: 17 sections, required flag, gate, exercise, inference sources ([architecture §4](./brand_builder_architecture.md)) | D13, D15, D16, D17, L8 |
| M5 | Check registry: kinds, thresholds, fix actions | D3, D4, D46 |
| M6 | Domain types: Brand, Person, Source, Evidence, KitVersion, KitSection, Claim, Voice, Audience, Decision, Registration ([architecture §3](./brand_builder_architecture.md)), plus Draft, Campaign, Payout, Thread, Message, Lead, Persona | all D components |
| M7 | Data adapters: one interface, `mock` (fixtures for Waterlily, aDNA, film.fun, GamersLab) and `live` | all screens |
| M8 | Formatters: USDC amounts, relative times, receipt URLs, percentages | everywhere |

## 8. Screen-to-component map
Every screen below is a composition of inventory items only. Tags follow the canvas: H = HACKATHON, H(thin) = HACKATHON (THIN), E = EXPERIMENTAL, CS = COMING SOON, R = ROADMAP. **Slice** is the [mission](../../how/missions/mission_ui_build.md) slice that builds the screen; "batch n" names the canvas rework batch that draws the screen; the slice waits for it.

| Screen (canvas name) | Tag | Slice | Shell | Main components |
|---|---|---|---|---|
| Main (landing: build your brand, then create) | H | S1 | L10 | P17, P8 (start field and "Build my brand"), C1 + P18 (sample kit and first-draft preview), C8 (how it works), P7 (secondary links: check a post, ambassadors) |
| Onboard-1-SignIn | H | S1 | L6 | P17, P8, C2 |
| Onboard-2-Domain / Onboard-2b-DomainFailed | H | S1 | L6 | D37, D36, C2 |
| BB-1-Basics | H | S2 | L6 | D11, C7, P17 |
| Onboard-3-Sources | H | S2 | L6 | D12, C14, P17 |
| Onboard-3b-Profiling (loading) / Ingest-Error | H | S2 | L6 | D12, P24 |
| BB-2-Origin | H | S3 | L6 | D15, D14 (found fact to confirm) |
| BB-3-GoldenCircle | H | S3 | L6 | D16 GoldenCircle |
| BB-4-Alternatives | H | S3 | L6 | D15, D16 PositioningOptions |
| BB-5-Audience | H | S3 | L6 | D15, D16 PersonaCard |
| BB-6-Voice | H | S3 | L6 | D16 PickByExample, D20 (3 dials) |
| BB-Gate1-Purpose / BB-Gate2-Positioning / BB-Gate3-Voice | H | S3 | L6 | D17, D14, D20 (gate 3) |
| Coverage-Map | H | S3 | L6 | D13 (compare), D51 |
| Onboard-6-Published (kit v1 approved) / Kit-RegisterFailed | H | S4 | L6 | D50, D18, D32 |
| Brand-Build (17-section kit) | H | S4 | L1 + L8 | C25, D51, D14, D16 PersonaCard, D18, D49 |
| Kit-Export | H(thin) | S4 | L1 | D49, D18 |
| Voice-Templates / Voice-Editor | H | S5 (batch 2) | L1 + L9 | D20, D21, D22, D23 |
| Draft-Review (polish, voice-fit and platform scores) | H | S5 (batch 2) | L1 + L9 | D5, D6, D7, D3, D4, D8, D2 |
| Content-Dashboard / Empty | H | S5 | L1 + L9 | C4, C5, D1, C3 |
| Settings: publishing | H | S6 (batch 4) | L1 | D52 |
| Verify-1/2/3 | H | S6 (batch 3) | L10 | D33, D34 |
| Ledger | H | S6 (batch 3) | L10 | C12, C5, D35 |
| Claims / Claims-Empty | H(thin) | S6 (batch 4) | L1 | D19, D14, D32, C3 |
| Official registry | H | S6 | L10 | D36, D18, D32, C10 |
| Campaign-v2-1-Goal (step 1: goal and platforms) | H | S7 | L6 | C7 (purpose), C7 (platforms), P15 |
| Campaign v2 step 2: audience (canvas batch 5) | H | S7 | L6 | C7 (segments from the kit's audiences), D16 PersonaCard |
| Campaign-v2-2-Measure (step 3: success metrics; the "2" is the canvas artboard number) | H | S7 | L6 | D27 |
| Campaign v2 step 4: content plan (canvas batch 5) | H | S7 | L6 | D28, D8 |
| Campaign v2 step 5: people and budget (canvas batch 5) | H | S7 | L6 | D26, D31, D25, P17 |
| Campaign v2 step 6: review and launch (canvas batch 5) | H | S7 | L6 | C11, D25, C17 (approve the spending cap) |
| Engage-Queue | H | S7 | L1 + L9 | C4, D1 (reply), D42 |
| Dashboard (Grow > Ambassadors) / Empty | H | S7 | L1 | C12, D1 (ambassador post), C10, D25, C3 |
| Amb-1-Campaigns / 1b, M-1 | H | S7 | L10 / L4 | D24, C5, C3 |
| Amb-2-Detail, M-2 | H | S7 | L10 | D26, D25, P17 |
| Amb-3-Generate, M-3 | H | S7 | L10 | D5, D3, D4, C18 (mobile flags) |
| Amb-4-Publish, M-4 | H | S7 | L10 | D30, D52, D10 |
| Amb-5a/b/c/d, M-5 | H | S7 | L10 | D29, C2, C11, D32 |
| Hub-Home | H | S7 | L1 | L5, C12 ×4, D1 (compact) / D40, D24, D25, D18, D47 |
| Quests | CS | S8 (batch 4) | L1 | D53, C3 |
| Settings: AI model; plan and seats | H(thin) | S8 (batch 4) | L1 | D54, D55 |
| Leads | E | S8 | L1 | D44, C10, D1 (outreach) |
| Influencer-Setup / Queue | E | S8 | L1 | D45, D46, D1 (influencer post), D10 |
| Inbox-All | CS | S8 | L1 + L7 | L8, D38, D39, D1 |
| Inbox-NeedsReply | CS | S8 | L1 + L7 | D40 |
| Inbox-Connect | CS | S8 | L1 | D41, C2 |
| Engage-Rules | R | S8 | L1 | D43, D42, C10 |
| Partners | R | S8 | L1 | P17, C10 |
| Analytics / Empty | R | S8 | L1 | C12, D47, C10, D42, D41 |
| Every hub screen: empty, loading, success, error | per screen | with its screen | n/a | C3, C29 |
| Onboard-4-VoicePack | superseded | not built | n/a | replaced by the intake, gates and Brand-Build |
| Lic-1 … Lic-6, Onboard-5-License, Campaign-Builder (v1) | parked | not built | n/a | on the canvas "Licensee (parked)" page; licensing is dropped ([ADR-003](../decisions/adr_003_superhub_business_model.md)) |

**Reuse check:** D1 ApprovalItem appears on 9 screens; D16 Exercises on 6; C7 ChoiceCards on 6; D17 DecisionGate on 3; C10 DataTable on 10.

## 9. Gaps and decisions needed
Decided: the voice model is research 06, 9 dimensions with claims strictness as a gate; components are built slice by slice, not as an up-front library (owner, 2026-10-06). Which canvas screens are drawn is tracked in [STATE.md](../../../STATE.md), not here.

| # | Gap | Proposal |
|---|---|---|
| 1 | A slice can need screens that come from a later canvas rework batch (§8 names the batch per screen) | Each batch is drawn and signed off before the slice that needs it ([mission](../../how/missions/mission_ui_build.md) §3) |
| 2 | Campaign v2 steps 2, 4, 5 and 6 have no artboards of their own | Draw them in canvas batch 5; S7 starts only once they are signed off, per the mission's entry rule. Building them from this inventory alone would need an owner-approved exception |
| 3 | App framework: vinext is experimental ([InfoQ](https://infoq.com/news/2026/03/cloudflare-vinext-experimental)) | Library is framework-independent ([ADR-005](../decisions/adr_005_ui_component_system.md)); S0 runs a timed spike and records the choice (mission Q3) |
| 4 | Bring-your-own key storage is undecided (issue #4 P4) | D54 waits for the decision (mission Q4) |

## 10. DRY rules
1. **One concept, one component.** Variants are props, never copies. If two screens need "the same thing but slightly different", add a variant.
2. **No style values outside tokens.** No hex, rgb, px font sizes or ad hoc spacing in components or screens. CI fails on them.
3. **Screens have no stylesheets.** A screen file only composes components and passes data and copy.
4. **Repeated structure comes from config** (M1–M5), not repeated JSX.
5. **Domain components take typed data (M6), not markup.**
6. **Every component gets its workbench entry in the same change that builds it**, with every variant and state it supports so far.
7. **Lifted code is re-themed first.** Lead-finder components enter the library only after moving onto tokens.
