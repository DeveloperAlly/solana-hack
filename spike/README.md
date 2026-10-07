# Devnet spike (P0, G-SAS)

Throwaway, devnet-only test of the Waterlily wallet setup. It is not product code.

- `src/actions.mjs`: health, fund (devnet airdrop), sas (credential, schema, one attestation, read back), token (test mint, 1000 tokens to the brand wallet).
- `src/node-run.mjs`: runs on GitHub Actions. It generates the Registrar, brand and ambassador keypairs and writes `out/results.json`. Keys are written only as `out/keys.enc.json`, encrypted to `spike-public.pem`; the private half of that key is not in this repo.
- `src/workerd-test.mjs` and `wrangler.toml`: checks that the same SDK runs in local workerd (`wrangler dev`, no deploy).
- To run again, change `RUN` (each run makes new wallets).

Never put plaintext keys in this repo.
