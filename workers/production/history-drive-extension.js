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

async function atlasExtensionRequest({request,env,actor,pathname,method,respond,err,jsonBody,validCharacter,audit}) {
 // Lightweight authenticated revision check for all campaign members.
 // Returns no character contents or private story fields.
 if(pathname==='/sync/revisions'){
  if(method!=='GET')throw err(405,'Method not allowed');
  const rows=(await env.DB.prepare('SELECT id,revision FROM characters').all()).results||[];
  return respond({revisions:Object.fromEntries(rows.map(row=>[row.id,Number(row.revision)]))});
 }
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
 // Drive read/write API intentionally disabled: use Creator's downloaded JSON restore.
 throw err(410,'Direct Google Drive sync disabled. Use the Creator-only local JSON restore.');
}
