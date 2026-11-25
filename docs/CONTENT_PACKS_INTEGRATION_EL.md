# Content Packs 0.3.0 — συμβατότητα Atlas 3.12.2

Το ZIP περιλαμβάνει σωρευτικά το 0.2.0 και το 0.3.0, επειδή ο κατάλογος δεν υπάρχει στο main κατά τον έλεγχο. Αντιγραφή στη ρίζα του repository. Δεν αλλάζει `src/app.js`, `src/data.js`, η έκδοση app 3.12.2 ή ο Worker. Μετά το Pages deployment απαιτείται πλήρης ανανέωση (Ctrl+F5), καθώς το app release version παραμένει 3.12.2.

## Δοκιμή
1. Library → Content Packs. Κατέβασε το schema ZIP, ή επίλεξε `tests/content-pack-example.json`.
2. Validate & import. Επιστροφή στην εφαρμογή με πλήρη ανανέωση. New Character → Fighter → level 3 → subclass Atlas Sentinel (homebrew).
3. Ο υπάρχων μηχανισμός απαιτεί DM review για αυτόν τον συνδυασμό. Οι επιλογές του εισαγόμενου feature δεν απονέμονται αυτόματα.
4. Το `tests/content-pack-spell-example.json` έχει ένα δεύτερο, ανεξάρτητο παράδειγμα spell για Wizard. Ο legacy Builder εμφανίζει έως 65 spells ανά λίστα, οπότε μπορεί να μην εμφανιστεί εκεί όταν έχει ήδη συμπληρωθεί το όριο. Είναι διαθέσιμο στο legacy spell catalog και στον unified κατάλογο.
5. Αφαίρεση pack και ανανέωση: σταματά η προβολή των πρόσθετων επιλογών. Δεν γίνεται migration ή διαγραφή χαρακτήρων. Κράτησε αντίγραφο του pack για χαρακτήρες που το χρησιμοποιούν.

## Όρια
- Η βάση SRD περιέχει μόνο 191 εγγραφές/αναφορές, δεν είναι πλήρες SRD. Το legacy `ATLAS_DATA` παραμένει ανέπαφο ως προς τις υπάρχουσες εγγραφές, συμπεριλαμβανομένων των μη-SRD placeholders. Το strict SRD-only Builder απαιτεί ολοκλήρωση core δεδομένων, migration και διαχωρισμό display/validation. Δεν δηλώνεται ολοκληρωμένο.
- Η προβολή νέων species/backgrounds, level-3 subclasses υφιστάμενων classes και spells με `class_ids` είναι προσθετική. Μη ασφαλή ονόματα και συγκρούσεις με παλιά ονόματα/IDs παραλείπονται. Δεν αλλάζουν τα legacy references ούτε εφαρμόζονται εισαγόμενα mechanics. New classes, feats, weapons, companions, armor, tools κ.λπ. παραμένουν στον unified κατάλογο, όχι πλήρως λειτουργικά στο Builder.
- Τα πακέτα παραμένουν browser-local, κοινά για λογαριασμούς του ίδιου browser. Καμία εγγραφή στην D1 ή Drive, καμία server-side αλλαγή. Δεν είναι όριο εξουσιοδότησης, δεν επιτρέπει παράκαμψη των υπαρχόντων ελέγχων DM. Μη χρησιμοποιείς ιδιωτικό υλικό σε κοινό browser profile.
- Η νέα cache περιλαμβάνει τα αρχεία content packs και τον κατάλογο. Δεν πραγματοποιήθηκε browser E2E, live offline test ή πλήρες regression του Atlas.

## Έλεγχοι
`node --test tests/content-packs.test.cjs tests/content-packs-bridge.test.cjs` (24 tests). Για αναγέννηση του bundle μετά από αλλαγές στο SRD/schema: `node scripts/build-content-core.cjs`.
