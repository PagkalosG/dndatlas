import type { TKey } from './en';

/** Greek dictionary. Typed as Record<TKey,string>: a missing key is a compile error. */
export const el: Record<TKey, string> = {
  'a11y.skip': 'Μετάβαση στο περιεχόμενο',

  'common.all': 'Όλα', 'common.back': 'Πίσω', 'common.cancel': 'Ακύρωση', 'common.choose': 'Επιλογή', 'common.clear': 'Καθαρισμός',
  'common.close': 'Κλείσιμο', 'common.confirm': 'Επιβεβαίωση', 'common.copy': 'Αντιγραφή', 'common.details': 'Λεπτομέρειες', 'common.exit': 'Έξοδος',
  'common.language': 'Γλώσσα', 'common.mockContent': 'Περιεχόμενο πρωτοτύπου: πρωτότυπη παράφραση, όχι κείμενο από sourcebook.', 'common.moreInfo': 'Περισσότερες πληροφορίες',
  'common.next': 'Επόμενο', 'common.noResults': 'Κανένα αποτέλεσμα', 'common.optional': 'προαιρετικό', 'common.retry': 'Δοκιμή ξανά', 'common.save': 'Αποθήκευση',
  'common.search': 'Αναζήτηση', 'common.searchPlaceholder': 'Αναζήτηση…',

  'nav.main': 'Κύρια πλοήγηση', 'nav.campaigns': 'Καμπάνιες', 'nav.allCampaigns': 'Όλες οι καμπάνιες', 'nav.dashboard': 'Πίνακας DM', 'nav.home': 'Αρχική',
  'nav.character': 'Χαρακτήρας', 'nav.builder': 'Νέος χαρακτήρας', 'nav.party': 'Παρέα', 'nav.approvals': 'Εγκρίσεις', 'nav.journal': 'Ημερολόγιο',
  'nav.gallery': 'Γκαλερί', 'nav.inventory': 'Εξοπλισμός', 'nav.notifications': 'Ειδοποιήσεις', 'nav.admin': 'Διαχείριση',

  'auth.tagline': 'Οι καμπάνιες, οι χαρακτήρες και οι ιστορίες σου — όμορφα οργανωμένες.', 'auth.google': 'Σύνδεση με Google', 'auth.or': 'ή',
  'auth.email': 'Email', 'auth.emailLink': 'Στείλε μου σύνδεσμο σύνδεσης', 'auth.emailInvalid': 'Γράψε μια έγκυρη διεύθυνση email.', 'auth.logout': 'Αποσύνδεση',
  'auth.mockTitle': 'Σύνδεση πρωτοτύπου', 'auth.mockBody': 'Δεν γίνεται πραγματική ταυτοποίηση. Κάθε επιλογή σε συνδέει ως demo χρήστη.',

  'sync.saved': 'Αποθηκεύτηκε', 'sync.loading': 'Φόρτωση…', 'sync.offline': 'Είσαι εκτός σύνδεσης', 'sync.offlineBody': 'Οι αλλαγές μένουν στη συσκευή μέχρι να επανασυνδεθείς.',
  'sync.conflict': 'Σύγκρουση αλλαγών', 'sync.conflictBody': 'Κάποιος άλλος άλλαξε αυτό το στοιχείο όσο το επεξεργαζόσουν. Διάλεξε ποια έκδοση θα κρατήσεις.',
  'sync.loadTheirs': 'Φόρτωση της δικής τους', 'sync.keepMine': 'Κράτα τις αλλαγές μου', 'sync.error': 'Κάτι πήγε στραβά', 'sync.errorBody': 'Ο διακομιστής δεν μπόρεσε να αποθηκεύσει τις αλλαγές. Δεν χάθηκε τίποτα — δοκίμασε ξανά.',

  'save.unsaved': 'Μη αποθηκευμένες αλλαγές', 'save.allSaved': 'Όλες οι αλλαγές αποθηκεύτηκαν', 'save.discardConfirm': 'Έχεις μη αποθηκευμένες αλλαγές. Έξοδος χωρίς αποθήκευση;',

  'state.readOnly': 'Μόνο για ανάγνωση', 'state.readOnlyBody': 'Μπορείς να το δεις αλλά όχι να το αλλάξεις.',
  'state.forbidden': 'Χωρίς δικαίωμα', 'state.forbiddenBody': 'Ο ρόλος σου δεν επιτρέπει αυτή την περιοχή. (Προσομοίωση UI — τον έλεγχο πρέπει να κάνει ο διακομιστής.)',
  'state.pendingMember': 'Αναμονή έγκρισης', 'state.pendingMemberBody': 'Το αίτημά σου περιμένει τον DM. Μπορείς να κοιτάξεις αλλά όχι να επεξεργαστείς.',
  'state.lockedWhilePending': 'Η επεξεργασία είναι κλειδωμένη όσο ο DM ελέγχει τον χαρακτήρα.',

  'avail.incompatible': 'Ασύμβατο', 'avail.unavailable': 'Μη διαθέσιμο',
  'size.small': 'Μικρό', 'size.medium': 'Μεσαίο',

  'role.superadmin': 'Superadmin', 'role.dm': 'DM', 'role.co_dm': 'Co-DM', 'role.player': 'Παίκτης', 'role.pending': 'Σε αναμονή',
  'role.superadminHelp': 'Διαχείριση όλου του συστήματος.', 'role.dmHelp': 'Διευθύνεις αυτή την καμπάνια.', 'role.co_dmHelp': 'Βοηθάς τον DM να διευθύνει την καμπάνια.',
  'role.playerHelp': 'Επεξεργάζεσαι τον δικό σου χαρακτήρα και βλέπεις την παρέα.', 'role.pendingHelp': 'Περιμένεις έγκριση από τον DM.',
  'role.martial': 'Πολεμικός', 'role.caster': 'Μάγος', 'role.hybrid': 'Υβριδικός', 'role.skill': 'Βασισμένος σε δεξιότητες',

  'approval.draft': 'Πρόχειρο', 'approval.pending': 'Υποβλήθηκε', 'approval.approved': 'Εγκρίθηκε', 'approval.changes_requested': 'Ζητήθηκαν αλλαγές', 'approval.rejected': 'Απορρίφθηκε',

  'private.label': 'Ιδιωτικό', 'private.tooltip': 'Το βλέπουν μόνο εσύ και ο DM.', 'private.explain': 'Ιδιωτικό: ορατό μόνο σε εσένα και τον DM σου.',
  'private.hiddenFromYou': 'Οι ιδιωτικές σημειώσεις αυτού του χαρακτήρα φαίνονται μόνο στον κάτοχό του.',

  'dev.toggle': 'Εργαλεία πρωτοτύπου', 'dev.title': 'Εργαλεία πρωτοτύπου', 'dev.offline': 'Προσομοίωση εκτός σύνδεσης', 'dev.nextSave': 'Αποτέλεσμα επόμενης αποθήκευσης', 'dev.success': 'Επιτυχία',
  'dev.error': 'Σφάλμα', 'dev.conflict': 'Σύγκρουση', 'dev.rolePreview': 'Προεπισκόπηση ρόλου', 'dev.real': 'Πραγματικός', 'dev.events': 'Mock events που εκπέμφθηκαν',

  'campaigns.title': 'Οι καμπάνιες σου', 'campaigns.welcome': 'Καλώς ήρθες πάλι, {name}.', 'campaigns.multiRole': 'Ο ρόλος σου μπορεί να διαφέρει σε κάθε καμπάνια.',
  'campaigns.join': 'Συμμετοχή με πρόσκληση', 'campaigns.create': 'Δημιουργία καμπάνιας', 'campaigns.empty': 'Καμία καμπάνια ακόμη', 'campaigns.emptyBody': 'Δημιούργησε μία ή μπες με κωδικό πρόσκλησης.',
  'campaigns.members': '{n} μέλη', 'campaigns.next': 'Επόμενη συνεδρία', 'campaigns.pendingCount': '{n} σε αναμονή', 'campaigns.enter': 'Συνέχεια', 'campaigns.viewPending': 'Προβολή κατάστασης',

  'wizard.title': 'Δημιουργία καμπάνιας', 'wizard.step.basics': 'Βασικά', 'wizard.step.rules': 'Κανόνες', 'wizard.step.approval': 'Έγκριση', 'wizard.step.invite': 'Πρόσκληση',
  'wizard.name': 'Όνομα καμπάνιας', 'wizard.nameErr': 'Χρησιμοποίησε τουλάχιστον 3 χαρακτήρες.', 'wizard.description': 'Περιγραφή', 'wizard.startLevel': 'Αρχικό επίπεδο',
  'wizard.sources': 'Πηγές περιεχομένου', 'wizard.coreHelp': 'Βασικοί κανόνες D&D 5e (2024) — πάντα ενεργοί.', 'wizard.homebrew': 'Πακέτα homebrew', 'wizard.homebrewHelp': 'Έρχεται αργότερα.',
  'wizard.licensedArt': 'Αδειοδοτημένη εικονογράφηση', 'wizard.licensedArtHelp': 'Εμφανίζεται μόνο όταν υπάρχει καταχωρημένη άδεια.',
  'wizard.policy': 'Πολιτική έγκρισης', 'wizard.policy.restricted': 'Περιορισμένες αλλαγές', 'wizard.policy.all': 'Όλα', 'wizard.policy.none': 'Καμία',
  'wizard.policy.restrictedHelp': 'Ο DM εγκρίνει νέους χαρακτήρες, αναβαθμίσεις επιπέδου και περιορισμένα αντικείμενα.', 'wizard.policy.allHelp': 'Ο DM εγκρίνει κάθε αλλαγή χαρακτήρα.',
  'wizard.policy.noneHelp': 'Οι παίκτες αλλάζουν ελεύθερα τους χαρακτήρες τους.', 'wizard.inviteAfter': 'Μετά τη δημιουργία θα πάρεις κωδικό πρόσκλησης και QR.',
  'wizard.createBtn': 'Δημιουργία καμπάνιας', 'wizard.created': 'Η καμπάνια «{name}» δημιουργήθηκε', 'wizard.inviteCode': 'Κωδικός πρόσκλησης', 'wizard.open': 'Άνοιγμα καμπάνιας',

  'join.title': 'Συμμετοχή σε καμπάνια', 'join.help': 'Γράψε τον κωδικό που σου έδωσε ο DM ή σκάναρε το QR του.', 'join.code': 'Κωδικός πρόσκλησης', 'join.hint': 'Παράδειγμα: STAR-7K2Q',
  'join.find': 'Εύρεση καμπάνιας', 'join.simulateScan': 'Προσομοίωση σκαναρίσματος QR', 'join.qrHelp': 'Στο κινητό, το σκανάρισμα του QR ανοίγει αυτή τη σελίδα με τον κωδικό συμπληρωμένο.',
  'join.notFound': 'Καμία καμπάνια δεν ταιριάζει με αυτόν τον κωδικό.', 'join.preview': 'Προεπισκόπηση καμπάνιας', 'join.dm': 'DM', 'join.approvalNeeded': 'Απαιτείται έγκριση DM',
  'join.approvalNeededBody': 'Θα είσαι μέλος σε αναμονή μέχρι να σε δεχτεί ο DM.', 'join.request': 'Αίτημα συμμετοχής', 'join.requested': 'Το αίτημα στάλθηκε',
  'join.requestedBody': 'Ο/Η {dm} θα εξετάσει το αίτημά σου.', 'join.backToCampaigns': 'Πίσω στις καμπάνιες',

  'pending.title': 'Σχεδόν έτοιμο', 'pending.body': 'Ο/Η {dm} πρέπει πρώτα να εγκρίνει το αίτημά σου.',

  'home.title': 'Αρχική καμπάνιας', 'home.yourStatus': 'Η κατάστασή σου', 'home.newCharacter': 'Νέος χαρακτήρας', 'home.noCharacters': 'Κανένας χαρακτήρας ακόμη.',
  'dm.title': 'Πίνακας DM', 'dm.nextSession': 'Επόμενη συνεδρία', 'dm.pendingApprovals': 'Εκκρεμείς εγκρίσεις', 'dm.review': 'Εξέταση', 'dm.joinRequests': 'Αιτήματα συμμετοχής',
  'dm.manageParty': 'Διαχείριση παρέας', 'dm.characters': 'Χαρακτήρες', 'dm.party': 'Παρέα', 'dm.invite': 'Πρόσκληση παικτών',

  'party.title': 'Παρέα', 'party.coDmLimit': 'Περιορισμένα δικαιώματα', 'party.coDmLimitBody': 'Οι Co-DM βλέπουν τα μέλη, αλλά τους ρόλους αλλάζει μόνο ο DM.',
  'party.joinRequests': 'Αιτήματα συμμετοχής', 'party.requested': 'Αίτημα στις {date}', 'party.accept': 'Αποδοχή', 'party.decline': 'Απόρριψη', 'party.noCharacter': 'Κανένας χαρακτήρας ακόμη',
  'party.online': 'Συνδεδεμένος', 'party.offline': 'Εκτός σύνδεσης', 'party.role': 'Ρόλος', 'party.remove': 'Αφαίρεση', 'party.removeTitle': 'Αφαίρεση μέλους;',
  'party.removeBody': 'Ο/Η {name} θα χάσει την πρόσβαση σε αυτή την καμπάνια.',

  'builder.title': 'Δημιουργία χαρακτήρα', 'builder.progress': 'Πρόοδος δημιουργίας', 'builder.stepDone': 'ολοκληρώθηκε', 'builder.stepError': 'χρειάζεται προσοχή',
  'builder.saveDraft': 'Αποθήκευση πρόχειρου', 'builder.submit': 'Υποβολή για έγκριση DM', 'builder.submitTitle': 'Υποβολή χαρακτήρα;',
  'builder.submitBody': 'Ο DM σου θα τον εξετάσει. Δεν θα μπορείς να τον επεξεργαστείς μέχρι να απαντήσει.',
  'builder.step.species': 'Είδος (Species)', 'builder.step.class': 'Κλάση (Class)', 'builder.step.background': 'Παρελθόν (Background)', 'builder.step.abilities': 'Χαρακτηριστικά',
  'builder.step.proficiencies': 'Ικανότητες', 'builder.step.choices': 'Επιλογές κλάσης', 'builder.step.spells': 'Ξόρκια', 'builder.step.equipment': 'Εξοπλισμός',
  'builder.step.details': 'Στοιχεία', 'builder.step.review': 'Έλεγχος',

  'val.originFeat': 'Διάλεξε προσόν προέλευσης.',
  'val.species': 'Διάλεξε είδος.', 'val.class': 'Διάλεξε κλάση.', 'val.background': 'Διάλεξε παρελθόν.', 'val.abilities': 'Όρισε και τα έξι χαρακτηριστικά.',
  'val.skills': 'Διάλεξε όλες τις δεξιότητες της κλάσης.', 'val.languages': 'Διάλεξε τις γλώσσες σου.', 'val.subclass': 'Διάλεξε υποκλάση.', 'val.choice': 'Ολοκλήρωσε τις επιλογές κλάσης.', 'val.name': 'Δώσε όνομα στον χαρακτήρα σου.',

  'summary.title': 'Σύνοψη χαρακτήρα', 'summary.unnamed': 'Ήρωας χωρίς όνομα', 'summary.level': 'Επίπεδο {n}', 'summary.completeness': 'Πληρότητα', 'summary.skills': 'Δεξιότητες',
  'summary.spells': 'Ξόρκια', 'summary.items': 'Αντικείμενα', 'summary.noMath': 'Μόνο επιλογές. Οι τελικές τιμές προέρχονται από τη μηχανή κανόνων.', 'summary.privateKept': 'Οι ιδιωτικές σημειώσεις παραμένουν ιδιωτικές.',
  'summary.todo': '{n} πράγματα απομένουν',

  'step.species.help': 'Διάλεξε την καταγωγή που διαμορφώνει τον ήρωά σου. Πάτα ⓘ για λεπτομέρειες.', 'step.species.lineage': 'Καταγωγή', 'step.species.lineageHelp': 'Αυτό το είδος έχει παραλλαγές. Διάλεξε μία.',
  'step.class.help': 'Η κλάση σου ορίζει πώς πολεμάς, κάνεις ξόρκια ή μηχανορραφείς.', 'step.class.filter': 'Στυλ', 'step.class.level': 'Επίπεδο', 'step.class.levelHelp': 'Το αρχικό επίπεδο ορίζεται από την καμπάνια.',
  'step.class.caster': 'Μάγος', 'step.class.complexity': 'Πολυπλοκότητα', 'step.class.hitDie': 'Ζάρι ζωής (Hit die)', 'step.class.primary': 'Κύριο χαρακτηριστικό', 'step.class.subclassAt': 'Υποκλάση στο επίπεδο',
  'step.background.help': 'Το παρελθόν σου δίνει δεξιότητες, ένα εργαλείο, ένα προσόν (feat) και αυξήσεις χαρακτηριστικών.', 'step.background.empty': 'Διάλεξε παρελθόν για να δεις τι προσφέρει.',
  'step.background.implications': 'Τι σου δίνει αυτό το παρελθόν', 'step.background.skills': 'Δεξιότητες', 'step.background.tool': 'Εργαλείο', 'step.background.feat': 'Προσόν προέλευσης (Origin feat)',
  'step.background.boosts': 'Αυξήσεις χαρακτηριστικών', 'step.background.boostsHelp': 'Τις μοιράζεις στο βήμα «Χαρακτηριστικά».',
  'step.abilities.help': 'Διάλεξε πώς θα ορίσεις τα έξι χαρακτηριστικά και μετά μοίρασέ τα.', 'step.abilities.method': 'Μέθοδος', 'step.abilities.standard': 'Στάνταρ σειρά (Standard array)',
  'step.abilities.pointbuy': 'Αγορά πόντων (Point buy)', 'step.abilities.manual': 'Χειροκίνητο αποτέλεσμα', 'step.abilities.methodHelp': 'Στάνταρ σειρά: μοιράζεις σταθερές τιμές. Αγορά πόντων: ξοδεύεις προϋπολογισμό. Χειροκίνητο: γράφεις αποτελέσματα (χρειάζεται έγκριση DM).',
  'step.abilities.manualNeedsApproval': 'Χρειάζεται έγκριση DM', 'step.abilities.manualBody': 'Τα χειροκίνητα χαρακτηριστικά επισημαίνονται για επιβεβαίωση από τον DM.', 'step.abilities.budget': 'Πόντοι που ξοδεύτηκαν: {spent} / {total}',
  'step.abilities.score': 'Τιμή', 'step.abilities.taken': 'Έχει ήδη δοθεί', 'step.abilities.cost': 'Κόστος {n}', 'step.abilities.bgBoosts': 'Αυξήσεις παρελθόντος',
  'step.abilities.bgBoostsHelp': 'Το παρελθόν «{bg}» σου επιτρέπει να μοιράσεις {n} πόντους.', 'step.abilities.needBackground': 'Διάλεξε πρώτα παρελθόν.',
  'step.abilities.noMath': 'Στους κανόνες 2024 τα είδη δεν δίνουν μπόνους χαρακτηριστικών· τα σύνολα υπολογίζονται από το backend.',
  'step.prof.help': 'Διάλεξε δεξιότητες και γλώσσες. Οι ήδη παρεχόμενες είναι κλειδωμένες.', 'step.prof.needBoth': 'Διάλεξε πρώτα κλάση και παρελθόν.', 'step.prof.skills': 'Δεξιότητες',
  'step.prof.skillsHelp': '{cls}: διάλεξε {n}.', 'step.prof.fromBackground': 'Παρέχεται από το παρελθόν σου', 'step.prof.limit': 'Έφτασες το όριο', 'step.prof.tools': 'Εργαλεία',
  'step.prof.toolsHelp': 'Η ικανότητα σε ένα εργαλείο δεν σημαίνει ότι το κατέχεις.', 'step.prof.languages': 'Γλώσσες', 'step.prof.alwaysKnown': 'Την ξέρουν όλοι',
  'step.choices.help': 'Η υποκλάση, τα στυλ μάχης και άλλες επιλογές για {cls} εμφανίζονται όταν ισχύουν.', 'step.choices.needClass': 'Διάλεξε πρώτα κλάση.', 'step.choices.subclass': 'Υποκλάση (Subclass)',
  'step.choices.subclassLocked': 'Ξεκλειδώνει στο επίπεδο {n} για την κλάση {cls}.', 'step.choices.unlocksAt': 'Ξεκλειδώνει στο επίπεδο {n}', 'step.choices.needsSubclass': 'Απαιτεί υποκλάση: {name}',
  'step.choices.feats': 'Προσόντα (Feats)', 'step.choices.featsHelp': 'Τα προσόντα ξεκλειδώνουν σε συγκεκριμένα επίπεδα.',
  'step.spells.help': 'Φίλτραρε ανά επίπεδο, σχολή, συστατικά και χρήση.', 'step.spells.nonCaster': 'Η κλάση {cls} δεν εκτελεί ξόρκια σε αυτό το στάδιο.', 'step.spells.filters': 'Φίλτρα ξορκιών',
  'step.spells.search': 'Αναζήτηση ξορκιών', 'step.spells.level': 'Επίπεδο', 'step.spells.cantrip': 'Cantrip', 'step.spells.lvl': 'Επίπεδο', 'step.spells.school': 'Σχολή',
  'step.spells.components': 'Συστατικά', 'step.spells.usage': 'Χρήση', 'step.spells.classOnly': 'Μόνο λίστα ξορκιών: {cls}', 'step.spells.count': '{n} ξόρκια',
  'step.spells.selected': '{n} επιλεγμένα', 'step.spells.noLimits': 'Οι αριθμοί και τα όρια ξορκιών θα επιβάλλονται αργότερα από τη μηχανή κανόνων.',
  'step.equip.help': 'Διάλεξε αρχικό εξοπλισμό. Τα μαγικά αντικείμενα χρειάζονται έγκριση DM.', 'step.equip.category': 'Κατηγορία', 'step.equip.selected': 'Επιλεγμένος εξοπλισμός', 'step.equip.none': 'Τίποτα επιλεγμένο ακόμη.',
  'step.details.help': 'Το όνομα είναι το μόνο υποχρεωτικό κείμενο.', 'step.details.name': 'Όνομα χαρακτήρα', 'step.details.namePlaceholder': 'π.χ. Θάλεια', 'step.details.story': 'Ιστορία παρελθόντος',
  'step.details.storyHint': 'Προαιρετικό. Μόνο εσύ και ο DM μπορείτε να το διαβάσετε.', 'step.details.notes': 'Ιδιωτικές σημειώσεις',
  'step.review.help': 'Έλεγξε τα πάντα και μετά υπόβαλε.', 'step.review.statusFlow': 'Κατάσταση έγκρισης', 'step.review.pendingTitle': 'Αναμονή για τον DM', 'step.review.pendingBody': 'Ο DM σου εξετάζει αυτόν τον χαρακτήρα.',
  'step.review.approvedBody': 'Ο χαρακτήρας σου είναι έτοιμος για παιχνίδι.', 'step.review.changesBody': 'Ο DM σου ζήτησε αλλαγές.', 'step.review.fix': '{n} πράγματα για διόρθωση', 'step.review.goFix': 'Διόρθωση',
  'step.review.ready': 'Έτοιμο για υποβολή', 'step.review.readyBody': 'Όλα τα απαιτούμενα έχουν επιλεγεί.',

  'cat.weapon': 'Όπλα', 'cat.armor': 'Πανοπλίες', 'cat.gear': 'Εξοπλισμός', 'cat.consumable': 'Αναλώσιμα', 'cat.magic': 'Μαγικά αντικείμενα', 'item.attunement': 'Συντονισμός (Attunement)',

  'school.Abjuration': 'Αποτροπή', 'school.Conjuration': 'Επίκληση', 'school.Divination': 'Μαντεία', 'school.Enchantment': 'Γοητεία',
  'school.Evocation': 'Εκπομπή', 'school.Illusion': 'Ψευδαίσθηση', 'school.Necromancy': 'Νεκρομαντεία', 'school.Transmutation': 'Μεταμόρφωση',
  'comp.V': 'Προφορικό', 'comp.S': 'Κινησιακό', 'comp.M': 'Υλικό', 'usage.ritual': 'Τελετουργικό (Ritual)', 'usage.concentration': 'Συγκέντρωση (Concentration)',

  'sheet.tabs': 'Ενότητες φύλλου', 'sheet.overview': 'Επισκόπηση', 'sheet.combat': 'Μάχη', 'sheet.spellbook': 'Ξόρκια', 'sheet.hp': 'Πόντοι ζωής', 'sheet.tempHp': 'Προσωρινοί πόντοι ζωής',
  'sheet.ac': 'Κλάση θωράκισης', 'sheet.speed': 'Ταχύτητα', 'sheet.initiative': 'Πρωτοβουλία', 'sheet.proficiency': 'Ικανότητα', 'sheet.passive': 'Παθητική αντίληψη',
  'sheet.modifier': 'Τροποποιητής', 'sheet.save': 'Σωτηρία', 'sheet.skills': 'Δεξιότητες', 'sheet.backendValues': 'Όλες οι τιμές προέρχονται από τη μηχανή κανόνων του backend.',

  'combat.noDice': 'Χωρίς ζάρια εδώ', 'combat.noDiceBody': 'Το Atlas παρακολουθεί τους αριθμούς σου. Ρίξε στο τραπέζι και γράψε τα αποτελέσματα όπου χρειάζεται.', 'combat.conditions': 'Καταστάσεις',
  'combat.attack': 'Επιθέσεις', 'combat.action': 'Ενέργειες', 'combat.bonus': 'Ενέργειες μπόνους', 'combat.reaction': 'Αντιδράσεις', 'combat.resources': 'Πόροι',
  'recharge.short': 'Σύντομη ανάπαυση', 'recharge.long': 'Μακρά ανάπαυση', 'recharge.none': 'Χωρίς επαναφόρτιση',
  'cond.blinded': 'Τυφλός', 'cond.charmed': 'Γοητευμένος', 'cond.frightened': 'Φοβισμένος', 'cond.grappled': 'Αιχμαλωτισμένος', 'cond.poisoned': 'Δηλητηριασμένος',
  'cond.prone': 'Πεσμένος', 'cond.restrained': 'Ακινητοποιημένος', 'cond.stunned': 'Αναίσθητος',

  'spellbook.slots': 'Θέσεις ξορκιών', 'spellbook.known': 'Γνωστά ξόρκια', 'spellbook.preparedHelp': '{n} προετοιμασμένα. Άλλαξε για προετοιμασία ή αναίρεση.',

  'inv.currency': 'Νομίσματα', 'inv.equipped': 'Εξοπλισμένο', 'inv.attuned': 'Συντονισμένο', 'inv.qty': 'Ποσότητα', 'inv.request': 'Αίτημα αντικειμένου', 'inv.requestHelp': 'Ορισμένα αντικείμενα χρειάζονται έγκριση DM.',
  'inv.addItem': 'Προσθήκη αντικειμένου', 'inv.needsApproval': 'Χρειάζεται έγκριση', 'inv.requestTitle': 'Αίτημα αντικειμένου', 'inv.requestBody': 'Να ζητήσεις από τον DM να προσθέσει: {name};', 'inv.sendRequest': 'Αποστολή αιτήματος',
  'inv.requested': '{name}: το αίτημα στάλθηκε',

  'journal.new': 'Νέα καταχώριση', 'journal.title': 'Τίτλος', 'journal.body': 'Καταχώριση', 'journal.visibility': 'Ποιος μπορεί να το δει', 'journal.empty': 'Καμία καταχώριση ακόμη',
  'vis.private': 'Ιδιωτικό', 'vis.party': 'Παρέα', 'vis.dm_only': 'Μόνο DM', 'vis.privateHelp': 'Μόνο εσύ (και ο DM) μπορείτε να το διαβάσετε.',
  'vis.partyHelp': 'Όλοι στην καμπάνια μπορούν να το διαβάσουν.', 'vis.dm_onlyHelp': 'Μόνο οι DM μπορούν να το διαβάσουν.',

  'gallery.filter': 'Φίλτρο', 'gallery.map': 'Χάρτες', 'gallery.handout': 'Έγγραφα', 'gallery.portrait': 'Πορτρέτα', 'gallery.scene': 'Σκηνές', 'gallery.empty': 'Δεν υπάρχει τίποτα εδώ ακόμη',

  'approvals.title': 'Εγκρίσεις', 'approvals.filter': 'Φίλτρο', 'approvals.empty': 'Δεν περιμένει τίποτα', 'approvals.select': 'Διάλεξε ένα αίτημα για εξέταση.', 'approvals.changes': 'Αλλαγές',
  'approvals.field': 'Πεδίο', 'approvals.from': 'Πριν', 'approvals.to': 'Μετά', 'approvals.feedback': 'Σχόλια προς τον παίκτη', 'approvals.feedbackHint': 'Απαιτούνται για αίτημα αλλαγών ή απόρριψη.',
  'approvals.needFeedback': 'Γράψε πρώτα σχόλια', 'approvals.approve': 'Έγκριση', 'approvals.requestChanges': 'Αίτημα αλλαγών', 'approvals.reject': 'Απόρριψη',
  'approvals.decided': 'Η απόφαση καταγράφηκε', 'approvals.conflictBody': 'Αυτό το αίτημα άλλαξε όσο το εξέταζες.', 'approvals.alreadyDecided': 'Για αυτό το αίτημα έχει ήδη ληφθεί απόφαση.',
  'approvals.kind.new_character': 'Νέος χαρακτήρας', 'approvals.kind.level_up': 'Αναβάθμιση επιπέδου', 'approvals.kind.restricted_change': 'Περιορισμένη αλλαγή',

  'notif.empty': 'Καμία ειδοποίηση', 'notif.new': 'Νέο', 'notif.markRead': 'Σήμανση ως αναγνωσμένο',

  'admin.title': 'Superadmin', 'admin.health': 'Υγεία συστήματος', 'admin.users': 'Χρήστες', 'admin.audit': 'Αρχείο ελέγχου', 'admin.when': 'Πότε', 'admin.actor': 'Ποιος',
  'admin.action': 'Ενέργεια', 'admin.target': 'Στόχος', 'admin.resetAccess': 'Επαναφορά πρόσβασης', 'admin.suspend': 'Αναστολή', 'admin.confirmBody': 'Η ενέργεια καταγράφεται στο αρχείο ελέγχου. Συνέχεια με: {target};',
  'admin.state.ok': 'Λειτουργεί', 'admin.state.degraded': 'Υποβαθμισμένο', 'admin.state.down': 'Εκτός λειτουργίας',

  'qr.alt': 'Προσωρινό QR για τον κωδικό {code}', 'qr.placeholder': 'Προσωρινό (δεν σκανάρεται)',
  'art.placeholder': 'Πρωτότυπο προσωρινό', 'art.official': 'Επίσημη εικονογράφηση', 'art.licensed': 'Αδειοδοτημένο έργο', 'art.pending': 'Άδεια σε εκκρεμότητα', 'art.missing': 'Η εικόνα δεν είναι διαθέσιμη',
  'art.officialWhenLicensed': 'Η επίσημη εικονογράφηση θα είναι διαθέσιμη όταν υπάρχει άδεια.',

  'demo.title': 'Φόρτωση demo χαρακτήρα', 'demo.help': 'Γεμίζει τον builder με έτοιμο παράδειγμα για εξερεύνηση.', 'demo.borruk': 'Borruk — Άνθρωπος Μαχητής 3', 'demo.luna': 'Luna — Άασιμαρ Μάγος Καταγωγής 3',
  'demo.clear': 'Ξεκίνημα από το μηδέν', 'warn.twoHandedShield': 'Δίχειρο όπλο και ασπίδα μαζί', 'warn.twoHandedShieldBody': 'Ένα δίχειρο όπλο χρειάζεται και τα δύο χέρια, άρα συγκρούεται με την ασπίδα. Έλεγξε τον εξοπλισμό σου. (Ενδεικτικός έλεγχος· η μηχανή κανόνων είναι η αρμόδια.)',
  'granted.title': 'Παρεχόμενα χαρακτηριστικά', 'granted.from': 'από: {src}', 'granted.light': 'Cantrip «Φως» — παρέχεται από το είδος και δεν καταλαμβάνει επιλογή cantrip της κλάσης',
  'granted.healingHands': 'Θεραπευτικά Χέρια — 1 / μακρά ανάπαυση', 'granted.resist': 'Ουράνιες αντιστάσεις', 'granted.protection': 'Στυλ μάχης: Προστασία', 'granted.tough': 'Προσόν προέλευσης: Tough',
  'granted.smith': 'Ικανότητα εργαλείου: Εργαλεία Σιδηρουργού (μόνο ικανότητα — δεν κατέχεις τα εργαλεία)', 'granted.mastery': 'Επιλογές κυριαρχίας όπλων (Weapon mastery)',
  'step.choices.species': 'Επιλογές είδους', 'step.choices.revelation': 'Ουράνια Αποκάλυψη (Celestial Revelation)',

  'rest.short': 'Σύντομη ανάπαυση', 'rest.long': 'Μακρά ανάπαυση', 'rest.confirm': 'Να γίνει: {kind};', 'rest.confirmBody': 'Οι πόροι που ανακτώνται επαναφέρονται. Σε ορισμένες καμπάνιες μπορεί να χρειάζεται έγκριση DM.', 'rest.done': 'Η ανάπαυση εφαρμόστηκε',

  'catalog.title': 'Κατάλογος στοιχείων', 'catalog.help': 'Όλες οι κοινές καταστάσεις σε ένα σημείο: φόρτωση, κενό, επιτυχία, σφάλμα, απενεργοποιημένο, μόνο ανάγνωση, αναμονή, σύγκρουση, εκτός σύνδεσης.',
  'catalog.states': 'Καταστάσεις', 'catalog.loading': 'Φόρτωση', 'catalog.empty': 'Κενό', 'catalog.emptyBody': 'Δεν υπάρχει τίποτα να εμφανιστεί ακόμη.', 'catalog.disabled': 'Απενεργοποιημένο', 'catalog.cards': 'Κάρτες επιλογής',
  'catalog.badges': 'Σήματα', 'catalog.controls': 'Στοιχεία ελέγχου', 'catalog.artwork': 'Καταστάσεις εικονογράφησης', 'catalog.pendingBody': 'Αναμονή για απόφαση.', 'catalog.availableCard': 'Διαθέσιμο', 'catalog.incompatibleCard': 'Ασύμβατο',
  'catalog.unavailableCard': 'Μη διαθέσιμο', 'catalog.approvalCard': 'Χρειάζεται έγκριση', 'catalog.reasonIncompat': 'Χρειάζεται πολεμική εκπαίδευση (παράδειγμα αιτίας).', 'catalog.reasonUnavail': 'Απενεργοποιήθηκε από τον DM (παράδειγμα αιτίας).',
  'catalog.reasonApproval': 'Τα μαγικά αντικείμενα χρειάζονται έγκριση DM.', 'catalog.successBody': 'Οι αλλαγές σου αποθηκεύτηκαν.', 'catalog.infoTitle': 'Πληροφορία',

  'future.title': 'Έρχονται αργότερα', 'future.help': 'Αυτές οι περιοχές είναι προγραμματισμένες αλλά δεν λειτουργούν στο πρωτότυπο. Τίποτα εδώ δεν χρεώνει ούτε αλλάζει δεδομένα.',
  'future.homebrew': 'Πακέτα homebrew', 'future.homebrewBody': 'Δημιούργησε και μοιράσου δικό σου περιεχόμενο με την παρέα.', 'future.bastions': 'Bastions', 'future.bastionsBody': 'Διαχειρίσου μια βάση ανάμεσα στις περιπέτειες.',
  'future.dmTools': 'Προηγμένα εργαλεία DM', 'future.dmToolsBody': 'Συναντήσεις, παγίδες και σχεδιασμός συνεδριών.', 'future.premium': 'Premium', 'future.premiumBody': 'Προαιρετικά extra. Στο πρωτότυπο δεν υπάρχει ροή πληρωμής.',
  'future.soon': 'Έρχεται αργότερα', 'nav.future': 'Έρχονται αργότερα', 'nav.catalog': 'Κατάλογος', 'nav.profile': 'Προφίλ',

  'profile.title': 'Προφίλ & προτιμήσεις', 'profile.language': 'Γλώσσα διεπαφής', 'profile.languageHelp': 'Αλλάζει κάθε ετικέτα, tooltip και μήνυμα.', 'profile.privacy': 'Απόρρητο',
  'profile.privacyBody': 'Οι ιδιωτικές ιστορίες και σημειώσεις σου είναι ορατές μόνο σε εσένα και στον DM της συγκεκριμένης καμπάνιας. Το πρωτότυπο προσομοιώνει την ορατότητα· τον έλεγχο πρέπει να τον κάνει ο διακομιστής.',
  'profile.motion': 'Η μείωση κίνησης ακολουθεί τη ρύθμιση της συσκευής σου.',

};
