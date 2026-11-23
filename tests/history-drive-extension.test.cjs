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

test('atomic group undo prepares one D1 batch for all characters and logs each restore',async()=>{
 const id='01234567-89ab-cdef-0123-456789abcdef';
 const first={id:101,group_id:id,character_id:'borruk',owner_before:7,owner_after:7,before_json:JSON.stringify(c('borruk','Original Borruk')),after_json:JSON.stringify(c('borruk','Updated Borruk'))};
 const second={id:102,group_id:id,character_id:'luna',owner_before:null,owner_after:null,before_json:null,after_json:JSON.stringify(c('luna'))};
 let batch=null;
 const queries=[];
 const env={DB:{
  prepare(sql){
   const query={sql,args:[],bind(...params){this.args=params;return this},run:async()=>({}),first:async()=>null,all:async()=>{
    if(sql.startsWith('SELECT * FROM character_history WHERE group_id='))return {results:[first,second]};
    if(sql.startsWith('SELECT character_id,MAX(id)'))return {results:[{character_id:'borruk',last_id:101},{character_id:'luna',last_id:102}]};
    if(sql.startsWith('SELECT * FROM characters WHERE id IN'))return {results:[
      {id:'borruk',owner_user_id:7,revision:4,data_json:first.after_json},
      {id:'luna',owner_user_id:null,revision:1,data_json:second.after_json}
    ]};
    if(sql.startsWith('SELECT id,owner_character_id FROM users'))return {results:[{id:7,owner_character_id:'borruk'}]};
    throw Error('Unexpected SQL: '+sql);
   }};
   queries.push(query);return query;
  },
  async batch(items){batch=items;return []}
 }};
 const error=(code,message)=>Object.assign(Error(message),{code});
 const response=await h.handler({env,actor:{id:1,role:'creator',username:'admin'},request:new Request('https://atlas.test/history/group/'+id+'/undo',{method:'POST'}),pathname:'/history/group/'+id+'/undo',method:'POST',respond:x=>x,err:error,audit:async()=>{}});
 assert.equal(response.count,2);
 assert.ok(Array.isArray(batch));
 assert.equal(batch.filter(q=>q.sql.startsWith('INSERT INTO character_history')).length,2);
 assert.equal(batch.filter(q=>q.sql.startsWith('DELETE FROM characters')).length,1);
 assert.equal(batch.filter(q=>q.sql.startsWith('INSERT INTO characters')).length,1);
 assert.equal(batch.find(q=>q.sql.startsWith('INSERT INTO characters')).args[4],5);
 assert.ok(batch.some(q=>q.sql.startsWith('UPDATE users SET owner_character_id=NULL')));
});
test('group undo refuses when a grouped character received a newer change',async()=>{
 const group='01234567-89ab-cdef-0123-456789abcdef';
 const entry={id:101,group_id:group,character_id:'borruk',owner_before:null,owner_after:null,before_json:null,after_json:JSON.stringify(c('borruk'))};
 let batchCalls=0;
 const env={DB:{
  prepare(sql){return {bind(){return this},run:async()=>({}),all:async()=>{
   if(sql.startsWith('SELECT * FROM character_history WHERE group_id='))return {results:[entry,{...entry,id:102,character_id:'luna'}]};
   if(sql.startsWith('SELECT character_id,MAX(id)'))return {results:[{character_id:'borruk',last_id:105},{character_id:'luna',last_id:102}]};
   throw Error('Unexpected SQL: '+sql);
  }}},
  batch:async()=>{batchCalls++}
 }};
 await assert.rejects(()=>h.handler({
  request:new Request('https://atlas.test/history/group/'+group+'/undo',{method:'POST'}),
  pathname:'/history/group/'+group+'/undo',method:'POST',env,actor:{id:1,role:'creator',username:'admin'},respond:x=>x,err:(code,message)=>Object.assign(Error(message),{code}),audit:async()=>{}
 }),e=>e.code===409);
 assert.equal(batchCalls,0);
});
