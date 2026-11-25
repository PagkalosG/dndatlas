// Build the isolated Cloudflare Pages staging frontend. Never change production config.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'_staging_site');
const api='https://dndatlas-api-staging.pagkalosgeo.workers.dev';
if(process.env.CF_PAGES_BRANCH!=='staging')throw Error('Staging build requires CF_PAGES_BRANCH=staging');
const write=(name,contents)=>{const p=path.join(out,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,contents)};
const json=(name,value)=>write(name,JSON.stringify(value,null,2)+'\n');
const copy=(from,to=from)=>fs.cpSync(path.join(root,from),path.join(out,to),{recursive:true});
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
copy('public','.');copy('src','.');
copy('data/rules-2024');
copy('assets/icons','.');
copy('assets/official-2024-character-sheet.pdf','official-2024-character-sheet.pdf');
copy('docs/SRD_ATTRIBUTION.md','SRD_ATTRIBUTION.md');
json('data/api-config.json',{enabled:true,apiUrl:api});
json('data/drive-config.json',{enabled:false,workerUrl:''});
json('data/sessions.json',{schema:1,campaign:'Staging test campaign',sessions:[]});
json('data/campaign-images.json',{schema:1,images:[]});
const index=fs.readFileSync(path.join(out,'index.html'),'utf8');
const title='<title>D&D Atlas · D&D 2024</title>';
if(index.split(title).length!==2)throw Error('Staging title anchor changed');
const marker='<style>#atlas-staging-marker{position:relative;z-index:1;padding:6px 12px;background:#5b3a12;color:#fff;font:600 12px/1.4 system-ui;text-align:center}</style>';
write('index.html',index.replace(title,'<title>D&D Atlas STAGING · D&D 2024</title>'+marker).replace('<body>','<body><div id="atlas-staging-marker" data-keep-language>STAGING · TEST DATA ONLY / ΔΟΚΙΜΑΣΤΙΚΑ ΔΕΔΟΜΕΝΑ</div>'));
const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.webmanifest'),'utf8'));manifest.name='D&D Atlas STAGING · 2024 Character Companion';manifest.short_name='Atlas STAGING';json('manifest.webmanifest',manifest);
const sw=fs.readFileSync(path.join(out,'sw.js'),'utf8').replace(/CACHE='dndatlas-shell-/,"CACHE='dndatlas-shell-staging-");write('sw.js',sw);
// Cloudflare Pages response headers. Production network and remote images are blocked in this build only.
write('_headers',[
 '/*',
 "  Content-Security-Policy: connect-src 'self' "+api+"; img-src 'self' data: blob:; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
 '  X-Content-Type-Options: nosniff',
 '  Referrer-Policy: no-referrer',
 '  X-Robots-Tag: noindex, nofollow',
 '/data/api-config.json','  Cache-Control: no-store',
 '/data/drive-config.json','  Cache-Control: no-store',
 '/version.json','  Cache-Control: no-store',
 '/sw.js','  Cache-Control: no-cache',
].join('\n')+'\n');
for(const file of ['index.html','app.js','data.js','sw.js','version.json','rules-content.html','dm-rules-review.js','data/rules-2024/content-pack-schemas.zip'])if(!fs.statSync(path.join(out,file)).isFile())throw Error('Missing build file: '+file);
if(fs.existsSync(path.join(out,'data/legacy-demo-party.json'))||fs.existsSync(path.join(out,'data/sessions'))||fs.existsSync(path.join(out,'assets/campaign')))throw Error('Unexpected campaign content in staging build');
const version=JSON.parse(fs.readFileSync(path.join(out,'version.json'),'utf8')).version;
if(!fs.readFileSync(path.join(out,'app.js'),'utf8').includes("const APP_VERSION='"+version+"';"))throw Error('Version mismatch');
console.log('Staging frontend assembled: '+version+'; staging API only; no campaign data or Drive connection.');
