# D&D Atlas v3.4.2 — Phase 1 Stability & Permissions consolidated release

## Creator / DM immediate sheet editing

Creator and DM can directly edit:
- Skill proficiency dots in Overview and Character (None -> Proficient -> Expertise -> None).
- Maximum Hit Points (1..99999), clamping current HP when the maximum is reduced.
- Passive Perception (0..99, or blank to use 10 + Perception skill modifier).
- Walking speed (0..300 feet).

All values use D&D 5e 2024 modifiers and existing UI. The new `PATCH /characters/:id/dm-override` endpoint validates both **role** and **revision**, accepts only the selected field, and records an Activity History entry. No arbitrary JSON overposting, journals or private stories are sent from the client for quick changes. Players retain the existing legal 2024 Builder choices but cannot call this endpoint.

## Undo transaction safety

The Character History single and group Undo flows now use an `atlas_undo_guard` database CHECK constraint, evaluated **inside the D1 batch transaction**. The guard verifies the latest History ID and exact current JSON / owner / revision for every affected character. A false check aborts the transaction, rolling back the entire group. Single-record groups can now be undone as a group. Two Creator confirmations remain in the UI.

Reference: Cloudflare D1 Workers `batch()` guarantees transactional rollback on statement failures:
https://developers.cloudflare.com/d1/worker-api/d1-database/#batch

## Backups: no Google OAuth

- Creator may download an encrypted **full party data** backup from D1 using `GET /backup/secure`.
- The backup contains all character data, including private stories, **only inside AES-256-GCM authenticated ciphertext**.
- Creator cannot view other players' private story plaintext in the backup response.
- The Creator manually saves/updates the resulting JSON in Google Drive. The app does **not** access Google Drive directly for character backup.
- Creator can select a downloaded sealed backup in the existing JSON Restore picker. `POST /backup/secure/restore` decrypts and restores every character, including private stories.
- Existing untrusted/plaintext imports are still supported and continue to preserve existing private stories against overwrites.
- Permission-filtered client JSON exports marked `exportScope=visible-to-current-user` are blocked from full roster restore, to prevent silent data loss.
- Every full restore is logged and its previous character snapshots remain available in Activity History.

### One-time Cloudflare secret required for secure backups

Set in **Cloudflare -> Workers & Pages -> dndatlas-api -> Settings -> Variables and Secrets**:

`ATLAS_BACKUP_SECRET`: independent, random string of at least 32 characters, stored as a Cloudflare Secret. Back this up safely offline in your password manager. It must remain unchanged to decrypt old backups.

**Never send the secret in chat, commit it to GitHub or place it in frontend config.**
Without this secret, new encrypted backup/restore endpoints return HTTP 503; all existing app functionality remains intact. Google OAuth is **not** required.

### Scope of encrypted backup

The secured export contains the complete **character roster**, including private fields. It does **not** include D1 login credentials, account sessions, image tags or campaign session records. D1 Time Travel still provides broader database recovery when available. Ownership for existing characters is preserved according to the current D1 user mapping.

## Local integration tests

The main suite executes the verified production Worker code with the proposed extension in an isolated Miniflare D1. It covers real HTTP sessions (Creator/DM/Player), authorization, privacy redaction, single and grouped Undo, stale revision protection, DM quick edits and invalid values, encrypted backup confidentiality/integrity and restoring private stories, and D1 transactional rollback.

No live D1 records are used.

## Separate remote staging: still blocked by Cloudflare access

A read-only environment inspection on 2026-11-23 found:
- `dndatlas-api-staging` settings were unavailable with the configured API token.
- D1 listing API returned an unsuccessful status (token missing listing permission, or inaccessible endpoint).
- Production Worker settings were accessible, with D1 binding `DB`.

**Never point staging Workers at production DB.** Provision a separate D1 database and Worker, grant appropriate scoped permissions and set a staging-only `ALLOWED_ORIGIN` before running remote integration tests. The locally isolated D1 suite is mandatory in CI meanwhile. Remote staging should not be described as completed.

## Existing features preserved

GitHub Pages, PWA cache, the existing UI, D&D 5e 2024 engine, EL/EN translations, Drive image integration, Creator/DM management, Player ownership restrictions, and no dice rolling UI.
