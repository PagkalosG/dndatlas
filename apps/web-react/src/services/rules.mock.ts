/**
 * MOCK availability rules — exists only to demonstrate "why is this option available / unavailable / incompatible".
 * The production rules engine replaces this file. Nothing here is an official D&D rule.
 */
import { L } from '@/i18n';
import type { Availability, CharacterDraft, ClassDef, Item, Spell } from '@/types';
import { classes } from '@/mock/reference';

const ok: Availability = { state: 'available' };

/** Campaign-level DM restrictions (mock). */
const restrictions: Record<string, { species?: string[]; items?: string[]; approval?: string[] }> = {
  c2: { species: ['goliath'], items: ['ring_evasion'], approval: ['bag_holding', 'cloak_protection', 'wand_magic_missile'] },
};

export function speciesAvailability(campaignId: string, id: string): Availability {
  if (restrictions[campaignId]?.species?.includes(id))
    return { state: 'unavailable', reason: L('Disabled by the DM for this campaign.', 'Απενεργοποιήθηκε από τον DM για αυτή την καμπάνια.') };
  return ok;
}

export function classAvailability(): Availability { return ok; }

/** Highest spell level offered in the prototype (MOCK progression, not an official table). */
export function mockMaxSpellLevel(cls: ClassDef | undefined, level: number): number {
  if (!cls || !cls.spellcaster) return 0;
  if (cls.role === 'hybrid' && (cls.id === 'paladin' || cls.id === 'ranger')) return level < 2 ? 0 : Math.min(5, Math.ceil(level / 4));
  return Math.min(9, Math.ceil(level / 2));
}

export function spellAvailability(draft: CharacterDraft, spell: Spell): Availability {
  const cls = classes.find((c) => c.id === draft.classId);
  if (!cls) return { state: 'unavailable', reason: L('Choose a class first.', 'Διάλεξε πρώτα κλάση.') };
  if (!cls.spellcaster) return { state: 'incompatible', reason: L(`${cls.name.en} doesn't cast spells at this stage.`, `Η κλάση ${cls.name.el} δεν εκτελεί ξόρκια σε αυτό το στάδιο.`) };
  if (!spell.classes.includes(cls.id)) return { state: 'incompatible', reason: L(`Not on the ${cls.name.en} spell list.`, `Δεν ανήκει στη λίστα ξορκιών: ${cls.name.el}.`) };
  const max = mockMaxSpellLevel(cls, draft.level);
  if (spell.level > max) return { state: 'unavailable', reason: L(`Requires a higher character level (spell level ${spell.level}).`, `Απαιτεί υψηλότερο επίπεδο χαρακτήρα (επίπεδο ξορκιού ${spell.level}).`) };
  return ok;
}

export function itemAvailability(draft: CharacterDraft, item: Item): Availability {
  const r = restrictions[draft.campaignId];
  if (r?.items?.includes(item.id)) return { state: 'unavailable', reason: L('Not allowed in this campaign.', 'Δεν επιτρέπεται σε αυτή την καμπάνια.') };
  const cls = classes.find((c) => c.id === draft.classId);
  if (cls && item.category === 'armor' && item.subtype) {
    const needed = item.subtype as ClassDef['armorTraining'][number];
    if (!cls.armorTraining.includes(needed))
      return { state: 'incompatible', reason: L(`${cls.name.en} has no ${needed} armor training (mock check).`, `Η κλάση ${cls.name.el} δεν έχει εκπαίδευση σε αυτόν τον τύπο πανοπλίας (δοκιμαστικός έλεγχος).`) };
  }
  if (cls && item.category === 'weapon' && item.subtype?.startsWith('martial') && !cls.weaponTraining.includes('martial'))
    return { state: 'incompatible', reason: L(`${cls.name.en} lacks martial weapon training (mock check).`, `Η κλάση ${cls.name.el} δεν έχει εκπαίδευση σε πολεμικά όπλα (δοκιμαστικός έλεγχος).`) };
  if (r?.approval?.includes(item.id) || (item.category === 'magic' && (item.rarity === 'rare' || item.rarity === 'very rare' || item.rarity === 'legendary')))
    return { state: 'available', needsApproval: true, reason: L('Magic items need DM approval.', 'Τα μαγικά αντικείμενα χρειάζονται έγκριση DM.') };
  return ok;
}

export function featAvailable(minLevel: number, level: number): Availability {
  return level >= minLevel ? ok : { state: 'unavailable', reason: L(`Unlocks at level ${minLevel}.`, `Ξεκλειδώνει στο επίπεδο ${minLevel}.`) };
}
