'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'../apps/web-v2');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'components/builder-insights.js'),'utf8'),sandbox);
const ui=sandbox.window.ATLAS_V2_INSIGHTS;
const fighter={id:'fighter',proficiencies:[{id:'saving-throw-str',name:'STR'},{id:'saving-throw-con',name:'CON'},{id:'all-armor',name:'All armor'}],skillChoices:[{id:'0',count:2,options:[{id:'skill-perception',name:'Skill: Perception'},{id:'skill-survival',name:'Skill: Survival'}]}]};
const soldier={id:'soldier',proficiencies:[{id:'skill-athletics',name:'Skill: Athletics'}],skillChoices:[]};
const draft={abilities:[15,14,13,12,10,8],classChoices:{'0':['skill-perception','skill-survival']},backgroundChoices:{},classPackage:'0',backgroundPackage:'0',packageChoices:{},purchases:{'spear':1},bonusMode:'split',bonusTwo:'str',bonusOne:'con'};
const bonusFor=(d,key)=>(key==='str'?2:key==='con'?1:0);
const esc=s=>String(s).replaceAll('<','&lt;');
test('ability score + background bonus updates displayed modifier',()=>{
  assert.equal(ui.score(draft,'str',bonusFor).total,17);
  assert.equal(ui.score(draft,'str',bonusFor).modifier,3);
  assert.equal(ui.score(draft,'con',bonusFor).modifier,2);
  assert.equal(ui.score(draft,'cha',bonusFor).modifier,-1);
});
test('automatic and chosen proficiency grants have traceable origin and skill totals',()=>{
  const grants=ui.grants(draft,fighter,soldier);
  assert.ok(grants.find(g=>g.id==='saving-throw-str'&&g.sources[0].source==='automatic'));
  assert.ok(grants.find(g=>g.id==='skill-athletics'&&g.sources[0].origin==='background'));
  assert.ok(grants.find(g=>g.id==='skill-perception'&&g.sources[0].source==='choice'));
  assert.equal(ui.grantScore(draft,'skill-perception',bonusFor),2);
  assert.equal(ui.grantScore(draft,'skill-athletics',bonusFor),5);
  assert.equal(ui.grantScore(draft,'saving-throw-str',bonusFor),5);
  const html=ui.renderGrantOverview({draft,locale:'el',esc,cl:fighter,bg:soldier,bonusFor});
  assert.match(html,/Εξοικειώσεις/);
  assert.match(html,/All armor/);
});
test('class/background package origins and purchased item can coexist, and pack contents are expanded',()=>{
  const items=[{id:'spear',name:'Spear',category:'weapons'}, {id:'dungeoneer-pack',name:'Dungeoneer Pack',category:'adventuring',isPack:true,contents:[{id:'rope',name:'Rope',quantity:1}]},{id:'rope',name:'Rope',category:'adventuring'}];
  const b={source:{equipment:items},pack:(_d,origin)=>origin==='class'?{items:[{type:'item',id:'spear',qty:1},{type:'item',id:'dungeoneer-pack',qty:1}]}:{items:[{type:'item',id:'spear',qty:2}]}};
  const results=ui.contents(draft,b);
  assert.equal(results.get('spear').quantity,4);
  assert.equal(results.get('rope').quantity,1);
  assert.equal(results.get('rope').sources[0].label,'Class: Dungeoneer Pack');
  assert.equal(ui.itemGroup(items[1]),'packs');
  assert.match(ui.ownershipBadge({id:'rope',owned:results,locale:'en',esc}),/Class: Dungeoneer Pack/);
});
test('item description supports properties with no injected markup',()=>{
  const html=ui.itemDetails({item:{id:'spear',name:'Spear',cost:{amount:1,unit:'gp'},weight:3,damage:{damage_dice:'1d6',damage_type:{name:'Piercing'}},description:['<script>alert(1)</script>']},locale:'en',esc});
  assert.match(html,/1d6/);
  assert.doesNotMatch(html,/<script>/);
  assert.match(html,/&lt;script>/);
});
test('English and Greek insights labels have exact common keys',()=>{
  assert.deepEqual(Object.keys(ui.L.en).sort(),Object.keys(ui.L.el).sort());
});
