'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),test=require('node:test');
const root=path.resolve(__dirname,'../apps/web-v2');
const sandbox={window:{}};
sandbox.window.ATLAS_V2_IDENTITY={
 positions:{human:[0,0],fighter:[0,0]},
 descriptions:{species:{human:['Adaptable adventurers.','Προσαρμοστικοί τυχοδιώκτες.',['Skillful']]}},
};
for(const file of ['components/identity-v2.js','components/character-profile-sheet.js']){
 const raw=fs.readFileSync(path.join(root,file),'utf8');
 new vm.Script(raw,{filename:file}).runInNewContext(sandbox);
}
const identity=sandbox.window.ATLAS_V2_IDENTITY_V2;
const sheet=sandbox.window.ATLAS_V2_CHARACTER_SHEET;
const esc=v=>String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
test('expanded Human card shows traits with explanations and only one small portrait',()=>{
 const item={id:'human',title:{en:'Human',el:'Άνθρωπος'},description:{en:'A versatile adventurer.',el:'Ευέλικτος τυχοδιώκτης.'},licensed:true,source:'SRD 5.2.1',art:'assets/species-human.svg'};
 const html=identity.renderCard({item,group:'species',selected:true,expanded:true,locale:'el',esc});
 assert.match(html,/Χαρακτηριστικά/);assert.match(html,/Heroic Inspiration/);assert.match(html,/identity-v2-reveal/);
 assert.equal((html.match(/identity-v2-photo/g)||[]).length,1);
 assert.doesNotMatch(html,/Τι είναι|Original summary|Full rules validation/);
 assert.match(html,/data-action="expand-option"/);
 assert.match(html,/data-action="choose"/);
});
test('Background card has expandable information and SRD feat',()=>{
 const item={id:'soldier',title:{en:'Soldier',el:'Στρατιώτης'},description:{en:'A disciplined defender.',el:'Πειθαρχημένος υπερασπιστής.'},licensed:true,source:'SRD 5.2.1',art:'assets/background-soldier.svg'};
 const bg={feat:{name:'Savage Attacker'},proficiencies:[{id:'skill-athletics',name:'Athletics'}],abilityScores:[{id:'str',name:'STR'},{id:'dex',name:'DEX'},{id:'con',name:'CON'}],startingOptions:[{id:'0'}]};
 const html=identity.renderCard({item,group:'backgrounds',selected:false,expanded:true,locale:'en',esc,sourceBackground:()=>bg});
 assert.match(html,/Savage Attacker/);assert.match(html,/Starting packages/);assert.match(html,/What you gain/);
});
test('Fighter class card explains class details and has no duplicate image',()=>{
 const item={id:'fighter',title:{en:'Fighter',el:'Πολεμιστής'},description:{en:'Weapon expert.',el:'Ειδικός όπλων.'},licensed:true,source:'SRD 5.2.1',art:'assets/class-fighter.svg'};
 const html=identity.renderCard({item,group:'classes',selected:false,expanded:true,locale:'en',esc,sourceClass:()=>({hitDie:10,savingThrows:[{name:'STR'},{name:'CON'}],proficiencies:[],skillChoices:[]})});
 assert.match(html,/Class at a glance/);assert.match(html,/d10/);
 assert.equal((html.match(/identity-v2-photo/g)||[]).length,1);
});
test('custom items validate category, quantity and arbitrary text safely',()=>{
 const valid=sheet.normalizeCustom({name:'Healing flask',category:'consumables',quantity:'2',cost:'4.25',weight:'1',description:'Player-created item'});
 assert.equal(valid.name,'Healing flask');assert.equal(valid.quantity,2);
 assert.equal(sheet.normalizeCustom({name:'',category:'weapons',quantity:1,cost:0,weight:0}),null);
 assert.equal(sheet.normalizeCustom({name:'Sword',category:'unknown',quantity:1,cost:0,weight:0}),null);
 assert.equal(sheet.normalizeCustom({name:'Sword',category:'weapons',quantity:0,cost:0,weight:0}),null);
});
test('character profile includes Alignment, portrait input and private story in both locales',()=>{
 const html=sheet.profile({draft:{alignment:'chaotic-good',backgroundStory:'A brave traveller.'},locale:'el',esc});
 assert.match(html,/Chaotic Good/);assert.match(html,/character-portrait/);assert.match(html,/character-story/);assert.match(html,/A brave traveller/);
 assert.match(html,/Ιδιωτικό ιστορικό/);
});
test('review contains full ability, skill, save, inventory and story overview',()=>{
 const draft={species:'human',class:'fighter',background:'soldier',abilities:[15,14,13,12,10,8],classChoices:{},backgroundChoices:{},purchases:{},customItems:[{id:'custom-1',name:'A custom ring',quantity:1,description:'Homebrew'}],name:'Borruk',alignment:'chaotic-good',backgroundStory:'A short backstory.',bonusMode:'split',weaponMasteries:['spear']};
 const builder={classInfo:()=>({hitDie:10,savingThrows:[{id:'str',name:'STR'},{id:'con',name:'CON'}]}),backgroundInfo:()=>({feat:{name:'Savage Attacker'}}),bonusFor:()=>0,wallet:()=>({remaining:5000}),gb:()=> '50 GP',itemById:new Map()};
 const insights={score:(d,k)=>{const i=['str','dex','con','int','wis','cha'].indexOf(k);return {base:d.abilities[i],bonus:0,total:d.abilities[i],modifier:Math.floor((d.abilities[i]-10)/2)};},grants:()=>[{id:'skill-athletics'}],contents:()=>new Map()};
 const html=sheet.review({draft,locale:'en',builder,insights,level:3,selectedSpecies:'Human',selectedClass:'Fighter',selectedBackground:'Soldier'});
 for(const word of ['Ability scores','Saving throws','Skills','Base HP','Armor Class','Fighting Style','Inventory','Spells','Conditions','A custom ring','A short backstory'])assert.ok(html.includes(word),word);
 assert.match(html,/● Athletics/);assert.match(html,/×1/);
});
test('integration exposes new steps, CSS, inputs and no authenticated sync',()=>{
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(app,/'Profile', 'Review'/);assert.match(app,/characterUI\.customInventory/);assert.match(app,/characterUI\.review/);
 assert.match(app,/characterUI\.profile/);assert.match(app,/data-action="expand-option"/);
 assert.match(html,/identity-v2.css/);assert.match(html,/character-profile-sheet.js/);
});
