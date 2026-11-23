# D&D Atlas v3.4.0 — Stability & Permissions, phase 1

## Changes delivered

- Authenticated GET /sync/revisions endpoint in the existing production Cloudflare Worker.
  - Returns only an ID-to-revision map. No character JSON, portraits, private stories, or owner information.
  - Uses the existing session authentication gate and unchanged D1 binding.
- Browser refresh polling every 30 seconds instead of 7 seconds, reducing repeated read requests.
  - Pauses while a modal or form is active, character writes are pending, or an earlier write has failed.
  - Re-checks pending writes and active inputs after the revisions request, to avoid races during an edit.
- Tracks failed writes per character.
  - A successful save of another character does not clear a previous failure.
  - A manual refresh from D1 deliberately clears the local unsaved-warning state.
  - A failure does not automatically reload the character, leaving the unsaved values visible until the user chooses what to do.
- Explicit JSON export warning.
  - Data exported from the authenticated session may omit private stories or fields hidden by the server.
  - Files now include exportScope = visible-to-current-user or local.
  - The app does not claim this is a full database backup.
- GitHub Pages deployment now runs additional Worker access/privacy and sync regression tests.

## Preserved behavior

- D&D 5e 2024, bilingual EL/EN UI, current character sheet UI, and no dice-rolling UI.
- GitHub Pages, Cloudflare Worker, D1, Google Drive image integration.
- Creator-only Activity History and Undo. Creator-only manual downloaded-Drive JSON restore.
- DM character administration and local JSON roster replacement.
- Player edits only their own assigned character; server-side privacy rules remain unchanged.

## Checks performed

- Node syntax tests on the current frontend and extension.
- Worker snapshot tests for authenticated revision metadata, role restrictions, and absence of private story fields in revision responses.
- Cloudflare production Worker script SHA256 was compared to the expected module after deployment.
- Production /health returned status ok.

## Further stability hardening (not included in v3.4.0 phase 1)

- True integration tests with a disposable staging D1 database for all role permissions and protected private fields.
- Atomic group undo for whole-roster Restore, including rollback safety across multiple characters.
- Export of a verified full database backup using server-side controls while preserving private stories.
- Test user sessions for cross-device conflicting writes, deletion/restoration and reconnection while offline.
- Review migration/versioning strategy for character_history schema.

Do not treat source/static tests as a substitute for running these staging scenarios. No live characters were modified as part of this release.
