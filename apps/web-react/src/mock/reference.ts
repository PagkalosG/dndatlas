/**
 * MOCK reference data (species, classes, backgrounds, spells, items, feats).
 * Descriptions are ORIGINAL paraphrases written for this prototype — no sourcebook text.
 * Names/structure are illustrative; the backend content service supplies the licensed/real data.
 */
import { L } from '@/i18n';
import { fromCatalogClasses, fromCatalogBackgrounds, fromCatalogItems } from '@/engine/atlas2024';
import type { Background, ClassDef, Feat, Item, Language, Skill, Species, Spell } from '@/types';

export const skills: Skill[] = [
  { id: 'acrobatics', name: L('Acrobatics', 'Ακροβατικά'), ability: 'dex' },
  { id: 'animal_handling', name: L('Animal Handling', 'Χειρισμός Ζώων'), ability: 'wis' },
  { id: 'arcana', name: L('Arcana', 'Αρκάνα'), ability: 'int' },
  { id: 'athletics', name: L('Athletics', 'Αθλητισμός'), ability: 'str' },
  { id: 'deception', name: L('Deception', 'Εξαπάτηση'), ability: 'cha' },
  { id: 'history', name: L('History', 'Ιστορία'), ability: 'int' },
  { id: 'insight', name: L('Insight', 'Διαίσθηση'), ability: 'wis' },
  { id: 'intimidation', name: L('Intimidation', 'Εκφοβισμός'), ability: 'cha' },
  { id: 'investigation', name: L('Investigation', 'Διερεύνηση'), ability: 'int' },
  { id: 'medicine', name: L('Medicine', 'Ιατρική'), ability: 'wis' },
  { id: 'nature', name: L('Nature', 'Φύση'), ability: 'int' },
  { id: 'perception', name: L('Perception', 'Αντίληψη'), ability: 'wis' },
  { id: 'performance', name: L('Performance', 'Παράσταση'), ability: 'cha' },
  { id: 'persuasion', name: L('Persuasion', 'Πειθώ'), ability: 'cha' },
  { id: 'religion', name: L('Religion', 'Θρησκεία'), ability: 'int' },
  { id: 'sleight_of_hand', name: L('Sleight of Hand', 'Επιδεξιότητα Χεριών'), ability: 'dex' },
  { id: 'stealth', name: L('Stealth', 'Αθόρυβη Κίνηση'), ability: 'dex' },
  { id: 'survival', name: L('Survival', 'Επιβίωση'), ability: 'wis' },
];

export const languages: Language[] = [
  { id: 'common', name: L('Common', 'Κοινή') },
  { id: 'dwarvish', name: L('Dwarvish', 'Νανική') },
  { id: 'elvish', name: L('Elvish', 'Ελφική') },
  { id: 'giant', name: L('Giant', 'Γιγάντων') },
  { id: 'gnomish', name: L('Gnomish', 'Γκνομική') },
  { id: 'goblin', name: L('Goblin', 'Γκόμπλιν') },
  { id: 'halfling', name: L('Halfling', 'Χάφλινγκ') },
  { id: 'orc', name: L('Orc', 'Όρκ') },
  { id: 'draconic', name: L('Draconic', 'Δρακονική') },
  { id: 'celestial', name: L('Celestial', 'Ουράνια') },
  { id: 'infernal', name: L('Infernal', 'Κολασμένη') },
  { id: 'sylvan', name: L('Sylvan', 'Σιλβανική') },
];

export const tools = [
  { id: 'calligrapher', name: L("Calligrapher's Supplies", 'Εργαλεία Καλλιγραφίας') },
  { id: 'thieves', name: L("Thieves' Tools", 'Εργαλεία Κλέφτη') },
  { id: 'herbalism', name: L('Herbalism Kit', 'Κιτ Βοτανολογίας') },
  { id: 'navigator', name: L("Navigator's Tools", 'Όργανα Πλοήγησης') },
  { id: 'smith', name: L("Smith's Tools", 'Εργαλεία Σιδηρουργού') },
  { id: 'lute', name: L('Lute', 'Λαούτο') },
  { id: 'cartographer', name: L("Cartographer's Tools", 'Εργαλεία Χαρτογράφου') },
];

/* -------------------------------- Species -------------------------------- */
const original_species: Species[] = [
  { id: 'human', name: L('Human', 'Άνθρωπος'), tagline: L('Versatile and ambitious', 'Ευέλικτοι και φιλόδοξοι'), description: L('Adaptable people found everywhere. A flexible starting point for any kind of hero.', 'Προσαρμοστικοί άνθρωποι που βρίσκονται παντού. Ευέλικτη βάση για οποιονδήποτε ήρωα.'), traits: [L('Adaptable', 'Προσαρμοστικοί'), L('Skilled', 'Επιδέξιοι')], size: 'Medium', hue: 38, glyph: '✦' },
  { id: 'elf', name: L('Elf', 'Ξωτικό'), tagline: L('Graceful and long-lived', 'Χαριτωμένα και μακρόβια'), description: L('Keen-sensed folk with a deep tie to magic and memory. Choose a lineage that shapes your gifts.', 'Οξυδερκείς λαοί με βαθύ δεσμό με τη μαγεία και τη μνήμη. Διάλεξε καταγωγή που διαμορφώνει τα χαρίσματά σου.'), traits: [L('Keen senses', 'Οξείες αισθήσεις'), L('Trance-like rest', 'Ύπνος-διαλογισμός')], size: 'Medium', hue: 150, glyph: '☽',
    lineages: [
      { id: 'high', name: L('High Elf', 'Υψηλό Ξωτικό'), note: L('Arcane aptitude', 'Αρκανική κλίση') },
      { id: 'wood', name: L('Wood Elf', 'Ξωτικό των Δασών'), note: L('Swift and woodland-wise', 'Γρήγορο και γνώστης των δασών') },
      { id: 'drow', name: L('Drow', 'Ντρόου'), note: L('Underdark heritage', 'Καταγωγή από το Underdark') },
    ] },
  { id: 'dwarf', name: L('Dwarf', 'Νάνος'), tagline: L('Sturdy and steadfast', 'Ανθεκτικοί και σταθεροί'), description: L('Stone-born craftspeople known for resilience and loyalty to kin and craft.', 'Τεχνίτες της πέτρας, γνωστοί για την αντοχή και την πίστη σε συγγενείς και τέχνη.'), traits: [L('Resilient', 'Ανθεκτικοί'), L('Stonecunning', 'Γνώση της πέτρας')], size: 'Medium', hue: 28, glyph: '⛰' },
  { id: 'dragonborn', name: L('Dragonborn', 'Δρακογέννητος'), tagline: L('Draconic heritage', 'Δρακονική κληρονομιά'), description: L('Descendants of dragonkind with a breath weapon tied to an ancestral dragon type.', 'Απόγονοι δράκων με πνοή συνδεδεμένη με τον τύπο του προγόνου δράκου.'), traits: [L('Breath weapon', 'Πνοή δράκου'), L('Damage resistance', 'Αντίσταση βλάβης')], size: 'Medium', hue: 8, glyph: '🜂',
    lineages: [
      { id: 'red', name: L('Red ancestry', 'Κόκκινη καταγωγή'), note: L('Fire', 'Φωτιά') },
      { id: 'blue', name: L('Blue ancestry', 'Μπλε καταγωγή'), note: L('Lightning', 'Αστραπή') },
      { id: 'gold', name: L('Gold ancestry', 'Χρυσή καταγωγή'), note: L('Fire', 'Φωτιά') },
      { id: 'silver', name: L('Silver ancestry', 'Αργυρή καταγωγή'), note: L('Cold', 'Ψύχος') },
    ] },
  { id: 'halfling', name: L('Halfling', 'Χάφλινγκ'), tagline: L('Small, brave and lucky', 'Μικροί, θαρραλέοι και τυχεροί'), description: L('Cheerful wanderers whose luck and nerve make up for their size.', 'Εύθυμοι περιπλανώμενοι που η τύχη και το θάρρος τους αντισταθμίζουν το μέγεθος.'), traits: [L('Lucky', 'Τυχεροί'), L('Brave', 'Θαρραλέοι')], size: 'Small', hue: 95, glyph: '❀' },
  { id: 'gnome', name: L('Gnome', 'Γκνομ'), tagline: L('Curious inventors', 'Περίεργοι εφευρέτες'), description: L('Small, inquisitive folk with an affinity for tinkering and clever magic.', 'Μικροί, περίεργοι λαοί με κλίση στις εφευρέσεις και την πονηρή μαγεία.'), traits: [L('Quick wits', 'Ετοιμότητα'), L('Darkvision', 'Νυχτερινή όραση')], size: 'Small', hue: 175, glyph: '⚙' },
  { id: 'goliath', name: L('Goliath', 'Γκόλιαθ'), tagline: L('Mountain-born giants', 'Γίγαντες των βουνών'), description: L('Tall and powerful, shaped by giant ancestry that grants a signature boon.', 'Ψηλοί και δυνατοί, με γιγάντια καταγωγή που δίνει ένα χαρακτηριστικό χάρισμα.'), traits: [L('Giant ancestry', 'Γιγάντια καταγωγή'), L('Powerful build', 'Ισχυρή σωματική διάπλαση')], size: 'Medium', hue: 210, glyph: '▲' },
  { id: 'orc', name: L('Orc', 'Όρκ'), tagline: L('Relentless and fierce', 'Ακατάπαυστοι και άγριοι'), description: L('Tenacious warriors whose endurance carries them through the toughest fights.', 'Επίμονοι πολεμιστές που η αντοχή τους τους περνά από τις πιο σκληρές μάχες.'), traits: [L('Relentless endurance', 'Ακατάπαυστη αντοχή'), L('Adrenaline rush', 'Έξαψη αδρεναλίνης')], size: 'Medium', hue: 120, glyph: '⚔' },
  { id: 'tiefling', name: L('Tiefling', 'Τίφλινγκ'), tagline: L('Touched by the Lower Planes', 'Σημαδεμένοι από τα Κατώτερα Επίπεδα'), description: L('Marked by an otherworldly legacy that colors their magic and appearance.', 'Σημαδεμένοι από μια υπερκόσμια κληρονομιά που χρωματίζει τη μαγεία και την εμφάνισή τους.'), traits: [L('Fiendish legacy', 'Δαιμονική κληρονομιά'), L('Innate magic', 'Έμφυτη μαγεία')], size: 'Medium', hue: 320, glyph: '♆',
    lineages: [
      { id: 'abyssal', name: L('Abyssal', 'Άβυσσος'), note: L('Chaotic legacy', 'Χαοτική κληρονομιά') },
      { id: 'chthonic', name: L('Chthonic', 'Χθόνιος'), note: L('Death-touched legacy', 'Κληρονομιά του θανάτου') },
      { id: 'infernal', name: L('Infernal', 'Κολασμένος'), note: L('Lawful legacy', 'Νόμιμη κληρονομιά') },
    ] },
  { id: 'aasimar', name: L('Aasimar', 'Άασιμαρ'), tagline: L('Celestial spark', 'Ουράνιο σπινθήρισμα'), description: L('Mortals carrying a spark of the upper planes that can heal, shine or empower.', 'Θνητοί με σπινθήρα από τα ανώτερα επίπεδα που μπορεί να θεραπεύσει, να φωτίσει ή να ενδυναμώσει.'), traits: [L('Celestial resistance', 'Ουράνια αντίσταση'), L('Healing hands', 'Θεραπευτικά χέρια')], size: 'Medium', hue: 48, glyph: '☀',
    choiceGroups: [{ id: 'celestial_revelation', label: L('Celestial Revelation', 'Ουράνια Αποκάλυψη (Celestial Revelation)'), pick: 1, atLevel: 3, options: [
      { id: 'heavenly_wings', name: L('Heavenly Wings', 'Ουράνια Φτερά'), note: L('Brief flight', 'Σύντομη πτήση') },
      { id: 'inner_radiance', name: L('Inner Radiance', 'Εσωτερική Λάμψη'), note: L('Shed light and harm foes nearby', 'Φωτίζεις και βλάπτεις γύρω') },
      { id: 'necrotic_shroud', name: L('Necrotic Shroud', 'Νεκρικό Πέπλο'), note: L('Frighten nearby foes', 'Τρομάζεις κοντινούς εχθρούς') },
    ] }] },
];

/* -------------------------------- Classes -------------------------------- */
const sub = (id: string, en: string, el: string, note: [string, string]) => ({ id, name: L(en, el), note: L(note[0], note[1]) });

const original_classes: ClassDef[] = [
  { id: 'barbarian', name: L('Barbarian', 'Βάρβαρος'), tagline: L('Primal fury', 'Πρωτόγονη μανία'), description: L('A fierce frontline fighter who channels rage into toughness and power.', 'Άγριος μαχητής πρώτης γραμμής που μετατρέπει την οργή σε αντοχή και δύναμη.'), role: 'martial', hitDie: 12, primary: ['str'], complexity: 1, spellcaster: false, subclassLevel: 3, skillPicks: 2, skillOptions: ['animal_handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'], armorTraining: ['light', 'medium', 'shield'], weaponTraining: ['simple', 'martial'], hue: 12, glyph: '⚒', choiceGroups: [],
    subclasses: [sub('berserker', 'Path of the Berserker', 'Μονοπάτι του Berserker', ['Frenzied offense', 'Επιθετική μανία']), sub('wild_heart', 'Path of the Wild Heart', 'Μονοπάτι της Άγριας Καρδιάς', ['Animal spirits', 'Πνεύματα ζώων']), sub('world_tree', 'Path of the World Tree', 'Μονοπάτι του Δέντρου του Κόσμου', ['Cosmic vitality', 'Κοσμική ζωτικότητα']), sub('zealot', 'Path of the Zealot', 'Μονοπάτι του Ζηλωτή', ['Divine fury', 'Θεϊκή μανία'])] },
  { id: 'bard', name: L('Bard', 'Βάρδος'), tagline: L('Inspiring performer', 'Εμπνευστής'), description: L('A charismatic spellcaster who weaves music and words into magic and support.', 'Χαρισματικός μάγος που υφαίνει μουσική και λόγια σε μαγεία και υποστήριξη.'), role: 'caster', hitDie: 8, primary: ['cha'], complexity: 2, spellcaster: true, subclassLevel: 3, skillPicks: 3, skillOptions: ['acrobatics', 'animal_handling', 'arcana', 'athletics', 'deception', 'history', 'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception', 'performance', 'persuasion', 'religion', 'sleight_of_hand', 'stealth', 'survival'], armorTraining: ['light'], weaponTraining: ['simple'], hue: 300, glyph: '♪', choiceGroups: [],
    subclasses: [sub('dance', 'College of Dance', 'Κολέγιο του Χορού', ['Graceful performer', 'Χαριτωμένος καλλιτέχνης']), sub('glamour', 'College of Glamour', 'Κολέγιο της Γοητείας', ['Fey allure', 'Γοητεία των Νεράιδων']), sub('lore', 'College of Lore', 'Κολέγιο της Γνώσης', ['Knowledge seeker', 'Αναζητητής γνώσης']), sub('valor', 'College of Valor', 'Κολέγιο της Ανδρείας', ['Battle-ready bard', 'Βάρδος της μάχης'])] },
  { id: 'cleric', name: L('Cleric', 'Ιερέας'), tagline: L('Divine champion', 'Θεϊκός πρωταθλητής'), description: L('A servant of a divine power who heals allies and wields holy magic.', 'Υπηρέτης θεϊκής δύναμης που θεραπεύει συμμάχους και χρησιμοποιεί ιερή μαγεία.'), role: 'hybrid', hitDie: 8, primary: ['wis'], complexity: 2, spellcaster: true, subclassLevel: 3, skillPicks: 2, skillOptions: ['history', 'insight', 'medicine', 'persuasion', 'religion'], armorTraining: ['light', 'medium', 'shield'], weaponTraining: ['simple'], hue: 50, glyph: '✚', choiceGroups: [],
    subclasses: [sub('life', 'Life Domain', 'Επικράτεια της Ζωής', ['Healing focus', 'Εστίαση στη θεραπεία']), sub('light', 'Light Domain', 'Επικράτεια του Φωτός', ['Radiant magic', 'Φωτεινή μαγεία']), sub('trickery', 'Trickery Domain', 'Επικράτεια της Απάτης', ['Illusion and stealth', 'Ψευδαίσθηση και μυστικότητα']), sub('war', 'War Domain', 'Επικράτεια του Πολέμου', ['Martial divine', 'Πολεμική θεότητα'])] },
  { id: 'druid', name: L('Druid', 'Δρυΐδης'), tagline: L('Voice of nature', 'Φωνή της φύσης'), description: L('A nature-bound caster who can shift into animal forms and command the wild.', 'Μάγος δεμένος με τη φύση που μεταμορφώνεται σε ζώα και διατάζει το άγριο.'), role: 'caster', hitDie: 8, primary: ['wis'], complexity: 3, spellcaster: true, subclassLevel: 3, skillPicks: 2, skillOptions: ['arcana', 'animal_handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'], armorTraining: ['light', 'shield'], weaponTraining: ['simple'], hue: 135, glyph: '❦', choiceGroups: [],
    subclasses: [sub('land', 'Circle of the Land', 'Κύκλος της Γης', ['Terrain magic', 'Μαγεία εδάφους']), sub('moon', 'Circle of the Moon', 'Κύκλος της Σελήνης', ['Stronger wild forms', 'Ισχυρότερες μορφές']), sub('sea', 'Circle of the Sea', 'Κύκλος της Θάλασσας', ['Tides and storms', 'Παλίρροιες και καταιγίδες']), sub('stars', 'Circle of the Stars', 'Κύκλος των Άστρων', ['Starry insight', 'Αστρική διορατικότητα'])] },
  { id: 'fighter', name: L('Fighter', 'Μαχητής'), tagline: L('Master of arms', 'Κύριος των όπλων'), description: L('A disciplined weapon expert, reliable in any fight and easy to learn.', 'Πειθαρχημένος ειδικός στα όπλα, αξιόπιστος σε κάθε μάχη και εύκολος στην εκμάθηση.'), role: 'martial', hitDie: 10, primary: ['str', 'dex'], complexity: 1, spellcaster: false, subclassLevel: 3, skillPicks: 2, skillOptions: ['acrobatics', 'animal_handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'], armorTraining: ['light', 'medium', 'heavy', 'shield'], weaponTraining: ['simple', 'martial'], hue: 5, glyph: '⚔',
    choiceGroups: [
      { id: 'fighting_style', label: L('Fighting Style', 'Στυλ Μάχης'), pick: 1, atLevel: 1, options: [
        { id: 'archery', name: L('Archery', 'Τοξοβολία'), note: L('Favors ranged weapons', 'Ευνοεί τα όπλα εξ αποστάσεως') },
        { id: 'defense', name: L('Defense', 'Άμυνα'), note: L('Better while armored', 'Καλύτερο με πανοπλία') },
        { id: 'great_weapon', name: L('Great Weapon Fighting', 'Μάχη με Μεγάλο Όπλο'), note: L('Two-handed focus', 'Εστίαση σε δίχειρα') },
        { id: 'two_weapon', name: L('Two-Weapon Fighting', 'Μάχη με Δύο Όπλα'), note: L('Dual wielding', 'Διπλά όπλα') },
        { id: 'protection', name: L('Protection', 'Προστασία'), note: L('Shield an ally', 'Προστατεύεις σύμμαχο') },
      ] },
      { id: 'maneuvers', label: L('Maneuvers', 'Ελιγμοί'), pick: 3, atLevel: 3, requiresSubclass: 'battle_master', options: [
        { id: 'disarming', name: L('Disarming Attack', 'Επίθεση Αφοπλισμού') },
        { id: 'riposte', name: L('Riposte', 'Αντεπίθεση') },
        { id: 'trip', name: L('Trip Attack', 'Επίθεση Σκοντάμματος') },
        { id: 'precision', name: L('Precision Attack', 'Επίθεση Ακριβείας') },
        { id: 'menacing', name: L('Menacing Attack', 'Απειλητική Επίθεση') },
      ] },
    ],
    subclasses: [sub('battle_master', 'Battle Master', 'Battle Master', ['Tactical maneuvers', 'Τακτικοί ελιγμοί']), sub('champion', 'Champion', 'Champion', ['Simple and sturdy', 'Απλός και στιβαρός']), sub('eldritch_knight', 'Eldritch Knight', 'Eldritch Knight', ['Blends blade and spell', 'Σπαθί και ξόρκι']), sub('psi_warrior', 'Psi Warrior', 'Psi Warrior', ['Psionic power', 'Ψιονική δύναμη'])] },
  { id: 'monk', name: L('Monk', 'Μοναχός'), tagline: L('Disciplined martial artist', 'Πειθαρχημένος πολεμικός καλλιτέχνης'), description: L('A fast, unarmored fighter who channels inner energy into strikes and mobility.', 'Γρήγορος, άοπλος μαχητής που διοχετεύει εσωτερική ενέργεια σε χτυπήματα και κινητικότητα.'), role: 'martial', hitDie: 8, primary: ['dex', 'wis'], complexity: 2, spellcaster: false, subclassLevel: 3, skillPicks: 2, skillOptions: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'], armorTraining: [], weaponTraining: ['simple'], hue: 190, glyph: '☯', choiceGroups: [],
    subclasses: [sub('mercy', 'Warrior of Mercy', 'Πολεμιστής του Ελέους', ['Healing and harm', 'Θεραπεία και βλάβη']), sub('shadow', 'Warrior of Shadow', 'Πολεμιστής της Σκιάς', ['Stealth and darkness', 'Μυστικότητα και σκοτάδι']), sub('elements', 'Warrior of the Elements', 'Πολεμιστής των Στοιχείων', ['Elemental strikes', 'Στοιχειακά χτυπήματα']), sub('open_hand', 'Warrior of the Open Hand', 'Πολεμιστής του Ανοιχτού Χεριού', ['Classic unarmed master', 'Κλασικός κύριος της άοπλης μάχης'])] },
  { id: 'paladin', name: L('Paladin', 'Παλαδίνος'), tagline: L('Sworn holy warrior', 'Ορκισμένος ιερός πολεμιστής'), description: L('A heavily armored warrior bound by an oath, blending steel with divine power.', 'Βαριά θωρακισμένος πολεμιστής δεμένος με όρκο, που συνδυάζει ατσάλι και θεϊκή δύναμη.'), role: 'hybrid', hitDie: 10, primary: ['str', 'cha'], complexity: 2, spellcaster: true, subclassLevel: 3, skillPicks: 2, skillOptions: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'], armorTraining: ['light', 'medium', 'heavy', 'shield'], weaponTraining: ['simple', 'martial'], hue: 45, glyph: '✠',
    choiceGroups: [{ id: 'fighting_style', label: L('Fighting Style', 'Στυλ Μάχης'), pick: 1, atLevel: 2, options: [
      { id: 'defense', name: L('Defense', 'Άμυνα') }, { id: 'great_weapon', name: L('Great Weapon Fighting', 'Μάχη με Μεγάλο Όπλο') }, { id: 'protection', name: L('Protection', 'Προστασία') },
    ] }],
    subclasses: [sub('devotion', 'Oath of Devotion', 'Όρκος της Αφοσίωσης', ['Classic knight', 'Κλασικός ιππότης']), sub('glory', 'Oath of Glory', 'Όρκος της Δόξας', ['Heroic athleticism', 'Ηρωικός αθλητισμός']), sub('ancients', 'Oath of the Ancients', 'Όρκος των Αρχαίων', ['Light and life', 'Φως και ζωή']), sub('vengeance', 'Oath of Vengeance', 'Όρκος της Εκδίκησης', ['Hunting foes', 'Κυνήγι εχθρών'])] },
  { id: 'ranger', name: L('Ranger', 'Ρέιντζερ'), tagline: L('Wilderness hunter', 'Κυνηγός της άγριας φύσης'), description: L('A skilled tracker and archer who thrives in the wild with light nature magic.', 'Ικανός ιχνηλάτης και τοξότης που ευδοκιμεί στην άγρια φύση με ελαφριά μαγεία.'), role: 'hybrid', hitDie: 10, primary: ['dex', 'wis'], complexity: 2, spellcaster: true, subclassLevel: 3, skillPicks: 3, skillOptions: ['animal_handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'], armorTraining: ['light', 'medium', 'shield'], weaponTraining: ['simple', 'martial'], hue: 110, glyph: '➳',
    choiceGroups: [{ id: 'fighting_style', label: L('Fighting Style', 'Στυλ Μάχης'), pick: 1, atLevel: 2, options: [
      { id: 'archery', name: L('Archery', 'Τοξοβολία') }, { id: 'defense', name: L('Defense', 'Άμυνα') }, { id: 'two_weapon', name: L('Two-Weapon Fighting', 'Μάχη με Δύο Όπλα') },
    ] }],
    subclasses: [sub('beast_master', 'Beast Master', 'Beast Master', ['Animal companion', 'Ζωικός σύντροφος']), sub('fey_wanderer', 'Fey Wanderer', 'Fey Wanderer', ['Fey charm', 'Γοητεία των Νεράιδων']), sub('gloom_stalker', 'Gloom Stalker', 'Gloom Stalker', ['Ambush in darkness', 'Ενέδρα στο σκοτάδι']), sub('hunter', 'Hunter', 'Hunter', ['Versatile prey tactics', 'Ευέλικτες τακτικές'])] },
  { id: 'rogue', name: L('Rogue', 'Κλέφτης'), tagline: L('Cunning and precise', 'Πονηρός και ακριβής'), description: L('A stealthy specialist who relies on skill, timing and precision strikes.', 'Μυστικός ειδικός που βασίζεται στην ικανότητα, το συγχρονισμό και τα ακριβή χτυπήματα.'), role: 'skill', hitDie: 8, primary: ['dex'], complexity: 1, spellcaster: false, subclassLevel: 3, skillPicks: 4, skillOptions: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'persuasion', 'sleight_of_hand', 'stealth'], armorTraining: ['light'], weaponTraining: ['simple', 'martial'], hue: 260, glyph: '🗡', choiceGroups: [],
    subclasses: [sub('arcane_trickster', 'Arcane Trickster', 'Arcane Trickster', ['Rogue with spells', 'Κλέφτης με ξόρκια']), sub('assassin', 'Assassin', 'Assassin', ['Deadly ambushes', 'Θανατηφόρες ενέδρες']), sub('soulknife', 'Soulknife', 'Soulknife', ['Psychic blades', 'Ψυχικές λεπίδες']), sub('thief', 'Thief', 'Thief', ['Agile burglar', 'Ευέλικτος διαρρήκτης'])] },
  { id: 'sorcerer', name: L('Sorcerer', 'Μάγος Καταγωγής'), tagline: L('Innate magic', 'Έμφυτη μαγεία'), description: L('A caster whose power is born in their blood and shaped on the fly.', 'Μάγος του οποίου η δύναμη γεννήθηκε στο αίμα του και διαμορφώνεται εν κινήσει.'), role: 'caster', hitDie: 6, primary: ['cha'], complexity: 3, spellcaster: true, subclassLevel: 3, skillPicks: 2, skillOptions: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'], armorTraining: [], weaponTraining: ['simple'],
    hue: 340, glyph: '❂',
    choiceGroups: [{ id: 'metamagic', label: L('Metamagic', 'Μεταμαγεία'), pick: 2, atLevel: 2, options: [
      { id: 'careful', name: L('Careful Spell', 'Προσεκτικό Ξόρκι'), note: L('Protect allies from your spell', 'Προστατεύει συμμάχους') },
      { id: 'quickened', name: L('Quickened Spell', 'Επιταχυμένο Ξόρκι'), note: L('Cast faster', 'Ταχύτερη εκτέλεση') },
      { id: 'twinned', name: L('Twinned Spell', 'Διπλό Ξόρκι'), note: L('Hit a second target', 'Δεύτερος στόχος') },
      { id: 'subtle', name: L('Subtle Spell', 'Διακριτικό Ξόρκι'), note: L('Cast without obvious signs', 'Χωρίς εμφανή σημάδια') },
    ] }],
    subclasses: [sub('aberrant', 'Aberrant Sorcery', 'Αφύσικη Μαγεία', ['Psionic mutation', 'Ψιονική μετάλλαξη']), sub('clockwork', 'Clockwork Sorcery', 'Μαγεία Μηχανισμού', ['Order and balance', 'Τάξη και ισορροπία']), sub('draconic', 'Draconic Sorcery', 'Δρακονική Μαγεία', ['Dragon bloodline', 'Δρακονικό αίμα']), sub('wild_magic', 'Wild Magic Sorcery', 'Άγρια Μαγεία', ['Unpredictable surges', 'Απρόβλεπτες εκρήξεις'])] },
  { id: 'warlock', name: L('Warlock', 'Γκόετ'), tagline: L('Pact-bound caster', 'Μάγος του συμβολαίου'), description: L('A caster empowered by a pact with a mysterious patron, with customizable invocations.', 'Μάγος που αντλεί δύναμη από συμβόλαιο με μυστηριώδη προστάτη, με προσαρμόσιμες επικλήσεις.'), role: 'caster', hitDie: 8, primary: ['cha'], complexity: 3, spellcaster: true, subclassLevel: 3, skillPicks: 2, skillOptions: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'], armorTraining: ['light'], weaponTraining: ['simple'], hue: 280, glyph: '☠',
    choiceGroups: [{ id: 'invocations', label: L('Eldritch Invocations', 'Ελδρίτς Επικλήσεις'), pick: 1, atLevel: 1, options: [
      { id: 'pact_blade', name: L('Pact of the Blade', 'Σύμφωνο της Λεπίδας') },
      { id: 'pact_chain', name: L('Pact of the Chain', 'Σύμφωνο της Αλυσίδας') },
      { id: 'pact_tome', name: L('Pact of the Tome', 'Σύμφωνο του Τόμου') },
      { id: 'agonizing', name: L('Agonizing Blast', 'Οδυνηρή Έκρηξη'), requires: { minLevel: 2 } },
    ] }],
    subclasses: [sub('archfey', 'Archfey Patron', 'Προστάτης Archfey', ['Fey trickery', 'Απάτες των Νεράιδων']), sub('celestial', 'Celestial Patron', 'Ουράνιος Προστάτης', ['Radiant healing', 'Φωτεινή θεραπεία']), sub('fiend', 'Fiend Patron', 'Προστάτης Δαίμονας', ['Fiery power', 'Φλογερή δύναμη']), sub('great_old_one', 'Great Old One Patron', 'Προστάτης Great Old One', ['Alien minds', 'Εξωγήινα μυαλά'])] },
  { id: 'wizard', name: L('Wizard', 'Μάγος'), tagline: L('Scholar of the arcane', 'Λόγιος της αρκάνα'), description: L('A learned caster with the widest spell selection, collected in a spellbook.', 'Μορφωμένος μάγος με την ευρύτερη γκάμα ξορκιών, συγκεντρωμένων σε βιβλίο ξορκιών.'), role: 'caster', hitDie: 6, primary: ['int'], complexity: 3, spellcaster: true, subclassLevel: 3, skillPicks: 2, skillOptions: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'nature', 'religion'], armorTraining: [], weaponTraining: ['simple'], hue: 225, glyph: '✧', choiceGroups: [],
    subclasses: [sub('abjurer', 'Abjurer', 'Abjurer', ['Protective magic', 'Προστατευτική μαγεία']), sub('diviner', 'Diviner', 'Diviner', ['Foresight', 'Πρόγνωση']), sub('evoker', 'Evoker', 'Evoker', ['Shaped blasts', 'Διαμορφωμένες εκρήξεις']), sub('illusionist', 'Illusionist', 'Illusionist', ['Deceptive magic', 'Απατηλή μαγεία'])] },
];

/* ------------------------------ Backgrounds ------------------------------ */
const original_backgrounds: Background[] = [
  { id: 'acolyte', name: L('Acolyte', 'Ακόλουθος'), description: L('You served in a temple and learned its rites and lore.', 'Υπηρέτησες σε ναό και έμαθες τις τελετές και τη γνώση του.'), skills: ['insight', 'religion'], tool: tools[0].name, feat: L('Magic Initiate (Cleric)', 'Magic Initiate (Ιερέας)'), abilityBoostOptions: ['int', 'wis', 'cha'], languagesPick: 2 },
  { id: 'criminal', name: L('Criminal', 'Εγκληματίας'), description: L('You made a living outside the law and know the underworld.', 'Ζούσες εκτός νόμου και γνωρίζεις τον υπόκοσμο.'), skills: ['sleight_of_hand', 'stealth'], tool: tools[1].name, feat: L('Alert', 'Alert'), abilityBoostOptions: ['dex', 'con', 'int'], languagesPick: 2 },
  { id: 'sage', name: L('Sage', 'Σοφός'), description: L('Years of study in libraries and academies shaped your mind.', 'Χρόνια μελέτης σε βιβλιοθήκες και ακαδημίες διαμόρφωσαν το μυαλό σου.'), skills: ['arcana', 'history'], tool: tools[0].name, feat: L('Magic Initiate (Wizard)', 'Magic Initiate (Μάγος)'), abilityBoostOptions: ['con', 'int', 'wis'], languagesPick: 2 },
  { id: 'soldier', name: L('Soldier', 'Στρατιώτης'), description: L('Military training taught you discipline and combat basics.', 'Η στρατιωτική εκπαίδευση σου έδωσε πειθαρχία και βασικές πολεμικές γνώσεις.'), skills: ['athletics', 'intimidation'], tool: tools[4].name, feat: L('Savage Attacker', 'Savage Attacker'), abilityBoostOptions: ['str', 'dex', 'con'], languagesPick: 2 },
  { id: 'noble', name: L('Noble', 'Ευγενής'), description: L('You grew up among privilege, politics and expectations.', 'Μεγάλωσες ανάμεσα σε προνόμια, πολιτική και προσδοκίες.'), skills: ['history', 'persuasion'], tool: tools[5].name, feat: L('Skilled', 'Skilled'), abilityBoostOptions: ['str', 'int', 'cha'], languagesPick: 2 },
  { id: 'sailor', name: L('Sailor', 'Ναυτικός'), description: L('Life at sea gave you balance, grit and sea-lore.', 'Η ζωή στη θάλασσα σου έδωσε ισορροπία, αντοχή και ναυτική γνώση.'), skills: ['acrobatics', 'perception'], tool: tools[3].name, feat: L('Tavern Brawler', 'Tavern Brawler'), abilityBoostOptions: ['str', 'dex', 'wis'], languagesPick: 2 },
  { id: 'guide', name: L('Guide', 'Οδηγός'), description: L('You led travelers through wild and dangerous land.', 'Οδήγησες ταξιδιώτες μέσα από άγριες και επικίνδυνες περιοχές.'), skills: ['stealth', 'survival'], tool: tools[6].name, feat: L('Magic Initiate (Druid)', 'Magic Initiate (Δρυΐδης)'), abilityBoostOptions: ['dex', 'con', 'wis'], languagesPick: 2 },
  { id: 'hermit', name: L('Hermit', 'Ερημίτης'), description: L('Seclusion gave you quiet insight and an unusual discovery.', 'Η απομόνωση σου έδωσε ήσυχη διορατικότητα και μια ασυνήθιστη ανακάλυψη.'), skills: ['medicine', 'religion'], tool: tools[2].name, feat: L('Healer', 'Healer'), abilityBoostOptions: ['con', 'wis', 'cha'], languagesPick: 2 },
];

/* --------------------------------- Feats --------------------------------- */
const default_feats: Feat[] = [
  { id: 'alert', name: L('Alert', 'Alert'), summary: L('Be ready when danger strikes first.', 'Να είσαι έτοιμος όταν χτυπήσει ο κίνδυνος.'), minLevel: 1, category: 'origin' },
  { id: 'skilled', name: L('Skilled', 'Skilled'), summary: L('Broaden your proficiencies.', 'Διεύρυνε τις ικανότητές σου.'), minLevel: 1, category: 'origin' },
  { id: 'lucky', name: L('Lucky', 'Lucky'), summary: L('A pool of fortune to bend the odds.', 'Απόθεμα τύχης για να γείρεις την πλάστιγγα.'), minLevel: 1, category: 'origin' },
  { id: 'tough', name: L('Tough', 'Tough'), summary: L('More staying power.', 'Περισσότερη αντοχή.'), minLevel: 1, category: 'origin' },
  { id: 'observant', name: L('Observant', 'Observant'), summary: L('Sharpen your senses.', 'Όξυνε τις αισθήσεις σου.'), minLevel: 4, category: 'general' },
  { id: 'resilient', name: L('Resilient', 'Resilient'), summary: L('Shore up a weak spot.', 'Ενίσχυσε ένα αδύναμο σημείο.'), minLevel: 4, category: 'general' },
  { id: 'sentinel', name: L('Sentinel', 'Sentinel'), summary: L('Control the battlefield around you.', 'Έλεγχος του πεδίου γύρω σου.'), minLevel: 4, category: 'general' },
];

/* --------------------------------- Spells -------------------------------- */
const sp = (id: string, en: string, el: string, level: number, school: Spell['school'], components: Spell['components'], classes: string[], usage: Spell['usage'], sEn: string, sEl: string): Spell =>
  ({ id, name: L(en, el), level, school, components, classes, usage, summary: L(sEn, sEl) });

export const spells: Spell[] = [
  sp('light', 'Light', 'Φως', 0, 'Evocation', ['V', 'M'], ['bard', 'cleric', 'sorcerer', 'wizard'], [], 'Make an object shine.', 'Κάνε ένα αντικείμενο να φωτίζει.'),
  sp('mage_hand', 'Mage Hand', 'Χέρι Μάγου', 0, 'Conjuration', ['V', 'S'], ['bard', 'sorcerer', 'warlock', 'wizard'], [], 'A spectral hand to manipulate objects.', 'Ένα φασματικό χέρι για χειρισμό αντικειμένων.'),
  sp('guidance', 'Guidance', 'Καθοδήγηση', 0, 'Divination', ['V', 'S'], ['cleric', 'druid'], ['concentration'], 'A touch of divine help.', 'Ένα άγγιγμα θεϊκής βοήθειας.'),
  sp('fire_bolt', 'Fire Bolt', 'Βέλος Φωτιάς', 0, 'Evocation', ['V', 'S'], ['sorcerer', 'wizard'], [], 'Hurl a mote of fire.', 'Εκτόξευσε ένα σπινθήρα φωτιάς.'),
  sp('vicious_mockery', 'Vicious Mockery', 'Σκληρή Κοροϊδία', 0, 'Enchantment', ['V'], ['bard'], [], 'Insults laced with magic.', 'Προσβολές φορτισμένες με μαγεία.'),
  sp('shield', 'Shield', 'Ασπίδα', 1, 'Abjuration', ['V', 'S'], ['sorcerer', 'wizard'], [], 'An invisible barrier of force.', 'Ένα αόρατο φράγμα δύναμης.'),
  sp('magic_missile', 'Magic Missile', 'Μαγικό Βλήμα', 1, 'Evocation', ['V', 'S'], ['sorcerer', 'wizard'], [], 'Darts of force that rarely miss.', 'Βέλη δύναμης που σπάνια αστοχούν.'),
  sp('cure_wounds', 'Cure Wounds', 'Θεραπεία Πληγών', 1, 'Abjuration', ['V', 'S'], ['bard', 'cleric', 'druid', 'paladin', 'ranger'], [], 'Heal a creature you touch.', 'Θεράπευσε ένα πλάσμα που αγγίζεις.'),
  sp('detect_magic', 'Detect Magic', 'Ανίχνευση Μαγείας', 1, 'Divination', ['V', 'S'], ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'wizard'], ['ritual', 'concentration'], 'Sense nearby magic.', 'Αισθάνσου κοντινή μαγεία.'),
  sp('find_familiar', 'Find Familiar', 'Εύρεση Συντρόφου', 1, 'Conjuration', ['V', 'S', 'M'], ['wizard'], ['ritual'], 'Summon a spirit companion.', 'Κάλεσε ένα πνευματικό σύντροφο.'),
  sp('hunters_mark', "Hunter's Mark", 'Σημάδι Κυνηγού', 1, 'Divination', ['V'], ['ranger'], ['concentration'], 'Mark prey to track and harm.', 'Σημάδεψε θήραμα για να το παρακολουθείς.'),
  sp('web', 'Web', 'Ιστός', 2, 'Conjuration', ['V', 'S', 'M'], ['sorcerer', 'wizard'], ['concentration'], 'Fill an area with sticky webs.', 'Γέμισε μια περιοχή με κολλώδεις ιστούς.'),
  sp('misty_step', 'Misty Step', 'Ομιχλώδες Βήμα', 2, 'Conjuration', ['V'], ['sorcerer', 'warlock', 'wizard'], [], 'Teleport a short distance.', 'Τηλεμεταφορά σε μικρή απόσταση.'),
  sp('hold_person', 'Hold Person', 'Κράτημα Προσώπου', 2, 'Enchantment', ['V', 'S', 'M'], ['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard'], ['concentration'], 'Freeze a humanoid in place.', 'Πάγωσε ένα ανθρωποειδές στη θέση του.'),
  sp('fireball', 'Fireball', 'Μπάλα Φωτιάς', 3, 'Evocation', ['V', 'S', 'M'], ['sorcerer', 'wizard'], [], 'A bright streak that blossoms into flame.', 'Μια φωτεινή γραμμή που ανθίζει σε φλόγες.'),
  sp('counterspell', 'Counterspell', 'Αντιξόρκι', 3, 'Abjuration', ['S'], ['sorcerer', 'warlock', 'wizard'], [], 'Interrupt a spell being cast.', 'Διέκοψε ένα ξόρκι που εκτελείται.'),
  sp('revivify', 'Revivify', 'Αναζωογόνηση', 3, 'Necromancy', ['V', 'S', 'M'], ['cleric', 'paladin', 'druid', 'ranger'], [], 'Call a recently fallen ally back.', 'Επανάφερε έναν πρόσφατα πεσόντα σύμμαχο.'),
  sp('polymorph', 'Polymorph', 'Μεταμόρφωση', 4, 'Transmutation', ['V', 'S', 'M'], ['bard', 'druid', 'sorcerer', 'wizard'], ['concentration'], 'Transform a creature into another.', 'Μετάτρεψε ένα πλάσμα σε άλλο.'),
  sp('greater_invisibility', 'Greater Invisibility', 'Μεγάλη Αορατότητα', 4, 'Illusion', ['V', 'S'], ['bard', 'sorcerer', 'wizard'], ['concentration'], 'Make a creature invisible.', 'Κάνε ένα πλάσμα αόρατο.'),
];

/* --------------------------------- Items --------------------------------- */
const it = (id: string, en: string, el: string, category: Item['category'], thumb: string, sEn: string, sEl: string, extra: Partial<Item> = {}): Item =>
  ({ id, name: L(en, el), category, thumb, summary: L(sEn, sEl), ...extra });

const original_items: Item[] = [
  it('longsword', 'Longsword', 'Μακρύ Σπαθί', 'weapon', '🗡', 'A versatile martial blade.', 'Ευέλικτη πολεμική λεπίδα.', { subtype: 'martial melee', damage: '1d8 slashing', properties: ['Versatile'], cost: '15 gp' }),
  it('dagger', 'Dagger', 'Στιλέτο', 'weapon', '🔪', 'Light, concealable and throwable.', 'Ελαφρύ, κρυφό και ριπτόμενο.', { subtype: 'simple melee', damage: '1d4 piercing', properties: ['Finesse', 'Light', 'Thrown'], cost: '2 gp' }),
  it('quarterstaff', 'Quarterstaff', 'Ραβδί', 'weapon', '⚚', 'A simple staff, also a spell focus.', 'Απλό ραβδί, και εστίαση ξορκιών.', { subtype: 'simple melee', damage: '1d6 bludgeoning', properties: ['Versatile'], cost: '2 sp' }),
  it('greatsword', 'Greatsword', 'Μεγάλο Σπαθί', 'weapon', '⚔', 'A heavy two-handed blade.', 'Βαρύ δίχειρο σπαθί.', { subtype: 'martial melee', damage: '2d6 slashing', properties: ['Heavy', 'Two-Handed'], cost: '50 gp' }),
  it('greataxe', 'Greataxe', 'Μεγάλο Τσεκούρι', 'weapon', '🪓', 'A heavy two-handed axe.', 'Βαρύ δίχειρο τσεκούρι.', { subtype: 'martial melee', damage: '1d12 slashing', properties: ['Heavy', 'Two-Handed'], cost: '30 gp' }),
  it('shortbow', 'Shortbow', 'Κοντό Τόξο', 'weapon', '🏹', 'A simple ranged weapon.', 'Απλό όπλο εξ αποστάσεως.', { subtype: 'simple ranged', damage: '1d6 piercing', properties: ['Ammunition', 'Two-Handed'], cost: '25 gp' }),
  it('longbow', 'Longbow', 'Μακρύ Τόξο', 'weapon', '🏹', 'A powerful martial bow.', 'Ισχυρό πολεμικό τόξο.', { subtype: 'martial ranged', damage: '1d8 piercing', properties: ['Ammunition', 'Heavy', 'Two-Handed'], cost: '50 gp' }),
  it('light_crossbow', 'Light Crossbow', 'Ελαφρύ Βαλλίστρα', 'weapon', '✛', 'An easy-to-use ranged weapon.', 'Εύχρηστο όπλο εξ αποστάσεως.', { subtype: 'simple ranged', damage: '1d8 piercing', properties: ['Ammunition', 'Loading', 'Two-Handed'], cost: '25 gp' }),
  it('leather', 'Leather Armor', 'Δερμάτινη Πανοπλία', 'armor', '🥋', 'Light, flexible protection.', 'Ελαφριά, εύκαμπτη προστασία.', { subtype: 'light', cost: '10 gp' }),
  it('chain_shirt', 'Chain Shirt', 'Αλυσιδωτό Πουκάμισο', 'armor', '⛓', 'Medium armor of linked rings.', 'Μεσαία πανοπλία από κρίκους.', { subtype: 'medium', cost: '50 gp' }),
  it('plate', 'Plate Armor', 'Πλήρης Πανοπλία', 'armor', '🛡', 'The heaviest protection.', 'Η βαρύτερη προστασία.', { subtype: 'heavy', cost: '1,500 gp' }),
  it('shield', 'Shield', 'Ασπίδα', 'armor', '◍', 'Carried in one hand.', 'Κρατιέται με ένα χέρι.', { subtype: 'shield', cost: '10 gp' }),
  it('explorer_pack', "Explorer's Pack", 'Πακέτο Εξερευνητή', 'gear', '🎒', 'Rope, rations and basics for the road.', 'Σχοινί, τροφή και βασικά για το δρόμο.', { cost: '10 gp' }),
  it('spellbook', 'Spellbook', 'Βιβλίο Ξορκιών', 'gear', '📖', 'A wizard’s record of spells.', 'Το αρχείο ξορκιών ενός μάγου.', { cost: '50 gp' }),
  it('holy_symbol', 'Holy Symbol', 'Ιερό Σύμβολο', 'gear', '☥', 'A focus for divine magic.', 'Εστίαση για θεϊκή μαγεία.', { cost: '5 gp' }),
  it('arcane_focus', 'Arcane Focus', 'Αρκανική Εστίαση', 'gear', '🔮', 'A crystal or rod for casting.', 'Κρύσταλλος ή ράβδος για ξόρκια.', { cost: '10 gp' }),
  it('thieves_tools', "Thieves' Tools", 'Εργαλεία Κλέφτη', 'gear', '🗝', 'Lockpicks and small instruments.', 'Κλειδαριές και μικρά εργαλεία.', { cost: '25 gp' }),
  it('healing_potion', 'Potion of Healing', 'Φίλτρο Θεραπείας', 'consumable', '⚗', 'Restores vitality when drunk.', 'Αποκαθιστά ζωτικότητα όταν πιεί.', { rarity: 'common' }),
  it('antitoxin', 'Antitoxin', 'Αντίδοτο', 'consumable', '🧪', 'A vial against poison.', 'Φιαλίδιο κατά του δηλητηρίου.', { cost: '50 gp' }),
  it('cloak_protection', 'Cloak of Protection', 'Μανδύας Προστασίας', 'magic', '🧥', 'A guarding cloak that hums with power.', 'Μανδύας φύλαξης που βουίζει από δύναμη.', { rarity: 'uncommon', attunement: true }),
  it('wand_magic_missile', 'Wand of Magic Missiles', 'Ραβδί Μαγικών Βλημάτων', 'magic', '✦', 'A wand storing a spell.', 'Ραβδί που αποθηκεύει ένα ξόρκι.', { rarity: 'uncommon' }),
  it('bag_holding', 'Bag of Holding', 'Σάκος Χωρητικότητας', 'magic', '👜', 'Holds far more than it should.', 'Χωράει πολύ περισσότερα απ’ όσα θα έπρεπε.', { rarity: 'uncommon' }),
  it('ring_evasion', 'Ring of Evasion', 'Δαχτυλίδι Αποφυγής', 'magic', '◎', 'A nimble ring of avoidance.', 'Δαχτυλίδι ευκινησίας.', { rarity: 'rare', attunement: true }),
];

export const abilityNames: Record<string, { en: string; el: string; abbr: string }> = {
  str: { en: 'Strength', el: 'Δύναμη', abbr: 'STR' },
  dex: { en: 'Dexterity', el: 'Επιδεξιότητα', abbr: 'DEX' },
  con: { en: 'Constitution', el: 'Αντοχή', abbr: 'CON' },
  int: { en: 'Intelligence', el: 'Νοημοσύνη', abbr: 'INT' },
  wis: { en: 'Wisdom', el: 'Σοφία', abbr: 'WIS' },
  cha: { en: 'Charisma', el: 'Χάρισμα', abbr: 'CHA' },
};

// Atlas 2.0 canonical SRD source — the existing 2024 engine supplies the actual
// catalog. Original Claude entries are used only as presentation metadata.
export const species: Species[] = original_species.filter(x =>
  ['human','elf','dwarf','halfling','dragonborn','gnome','goliath','orc','tiefling'].includes(x.id));
export const classes: ClassDef[] = fromCatalogClasses(original_classes);
export const backgrounds: Background[] = fromCatalogBackgrounds(original_backgrounds);
export const items: Item[] = fromCatalogItems(original_items);

// Origin feat catalog is the verified 2024 core (no PHB-only general feats).
export const feats: Feat[] = Object.entries(window.ATLAS_V2_ORIGINS?.FEATS || {}).map(([id, feat]) => ({
  id, name: L(feat.name), summary: L(feat.en, feat.el), minLevel: 1, category: 'origin' as const,
}));
