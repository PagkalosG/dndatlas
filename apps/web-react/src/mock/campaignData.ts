/** MOCK campaign-side data: users, campaigns, members, characters, approvals, notifications, journal, media, admin. */
import type {
  AppNotification, ApprovalRequest, AuditEntry, Campaign, CharacterDraft, JournalEntry, MediaItem,
  Member, Membership, SessionInfo, SheetCharacter, SystemHealth, User,
} from '@/types';
import { L } from '@/i18n';

export const users: User[] = [
  { id: 'u1', displayName: 'George', email: 'george@example.com', isSuperadmin: true, avatarColor: '#D4AF37', locale: 'el' },
  { id: 'u2', displayName: 'Maria', email: 'maria@example.com', isSuperadmin: false, avatarColor: '#8B7CF6', locale: 'el' },
  { id: 'u3', displayName: 'Nikos', email: 'nikos@example.com', isSuperadmin: false, avatarColor: '#60A5FA', locale: 'en' },
  { id: 'u4', displayName: 'Eleni', email: 'eleni@example.com', isSuperadmin: false, avatarColor: '#4ADE80', locale: 'el' },
  { id: 'u5', displayName: 'Alex', email: 'alex@example.com', isSuperadmin: false, avatarColor: '#F87171', locale: 'en' },
];

/** The signed-in mock user belongs to several campaigns with DIFFERENT roles. */
export const memberships: Membership[] = [
  { campaignId: 'c1', userId: 'u1', role: 'dm' },
  { campaignId: 'c2', userId: 'u1', role: 'player' },
  { campaignId: 'c3', userId: 'u1', role: 'co_dm' },
  { campaignId: 'c4', userId: 'u1', role: 'pending' },
];

export const campaigns: Campaign[] = [
  { id: 'c1', name: 'The Starfall Expedition', description: 'A sky-island mystery campaign for four heroes.', system: 'DND5E_2024', dmName: 'George', memberCount: 5, pendingCount: 2, nextSession: '2026-11-21T19:00:00+02:00', accent: 'gold', inviteCode: 'STAR-7K2Q', startingLevel: 5, contentSources: ['Core Rules 2024'] },
  { id: 'c2', name: 'Embers of Hydra', description: 'A gritty frontier campaign on the Ember Coast.', system: 'DND5E_2024', dmName: 'Maria', memberCount: 4, pendingCount: 0, nextSession: '2026-11-24T20:00:00+02:00', accent: 'nebula', inviteCode: 'EMBR-3X9P', startingLevel: 5, contentSources: ['Core Rules 2024'] },
  { id: 'c3', name: 'Lanterns of Delphi', description: 'A series of Greek-language one-shots.', system: 'DND5E_2024', dmName: 'Nikos', memberCount: 6, pendingCount: 1, accent: 'info', inviteCode: 'LANT-5M1D', startingLevel: 3, contentSources: ['Core Rules 2024', 'Homebrew'] },
  { id: 'c4', name: 'Moonwell Mysteries', description: 'A moon-lit mystery campaign.', system: 'DND5E_2024', dmName: 'Eleni', memberCount: 3, pendingCount: 0, accent: 'ok', inviteCode: 'MOON-8R4T', startingLevel: 1, contentSources: ['Core Rules 2024'] },
];

export const members: Record<string, Member[]> = {
  c1: [
    { userId: 'u1', displayName: 'George', role: 'dm', avatarColor: '#D4AF37', online: true, joinedAt: '2026-08-02' },
    { userId: 'u2', displayName: 'Maria', role: 'co_dm', avatarColor: '#8B7CF6', online: false, joinedAt: '2026-08-02' },
    { userId: 'u3', displayName: 'Nikos', role: 'player', avatarColor: '#60A5FA', characterName: 'Bram Ironhelm', online: true, joinedAt: '2026-08-05' },
    { userId: 'u4', displayName: 'Eleni', role: 'player', avatarColor: '#4ADE80', characterName: 'Selene of Moonwell', online: false, joinedAt: '2026-08-06' },
    { userId: 'u5', displayName: 'Alex', role: 'pending', avatarColor: '#F87171', online: false, joinedAt: '2026-11-16' },
  ],
};

export const sheetCharacters: SheetCharacter[] = [
  {
    id: 'ch1', name: 'Thalia Brightwater', campaignId: 'c2', ownerId: 'u1', ownerName: 'George', speciesName: L('High Elf', 'Υψηλό Ξωτικό'), className: L('Wizard', 'Μάγος'), subclassName: L('Evoker', 'Evoker'), backgroundName: L('Sage', 'Σοφός'), level: 5, status: 'approved',
    abilities: {
      str: { score: 8, modifier: '-1', save: '-1' }, dex: { score: 14, modifier: '+2', save: '+2' }, con: { score: 14, modifier: '+2', save: '+2' },
      int: { score: 17, modifier: '+3', save: '+6' }, wis: { score: 13, modifier: '+1', save: '+4' }, cha: { score: 10, modifier: '+0', save: '+0' },
    },
    vitals: { hpCurrent: 24, hpMax: 31, hpTemp: 0, ac: 12, speed: '30 ft', initiative: '+2', proficiency: '+3', passivePerception: 11 },
    skills: [
      { id: 'arcana', proficient: true, bonus: '+6' }, { id: 'history', proficient: true, bonus: '+6' }, { id: 'investigation', proficient: true, bonus: '+6' },
      { id: 'insight', proficient: true, bonus: '+4' }, { id: 'perception', proficient: false, bonus: '+1' }, { id: 'stealth', proficient: false, bonus: '+2' },
    ],
    conditions: [],
    actions: [
      { id: 'a1', name: L('Quarterstaff', 'Ραβδί'), kind: 'attack', detail: '+1 · 1d6', tag: 'melee' },
      { id: 'a2', name: L('Fire Bolt', 'Βέλος Φωτιάς'), kind: 'attack', detail: '+6 · 2d10', tag: 'cantrip' },
      { id: 'a3', name: L('Shield', 'Ασπίδα'), kind: 'reaction', detail: 'Spell slot' },
      { id: 'a4', name: L('Counterspell', 'Αντιξόρκι'), kind: 'reaction', detail: 'Spell slot' },
      { id: 'a5', name: L('Misty Step', 'Ομιχλώδες Βήμα'), kind: 'bonus', detail: 'Spell slot' },
    ],
    resources: [{ id: 'r1', name: L('Arcane Recovery', 'Αρκανική Ανάκτηση'), current: 1, max: 1, recharge: 'long' }],
    spellSlots: [{ level: 1, current: 3, max: 4 }, { level: 2, current: 2, max: 3 }, { level: 3, current: 1, max: 2 }],
    spellsKnown: ['light', 'mage_hand', 'fire_bolt', 'shield', 'magic_missile', 'detect_magic', 'find_familiar', 'web', 'misty_step', 'fireball', 'counterspell'],
    spellsPrepared: ['light', 'mage_hand', 'fire_bolt', 'shield', 'magic_missile', 'detect_magic', 'misty_step', 'fireball', 'counterspell'],
    inventory: [
      { itemId: 'quarterstaff', qty: 1, equipped: true }, { itemId: 'spellbook', qty: 1, equipped: false }, { itemId: 'arcane_focus', qty: 1, equipped: true },
      { itemId: 'explorer_pack', qty: 1, equipped: false }, { itemId: 'healing_potion', qty: 2, equipped: false }, { itemId: 'cloak_protection', qty: 1, equipped: true, attuned: true },
      { itemId: 'wand_magic_missile', qty: 1, equipped: false },
    ],
    currency: { gp: 112, sp: 14, cp: 6 },
    story: 'Thalia left the Silverleaf archives after discovering a map that should not exist.',
    privateNotes: 'Suspect the archivist Orlan is working for the Hydra cult. Do not tell the party yet.',
  },
  {
    id: 'ch2', name: 'Bram Ironhelm', campaignId: 'c1', ownerId: 'u3', ownerName: 'Nikos', speciesName: L('Dwarf', 'Νάνος'), className: L('Fighter', 'Μαχητής'), subclassName: L('Battle Master', 'Battle Master'), backgroundName: L('Soldier', 'Στρατιώτης'), level: 5, status: 'approved',
    abilities: {
      str: { score: 17, modifier: '+3', save: '+6' }, dex: { score: 12, modifier: '+1', save: '+1' }, con: { score: 16, modifier: '+3', save: '+6' },
      int: { score: 10, modifier: '+0', save: '+0' }, wis: { score: 13, modifier: '+1', save: '+1' }, cha: { score: 8, modifier: '-1', save: '-1' },
    },
    vitals: { hpCurrent: 49, hpMax: 49, hpTemp: 0, ac: 18, speed: '25 ft', initiative: '+1', proficiency: '+3', passivePerception: 11 },
    skills: [{ id: 'athletics', proficient: true, bonus: '+6' }, { id: 'intimidation', proficient: true, bonus: '+2' }],
    conditions: [], actions: [{ id: 'b1', name: L('Longsword', 'Μακρύ Σπαθί'), kind: 'attack', detail: '+6 · 1d8+3' }], resources: [], spellSlots: [],
    spellsKnown: [], spellsPrepared: [], inventory: [{ itemId: 'longsword', qty: 1, equipped: true }, { itemId: 'chain_shirt', qty: 1, equipped: true }, { itemId: 'shield', qty: 1, equipped: true }], currency: { gp: 40, sp: 0, cp: 0 },
    story: '', privateNotes: '',
  },
];

export const emptyDraft = (campaignId = 'c2'): CharacterDraft => ({
  id: `local-${campaignId}`, name: '', campaignId, level: 1, abilityMethod: 'standard', abilities: {}, backgroundBoosts: {},
  skills: [], tools: [], languages: ['common'], choices: {}, spells: [], equipment: [], story: '', privateNotes: '',
  status: 'draft', updatedAt: new Date().toISOString(), version: 1,
});

export const approvals: ApprovalRequest[] = [
  { id: 'ap1', characterId: 'd-selene', characterName: 'Selene of Moonwell', playerName: 'Eleni', kind: 'new_character', summary: L('Level 5 Cleric (Life) · Sage', 'Επίπεδο 5 Ιερέας (Ζωή) · Σοφός'), submittedAt: '2026-11-16T21:10:00+02:00', status: 'pending' },
  { id: 'ap2', characterId: 'ch2', characterName: 'Bram Ironhelm', playerName: 'Nikos', kind: 'restricted_change', summary: L('Requests a magic item: Ring of Evasion', 'Αίτημα μαγικού αντικειμένου: Δαχτυλίδι Αποφυγής'), changes: [{ field: L('Inventory', 'Εξοπλισμός'), from: '—', to: 'Ring of Evasion / Δαχτυλίδι Αποφυγής (rare)' }], submittedAt: '2026-11-15T18:40:00+02:00', status: 'pending' },
  { id: 'ap3', characterId: 'ch1', characterName: 'Thalia Brightwater', playerName: 'George', kind: 'level_up', summary: L('Level 4 → 5', 'Επίπεδο 4 → 5'), changes: [{ field: L('Level', 'Επίπεδο'), from: '4', to: '5' }, { field: L('Spells', 'Ξόρκια'), from: '10', to: '11' }], submittedAt: '2026-11-10T20:00:00+02:00', status: 'approved' },
];

export const notifications: AppNotification[] = [
  { id: 'n1', kind: 'approval', title: L('New character awaiting approval', 'Νέος χαρακτήρας περιμένει έγκριση'), body: L('Eleni submitted Selene of Moonwell.', 'Η Eleni υπέβαλε τον χαρακτήρα Selene of Moonwell.'), campaignId: 'c1', at: '2026-11-16T21:10:00+02:00', read: false },
  { id: 'n2', kind: 'invite', title: L('Join request', 'Αίτημα συμμετοχής'), body: L('Alex used your invite code for The Starfall Expedition.', 'Ο Alex χρησιμοποίησε τον κωδικό πρόσκλησής σου για την The Starfall Expedition.'), campaignId: 'c1', at: '2026-11-16T19:02:00+02:00', read: false },
  { id: 'n3', kind: 'session', title: L('Session in 4 days', 'Συνεδρία σε 4 ημέρες'), body: L('Embers of Hydra · Tuesday 20:00', 'Embers of Hydra · Τρίτη 20:00'), campaignId: 'c2', at: '2026-11-15T09:00:00+02:00', read: true },
  { id: 'n4', kind: 'journal', title: L('New handout shared', 'Νέο έγγραφο κοινοποιήθηκε'), body: L('Maria shared “Map of the Ember Coast”.', 'Η Maria κοινοποίησε τον «Map of the Ember Coast».'), campaignId: 'c2', at: '2026-11-14T22:30:00+02:00', read: true },
  { id: 'n5', kind: 'system', title: L('Back online', 'Ξανά συνδεδεμένος'), body: L('Your offline changes were synced.', 'Οι αλλαγές που έκανες εκτός σύνδεσης συγχρονίστηκαν.'), at: '2026-11-12T08:15:00+02:00', read: true },
];

export const journal: JournalEntry[] = [
  { id: 'j1', title: 'Session 12 — The Ember Gate', body: 'We reached the Ember Gate at dusk. The warden demanded a name we did not know.', visibility: 'party', at: '2026-11-10', authorName: 'George' },
  { id: 'j2', title: 'Thoughts on Orlan', body: 'He knew the map’s cipher too well. I will watch him.', visibility: 'private', at: '2026-11-11', authorName: 'George' },
  { id: 'j3', title: 'Secret: the warden is a construct', body: 'DM note: the warden can be bypassed with the sigil from session 9.', visibility: 'dm_only', at: '2026-11-12', authorName: 'Maria' },
];

export const media: MediaItem[] = [
  { id: 'm1', title: 'Ember Coast', kind: 'map', hue: 20, visibility: 'party', caption: 'Regional map' },
  { id: 'm2', title: 'Orlan the Archivist', kind: 'portrait', hue: 260, visibility: 'party' },
  { id: 'm3', title: 'Warden Construct', kind: 'scene', hue: 200, visibility: 'dm_only', caption: 'Reveal in session 13' },
  { id: 'm4', title: 'Sigil Rubbing', kind: 'handout', hue: 48, visibility: 'party' },
];

export const sessions: SessionInfo[] = [
  { id: 's1', title: 'Session 13 — Beyond the Gate', at: '2026-11-21T19:00:00+02:00', note: 'Bring updated character sheets.' },
  { id: 's2', title: 'Session 14', at: '2026-12-05T19:00:00+02:00' },
];

export const auditLog: AuditEntry[] = [
  { id: 'l1', at: '2026-11-17 09:02', actor: 'George', action: L('Changed role', 'Άλλαξε ρόλο'), target: 'Maria → Co-DM (c1)' },
  { id: 'l2', at: '2026-11-16 21:10', actor: 'Eleni', action: L('Submitted character', 'Υπέβαλε χαρακτήρα'), target: 'Selene of Moonwell' },
  { id: 'l3', at: '2026-11-15 11:30', actor: 'System', action: L('Backup completed', 'Ολοκληρώθηκε αντίγραφο ασφαλείας'), target: 'Daily snapshot' },
  { id: 'l4', at: '2026-11-14 17:44', actor: 'Maria', action: L('Created campaign', 'Δημιούργησε καμπάνια'), target: 'Embers of Hydra' },
];

export const systemHealth: SystemHealth[] = [
  { id: 'h1', label: L('API', 'API'), state: 'ok', detail: L('Operational', 'Λειτουργεί') },
  { id: 'h2', label: L('Content sync', 'Συγχρονισμός περιεχομένου'), state: 'degraded', detail: L('Last success 3h ago', 'Τελευταία επιτυχία πριν 3 ώρες') },
  { id: 'h3', label: L('Media storage', 'Αποθήκευση πολυμέσων'), state: 'ok', detail: L('41% used', '41% σε χρήση') },
  { id: 'h4', label: L('Notifications', 'Ειδοποιήσεις'), state: 'ok', detail: L('Queue empty', 'Η ουρά είναι άδεια') },
];

/** A submitted draft the DM can review. */
export const pendingDraft: CharacterDraft = {
  ...emptyDraft('c1'), id: 'd-selene', name: 'Selene of Moonwell', level: 5, speciesId: 'aasimar', classId: 'cleric', subclassId: 'life', backgroundId: 'sage',
  abilities: { str: 10, dex: 12, con: 14, int: 13, wis: 15, cha: 8 }, skills: ['insight', 'medicine', 'arcana', 'history'], spells: ['guidance', 'cure_wounds', 'detect_magic', 'hold_person', 'revivify'],
  equipment: ['chain_shirt', 'shield', 'holy_symbol', 'healing_potion'], status: 'pending', story: 'Raised by lunar monks…', privateNotes: '',
};
