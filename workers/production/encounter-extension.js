// Single-campaign, private encounter snapshot. No character writes or player projection.
function atlasEncounterValidate(input,err){
 const bad=()=>{throw err(400,'Invalid encounter state');};
 const keys=(o,allowed)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>allowed.includes(k));
 const str=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
 const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
 if(!keys(input,['name','phase','round','activeId','participants'])||!str(input.name,120)||!['setup','active','paused','ended'].includes(input.phase)||!int(input.round,1,99999)||!Array.isArray(input.participants)||input.participants.length>60)bad();
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
 return input;
}
async function atlasEncounterRequest({request,env,actor,pathname,method,respond,err,jsonBody,audit}){
 if(pathname!=='/encounter')return null;
 if(!['creator','dm'].includes(actor.role))throw err(403,'Creator/DM only');
 if(!['GET','PUT'].includes(method))throw err(405,'Method not allowed');
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS atlas_encounter (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, data_json TEXT NOT NULL, modified_by INTEGER, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
 const row=await env.DB.prepare('SELECT revision,data_json FROM atlas_encounter WHERE id=1').first();
 if(method==='GET')return respond({revision:row?Number(row.revision):0,encounter:row?JSON.parse(row.data_json):null});
 const body=await jsonBody(request);
 if(!body||Object.keys(body).some(k=>!['revision','encounter'].includes(k))||!Number.isInteger(body.revision)||body.revision<0)throw err(400,'Expected encounter revision');
 if(body.revision!==(row?Number(row.revision):0))throw err(409,'Encounter changed elsewhere. Reload before saving.');
 const state=atlasEncounterValidate(body.encounter,err);
 const previous=row?JSON.parse(row.data_json):null,existing=new Set((previous?.participants||[]).filter(p=>p.type==='player').map(p=>p.characterId));
 for(const p of state.participants.filter(p=>p.type==='player'&&!existing.has(p.characterId))){
  if(!await env.DB.prepare('SELECT id FROM characters WHERE id=?').bind(p.characterId).first())throw err(400,'Unknown character');
 }
 const raw=JSON.stringify(state);
 const result=row?await env.DB.prepare('UPDATE atlas_encounter SET revision=revision+1,data_json=?,modified_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=1 AND revision=?').bind(raw,actor.id,body.revision).run():await env.DB.prepare('INSERT OR IGNORE INTO atlas_encounter(id,revision,data_json,modified_by) VALUES(1,1,?,?)').bind(raw,actor.id).run();
 if(!result.meta.changes)throw err(409,'Encounter changed elsewhere. Reload before saving.');
 await audit(env,actor.id,'save-encounter',String(body.revision+1));
 return respond({revision:body.revision+1,encounter:state});
}
