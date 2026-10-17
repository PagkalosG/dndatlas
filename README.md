# D&D Atlas v1.5 — Character Atlas PWA

A bilingual (EN/ΕΛ), compact, offline-friendly D&D character sheet, with popups for feats, maneuvers and spells; spell damage and scaling; portraits; local backup/import; multiple characters and class support.

## GitHub Pages deployment

1. Extract the ZIP and upload its **contents** to the root of your `dndatlas` repository (`index.html` must be at repository root).
2. GitHub → repository **Settings → Pages** → **Deploy from a branch** → `main` → `/ (root)` → Save.
3. Open `https://YOUR-USERNAME.github.io/dndatlas/`.
4. On Android: Chrome → menu → **Add to Home screen / Install**. On Windows: Chrome or Edge → **Install this site as an app**.

All paths use `./` and are suitable for the `/dndatlas/` project site. **Upload extracted files, not the ZIP itself.** Do not upload `node_modules`, other directories, or a second `index.html` inside an extra subfolder.

## Demo party

`demo-party.json` is a **working import file** for the existing Settings → Import backup feature. You can also use **Settings → Load party demo** or **Download demo JSON**. It includes Borruk Thunderfist, Aelyn Starwind, Luna, Amantyl, and Gror. Class/species/visual identities follow established party lore; most values for the other four characters (levels, ability scores, AC, HP, spells, subclasses) are **illustrative placeholders**, not confirmed sheets. Borruk uses verified STR/DEX/CON/etc., Level 3, HP 30, and a campaign-specific Passive Perception override of 10; his subclass/maneuvers are editable examples.

**Warning:** importing a backup or loading the demo replaces the locally saved character roster, after confirmation. Export a JSON backup first.

## New in v1.5: updates and privacy-conscious cache cleanup

Open **Settings → Version & Updates**:

- **Check for updates:** compare all current deployed app files with cached copies. On change, show a prominent **Update now** banner.
- **Load latest version:** force-check and reload to obtain the latest GitHub Pages deployment.
- **Clear cache & cookies (keep data):** delete **only D&D Atlas's service-worker shell cache** and JavaScript-accessible cookies scoped to the current site path, then reload. **Never deletes the character localStorage.** Cookies marked HttpOnly cannot be cleared from JavaScript; clear those from the browser settings if needed.
- **Delete characters & reset:** explicitly destructive, separately placed action requiring **two confirmations**. Removes D&D Atlas `characters` and `ui` localStorage keys, then reloads the three original built-in sample characters.

The service worker uses a **network-first** strategy for app files with **offline cached fallback**. A GitHub push is fetched on the next online reload without waiting for the user to clear browser storage. An open tab checks automatically on return to the app (with a 15-minute throttle), and a user can always check manually. A working HTTPS connection is needed for initial installation and fetching new builds. GitHub Pages deployment itself may take several minutes.

The app does **not** use cookies to store characters. Character sheets and portraits are stored in **localStorage** on each device, with no cross-device sync. Clearing all browsing/site data in the browser **does delete** those sheets; use Export first.

## DM house rule: passive perception

The standard Passive Perception formula is still automatic unless **Profile → Passive Perception override** is set. You can enter `10` to honor a DM's custom rule while preserving active Perception proficiency checks. Existing characters without an override keep the normal formula.

## Compatibility and limitations

- Supports the 2024 SRD-style character workflow, with manual entries for subclasses, multiclass, feats, spells and custom content.
- Offline use depends on first successfully installing the service worker and caching the files.
- Do not assume all spells/classes are comprehensively represented or mechanically adjudicated.
- Fan-made, unofficial, not affiliated with Wizards of the Coast. Consult official rules and your DM.
