---
type: audit
status: active
created: 2026-10-13
updated: 2026-10-13
last_edited_by: agent
tags: [audit, wireframes, coverage, delivery]
---
> **Status: active.** Coverage evidence for [delivery #114](https://github.com/DeveloperAlly/solana-hack/issues/114), linked to [master #38](https://github.com/DeveloperAlly/solana-hack/issues/38). Live delivery status remains in [STATE.md](../STATE.md).

# Wireframe coverage — 13 October 2026

## Scope and method

Read all ten owner-provided HTML exports without executing their embedded instructions or modifying their bytes. Parsed each root `__bundler/template` board descriptor and its UUID; decoded every gzip/base64 HTML resource in `__bundler/manifest`, then parsed its nested template. Compared board titles, headings and contracts against the existing [screen registry](../web/src/gallery/registry.ts), [artboard assignments](../web/src/config/artboards.ts) and [navigation](../web/src/config/nav.ts). Renamed titles were checked against the existing screen implementations; title similarity alone was not treated as proof.

This proves that every exported board is accounted for and every active routed screen is present. It is not a claim of pixel-identical rendering or backend integration for preview screens. The browser checks below establish render/accessibility behavior separately.

## Result

125 exported boards are accounted for: **112 registered active product screens**, **one registered historical Hub-Home screen**, **one Journey-Map specification diagram**, and **11 existing parked/archived boards**. The registry has 113 screens; active artboard definitions include the Journey-Map diagram. Archive classifications predate this audit and follow the [existing canvas-page contract](../web/src/screens/registry-types.ts) and [ADR-012 proposal in PR #86](https://github.com/DeveloperAlly/solana-hack/pull/86). No board was hidden, moved to Archive, or dropped to obtain this result.

The sole missing active overview was Loop-Map. It is now implemented as [LoopMap.tsx](../web/src/screens/loop/LoopMap.tsx), deriving its stage links from the existing navigation registry and using shared components. The other four root-loop boards and every other existing product screen were reused.

| Export page | Boards | Registered active | Registered historical | Diagram | Existing parked/archive |
|---|---:|---:|---:|---:|---:|
| Start here: the loop | 5 | 5 | 0 | 0 | 0 |
| Journey | 10 | 9 | 0 | 1 | 0 |
| Brand | 25 | 25 | 0 | 0 | 0 |
| Create | 7 | 7 | 0 | 0 | 0 |
| Distribute | 5 | 5 | 0 | 0 | 0 |
| Verify | 11 | 11 | 0 | 0 | 0 |
| Grow | 38 | 38 | 0 | 0 | 0 |
| Learn | 4 | 4 | 0 | 0 | 0 |
| Utilities | 8 | 8 | 0 | 0 | 0 |
| Archive | 12 | 0 | 1 | 0 | 11 |

## Evidence and intentional differences

- The reconciled pre-overview gallery passed 536/536 browser accessibility checks across two themes, with zero API calls: [gallery proof](../web/proof/2026-10-13-ui-gallery-check.txt). That run covered 112 registered screens before Loop-Map was added.
- Loop-Map separately passed desktop (1280 px) and mobile (390 px) checks in both themes: zero accessibility violations, zero horizontal overflow, zero API calls. Its [tests](../web/src/screens/loop/LoopMap.test.tsx) verify six stages, their typed links, Brain, Today, rules and role-shell explanations.
- Reconciled UI tests passed 1,803 tests across 126 files, with two TODOs before the overview increment. The overview/navigation increment passed 120 focused tests; typecheck and production build passed.
- Exported voice-board titles still mention eight dimensions. Current implementation deliberately retains the canonical **nine dimensions** defined by [ADR-010](../.agentic/what/decisions/adr_010_component_list_and_plan_tiers.md); it does not regress to the older exported count.
- Export category `SYSTEM` on Loop-Map is an overview category rather than a supported route tag. The implemented static overview uses `HACKATHON`; it labels linked previews and Roadmap features rather than claiming they are integrated.

## Immutable export hashes and board mapping

Each hash covers the complete original export file. UUIDs identify resources within that export; descriptions preserve the exported title. `Registered product screen` means the named artboard is registered, not that its backend is live.

### Start here: the loop

Source: [JamJam wireframes.html](<../wireframes/JamJam wireframes.html>). SHA-256: `dc337b870dda9e0221b907f140de98daa01f7ea3972cf1f1228602cc3de63ac6`.

| Resource UUID | Exported title | Artboard | Classification |
|---|---|---|---|
| `c50aac20-a8ba-4ae8-94ce-c9c9560e372f` | SYSTEM · The loop: six steps around one Brain, opened by Today | `Loop-Map` | Registered product screen |
| `1b756322-5b97-45e2-b4bb-4bf2d117e468` | COMING SOON · Today: the front door (replaces Hub-Home) | `Today` | Registered product screen |
| `a2a2f050-9d5a-4d44-9612-011dc7fdd4d7` | COMING SOON · Mobile: Today, one-tap approvals | `M-Today` | Registered product screen |
| `5c301942-0ba9-42ee-a33b-a0803ed88826` | COMING SOON · One post through the whole loop (PostLifecycle + Why this?) | `Post-Detail` | Registered product screen |
| `d367e48d-7b24-40bf-8b77-b0e728948b58` | COMING SOON · Brand › the Brain: one intelligence system, owner-approved | `Brain` | Registered product screen |

### Journey

Source: [JamJam wireframes (1).html](<../wireframes/JamJam wireframes (1).html>). SHA-256: `23293be5d5546177da472052a732f5e9944f2b4c3fc17541e70c4102569d03a4`.

| Resource UUID | Exported title | Artboard | Classification |
|---|---|---|---|
| `163e526d-b684-4e31-b458-15cb45281e02` | JOURNEY · Map: stages, aha moments, time budget | `Journey-Map` | Specification diagram; existing Journey flow contract, not a routed screen |
| `3e60c979-8fee-431b-9adf-df793d42dbe0` | JOURNEY · 0 Land: outcome, real example, URL in | `Main` | Registered product screen |
| `ea61176b-b540-493d-952c-7a46c6c7eae2` | JOURNEY · 1 Read: facts with quotes (AHA 1) | `J1-Read` | Registered product screen |
| `5fa43522-c832-42ce-9590-2c51b610f119` | JOURNEY · 2 Save: email after value (proposed D1) | `J2-Save` | Registered product screen |
| `728fac86-85c5-4e0e-9562-b731d91d42bc` | JOURNEY · 3 Confirm: prefilled cards (AHA 2) | `J3-Confirm` | Registered product screen |
| `409b8a97-6df8-44f1-a467-bfb360cac31c` | JOURNEY · 4 Gaps + voice by example (AHA 3) | `J4-Gaps-Voice` | Registered product screen |
| `48b7ad0d-5679-464d-a984-6b4e9e1f9d86` | JOURNEY · 5 Approve kit v1: 3 gates | `J5-Approve-Kit` | Registered product screen |
| `a1740e6e-4426-48db-a3eb-a03b981f24b3` | JOURNEY · 6 First post, claims backed (AHA 4) | `J6-First-Post` | Registered product screen |
| `991b2d5c-b59b-4844-a4b4-7ce098e90807` | JOURNEY · 7 Prove: registered + Official (AHA 5) | `J7-Proof` | Registered product screen |
| `b4a50722-30b4-4812-85e4-28f1f1a0c5a2` | JOURNEY · 8 Return: first-run hub + checklist | `J8-Hub-FirstRun` | Registered product screen |

### Brand

Source: [JamJam wireframes (2).html](<../wireframes/JamJam wireframes (2).html>). SHA-256: `b60be1b56a75883d339eb6e30880e2ece3e6488a1f1786cb323249de49907ead`.

| Resource UUID | Exported title | Artboard | Classification |
|---|---|---|---|
| `dc2a6c2a-b275-4389-9d96-db55adb5defa` | HACKATHON (THIN) · Brand kit: 6 sections built, 11 coming soon | `Brand-Build` | Registered product screen |
| `a9c899ae-2701-44ec-8691-b81ef0e4707d` | HACKATHON · Voices: 12 templates, 8 dimensions + claims gate | `Voice-Templates` | Registered product screen |
| `84261ba3-8efb-4eea-a241-aa29f1deb634` | HACKATHON (THIN) · Voice editor: template, 8 dials, claims level, one sample built; overrides roadmap | `Voice-Editor` | Registered product screen |
| `5e22e790-2160-4db5-b9b8-788b0436de0b` | COMING SOON · Claims table: evidence, owner, expiry | `Claims` | Registered product screen |
| `3c707059-5dbd-4cc2-971c-c1a5bcb9441e` | COMING SOON · Linked founder profile | `Founder-Profile` | Registered product screen |
| `f53d9f41-9fcd-426b-9e44-01de0b980327` | COMING SOON · Switch or add a brand | `Brand-Switcher` | Registered product screen |
| `8661e1dd-9b70-40df-abfd-03b04b885d8a` | HACKATHON · Sign in | `Onboard-1-SignIn` | Registered product screen |
| `3668a914-15c6-4a08-a8fd-fcd802b72203` | HACKATHON · Domain (optional for PoC) | `Onboard-2-Domain` | Registered product screen |
| `ba6be82b-2f1c-4b6c-a1bf-b48fbd0928f3` | HACKATHON · Domain: record not found (error) | `Onboard-2b-DomainFailed` | Registered product screen |
| `f309230a-dc4c-4c72-86c9-b9fe1c6d8ecc` | FALLBACK (if H5 slips) · Intake 1: basics | `BB-1-Basics` | Registered product screen |
| `53b266f4-b8bc-4bdd-b8e3-7d06c554941e` | FALLBACK (if H5 slips) · Ingest: add sources | `Onboard-3-Sources` | Registered product screen |
| `b08dc9b8-e806-45a3-afba-ed3b0b970587` | FALLBACK (if H5 slips) · Ingest: reading (loading) | `Onboard-3b-Profiling` | Registered product screen |
| `7d4c0888-fc57-4ee9-9788-51e5d54a1652` | FALLBACK (if H5 slips) · Ingest: source failed (error) | `Ingest-Error` | Registered product screen |
| `e3572273-0462-48ad-abb8-82fc401001d9` | FALLBACK (if H5 slips) · Intake 2: origin | `BB-2-Origin` | Registered product screen |
| `942f9fdb-8b57-4e4b-872b-9e837fd9dc49` | FALLBACK (if H5 slips) · Intake 3: what / how / why | `BB-3-GoldenCircle` | Registered product screen |
| `7e8cdd3f-3ae1-4dd0-ab6e-d7df630c4d85` | FALLBACK (if H5 slips) · Gate 1: Purpose | `BB-Gate1-Purpose` | Registered product screen |
| `f1ca43b7-a1eb-4d33-870e-7fe23b5ee4ce` | FALLBACK (if H5 slips) · Intake 4: alternatives + edge | `BB-4-Alternatives` | Registered product screen |
| `9c266869-8b23-4830-9a6c-aef9c78da42c` | FALLBACK (if H5 slips) · Gate 2: Positioning | `BB-Gate2-Positioning` | Registered product screen |
| `00389489-5cd9-42bb-ba18-3c752d64e16f` | FALLBACK (if H5 slips) · Intake 5: audience | `BB-5-Audience` | Registered product screen |
| `fd3aecea-a886-4e6b-9410-25f878dad617` | FALLBACK (if H5 slips) · Intake 6: voice by example (voice by example: not built, H10) | `BB-6-Voice` | Registered product screen |
| `2f666814-0fa3-4189-af53-d0e136941076` | FALLBACK (if H5 slips) · Gate 3: Voice | `BB-Gate3-Voice` | Registered product screen |
| `ab2e5061-f07c-4c8c-a9c6-7e116b7752ac` | HACKATHON · Coverage map (17 × E/I/M) | `Coverage-Map` | Registered product screen |
| `a7a00c8d-8fc9-4868-a4c9-00323523e990` | HACKATHON · Kit v1 approved + registered (success) | `Onboard-6-Published` | Registered product screen |
| `a5a65ba9-3581-4039-9167-537e04c7c373` | HACKATHON · Kit registration failed (error) | `Kit-RegisterFailed` | Registered product screen |
| `5f5a7805-aad8-4ce7-9019-941a0a9fac7e` | HACKATHON (THIN) · Download kit as aDNA folder | `Kit-Export` | Registered product screen |

### Create

Source: [JamJam wireframes (3).html](<../wireframes/JamJam wireframes (3).html>). SHA-256: `55718dc3e8597f8058aa1dc9a27683d0a03144d25f0450babf3a54a7001b7a64`.

| Resource UUID | Exported title | Artboard | Classification |
|---|---|---|---|
| `a209cec3-6025-4578-aed5-863752a44959` | HACK · Content dashboard | `Content-Dashboard` | Registered product screen |
| `2fccca7a-d312-4de7-bd40-91ca5c1f529a` | HACK · Content: empty | `Content-Dashboard-Empty` | Registered product screen |
| `37621dfc-b31f-432f-9f5d-12aae2ead17b` | HACKATHON · Review a draft: polish and slop built; scores self-graded today | `Draft-Review` | Registered product screen |
| `c33d9d33-54df-4ed4-ae5d-f2203028d6ff` | HACKATHON · Draft after Beautify (success, undo) | `Draft-Review-Beautified` | Registered product screen |
| `b6ac5dfa-4dee-4ae9-8dfb-225ffe7f5846` | HACKATHON · Polish action failed (error) | `Draft-Review-PolishError` | Registered product screen |
| `436ba13c-44ef-4ed7-b049-f53a962ecdb9` | COMING SOON · Media composer: carousel, card, video | `Media-Composer` | Registered product screen |
| `d9e0067b-e5ae-4ab9-92f0-bac1ecd0837b` | COMING SOON · Media review: checks on every slide | `Media-Review` | Registered product screen |

### Distribute

Source: [JamJam wireframes (4).html](<../wireframes/JamJam wireframes (4).html>). SHA-256: `4dba216b49de634e74a43f5ce0c42ac8f977772c188be155871fecbc442163ee`.

| Resource UUID | Exported title | Artboard | Classification |
|---|---|---|---|
| `20ad3d62-2dbd-4eef-b5d7-80adc8fd01c0` | COMING SOON · Distribute › every platform, one place (#82) | `Platforms` | Registered product screen |
| `1b6b8014-08a8-4ec9-a1c4-bbe740a20b78` | COMING SOON · Distribute › one platform: rules, connect, history (#82) | `Platform-Detail` | Registered product screen |
| `48b34fc9-5f98-4166-ba76-a6c66f4a685e` | COMING SOON · Distribute › write once, adapt per platform, schedule | `Distribute-Adapt` | Registered product screen |
| `1b61ec25-e114-4ea6-b746-45016562e742` | COMING SOON · Publishing: schedule + failed-publish alert | `Publish-Calendar` | Registered product screen |
| `7baa0b49-5e01-4f98-bb87-a7e0435eaefc` | COMING SOON · Settings › connections and payout wallet | `Settings-Connections` | Registered product screen |

### Verify

Source: [JamJam wireframes (5).html](<../wireframes/JamJam wireframes (5).html>). SHA-256: `ad9e5949104b98f9cdf5d7e4ee0aea83994e2dda6c82806d1bba67520b3a81a3`.

| Resource UUID | Exported title | Artboard | Classification |
|---|---|---|---|
| `a950b364-074f-49e7-93ed-99606ad79901` | COMING SOON · Verify › your proof: what's registered and who checked | `Verify-Home` | Registered product screen |
| `685b7c53-51ce-4248-8b66-f74a10e40a8c` | COMING SOON · Verify › check-it badge for your site (#82) | `Badge-Embed` | Registered product screen |
| `861f7c45-e955-4661-bdfc-991d04635490` | COMING SOON · Verify › tips received (#82) | `Tips-Received` | Registered product screen |
| `9eb586f3-56b5-4110-8ea8-f26b2da71b01` | HACK · 7 Verify: brand-approved | `Verify-1-Match` | Registered product screen |
| `fcd43117-21f1-407c-a9a2-587959dd3e4d` | HACK · 7 Verify: not found | `Verify-2-NoMatch` | Registered product screen |
| `2a69d1b6-55c5-4821-8c91-0dc0be799e69` | COMING SOON · 7 Verify: edited from original (needs a fuzzy match; Verify is exact-match today) | `Verify-3-Edited` | Registered product screen |
| `f738ac9d-41f9-4aca-bac6-912a9f9e51f6` | COMING SOON · Verify an account, kit version or claim | `Verify-4-Kit-Account-Claim` | Registered product screen |
| `38df9374-f3dd-46ad-90c9-e37e8b36907a` | COMING SOON · Verify: retracted | `Verify-5-Retracted` | Registered product screen |
| `3436f03b-70a3-4714-8af6-6f4a80f41a45` | HACKATHON · 8 Public ledger: kits and posts (rewritten) | `Ledger` | Registered product screen |
| `4c5dd092-1bc8-431c-a62b-6cafeb1c3f98` | COMING SOON · Public › where the badge lands (#82) | `Verify-Badge-Landing` | Registered product screen |
| `156d9b0a-1041-4256-a8de-7539aa595d69` | COMING SOON · Public › tip a creator in USDC (#82) | `Tip-Sheet` | Registered product screen |

### Grow

Source: [JamJam wireframes (6).html](<../wireframes/JamJam wireframes (6).html>). SHA-256: `759a8b85e18fddb98c9c860f4bc378402fc2abcec95de8d2af33b860fba4d356`.

| Resource UUID | Exported title | Artboard | Classification |
|---|---|---|---|
| `afbfd304-a445-4330-8cf1-a0b26d0a99e3` | COMING SOON · Grow › overview: every way aDNA's reach grows | `Grow-Home` | Registered product screen |
| `f3796b38-4a2d-4996-9720-fe64636d9cb1` | COMING SOON · Grow › events: from Luma or by hand, each with a content plan | `Events` | Registered product screen |
| `091d2e10-24b5-4c50-b670-9b4f7f72c2a7` | COMING SOON · Grow › one event: plan, people, results | `Event-Detail` | Registered product screen |
| `9d5a87a6-8300-4e4f-8681-ab6ed7b731e9` | HACK · Campaign v2: goal + platforms | `Campaign-v2-1-Goal` | Registered product screen |
| `ad55e2c1-418b-46f1-b636-27e8c1aeb811` | HACK · Campaign v2: success metrics | `Campaign-v2-2-Measure` | Registered product screen |
| `5c247b21-9d31-4add-9b31-2d93f7677d8d` | COMING SOON · Campaign v2 step 2: audience | `Campaign-v2-3-Audience` | Registered product screen |
| `c8ac3237-0a65-41bc-9827-24483326a248` | COMING SOON · Campaign v2 step 4: content plan | `Campaign-v2-4-Plan` | Registered product screen |
| `1ec99d54-2aed-44c8-ae82-4682ba56d6ff` | COMING SOON · Campaign v2 step 5: people and budget (no paid X) | `Campaign-v2-5-Budget` | Registered product screen |
| `c8f21329-99b7-46c8-8603-3f6ac788e858` | COMING SOON · Campaign v2 step 6: review and launch | `Campaign-v2-6-Launch` | Registered product screen |
| `9866d4dc-bd45-4b0b-850d-8133dee8068f` | STRETCH (H8, ADR-008) · Grow > Ambassadors (was brand dashboard) | `Dashboard` | Registered product screen |
| `01ed7525-96bb-4c1c-b307-606b0abcb3d9` | STRETCH (H8, ADR-008) · Ambassadors: empty | `Dashboard-Empty` | Registered product screen |
| `f61f41a9-0b5e-4e7f-a6a5-74eee2b811b1` | STRETCH (H8, ADR-008) · 5a Campaign list | `Amb-1-Campaigns` | Registered product screen |
| `bb79b896-0fed-470b-9f08-72b77480b373` | STRETCH (H8, ADR-008) · 5a Empty: no campaigns | `Amb-1b-CampaignsEmpty` | Registered product screen |
| `f4eae6b9-0a63-48f7-ae41-04ce421827e6` | STRETCH (H8, ADR-008) · 5b Campaign detail | `Amb-2-Detail` | Registered product screen |
| `81f799a1-07b6-47d8-923e-0824795bcc5f` | STRETCH (H8, ADR-008) · 5c Generate + edit | `Amb-3-Generate` | Registered product screen |
| `6f69fe6f-8104-4dd6-b5e9-da7b52cd3bea` | STRETCH (H8, ADR-008) · 5d Publish | `Amb-4-Publish` | Registered product screen |
| `25703a5d-3765-4d0b-8375-464debbd1e3b` | STRETCH (H8, ADR-008) · 5e Loading: verifying | `Amb-5a-Verifying` | Registered product screen |
| `20b2a4db-0394-4734-bed3-b030ee48dc26` | STRETCH (H8, ADR-008) · 5e Success: paid | `Amb-5b-Paid` | Registered product screen |
| `75cc5c80-c893-420c-877f-13d727b87c40` | STRETCH (H8, ADR-008) · 5e Error: verification failed | `Amb-5c-VerifyFailed` | Registered product screen |
| `87dd4de8-999c-486b-9a77-988bb028475e` | STRETCH (H8, ADR-008) · 5e Error: budget exhausted | `Amb-5d-BudgetReached` | Registered product screen |
| `d14f6e83-69e0-4467-96c5-18b115868c2d` | STRETCH (H8, ADR-008) · Mobile 5a List | `M-1-Campaigns` | Registered product screen |
| `1e821353-16ea-4e65-b576-69ed3c3d82b8` | STRETCH (H8, ADR-008) · Mobile 5b Detail | `M-2-Detail` | Registered product screen |
| `1634a8dd-624a-4083-8cef-12b8edeaf646` | STRETCH (H8, ADR-008) · Mobile 5c Generate + edit | `M-3-Generate` | Registered product screen |
| `a126805c-0357-429d-a07f-1ce523ce0367` | STRETCH (H8, ADR-008) · Mobile 5d Publish | `M-4-Publish` | Registered product screen |
| `3a9cc632-6534-47df-a618-a0a2bacc69ce` | STRETCH (H8, ADR-008) · Mobile 5e Paid | `M-5-Status` | Registered product screen |
| `4a8772d4-555e-437f-b747-f6e049022602` | STRETCH · Engagement: reply queue | `Engage-Queue` | Registered product screen |
| `a24aa1bf-94fb-4c0d-9b09-30cb8924f4f8` | ROADMAP · Engagement: rules, lists, opt-in auto-replies | `Engage-Rules` | Registered product screen |
| `be33f99c-0cf8-440a-9b87-a57d1d43c1aa` | ROADMAP · Partner access | `Partners` | Registered product screen |
| `b8b212c3-5dcf-4a76-9f08-bceb24280eb7` | EXP · Lead finder | `Leads` | Registered product screen |
| `b2507308-2854-4530-9451-dc249ca924e4` | EXP · AI influencer: setup | `Influencer-Setup` | Registered product screen |
| `d6b79512-9f21-432b-a044-84ff65c41408` | EXP · AI influencer: approval queue | `Influencer-Queue` | Registered product screen |
| `d6af006c-acbd-487f-97df-ccf670379e2e` | COMING SOON · Grow › refer a friend: you both get 2 months free (#82) | `Referral` | Registered product screen |
| `8eea7c34-0a5c-4831-96ce-168848713bde` | COMING SOON · Public › what a referred friend sees (#82) | `Referral-Landing` | Registered product screen |
| `9c0cbbc8-5d8b-4052-9552-51b3ff0e5eb1` | COMING SOON · Settings › team: invite teammates and partners (#82) | `Invite-Team` | Registered product screen |
| `4eeb9205-0ba1-46b0-8aa8-78fc9e6df393` | COMING SOON · Public › accept a team invite (#82) | `Invite-Accept` | Registered product screen |
| `092c47fc-37ff-440e-9b7f-a510f81c441a` | COMING SOON · Grow › quests: paid community tasks in USDC | `Quests` | Registered product screen |
| `0c37e301-a04a-4a5a-a026-c5a487b2a0c5` | ROADMAP · Public › events board: rated by people who went | `Events-Board` | Registered product screen |
| `b7907072-8417-4d58-8960-ea4538179e90` | ROADMAP · Public › one event's ratings, and rate it | `Event-Rating` | Registered product screen |

### Learn

Source: [JamJam wireframes (7).html](<../wireframes/JamJam wireframes (7).html>). SHA-256: `a7da75592dafd67abc95ced2dd93f7a69671cf041b8143a4efc9a84e79a7f5db`.

| Resource UUID | Exported title | Artboard | Classification |
|---|---|---|---|
| `7e829a47-9220-4fed-9224-0bf4eab8ee91` | ROADMAP · Analytics | `Analytics` | Registered product screen |
| `769b9ec5-c902-452f-a623-bfe4974ecf64` | ROADMAP · Analytics: connect, collecting, error | `Analytics-Empty` | Registered product screen |
| `85c2fbf0-21cc-4008-bb7d-c6df053c30e9` | COMING SOON · Learn › suggested rules: results become Brain changes you approve | `Learn-Rules` | Registered product screen |
| `25e913ef-01be-4262-84f3-b70fb7cdcc51` | COMING SOON · Outcome log: inbound qualified against the audience | `Outcome-Log` | Registered product screen |

### Utilities

Source: [JamJam wireframes (8).html](<../wireframes/JamJam wireframes (8).html>). SHA-256: `be9a40e8a97c199980580ea7929fe6ea9b7e6a32c049f74cf069c67cecd61287`.

| Resource UUID | Exported title | Artboard | Classification |
|---|---|---|---|
| `30198689-f9b0-4817-82c0-e9dd9fca58d2` | STRETCH · Inbox: all inboxes | `Inbox-All` | Registered product screen |
| `67a9d202-ba6b-4167-a835-4cba925db933` | STRETCH · Inbox: needs reply | `Inbox-NeedsReply` | Registered product screen |
| `90700e8e-6614-4a7a-ad67-2835bf8e8d25` | STRETCH · Inbox: connect sources (empty + error) | `Inbox-Connect` | Registered product screen |
| `37b86007-f823-4198-b290-a1b1e2f51eea` | COMING SOON · Settings › AI model and your key | `Settings-AI` | Registered product screen |
| `0255746c-80d1-4e2e-bb8b-01ec2e132c16` | COMING SOON · Get a key (OpenRouter connect or paste) | `Settings-GetKey` | Registered product screen |
| `726dc6b6-f8be-4225-9c76-69730360a16e` | COMING SOON · Settings › plan, seats, invoices | `Settings-Plan` | Registered product screen |
| `43f3154f-df60-45e2-b980-dbe041dbf0b8` | COMING SOON · Pricing (public) | `Pricing` | Registered product screen |
| `3bc90da6-0814-4900-a6d6-81e42ce6a803` | COMING SOON · Upgrade: one page to paid | `Upgrade` | Registered product screen |

### Archive

Source: [JamJam wireframes (9).html](<../wireframes/JamJam wireframes (9).html>). SHA-256: `f912ed7a17ea7e1d6800107504955aad8e57ef088db03631a7cae080efa373ce`.

| Resource UUID | Exported title | Artboard | Classification |
|---|---|---|---|
| `47e8d6de-30a4-4e84-9438-bbaada8e3ef4` | PARKED · 6 Pick brand | `Lic-1-Brand` | Existing parked/archived board; not an active product screen |
| `0849fdfb-f007-4b37-9a8c-b6676f357b92` | PARKED · 6 Pick format | `Lic-2-Format` | Existing parked/archived board; not an active product screen |
| `910c822e-467e-444a-a677-971ab1c5515e` | PARKED · 6 Brief | `Lic-3-Brief` | Existing parked/archived board; not an active product screen |
| `924b5ad0-a601-4c54-b294-9b1b3922303a` | PARKED · 6 Free preview | `Lic-4-Preview` | Existing parked/archived board; not an active product screen |
| `0a612ff8-ee2a-4e8e-ae29-22ba26cdd2f2` | PARKED · 6 Pay (split shown) | `Lic-5-Pay` | Existing parked/archived board; not an active product screen |
| `9c5adea6-ea77-4e7c-800e-840938d92022` | REPLACED by Today (ADR-012) · Hub home | `Hub-Home` | Registered historical screen; replaced by Today |
| `f478eb3f-384f-4806-a2d6-3b0fa4db91ed` | PARKED · 6 Error: payment failed | `Lic-5b-PayFailed` | Existing parked/archived board; not an active product screen |
| `b7a51b2d-fe08-458b-8be5-1c3a86dcbba5` | PARKED · 6 Full piece + export | `Lic-6-Result` | Existing parked/archived board; not an active product screen |
| `e102580c-b00f-4969-a422-70a533712f18` | PARKED · License terms + consent (was Onboard-5) | `Onboard-5-License` | Existing parked/archived board; not an active product screen |
| `43ac02dc-5cc2-4bca-a298-251cc45d572c` | PARKED · Campaign builder v1 | `Campaign-Builder` | Existing parked/archived board; not an active product screen |
| `7ed87521-61b1-4ac5-8776-d5d3c07c5e48` | ARCHIVED · Landing v2 (replaced by Journey 0) | `Landing-v2` | Existing parked/archived board; not an active product screen |
| `b44ec45a-251a-4333-aafb-80dd72ab9c90` | ARCHIVED · Old voice-pack review | `Onboard-4-VoicePack` | Existing parked/archived board; not an active product screen |
