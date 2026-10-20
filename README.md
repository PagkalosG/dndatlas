# D&D Atlas v3.0 — Cloudflare D1 multiplayer release

D&D 5e 2024 rules only. GitHub Pages frontend + Cloudflare Worker/D1 for user accounts, role-based editing, shared character state and image tags. A separate Cloudflare Worker handles Google Drive campaign images.

**Installation: read `README_EL.md` first.** Do not upload `cloudflare/` as GitHub Pages app content. Configure a D1 database, deploy `cloudflare/api/src.js` with the `DB` binding, set `BOOTSTRAP_TOKEN` and `RECOVERY_PEPPER` as Secrets, initialize the Creator and securely retain the one-time recovery codes. In the frontend, set `data/api-config.json` to `{ "enabled": true, "apiUrl": "https://YOUR-API.workers.dev" }`.

The frontend remains in local-only legacy mode if the API is disabled. The account role enforcement applies only after the authenticated D1 mode is enabled. Creator controls user accounts and PIN resets. DM can edit all character stats and view private stories but cannot administer PINs. Player can edit only the assigned character. A private story is withheld from all users except the owner and DM, including from Creator if Creator is not the owner.

For the existing Drive gallery, upgrade the *other* Worker using `cloudflare/drive-worker/src.js` so `/image/:id` can proxy images; the existing `/images` endpoint is preserved. Do not publish Google API Keys; keep them in Worker Secrets.

`official-2024-character-sheet.pdf` is the owner's uploaded fillable template. Browser export requires online access to the pinned pdf-lib 1.17.1 CDN and manual verification of filled pages. The Library is presently summary-based with SRD 5.2.1 attribution, not a complete verbatim licensed rules database.

## Source / license

D&D 5e 2024 material is based on the SRD 5.2.1 (Creative Commons Attribution 4.0) for supported reference descriptions. Names from other sourcebooks are included for personal reference; don't assume all such entries are SRD licensed. D&D is owned by Wizards of the Coast. This app is an unofficial fan project.
