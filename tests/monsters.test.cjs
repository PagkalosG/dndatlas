const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('src/app.js','utf8'),worker=fs.readFileSync('workers/production/encounter-extension.js','utf8');
const browser={window:{}};vm.runInNewContext(fs.readFileSync('public/monsters-2024.js','utf8'),browser);
const catalog=browser.window.ATLAS_MONSTERS_2024;
const block=app.slice(app.indexOf(' const ATLAS_CR='),app.indexOf(' function atlasMonsterAll('));
const api=vm.runInNewContext(block+';({atlasMonsterBudget,atlasMonsterDifficulty})',{});
const server=vm.runInNewContext(worker+';({atlasMonsterValidateMeta,atlasMonsterPlanValidate,atlasEncounterValidate,atlasEncounterEnvelope,atlasEncounterPublic})',{});
const err=(code,msg)=>Object.assign(Error(msg),{code});
test('330 unique 2024 SRD entries, verified revised examples and valid XP metadata',()=>{
 assert.equal(catalog.length,330);assert.equal(new Set(catalog.map(x=>x.id)).size,330);
 for(const m of catalog){server.atlasMonsterValidateMeta({id:m.id,name:m.name,cr:m.cr,xp:m.xp},err);assert.ok(m.detail.length>0&&m.hp>0&&Number.isInteger(m.ac));}
 for(const [name,hp,ac,initiative] of [['Goblin Warrior',10,15,12],['Skeleton',13,14,13],['Wolf',11,12,12],['Zombie',15,8,8]]){const m=catalog.find(x=>x.name===name);assert.deepEqual([m.hp,m.ac,m.initiative],[hp,ac,initiative]);}
});
test('2024 XP budgets: four level 1, mixed party and boundary categories without multiplier',()=>{
 const budget=Array.from(api.atlasMonsterBudget([1,1,1,1]));assert.deepEqual(budget,[200,300,400]);
 assert.deepEqual(Array.from(api.atlasMonsterBudget([3,4])),[400,600,900]);
 for(const [xp,d] of [[0,'low'],[200,'low'],[201,'moderate'],[300,'moderate'],[301,'high'],[400,'high'],[401,'over']])assert.equal(api.atlasMonsterDifficulty(xp,budget),d);
});
const m={id:'custom-test',name:'Test creature',size:'Medium',type:'Fey',cr:'1',xp:200,hp:10,ac:12,initiative:10,detail:'Custom action'};
const enemy={id:'e',type:'enemy',name:'Test creature',initiative:null,hp:10,maxHp:10,ac:12,out:false,monster:{id:m.id,name:m.name,cr:m.cr,xp:m.xp,detail:m.detail}};
test('private monster templates validate, reject injected data and preserve old snapshots',()=>{
 const plan={custom:[m],templates:[{id:'t',name:'Test',enemies:[enemy]}]};
 assert.equal(server.atlasMonsterPlanValidate(plan,err),plan);
 for(const bad of [{...plan,custom:[{...m,xp:999}]},{...plan,custom:[m,m]},{...plan,templates:[{...plan.templates[0],enemies:[{...enemy,hp:1}]}]},{...plan,templates:[{...plan.templates[0],enemies:[{...enemy,initiative:15}]}]}])assert.throws(()=>server.atlasMonsterPlanValidate(bad,err));
 assert.equal(server.atlasEncounterEnvelope('null').monsterPlan.custom.length,0);
 const player={id:'p',type:'player',characterId:'hero',name:'Hero',initiative:20,out:false};
 const pub=server.atlasEncounterPublic({name:'Test',phase:'active',round:1,activeId:'p',participants:[player,{...enemy,initiative:10}]});
 assert.equal(Object.hasOwn(pub,'monsterPlan'),false);assert.equal(JSON.stringify(pub).includes(m.name),false);
});
test('monster planner draft uses central Save and static catalog is cached',()=>{
 const ui=app.slice(app.indexOf(' // v3.15.0 Monster library'),app.indexOf(' function atlasBattleNew'));
 assert.doesNotMatch(ui,/cloudRequest|cloudPush|fetch\(/);
 assert.match(ui,/atlasBattleSave/);assert.match(app,/monsterPlan:atlasMonsterPlan/);
 for(const file of ['public/index.html','public/sw.js'])assert.match(fs.readFileSync(file,'utf8'),/monsters-2024\.js\?v=3\.16\.0/);
});
