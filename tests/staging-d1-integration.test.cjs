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
  compatibilityDate:'2026-11-01',
  d1Databases:{DB:'atlas-isolated-test-database'},
  bindings:{ALLOWED_ORIGIN:origin,RECOVERY_PEPPER:'integration-only-not-a-real-production-secret'},
  verbose:false
 });
 try{
  const db=await mf.getD1Database('DB');
  await db.exec(`
   CREATE TABLE users (
     id INTEGER PRIMARY KEY,username TEXT NOT NULL,role TEXT NOT NULL,
     active INTEGER NOT NULL DEFAULT 1,owner_character_id TEXT,
     password_salt TEXT DEFAULT '',password_hash TEXT DEFAULT ''
   );
   CREATE TABLE auth_sessions (
     token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL,
     expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL
   );
   CREATE TABLE characters (
     id TEXT PRIMARY KEY,owner_user_id INTEGER,
     data_json TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,
     modified_by INTEGER,updated_at TEXT DEFAULT CURRENT_TIMESTAMP
   );
   CREATE TABLE audit_log (
     id INTEGER PRIMARY KEY AUTOINCREMENT,actor_user_id INTEGER,
     action TEXT NOT NULL,subject TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP
   );
  `);
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
  await t.test('direct Drive API remains forbidden or disabled',async()=>{
   assert.equal((await req(mf,'/sync/drive/publish',1,'POST',{})).status,410);
   assert.equal((await req(mf,'/sync/drive/import',2,'POST',{})).status,403);
  });
 }finally{await mf.dispose();}
});
