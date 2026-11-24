const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('src/app.js','utf8'),worker=fs.readFileSync('workers/production/encounter-extension.js','utf8');
const api=vm.runInNewContext(worker+';({atlasEncounterCompanions,atlasEncounterCompanionSync,atlasEncounterValidate,atlasEncounterFinish,atlasEncounterEnvelope,atlasEncounterPublic})',{});
const err=(code,msg)=>Object.assign(Error(msg),{code});
const q={id:'cat',name:'Charcoal',kind:'familiar',ownerId:'hero',hp:2,maxHp:3,ac:12,speed:40,actions:'Custom example'};
const p={id:'cat-turn',type:'ally',rosterId:'cat',ownerId:'hero',companionKind:'familiar',name:q.name,initiative:12,hp:1,maxHp:3,ac:12,speed:40,actions:q.actions,out:false};
const summon={...p,id:'summon-turn',companionKind:'summon',expiresRound:4};delete summon.rosterId;
const enemy={id:'e',type:'enemy',name:'Enemy',initiative:4,hp:5,maxHp:5,ac:10,out:false};
const player={id:'hero-turn',type:'player',characterId:'hero',name:'Hero',initiative:15,out:false};
const state={name:'Battle',phase:'active',round:2,activeId:player.id,participants:[player,p,summon,enemy],effects:[]};
test('permanent companions retain HP and clear initiative; summons and enemies removed',()=>{
 assert.equal(api.atlasEncounterValidate(state,err),state);
 const saved=api.atlasEncounterCompanionSync([q],state,err);
 assert.equal(saved[0].hp,1);assert.equal(q.hp,2);
 const ended=api.atlasEncounterFinish(state);
 assert.deepEqual(Array.from(ended.participants,x=>x.id),['hero-turn','cat-turn']);
 assert.equal(ended.participants[1].initiative,null);assert.equal(ended.participants[1].hp,1);
 assert.equal(api.atlasEncounterCompanionSync(saved,null,err)[0].hp,1);
});
test('roster rejects duplicates, invalid owner syntax, custom keys, malformed HP and summons',()=>{
 assert.equal(api.atlasEncounterCompanions([q],err)[0],q);
 for(const roster of [[q,q],[{...q,kind:'summon'}],[{...q,ownerId:'bad id'}],[{...q,hp:4}],[{...q,extra:'secret'}],[{...q,sourceId:'s'},{...q,id:'b',sourceId:'s'}]])assert.throws(()=>api.atlasEncounterCompanions(roster,err));
 for(const ps of [[{...p,type:'enemy'}],[{...p,id:'one'},{...p,id:'two'}],[{...summon,expiresRound:0}],[{...p,companionKind:'summon'}]])assert.throws(()=>api.atlasEncounterValidate({...state,participants:[player,...ps]},err));
 assert.throws(()=>api.atlasEncounterCompanionSync([],state,err));
 assert.throws(()=>api.atlasEncounterCompanionSync([{...q,ac:13}],state,err));
});
test('legacy snapshots and public encounter projection do not expose private roster',()=>{
 const legacy=api.atlasEncounterEnvelope(JSON.stringify({encounter:null,history:[]}));
 assert.equal(legacy.companions.length,0);
 const pub=api.atlasEncounterPublic(state);
 assert.equal(Object.hasOwn(pub,'companions'),false);assert.equal(Object.hasOwn(pub,'participants'),false);
 assert.equal(JSON.stringify(pub).includes(q.name),false);
 assert.match(worker,/encounter:null,history,companions:envelope\.companions,monsterPlan:envelope\.monsterPlan/);
});
test('companion UI drafts use only central Save; roster participates in dirty tracking',()=>{
 const src=app.slice(app.indexOf(' // Persistent party roster'),app.indexOf(' function atlasBattleNew'));
 assert.match(src,/atlasBattleSave/);assert.doesNotMatch(src,/cloudRequest|cloudPush|fetch\(/);
 const mark=app.slice(app.indexOf(' function atlasBattleMark'),app.indexOf(' function atlasBattleMark')+350);
 assert.match(mark,/JSON\.stringify\(atlasCompanionRoster\)!==atlasCompanionBaseline/);
 assert.match(app,/encounter:atlasBattle,history:atlasBattleHistory,companions:atlasCompanionRoster/);
});
