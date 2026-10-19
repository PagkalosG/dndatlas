/* D&D Atlas v2 — network-first app shell, never clear browser character data */
const CACHE='dndatlas-shell-v2.1.4';
const SHELL=['./','./index.html','./style.css','./app.js?v=2.1.4','./i18n.js','./data.js','./spell-effects.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./demo-party.json','./data/sessions.json','./data/campaign-images.json','./data/drive-config.json','./version.json'];
const base=new URL(self.registration.scope),valid=p=>p.startsWith(base.pathname);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(async c=>{await Promise.allSettled(SHELL.map(f=>c.add(new Request(new URL(f,base),{cache:'reload'}))));}).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if((k.startsWith('dndatlas-shell-')||k.startsWith('character-atlas-v'))&&k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==self.location.origin||!valid(u.pathname))return;
  if(!SHELL.some(p=>new URL(p,base).pathname===u.pathname)&&!u.pathname.includes('/assets/campaign/'))return;
  e.respondWith((async()=>{const cache=await caches.open(CACHE);try{const net=await fetch(r,{cache:'no-store'});if(net.ok){await cache.put(r,net.clone());return net;}throw Error('HTTP '+net.status);}catch(err){return await cache.match(r)||Response.error();}})());
});
self.addEventListener('message',e=>{
 const respond=x=>{try{e.ports?.[0]?.postMessage(x)}catch{}};
 if(e.data?.type==='CHECK_UPDATES')e.waitUntil((async()=>{let changed=[];const cache=await caches.open(CACHE);for(const f of SHELL.filter(x=>x!=='./')){let req=new Request(new URL(f,base),{cache:'no-store'}),old=await cache.match(req),fresh=await fetch(req,{cache:'no-store'});if(!fresh.ok)throw Error('HTTP '+fresh.status);let diff=!old;if(old){const a=new Uint8Array(await old.arrayBuffer()),b=new Uint8Array(await fresh.clone().arrayBuffer());diff=a.length!==b.length||a.some((v,i)=>v!==b[i]);}if(diff){changed.push(f);await cache.put(req,fresh.clone());}}respond({ok:true,changed})})().catch(err=>respond({ok:false,error:String(err)})));
 if(e.data?.type==='CLEAR_SHELL_CACHE')e.waitUntil(caches.delete(CACHE).then(()=>respond({ok:true})).catch(err=>respond({ok:false,error:String(err)})));
});
