const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('src/app.js','utf8');
const worker=fs.readFileSync('workers/production/encounter-extension.js','utf8');
const block=app.slice(app.indexOf(' const ATLAS_EFFECT_CONDITIONS='),app.indexOf(' function atlasEffectName('));
let serial=0;
const api=vm.runInNewContext(block+';({atlasEffectDC,atlasEffectDue,atlasEffectRemove,atlasEffectDamage,atlasEffectConcentration})',{uid:()=> 'check-'+(++serial),tr:(_el,en)=>en});
const validate=vm.runInNewContext(worker+';atlasEncounterValidate',{});
const project=vm.runInNewContext(worker+';atlasEncounterPublic',{});
const err=(code,msg)=>Object.assign(Error(msg),{code});
const p={id:'a',type:'player',characterId:'caster',name:'Caster',initiative:20,out:false};
const enemy={id:'b',type:'enemy',name:'Enemy',initiative:10,hp:10,maxHp:10,ac:12,out:false};
const base={name:'Fight',phase:'active',round:1,activeId:'a',participants:[p,enemy]};
const effect={id:'c',kind:'concentration',targetId:'a',label:'Bless',parent:'',mode:'manual',round:1,boundary:'start',turnId:'a',ability:'CON',dc:0,note:''};
const linked={...effect,id:'d',kind:'temporary',targetId:'b',parent:'c',label:'Bless benefit'};
test('2024 concentration damage DC floor and cap',()=>{
 assert.deepEqual([1,20,21,39,60,100].map(api.atlasEffectDC),[10,10,10,19,30,30]);
});
test('duration uses exact round and initiative boundary without mutating state',()=>{
 const e={...effect,mode:'expire',round:1,boundary:'end'};
 assert.equal(api.atlasEffectDue(base,e),false);
 assert.equal(api.atlasEffectDue({...base,activeId:'b'},e),true);
 assert.equal(api.atlasEffectDue(base,{...e,boundary:'start'}),true);
 assert.equal(api.atlasEffectDue({...base,round:2},e),true);
 assert.equal(api.atlasEffectDue(base,{...e,round:2}),false);
 assert.equal(api.atlasEffectDue(base,e),false);
});
test('damage queues separate checks and ending concentration cascades to linked effects',()=>{
 const b={...base,effects:[effect,linked]};
 api.atlasEffectDamage(b,'a',21);api.atlasEffectDamage(b,'a',60);api.atlasEffectDamage(b,'b',9);
 assert.equal(b.effects.length,4);assert.equal(b.effects[2].dc,10);assert.equal(b.effects[3].dc,30);
 assert.equal(validate(b,err),b);
 api.atlasEffectRemove(b,b.effects[2].id);assert.equal(b.effects.length,3);
 api.atlasEffectRemove(b,'c');assert.equal(b.effects.length,0);
});
test('server accepts old snapshots and rejects bad parent, forged DC, duplicate concentration and incapacity',()=>{
 assert.equal(validate(base,err),base);
 assert.equal(validate({...base,effects:[effect,linked]},err).effects.length,2);
 for(const effects of [[linked],[effect,{...effect,id:'other'}],[effect,{...linked,targetId:'ghost'}],[effect,{...linked,targetId:'a',kind:'condition',label:'Stunned',parent:''}],[effect,{...effect,id:'bad',kind:'check',parent:'c',note:'60',dc:10}],[{...effect,secret:'bad'}]])assert.throws(()=>validate({...base,effects},err));
 assert.throws(()=>validate({...base,phase:'setup',activeId:null,effects:[effect]},err));
});
test('player projection excludes encounter effects and enemy data',()=>{
 const pub=project({...base,effects:[effect,linked]});
 assert.equal(Object.hasOwn(pub,'effects'),false);assert.equal(Object.hasOwn(pub,'participants'),false);
 assert.equal(JSON.stringify(pub).includes('Bless'),false);
});
test('effects are staged only; existing global Save handles writes',()=>{
 const ui=app.slice(app.indexOf(' const ATLAS_EFFECT_CONDITIONS='),app.indexOf(' const ATLAS_LOG_TYPES='));
 assert.match(ui,/atlasBattleSave\(/);assert.doesNotMatch(ui,/cloudRequest|fetch\(|cloudPush/);
 assert.match(app,/phase:'ended',round:1,activeId:null,events:\[\],effects:\[\]/);
});
