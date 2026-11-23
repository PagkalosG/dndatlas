# D&D Atlas v3.4.1 — Stability & Permissions, phase 2

## Shipped in v3.4.1

- **Atomic group Undo** for multi-character roster replacements (Creator only):
  - Each roster replacement generates a unique history group.
  - The History UI offers **Undo all N changes** for the group instead of misleading individual Undo buttons.
  - The Worker refuses individual Undo of group entries.
  - The server requires the exact latest history revision and unchanged character data/ownership for **every** member of the group.
  - Ownership collisions or missing assigned users block the entire operation.
  - One D1 `batch()` performs owner clearing, character deletion/recreation, assignments, and the undo history entries.
  - Every successful Undo creates new `undo-group` history entries, with links to the undone versions.
  - The UI requires two separate confirmations.
- **Privacy-safe history display:**
  - Before/after values are shown only for an allowlist of numeric game fields (HP, speed, AC etc.).
  - Free-text stories, notes, portraits, inventory objects, nested metadata, unknown fields and arbitrary text are not returned as history values.
  - Snapshots remain in D1, never in the History API response.
- **Tests**:
  - Creator/DM route permission checks.
  - Group Undo success prepares a single D1 batch with all needed statements.
  - Group Undo with newer changes rejects without calling D1 batch.
  - History private-string and portrait redaction.
  - Existing 2024 rules and v3.4.0 stability regression tests.

## Preserved

- Cloudflare D1 canonical character data, GitHub Pages PWA, Drive image Worker integration.
- Creator-only downloaded JSON Restore from manually managed Drive backups, with no OAuth.
- DM character management and generic local JSON replacement; Players edit only their own assigned character.
- Bilingual EL/EN UI, 2024 rules, current Atlas character sheet and no dice UI.

## Known limitations and further work

1. **Staging integration tests** using a separate Cloudflare D1 database and test sessions are still pending; the current tests exercise server code with a simulated D1 interface.
2. Data changes between preflight reads and D1 batch execution are a remaining concurrency race. Full serialized state verification would require an additional D1 transaction/optimistic versioning strategy. The new endpoint checks all revisions just before issuing the batch but should not be described as race-free under concurrent writes.
3. History allows 25 affected characters per grouped Undo and displays at most the configured recent history window.
4. Full unredacted backups require a separate secure design respecting the private Background Story rule; client JSON exports may be filtered.
5. Historical changes made before snapshots were enabled cannot be undone.

**Release procedure:** The production Worker was patched from the live module with a SHA guard, tests passed, and the deployed module bytes were independently compared against the verified build. No production character records were intentionally altered during release.
