/**
 * Demo drafts from the design brief's test cases. Values are ILLUSTRATIVE selections for the UI,
 * not validated against official rules.
 */
import type { CharacterDraft } from '@/types';
import { emptyDraft } from './campaignData';

export const borruk = (campaignId: string): CharacterDraft => ({
  ...emptyDraft(campaignId),
  id: 'draft-borruk', name: 'Borruk', level: 3, speciesId: 'human', classId: 'fighter', subclassId: 'battle_master', backgroundId: 'soldier',
  abilityMethod: 'standard', abilities: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 }, backgroundBoosts: { str: 2, con: 1 },
  skills: ['athletics', 'intimidation', 'perception', 'survival'], tools: ['smith'], languages: ['common', 'dwarvish', 'orc'],
  choices: { fighting_style: ['protection'], maneuvers: ['riposte', 'precision', 'trip'], origin_feat: ['tough'] },
  // Greatsword + shield on purpose: demonstrates the loadout conflict warning.
  equipment: ['greatsword', 'shield', 'chain_shirt', 'explorer_pack'],
});

export const luna = (campaignId: string): CharacterDraft => ({
  ...emptyDraft(campaignId),
  id: 'draft-luna', name: 'Luna', level: 3, speciesId: 'aasimar', classId: 'sorcerer', subclassId: 'aberrant', backgroundId: 'noble',
  abilityMethod: 'standard', abilities: { str: 8, dex: 13, con: 14, int: 10, wis: 12, cha: 15 }, backgroundBoosts: { cha: 2, int: 1 },
  skills: ['history', 'persuasion', 'arcana', 'insight'], tools: [], languages: ['common', 'celestial', 'elvish'],
  choices: { metamagic: ['careful', 'subtle'], celestial_revelation: ['inner_radiance'], origin_feat: ['skilled'] },
  // Light is granted by the species, so it is intentionally NOT in the sorcerer cantrip picks.
  spells: ['mage_hand', 'fire_bolt', 'shield', 'magic_missile', 'web'],
  equipment: ['arcane_focus', 'dagger', 'explorer_pack'],
});
