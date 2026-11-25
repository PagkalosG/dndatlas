/* DM-only presentation helpers. Read-only scan; explicit, narrowly scoped corrections. */
(function(root){'use strict';
 const norm=v=>String(v??'').trim().toLowerCase();
 const castKey=v=>{const s=norm(v);if(/^bonus action/.test(s))return 'bonus';if(/^reaction/.test(s))return 'reaction';if(/^action(?:\b|$)/.test(s))return 'action';if(/^1\s*(?:minute|min)\b/.test(s))return '1 minute';return s};
 const castValue=v=>({bonus:'Bonus Action',reaction:'Reaction',action:'Action','1 minute':'1 minute'}[castKey(v)]||'');
 const allowed=cloud=>!!(cloud?.enabled&&cloud.ready&&cloud.token&&['creator','dm'].includes(cloud.user?.role));
 function groups(rows,level){const map=new Map();for(const row of rows){const value=level(row),n=value===null||value===undefined||value===''?NaN:Number(value);const k=Number.isInteger(n)&&n>=0&&n<=9?n:10;if(!map.has(k))map.set(k,[]);map.get(k).push(row)}return [...map].sort((a,b)=>a[0]-b[0]);}
 function issues(ch,s,catalog,audit){if(!catalog||!audit)return [];const a=audit.inspect(ch,s,catalog),out=[];const add=(code,field,saved,expected,patch=null)=>out.push({code,field,saved,expected,patch});
  if(['unmatched','ambiguous','conflict','user_pack','srd_reference'].includes(a.status))add(a.status,'reference',s.ref||s.name,a.record?.name||'');
  const verified=a.status==='srd_metadata';
  for(const d of a.differences||[]){if(d.field==='casting_time'){if(castKey(d.saved)==='ritual only'&&a.record?.ritual)continue;if(castKey(d.saved)===castKey(d.catalog))continue;const v=castValue(d.catalog);add('casting_time','cast',d.saved,d.catalog,verified&&v?{field:'cast',value:v}:null)}else add('damage_reference','damage',d.saved,d.catalog);}
  if(verified){const r=a.record;if(s.school&&r.school&&norm(s.school)!==norm(r.school))add('school','school',s.school,r.school,{field:'school',value:r.school});}
  if(a.grantStatus!=='recorded')add(a.grant?'grant_candidate':'grant_unknown','spellSource',s.spellSource||'',a.grant||'',a.grant?{field:'spellSource',value:a.grant}:null);
  return out;
 }
 function scan(ch,catalog,audit){return (ch.spellbook||[]).flatMap(s=>issues(ch,s,catalog,audit).map(i=>({...i,spellId:s.id,spellName:s.name})));}
 function apply(ch,spellId,issue,catalog,audit){const s=(ch.spellbook||[]).find(x=>x.id===spellId);if(!s||!issue?.patch)return false;const live=issues(ch,s,catalog,audit).find(x=>JSON.stringify(x)===JSON.stringify({code:issue.code,field:issue.field,saved:issue.saved,expected:issue.expected,patch:issue.patch}));if(!live)return false;s[live.patch.field]=live.patch.value;return true;}
 // Player view: never expose audit statuses, suggested corrections, or review warnings.
 function publicSource(s){const raw=String(s?.spellSource||s?.source||'').trim();return /^(pdf|json|import(?:ed)?|manual)$/i.test(raw)?'':raw;}
 const api={allowed,groups,issues,scan,apply,publicSource};if(typeof module==='object'&&module.exports)module.exports=api;else root.ATLAS_DM_RULES_REVIEW=api;
})(typeof window==='undefined'?globalThis:window);
