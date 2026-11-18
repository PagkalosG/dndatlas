'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname,'..','apps','web-v2');
const context={window:{ATLAS_V2_CHARACTER_SHEET:{
  SKILLS:[['athletics','str','Athletics','Αθλητισμός']],
  ALIGNMENTS:[['neutral-good','Neutral Good','Ουδέτερος Καλός']],
  derived:()=>({hp:22,ac:16,initiative:2,pb:2,armor:null,ability:{
    str:{modifier:3,total:16},dex:{modifier:2,total:14},con:{modifier:1,total:13},
    int:{modifier:0,total:10},wis:{modifier:0,total:10},cha:{modifier:0,total:10}
  },grants:[{id:'skill-athletics'}]}),
  attackRows:()=>[{name:'Spear',bonus:5,damage:'1d6+3',damageType:'Piercing',mastery:'Sap'}],
  ownedArmor:()=>[]
},ATLAS_V2_ORIGINS:{MASTERY:{},MASTERIES:{sap:{en:'Disadvantage on next attack.',el:'Disadvantage στην επόμενη επίθεση.'}},FEATS:{}},
 ATLAS_V2_IDENTITY_V2:{traitCopy:{human:[['Skillful','Choose a Skill.','Επίλεξε Skill.']]}}}};
vm.runInNewContext(fs.readFileSync(path.join(root,'components','gameplay-v2.js'),'utf8'),context,{filename:'gameplay-v2.js'});
const ui=context.window.ATLAS_V2_PLAY;
const builder={classInfo:()=>({savingThrows:[{id:'str'}]}),backgroundInfo:()=>({feat:null}),wallet:()=>({remaining:300}),gb:()=> '3 GP',
  itemById:new Map([['spear',{id:'spear',category:'weapons',name:'Spear'}]])};
const insights={contents:()=>new Map([['spear',{id:'spear',quantity:2,sources:[{label:'Class'}]}]])};
const draft={name:'Borruk',species:'human',class:'fighter',background:'soldier',customItems:[],abilities:[16,14,13,10,10,10],portraitData:null};
const ctx={draft,builder,insights,level:3};
test('local gameplay defaults and HP/rest rules cannot go below zero or above base HP',()=>{
  const s=ui.defaults();
  assert.equal(s.hpCurrent,null);
  assert.equal(ui.adjust(s,'game-hp-minus',null,ctx),true);
  assert.equal(s.hpCurrent,21);
  for(let i=0;i<200;i++)ui.adjust(s,'game-hp-minus',null,ctx);
  assert.equal(s.hpCurrent,0);
  ui.adjust(s,'game-hp-plus',null,ctx);assert.equal(s.hpCurrent,1);
  ui.adjust(s,'game-long-rest',null,ctx);assert.equal(s.hpCurrent,22);
  assert.equal(s.longRests,1);
  assert.equal(s.deathSuccess,0);
});
test('conditions are toggleable and death saves have bounded counters',()=>{
  const s=ui.defaults();
  assert.equal(ui.adjust(s,'game-toggle-condition','Poisoned',ctx),true);
  assert.equal(s.conditions.includes('Poisoned'),true);
  ui.adjust(s,'game-toggle-condition','Poisoned',ctx);assert.equal(s.conditions.length,0);
  assert.equal(ui.adjust(s,'game-toggle-condition','DangerousFakeStatus',ctx),false);
  for(let i=0;i<3;i++)ui.adjust(s,'game-death-success',null,ctx);
  assert.equal(s.deathSuccess,3);
});
test('inventory quantity cannot be spent below zero or restored beyond base',()=>{
 const s=ui.defaults();
 assert.equal(ui.remainingItem(2,999),0);
 assert.equal(ui.adjust(s,'game-item-use','spear',ctx),true);
 assert.equal(ui.adjust(s,'game-item-use','spear',ctx),true);
 assert.equal(s.inventoryUsed.spear,2);
 ui.adjust(s,'game-item-use','spear',ctx);assert.equal(s.inventoryUsed.spear,2);
 ui.adjust(s,'game-item-restore','spear',ctx);assert.equal(s.inventoryUsed.spear,1);
 assert.equal(ui.adjust(s,'game-item-use','unknown',ctx),false);
});
test('spell slots are manual, and action never creates slots automatically',()=>{
 const s=ui.defaults();assert.deepEqual(Object.keys(s.spellSlots),[]);
 assert.equal(ui.adjust(s,'game-slot-use','1',ctx),true);
 assert.equal(s.spellSlots['1'].used,0);
 s.spellSlots['1']={total:2,used:0};
 ui.adjust(s,'game-slot-use','1',ctx);
 assert.equal(s.spellSlots['1'].used,1);
 ui.adjust(s,'game-slot-restore','1',ctx);
 assert.equal(s.spellSlots['1'].used,0);
 assert.equal(ui.adjust(s,'game-slot-use','x',ctx),false);
});
test('sheet supports the seven D&D-style categories and uses the character formulas',()=>{
 const html=ui.render({draft,game:ui.defaults(),tab:'overview',locale:'en',builder,insights,level:3,status:'draft',role:'player',
 speciesName:'Human',className:'Fighter',backgroundName:'Soldier'});
 for(const title of ['Overview','Actions & Combat','Spells','Equipment','Features & Traits','Description','Notes','Borruk','Spear','16','Athletics'])
   assert.ok(html.includes(title),title);
 assert.ok(html.includes('data-action="game-hp-minus"'));
 assert.ok(html.includes('role="tablist"'));
 assert.ok(html.includes('data-action="sheet-tab"'));
});
test('journal escapes user-provided text and supports local deletion',()=>{
 const s=ui.defaults();
 s.journal.push({id:'n1',title:'<script>alert(1)</script>',body:'Meet <John>',visibility:'private',createdAt:'2026-11-18T10:00:00Z'});
 const html=ui.journal({game:s,locale:'el'});
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(!html.includes('<script>alert'));
 assert.ok(ui.adjust(s,'game-journal-remove','n1',ctx));
 assert.equal(s.journal.length,0);
});
test('only current app frontend, no remote sync or dice roller introduced',()=>{
 const page=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'gameplay-v2.css'),'utf8');
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(css,/\.builder-page>.steps\{position:sticky;top:78px/);
 assert.match(css,/\.builder-page \.builder-controls\{position:fixed/);
 assert.match(css,/\.play-tabs\{position:sticky/);
 assert.match(page,/localStore\.load\(\)/);
 assert.match(page,/persistLocal\(/);
 assert.match(index,/components\/gameplay-v2\.js/);
 assert.match(index,/components\/local-state\.js/);
 assert.doesNotMatch(page,/new WebSocket\(/);
});
