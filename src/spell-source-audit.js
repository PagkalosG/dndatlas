/* Read-only spell source resolution. Never writes character state or changes casting logic. */
(function(root){'use strict';
 const norm=x=>String(x??'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
 const key=x=>norm(String(x??'').replace(/^spell[-_]/i,''));
 const psionic=new Set(['armsofhadar','calmemotions','detectthoughts','dissonantwhispers','mindsliver']);
 function resolve(s,catalog){
  const rows=catalog?.records?.spells||[],n=norm(s?.name),ref=key(s?.ref),named=rows.filter(r=>n&&(norm(r.name)===n||norm(r.name_el)===n)),byRef=ref?rows.filter(r=>key(r.id)===ref):[];
  if(byRef.length>1||(!byRef.length&&named.length>1))return {status:'ambiguous'};
  const r=byRef[0]||named[0];if(!r)return {status:'unmatched'};
  if((n&&norm(r.name)!==n&&norm(r.name_el)!==n)||(s.level!==undefined&&s.level!==null&&s.level!==''&&Number(s.level)!==r.level))return {status:'conflict',record:r};
  const source=catalog.source(r.id);return {status:source==='core'?(r.coverage==='verified_metadata_only'?'srd_metadata':'srd_reference'):'user_pack',record:r,source,match:byRef.length?'id':'name'};
 }
 function inspect(ch,s,catalog){
  const match=resolve(s,catalog),r=match.record,n=norm(s.name),classes=ch.classes||[],raw=String(s.spellSource||s.source||'').trim(),recorded=raw&&!/^(pdf|json|import(?:ed)?|manual)$/i.test(raw)?raw:'',importSource=/^(pdf|json|import(?:ed)?|manual)$/i.test(raw)?raw:s.sourceText?'transcription':'';
  let grant='',grantStatus='unknown';
  if(n==='light'&&norm(ch.species)==='aasimar'){grant='Aasimar · Light Bearer';grantStatus='inferred'}
  else if(classes.some(c=>norm(c.name)==='sorcerer'&&norm(c.subclass)==='aberrantsorcery'&&Number(c.level)>=3)&&psionic.has(n)){grant='Aberrant Sorcery · Psionic Spells';grantStatus='inferred'}
  else if(r&&['srd_metadata','srd_reference'].includes(match.status)){const candidates=classes.filter(c=>r.class_ids?.some(id=>norm(id.replace(/^class_/,''))===norm(c.name)));if(candidates.length===1){grant=candidates[0].name;grantStatus='candidate'}}
  if(recorded){grant=recorded;grantStatus='recorded'}
  const differences=[];if(r&&match.status!=='conflict'&&match.status!=='ambiguous'){const kind=v=>{v=String(v||'').toLowerCase();return v.startsWith('bonus action')?'bonus':v.startsWith('reaction')?'reaction':/^action(?:\b|$)/.test(v)?'action':norm(v)};if(s.cast&&r.casting_time&&kind(s.cast)!==kind(r.casting_time))differences.push({field:'casting_time',saved:s.cast,catalog:r.casting_time})}
  // Known non-SRD comparison is deliberately only a warning, not a catalog record.
  if(n==='armsofhadar'&&s.damage==='2d4')differences.push({field:'damage',saved:'2d4',catalog:'2d6 (PHB 2024 reference; DM review)'});
  return {...match,grant,grantStatus,importSource,differences};
 }
 function label(ch,s,catalog,el=false){const a=inspect(ch,s,catalog),t=(en,gr)=>el?gr:en;const status={srd_metadata:t('SRD 5.2.1 · metadata matched','SRD 5.2.1 · αντιστοίχιση μεταδεδομένων'),srd_reference:t('SRD · reference only','SRD · μόνο αναφορά'),user_pack:t('User pack · unverified','Πακέτο χρήστη · μη επιβεβαιωμένο'),unmatched:t('Not matched to catalog','Χωρίς αντιστοίχιση στον κατάλογο'),ambiguous:t('Ambiguous match · DM review','Αμφίσημη αντιστοίχιση · έλεγχος DM'),conflict:t('Catalog conflict · DM review','Ασυμφωνία καταλόγου · έλεγχος DM')}[a.status];return [status,a.grant?t('Grant: ','Χορήγηση: ')+a.grant+' ('+({recorded:t('recorded','καταγεγραμμένη'),inferred:t('inferred','εκτιμώμενη'),candidate:t('candidate','πιθανή')}[a.grantStatus])+')':t('Grant unknown','Άγνωστη χορήγηση'),a.importSource?t('Import: ','Εισαγωγή: ')+(a.importSource==='transcription'?t('source transcription','μεταγραφή πηγής'):a.importSource):'',...a.differences.map(x=>t('Review: ','Έλεγχος: ')+x.saved+' → '+x.catalog)].filter(Boolean).join(' · ')}
 const api={resolve,inspect,label};if(typeof module==='object'&&module.exports)module.exports=api;else root.ATLAS_SPELL_SOURCE_AUDIT=api;
})(typeof window==='undefined'?globalThis:window);
