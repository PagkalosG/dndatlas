# D&D Atlas — Private Drive JSON & Live Sync (v3.3.1)

## Προτεινόμενη δομή Drive

```text
D&D Atlas/
└── Campaigns/
    └── Celestial Atlas/
        ├── party-state.json        ← private, central backup
        ├── Sessions/
        │   └── session-001.json    ← optional source archives
        ├── Images/
        └── Backups/
```

Η εφαρμογή λειτουργεί με **D1 ως ενεργή βάση** και **Drive JSON ως ιδιωτικό mirror και αρχικό seed**. Οι παίκτες **δεν** γράφουν απευθείας στο Drive και δεν χρειάζονται Google account. Αυτό προστατεύει από ταυτόχρονες εγγραφές στο ίδιο JSON και επιβάλλει server-side δικαιώματα.

## Εγκατάσταση

1. Ανέβασε το αρχείο `DnDAtlas-Drive-Campaign-Seed-2024.json` στο Drive και μετονόμασέ το σε `party-state.json`. Χρησιμοποίησε **File → New file upload** ώστε να παραμείνει `.json`, όχι Google Doc.
2. Στο [Google Cloud Console](https://console.cloud.google.com/) ενεργοποίησε το **Google Drive API** σε ένα project.
3. Δημιούργησε **Service Account** και κατέβασε key JSON. **Μην το ανεβάσεις στο GitHub ή στο chat.**
4. Share `party-state.json` στο **service account email** με δικαίωμα **Editor**. Διατήρησε το sharing **Restricted**, όχι «Anyone with the link».
5. Στον Cloudflare Worker `dndatlas-api`, πρόσθεσε τα παρακάτω **Secrets** από το service-account key και το Drive file URL:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` = `client_email`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` = `private_key` (PEM, με τις αλλαγές γραμμής)
   - `GOOGLE_DRIVE_PARTY_FILE_ID` = ID του συγκεκριμένου `party-state.json`, όχι του φακέλου
6. Δημοσίευσε το `workers/api-worker.js` από το GitHub ως **Cloudflare Worker**. Το GitHub Pages deployment **δεν** ενημερώνει αυτόματα τον Worker.
7. Κάνε sign in ως Creator → Account → **Import missing from Drive JSON**. Το endpoint προσθέτει **μόνο** χαρακτήρες που λείπουν, χωρίς αντικατάσταση υπάρχοντων δεδομένων της D1.
8. Ο κάθε παίκτης έχει Save. Κάθε έγκυρη αλλαγή αποθηκεύεται στη D1 και ο Worker προγραμματίζει ενημέρωση του ιδιωτικού Drive JSON. Save επαναλαμβάνει ρητά τον συγχρονισμό. Τα υπόλοιπα apps ελέγχουν νέες D1 revisions περίπου κάθε 7 δευτερόλεπτα, χωρίς browser refresh.

## Δικαιώματα και προστασία δεδομένων

- Ο Worker επαληθεύει κάθε φορά username/PIN session, owner/role, revisions και privacy. Players μπορούν να ενημερώνουν **μόνο** τον δικό τους χαρακτήρα.
- Το Drive JSON περιέχει αντίγραφο δεδομένων χαρακτήρων, **πιθανώς και ιδιωτικές ιστορίες**. Κράτησέ το **Restricted**. Ο Worker ποτέ δεν παραδίδει ακατέργαστο JSON σε player, παρά μόνο τα ήδη ελεγχόμενα δεδομένα της D1.
- Δεν περιλαμβάνει PIN, auth tokens, recovery codes, users ή server secrets.
- Μη μετατρέπεις το `party-state.json` σε Google Sheets/Docs και μην το αλλάζεις χειροκίνητα ενώ οι εφαρμογές κάνουν save.
- Όταν δύο παίκτες σώζουν διαφορετικούς χαρακτήρες, οι αλλαγές γίνονται ανά χαρακτήρα με D1 revisions. Ο Worker σειριοποιεί τα Drive snapshots με προσωρινό D1 lease. Αν το Drive αποτύχει, η D1 παραμένει η πηγή αλήθειας, και το επόμενο Save επαναλαμβάνει την προσπάθεια.
- Το Live Sync είναι **polling περίπου 7s**, όχι WebSocket/SignalR· παραλείπεται όσο ο χρήστης επεξεργάζεται ανοιχτή φόρμα ώστε να μη χαθούν unsaved edits.

## Endpoints

- `GET /sync/revisions` — authenticated lightweight revision list
- `GET /sync/drive/status` — mirror configuration/status, no secrets
- `POST /sync/drive/import` — Creator only, **insert missing** from Drive
- `POST /sync/drive/publish` — authenticated explicit Drive mirror retry

## Μελλοντικό Party Room + QR

Προτεινόμενο schema: `parties`, `party_members`, `party_invites` (με expiration και hashed random invite token), `characters.party_id`, `sessions.party_id`. Ο DM ανοίγει party, δίνει QR για invite URL, παίκτης κάνει login και ο DM εγκρίνει συμμετοχή. Το QR **δεν** είναι από μόνο του δικαίωμα ανάγνωσης ιστοριών ή επεξεργασίας χαρακτήρων. Η μεταφορά από single party σε multi-party απαιτεί migration D1, backend scopes και testing.
