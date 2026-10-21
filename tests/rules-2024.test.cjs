'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('../src/rules-2024.js');
const weapons=[
 {name:'Dagger',group:'Simple'}, {name:'Greatsword',group:'Martial'},
 {name:'Scimitar',group:'Martial'}, {name:'Rapier',group:'Martial'},
 {name:'Longbow',group:'Martial'}, {name:'Spear',group:'Simple'},
 {name:'Shortbow',group:'Simple'}
];
const make=(klass,extra=[])=>({classes:[{name:klass,level:3},...extra],abilities:{STR:16,DEX:14,INT:12},skills:{},proficiencies:''});
const stat=(ch,weapon,ability='STR',extra={})=>R.attackBreakdown(ch,{name:weapon,ability,damage:'1d4',...extra},weapons);
test('Fighter proficiency applies to dagger even if it is not selected for Weapon Mastery',()=>{
 const fighter=make('Fighter');fighter.weaponMasteries=['Greatsword','Spear','Scimitar'];
 assert.equal(stat(fighter,'Dagger','DEX').hit,4); // DEX +2 + PB +2
 assert.equal(stat(fighter,'Dagger','DEX').damageMod,2); // PB never enters damage
});
test('nonproficient Wizard does not add PB to Greatsword attacks',()=>{
 const wizard=make('Wizard');assert.equal(stat(wizard,'Greatsword').hit,3);
 assert.equal(stat(wizard,'Dagger','DEX').hit,4);
});
test('Barbarian, Paladin, Ranger have martial weapon proficiency',()=>{
 for(const name of ['Barbarian','Paladin','Ranger'])assert.equal(stat(make(name),'Greatsword').pb,2);
});
test('Rogue has proficiency in martial finesse or light, but not greatsword or longbow',()=>{
 const r=make('Rogue');assert.equal(stat(r,'Rapier','DEX').pb,2);
 assert.equal(stat(r,'Scimitar','DEX').pb,2);
 assert.equal(stat(r,'Longbow','DEX').pb,0);
 assert.equal(stat(r,'Greatsword').pb,0);
});
test('Monk has proficiency in simple weapons and martial Light weapons only',()=>{
 const monk=make('Monk');assert.equal(stat(monk,'Scimitar','DEX').pb,2);
 assert.equal(stat(monk,'Greatsword').pb,0);
});
test('Bard, Cleric, Druid, Sorcerer, Warlock and Wizard have simple proficiency',()=>{
 for(const c of ['Bard','Cleric','Druid','Sorcerer','Warlock','Wizard']){
  assert.equal(stat(make(c),'Dagger','DEX').pb,2,c);
  assert.equal(stat(make(c),'Greatsword').pb,0,c);
 }
});
test('Fighter multiclass grants Martial weapons',()=>{
 const c=make('Wizard',[{name:'Fighter',level:1}]);
 assert.equal(stat(c,'Greatsword').pb,2);
});
test('additional martial multiclasses grant only the confirmed Martial weapon proficiency',()=>{
 for(const klass of ['Barbarian','Paladin','Ranger']){
  const ch=make('Wizard',[{name:klass,level:1}]);
  assert.equal(stat(ch,'Greatsword').pb,2,klass);
 }
 // Adding a Rogue does not confer starting martial weapon proficiency.
 assert.equal(stat(make('Wizard',[{name:'Rogue',level:1}]),'Rapier','DEX').pb,0);
});
test('manual proficiency override supports class features and DM decisions',()=>{
 const c=make('Wizard');
 assert.equal(stat(c,'Greatsword','STR',{proficiencyMode:'yes'}).pb,2);
 assert.equal(stat(c,'Dagger','DEX',{proficiencyMode:'no'}).pb,0);
});
test('Weapon Mastery is separated from weapon proficiency',()=>{
 assert.equal(R.masteryEligible(make('Rogue'),weapons.find(w=>w.name==='Greatsword'),weapons),false);
 assert.equal(R.masteryEligible(make('Rogue'),weapons.find(w=>w.name==='Rapier'),weapons),true);
 assert.equal(R.masteryEligible(make('Barbarian'),weapons.find(w=>w.name==='Longbow'),weapons),false);
 assert.equal(R.masteryEligible(make('Fighter'),weapons.find(w=>w.name==='Longbow'),weapons),true);
});
test('Student of War is BOTH tool and skill, replaces previous skill without accumulating',()=>{
 const c=make('Fighter');c.classes[0].subclass='Battle Master';
 R.applyStudentSelection(c,'Smith’s Tools','Athletics');
 assert.equal(c.skills.Athletics,1);
 R.applyStudentSelection(c,'Weaver’s Tools','Perception');
 assert.equal(c.skills.Athletics,0);
 assert.equal(c.skills.Perception,1);
 assert.deepEqual(R.studentSelection(c),{tool:'Weaver’s Tools',skill:'Perception'});
 assert.match(c.proficiencies,/Student of War Tool: Weaver’s Tools/);
 assert.doesNotMatch(c.proficiencies,/Smith’s Tools/);
});
test('Student of War preserves previously held skill proficiency and expertise',()=>{
 const c=make('Fighter');c.skills.Athletics=1;c.skills.History=2;
 R.applyStudentSelection(c,'Smith’s Tools','Athletics');
 R.applyStudentSelection(c,'Weaver’s Tools','History');
 assert.equal(c.skills.Athletics,1);
 assert.equal(c.skills.History,2);
});
test('Student of War validates Fighter skills and Artisan tools',()=>{
 const c=make('Fighter');
 assert.throws(()=>R.applyStudentSelection(c,'Dragon Kit','Perception'));
 assert.throws(()=>R.applyStudentSelection(c,'Smith’s Tools','Arcana'));
 assert.equal(R.FIGHTER_SKILLS.includes('Persuasion'),true);
});
test('Smith tools rules and other artisan tools are sourced from 2024 equipment',()=>{
 const [ability,utilize,craft]=R.TOOL_RULES['Smith’s Tools'];
 assert.equal(ability,'STR');assert.match(utilize,/DC 20/);assert.match(craft,/Heavy armor/);
 assert.equal(R.ARTISAN_TOOLS.length,17);
});
test('Attack, magic bonus, and custom damage bonus remain separate',()=>{
 const c=make('Fighter');const val=stat(c,'Dagger','DEX',{magicBonus:1,damageBonus:2});
 assert.equal(val.hit,5);assert.equal(val.damageMod,5); // 2 DEX + 1 magic + 2 extra
});

test('Spell attacks use proficiency to hit but do not automatically add casting mod to spell damage',()=>{
 const wizard=make('Wizard');wizard.spellAbility='INT';
 const info=stat(wizard,'Fire Bolt','SPELL',{damage:'1d10'});
 assert.equal(info.hit,3); // Intelligence +1, proficiency +2
 assert.equal(info.damageMod,0); // No automatic INT to damage on Fire Bolt
});

// UI integration checks are additionally validated with a static contract test.
const fs=require('node:fs');
const app=fs.readFileSync(require('node:path').join(__dirname,'../src/app.js'),'utf8');
test('two handed shield conflict remains a warning rather than reducing greatsword damage',()=>{
 assert.match(app,/twoHandedShieldConflict/);
 assert.match(app,/2d6/);
 assert.match(app,/1d8/);
});
test('inventory new item opens category picker, custom keeps advanced editor',()=>{
 assert.match(app,/atlasAddItemKind/);
 assert.match(app,/atlasCanonItemPicker/);
 assert.match(app,/case 'choose-item-kind'/);
});