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


## Campaign Libraries (v0.4, frontend prototype)

In the **DM Demo → Campaign Settings** screen, the reusable `Campaign Libraries` section shows the always-on SRD 5.2.1, a local `.json` file picker, pack metadata/entry count preview, a rights-confirmation checkbox and local staging/removal of pack summaries. No actual upload or install is performed. The preview uses a subset of the format checks; the authoritative shared validator is `packages/content-packs/validate-pack.mjs`, and the real Worker must enforce DM-only access and entitlement/legality checks.

The complete original homebrew test fixture is `content/examples/starward-homebrew-2024.json`. It is a sample for the upcoming room-creation Library step, **not** a source of official PHB material. Staged mock selections disappear on refresh. The backend-first deployment is intentional: no unauthenticated JSON upload API is exposed.

## Builder v0.4 — visible 2024 provenance and item details

- **Ability selection:** shows assigned score, 2024 Background increase, final score and modifier on every ability (preview only).
- **Proficiencies:** separate origin badges for fixed Class / Background grants and chosen Class / Background skills, with calculated Level 1 modifiers and a single bonus for a proficiency granted by multiple sources. Species-specific grants are not invented when species source mechanics are not loaded.
- **Gear categories:** Packs & Kits, Weapons, Armor & Shields, Adventuring, Consumables, Tools. A pack is not a second copy of every contained item.
- **Provenance:** selected starting gear, purchases and pack contents are displayed as distinct sources, with counts. The user may intentionally buy an extra copy of an item.
- **Wallet:** sticky in both starting-package and shopping steps so funds remain visible while scrolling.
- **Item descriptions:** expandable SRD fields for price, weight, damage, properties, mastery, armor class, and pack contents when the source actually supplies them. Missing source data is never fabricated.
- **Realistic imagery:** UI accepts optional `photo` URLs in content metadata. Temporary original vector artwork remains the fallback until suitable licensed/created realistic fantasy assets are added; these are not official D&D images.

This is still an **isolated UI prototype**. No auth, D1 writes, realtime sync or network requests were added.


## v0.5 — Ability Scores

Ability scores now support a D&D 2024 **Standard Array / 27-point Point Buy** toggle, using + / − controls rather than dropdown inputs. In Standard Array, + / − change only the selected ability. Lowering a score frees unassigned score points shown in the budget bar. A character can continue only when the final six scores again match 15, 14, 13, 12, 10, 8. In Point Buy, all scores begin at 8, each score stays within 8–15, and the cost table enforces a maximum of 27 spent points. Scores are kept separately when switching between methods. Background +2/+1 or +1/+1/+1 choices remain below the base score grid, with final score and modifier updating live. No dice UI, accounts, sync, or D1 writes.

## v0.6 — Expandable species and class cards

- Species and class cards now expand to show original EN/EL introductions, named 2024 SRD traits, hit die, saving throws and default proficiencies. Opening a card does NOT automatically select it.
- The new Builder sequence is Species → Class → (Subclass, when the starting **single-class level** is 3+) → Background → Ability Scores/boosts → Class Training → Background Training → Starting Equipment → Inventory → Review.
- Player and DM demo views can be switched from the topbar. This is only a view selector: it is not an authentication or authorization system.
- The cards support an optional original photoreal portrait sprite; existing SVG art remains a fallback when the asset is unavailable. Portraits are **not official D&D art**.
- Multiclass progression and character-level-based subclass availability will require a future dedicated multiclass builder rather than treating overall character level as class level.

## v0.7 — compact card discovery, character identity and complete-sheet preview

- Species, Class and Background selections use small portraits and one inline expanding card surface. There is no duplicate hero image or "What is it?" header. Species traits receive original EN/EL practical explanations; Class facts and Background Origin Feats/Proficiencies come from the current SRD fixture.
- `identity-v2.css` uses a height reveal transition, supports `prefers-reduced-motion`, and does not re-render the card on expansion. Licensed content can be chosen with a separate button; disabled options remain viewable.
- Fighter Fighting Style choices display EN/EL descriptions, not names alone.
- Standard Array adjustments never swap a second ability automatically. While reassigning, the current distribution can be temporarily incomplete. The Builder blocks continuation until the official array is restored.
- The Inventory screen offers local custom item creation (name, category, quantity, weight, GP cost and free-text description). Custom items do not silently grant mechanics or modify the SRD catalog.
- A new Character Identity step allows Alignment, private background story and an optional PNG/JPEG/WebP portrait (up to 900 KB, stored in the current browser session).
- Final Review renders a broad Character Sheet preview: identity, scores/modifiers, base HP from fixed progression, AC and explicit equipped armor/shield, initiative, proficiency bonus, saving throws, 18 skills, feats/features that the current fixture actually knows, starting inventory and custom gear, money, story, and placeholders for unresolved spells/conditions/speed.
- Honest limitations: class/spell progression, all feature effects, item equip eligibility, species speed, spell slots and additional gameplay fields are **not** complete or authoritative yet. The sheet is a best-effort preview, not a fully validated 2024 character.
- This release adds **no authentication, cloud synchronization, D1 writes or dice rolling UI**.

## v0.8 — Human Skillful, Versatile and explained 2024 choices

- **Human Skillful:** explicitly select one additional Skill Proficiency, independently of class choices (e.g., Fighter 2 + Human 1) and fixed Background proficiencies. Duplicate skills are disallowed.
- **Human Versatile:** choose a second SRD Origin Feat in Background Training, independently of the Background's automatically granted Origin Feat. Nonrepeatable duplicates are disabled.
- **Skilled feat:** requires three additional, distinct Skill or Tool Proficiencies and records their source. A Human Fighter with Soldier Background normally has five proficiencies (2 Fighter, 2 Soldier, 1 Skillful); Skilled can add three more if legal.
- **Magic Initiate:** its description is visible, but choosing it as a second Human feat is not considered complete until the spell-list, cantrip, level-1 spell and spellcasting ability selector is implemented. The UI blocks character submission rather than silently granting invented spells. The same missing spell configuration applies to Acolyte/Sage background spells.
- **Class selector:** skill options are clickable inside the expanded, selected Class card; they are shared with Class Training. Both class and training views display readable names without repeated `Skill:` prefixes.
- **Background selector:** cleaned up Skill/Tool names and added an explanation for the automatically granted Origin Feat.
- **Fighting Styles:** richer EN/EL original explanations describing effects and typical play, including 2024 Protection and Great Weapon Fighting. No 2014 wording is used for calculations.
- **Weapon Mastery:** every SRD weapon in the training selector displays its mastery property and a concise EN/EL mechanics explanation (Cleave, Graze, Nick, Push, Sap, Slow, Topple and Vex).
- **Character preview:** Human Skillful and Skilled proficiencies appear with their source in the proficiency summary; Versatile feat appears on the sheet. Alert adds proficiency bonus to Initiative in the preview.
- No change to authentication, live sync, D1 API, production branch or dice-rolling UI. The frontend still has mock Save/Approval operations.

Source reference: SRD 5.2.1 (CC BY 4.0). Non-SRD expansions remain licensed DM content packs, not copied into the core.

## v0.9 — Persistent Builder controls and playable Character Sheet

**Original Atlas UI remains the primary frontend** in `apps/web-v2`. This release does not use Claude's React UI, change GitHub Pages production, or introduce authentication/cloud synchronization.

- Builder progress steps stick immediately below the application header while scrolling Species, Classes, Backgrounds, Skills, Equipment, etc. The current step scrolls horizontally on smaller screens.
- Back / Save Draft / Next stays fixed and accessible above the bottom mobile navigation. Space is reserved at the bottom of the Builder so the last fields can still be reached.
- Character Sheet follows a familiar **character header + core statistics + tabbed character information** organization, inspired by D&D Beyond's information hierarchy but using the original Atlas visual system: **Overview**, **Actions & Combat**, **Spells**, **Equipment**, **Features & Traits**, **Description**, **Notes**.
- Overview displays ability scores/modifiers, saving throws, skills/proficiencies, core combat statistics, weapon attacks, rest actions and conditions.
- Combat provides locally persisted current/temporary HP updates, recorded rests, death-save counters and conditions. It lists basic D&D 2024 actions with explanations. **No dice rolling UI**.
- Equipment uses the Builder's SRD item and starting pack data, with provenance, quantity consumption/restoration and worn armor/shield selections.
- Spells provides **explicitly manual** local spell notes and configurable slot counters; spellbook legality, granted spells and the complete spell slot progression are **not yet implemented**.
- Features & Traits and Description show details already present in the SRD-based Builder, while explicitly indicating rules not yet implemented.
- Personal Notes and Session Journal can be added/removed and saved. Note visibility is a label only until real server-side permissions exist.
- All local state uses a single IndexedDB snapshot (`dnd-atlas-v2-prototype`) via `components/local-state.js`. Save Draft, DM Approve/Request Changes/Reject and Campaign Settings Save persist in this browser. Gameplay actions and journal/notes persist immediately. Reopening the same browser reloads them.
- **No cross-device synchronization or authentication.** Browser data can be lost if the user clears site data. Users should not treat the local prototype as a cloud backup.
- Character HP from fixed hit-die progression, AC and attacks are **previews of implemented rules only**. Feats such as Tough, class effects, spell slots and unmodeled species/class features can affect the actual character sheet; more Rules Engine work is required before these are authoritative.
