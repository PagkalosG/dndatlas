/* Atlas content pack bridge — additive compatibility projection for Atlas 3.12.2. */
(function(root){'use strict';
 const safeName=n=>typeof n==='string'&&n.length<=100&&n.trim()===n&&/^[\p{L}\p{N}][\p{L}\p{N} .(),’–-]*$/u.test(n)&&!Object.prototype.hasOwnProperty.call(Object.prototype,n)&&!/^custom(?:\b|…)/i.test(n)&&!/(?:legacy)/i.test(n);
 const norm=n=>String(n).normalize('NFKC').trim().toLowerCase();
 const legacyId=id=>id.replace(/_/g,'-');
 const safeText=s=>typeof s==='string'&&s.length<=40000&&!/[<>&"'`]/.test(s);
 const text=(s,f='')=>safeText(s)?s:f;
 function project(D,catalog){
  const applied=[],skipped=[],names=new Map(), summaries=new Map(), byName=new Map();
  const extra=k=>catalog.records[k].filter(r=>catalog.source(r.id)!=='core');
  const record=(r,status,reason)=>{(status==='added'?applied:skipped).push({id:r.id,name:r.name,reason});};
  const remember=r=>{names.set(r.name,text(r.name_el,r.name));summaries.set(r.name,text(r.description_el||r.short_summary_el||''));byName.set(r.name,r.id);record(r,'added');};
  const has=(arr,n)=>arr.some(x=>norm(typeof x==='string'?x:x.name)===norm(n));
  const eligible=(r,arr)=>{if(!safeName(r.name)){record(r,'skipped','unsafe or reserved legacy name');return false}if(has(arr,r.name)){record(r,'skipped','existing legacy name; not overwritten');return false}return true};
  for(const r of extra('species'))if(eligible(r,D.species)){D.species.push(r.name);remember(r)}
  for(const r of extra('backgrounds'))if(eligible(r,D.background)){D.background.push(r.name);remember(r)}
  // Custom classes and weapons need proficiency, progression and equipment handlers first.
  for(const r of extra('classes'))record(r,'skipped','custom class progression requires engine support');
  for(const r of extra('subclasses')){
   const cls=catalog.byId(r.class_id)?.name, conf=Object.hasOwn(D.classes,cls)?D.classes[cls]:null;
   if(!conf||r.unlock_level!==3){record(r,'skipped','class missing or unsupported unlock level');continue}
   if(eligible(r,conf.subs)){conf.subs.push(r.name);remember(r)}
  }
  for(const r of extra('spells')){
   if(!eligible(r,D.spells))continue;
   const classes=(r.class_ids||[]).map(id=>catalog.byId(id)?.name).filter(n=>Object.hasOwn(D.classes,n)&&n!=='Custom');
   if(!classes.length){record(r,'skipped','spell needs class_ids for builder');continue}
   const id=legacyId(r.id);if(D.spells.some(s=>s.id===id)){record(r,'skipped','existing legacy ID');continue}
   D.spells.push({id,name:r.name,level:r.level,school:text(r.school),classes,cast:text(r.casting_time),range:text(r.range),duration:text(r.duration),components:text(r.components),ritual:r.ritual===true,concentration:r.concentration===true,kind:'Spell',summary:text(r.description,'Imported content; consult your DM.'),source:'User content pack',atlasCatalogId:r.id});remember(r)
  }
  for(const r of extra('feats'))record(r,'skipped','feat prerequisites and origin choice validation require engine support');
  for(const r of extra('weapons'))record(r,'skipped','weapon proficiency and mastery require engine support');
  return {applied,skipped,names,summaries,byName};
 }
 function boot(){const A=root.ATLAS_CONTENT_PACKS,C=root.ATLAS_CONTENT_CORE,D=root.ATLAS_DATA;if(!A||!C||!D)return;try{
  const m=A.manager(C.core,C.schema,root.localStorage), projection=project(D,m.catalog);
  root.ATLAS_CONTENT_RUNTIME={catalog:m.catalog,...projection,loadError:m.loadError};
  const L=root.ATLAS_I18N;if(L){const translate=L.translate.bind(L),summary=L.summary.bind(L),translateRoot=L.translateRoot.bind(L);
   L.translate=s=>L.getLanguage()==='el'&&projection.names.has(s)?projection.names.get(s)+' ('+s+')':translate(s);
   L.summary=r=>L.getLanguage()==='el'&&projection.summaries.get(r?.name)?projection.summaries.get(r.name):summary(r);
   L.translateRoot=el=>{translateRoot(el);if(L.getLanguage()!=='el'||!el?.ownerDocument?.createTreeWalker)return;const walk=el.ownerDocument.createTreeWalker(el,4);let n;while(n=walk.nextNode()){if(n.parentElement?.closest('textarea,script,style,[contenteditable]'))continue;const raw=n.nodeValue.trim();if(projection.names.has(raw))n.nodeValue=n.nodeValue.replace(raw,projection.names.get(raw)+' ('+raw+')')}};
  }
 }catch(e){root.ATLAS_CONTENT_RUNTIME={loadError:String(e),applied:[],skipped:[]};console.warn('Atlas content pack projection failed',e)}}
 const api={project,safeName,legacyId};if(typeof module==='object'&&module.exports)module.exports=api;else{root.ATLAS_CONTENT_BRIDGE=api;boot()}
})(typeof window==='undefined'?globalThis:window);
