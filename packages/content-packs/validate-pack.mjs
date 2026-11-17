/**
 * D&D Atlas 2.0 — validation contract for campaign-scoped content packs.
 * Pure module: no network, SQL or dynamic evaluation. This validates shape,
 * NOT content legality, WotC rights, source entitlements or full game mechanics.
 */
export const PACK_FORMAT = 'dndatlas.content-pack';
export const PACK_SCHEMA_VERSION = 1;
export const PACK_MAX_BYTES = 512 * 1024;
export const PACK_MAX_ENTRIES = 200;

export const ENTRY_KINDS = Object.freeze([
  'class', 'subclass', 'species', 'background', 'feat', 'spell', 'item',
  'feature', 'skill', 'tool', 'condition', 'monster', 'rule', 'option',
]);

export const OPTION_SUBTYPES = Object.freeze([
  'fighting_style', 'maneuver', 'metamagic', 'invocation', 'weapon_mastery',
  'language', 'class_choice', 'equipment_choice', 'spell_list', 'resource',
  'species_trait', 'class_progression', 'crafting', 'bastion', 'other',
]);

export const EFFECT_TYPES = Object.freeze([
  'GRANT_PROFICIENCY', 'GRANT_FEATURE', 'GRANT_SPELL', 'GRANT_RESISTANCE',
  'ADD_SENSE', 'MODIFY_SPEED', 'MODIFY_STAT', 'CREATE_RESOURCE',
  'MODIFY_ATTACK', 'GRANT_WEAPON_MASTERY', 'APPLY_CONDITION', 'GRANT_CHOICE',
]);

const SLUG = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;
const REF = /^(?:@(class|subclass|species|background|feat|spell|item|feature|skill|tool|condition|monster|rule|option):[a-z][a-z0-9-]*|srd:(class|subclass|species|background|feat|spell|item|feature|skill|tool|condition|monster|rule|option):[a-z][a-z0-9-]*|pack:[a-z][a-z0-9-]*:(class|subclass|species|background|feat|spell|item|feature|skill|tool|condition|monster|rule|option):[a-z][a-z0-9-]*)$/;
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const bounded = (x, min, max) => Number.isInteger(x) && x >= min && x <= max;
const goodString = (x, max = 160) => typeof x === 'string' && x.trim().length > 0 && x.length <= max;
const safeId = (x) => typeof x === 'string' && x.length <= 64 && SLUG.test(x);
const validRef = (x) => typeof x === 'string' && x.length <= 160 && REF.test(x);

function validateTree(value, errors, path = '$', depth = 0) {
  if (depth > 18) { errors.push(`${path}: nesting exceeds 18`); return; }
  if (typeof value === 'number' && !Number.isFinite(value)) errors.push(`${path}: invalid number`);
  if (typeof value === 'string' && value.length > 12000) errors.push(`${path}: text too long`);
  if (Array.isArray(value)) {
    if (value.length > 256) errors.push(`${path}: array has too many values`);
    value.forEach((v, i) => validateTree(v, errors, `${path}[${i}]`, depth + 1));
  } else if (object(value)) {
    const keys = Object.keys(value);
    if (keys.length > 80) errors.push(`${path}: object has too many keys`);
    for (const key of keys) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) errors.push(`${path}: reserved key ${key}`);
      validateTree(value[key], errors, `${path}.${key}`, depth + 1);
    }
  }
}

function localRefs(value, into = [], path = '$', depth = 0) {
  if (depth > 18) return into;
  if (typeof value === 'string' && value.startsWith('@')) into.push({ ref: value, path });
  else if (Array.isArray(value)) value.forEach((v, i) => localRefs(v, into, `${path}[${i}]`, depth + 1));
  else if (object(value)) Object.entries(value).forEach(([k, v]) => localRefs(v, into, `${path}.${k}`, depth + 1));
  return into;
}

function checkLocalized(value, path, errors, required = true) {
  if (!object(value)) {
    if (required) errors.push(`${path}: expected {en, el?}`);
    return;
  }
  if (!goodString(value.en, 250)) errors.push(`${path}.en: required English text (max 250)`);
  if (value.el != null && !goodString(value.el, 250)) errors.push(`${path}.el: invalid Greek text`);
}

function checkEffects(effects, path, errors) {
  if (effects === undefined) return;
  if (!Array.isArray(effects) || effects.length > 64) { errors.push(`${path}: expected up to 64 effects`); return; }
  for (const [i, e] of effects.entries()) {
    const loc = `${path}[${i}]`;
    if (!object(e) || !EFFECT_TYPES.includes(e.type)) { errors.push(`${loc}: unknown effect type`); continue; }
    if (!object(e.parameters)) errors.push(`${loc}.parameters: object required`);
    if (e.atClassLevel !== undefined && !bounded(e.atClassLevel, 1, 20)) errors.push(`${loc}.atClassLevel: must be 1–20`);
    if (e.when !== undefined && !object(e.when)) errors.push(`${loc}.when: declarative object required`);
    // Import accepts declarative shapes only. Runtime execution is gated by the Worker rules engine.
    if (e.script !== undefined || e.code !== undefined || e.expression !== undefined) errors.push(`${loc}: executable rules are forbidden`);
  }
}

function checkChoices(choices, path, errors) {
  if (choices === undefined) return;
  if (!Array.isArray(choices) || choices.length > 40) { errors.push(`${path}: expected up to 40 choices`); return; }
  const keys = new Set();
  for (const [i, c] of choices.entries()) {
    const loc = `${path}[${i}]`;
    if (!object(c) || !safeId(c.id)) { errors.push(`${loc}.id: invalid choice ID`); continue; }
    if (keys.has(c.id)) errors.push(`${loc}.id: repeated choice ID`);
    keys.add(c.id);
    if (!bounded(c.min, 0, 20) || !bounded(c.max, c.min ?? 0, 20)) errors.push(`${loc}: invalid choice count`);
    if (!Array.isArray(c.options) || !c.options.length || c.options.length > 64) errors.push(`${loc}.options: expected 1–64 options`);
    else for (const [j, opt] of c.options.entries()) if (!validRef(opt)) errors.push(`${loc}.options[${j}]: invalid content ref`);
    checkLocalized(c.label, `${loc}.label`, errors);
  }
}

function checkProgression(progression, path, errors) {
  if (progression === undefined) return;
  if (!Array.isArray(progression) || progression.length > 20) { errors.push(`${path}: expected up to 20 level grants`); return; }
  const levels = new Set();
  for (const [i, row] of progression.entries()) {
    const loc = `${path}[${i}]`;
    if (!object(row) || !bounded(row.level, 1, 20)) { errors.push(`${loc}.level: required 1–20`); continue; }
    if (levels.has(row.level)) errors.push(`${loc}: duplicate progression level`);
    levels.add(row.level);
    checkEffects(row.effects, `${loc}.effects`, errors);
    if (row.features !== undefined && (!Array.isArray(row.features) || row.features.some(v => !validRef(v)))) errors.push(`${loc}.features: invalid references`);
    checkChoices(row.choices, `${loc}.choices`, errors);
  }
}

function checkEntry(e, i, errors, warnings, seen) {
  const at = `entries[${i}]`;
  if (!object(e)) { errors.push(`${at}: expected object`); return; }
  if (!ENTRY_KINDS.includes(e.kind)) errors.push(`${at}.kind: unknown content kind`);
  if (!safeId(e.id)) errors.push(`${at}.id: invalid content ID`);
  const key = `${e.kind}:${e.id}`;
  if (seen.has(key)) errors.push(`${at}: repeated ${key}`);
  seen.add(key);
  checkLocalized(e.name, `${at}.name`, errors);
  if (e.summary !== undefined) checkLocalized(e.summary, `${at}.summary`, errors);
  if (!e.name?.el) warnings.push(`${at}: missing EL translation; label as untranslated in Greek UI`);
  if (!object(e.data)) errors.push(`${at}.data: structured data is required`);
  else {
    const d = e.data;
    switch (e.kind) {
      case 'subclass':
        if (!validRef(d.parentClassRef)) errors.push(`${at}.data.parentClassRef: required`);
        if (d.startLevel !== 3) errors.push(`${at}.data.startLevel: 2024 subclass choices start at class level 3`);
        break;
      case 'class':
        if (![6, 8, 10, 12].includes(d.hitDie)) errors.push(`${at}.data.hitDie: must be 6, 8, 10 or 12`);
        if (!Array.isArray(d.savingThrows) || d.savingThrows.length !== 2 || d.savingThrows.some(a => !['str','dex','con','int','wis','cha'].includes(a))) errors.push(`${at}.data.savingThrows: choose two abilities`);
        break;
      case 'species':
        if (!bounded(d.speed, 0, 120)) errors.push(`${at}.data.speed: required feet movement`);
        if (!Array.isArray(d.sizes) || !d.sizes.length || d.sizes.some(s => !['Small', 'Medium', 'Large'].includes(s))) errors.push(`${at}.data.sizes: invalid`);
        if ('abilityScoreIncreases' in d) errors.push(`${at}.data: 2024 ability increases belong to background, not species`);
        break;
      case 'background':
        if (!Array.isArray(d.abilityOptions) || d.abilityOptions.length !== 3 || d.abilityOptions.some(a => !['str','dex','con','int','wis','cha'].includes(a))) errors.push(`${at}.data.abilityOptions: exactly 3 abilities required`);
        if (!validRef(d.originFeatRef)) errors.push(`${at}.data.originFeatRef: required`);
        break;
      case 'feat':
        if (!['origin','general','fighting_style','epic_boon'].includes(d.category)) errors.push(`${at}.data.category: invalid feat category`);
        break;
      case 'spell':
        if (!bounded(d.level, 0, 9) || !goodString(d.school, 50) || !goodString(d.castingTime, 120)) errors.push(`${at}.data: spell requires level, school and castingTime`);
        break;
      case 'item':
        if (!['weapon','armor','consumable','adventuring','tool','magic_item','currency'].includes(d.category)) errors.push(`${at}.data.category: invalid item category`);
        if (d.cost !== undefined && (!object(d.cost) || !bounded(d.cost.amount, 0, 100000000) || !['cp','sp','ep','gp','pp'].includes(d.cost.unit))) errors.push(`${at}.data.cost: invalid price`);
        if (d.rarity !== undefined && !['common','uncommon','rare','very_rare','legendary','artifact'].includes(d.rarity)) errors.push(`${at}.data.rarity: invalid rarity`);
        break;
      case 'option':
        if (!OPTION_SUBTYPES.includes(d.subtype)) errors.push(`${at}.data.subtype: unknown choice kind`);
        break;
    }
  }
  if (e.artwork !== undefined && e.artwork !== null && (!safeId(e.artwork) || e.artwork.length > 64)) errors.push(`${at}.artwork: must reference an uploaded asset ID`);
  checkChoices(e.choices, `${at}.choices`, errors);
  checkEffects(e.effects, `${at}.effects`, errors);
  checkProgression(e.progression, `${at}.progression`, errors);
  if (e.requirements !== undefined && !Array.isArray(e.requirements)) errors.push(`${at}.requirements: expected predicate list`);
}

export function validateContentPack(input) {
  const errors = [], warnings = [], ids = new Set();
  let parsed = input;
  if (typeof input === 'string') {
    if (new TextEncoder().encode(input).length > PACK_MAX_BYTES) return { valid: false, errors: ['JSON exceeds 512 KiB'], warnings };
    try { parsed = JSON.parse(input); } catch { return { valid: false, errors: ['Invalid JSON'], warnings }; }
  }
  if (!object(parsed)) return { valid: false, errors: ['Expected a JSON object'], warnings };
  try {
    if (new TextEncoder().encode(JSON.stringify(parsed)).length > PACK_MAX_BYTES) errors.push('Pack exceeds 512 KiB');
  } catch { errors.push('JSON cannot be serialized'); }
  validateTree(parsed, errors);
  if (parsed.format !== PACK_FORMAT) errors.push('format must be dndatlas.content-pack');
  if (parsed.schemaVersion !== PACK_SCHEMA_VERSION) errors.push('schemaVersion must be 1');
  if (!object(parsed.pack)) errors.push('pack: metadata required');
  else {
    const p = parsed.pack;
    if (!safeId(p.id)) errors.push('pack.id: invalid slug');
    if (!SEMVER.test(p.version ?? '')) errors.push('pack.version: semantic version required');
    if (p.ruleset !== 'dnd5e-2024') errors.push('pack.ruleset: 2024 only');
    if (p.scope !== 'campaign') errors.push('pack.scope: only campaign libraries supported');
    checkLocalized(p.name, 'pack.name', errors);
    if (!object(p.license) || !['original','licensed','cc-by'].includes(p.license.basis) || p.license.rightToShare !== true) {
      errors.push('pack.license: DM must attest rights for campaign sharing');
    }
    if (p.license?.basis === 'licensed' && !goodString(p.license.reference, 500)) errors.push('pack.license.reference: required for licensed works');
    if (p.dependencies !== undefined) {
      if (!Array.isArray(p.dependencies) || p.dependencies.length > 20 || p.dependencies.some(d => !object(d) || !goodString(d.sourceId, 160))) errors.push('pack.dependencies: invalid');
    }
  }
  if (!Array.isArray(parsed.entries) || parsed.entries.length > PACK_MAX_ENTRIES || !parsed.entries.length) errors.push('entries: expected 1–200 entries');
  else {
    parsed.entries.forEach((e, i) => checkEntry(e, i, errors, warnings, ids));
    for (const { ref, path } of localRefs(parsed.entries)) if (!ids.has(ref.slice(1))) errors.push(`${path}: unresolved local reference ${ref}`);
  }
  if (parsed.assets !== undefined) {
    if (!Array.isArray(parsed.assets) || parsed.assets.length > 80) errors.push('assets: maximum 80 asset descriptors');
    else {
      const seen = new Set();
      for (const [i, asset] of parsed.assets.entries()) {
        if (!object(asset) || !safeId(asset.id) || !['image/png','image/jpeg','image/webp','image/svg+xml'].includes(asset.mediaType)) errors.push(`assets[${i}]: invalid asset descriptor`);
        if (asset?.url || asset?.data || asset?.base64) errors.push(`assets[${i}]: embedded images and external links are not allowed in packs`);
        if (asset?.id && seen.has(asset.id)) errors.push(`assets[${i}]: duplicate asset ID`);
        seen.add(asset?.id);
      }
    }
  }
  const kinds = {};
  if (Array.isArray(parsed.entries)) for (const e of parsed.entries) if (e && typeof e.kind === 'string') kinds[e.kind] = (kinds[e.kind] ?? 0) + 1;
  return { valid: errors.length === 0, errors, warnings, summary: { packId: parsed.pack?.id ?? null, version: parsed.pack?.version ?? null, entryCount: parsed.entries?.length ?? 0, byKind: kinds } };
}

// Canonical references are resolved only after server-side dependency, entitlement and scope checks.
export function canonicalContentRef(ref, packSourceId) {
  if (!validRef(ref)) throw new Error('Invalid content reference');
  if (ref.startsWith('@')) return `${packSourceId}:${ref.slice(1)}`;
  if (ref.startsWith('srd:')) return `srd-5-2-2024-api:${ref.slice(4)}`;
  throw new Error('Cross-pack references must resolve via an installed dependency');
}
