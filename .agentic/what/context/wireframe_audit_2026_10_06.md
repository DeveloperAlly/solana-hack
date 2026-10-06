---
type: audit
status: active
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [wireframes, audit, ui]
---
> **Status: active.** Audit of the [UI wireframes canvas](https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn) (57 artboards) against the [Brand Builder architecture](./brand_builder_architecture.md), the [compendium](./compendium_2026_10_06.md) and [research 06](./research/06_voice_templates.md). This is the input to the wireframe rework, which comes first in [issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4). A re-review of the updated canvas (70 artboards) is in [§v2](#v2-2026-10-06-re-review), and the backend each screen needs is in [backend_map.md](./backend_map.md).

# Wireframe audit (2026-10-06)

**Method:** read the canvas index, every artboard file and every canvas note, then checked each one against the specs linked above.

## Inventory
| Canvas page | Artboards |
|---|---|
| Landing | 1 |
| Superhub (v2) | 20: home, inbox ×3, brand, voices ×2, content ×3, campaign v2 ×2, engagement ×2, partners, leads, influencer ×2, analytics ×2 |
| Brand onboarding | 10: wizard ×7, ambassador management ×2, campaign builder v1 |
| Ambassador | 14: desktop ×9, mobile ×5 |
| Licensee (parked) | 7 |
| Verify + ledger | 4 |

## Keep (copy fixes only)
- **Hub and inbox:** Hub-Home, Inbox-All, Inbox-NeedsReply, Inbox-Connect. Unconfirmed API access is already marked in brackets.
- **Create:** Content-Dashboard (and its empty state), Campaign-v2 steps 1–2.
- **Grow:** Engage-Queue, Engage-Rules, Leads, Influencer-Setup, Influencer-Queue.
- **Analytics:** both screens.
- **Verify:** Verify-2 (no match) and Verify-3 (edited).
- **Ambassador:** all screens, desktop and mobile. Rename "voice pack" to "kit".

## Rework
| Artboard | Why |
|---|---|
| Main (landing) | Hero and entry points still describe voice licensing ("licensed on your terms", "license a voice", "Since 2023") |
| Onboard 1–4 and 6 | The wizard steps are sign-in, domain, sources, voice pack and license terms. It must become the Brand Builder intake (architecture §5) |
| Brand-Build | 9 sections instead of the 17 in the architecture. Missing: a coverage view (evidenced / inferred / missing), evidence per fact, the 3 decision gates, assumption labels, kit hash |
| Voice-Templates, Voice-Editor | Use the research 06 model (decided 2026-10-06): 12 templates, 9 dimensions, claims strictness as a gate, Flirty behind a content-policy gate. Drop the Irreverence and Suggestiveness dials |
| Draft-Review | Has the slop check but none of the polish actions (Review, Shorten, Clarify, Beautify plus accessible mode) and no platform score |
| Ledger, Verify-1 | Show license fees, splits and consent. Should show registrations: identity, account, kit, claim, content, persona, plus payouts |
| Dashboard, Dashboard-Empty, Partners | Licensing-era wording ("voice pack", "license") |

## Missing (in the spec, no screen)
- **Brand Builder intake steps:**
  - intake form (type, stage, goals, links)
  - origin
  - Golden Circle
  - alternatives and what makes you different
  - audience
  - voice by example
- **Brand Builder views:**
  - coverage map
  - Gate 1 (purpose), Gate 2 (positioning), Gate 3 (voice)
  - kit v1 approved and registered
  - aDNA export
- **Claims with evidence:** each claim shows its evidence, owner, expiry and registration.
- **Quests** (coming soon).
- **Settings:**
  - publishing connections (X, LinkedIn, clipboard fallback)
  - AI model and bring-your-own key
  - plan, seats and billing (subscription model, ADR-003)
- **States:** most hub screens have no loading or error state. Some have no empty state.

## Conflicts and decisions
| Conflict | Decision (owner, 2026-10-06) |
|---|---|
| Voice model: wireframes have 7 templates on 10 dials; research 06 has 12 templates on 9 dimensions plus a claims gate | Research 06 wins. Update the wireframes |
| Licensing screens (7 licensee screens, Onboard-5, campaign builder v1) | Keep them on the Parked page for reference, untouched |
| Sample brand on hub screens: aDNA is shown on X, but research 09 found no social presence | Keep aDNA as the sample brand for now, including X (it shows aDNA going onto social) |
| "Ally Haire" is listed as a demo brand on the landing page and the ledger | The compendium decided the founder's personal brand is a user, not a demo case. Remove it from the demo brand lists |
| Waterlily doesn't appear as a brand anywhere | Add it to the brand switcher and the case-study screens (headline demo) |
| Sample figures (ledger, home) are not labelled on screen | Label them as sample data |
| The tag legend refers to a "22 h hackathon build" and its tags differ from the backlog | Align it with the [backlog](../../how/backlog/backlog.md) tags |

## v2 (2026-10-06): re-review

Source: canvas version 1791275000-2db3, 70 artboards, read-only. Checked against brand_builder_architecture.md (§2, §3, §4, §5, §6, §7, §12), compendium §3 and §5, the backlog, and the first audit (wireframe_audit_2026_10_06.md). 

### State of the canvas
- **Pages:** Brand Builder 22, Superhub 20, Ambassador 14, Licensee (parked) 9, Verify + ledger 4, Landing 1.
- **Tags:** HACK 28, HACKATHON 20, HACKATHON (THIN) 1, PARKED 9, STRETCH 4, ROADMAP 4, EXP 3, SUPERSEDED 1.
- **Done since the first audit:**
  - Landing reworked.
  - Sign-in, domain and ingest screens reworked.
  - The full intake is drawn: BB-1 to BB-6 and Gates 1–3.
  - Coverage map, kit v1 success, registration-failed error and aDNA export added.
  - Brand-Build now shows all 17 sections with E/I/M badges, sources and assumption labels.
  - Licensing screens and campaign builder v1 moved to Parked.
- **Not touched, so still open from the first audit:**
  - Voice-Templates and Voice-Editor still use 7 templates on 10 dials, including Irreverence and Suggestiveness.
  - Draft-Review has no polish actions and no platform score.
  - Ledger and Verify-1 still show licensing, splits and consent.
  - Dashboard and Dashboard-Empty still show license income and "voice pack".
  - "Voice pack" wording remains on the ambassador screens.
  - Ally Haire is still listed on Amb-1, Amb-1b, M-1, the Ledger switcher and Lic-1.
  - Ledger figures have no "Sample data" label.
  - None of the settings screens, the claims screen or the quests screen exists.

  These items are not repeated in the table below unless something new changed them.

### (a) Play walkthrough link chain
| Hop | Result |
|---|---|
| Main → Onboard-1-SignIn | OK |
| Onboard-1 → Onboard-2-Domain | OK. The wrong-code error and "Sending…" states are described in the note but not drawn |
| Onboard-2 → BB-1 (skip) / → Onboard-2b (Check now) → BB-1 | OK |
| BB-1 → Onboard-3-Sources → Onboard-3b → BB-2 | OK, **but the coverage map is skipped here** (see b) |
| BB-2 → BB-3 → Gate 1 → BB-4 → Gate 2 → BB-5 → BB-6 → Gate 3 | OK |
| Gate 3 → Coverage-Map → Onboard-6 (kit v1 registered) | Links work; the order is wrong (see b) |
| Coverage "Review sections first" | Goes to Brand-Build, which shows **aDNA's** kit, not Waterlily's |
| Onboard-6 "View on explorer" | Goes to Verify-1, which shows an ambassador post, not a kit registration |
| Onboard-6 "Write your first post" → **new draft** | **Missing.** It goes straight to Draft-Review, an existing aDNA draft. There is no brief or new-draft screen. "+ New draft" on Content-Dashboard and "New draft" on the empty state are buttons with no target |
| Draft-Review → **polish** | **Missing.** No Review, Shorten, Clarify or Beautify (still open from the first audit) |
| Draft-Review → **approve** | "Approve and schedule" goes back to Content-Dashboard. There is no publish step (connected X or LinkedIn, or copy and paste the URL back) and no "content registered" confirmation |
| approve → **verify** | **Missing.** No hop reaches Verify for a brand's own post. Verify-1 copy covers only "a piece … paid through Waterlily" |
| Brand-Build / Kit-Export "Claims" tab | **Broken:** points to `Claims.dc.html`, which does not exist |
| Dead anchors | `#calendar` (Content), `#s/#p/#r` tabs, `#snoozed/#done`, `#more` (Ledger), `#r` receipts. Acceptable for low-fi, but Calendar has no screen |
| "Save and finish later" on every intake step | Goes to Hub-Home, which is the aDNA hub. There is no Waterlily hub |

### Findings (new or still open, not fully covered by the first audit)
| # | Screen(s) | Issue | Sev | Fix |
|---|---|---|---|---|
| 1 | Onboard-3b, Coverage-Map, BB-Gate3 | **Coverage map is in the wrong place.** It comes after Gate 3. Architecture §2 (stage 4) and §12.1 (step 4) both put it after "Reading sources" and before the interview, because it decides which questions are asked. Canvas open question 1 says "the walkthrough puts it after intake", but §12.1 doesn't say that: both documents agree | High | Point Onboard-3b "Continue" and Ingest-Error "Continue without it" at Coverage-Map. Change its CTA to "Start the questions (N left)" → BB-2. After Gate 3, add a "Kit v1 summary / approve" screen, or reuse Brand-Build for Waterlily. Close open question 1 |
| 2 | Onboard-3b | "You can carry on with the next question while this runs" contradicts coverage-before-interview: the gaps aren't known yet | Med | Either wait for reading to finish (with "email me when done", as §12.1 step 3 says), or state that the origin questions are always asked and the coverage map updates live |
| 3 | Onboard-2 vs Onboard-6, Kit-RegisterFailed | Onboard-2 says that while a brand is unverified, "registering anything onchain … stay[s] off". Onboard-6 then shows the **Unverified** Waterlily kit "Registered on Solana". Architecture §12.1 allows unverified brands (flagged) and registers kit v1 at step 7 | High | Change the Onboard-2 copy: unverified brands can register a kit and posts, flagged "unverified domain"; only ambassador payouts (and the identity memo) need verification. Add the flag to the registration result and to Verify |
| 4 | Onboard-6 → Draft-Review → … | The demo chain has no new-draft or brief screen, no polish step, no brand publish step, no "content hash registered" success and no Verify result for a brand's own post | High | Add Create-NewDraft (brief, channel, voice) and Draft-Polish (or add polish to Draft-Review). Add Publish (connected X or LinkedIn, or paste URL back) and a Registered success screen that links to a Verify-1 variant for a brand post |
| 5 | Brand-Build, Kit-Export | Claims tab links to the missing `Claims.dc.html`. The claims screen was in the first audit's Missing list, and the link is now broken in a hackathon flow | Med | Draw Claims: a table of claim, evidence links, owner, expiry, status and register; add empty and error states |
| 6 | Amb-1/2/3/4/5c, M-1/2/4, Campaign-v2-1, Campaign-v2-2, Ledger, Dashboard | **USDC is paid per X post** (X post 5 USDC; "Post to X"; content plan "X posts (5 USDC)"; a Ledger payout row for an X post). The compendium §5 says "No rewards for X activity" (X's January 2026 ban, ADR-002), and the hackathon ambassador row says "off-X work" | High | Remove X from the payout formats and from "Who posts: Ambassadors" for X. Keep the paid formats to the LinkedIn post (check its rules first), the blog or tutorial, and docs. Replace the X example on Amb-5c with the blog or tutorial mismatch case |
| 7 | Influencer-Setup, Influencer-Queue, Voice-Templates, Voice-Editor | **Not SFW** (compendium §3.6). Captions such as "rewriting one kiss scene" and "favourite slow burn"; an "[adult-friendly platform]" channel; "[adult platform] 5" cap; a Suggestiveness dial. "Flirty exists as a template only" | High | Use SFW sample copy on the persona screens. Remove the adult-platform rows and the Suggestiveness dial. Show Flirty only as a gated template card |
| 8 | Influencer-Setup/Queue (nav "Ally Haire ▾") | The persona "represents Ally Haire" and the brand switcher shows Ally Haire. This conflicts with the decision to remove the founder from the demo brand lists (canvas open question 4) | Med | Decide: tie the persona to aDNA or Waterlily for the demo, or keep a separate "personal" workspace that is never shown in brand lists |
| 9 | Inbox ×3, Engage-Queue, Leads, Influencer ×2, all HACK boards | **Old and new tags are mixed.** 35 boards use HACK, STRETCH or EXP, which aren't in the canvas legend. SUPERSEDED is still used. The tags also disagree with the backlog: Inbox is STRETCH but should be COMING SOON; Engage-Queue is STRETCH but the backlog has the reply queue as HACKATHON | Med | Retag: HACK → HACKATHON; Inbox ×3 → COMING SOON; Engage-Queue → HACKATHON; Leads and Influencer → EXPERIMENTAL; ambassador screens → HACKATHON (one payout). Delete or park Onboard-4 and drop SUPERSEDED from the legend |
| 10 | Inbox ×3 | COMING SOON screens carry no in-product "coming soon" label, which the legend requires | Low | Add a "Coming soon" chip to the Inbox nav item and page headers |
| 11 | Voice-Editor title, Voice-Templates vs BB-6, Gate 3 | The canvas now **contradicts itself**: Gate 3 uses 8 dimensions plus a claims gate (the research 06 model); Voices still has 10 dials and 7 templates. Gate 3's "change them later in Voices" lands on the old model | Med | Rework Voices to 12 templates on 9 dimensions, as the first audit decided. Rename the board to drop "(10 dials)" |
| 12 | Engage-Rules, Amb-5a note, Campaign-Builder (parked) | Approval exceptions: opt-in auto-replies approved once; "manual-approval campaigns" implies auto-approve campaigns exist; auto-approve after verification (parked). Principle 1 says nothing sends without a person, and the open-creator program says "every payout is approved by a person" | Med | Remove the auto-approve options from the ambassador flows and keep a human "Approve and pay". Settle the auto-reply open question; the safe default is that every reply queues |
| 13 | Draft-Review, Content-Dashboard | Claims evidence isn't checked. The checks list "Banned claims: none" but no claims allow-list check (§12.3.5: only approved claims may state numbers) | Med | Add a "Claims: n on allow-list, 0 unsupported" check row with a block state |
| 14 | Coverage-Map | Governance is marked "Not asked; add later" (M). §4 makes Governance required, with the fallback "Owner = creator". The Waterlily 2023 legacy is shown as I, not E(legacy) (§9) | Low | Prefill Governance as answered (owner = creator). Add an E(legacy) badge to the legend |
| 15 | Coverage-Map, Brand-Build | There is no screen for §12.1 step 6 "Quick review" (beliefs, the values card sort, messaging pillars, vocabulary). "Answer 2 questions" buttons go nowhere | Med | Add a Quick-review screen (card sort plus list edit), or one generic "section questions" drawer |
| 16 | Brand-Build | Approved gates can be edited, but there is no **stale** state (§12.3.2: downstream sections are flagged stale and redrafted) | Med | Add a stale badge and a "redraft n sections" banner |
| 17 | Brand-Build | aDNA evidence cites "[aDNA X account: pinned post / recent posts]". Research 09 says aDNA has no social presence, and social ingest is coming soon | Med | Cite docs, site or changelog instead, or mark the source "coming soon" |
| 18 | BB-1/2/3 steppers, Onboard-3, Onboard-1/2, Coverage, Onboard-6 | Three different steppers: (Sign in, Domain, Intake 1–6, Coverage, Kit v1); (1 Basics … 6 Voice); (1 Basics, Sources, 2 Origin, …). The domain check sits before Basics, while §12.1 puts it inside step 2 Sources | Low | Use one stepper: Sign in › Basics › Sources › Coverage › Questions (Gates 1–3) › Kit v1 |
| 19 | Campaign-v2-1, Campaign-v2-2 | Steps 2 (Audience), 4 (Content plan), 5 (People and budget) and 6 (Review) aren't drawn. "Next: audience" jumps to step 3, and "Next: content plan" exits to Content-Dashboard. There's no launch state and no budget-over-balance error | Med | Draw steps 4–6 at minimum, with the cap-over-balance error and a launch success |
| 20 | Hub-Home, all hub nav | There's no Waterlily workspace, though Waterlily is the headline demo (first audit decided to add it to the switcher). The brand switcher is a static chip with no menu | Med | Add a Waterlily hub variant, or make the switcher show aDNA, Waterlily, film.fun and GamersLab |
| 21 | Verify-1/2/3 | Only post verification exists. There's no result for kit-hash, account ("is this account official?") or claim lookups (§7). "Report possible impersonation" has no target | Med | Add Verify result variants for a kit version, an official account and a claim, plus a report sheet |
| 22 | Content-Dashboard | Platform filters include Instagram, TikTok, Threads and Farcaster. The hackathon publish path is X, LinkedIn, or copy-paste | Low | Grey out the non-hackathon platforms with "coming soon" |
| 23 | Hub-Home | "Brand pack 80% complete" uses old naming; the kit is 17 sections with E/I/M | Low | Change it to "Kit v1 · 8 of 17 sections evidenced" |
| 24 | Amb-2, Amb-3 | Ambassador drafts are AI-generated and published in the ambassador's name. Sponsorship is disclosed, but AI assistance isn't | Low | Decide whether to add an optional "drafted with AI" disclosure. The principle only mandates it for personas |

### (e) Missing screens (product map §5, §12.1)
- **Claims with evidence** (Hackathon, thin). Two links to it are already broken.
- **Quests** (Coming soon). Compendium §4's demo story includes "run one paid quest (a tutorial about Waterlily)", but no Waterlily quest or campaign exists. Every ambassador screen uses aDNA.
- **Ambassador program, open to all creators** (Roadmap): bounties, brand-picked rewards, a performance pool with fraud checks, creator disclosure, no X rewards, no leaderboard. No screen yet.
- **Settings:**
  - publishing connections (X, LinkedIn, clipboard fallback)
  - AI model and bring-your-own key (OpenRouter default, Claude or OpenAI key, §12.4)
  - plan, seats and billing (ADR-003; Hub-Home already shows "Plan: [plan name] · 3 seats")
- **Create:**
  - new draft or brief
  - polish actions with accessible mode
  - publish for brand posts
  - Calendar
  - Campaign v2 steps 2 and 4–6
- **Brand:**
  - Quick review (step 6)
  - founder profile and perception audit (step 2a, proposed)
  - a final kit v1 summary for Waterlily
- **Ambassador:** "My posts", "Earnings" and Withdraw. All of them are nav targets with no screen.

### (f) Missing states per hub screen
| Screen | Empty | Loading | Error |
|---|---|---|---|
| Hub-Home | missing (new brand, nothing queued) | missing | missing |
| Inbox-All | missing (no sources or zero threads) | missing | via Inbox-Connect only |
| Inbox-NeedsReply | missing ("all caught up") | missing | missing (send failed) |
| Brand-Build | delegated to Coverage (all M) | delegated to Onboard-3b | missing (re-read failed, stale) |
| Voice-Templates / Voice-Editor | missing (no voices) | missing (preview rewriting) | missing (save failed) |
| Content-Dashboard | present | missing | missing (post or schedule failed) |
| Draft-Review | n/a | missing (slop check or polish running) | missing (claim blocked, publish failed, token expired) |
| Campaign v2 | n/a | missing (plan generating) | missing (cap above balance) |
| Engage-Queue | missing | missing | missing (account disconnected) |
| Partners | missing | n/a | missing (invite failed, no seats left) |
| Leads | missing | missing | missing |
| Influencer | missing | missing (stamping) | blocked card only |
| Dashboard (Ambassadors) | present | missing | missing (payout transaction failed) |
| Ledger | missing | missing | missing |
| Verify | not found present | missing | missing (URL unreadable) |
| Kit-Export | n/a | missing (zip building) | missing |
| BB-4, Gates 1–3 | n/a | described in a note, not drawn (drafting skeleton) | missing (draft failed) |
| Onboard-1, BB-1 | n/a | in note only | in note only (bad code, bad URL) |

### (g) Data in the UI with no source in the §3 data model (architecture gaps)
1. **No Draft, Post or Content entity.** Content-Dashboard, Draft-Review, Hub-Home and Analytics show draft text, channel, voice used, on-brand %, slop fixes, platform score, slot, status, approver and posted URL. §3 only has a Registration of type content. Verify-3 and Amb-5c show a similarity % or diff, which needs the approved text stored offchain.
2. **No Campaign, Ambassador, Submission or Payout entity.** Budget cap, slots, payout per format, the verification result (published, verified, approved, paid), the receipt, the ambassador's linked accounts ("different X account than on your profile") and balances all lack one.
3. **No User, Member, Wallet, Seat or Plan entity.**
   - "Approved by [owner email]" (Onboard-6)
   - "owner wallet" in the §7 identity memo
   - "3 seats" and "Plan" (Hub-Home)
   - partner seats (Partners)
   - "Assign" (Inbox)
   - the KitSection field `approved_by` has nothing to point to
4. **Registration fields are too thin for Verify-1.** §7 says a content registration carries the content hash, kit version and approver. §3 Registration has only type, hash, tx and at, so there are no fields for kit_version, approver, author, platform URL or campaign. Verify-1 shows all of these.
5. **Voice model mismatch.**
   - The Voices screens show 10 dials, including Irreverence and Suggestiveness.
   - They also show per-channel caps.
   - §3 Voice has 9 dimensions and no cap or content-policy field.
6. **Persona.** Influencer screens show name, avatar set, watermark status, disclosure flags and channels. §3 has only a Registration of type persona.
7. **Inbox entities.** Message, Thread, Contact, Label, reply targets, flag reason and source connection all lack one (Coming soon, but unmodelled).
8. **Engagement entities.** Mention, Rule, AutoReply, SuggestedList and posting windows all lack one.
9. **Lead entity** (Leads screen).
10. **Metrics and tracked links.** Analytics shows engagement, reach and clicks. Campaign-v2-2 says "tracked links we add to every post". There is no metric or link entity.
11. **Analytics data on hackathon screens.** Draft-Review's "your best X slot" and Engage-Rules' "suggested from your analytics" depend on analytics, which is on the roadmap. The backend has no data for these during the hackathon.
12. **Brand fields.** The 12-month goal and primary channel (BB-1) aren't fields on Brand. They are stored only as Evidence, per §12.2, which is fine if that's intended.
13. **Audience.** BB-5 collects 1–3 "real people (private, never contacted)". There is no field for them and no privacy flag.
14. **Evidence status.** It has no "legacy" value: the E(legacy) of §9 and BB-2's "That's right / Not quite" confirmation. Kit section state has no "stale" value (§12.3).
15. **Ledger consent rows and license fees** come from the parked licensing model, so there's no entity behind them.

### (h) Screens that depend on email-based embedded wallets
Research found that Phantom Connect is not accepting new app sign-ups and lists only Google, Apple and injected providers. Architecture §12.1 step 0 ("email and a 6-digit code … embedded wallet (Phantom Connect)") therefore cannot be built as specified. Affected screens:

| Screen | Dependency |
|---|---|
| Onboard-1-SignIn | Email OTP that creates an account and wallet ("nothing to install, no keys") |
| Main "Sign in", Verify/Ledger "For brands" | Enter through Onboard-1 |
| Onboard-2 / §7 identity memo | Needs an owner wallet |
| Onboard-6, Kit-RegisterFailed | Registration signer and fee payer unclear ("nothing was charged") |
| Draft-Review | Approval records the fingerprint onchain, so it needs a signer |
| Amb-2, M-2 (and note n-a2) | "Sign in with email to join" |
| Amb-1/3/4/5a-d, M-1/5 | USDC balance "in your Waterlily account", plus Withdraw |
| Dashboard | "Approve and pay" sends USDC from the brand's wallet |
| Campaign-v2-2 | "Spending cap approved once" needs a wallet approval or escrow |
| Lic-5, Lic-5b, Campaign-Builder (parked) | Waterlily balance and add funds |

**Fix (decide in P0):**
- **Registrations:** a server-side Registrar keypair signs memos and pays fees. This matches §2's "deterministic code"; the brand never signs.
- **Sign-in:** pick a provider that can be verified as available for new apps (Google or Apple login, or an alternative embedded-wallet SDK). Keep injected Phantom as the fallback.
- **Payouts and escrow:** model them separately.
- **Docs:** update Onboard-1, Amb-2 and M-2 copy and architecture §12.1 step 0 once the provider is confirmed.
