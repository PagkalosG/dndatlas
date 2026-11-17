import test from 'node:test';
import assert from 'node:assert/strict';
import {
  abilityModifier, characterLevel, proficiencyBonus, mergeGrants,
  validateChoices, validateHandLoadout, deriveCorePreview,
} from '../packages/rules-engine/core-2024.mjs';

test('2024 ability modifier and proficiency bonus progression', () => {
  assert.equal(abilityModifier(8), -1);
  assert.equal(abilityModifier(13), 1);
  assert.equal(abilityModifier(16), 3);
  for (const [level, expected] of [[1, 2], [4, 2], [5, 3], [9, 4], [13, 5], [17, 6], [20, 6]]) {
    assert.equal(proficiencyBonus(level), expected);
  }
  assert.throws(() => abilityModifier(0), RangeError);
  assert.throws(() => proficiencyBonus(21), RangeError);
});

test('multiclass totals are validated and do not double count class identities', () => {
  assert.equal(characterLevel([{ classId: 'fighter', level: 3 }, { classId: 'wizard', level: 2 }]), 5);
  assert.throws(() => characterLevel([{ classId: 'fighter', level: 3 }, { classId: 'fighter', level: 2 }]), /Duplicate/);
  assert.throws(() => characterLevel([{ classId: 'fighter', level: 20 }, { classId: 'wizard', level: 1 }]), RangeError);
});

test('grant provenance is preserved when multiple legal sources grant a single proficiency', () => {
  assert.deepEqual(mergeGrants([
    { kind: 'proficiency', key: 'skill:perception', sourceId: 'class:ranger' },
    { kind: 'proficiency', key: 'skill:perception', sourceId: 'background:guide' },
    { kind: 'resistance', key: 'radiant', sourceId: 'species:aasimar' },
    { kind: 'proficiency', key: 'skill:perception', sourceId: 'class:ranger' },
  ]), [
    { kind: 'proficiency', key: 'skill:perception', sourceIds: ['class:ranger', 'background:guide'] },
    { kind: 'resistance', key: 'radiant', sourceIds: ['species:aasimar'] },
  ]);
});

test('builder choice counts and unavailable options are explained', () => {
  const choice = {
    minChoices: 2, maxChoices: 2,
    options: [{ id: 'a' }, { id: 'b' }, { id: 'c', disabledReason: 'Prerequisite not met' }],
  };
  assert.deepEqual(validateChoices(choice, ['a', 'b']), { valid: true });
  assert.equal(validateChoices(choice, ['a']).reason, 'MISSING_SELECTIONS');
  assert.equal(validateChoices(choice, ['a', 'a']).reason, 'DUPLICATE_SELECTION');
  assert.equal(validateChoices(choice, ['a', 'x']).reason, 'UNKNOWN_SELECTION');
  assert.equal(validateChoices(choice, ['a', 'c']).reason, 'DISABLED_SELECTION');
  assert.equal(validateChoices(choice, ['a', 'b', 'c']).reason, 'DISABLED_SELECTION');
});

test('two-handed weapon cannot be wielded while a shield is equipped', () => {
  assert.equal(validateHandLoadout({ weapon: { id: 'greatsword', twoHanded: true }, shieldEquipped: true }).valid, false);
  assert.equal(validateHandLoadout({ weapon: { id: 'spear', twoHanded: false }, shieldEquipped: true }).valid, true);
  assert.equal(validateHandLoadout({ weapon: { id: 'greatsword', twoHanded: true }, shieldEquipped: false }).valid, true);
});

test('Borruk Fighter 3 preview calculates fixed derived properties without dice rolls', () => {
  const result = deriveCorePreview({
    rulesetId: 'dnd5e-2024',
    abilityScores: { str: 16, dex: 10, con: 13, int: 8, wis: 12, cha: 12 },
    classLevels: [{ classId: 'fighter', level: 3 }],
    grants: [
      { kind: 'proficiency', key: 'skill:perception', sourceId: 'class:fighter' },
      { kind: 'proficiency', key: 'tool:smiths', sourceId: 'subclass:battle-master' },
    ],
    loadout: { weapon: { id: 'greatsword', twoHanded: true }, shieldEquipped: true },
  });
  assert.equal(result.level, 3);
  assert.equal(result.proficiencyBonus, 2);
  assert.deepEqual(result.abilityModifiers, { str: 3, dex: 0, con: 1, int: -1, wis: 1, cha: 1 });
  assert.equal(result.loadout.warnings[0].code, 'TWO_HANDED_SHIELD_CONFLICT');
  assert.equal(result.grants.length, 2);
});

test('the preview never silently accepts a non-2024 ruleset', () => {
  assert.throws(() => deriveCorePreview({
    rulesetId: 'dnd5e-2014',
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    classLevels: [{ classId: 'fighter', level: 1 }],
  }), /Only the 2024 ruleset/);
});
