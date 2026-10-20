# D&D Atlas v3.1.6 — PDF appearance fix

Ανέβασε **μόνο** τα `pdf-export.js`, `index.html`, `sw.js`, `version.json` στη ρίζα του repository, κάνοντας αντικατάσταση. Cloudflare και D1 δεν αλλάζουν.

- Διορθώνει τη σειρά ρύθμισης μεγέθους γραμματοσειράς και τη δημιουργία appearance streams για τα fillable multiline fields (Species Traits, Feats, Class Features, Languages, Equipment).
- Συμπληρώνει Alignment και πέντε νομίσματα CP/SP/EP/GP/PP από τα δεδομένα του χαρακτήρα.
- Διατηρεί το PDF επεξεργάσιμο.
- Appearance και Background Story συμπληρώνονται μόνο όταν τα αντίστοιχα πεδία έχουν περιεχόμενο (και είναι ορατό στον εξαγωγέα).

Δεν έχει γίνει πλήρης end-to-end επαλήθευση εμφάνισης στο GitHub/browser. Έλεγξε το αποτέλεσμα ανοίγοντάς το σε Chrome και Adobe Acrobat. Μην ανεβάσεις αρχείο με ευαίσθητη ιστορία άλλου παίκτη.
