---
type: adr
status: proposed
created: 2026-10-12
updated: 2026-10-12
last_edited_by: agent
tags: [adr, evidence, trust, claims]
---
> **Status: proposed.** Every fact carries a trust class and an owner review decision; the kit snapshot, the drafter and the post claims gate read facts through one allow-list.

# ADR-011: Evidence trust classes and allow-list filters

## Context
- Facts from pages the brand does not control (search results, competitor pages) are planned in slices 3 and 5 ([#33](https://github.com/DeveloperAlly/solana-hack/issues/33), [#35](https://github.com/DeveloperAlly/solana-hack/issues/35)).
- Before this change the kit snapshot and the claims gate used a deny-list (`origin != 'assumption'`). Any new kind of fact passed by default ([issue #57](https://github.com/DeveloperAlly/solana-hack/issues/57)).
- The drafter saw every fact, and registration only checked that cited facts still existed ([issue #57 comment](https://github.com/DeveloperAlly/solana-hack/issues/57)).
- Architecture §3 reserves an evidential `status` (evidenced / inferred / answered / rejected) for the coverage map ([architecture §3](../context/brand_builder_architecture.md#3-data-model)). The approval decision therefore needs its own column.

## Decision
1. **Trust class per fact.** The classes are `owned` (the brand's own site, uploads and exports), `third_party`, `owner_answer` and `assumption`. Each source type declares its class in one registry, [`web/worker/sources/registry.ts`](../../../web/worker/sources/registry.ts).
2. **Owner review per fact.** `review_status` takes `proposed`, `approved` or `rejected`.
   - Owned facts, already quote-checked, and owner answers start `approved`.
   - Third-party facts start `proposed`.
   - The owner approves or rejects through `PATCH /api/brands/:id/evidence/:eid`.
3. **One allow-list.** A fact is usable only when `review_status = approved` and its trust is `owned`, `owner_answer` or `third_party`. The same list governs:
   - the facts offered to the drafter;
   - the kit snapshot (`kits.payload.evidence`);
   - the claims gate;
   - registration, which refuses a section citing a fact outside the list.
   A row with no trust fields is excluded.
4. **Compatibility.** `origin` stays. The old link input accepted any page, so a legacy fact cannot be shown to come from the brand's own site, and every legacy path is read conservatively ([PR #63 review](https://github.com/DeveloperAlly/solana-hack/pull/63)):
   - **Live evidence rows.** Migration 009 ([`spec/db/009_evidence_trust.sql`](../../../spec/db/009_evidence_trust.sql)) backfills `source` as `third_party` and `proposed`, `owner_answer` as `owner_answer` and `approved`, and anything else as `assumption`. A trigger applies the same mapping to rows an older Worker inserts during rollout.
   - **Live source rows.** `sources.kind` defaults to `page` (third-party). The current Worker always writes the kind it classified.
   - **Kit snapshots registered before 009.** `snapshotFact` in [`registry.ts`](../../../web/worker/sources/registry.ts) reads a legacy `source` entry as `third_party` and `proposed`, so it cannot back a post; the brand registers a new kit to use it. A legacy `owner_answer` entry stays usable.
   - On 2026-10-12 the live database held no sources, evidence, kits or posts ([query and result on issue #57](https://github.com/DeveloperAlly/solana-hack/issues/57#issuecomment-6122865718)), so no existing fact or post changes standing.

## Consequences
- A third-party fact can reach a registered kit or support a post only after the owner approves it.
- The claims gate receives each fact's verbatim quote with its claim.
- Computed confidence and the conflict queue (backlog B3a) are not part of this ADR; they belong to the fact-extraction work ([issue #57 comment](https://github.com/DeveloperAlly/solana-hack/issues/57)).
- The UI to approve or reject facts belongs to the UI workstream; the API contract is in the slice 1a PR.

## Ratification
Pending owner ratification.
