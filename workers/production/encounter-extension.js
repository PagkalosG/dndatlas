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
async function atlasEncounterInbox({request,env,actor,method,respond,err,jsonBody,state,revision}){
 const privileged=['creator','dm'].includes(actor.role);
 const active=state&&['active','paused'].includes(state.phase)&&state.fightId&&state.turnKey;
 if(!active){if(method==='GET')return respond({items:[]});throw err(409,'No active encounter accepting submissions');}
 if(method==='GET'){
   let rows;try{rows=await (privileged?env.DB.prepare('SELECT data_json FROM atlas_encounter_inbox WHERE fight_id=? ORDER BY created_at,id').bind(state.fightId):env.DB.prepare('SELECT data_json FROM atlas_encounter_inbox WHERE fight_id=? AND user_id=? ORDER BY created_at,id').bind(state.fightId,actor.id)).all();}catch(e){if(/no such table.*atlas_encounter_inbox/i.test(String(e.message)))return respond({items:[]});throw e;}
   const reviews=new Map((state.reviews||[]).map(r=>[r.id,r.status]));
   return respond({items:rows.results.map(r=>JSON.parse(r.data_json)).map(r=>({...r,status:reviews.get(r.id)||'pending'}))});
 }
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
   ids.add(x.id);records.push({...x,actorId:p.id,actorName:p.name,at:new Date().toISOString()});
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
   const results=await env.DB.batch(fresh.map(x=>env.DB.prepare('INSERT OR IGNORE INTO atlas_encounter_inbox(id,fight_id,user_id,data_json) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM atlas_encounter WHERE id=1 AND revision=?)').bind(x.id,state.fightId,actor.id,JSON.stringify(x),revision)));
   if(results.some(r=>!r.meta.changes))throw err(409,'Encounter or submissions changed; retry Save');
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
 if(method==='GET'){const state=previous?.phase==='ended'?atlasEncounterFinish(previous):previous;return respond(publicView?{revision:row?Number(row.revision):0,encounter:atlasEncounterPublic(state)}:{revision:row?Number(row.revision):0,encounter:state,history:envelope.history});}
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
 await audit(env,actor.id,state===null?'delete-encounter':'save-encounter',String(body.revision+1));
 return respond({revision:body.revision+1,encounter:state,history});
}
