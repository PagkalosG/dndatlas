# D&D Atlas v3.1.5 — Character Sheet PDF layout patch

Ανέβασε **μόνο** τα `pdf-export.js`, `index.html`, `sw.js`, `version.json` στη ρίζα του GitHub repository. Δεν αλλάζει το Cloudflare API ή η D1.

## Τι διορθώνει
- Προσδιορισμένα μεγέθη γραμματοσειράς στα πεδία Class Features, Species Traits, Feats, Equipment Training, Tools, Languages, Equipment, Appearance και Backstory.
- Human Resourceful / Skillful / Versatile στα Species Traits και οι υπόλοιπες Fighter/Battle Master features στα Class Features.
- Τα Feats εμφανίζονται ως ονόματα (π.χ. Tough, Savage Attacker), όχι ως εσωτερικά IDs.
- Το πεδίο Tools δεν γεμίζει με όλα τα proficiencies ή τις γλώσσες όταν αποθηκεύονται ως ελεύθερο κείμενο.
- Το Languages χρησιμοποιεί μόνο το `character.languages`, το Equipment μόνο το `character.inventory`.
- Class/Subclass στη σωστή σειρά της επικεφαλίδας.

## Σημείωση
Η εξαγωγή μπορεί να αναδείξει ελλιπή ή λανθασμένα πηγαία δεδομένα χαρακτήρα. Για παράδειγμα, αν η εφαρμογή δεν έχει συμπληρωμένη επιλογή εργαλείου, δεν εφευρίσκεται κατά την εξαγωγή. Το επίσημο PDF χρησιμοποιεί λατινικές γραμματοσειρές και η εξαγωγή μεταγράφει ελληνικό κείμενο. Έχει γίνει έλεγχος σύνταξης και γεωμετρίας των πραγματικών PDF fields, όχι ολοκληρωμένη δοκιμή από τον browser/Cloudflare.
