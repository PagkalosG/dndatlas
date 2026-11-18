'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'../apps/web-v2');
const context={window:{}};
for(const file of [
  'catalog/srd-2024.js','data.js','components/builder-2024.js',
  'components/builder-insights.js','components/identity-cards.js',
  'components/identity-v2.js','components/character-profile-sheet.js',
  'components/origin-choices-2024.js'
]) vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const builder=context.window.ATLAS_V2_BUILDER;
const origin=context.window.ATLAS_V2_ORIGINS;
const insights=context.window.ATLAS_V2_INSIGHTS;
const identity=context.window.ATLAS_V2_IDENTITY_V2;
const demo=context.window.ATLAS_V2_DEMO;
const sheet=context.window.ATLAS_V2_CHARACTER_SHEET;
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const draft=()=>({species:'human',class:'fighter',background:'soldier',
  classChoices:{'0':['skill-perception','skill-survival']},backgroundChoices:{'0':['tool-dice']},
  humanSkill:'skill-medicine',humanFeat:'alert',skilledChoices:[],fightingStyle:'Protection',weaponMasteries:['spear','greatsword','light-crossbow'],
  abilities:[15,14,13,12,10,8],bonusMode:'split',bonusTwo:'str',bonusOne:'con',
  classPackage:'2',backgroundPackage:'1',purchases:{},packageChoices:{},customItems:[],
  name:'Test Human',backgroundStory:''});
test('SRD Human Skillful grants a third selected skill in addition to two Fighter skills',()=>{
 const d=draft(),cl=builder.classInfo(d.class),bg=builder.backgroundInfo(d.background);
 assert.equal(cl.skillChoices[0].count,2);
 assert.equal(builder.classChoicesValid(d),true);
 assert.equal(origin.validHumanSkill(d),true);
 assert.equal(origin.validHumanFeat(d),true);
 const skillIds=insights.grants(d,cl,bg).filter(g=>g.kind==='skill').map(g=>g.id);
 assert.deepEqual([...skillIds].sort(),['skill-athletics','skill-intimidation','skill-medicine','skill-perception','skill-survival'].sort());
});
test('Human Skillful must be selected, distinct from class and background, and removes when nonhuman',()=>{
 const d=draft();
 d.humanSkill=null;assert.equal(origin.validHumanSkill(d),false);
 d.humanSkill='skill-athletics';assert.equal(origin.validHumanSkill(d),false);
 d.humanSkill='skill-perception';assert.equal(origin.validHumanSkill(d),false);
 d.humanSkill='skill-medicine';assert.equal(origin.validHumanSkill(d),true);
 d.species='elf';assert.equal(origin.validHumanSkill(d),true);
});
test('Human Versatile requires a distinct or repeatable SRD Origin Feat',()=>{
 const d=draft();
 d.humanFeat=null;assert.equal(origin.validHumanFeat(d),false);
 d.humanFeat='savage-attacker';assert.equal(origin.validHumanFeat(d),false);
 d.humanFeat='alert';assert.equal(origin.validHumanFeat(d),true);
 d.humanFeat='magic-initiate';assert.equal(origin.validHumanFeat(d),false); // incomplete spell selections block acceptance
});
test('Skilled can grant three different Skill or Tool Proficiencies, but never duplicates',()=>{
 const d=draft();d.humanFeat='skilled';d.skilledChoices=['skill-medicine','tool-smiths-tools','skill-persuasion'];
 assert.equal(origin.validHumanFeat(d),false); // medicine already comes from Skillful
 d.skilledChoices=['skill-nature','tool-smiths-tools','skill-persuasion'];
 assert.equal(origin.validHumanFeat(d),true);
 let rows=insights.grants(d,builder.classInfo(d.class),builder.backgroundInfo(d.background));
 assert.ok(rows.some(x=>x.id==='tool-smiths-tools'&&x.sources.some(s=>s.origin==='feat')));
 assert.equal(rows.filter(x=>x.kind==='skill').length,7);
 d.skilledChoices=['skill-nature','skill-nature','skill-persuasion'];
 assert.equal(origin.validHumanFeat(d),false);
});
test('Inline class skill picker allows clicks without Skill: prefixes or raw CSV walls',()=>{
 const d=draft(),cl=builder.classInfo('fighter');
 const html=origin.renderClassSkillPreview({draft:d,cl,locale:'en',esc});
 assert.match(html,/data-action="class-proficiency"/);
 assert.match(html,/Choose Class Skills/);
 assert.match(html,/2\/2/);
 assert.doesNotMatch(html,/>Skill: /);
 assert.match(html,/Perception/);
 assert.doesNotMatch(html,/data-id="skill-perception"[^>]*disabled/);
});
test('Species trait explanations do not repeat trait names and BG proficiency labels are clean',()=>{
 const species=demo.species.find(s=>s.id==='human'),soldier=demo.backgrounds.find(s=>s.id==='soldier');
 const sd=identity.renderCard({item:species,group:'species',draft:draft(),selected:true,expanded:true,locale:'en',esc});
 const bd=identity.renderCard({item:soldier,group:'backgrounds',draft:draft(),selected:true,expanded:true,locale:'en',esc,sourceBackground:builder.backgroundInfo});
 assert.doesNotMatch(sd,/>Resourceful: /);
 assert.doesNotMatch(sd,/Original summary/);
 assert.match(bd,/Origin Feat/);assert.match(bd,/Savage Attacker/);
 assert.doesNotMatch(bd,/>Skill: /);
 assert.match(bd,/Origin Feat/);
});
test('Weapon Mastery descriptions are available for every 2024 SRD property',()=>{
 assert.deepEqual(Object.keys(origin.MASTERIES).sort(),['cleave','graze','nick','push','sap','slow','topple','vex']);
 for(const item of builder.source.equipment.filter(x=>x.category==='weapons')){
   assert.ok(origin.MASTERIES[item.mastery?.index],item.id+' no mastery description');
 }
 const html=builder.renderClassTraining({draft:draft(),locale:'en',t:k=>demo.strings.en[k]||k,esc});
 assert.match(html,/data-action="weapon-mastery"/);assert.match(html,/Graze/);
 assert.match(html,/On a missed weapon attack/);
 assert.match(html,/Fighting Style/);
 assert.match(html,/Armor Class rises by 1/);
});
test('Origin feat panels explain the Background feat and show the Human extra feat picker',()=>{
 const d=draft();
 const bgHTML=builder.renderBackgroundTraining({draft:d,locale:'en',t:k=>demo.strings.en[k]||k,esc});
 assert.match(bgHTML,/Savage Attacker/);
 assert.match(bgHTML,/weapon damage dice twice/);
 assert.match(bgHTML,/data-action="human-feat"/);
 assert.match(bgHTML,/Magic Initiate/);
 assert.match(bgHTML,/data-id="savage-attacker"[^>]*disabled/);
});
test('Full character review uses Human feat grants and Alert initiative once',()=>{
 const d=draft(),derived=sheet.derived(d,builder,insights,3);
 // DEX 14 = +2; Alert gives +2 proficiency at level 3.
 assert.equal(derived.initiative,4);
 assert.ok(derived.grants.some(g=>g.id==='skill-medicine'));
 const full=sheet.review({draft:d,locale:'en',builder,insights,level:3,
  selectedSpecies:'Human',selectedClass:'Fighter',selectedBackground:'Soldier'});
 assert.match(full,/Human · Versatile: Alert/);
 assert.match(full,/Human · Skillful/);
});
test('No auth, dice UI, or cloud sync added to the prototype',()=>{
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.match(app,/originUI\.validHumanSkill/);
 assert.match(app,/originUI\.validHumanFeat/);
 assert.match(app,/action === 'human-skill'/);
 assert.match(app,/action === 'human-feat'/);
 assert.match(app,/action === 'skilled-proficiency'/);
 assert.doesNotMatch(app,/fetch\(|WebSocket\(|XMLHttpRequest/);
});
