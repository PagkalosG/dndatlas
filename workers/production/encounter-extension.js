// Single-campaign, private encounter snapshot. No character writes or player projection.
function atlasEncounterValidate(input,err){
 const bad=()=>{throw err(400,'Invalid encounter state');};
 const keys=(o,allowed)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>allowed.includes(k));
 const str=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
 const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
 if(!keys(input,['name','phase','round','activeId','participants','events','archiveId'])||!str(input.name,120)||!['setup','active','paused','ended'].includes(input.phase)||!int(input.round,1,99999)||!Array.isArray(input.participants)||input.participants.length>60)bad();
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
 return {phase:state.phase,round:state.round,current:p?.type==='player'?p.name:null,currentCharacterId:p?.type==='player'?p.characterId:null,nextCharacterId:next?.type==='player'?next.characterId:null};
}
// Encounter-local allies are temporary; future permanent companions must have a separate persistent identity.
function atlasEncounterFinish(state){
 return {...state,phase:'ended',round:1,activeId:null,participants:state.participants.filter(p=>p.type==='player').map(p=>({...p,initiative:null,out:false}))};
}
async function atlasEncounterRequest({request,env,actor,pathname,method,respond,err,jsonBody,audit}){
 if(pathname!=='/encounter')return null;
 const publicView=method==='GET'&&new URL(request.url).searchParams.get('public')==='1';
 if(!['creator','dm'].includes(actor.role)&&!publicView)throw err(403,'Creator/DM only');
 if(!['GET','PUT','DELETE'].includes(method))throw err(405,'Method not allowed');
 let row;
 try{row=await env.DB.prepare('SELECT revision,data_json FROM atlas_encounter WHERE id=1').first();}catch(e){if(!/no such table.*atlas_encounter/i.test(String(e.message)))throw e;if(method==='GET')return respond(publicView?{revision:0,encounter:null}:{revision:0,encounter:null,history:[]});await env.DB.prepare('CREATE TABLE IF NOT EXISTS atlas_encounter (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, data_json TEXT NOT NULL, modified_by INTEGER, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();row=await env.DB.prepare('SELECT revision,data_json FROM atlas_encounter WHERE id=1').first();}
 const envelope=atlasEncounterEnvelope(row?.data_json),previous=envelope.encounter;
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
