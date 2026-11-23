# D&D Atlas — Manual Google Drive JSON restore (v3.3.8)

## Current architecture

Cloudflare D1 is the live source of truth for all characters. The Creator keeps a private JSON backup in Google Drive and manages that file **manually**. The Atlas app **does not read or write to Google Drive directly** for character backups. The separate Google Drive image integration remains unchanged.

## Restore: Google Drive JSON → D1

1. The Creator downloads the private character JSON backup from their Google Drive to their own device.
2. In D&D Atlas, the Creator opens **Account → Restore from downloaded Drive JSON**.
3. The Creator selects that local JSON file using the file picker.
4. The application parses and validates the character roster and requests **two confirmations** explaining that the entire D1 roster will be replaced.
5. The existing authenticated **POST /characters/replace** Worker endpoint replaces the D1 roster atomically and records history snapshots.
6. The user sees the refreshed roster. **Google Drive is not changed**.

This restores the whole roster, not just missing characters. Any characters absent from the selected backup are deleted from the D1 roster. DM retains its previously agreed right to replace the roster from a generic local JSON file, but **only Creator gets the dedicated Drive Restore action**. Player cannot perform either operation.

## Manual backup: D1 → Google Drive

The Creator may use a manually prepared JSON or the app's local JSON export and then replace the backup file in Google Drive themselves. **Important:** the app's export is based on the data visible to the account. Server-side story redaction may mean it is not a complete backup of every private character field; verify the exported JSON before treating it as full recovery data.

## Permissions and privacy

- **Creator:** special Drive JSON restore UI, character management, Activity History/Undo.
- **DM:** character management and ordinary local JSON import/replacement, but not the dedicated Drive Restore UI.
- **Player:** edits only own character; no replacement, deletion, or Drive restore.
- **Server:** POST /characters/replace checks Creator/DM; other endpoints for Google Drive API are disabled with HTTP 410 even if manually called.
- Private Background Story data remains subject to the existing server-side protection.
- History/Undo continue to work as before, and no automatic Drive import occurs on login, refresh, save, or startup.

## Credentials and deployment

**No Google OAuth credentials are required.** Do not set or use GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, DRIVE_JSON_FILE_ID, or DRIVE_BACKUP_ENCRYPTION_KEY for character backup/restore.

This change is distinct from the existing dndatlas-drive image Worker, whose public-image API-key integration remains in place.

## Tests

The patch is SHA-locked to the previously verified deployed JavaScript module and compares the production extension to a GitHub historical source before replacing it. CI checks syntax, Creator/DM permissions and that OAuth code is gone. The production deployment workflow is disabled from automatic re-runs after the release.
