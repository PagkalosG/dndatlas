# Content packs 0.2.0 — Atlas 3.12.2 preview

Το patch προσθέτει τον νέο κατάλογο, manager και schemas. Δεν αντικαθιστά το src/data.js, το rules-2024.js, το app.js ή τον Worker. Το core είναι οι 191 εγγραφές του προηγούμενου μερικού SRD 5.2.1 καταλόγου, όχι πλήρης μεταγραφή του SRD. Η παλιά εφαρμογή διατηρεί τα προηγούμενα δεδομένα της· ο αποκλεισμός μη-SRD εγγραφών από εκεί και η σύνδεση των νέων packs με Builder, Character Sheet, Combat και character migrations δεν έχουν υλοποιηθεί.

## Εγκατάσταση
Αποσυμπίεσε στο root του repository (baseline 3.12.2), χωρίς αλλαγή του deployment workflow. Το workflow ήδη αντιγράφει public/, src/ και data/ στο site. Άνοιξε Library → Content Packs ή απευθείας /dndatlas/rules-content.html. Η προσθήκη του link βασίζεται στο υπάρχον page-title και χρειάζεται browser smoke test. Η έκδοση της κύριας εφαρμογής παραμένει 3.12.2. Η νέα σελίδα απαιτεί online πρόσβαση στα στατικά αρχεία και δεν έχει ενσωματωθεί στο offline shell. Δεν έγινε deploy.

## Χρήση
Κατέβασε το schema ZIP από τη σελίδα, αποσυμπίεσέ το, εισήγαγε examples/pack.json ή επίλεξε μαζί αρχεία κατηγορίας (π.χ. subclasses.json, features.json). Τα κενά templates δεν εγκαθίστανται ως κενό pack. Ο validator ελέγχει την υποστηριζόμενη υποομάδα JSON Schema 1.0.0, τύπους, IDs, γνωστά references, localization, όρια και ownership. Δεν πιστοποιεί το περιεχόμενο ή όλους τους μηχανισμούς του παιχνιδιού. Δεν εκτελεί formulas ή κώδικα. Το API παρέχει merged records, byId, source και featuresFor. Οι νέες υποκλάσεις συνδέονται αντίστροφα με υπάρχοντα classes χωρίς αλλαγή των core αρχείων.

Η αποθήκευση localStorage αφορά το browser profile, όχι τον λογαριασμό Atlas: άλλοι λογαριασμοί στον ίδιο browser μπορούν να διαβάσουν τα packs. Μην εισάγεις ιδιωτικά δεδομένα. Δεν υπάρχει upload, συγχρονισμός ή νέα server permissions. Η αφαίρεση pack ελέγχει references άλλων packs, όχι υπάρχοντες χαρακτήρες. Υπάρχει εξαγωγή JSON πριν την αφαίρεση. Εισαγωγές από πολλαπλά tabs δεν έχουν concurrency control. Αποτυχία validation/storage δεν αντικαθιστά το αποθηκευμένο περιεχόμενο στην ίδια συνεδρία. Όριο αρχείων 4 MiB και quota browser.

## Tests
`node --test tests/content-packs.test.cjs`

Μελλοντικά: πλήρης SRD κάλυψη, runtime adapter και migration με σταθερά IDs, ασφαλής formula interpreter, account-scoped αποθήκευση/permissions αν ζητηθεί sync, offline cache και end-to-end tests. Το πρόσθετο υλικό PHB δεν διανέμεται στο repository ή στο starter ZIP.


**0.3.0:** Δες [CONTENT_PACKS_INTEGRATION_EL.md](CONTENT_PACKS_INTEGRATION_EL.md) για τη νεότερη, μερική σύνδεση με τον Builder.
