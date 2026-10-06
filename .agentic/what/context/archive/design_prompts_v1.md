---
type: prompts
status: superseded
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [design, prompts, wireframes, deck, archive]
superseded_by: pending (rewrite from compendium_2026_10_06 and the brand builder architecture)
---
> **Status: superseded.** Superseded; to be rewritten from the compendium and the brand builder architecture

# Waterlily for Brands: Claude Design prompts

Paste-ready prompts for Phase A (wireframes and user flows) and Phase B (pitch deck and brand style). Source of truth: issue #2 (PRD).

**How to use:**
1. Run **Prompt 1** (wireframes) first and review the flows.
2. Run **Prompt 2** (brand style) next.
3. Run **Prompt 3** (pitch deck) last, so the deck can use the chosen style.

Each prompt is self-contained, because Claude Design won't have this repo's context. Fill in anything in `[square brackets]` before pasting.

**Demo brands:** aDNA, Ally's personal brand, GamersLab, film.fun, and optionally one more. Get a written OK from each brand owner before showing their brand publicly. In the live build, each brand also has to add a DNS TXT record to prove control.

---

## Prompt 1: Wireframes and user flows

```text
Design low-fidelity wireframes and user flow diagrams for a web app called Waterlily (waterlily.ai). The goal is to validate the concept and flows, not the visual design. Use grayscale, simple boxes, real labels and realistic sample content. Do not use lorem ipsum or decorative styling. Desktop first, with a mobile version of the ambassador flow.

WHAT WATERLILY IS
Waterlily lets a brand turn its voice into a consented, verified "voice pack". Two things happen with that pack:
1. LICENSE: partners, agencies or integrators pay a small fee to generate content in the brand's voice (posts, blogs, tutorials, docs pages). The brand chooses where the fee goes: Paid (90% brand / 10% platform), Charity (90% to a cause / 10% platform), Split (custom), or Free (small cost fee only).
2. SPONSORED: the brand runs a campaign with a capped USDC budget. Community ambassadors generate on-brand content from a brief, publish it, the platform verifies the post, and the ambassador is paid in USDC automatically.
Every generated piece gets a content fingerprint recorded with its payment on the Solana blockchain, so anyone can check "is this brand-approved?" Users sign in with email (an embedded wallet is created for them); never show seed phrases or crypto jargon in the main UI.

USERS
- Brand owner: registers the brand voice, sets license terms, runs campaigns, approves content, views the ledger.
- Ambassador: picks a campaign, generates content, edits it, publishes, gets paid.
- Licensee: pays to generate content in a brand's voice and exports it.
- Public visitor: checks whether a piece of content is brand-approved.

SAMPLE DATA TO USE
Brands: aDNA (open standard for agentic project context), film.fun (AI filmmaking studio), GamersLab [one-line description], Ally Haire (personal brand: founder, engineer, writer).
Campaign example: "aDNA launch week". Brief: explain why agents need shared project context. Channels: X, LinkedIn, blog. Payout: 5 USDC per X post, 10 USDC per LinkedIn post, 50 USDC per tutorial. Budget: 500 USDC. Deadline: 7 days.
License example: film.fun voice pack, "Integration announcement" blog post, 2 USDC, Paid mode.

SCREENS (wireframe each, annotate key interactions)
1. Landing: value proposition ("Your brand's voice, licensed on your terms"), three entry points (I'm a brand / I'm an ambassador / I want to license a voice), and an "Is this official?" verify box where you paste text or a URL.
2. Brand onboarding, a 5-step wizard:
   a. Sign in with email.
   b. Prove brand control: show the DNS TXT record to add, with a "Check" button and a status.
   c. Add sources: website URL, docs URL, past posts, Substack. Upload files.
   d. Review the voice pack: editable sections for Voice and tone, Content pillars, Audience, Glossary (preferred and avoided terms), Banned claims, and Example excerpts. Show a pack version number.
   e. License terms: mode selector (Paid / Charity / Split / Free), price per format, cause picker for Charity/Split. Then "Sign and publish consent" with a success state showing the onchain receipt link.
3. Brand dashboard: voice pack summary and version, active campaigns with budget used vs remaining, recent licensed pieces, pending approvals, and earnings/spend totals.
4. Campaign builder: brief, channels, payout per format, total budget (shown as "spending cap", approved once from the brand wallet), deadline, approval rule (auto after verification vs manual).
5. Ambassador flow (desktop + mobile):
   a. Campaign list (brand, payout, time left, slots).
   b. Campaign detail (brief, rules, payout).
   c. Generate: choose format, add an angle, generate, then edit in an editor with a live "On-brand" meter that flags drift and banned claims.
   d. Publish: "Post to LinkedIn for me" (connect account), "Post to X" (or paste the URL after posting), or "Submit blog URL".
   e. Status: Verifying, then Approved, then Paid, with the amount and receipt link.
6. Licensee studio: pick a brand, then format (X post, thread, LinkedIn post, blog, tutorial, docs page), then brief, then a free preview paragraph, then Pay (show the split breakdown before paying), then the full piece with Copy and Export as Markdown, plus a provenance line.
7. Verify result page: input text or URL. Result shows Brand-approved (yes/no), brand, voice pack version, who generated it, where it was published, and payment receipt link. Include a "not found / not verified" state.
8. Public ledger: per brand, license income, campaign payouts and cause totals, plus a transaction list with receipt links.

USER FLOWS (diagram each as a flowchart with decision points and error states)
A. Brand onboarding (including DNS check failure and retry).
B. License purchase (including payment failure, and a preview without paying).
C. Sponsored post end to end: brief, generate, edit, publish, verify, approve, payout (including verification failed and budget exhausted).
D. Verify content (match found / no match / content edited from the original).

DELIVERABLES
- One wireframe per screen, plus key states (empty, loading, success, error) where relevant.
- The 4 flow diagrams.
- A one-page sitemap showing how screens connect.
- A short list of open UX questions you noticed while designing.
```

---

## Prompt 2: Brand style exploration

```text
Create a brand identity exploration for Waterlily (waterlily.ai), a product that lets brands license their voice to partners and pay community ambassadors to create on-brand content. Every piece is verified and paid on the Solana blockchain.

BRAND IDEA
The water lily: rooted, calm on the surface, and it blooms. Themes: consent, credit, trust, craft, voice. It should feel like a premium creative tool for brands, not a crypto casino. Avoid neon gradients, coins, rockets, laser eyes and generic "web3" visuals. The audience is brand and marketing leads, founders, and community creators.

HERITAGE
Waterlily.ai first launched in 2023 as ethical AI art: artists opted in and were paid each time someone generated in their style. This version applies the same principle to brand voice and text. The identity can nod to that lineage.

PLEASE PRODUCE 3 DISTINCT DIRECTIONS
For each direction:
- Name and a one-line rationale
- Logo direction (wordmark + simple mark), shown in light and dark
- Color palette: primary, secondary, neutrals, plus a success color for "verified/paid" and an error color, with hex values and contrast notes
- Typography: a heading font and a body font (free, web-available fonts), with a size scale
- Key UI elements: button styles, a "Verified" badge, a payment receipt chip, a brand voice-pack card
- One hero mockup: the landing page hero ("Your brand's voice, licensed on your terms")
- One slide mockup: a title slide for a pitch deck

Then recommend one direction and explain why it fits a B2B brand tool demoed to crypto investors.
```

---

## Prompt 3: Pitch deck

```text
Create a 12-slide pitch deck for Waterlily (waterlily.ai) for a startup hackathon judged by a venture fund (Colosseum, Solana track). Judges care about: product and execution, market size, novelty, how well it uses blockchain for great UX, open-source composability, and business viability. Use the Waterlily brand style [paste the chosen direction from the brand exploration: palette hex values, fonts, logo]. One idea per slide, minimal text, strong visuals. Include speaker notes for each slide, for a 2–3 minute pitch video.

SLIDES
1. Title: Waterlily. "Your brand's voice, licensed on your terms." waterlily.ai
2. Problem: brands can't scale their voice (partners and ambassadors write off-brand), ambassador programs are messy (who posted what, cross-border payouts, no shared record), and AI makes impersonating a brand cheap.
3. Insight: a brand voice can be captured as a verified "voice pack" without training a model; consent and control can be proven cheaply (domain proof plus an onchain consent record); and Solana makes tiny license fees and cross-border payouts instant and automatic.
4. Product overview: one voice pack, two money flows. LICENSE (partners pay to create in your voice, and you choose Paid, Charity, Split or Free) and SPONSORED (you set a capped budget, ambassadors publish verified on-brand posts and get paid in USDC).
5. How it works (diagram): brand registers voice → ambassador or licensee generates → content verified → payment splits onchain → anyone can verify.
6. Demo moments (3 screenshots, placeholders for now): voice pack review, ambassador "Verifying → Paid", the verify page "Brand-approved".
7. Why Solana: one atomic payment split for each license (brand / cause / platform); capped spending allowances so brands never prefund; global USDC payouts to ambassadors; a content fingerprint and receipt on every piece; email sign-in, so users never see a seed phrase.
8. Market: brand and community content programs. On Solana alone, Superteam Earn lists 2,520+ sponsors and 190,000+ talent, which shows the scale of paid community content. [Add any further market figures only from a verified source.]
9. Business model: 10% take rate on license fees and campaign payouts; a team SaaS tier later; later still, AI agents licensing brand voice per call.
10. Why us / lineage: built by Ally Haire, founder of Lilypad Network (decentralised AI compute) and creator of the original Waterlily.ai (2023 ethical AI art with artist royalties). Launch brands: aDNA, film.fun, GamersLab, Ally Haire.
11. Traction plan: 4 launch brands, a first ambassador campaign (aDNA launch week), metrics to show at demo day (paid verified posts, licensed pieces, ambassadors paid).
12. Close / ask: "Consent, credit and cash, for every piece of brand content." Contact and waterlily.ai.

RULES
- No invented statistics. Use only the figures given above and mark anything else as [placeholder].
- No crypto clichés (coins, rockets, moons).
- Keep each slide readable in 5 seconds.
```
