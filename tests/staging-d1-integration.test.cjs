#!/usr/bin/env node
// Local D1 integration testing of the *deployed* production Worker source.
// Never connects to the production D1, copies data, or uses real user credentials.
const assert=require('node:assert/strict');
const {test}=require('node:test');
const crypto=require('node:crypto');
const {Miniflare}=require('miniflare');
const fs=require('node:fs');

const source=process.env.ATLAS_WORKER_SOURCE;
if(!source||!fs.existsSync(source))throw Error('Set ATLAS_WORKER_SOURCE to verified production Worker module');
const origin='https://pagkalosg.github.io';
const hash=token=>crypto.createHash('sha256').update(token).digest('hex');
const userToken=id=>String(id).padStart(64,'a');
const character=(id,name,extra={})=>({id,name,classes:[{id:'fighter',level:3}],storyPublic:false,backgroundStory:'SECRET '+id,notes:'PRIVATE '+id,...extra});
const seeded={
  borruk:character('borruk','Borruk',{hp:31}),
  luna:character('luna','Luna',{hp:20}),
};
const req=async(mf,path,roleId,method='GET',payload)=> {
 const response=await mf.dispatchFetch('https://atlas-integration.invalid'+path,{
  method,headers:{Origin:origin,Authorization:'Bearer '+userToken(roleId),...(payload===undefined?{}:{'Content-Type':'application/json'})},
  ...(payload===undefined?{}:{body:JSON.stringify(payload)})
 });
 const body=await response.json().catch(()=>({}));
 return {status:response.status,body};
};

test('isolated actual D1 integration: Creator, DM, Player, privacy, Undo, conflicts',async t=>{
 const mf=new Miniflare({
  scriptPath:source,
  modules:true,
  compatibilityDate:'2026-08-01',
  d1Databases:{DB:'atlas-isolated-test-database'},
  bindings:{ALLOWED_ORIGIN:origin,RECOVERY_PEPPER:'integration-only-not-a-real-production-secret',ATLAS_BACKUP_SECRET:'INTEGRATION_ONLY_very_long_random_not_a_prod_key_2026'},
  verbose:false
 });
 try{
  const db=await mf.getD1Database('DB');
  for(const statement of [
   "CREATE TABLE users (\n     id INTEGER PRIMARY KEY,username TEXT NOT NULL,role TEXT NOT NULL,\n     active INTEGER NOT NULL DEFAULT 1,owner_character_id TEXT,\n     password_salt TEXT DEFAULT '',password_hash TEXT DEFAULT ''\n   )",
   "CREATE TABLE auth_sessions (\n     token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL,\n     expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL\n   )",
   "CREATE TABLE characters (\n     id TEXT PRIMARY KEY,owner_user_id INTEGER,\n     data_json TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,\n     modified_by INTEGER,updated_at TEXT DEFAULT CURRENT_TIMESTAMP\n   )",
   "CREATE TABLE audit_log (\n     id INTEGER PRIMARY KEY AUTOINCREMENT,actor_user_id INTEGER,\n     action TEXT NOT NULL,subject TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP\n   )",
  ])await db.prepare(statement).run();
  for(const [id,username,role,char] of [[1,'creator','creator',null],[2,'dm','dm',null],[3,'player_a','player','borruk'],[4,'player_b','player','luna']]){
   await db.prepare('INSERT INTO users(id,username,role,active,owner_character_id) VALUES(?,?,?,1,?)').bind(id,username,role,char).run();
   await db.prepare('INSERT INTO auth_sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)')
     .bind(hash(userToken(id)),id,Date.now()+86400000,Date.now()).run();
  }
  for(const [id,owner] of [['borruk',3],['luna',4]]){
   await db.prepare('INSERT INTO characters(id,owner_user_id,data_json,revision,modified_by) VALUES(?,?,?,?,?)')
    .bind(id,owner,JSON.stringify(seeded[id]),1,1).run();
  }
  await t.test('role-based character privacy is enforced by the Worker',async()=>{
   const player=await req(mf,'/characters',3);
   assert.equal(player.status,200,JSON.stringify(player.body));
   const own=player.body.characters.find(x=>x.id==='borruk');
   const other=player.body.characters.find(x=>x.id==='luna');
   assert.equal(own.data.backgroundStory,'SECRET borruk');
   assert.equal(other.data.backgroundStory,undefined);
   const creator=await req(mf,'/characters',1);
   assert.equal(creator.status,200);
   assert.equal(creator.body.characters.find(x=>x.id==='borruk').data.backgroundStory,undefined);
   const dm=await req(mf,'/characters',2);
   assert.equal(dm.status,200);
   assert.equal(dm.body.characters.find(x=>x.id==='borruk').data.backgroundStory,'SECRET borruk');
  });
  await t.test('permissions: own edit allowed, others forbidden, delete/replace forbidden',async()=>{
   const denied=await req(mf,'/characters/luna',3,'PUT',{character:{...seeded.luna,hp:1},revision:1});
   assert.equal(denied.status,403,JSON.stringify(denied.body));
   const deletion=await req(mf,'/characters/borruk',3,'DELETE');
   assert.equal(deletion.status,403,JSON.stringify(deletion.body));
   const replacement=await req(mf,'/characters/replace',3,'POST',{characters:[seeded.borruk]});
   assert.equal(replacement.status,403,JSON.stringify(replacement.body));
   const own=await req(mf,'/characters/borruk',3,'PUT',{character:{...seeded.borruk,hp:25},revision:1});
   assert.equal(own.status,200,JSON.stringify(own.body));
   const stale=await req(mf,'/characters/borruk',3,'PUT',{character:{...seeded.borruk,hp:19},revision:1});
   assert.equal(stale.status,409,JSON.stringify(stale.body));
  });
  await t.test('Creator-only History: nobody receives another player private stories',async()=>{
   for(const role of [2,3,4]){
    const result=await req(mf,'/history',role);
    assert.equal(result.status,403,JSON.stringify(result.body));
   }
   const history=await req(mf,'/history',1);
   assert.equal(history.status,200,JSON.stringify(history.body));
   assert.ok(history.body.events.length>=1);
   assert.ok(!JSON.stringify(history.body).includes('SECRET borruk'));
   const recent=history.body.events[0];
   const denyUndo=await req(mf,'/history/'+recent.id+'/undo',2,'POST',{});
   assert.equal(denyUndo.status,403,JSON.stringify(denyUndo.body));
  });
  await t.test('Creator and DM may replace roster, preserving existing private story',async()=>{
   const replacement=await req(mf,'/characters/replace',2,'POST',{characters:[
    character('borruk','Borruk altered',{hp:7,backgroundStory:'Attempted overwrite'}),
    character('luna','Luna altered',{hp:12,backgroundStory:'Attempted overwrite'})
   ]});
   assert.equal(replacement.status,200,JSON.stringify(replacement.body));
   const check=await req(mf,'/characters',2);
   assert.equal(check.status,200,JSON.stringify(check.body));
   assert.equal(check.body.characters.find(x=>x.id==='borruk').data.backgroundStory,'SECRET borruk');
   assert.equal(check.body.characters.find(x=>x.id==='luna').data.backgroundStory,'SECRET luna');
   assert.ok(replacement.body.groupId);
   const forbid=await req(mf,'/history/group/'+replacement.body.groupId+'/undo',2,'POST',{});
   assert.equal(forbid.status,403,JSON.stringify(forbid.body));
   const undo=await req(mf,'/history/group/'+replacement.body.groupId+'/undo',1,'POST',{});
   assert.equal(undo.status,200,JSON.stringify(undo.body));
   assert.equal(undo.body.count,2);
   const after=await req(mf,'/characters',2);
   assert.equal(after.body.characters.find(x=>x.id==='borruk').data.hp,25);
   assert.equal(after.body.characters.find(x=>x.id==='luna').data.hp,20);
  });
  await t.test('revisions are read-only, authenticated and contain no private fields',async()=>{
   const result=await req(mf,'/sync/revisions',3);
   assert.equal(result.status,200,JSON.stringify(result.body));
   assert.equal(typeof result.body.revisions.borruk,'number');
   assert.ok(!JSON.stringify(result.body).includes('SECRET'));
   const attempt=await req(mf,'/sync/revisions',3,'POST',{});
   assert.equal(attempt.status,405);
  });
  await t.test('group Undo rejects newer player edits and leaves the whole roster unchanged',async()=>{
   const before=await req(mf,'/characters',2);
   const roster=before.body.characters.map(row=>({...row.data,hp:row.data.id==='borruk'?15:10}));
   const replacement=await req(mf,'/characters/replace',2,'POST',{characters:roster});
   assert.equal(replacement.status,200,JSON.stringify(replacement.body));
   const current=await req(mf,'/characters/borruk',3);
   const playerUpdate=await req(mf,'/characters/borruk',3,'PUT',{
    character:{...current.body.data,hp:9},revision:current.body.revision
   });
   assert.equal(playerUpdate.status,200,JSON.stringify(playerUpdate.body));
   const refused=await req(mf,'/history/group/'+replacement.body.groupId+'/undo',1,'POST',{});
   assert.equal(refused.status,409,JSON.stringify(refused.body));
   const after=await req(mf,'/characters',2);
   assert.equal(after.body.characters.find(x=>x.id==='borruk').data.hp,9);
   assert.equal(after.body.characters.find(x=>x.id==='luna').data.hp,10);
  });
  await t.test('anonymous access and invalid cross-origin are denied',async()=>{
   const anonymous=await mf.dispatchFetch('https://atlas-integration.invalid/characters',{headers:{Origin:origin}});
   assert.equal(anonymous.status,401);
   const wrongOrigin=await mf.dispatchFetch('https://atlas-integration.invalid/characters',{
    headers:{Origin:'https://attacker.invalid',Authorization:'Bearer '+userToken(3)}
   });
   assert.equal(wrongOrigin.status,403);
  });
  await t.test('DM quick edits: proficiency, Expertise and HP / Perception / Speed persist securely',async()=>{
   const path='/characters/borruk/dm-override';
   const latest=await req(mf,'/characters/borruk',2);
   let revision=latest.body.revision;
   const denied=await req(mf,path,3,'PATCH',{revision,skill:'Perception',rank:1});
   assert.equal(denied.status,403,JSON.stringify(denied.body));
   const badSkill=await req(mf,path,2,'PATCH',{revision,skill:'Not a Skill',rank:1});
   assert.equal(badSkill.status,400,JSON.stringify(badSkill.body));
   const badRank=await req(mf,path,2,'PATCH',{revision,skill:'Perception',rank:5});
   assert.equal(badRank.status,400,JSON.stringify(badRank.body));
   const illegalField=await req(mf,path,2,'PATCH',{revision,field:'backgroundStory',value:1});
   assert.equal(illegalField.status,400,JSON.stringify(illegalField.body));
   const overpost=await req(mf,path,2,'PATCH',{revision,skill:'Perception',rank:1,backgroundStory:'LEAK'});
   assert.equal(overpost.status,400,JSON.stringify(overpost.body));
   const results=[
    {skill:'Perception',rank:1},
    {skill:'Perception',rank:2},
    {field:'maxHp',value:42},
    {field:'passivePerception',value:17},
    {field:'speed',value:35},
    {field:'passivePerception',value:null}
   ];
   for(const value of results){
    const result=await req(mf,path,2,'PATCH',{revision,...value});
    assert.equal(result.status,200,JSON.stringify(result.body));
    revision=result.body.revision;
   }
   const stale=await req(mf,path,2,'PATCH',{revision:latest.body.revision,skill:'Perception',rank:0});
   assert.equal(stale.status,409,JSON.stringify(stale.body));
   const data=(await req(mf,'/characters/borruk',2)).body.data;
   assert.equal(data.skills.Perception,2);
   assert.equal(data.hp.max,42);
   assert.equal(data.passivePerceptionOverride,'');
   assert.equal(data.speed,35);
   assert.equal(data.backgroundStory,'SECRET borruk');
   assert.equal(data.notes,'PRIVATE borruk');
   const creator=await req(mf,'/history',1);
   assert.equal(creator.status,200,JSON.stringify(creator.body));
   assert.equal(creator.body.events.some(row=>row.action==='dm-override'),true);
   assert.ok(!JSON.stringify(creator.body).includes('SECRET borruk'));
   assert.ok(!JSON.stringify(creator.body).includes('PRIVATE borruk'));
  });
  await t.test('Creator can change one skill, but Player cannot and no other field is replaced',async()=>{
   const current=await req(mf,'/characters/luna',2);
   const before=current.body.data;
   const result=await req(mf,'/characters/luna/dm-override',1,'PATCH',{
    revision:current.body.revision,skill:'Medicine',rank:1
   });
   assert.equal(result.status,200,JSON.stringify(result.body));
   const next=(await req(mf,'/characters/luna',2)).body.data;
   assert.equal(next.skills.Medicine,1);
   assert.equal(next.backgroundStory,before.backgroundStory);
   assert.equal(next.notes,before.notes);
  });
  await t.test('Creator secure backup is opaque, authenticated and restores private story exactly',async()=>{
   const forbidden=await req(mf,'/backup/secure',2);
   assert.equal(forbidden.status,403,JSON.stringify(forbidden.body));
   const exported=await req(mf,'/backup/secure',1);
   assert.equal(exported.status,200,JSON.stringify(exported.body));
   assert.equal(exported.body.format,'dndatlas-sealed-party-v1');
   assert.ok(exported.body.count>=2);
   assert.ok(!JSON.stringify(exported.body).includes('SECRET luna'));
   assert.ok(!JSON.stringify(exported.body).includes('PRIVATE borruk'));
   const wrongBody={...exported.body,ciphertext:exported.body.ciphertext.slice(0,-4)+'AAAA'};
   assert.equal((await req(mf,'/backup/secure/restore',1,'POST',wrongBody)).status,422);
   const previous=await req(mf,'/characters/luna',4);
   const changed={...previous.body.data,backgroundStory:'UPDATED AFTER BACKUP'};
   const updated=await req(mf,'/characters/luna',4,'PUT',{character:changed,revision:previous.body.revision});
   assert.equal(updated.status,200,JSON.stringify(updated.body));
   const restored=await req(mf,'/backup/secure/restore',1,'POST',exported.body);
   assert.equal(restored.status,200,JSON.stringify(restored.body));
   const after=await req(mf,'/characters/luna',4);
   assert.equal(after.body.data.backgroundStory,'SECRET luna');
   assert.equal(after.body.data.notes,'PRIVATE luna');
   const filtered=await req(mf,'/characters',1);
   assert.equal(filtered.body.characters.find(c=>c.id==='luna').data.backgroundStory,undefined);
  });
  await t.test('transactional Undo guard refuses stale history inside one D1 batch',async()=>{
   await db.prepare('CREATE TABLE IF NOT EXISTS atlas_undo_guard(id INTEGER PRIMARY KEY CHECK(id=1), valid INTEGER NOT NULL CHECK(valid=1))').run();
   let before=await db.prepare('SELECT COUNT(*) AS n FROM characters').first();
   await assert.rejects(()=>db.batch([
    db.prepare('INSERT INTO atlas_undo_guard(id,valid) VALUES(1,0) ON CONFLICT(id) DO UPDATE SET valid=excluded.valid'),
    db.prepare('DELETE FROM characters')
   ]));
   const after=await db.prepare('SELECT COUNT(*) AS n FROM characters').first();
   assert.equal(after.n,before.n);
  });
  await t.test('private encounter persistence, role enforcement and stale revision conflicts',async()=>{
   const p={id:'a',type:'player',characterId:'borruk',name:'Borruk',initiative:15,out:false},enemy={id:'b',type:'enemy',name:'Secret enemy',initiative:10,hp:7,maxHp:7,ac:15,out:false};
   const state={name:'Secret encounter',phase:'active',round:1,activeId:'a',participants:[p,enemy]};
   assert.equal((await req(mf,'/encounter',3)).status,403);
   assert.equal((await req(mf,'/encounter',3,'PUT',{revision:0,encounter:state})).status,403);
   assert.equal((await req(mf,'/encounter',2)).body.revision,0);
   const created=await req(mf,'/encounter',2,'PUT',{revision:0,encounter:state});assert.equal(created.status,200,JSON.stringify(created.body));assert.equal(created.body.revision,1);
   assert.equal((await req(mf,'/encounter',1)).body.encounter.name,state.name);
   const updated=await req(mf,'/encounter',1,'PUT',{revision:1,encounter:{...state,activeId:'b'}});assert.equal(updated.status,200);
   assert.equal((await req(mf,'/encounter',2,'PUT',{revision:1,encounter:state})).status,409);
   assert.equal((await req(mf,'/encounter',2,'PUT',{revision:2,encounter:{...state,participants:[{...p,characterId:'missing'},enemy]}})).status,400);
   assert.equal((await req(mf,'/encounter',2)).body.encounter.activeId,'b');
   const denied=await req(mf,'/encounter',4);assert.equal(denied.status,403);assert.ok(!JSON.stringify(denied.body).includes('Secret'));
   const sheetBefore=(await req(mf,'/characters/borruk',2)).body;
   const ended=await req(mf,'/encounter',2,'PUT',{revision:2,encounter:{...state,phase:'ended',round:4,activeId:'b',participants:[{...p,out:true},enemy,{...enemy,id:'ally',type:'ally'}]}});
   assert.equal(ended.status,200,JSON.stringify(ended.body));assert.equal(ended.body.encounter.activeId,null);assert.equal(ended.body.encounter.round,1);assert.equal(ended.body.encounter.participants.length,1);assert.equal(ended.body.encounter.participants[0].initiative,null);assert.equal(ended.body.encounter.participants[0].out,false);
   assert.equal((await req(mf,'/encounter',2)).body.encounter.participants.length,1);
   assert.equal((await req(mf,'/encounter',3,'DELETE',{revision:3})).status,403);
   assert.equal((await req(mf,'/encounter',2,'DELETE',{revision:2})).status,409);
   const removed=await req(mf,'/encounter',2,'DELETE',{revision:3});assert.equal(removed.status,200,JSON.stringify(removed.body));assert.equal(removed.body.revision,4);assert.equal(removed.body.encounter,null);
   assert.equal((await req(mf,'/encounter',1)).body.encounter,null);
   assert.equal((await req(mf,'/encounter',2,'PUT',{revision:3,encounter:state})).status,409);
   assert.equal((await req(mf,'/encounter',2,'PUT',{revision:4,encounter:state})).status,200);
   assert.equal((await req(mf,'/encounter',1,'DELETE',{revision:5})).status,200);
   assert.deepEqual((await req(mf,'/characters/borruk',2)).body,sheetBefore);
   const event={id:'evt',round:1,turn:'a',at:'2026-11-24T10:00:00Z',actor:'a',actorName:'Borruk',target:'b',targetName:'Secret enemy',kind:'attack',label:'Spear',outcome:'hit',amount:4,hpMode:'damage',note:'private note'};
   const archive={archiveId:'arch',name:'Secret encounter',round:1,participants:[p,enemy],events:[event],endedAt:'2026-11-24T10:01:00Z'};
   const batch=await req(mf,'/encounter',2,'PUT',{revision:6,encounter:{...state,events:[event]},history:[archive]});
   assert.equal(batch.status,200,JSON.stringify(batch.body));assert.equal(batch.body.history.length,1);
   const projection=await req(mf,'/encounter?public=1',3);assert.equal(projection.status,200);assert.equal(projection.body.encounter.currentCharacterId,'borruk');assert.ok(!JSON.stringify(projection.body).includes('Secret'));assert.ok(!JSON.stringify(projection.body).includes('private note'));assert.equal(projection.body.history,undefined);
   assert.equal((await req(mf,'/encounter?public=1',3,'PUT',{revision:7,encounter:null,history:[]})).status,403);
   assert.equal((await req(mf,'/encounter',2,'PUT',{revision:7,encounter:null,history:[archive]})).status,200);
   assert.equal((await req(mf,'/encounter',2)).body.history.length,1);
  });
  await t.test('direct Drive API remains forbidden or disabled',async()=>{
   assert.equal((await req(mf,'/sync/drive/publish',1,'POST',{})).status,410);
   assert.equal((await req(mf,'/sync/drive/import',2,'POST',{})).status,403);
  });
 }finally{await mf.dispose();}
});
