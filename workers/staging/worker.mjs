// D&D Atlas v3 API. Cloudflare Worker + D1. Never place secrets in your GitHub Pages repository.
const enc=new TextEncoder();
const bytes=n=>crypto.getRandomValues(new Uint8Array(n));
const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const sha=async value=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value))));
const pinHash=async(pin,salt)=>{
 const key=await crypto.subtle.importKey('raw',enc.encode(pin),'PBKDF2',false,['deriveBits']);
 return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},key,256)));
};
const equal=(a,b)=>{if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0;};
const usernameOk=u=>typeof u==='string'&&/^[a-z][a-z0-9_-]{2,29}$/i.test(u);
const allowedPin=(pin,role)=>typeof pin==='string'&&(role==='creator'?pin.length>=8: /^(?=.*\d)[0-9]{6,12}$/.test(pin));
const token=()=>hex(bytes(32));
const err=(code,message)=>Object.assign(new Error(message),{code});
const jsonBody=async req=>{if(Number(req.headers.get('content-length')||0)>1800000)throw err(413,'Payload too large');const raw=await req.text();if(raw.length>1800000)throw err(413,'Payload too large');try{return JSON.parse(raw||'{}')}catch{throw err(400,'Invalid JSON')}};
const redact=(ch,actor,ownerId)=>{const out=structuredClone(ch);if(out.storyPublic!==true && actor.role!=='dm' && actor.id!==ownerId){delete out.backgroundStory;delete out.story;out.storyPrivate=true;}return out;};
const audit=async(env,actor,action,subject)=>env.DB.prepare('INSERT INTO audit_log(actor_user_id,action,subject) VALUES(?,?,?)').bind(actor||null,action,String(subject).slice(0,180)).run();
const canEdit=(actor,ownerId)=>actor.role==='creator'||actor.role==='dm'||(actor.role==='player'&&ownerId!==null&&actor.id===ownerId);
const publicUser=u=>({id:u.id,username:u.username,role:u.role,active:!!u.active,ownerCharacterId:u.owner_character_id||null});
const validCharacter=c=>c&&typeof c==='object'&&!Array.isArray(c)&&typeof c.id==='string'&&/^[\w-]{1,80}$/.test(c.id)&&typeof c.name==='string'&&c.name.length>0&&c.name.length<160&&Array.isArray(c.classes);
const validImageId=id=>/^[a-zA-Z0-9_-]{10,120}$/.test(id||'');
// Production D&D Atlas extension: Creator-only version history, undo, and encrypted Drive backups.
// This module is inlined into the existing deployed Cloudflare Worker by the guarded deploy patch.
// Do not include credentials or backup payloads in client responses.
// Production D&D Atlas extension: Creator-only version history, undo, and encrypted Drive backups.
// This module is inlined into the existing deployed Cloudflare Worker by the guarded deploy patch.
// Do not include credentials or backup payloads in client responses.
// Production D&D Atlas extension: Creator-only version history, undo, and encrypted Drive backups.
// This module is inlined into the existing deployed Cloudflare Worker by the guarded deploy patch.
// Do not include credentials or backup payloads in client responses.
// Production D&D Atlas extension: Creator-only version history, undo, and encrypted Drive backups.
// This module is inlined into the existing deployed Cloudflare Worker by the guarded deploy patch.
// Do not include credentials or backup payloads in client responses.
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

// Single-campaign, private encounter snapshot. No character writes or player projection.
function atlasEncounterValidate(input,err){
 const bad=()=>{throw err(400,'Invalid encounter state');};
 const keys=(o,allowed)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>allowed.includes(k));
 const str=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
 const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
 if(!keys(input,['name','phase','round','activeId','participants','events','archiveId','fightId','turnKey','reviews'])||!str(input.name,120)||!['setup','active','paused','ended'].includes(input.phase)||!int(input.round,1,99999)||!Array.isArray(input.participants)||input.participants.length>60)bad();
 const ids=new Set(),players=new Set();
 for(const p of input.participants){
  if(!keys(p,['id','type','characterId','name','initiative','hp','maxHp','ac','out'])||!str(p.id,80)||!/^[\w-]+$/.test(p.id)||ids.has(p.id)||!['player','enemy','ally'].includes(p.type)||!str(p.name,160)||typeof p.out!=='boolean'||!(p.initiative===null||int(p.initiative,-100,200)))bad();
  ids.add(p.id);
  if(p.type==='player'){if(!str(p.characterId,80)||!/^[\w-]+$/.test(p.characterId)||players.has(p.characterId)||p.hp!==undefined||p.maxHp!==undefined||p.ac!==undefined)bad();players.add(p.characterId);}
  else if(p.characterId!==undefined||!int(p.maxHp,1,99999)||!int(p.hp,0,p.maxHp)||!int(p.ac,0,99))bad();
 }
 if(input.activeId!==null&&!ids.has(input.activeId))bad();
 if(input.phase==='setup'&&input.activeId!==null)bad();
 if(['active','paused'].includes(input.phase)&&(!input.activeId||input.participants.some(p=>p.initiative===null)))bad();
 if(input.archiveId!==undefined&&!str(input.archiveId,80))bad();
 if(input.events!==undefined)atlasEncounterEvents(input.events,err);
 if(input.fightId!==undefined&&!str(input.fightId,80)||input.turnKey!==undefined&&!str(input.turnKey,80))bad();
 if(input.reviews!==undefined){if(!Array.isArray(input.reviews)||input.reviews.length>200)bad();const reviewed=new Set();for(const r of input.reviews){if(!keys(r,['id','status'])||!str(r.id,80)||reviewed.has(r.id)||!['approved','rejected'].includes(r.status))bad();reviewed.add(r.id);}}
 return input;
}
function atlasEncounterEvents(events,err){
 const bad=()=>{throw err(400,'Invalid combat log');};
 if(!Array.isArray(events)||events.length>500)bad();
 const ids=new Set(),allowed=['id','round','turn','at','actor','actorName','target','targetName','kind','label','outcome','amount','note','hpMode','resource'];
 for(const e of events){
  if(!e||typeof e!=='object'||Array.isArray(e)||Object.keys(e).some(k=>!allowed.includes(k))||typeof e.id!=='string'||!e.id||e.id.length>80||ids.has(e.id)||!Number.isInteger(e.round)||e.round<1||e.round>99999||!Number.isInteger(e.amount)||e.amount<0||e.amount>99999||!['attack','spell','ability','mastery','save','condition','movement','reaction','death-save','concentration','heal','damage','other'].includes(e.kind))bad();
  for(const [key,max] of Object.entries({turn:80,at:40,actor:80,actorName:160,target:80,targetName:160,label:160,outcome:30,note:500,hpMode:20,resource:160}))if(e[key]!==undefined&&(typeof e[key]!=='string'||e[key].length>max))bad();
  if(!e.label||!['','hit','miss','critical','success','failure'].includes(e.outcome||'')||e.hpMode!==undefined&&!['none','damage','heal'].includes(e.hpMode))bad();ids.add(e.id);
 }
 return events;
}
function atlasEncounterHistory(history,err){
 if(!Array.isArray(history)||history.length>20)throw err(400,'Invalid encounter history (max 20)');
 const ids=new Set();let count=0;
 for(const h of history){
  if(!h||typeof h!=='object'||Object.keys(h).some(k=>!['archiveId','name','round','participants','events','endedAt'].includes(k))||typeof h.archiveId!=='string'||!h.archiveId||h.archiveId.length>80||ids.has(h.archiveId)||typeof h.endedAt!=='string'||h.endedAt.length>40)throw err(400,'Invalid archived encounter');
  atlasEncounterValidate({name:h.name,round:h.round,phase:'ended',activeId:null,participants:h.participants,events:h.events},err);ids.add(h.archiveId);count+=(h.events||[]).length;
 }
 if(count>1500)throw err(400,'History has too many events. Export and delete an older encounter.');
 return history;
}
function atlasEncounterEnvelope(raw){const value=JSON.parse(raw||'null');return value&&Object.hasOwn(value,'encounter')?value:{encounter:value,history:[]};}
function atlasEncounterPublic(state){
 if(!state||!['active','paused'].includes(state.phase))return null;
 const ps=state.participants,idx=ps.findIndex(p=>p.id===state.activeId),p=ps[idx];
 const next=Array.from({length:ps.length},(_,i)=>ps[(idx+i+1)%ps.length]).find(p=>!p.out);
 return {phase:state.phase,round:state.round,current:p?.type==='player'?p.name:null,currentCharacterId:p?.type==='player'?p.characterId:null,nextCharacterId:next?.type==='player'?next.characterId:null,fightId:state.fightId||null,turnKey:state.turnKey||null};
}
// Encounter-local allies are temporary; future permanent companions must have a separate persistent identity.
function atlasEncounterFinish(state){
 return {...state,phase:'ended',round:1,activeId:null,participants:state.participants.filter(p=>p.type==='player').map(p=>({...p,initiative:null,out:false}))};
}

// One independent inbox; player submissions never mutate sheets or the encounter revision.
async function atlasEncounterInboxRead(env,actor,state){
 if(!state?.fightId||!['active','paused'].includes(state.phase))return [];
 const privileged=['creator','dm'].includes(actor.role);
 let rows;try{rows=await (privileged?env.DB.prepare('SELECT data_json FROM atlas_encounter_inbox WHERE fight_id=? ORDER BY created_at,id').bind(state.fightId):env.DB.prepare('SELECT data_json FROM atlas_encounter_inbox WHERE fight_id=? AND user_id=? ORDER BY created_at,id').bind(state.fightId,actor.id)).all();}catch(e){if(/no such table.*atlas_encounter_inbox/i.test(String(e.message)))return [];throw e;}
 const reviews=new Map((state.reviews||[]).map(r=>[r.id,r.status]));
 return rows.results.map(r=>JSON.parse(r.data_json)).map(r=>{if(!privileged)delete r.turnActorId;return {...r,status:reviews.get(r.id)||'pending'};});
}
async function atlasEncounterInbox({request,env,actor,method,respond,err,jsonBody,state,revision}){
 const privileged=['creator','dm'].includes(actor.role);
 const active=state&&['active','paused'].includes(state.phase)&&state.fightId&&state.turnKey;
 if(!active){if(method==='GET')return respond({items:[]});throw err(409,'No active encounter accepting submissions');}
 if(method==='GET')return respond({items:await atlasEncounterInboxRead(env,actor,state)});
 if(method!=='POST'||actor.role!=='player')throw err(403,'Player submissions only');
 const body=await jsonBody(request),items=body?.items;
 if(!body||Object.keys(body).some(k=>k!=='items')||!Array.isArray(items)||!items.length||items.length>20)throw err(400,'Expected 1–20 submissions');
 const ids=new Set(),allowed=['id','fightId','turnKey','round','characterId','kind','label','target','outcome','amount','note'];
 const owned=await env.DB.prepare('SELECT id FROM characters WHERE owner_user_id=?').bind(actor.id).all(),ownedIds=new Set(owned.results.map(r=>r.id));
 const records=[];
 for(const x of items){
   if(!x||Object.keys(x).some(k=>!allowed.includes(k))||typeof x.id!=='string'||!/^[\w-]{1,80}$/.test(x.id)||ids.has(x.id)||x.fightId!==state.fightId||typeof x.turnKey!=='string'||!Number.isInteger(x.round)||typeof x.characterId!=='string'||!ownedIds.has(x.characterId))throw err(400,'Invalid or unauthorized submission');
   if(!['attack','spell','ability','reaction','other','end-turn'].includes(x.kind)||typeof x.label!=='string'||!x.label.trim()||x.label.length>160||typeof x.target!=='string'||x.target.length>160||typeof x.note!=='string'||x.note.length>500||!['','hit','miss','critical','success','failure'].includes(x.outcome)||!Number.isInteger(x.amount)||x.amount<0||x.amount>99999)throw err(400,'Invalid action');
   const p=state.participants.find(p=>p.type==='player'&&p.characterId===x.characterId&&!p.out);
   if(!p)throw err(403,'Character is not participating');
   ids.add(x.id);records.push({...x,actorId:p.id,actorName:p.name,turnActorId:state.activeId,at:new Date().toISOString()});
 }
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS atlas_encounter_inbox (id TEXT PRIMARY KEY, fight_id TEXT NOT NULL,user_id INTEGER NOT NULL,data_json TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP)').run();
 const fresh=[];
 for(const x of records){
   const old=await env.DB.prepare('SELECT fight_id,user_id,data_json FROM atlas_encounter_inbox WHERE id=?').bind(x.id).first();
   if(old){const prior=JSON.parse(old.data_json);if(old.fight_id!==state.fightId||Number(old.user_id)!==Number(actor.id)||allowed.some(k=>prior[k]!==x[k]))throw err(409,'Submission ID already used');continue;}
   if(state.phase!=='active'||x.turnKey!==state.turnKey||x.round!==state.round)throw err(409,'Turn changed; review local submissions');
   if(x.kind!=='reaction'&&state.activeId!==x.actorId)throw err(409,'It is not your turn');
   fresh.push(x);
 }
 if(fresh.length){
   // A batch is one transaction. A changed encounter revision makes every SELECT insert zero rows.
   const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM atlas_encounter_inbox WHERE fight_id=?').bind(state.fightId).first();
   if(Number(count.n)+fresh.length>200)throw err(400,'Encounter inbox is full');
   const result=await env.DB.prepare('INSERT OR IGNORE INTO atlas_encounter_inbox(id,fight_id,user_id,data_json) SELECT id,fight_id,user_id,data_json FROM ('+fresh.map(()=> 'SELECT ? AS id,? AS fight_id,? AS user_id,? AS data_json').join(' UNION ALL ')+') WHERE EXISTS(SELECT 1 FROM atlas_encounter WHERE id=1 AND revision=?) AND (SELECT COUNT(*) FROM atlas_encounter_inbox WHERE fight_id=?) + ? <= 200').bind(...fresh.flatMap(x=>[x.id,state.fightId,actor.id,JSON.stringify(x)]),revision,state.fightId,fresh.length).run();
   if(Number(result.meta.changes)!==fresh.length)throw err(409,'Encounter or submissions changed; retry Save');
 }
 return respond({accepted:records.map(x=>x.id)});
}

async function atlasEncounterRequest({request,env,actor,pathname,method,respond,err,jsonBody,audit}){
 if(pathname!=='/encounter')return null;
 const params=new URL(request.url).searchParams,publicView=method==='GET'&&params.get('public')==='1',inbox=params.get('inbox')==='1';
 if(!['creator','dm'].includes(actor.role)&&!publicView&&!inbox)throw err(403,'Creator/DM only');
 if(inbox&&!['GET','POST'].includes(method))throw err(405,'Method not allowed');
 if(!inbox&&!['GET','PUT','DELETE'].includes(method))throw err(405,'Method not allowed');
 let row;
 try{row=await env.DB.prepare('SELECT revision,data_json FROM atlas_encounter WHERE id=1').first();}catch(e){if(!/no such table.*atlas_encounter/i.test(String(e.message)))throw e;if(inbox){if(method==='GET')return respond({items:[]});throw err(409,'No active encounter');}if(method==='GET')return respond(publicView?{revision:0,encounter:null}:{revision:0,encounter:null,history:[]});await env.DB.prepare('CREATE TABLE IF NOT EXISTS atlas_encounter (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, data_json TEXT NOT NULL, modified_by INTEGER, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();row=await env.DB.prepare('SELECT revision,data_json FROM atlas_encounter WHERE id=1').first();}
 const envelope=atlasEncounterEnvelope(row?.data_json),previous=envelope.encounter;
 if(inbox)return atlasEncounterInbox({request,env,actor,method,respond,err,jsonBody,state:previous,revision:Number(row?.revision||0)});
 if(method==='GET'){const state=previous?.phase==='ended'?atlasEncounterFinish(previous):previous;return respond(publicView?{revision:row?Number(row.revision):0,encounter:atlasEncounterPublic(state),items:actor.role==='player'?await atlasEncounterInboxRead(env,actor,state):[]}:{revision:row?Number(row.revision):0,encounter:state,history:envelope.history});}
 const body=await jsonBody(request);
 if(!body||Object.keys(body).some(k=>!(method==='DELETE'?['revision']:['revision','encounter','history']).includes(k))||!Number.isInteger(body.revision)||body.revision<0)throw err(400,'Expected encounter revision');
 if(body.revision!==(row?Number(row.revision):0))throw err(409,'Encounter changed elsewhere. Reload before saving.');
 if(method==='DELETE'){
  if(!row||previous===null)throw err(404,'Encounter not found');
  // Keep a monotonic revision tombstone, not encounter contents, to prevent stale clients recreating deleted state.
  const history=envelope.history.filter(h=>h.archiveId!==previous?.archiveId);
  const raw=JSON.stringify({encounter:null,history});
  const result=await env.DB.prepare("UPDATE atlas_encounter SET revision=revision+1,data_json=?,modified_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=1 AND revision=?").bind(raw,actor.id,body.revision).run();
  if(!result.meta.changes)throw err(409,'Encounter changed elsewhere. Reload before saving.');
  if(previous?.fightId){try{await env.DB.prepare('DELETE FROM atlas_encounter_inbox WHERE fight_id=?').bind(previous.fightId).run();}catch(e){if(!/no such table.*atlas_encounter_inbox/i.test(String(e.message)))console.warn('Encounter inbox cleanup failed');}}
  await audit(env,actor.id,'delete-encounter',String(body.revision+1));
  return respond({revision:body.revision+1,encounter:null,history});
 }
 const validated=body.encounter===null?null:atlasEncounterValidate(body.encounter,err),state=validated?.phase==='ended'?atlasEncounterFinish(validated):validated;
 const history=body.history===undefined?envelope.history:atlasEncounterHistory(body.history,err);
 const existing=new Set((previous?.participants||[]).filter(p=>p.type==='player').map(p=>p.characterId));
 for(const p of (state?.participants||[]).filter(p=>p.type==='player'&&!existing.has(p.characterId))){
  if(!await env.DB.prepare('SELECT id FROM characters WHERE id=?').bind(p.characterId).first())throw err(400,'Unknown character');
 }
 const raw=JSON.stringify({encounter:state,history});
 const result=row?await env.DB.prepare('UPDATE atlas_encounter SET revision=revision+1,data_json=?,modified_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=1 AND revision=?').bind(raw,actor.id,body.revision).run():await env.DB.prepare('INSERT OR IGNORE INTO atlas_encounter(id,revision,data_json,modified_by) VALUES(1,1,?,?)').bind(raw,actor.id).run();
 if(!result.meta.changes)throw err(409,'Encounter changed elsewhere. Reload before saving.');
 if(previous?.fightId&&(!state||state.phase==='ended'||state.fightId!==previous.fightId)){try{await env.DB.prepare('DELETE FROM atlas_encounter_inbox WHERE fight_id=?').bind(previous.fightId).run();}catch(e){if(!/no such table.*atlas_encounter_inbox/i.test(String(e.message)))console.warn('Encounter inbox cleanup failed');}}
 await audit(env,actor.id,state===null?'delete-encounter':'save-encounter',String(body.revision+1));
 return respond({revision:body.revision+1,encounter:state,history});
}

async function atlasExtensionRequest({request,env,actor,pathname,method,respond,err,jsonBody,validCharacter,audit}) {
 if(pathname==='/encounter')return atlasEncounterRequest({request,env,actor,pathname,method,respond,err,jsonBody,audit});
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

export default {async fetch(request,env){
 const origin=env.ALLOWED_ORIGIN||'https://pagkalosg.github.io';
 const incoming=request.headers.get('Origin');
 const cors={'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'Authorization, Content-Type, X-Atlas-Setup','Access-Control-Allow-Methods':'GET, POST, PUT, PATCH, OPTIONS, DELETE','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 const respond=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 // Other origins can retrieve no account data, even if someone bypasses browser CORS.
 if(incoming&&incoming!==origin)return respond({error:'Origin not allowed'},403);
 if(!env.DB)return respond({error:'D1 binding missing'},500);
 const {pathname}=new URL(request.url),method=request.method;
 try{
  if(pathname==='/health')return respond({status:'ok',api:'3.0'});
  if(pathname==='/setup/creator'&&method==='POST'){
   if(!env.BOOTSTRAP_TOKEN)return respond({error:'Bootstrap disabled'},503);
   const secret=request.headers.get('X-Atlas-Setup')||'';
   if(!equal(secret,env.BOOTSTRAP_TOKEN))throw err(403,'Invalid bootstrap token');
   const found=await env.DB.prepare("SELECT id FROM users WHERE role='creator' LIMIT 1").first();
   if(found)throw err(409,'Creator already exists');
   const body=await jsonBody(request);
   if(!usernameOk(body.username)||!allowedPin(body.pin,'creator'))throw err(400,'Creator needs a username and an 8+ character passphrase');
   if(!env.RECOVERY_PEPPER||env.RECOVERY_PEPPER.length<24)throw err(500,'Recovery secret not configured');
   const salt=hex(bytes(16)),hash=await pinHash(body.pin,salt);
   const codes=Array.from({length:10},()=>hex(bytes(8)));
   const digest=await Promise.all(codes.map(c=>sha(env.RECOVERY_PEPPER+':'+c)));
   await env.DB.batch([
    env.DB.prepare('INSERT INTO users(username,role,password_salt,password_hash) VALUES(?,?,?,?)').bind(body.username.toLowerCase(),'creator',salt,hash),
    ...digest.map(d=>env.DB.prepare('INSERT INTO recovery_codes(digest) VALUES(?)').bind(d))
   ]);
   return respond({message:'Creator created; save recovery codes OFFLINE. Codes are shown only once.',recoveryCodes:codes},201);
  }
  if(pathname==='/auth/login'&&method==='POST'){
   const body=await jsonBody(request),u=String(body.username||'').toLowerCase().trim();
   if(!usernameOk(u)||typeof body.pin!=='string')throw err(401,'Invalid credentials');
   const now=Date.now(),attempt=await env.DB.prepare('SELECT failures,locked_until FROM login_attempts WHERE username=?').bind(u).first();
   if(attempt&&attempt.locked_until>now)throw err(429,'Too many attempts. Try later.');
   const user=await env.DB.prepare('SELECT * FROM users WHERE username=? AND active=1').bind(u).first();
   const check=await pinHash(body.pin,user?.password_salt||'00000000000000000000000000000000');
   if(!user||!equal(check,user.password_hash)){
    const fails=(attempt?.failures||0)+1;
    await env.DB.prepare('INSERT INTO login_attempts(username,failures,locked_until) VALUES(?,?,?) ON CONFLICT(username) DO UPDATE SET failures=excluded.failures, locked_until=excluded.locked_until').bind(u,fails,fails>=5?now+15*60*1000:0).run();
    throw err(401,'Invalid credentials');
   }
   await env.DB.prepare('DELETE FROM login_attempts WHERE username=?').bind(u).run();
   const raw=token(),expires=now+7*86400000;
   await env.DB.prepare('INSERT INTO auth_sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').bind(await sha(raw),user.id,expires,now).run();
   await audit(env,user.id,'login',u);
   return respond({token:raw,expires,me:publicUser(user)});
  }
  if(pathname==='/auth/recover'&&method==='POST'){
   if(!env.RECOVERY_PEPPER)throw err(503,'Recovery not configured');
   const body=await jsonBody(request);
   if(typeof body.code!=='string'||!allowedPin(body.newPin,'creator'))throw err(400,'Invalid recovery request');
   const digest=await sha(env.RECOVERY_PEPPER+':'+body.code.trim());
   const code=await env.DB.prepare('SELECT digest FROM recovery_codes WHERE digest=? AND used_at IS NULL').bind(digest).first();
   if(!code)throw err(401,'Invalid or used recovery code');
   const creator=await env.DB.prepare("SELECT id FROM users WHERE role='creator' LIMIT 1").first();
   if(!creator)throw err(404,'Creator not initialized');
   const salt=hex(bytes(16)),hash=await pinHash(body.newPin,salt);
   await env.DB.batch([
    env.DB.prepare('UPDATE recovery_codes SET used_at=? WHERE digest=? AND used_at IS NULL').bind(Date.now(),digest),
    env.DB.prepare('UPDATE users SET password_salt=?, password_hash=?, active=1 WHERE id=?').bind(salt,hash,creator.id),
    env.DB.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(creator.id)
   ]);
   await audit(env,creator.id,'creator-recovered','self');return respond({ok:true});
  }
  const auth=request.headers.get('Authorization')||'';
  if(!/^Bearer [0-9a-f]{64}$/i.test(auth))throw err(401,'Login required');
  const tokenHash=await sha(auth.slice(7));
  const actor=await env.DB.prepare('SELECT u.* FROM auth_sessions s JOIN users u ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1').bind(tokenHash,Date.now()).first();
  if(!actor)throw err(401,'Session expired');
   const ext=await atlasExtensionRequest({request,env,actor,pathname,method,respond,err,jsonBody,validCharacter,audit});
   if(ext)return ext;
  if(pathname==='/auth/me'&&method==='GET')return respond({me:publicUser(actor)});
  if(pathname==='/auth/logout'&&method==='POST'){
   await env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(tokenHash).run();return respond({ok:true});
  }
  if(pathname==='/users'){
   if(actor.role!=='creator')throw err(403,'Creator only');
   if(method==='GET')return respond({users:(await env.DB.prepare('SELECT id,username,role,active,owner_character_id FROM users ORDER BY id').all()).results.map(publicUser)});
   if(method==='POST'){
    const b=await jsonBody(request),role=String(b.role||'player');
    if(!usernameOk(b.username)||!['player','dm'].includes(role)||!allowedPin(b.pin,role))throw err(400,'Invalid username, role or PIN');
    const salt=hex(bytes(16)),hash=await pinHash(b.pin,salt);
    const r=await env.DB.prepare('INSERT INTO users(username,role,password_salt,password_hash) VALUES(?,?,?,?)').bind(b.username.toLowerCase(),role,salt,hash).run();
    await audit(env,actor.id,'create-user',b.username);return respond({id:r.meta.last_row_id},201);
   }
  }
  const userUpdate=pathname.match(/^\/users\/(\d+)$/);
  if(userUpdate&&method==='PATCH'){
   if(actor.role!=='creator')throw err(403,'Creator only');
   const id=Number(userUpdate[1]),target=await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first();
   if(!target)throw err(404,'User not found');
   const b=await jsonBody(request);
   if(target.role==='creator'&&(b.active===false||b.role&&b.role!=='creator'))throw err(403,'Cannot deactivate/demote Creator');
   if(b.pin!==undefined){if(!allowedPin(b.pin,target.role))throw err(400,'Invalid PIN');const salt=hex(bytes(16)),hash=await pinHash(b.pin,salt);await env.DB.prepare('UPDATE users SET password_salt=?,password_hash=? WHERE id=?').bind(salt,hash,id).run();await env.DB.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(id).run();}
   if(b.active!==undefined)await env.DB.prepare('UPDATE users SET active=? WHERE id=?').bind(b.active?1:0,id).run();
   if(b.role!==undefined){if(target.role==='creator'||!['player','dm'].includes(b.role))throw err(400,'Invalid role');await env.DB.prepare('UPDATE users SET role=? WHERE id=?').bind(b.role,id).run();}
   if(b.characterId!==undefined){const chId=b.characterId===null?null:String(b.characterId);if(chId){const row=await env.DB.prepare('SELECT id FROM characters WHERE id=?').bind(chId).first();if(!row)throw err(404,'Character not found');}await env.DB.prepare('UPDATE users SET owner_character_id=? WHERE id=?').bind(chId,id).run();await env.DB.prepare('UPDATE characters SET owner_user_id=NULL WHERE owner_user_id=?').bind(id).run();if(chId){await env.DB.prepare('UPDATE users SET owner_character_id=NULL WHERE owner_character_id=? AND id<>?').bind(chId,id).run();await env.DB.prepare('UPDATE characters SET owner_user_id=? WHERE id=?').bind(id,chId).run();}}
   await audit(env,actor.id,'update-user',id);return respond({ok:true});
  }
  if(pathname==='/characters'&&method==='GET'){
   const rows=(await env.DB.prepare('SELECT id,owner_user_id,data_json,revision FROM characters ORDER BY updated_at DESC').all()).results;
   return respond({characters:rows.map(r=>({id:r.id,revision:r.revision,ownerUserId:r.owner_user_id,data:redact(JSON.parse(r.data_json),actor,r.owner_user_id)})),me:publicUser(actor)});
  }
  if(pathname==='/characters/import'&&method==='POST'){
    if(actor.role!=='creator')throw err(403,'Creator only');
    const b=await jsonBody(request);
    if(!Array.isArray(b.characters)||b.characters.length>25)throw err(400,'Invalid import');
    const characters=b.characters.filter(validCharacter);
    const current=(await env.DB.prepare('SELECT id FROM characters').all()).results;
    const ids=new Set(current.map(r=>r.id));
    const missing=characters.filter(ch=>!ids.has(ch.id));
    if(missing.length){
      await atlasEnsureHistory(env);
      const writes=[];
      for(const item of missing){
        const ch=structuredClone(item);delete ch._ownerId;
        writes.push(env.DB.prepare('INSERT INTO characters(id,data_json,modified_by) VALUES(?,?,?)').bind(ch.id,JSON.stringify(ch),actor.id));
        writes.push(atlasHistoryWrite(env,actor,'import',ch.id,null,ch,null,null));
      }
      await env.DB.batch(writes);
    }
    await audit(env,actor.id,'import-party',missing.length);
    return respond({created:missing.length});
  }
  if(pathname==='/characters/replace'&&method==='POST'){
    if(!['creator','dm'].includes(actor.role))throw err(403,'Creator/DM only');
    const b=await jsonBody(request);
    if(!atlasValidRoster(b.characters,validCharacter))throw err(400,'Invalid roster');
    const result=await atlasReplaceRoster(env,actor,b.characters,'replace');
    await audit(env,actor.id,'replace-party',b.characters.length);
    return respond(result);
  }
  if(pathname==='/characters/bulk-delete'&&method==='POST'){
    if(!['creator','dm'].includes(actor.role))throw err(403,'Creator/DM only');
    const b=await jsonBody(request),ids=b.ids;
    if(!Array.isArray(ids)||ids.length<1||ids.length>25||ids.some(id=>typeof id!=='string'||!/^[\w-]{1,80}$/.test(id))||new Set(ids).size!==ids.length)throw err(400,'Invalid character IDs');
    const slots=ids.map(()=>'?').join(',');
    const existing=(await env.DB.prepare('SELECT * FROM characters WHERE id IN ('+slots+')').bind(...ids).all()).results;
    await atlasEnsureHistory(env);
    const group=crypto.randomUUID();
    const writes=[
      env.DB.prepare('UPDATE users SET owner_character_id=NULL WHERE owner_character_id IN ('+slots+')').bind(...ids),
      env.DB.prepare('DELETE FROM characters WHERE id IN ('+slots+')').bind(...ids),
      ...existing.map(r=>atlasHistoryWrite(env,actor,'bulk-delete',r.id,atlasSnapshot(r),null,r.owner_user_id,null,group))
    ];
    const results=await env.DB.batch(writes);
    await audit(env,actor.id,'bulk-delete-characters',ids.join(','));
    return respond({ok:true,deleted:results[1]?.meta?.changes??0});
  }
  const characterRoute=pathname.match(/^\/characters\/([\w-]{1,80})$/);
  if(characterRoute){
   const id=characterRoute[1],r=await env.DB.prepare('SELECT * FROM characters WHERE id=?').bind(id).first();
   if(method==='POST'){
    if(actor.role==='player')throw err(403,'Admin only');if(r)throw err(409,'Character exists');
    const b=await jsonBody(request);if(!validCharacter(b.character)||b.character.id!==id)throw err(400,'Invalid character');
    await atlasEnsureHistory(env);await env.DB.batch([env.DB.prepare('INSERT INTO characters(id,data_json,modified_by) VALUES(?,?,?)').bind(id,JSON.stringify(b.character),actor.id),atlasHistoryWrite(env,actor,'create',id,null,b.character,null,null)]);await audit(env,actor.id,'create-character',id);return respond({revision:1},201);
   }
   if(!r)throw err(404,'Character not found');
   if(method==='GET')return respond({id,revision:r.revision,ownerUserId:r.owner_user_id,data:redact(JSON.parse(r.data_json),actor,r.owner_user_id)});
   if(method==='DELETE'){
       await atlasEnsureHistory(env);
    if(!['creator','dm'].includes(actor.role))throw err(403,'Creator/DM only');
    await env.DB.batch([
     env.DB.prepare('UPDATE users SET owner_character_id=NULL WHERE owner_character_id=?').bind(id),
     env.DB.prepare('DELETE FROM characters WHERE id=?').bind(id),
         atlasHistoryWrite(env,actor,'delete',id,atlasSnapshot(r),null,r.owner_user_id,null)
    ]);
    await audit(env,actor.id,'delete-character',id);
    return respond({ok:true});
   }
   if(method==='PUT'){
    if(!canEdit(actor,r.owner_user_id))throw err(403,'Cannot edit this character');
    const b=await jsonBody(request);
    if(!validCharacter(b.character)||b.character.id!==id||!Number.isInteger(b.revision)||b.revision<1)throw err(400,'Invalid character or revision');
    const original=JSON.parse(r.data_json),next=structuredClone(b.character);
    // Creator may edit abilities, equipment etc. but cannot read/replace another player's private story.
    if(actor.role==='creator'&&actor.id!==r.owner_user_id&&actor.role!=='dm'&&original.storyPublic!==true){next.backgroundStory=original.backgroundStory;next.storyPublic=false;}
    if(r.revision!==b.revision)throw err(409,'Character changed elsewhere. Refresh before saving.');
        await atlasEnsureHistory(env);
        const results=await env.DB.batch([
          env.DB.prepare('UPDATE characters SET data_json=?,revision=revision+1,modified_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=?').bind(JSON.stringify(next),actor.id,id,b.revision),
          atlasHistoryWrite(env,actor,'edit',id,original,next,r.owner_user_id,r.owner_user_id)
        ]);
        const result=results[0];
    if(!result.meta.changes)throw err(409,'Character changed elsewhere. Refresh before saving.');
    await audit(env,actor.id,'save-character',id);return respond({revision:b.revision+1});
   }
  }
  if(pathname==='/images/tags'){
   if(method==='GET')return respond({images:(await env.DB.prepare('SELECT file_id,session_ids,tags FROM image_tags').all()).results.map(r=>({id:r.file_id,sessions:JSON.parse(r.session_ids),tags:JSON.parse(r.tags)}))});
   if(method==='PUT'){
    if(!['creator','dm'].includes(actor.role))throw err(403,'DM/Creator only');
    const b=await jsonBody(request);
    if(!validImageId(b.id)||!Array.isArray(b.sessions)||!Array.isArray(b.tags)||b.sessions.length>20||b.tags.length>30)throw err(400,'Invalid image tags');
    const clean=list=>[...new Set(list.filter(x=>typeof x==='string'&&x.length<80).map(x=>x.trim()).filter(Boolean))];
    await env.DB.prepare('INSERT INTO image_tags(file_id,session_ids,tags) VALUES(?,?,?) ON CONFLICT(file_id) DO UPDATE SET session_ids=excluded.session_ids,tags=excluded.tags,updated_at=CURRENT_TIMESTAMP').bind(b.id,JSON.stringify(clean(b.sessions)),JSON.stringify(clean(b.tags))).run();
    await audit(env,actor.id,'image-tags',b.id);return respond({ok:true});
   }
  }
  throw err(404,'Unknown route');
 }catch(ex){return respond({error:ex.message||'Request failed'},ex.code>=400&&ex.code<=599?ex.code:500)}
}};
