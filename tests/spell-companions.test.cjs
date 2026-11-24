const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('src/app.js','utf8');
const context={window:{},tr:(el,en)=>en,findReference:()=>undefined,prof:()=>3,ability:(ch,k)=>k==='CHA'?4:2,atlasSpellInfo:(ch,s)=>({prepared:s.prepared!==false,canRitual:s.ritual===true,canFree:false})};
vm.runInNewContext(fs.readFileSync('public/monsters-2024.js','utf8'),context);
const src=app.slice(app.indexOf(' const ATLAS_LINKED_SPELLS='),app.indexOf(' function atlasLinkedTurnText('));
const rest=app.slice(app.indexOf(' function atlasLinkedRest('),app.indexOf(' function atlasLinkedAction('));
const a=vm.runInNewContext(src+rest+';({atlasLinkedCatalog,atlasLinkedOptions,atlasLinkedStats,atlasLinkedRest,atlasLinkedMethodKey})',context);
const make=(name,level,extra={})=>({classes:[{name,level}],spellAbility:'WIS',spellbook:[],slots:{1:{max:2,used:0},2:{max:2,used:0},3:{max:1,used:0}},resources:[],features:[],...extra});
test('spell access derives from real spellbook and class features, not class name alone',()=>{
 assert.equal(a.atlasLinkedOptions(make('Wizard',3)).length,0);
 const wizard=make('Wizard',3,{spellbook:[{id:'ff',name:'Find Familiar',ritual:true,spellSource:'Wizard',prepared:false}]});
 assert.equal(a.atlasLinkedOptions(wizard)[0].options[0].mode,'ritual');
 const druid=make('Druid',2,{resources:[{id:'ws',name:'Wild Shape',current:1,max:2}]});
 assert.ok(a.atlasLinkedOptions(druid)[0].options.some(x=>x.resourceId==='ws'));
 assert.equal(a.atlasLinkedOptions(make('Druid',1)).length,0);
 const pal=make('Paladin',5);assert.ok(a.atlasLinkedOptions(pal)[0].options.some(x=>x.mode==='faithful'));
 pal.faithfulSteedUsed=true;assert.ok(!a.atlasLinkedOptions(pal)[0].options.some(x=>x.mode==='faithful'));
 assert.equal(a.atlasLinkedOptions(make('Warlock',5)).length,0);
 const war=make('Warlock',5,{features:[{name:'Pact of the Chain'}]});assert.equal(a.atlasLinkedOptions(war)[0].options[0].mode,'chain');
});
test('ordinary and chain familiar forms differ, no duplicate Slaad Tadpole',()=>{
 const normal=a.atlasLinkedCatalog(false),chain=a.atlasLinkedCatalog(true);
 assert.ok(normal.every(x=>x.type==='Beast'&&x.cr==='0'));assert.ok(!normal.some(x=>x.name==='Imp'));assert.ok(chain.some(x=>x.name==='Imp'));assert.equal(chain.filter(x=>x.name==='Slaad Tadpole').length,1);
 const ch=make('Warlock',5),q={key:'familiar',source:'Pact of the Chain',form:'srd-imp',hp:21,status:'active',ability:'CHA',level:1};
 assert.equal(a.atlasLinkedStats(ch,q).maxHp,21);assert.equal(a.atlasLinkedStats(ch,{...q,source:'Wizard'}),null);
});
test('spell level scaling, correct casting ability and concentration state',()=>{
 const ch=make('Paladin',9,{concentrating:'Summon Beast'});
 const steed=a.atlasLinkedStats(ch,{key:'steed',form:'Celestial',level:4,hp:45,ability:'CHA',status:'active'});assert.equal(steed.maxHp,45);assert.equal(steed.ac,14);assert.equal(steed.attack,7);assert.match(steed.speed,/Fly/);
 const beast={key:'summon',spell:'Summon Beast',form:'Air',level:4,hp:30,ability:'WIS',status:'active'};
 const air=a.atlasLinkedStats(ch,beast);assert.equal(air.maxHp,30);assert.equal(air.ac,15);assert.equal(air.strikes,2);assert.equal(air.damage,'1d8+8 Piercing');assert.equal(air.active,true);
 assert.equal(a.atlasLinkedStats(ch,{...beast,form:'Land'}).maxHp,40);
 assert.equal(a.atlasLinkedStats({...ch,concentrating:'Hex'},beast).active,false);
 const fey=a.atlasLinkedStats(ch,{...beast,spell:'Summon Fey',form:'Tricksy',level:5});assert.equal(fey.maxHp,50);assert.equal(fey.ac,17);assert.equal(fey.strikes,2);assert.equal(fey.damage,'2d6+8 Force');
 assert.equal(a.atlasLinkedStats(ch,{...beast,form:'invalid'}),null);
});
test('Wild Companion expires on long rest; summons expire when concentration or duration ends',()=>{
 const ch=make('Druid',3,{concentrating:'Summon Beast',linkedCompanions:{familiar:{source:'Wild Companion'},summon:{spell:'Summon Beast'},steed:{key:'steed'}}});
 a.atlasLinkedRest(ch,false,false);assert.ok(ch.linkedCompanions.summon);
 a.atlasLinkedRest(ch,false,true);assert.equal(ch.concentrating,'');assert.equal(ch.linkedCompanions.summon,undefined);assert.ok(ch.linkedCompanions.familiar);
 a.atlasLinkedRest(ch,true,true);assert.equal(ch.linkedCompanions.familiar,undefined);assert.ok(ch.linkedCompanions.steed);
 const pal=make('Paladin',5,{faithfulSteedUsed:true});a.atlasLinkedRest(pal,true,false);assert.equal(pal.faithfulSteedUsed,false);
});
test('both views and spell casting share one sheet; no extra network writes',()=>{
 const ui=app.slice(app.indexOf(' // Spell companions:'),app.indexOf(' function renderCompanions'));
 assert.doesNotMatch(ui,/cloudRequest|cloudPush|fetch\(/);assert.match(ui,/canEditCharacter\(ch\)/);assert.match(ui,/closeModal\(\);update\(\)/);
 assert.match(app,/\$\{atlasPrimalPanel\(ch\)\}\$\{atlasLinkedPanel\(ch\)\}/);assert.match(app,/atlasLinkedPanel\(ch,true\)/);assert.match(app,/return atlasLinkedOpen\(ch,faithful/);
});
