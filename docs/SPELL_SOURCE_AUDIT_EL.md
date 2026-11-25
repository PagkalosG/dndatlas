# Spell Source Audit (0.3.1 / Atlas 3.12.3)

Απαιτεί τα αρχεία του Content Packs 0.3.0 (βάση Atlas 3.12.2). Το ZIP είναι delta έναντι του 0.3.0. Από τη ρίζα του repository, **πριν το commit/deployment**, εκτέλεσε:

```sh
node scripts/apply-spell-source-audit.cjs
node --test tests/content-packs.test.cjs tests/content-packs-bridge.test.cjs tests/spell-source-audit.test.cjs
```

Ο installer ελέγχει την έκδοση και το ακριβές σημείο σύνδεσης, τροποποιεί μόνο το `src/app.js` (display hook + APP_VERSION) και ελέγχει τη σύνταξη πριν την αντικατάσταση. Αν αποτύχει, μην κάνεις deploy τα υπόλοιπα αρχεία. Το patch δεν έχει δοκιμαστεί σε πλήρη browser/Worker εκτέλεση. Η νέα έκδοση προορίζεται για deploy μόνο αφού εφαρμοστεί το hook.

Η αντιστοίχιση γίνεται κατά την εμφάνιση στο Spellbook/owned spell popup, μέσω `atlasSpellMeta`. Δεν τροποποιούνται `ref`, `spellSource`, `prepared`, slots, damage, resources, character JSON, D1 ή Drive. Το PDF δεν είναι rules source. Τα metadata του SRD είναι επαληθευμένα για 29 spells (42 συνολικές εγγραφές καταλόγου, 13 παραμένουν reference only), όχι πλήρεις μηχανοποιημένοι κανόνες. Τα user packs παραμένουν μη επαληθευμένα ακόμη και όταν δηλώνουν coverage. Το grant της Aasimar Light Bearer και του Aberrant Sorcery Psionic Spells εμφανίζεται ως inferred, όχι DM-approved. Οι class candidates δεν αποδεικνύουν δικαίωμα χρήσης, αριθμό επιλογών ή free casts. Οι υπόλοιπες ειδικές πηγές χρειάζονται μηχανισμό grant rules. Σε conflict ή ambiguous match δεν αλλάζει τίποτα. Εάν ήδη εγκατεστημένο pack συγκρούεται με νέο core ID, η φόρτωση του pack μπορεί να αποτύχει· κράτησε export και έλεγξε το conflict χωρίς διαγραφή χαρακτήρων.

Οι τέσσερις μη αντιστοιχισμένες καταχωρίσεις στο ιδιωτικό backup δεν ενσωματώνονται στον δημόσιο κώδικα ή στο ZIP. Το αρχικό backup δεν περιλαμβάνεται στο patch. Για read-only έλεγχο του δικού σου backup, όρισε το `ATLAS_TEST_BACKUP` στο περιβάλλον πριν τρέξεις το `spell-source-audit.test.cjs`. Το fixture test ελέγχει το συγκεκριμένο backup των 38 spells.

Πηγές: https://www.dndbeyond.com/srd · https://github.com/downfallx/dnd-5e-srd-markdown/blob/master/spells.md · https://roll20.net/compendium/dnd5e/Subclasses%3AAberrant%20Sorcery?expansion=32231 · https://roll20.net/compendium/dnd5e/Spells%3AArms%20of%20Hadar?expansion=32231
