import assert from 'node:assert/strict';
import test from 'node:test';
import {
  API_BASE, COLLECTIONS, normalizeResource, serializeCollection, import2024,
} from '../content/importers/srd-2024.mjs';

test('only 2024 namespaces, fixed contract categories, and no 2014 contamination', () => {
  assert.equal(API_BASE, 'https://www.dnd5eapi.co/api/2024');
  assert.deepEqual(Object.keys(COLLECTIONS), ['classes', 'species', 'backgrounds', 'feats', 'subclasses']);
  assert.throws(() => normalizeResource('classes',
    { index: 'fighter', url: '/api/2014/classes/fighter' },
    { index: 'fighter', name: 'Fighter' }), /Unexpected 2024/);
  assert.throws(() => normalizeResource('classes',
    { index: 'fighter', url: 'https://evil.test/evil' },
    { index: 'fighter', name: 'Fighter' }), /Unexpected 2024/);
});

test('draft import contains EN source attribution but no claimed rules validation', () => {
  const row = normalizeResource('classes',
    { index: 'fighter', url: '/api/2024/classes/fighter' },
    { index: 'fighter', name: "Fighter's Creed", desc: ['Demo test'], hit_die: 10 });
  const sql = serializeCollection('classes', [row]);
  assert.match(sql, /content_sources/);
  assert.match(sql, /CC_BY_4_0/);
  assert.match(sql, /'restricted'/);
  assert.match(sql, /'draft'/);
  assert.match(sql, /Fighter''s Creed/);
  assert.match(sql, /validated/);
  assert.match(sql, /'en'/);
  assert.doesNotMatch(sql, /content_translations.*'el'/);
  assert.equal(sql, serializeCollection('classes', [row]));
});

test('imports a verified four-item 2024 background fixture deterministically', async () => {
  const slugs = ['acolyte', 'criminal', 'sage', 'soldier'];
  const response = (obj) => ({ ok: true, json: async () => obj });
  const requests = [];
  const fixtures = new Map();
  fixtures.set(API_BASE, { index: { backgrounds: '/api/2024/backgrounds' } });
  fixtures.set(`${API_BASE}/backgrounds`, {
    results: slugs.map(index => ({ index, url: `/api/2024/backgrounds/${index}`, name: index })),
  });
  for (const slug of slugs) {
    fixtures.set(`${API_BASE}/backgrounds/${slug}`, {
      index: slug, name: slug.toUpperCase(), url: `/api/2024/backgrounds/${slug}`,
      feature: 'fixture-only',
    });
  }
  const fetchImpl = async (url) => {
    requests.push(url);
    assert.ok(url.startsWith(API_BASE), url);
    const obj = fixtures.get(url);
    assert.ok(obj, url);
    return response(obj);
  };
  const { files, manifest } = await import2024({ fetchImpl, collections: ['backgrounds'] });
  assert.equal(manifest.total, 4);
  assert.equal(manifest.isValidatedRulesContent, false);
  assert.equal(requests.length, 6);
  assert.match(files['backgrounds.sql'], /'background:acolyte'/);
  assert.match(files['backgrounds.sql'], /'background:soldier'/);
});

test('upstream collection count drift blocks staging import', async () => {
  const fetchImpl = async (url) => {
    if (url === API_BASE) return { ok: true, json: async () => ({ index: { species: '/api/2024/species' } }) };
    if (url === `${API_BASE}/species`) return { ok: true, json: async () => ({ results: [] }) };
    throw new Error('Unexpected request');
  };
  await assert.rejects(import2024({ fetchImpl, collections: ['species'] }), /count changed/);
});

test('untrusted detail URL is rejected', () => {
  assert.throws(() => normalizeResource('species',
    { index: 'elf', url: '/api/2024/species/elf' },
    { index: 'elf', name: 'Elf', url: '/api/2014/species/elf' }), /mismatch/);
});
