# D&D Atlas — v3.4.1 isolated D1 integration suite

## Status

**9/9 checks passed** in GitHub Actions using the exact production Worker source from Cloudflare (verified SHA256
`ce3b89c6754f8ecd5453d2865055a4c3e356e3f44059cf106178ed00808a49aa`) and an **ephemeral local D1 database** created by Miniflare.

No production user, character, session, secret value or production D1 database was accessed or copied. The script fetches the deployed Worker **code only** through an authenticated read-only Cloudflare API request; all database records in tests are invented fixtures.

## Test coverage

1. Player sees their own private Background Story, not another player's; DM can read party stories; Creator remains subject to existing redaction.
2. Player cannot edit another character, delete a character, or replace the party.
3. Player can update their own character; a stale second write gets HTTP 409.
4. History/Undo endpoints reject DM and Player; Creator can see redacted activity.
5. DM can replace a local JSON roster without overwriting existing private stories; Creator can undo the grouped operation.
6. /sync/revisions returns metadata only and rejects writes.
7. Group Undo returns HTTP 409 when a player saves a newer change, preserving all involved characters.
8. Anonymous and wrong-origin requests are refused.
9. Direct Google Drive writes remain disabled, and non-Creators cannot call Drive endpoints.

## Running the integration suite

GitHub Actions: `.github/workflows/staging-d1-integration.yml`.

The workflow:
- pins Node 22 and Miniflare `4.20260730.0`;
- fetches *only* the live Worker source with `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_PRODUCTION_API_TOKEN`;
- verifies the expected production SHA to prevent tests drifting silently;
- writes a temporary Worker source inside the isolated runner workspace;
- creates local D1 tables, accounts, tokens, and characters from fake fixtures;
- tests the actual HTTP routes using Miniflare `dispatchFetch()`;
- destroys the local Miniflare environment after testing.

To run locally, provide a verified deployed Worker module file, install Miniflare 4, and run
`ATLAS_WORKER_SOURCE=./verified-production-worker.mjs node --test tests/staging-d1-integration.test.cjs`.

## What remains unverified

This suite runs **real SQLite-backed Cloudflare D1 locally**, not in a separately provisioned **remote Cloudflare staging D1**. It therefore does not prove deployed staging bindings, production data migrations, remote concurrent-write serialization, Cloudflare account access policies, real Google Drive privacy or full backup integrity.

The next stage is a separately isolated Cloudflare staging Worker + staging D1 with test-only users and explicit production/staging binding separation. Do **not** reuse production D1 bindings or real credentials in that environment.

Existing production code and D1 data were not mutated in this test release. The application remains v3.4.1.
