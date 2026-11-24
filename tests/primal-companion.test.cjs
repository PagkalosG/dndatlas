const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('src/app.js','utf8');
const block=app.slice(app.indexOf(' const ATLAS_PRIMAL_FORMS='),app.indexOf(' function atlasPrimalName('));
const api=vm.runInNewContext(block+';({atlasPrimalLevel,atlasPrimalStats})',{ability:(c,k)=>Math.floor((c.abilities[k]-10)/2),prof:c=>2+Math.floor((c.classes.reduce((n,x)=>n+x.level,0)-1)/4),signed:n=>n>=0?'+'+n:String(n)});
const ranger=(level,extra=[])=>({classes:[{name:'Ranger',subclass:'Beast Master',level},...extra],abilities:{WIS:16},primalCompanion:{form:'land',damage:0,status:'active',damageType:'Piercing'}});
test('Primal Companion unlocks only Beast Master Ranger 3 and scales by Ranger levels',()=>{
 assert.equal(api.atlasPrimalStats(ranger(2)),null);
 const other=ranger(5);other.classes[0].subclass='Hunter';assert.equal(api.atlasPrimalStats(other),null);
 const c=ranger(3,[{name:'Fighter',level:6}]),s=api.atlasPrimalStats(c);
 assert.equal(s.maxHp,20);assert.equal(s.ac,16);assert.equal(s.attack,7);assert.equal(s.dc,15);assert.equal(s.damage,'1d8+5');assert.equal(s.strikes,1);
});
test('Land, Sea, Sky formulas, level 11 Extra Strike and damage tracking',()=>{
 const c=ranger(11);c.primalCompanion.damage=4;
 let s=api.atlasPrimalStats(c);assert.equal(s.maxHp,60);assert.equal(s.hp,56);assert.equal(s.strikes,2);
 c.primalCompanion.form='sea';s=api.atlasPrimalStats(c);assert.equal(s.maxHp,60);assert.equal(s.damage,'1d6+5');assert.equal(s.darkvision,90);
 c.primalCompanion.form='sky';s=api.atlasPrimalStats(c);assert.equal(s.maxHp,48);assert.equal(s.damage,'1d4+6');assert.equal(s.damageType,'Slashing');assert.equal(s.die,6);
 for(const status of ['dead','reviving','vanished']){c.primalCompanion.status=status;assert.equal(api.atlasPrimalStats(c).hp,0);}
});
test('current Combat and Character views show companions; DM uses same sheet, not second initiative',()=>{
 const combat=app.slice(app.indexOf('  renderCombat=function(ch)'),app.indexOf('  attackDetail=function(id)'));
 const character=app.slice(app.indexOf('  renderCharacter=function(ch)'),app.indexOf('  let combatSpellMode='));
 for(const view of [combat,character]){assert.match(view,/atlasPrimalPanel\(ch\)/);assert.match(view,/renderCompanions\(ch\)/);}
 const ui=app.slice(app.indexOf(' // Class-granted companions'),app.indexOf(' function renderCompanions'));
 assert.match(ui,/canEditCharacter\(ch\)/);assert.match(ui,/closeModal\(\);update\(\)/);assert.doesNotMatch(ui,/cloudRequest|cloudPush|fetch\(|atlasCompanionParticipant/);
 assert.match(app,/atlasPrimalPanel\(ch,true\)/);assert.match(app,/plan\.next\.primalCompanion\.replaceReady=true/);
});
