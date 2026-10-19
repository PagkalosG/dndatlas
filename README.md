# D&D Atlas v2.0 — GitHub Pages

Static PWA for **D&D 5e 2024 only**. All six tabs: Overview, Character, Combat, Inventory, Journal, Library. Includes new-character guided Builder, real party JSON, adjustable Overview portrait (drag + zoom), spell/combat references and shared campaign sessions/media. EN/EL languages.

## Publish

1. Back up your existing repository and export any characters stored in your browser.
2. Upload all the files and folders in this ZIP **to the root** of your `dndatlas` repository, replacing old files. You can remove unused legacy pages and assets.
3. In GitHub **Settings > Pages**, select Deploy from a branch > `main` / root.
4. Open `https://pagkalosg.github.io/dndatlas/`, wait for deployment, and hard-refresh once.
5. First visit (no local save) attempts to load `demo-party.json`. Later releases never overwrite existing local characters. Under Settings you can also load party demo or import/export JSON.

## Shared sessions

Edit `data/sessions.json` by adding entries with unique IDs:

```json
{ "schema": 1, "campaign": "Our Campaign", "sessions": [
  { "id": "session-01", "title": "Our first adventure", "date": "2026-10-17", "text": "What happened...", "images": ["assets/campaign/ruins.jpg"] }
] }
```

Upload images into `assets/campaign/`. Add each one to `data/campaign-images.json` so players can choose it from the image gallery:

```json
{ "schema": 1, "images": [
  { "id": "ruins", "title": "Ancient ruins", "path": "assets/campaign/ruins.jpg" }
] }
```

Images referenced directly by shared sessions also render if they are not in the gallery manifest. Supported formats: JPG, PNG, WebP, GIF. Use relative paths, exactly matching filename capitalization. **Adding files alone does not provide directory listing in GitHub Pages**; edit the manifest or sessions JSON too.

Local edits of shared sessions, hide/restore actions, and local sessions stay in the browser (and are included in exported JSON backups). They do **not** modify the GitHub repository or other players' data. Adding a personal image is local-only (and can make JSON backups larger). For shared images, put them in Git first.

## Portrait

Click the large portrait in Overview. Upload a photo, drag inside the preview, set zoom (100–300%), and Save. The crop applies **only to Overview**, preserving the original uploaded image and other portraits. Portrait and framing are included in character JSON backups.

## Rules / boundaries

- All rules interpretation, labels, character creation and calculations target **D&D 2024**. Older PDF sheets are data sources only, never rules sources.
- The Builder validates **Human + Fighter + Soldier (levels 1–3)** thoroughly; other combinations require recorded DM review because a complete authoritative rule engine for every class/book is not yet implemented. Some imported characters may have unverified or incompatible choices.
- The official 2024 **PDF export into Wizards' actual template is not implemented**: Character tab currently offers a 2024-compatible *printable fan-made sheet* that can be saved to PDF in the browser. Official blank sheet: https://www.dndbeyond.com/resources/1779-d-d-character-sheets . Do not label the custom printout as official.
- D&D rules descriptions are original short summaries, not reproductions of full book text.
- The app works offline for cached shell/assets, but newly uploaded GitHub images and sessions need a connection at least once.
- Character state and local session customizations are saved in the browser (localStorage). Clear site data deletes them. Use JSON backup frequently. No server-side collaborative edits yet.
- English/Greek translations are still partial in some legacy advanced settings / reference entries; core new pages have been localized.

## Project files

`index.html`, `style.css`, `data.js`, `i18n.js`, `spell-effects.js`, `app.js`, `demo-party.json`, `data/sessions.json`, `data/campaign-images.json`, `assets/campaign/`, `sw.js`, `manifest.webmanifest`, `version.json`, icons.

### Credits
Fan-made, unofficial project. Rules reference: D&D 2024 / SRD 5.2 (Creative Commons BY 4.0). Not affiliated with Wizards of the Coast.
