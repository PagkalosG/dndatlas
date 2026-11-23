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
vm.runInContext(extension+'\nglobalThis.atlasTest = { valid:atlasValidRoster, changed:atlasFieldsChanged, encrypt:atlasDriveEncrypt, decrypt:atlasDriveDecrypt, handler:atlasExtensionRequest };',sandbox);
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
test('encrypted Drive JSON round-trips character roster',async()=>{
  const env={DRIVE_BACKUP_ENCRYPTION_KEY:'test-32-byte-secret-not-for-real-use-12345'};
  const roster=[{...c('one'),backgroundStory:'Private DM story'}];
  const encrypted=await h.encrypt(env,roster);
  assert.equal(encrypted.format,'dndatlas-encrypted-backup-v1');
  assert.ok(!JSON.stringify(encrypted).includes('Private DM story'));
  const decrypted=await h.decrypt(env,encrypted);
  assert.equal(JSON.stringify(decrypted.characters),JSON.stringify(roster));
});
test('Drive and History routes enforce Creator role server-side',async()=>{
  const context={pathname:'/sync/drive/status',method:'GET',actor:{id:3,role:'dm'},env:{},err:(code,message)=>Object.assign(Error(message),{code}),respond:x=>x};
  await assert.rejects(()=>h.handler(context),e=>e.code===403);
  const status=await h.handler({...context,actor:{id:1,role:'creator'}});
  assert.equal(status.configured,false);
});
