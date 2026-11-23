// Production D&D Atlas extension: Creator-only version history, undo, and encrypted Drive backups.
// This module is inlined into the existing deployed Cloudflare Worker by the guarded deploy patch.
// Do not include credentials or backup payloads in client responses.
const atlasHistorySchema = "CREATE TABLE IF NOT EXISTS character_history (id INTEGER PRIMARY KEY AUTOINCREMENT, actor_user_id INTEGER NOT NULL, actor_name TEXT NOT NULL, action TEXT NOT NULL, character_id TEXT NOT NULL, character_name TEXT, owner_before INTEGER, owner_after INTEGER, before_json TEXT, after_json TEXT, group_id TEXT, undo_of INTEGER, changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)";
const atlasEnsureHistory = async env => env.DB.prepare(atlasHistorySchema).run();
const atlasSnapshot = row => row ? JSON.parse(row.data_json) : null;
const atlasUndoGuardSchema='CREATE TABLE IF NOT EXISTS atlas_undo_guard(id INTEGER PRIMARY KEY CHECK(id=1),valid INTEGER NOT NULL CHECK(valid=1))';
const atlasEnsureUndoGuard=env=>env.DB.prepare(atlasUndoGuardSchema).run();
// A failed CHECK aborts the entire D1 batch, including any earlier statements.
// The latest history ID, exact snapshot, ownership and revision are checked
// inside the transaction instead of relying only on non-atomic preflight reads.
const atlasUndoGuardWrite=(env,event,current)=>{
 const hasAfter=event.after_json!==null;
 const where=hasAfter?'EXISTS(SELECT 1 FROM characters WHERE id=? AND owner_user_id IS ? AND data_json=? AND revision=?)':'NOT EXISTS(SELECT 1 FROM characters WHERE id=?)';
 const sql='INSERT INTO atlas_undo_guard(id,valid) VALUES(1,CASE WHEN (SELECT MAX(id) FROM character_history WHERE character_id=?)=? AND '+where+' THEN 1 ELSE 0 END) ON CONFLICT(id) DO UPDATE SET valid=excluded.valid';
 const args=[event.character_id,event.id,event.character_id];
 if(hasAfter)args.push(event.owner_after,event.after_json,Number(current?.revision||0));
 return env.DB.prepare(sql).bind(...args);
};

const atlasHistoryWrite = (env, actor, action, id, before, after, ownerBefore = null, ownerAfter = null, group = null, undoOf = null) => env.DB.prepare(
 "INSERT INTO character_history(actor_user_id,actor_name,action,character_id,character_name,owner_before,owner_after,before_json,after_json,group_id,undo_of) VALUES(?,?,?,?,?,?,?,?,?,?,?)"
).bind(actor.id,actor.username,action,id,(after?.name||before?.name||id).slice(0,159),ownerBefore,ownerAfter,before ? JSON.stringify(before):null,after ? JSON.stringify(after):null,group,undoOf);

// Only known numeric gameplay properties may show before/after values.
// Arbitrary free-text, nested objects, inventory and private stories are never echoed.
const atlasHistorySafeNumbers = new Set(['hp','maxHp','tempHp','temporaryHp','ac','armorClass','speed','initiative','exhaustion','level','experience','xp','proficiencyBonus']);
const atlasFieldsChanged = (before, after) => {
 const old = before || {}, now = after || {},changes=[];
 const keys = new Set([...Object.keys(old),...Object.keys(now)]);
 const description = value => typeof value==='number'&&Number.isFinite(value)?String(value):null;
 const safeSkills = ['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'];
 for(const key of keys){
  if(key.startsWith('_')||JSON.stringify(old[key])===JSON.stringify(now[key]))continue;
  if(key==='skills'){
   for(const skill of safeSkills){
    const a=Number(old.skills?.[skill]||0),b=Number(now.skills?.[skill]||0);
    if(a!==b)changes.push({field:'Skill: '+skill,before:String(a),after:String(b)});
   }
  }else if(key==='hp'){
   if(typeof old.hp==='number'||typeof now.hp==='number'){
    changes.push({field:'hp',before:description(old.hp),after:description(now.hp)});
    continue;
   }
   for(const stat of ['max','current']){
    const a=description(old.hp?.[stat]),b=description(now.hp?.[stat]);
    if(a!==b)changes.push({field:'HP '+stat,before:a,after:b});
   }
  }else if(key==='passivePerceptionOverride'){
   changes.push({field:'Passive Perception',before:description(old[key])??'Auto',after:description(now[key])??'Auto'});
  }else if(atlasHistorySafeNumbers.has(key)){
   changes.push({field:key,before:description(old[key]),after:description(now[key])});
  }else changes.push({field:'[redacted]',before:null,after:null});
  if(changes.length>=40)break;
 }
 return changes.slice(0,40);
};

const atlasValidRoster = (roster, validCharacter) =>
 Array.isArray(roster)&&roster.length<=25&&roster.every(validCharacter)&&new Set(roster.map(ch=>ch.id)).size===roster.length;

async function atlasReplaceRoster(env, actor, roster, action, trustedSealed=false) {
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
  if(!trustedSealed && old && old.owner_user_id!==null){
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

// Backups are sealed server-side: the Creator can save and later restore the
// opaque JSON via Google Drive manually, without receiving private stories.
const atlasBackupReady=env=>typeof env.ATLAS_BACKUP_SECRET==='string'&&env.ATLAS_BACKUP_SECRET.length>=32;
const atlasBackupB64=bytes=>{
 let result='';
 for(let i=0;i<bytes.length;i+=32768)result+=String.fromCharCode(...bytes.subarray(i,i+32768));
 return btoa(result);
};
const atlasBackupUnb64=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
const atlasBackupKey=async env=>{
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('DNDATLAS_BACKUP_V1:'+env.ATLAS_BACKUP_SECRET));
 return crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt','decrypt']);
};
async function atlasSealBackup(env,roster){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const plaintext=new TextEncoder().encode(JSON.stringify({application:'D&D Atlas',schema:1,rulesVersion:'2024',characters:roster}));
 const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await atlasBackupKey(env),plaintext));
 return {format:'dndatlas-sealed-party-v1',exportedAt:new Date().toISOString(),count:roster.length,iv:atlasBackupB64(iv),ciphertext:atlasBackupB64(encrypted)};
}
async function atlasUnsealBackup(env,envelope,err){
 if(envelope?.format!=='dndatlas-sealed-party-v1'||typeof envelope.iv!=='string'||envelope.iv.length!==16||
   typeof envelope.ciphertext!=='string'||envelope.ciphertext.length>12000000)
  throw err(422,'Invalid or unsupported secure backup file');
 try{
  const iv=atlasBackupUnb64(envelope.iv),ciphertext=atlasBackupUnb64(envelope.ciphertext);
  if(iv.length!==12||ciphertext.length<16)throw Error('Invalid encrypted payload');
  const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv},await atlasBackupKey(env),ciphertext);
  const doc=JSON.parse(new TextDecoder().decode(clear));
  if(doc.application!=='D&D Atlas'||doc.schema!==1||doc.rulesVersion!=='2024')throw Error('Backup format mismatch');
  return doc;
 }catch{throw err(422,'Backup authentication failed: wrong key or corrupt encrypted JSON');}
}

async function atlasExtensionRequest({request,env,actor,pathname,method,respond,err,jsonBody,validCharacter,audit}) {
 // A minimal privileged patch: never accept an arbitrary character JSON body.
 // DM/Creator can adjust skill rank or a sheet statistic without touching
 // private journals/background stories or unrelated progression choices.
 const dmOverrideRoute=pathname.match(/^\/characters\/([\w-]{1,80})\/dm-override$/);
 if(dmOverrideRoute){
  if(actor.role!=='creator'&&actor.role!=='dm')throw err(403,'Creator/DM only');
  if(method!=='PATCH')throw err(405,'Method not allowed');
  const id=dmOverrideRoute[1],body=await jsonBody(request);
  if(!Number.isInteger(body?.revision)||body.revision<1)throw err(400,'Expected character revision');
  const isSkill=typeof body.skill==='string'&&Object.hasOwn(body,'rank');
  const isField=typeof body.field==='string'&&Object.hasOwn(body,'value');
  if(isSkill===isField)throw err(400,'Specify either a skill rank or a statistic');
  const allowed=isSkill?['revision','skill','rank']:['revision','field','value'];
  if(Object.keys(body).some(key=>!allowed.includes(key)))throw err(400,'Unexpected override fields');
  const rankSkills=new Set(['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival']);
  if(isSkill&&(!rankSkills.has(body.skill)||![0,1,2].includes(body.rank)))throw err(400,'Invalid skill or proficiency rank');
  const limits={maxHp:[1,99999],passivePerception:[0,99],speed:[0,300]};
  if(isField&&(!Object.hasOwn(limits,body.field)||
   !(body.field==='passivePerception'&&body.value===null) &&
   (!Number.isInteger(body.value)||body.value<limits[body.field][0]||body.value>limits[body.field][1])))
   throw err(400,'Invalid statistic override');
  const row=await env.DB.prepare('SELECT * FROM characters WHERE id=?').bind(id).first();
  if(!row)throw err(404,'Character not found');
  if(Number(row.revision)!==body.revision)throw err(409,'Character changed elsewhere. Refresh before editing.');
  const before=JSON.parse(row.data_json),next=structuredClone(before);
  if(isSkill){
   next.skills={...(next.skills||{})};
   if(body.rank===0)delete next.skills[body.skill];
   else next.skills[body.skill]=body.rank;
  }else if(body.field==='maxHp'){
   next.hp={...(next.hp||{})};
   next.hp.max=body.value;
   next.hp.current=Math.min(Math.max(0,Number(next.hp.current)||0),body.value);
  }else if(body.field==='passivePerception'){
   next.passivePerceptionOverride=body.value===null?'':body.value;
  }else next.speed=body.value;
  if(JSON.stringify(next)===JSON.stringify(before))return respond({ok:true,revision:row.revision,unchanged:true});
  await atlasEnsureHistory(env);
  const updated=JSON.stringify(next);
  const writes=await env.DB.batch([
   env.DB.prepare('UPDATE characters SET data_json=?,revision=revision+1,modified_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=?')
    .bind(updated,actor.id,id,body.revision),
   env.DB.prepare('INSERT INTO character_history(actor_user_id,actor_name,action,character_id,character_name,owner_before,owner_after,before_json,after_json) SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM characters WHERE id=? AND revision=? AND data_json=?)')
    .bind(actor.id,actor.username,'dm-override',id,next.name||before.name||id,row.owner_user_id,row.owner_user_id,JSON.stringify(before),updated,id,body.revision+1,updated)
  ]);
  if(!writes[0]?.meta?.changes)throw err(409,'Character changed elsewhere. Refresh before editing.');
  await audit(env,actor.id,'dm-override',id);
  return respond({ok:true,revision:body.revision+1});
 }
 // Lightweight authenticated revision check for all campaign members.
 // Returns no character contents or private story fields.
 if(pathname==='/sync/revisions'){
  if(method!=='GET')throw err(405,'Method not allowed');
  const rows=(await env.DB.prepare('SELECT id,revision FROM characters').all()).results||[];
  return respond({revisions:Object.fromEntries(rows.map(row=>[row.id,Number(row.revision)]))});
 }
 const isHistory=pathname==='/history'||/^\/history\/\d+\/undo$/.test(pathname)||/^\/history\/group\/[0-9a-f-]{36}\/undo$/.test(pathname);
 const isDrive=pathname.startsWith('/sync/drive/');
 const isBackup=pathname.startsWith('/backup/');
 if(!isHistory&&!isDrive&&!isBackup)return null;
 if(actor.role!=='creator')throw err(403,'Creator only');
 if(isBackup){
  if(pathname==='/backup/status'&&method==='GET')return respond({configured:atlasBackupReady(env),sealed:true,manualOnly:true});
  if(!atlasBackupReady(env))throw err(503,'Secure backup is not configured. Add ATLAS_BACKUP_SECRET (32+ characters) in Cloudflare.');
  if(pathname==='/backup/secure'&&method==='GET'){
   const rows=(await env.DB.prepare('SELECT data_json FROM characters ORDER BY id').all()).results||[];
   const roster=rows.map(row=>JSON.parse(row.data_json));
   if(!atlasValidRoster(roster,validCharacter))throw err(422,'Current D1 roster has invalid characters');
   return respond(await atlasSealBackup(env,roster));
  }
  if(pathname==='/backup/secure/restore'&&method==='POST'){
   const envelope=await jsonBody(request),doc=await atlasUnsealBackup(env,envelope,err);
   if(!atlasValidRoster(doc.characters,validCharacter))throw err(422,'Invalid characters in authenticated backup');
   const result=await atlasReplaceRoster(env,actor,doc.characters,'secure-backup-restore',true);
   await audit(env,actor.id,'restore-sealed-party',result.count);
   return respond(result);
  }
  throw err(405,'Method not allowed');
 }
 if(isHistory){
  await atlasEnsureHistory(env);
  if(pathname==='/history'&&method==='GET'){
   const limit=Math.min(100,Math.max(1,Number(new URL(request.url).searchParams.get('limit'))||40));
   const rows=(await env.DB.prepare('SELECT id,actor_user_id,actor_name,action,character_id,character_name,before_json,after_json,group_id,undo_of,changed_at FROM character_history ORDER BY id DESC LIMIT ?').bind(limit).all()).results;
   return respond({events:rows.map(r=>({id:r.id,actor:r.actor_name,action:r.action,characterId:r.character_id,characterName:r.character_name,at:r.changed_at,groupId:r.group_id,undoOf:r.undo_of,changes:atlasFieldsChanged(r.before_json?JSON.parse(r.before_json):null,r.after_json?JSON.parse(r.after_json):null)}))});
  }
  const groupRoute=pathname.match(/^\/history\/group\/([0-9a-f-]{36})\/undo$/);
  if(groupRoute&&method==='POST'){
   const groupId=groupRoute[1];
   const entries=(await env.DB.prepare('SELECT * FROM character_history WHERE group_id=? ORDER BY id ASC').bind(groupId).all()).results||[];
   if(entries.length<1||entries.length>25||new Set(entries.map(e=>e.character_id)).size!==entries.length)
    throw err(409,'History group is not a valid multi-character operation.');
   const ids=entries.map(e=>e.character_id);
   const slots=ids.map(()=>'?').join(',');
   const latest=(await env.DB.prepare('SELECT character_id,MAX(id) AS last_id FROM character_history WHERE character_id IN ('+slots+') GROUP BY character_id').bind(...ids).all()).results||[];
   const lastByCharacter=new Map(latest.map(row=>[row.character_id,Number(row.last_id)]));
   for(const event of entries)if(lastByCharacter.get(event.character_id)!==Number(event.id))
    throw err(409,'One or more characters changed after this operation. The group cannot be undone.');
   const present=(await env.DB.prepare('SELECT * FROM characters WHERE id IN ('+slots+')').bind(...ids).all()).results||[];
   const now=new Map(present.map(row=>[row.id,row]));
   for(const event of entries){
    const current=now.get(event.character_id)||null;
    const after=event.after_json?JSON.parse(event.after_json):null;
    if(JSON.stringify(atlasSnapshot(current))!==JSON.stringify(after)||Number(current?.owner_user_id??-1)!==Number(event.owner_after??-1))
     throw err(409,'Character state or ownership changed after the recorded operation.');
   }
   const previousOwners=[...new Set(entries.map(e=>e.owner_before).filter(id=>id!==null))];
   const users=previousOwners.length?(await env.DB.prepare('SELECT id,owner_character_id FROM users WHERE id IN ('+previousOwners.map(()=>'?').join(',')+')').bind(...previousOwners).all()).results||[]:[];
   const ownersById=new Map(users.map(row=>[Number(row.id),row]));
   for(const event of entries)if(event.owner_before!==null){
    const owner=ownersById.get(Number(event.owner_before));
    if(!owner)throw err(409,'Original character owner no longer exists.');
    if(owner.owner_character_id&&!ids.includes(owner.owner_character_id))
     throw err(409,'The original owner is now assigned to another character.');
   }
   await atlasEnsureUndoGuard(env);
   const restoreId=crypto.randomUUID();
   const mutations=[
    ...entries.map(event=>atlasUndoGuardWrite(env,event,now.get(event.character_id)||null)),
    env.DB.prepare('UPDATE users SET owner_character_id=NULL WHERE owner_character_id IN ('+slots+')').bind(...ids),
    env.DB.prepare('DELETE FROM characters WHERE id IN ('+slots+')').bind(...ids)
   ];
   for(const event of entries){
    const before=event.before_json?JSON.parse(event.before_json):null;
    const current=now.get(event.character_id)||null;
    if(before){
     const revision=Math.max(1,Number(current?.revision||0)+1);
     mutations.push(env.DB.prepare('INSERT INTO characters(id,owner_user_id,data_json,modified_by,revision) VALUES(?,?,?,?,?)')
      .bind(event.character_id,event.owner_before,JSON.stringify(before),actor.id,revision));
     if(event.owner_before!==null)
      mutations.push(env.DB.prepare('UPDATE users SET owner_character_id=? WHERE id=?').bind(event.character_id,event.owner_before));
    }
    mutations.push(atlasHistoryWrite(env,actor,'undo-group',event.character_id,atlasSnapshot(current),before,current?.owner_user_id??null,event.owner_before,restoreId,event.id));
   }
   await env.DB.batch(mutations);
   await audit(env,actor.id,'undo-group',groupId);
   return respond({ok:true,count:entries.length,undoGroupId:restoreId});
  }
  const undoRoute=pathname.match(/^\/history\/(\d+)\/undo$/);
  if(undoRoute&&method==='POST'){
   const id=Number(undoRoute[1]);
   const event=await env.DB.prepare('SELECT * FROM character_history WHERE id=?').bind(id).first();
   if(!event)throw err(404,'History entry not found');
   if(event.group_id){
    const groupSize=await env.DB.prepare('SELECT COUNT(*) AS count FROM character_history WHERE group_id=?').bind(event.group_id).first();
    if(Number(groupSize?.count)>1)throw err(409,'This is a grouped operation. Use group Undo to restore all characters together.');
   }
   const newer=await env.DB.prepare('SELECT id FROM character_history WHERE character_id=? AND id>? LIMIT 1').bind(event.character_id,id).first();
   if(newer)throw err(409,'Newer character changes exist. Undo the newest entry first.');
   const current=await env.DB.prepare('SELECT * FROM characters WHERE id=?').bind(event.character_id).first();
   const after=event.after_json?JSON.parse(event.after_json):null;
   if(JSON.stringify(atlasSnapshot(current))!==JSON.stringify(after))throw err(409,'The character changed since this history entry. Refresh.');
   const before=event.before_json?JSON.parse(event.before_json):null;
   const targetOwner=event.owner_before;
   await atlasEnsureUndoGuard(env);
   const mutations=[atlasUndoGuardWrite(env,event,current),env.DB.prepare('UPDATE users SET owner_character_id=NULL WHERE owner_character_id=?').bind(event.character_id)];
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
