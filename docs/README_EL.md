# D&D Atlas 3.0 — Οδηγός εγκατάστασης (D&D 5e 2024)

Η v3 αποτελείται από **δύο διαφορετικές εφαρμογές**: δημόσιο frontend στο GitHub Pages και ασφαλές API σε **Cloudflare Worker + D1**. Ο υφιστάμενος Worker εικόνων Google Drive παραμένει ξεχωριστός.

**ΠΡΩΤΑ ΠΑΡΕ JSON BACKUP από το σημερινό Atlas.** Το GitHub και η Cloudflare δεν ενημερώθηκαν αυτόματα. Μην αντικαταστήσεις δεδομένα της παρέας πριν τα ελέγξεις. Η ενεργοποίηση κεντρικών δεδομένων γίνεται μόνο όταν ολοκληρώσεις τα παρακάτω.

## Α. Δημιουργία βάσης δεδομένων Cloudflare D1

1. Μπες στο [Cloudflare Dashboard](https://dash.cloudflare.com/). Επίλεξε τον λογαριασμό σου.
2. Άνοιξε **Storage & databases → D1 SQL Database** (ή **D1**, ανάλογα με το νέο μενού) και επίλεξε **Create database**.
3. Όνομα: `dndatlas`. Δημιούργησέ τη.
4. Στην καρτέλα **Console** της D1 εκτέλεσε **ολόκληρο** το περιεχόμενο του `cloudflare/api/schema.sql` (εναλλακτικά με Wrangler, παρακάτω).
5. Φύλαξε το **Database ID** που εμφανίζεται στη σελίδα της D1.

## Β. Δημιουργία του API Worker

1. Στη Cloudflare πήγαινε **Workers & Pages → Create → Worker**. Δημιούργησε νέο Worker με όνομα `dndatlas-api` (δεν είναι ο υπάρχων `dndatlas-drive`).
2. Άνοιξε **Edit Code** και αντικατάστησε το Hello World με το `cloudflare/api/src.js`. Κάνε **Deploy**.
3. Στις **Settings → Bindings → Add binding → D1 database** πρόσθεσε binding με *Variable name* `DB` και επίλεξε τη βάση `dndatlas`. Κάνε deploy τις νέες ρυθμίσεις.
4. Στις **Settings → Variables and Secrets**, πρόσθεσε:
   - `ALLOWED_ORIGIN` = `https://pagkalosg.github.io` ως **Text/Plaintext** (χωρίς τελικό `/`).
   - `BOOTSTRAP_TOKEN` = **τυχαία, μεγάλη μυστική τιμή** ως **Secret** (τουλάχιστον 24 χαρακτήρες, μόνο για πρώτη δημιουργία Creator).
   - `RECOVERY_PEPPER` = **άλλη ανεξάρτητη, τυχαία μεγάλη τιμή** ως **Secret** (τουλάχιστον 24 χαρακτήρες). **Κράτησέ την ασφαλή και μη τη χάσεις**.
5. Δοκίμασε `https://dndatlas-api.<το-subdomain-σου>.workers.dev/health`. Πρέπει να επιστρέφει `{"status":"ok","api":"3.0"}`.

**Εναλλακτική εγκατάσταση από Windows/PowerShell με Wrangler:** από το φάκελο `cloudflare/api` άλλαξε το `database_id` στο `wrangler.toml` με το ID της D1 και εκτέλεσε `npx wrangler login`, `npx wrangler d1 execute dndatlas --remote --file=./schema.sql`, `npx wrangler secret put BOOTSTRAP_TOKEN`, `npx wrangler secret put RECOVERY_PEPPER`, `npx wrangler deploy`. Το Wrangler χρειάζεται εγκατεστημένο Node.js. Μην ανεβάζεις το δικό σου `wrangler.toml` με ευαίσθητες τιμές σε δημόσια πρόσβαση· τα secrets παραμένουν μόνο στη Cloudflare.

## Γ. Δημιουργία του πρώτου Creator

Χρειάζεται να γίνει μία φορά και **πριν** τη σύνδεση χρηστών από το Atlas. Από Windows PowerShell χρησιμοποίησε `curl.exe` ή πρόγραμμα HTTP client:

```powershell
curl.exe -X POST "https://dndatlas-api.YOUR-SUBDOMAIN.workers.dev/setup/creator" `
  -H "Content-Type: application/json" `
  -H "X-Atlas-Setup: YOUR_BOOTSTRAP_TOKEN" `
  --data-raw '{"username":"creator","pin":"YOUR_STRONG_PASSPHRASE_AT_LEAST_12_CHARACTERS"}'
```

Αν το PowerShell δυσκολεύεται με JSON escaping, χρησιμοποίησε HTTP client ή το `Invoke-RestMethod` με body JSON. **Μην ανεβάζεις το bootstrap token, το Creator password ή τους εφεδρικούς κωδικούς στο GitHub ή σε chat.**

Η απάντηση επιστρέφει **10 μοναδικούς κωδικούς ανάκτησης**. Αποθήκευσέ τους *εκτός GitHub*, π.χ. σε password manager, γιατί εμφανίζονται μόνο αυτή τη φορά. Ο Creator απαιτεί ισχυρή συνθηματική φράση μήκους τουλάχιστον 12 χαρακτήρων· οι Players/DM μπορούν να χρησιμοποιήσουν αριθμητικό PIN 6–12 ψηφίων.

**Μετά το πρώτο setup, αφαίρεσε το Secret `BOOTSTRAP_TOKEN`** από τον Worker για να απενεργοποιηθεί πλήρως το endpoint αρχικής δημιουργίας.

Αν χαθεί η πρόσβαση του Creator: στην οθόνη login πάτησε **Ανάκτηση Creator με εφεδρικό κωδικό**, συμπλήρωσε έναν αχρησιμοποίητο κωδικό και νέο ισχυρό password. Αν χαθούν και οι εφεδρικοί κωδικοί, η ανάκτηση απαιτεί χειροκίνητη διαχειριστική παρέμβαση μέσω του Cloudflare account (δεν υπάρχει δημόσια παράκαμψη).

## Δ. Σύνδεση frontend στο API

Στο **δημόσιο** project του GitHub επεξεργάσου **μόνο** `data/api-config.json`:

```json
{
  "enabled": true,
  "apiUrl": "https://dndatlas-api.YOUR-SUBDOMAIN.workers.dev"
}
```

Αυτό είναι **δημόσιο endpoint, όχι μυστικό**. Το frontend δεν περιέχει Creator PIN, token ή Google API Key. Αν κρατήσεις `enabled: false`, η εφαρμογή συνεχίζει σε legacy local mode για δοκιμές, **χωρίς κοινό συγχρονισμό ή δικαιώματα**. Για κανονική χρήση πρέπει να το θέσεις `true`.

Πάρε μόνο τα αρχεία από το φάκελο `github/` στο ZIP και ανέβασέ τα **στη ρίζα** του [repository](https://github.com/PagkalosG/dndatlas), όχι ως επιπλέον υποφάκελο. Τα αρχεία `cloudflare/` **δεν ανεβαίνουν στο GitHub Pages**.

## Ε. Αρχικοποίηση χαρακτήρων και χρηστών

1. Άνοιξε το Atlas μετά το deploy και κάνε login με τον Creator.
2. Από το κουμπί **☁ Account → Import initial three characters** φόρτωσε *μία φορά* τους τρεις υπάρχοντες χαρακτήρες από το `demo-party.json` στη D1.
3. Από **Manage users**, δημιούργησε τους Players και τον DM και δώσε στον καθένα το προσωπικό PIN.
4. Πάτησε **Assign** δίπλα στο username για να αντιστοιχίσεις τον ακριβή χαρακτήρα. Οι χαρακτήρες έχουν μοναδικά αναγνωριστικά όπως `party-borruk-thunderfist`.
5. Ο Creator και ο DM επεξεργάζονται όλους τους χαρακτήρες. Οι Players μόνο τον δικό τους. **Μόνο ο Creator** δημιουργεί λογαριασμούς, αλλάζει PIN και κάνει αναθέσεις.
6. Σε κάθε refresh το Atlas ζητά τα νεότερα δεδομένα από τη D1. Σε ταυτόχρονη επεξεργασία του ίδιου χαρακτήρα χρησιμοποιείται revision και ένα παλιό Save απορρίπτεται με σύγκρουση (409).

**Ιστορία χαρακτήρα:** ιδιωτική εξ ορισμού. Τη βλέπουν ο ιδιοκτήτης και ο DM. Ο Creator τη βλέπει μόνο αν είναι και ιδιοκτήτης, όχι απλώς επειδή διαχειρίζεται την εφαρμογή. Αν ο παίκτης επιλέξει δημόσια ιστορία, μπορούν να τη δουν και οι υπόλοιποι. Η απόκρυψη εφαρμόζεται στον Worker, όχι απλώς στο UI.

## ΣΤ. Εικόνες Google Drive και session tags

Ο τωρινός Worker `dndatlas-drive` ήδη απαντά στο `/images`, αλλά για τις **ίδιες** τις φωτογραφίες πρέπει επίσης να υποστηρίζει `/image/FILE_ID`. Αντικατάστησε τον κώδικα του υπάρχοντος Worker με το `cloudflare/drive-worker/src.js`. **Μην αντικαταστήσεις** το `dndatlas-api` — είναι διαφορετικός Worker.

Οι υπάρχουσες ρυθμίσεις παραμένουν:
- `GOOGLE_DRIVE_API_KEY` → **Secret**, μέσα στον Worker εικόνων.
- `GOOGLE_DRIVE_FOLDER_ID` → **Plaintext**, στο ίδιο Worker.

Δοκίμασε πρώτα το `/images` και μετά μια πραγματική διεύθυνση `/image/FILE_ID` στον browser. Αν δεν εμφανίζεται η εικόνα, επιβεβαίωσε ότι το αρχείο και ο γονικός φάκελος είναι δημόσια αναγνώσιμοι από το Google Drive API. Το frontend χρησιμοποιεί τη νέα διεύθυνση εικόνων.

Ο DM ή ο Creator μπορεί από το Ημερολόγιο να προσθέτει σε κάθε φωτογραφία tags (π.χ. `NPC`, `Map`) και session IDs (π.χ. `Session 01`). Αυτές οι αντιστοιχίσεις φυλάσσονται στη D1 και παραμένουν αν αλλάξεις το **όνομα** του αρχείου στο Drive (όχι αν το διαγράψεις και ανεβάσεις άλλο με νέο ID).

## Ζ. Export επίσημου 2024 PDF

Η εφαρμογή περιλαμβάνει το PDF template που έδωσες: `official-2024-character-sheet.pdf`, μαζί με το `pdf-export.js`. Ο browser συμπληρώνει τα επιλεγμένα πεδία (και μία σειρά από επιπλέον τιμές όπλων/ξορκιών) και κατεβάζει **επεξεργάσιμο επίσημο πρότυπο 2024**. Χρειάζεται προσωρινή πρόσβαση στο CDN για τη βιβλιοθήκη `pdf-lib`, η οποία **δεν περιλαμβάνεται offline** στο ZIP. Χρειάζεται τελικός οπτικός έλεγχος του παραγόμενου PDF, ιδίως σε πολλά spells, μεγάλα κείμενα και ελληνικά. Επειδή το βασικό PDF χρησιμοποιεί Latin font, ελληνικά κείμενα μεταγράφονται σε λατινικούς χαρακτήρες και πρέπει να επιθεωρούνται.

Δεν αποτελεί επίσημο ψηφιακό προϊόν της Wizards of the Coast. Η Βιβλιοθήκη του Atlas περιέχει προς το παρόν σύντομες περιλήψεις και αναφορές στο [SRD 5.2.1](https://www.dndbeyond.com/srd) (CC BY 4.0), όχι πλήρη επανέκδοση ολόκληρου του Player’s Handbook.

## Η. Έλεγχος πριν τη χρήση

- Κάνε δοκιμή Creator login, Player login και DM login.
- Ο Player δεν πρέπει να μπορεί να αποθηκεύσει ξένο χαρακτήρα, ούτε με χειροκίνητο API request.
- Ο DM πρέπει να βλέπει την ιδιωτική ιστορία. Άλλοι παίκτες όχι.
- Δοκίμασε rest, HP, ξόρκια, αναλώσιμα και refresh σε δύο browsers.
- Βεβαιώσου ότι δεν εμφανίζονται μυστικά στο `data/drive-config.json`, `data/api-config.json`, στον κώδικα ή στο Git history. Αν είχαν δημοσιευτεί παλιά API Keys, κάνε **rotation**.
- Πριν αντικαταστήσεις την PWA, κάνε **Export JSON Backup**.

**Επίπεδο ελέγχου:** έγιναν συντακτικές δοκιμές JS, έλεγχος των έξι καρτελών και mock σύνδεσης σε Chromium, καθώς και τοπικές δοκιμές SQL/D1 με SQLite για ρόλους, ιδιωτικότητα, αλλαγές και ανάκτηση. Δεν έχει γίνει πραγματικό deploy ή end-to-end δοκιμή στον δικό σου Cloudflare λογαριασμό.
