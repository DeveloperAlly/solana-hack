---
type: research
status: active
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [research, lead-finder, reuse, compliance]
---
> **Status: active.** Research input (2026-10-06) for Find your customer (experimental).

# GamersLab lead finder: review and reuse for Waterlily

*Review 2026-10-06 of the founder's public repo `DeveloperAlly/leadgen-gamerslab`.*

## What it does
- Finds Steam game publishers, enriches them, scores them, and drafts outreach for a person to review. Sending is gated behind human approval.
- **Sources:**
  - SteamSpy tags and Steam `appdetails` (public APIs)
  - DNS MX and WHOIS
  - Exa (primary) / SerpAPI (fallback) search
  - OpenRouter LLMs
  - fetches of publisher sites and contact pages
- **Scoring:**
  - a rule-based `Pre-Score` (multiplayer, leaderboards, workshop, phase, reviews)
  - an LLM fit score with evidence and risk flags
  - tiers A/B/C
  - a daily draft budget with dedupe
- **Stack:**
  - n8n workflow
  - Supabase Postgres and Edge Functions
  - React 18 + Vite dashboard with a white-label build: Dashboard, Discovery, Prospect tracking, Context editor, Sources, Review gates, Email

## Data handling
- It does **not** scrape social profiles (LinkedIn/X).
- It **does** collect contact data:
  - harvests emails from company websites by regex
  - falls back to WHOIS registrant details
  - guesses role addresses (`contact@domain`)
  - extracts founder names and quotes
- Accurate description: "company data and public web sources, plus contact harvesting from company sites and WHOIS."
- **Compliance:** the Australian Spam Act 2003 prohibits using address-harvesting software and harvested lists to send commercial messages. GDPR and the Australian Privacy Principles require a lawful basis, notice, retention limits and suppression lists, none of which are implemented.

## Reuse plan for Waterlily
- **Lift:**
  - UI components (LeadRow, ProspectCard, ScoreBadge, ConfidenceChip, GateBanner, theming)
  - Prospect tracking and Dashboard layouts
  - evidence and risk columns
  - the pre-score and budget/dedupe pattern
  - MX check
- **Generalise:** a pluggable source adapter (search queries built from the brand kit's ICP and keywords, company-data APIs, owned channels and inbound), and per-brand rows for ICP, keywords and signal weights in place of hardcoded config.
- **Drop:** regex email harvesting, WHOIS lookup, guessed addresses.
- **Demo scope:** discovery from brand-kit keywords, then a scored lead list, then drafted messages. **No sending.**
- **Effort:** about 18–26h for a full port. For the hackathon it's tagged experimental (UI plus seeded data).

## Other risks
- It runs on free tiers (rate-capped).
- The live workflow version isn't exported.
- It has no tests.
- Its auth needs hardening before any reuse.
