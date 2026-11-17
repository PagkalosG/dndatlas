# D&D Atlas 2.0 — Campaign Libraries v1

## Απόφαση προϊόντος

Το Atlas διανέμει **μόνο κατάλληλα αδειοδοτημένο SRD 5.2.1** στον βασικό κατάλογο. Οι επιπλέον βιβλιοθήκες είναι **DM-managed, campaign-scoped και 2024-only**. Ο χρήστης που εισάγει JSON βεβαιώνει ότι έχει δικαίωμα να μοιραστεί το περιεχόμενο. Το JSON δεν μετατρέπει copyrighted κείμενο σε ελεύθερο περιεχόμενο. Αγορασμένο βιβλίο δεν συνεπάγεται άδεια διανομής του κειμένου. Ούτε ο κώδικας ούτε η βάση έχουν προφορτωμένο περιεχόμενο άλλων βιβλίων.

### Τι λείπει σε σχέση με τον πλήρη οικοσύστημα 2024

Ο βασικός SRD κατάλογος είναι περιορισμένος: επιπλέον subclasses/species/backgrounds, feats (Origin/General/Fighting Style/Epic Boon), spells, class features/subclass progression, non-SRD classes, class choices (maneuvers, invocations, metamagic, fighting styles, subclass options), spell lists, species traits, equipment/weapon/armor/consumables, magic items, monsters/NPCs, campaign-specific conditions, custom rules, crafting, Bastions και άλλα DM-specific options. Το SRD περιέχει ήδη 9 Species, 12 Classes/12 Subclasses και 4 Backgrounds — δεν πρέπει να βαφτίζουμε κάθε επιλογή non-SRD.

### Τρόπος λειτουργίας

- **1. Campaign Creation → Libraries:** στα βασικά settings, μετά τους κανόνες, ο DM βλέπει την ενεργή βιβλιοθήκη **SRD 5.2.1** (πάντα διαθέσιμη) και το **Import Library** (JSON file). Μπορεί να ανεβάσει περισσότερα packs, να ελέγξει αποτελέσματα, να δει ακριβώς τι ενεργοποιούν και να κρατήσει το Campaign σε Draft μέχρι να τελειώσουν οι εισαγωγές. Το `Create Campaign` και το `Activate Library` θα γίνουν πραγματικές ενέργειες μόνο όταν υπάρχει ασφαλές authentication/authorization API.
- **2. Import:** JSON → 512 KiB limit → έλεγχος schema/version/2024/άδειας → isolated staging revision → επίλυση SRD/installed dependencies → legal/source rights attestation → rules-engine mechanics verification. Οι δημιουργίες ολοκληρώνονται με versioned transaction. Το import δεν εκτελεί δυναμικό JavaScript ή expressions μέσα από JSON.
- **3. Preview:** σύνολο entries ανά κατηγορία, missing English/Greek, invalid prerequisites, unknown effects, conflicting IDs, conflicting grants, assets χωρίς δικαιώματα, unresolved references. Κατάσταση: Draft / Validated / Active / Disabled / Rejected.
- **4. Activate:** μόνο ο **ενεργός DM του συγκεκριμένου Campaign** (και Superadmin σε ξεχωριστό audited administrative path) μπορεί να ενεργοποιήσει ή απενεργοποιήσει βιβλιοθήκη. Co-DM και Players δεν μπορούν να κάνουν import. Η ενεργοποίηση γίνεται με server-side D1 checks και audit.
- **5. Character Builder:** οι επιλογές SRD + ενεργές και επιτρεπόμενες βιβλιοθήκες εμφανίζονται μαζί με source badges και artwork fallback. Ο παίκτης βλέπει την προέλευση, τις συνθήκες χρήσης και επεξηγήσεις. Το Rules Engine ελέγχει τα πραγματικά effects και prerequisites. Χωρίς dice-rolling UI.
- **6. Update:** η νέα έκδοση είναι νέα εγγραφή/source, ποτέ overwrite. Χαρακτήρες κρατούν τις προηγούμενες pinned versions και εμφανίζεται migration/revalidation flow. Απενεργοποίηση δεν διαγράφει inventory, feature grants ή history — μόνο νέες επιλογές σταματούν.
- **7. Delete:** archive/soft-disable. Permanent delete μόνο όταν δεν υπάρχουν χαρακτήρες/σχέσεις που εξαρτώνται από αυτήν και με backup.

## JSON Contract

`format`: `dndatlas.content-pack`  · `schemaVersion`: 1 · `pack.ruleset`: `dnd5e-2024` · `pack.scope`: `campaign` · `pack.version`: semver · `pack.license.basis`: `original` / `licensed` / `cc-by`.

Όλες οι βιβλιοθήκες χρησιμοποιούν ένα κοινό envelope `pack`, `entries`, `assets` αντί για διαφορετικό ασύμβατο σύστημα ανά τύπο. Επιτρέπεται να φτιάξουμε **ξεχωριστά templates** για Subclasses, Species, Spells, Items, Feats ή Mixed Pack, αλλά στο upload όλα περνούν από τον ίδιο validator. Κάθε entry έχει `kind`, `id`, `name.en` (`name.el` προαιρετικό), `summary`, `data`, `choices`, `effects`, `requirements`, `progression`, `artwork`.

- `class`: HD, save proficiencies, class progression, selectable features.
- `subclass`: `parentClassRef`, `startLevel:3`, grants στα κατάλληλα class levels.
- `species`: sizes, speed, senses/traits; κανένα species ability score increase για 2024.
- `background`: τρία ability choices, Origin Feat ref, skill/tool proficiency, starting equipment/money.
- `feat`: Origin/General/Fighting Style/Epic Boon category, prerequisites/effects.
- `spell`: level, school, casting time, range/components/duration, ritual/concentration, upcasting, spell-list grants.
- `item`: weapon, armor, adventuring gear, consumable, tool, magic item, currency. Optional cost (GP/SP/etc), rarity, attunement, charges, properties, damage, use/activation details, image ID, crafting requirements.
- `feature`: passives/actives, resources, usage/recharge, modifiers, prerequisite conditions.
- `option` with subtype: fighting style, maneuver, invocation, metamagic, weapon mastery, language, class choice, equipment choice, spell list, crafting, Bastion, etc.
- `monster`, `condition`, `rule`: future DM/encounter rules; schema allows entries now, but do not silently claim implemented mechanics.

**References**: `@feature:star-bond` for within pack; `srd:class:fighter` for current base SRD; external pack references must be explicitly declared and resolved server-side. Stored IDs use distinct source prefix; no collision with official entries. Every version of source and entry is pinned.

**Effects:** allowlisted declarative operations, e.g. `GRANT_SPELL`, `GRANT_PROFICIENCY`, `MODIFY_STAT`, `GRANT_RESISTANCE`, `CREATE_RESOURCE`. **Η αποδοχή JSON δεν σημαίνει ότι ο Rules Engine εκτελεί ήδη κάθε effect.** Η ενεργοποίηση απορρίπτει μη υποστηριζόμενα mechanics μέχρι να προστεθεί δοκιμασμένος handler. Δεν επιτρέπονται JavaScript, `eval`, scripts, ελεύθερα executable formulas ή client-side privilege overrides.

**Localization:** το UI παραμένει 100% EL/EN. Το imported content μπορεί να έχει μία μόνο μετάφραση· στην ελληνική προβολή εμφανίζεται ρητά `Αμετάφραστο περιεχόμενο (EN)` αντί για ψεύτικο ελληνικό κείμενο.

**Artwork:** το JSON περιέχει **μόνο IDs** για media. Η εισαγωγή εικόνων γίνεται χωριστά με επικύρωση αρχείων/πνευματικών δικαιωμάτων, το media storage/backend προστατεύει τη θέαση. Official image μόνο αν υπάρχει άδεια. SVG απαιτεί sanitization ή απαγορεύεται στο upload ανάλογα με την πολιτική ασφαλείας του Worker.

## Database, API & Security

- `content_sources` και `content_entries` παραμένουν canonical. New migration: `campaign_library_packs`, `campaign_library_dependencies`, `campaign_library_assets`, `campaign_library_import_jobs`, plus triggers preventing cross-campaign source installation and non-DM pack uploads.
- Με D1 transactions ο Worker κάνει create source + insert entries + versions + translations + choices + effects + relationships + import audit + outbox και μόνον μετά ενεργοποιεί την installed version. **Η D1 έχει constraints, όχι ολοκληρωμένο row-level access control**.
- Future Worker API contracts (not yet implemented):
  - `POST /api/campaigns/:id/libraries/preview` → authenticated DM, validate JSON, no save.
  - `POST /api/campaigns/:id/libraries` → authenticated DM, rights attestation, save draft, safe async loader.
  - `GET /api/campaigns/:id/libraries` → permitted member sees active source metadata; DM sees draft/jobs.
  - `POST /api/campaigns/:id/libraries/:packId/activate` → DM-only, dependency and rules verification, D1 transaction.
  - `POST /api/campaigns/:id/libraries/:packId/disable` → DM-only, audit and warnings for pinned character versions.
  - `GET /api/campaigns/:id/available-content?kind=...` → permission/source/version filtered, no direct arbitrary source reads.
- **Never** expose an unauthenticated upload route just to make the mock work. Workers must check session, campaign status, active membership and `dm` role per request. All pack data is campaign-scoped; a DM of another campaign cannot see or reuse it without explicit, rights-safe import.
- Defenses: parser size, item-count and nesting limits; duplicate IDs, forbidden prototype keys, media URLs, source spoofing, dependency cycles, authorization, HTML escaping, content security policy, rate limits, `audit_log`, consistent error messages, D1 bindings restricted to staging during development.

## Status — Foundation implementation

In this increment we implement **pure JSON validator + example pack + versioned D1 migration + automated tests**. Not shipped yet: OAuth, backend upload/activation routes, image upload, complete class-specific effect execution, public Content API, source licensing checks beyond DM rights attestation, or live UI library manager. **Do not infer these exist from the database tables or JSON schema.**

See `content/examples/starward-homebrew-2024.json` for an entirely original example spanning a Fighter subclass, species, background, Origin Feat, spell, item, feature and maneuver option.
