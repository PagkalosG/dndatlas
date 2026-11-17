// D&D Atlas 2.0 — pure, partial rules core for D&D 5e 2024.
// No dice rolling UI, no API calls, and no implicit 2014 feature fallback.
// Server-side authoritative rules validation must wrap this with campaign and
// content-source permissions before any character mutation is accepted.

const ABILITIES = Object.freeze(['str', 'dex', 'con', 'int', 'wis', 'cha']);
const REQUIRE_INT = (value, min, max, label) => {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} must be an integer between ${min} and ${max}`);
  }
  return value;
};

export function abilityModifier(score) {
  return Math.floor((REQUIRE_INT(score, 1, 30, 'Ability score') - 10) / 2);
}

export function characterLevel(classLevels) {
  if (!Array.isArray(classLevels) || classLevels.length < 1) {
    throw new TypeError('At least one class level is required');
  }
  let total = 0;
  const seen = new Set();
  for (const group of classLevels) {
    if (!group || typeof group.classId !== 'string' || !group.classId.trim()) {
      throw new TypeError('Every class level entry requires a classId');
    }
    if (seen.has(group.classId)) throw new Error('Duplicate class record: ' + group.classId);
    seen.add(group.classId);
    total += REQUIRE_INT(group.level, 1, 20, 'Class level');
  }
  return REQUIRE_INT(total, 1, 20, 'Character level');
}

export function proficiencyBonus(level) {
  return 2 + Math.floor((REQUIRE_INT(level, 1, 20, 'Character level') - 1) / 4);
}

export function mergeGrants(grants) {
  if (!Array.isArray(grants)) throw new TypeError('Grants must be an array');
  const items = new Map();
  for (const grant of grants) {
    const { kind, key, sourceId } = grant || {};
    if (!['proficiency', 'resistance', 'spell', 'feature'].includes(kind)
      || typeof key !== 'string' || !key.trim()
      || typeof sourceId !== 'string' || !sourceId.trim()) {
      throw new TypeError('A grant requires a supported kind, key and sourceId');
    }
    const index = `${kind}:${key}`;
    if (!items.has(index)) items.set(index, { kind, key, sourceIds: [] });
    const item = items.get(index);
    if (!item.sourceIds.includes(sourceId)) item.sourceIds.push(sourceId);
  }
  return [...items.values()];
}

export function validateChoices(choices, selectedIds) {
  if (!Array.isArray(choices) || !Array.isArray(selectedIds)) {
    throw new TypeError('Choices and selection must be arrays');
  }
  const chosen = new Set(selectedIds);
  if (chosen.size !== selectedIds.length) return { valid: false, reason: 'DUPLICATE_SELECTION' };
  const allowed = new Set(choices.map(item => item.id));
  const unavailable = selectedIds.filter(id => !allowed.has(id));
  if (unavailable.length) return { valid: false, reason: 'UNKNOWN_SELECTION', unavailable };
  const minimum = choices.minimum ?? 0;
  const maximum = choices.maximum ?? choices.length;
  if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum < 0 || maximum < minimum) {
    throw new TypeError('Invalid choice bounds');
  }
  if (chosen.size < minimum) return { valid: false, reason: 'MISSING_SELECTIONS', remaining: minimum - chosen.size };
  if (chosen.size > maximum) return { valid: false, reason: 'TOO_MANY_SELECTIONS', exceeded: chosen.size - maximum };
  return { valid: true };
}

export function validateHandLoadout({ weapon, shieldEquipped = false } = {}) {
  if (!weapon || !shieldEquipped) return { valid: true, warnings: [] };
  const usesTwoHands = weapon.twoHanded === true;
  if (usesTwoHands) return {
    valid: false,
    warnings: [{ code: 'TWO_HANDED_SHIELD_CONFLICT', weaponId: weapon.id ?? null }],
  };
  return { valid: true, warnings: [] };
}

export function deriveCorePreview({ rulesetId, abilityScores, classLevels, grants = [], loadout } = {}) {
  if (rulesetId !== 'dnd5e-2024') throw new Error('Only the 2024 ruleset is supported');
  if (!abilityScores || typeof abilityScores !== 'object') throw new TypeError('Missing ability scores');
  const abilities = Object.fromEntries(ABILITIES.map(a => [a, abilityModifier(abilityScores[a])]));
  const level = characterLevel(classLevels);
  return {
    rulesetId,
    level,
    proficiencyBonus: proficiencyBonus(level),
    abilityModifiers: abilities,
    grants: mergeGrants(grants),
    loadout: validateHandLoadout(loadout),
  };
}
