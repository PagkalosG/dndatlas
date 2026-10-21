# D&D Atlas v2.1.2 — Έλεγχος δεδομένων με κανόνες D&D 5e 2024

**Στόχος:** Να εμφανίζονται οι πραγματικές ικανότητες ανά class, species, subclass και background, με λιγότερα διπλότυπα. Το αρχείο αυτό **δεν αποτελεί πλήρη αυτόματο έλεγχο νομιμότητας** όλων των spells και επιλογών.

## Borruk Thunderfist — Human Fighter 3 / Battle Master

- **Fighter Weapon Mastery:** στο Fighter Level 3 δικαιούται **3 διαφορετικά είδη όπλων**. Δεν υπάρχουν εγκεκριμένες επιλογές στο εισαγόμενο character sheet και η λίστα `weaponMasteries` μένει κενή. Στο Overview άνοιξε **Weapon Mastery → Choose weapons** και επέλεξε τρία. Μη συγχέεις το `mastery` που έχει ως δυνατότητα κάθε όπλο με την **εκμάθηση** της αντίστοιχης εξειδίκευσης από τον χαρακτήρα.
- **Fighting Style:** η καταγεγραμμένη επιλογή είναι **Protection**. Στο Overview εμφανίζεται μία ενιαία εγγραφή «Fighting Style — Protection» και όχι επιπλέον «Protection Fighting Style».
- **Fighter Subclass:** το **Battle Master** εμφανίζεται στα στοιχεία κλάσης και δεν προστίθεται ως τεχνητό Feature.
- **Human (2024):** ο χαρακτήρας έχει συγχρόνως Resourceful, Skillful και Versatile. Το Versatile δίνει ένα επιπλέον Origin Feat. Αυτό εξηγεί το Tough εφόσον επιλέχθηκε ως η επιπλέον δυνατότητα, ενώ ο Soldier δίνει Savage Attacker.
- **Student of War:** πραγματικό Battle Master Feature επιπέδου 3. Δίνει proficiency με ένα Artisan's Tool και ένα επιπλέον Fighter Skill. Οι συγκεκριμένες επιλογές μένουν προς επιβεβαίωση.
- Τα **3 Maneuvers** δεν έχουν οριστικοποιηθεί από τον παίκτη και διατηρούνται κενά στο κοινό JSON.

## Luna Spellbrook — Aasimar Sorcerer 3 / Aberrant Sorcery

- Οι επιλεγμένες τεχνικές **Metamagic** εμφανίζονται μαζί και όχι ως πολλαπλές επαναλαμβανόμενες γενικές καταχωρίσεις: Transmuted Spell, Distant Spell.
- Το **Entertainer Background 2024** παρέχει το **Musician Origin Feat**. Προστέθηκε στα εγκεκριμένα δεδομένα της v2.1, παρότι δεν υπήρχε καταχωρισμένο στο παλιό PDF.
- Προστέθηκε η υποκλασική ικανότητα **Psionic Spells** του Aberrant Sorcery Level 3 (Arms of Hadar, Calm Emotions, Detect Thoughts, Dissonant Whispers, Mind Sliver), που εξηγεί τις επιπλέον αυτόματα προετοιμασμένες επιλογές.
- Το **Innate Sorcery (2024)** αυξάνει το Sorcerer spell save DC κατά 1 και δίνει Advantage στις επιθέσεις που πραγματοποιεί ο caster με Sorcerer spells, για 1 λεπτό, 2 φορές ανά Long Rest.

## Ammantyl Vythrax — Dragonborn Sorcerer 3 / Draconic Sorcery

- Οι επιλεγμένες τεχνικές **Metamagic** εμφανίζονται μαζί: Empowered Spell, Seeking Spell.
- Το **Noble Background 2024** δίνει το **Skilled Origin Feat**· υπήρχε ήδη καταχωρισμένο, οπότε δεν προστέθηκε δεύτερη φορά.
- Προστέθηκε η αληθινή subclass ικανότητα **Draconic Spells** επιπέδου 3: Alter Self, Chromatic Orb, Command, Dragon's Breath. Τα spells υπήρχαν ήδη στο spellbook, οπότε δεν δημιουργήθηκαν διπλά entries.
- **Breath Weapon:** με τους κανόνες Dragonborn 2024 προκαλεί **1d10** στον χαρακτήρα Level 3· γίνεται **2d10 στο Character Level 5**. Διορθώθηκε η περιγραφή Feature που είχε μεταφερθεί από το παλιό φύλλο.
- **Draconic Resilience:** σωστή βασική άμυνα όταν δεν φορά armor: 10 + DEX mod + CHA mod. Ο ακριβής υπολογισμός των HP και το inventory πρέπει να επιβεβαιωθούν με τον DM εφόσον τα PDF δεν περιέχουν όλες τις απαραίτητες πληροφορίες.

## Εκκρεμότητες και όρια

- Δεν έχει γίνει πλήρης έλεγχος επιτρεπτού πλήθους prepared spells, class spell choices, gear και manual Ability Score method σε κάθε χαρακτήρα.
- Δεν έχουμε επίσημη επιβεβαίωση όλων των προσωπικών επιλογών skills, tools, metamagic και maneuvers. Δεν προστέθηκαν αυθαίρετες τέτοιες επιλογές.
- Τα **demo-party.json** είναι η αρχική κοινή λίστα, ενώ οι χαρακτήρες που έχει ήδη αποθηκεύσει κάποιος στη συσκευή του παραμένουν **τοπικοί**. Για να φορτώσεις τα ενημερωμένα κοινά δεδομένα πρέπει πρώτα να κρατήσεις JSON backup και μετά να επιλέξεις **Load Party Demo**.
- Το Export PDF δεν είναι ακόμη το **επίσημο συμπληρωμένο φύλλο 2024**. Μια κενή έκδοση του επίσημου fillable PDF 2024 είναι το προτιμώμενο template για σωστή αυτόματη συμπλήρωση. Ένα DOCX είναι χρήσιμο για **προσαρμοσμένο** σχεδιασμό, όχι υποκατάστατο του επίσημου PDF.

### Ενδεικτικές πηγές ελέγχου

- Fighter και Weapon Mastery: https://www.dndbeyond.com/sources/dnd/br-2024/character-classes
- Human 2024: https://www.dndbeyond.com/sources/dnd/br-2024/character-origins
- Battle Master / Student of War: https://roll20.net/compendium/dnd5e/Subclasses%3ABattle%20Master?expansion=32231
- Draconic Sorcery: https://www.dndbeyond.com/subclasses/2190990-draconic-sorcery
- Aberrant Sorcery: https://dnd2024.wikidot.com/sorcerer:aberrant-sorcery
- Entertainer 2024: https://www.dungeonlib.com/en/2024/backgrounds/entertainer


## Επιβεβαίωση Ability Scores από DM — εκκρεμεί

- **Borruk (Soldier)**: 15/14/13/8/10/12. Αν αυτές είναι οι αρχικές τιμές πριν τις αυξήσεις Background, ο Soldier επιτρέπει +2 σε ένα από STR/DEX/CON και +1 σε διαφορετικό ή +1 και στα τρία. **Δεν έγινε μεταβολή**.
- **Luna (Entertainer)**: 10/13/14/8/12/15. Το Entertainer επιτρέπει αυξήσεις STR/DEX/CHA. **Δεν έγινε μεταβολή**.
- **Ammantyl (Noble)**: 10/13/14/8/12/15. Το Noble επιτρέπει αυξήσεις STR/INT/CHA. **Δεν έγινε μεταβολή**.
- Ο Human των κανόνων **2024** δεν δίνει +1 σε καθένα από τα έξι χαρακτηριστικά όπως ο Standard Human 2014. Οι αυξήσεις προέρχονται από Background.

Οι τιμές στα PDF είχαν σημειωθεί ως τελικές από τον DM, αλλά μοιάζουν με αρχικό Standard Array. Απαιτείται επιβεβαίωση πριν αλλάξουν τα character records ή οι υπολογισμοί HP/AC/spells.

## v3.2.4 — Έλεγχος D&D 5e 2024 (2026-10-21)

**Επιβεβαιωμένα από τους επίσημους κανόνες 2024:**

- Battle Master, Student of War (Fighter Level 3): αποκτά **και τα δύο**, μία επιπλέον Fighter Skill proficiency **και** μία Artisan’s Tool proficiency. Δεν είναι επιλογή «ή». Χωριστές επιλογές με tracking της πηγής τους.
- Αλλαγή της επιλεγμένης Student of War Skill: επαναφέρεται η προηγούμενη βαθμίδα proficiency, εφόσον η εφαρμογή γνωρίζει την προέλευσή της, αντί να προστίθενται επιπλέον skills.
- Proficiency όπλου: προστίθεται το PB στο **attack roll**, όχι στο weapon damage roll. Weapon Mastery δεν προσθέτει Proficiency Bonus ούτε από μόνο του damage.
- Fighter/Barbarian/Paladin/Ranger: Simple και Martial weapons· Rogue: Simple και Martial με Finesse/Light· Monk: Simple και Martial με Light· Bard/Cleric/Druid/Sorcerer/Warlock/Wizard: Simple. Ειδικά feats και subclass grants μπορούν να οριστούν με ρητό override.
- Multiclass Barbarian/Fighter/Paladin/Ranger: proficiency με Martial weapons (όχι αυτόματα όλες οι άλλες αρχικές proficiencies).
- Επιλογές Weapon Mastery: ανά class, επίπεδο και επιτρεπόμενο είδος όπλου· Barbarian μόνο σε melee.
- Tool proficiency είναι γνώση χρήσης, **όχι** δωρεάν φυσικό tool kit. Στον Εξοπλισμό εμφανίζονται Utilize / Craft, αλλά δεν προστίθεται αντικείμενο δωρεάν.
- Smith’s Tools: Strength, παραβίαση πόρτας/δοχείου DC 20· ο κατάλογος Craft ακολουθεί τον επίσημο πίνακα 2024.

**Περιορισμοί που παραμένουν και χρειάζονται επόμενα εξειδικευμένα audits:**

- Τα subclasses, τα spells και οι υπόλοιπες προαιρετικές δυνατότητες όλων των classes δεν έχουν πλήρως υλοποιημένο αυτοματοποιημένο legality checker. Μη θεωρείς το Builder γενικό validator όλου του PHB 2024.
- Character JSON από παλαιότερες εκδόσεις μπορεί να μην περιέχει πηγή για κάθε skill proficiency. Η πρώτη αλλαγή Student of War από τέτοια παλιά εγγραφή απαιτεί έλεγχο για τυχόν διπλή πηγή skill.
- Custom/άγνωστα όπλα και proficiency από ειδικές ικανότητες απαιτούν manual override / DM επιβεβαίωση.
- Ειδικά bonuses (π.χ. Rage, Great Weapon Master), conditional attacks, Monk Martial Arts dice και καταστάσεις μάχης δεν πρέπει να προστίθενται σε όλα τα damage rolls αυτόματα. Παραμένουν υπό τους ειδικούς κανόνες/χειροκίνητη ρύθμιση.

Πηγές:
- https://www.dndbeyond.com/sources/dnd/br-2024/character-classes
- https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character
- https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game
- https://www.dndbeyond.com/sources/dnd/br-2024/equipment
- https://roll20.net/compendium/dnd5e/Subclasses%3ABattle%20Master?expansion=32231

- Spell attack damage: δεν προστίθεται αυτόματα ability modifier στη ζημιά ξορκιών· bonus από συγκεκριμένο feature απαιτεί ρητή καταχώριση.


## v3.2.5
- Greatsword: Two-Handed weapon, normal damage 2d6. If the active loadout uses Shield, Combat warns that this attack is unavailable; it never switches to a fabricated 1d8 one-handed mode.
- Inventory new item: category first, then 2024 weapon list, curated consumables or a curated baseline equipment list; manual advanced fields restricted to Custom. Official lookup is based on bundled baseline data and is not a complete PHB catalog.