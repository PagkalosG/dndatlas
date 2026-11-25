/* Apply the small integration hook to the checked-out Atlas 3.12.2 source. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..')),file=path.join(root,'src/app.js');
let code=fs.readFileSync(file,'utf8');
const marker='window.ATLAS_SPELL_SOURCE_AUDIT?.label(ch,s,window.ATLAS_CONTENT_RUNTIME?.catalog,L.getLanguage()===\'el\')';
const old="x.source||tr('Άγνωστη πηγή','Source not recorded')";
const next=`(${marker}||${old})`;
if(code.includes(marker)){console.log('Spell source display hook already present.');process.exit(0)}
if(!code.includes("const APP_VERSION='3.12.2';"))throw Error('Expected Atlas 3.12.2; no file changed.');
const begin=code.indexOf(' function atlasSpellMeta(ch,s,ref){'),end=code.indexOf('\n',begin);if(begin<0||end<0)throw Error('Expected spell metadata function not found.');
const line=code.slice(begin,end);if(line.split(old).length!==2)throw Error('Expected unique display anchor not found.');
code=code.slice(0,begin)+line.replace(old,next)+code.slice(end);
code=code.replace("const APP_VERSION='3.12.2';","const APP_VERSION='3.12.3';");
const temp=file+'.audit-check.js';try{fs.writeFileSync(temp,code,{flag:'wx'});cp.execFileSync(process.execPath,['--check',temp],{stdio:'inherit'});fs.renameSync(temp,file)}finally{if(fs.existsSync(temp))fs.unlinkSync(temp)}
console.log('Spell source display hook applied; no character data touched.');
