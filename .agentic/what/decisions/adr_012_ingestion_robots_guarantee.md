---
type: adr
status: proposed
created: 2026-10-12
updated: 2026-10-12
last_edited_by: agent
tags: [adr, ingestion, robots, exa]
---
> **Status: proposed.** Site ingestion uses Exa as a cache only and drops the Cloudflare rendered-Markdown fallback, so robots.txt is checked before every request JamJam causes.

# ADR-012: Site ingestion reads only what robots.txt allows

## Context
- The accepted ingestion design ([architecture §6.1, Source ingestion row](../context/brand_builder_architecture.md#61-component-design-and-evaluation-accepted-2026-10-12), accepted in [ADR-010](./adr_010_component_list_and_plan_tiers.md) decision 6) says: "Check robots.txt, then one Exa contents call for the home page plus about 8 key subpages … fall back to a plain fetch, then Cloudflare's rendered Markdown for script-only sites, then paste."
- Building it ([issue #33](https://github.com/DeveloperAlly/solana-hack/issues/33), [PR #71](https://github.com/DeveloperAlly/solana-hack/pull/71)) showed that two of those steps cause requests robots.txt cannot be checked against first:
  - **A live Exa fetch.** Exa follows redirects itself, so a destination the site's robots.txt disallows is fetched before JamJam sees the final URL ([PR #71 review](https://github.com/DeveloperAlly/solana-hack/pull/71#discussion_r4247564035)). Exa's contents endpoint takes `maxAgeHours`, where `-1` "always uses cache" and makes no live fetch ([Exa get-contents reference](https://exa.ai/docs/reference/get-contents)).
  - **Cloudflare's rendered Markdown.** The browser follows a page's meta refresh or script navigation before the final URL is reported, and those navigations are not listed in `redirectChain` ([PR #71 review](https://github.com/DeveloperAlly/solana-hack/pull/71#discussion_r4247702533), citing the [Browser Rendering API](https://developers.cloudflare.com/api/resources/browser_rendering/subresources/markdown/methods/create/)). JamJam cannot gate a navigation it never sees.
- So the accepted design's first step, "check robots.txt", and two of its fallbacks cannot all hold at once. This ADR proposes which one gives way. Only the owner ratifies ([AGENTS.md rule 4](../../../AGENTS.md)).

## Decision
1. **robots.txt holds for every request JamJam causes.** JamJam's own reader follows redirects one hop at a time and checks robots.txt before each hop, up to 20 hops ([`web/worker/ingest.ts`](../../../web/worker/ingest.ts), [`web/worker/sources/robots.ts`](../../../web/worker/sources/robots.ts)).
2. **Exa is a cache only.** Every Exa contents request sets `maxAgeHours: -1`, so Exa returns a copy it already holds and never fetches anything for JamJam. Exa's own subpage crawl is not used. Subpages are picked from the home page's links and checked against robots.txt before they are requested ([`web/worker/sources/site.ts`](../../../web/worker/sources/site.ts)).
3. **A page Exa has not cached is read by JamJam's own reader.** With no `EXA_API_KEY` the reader reads the home page and up to 8 key subpages itself.
4. **The rendered-Markdown fallback is dropped.** A script-only site with no Exa cached copy goes to the next accepted fallback, paste.

## Consequences
- **Fewer script-only sites prefill.** A site that ships no text without JavaScript (jamjam.tech is one) is read only when Exa holds a cached copy; otherwise the owner pastes. This lowers key-page coverage on those sites against the §6.1 measure (≥ 90% on the fixture sites), and that loss is measured on the §13 fixtures, not assumed.
- **Cost falls slightly.** A cache-only Exa request is billed like any contents request ([Exa pricing](https://exa.ai/pricing)), and there is no Browser Rendering usage.
- **No canvas change.** The screens stay the same: paste was already the last fallback in the accepted design, so only which sites reach it changes ([AGENTS.md rule 8](../../../AGENTS.md)).
- **If this is rejected,** the accepted design stands. A live Exa fetch and the rendered fallback come back, and the architecture records that robots.txt is checked for the starting URL only, not for redirects or browser navigations.
- **PR #71's code already follows this ADR.** Merging #71 ships it before ratification, so ratify, reject or amend before that merge. The architecture §6.1 row keeps its accepted text until then.

## Ratification
Pending owner ratification.
