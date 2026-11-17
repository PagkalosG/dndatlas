'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../apps/web-v2');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'components/campaign-libraries.js'),'utf8'),sandbox);
const ui=sandbox.window.ATLAS_V2_LIBRARY_UI;
const pack=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../content/examples/starward-homebrew-2024.json'),'utf8'));

test('only DM sees campaign library UI; player and co-DM cannot upload in prototype',()=>{
  assert.equal(ui.render({role:'player',locale:'en'}),'');
  assert.equal(ui.render({role:'co_dm',locale:'el'}),'');
  const html=ui.render({role:'dm',locale:'en'});
  assert.match(html,/SRD 5.2.1/);
  assert.match(html,/id="library-json-file"/);
  assert.match(html,/Preview only/);
  assert.doesNotMatch(html,/installed in D1|activation successful/);
});

test('English and Greek share translated UI keys',()=>{
  assert.deepEqual(Object.keys(ui.dictionary.en).sort(),Object.keys(ui.dictionary.el).sort());
  const el=ui.render({role:'dm',locale:'el'});
  assert.match(el,/ΒΙΒΛΙΟΘΗΚΕΣ/);
  assert.match(el,/Μόνο προεπισκόπηση/);
});

test('original 2024 JSON sample previews without network calls',()=>{
  const data=JSON.stringify(pack);
  const preview=ui.inspectJSON(data,Buffer.byteLength(data,'utf8'));
  assert.equal(preview.valid,true);
  assert.equal(preview.count,8);
  assert.equal(preview.byKind.subclass,1);
  assert.match(ui.render({role:'dm',preview,rights:true}),/data-action="library-demo-stage"/);
});

test('wrong edition and oversized JSON are blocked before staging',()=>{
  const data=structuredClone(pack);data.pack.ruleset='dnd5e-2014';
  assert.equal(ui.inspectJSON(JSON.stringify(data),1200).error,'edition');
  assert.equal(ui.inspectJSON('{}',600000).error,'tooBig');
});

test('untrusted pack names are escaped before rendering',()=>{
  const html=ui.render({role:'dm',locale:'en',preview:{valid:true,name:'<img src=x onerror=alert(1)>',version:'1.0.0',count:1,byKind:{spell:1}},rights:true});
  assert.doesNotMatch(html,/<img src=x/);
  assert.match(html,/&lt;img/);
});

test('UI never uploads files, relies on server for real authorization',()=>{
  const code=fs.readFileSync(path.join(root,'components/campaign-libraries.js'),'utf8');
  assert.doesNotMatch(code,/\bfetch\s*\(|XMLHttpRequest|new WebSocket\s*\(/);
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  assert.match(app,/libraryUI\.render/);
  assert.match(app,/library-json-file/);
});
