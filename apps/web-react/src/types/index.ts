/**
 * Shared TypeScript contracts for the D&D Atlas 2.0 UI prototype.
 * These are the shapes the real backend must return/accept (see UI-INTEGRATION-CONTRACT.md).
 * All rules-derived numbers (modifiers, AC, HP, spell DCs...) are DELIVERED by the backend; the UI never computes them.
 */

export type Locale = 'en' | 'el';
export interface LocalizedString { en: string; el: string }

/* ---------- Accounts & roles ---------- */
export type Role = 'superadmin' | 'dm' | 'co_dm' | 'player' | 'pending';

export interface User {
  id: string;
  displayName: string;
  email: string;
  isSuperadmin: boolean;
  avatarColor: string;
  locale: Locale;
}

export interface Membership {
  campaignId: string;
  userId: string;
  role: Role;
  joinedAt?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  system: 'DND5E_2024';
  dmName: string;
  memberCount: number;
  pendingCount: number;
  nextSession?: string;
  accent: 'gold' | 'nebula' | 'info' | 'ok';
  inviteCode: string;
  startingLevel: number;
  contentSources: string[];
}

/* ---------- Sync / UI states ---------- */
export type SyncState = 'idle' | 'loading' | 'saving' | 'success' | 'error' | 'conflict' | 'offline';
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'changes_requested' | 'rejected';

export interface Availability {
  state: 'available' | 'unavailable' | 'incompatible';
  /** Human-readable explanation of WHY (shown in the UI). Supplied by backend rules engine. */
  reason?: LocalizedString;
  /** Option can be chosen but the DM must approve it (restricted content). */
  needsApproval?: boolean;
}

/* ---------- Reference data ---------- */
export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export interface Species {
  id: string;
  name: LocalizedString;
  tagline: LocalizedString;
  description: LocalizedString;
  traits: LocalizedString[];
  size: 'Small' | 'Medium';
  hue: number; // used by placeholder illustration
  glyph: string;
  /** Optional sub-choices, e.g. Elven lineage. */
  lineages?: { id: string; name: LocalizedString; note: LocalizedString }[];
  /** Species-granted choices (e.g. a level-gated revelation). */
  choiceGroups?: ClassChoiceGroup[];
  artworkUrl?: string; // only if licensed
}

export interface ClassChoiceGroup {
  id: string; // e.g. 'fighting_style'
  label: LocalizedString;
  pick: number;
  atLevel: number;
  /** Only offered when this subclass is selected (e.g. Maneuvers for Battle Master). */
  requiresSubclass?: string;
  options: { id: string; name: LocalizedString; note?: LocalizedString; requires?: { minLevel?: number } }[];
}

export interface ClassDef {
  id: string;
  name: LocalizedString;
  tagline: LocalizedString;
  description: LocalizedString;
  role: 'martial' | 'caster' | 'hybrid' | 'skill';
  hitDie: number;
  primary: AbilityKey[];
  complexity: 1 | 2 | 3;
  spellcaster: boolean;
  subclassLevel: number;
  subclasses: { id: string; name: LocalizedString; note: LocalizedString }[];
  skillPicks: number;
  skillOptions: string[];
  armorTraining: ('light' | 'medium' | 'heavy' | 'shield')[];
  weaponTraining: ('simple' | 'martial')[];
  choiceGroups: ClassChoiceGroup[];
  hue: number;
  glyph: string;
  artworkUrl?: string;
}

export interface Background {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  skills: string[];
  tool: LocalizedString;
  feat: LocalizedString;
  abilityBoostOptions: AbilityKey[];
  languagesPick: number;
}

export interface Skill { id: string; name: LocalizedString; ability: AbilityKey }

export interface Spell {
  id: string;
  name: LocalizedString;
  level: number; // 0 = cantrip
  school: 'Abjuration' | 'Conjuration' | 'Divination' | 'Enchantment' | 'Evocation' | 'Illusion' | 'Necromancy' | 'Transmutation';
  components: ('V' | 'S' | 'M')[];
  classes: string[];
  usage: ('ritual' | 'concentration')[];
  summary: LocalizedString;
}

export type ItemCategory = 'weapon' | 'armor' | 'gear' | 'consumable' | 'magic';
export interface Item {
  id: string;
  name: LocalizedString;
  category: ItemCategory;
  subtype?: string; // 'simple melee', 'martial ranged', 'light armor'...
  damage?: string; // display-only text from backend
  properties?: string[];
  cost?: string;
  weight?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary';
  attunement?: boolean;
  summary: LocalizedString;
  thumb: string; // glyph/emoji fallback until artwork exists
  thumbUrl?: string;
}

export interface Feat {
  id: string;
  name: LocalizedString;
  summary: LocalizedString;
  minLevel: number;
  category: 'origin' | 'general';
}

export interface Language { id: string; name: LocalizedString }

/* ---------- Character ---------- */
export interface CharacterDraft {
  id: string;
  name: string;
  campaignId: string;
  level: number;
  speciesId?: string;
  lineageId?: string;
  classId?: string;
  subclassId?: string;
  backgroundId?: string;
  abilityMethod: 'standard' | 'pointbuy' | 'manual';
  abilities: Partial<Record<AbilityKey, number>>;
  /** where the backend should apply the background boosts */
  backgroundBoosts: Partial<Record<AbilityKey, number>>;
  skills: string[];
  tools: string[];
  languages: string[];
  choices: Record<string, string[]>; // groupId -> option ids
  spells: string[];
  equipment: string[];
  equipmentQuantities?: Record<string, number>;
  customItems?: { id: string; name: string; category: string; quantity: number; costGp: number; weight: number; description: string }[];
  alignment?: string;
  portraitData?: string;
  story: string; // PRIVATE
  privateNotes: string; // PRIVATE
  status: ApprovalStatus;
  dmFeedback?: string;
  updatedAt: string;
  version: number; // optimistic concurrency
}

export interface SheetCharacter {
  id: string;
  name: string;
  campaignId: string;
  ownerId: string;
  ownerName: string;
  speciesName: LocalizedString;
  className: LocalizedString;
  subclassName?: LocalizedString;
  backgroundName: LocalizedString;
  level: number;
  status: ApprovalStatus;
  /** All numbers below are backend-computed. */
  abilities: Record<AbilityKey, { score: number; modifier: string; save: string }>;
  vitals: { hpCurrent: number; hpMax: number; hpTemp: number; ac: number; speed: string; initiative: string; proficiency: string; passivePerception: number };
  skills: { id: string; proficient: boolean; expertise?: boolean; bonus: string }[];
  conditions: string[];
  actions: { id: string; name: LocalizedString; kind: 'attack' | 'action' | 'bonus' | 'reaction'; detail: string; tag?: string }[];
  resources: { id: string; name: LocalizedString; current: number; max: number; recharge: 'short' | 'long' | 'none' }[];
  spellSlots: { level: number; current: number; max: number }[];
  spellsKnown: string[]; // spell ids
  spellsPrepared: string[];
  inventory: { itemId: string; qty: number; equipped: boolean; attuned?: boolean }[];
  currency: { gp: number; sp: number; cp: number };
  story: string;
  privateNotes: string;
}

/* ---------- Campaign collaboration ---------- */
export interface Member {
  userId: string;
  displayName: string;
  role: Role;
  avatarColor: string;
  characterName?: string;
  online: boolean;
  joinedAt: string;
}

export interface ApprovalRequest {
  id: string;
  characterId: string;
  characterName: string;
  playerName: string;
  kind: 'new_character' | 'level_up' | 'restricted_change';
  summary: LocalizedString;
  changes?: { field: LocalizedString; from: string; to: string }[];
  submittedAt: string;
  status: 'pending' | 'approved' | 'changes_requested' | 'rejected';
}

export interface AppNotification {
  id: string;
  kind: 'approval' | 'invite' | 'session' | 'system' | 'journal';
  /** System-generated text: backend sends both languages (or a template key + params). */
  title: LocalizedString;
  body: LocalizedString;
  campaignId?: string;
  at: string;
  read: boolean;
}

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  visibility: 'private' | 'party' | 'dm_only';
  at: string;
  authorName: string;
}

export interface MediaItem {
  id: string;
  title: string;
  kind: 'map' | 'handout' | 'portrait' | 'scene';
  hue: number;
  visibility: 'party' | 'dm_only';
  caption?: string;
}

export interface SessionInfo { id: string; title: string; at: string; note?: string }
export interface AuditEntry { id: string; at: string; actor: string; action: LocalizedString; target: string }
export interface SystemHealth { id: string; label: LocalizedString; state: 'ok' | 'degraded' | 'down'; detail: LocalizedString }

/* ---------- Mock events (UI -> backend intents) ---------- */
export type AtlasEvent =
  | { type: 'auth.login'; payload: { provider: 'google' | 'email'; email?: string } }
  | { type: 'auth.logout'; payload: Record<string, never> }
  | { type: 'campaign.select'; payload: { campaignId: string } }
  | { type: 'campaign.create'; payload: { name: string; description: string; startingLevel: number; contentSources: string[]; approvalPolicy: string } }
  | { type: 'campaign.join'; payload: { inviteCode: string } }
  | { type: 'member.role.change'; payload: { campaignId: string; userId: string; role: Role } }
  | { type: 'member.remove'; payload: { campaignId: string; userId: string } }
  | { type: 'character.draft.save'; payload: { draftId: string; version: number } }
  | { type: 'character.submit'; payload: { draftId: string } }
  | { type: 'character.approval.decide'; payload: { requestId: string; decision: 'approve' | 'request_changes' | 'reject'; feedback?: string } }
  | { type: 'character.sheet.save'; payload: { characterId: string; fields: string[] } }
  | { type: 'character.rest'; payload: { characterId: string; kind: 'short' | 'long' } }
  | { type: 'notification.read'; payload: { id: string } }
  | { type: 'admin.action'; payload: { action: string; target?: string } };

export type AtlasEventType = AtlasEvent['type'];
