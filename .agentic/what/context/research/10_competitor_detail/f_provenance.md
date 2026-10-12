---
type: research
status: active
created: 2026-10-12
updated: 2026-10-12
last_edited_by: agent
tags: [research, competitors, onboarding, pricing]
---
> **Status: active.** Detail file for segment F (provenance and is-this-official verification) of [research 10](../10_competitor_onboarding_pricing.md). Plan IDs are defined in its [baseline table](../10_competitor_onboarding_pricing.md#2-baseline-jamjams-full-build-plan). "What JamJam should steal / learn" items are proposals for the owner, not decisions.

# Segment F: Content provenance and "is this official" verification

Research date: 2026-10-12. Desk research only (public pages, docs, help centres, press, review sites). No accounts created. Prices are USD as listed. "Unverified" means I could not confirm it from a public source, and the reason is given.

Lens used for every entry: how a brand or creator registers content or identity, what the public verify experience is, whether provenance survives metadata stripping, whether plain text is supported, and pricing.

---

### Adobe Content Authenticity app + Content Credentials (C2PA) Verify (https://contentauthenticity.adobe.com, https://contentcredentials.org/verify)
- **Category:** Open provenance standard (C2PA) plus Adobe's free signing app and public inspect/verify tools.
- **Status (as of 2026-10-12):** Live, but the Adobe app is still labelled **Beta** in Adobe's help centre (last updated Sep 2025). C2PA spec is at v2.4. Adobe has been rolling out automatic C2PA on GenAI output across Creative Cloud, Document Cloud, Firefly and CX Enterprise through August 2026.
- **What it does (2-3 sentences):** Creators attach signed, tamper-evident "Content Credentials" (who made it, how, whether AI was used) to files. Adobe keeps a copy of each credential in its public Content Credentials cloud and links it back to the file with an invisible watermark (TrustMark) and a fingerprint, so the credential can be recovered after a platform strips metadata. Anyone can inspect a file at contentcredentials.org/verify or in Adobe's Inspect tool, or see credentials on web pages with a Chrome extension.
- **Target customer:** Individual creators and photographers (free app); enterprises and publishers through Adobe apps and the C2PA ecosystem.
- **Onboarding flow (step by step, as documented):**
  1. Go to contentauthenticity.adobe.com and sign in with an Adobe ID (free).
  2. On Preferences, connect social accounts (Behance, Instagram, LinkedIn, X). An Instagram link needs a creator or business account.
  3. Optionally verify your name through "Verified on LinkedIn".
  4. Optionally set a generative-AI "do not train" preference. This unlocks only after you verify your name or link a social account.
  5. On Apply (desktop only), upload up to 50 JPG/PNG files, each 20MB or smaller. Choose what to include (you can't edit it after applying).
  6. Download a zip of re-signed files. Credentials are also published to Adobe's cloud.
  - Inputs: Adobe ID, optional social connects, optional LinkedIn identity check. No URL, interview or document intake. Credentials must go on before you publish; Adobe says they can't be added to content that is already online. Time to first output is not stated. Trial: none needed (free). Card: no.
  - Sources: Adobe help (beta overview, customization), Adobe Learn Photoshop walkthrough (Aug 2026).
- **Pricing:** Free web app. Verify and Inspect are free with no account. Signing inside Photoshop and Lightroom comes with those Creative Cloud subscriptions (not priced here). Sources: Adobe blog Apr 2025 ("free app"), Adobe help beta overview. Checked 2026-10-12.
- **What it does well (specific, evidence-backed):**
  - **Survives stripping (images):** soft binding means a TrustMark watermark plus fingerprint finds the manifest in Adobe's cloud after social platforms strip metadata. The process is documented in the CAI Soft Binding API (watermark ID, then `/matches/byContent`, then manifest).
  - Identity is attached through a real verification partner (Verified on LinkedIn), not self-asserted.
  - **Distribution:** LinkedIn shows a "Cr" pin for credentials. The Chrome extension reads both embedded credentials and watermarks.
  - The public verifier at contentcredentials.org/verify needs no account and handles 16 formats (JPEG, PNG, WebP, HEIC, MP4, MOV, MP3, WAV, PDF, SVG and more).
  - Open standard with 4,500+ CAI members (Adobe blog Apr 2025), so credentials carry over between vendors.
- **What it lacks vs JamJam full build plan:**
  - No brand-building or kit (B1-B6). Identity covers a person, not a brand voice or messaging.
  - **No plain-text posts in the Adobe app (P2/P3).** It signs JPG/PNG only. Video and audio are "coming soon" per Adobe blog Apr 2025. The contentcredentials.org verifier lists no text formats. C2PA 2.3/2.4 does define unstructured-text embedding, but Adobe's consumer app doesn't expose it.
  - No "paste text or URL, get official / edited / not found" check (P3). Verify works on uploaded files only.
  - No approval gates, claims gate or voice checks (B5, R2, R3).
  - No register of official accounts or brand-level claims (P2). Social links appear in credentials but aren't verified as "the brand's official account".
  - No run or pay features (R1-R9, Y1-Y3).
- **What JamJam should steal / learn:**
  - **Three-layer durability** (hard binding plus watermark plus fingerprint) as the mental model, with a separate result for each layer. For text, the matching idea is a hash of normalised text plus fuzzy matching against the ledger.
  - Gate "advanced" options (the AI-training preference) behind identity verification. It is a cheap trust ladder.
  - Default "verify needs no account" and a drag-and-drop or paste box on the landing page.
  - Say plainly in the UI that credentials apply before publishing. JamJam should register at approval time for the same reason.
- **Coverage vs loop:** Build: No · Run: No · Prove: Yes (media only) · Pay: No
- **Sources:**
  - https://helpx.adobe.com/creative-cloud/apps/adobe-content-authenticity/beta-overview.html
  - https://helpx.adobe.com/creative-cloud/apps/adobe-content-authenticity/customization.html
  - https://blog.adobe.com/en/publish/2025/04/24/adobe-content-authenticity-now-public-beta-helps-creators-secure-attribution
  - https://www.adobe.com/learn/photoshop/web/apply-content-credentials-photoshop
  - https://developer.adobe.com/cai-soft-binding-api
  - https://contentcredentials.org/verify
  - https://chromewebstore.google.com/detail/adobe-content-authenticit/dmfbmenkapmaoldfgacgkoaoiblkimel
  - https://experienceleague.adobe.com/en/docs/cx-enterprise-ai/experience-cloud-ai/overview/content-transparency
  - https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html
  - https://softwareseni.com/durable-content-credentials-how-provenance-survives-metadata-stripping

---

### Story Protocol / IP Portal, now DATA Foundation (https://portal.story.foundation)
- **Category:** Onchain IP registry (L1 chain) with licensing and royalties.
- **Status (as of 2026-10-12):** **Rebranded and pivoted.** On 2026-06-25 Story Protocol became the DATA Foundation / DATA Network and moved its focus to AI training-data provenance (Trace registry, Poseidon processing, Kled integration). The IP token migrated 1:1 to DATA, completing on 2026-10-08. Registered IP stays onchain, but the roadmap no longer centres on creator IP. The IP Portal URL still resolves; whether it is still actively developed is unverified.
- **What it does (2-3 sentences):** Creators register a work as an "IP Asset": an ERC-721 NFT entered into a global registry, with license terms (commercial or remix, rev-share) attached. Others can mint licenses and register derivatives, and royalties flow onchain.
- **Target customer:** Originally creators, studios and IP holders. Now AI labs and data suppliers.
- **Onboarding flow (step by step, as documented, IP Portal beta, Jul 2025):**
  1. Open the portal and sign in with phone, email, Google or Telegram, or connect a wallet. An embedded wallet address is created for you.
  2. Set a display name. Optionally add a bio and picture, and link X.
  3. Choose Register, then "New IP" or "Remix".
  4. Upload a file: video, audio or image, 15 file types, 25MB max.
  5. Add a name and description, and optionally a catalog and co-creators.
  6. Pick up to 5 licenses from presets (Commercial Remix, Commercial Use, Non-Commercial Remix, Open Use) or build a custom one (AI-training permission and so on).
  7. Register. The asset appears in the IP explorer.
  - Developers: mint and register through the SDK or SPG with IPFS-hosted metadata and SHA-256 hashes. This needs an EVM private key and IP/DATA for gas (testnet faucet available).
  - Time to first output and card requirement: unverified.
  - Source: Everstake walkthrough, Story docs.
- **Pricing:** No subscription. Registration costs onchain gas in IP (now DATA). The exact gas cost per registration is unverified (no published figure). License minting fees are set by each IP owner. Checked 2026-10-12.
- **What it does well (specific, evidence-backed):**
  - Web2-style sign-in (email, phone, Google) with an embedded wallet, so non-crypto creators can register.
  - License presets plus a custom builder that includes an AI-training toggle.
  - Derivative and remix graph with automatic royalty flow.
  - $140M funded, a16z-backed (CoinDesk Jun 2026).
- **What it lacks vs JamJam full build plan:**
  - No brand kit or interview (B1-B6).
  - No text posts as a first-class type (P2). The portal accepts video, audio and image only.
  - **Verification is by asset ID or explorer only.** There is no paste-text check and no official / edited / not found result (P3).
  - Doesn't survive stripping: the binding is a hash in metadata, and no watermark or fingerprint recovery is documented.
  - No approvals or claims gate (B5, R2, R3). Permissionless: anyone can register IP for anyone (Story docs), which is the opposite of a brand-official signal.
  - No run or pay-for-ambassadors (R1-R9). Royalties exist, but there are no campaign payouts (Y1-Y3).
- **What JamJam should steal / learn:**
  - Email or Google sign-in with an invisible embedded wallet. JamJam already goes further (no wallet at all, P4), and that should stay a headline.
  - The license-preset UX: four named presets plus "custom".
  - A warning from the pivot: a pure "register your IP onchain" product didn't find a market on its own. JamJam's loop (build, run, prove, pay) is the right hedge, and "prove" should stay a feature rather than the product (consistent with ADR-003).
- **Coverage vs loop:** Build: No · Run: No · Prove: Partly · Pay: Partly (royalties, not ambassador payouts)
- **Sources:**
  - https://everstake.one/blog/ip-portal-the-creators-guide-to-owning-value
  - https://docs.story.foundation/developers/smart-contracts-guide/register-ip-asset
  - https://github.com/piplabs/story-skills/blob/main/story-sdk/ip-registration/SKILL.md
  - https://www.coindesk.com/business/2026/06/25/a16z-backed-crypto-firm-rebrands-shifts-focus-to-solving-ai-s-global-copyright-headache
  - https://cointelegraph.com/news/story-protocol-pivots-to-ai-with-rebrand-to-data-foundation
  - https://cryptobriefing.com/story-ip-token-migration-data-complete/
  - https://portal.story.foundation/

---

### Numbers Protocol: Capture (Cam, Dashboard, Eye) and Verify Engine (https://captureapp.xyz, https://verify.numbersprotocol.io)
- **Category:** Onchain media provenance (C2PA signing plus ERC-7053 registration on Numbers chain), with a camera app and a reverse-image verify engine.
- **Status (as of 2026-10-12):** Live. Pricing page now leads with managed C2PA signing, and x402 AI-agent licensing is "coming soon".
- **What it does (2-3 sentences):** Capture Cam signs photos and video at capture. Capture Dashboard lets you upload and register existing media with captions, license and AI-training preferences, storing files on IPFS/Filecoin. Verify Engine lets anyone upload an image or enter an asset ID (Nid) to find exact and top-10 similar registered assets and open an "Asset Profile" with the creator, timestamp, license and commit history.
- **Target customer:** Photographers and creators, newsrooms, AI and creative-tool companies (API).
- **Onboarding flow (step by step, as documented):**
  1. Create an account in Capture Cam (iOS/Android) or on Capture Dashboard with username, email and password. API sign-up needs a key from the team.
  2. New accounts get 2 free credits.
  3. In Dashboard, click Create and upload a file.
  4. Add caption, creation time and location.
  5. Pick a license, tag AI-generated content, and toggle "Allow AI Training".
  6. Optionally list it as an NFT ("Share to Explore") with a price.
  7. Click "Register Capture", which takes about 2-3 minutes.
  8. Open the Asset Profile to see the registration commit and integrity CID.
  - Inputs: file upload and form fields. No URL, interview or social connect. Card is not needed for the free credits; credits can be bought by card or with the NUM token.
  - Sources: Numbers Medium walkthrough (2023), Capture docs.
- **Pricing (captureapp.xyz/pricing, checked 2026-10-12):**
  - **Pay-as-you-go:** $0.001 per managed sign, C2PA signing plus ERC-7053 registration, volume discounts above 100K/mo, no monthly fee.
  - **Basic:** $20/mo, 160 credits/mo, 50MB upload, 750GB storage, 100K registered files.
  - **Advanced:** $79/mo, 600 credits/mo, 500MB upload, 2.5TB storage, 500K files.
  - **Enterprise:** custom annual, 1M+ signs/mo, SLA, white-label dashboard.
  - Annual prices of $199/yr and $799/yr appear on an older copy of the pricing page (captureapp.xyz/pricing/index.html). The current page doesn't show annual prices, so they are unverified as current.
  - **Conflict:** the old page says "1 credit = 10 registrations" while the current FAQ says most workflows use 1 credit per asset.
  - Freemium: 2 initial credits.
- **What it does well (specific, evidence-backed):**
  - **Content-based lookup that partly survives stripping:** Verify Engine uses AI similarity to find exact and near matches for an uploaded image, so a stripped re-upload can still be traced.
  - A public Asset Profile per item with a commit history (edits recorded as child assets with a "Fork" badge).
  - Very cheap per-item signing ($0.001) with monthly self-serve tiers, unlike enterprise-only rivals.
  - Embeddable "Capture Eye" provenance widget for websites.
  - Free open-source SDKs (MIT/Apache).
- **What it lacks vs JamJam full build plan:**
  - No brand kit or interview (B1-B6).
  - Text support is unverified. The docs and verify engine centre on images and video, and no plain-text paste check is documented (P3).
  - No official-account or brand-claims registry (P2). Identity is just the Capture account.
  - No approval gates or claims gate (B5, R2, R3).
  - Crypto-native friction: NUM token, wallets, and IPFS unpinning after 1 month on pay-per-use API calls (Numbers docs). JamJam hides the chain entirely (P4).
  - No run or pay-for-ambassadors (R1-R9, Y1-Y3). Its "pay" is NFT sales and AI-licensing, which is still coming.
- **What JamJam should steal / learn:**
  - The **Asset Profile** page pattern: one public URL per registered item, showing creator, timestamp, license and a version/commit timeline. JamJam's Ledger entries should look like this, with kit v1 to v2 as commits.
  - Similarity matching on verify: show the exact match plus "close matches" instead of a binary not found. For text, show nearest registered posts and the diff.
  - Publish a per-registration unit price. JamJam's subscription could include N registrations, with the ledger cost visible to show it is real but cheap.
- **Coverage vs loop:** Build: No · Run: No · Prove: Yes (media) · Pay: Partly (NFT/licensing)
- **Sources:**
  - https://captureapp.xyz/pricing/
  - https://captureapp.xyz/pricing/index.html
  - https://docs.numbersprotocol.io/applications/capture/
  - https://docs.numbersprotocol.io/developers/initial-asset-registration/
  - https://docs.captureapp.xyz/capture-account-and-wallet/capture-wallets/top-up/
  - https://docs.captureapp.xyz/capture-account-and-wallet/create-and-manage-account/
  - https://medium.com/numbers-protocol/capture-demo-your-guide-to-protect-content-provenance-in-gen-ai-era-33b4127e27e9
  - https://docs.numbersprotocol.io/applications/verify-engine/search-ui-interface
  - https://docs.numbersprotocol.io/applications/verify-engine/asset-profile/
  - https://builder.numbersprotocol.io/

---

### Truepic (Vision, Lens SDK) (https://www.truepic.com)
- **Category:** Enterprise authenticated capture and "visual risk intelligence" (C2PA at capture), not brand publishing.
- **Status (as of 2026-10-12):** Live and active. Recent news: OtterBox (Aug 2026), Verisk ClaimSearch (Sep 2026), Cotality (Jun 2026), and an AI Analysis feature (Aug 2026). The company has repositioned around inspections and fraud for insurance, lending and warranty.
- **What it does (2-3 sentences):** Truepic Vision sends end users a link to a controlled camera that runs 50+ authenticity checks, attaches content credentials and seals the images for the business's claims or underwriting workflow. The Lens SDK embeds the same secure camera in a customer's own app.
- **Target customer:** Insurers, lenders, warranty and retail returns, equipment finance (enterprise).
- **Onboarding flow (step by step, as documented):**
  1. Request a demo on the pricing or contact page. The docs say Vision has no self-serve sign-up and no sandbox.
  2. Truepic creates your organization and test access.
  3. Choose an integration: Vision native apps, Web Inspection App, Embedded Vision (WebView, typically 1-2 weeks) or Lens Web SDK.
  4. Send inspection links, then review results in the Vision Dashboard or by webhook.
  - Card: n/a (sales-led).
  - Sources: vision.truepic.dev getting-started and compare pages.
- **Pricing (truepic.com/pricing, checked 2026-10-12):**
  - **Flex:** month-to-month, $1,000/mo minimum plus a per-inspection rate that varies by inspection type, cancel with 1 month's notice.
  - **Standard:** annual commitment. One example tier shows $1,450/mo at $58/inspection. Overage is $28-$65 by tier. Quarterly billing saves about 6% and annual about 12%; a 2-year contract takes another 7% off.
  - **Enterprise:** custom.
  - No free tier.
- **What it does well (specific, evidence-backed):**
  - Signing at capture with device-integrity checks (attestation, root detection) is the strongest form of "this is real".
  - Turns verification into structured, decision-ready data (AI Analysis, Aug 2026).
  - Published, use-case-based pricing with a clear Flex-to-Standard path. That is rare for enterprise trust vendors.
  - Plugs into incumbent workflows (Verisk, Cotality).
- **What it lacks vs JamJam full build plan:**
  - Not a brand or marketing tool at all (B1-B6, R1-R9).
  - No public "is this official" verify for social posts or text (P3). A public verify page for brand content is unverified (none found in current docs).
  - Text: no.
  - No ledger or onchain registry (P1, P2).
  - No pay (Y1-Y3).
- **What JamJam should steal / learn:**
  - Pricing transparency in a sales-led category: a calculator by use case, with month-to-month and annual options. JamJam could show "per brand" pricing with a clear jump to annual.
  - Verify results as structured findings (signer, time, checks passed), not a single badge.
- **Coverage vs loop:** Build: No · Run: No · Prove: Partly (capture authenticity, private to the business) · Pay: No
- **Sources:**
  - https://www.truepic.com/pricing
  - https://vision.truepic.dev/docs/getting-started
  - https://vision.truepic.dev/docs/compare-integration-approaches
  - https://www.truepic.com/blog/truepic-otterbox-partner
  - https://www.truepic.com/blog/truepic-brings-verified-visual-evidence-to-verisk-claimsearch
  - https://www.globenewswire.com/news-release/2026/06/23/3316247/0/en/Truepic-and-Cotality-to-Bring-Verified-Virtual-Inspections-to-Home-and-Construction-Loans.html
  - https://www.truepic.com/contact-us

---

### Encypher (NEW, not in assignment: the closest provenance competitor for text) (https://encypher.com)
- **Category:** C2PA signing and verification for text, media and documents. Focus: publishers and EU AI Act Article 50 marking of AI output.
- **Status (as of 2026-10-12):** Live. It says it wrote the C2PA text-signing rules (published 2026-01-08) and co-chairs the C2PA text task force, and that its signer is on the C2PA Conforming Products List.
- **What it does (2-3 sentences):** It embeds an invisible, signed C2PA label into plain text, sentence by sentence, using Unicode variation selectors, so the label travels through copy-paste. It also signs images, audio, video, PDF and Word. A free public verifier (web or API, no account) reports who signed, what they declared and whether the content changed, with separate results for the C2PA credential, watermark, soft-binding recovery and policy.
- **Target customer:** News and online publishers (free lane) and AI product teams needing Article 50 marking (paid "Mark" plans).
- **Onboarding flow (step by step, as documented, publisher lane):**
  1. Create a free account.
  2. Identify the signing organization.
  3. Confirm the publishing domain. Your name appears on labels once domain proof is accepted.
  4. Connect publishing: WordPress plugin, Ghost webhook or API.
  5. Sign after the final publish step.
  6. Ask an editor or partner to verify the received piece.
  - A no-account demo lets you paste text, sign it and check it (encypher.com/ai-demo, /publisher-demo).
  - Mark Trial: 1,000 outputs/mo free. Card requirement is unverified.
- **Pricing (encypher.com/pricing, checked 2026-10-12):**
  - Checking: free, no account.
  - Publisher signing: free and uncapped (fair use).
  - **Mark Free:** $0, 1,000 outputs/mo, signed under the Encypher name, 5 evidence records/mo.
  - **Starter:** $99/mo or $990/yr, 10K outputs, 2 seats, your name after proof.
  - **Team:** $349/mo or $3,490/yr, 40K outputs, 5 seats, custom verification domain.
  - **Standard:** $999/mo or $9,990/yr, 150K outputs, 10 seats, white-label verify pages.
  - **Growth:** $4,000/mo or $40,000/yr, 1M outputs.
  - **Enterprise:** custom.
  - Add-ons: white-label verification $249/mo; archive backfill $299 or $999 one-time; priority support $199/mo.
- **What it does well (specific, evidence-backed):**
  - **Real plain-text provenance** that survives copy-paste (invisible characters carry the manifest). This is exactly the medium JamJam posts live in.
  - A verifier that is honest about scope: it says a check shows who signed and whether the content changed, not whether it is true or approved.
  - Separate result rows for the credential, watermark, recovery and policy, so nothing is hidden in one score.
  - Domain-proof step before your name appears on labels.
  - Free verify plus free publisher signing, with paid plans for volume, branding and a custom verify domain.
- **What it lacks vs JamJam full build plan:**
  - No brand kit or interview (B1-B6).
  - No human-approval gates, claims gate or voice-fit (B5, R2, R3). Encypher explicitly doesn't say content is approved.
  - **Invisible-character labels are fragile on social platforms.** X and LinkedIn may normalise or strip variation selectors (not verified for each platform). JamJam's ledger lookup by normalised text hash plus fuzzy match doesn't depend on characters surviving.
  - No register of official accounts (P2).
  - No public onchain ledger (P1): the records are C2PA plus a timestamp authority, not a public chain.
  - No run, inbox or pay (R1-R9, Y1-Y3).
- **What JamJam should steal / learn:**
  - Copy the verify **result vocabulary**: signer, declared, changed or unchanged, and separate rows per proof type.
  - Add a **domain-proof gate** before a brand's name shows as "official" (this maps to JamJam's `domain_verified` SAS field).
  - Offer free verify forever, and keep white-label or custom-domain verify pages as a paid upsell.
  - Consider emitting C2PA-compatible text labels as well as the SAS record, so JamJam posts verify in third-party C2PA tools. The open-source `c2pa-text` and `c2pa-unstructured-text` libraries exist (the latter is designed for Workers and browsers).
- **Coverage vs loop:** Build: No · Run: No · Prove: Yes (incl. text) · Pay: No
- **Sources:**
  - https://encypher.com/pricing
  - https://encypher.com/verify
  - https://encypher.com/products/mark
  - https://encypher.com/solutions/publishers
  - https://encypher.com/publisher-demo
  - https://encypher.com/ai-demo
  - https://github.com/encypherai/c2pa-text/
  - https://docs.rs/crate/c2pa-unstructured-text/latest/source/README.md

---

### Solana Attestation Service (SAS) and its app ecosystem (https://attest.solana.com)
- **Category:** Permissionless onchain attestation protocol (the layer JamJam's P1/P2 is built on).
- **Status (as of 2026-10-12):** Live on mainnet.
- **What it does (2-3 sentences):** Issuers create a credential (who may attest) and schemas (field layouts), then authorized signers issue attestations bound to an address or nonce. Attestations can expire, be revoked or be tokenized as non-transferable Token-2022 NFTs. Solana's own launch list frames it as KYC passports, region gating, sybil resistance, accreditation, DAO reputation and DePIN.
- **Target customer:** Developers and identity issuers (Civic, Sumsub, RNS.ID, Solid, PolyFlow, Range and others listed by Solana).
- **Onboarding flow (step by step, as documented):**
  1. Install the SDK (`sas-lib` with `@solana/kit`, or the Rust client).
  2. Fund a payer.
  3. Create a credential with authorized signers.
  4. Create a schema (name, version, fields, layout).
  5. Issue attestations.
  6. Verify by deriving the attestation PDA and checking it exists and hasn't expired.
  - Developer-only: no hosted UI from Solana. Source: SAS TS guide.
- **Pricing:** Protocol fee: none documented. Costs are Solana transaction fees plus account rent, but the exact rent per attestation is unverified (it depends on data size and isn't published as a figure). Checked 2026-10-12.
- **Apps found that relate to content or brand verification:**
  - **None found doing brand content provenance or official-account registration.** The closest are identity ones: Civic Pass, Sumsub ID, RNS.ID KYC, Solid "Priority Pass" (social profiles as attestations), and a career-attestation portal named in Solana's launch post.
  - WRAP (hackathon, devnet) issues wallet-identity scores via SAS.
  - A third-party open-source SAS Explorer exists (sas.lostatom.org, GitHub astrohackerx/sasexplorer). On fetch its issuer list rendered as 0, possibly client-rendered, so its data coverage is unverified.
  - Range says it ingests all SAS attestations into its wallet-intelligence tools.
- **What it does well (specific, evidence-backed):**
  - Separates issuer authority (credential), shape (schema) and claim (attestation). That maps cleanly to Registrar, WL-KIT and post records.
  - Expiry and revocation built in, so JamJam can revoke a retracted post.
  - Tokenized attestations show up in wallets.
  - Neutral public good with Solana Foundation backing.
- **What it lacks vs JamJam full build plan:**
  - No consumer-facing verify UX. The docs warn that anyone can create a credential and you must trust the issuer, so a brand-facing "official" page has to be built on top (P3). That is JamJam's opening.
  - No text hashing or matching conventions.
  - No Build, Run or Pay.
- **What JamJam should steal / learn:**
  - Publish JamJam's credential and schema IDs on the Verify page with a link to a third-party explorer (Solscan or SAS Explorer), so trust doesn't depend on JamJam's own UI.
  - Use expiry and revocation to show "retracted" as a fourth Verify state alongside official / edited / not found.
  - **Gap:** there is no Solana-native "brand official content" registry in the ecosystem. JamJam can credibly pitch as the first SAS app for brand content (avoid "only" in copy, since the evidence is absence of results, not proof of absence).
- **Coverage vs loop:** Build: No · Run: No · Prove: Partly (primitive only) · Pay: No
- **Sources:**
  - https://attest.solana.com/
  - https://solana.com/news/solana-attestation-service
  - https://solana.com/docs/tools/attestations
  - https://attest.solana.com/docs/guides/ts/how-to-create-digital-credentials
  - https://attest.solana.com/docs/guides/rust/tokenized-attestations
  - https://attest.solana.com/use-cases/civic
  - https://sumsub.com/newsroom/sumsub-and-solana-debut-on-chain-identity-attestations-at-accelerate-new-york/
  - https://github.com/astrohackerx/sasexplorer
  - https://sas.lostatom.org/credentials
  - https://github.com/vowctminibro/wrap

---

### Ethereum Attestation Service (EAS) content apps (https://attest.org, https://easscan.org)
- **Category:** Permissionless attestation protocol on Ethereum and L2s, with a public explorer.
- **Status (as of 2026-10-12):** Live.
- **What it does (2-3 sentences):** Anyone registers a schema and makes onchain or offchain signed attestations. EAS documents a content-authenticity pattern: a journalist attests to an article hash and URL, an editor attests by referencing that attestation, and readers can add attestations. EASScan explorers per chain let anyone view attestations and create them without code.
- **Target customer:** Developers. Content use is mostly reference designs rather than shipped brand products.
- **Onboarding flow (step by step, as documented, no-code path):**
  1. Open easscan.org for a chain.
  2. Pick a schema.
  3. Click "Attest with Schema".
  4. Fill the fields, optionally setting expiry, refUID and revocable.
  5. Choose onchain or offchain.
  6. Sign with a wallet.
  - Wallet required. Source: EAS docs tutorial.
- **Pricing:** Open-source public good with no protocol fee documented. Onchain attestations cost gas, with no exact figure (it varies by chain). Offchain attestations are free to sign. Checked 2026-10-12.
- **Content apps found:** No shipped brand "is this official" product on EAS was found. The EAS docs carry a content-authenticity use-case page with a `contentHash` + `urlOfContent` schema. The EAS team's own Paragraph guide covers agent attestations, including fact-check attestations.
- **What it does well (specific, evidence-backed):**
  - **refUID chaining** (journalist, then editor approval) is a clean model for "drafted by X, approved by Y".
  - Offchain signed attestations that can be published to IPFS later.
  - A public explorer per chain, plus GraphQL.
- **What it lacks vs JamJam full build plan:** No product layer: no brand kit, approvals UI, text verify page or run/pay features (B1-B6, R1-R9, P3, Y1-Y3). Wallet signing is required, which conflicts with P4.
- **What JamJam should steal / learn:** Model approval as a linked record. A post attestation should reference the kit-version attestation and the approver record, so the Ledger shows a chain: kit v1, then approved post, then retraction.
- **Coverage vs loop:** Build: No · Run: No · Prove: Partly (primitive) · Pay: No
- **Sources:**
  - https://attest.org/
  - https://github.com/ethereum-attestation-service/eas-docs-site/blob/main/docs/idea--zone/use--case--examples/content-authenticity.md
  - https://github.com/ethereum-attestation-service/eas-docs-site/blob/main/docs/tutorials/make-an-attestation.md
  - https://paragraph.com/@ethereum-attestation-service/builder-guide-agent-based-attestations

---

### Farcaster / Lens verified accounts (https://farcaster.xyz, https://lens.xyz)
- **Category:** Decentralised-social account verification badges.
- **Status (as of 2026-10-12):** Farcaster: account verifications were announced in May 2025, as a badge granted after connecting socials. A community summary cites 2 socials, 18+ month-old accounts and a $25+ wallet balance; that summary is unverified against official docs. Lens: no current brand or official-account verification programme was found (unverified).
- **What it does (2-3 sentences):** Farcaster verification marks an account as a real, established person for feed ranking and anti-spam. It isn't brand-official verification and isn't per-post provenance.
- **Target customer:** Individual users.
- **Onboarding flow:** Connect required socials (X, phone or GitHub per the community post) and meet the thresholds. The badge is private at launch per Varun Srinivasan's cast. Source: farcaster.xyz casts (May 2025).
- **Pricing:** Free (balance threshold per the unverified community post).
- **What it does well:** Low-friction badge tied to existing social proof.
- **What it lacks vs JamJam full build plan:** No brand or org verification, no per-post provenance, no public verify page (P2, P3). Nothing in Build, Run or Pay.
- **What JamJam should steal / learn:** Use linked socials as proof inputs (an "official accounts" record in P2), checked by a challenge post or OAuth.
- **Coverage vs loop:** Build: No · Run: No · Prove: Partly (account-level only) · Pay: No
- **Sources:**
  - https://farcaster.xyz/v/0xe281afbd
  - https://farcaster.xyz/mdf197/0x0193ceab

---

### X Premium Business, formerly Verified Organizations (NEW, not in assignment: the incumbent "official account" registry) (https://x.com)
- **Category:** Platform-native official-account verification (gold check plus affiliate badges).
- **Status (as of 2026-10-12):** Live. Verified Organizations was split on 2025-10-07 into Premium Business (gold check) and Premium Organizations (grey, for governments).
- **What it does (2-3 sentences):** An approved company account gets a gold checkmark and square avatar. On Full Access, it can affiliate staff and sub-brand accounts, which then show the company's logo badge. That is X's answer to "is this account really the brand's?"
- **Target customer:** Businesses, non-profits, political parties on X.
- **Onboarding flow:**
  1. Apply from the official account with business details.
  2. Pay for a tier.
  3. Pass X's review.
  4. The badge appears.
  5. Invite affiliates; each must accept before their badge appears.
  - Web-only portal.
  - Source: X help centre as summarised by xautopilot (checked 2026-09-29) and ClimbX (checked 2026-08-27).
- **Pricing (US, ex-tax, X help centre via secondary sources checked 2026-09-29):**
  - **Basic:** $200/mo or $2,000/yr. Gold check, no affiliates.
  - **Full Access:** $1,000/mo or $10,000/yr, plus $50/mo ($600/yr) per affiliate.
  - Both currently include a limited-time ads credit.
  - Premium Organizations: $1,000/mo.
  - I couldn't fetch X's own help page directly, so these figures come from secondary sources that cite it.
- **What it does well:**
  - The account-level official signal everyone recognises.
  - Affiliates link people to the brand.
  - Includes impersonation-defence tools on Full Access.
- **What it lacks vs JamJam full build plan:**
  - X only. No per-post provenance: a screenshot of a fake post can't be checked (P3).
  - Covers no off-X channels (blogs, LinkedIn, Telegram), and there is no public cross-platform ledger (P1, P2).
  - Expensive for small brands. Nothing in Build, Run or Pay for content.
- **What JamJam should steal / learn:**
  - **Affiliates** are the model for JamJam's free partner and ambassador seats: register "official ambassador of Brand X" as an attestation and show it on Verify. Price anchor: X charges $50/mo per affiliate, and JamJam gives them free (ADR-003). That is a sharp pitch line.
- **Coverage vs loop:** Build: No · Run: No · Prove: Partly (account-level, one platform) · Pay: No
- **Sources:**
  - https://techcrunch.com/2025/10/07/x-splits-verified-organizations-into-premium-business-and-premium-organizations/
  - https://xautopilot.app/blog/x-premium-business
  - https://climbx.so/blog/how-to-get-gold-checkmark-on-twitter
  - https://deliveredsocial.com/x-verification/

---

### Doppel (https://www.doppel.com)
- **Category:** AI-native digital risk protection: impersonation detection and takedown ("social engineering defense").
- **Status (as of 2026-10-12):** Live. Raised a $70M Series C in Nov 2025 at a valuation above $600M ($124M raised in total per third-party profiles).
- **What it does (2-3 sentences):** It scans social platforms, domains, ads, app stores, messaging (Telegram, Discord) and the dark web for fake profiles, phishing and scam ads. A "Threat Graph" links them into campaigns, and agentic AI with analyst oversight files takedowns. Doppel states a median takedown under 10 hours and a median phishing-URL mitigation of 12 minutes.
- **Target customer:** Enterprise security and brand teams. Third-party reviews call it strong for crypto and fintech.
- **Onboarding flow:** Sales-led. Book a demo; a free "brand risk audit" is commonly offered, per a third-party review (unverified on doppel.com). No self-serve trial. Onboarding details (asset lists, logos, executive names) aren't published, so the steps are unverified.
- **Pricing:** Quote-only. Not published on doppel.com. One third-party estimate puts annual contracts in the mid-to-high five figures (unverified; that is a reviewer's estimate). Checked 2026-10-12.
- **What it does well (specific, evidence-backed):**
  - Speed claims backed by stated medians.
  - Covers Telegram and Discord, where crypto scams live.
  - Proof-of-action logs and ROI dashboards for audits.
  - Integrates with SIEM/SOAR tools (Splunk, Tines).
- **What it lacks vs JamJam full build plan:**
  - Reactive only: finds fakes after the fact and has no positive "this is official" registry (P1-P3).
  - No public verify page for audiences.
  - No brand building, content or pay (B, R, Y).
  - Enterprise pricing puts it out of reach for small crypto teams.
- **What JamJam should steal / learn:**
  - Position Verify as the **proactive complement** to takedown vendors: "Doppel removes the fakes, JamJam proves the real ones."
  - Later, offer an export of the official-accounts and approved-posts ledger as an allowlist that takedown vendors or community mods can check against (this is also how ZeroFox and BrandShield avoid taking down licensees).
- **Coverage vs loop:** Build: No · Run: No · Prove: Partly (negative proof via takedowns) · Pay: No
- **Sources:**
  - https://www.doppel.com/product/brand-protection
  - https://www.doppel.com/platform
  - https://www.cybervendorguide.com/tools/doppel
  - https://oryndex.co/tools/doppel
  - https://www.challengingvoice.com/tools/doppel/

---

### ZeroFox (https://www.zerofox.com)
- **Category:** External cybersecurity and digital risk protection (brand, domain, executive protection plus takedowns).
- **Status (as of 2026-10-12):** Live, private-equity owned (taken private by Haveli Investments; Cyber Vendor Guide dates completion to 13 May 2024). Brand protection is sold on the HNTR platform per Cyber Vendor Guide.
- **What it does (2-3 sentences):** It monitors 180+ platforms (social, app stores, forums, marketplaces, dark web) for impersonation, phishing, counterfeits and deepfakes, and runs takedowns through its "Global Disruption Network". It also keeps "rebound monitoring" running after a takedown.
- **Target customer:** Enterprise security, brand and marketing teams.
- **Onboarding flow:** The pricing page describes three guided steps with "a ZeroFox pro". The vendor states that you define brand assets (logos, products, executives, domains, accounts), monitoring then begins, and analysts tune it. Sales-led, no self-serve.
- **Pricing (zerofox.com/pricing, checked 2026-10-12):** Bundles are quoted, with no dollar figures shown. The entry bundle includes 2 brand protections, 10 domain protections and 250 takedowns/yr. Higher bundles go to 5 brands / 50 domains / 10 executives / 500 takedowns, and 50 brands / 100 domains / 100 executives / 1,000 takedowns. Only successful takedowns count toward the allotment.
- **What it does well:**
  - Transparent unit definitions: brands, domains, executives and takedowns per year.
  - Only completed takedowns are billed.
  - Rebound monitoring after a takedown.
  - Breadth: 180+ platforms and 300+ app stores.
- **What it lacks vs JamJam full build plan:** Same as Doppel: reactive, with no positive registry or public verify (P1-P3), and no build, run or pay.
- **What JamJam should steal / learn:** Package by named units. For JamJam that could be brands, registered posts per month and official accounts, and only successful registrations should count.
- **Coverage vs loop:** Build: No · Run: No · Prove: Partly (negative proof) · Pay: No
- **Sources:**
  - https://www.zerofox.com/pricing/
  - https://www.zerofox.com/solutions/protection/brand-protection/
  - https://www.zerofox.com/use-cases/takedowns/
  - https://www.cybervendorguide.com/tools/zerofox

---

### BrandShield (https://www.brandshield.com)
- **Category:** Brand protection and anti-phishing with in-house enforcement.
- **Status (as of 2026-10-12):** Live. BrandShield Systems plc is listed on London's AIM. It says it serves 500+ brands with a 98% takedown success rate (per Cyber Vendor Guide).
- **What it does (2-3 sentences):** It monitors websites, domains, social, marketplaces, ads, app stores, the dark web and AI answers for counterfeits, impersonation and phishing. Its AI.ClusterX engine groups related threats, and an enforcement team handles takedowns.
- **Target customer:** Mid-market and enterprise brands.
- **Onboarding flow:**
  1. Book a demo.
  2. A dedicated account manager handles onboarding (G2 reviews quoted on AWS Marketplace).
  3. Supply trademarks and brand assets (rfp.wiki notes setup friction there).
  4. Choose managed, self-service or hybrid enforcement.
  - Trial: 90 days for the anti-counterfeit solution only (itechguides, checked 2026-09-21).
- **Pricing:**
  - **Managed Anti-Phishing on AWS Marketplace:** $22,000 per 12-month contract per unit. Includes unlimited standard takedowns, a capped number of managed premium takedowns, and 24/7 SOC support.
  - Other packages are quote-only.
  - Checked 2026-10-12.
- **What it does well:**
  - Takedown follow-through (G2 reviews).
  - A dashboard to approve before takedown, so paying licensees aren't removed.
  - Flexible service models.
  - Monitors brand abuse in AI-generated answers.
- **What it lacks vs JamJam full build plan:** Reactive; no positive registry or public verify (P1-P3); no build, run or pay.
- **What JamJam should steal / learn:** The licensee allowlist problem shows that brands need a canonical list of who is officially allowed to speak for them. That is JamJam's P2 registry for official accounts, ambassadors and partners.
- **Coverage vs loop:** Build: No · Run: No · Prove: Partly (negative proof) · Pay: No
- **Sources:**
  - https://aws.amazon.com/marketplace/pp/prodview-i5lv242xkd6no
  - https://www.brandshield.com/products/
  - https://www.brandshield.com/impersonation-protection/
  - https://www.itechguides.com/products/brandshield/
  - https://www.rfp.wiki/marketing/brand-protection-software/brandshield/corsearch
  - https://www.cybervendorguide.com/tools/brandshield

---

### Fox Verify (NEW, not in assignment: onchain text and article provenance by a publisher) (https://www.verifymedia.com)
- **Category:** Open-source onchain content-signing and licensing protocol for publishers.
- **Status (as of 2026-10-12):** Live as a site and protocol. The site now pitches licensing to AI companies. The 2024 plan to move to a dedicated Polygon CDK L2 was announced, but its current state is unverified. Consumer tool: verify.fox (beta). Its current availability wasn't checked live.
- **What it does (2-3 sentences):** A publisher hashes each article or image (keccak256), signs a metadata file with a registered key, and mints a token for the hash in a "ContentGraph" contract. Anyone can recompute the hash and look up the publisher. Fox had registered 300K+ articles and images by Jun 2024, and TIME was the first external publisher.
- **Target customer:** Large media publishers and AI licensees.
- **Onboarding flow:** Publishers contact Verify. Content flows from the publisher's CMS through a technical pipeline (verifymedia.com). There is no self-serve option.
- **Pricing:** Unverified (not published).
- **What it does well:** A proven pattern for text: register an article hash from the CMS at publish time, with a public consumer check.
- **What it lacks vs JamJam full build plan:** Publisher-only and pipeline-heavy. No brand kit, approval gates, social posts or pay (B, R, Y).
- **What JamJam should steal / learn:** Bind the signed metadata to the content hash (asset ID inside the signed file), so the record proves both the content and the publisher in one signature.
- **Coverage vs loop:** Build: No · Run: No · Prove: Yes (text and images) · Pay: Partly (AI licensing)
- **Sources:**
  - https://www.verifymedia.com/
  - https://docs.verifymedia.com/how-it-works
  - https://www.foxcorporation.com/news/corp-press-releases/2024/fox-announces-time-as-its-first-publishing-partner-on-verify-protocol/
  - https://polygon.technology/blog/update-fox-corporation-to-upgrade-verify-beta-to-dedicated-l2-built-with-polygon-cdk-announces-time-as-first-publishing-partner

---

## Segment takeaways
- **Nobody joins "make the content" with "prove it is official".** Every provenance tool here starts after the content exists, and every brand-protection tool starts after the fake exists. None builds the brand, drafts the post, gates the claims and then registers it. JamJam's loop is the differentiator here, not provenance alone.
- **Text is the gap, and it is closing.** The C2PA text spec only landed in January 2026, and Encypher already sells it (free verify, free publisher signing, $99-$4,000/mo for AI marking). Adobe's consumer app is still JPG/PNG in beta. JamJam should treat Encypher as the main reference for text verify UX, and consider also emitting C2PA text labels so posts verify in standard tools.
- **Surviving stripping needs a lookup, not just embedded metadata.** Adobe recovers images with watermark plus fingerprint, Numbers with image-similarity search, and Encypher with invisible characters (which may be stripped by social platforms; unverified per platform). JamJam's paste-text, then normalise, hash and fuzzy-match against the ledger, works even when all formatting is gone. Make that the headline claim and show "close matches" instead of a bare "not found".
- **Official-account verification is platform-locked and expensive.** X charges $200-$1,000/mo, plus $50/mo per affiliate, for an X-only badge. A cross-platform registry of official accounts and ambassadors with free affiliate seats is a clear, priceable wedge for P2/Y2.
- **Brand-protection vendors (Doppel, ZeroFox, BrandShield) are reactive and enterprise-priced** (quote-only; BrandShield's public SKU is $22,000/yr). Position JamJam as the proactive complement, and later export the ledger as an allowlist for takedown vendors and community mods.
- **Onchain-only IP registries struggled.** Story Protocol pivoted away from creator IP in June 2026. Keep "prove" a feature inside a paid workflow (consistent with ADR-003), and keep email sign-in with no wallet (P4). Story, Numbers and EAS all still put tokens, wallets or gas in front of users.
- **Patterns worth adopting:**
  - Free, no-account verify everywhere.
  - Domain proof before a brand name shows as official (Encypher, and JamJam's `domain_verified`).
  - A per-item public profile with a version timeline (Numbers Asset Profile).
  - Linked approval records (EAS refUID: kit, then post, then approver).
  - Separate result rows per proof type, never a single magic badge.
  - A fourth Verify state for retracted or revoked content (SAS supports revocation).
- **No Solana-native app for brand content or official accounts was found** in Solana's SAS launch partners or GitHub searches. Current SAS use is identity, KYC and reputation. JamJam can credibly claim to be early on SAS for brand provenance; avoid "first/only" without a fuller ecosystem scan.

## New competitors found (not in assignment)
- **Encypher**: C2PA text plus media signing and free public verify; free for publishers, $99-$4,000/mo for AI marking. https://encypher.com
- **X Premium Business** (formerly Verified Organizations): gold check plus affiliate badges, $200-$1,000/mo plus $50/mo per affiliate. https://techcrunch.com/2025/10/07/x-splits-verified-organizations-into-premium-business-and-premium-organizations/
- **Fox Verify**: open-source onchain article and image signing for publishers (Fox, TIME); now pitched as AI licensing. https://www.verifymedia.com/
- **DATA Foundation Trace** (Story's successor): onchain audit registry for AI training-data provenance and consent. https://www.coindesk.com/business/2026/06/25/a16z-backed-crypto-firm-rebrands-shifts-focus-to-solving-ai-s-global-copyright-headache
- **SAS Explorer** (community): open-source explorer for SAS credentials, schemas and attestations; useful as a third-party view of JamJam records. https://github.com/astrohackerx/sasexplorer
- **Digimarc**: commercial invisible watermarks used as C2PA soft bindings (relevant if JamJam ever signs images). https://www.digimarc.com/blog/how-digital-watermarks-strengthen-c2pa-content-credentials
- **Corsearch**: brand protection and trademark enforcement, quote-only, a peer of BrandShield. https://www.rfp.wiki/marketing/brand-protection-software/brandshield/corsearch
