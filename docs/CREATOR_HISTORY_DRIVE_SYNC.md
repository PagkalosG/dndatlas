# D&D Atlas production: Creator History and Google Drive backup

Version: 3.3.6. Worker deployed through the SHA-locked GitHub Action.
D1 remains the single source of truth. Google Drive backup/restore is NEVER automatic.

## Creator actions

- **Activity History & Undo:** Creator-only GET /history and POST /history/:id/undo.
  - New character creates, edits, deletes, bulk operations, JSON imports, and roster replacements create snapshots.
  - A newer change to the same character blocks undo of an older event.
  - Undo is itself logged.
  - Private Background Story contents never appear in history responses.
  - History starts tracking changes only from deployment onward.
- **Restore: Drive to D1:** Creator-only POST /sync/drive/import.
  - Fetches the configured Drive JSON with a Google OAuth access token.
  - Validates the full roster (up to 25 unique character IDs).
  - Replaces the D1 character roster atomically, with history snapshots.
  - Uses two explicit confirmations in the client. A standard refresh never imports Drive data.
- **Backup: D1 to Drive:** Creator-only POST /sync/drive/publish.
  - Collects current D1 data server-side, encrypts it with AES-256-GCM and saves a JSON envelope.
  - Makes a versioned Drive copy of the previous backup BEFORE replacing the configured file.
  - Fails rather than overwriting when the previous version cannot be archived.
- GET /sync/drive/status returns configuration state, never tokens or secrets.

## Required Cloudflare Worker bindings for dndatlas-api

The current deployed production Worker does not have these configured yet.
Configure Worker > Settings > Variables and Secrets:

| Variable | Type | Purpose |
|---|---|---|
| GOOGLE_CLIENT_ID | Secret | Google OAuth client ID |
| GOOGLE_CLIENT_SECRET | Secret | Google OAuth client secret |
| GOOGLE_REFRESH_TOKEN | Secret | Refresh token for the Google account authorized to access the backup file |
| DRIVE_JSON_FILE_ID | Secret or text | Exact Drive file ID of the backup JSON |
| DRIVE_BACKUP_ENCRYPTION_KEY | Secret | Independent randomly generated secret, at least 32 characters |

Never send these values in chat or commit them to GitHub.

OAuth must have adequate permissions to read, copy, and update the selected Drive file. Prefer the least-privileged Drive scope where the file is owned/created or explicitly granted to that OAuth application. A read-only API key from the image Worker is NOT adequate.

The configured Drive JSON must already exist and be accessible to the OAuth application. For initial migration, a plaintext JSON with top-level characters is supported as the restore source. On the first backup the file becomes an encrypted JSON envelope, not a plain character list. Save the encryption key separately; losing it means losing the ability to decrypt encrypted backups.

The existing image Worker dndatlas-drive remains separate and unchanged.

## Data safety

- Do not run restore to test connectivity. Use GET /sync/drive/status first.
- All write operations check the caller's role on the server.
- A Player can edit only their assigned character; DM can edit party characters but cannot use history/undo or Drive sync.
- D1 snapshots are stored in a character_history table created lazily on the first history operation.
- Previous snapshots can contain private fields. They are kept only in D1; history responses never return them.
- This is not a substitute for a separate database-level backup or Cloudflare Time Travel.

## Verification

The GitHub Actions workflow validate-production-history-drive.yml checks the published Worker source SHA, JavaScript syntax, privacy, role access and encryption round-trip. The production deployment workflow deploy-production-history-drive.yml is manual only after the release. The GitHub Pages workflow verifies the PWA build.
