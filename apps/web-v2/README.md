# D&D Atlas 2.0 — UI concept (parallel development track)

This is a **standalone, offline-friendly frontend prototype**, not the production PWA. No Cloudflare account, D1 database, Google Drive content, login service, or user information is accessed.

## Preview

From the repository root, run a local static server (for example `python3 -m http.server 8000`) and visit `http://localhost:8000/apps/web-v2/`. The files also work as a static export under any subpath.

## Implemented in this concept

- Responsive App Shell, Campaign Home, Party / Journal / Settings placeholders.
- English/Greek UI selector with translated display strings and selection descriptions.
- Interactive character builder with original **non-official vector concept art** for 10 Species, 12 Classes, 4 Backgrounds, and 6 Equipment choices.
- Illustrated card search, Available filter, explicit Save Draft / Submit for DM Approval (mocked), Standard Array selector, sticky live preview and read-only Character Sheet preview.
- Aasimar is **locked** as a PHB-only option, because this implementation only has public SRD content. This is a UI state, not a statement about its rules.
- No dice UI and no rules calculations. Stats show placeholders until the server returns authoritative 2024 values.

## Integration boundaries

`data.js` exports mock data through `window.ATLAS_V2_DEMO`; `app.js` owns state and interactions. The live application will replace this fixture with an authenticated Content API, controlled Character Save and DM Approval APIs, privacy-aware player projections and a validated 2024 Rules Engine. **UI role switching is a visual demo, not authorization.**

Save actions are simulated in memory, including a loader and a toast. They do not persist on refresh, produce requests or broadcast events. The app should not be considered an actual character generator until an authoritative backend is integrated.

The original SVG files are temporary art. For official character/species/class/item art, use only materials licensed for this application, with artist attribution and fallback handling. No official assets are bundled.

## No impact to production

This directory is **not referenced by the existing GitHub Pages production workflow** and does not replace `public/index.html`, `src/` or legacy data. Future previews can be deployed from this isolated directory with a separate workflow.
