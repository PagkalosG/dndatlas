# D&D Atlas 2.0 — Ενσωμάτωση του Claude UI στον υπάρχοντα Rules Engine

## Όρια και ασφάλεια

- Branch: `atlas-2.0`. Η παραγωγή `main` και το backup `backup/atlas-2.0-ui-v0.8-2026-11-18` δεν αντικαθίστανται.
- **Πρωτότυπο χωρίς λογαριασμούς ή cloud sync**: Player/DM UI switch στο header. Οι ρόλοι είναι ΜΟΝΟ τοπική προσομοίωση, **δεν** είναι έλεγχοι πρόσβασης.
- Τα δεδομένα αποθηκεύονται σε **IndexedDB μόνο στον συγκεκριμένο browser**. Δεν αποστέλλονται σε Cloudflare D1, Google Drive ή οποιοδήποτε API.
- Ο υπάρχων engine διατηρείται στα `apps/web-v2` και χρησιμοποιείται αυτούσιος. Δεν μεταφέρουμε/αντιγράφουμε κανόνες του PHB από το Claude mock.
- Το SRD 5.2.1 (2024) είναι το μοναδικό βασικό καταχωρημένο source. Πέρα από αυτό, επεκτάσεις μόνο με επιτρεπόμενα DM Content Packs σε επόμενο στάδιο.

## Σύνδεση

1. `scripts/sync-engine.mjs` αντιγράφει αμετάβλητα πέντε υπάρχοντα engine/data modules στην προσωρινή `public/engine/` ΠΡΙΝ από το dev/build.
2. Τα scripts φορτώνονται από `index.html` πριν εκκινηθεί το React UI.
3. `src/engine/atlas2024.ts` εκθέτει typed adapter για Class/Background/Equipment/Scores, Source Grants και 2024 validation.
4. `src/mock/reference.ts` χρησιμοποιεί τα πραγματικά 12 Classes, 4 Backgrounds και 182 SRD Equipment entries. Διατηρεί από Claude μόνο οπτικά metadata και πρωτότυπες περιγραφές όπου υπάρχουν.
5. `src/features/builder/**` χρησιμοποιεί το ίδιο engine για Ability Scores, Class Skills, Human Skillful/Versatile, Fighter styles/masteries, Starting Packages, owned gear και Preview.
6. `src/services/atlasService.ts` διατηρεί το οπτικό contract του Claude, αλλά γράφει πραγματικές αλλαγές σε IndexedDB, δημιουργεί αίτημα έγκρισης και επιτρέπει local DM approval.
7. Το UI του Claude δεν είναι ο source-of-truth για κανένα mechanic. Όπου η μηχανική δεν έχει υλοποιηθεί, εμφανίζεται ειλικρινής placeholder.

## Διαθέσιμες ροές

- Player/DM switch, επιλογή Campaign, responsive React UI (Claude source).
- Character Builder με σειρά Species → Class → Subclass (μόνο Level 3+) → Background → Abilities → Proficiencies → Choices → Spells → Equipment → Details → Review.
- Manual Standard Array reassignment / 27 Point Buy, Background boosts και ορατά modifiers.
- Human Skillful (+1 extra skill) / Versatile (+1 Origin Feat), Skilled extra choices. Fighter Fighting Style / three Weapon Masteries.
- Starting Class/Background packages, 182 items by category, unpacking pack contents where data exists, sticky GP balance, custom item descriptions.
- Full review with SRD-backed base stats, saves, skills, attacks, owned inventory, selected features and private story.
- Save Draft / Submit for Approval / DM Decision / Save Sheet στον ίδιο browser και ανάκτηση μετά από refresh.
- English/Greek translations from Claude + explicit translated new UI labels.

## Σκόπιμα εκτός / μελλοντικά

- Πραγματικό Authentication, server-side permissions, cloud synchronization, Durable Objects WebSockets, Google Drive image upload.
- Ολοκληρωμένος 2024 Rules Engine για όλες τις Class-specific επιλογές και spell slots, subclass progressions, rest resources, full gameplay.
- Πλήρες Magic Initiate spell picker, dynamic DM JSON packs με persisted activation, bespoke licensed artwork.
- Η τρέχουσα έκδοση είναι **αρχικό integration** UI + engine, όχι τελικό Character Sheet και όχι production-ready.
- Δεν προστίθεται dice rolling UI.

## Dev commands

```bash
cd apps/web-react
npm ci
npm run test:engine
npm run build
```

Το `scripts/sync-engine.mjs` απαιτεί να υπάρχει το `apps/web-v2` στον ίδιο repo, διατηρώντας μόνο μία έκδοση των 2024 κανόνων.
