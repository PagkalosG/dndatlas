'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const web = path.resolve(__dirname, '../apps/web-v2');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(web, 'data.js'), 'utf8'), context);
const fixtures = context.window.ATLAS_V2_DEMO;

test('2024 Builder concept has 10 species, 12 classes and exactly one clearly locked PHB-only choice', () => {
  assert.equal(fixtures.species.length, 10);
  assert.equal(fixtures.classes.length, 12);
  assert.equal(fixtures.species.filter((item) => !item.licensed).length, 1);
  const aasimar = fixtures.species.find((item) => item.id === 'aasimar');
  assert.ok(aasimar);
  assert.equal(aasimar.licensed, false);
  assert.equal(aasimar.source, 'PHB 2024');
});

test('every selectable card has English, Greek, summary and original art available', () => {
  for (const group of ['species', 'classes', 'backgrounds', 'equipment']) {
    for (const item of fixtures[group]) {
      assert.ok(item.title.en && item.title.el, `${group}: missing translation`);
      assert.ok(item.description.en && item.description.el, `${group}: missing explanation`);
      assert.ok(fs.existsSync(path.join(web, item.art)), `${group}: missing art ${item.art}`);
      const content = fs.readFileSync(path.join(web, item.art), 'utf8');
      assert.match(content, /<svg/);
      assert.doesNotMatch(content, /<script\b/i);
    }
  }
});

test('UI dictionaries share exactly the same EN and EL translation keys', () => {
  assert.deepEqual(Object.keys(fixtures.strings.en).sort(), Object.keys(fixtures.strings.el).sort());
  for (const key of Object.keys(fixtures.strings.en)) {
    assert.ok(fixtures.strings.en[key] && fixtures.strings.el[key], key);
  }
});

test('mock app has no network calls, dice roll component or authorizing client role checks', () => {
  const app = fs.readFileSync(path.join(web,'app.js'),'utf8');
  assert.doesNotMatch(app, /\bfetch\s*\(|XMLHttpRequest|new WebSocket\s*\(/);
  assert.doesNotMatch(app, /rollDice|diceRoller|Math\.random\s*\(/i);
  assert.match(app, /on\('click'|addEventListener\('click'/);
  assert.match(app, /data-action="submit/);
  assert.match(app, /saveDraft/);
});

test('prototype never changes the legacy production entrypoint', () => {
  assert.ok(fs.existsSync(path.join(web,'index.html')));
  assert.match(fs.readFileSync(path.join(web,'README.md'),'utf8'), /not referenced by the existing GitHub Pages production workflow/);
});
