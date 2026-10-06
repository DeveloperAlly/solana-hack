---
type: adr
status: accepted
created: 2026-10-06
updated: 2026-10-06
last_edited_by: agent
tags: [adr, wallet, auth, solana, registry]
---
> **Status: accepted.** Sign-in is email only (Supabase OTP); a server Registrar keypair signs every registration; a user wallet is needed only for USDC payouts.

# ADR-006: Split identity from wallet

## Context
- The architecture planned email sign-in that creates an embedded wallet: "Email and a 6-digit code. An embedded wallet (Phantom Connect) is created; no seed phrase, no extension" ([architecture §12.1 as of commit b3e04ff](https://github.com/DeveloperAlly/solana-hack/blob/b3e04ffc7adb00d97a2c273c4616ad9dd64f3421/.agentic/what/context/brand_builder_architecture.md#121-user-flow), step 0). The current §12.1 already reflects the gap below.
- Phantom Connect is not accepting new apps, and its providers are Google, Apple and injected wallets only, with no email ([backend map §7, G-WALLET](../context/backend_map.md#7-architecture-gaps-and-decisions-needed)).
- The owner has no Phantom developer account (owner chat, 2026-10-06; [recorded on issue #4](https://github.com/DeveloperAlly/solana-hack/issues/4#issuecomment-6014295120)).

## Decision
Adopt the G-WALLET proposal in the [backend map](../context/backend_map.md#7-architecture-gaps-and-decisions-needed):
1. **Sign-in:** Supabase email OTP. No wallet is created at sign-in.
2. **Registrations:** a server-held Registrar keypair signs every registration (identity, account, kit, claim, content, persona). Only hashes and ids go onchain ([architecture §7](../context/brand_builder_architecture.md#7-proof-layer-what-gets-registered-when)).
3. **Payouts:** the brand pays and the ambassador receives USDC through an injected wallet (Phantom or another standard wallet), linked to the account by `signMessage`.

## Consequences
- The core demo (intake to verify) needs no user wallet.
- The Registrar key is a server secret: it lives only in the platform's secret store, never in the browser or the repo.
- Each brand has its own payout wallet (`brands.payout_wallet`), set by an owner in Settings › Connections or when prompted on the brand's first "Approve and pay" on the Dashboard; ambassadors link a wallet on Amb-2 and M-2, and their payouts go to the one they select (`profiles.payout_wallet`, recorded on each payout as `payouts.to_address`). Approving a submission (owner or approver) is separate from paying it (owner only, signed by the brand payout wallet) ([backend map](../context/backend_map.md)).
- Copy changes: Onboard-1 (sign-in promises no wallet); Amb-2 and M-2 (link a wallet by `signMessage`); Amb-5a–d and M-5 (remove "Withdraw") ([backend map](../context/backend_map.md#7-architecture-gaps-and-decisions-needed)). Architecture §12.1 step 0 already reflects this.
- Architecture §7 [as of commit b3e04ff](https://github.com/DeveloperAlly/solana-hack/blob/b3e04ffc7adb00d97a2c273c4616ad9dd64f3421/.agentic/what/context/brand_builder_architecture.md#7-proof-layer-what-gets-registered-when) listed "owner wallet" in the identity memo. Under this decision there is no owner wallet at sign-in, and the [current §7](../context/brand_builder_architecture.md#7-proof-layer-what-gets-registered-when) is updated to match: the identity registration is signed by the Registrar and records the brand id and a hash of the verified domain, never the domain text (only hashes and ids go onchain; R27 in the [UI build mission](../../how/missions/mission_ui_build.md)).
- UI build slice S0 proves email sign-in and a Registrar-signed devnet registration ([UI build mission](../../how/missions/mission_ui_build.md) §4, R26).
- Other embedded-wallet providers can still be evaluated later; this ADR does not depend on one.

## Ratification
Ratified by Ally Haire in chat, 2026-10-06 ("OK" to the G-WALLET proposal).
