'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../apps/web-v2');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'components/identity-cards.js'),'utf8'),sandbox);
const ui=sandbox.window.ATLAS_V2_IDENTITY;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fighter={id:'fighter',title:{en:'Fighter',el:'Πολεμιστής'},description:{en:'Weapons and tactics',el:'Όπλα και τακτική'},art:'assets/class-fighter.svg',source:'SRD 5.2.1',licensed:true};
const info=()=>({hitDie:10,savingThrows:[{name:'STR'},{name:'CON'}],proficiencies:[{id:'martial-weapons',name:'Martial Weapons'}]});
test('Species and Class cards expand before selecting; controls are separate',()=>{
 const closed=ui.renderCard({item:fighter,group:'classes',selected:false,expanded:false,locale:'en',esc,sourceClass:info});
 const open=ui.renderCard({item:fighter,group:'classes',selected:false,expanded:true,locale:'el',esc,sourceClass:info});
 assert.match(closed,/data-action="expand-option"/);
 assert.doesNotMatch(closed,/data-action="choose"/);
 assert.match(open,/data-action="choose"/);
 assert.match(open,/Ζάρι ζωής/);
 assert.match(open,/d10/);
 assert.match(open,/aria-expanded="true"/);
});
test('Locked content remains inspectable but cannot be selected',()=>{
 const aasimar={id:'aasimar',title:{en:'Aasimar',el:'Αασιμάρ'},description:{en:'Celestial legacy',el:'Ουράνια καταγωγή'},art:'assets/species-aasimar.svg',source:'PHB 2024',licensed:false};
 const html=ui.renderCard({item:aasimar,group:'species',selected:false,expanded:true,locale:'el',esc});
 assert.match(html,/Δεν είναι διαθέσιμο/);
 assert.doesNotMatch(html,/data-action="choose"/);
});
test('Descriptions cover 9 SRD species and all 12 core classes in EN and EL',()=>{
 for(const [kind,ids] of Object.entries({
  species:['human','elf','dwarf','halfling','dragonborn','gnome','goliath','orc','tiefling'],
  classes:['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard']
 })){
  for(const id of ids){const copy=ui.descriptions[kind][id];assert.ok(copy&&copy[0].length>25&&copy[1].length>20,id);}
 }
});
test('Escaping applies to untrusted content names and descriptions',()=>{
 const bad={...fighter,title:{en:'<script>attack</script>',el:'<script>attack</script>'},description:{en:'<img src=x onerror=1>',el:'<img src=x onerror=1>'}};
 const html=ui.renderCard({item:bad,group:'classes',selected:false,expanded:true,locale:'en',esc,sourceClass:info});
 assert.doesNotMatch(html,/<script>|<img src=x onerror=1>/);
 assert.match(html,/&lt;script&gt;/);
});
test('Builder flow honors subclass at single-class starting level 3 and Stats before class training',()=>{
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.match(app,/savedCampaign\.startingLevel >= 3/);
 assert.match(app,/'Background', 'Ability', 'ClassTraining', 'BackgroundTraining'/);
 assert.match(app,/select-subclass/);
 assert.match(app,/expand-option/);
 assert.match(app,/subclassRequired\(\)/);
});
test('Topbar shows both demo roles and loads discovery component before app',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/data-role-mode="player"/);
 assert.match(html,/data-role-mode="dm"/);
 assert.ok(html.indexOf('identity-cards.js')<html.indexOf('src="app.js"'));
 assert.doesNotMatch(html,/dice-roller|rollDice/);
});
