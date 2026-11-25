// Staging entrypoint. The baseline module is deliberately unchanged.
import api from './worker.mjs';
const host='dndatlas-api-staging.pagkalosgeo.workers.dev';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.hostname!==host)return json({error:'Staging hostname required'},403);
  if(!env.DB)return json({error:'Staging D1 binding missing'},503);
  if(request.method==='GET'&&url.pathname==='/health'){
   try{
    await env.DB.prepare('SELECT 1 FROM users LIMIT 1').first();
    return json({status:'ok',environment:'staging',database:'ready'});
   }catch{return json({status:'error',environment:'staging',database:'unavailable'},503);}
  }
  // No fallback to the production origin.
  const origin=env.ALLOWED_ORIGIN;
  if(typeof origin!=='string'||!origin.startsWith('https://')||origin==='https://pagkalosg.github.io'||origin===('https://'+host))
   return json({error:'Configure the separate staging frontend origin'},503);
  return api.fetch(request,env);
 }
};
