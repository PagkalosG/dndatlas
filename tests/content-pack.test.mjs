import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { validateContentPack, canonicalContentRef, PACK_MAX_BYTES } from '../packages/content-packs/validate-pack.mjs';

const example = JSON.parse(fs.readFileSync(new URL('../content/examples/starward-homebrew-2024.json', import.meta.url), 'utf8'));
const clone = () => structuredClone(example);

test('example pack includes independently typed subclass/species/background/feat/spell/item/feature/option', () => {
  const result = validateContentPack(example);
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
  for (const kind of ['subclass','species','background','feat','spell','item','feature','option'])
    assert.equal(result.summary.byKind[kind], 1, kind);
});

test('pack must be 2024, campaign-only and rights-attested', () => {
  for (const change of [
    p => { p.pack.ruleset = 'dnd5e-2014'; },
    p => { p.pack.scope = 'global'; },
    p => { p.pack.license.rightToShare = false; },
    p => { p.pack.license.basis = 'licensed'; },
  ]) { const p = clone(); change(p); assert.equal(validateContentPack(p).valid, false); }
});

test('rejects duplicate definitions, unresolved local refs and executable effects', () => {
  let p = clone(); p.entries.push(structuredClone(p.entries[0]));
  assert.equal(validateContentPack(p).valid, false);
  p = clone(); p.entries[1].progression[0].features = ['@feature:missing'];
  assert.match(validateContentPack(p).errors.join(' '), /unresolved local reference/);
  p = clone(); p.entries[0].effects[0].script = 'eval("malware")';
  assert.match(validateContentPack(p).errors.join(' '), /executable rules/);
  p = clone(); p.entries[0].effects[0].type = 'RUN_JAVASCRIPT';
  assert.match(validateContentPack(p).errors.join(' '), /unknown effect/);
});

test('prevents 2014 species ability modifiers and non-2024 subclass levels', () => {
  let p=clone(); p.entries.find(e => e.kind === 'species').data.abilityScoreIncreases = { str: 2 };
  assert.equal(validateContentPack(p).valid, false);
  p=clone(); p.entries.find(e => e.kind === 'subclass').data.startLevel = 1;
  assert.match(validateContentPack(p).errors.join(' '), /class level 3/);
});

test('rejects oversized packs and embedded/hotlinked images', () => {
  let p=clone();p.entries[0].summary.en='x'.repeat(PACK_MAX_BYTES);
  assert.equal(validateContentPack(p).valid, false);
  p=clone();p.assets=[{id:'art',mediaType:'image/png',url:'https://untrusted.test/official-art.png'}];
  assert.match(validateContentPack(p).errors.join(' '), /external links/);
});

test('Greek translations are optional but missing ones are explicitly flagged', () => {
  const p=clone();delete p.entries[0].name.el;
  const r=validateContentPack(p);
  assert.equal(r.valid,true);assert.ok(r.warnings.some(x=>x.includes('missing EL')));
});

test('IDs resolve deterministically and foreign packs cannot be resolved implicitly', () => {
  assert.equal(canonicalContentRef('@feature:star-bond','campaign:c1:starward:1'), 'campaign:c1:starward:1:feature:star-bond');
  assert.equal(canonicalContentRef('srd:class:fighter','unused'), 'srd-5-2-2024-api:class:fighter');
  assert.throws(() => canonicalContentRef('pack:other:subclass:foreign','unused'), /dependency/);
});

test('no prototype pollution keys or undefined input pass validation', () => {
  assert.equal(validateContentPack(null).valid,false);
  assert.equal(validateContentPack('{broken').valid,false);
  const malicious = JSON.stringify(example).replace('"format":','"__proto__": {"polluted": true}, "format":');
  assert.equal(validateContentPack(malicious).valid,false);
});
