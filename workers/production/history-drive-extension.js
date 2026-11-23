// Production D&D Atlas extension: Creator-only version history, undo, and encrypted Drive backups.
// This module is inlined into the existing deployed Cloudflare Worker by the guarded deploy patch.
// Do not include credentials or backup payloads in client responses.
const atlasHistorySchema = "CREATE TABLE IF NOT EXISTS character_history (id INTEGER PRIMARY KEY AUTOINCREMENT, actor_user_id INTEGER NOT NULL, actor_name TEXT NOT NULL, action TEXT NOT NULL, character_id TEXT NOT NULL, character_name TEXT, owner_before INTEGER, owner_after INTEGER, before_json TEXT, after_json TEXT, group_id TEXT, undo_of INTEGER, changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)";
const atlasEnsureHistory = async env => env.DB.prepare(atlasHistorySchema).run();
const atlasSnapshot = row => row ? JSON.parse(row.data_json) : null;
const atlasHistoryWrite = (env, actor, action, id, before, after, ownerBefore = null, ownerAfter = null, group = null, undoOf = null) => env.DB.prepare(
 "INSERT INTO character_history(actor_user_id,actor_name,action,character_id,character_name,owner_before,owner_after,before_json,after_json,group_id,undo_of) VALUES(?,?,?,?,?,?,?,?,?,?,?)"
).bind(actor.id,actor.username,action,id,(after?.name||before?.name||id).slice(0,159),ownerBefore,ownerAfter,before ? JSON.stringify(before):null,after ? JSON.stringify(after):null,group,undoOf);

const atlasFieldsChanged = (before, after) => {
 const old = before || {}, now = after || {};
 const skip = new Set(['backgroundStory','story','portrait','_ownerId','storyPrivate']);
 const keys = new Set([...Object.keys(old),...Object.keys(now)]);
 const describe = value => {
  if(value === undefined)return null;
  if(value === null || typeof value !== 'object')return String(value).slice(0,120);
  return Array.isArray(value) ? 'Array ('+value.length+')' : 'Object';
 };
 return [...keys].filter(key=>!skip.has(key)&&JSON.stringify(old[key])!==JSON.stringify(now[key]))
   .slice(0,24).map(key=>({field:key,before:describe(old[key]),after:describe(now[key])}));
};

const atlasValidRoster = (roster, validCharacter) =>
 Array.isArray(roster)&&roster.length<=25&&roster.every(validCharacter)&&new Set(roster.map(ch=>ch.id)).size===roster.length;

async function atlasReplaceRoster(env, actor, roster, action) {
 await atlasEnsureHistory(env);
 const existing=(await env.DB.prepare('SELECT id,owner_user_id,data_json FROM characters').all()).results;
 const previous=new Map(existing.map(r=>[r.id,r]));
 const group=crypto.randomUUID();
 const updated=[];
 const statements=[
  env.DB.prepare('UPDATE users SET owner_character_id=NULL WHERE owner_character_id IS NOT NULL'),
  env.DB.prepare('DELETE FROM characters')
 ];
 for(const value of roster){
  const ch=structuredClone(value);
  delete ch._ownerId;
  const old=previous.get(ch.id);
  if(old && old.owner_user_id!==null){
   const snapshot=atlasSnapshot(old);
   // Do not allow a Creator import to read or overwrite somebody else's private story.
   if(snapshot.storyPublic!==true){
    ch.backgroundStory=snapshot.backgroundStory;
    ch.story=snapshot.story;
    ch.storyPublic=false;
   }
  }
  const owner=old?.owner_user_id??null;
  statements.push(env.DB.prepare('INSERT INTO characters(id,owner_user_id,data_json,modified_by) VALUES(?,?,?,?)').bind(ch.id,owner,JSON.stringify(ch),actor.id));
  if(owner!==null)statements.push(env.DB.prepare('UPDATE users SET owner_character_id=? WHERE id=?').bind(ch.id,owner));
  updated.push([ch.id,ch,owner]);
 }
 for(const row of existing)if(!updated.some(item=>item[0]===row.id)){
  statements.push(atlasHistoryWrite(env,actor,action,row.id,atlasSnapshot(row),null,row.owner_user_id,null,group));
 }
 for(const [id,ch,owner] of updated){
  const before=previous.get(id);
  statements.push(atlasHistoryWrite(env,actor,action,id,atlasSnapshot(before),ch,before?.owner_user_id??null,owner,group));
 }
 await env.DB.batch(statements);
 return {ok:true,count:roster.length,groupId:group};
}

const atlasDriveReady = env => Boolean(env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET&&env.GOOGLE_REFRESH_TOKEN&&env.DRIVE_JSON_FILE_ID&&env.DRIVE_BACKUP_ENCRYPTION_KEY&&env.DRIVE_BACKUP_ENCRYPTION_KEY.length>=32);
const atlasDriveIdOk = id => /^[a-zA-Z0-9_-]{10,160}$/.test(id||'');
async function atlasDriveAccessToken(env) {
 const payload=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,refresh_token:env.GOOGLE_REFRESH_TOKEN,grant_type:'refresh_token'});
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:payload});
 const body=await r.json().catch(()=>({}));
 if(!r.ok||!body.access_token)throw Object.assign(new Error('Google OAuth refresh failed. Check Drive credentials and scopes.'),{code:502});
 return body.access_token;
}
const atlasBase64 = array => {
 let text='';
 for(let i=0;i<array.length;i+=0x8000)text+=String.fromCharCode(...array.subarray(i,i+0x8000));
 return btoa(text);
};
const atlasUnbase64 = value => Uint8Array.from(atob(value),x=>x.charCodeAt(0));
async function atlasDriveCryptoKey(env) {
 const keyBytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(env.DRIVE_BACKUP_ENCRYPTION_KEY));
 return crypto.subtle.importKey('raw',keyBytes,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function atlasDriveEncrypt(env,roster) {
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const plaintext=new TextEncoder().encode(JSON.stringify({application:'D&D Atlas',schema:1,exportedAt:new Date().toISOString(),characters:roster}));
 const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await atlasDriveCryptoKey(env),plaintext));
 return {format:'dndatlas-encrypted-backup-v1',createdAt:new Date().toISOString(),iv:atlasBase64(iv),ciphertext:atlasBase64(ciphertext)};
}
async function atlasDriveDecrypt(env,body) {
 if(body?.format==='dndatlas-encrypted-backup-v1'){
  try{
   const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:atlasUnbase64(body.iv)},await atlasDriveCryptoKey(env),atlasUnbase64(body.ciphertext));
   return JSON.parse(new TextDecoder().decode(plaintext));
  }catch{throw Object.assign(new Error('Drive backup could not be decrypted. Encryption key mismatch or corrupt backup.'),{code:422});}
 }
 // Backward-compatible restore of previously uploaded plaintext JSON backups.
 return body;
}
async function atlasGoogleJSON(url, token, options={}) {
 const r=await fetch(url,{...options,headers:{Authorization:'Bearer '+token,...options.headers}});
 if(!r.ok){
  // Never relay Google error bodies, which could contain sensitive file details.
  throw Object.assign(new Error('Google Drive request failed (HTTP '+r.status+').'),{code:502});
 }
 return r;
}
async function atlasExtensionRequest({request,env,actor,pathname,method,respond,err,jsonBody,validCharacter,audit}) {
 const isHistory=pathname==='/history'||/^\/history\/\d+\/undo$/.test(pathname);
 const isDrive=pathname.startsWith('/sync/drive/');
 if(!isHistory&&!isDrive)return null;
 if(actor.role!=='creator')throw err(403,'Creator only');
 if(isHistory){
  await atlasEnsureHistory(env);
  if(pathname==='/history'&&method==='GET'){
   const limit=Math.min(100,Math.max(1,Number(new URL(request.url).searchParams.get('limit'))||40));
   const rows=(await env.DB.prepare('SELECT id,actor_user_id,actor_name,action,character_id,character_name,before_json,after_json,group_id,undo_of,changed_at FROM character_history ORDER BY id DESC LIMIT ?').bind(limit).all()).results;
   return respond({events:rows.map(r=>({id:r.id,actor:r.actor_name,action:r.action,characterId:r.character_id,characterName:r.character_name,at:r.changed_at,groupId:r.group_id,undoOf:r.undo_of,changes:atlasFieldsChanged(r.before_json?JSON.parse(r.before_json):null,r.after_json?JSON.parse(r.after_json):null)}))});
  }
  const undoRoute=pathname.match(/^\/history\/(\d+)\/undo$/);
  if(undoRoute&&method==='POST'){
   const id=Number(undoRoute[1]);
   const event=await env.DB.prepare('SELECT * FROM character_history WHERE id=?').bind(id).first();
   if(!event)throw err(404,'History entry not found');
   const newer=await env.DB.prepare('SELECT id FROM character_history WHERE character_id=? AND id>? LIMIT 1').bind(event.character_id,id).first();
   if(newer)throw err(409,'Newer character changes exist. Undo the newest entry first.');
   const current=await env.DB.prepare('SELECT * FROM characters WHERE id=?').bind(event.character_id).first();
   const after=event.after_json?JSON.parse(event.after_json):null;
   if(JSON.stringify(atlasSnapshot(current))!==JSON.stringify(after))throw err(409,'The character changed since this history entry. Refresh.');
   const before=event.before_json?JSON.parse(event.before_json):null;
   const targetOwner=event.owner_before;
   const mutations=[env.DB.prepare('UPDATE users SET owner_character_id=NULL WHERE owner_character_id=?').bind(event.character_id)];
   if(before){
    const user=targetOwner===null?null:await env.DB.prepare('SELECT id FROM users WHERE id=?').bind(targetOwner).first();
    const owner=user?.id??null;
    if(current)mutations.push(env.DB.prepare('UPDATE characters SET data_json=?,owner_user_id=?,modified_by=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(JSON.stringify(before),owner,actor.id,event.character_id));
    else mutations.push(env.DB.prepare('INSERT INTO characters(id,data_json,owner_user_id,modified_by) VALUES(?,?,?,?)').bind(event.character_id,JSON.stringify(before),owner,actor.id));
    if(owner!==null)mutations.push(env.DB.prepare('UPDATE users SET owner_character_id=? WHERE id=?').bind(event.character_id,owner));
   }else if(current){
    mutations.push(env.DB.prepare('DELETE FROM characters WHERE id=?').bind(event.character_id));
   }
   mutations.push(atlasHistoryWrite(env,actor,'undo',event.character_id,atlasSnapshot(current),before,current?.owner_user_id??null,before?targetOwner:null,crypto.randomUUID(),id));
   await env.DB.batch(mutations);
   await audit(env,actor.id,'undo-history',id);
   return respond({ok:true,characterId:event.character_id});
  }
  throw err(405,'Method not allowed');
 }
 if(pathname==='/sync/drive/status'&&method==='GET'){
  return respond({configured:atlasDriveReady(env),encrypted:true,direction:['Drive to D1','D1 to Drive'],manualOnly:true});
 }
 if(!['/sync/drive/import','/sync/drive/publish'].includes(pathname)||method!=='POST')throw err(405,'Method not allowed');
 if(!atlasDriveReady(env)||!atlasDriveIdOk(env.DRIVE_JSON_FILE_ID))throw err(503,'Drive backup not configured. Set Google OAuth and encryption secrets in Cloudflare.');
 const token=await atlasDriveAccessToken(env);
 const fileId=encodeURIComponent(env.DRIVE_JSON_FILE_ID);
 if(pathname==='/sync/drive/import'){
  const r=await atlasGoogleJSON('https://www.googleapis.com/drive/v3/files/'+fileId+'?alt=media',token);
  const blob=await r.text();
  if(blob.length>1800000)throw err(413,'Drive JSON too large');
  let raw;
  try{raw=await atlasDriveDecrypt(env,JSON.parse(blob));}catch(ex){if(ex.code)throw ex;throw err(422,'Invalid Drive JSON');}
  if(!atlasValidRoster(raw?.characters,validCharacter))throw err(422,'Invalid roster in Drive JSON');
  const result=await atlasReplaceRoster(env,actor,raw.characters,'drive-restore');
  await audit(env,actor.id,'restore-drive',result.count);
  return respond(result);
 }
 const rows=(await env.DB.prepare('SELECT data_json FROM characters ORDER BY updated_at DESC').all()).results;
 const roster=rows.map(row=>JSON.parse(row.data_json));
 if(!atlasValidRoster(roster,validCharacter))throw err(422,'Invalid D1 roster');
 const envelope=await atlasDriveEncrypt(env,roster);
 const archivedName='dndatlas-before-backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
 // Preserve the previous Drive version before writing a new one.
 const archive=await atlasGoogleJSON('https://www.googleapis.com/drive/v3/files/'+fileId+'/copy?fields=id,name',token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:archivedName})});
 const archived=await archive.json();
 if(!archived.id)throw err(502,'Unable to archive previous Drive JSON');
 await atlasGoogleJSON('https://www.googleapis.com/upload/drive/v3/files/'+fileId+'?uploadType=media',token,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(envelope)});
 await atlasEnsureHistory(env);
 await atlasHistoryWrite(env,actor,'drive-backup','__party__',null,{name:'Encrypted Drive backup',count:roster.length},null,null,crypto.randomUUID()).run();
 await audit(env,actor.id,'publish-drive',roster.length);
 return respond({ok:true,count:roster.length,archivedPrevious:true});
}
