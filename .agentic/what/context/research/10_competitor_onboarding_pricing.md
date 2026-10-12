---
type: research
status: active
created: 2026-10-12
updated: 2026-10-12
last_edited_by: agent
tags: [research, competitors, onboarding, pricing, landscape]
---
> **Status: active.** Research input (2026-10-12). It updates [research 04](./04_brand_hub_landscape.md) with an onboarding and pricing review of 59 competitors, measured against JamJam's full build plan. Everything under "What JamJam should adopt" is **proposed**; only the owner ratifies.

# Competitor onboarding and pricing review

**Question.** For every product that competes with any part of JamJam, how does onboarding work, what does it cost, what does it do well, and what does it lack compared with JamJam's *full* build plan? Which parts should JamJam adopt, and where should it do better?

**Method.** Desk research on 2026-10-12. Sources were vendor pricing pages, help centres and docs, documented onboarding walkthroughs, changelogs, review sites (G2, Capterra, Trustpilot) and dated third-party reviews. No accounts were created. Every price and every onboarding step in the detail files has a source URL. Anything that could not be confirmed is marked **unverified**, with the reason. Third-party prices are labelled. Prices are USD unless marked.

**Detail files:** one per segment, with every competitor in the same structure: what it does, onboarding step by step, every pricing tier, what it does well, what it lacks (mapped to plan IDs), what to adopt, sources.

| Segment | Detail file | Competitors profiled |
|---|---|---|
| A. Brand build, voice and kit | [a_brand_build.md](./10_competitor_detail/a_brand_build.md) | 10 |
| B. AI social content "in your voice" | [b_ai_social_voice.md](./10_competitor_detail/b_ai_social_voice.md) | 11 |
| C. Social media ops suites, listening and leads | [c_social_ops.md](./10_competitor_detail/c_social_ops.md) | 8 |
| D. Web2 ambassador and creator payouts | [d_ambassador_payouts.md](./10_competitor_detail/d_ambassador_payouts.md) | 9 |
| E. Crypto-native community and creator pay | [e_crypto_community.md](./10_competitor_detail/e_crypto_community.md) | 8 |
| F. Provenance and "is this official" | [f_provenance.md](./10_competitor_detail/f_provenance.md) | 13 |

---

## 1. Summary

1. **No one runs the whole loop.** None of the 59 covers Build, Run, Prove and Pay. The most any covers is two legs: Pressmaster and Typeface (Build partly, Run yes), Later (Run, plus fiat creator pay as a separate business), Kaito Studio (Run partly, Pay), and Galxe and Numbers (Prove partly, Pay). This supports the competition slide's claim (slide 9 of the [pitch deck](../pitch_deck_2026_10_06.md)).
2. **Interview-led onboarding is no longer unique.** [ADR-002](../../decisions/adr_002_purpose_build_run_prove.md) and research 04 said no competitor runs strategy-first onboarding. That is now out of date:
   - Google Pomelli Agent builds a brand from scratch by chat (May 2026).
   - Branding5 runs a 7-question interview with AI-drafted answers.
   - Pressmaster runs a 15–30 minute guided brand and voice interview.
   - Supergrow, Edgar, Outerview and Meet Sona run voice interviews.

   **What is still unique:** keeping a fact only when its supporting quote is on the source page (B2), the Evidenced / Inferred / Missing coverage map (B3), and recorded who/when/why gates on the kit (B5). See [segment A](./10_competitor_detail/a_brand_build.md#segment-takeaways) and [segment B](./10_competitor_detail/b_ai_social_voice.md#segment-takeaways).
3. **Pressmaster is the closest Build-and-Run competitor.**
   - Setup: a 5-step onboarding checklist that pays out credits. Brand and voice each have three setup modes: URL, a 15–30 minute interview, or manual entry.
   - It has a "Content Twin" readiness score, publishes to 7 networks plus blogs, and runs background agents.
   - Pricing: a free tier, then $29 to $499 a month, metered in credits.
   - Direction: its docs say a trained Twin no longer needs every word reviewed. That is the opposite of JamJam's "a person approves everything" ([segment B](./10_competitor_detail/b_ai_social_voice.md#pressmasterai-httpswwwpressmasterai)).
4. **Encypher is the closest Prove competitor for text.**
   - It says it wrote the C2PA text-signing rules (published Jan 2026).
   - Verify is free, publisher signing is free, and AI-output marking costs $99–$4,000 a month.
   - It has no Build, Run, approvals, onchain ledger or Pay.
   - Its labels are invisible characters, which social platforms may strip (not verified per platform). JamJam's paste-text lookup against the ledger does not depend on those characters surviving ([segment F](./10_competitor_detail/f_provenance.md#encypher-new-not-in-assignment-the-closest-provenance-competitor-for-text-httpsencyphercom)).
5. **Approvals and AI replies are sold as upgrades everywhere.**
   - Approvals: Hootsuite only at $399 per user, Sprout from $299 per seat, Agorapulse multi-step only on Custom, Buffer from $10 per channel, Later from $37.50.
   - None checks claims against the brand's evidence, runs a slop pass, or records why something was approved ([segment C](./10_competitor_detail/c_social_ops.md#segment-takeaways)).
6. **Paying ambassadors is common; proof is not.**
   - Approval before payout is standard.
   - No core platform auto-inserts FTC disclosure: impact.com and Valen Sentinel only detect it.
   - No platform publishes a public record of what was approved and paid.
   - Ambassador complaints cluster on payouts (Club, SocialLadder) and on "was I ever paid" (a third-party audit of Superteam Earn) ([segment D](./10_competitor_detail/d_ambassador_payouts.md#segment-takeaways), [segment E](./10_competitor_detail/e_crypto_community.md#segment-takeaways)).
7. **X's January 2026 ban reshaped crypto creator pay.**
   - Cookie shut down Snaps; Kaito replaced Yaps with Kaito Studio; Wallchain moved to curated campaigns.
   - Kaito's open contest mode (Katalyst) now runs under a data agreement with X.
   - Galxe and Zealy still sell paid X tasks; whether that complies with X's rules is unconfirmed.
   - JamJam's curated, off-X, per-piece payouts (Y2, Y3) match where the market moved ([segment E](./10_competitor_detail/e_crypto_community.md#context-xs-january-2026-policy-on-paying-for-posts)).
8. **Pricing has moved downmarket in 2026.**
   - Sprout added a $79 tier, Hootsuite a $99 tier, and GRIN went self-serve with a free plan.
   - Agorapulse dropped its free plan and Copy.ai dropped its free plan.
   - No-card trials are the norm: Hootsuite, Sprout, Buffer, Agorapulse, Blaze, WRITER, Pressmaster, GRIN.
   - Card-at-trial products carry the worst review scores: Taplio has 2.1 on Trustpilot and Later has 1.3.
9. **Watch-outs.**
   - Hypefury and Later dropped X publishing entirely, which is a risk for R4.
   - Story Protocol pivoted away from creator IP in June 2026, which suggests "prove" alone doesn't sell. Keep it a feature inside the paid product, as in [ADR-003](../../decisions/adr_003_superhub_business_model.md).
   - A JamJam fee on USDC payouts will be compared with Superteam Earn's 0% commission and Roster's "no take rate".

---

## 2. Baseline: JamJam's full build plan

Every "lacks" entry is measured against these IDs, which cover live and coming-soon scope. Sources: [PRD (issue #2)](https://github.com/DeveloperAlly/solana-hack/issues/2), [mission_ui_build.md](../../../how/missions/mission_ui_build.md), [ADR-002](../../decisions/adr_002_purpose_build_run_prove.md), [ADR-003](../../decisions/adr_003_superhub_business_model.md), [ADR-006](../../decisions/adr_006_wallet_identity_split.md), [ADR-007](../../decisions/adr_007_pitch_positioning.md), [research 04](./04_brand_hub_landscape.md).

| ID | Plan item |
|---|---|
| **Build** | |
| B1 | Guided brand-builder intake: about 15 minutes of owner time, 6 steps, skip / save and resume, progress indicator |
| B2 | Ingests the brand's own site and sources; a fact is kept only if its supporting quote is on the page |
| B3 | Coverage map (Evidenced / Inferred / Missing per kit section); the interview skips questions the sources already answer |
| B4 | Brand kit: purpose, positioning, audience, voice, origin, messaging |
| B5 | Three human approval gates, recording who, when and why |
| B6 | Kit versioning and export (aDNA zip) |
| **Run** | |
| R1 | Voice templates and editor; drafts in the brand voice |
| R2 | No-AI-slop pass, claims gate (claims need evidence), voice-fit and platform scores, reversible polish |
| R3 | Human approval before anything publishes or sends |
| R4 | X and LinkedIn publishing (coming soon), tokens kept server-side |
| R5 | Reply queue: draft-and-approve replies, no auto-replies |
| R6 | Unified inbox (Telegram, WhatsApp, socials) with a needs-reply view (coming soon) |
| R7 | Lead finder (coming soon) |
| R8 | Disclosed, registered AI persona (experimental) |
| R9 | Analytics (coming soon) |
| **Prove** | |
| P1 | Kit version registered on Solana (SAS, hashes and ids only) |
| P2 | Approved posts, official accounts, claims and personas registered |
| P3 | Public Verify page (paste text or URL: official / edited / not found) and public Ledger |
| P4 | Email sign-in, no wallet or seed phrase; brands never sign registrations |
| **Pay** | |
| Y1 | Ambassador campaigns: brief, formats, payout per approved piece, capped budget |
| Y2 | Curated, invited ambassadors; FTC disclosure auto-inserted; approval stored as a compliance record |
| Y3 | USDC payouts per verified off-X piece (blog, tutorial, docs, LinkedIn); no paying for X posts |

---

## 3. Master table: all competitors

**Loop** = Build · Run · Prove · Pay (Y yes, P partly, N no). **Entry price** is the lowest paid or free tier on the vendor page on 2026-10-12, unless labelled. Full tiers, onboarding steps and sources are in the detail files.

### A. Brand build, voice and kit ([detail](./10_competitor_detail/a_brand_build.md))

| Product | What it does | Entry price | Onboarding in one line | Does well | Lacks vs full plan | Loop |
|---|---|---|---|---|---|---|
| [Jasper](https://www.jasper.ai/pricing) | Marketing AI with a brand knowledge layer (Brand Voice, Knowledge, Audiences, Style Guide) | Pro $59/seat/mo annual ($69 monthly); Business by quote | 7-day trial, card required; up to 8 examples (text, file, URL) produce a voice, previewed with and without the voice | Multi-source voice input; side-by-side with/without preview; voice shown as an editable description; 4.8/5 from 1,855 Capterra reviews | No interview or strategy kit (B1, B4); no cited facts or coverage (B2, B3); preview, not gates (B5); reviewers report hallucinated facts (R2); no publishing (R4); no Prove or Pay | P · P · N · N |
| [WRITER](https://writer.com/plans) | Enterprise AI agent platform with voice profiles, style guides and a Knowledge Graph | Starter price not shown on vendor page (third party: $29–39/user); Enterprise by quote | 14-day trial, no card; paste 300–500+ words of samples into up to 8 boxes, get a voice profile, test, save | Inline citations in Knowledge Graph answers; a "grounding level" control; honest minimum sample size | Citations not applied to a brand kit (B2); no interview, no URL voice (B1); no gates or versioning (B5, B6); no publishing; no Prove or Pay | P · P · N · N |
| [Copy.ai](https://www.copy.ai/prices) (now Fullcast) | GTM chat and workflow platform with Brand Voice and Infobase | Chat $24/mo annual ($29 monthly); Growth $1,000/mo | No free plan since Feb 2026; card at checkout; one URL or one sample becomes a voice in about 4 clicks | Fastest voice setup; unlimited voices; "#" to pull a stored fact into a prompt | No kit, evidence, gates or claims check (B1–B6, R2); moving into RevOps; no Prove or Pay | P · P · N · N |
| [Typeface](https://www.typeface.ai/product/brand-agent) | Enterprise brand rules (Arc Graph) plus content agents | Not published (third party: six-figure contracts) | Demo only; brand books become structured rules, approved one rule at a time, with linting | Approval per extracted rule; linting for contradictions; "rule fired, because" explanations; human approval before publish; rules exported over MCP | Assumes existing brand books (B1, B2); no coverage map (B3); enterprise only; no Prove or Pay | P · Y · N · N |
| [Google Pomelli](https://blog.google/technology/google-labs/pomelli/) | Free Labs tool: "Business DNA" from a site, uploads or chat, then campaigns, brand book and website | Free (beta) | Google sign-in; three routes (URL, upload, chat with Pomelli Agent); review the DNA; generate and download | Three routes into one profile; one-click brand book and website; free with Google distribution | No evidence or coverage (B2, B3); no gates (B5); downloads only, no publishing (R4); Labs product, could be withdrawn; no Prove or Pay | Y · P · N · N |
| [Frontify](https://www.frontify.com/en/pricing) | Brand guidelines portal and DAM with an AI assistant and MCP | Quote only, billed per monthly active user | Sales-led; the customer builds guidelines by hand with Customer Success | Assistant answers link to the guideline section; viewers and partners free (MAU billing); MCP server | No AI brand building (B1, B2, B4); no drafting or publishing (R1–R5); no Prove or Pay | P · N · N · N |
| [Canva](https://www.canva.com/pricing/) | Design platform with Brand Kit Builder (from URL or PDF), brand voice and design approvals | Pro $144/yr; Business $250/yr per person | Trial, card optional; URL (near-instant) or guidelines PDF (about a minute) fills the kit; review and save | Fast extraction from URL or PDF; approval enforced before publish or download; 5 to 1,000 kits by tier | Voice is a 500-character text field (B4); no evidence (B2, B3); approvals cover designs, not the kit (B5); no claims gate (R2); no Prove or Pay | P · P · N · N |
| [Blaze](https://www.blaze.ai/pricing) | SMB marketing autopilot: brand kit from URL, then planned and published content | Starter $79/mo; Growth $149/mo | 7-day trial, no card; URL scan, wizard of confirm screens, connect channels, campaign; about 20 minutes to a week of posts (reviewer) | Confirm-screen wizard; voice as add/remove traits; broad publishing; optional approvals | No interview or strategy kit (B1, B4); no cited facts (B2); approval optional (R3); quality complaints (R2); no Prove or Pay | P · Y · N · N |
| [BrandWell](https://brandwell.ai/pricing/) | Pivoted to intent data, SEO content and outreach | SocialStreams $99/mo | Not documented (unverified) | X and LinkedIn listening (relevant to R7 only) | No longer a brand-build product | N · P · N · N |
| [Branding5](https://branding5.com) | AI brand strategy report from a 7-question interview plus website | $147 one-time (Capterra figure); agency $399/mo | 7 questions with "Help me with AI" pre-filling answers from the site; review ICPs, values, archetype; get the report (about 30 minutes) | Closest match to B1+B4; AI pre-fill but origin and goals stay human; "Brand Check" scores assets on 7 dimensions | No quote shown for pre-filled answers (B2); no coverage map (B3); no gates (B5); report only, no drafting or publishing; no Prove or Pay | Y · N · N · N |

### B. AI social content "in your voice" ([detail](./10_competitor_detail/b_ai_social_voice.md))

| Product | What it does | Entry price | Onboarding in one line | Does well | Lacks vs full plan | Loop |
|---|---|---|---|---|---|---|
| [Pressmaster.ai](https://www.pressmaster.ai/pricing) | Thought-leadership platform: brand and voice identity, AI interviews, Content Twin, agents, publishing to 7 networks, blogs and a newsroom | Free ($10 one-time credits); Starter $29/user/mo ($21.75 annual); up to Partner $499; Enterprise by quote. Some tiers conflict on its own pages | No card; 5-step checklist that pays credits: connect channels, set up identity (URL / 15–30 min interview / manual), switch on agent, train Twin to "IQ 100", publish 7 pieces | Three setup modes; voice, text or video interviews with memory, shareable with others; readiness score; agent approval rules; "Narrative" analytics backed by posts | No quote-cited facts (B2); Twin IQ measures volume, not evidence (B3); no named kit gates or versioning (B5, B6); no claims gate (R2); leans to autonomy (R3); no inbox (R6); no Prove or Pay | P · Y · N · N |
| [Supergrow](https://www.supergrow.ai/pricing) | LinkedIn content with an AI interviewer (PostCast) and "Content DNA" | Pro $39/mo; Teams $199/mo | Connect LinkedIn; paste 10+ posts; DNA in about 30 seconds; a 30-minute interview gives 3 drafts | Interview becomes a reusable analysis (quotes, ideas, transcript); hook picked from your own words; interviews pushed to teammates by no-login link; trial pauses instead of charging | Personal style, not a cited brand kit (B2, B4); approvals only on Teams (R3); LinkedIn only (R4); no claims gate; no Prove or Pay | P · Y · N · N |
| [Taplio](https://taplio.com/pricing) | LinkedIn growth suite: AI writing, viral library, scheduling, outreach | Starter $39/mo (no AI); Growth $69/mo | Chrome extension; post history imported automatically; trial needs a card per its help centre | Zero-effort voice capture with an editable profile; drafts compared with your own average; nothing publishes until you do | No brand kit or evidence (B1–B4); output called generic (R2); auto-DM and auto-connect automation (R5); depends on the extension; no Prove or Pay; 2.1 on Trustpilot | N · Y · N · N |
| [Typefully](https://typefully.com/pricing) | Writing-first scheduler with an AI writing assistant | Free; Creator $99/yr; Business $18/mo per social set (third-party read, page renders client-side) | Sign up, connect a social set, optionally add samples and a style guide, write, schedule | Best editor and previews; persistent voice rules ("no em-dashes"); "in review" calendar state | No kit or gates (B1–B6); approval is optional review (R3); no claims gate; no Prove or Pay | N · P · N · N |
| [Hypefury](https://hypefury.com/pricing/) | Creator scheduler and engagement automation | $6/channel/mo; Full $19/mo | 7-day trial, no card; connect channels. Current flow largely undocumented | Cheap per-channel pricing; ghostwriter and VA seats | Dropped X entirely; minimal AI; auto-DMs (R5); no kit; no Prove or Pay | N · P · N · N |
| [Tweet Hunter](https://tweethunter.io/pricing) | X growth suite: viral library, AI writer, CRM, auto-DMs | Discover $29/mo (no AI); Grow $49/mo; Enterprise about $200/mo (third-party reads) | Connect X; 7-day trial; step detail unverified | Deep X tooling; a "ghostwriting mode" where the principal approves | X only; generic AI (R2); auto-DMs (R5); no kit; no Prove or Pay | N · P · N · N |
| [Kleo](https://kleo.so/pricing) | LinkedIn AI writer bundled with coaching and community | $99/mo; $999/yr | No trial; 7-step getting-started (knowledge base, style, identity, templates, chat, publishing); step inputs unverified | Method plus tool (30-day challenge, coaching); persistent memory | No evidence or gates (B2–B6); LinkedIn only; weak analytics; no Prove or Pay | P · P · N · N |
| [Contentdrips](https://contentdrips.com/pricing) | AI carousels and graphics with a visual brand kit | Free (50 credits); Starter $15/mo; Pro $26/mo (page inconsistent) | Upload brand kit, generate, schedule ("under 2 minutes", vendor claim) | Visual output; many brands per plan at low cost | Visual kit only (B4); no approvals or claims gate; no X; no Prove or Pay | P · P · N · N |
| [Edgar](https://edgarwrites.ai/pricing) | Weekly 10–15 minute voice interview producing LinkedIn posts | $49/mo; Pro $89/mo | Import LinkedIn posts, free intro session, weekly conversation, approve, auto-publish via official API | A clear weekly ritual; explicit approve-then-publish | No kit or evidence; LinkedIn only; no claims gate; no Prove or Pay | N · P · N · N |
| [Outerview](https://outerview.app/pricing) | 15-minute AI voice interview producing LinkedIn posts, with anti-slop rules | Free (1 interview/mo); €49/mo; €99/mo | 15-minute call, generate, review in dashboard | Bans 50+ AI-speak patterns; shows a voice-match score on every post | No kit or claims gate; LinkedIn only; no Prove or Pay | N · P · N · N |
| [Meet Sona](https://meetsona.ai/) | Voice interviews producing LinkedIn posts | $20/mo to $165/mo Team; $399 done-with-you launch | First interview to first post in about 10 minutes (vendor) | Fastest documented first post; transcript handed back | No kit or claims gate; LinkedIn only; no Prove or Pay | N · P · N · N |

### C. Social media ops suites, listening and leads ([detail](./10_competitor_detail/c_social_ops.md))

| Product | What it does | Entry price | Onboarding in one line | Does well | Lacks vs full plan | Loop |
|---|---|---|---|---|---|---|
| [Hootsuite](https://www.hootsuite.com/plans) | Social suite (renamed "Social OS" in June 2026): publishing, inbox, listening, Wisdom AI agent | Standard $99/user/mo annual; approvals only on Advanced $399; no free plan | 14-day trial, no card; connect at least 3 accounts; demo reports with sample data | WhatsApp in the inbox; AI Smart Replies; brand voice learned from past posts (beta); Talkwalker listening; MCP connectors | No kit or evidence (B1–B4); approvals at $399 (R3); no slop or claims gate (R2); no Telegram (R6); no Prove or Pay; 1.3 on Trustpilot | P · Y · N · N |
| [Sprout Social](https://sproutsocial.com/pricing/) | Premium social suite with Smart Inbox, reporting and the Trellis AI agent | Essentials $79/seat annual (no inbox); approvals from Professional $299 | 30-day trial, no card; connect a profile, answer a goals question, dashboards with demo data | Multi-step approvals (any or all approvers, auto-expire); WhatsApp inbox; reporting | No brand voice beyond 4 tones (R1); no approval reports, bulk approve or revoke; no claims gate; no Telegram; no Prove or Pay | N · Y · N · N |
| [Buffer](https://buffer.com/pricing) | SMB and creator scheduler with a community inbox | Free (3 channels, AI and inbox included); $5/channel/mo annual; approvals at $10/channel | No card; connect a channel, set times, draft with AI, schedule | Most generous free tier; AI-generated-content disclosure toggle; per-channel pricing; API on every plan | No kit (B1–B6); approvals only on Team; inbox covers comments only, no DMs (R6); a reviewer found a false claim in an AI draft (R2); no Prove or Pay | N · Y · N · N |
| [Later](https://later.com/pricing/) | Visual scheduler plus a separate influencer and affiliate business | Starter $18.75/mo annual; approvals from Growth $37.50 | 14-day trial, card at checkout (per help centre); connect profiles, plan visually | Instagram grid preview; approvals with external commenting at a low tier; Link in Bio; creator payouts business | No X publishing since 2025 (R4); inbox in beta (R6); no kit or claims gate; fiat creator pay, separate product (Y3); 1.3 on Trustpilot | N · P · N · P |
| [Agorapulse](https://www.agorapulse.com/pricing/) | Social suite for agencies with a wide inbox and ROI reporting | Standard $79/user/mo annual; free plan removed 2026-07-06 | 30-day trial, no card; 3-page wizard includes a website field; "Organization AI Context" from website, tone and competitors | Brand context generated from the website with a "Source used" view; context overrides users' prompts; inbox includes Reddit | Context is free text without quotes or coverage (B2, B3); multi-step approvals and AI replies only on Custom (R3, R5); no Telegram or WhatsApp; no Prove or Pay | P · Y · N · N |
| [Octolens](https://octolens.com/pricing) | AI listening and buy-intent monitoring for developer brands | Pro $159/mo annual | 7-day trial, no card; company context filled from website, 4 suggested keywords, about 2 minutes | URL to context to keywords in minutes; strongest on Reddit, GitHub and Hacker News; MCP | Listening only (B, R1–R5); no Prove or Pay | N · P · N · N |
| [Common Room](https://www.commonroom.io/pricing/) | Signal-based GTM and community intelligence (Zoom agreed to acquire it on 2026-07-02) | Essential $2,500/mo annual | Demo, sales-led implementation within about a week; connect sources (no Telegram) | Merges member activity into one profile; superfan scoring; real DevRel workflows | No publishing or kit; finds superfans but cannot pay them (Y1–Y3); out of price range | N · P · N · N |
| [Syften](https://syften.com/pricing) | Keyword alerts across communities and the web | $29.95/mo | 14-day trial, no card; automated setup researches company and competitors; backfilled mentions on day one | Cheapest credible lead finder; shows past mentions immediately | Alerts only; no LinkedIn; no Prove or Pay | N · P · N · N |

### D. Web2 ambassador and creator payouts ([detail](./10_competitor_detail/d_ambassador_payouts.md))

| Product | What it does | Entry price | Onboarding in one line | Does well | Lacks vs full plan | Loop |
|---|---|---|---|---|---|---|
| [Roster](https://www.getroster.com/pricing) | Ambassador, affiliate and UGC programs for Shopify DTC brands | Starter $599/mo flat; higher tiers $1,199 and $2,299 (Shopify listing) | Demo; create program, recruitment form, discounts, a pre-filled Welcome Campaign, commission | Welcome Campaign gives every new ambassador a first task; auto or manual approval per requirement, with a trusted-ambassador whitelist; payout amount locks on publish; no take rate | No kit or AI drafting (B, R1, R2); no disclosure insertion (Y2); fiat only (Y3); no public proof (P3) | N · P · N · Y |
| [Club](https://club.co/pricing) (formerly Brandbassador) | Gamified ambassador platform with a consumer app | Quote only (third party: about $2,000/mo plus onboarding fees) | Demo, Shopify app, recruit, missions from 100+ templates; ambassadors sign in socially with no follower minimum | Ambassador app rated 4.8 from 767 ratings; mission templates; open vs closed missions | Payout disputes reported; no disclosure (Y2); no USDC; no public proof | N · P · N · Y |
| [BrandChamp](https://www.brandchamp.io/pricing) | Points-and-rewards ambassador programs with a branded app | Launch $520/mo (Shopify listing), plus per-ambassador overage | 8-step quick start; ambassadors apply, are approved, register | Approval per task with rejection reasons and resubmission; ambassadors pick their own real post via social login; clear overage pricing | New ambassadors land on an empty screen; cash payout rail undocumented; no disclosure; no proof | N · P · N · P |
| [SocialLadder](https://socialladderapp.com/) | Mobile-first ambassador management, including campus and events | Quote only (third party: from just under $2,000/mo) | Demo, setup fee, 10–14 day onboarding with templates | AI pre-review of submissions before human review; offline activity tracking | Reports of missed posts and payout issues; no disclosure; no proof | N · P · N · P |
| [CreatorIQ](https://www.creatoriq.com/) | Enterprise creator marketing suite with global payouts (CreatorIQ Pay) | Quote only (third party: about $30k–60k/yr) | Annual contract; about 2 months to implement (G2) | Approve-then-release payouts in 60+ currencies; bulk approval next to performance; adaptive brand-safety AI | Private audit trail only (P3); no claims gate; no disclosure insertion; no USDC; priced for enterprise | N · P · N · Y |
| [GRIN](https://grin.co/pricing/) | Creator CRM with gifting, affiliate and payouts, plus the "Gia" AI agent | Free (no card); Starter $200/mo, month-to-month | Free plan with no sales call; one-click Shopify; daily briefing desk; 30-day Starter trial | Self-serve free tier; "agent prepares, human approves"; PayPal payouts with 1099s | Social only, no blogs or docs; no disclosure; no proof; no USDC | N · P · N · Y |
| [Aspire](https://www.aspire.io/) | Creator marketplace with briefs, content approval, seeding and payouts | Quote (Capterra: from $2,499/user/mo; third party: about $2,000/mo, annual) | Demo, 12-month contract, Shopify; send a structured brief that the creator acknowledges | Best brief structure (deliverables, guideline checklist, usage rights, terms); change requests per guideline; transparent fees (creator gets 100%, brand pays 2% plus processing) | Disclosure left to the brand's own PDF (Y2); auto-approves after 3 days (conflicts with R3); USD PayPal only | N · P · N · Y |
| [Valen Sentinel](https://www.capterra.com/p/10038429/Valen-Sentinel/) | Collaboration workspace with an AI FTC disclosure checker | $99/mo flat | Invite-only; paste a URL or upload a video for a compliance score | Creators can self-audit disclosure before posting; audit history | Scores disclosure, does not insert it; no reviews yet; no kit or proof | N · P · P · P |
| [impact.com](https://impact.com/influencer/navigating-influencer-marketing-compliance) | Enterprise partnership platform with creator workflows | 2.5% of partner sales (third-party figure) | Not researched in depth (unverified) | Flags live posts with missing disclosure | Detects after posting rather than inserting before; no kit or proof | N · P · N · Y |

### E. Crypto-native community and creator pay ([detail](./10_competitor_detail/e_crypto_community.md))

| Product | What it does | Entry price | Onboarding in one line | Does well | Lacks vs full plan | Loop |
|---|---|---|---|---|---|---|
| [Kaito Studio](https://studio.kaito.ai/brands) | Curated creator marketplace that replaced Yaps; modes are Katalyst (open contest), Select and Partner | Sales-led; Katalyst token-launch (TGE) campaigns charge no service fee, with 80% of the pool to creators and 20% to stakers | "Work with Kaito" form, then sales-led matching; creators quote, sign with the brand, submit URLs; Kaito pays | Licensed X data and an X data agreement; attribution to clicks and sign-ups; pays every creator for the brand; publishes CPMs | Still pays for X posts (opposite of Y3); no brand kit or claims gate; self-custodial wallets required | N · P · N · Y |
| [Galxe Business+](https://help.galxe.com/en/articles/11568587-business-overview) | Onchain quest, points and credential platform | Basic $0 with a 300 USDT/USDC deposit; Essentials $999/mo annual | EVM wallet sign-in, choose a plan, pay a deposit, create a Space, build quests from templates | Bot detection with real / suspicious / bot labels; broad credentials; a free tier secured by a deposit instead of a card | Wallet login required (P4); open quests, not curated (Y2); paid tweet tasks (Y3, X-policy risk); proves actions, not content | N · N · P · Y |
| [Zealy](https://zealy.io/pricing) | Community quest and leaderboard platform | Free (100 members, no card); Standard $149/mo annual | Create community, modules and quests, rewards (including USDC), publish | Shows the live credit cost per claim before publish; USDC locked when the quest is created; AI review; a free plan with no time limit | Paid X tasks (Y3); open, not curated (Y2); no kit; no proof | N · N · N · Y |
| [Layer3](https://layer3.xyz/) | Onchain activation (quest) marketplace with CUBE credentials | 12+ month L3 token stake (amount unverified) | Create Space, 2FA, stake L3, create an Activation, submit for curated review (live in 24–48 hours) | Completion proven onchain by credential; curated review with published refusal criteria | Proves user actions, not content (P3); wallet and stake required (P4); no content workflow | N · N · P · P |
| [Superteam Earn](https://superteam.fun/earn/sponsor/) | Solana bounty, freelance and grant marketplace | 0% commission, no listing fee | Sponsor profile, brief in under 2 minutes, publish, review, pay winners | Fast free setup; rate card per content type; 150K talent claimed; API for agents | Winner-takes-all bounties; no public record of payments (third-party audit); no disclosure; no kit | N · N · N · Y |
| [Wallchain Select](https://wallchain.xyz/) | Former InfoFi leaderboard, now managed creator campaigns | Sales-led; observed budgets $10k–30k | Contact by Telegram, share ICP, get a shortlist, campaign funded before launch | Look-alike audience matching; funding secured before launch | Built around paid X posts (Y3); no kit; no proof | N · N · N · Y |
| [Cookie Snaps](https://docs.cookie.community) | InfoFi mindshare campaigns, **shut down 2026-01-16** | n/a | n/a | Lesson: an Enterprise X API customer still had to close | Discontinued | N · N · N · N |
| [Earnout](https://earnout.dev/) | Solana escrow paying influencers per retained user (devnet beta) | No fee (vendor) | Set price and stay period, fund escrow in one transaction, influencers prove their X account | Program-enforced budget cap and refunds; every dashboard number backed by a transaction | Pays per referred user, not per content piece; wallets required; devnet only | N · N · P · Y |

### F. Provenance and "is this official" ([detail](./10_competitor_detail/f_provenance.md))

| Product | What it does | Entry price | Onboarding in one line | Does well | Lacks vs full plan | Loop |
|---|---|---|---|---|---|---|
| [Adobe Content Authenticity / C2PA](https://contentcredentials.org/verify) | Signed Content Credentials on media, with a free public verifier | Free (app in beta) | Adobe ID, connect socials, optional LinkedIn identity check, upload up to 50 JPG/PNG, download signed files | Credentials recoverable after stripping (watermark plus fingerprint); verify with no account for 16 formats; LinkedIn shows a "Cr" pin | App signs no plain text (P2); no paste-text verify (P3); no official-account registry; no Build, Run or Pay | N · N · Y · N |
| [Encypher](https://encypher.com/pricing) | C2PA signing and verification for text, media and documents | Verify free; publisher signing free; Mark Starter $99/mo, up to $4,000/mo | Free account, name the signing organization, prove the domain, connect WordPress/Ghost/API, sign at publish | Plain-text provenance that survives copy-paste; separate verify results per proof type; domain proof before your name shows | Invisible characters may be stripped on social (not verified per platform); no approvals or claims gate; no onchain ledger (P1); no Build, Run or Pay | N · N · Y · N |
| [Numbers Protocol](https://captureapp.xyz/pricing/) | Onchain media provenance (C2PA plus Numbers chain) with a similarity-search verify engine | $0.001 per sign pay-as-you-go; Basic $20/mo | Account, 2 free credits, upload, add caption and license, register (2–3 minutes) | Public asset profile per item with a version history; close-match search survives re-uploads | Text unverified; token and wallet friction (P4); no approvals; no Build, Run | N · N · Y · P |
| [Truepic](https://www.truepic.com/pricing) | Authenticated capture for insurance and lending inspections | Flex $1,000/mo minimum | Demo only, no sandbox | Device-integrity checks; results returned as structured findings | Not a brand tool; no public verify for posts | N · N · P · N |
| [Story Protocol / DATA Foundation](https://portal.story.foundation/) | Onchain IP registry; **pivoted to AI training data on 2026-06-25** | Gas only | Email/Google sign-in with embedded wallet, upload media, choose licenses, register | Web2-style sign-in; license presets | Permissionless (anyone can register for anyone); no text; no verify by paste; pivoted | N · N · P · P |
| [Solana Attestation Service](https://attest.solana.com/) | Permissionless attestation protocol (what JamJam's P1 and P2 build on) | No protocol fee documented; rent per attestation unverified | Developer SDK only | Separates issuer, schema and claim; expiry and revocation built in | No consumer verify UX; **no brand-content app found in its ecosystem** | N · N · P · N |
| [Ethereum Attestation Service](https://attest.org/) | Permissionless attestations with public explorers | Gas (onchain) or free (offchain) | Pick schema, fill fields, sign with a wallet | Linked attestations (refUID): journalist attests, then editor approves | No product layer; wallet required | N · N · P · N |
| [Farcaster / Lens verification](https://farcaster.xyz) | Decentralised-social account badges | Free | Connect socials and meet thresholds (thresholds unverified) | Low-friction badge from existing social proof | Account-level only; not brand or per-post | N · N · P · N |
| [X Premium Business](https://techcrunch.com/2025/10/07/x-splits-verified-organizations-into-premium-business-and-premium-organizations/) | X's gold check plus affiliate badges (formerly Verified Organizations) | $200/mo; Full Access $1,000/mo plus $50/mo per affiliate (secondary sources citing X's help page) | Apply, pay, pass review, invite affiliates | The recognised official-account signal; affiliates tie people to the brand | X only; no per-post proof; costly per affiliate | N · N · P · N |
| [Doppel](https://www.doppel.com/product/brand-protection) | Impersonation detection and takedown | Quote only | Sales-led | Stated median takedown under 10 hours; covers Telegram and Discord | Reactive only; no positive "this is official" registry; enterprise pricing | N · N · P · N |
| [ZeroFox](https://www.zerofox.com/pricing/) | Digital risk protection and takedowns | Quote only (bundles by brands, domains and takedowns) | Sales-led, three guided steps | Billing by named units; only successful takedowns count | Reactive only | N · N · P · N |
| [BrandShield](https://aws.amazon.com/marketplace/pp/prodview-i5lv242xkd6no) | Brand protection and anti-phishing | $22,000 per year (AWS Marketplace SKU) | Demo, account manager, supply trademarks | Approve before takedown, so licensees aren't removed | Reactive only | N · N · P · N |
| [Fox Verify](https://www.verifymedia.com/) | Onchain article and image signing for publishers | Not published | Publisher pipeline, no self-serve | Proven pattern: register the article hash at publish, with a public check | Publisher-only; no kit, approvals or pay | N · N · Y · P |

### Also found, not profiled

Named by the research agents as adjacent or new. Listed so the landscape is complete; the one-line descriptions come from the source linked, not from a profile.

| Product | Segment | What it is |
|---|---|---|
| [Distinkt](https://distinktai.com) | Build | AI brand strategy brief for freelance designers |
| [BrandGap.AI](https://brandgap.ai) | Build | Competitive positioning reports, from $199 per analysis |
| [Moda](https://moda.app/blog/url-to-design-tool-ai-brand-importing) | Build | Editable brand kit from a URL for its design agents |
| [Genesys Brand Kit Generator](https://newsletter.genesysgrowth.com/p/introducing-genesys-brand-kit-generator) | Build | Custom GPT that turns a URL into a text brand kit |
| [Leadpages Brand Kits](https://leadpages.com/product/brand-kit) | Build | Colours, fonts and voice inside a landing-page builder |
| [AuthorityMax](https://authoritymax.ai/ai-linkedin-content) | Run | Voice DNA plus a 10-minute AI voice interviewer for LinkedIn (pricing unverified) |
| [VoiceMoat](https://voicemoat.com/pricing) | Run | X and LinkedIn voice-trained drafts with drift checks, $35–150/mo |
| [SparkVox](https://sparkvox.io) | Run | Call recordings to LinkedIn posts, showing the transcript quote behind each draft |
| [Siteply](https://www.siteply.co) | Run | LinkedIn voice DNA and a Draft > Review > Approved > Scheduled pipeline |
| [Zernio](https://zernio.com/), [Chatwoot](https://www.chatwoot.com/), [Trengo](https://trengo.com/), [Unipile](https://www.unipile.com/) | Run (R6) | Inboxes that cover both Telegram and WhatsApp |
| [SideShift](https://sideshift.app/) | Pay | Drafts a campaign from the brand's website; holds creator pay until approval; $210–699/mo |
| [Grade](https://usegrade.com/help) | Pay | Creator payout infrastructure with crypto withdrawal; possible off-ramp partner |
| [Domino](https://domino.run/product/ambassador-programs) | Pay | Ambassador and quest programs across X, Discord, Telegram and onchain |
| [Xeet](https://www.xeet.ai/) | Pay | Creator tournaments, relaunched as "verified results from any platform" |
| [Hyphae](https://hyphae-delta.vercel.app/) | Pay | Solana pilot: AI-graded X replies, weekly payouts committed onchain, 3% fee |
| [Njord](https://njord.cryptuon.com/), [Redio](https://redio.app/docs/) | Pay | Solana USDC affiliate escrow and commission payouts |
| [Lever.io](https://lever.io/solana-kol-marketing) | Pay | KOL agency and platform with escrow for Solana projects |
| [Solana University Ambassador Program](https://solana.com/university) | Pay | Solana Foundation's own USDC milestone stipends |
| [Fox Verify](https://www.verifymedia.com/), [DATA Foundation Trace](https://www.coindesk.com/business/2026/06/25/a16z-backed-crypto-firm-rebrands-shifts-focus-to-solving-ai-s-global-copyright-headache), [SAS Explorer](https://github.com/astrohackerx/sasexplorer), [Digimarc](https://www.digimarc.com/blog/how-digital-watermarks-strengthen-c2pa-content-credentials), [Corsearch](https://www.rfp.wiki/marketing/brand-protection-software/brandshield/corsearch) | Prove | Article signing, AI data provenance, SAS record explorer, watermarks, brand protection |

---

## 4. Coverage of the full plan: who does each item today

**Open** means no competitor found does it. **Partly** means it exists but in a weaker or narrower form. **Crowded** means several competitors do it well; there JamJam needs parity, not a claim of difference.

| ID | Plan item | Status | Best existing version |
|---|---|---|---|
| B1 | Guided intake | **Crowded** | Pressmaster (15–30 min interview, three modes), Branding5 (7 questions with AI pre-fill), Pomelli Agent (chat), Supergrow / Edgar / Outerview / Sona (voice interviews) |
| B2 | Facts kept only with a supporting quote on the page | **Open** | Nearest: WRITER's Knowledge Graph citations (not in a kit); Agorapulse "Source used"; Frontify links to guideline sections |
| B3 | Evidenced / Inferred / Missing coverage map | **Open** | Nearest: Pressmaster Twin IQ (volume of input, not evidence); Typeface linting; Branding5 pre-fill |
| B4 | Strategy kit (purpose, positioning, audience, voice, origin, messaging) | Partly | Branding5, Typeface (enterprise), Pomelli (partial) |
| B5 | Three gates recording who, when and why | **Open below enterprise** | Typeface approves each rule (enterprise only); Canva and Sprout approve designs or posts, not the kit |
| B6 | Kit versioning and export | Partly | Typeface MCP export, Pomelli brand book; no visible kit versions found |
| R1 | Drafting in the brand voice | **Crowded** | Pressmaster, Jasper, Taplio, Supergrow and most of segment B |
| R2 | Slop pass and claims gate | Slop: Partly. Claims vs the brand's evidence: **Open** | Outerview (banned phrases plus voice-match score); Typefully (persistent rules); Typeface ("rule fired, because") |
| R3 | Human approval before publish | Partly (sold as an upgrade) | Sprout (multi-step, auto-expire); Canva (blocks publish); Edgar. Approval on every tier with recorded reasons: **Open** |
| R4 | X and LinkedIn publishing | **Crowded**, with X risk | Hootsuite, Buffer, Pressmaster. Hypefury and Later dropped X |
| R5 | Draft-and-approve reply queue | **Crowded** but generic | Hootsuite Smart Replies, Buffer (5/week free), Sprout (Advanced). None drafts from a verified kit |
| R6 | Inbox with Telegram and WhatsApp | Partly | None of the 8 suites has Telegram; Zernio, Chatwoot and Trengo do (inbox-only tools) |
| R7 | Lead finder | **Crowded** | Octolens, Syften, Common Room. JamJam's edge would be starting from the kit with no extra setup |
| R8 | Disclosed, registered AI persona | **Open** | Only Buffer's AI-disclosure toggle |
| R9 | Analytics | **Crowded** | Sprout, Hootsuite, Pressmaster Narrative view |
| P1 | Kit registered onchain | **Open** | None |
| P2 | Registry of posts, official accounts, claims and personas | Partly | X Premium Business (accounts, X only), Fox Verify (publisher articles), Encypher (C2PA text, not onchain) |
| P3 | Public Verify (paste text or URL) and Ledger | Partly | Encypher (C2PA text), Adobe (media), Numbers (images, close matches). A ledger lookup by pasted text with official / edited / not found: **Open** |
| P4 | Email sign-in, no wallet | Differentiator against crypto tools (Galxe, Layer3, Numbers, Kaito need wallets); normal against web2 tools | Story uses an embedded wallet |
| Y1 | Campaigns with a capped budget | **Crowded** | Roster, Zealy (USDC locked on creation), Earnout (onchain escrow), Wallchain (funded before launch) |
| Y2 | Curated ambassadors, auto-inserted disclosure, compliance record | Curated: **Crowded**. Auto-inserted disclosure plus a stored record: **Open** | Kaito Select, Wallchain Select (curated); impact.com and Valen Sentinel only detect or score disclosure |
| Y3 | USDC per verified off-X piece | Mostly **Open** | Superteam (USDC bounties, competitive, includes X threads), Zealy (USDC quests), Solana University program (USDC milestones) |

**Reading the table.** JamJam's genuinely open ground is B2, B3, B5 (below enterprise), the claims half of R2, R8, P1, the ledger lookup in P3, and the disclosure half of Y2. Everything marked Crowded needs to be at parity, not pitched as different.

---

## 5. Onboarding: what the market does now

**Patterns that recur across segments (sources in the detail files):**
- **URL in, kit out, in seconds to minutes.** Pomelli, Canva, Blaze, Copy.ai, Agorapulse and Octolens all build a profile from a website. Canva calls URL extraction near-instant; Octolens and Syften reach a working setup in about 2 minutes. A visual or tone kit from a URL is now a commodity.
- **Several ways in.** Pomelli offers URL, upload or chat. Pressmaster offers URL, a 15–30 minute interview or manual entry, for brand and for voice. Canva takes a URL or a guidelines PDF.
- **Interviews by voice.** Pressmaster, Supergrow, Edgar, Outerview and Sona run spoken interviews of 10–30 minutes, often combined with imported past posts.
- **Visible progress and rewards.** Pressmaster's checklist pays credits per step; Buffer shows "1/3 channels connected"; Blaze has a homepage checklist.
- **Never an empty screen.** Hootsuite and Sprout show dashboards with demo data. Syften backfills two months of mentions. Roster gives each new ambassador a first task. BrandChamp's empty first screen is the counter-example.
- **A fast first win.** Sona claims a first post in about 10 minutes. Blaze gets to a week of posts in about 20 minutes (reviewer). Edgar runs a weekly 10–15 minute ritual.
- **Trials.** No card is the norm: 7–30 days at Hootsuite, Sprout, Buffer, Agorapulse, Blaze, WRITER, Octolens and Syften, plus free tiers at Pressmaster, Buffer, Zealy and GRIN. Card-required trials are at Jasper, Copy.ai, Taplio and Later, and the last two have the worst review scores in their segments. Supergrow pauses the account at trial end instead of charging.
- **Crypto onboarding adds friction.** Galxe needs a wallet and a 300 USDT/USDC deposit; Layer3 needs a 12-month token stake; Kaito and Wallchain are sales-led. Superteam Earn is the light one: a brief in under 2 minutes.

**What this means for JamJam's 15-minute intake (B1, R18).** The intake is now normal, not novel. To beat it, JamJam has to:
- show ingested facts, with their quotes, within the first minute;
- skip what the sources answer and say so;
- end the 15 minutes with something tangible: an approved kit v1 and a first approved draft.

---

## 6. Pricing: the bands JamJam will be compared against

| Band | Typical price | Examples (vendor pages unless marked) |
|---|---|---|
| Free and verify-only | $0 | Pomelli (beta), Buffer Free, Typefully Free, Zealy Free, GRIN Free, Encypher verify and publisher signing, Superteam Earn (0%) |
| Solo AI voice and posting | $20–49/mo | Pressmaster Starter $29/user, Supergrow Pro $39, Edgar $49, Tweet Hunter Grow $49, Meet Sona $20, Copy.ai Chat $24–29 |
| Premium solo | $69–99/mo | Taplio Growth $69, Jasper Pro $59–69/seat, Kleo $99, Outerview Pro €99 |
| SMB brand-to-publishing | $79–149/mo | Blaze $79/$149, Sprout Essentials $79/seat (no inbox), Agorapulse $79/user, Hootsuite Standard $99/user |
| Team and approvals | $165–499/mo, or $199–399 per seat | Supergrow Teams $199, Meet Sona Team $165, Pressmaster Agency $199/$499, Sprout Professional $299/seat, Hootsuite Advanced $399/user |
| Ambassador platforms | $520–2,750/mo, or quote | BrandChamp $520–2,750, Roster $599+, Club, SocialLadder and Aspire about $2,000+ (third party) |
| Crypto community | $149–1,699/mo | Zealy $149/$359 (annual), Galxe $999/$1,699 (annual) |
| Enterprise | $2,500/mo to six figures/yr | Common Room $2,500/mo, CreatorIQ about $30–60k/yr (third party), BrandShield $22,000/yr, Typeface (third party) |
| Official badge on one platform | $200–1,000/mo plus $50/mo per affiliate | X Premium Business (secondary sources) |

**Pricing models that work:**
- Free viewers and partners: Frontify bills only active users.
- Per channel or per brand instead of per seat: Buffer, Typefully.
- Usage credits shown live: Zealy shows the cost per claim before publishing.
- Transparent fee wording: Aspire states the creator gets 100% and the brand pays 2% plus processing.
- A one-time kit price: Branding5 at $147 (Capterra).

**Models that draw complaints:**
- Opaque credit burn (Pressmaster, Taplio).
- A cheapest tier with no AI (Taplio, Tweet Hunter).
- Card on trial with auto-charge (Taplio, Later).
- Approvals locked behind expensive tiers (Hootsuite, Sprout, Agorapulse).

---

## 7. What JamJam should adopt, and where it should do better (proposed)

All items are **proposed** for the owner to accept, defer or reject. Each names its source competitor and the plan ID it affects. None changes current hackathon scope unless the owner says so.

### 7.1 Adopt: Build onboarding
| # | Proposal | From | Plan ID |
|---|---|---|---|
| 1 | Three ways into the same kit on one screen: site URL, upload (guidelines PDF or deck), or guided chat | Pomelli, Canva, Pressmaster | B1, B2 |
| 2 | Show the first ingested facts, each with its quote, within the first minute; set a time expectation per input ("URL: under a minute") | Canva, Octolens, Syften | B2 |
| 3 | AI pre-fills each interview answer from the sources, shows the supporting quote and an Evidenced / Inferred label; some questions stay human-only (origin, goals) and the UI says why | Branding5 (pre-fill), JamJam evidence model | B1, B3 |
| 4 | Each gate as a confirm screen ("here's what we found, confirm or edit"); voice traits as add/remove chips | Blaze | B4, B5 |
| 5 | A readiness score that measures evidence coverage, not volume | Pressmaster Twin IQ, made honest | B3 |
| 6 | Kit linting before Gate 3: flag contradictions between positioning, voice and messaging | Typeface | B5 |
| 7 | Last step of kit approval: the same post with and without the voice, side by side | Jasper | B5, R1 |
| 8 | End the 15 minutes with one approved draft post, not just a kit | Meet Sona, Blaze | R17 walkthrough |
| 9 | A setup checklist after the kit (connect channels, first post, invite a partner), optionally with a reward | Pressmaster, Blaze, Buffer | Onboarding |
| 10 | Shareable no-login interview links, so a co-founder or partner can add origin stories | Supergrow, Pressmaster | B1, free seats |
| 11 | A one-click shareable brand book of the approved kit, carrying its onchain hash; a public example kit (JamJam's own) on the landing page | Pomelli, Branding5 example report | B6, P1 |

### 7.2 Adopt: Run
| # | Proposal | From | Plan ID |
|---|---|---|---|
| 12 | Show the banned-phrase count and voice-match score on every draft | Outerview | R2 |
| 13 | Persistent voice rules the owner sets once (banned words, punctuation) that feed the slop pass | Typefully | R1, R2 |
| 14 | "Rule fired: X, because Y" on every gate result | Typeface | R2 |
| 15 | Approval steps with any-or-all approvers and expiry, plus the reason recorded; the Ledger doubles as the approval report Sprout lacks. Never auto-approve on timeout (Aspire does); remind or escalate instead | Sprout, Aspire (counter-example) | R3, B5 |
| 16 | Per-platform preview (feed or grid) on the approval screen | Typefully, Later | R3 |
| 17 | A weekly 10-minute "jam" ritual that produces a set number of approved posts (the name fits the brand) | Edgar | Run habit loop |
| 18 | Import past posts as evidence for voice traits ("evidenced from 12 posts") | Taplio, Hootsuite | B2, R1 |
| 19 | Lead finder seeded from the kit, with past mentions shown on day one | Octolens, Syften | R7 |
| 20 | An AI-generated-content disclosure toggle in the composer | Buffer | R8 |

### 7.3 Adopt: Prove
| # | Proposal | From | Plan ID |
|---|---|---|---|
| 21 | Verify results as separate rows (who registered it, kit version, approver, exact or edited), never one badge | Encypher, Truepic | P3 |
| 22 | Show close matches with a diff instead of a bare "not found" | Numbers | P3 |
| 23 | A fourth Verify state, "retracted", using SAS revocation | SAS | P3 |
| 24 | One public page per registered item with a version timeline (kit v1 to v2) | Numbers Asset Profile | P3 |
| 25 | Link records: post record references the kit version and the approver record | EAS refUID | P2 |
| 26 | Domain proof before a brand shows as "official" (the `domain_verified` field) | Encypher | P2 |
| 27 | Publish JamJam's credential and schema IDs on Verify with a link to a third-party explorer | SAS Explorer, Solscan | P3 |
| 28 | Later: also emit C2PA text labels so posts verify in standard tools (open-source `c2pa-text` libraries exist) | Encypher | P2 (interop) |
| 29 | Later: export the official accounts and ambassadors as an allowlist for takedown vendors and community moderators | Doppel, BrandShield | P2 |

### 7.4 Adopt: Pay
| # | Proposal | From | Plan ID |
|---|---|---|---|
| 30 | Escrowed USDC budget locked when the campaign is created, with automatic refund of unspent funds | Zealy, Earnout, Wallchain | Y1 |
| 31 | A published rate card per format (blog, tutorial, docs, LinkedIn) | Superteam Earn, Kaito CPMs | Y1 |
| 32 | Auto-assign a welcome brief when an ambassador is approved | Roster | Y1, Y2 |
| 33 | Brief generated from the kit: deliverables, guideline checklist, usage rights, terms acknowledgment, disclosure as a locked item | Aspire | Y2 |
| 34 | Rejection needs a reason; ambassador can resubmit; reasons go into the compliance record | BrandChamp | Y2 |
| 35 | Ambassadors run the slop, claims and disclosure checks on their own draft before submitting | Valen Sentinel, SocialLadder | Y2, R2 |
| 36 | Approve and pay in one action, producing a public receipt (USDC transaction plus attestation) | CreatorIQ Pay; the gap at Superteam and Club | Y3, P3 |
| 37 | Open vs invite-only campaigns; templates for off-X formats | Club | Y1, Y2 |

### 7.5 Adopt: pricing and packaging
| # | Proposal | From |
|---|---|---|
| 38 | No-card trial; Verify free forever with no account; partner and ambassador seats free (contrast: X charges $50/mo per affiliate) | Hootsuite, Encypher, Frontify, X Premium Business |
| 39 | Avoid opaque credits, a no-AI cheapest tier, card-on-trial auto-charge, and approvals as an upgrade | Complaints about Taplio, Tweet Hunter, Later, Pressmaster, Hootsuite, Sprout |
| 40 | State the payout fee as "ambassador receives 100%, brand pays X%", and justify it with the compliance record and public receipt, since rivals charge 0% | Aspire, Superteam Earn, Roster |
| 41 | Option: a one-time kit price as the entry, then a subscription for Run and Prove | Branding5 |
| 42 | For crypto brands, a stablecoin deposit as an alternative to a card | Galxe |

**Inference, not sourced:** if JamJam prices its subscription (pitch deck slide 10 is still blank), the bands in section 6 suggest a solo tier around $29–49 and a brand tier around $79–149, with approvals on every tier. This is an inference from competitor prices, not a validated price; slide 10 says prices are to be set with design partners.

### 7.6 Where JamJam does better (keep these in the pitch)
- **Evidence:** facts only with their quote, and a coverage map. No competitor in 59 does this (B2, B3).
- **Approval on every tier, with reasons recorded and public.** Others sell approval as an upgrade and keep the record private (B5, R3).
- **Claims checked against the brand's own evidence.** Others at most ban phrases or score voice (R2).
- **Proof that survives stripping because it is a lookup**, not embedded metadata: paste the text and the ledger answers (P3).
- **Disclosure inserted before posting, with a stored record**, where others detect it after (Y2).
- **Paid per verified off-X piece**, which fits X's policy, where crypto rivals still pay for X posts or bounties (Y3).
- **Email sign-in with no wallet**, against crypto tools that need wallets, deposits or stakes (P4).

---

## 8. Risks and corrections

| Item | Detail | Suggested action (proposed) |
|---|---|---|
| ADR-002 and research 04 claim about onboarding | "No competitor runs strategy-first onboarding" is no longer true (Pomelli Agent, Branding5, Pressmaster) | Owner to decide whether to amend ADR-002's context line; the differentiator becomes evidence plus coverage plus gates |
| Pitch deck slide 9 | Pressmaster (Build partly, Run yes) and Encypher (Prove yes, for text) are the two closest rivals and are not on the slide | Owner to decide whether to add them before recording; the "nobody runs the whole loop" claim still holds |
| Pressmaster could add citations | It already has URL extraction, interviews and a readiness score | Lead with evidence, approvals and public proof, which are hardest to copy |
| Pomelli is free | Visual and tone kits from a URL are now free from Google | Don't compete on visuals |
| X publishing risk | Hypefury and Later dropped X | Keep LinkedIn and off-X channels first-class (R4) |
| Off-X paid content is unproven | Every ambassador platform is social-first | Treat Y3 as a hypothesis to test with aDNA, not a proven market |
| Payout fee vs 0% | Superteam Earn 0%, Roster no take rate | See proposal 40 |
| "First" / "only" claims | No Solana app for brand content was found in the SAS ecosystem, but absence of results is not proof | Say "early", not "first" or "only", unless a fuller scan is done |

---

## 9. Unverified items

Listed in full in each detail file. The main ones:
- **Prices not published by the vendor** (third-party figures used and labelled): WRITER Starter, Typeface, Frontify, Club, SocialLadder, Aspire, CreatorIQ, Kaito Studio, Wallchain, Layer3 stake amount, Doppel, X Premium Business (secondary sources).
- **Prices rendered client-side** (third-party reads used): Typefully, Tweet Hunter.
- **Conflicting vendor pages:** Pressmaster (Pro and Partner tiers), Contentdrips, Meet Sona, Later (extra user price), Taplio and Later (card on trial).
- **Onboarding not publicly documented:** Hypefury (post-X), Tweet Hunter, Kleo (article bodies didn't load), BrandWell, SocialLadder, impact.com.
- **Status:** whether Zoom's acquisition of Common Room has closed; whether Story's IP Portal is still developed; whether Galxe and Zealy paid X tasks comply with X's rules.
- **Platform behaviour:** whether X and LinkedIn strip Encypher's invisible characters.
