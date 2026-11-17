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

## Campaign and Party UI (v0.2)

The prototype now includes a **DM demo role** with a Campaign Setup wizard, configurable campaign options, invite preview, party roster and DM Character Approval Queue. Players can submit their mock character in the Builder and switch to DM demo mode (Party → Preview as DM) to Approve, Request Changes or Reject. Switch back to Player to see the status. These are in-memory UI actions only.

The Campaign Setup screen offers selectors for starting level, Standard Array / Point Buy / manual result, HP method, Milestone / XP, character count, invitation expiry, multiclass, private story defaults and DM approval rules. Selecting a method only changes UI configuration; **no rule calculation or validation is asserted**. All screens support Greek and English. Swapping a Standard Array ability value automatically swaps the existing assignment, avoiding accidental duplicate scores.

The QR is explicitly a non-functional placeholder and the sample invitation uses an invalid example domain; never share it as a real invite. DM/Player mode changes **do not grant privileges**. Approved characters are not persisted, and the private-story toggle alone does not enforce access rights. Real behavior must run through the authenticated Cloudflare Worker with membership checks, permission-filtered data and revision validation.

For a deployable, separate static preview, the staging pipeline deploys the contents of this folder to the **`dndatlas-v2-ui-preview` Cloudflare Worker**. That Worker serves only static assets and has no D1 bindings or real user data. GitHub Pages production and the staging API Worker are unaffected.

Integration contracts: replace `window.ATLAS_V2_CAMPAIGN_FLOW` renderers with shared components and replace all mock actions with authenticated endpoints, per-campaign permissions, explicit Save, revision-aware conflict handling and server-side validation. Persist no API secrets in these static assets.

## Source-backed Character Builder v0.3 (SRD 5.2.1 / 2024)

- Illustrated selection shows all **12 2024 PHB core Classes** and **16 PHB Background names**. Only the 4 SRD Backgrounds are selectable; the other 12 are visibly locked because this repo does not license the complete PHB. Images for newly listed backgrounds are original SVG placeholders, never official artwork.
- `catalog/srd-2024.js` is a generated, pinned static **2024-only UI fixture** produced by `content/importers/export-builder-srd-2024.mjs`. It includes source-defined class skill choices, background proficiencies/feat/ability restrictions, both equipment package options, and **182 SRD equipment items** split into Weapons, Armor & Shields, Adventuring Gear, Consumables, Tools.
- Class Training follows the Class step; it selects class proficiencies. The Fighter demo also chooses one SRD Fighting Style and three weapon masteries. Background Training resolves background tool/skill choices; Ability Scores resolve 2024 Background-based bonuses.
- Starting Equipment selects independent class and background equipment/gold packages and resolves nested equipment subchoices. The shop shows gold granted, costs, remaining budget and manually purchased items. Buying is a demo-only client state, **not a server-approved inventory or valid character purchase**.
- Only a **starting-level-1 UI demonstration** is currently modeled; higher-level rules choices, full subclass options, spell selection, and advanced class feature legality remain work for the authoritative 2024 Rules Engine. No 2014 fallback and no dice rolling UI.
- **No real save, approval, authentication or authorization exists.** Frontend data and fixture checks are display logic; all legality, source entitlements and privacy must be enforced on the Cloudflare Worker before live use.

2024 SRD adapted under CC BY 4.0, Wizards of the Coast LLC; see `docs/SRD_ATTRIBUTION.md`. This application is unofficial.
