---
type: audit
status: active
created: 2026-10-12
updated: 2026-10-12
last_edited_by: agent
tags: [audit, onboarding, ux, wireframes, journey]
---
> **Status: active.** Audit of the onboarding journey and the wireframe canvas, done 2026-10-12 for [issue #43](https://github.com/DeveloperAlly/solana-hack/issues/43). It follows the [2026-10-06 wireframe audit](../.agentic/what/context/wireframe_audit_2026_10_06.md), which checked screens against the spec. This one checks whether a new user can use the product and see its value. Live status stays in [STATE.md](../STATE.md).

# Onboarding journey and wireframe audit (2026-10-12)

## Task
In the owner's words, 2026-10-12:
- Are the wireframes correct, and do they match the JamJam delivery plan and PR #30?
- Are they market- and brand-forward like [Pressmaster's clickable demo](https://www.pressmaster.ai/clickable-demo)?
- "Product first thinking: if I can't use or demonstrate the value proposition, it's a failure."
- "It's about user experience and onboarding for a real startup."

## Verdict
The answer to all three questions is no.

| Question | Answer | Main reason |
|---|---|---|
| Do the wireframes match the delivery plan? | No | The plan's demo moment (H5: evidence prefill and confirm mode, under 5 minutes to kit v1) has no screen. The canvas still draws a linear interview that asks every question. |
| Do they match PR #30? | Not applicable as a UI change; its findings expose gaps | [PR #30](https://github.com/DeveloperAlly/solana-hack/pull/30) is research 10 (59 competitors), merged 2026-10-12. Several onboarding patterns it lists have no screen on the canvas. |
| Are they market- and brand-forward? | No | Pressmaster sells an outcome with a time on it and shows the product first. JamJam sells a process and shows placeholders. |

The product test fails on both the wireframes and the live build. A new user does not see the value until about 14 steps and 16 minutes of questions in. The differentiator, every fact with its quote and every approval provable, is a footer claim rather than a moment the user experiences.

## Method and sources
- **Canvas:** the index of all 72 artboards and every note (`project/canvas.json`, version 1791278436-6751), and the source of every artboard, searched for names and links. Five were read line by line: Main, Hub-Home, Brand-Build, Onboard-5-License and Lic-1-Brand. Canvas: [wireframes](https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
- **Plan:** the owner's "JamJam delivery plan: hackathon build and full product" (draft, 2026-10-12), read in full. It covers its hackathon tasks H0 to H11 and Phase 1, "Onboarding nailed".
- **Research:** [research 10](../.agentic/what/context/research/10_competitor_onboarding_pricing.md) §5 (onboarding patterns) and §10 (the addendum on onboarding and creation), and its [segment B detail](../.agentic/what/context/research/10_competitor_detail/b_ai_social_voice.md) for Pressmaster.
- **Code:** `main` at commit `9da167b`. The live site renders client-side, so a plain fetch returns an empty shell; the code was read instead of the rendered pages.
- **Specs:** [architecture §12.1](../.agentic/what/context/brand_builder_architecture.md#121-user-flow) (accepted), [ADR-003](../.agentic/what/decisions/adr_003_superhub_business_model.md), [ADR-007](../.agentic/what/decisions/adr_007_pitch_positioning.md), [ADR-008](../.agentic/what/decisions/adr_008_submission_critical_path.md) (proposed), [ADR-009](../.agentic/what/decisions/adr_009_rename_jamjam.md).
- **Limits:**
  - Pressmaster's interactive demo is embedded from a host that disallows automated access, so it was not walked through. Its flow here comes from the demo page's own copy and the sourced segment B profile.
  - The other 67 artboards were judged from the canvas index, the notes and a text search of their source.

## Finding 1: a new user can't see the value

| | Pressmaster | JamJam wireframes | JamJam live (`main`) |
|---|---|---|---|
| Promise | "Create 2 Weeks of Content in Under 3 Minutes" ([demo page](https://www.pressmaster.ai/clickable-demo)) | "Build your brand. Then start creating." No outcome, no time (Main artboard) | Same headline ([`Landing.tsx`](../web/src/screens/landing/Landing.tsx)) |
| Proof before sign-up | A clickable product demo, G2 4.8, "over 2,000 Founders, Experts and Agencies", named testimonials ([demo page](https://www.pressmaster.ai/clickable-demo)) | The example kit and post are placeholders: "[Sample post drafted from the kit]" (Main) | A "Sample" box with text describing a post, not a post ([`Landing.tsx`](../web/src/screens/landing/Landing.tsx)) |
| Input on the first screen | Not applicable: the demo runs on the page | A name-or-website field, but its form posts to sign-in and the value is dropped (Main) | No input field; a "Build my brand" button only ([`Landing.tsx`](../web/src/screens/landing/Landing.tsx)) |
| Steps to first output | 3: set the goal, add a topic, generate 14 days ([demo page](https://www.pressmaster.ai/clickable-demo)) | Sign-in, domain, 6 intake steps, 3 gates, coverage, kit v1, then a first draft (canvas note n-main) | 14 steps before "Start creating" ([`steps.ts`](../web/src/screens/build/steps.ts); [`Build.tsx` L511](../web/src/screens/build/Build.tsx)) |
| Time claimed | Under 3 minutes | "About 15 minutes of your time" (Main) | "About 16 minutes of questions" (`INTERVIEW_MINUTES`, the sum of the step minutes in [`steps.ts`](../web/src/screens/build/steps.ts)) |
| Where the differentiator shows | Not offered: no quote-cited facts, no claims gate, no proof ([research 10 §3B](../.agentic/what/context/research/10_competitor_onboarding_pricing.md#b-ai-social-content-in-your-voice-detail)) | A grey "Proof built in" box under How it works (Main) | The same section, below the fold ([`Landing.tsx`](../web/src/screens/landing/Landing.tsx)) |

Research 10 found that no product shows which brand facts are evidenced and which are inferred, and called that "the demo moment for 'infer first'" ([§10.2](../.agentic/what/context/research/10_competitor_onboarding_pricing.md#102-brand-onboarding)). The market's onboarding norm is a fast first win and never an empty screen ([§5](../.agentic/what/context/research/10_competitor_onboarding_pricing.md#5-onboarding-what-the-market-does-now)). Neither the canvas nor the live app delivers either.

## Finding 2: the canvas has drifted from the decisions

The [UI build mission](../.agentic/how/missions/mission_ui_build.md) makes the canvas the spec: "a slice is built only from screens that are drawn and signed off". Drift on the canvas therefore becomes drift in the product.

| Area | Canvas | Source of truth | Gap |
|---|---|---|---|
| Name | "Waterlily" appears 127 times in 69 of the 72 artboards, including the logo on every page and the waterlily.ai footer | [ADR-009](../.agentic/what/decisions/adr_009_rename_jamjam.md): the product is JamJam (jamjam.tech) | Wrong name on user-facing screens |
| Onboarding order | Intake steps 1 to 6 ask every question. Coverage comes after intake; note n-openq leaves this open | [Architecture §12.1](../.agentic/what/context/brand_builder_architecture.md#121-user-flow) step 4 puts coverage before the interview, which asks only the gaps (accepted). Delivery plan H5 (#34) makes it the demo moment | No screen for prefill, confirm mode or gap-only questions |
| Sources | URL and upload, read one by one | Delivery plan H4 ([#33](https://github.com/DeveloperAlly/solana-hack/issues/33)): site, links, paste, PDF and DOCX | Paste and documents aren't drawn |
| Positioning | Three AI options from the owner's answers (BB-4) | Delivery plan H6 ([#35](https://github.com/DeveloperAlly/solana-hack/issues/35)): three competitor candidates with sources | No competitor step |
| Sign-in | "Email + 6-digit code" (note n-ob1) | The live email carries a link and a code. The project sends 8 digits; the app accepts 6 to 10 ([STATE.md, Blockers](../STATE.md#blockers); [`SignIn.tsx`](../web/src/screens/signin/SignIn.tsx)) | The note is out of date |
| Kit | 17 sections with E/I/M badges (Brand-Build) | Architecture: 17 sections in the coverage map. The live kit drafts 6 ([`kit.ts`](../web/worker/kit.ts)) | Users are shown a kit the product does not make yet; owner decision D2 |
| Voice | Pick 1 of 3 paragraphs, twice (BB-6) | Architecture §5 step 6; delivery plan H10. Live uses template plus 8 dials ([`steps.ts`](../web/src/screens/build/steps.ts)) | The canvas is right; the build is behind |
| Pay | 14 ambassador artboards tagged HACK; Hub-Home shows "60 USDC on approval" | [ADR-008](../.agentic/what/decisions/adr_008_submission_critical_path.md) (proposed) cuts payouts; delivery plan H8 makes a devnet payout demo a stretch | Tags overstate the demo |
| Business model | 8 licensee artboards plus Onboard-5 license terms, on canvas pages | [ADR-003](../.agentic/what/decisions/adr_003_superhub_business_model.md) replaced licensing | Kept for reference, but they sit beside live screens |
| First-run hub | Hub-Home shows a busy account; no first-run state | Research 10 §5 "never an empty screen" and proposal N3, a post-kit setup checklist ([§7.1](../.agentic/what/context/research/10_competitor_onboarding_pricing.md#71-new-proposals)) | No checklist or readiness signal |
| Settings › AI | Not drawn | Delivery plan Phase 1 (connect a model key, encrypted per brand) | Missing |

## Finding 3: what PR #30 adds
PR #30 is research only, and its §10 addendum is consistent with the delivery plan. Four of its onboarding patterns have no screen:
- **Several ways in:** URL, upload or chat.
- **Readiness signal:** Pressmaster's Twin IQ, for example.
- **Post-kit setup checklist:** N3.
- **A fast first win.**

It also records that Pressmaster's onboarding is a five-step checklist that pays out credits, and that it has three setup modes ([segment B](../.agentic/what/context/research/10_competitor_detail/b_ai_social_voice.md)). That is the bar a real startup's onboarding is compared with.

## Root causes
1. **The canvas was built as a feature inventory, not a journey to a first win.**
   - It grew from 57 artboards (2026-10-06 audit) to 72, each tagged by build scope.
   - No artboard or note defines the aha moment, the time to value, or the order in which a new user meets them.
   - The build followed the inventory, and nothing measured whether a new user gets value quickly.
2. **Decisions never flow back into the canvas.** The canvas is the spec, but none of these changed it:
   - ADR-009 (rename);
   - ADR-008 (cuts);
   - link sign-in ([PR #27](https://github.com/DeveloperAlly/solana-hack/pull/27));
   - the accepted coverage-first order;
   - the delivery plan's H4 to H6.

   No rule says a decision or UI change must update the canvas, so drift accumulates with every decision.
3. **The wireframe fidelity became the brand.**
   - [ADR-009](../.agentic/what/decisions/adr_009_rename_jamjam.md) set the brand look to "wireframe black and white". So there is no brand layer: no visual identity, no tone of voice on the marketing pages, no proof assets.
   - That is why nothing reads as brand-forward. The grey boxes are a design tool, and they shipped as the identity.
4. **The differentiator was never turned into a user moment.**
   - [ADR-007](../.agentic/what/decisions/adr_007_pitch_positioning.md) positions the full loop.
   - Research 10 says evidence and public proof are the hardest parts to copy ([§8](../.agentic/what/context/research/10_competitor_onboarding_pricing.md#8-risks-not-already-recorded)).
   - The UX still presents proof as a feature section rather than something the user watches happen to their own brand.

## Fixes
| Root cause | Fix | Where |
|---|---|---|
| 1 | A journey with five aha moments and a time budget becomes the spec for onboarding, ahead of the screen inventory. A Journey page on the canvas holds the map and one artboard per stage, from landing to a verifiable first post and the first-run hub | Canvas, Journey page (see "Fixes applied") |
| 2 | A binding rule: a PR that changes UI, and an ADR that changes product behaviour, updates the canvas in the same change or states why not. Enforced through the PR template | [AGENTS.md](../AGENTS.md) rule 8; [`.github/pull_request_template.md`](../.github/pull_request_template.md) |
| 2 | Clear the existing drift: rename to JamJam; correct the sign-in note; move parked and superseded boards to an Archive page; retag Pay boards to match ADR-008; mark the linear intake as the fallback if H5 slips; resolve open question n-openq to coverage-first | Canvas |
| 3 | A brand layer separate from the wireframe theme. The owner decides (D4). The journey artboards mark where proof assets sit (JamJam's own kit and post) | Owner decision D4 |
| 4 | Proof becomes moments the user experiences. The quote appears next to each fact while the site is read (aha 1). The first post shows each claim linked to its evidence (aha 4). The Verify page says "Official" for the user's own post (aha 5). Flagging an edited copy needs a fuzzy match, which is not built or planned for the submission | Journey stages 1, 6 and 7 |

## The journey (v3, proposed)
Time budgets are targets until measured on [#36](https://github.com/DeveloperAlly/solana-hack/issues/36) (the delivery plan's H5 target is under 5 minutes to kit v1).

| # | Stage | What the user does | Aha moment | Target time | Delivered by |
|---|---|---|---|---|---|
| 0 | Land | Reads the outcome, sees a real kit and a verified post, pastes a URL | "This is for me": a concrete outcome with real output | 0:00–0:30 | New landing slice; H7 (#36) supplies the real kit and post |
| 1 | Read | Watches facts arrive, each with its quote and page | **Aha 1:** "It already knows us, and shows where it read it" | 0:30–1:30 | H4 (#33), H5 (#34) |
| 2 | Save | Gives an email to keep the work (link or code) | None: the cost is paid after the value | 1:30–2:00 | Owner decision D1 |
| 3 | Confirm | Accepts, edits or rejects prefilled cards; the readiness meter fills | **Aha 2:** "I'm confirming, not typing" | 2:00–4:00 | H5 (#34) |
| 4 | Fill gaps and voice | Answers only the missing questions; picks a paragraph twice | **Aha 3:** "That sounds like us" | 4:00–6:00 | H5 (#34), H10 |
| 5 | Approve kit | Approves purpose, positioning and voice with sources beside them; kit v1 registers | Ownership: the approval is recorded | 6:00–7:00 | Built (gates, registration) |
| 6 | First post | Gets a first post drafted from the kit, with each claim linked to its evidence | **Aha 4:** "A post in my voice, and every claim is backed" | 7:00–9:00 | Built (Create); claims on the draft is H9 |
| 7 | Prove | Approves; the post registers; Verify says "Official" for the exact text | **Aha 5:** "Anyone can check this came from us" | 9:00–10:00 | Built: exact match and Ledger. The edited-copy check is not built: `verifyText` in [`posts.ts`](../web/worker/posts.ts) matches exact text only |
| 8 | Return | Lands on a first-run hub with a setup checklist and a next action | A reason to come back | Day 2+ | Proposal N3 |

## Owner decisions
| # | Decision | Recommendation | Why |
|---|---|---|---|
| D1 | Read the site before sign-in, and ask for the email only to save the work | Yes, for the URL read and the found-facts view; sign-in before anything is drafted or stored against a brand | It puts aha 1 before any cost. It changes [architecture §12.1](../.agentic/what/context/brand_builder_architecture.md#121-user-flow) step 0, so it needs ratifying. Abuse control: one anonymous read per session, rate-limited at the Worker |
| D2 | Kit size: show 17 sections or the 6 the product drafts | Show the 6 drafted sections in onboarding, with the other 11 as "later" in the coverage map | Users should only be shown what the product makes ([`kit.ts`](../web/worker/kit.ts)) |
| D3 | Landing headline with a time claim | Use a time only once #36 measures it, for example "Your brand kit and first post, every fact sourced, in under 10 minutes" | No claim without evidence ([AGENTS.md](../AGENTS.md) rule 6) |
| D4 | Brand layer: is "wireframe black and white" the brand or a placeholder? | A placeholder. Commission a brand pass (logo, type, one accent, proof assets) after the submission, and keep the wireframe theme for the demo | Root cause 3 |
| D5 | Ratify ADR-008 so Pay tags are final | Ratify, or reject and restore Pay to the demo | Tags on 14 artboards depend on it |

## Fixes applied
**Canvas:** published as version 1791791929-7ab8 on 2026-10-12. It now opens on the Journey page.

| Root cause | What changed | Check |
|---|---|---|
| 1 | **New Journey (v3) page.** A journey map holds the 9 stages, 5 aha moments, target times, success measures and the fallback if H5 slips. Nine stage artboards follow it: Main (new landing), J1-Read, J2-Save, J3-Confirm, J4-Gaps-Voice, J5-Approve-Kit, J6-First-Post, J7-Proof and J8-Hub-FirstRun. Each has a note with its tag, aha moment, states and the plan task that delivers it | 10 artboards on the Journey page. Tag balance, the page skeleton and every internal link were checked by script; 0 broken links |
| 2 | **Rename.** "Waterlily" replaced with "JamJam" in all 69 affected artboards and every note; waterlily.ai replaced with jamjam.tech | 0 matches for "waterlily" in any artboard or the index |
| 2 | **Licensing-era copy removed from live screens.** Ledger is rewritten to show kits and posts, with payouts as coming soon. Licensing copy is fixed on Verify-1-Match, Dashboard, Dashboard-Empty and Amb-3-Generate (voice pack, license income, licensee) | One remaining mention, on Partners, correctly says per-piece licensing is parked |
| 2 | **Archive.** The Licensee page is renamed "Archive (not in product)". The old landing (as Landing-v2) and Onboard-4 move there | 0 licensing screens outside the Archive page |
| 2 | **Retags.** The 14 ambassador screens plus Dashboard and Dashboard-Empty are now "STRETCH (H8, ADR-008)". Intake 1–6, the gates, sources and ingest are "FALLBACK (if H5 slips)". The legend explains each tag | Tags match ADR-008 (proposed) and delivery plan H5 and H8 |
| 2 | **Stale notes fixed.** The sign-in note now describes link and code, 8 digits. Open questions 1 to 3 are resolved: coverage-first, JamJam as the walkthrough brand, Onboard-4 archived. The 17-versus-6 kit gap is added as an open question (D2) | Notes n-ob1 and n-openq |
| 2 | **Process.** [AGENTS.md](../AGENTS.md) gains rule 8, the canvas follows the product. A [PR template](../.github/pull_request_template.md) asks every PR for its canvas update or the reason there is none. The [UI build mission](../.agentic/how/missions/mission_ui_build.md) points onboarding at the Journey page | In this PR |
| 3 | Not changed. The brand layer is the owner's call (D4). The landing now shows real output (when #36 has produced it) and a public ledger in place of invented proof | D4 open |
| 4 | Proof becomes moments in the journey: the quote beside each fact (J1, J3), the evidence beside each claim (J6), and "Official" on the user's own post (J7). The edited-copy diff is drawn as coming soon | Aha moments 1, 4 and 5 on the map |

**Not fixed here, deliberately:**
- **The live app.** It still runs the linear flow. The journey is delivered by the slices already planned: #33 (H4), #34 (H5), #35 (H6), #36 (H7), H9 and H10. The landing (stage 0) and the first-run hub (stage 8) need two new slices, which the owner decides on.
- **The hub screens.** Inbox, Grow and Analytics were not reviewed against the journey; they come after first run.

## Second pass (2026-10-12, after review)
A review of the canvas against the code found claims the first pass got wrong. All are fixed on the canvas, version 1791798475-0bbc.

| What was wrong | Evidence | Fix |
|---|---|---|
| J7 and Verify-3 showed the edited-copy diff as built | `verifyText` matches exact text only ([`posts.ts`](../web/worker/posts.ts)); an edited copy shows "Not an official post" ([`Verify.tsx`](../web/src/screens/verify/Verify.tsx)) | Both tagged COMING SOON; the journey map says exact match only |
| J6 and Draft-Review presented voice-fit and platform scores as real | The scores come from the same model call that writes the draft (delivery plan) | J6 says "proposed"; Draft-Review says "self-graded today" |
| Voice-Editor's per-channel overrides were tagged HACKATHON | Built: template, 8 dials, claims level, one sample ([`steps.ts`](../web/src/screens/build/steps.ts)) | Overrides tagged roadmap |
| Brand-Build's tag implied 17 sections | 6 sections drafted ([`kit.ts`](../web/worker/kit.ts)) | Tag and copy say 6 built, 11 coming soon |
| Ambassador flows paid for X posts (Amb-1 to 5c, M-1 to M-4, Dashboard, Campaign-v2-2-Measure) | X bans paying people for posts ([ADR-002](../.agentic/what/decisions/adr_002_purpose_build_run_prove.md)); the API rejects a paid X format ([backend map](../.agentic/what/context/backend_map.md)) | X removed from every paid format; brand-owned X posts stay |
| Dashboard had "Approve and pay" as one button | [ADR-006](../.agentic/what/decisions/adr_006_wallet_identity_split.md) and the backend map separate approving from paying | Approve, Reject and "Pay (owner only)" |
| Onboard-2 said registration is off for unverified domains | The build registers with `domain_verified: false` ([`api.ts`](../web/worker/api.ts)); Verify says the name is self-declared | Board matches the code |
| Licensing leftovers: "Edit pack", and payout fields as Verify-1's default result | [ADR-003](../.agentic/what/decisions/adr_003_superhub_business_model.md) | "Edit kit"; Verify-1 shows a brand post, with ambassador details only for ambassador posts |
| 19 planned screens had no artboard | Component inventory D19, D48, D52, D54, D55 and campaign steps 2, 4–6; backend map Settings rows | Drawn on a new "Coming soon (drawn, not built)" page: Settings (AI, get a key, connections, plan), Pricing, Upgrade, media composer and review, Claims, campaign steps, publishing calendar, brand switcher, founder profile, Verify for account, kit and claim, Verify retracted, outcome log |

The same wrong "diff built" claim was in [research 10 §10.4](../.agentic/what/context/research/10_competitor_onboarding_pricing.md#104-other-areas); it is corrected in this PR.

## Sources
- [Issue #43](https://github.com/DeveloperAlly/solana-hack/issues/43): this task and its success criteria.
- [Wireframe canvas](https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), version 1791278436-6751 before this audit.
- [PR #30](https://github.com/DeveloperAlly/solana-hack/pull/30) and [research 10](../.agentic/what/context/research/10_competitor_onboarding_pricing.md).
- [Pressmaster clickable demo page](https://www.pressmaster.ai/clickable-demo), read 2026-10-12.
- [Architecture §12.1](../.agentic/what/context/brand_builder_architecture.md#121-user-flow); [UI build mission](../.agentic/how/missions/mission_ui_build.md); [2026-10-06 wireframe audit](../.agentic/what/context/wireframe_audit_2026_10_06.md).
- Code on `main` at `9da167b`: [`Landing.tsx`](../web/src/screens/landing/Landing.tsx), [`steps.ts`](../web/src/screens/build/steps.ts), [`Build.tsx`](../web/src/screens/build/Build.tsx), [`SignIn.tsx`](../web/src/screens/signin/SignIn.tsx), [`kit.ts`](../web/worker/kit.ts).
- JamJam delivery plan: the owner's draft doc of 2026-10-12, hackathon tasks H0–H11 and Phase 1.
