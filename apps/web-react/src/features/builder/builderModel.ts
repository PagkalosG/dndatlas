import type { AbilityKey, CharacterDraft } from '@/types';
import { ABILITY_KEYS } from '@/types';
import { backgrounds, classes, items, species } from '@/mock/reference';
import type { TKey } from '@/i18n/en';
import { engine, engineIssues, toEngineDraft } from '@/engine/atlas2024';

export const STEP_IDS = ['species', 'class', 'subclass', 'background', 'abilities', 'proficiencies', 'choices', 'spells', 'equipment', 'details', 'review'] as const;
export type StepId = (typeof STEP_IDS)[number];

export interface StepProps {
  draft: CharacterDraft;
  update: (patch: Partial<CharacterDraft>) => void;
  readOnly: boolean;
  goTo: (s: StepId) => void;
}

/** MOCK: standard array & point-buy tables are illustrative UI constraints only; the rules engine is authoritative. */
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const POINT_BUY_COST: Record<number, number> = engine().abilities.POINT_COSTS;
export const POINT_BUY_BUDGET = 27;
export const BACKGROUND_BOOST_BUDGET = 3;

export function pointBuySpent(abilities: CharacterDraft['abilities']): number {
  return ABILITY_KEYS.reduce((sum, k) => sum + (POINT_BUY_COST[abilities[k] ?? 8] ?? 0), 0);
}

export function abilitiesComplete(d: CharacterDraft): boolean {
  if (!ABILITY_KEYS.every((k) => typeof d.abilities[k] === 'number')) return false;
  if (d.abilityMethod === 'standard') {
    const used = ABILITY_KEYS.map((k) => d.abilities[k]!).sort((a, b) => b - a);
    return JSON.stringify(used) === JSON.stringify(STANDARD_ARRAY);
  }
  if (d.abilityMethod === 'pointbuy') return ABILITY_KEYS.every(k => (d.abilities[k] ?? 0) >= 8 && (d.abilities[k] ?? 99) <= 15) && pointBuySpent(d.abilities) <= POINT_BUY_BUDGET;
  return true;
}

export function boostTotal(d: CharacterDraft): number {
  return (Object.values(d.backgroundBoosts) as number[]).reduce((a, b) => a + (b ?? 0), 0);
}

export interface StepIssue { step: StepId; key: TKey }

/** Validation messages are i18n keys so both languages stay in sync. */
export function validate(d: CharacterDraft): StepIssue[] {
  const issues: StepIssue[] = [];
  const cls = classes.find((c) => c.id === d.classId);
  const bg = backgrounds.find((b) => b.id === d.backgroundId);
  if (!d.speciesId) issues.push({ step: 'species', key: 'val.species' });
  if (!d.classId) issues.push({ step: 'class', key: 'val.class' });
  if (!d.backgroundId) issues.push({ step: 'background', key: 'val.background' });
  if (!abilitiesComplete(d)) issues.push({ step: 'abilities', key: 'val.abilities' });
  if (cls && d.skills.filter((s) => cls.skillOptions.includes(s) && !bg?.skills.includes(s)).length < cls.skillPicks) issues.push({ step: 'proficiencies', key: 'val.skills' });
  if (bg && d.languages.filter((l) => l !== 'common').length < bg.languagesPick) issues.push({ step: 'proficiencies', key: 'val.languages' });
  if (cls && d.level >= cls.subclassLevel && !d.subclassId) issues.push({ step: 'subclass', key: 'val.subclass' });
  // Class feature prerequisite validation is delegated to the existing 2024 engine.
  const sp = species.find((s) => s.id === d.speciesId);
  if (sp && sp.id === 'human' && !d.choices.human_skill?.length) issues.push({ step: 'proficiencies', key:'val.skills' });
  // 2024 Background Origin Feat is automatically granted; Human Versatile is additional.
  for (const e of engineIssues(d)) issues.push({ step: e.step, key: e.step === 'proficiencies' ? 'val.skills' : e.step === 'abilities' ? 'val.abilities' : 'val.choice' });
  if (!d.name.trim()) issues.push({ step: 'details', key: 'val.name' });
  return issues;
}

export function completeness(d: CharacterDraft): number {
  const checks = [!!d.speciesId, !!d.classId, !!d.backgroundId, abilitiesComplete(d), !validate(d).some((i) => i.step === 'proficiencies'), !validate(d).some((i) => i.step === 'choices'), !!d.name.trim()];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export const abilityList: AbilityKey[] = ABILITY_KEYS;

export type LoadoutWarning = 'twoHandedShield';

/** ILLUSTRATIVE loadout check only. The real rules engine is authoritative. */
export function loadoutWarnings(d: CharacterDraft): LoadoutWarning[] {
  const e=toEngineDraft(d);
  const ownership=engine().insights.contents(e, engine().rules);
  const equipWeapon=d.choices.equipped_weapon?.[0];
  const hasShield=d.choices.equipped_shield?.[0]==='shield' && ownership.has('shield');
  if(!equipWeapon || !hasShield) return [];
  const weapon=engine().catalog.equipment.find(x=>x.id===equipWeapon);
  return weapon?.properties?.some(x=>x.name==='Two-Handed')?['twoHandedShield']:[];
}
