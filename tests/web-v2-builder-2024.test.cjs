'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'../apps/web-v2');
const scope={window:{}};
for(const file of ['catalog/srd-2024.js','data.js','components/builder-2024.js','components/builder-insights.js']){
  vm.runInNewContext(fs.readFileSync(path.join(dir,file),'utf8'),scope,{filename:file});
}
const source=scope.window.ATLAS_V2_SRD;
const demo=scope.window.ATLAS_V2_DEMO;
const builder=scope.window.ATLAS_V2_BUILDER;
const d=()=>({class:'fighter',background:'soldier',classChoices:{},backgroundChoices:{},
  fightingStyle:null,weaponMasteries:[],bonusMode:'split',bonusTwo:null,bonusOne:null,
  classPackage:null,backgroundPackage:null,packageChoices:{},purchases:{}});
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const t=k=>demo.strings.en[k]||k;

test('complete SRD 2024 core options and distinct 16 PHB background names',()=>{
  assert.equal(source.edition,'2024');
  assert.equal(source.classes.length,12);
  assert.equal(source.backgrounds.length,4);
  assert.equal(source.equipment.length,182);
  assert.equal(demo.classes.length,12);
  assert.equal(demo.backgrounds.length,16);
  assert.equal(demo.backgrounds.filter(x=>!x.licensed).length,12);
  for(const bg of demo.backgrounds){
    assert.ok(bg.title.en && bg.title.el);
    assert.ok(fs.existsSync(path.join(dir,bg.art)),bg.art);
  }
});

test('Fighter proficiency choices are source-derived and duplicates are invalid',()=>{
  const draft=d();
  const group=builder.classInfo('fighter').skillChoices[0];
  assert.equal(group.count,2);
  assert.ok(group.options.some(x=>x.id==='skill-perception'));
  draft.classChoices[group.id]=['skill-perception','skill-survival'];
  assert.equal(builder.classChoicesValid(draft),true);
  draft.classChoices[group.id]=['skill-athletics','skill-survival'];
  assert.equal(builder.classChoicesValid(draft),false);
});

test('Fighter level one requires Fighting Style and three distinct weapon masteries in demo',()=>{
  const draft=d();
  assert.equal(builder.fighterChoicesValid(draft),false);
  draft.fightingStyle='Protection';
  draft.weaponMasteries=['greatsword','spear','light-crossbow'];
  assert.equal(builder.fighterChoicesValid(draft),true);
  draft.weaponMasteries=['spear','spear','greatsword'];
  assert.equal(builder.fighterChoicesValid(draft),false);
});

test('Soldier grants preset proficiencies, a gaming set choice and background-based scores',()=>{
  const draft=d();
  const bg=builder.backgroundInfo('soldier');
  assert.ok(bg.proficiencies.some(x=>x.id==='skill-athletics'));
  assert.ok(bg.feat.name);
  const choice=bg.skillChoices[0];
  assert.equal(choice.count,1);
  draft.backgroundChoices[choice.id]=[choice.options[0].id];
  assert.equal(builder.backgroundChoicesValid(draft),true);
  assert.equal(builder.bonusesValid(draft),false);
  draft.bonusTwo='str';draft.bonusOne='con';
  assert.equal(builder.bonusesValid(draft),true);
  assert.equal(builder.bonusFor(draft,'str'),2);
  assert.equal(builder.bonusFor(draft,'con'),1);
  draft.bonusMode='triple';
  assert.equal(builder.bonusFor(draft,'dex'),1);
});

test('independent class and background packages determine starting gold',()=>{
  const draft=d();
  const cl=builder.classInfo('fighter');
  const bg=builder.backgroundInfo('soldier');
  const classGold=cl.startingOptions.find(x=>x.items.length===1&&x.items[0].type==='money');
  const backgroundGold=bg.startingOptions.find(x=>x.items.length===1&&x.items[0].type==='money');
  assert.equal(classGold.items[0].amount,155);
  assert.equal(backgroundGold.items[0].amount,50);
  draft.classPackage=classGold.id;
  draft.backgroundPackage=backgroundGold.id;
  assert.equal(builder.packReady(draft),true);
  assert.equal(builder.wallet(draft).starting,20500);
  draft.purchases.greatsword=1;
  assert.equal(builder.wallet(draft).spent,builder.itemById.get('greatsword').cost.cp);
  assert.equal(builder.wallet(draft).remaining,15500);
});

test('Soldier background item package requires explicit gaming set selection',()=>{
  const draft=d();
  draft.classPackage=builder.classInfo('fighter').startingOptions.at(-1).id;
  draft.backgroundPackage=builder.backgroundInfo('soldier').startingOptions[0].id;
  assert.ok(builder.choicesMissing(draft)>0);
  assert.equal(builder.packReady(draft),false);
  const soldier=builder.pack(draft,'background');
  const i=soldier.items.findIndex(x=>x.type==='choice');
  assert.ok(i>=0);
  const gaming=source.equipment.find(x=>x.categories.includes('gaming-sets'));
  assert.ok(gaming,'SRD must provide a Gaming Set choice');
  draft.packageChoices[`background:${i}`]=gaming.id;
  assert.equal(builder.packReady(draft),true);
});

test('Gear renders six separate categories including packs without network actions',()=>{
  assert.deepEqual(Array.from(builder.categories),['packs','weapons','armor','adventuring','consumables','tools']);
  const draft=d();
  const html=builder.renderShop({draft,locale:'en',t,esc,category:'weapons',query:''});
  assert.match(html,/data-action="shop-add"/);
  assert.match(html,/>Weapons</);
  assert.match(html,/Packs &amp; kits/);
  assert.match(html,/wallet-summary--sticky/);
  assert.match(html,/item-details/);
  assert.doesNotMatch(fs.readFileSync(path.join(dir,'app.js'),'utf8'),/\bfetch\s*\(|XMLHttpRequest/);
});
