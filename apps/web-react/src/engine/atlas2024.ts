import type { AbilityKey, Background, CharacterDraft, ClassDef, Item, LocalizedString } from '@/types';
import type { StepId } from '@/features/builder/builderModel';

/** These globals come from the existing apps/web-v2 engine, copied unmodified at build time. */
export interface SrdOption { id: string; name: string }
export interface SrdChoice { id: string; count: number; options: SrdOption[] }
export interface SrdItem { id: string; name: string; category: string; categories: string[]; cost?: { amount: number; unit: string; cp: number } | null; weight?: number; description?: string[]; damage?: { damage_dice: string; damage_type?: { name: string } }; properties?: { name: string }[]; mastery?: { index?: string; name: string }; armorClass?: { base: number; dex_bonus?: boolean; max_bonus?: number }; isPack?: boolean; contents?: { id: string; name: string; quantity: number }[] }
export interface SrdClass { id: string; name: string; hitDie: number; savingThrows: SrdOption[]; proficiencies: SrdOption[]; skillChoices: SrdChoice[]; startingOptions: { id: string; items: unknown[] }[]; subclasses: SrdOption[] }
export interface SrdBackground { id: string; name: string; feat?: SrdOption | null; proficiencies: SrdOption[]; skillChoices: SrdChoice[]; abilityScores: SrdOption[]; startingOptions: { id: string; items: unknown[] }[] }
export interface SrdCatalog { edition: '2024'; source: string; license: string; classes: SrdClass[]; backgrounds: SrdBackground[]; equipment: SrdItem[] }
interface SrdEngine {
  source: SrdCatalog;
  classInfo: (id?: string) => SrdClass | null;
  backgroundInfo: (id?: string) => SrdBackground | null;
  classChoicesValid: (d: unknown) => boolean;
  fighterChoicesValid: (d: unknown) => boolean;
  backgroundChoicesValid: (d: unknown) => boolean;
  bonusesValid: (d: unknown) => boolean;
  bonusFor: (d: unknown, key: AbilityKey) => number;
  wallet: (d: unknown) => { starting: number; spent: number; remaining: number };
  contents?: (d: unknown) => Map<string, unknown>;
}
interface OriginEngine {
  FEATS: Record<string, { name: string; en: string; el: string }>;
  MASTERIES: Record<string, { en: string; el: string }>;
  skillOptions: { id: string; en: string; el: string }[];
  validHumanSkill: (d: unknown) => boolean;
  validHumanFeat: (d: unknown) => boolean;
}
interface InsightEngine {
  score: (d: unknown, key: AbilityKey, bonus: (d: unknown, key: AbilityKey) => number) => { base: number; bonus: number; total: number; modifier: number };
  grants: (d: unknown, cls: SrdClass|null, bg: SrdBackground|null) => { id: string; kind: string; sources: { origin: string }[] }[];
  contents: (d: unknown, builder: SrdEngine) => Map<string, { id: string; quantity: number; sources: { label: string }[] }>;
}
interface AllocationEngine {
  STANDARD: number[];
  POINT_COSTS: Record<number, number>;
  BUDGET: number;
  validate: (method: string, scores: number[]) => { valid: boolean; remaining: number|null; spent: number|null };
  adjust: (scores: number[], index: number, direction: number, method: string) => number[]|null;
}
declare global { interface Window {
  ATLAS_V2_SRD?: SrdCatalog;
  ATLAS_V2_BUILDER?: SrdEngine;
  ATLAS_V2_ORIGINS?: OriginEngine;
  ATLAS_V2_INSIGHTS?: InsightEngine;
  ATLAS_V2_ABILITIES?: AllocationEngine;
} }
export function engine() {
  const { ATLAS_V2_SRD: catalog, ATLAS_V2_BUILDER: rules, ATLAS_V2_ORIGINS: origins, ATLAS_V2_INSIGHTS: insights, ATLAS_V2_ABILITIES: abilities } = window;
  if (!catalog || catalog.edition !== '2024' || !rules || !origins || !insights || !abilities) {
    throw Error('Atlas 2024 engine failed to load — refusing to use mock rules as a replacement');
  }
  return { catalog, rules, origins, insights, abilities };
}
const sluggify = (id: string) => id.replaceAll('_', '-');
export const skillId = (id: string) => 'skill-' + sluggify(id);
export const uiSkillId = (id: string) => id.replace(/^skill-/, '').replaceAll('-', '_');
export const L = (en: string, el = en): LocalizedString => ({ en, el });

/** Adapter from the React UI draft to the existing rules engine's draft contract. */
export function toEngineDraft(d: CharacterDraft) {
  const selectedClassSkills = (d.choices['class_skills']?.length ? d.choices.class_skills : d.skills.filter(id => !engine().rules.backgroundInfo(d.backgroundId)?.proficiencies?.some(p => uiSkillId(p.id) === id))).map(skillId);
  const bg = engine().rules.backgroundInfo(d.backgroundId);
  const eligible = bg?.abilityScores.map(x => x.id as AbilityKey) ?? [];
  const boost = d.backgroundBoosts;
  const boostMode = eligible.every(k => boost[k] === 1) ? 'triple' : 'split';
  const two = eligible.find(k => boost[k] === 2);
  const one = eligible.find(k => boost[k] === 1);
  const purchased = Object.fromEntries(d.equipment.map(id=>[id,(d.equipmentQuantities?.[id] ?? 1)]));
  return {
    class: d.classId || '', background: d.backgroundId || '', species: d.speciesId || '',
    classChoices: { '0': selectedClassSkills }, backgroundChoices: {},
    humanSkill: d.choices.human_skill?.[0] ? skillId(d.choices.human_skill[0]) : null,
    humanFeat: d.choices.human_origin_feat?.[0] ?? null,
    skilledChoices: (d.choices.skilled_proficiencies ?? []).map(x => x.startsWith('skill-')||x.startsWith('tool-')?x:skillId(x)),
    fightingStyle: d.choices.fighting_style?.[0] ?? null,
    weaponMasteries: d.choices.weapon_masteries || [],
    bonusMode: boostMode, bonusTwo: two, bonusOne: one,
    abilities: (['str','dex','con','int','wis','cha'] as AbilityKey[]).map(k=>d.abilities[k] ?? 8),
    classPackage: d.choices.class_package?.[0] ?? null,
    backgroundPackage: d.choices.background_package?.[0] ?? null,
    packageChoices: {}, purchases: purchased,
    customItems: d.customItems || [],
  };
}

export function engineIssues(d: CharacterDraft): { step: StepId; key: string; message: LocalizedString }[] {
  const { rules, origins } = engine();
  const e = toEngineDraft(d);
  const issues: { step: StepId; key: string; message: LocalizedString }[] = [];
  if (d.classId && !rules.classChoicesValid(e)) issues.push({ step: 'proficiencies', key: 'classSkills', message: L('Choose the legal Class Skill Proficiencies.', 'Επίλεξε τις νόμιμες εξοικειώσεις της κλάσης.') });
  if (d.speciesId === 'human' && !origins.validHumanSkill(e)) issues.push({ step: 'proficiencies', key: 'humanSkill', message: L('Human Skillful requires one additional skill.', 'Το Human Skillful απαιτεί μία επιπλέον δεξιότητα.') });
  if (d.speciesId === 'human' && !origins.validHumanFeat(e)) issues.push({ step: 'choices', key: 'humanFeat', message: L('Complete the additional Human Origin Feat selection.', 'Ολοκλήρωσε την πρόσθετη επιλογή Origin Feat του Human.') });
  if (d.classId === 'fighter' && !rules.fighterChoicesValid(e)) issues.push({ step: 'choices', key: 'fighterChoices', message: L('Choose one Fighting Style and three legal Weapon Masteries.', 'Επίλεξε ένα Fighting Style και τρία νόμιμα Weapon Masteries.') });
  if (d.backgroundId && !rules.bonusesValid(e)) issues.push({ step: 'abilities', key: 'backgroundBoosts', message: L('Assign legal Background ability boosts.', 'Ανάθεσε τις νόμιμες βελτιώσεις χαρακτηριστικών του Background.') });
  const wallet = rules.wallet(e);
  if (wallet.remaining < 0) issues.push({ step: 'equipment', key: 'overspent', message: L('Not enough starting gold for these purchases.', 'Τα αρχικά χρήματα δεν επαρκούν για τις αγορές.') });
  return issues;
}

export function fromCatalogClasses(base: ClassDef[]): ClassDef[] {
  const { catalog }=engine();
  return catalog.classes.map(raw=>{
    const previous=base.find(c=>c.id===raw.id);
    const sourceSub=raw.subclasses.map(s=>({id:s.id.replaceAll('-','_'), name:L(s.name), note:L('SRD 5.2.1 subclass','Subclass SRD 5.2.1')}));
    const skills=raw.skillChoices.flatMap(g=>g.options.map(o=>uiSkillId(o.id)));
    return {
      id:raw.id, name:previous?.name??L(raw.name), tagline:previous?.tagline??L(raw.name), description:previous?.description??L('2024 class','Κλάση 2024'),
      role:previous?.role??'martial', hitDie:raw.hitDie, primary:previous?.primary??['str'], complexity:previous?.complexity??2,
      spellcaster:previous?.spellcaster??false, subclassLevel:3, subclasses:sourceSub,
      skillPicks:raw.skillChoices.reduce((n,g)=>n+g.count,0), skillOptions:skills,
      armorTraining:previous?.armorTraining??[], weaponTraining:previous?.weaponTraining??[],
      choiceGroups:raw.id==='fighter' ? (previous?.choiceGroups??[]).filter(g=>g.id==='fighting_style') : [],
      hue:previous?.hue??220,glyph:previous?.glyph??'✧',artworkUrl:previous?.artworkUrl,
    };
  });
}
export function fromCatalogBackgrounds(base: Background[]): Background[] {
  const { catalog }=engine();
  return catalog.backgrounds.map(raw=>{
    const previous=base.find(b=>b.id===raw.id);
    return {
      id:raw.id,name:previous?.name??L(raw.name),
      description:previous?.description??L(`2024 ${raw.name} background.`, `Προέλευση ${raw.name} του 2024.`),
      skills:raw.proficiencies.filter(p=>p.id.startsWith('skill-')).map(p=>uiSkillId(p.id)),
      tool:L(raw.proficiencies.filter(p=>p.id.startsWith('tool-')).map(p=>p.name.replace('Tool: ','')).join(', ')||'—'),
      feat:L(raw.feat?.name||'—'),
      abilityBoostOptions:raw.abilityScores.map(p=>p.id as AbilityKey),languagesPick:0,
    };
  });
}
export function fromCatalogItems(base: Item[]): Item[] {
  return engine().catalog.equipment.map(raw=>{
    const old=base.find(i=>i.id===raw.id);
    const category=raw.category==='weapons'?'weapon':raw.category==='armor'?'armor':raw.category==='consumables'?'consumable':raw.category==='tools'?'gear':raw.category==='packs'?'gear':'gear';
    return { id:raw.id,name:old?.name??L(raw.name),category,
      subtype:raw.isPack?'pack':raw.categories?.join(' '),
      damage:raw.damage?.damage_dice,
      properties:raw.properties?.map(p=>p.name)||[],
      cost:raw.cost?`${raw.cost.amount} ${raw.cost.unit}`:undefined,
      weight:raw.weight===undefined||raw.weight===null?undefined:`${raw.weight} lb`,
      summary:old?.summary??L(raw.description?.join(' ')||raw.name),thumb:old?.thumb??'✦',thumbUrl:old?.thumbUrl,
      ...((raw.mastery?.name)?{rarity:undefined}:{}),
    } as Item;
  });
}
