/* D&D Atlas v1.5 — app-only caching, automatic refresh, zero character-data deletion. */
const CACHE='dndatlas-shell-v1.5';
const FILES=['./','./index.html','./style.css','./app.js','./i18n.js','./data.js','./spell-effects.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./demo-party.json','./version.json'];
const TARGETS=new Set(FILES.map(f=>new URL(f,self.registration.scope).pathname));
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(f=>new Request(new URL(f,self.registration.scope),{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('dndatlas-shell-')||k.startsWith('character-atlas-v')).filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());
});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 if(!TARGETS.has(url.pathname))return;
 // Network-first for app files: a GitHub commit is picked up on the next online reload.
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const result=await fetch(req,{cache:'no-store'});
   if(result.ok){await cache.put(new URL(url.pathname,self.location.origin),result.clone());return result;}
   throw Error('Non-success response '+result.status);
  }catch(err){const cached=await cache.match(new URL(url.pathname,self.location.origin));if(cached)return cached;
   if(req.mode==='navigate'){const fallback=await cache.match(new URL('./index.html',self.registration.scope));if(fallback)return fallback;}
   return Response.error();}
 })());
});
async function checkFiles(){
 const cache=await caches.open(CACHE);const changed=[];
 for(const file of FILES.filter(f=>f!=='./')){
  const uri=new URL(file,self.registration.scope),key=new URL(uri.pathname,uri.origin);
  const old=await cache.match(key);
  const fresh=await fetch(uri,{cache:'no-store'});
  if(!fresh.ok)throw Error('Network failed ('+fresh.status+')');
  let different=!old;
  if(old){const a=new Uint8Array(await old.arrayBuffer()),b=new Uint8Array(await fresh.clone().arrayBuffer());
   different=a.byteLength!==b.byteLength||a.some((v,i)=>v!==b[i]);}
  if(different){changed.push(file);await cache.put(key,fresh.clone());}
 }
 return changed;
}
self.addEventListener('message',event=>{
 const reply=msg=>{try{event.ports?.[0]?.postMessage(msg);}catch{}};
 if(event.data?.type==='CHECK_UPDATES')event.waitUntil(checkFiles().then(changed=>reply({ok:true,changed})).catch(err=>reply({ok:false,error:String(err.message||err)})));
 if(event.data?.type==='CLEAR_SHELL_CACHE')event.waitUntil(caches.delete(CACHE).then(()=>reply({ok:true})).catch(err=>reply({ok:false,error:String(err.message||err)})));
});
