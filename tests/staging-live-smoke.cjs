// Live staging smoke test. No mutations except authentication/session cleanup.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const origin='https://dndatlas.pages.dev';
const api='https://dndatlas-api-staging.pagkalosgeo.workers.dev';
const accounts=[['admin','creator','STAGING_CREATOR_PIN'],['test_dm','dm','STAGING_DM_PIN'],['test_player','player','STAGING_PLAYER_PIN']];
async function main(){
 for(const [,role,key] of accounts)assert.ok(process.env[key], 'Missing staging '+role+' credential');
 const expected=require('../public/version.json').version;
 let ready=false;
 for(let i=0;i<18;i++){
  try{
   const [page,config,drive,version,health]=await Promise.all([
    fetch(origin+'/',{redirect:'error',cache:'no-store'}),
    fetch(origin+'/data/api-config.json',{redirect:'error',cache:'no-store'}).then(r=>r.json()),
    fetch(origin+'/data/drive-config.json',{redirect:'error',cache:'no-store'}).then(r=>r.json()),
    fetch(origin+'/version.json?ci='+i,{redirect:'error',cache:'no-store'}).then(r=>r.json()),
    fetch(api+'/health',{redirect:'error',cache:'no-store'}).then(r=>r.json())
   ]);
   const csp=page.headers.get('content-security-policy')||'';
   if(page.ok&&config.enabled===true&&config.apiUrl===api&&drive.enabled===false&&version.version===expected&&health.environment==='staging'&&health.database==='ready'&&csp.includes(api)&&!csp.includes('dndatlas-api.pagkalosgeo.workers.dev')){ready=true;break;}
  }catch{}
  if(i<17)await new Promise(r=>setTimeout(r,10000));
 }
 assert.ok(ready,'Live staging build, network policy, version or API health did not match; credentials were not used');
 console.log('Live staging config and health verified');
 const browser=await chromium.launch({headless:true});
 try{
  for(const [username,role,key] of accounts){
   const ctx=await browser.newContext({serviceWorkers:'block',viewport:role==='player'?{width:390,height:844}:{width:1280,height:900}});
   let token='',errors=[],blockedWrites=0;
   try{
    await ctx.route('**/*',async route=>{
     const req=route.request(),u=new URL(req.url()),method=req.method();
     if(u.origin===origin&&['GET','HEAD'].includes(method))return route.continue();
     if(u.origin===api){
      if(['GET','HEAD','OPTIONS'].includes(method)||method==='POST'&&['/auth/login','/auth/logout'].includes(u.pathname))return route.continue();
      blockedWrites++;
     }
     return route.abort();
    });
    const page=await ctx.newPage();
    page.on('pageerror',()=>errors.push('Uncaught browser error'));
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    assert.equal(new URL(page.url()).origin,origin);
    await page.locator('#cloud-login-form input[name=username]').fill(username);
    await page.locator('#cloud-login-form input[name=pin]').fill(process.env[key]);
    const loginPromise=page.waitForResponse(r=>r.url()===api+'/auth/login'&&r.request().method()==='POST');
    await page.locator('#cloud-login-form button[type=submit]').click();
    const response=await loginPromise;
    assert.equal(response.status(),200,role+' login failed');
    const info=await response.json();token=info.token;
    assert.equal(info.me.role,role);
    await page.locator('#cloud-auth').waitFor({state:'hidden'});
    const me=await fetch(api+'/auth/me',{headers:{Authorization:'Bearer '+token},redirect:'error'}).then(r=>r.json());
    assert.equal(me.me.role,role);
    const roster=await fetch(api+'/characters',{headers:{Authorization:'Bearer '+token},redirect:'error'}).then(r=>r.json());
    assert.ok(Array.isArray(roster.characters),role+' roster unavailable');
    if(role==='player')assert.equal(await page.locator('[data-atlas-review-open]').count(),0);
    else if(roster.characters.length)await page.locator('[data-atlas-review-open]').waitFor({state:'visible'});
    assert.equal(blockedWrites,0,'Unexpected live write attempt');
    assert.equal(errors.length,0,'Browser runtime error');
    console.log('Live '+role+' authentication and read-only UI passed; roster '+(roster.characters.length?'available':'empty'));
   }finally{
    if(token){const logout=await fetch(api+'/auth/logout',{method:'POST',headers:{Authorization:'Bearer '+token},redirect:'error'});assert.equal(logout.status,200,'Staging session cleanup failed');}
    await ctx.close();
   }
  }
 }finally{await browser.close()}
}
main().catch(e=>{console.error('Live staging smoke test failed: '+(e.code==='ERR_ASSERTION'?e.message:e.name));process.exitCode=1});
