/** English UI dictionary — source of truth for TKey. The Greek file is typed against this one. */
export const en = {
  'a11y.skip': 'Skip to content',

  'common.all': 'All', 'common.back': 'Back', 'common.cancel': 'Cancel', 'common.choose': 'Choose', 'common.clear': 'Clear',
  'common.close': 'Close', 'common.confirm': 'Confirm', 'common.copy': 'Copy', 'common.details': 'Details', 'common.exit': 'Exit',
  'common.language': 'Language', 'common.mockContent': 'Prototype content: original paraphrase, not sourcebook text.', 'common.moreInfo': 'More information',
  'common.next': 'Next', 'common.noResults': 'No results', 'common.optional': 'optional', 'common.retry': 'Retry', 'common.save': 'Save',
  'common.search': 'Search', 'common.searchPlaceholder': 'Search…',

  'nav.main': 'Main navigation', 'nav.campaigns': 'Campaigns', 'nav.allCampaigns': 'All campaigns', 'nav.dashboard': 'DM dashboard', 'nav.home': 'Home',
  'nav.character': 'Character', 'nav.builder': 'New character', 'nav.party': 'Party', 'nav.approvals': 'Approvals', 'nav.journal': 'Journal',
  'nav.gallery': 'Gallery', 'nav.inventory': 'Inventory', 'nav.notifications': 'Notifications', 'nav.admin': 'Admin',

  'auth.tagline': 'Your campaigns, characters and stories — beautifully organised.', 'auth.google': 'Sign in with Google', 'auth.or': 'or',
  'auth.email': 'Email', 'auth.emailLink': 'Email me a sign-in link', 'auth.emailInvalid': 'Enter a valid email address.', 'auth.logout': 'Sign out',
  'auth.mockTitle': 'Prototype sign-in', 'auth.mockBody': 'No real authentication happens. Any option signs you in as a demo user.',

  'sync.saved': 'Saved', 'sync.loading': 'Loading…', 'sync.offline': 'You are offline', 'sync.offlineBody': 'Changes are kept on this device until you reconnect.',
  'sync.conflict': 'Edit conflict', 'sync.conflictBody': 'Someone else changed this while you were editing. Choose which version to keep.',
  'sync.loadTheirs': 'Load their version', 'sync.keepMine': 'Keep my changes', 'sync.error': 'Something went wrong', 'sync.errorBody': 'The server could not save your changes. Nothing was lost — try again.',

  'save.unsaved': 'Unsaved changes', 'save.allSaved': 'All changes saved', 'save.discardConfirm': 'You have unsaved changes. Leave without saving?',

  'state.readOnly': 'Read-only', 'state.readOnlyBody': 'You can view this but not change it.',
  'state.forbidden': 'No permission', 'state.forbiddenBody': 'Your role does not allow this area. (UI simulation — the server must enforce this.)',
  'state.pendingMember': 'Waiting for approval', 'state.pendingMemberBody': 'Your join request is waiting for the DM. You can look around but not edit.',
  'state.lockedWhilePending': 'Editing is locked while the DM reviews this character.',

  'avail.incompatible': 'Incompatible', 'avail.unavailable': 'Unavailable',
  'size.small': 'Small', 'size.medium': 'Medium',

  'role.superadmin': 'Superadmin', 'role.dm': 'DM', 'role.co_dm': 'Co-DM', 'role.player': 'Player', 'role.pending': 'Pending',
  'role.superadminHelp': 'System-wide administration.', 'role.dmHelp': 'You run this campaign.', 'role.co_dmHelp': 'You help the DM run this campaign.',
  'role.playerHelp': 'You can edit your own character and view the party.', 'role.pendingHelp': 'Waiting for DM approval.',
  'role.martial': 'Martial', 'role.caster': 'Caster', 'role.hybrid': 'Hybrid', 'role.skill': 'Skill-based',

  'approval.draft': 'Draft', 'approval.pending': 'Submitted', 'approval.approved': 'Approved', 'approval.changes_requested': 'Changes requested', 'approval.rejected': 'Rejected',

  'private.label': 'Private', 'private.tooltip': 'Only you and the DM can see this.', 'private.explain': 'Private: visible only to you and your DM.',
  'private.hiddenFromYou': 'This character’s private notes are only visible to their owner.',

  'dev.toggle': 'Prototype tools', 'dev.title': 'Prototype tools', 'dev.offline': 'Simulate offline', 'dev.nextSave': 'Next save result', 'dev.success': 'Success',
  'dev.error': 'Error', 'dev.conflict': 'Conflict', 'dev.rolePreview': 'Preview role', 'dev.real': 'Real', 'dev.events': 'Emitted mock events',

  'campaigns.title': 'Your campaigns', 'campaigns.welcome': 'Welcome back, {name}.', 'campaigns.multiRole': 'Your role can differ in each campaign.',
  'campaigns.join': 'Join with invite', 'campaigns.create': 'Create campaign', 'campaigns.empty': 'No campaigns yet', 'campaigns.emptyBody': 'Create one or join with an invite code.',
  'campaigns.members': '{n} members', 'campaigns.next': 'Next session', 'campaigns.pendingCount': '{n} pending', 'campaigns.enter': 'Continue', 'campaigns.viewPending': 'View status',

  'wizard.title': 'Create campaign', 'wizard.step.basics': 'Basics', 'wizard.step.rules': 'Rules', 'wizard.step.approval': 'Approval', 'wizard.step.invite': 'Invite',
  'wizard.name': 'Campaign name', 'wizard.nameErr': 'Use at least 3 characters.', 'wizard.description': 'Description', 'wizard.startLevel': 'Starting level',
  'wizard.sources': 'Content sources', 'wizard.coreHelp': 'D&D 5e (2024) core rules — always on.', 'wizard.homebrew': 'Homebrew packs', 'wizard.homebrewHelp': 'Coming later.',
  'wizard.licensedArt': 'Licensed artwork', 'wizard.licensedArtHelp': 'Shown only when a license is on file.',
  'wizard.policy': 'Approval policy', 'wizard.policy.restricted': 'Restricted changes', 'wizard.policy.all': 'Everything', 'wizard.policy.none': 'None',
  'wizard.policy.restrictedHelp': 'The DM approves new characters, level-ups, and restricted items.', 'wizard.policy.allHelp': 'The DM approves every character change.',
  'wizard.policy.noneHelp': 'Players change their characters freely.', 'wizard.inviteAfter': 'You will get an invite code and QR after creating.',
  'wizard.createBtn': 'Create campaign', 'wizard.created': '“{name}” was created', 'wizard.inviteCode': 'Invite code', 'wizard.open': 'Open campaign',

  'join.title': 'Join a campaign', 'join.help': 'Enter the code your DM shared, or scan their QR.', 'join.code': 'Invite code', 'join.hint': 'Example: STAR-7K2Q',
  'join.find': 'Find campaign', 'join.simulateScan': 'Simulate QR scan', 'join.qrHelp': 'On a phone, scanning the QR opens this page with the code filled in.',
  'join.notFound': 'No campaign matches that code.', 'join.preview': 'Campaign preview', 'join.dm': 'DM', 'join.approvalNeeded': 'DM approval required',
  'join.approvalNeededBody': 'You will be a pending member until the DM accepts you.', 'join.request': 'Request to join', 'join.requested': 'Request sent',
  'join.requestedBody': '{dm} will review your request.', 'join.backToCampaigns': 'Back to campaigns',

  'pending.title': 'Almost there', 'pending.body': '{dm} needs to approve your request first.',

  'home.title': 'Campaign home', 'home.yourStatus': 'Your status', 'home.newCharacter': 'New character', 'home.noCharacters': 'No characters yet.',
  'dm.title': 'DM dashboard', 'dm.nextSession': 'Next session', 'dm.pendingApprovals': 'Pending approvals', 'dm.review': 'Review', 'dm.joinRequests': 'Join requests',
  'dm.manageParty': 'Manage party', 'dm.characters': 'Characters', 'dm.party': 'Party', 'dm.invite': 'Invite players',

  'party.title': 'Party', 'party.coDmLimit': 'Limited permissions', 'party.coDmLimitBody': 'Co-DMs can review members but only the DM changes roles.',
  'party.joinRequests': 'Join requests', 'party.requested': 'Requested {date}', 'party.accept': 'Accept', 'party.decline': 'Decline', 'party.noCharacter': 'No character yet',
  'party.online': 'Online', 'party.offline': 'Offline', 'party.role': 'Role', 'party.remove': 'Remove', 'party.removeTitle': 'Remove member?',
  'party.removeBody': '{name} will lose access to this campaign.',

  'builder.title': 'Character builder', 'builder.progress': 'Builder progress', 'builder.stepDone': 'completed', 'builder.stepError': 'needs attention',
  'builder.saveDraft': 'Save draft', 'builder.submit': 'Submit for DM approval', 'builder.submitTitle': 'Submit character?',
  'builder.submitBody': 'Your DM will review it. You will not be able to edit until they respond.',
  'builder.step.species': 'Species', 'builder.step.class': 'Class', 'builder.step.background': 'Background', 'builder.step.abilities': 'Ability scores',
  'builder.step.proficiencies': 'Proficiencies', 'builder.step.choices': 'Class choices', 'builder.step.spells': 'Spells', 'builder.step.equipment': 'Equipment',
  'builder.step.details': 'Details', 'builder.step.review': 'Review',

  'val.originFeat': 'Choose an origin feat.',
  'val.species': 'Choose a species.', 'val.class': 'Choose a class.', 'val.background': 'Choose a background.', 'val.abilities': 'Assign all six ability scores.',
  'val.skills': 'Pick all class skills.', 'val.languages': 'Pick your languages.', 'val.subclass': 'Choose a subclass.', 'val.choice': 'Finish your class choices.', 'val.name': 'Give your character a name.',

  'summary.title': 'Character summary', 'summary.unnamed': 'Unnamed hero', 'summary.level': 'Level {n}', 'summary.completeness': 'Completeness', 'summary.skills': 'Skills',
  'summary.spells': 'Spells', 'summary.items': 'Items', 'summary.noMath': 'Selections only. Final values come from the rules engine.', 'summary.privateKept': 'Private notes are kept private.',
  'summary.todo': '{n} things left to do',

  'step.species.help': 'Pick the heritage that shapes your hero. Tap ⓘ for details.', 'step.species.lineage': 'Lineage', 'step.species.lineageHelp': 'This species has variants. Choose one.',
  'step.class.help': 'Your class defines how you fight, cast, or scheme.', 'step.class.filter': 'Style', 'step.class.level': 'Level', 'step.class.levelHelp': 'Starting level is set by the campaign.',
  'step.class.caster': 'Caster', 'step.class.complexity': 'Complexity', 'step.class.hitDie': 'Hit die', 'step.class.primary': 'Primary ability', 'step.class.subclassAt': 'Subclass at level',
  'step.background.help': 'Your past grants skills, a tool, a feat and ability increases.', 'step.background.empty': 'Pick a background to see what it grants.',
  'step.background.implications': 'What this background gives you', 'step.background.skills': 'Skills', 'step.background.tool': 'Tool', 'step.background.feat': 'Origin feat',
  'step.background.boosts': 'Ability increases', 'step.background.boostsHelp': 'You assign these in the Ability scores step.',
  'step.abilities.help': 'Choose how to set your six scores, then assign them.', 'step.abilities.method': 'Method', 'step.abilities.standard': 'Standard array',
  'step.abilities.pointbuy': 'Point buy', 'step.abilities.manual': 'Manual result', 'step.abilities.methodHelp': 'Standard array: assign fixed values. Point buy: spend a budget. Manual: enter results (needs DM approval).',
  'step.abilities.manualNeedsApproval': 'Needs DM approval', 'step.abilities.manualBody': 'Manual scores are flagged for your DM to confirm.', 'step.abilities.budget': 'Points spent: {spent} / {total}',
  'step.abilities.score': 'Score', 'step.abilities.taken': 'Already assigned', 'step.abilities.cost': 'Cost {n}', 'step.abilities.bgBoosts': 'Background increases',
  'step.abilities.bgBoostsHelp': '{bg} lets you distribute {n} points.', 'step.abilities.needBackground': 'Choose a background first.',
  'step.abilities.noMath': 'Species give no ability score bonuses in 2024 rules; totals are calculated by the backend.',
  'step.prof.help': 'Choose your skills and languages. Granted ones are locked.', 'step.prof.needBoth': 'Choose a class and a background first.', 'step.prof.skills': 'Skills',
  'step.prof.skillsHelp': '{cls}: choose {n}.', 'step.prof.fromBackground': 'Granted by your background', 'step.prof.limit': 'Limit reached', 'step.prof.tools': 'Tools',
  'step.prof.toolsHelp': 'Tool proficiency is not the same as owning the tool.', 'step.prof.languages': 'Languages', 'step.prof.alwaysKnown': 'Everyone knows this',
  'step.choices.help': 'Subclass, fighting styles, and other {cls} options appear when they apply.', 'step.choices.needClass': 'Choose a class first.', 'step.choices.subclass': 'Subclass',
  'step.choices.subclassLocked': 'Unlocks at level {n} for {cls}.', 'step.choices.unlocksAt': 'Unlocks at level {n}', 'step.choices.needsSubclass': 'Requires subclass: {name}',
  'step.choices.feats': 'Feats', 'step.choices.featsHelp': 'Feats unlock at certain levels.',
  'step.spells.help': 'Filter by level, school, components and usage.', 'step.spells.nonCaster': '{cls} does not cast spells at this stage.', 'step.spells.filters': 'Spell filters',
  'step.spells.search': 'Search spells', 'step.spells.level': 'Level', 'step.spells.cantrip': 'Cantrip', 'step.spells.lvl': 'Level', 'step.spells.school': 'School',
  'step.spells.components': 'Components', 'step.spells.usage': 'Usage', 'step.spells.classOnly': '{cls} spell list only', 'step.spells.count': '{n} spells shown',
  'step.spells.selected': '{n} selected', 'step.spells.noLimits': 'Spell counts and limits are enforced by the rules engine later.',
  'step.equip.help': 'Pick starting gear. Magic items need DM approval.', 'step.equip.category': 'Category', 'step.equip.selected': 'Selected gear', 'step.equip.none': 'Nothing selected yet.',
  'step.details.help': 'A name is the only required text.', 'step.details.name': 'Character name', 'step.details.namePlaceholder': 'e.g. Thalia', 'step.details.story': 'Background story',
  'step.details.storyHint': 'Optional. Only you and the DM can read it.', 'step.details.notes': 'Private notes',
  'step.review.help': 'Check everything, then submit.', 'step.review.statusFlow': 'Approval status', 'step.review.pendingTitle': 'Waiting for the DM', 'step.review.pendingBody': 'Your DM is reviewing this character.',
  'step.review.approvedBody': 'Your character is ready to play.', 'step.review.changesBody': 'Your DM asked for changes.', 'step.review.fix': '{n} things to fix', 'step.review.goFix': 'Fix',
  'step.review.ready': 'Ready to submit', 'step.review.readyBody': 'Everything required is chosen.',

  'cat.weapon': 'Weapons', 'cat.armor': 'Armor', 'cat.gear': 'Gear', 'cat.consumable': 'Consumables', 'cat.magic': 'Magic items', 'item.attunement': 'Attunement',

  'school.Abjuration': 'Abjuration', 'school.Conjuration': 'Conjuration', 'school.Divination': 'Divination', 'school.Enchantment': 'Enchantment',
  'school.Evocation': 'Evocation', 'school.Illusion': 'Illusion', 'school.Necromancy': 'Necromancy', 'school.Transmutation': 'Transmutation',
  'comp.V': 'Verbal', 'comp.S': 'Somatic', 'comp.M': 'Material', 'usage.ritual': 'Ritual', 'usage.concentration': 'Concentration',

  'sheet.tabs': 'Sheet sections', 'sheet.overview': 'Overview', 'sheet.combat': 'Combat', 'sheet.spellbook': 'Spells', 'sheet.hp': 'Hit points', 'sheet.tempHp': 'Temporary HP',
  'sheet.ac': 'Armor class', 'sheet.speed': 'Speed', 'sheet.initiative': 'Initiative', 'sheet.proficiency': 'Proficiency', 'sheet.passive': 'Passive perception',
  'sheet.modifier': 'Modifier', 'sheet.save': 'Save', 'sheet.skills': 'Skills', 'sheet.backendValues': 'All values are supplied by the backend rules engine.',

  'combat.noDice': 'No dice here', 'combat.noDiceBody': 'Atlas tracks your numbers. Roll at the table and enter results where needed.', 'combat.conditions': 'Conditions',
  'combat.attack': 'Attacks', 'combat.action': 'Actions', 'combat.bonus': 'Bonus actions', 'combat.reaction': 'Reactions', 'combat.resources': 'Resources',
  'recharge.short': 'Short rest', 'recharge.long': 'Long rest', 'recharge.none': 'No recharge',
  'cond.blinded': 'Blinded', 'cond.charmed': 'Charmed', 'cond.frightened': 'Frightened', 'cond.grappled': 'Grappled', 'cond.poisoned': 'Poisoned',
  'cond.prone': 'Prone', 'cond.restrained': 'Restrained', 'cond.stunned': 'Stunned',

  'spellbook.slots': 'Spell slots', 'spellbook.known': 'Known spells', 'spellbook.preparedHelp': '{n} prepared. Toggle to prepare or unprepare.',

  'inv.currency': 'Currency', 'inv.equipped': 'Equipped', 'inv.attuned': 'Attuned', 'inv.qty': 'Quantity', 'inv.request': 'Request an item', 'inv.requestHelp': 'Some items need DM approval.',
  'inv.addItem': 'Add item', 'inv.needsApproval': 'Needs approval', 'inv.requestTitle': 'Request item', 'inv.requestBody': 'Ask your DM to add {name}?', 'inv.sendRequest': 'Send request',
  'inv.requested': '{name}: request sent',

  'journal.new': 'New entry', 'journal.title': 'Title', 'journal.body': 'Entry', 'journal.visibility': 'Who can see this', 'journal.empty': 'No entries yet',
  'vis.private': 'Private', 'vis.party': 'Party', 'vis.dm_only': 'DM only', 'vis.privateHelp': 'Only you (and the DM) can read this.',
  'vis.partyHelp': 'Everyone in the campaign can read this.', 'vis.dm_onlyHelp': 'Only DMs can read this.',

  'gallery.filter': 'Filter', 'gallery.map': 'Maps', 'gallery.handout': 'Handouts', 'gallery.portrait': 'Portraits', 'gallery.scene': 'Scenes', 'gallery.empty': 'Nothing here yet',

  'approvals.title': 'Approvals', 'approvals.filter': 'Filter', 'approvals.empty': 'Nothing waiting', 'approvals.select': 'Select a request to review.', 'approvals.changes': 'Changes',
  'approvals.field': 'Field', 'approvals.from': 'Before', 'approvals.to': 'After', 'approvals.feedback': 'Feedback to player', 'approvals.feedbackHint': 'Required to request changes or reject.',
  'approvals.needFeedback': 'Write feedback first', 'approvals.approve': 'Approve', 'approvals.requestChanges': 'Request changes', 'approvals.reject': 'Reject',
  'approvals.decided': 'Decision recorded', 'approvals.conflictBody': 'This request changed while you were reviewing it.', 'approvals.alreadyDecided': 'This request was already decided.',
  'approvals.kind.new_character': 'New character', 'approvals.kind.level_up': 'Level-up', 'approvals.kind.restricted_change': 'Restricted change',

  'notif.empty': 'No notifications', 'notif.new': 'New', 'notif.markRead': 'Mark read',

  'admin.title': 'Superadmin', 'admin.health': 'System health', 'admin.users': 'Users', 'admin.audit': 'Audit log', 'admin.when': 'When', 'admin.actor': 'Who',
  'admin.action': 'Action', 'admin.target': 'Target', 'admin.resetAccess': 'Reset access', 'admin.suspend': 'Suspend', 'admin.confirmBody': 'This is recorded in the audit log. Continue with {target}?',
  'admin.state.ok': 'Operational', 'admin.state.degraded': 'Degraded', 'admin.state.down': 'Down',

  'qr.alt': 'QR placeholder for code {code}', 'qr.placeholder': 'Placeholder (not scannable)',

  'art.placeholder': 'Original placeholder', 'art.official': 'Official illustration', 'art.licensed': 'Licensed artwork', 'art.pending': 'License pending', 'art.missing': 'Image unavailable',
  'art.officialWhenLicensed': 'Official illustration available when licensed.',

  'demo.title': 'Load a demo character', 'demo.help': 'Fills the builder with a prepared example to explore.', 'demo.borruk': 'Borruk — Human Fighter 3', 'demo.luna': 'Luna — Aasimar Sorcerer 3',
  'demo.clear': 'Start empty', 'warn.twoHandedShield': 'Two-handed weapon and shield selected together', 'warn.twoHandedShieldBody': 'A two-handed weapon needs both hands, so it conflicts with carrying a shield. Review your loadout. (Illustrative check; the rules engine is authoritative.)',
  'granted.title': 'Granted features', 'granted.from': 'from {src}', 'granted.light': 'Light cantrip — granted by species, does not use a class cantrip choice',
  'granted.healingHands': 'Healing Hands — 1 / long rest', 'granted.resist': 'Celestial resistances', 'granted.protection': 'Fighting Style: Protection', 'granted.tough': 'Origin feat: Tough',
  'granted.smith': 'Tool proficiency: Smith’s Tools (proficiency only — you do not own the tools)', 'granted.mastery': 'Weapon mastery choices',
  'step.choices.species': 'Species choices', 'step.choices.revelation': 'Celestial Revelation',

  'rest.short': 'Short rest', 'rest.long': 'Long rest', 'rest.confirm': 'Take a {kind}?', 'rest.confirmBody': 'Recoverable resources reset. This may need DM approval in some campaigns.', 'rest.done': 'Rest applied',

  'catalog.title': 'Component catalog', 'catalog.help': 'Every shared state in one place: loading, empty, success, error, disabled, read-only, pending, conflict, offline.',
  'catalog.states': 'States', 'catalog.loading': 'Loading', 'catalog.empty': 'Empty', 'catalog.emptyBody': 'Nothing to show yet.', 'catalog.disabled': 'Disabled', 'catalog.cards': 'Selection cards',
  'catalog.badges': 'Badges', 'catalog.controls': 'Controls', 'catalog.artwork': 'Artwork states', 'catalog.pendingBody': 'Waiting for a decision.', 'catalog.availableCard': 'Available', 'catalog.incompatibleCard': 'Incompatible',
  'catalog.unavailableCard': 'Unavailable', 'catalog.approvalCard': 'Needs approval', 'catalog.reasonIncompat': 'Needs martial training (example reason).', 'catalog.reasonUnavail': 'Disabled by the DM (example reason).',
  'catalog.reasonApproval': 'Magic items need DM approval.', 'catalog.successBody': 'Your changes were saved.', 'catalog.infoTitle': 'Information',

  'future.title': 'Coming later', 'future.help': 'These areas are planned but not functional in this prototype. Nothing here takes payment or changes data.',
  'future.homebrew': 'Homebrew packs', 'future.homebrewBody': 'Create and share custom content packs with your table.', 'future.bastions': 'Bastions', 'future.bastionsBody': 'Manage a home base between adventures.',
  'future.dmTools': 'Advanced DM tools', 'future.dmToolsBody': 'Encounters, traps and session planning.', 'future.premium': 'Premium', 'future.premiumBody': 'Optional extras. No payment flow exists in this prototype.',
  'future.soon': 'Coming later', 'nav.future': 'Coming later', 'nav.catalog': 'Catalog', 'nav.profile': 'Profile',

  'profile.title': 'Profile & preferences', 'profile.language': 'Interface language', 'profile.languageHelp': 'Switches every label, tooltip and message.', 'profile.privacy': 'Privacy',
  'profile.privacyBody': 'Your private stories and notes are visible only to you and the DM of that campaign. This prototype simulates visibility; the server must enforce it.',
  'profile.motion': 'Reduced motion follows your device setting.',
} as const;

export type TKey = keyof typeof en;
