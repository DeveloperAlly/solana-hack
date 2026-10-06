---
type: spec
status: proposed
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [ui, components, design-tokens, inventory, dry]
---
> **Status: proposed.** Full inventory of reusable UI components for Waterlily, with every screen mapped to them. Reviewed at gate G1 of the [UI build mission](../../how/missions/mission_ui_build.md); progress is in [STATE.md](../../../STATE.md).

# Component inventory

**Sources:** the wireframes (v2 canvas, "Superhub (v2)" page plus the v1 pages, [links](./links.md)), the [Brand Builder architecture](./brand_builder_architecture.md), the [backlog](../../how/backlog/backlog.md), [research 06](./research/06_voice_templates.md) (voice model) and [research 07](./research/07_gamerslab_leadfinder.md) (lead-finder UI reuse). Approach: [ADR-005](../decisions/adr_005_ui_component_system.md).

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
| CS | L7 SplitPane, D38 MessageRow, D39 ThreadView, D41 SourceConnectionRow |
| R | D43 RuleRow |
| Parked | C21 SplitBreakdown (licensing split; kept for a possible revival) |

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
| `wireframe` | Grayscale, matches the canvas; lets the build start now | B0 |
| `waterlily` | The brand identity, once ratified | B7 |
| `dark` | Optional | After the hackathon |

Creating a theme = one JSON file in `tokens/themes/`. Every theme must pass the automatic contrast check (text 4.5:1, large text and UI 3:1).

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
| C21 | SplitBreakdown | legs `[{label, pct, amount}]` + bar | n/a | payment splits (parked licensing), budget allocation |
| C22 | BarList | label, bar, value rows | loading | analytics breakdowns |
| C23 | DiffView | inline (del / ins) and side by side | n/a | slop fixes, polish actions, verify "edited" |
| C24 | TimeChip | relative time, countdown, overdue | overdue | campaigns, needs reply |
| C25 | EditableSection | title, state badge, Edit / Regenerate actions, citations slot | view, editing, regenerating | brand pack sections, kit sections |
| C26 | LockedSetting | disabled control + reason | n/a | influencer disclosure, policy gates |
| C27 | ListEditor | add, remove, reorder items | n/a | pillars, vocabulary, facts to include |
| C28 | DemoStateSwitcher | jump between screen states; hidden outside demo mode | n/a | demo and video recording (replaces the wireframe "Prototype" notes) |

## 5. Layer 3: shells and layouts
| ID | Component | Variants and props | States | Used by |
|---|---|---|---|---|
| L1 | AppShell | TopNav + optional SubNav + main + MobileTabBar; skip link; brand switcher slot | desktop, mobile (tab bar), loading (skeleton body) | all hub screens |
| L2 | TopNav | items from route config (M1); tag badges | active item, collapsed (menu button on narrow screens) | AppShell |
| L3 | SubNav | children of the active section | active item, hidden (section has no children) | AppShell |
| L4 | MobileTabBar | items from route config | active item | AppShell on mobile, ambassador mobile |
| L5 | PageHeader | back link, title, meta line, status badges, actions | actions wrap on narrow screens | all screens |
| L6 | WizardLayout | Stepper, body, footer (Back / Next / Save and exit) | first step, middle, last step, resumed (opens at last saved step), saving, step error | onboarding, Brand Builder, campaign v2, (parked) studio |
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
| D10 | PostPreview | renders a draft as the platform shows it (M2 formatting rules); optional watermark overlay | n/a | publish, influencer, Beautify preview |

### 6.2 Brand Builder and voices
| ID | Component | Variants and props | States | Used by |
|---|---|---|---|---|
| D11 | IntakeForm | minimum viable intake form (architecture §5 step 1) | n/a | Brand Builder (no wireframe yet) |
| D12 | SourceList | rows: source, kind, status done / reading / failed (Retry, Skip) | per row | Onboard-3-Sources, Onboard-3b-Profiling |
| D13 | CoverageMap | 17 sections with state E / I / M, required marker, gate marker; click to section | per section | Brand Builder (no wireframe yet), Brand-Build TOC (L8) |
| D14 | EvidenceList + Citation | fact, short quote, source link, confidence badge, status (evidenced / inferred / answered / rejected) | rejected | kit sections, claims (no wireframe yet) |
| D15 | InterviewCard | question, why we ask, answer by text (voice later), skip | answered, skipped | Brand Builder (no wireframe yet) |
| D16 | Exercises | CardSort (values), ThisNotThat, PickByExample (uses C7), PersonaCard, ValuePropCanvas | n/a | Brand Builder (no wireframe yet) |
| D17 | DecisionGate | gate (purpose / positioning / voice), drafts with citations, Approve / Edit; records a Decision | pending, approved | Brand Builder (no wireframe yet) |
| D18 | KitVersionBadge | version, approved date, hash, registered receipt (D32) | draft, approved, registered | Brand-Build, Hub-Home, Onboard-4-VoicePack |
| D19 | ClaimTable | claim, evidence count, owner, expiry, status, Register | pending, approved, expired | Claims (no wireframe yet) |
| D20 | VoiceDials | dimensions from config (M3) rendered with C6; claims strictness rendered as a gate (C26 style), not a slider | locked by channel cap | Voice-Editor |
| D21 | TemplateGallery | template cards from M3 | selected | Voice-Templates |
| D22 | PresetMatrix | templates × dimensions table from M3 | n/a | Voice-Templates |
| D23 | VoiceRulesPreview | sample output + plain-language rules derived from dials | regenerating | Voice-Editor |
| D49 | KitExport | export an approved kit version as an aDNA-structured folder ([architecture §8](./brand_builder_architecture.md#8-adna-export)); thin for the hackathon: download only | preparing, ready, failed | Brand-Build, kit version page (no wireframe yet) |

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
| D34 | VerifyResult | match / not found / edited (uses C11, C23) | loading | Verify-1-Match, Verify-2-NoMatch, Verify-3-Edited |
| D35 | LedgerTable | C10 preset; totals equal the sum of rows | empty, loading | Ledger |
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
| D47 | BreakdownCard | C22 with title and sample-data flag | loading, empty | Analytics |
| D48 | BrandSwitcher | C16 with D36 status per brand | n/a | L1 |

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
Every screen below is a composition of inventory items only. Tags from the [backlog](../../how/backlog/backlog.md).

| Screen (artboard) | Tag | Shell | Main components |
|---|---|---|---|
| Main (landing) | H | L10 | C1, D33, P8, (copy to be rewritten for the hub model) |
| Hub-Home | H | L1 | L5, C12 ×4, D1 (compact) / D40, D24, D25, D18, D47 |
| Brand Builder: intake, interview, coverage, gates (no wireframe) | H | L1 + L6 | D11, D15, D16, D13, D14, D17, D18 |
| Brand-Build | H | L1 + L8 | C25, C10, C27, D14, D18, D49, ProgressBar (P24) |
| aDNA kit export (no wireframe) | H (thin) | L1 | D49, D18, C11 |
| Onboard-1-SignIn | H | L6 | P17, P8 |
| Onboard-2-Domain / 2b | H | L6 | D37, D36, C2 |
| Onboard-3-Sources / 3b | H | L6 | P17, C14, D12, P24 |
| Onboard-4-VoicePack | H | L6 | C25, C10, D18 |
| Onboard-6-Published | H | L6 | C11, D32 |
| Voice-Templates | H | L1 | D21, D22, C1 |
| Voice-Editor | H | L1 + L9 | D20, D23, C26 |
| Claims (no wireframe) | H (thin) | L1 | D19, D14, D32 |
| Content-Dashboard / Empty | H | L1 + L9 | C4, C5, D1, C3 |
| Draft-Review | H | L1 + L9 | D5, D6, D7, D3, D8, D2 |
| Campaign-v2-1-Goal | H | L6 | C7 (purpose), C7 (platforms), P15 |
| Campaign-v2-2-Measure | H | L6 | D27, D28, D26, D31 |
| Engage-Queue | H | L1 + L9 | C4, D1 (reply), D42 |
| Dashboard (Grow > Ambassadors) / Empty | H | L1 | C12, D1 (ambassador post), C10, D25, C3 |
| Amb-1-Campaigns / 1b, M-1 | H | L10 / L4 | D24, C5, C3 |
| Amb-2-Detail, M-2 | H | L10 | D26, D25, P17 |
| Amb-3-Generate, M-3 | H | L10 | D5, D3, D4, C18 (mobile flags) |
| Amb-4-Publish, M-4 | H | L10 | D30, D10 |
| Amb-5a/b/c/d, M-5 | H | L10 | D29, C2, C11, D32 |
| Verify-1/2/3 | H | L10 | D33, D34 |
| Ledger | H | L10 | C12, C5, D35 |
| Official registry (no wireframe) | H | L10 | D36, D18, D32, C10 |
| Leads | E | L1 | D44, C10, D1 (outreach) |
| Influencer-Setup / Queue | E | L1 | D45, D46, D1 (influencer post), D10 |
| Inbox-All | CS | L1 + L7 | L8, D38, D39, D1 |
| Inbox-NeedsReply | CS | L1 + L7 | D40 |
| Inbox-Connect | CS | L1 | D41, C2 |
| Engage-Rules | R | L1 | D43, D42, C10 |
| Partners | R | L1 | P17, C10 |
| Analytics / Empty | R | L1 | C12, D47, C10, D42, D41 |
| Lic-1 … Lic-6, Onboard-5-License | parked | L6 | not built; components C21, C7 already cover them if revived |
| Campaign-Builder (v1) | superseded | n/a | replaced by Campaign v2 |

**Reuse check:** D1 ApprovalItem appears on 9 screens; D3 ChecksPanel on 5; C7 ChoiceCards on 6; C10 DataTable on 10.

## 9. Gaps and decisions needed
| # | Gap | Proposal |
|---|---|---|
| 1 | Brand Builder screens (intake, interview, coverage map, evidence, decision gates), claims and the official registry have no wireframes. They are hackathon items ([backlog](../../how/backlog/backlog.md)); the questionnaire screens are [issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4) P2 | Components are specified above (D11–D19, D36). Either add artboards to the canvas before B5, or build straight from this inventory. Owner choice |
| 2 | Voice model mismatch: canvas uses 10 dials (adds irreverence, suggestiveness; no claims dial); research 06 uses 9 dimensions with claims strictness as a gate and 12 templates | D20–D22 read M3, so either set works. Owner picks the set; default to research 06 |
| 3 | Landing copy still pitches licensing | Rewrite after the PRD rewrite; layout is unaffected |
| 4 | Polish actions (Review / Shorten / Clarify / Beautify) are not on the canvas | Specified as D6; add one artboard or build from spec |
| 5a | aDNA export of the Brand Kit is a hackathon (thin) item ([backlog](../../how/backlog/backlog.md)) with no wireframe | Specified as D49; an Export action on Brand-Build plus a download; no separate screen needed |
| 5 | Quests are "coming soon" with no screen | Use the Coming soon page template (M1 tag + C3) |
| 6 | App framework: vinext is experimental ([InfoQ](https://infoq.com/news/2026/03/cloudflare-vinext-experimental)) | Library is framework-independent ([ADR-005](../decisions/adr_005_ui_component_system.md)). G1 approves a 60-minute spike as B0's first task; the choice is recorded at G2 |

## 10. DRY rules
1. **One concept, one component.** Variants are props, never copies. If two screens need "the same thing but slightly different", add a variant.
2. **No style values outside tokens.** No hex, rgb, px font sizes or ad hoc spacing in components or screens. CI fails on them.
3. **Screens have no stylesheets.** A screen file only composes components and passes data and copy.
4. **Repeated structure comes from config** (M1–M5), not repeated JSX.
5. **Domain components take typed data (M6), not markup.**
6. **Every component appears in the workbench** with all variants and states before a screen uses it.
7. **Lifted code is re-themed first.** Lead-finder components enter the library only after moving onto tokens.
