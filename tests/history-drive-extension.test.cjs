const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');

const extension=fs.readFileSync('workers/production/history-drive-extension.js','utf8');
const sandbox=vm.createContext({
  crypto:webcrypto,
  TextEncoder,TextDecoder,URLSearchParams,URL,Response,Request,
  btoa,atob,console,fetch:async()=>{throw Error('Unexpected network access in tests')}
});
vm.runInContext(extension+'\nglobalThis.atlasTest = { valid:atlasValidRoster, changed:atlasFieldsChanged, handler:atlasExtensionRequest };',sandbox);
const h=sandbox.atlasTest;
const validCharacter=c=>typeof c?.id==='string'&&typeof c?.name==='string'&&Array.isArray(c?.classes);
const c=(id,name='Hero')=>({id,name,classes:[{name:'Fighter',level:3}]});

test('validates roster uniqueness and size',()=>{
  assert.equal(h.valid([c('one'),c('two')],validCharacter),true);
  assert.equal(h.valid([c('one'),c('one')],validCharacter),false);
  assert.equal(h.valid([c('one'),{}],validCharacter),false);
  assert.equal(h.valid(Array.from({length:26},(_,i)=>c('id'+i)),validCharacter),false);
});
test('history never echoes free-text private values, unknown fields or portrait content',()=>{
 const changes=h.changed(
  {hp:30,backgroundStory:'SECRET',notes:'SECRET notes',portrait:'SECRET image'},
  {hp:12,backgroundStory:'DIFFERENT',notes:'private now',portrait:'image updated'}
 );
 const hp=changes.find(x=>x.field==='hp');
 assert.equal(hp.before,'30');
 assert.equal(hp.after,'12');
 const serialized=JSON.stringify(changes);
 assert.ok(!serialized.includes('SECRET'));
 assert.ok(!serialized.includes('private now'));
 assert.ok(!serialized.includes('portrait'));
 assert.equal(changes.filter(x=>x.field==='[redacted]').length,3);
});
test('history grouped restore route is Creator-only and validates group state before writes',async()=>{
 const err=(code,message)=>Object.assign(Error(message),{code});
 const base={request:new Request('https://example.test/history/group/01234567-89ab-cdef-0123-456789abcdef/undo',{method:'POST'}),pathname:'/history/group/01234567-89ab-cdef-0123-456789abcdef/undo',method:'POST',actor:{id:1,role:'creator',username:'creator'},respond:x=>x,err,audit:async()=>{}};
 await assert.rejects(()=>h.handler({...base,actor:{id:2,role:'dm'}}),e=>e.code===403);
 let writes=0;
 const env={DB:{prepare(sql){return {bind(){return this},run:async()=>{writes++},all:async()=>({results:[]})}}}};
 await assert.rejects(()=>h.handler({...base,env}),e=>e.code===409);
 assert.equal(writes,1); // CREATE TABLE IF NOT EXISTS for history; no character mutations
});
test('Google OAuth and Drive writes are completely absent',()=>{
  assert.equal(extension.includes('GOOGLE_CLIENT_ID'),false);
  assert.equal(extension.includes('DRIVE_JSON_FILE_ID'),false);
  assert.equal(extension.includes('https://www.googleapis.com/'),false);
  assert.equal(extension.includes('atlasDriveEncrypt'),false);
});
test('Drive sync is disabled for Creator and forbidden for DM',async()=>{
  const err=(code,message)=>Object.assign(Error(message),{code});
  const base={pathname:'/sync/drive/import',method:'POST',env:{},err,respond:x=>x};
  await assert.rejects(()=>h.handler({...base,actor:{id:3,role:'dm'}}),e=>e.code===403);
  await assert.rejects(()=>h.handler({...base,actor:{id:1,role:'creator'}}),e=>e.code===410);
  await assert.rejects(()=>h.handler({...base,pathname:'/sync/drive/publish',actor:{id:1,role:'creator'}}),e=>e.code===410);
});

test('authenticated revision polling exposes only ids and revision numbers',async()=>{
  let query='';
  const env={DB:{prepare(sql){query=sql;return {all:async()=>({results:[{id:'borruk',revision:5},{id:'luna',revision:2}]})};}}};
  const result=await h.handler({
    pathname:'/sync/revisions',method:'GET',env,
    actor:{id:9,role:'player'},respond:x=>x,
    err:(code,message)=>Object.assign(Error(message),{code})
  });
  assert.equal(query,'SELECT id,revision FROM characters');
  assert.equal(result.revisions.borruk,5);
  assert.equal(result.revisions.luna,2);
  assert.equal(JSON.stringify(result).includes('story'),false);
});
test('revision polling rejects writes and unauthorised Drive operations',async()=>{
  const err=(code,message)=>Object.assign(Error(message),{code});
  await assert.rejects(()=>h.handler({
    pathname:'/sync/revisions',method:'POST',env:{},actor:{id:9,role:'player'},err,respond:x=>x
  }),e=>e.code===405);
  await assert.rejects(()=>h.handler({
    pathname:'/sync/drive/import',method:'POST',env:{},actor:{id:9,role:'player'},err,respond:x=>x
  }),e=>e.code===403);
});
