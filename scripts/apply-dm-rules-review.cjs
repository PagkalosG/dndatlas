/* Version-guarded patch. Run after extracting Content Packs 0.3.0 and Spell Source Audit 0.3.1. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..')),file=path.join(root,'src/app.js');
const hook=fs.readFileSync(path.join(__dirname,'dm-review-hook.txt'),'utf8');
function replaceOne(src,old,next){if(src.split(old).length!==2)throw Error('Expected unique anchor: '+old.slice(0,100));return src.replace(old,()=>next)}
function within(src,from,to,fn){const a=src.indexOf(from),b=src.indexOf(to,a+from.length);if(a<0||b<0)throw Error('Function boundary missing: '+from);return src.slice(0,a)+fn(src.slice(a,b))+src.slice(b)}
function patch(code){
 if(code.includes("const APP_VERSION='3.12.4';")){if(code.includes('function atlasReviewOpen()')&&code.includes('atlasGroupedSpells(book,')&&code.includes('atlasGroupedSpells(list,'))return code;throw Error('3.12.4 already present but missing expected hooks');}
 const version=code.includes("const APP_VERSION='3.12.3';")?'3.12.3':code.includes("const APP_VERSION='3.12.2';")?'3.12.2':'';if(!version)throw Error('Expected Atlas 3.12.2 or 3.12.3; no file changed');
 const v="const APP_VERSION='"+version+"';";
 code=replaceOne(code,v,"const APP_VERSION='3.12.4';\n"+hook);
 code=within(code,' function atlasSpellMeta(ch,s,ref){','\n function atlasSpellOptions',line=>{
  const old="x.source||tr('Άγνωστη πηγή','Source not recorded')";
  const prior="(window.ATLAS_SPELL_SOURCE_AUDIT?.label(ch,s,window.ATLAS_CONTENT_RUNTIME?.catalog,L.getLanguage()==='el')||"+old+")";
  return replaceOne(line,line.includes(prior)?prior:old,"(atlasReviewApi?.publicSource(s)||'')");
 });
 code=replaceOne(code,'${atlasUxGuide(ch)}${renderPage(ch)}','${atlasUxGuide(ch)}${atlasReviewBanner()}${renderPage(ch)}');
 code=replaceOne(code,' function renderApp(){'," function renderApp(){\n  if(document.querySelector('[data-atlas-review-modal]')&&(!atlasReviewAllowed()||atlasReviewContext?.account!==String(cloud.user?.id))){atlasReviewContext=null;closeModal();}");
 code=within(code,' function renderSpells(ch){','\n // Explicit inventory metadata',s=>{
  s=replaceOne(s,'<div class="grid two">${book.length?book.map(s=>','<div class="atlas-spell-groups">${book.length?atlasGroupedSpells(book,s=>');
  return replaceOne(s,";}).join(''):`<div class=\"panel pad\">",";},true):`<div class=\"panel pad\">");
 });
 code=within(code,'  function combatSpellList(ch){','\n  }',s=>{
  s=replaceOne(s,'<div class="tile-list">${list.map(x=>','<div class="atlas-spell-groups">${atlasGroupedSpells(list,x=>');
  return replaceOne(s,";}).join('')||`<div class=\"empty\">",";})||`<div class=\"empty\">");
 });
 return code;
}
if(require.main===module){const code=fs.readFileSync(file,'utf8'),next=patch(code);if(next===code){console.log('DM review hooks already installed.');process.exit(0)}const tmp=file+'.dm-review-check.js';let created=false;try{fs.writeFileSync(tmp,next,{flag:'wx'});created=true;cp.execFileSync(process.execPath,['--check',tmp],{stdio:'inherit'});fs.renameSync(tmp,file);console.log('DM review applied; no character data touched.')}finally{if(created&&fs.existsSync(tmp))fs.unlinkSync(tmp)}}
module.exports={patch};
