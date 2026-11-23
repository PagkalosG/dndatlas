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
test('history diffs exclude private stories and portraits',()=>{
  const changes=h.changed(
    {hp:30,backgroundStory:'SECRET',story:'SECRET',portrait:'rawImage'},
    {hp:12,backgroundStory:'DIFFERENT',story:'DIFFERENT',portrait:'rawImage2'}
  );
  assert.equal(changes.length,1);
  assert.equal(changes[0].field,'hp');
  assert.equal(changes[0].before,'30');
  assert.equal(changes[0].after,'12');
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
