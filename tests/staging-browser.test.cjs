// Browser integration against the actual Worker with a disposable local D1.
// No live credentials or character exports; all outside requests are intercepted.
'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {chromium}=require('playwright');
const {Miniflare}=require('miniflare');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve('_staging_site');
const api='https://dndatlas-api-staging.pagkalosgeo.workers.dev';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const pinHash=(pin,salt)=>crypto.pbkdf2Sync(pin,salt,100000,32,'sha256').toString('hex');
const fixture={id:'atlas-test-mage',name:'Test Mage',species:'Human',background:'Sage',rulesVersion:'2024',classes:[{name:'Wizard',level:3,subclass:'Evoker'}],abilities:{STR:10,DEX:12,CON:14,INT:16,WIS:10,CHA:10},skills:{Arcana:1,History:1},saves:['INT','WIS'],hp:{max:20,current:20,temp:0},ac:11,speed:30,loadouts:[{id:'test-loadout',name:'Default',ac:11}],activeLoadout:0,hitDice:{max:3,used:0},death:{success:0,fail:0},slots:{1:{max:4,used:0},2:{max:2,used:0}},pact:{level:1,max:0,used:0},spellAbility:'INT',spellbook:[{id:'test-mending',name:'Mending',level:0,cast:'Action',prepared:true,spellSource:'Wizard'},{id:'test-shield',name:'Shield',level:1,cast:'Action',prepared:true,spellSource:'Wizard'},{id:'test-misty',name:'Misty Step',level:2,cast:'Bonus Action',prepared:true,spellSource:'Wizard'}],conditions:[],resources:[],features:[],companions:[],feats:[],customFeats:[],maneuvers:[],attacks:[],inventory:[],journal:[],currency:{cp:0,sp:0,ep:0,gp:0},languages:'Common',storyPublic:false,backgroundStory:'SYNTHETIC PRIVATE TEST STORY',pendingChoices2024:[{key:'test-review',label:'Synthetic pending confirmation',status:'pending',notes:'Review test choice'}]};
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf'};
test('real browser: role visibility, level groups, explicit correction and manual save', {timeout:120000},async()=>{
 let browser,mf;const server=http.createServer((req,res)=>{
  const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname)+(req.url==='/'?'index.html':''));
  if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(p).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port;
 try{
  mf=new Miniflare({scriptPath:path.resolve('workers/staging/worker.mjs'),modules:true,compatibilityDate:'2026-08-01',d1Databases:{DB:'atlas-browser-test'},bindings:{ALLOWED_ORIGIN:origin,RECOVERY_PEPPER:'local-browser-test-only-pepper',ATLAS_BACKUP_SECRET:'local-browser-test-only-backup-secret'},verbose:false});
  const db=await mf.getD1Database('DB');
  for(const sql of [
   "CREATE TABLE users (id INTEGER PRIMARY KEY,username TEXT NOT NULL UNIQUE,role TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,owner_character_id TEXT,password_salt TEXT NOT NULL,password_hash TEXT NOT NULL)",
   "CREATE TABLE auth_sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL)",
   "CREATE TABLE characters(id TEXT PRIMARY KEY,owner_user_id INTEGER,data_json TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,modified_by INTEGER,updated_at TEXT DEFAULT CURRENT_TIMESTAMP)",
   "CREATE TABLE audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT,actor_user_id INTEGER,action TEXT NOT NULL,subject TEXT NOT NULL,timestamp TEXT DEFAULT CURRENT_TIMESTAMP)",
   "CREATE TABLE login_attempts(username TEXT PRIMARY KEY,failures INTEGER DEFAULT 0,locked_until INTEGER DEFAULT 0)",
   "CREATE TABLE image_tags(file_id TEXT PRIMARY KEY,session_ids TEXT DEFAULT '[]',tags TEXT DEFAULT '[]',updated_at TEXT DEFAULT CURRENT_TIMESTAMP)"
  ])await db.prepare(sql).run();
  const users=[['test_creator','creator'],['test_dm','dm'],['test_player','player']];
  for(let i=0;i<users.length;i++){const [name,role]=users[i],salt=crypto.randomBytes(16).toString('hex');await db.prepare('INSERT INTO users(id,username,role,owner_character_id,password_salt,password_hash) VALUES(?,?,?,?,?,?)').bind(i+1,name,role,role==='player'?fixture.id:null,salt,pinHash('24681012',salt)).run()}
  await db.prepare('INSERT INTO characters(id,owner_user_id,data_json) VALUES(?,?,?)').bind(fixture.id,3,JSON.stringify(fixture)).run();
  browser=await chromium.launch({headless:true});
  async function openAs(username,viewport){
   const ctx=await browser.newContext({serviceWorkers:'block',viewport});
   const page=await ctx.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await ctx.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url());
    if(u.origin===origin)return route.continue();
    if(u.origin!==api)return route.abort();
    const headers=await req.allHeaders();
    const result=await mf.dispatchFetch('https://atlas-browser.invalid'+u.pathname+u.search,{method:req.method(),headers:{Origin:origin,...(headers.authorization?{Authorization:headers.authorization}:{}),...(headers['content-type']?{'Content-Type':headers['content-type']}:{}),'Access-Control-Request-Method':headers['access-control-request-method']||'', 'Access-Control-Request-Headers':headers['access-control-request-headers']||''},...(req.postData()===null?{}:{body:req.postData()})});
    return route.fulfill({status:result.status,headers:Object.fromEntries(result.headers),body:Buffer.from(await result.arrayBuffer())});
   });
   await page.goto(origin+'/');await page.locator('#cloud-login-form input[name=username]').fill(username);await page.locator('#cloud-login-form input[name=pin]').fill('24681012');await page.locator('#cloud-login-form button[type=submit]').click();
   await page.locator('#cloud-auth').waitFor({state:'hidden'});
   assert.deepEqual(errors,[], 'Errors after login');
   await page.locator('button[data-tab=combat]:visible').first().click();
   await page.locator('button[data-tab=spells]:visible').first().click();
   await page.locator('.atlas-spell-group').first().waitFor();
   return {ctx,page,errors};
  }
  const player=await openAs('test_player',{width:1280,height:900});
  assert.equal(await player.page.locator('[data-atlas-review-open]').count(),0);
  assert.equal(await player.page.locator('.atlas-spell-group').count(),3);
  for(const [id,name] of [['test-mending','Mending'],['test-shield','Shield'],['test-misty','Misty Step']])assert.match(await player.page.locator('[data-owned-spell="'+id+'"]').innerText(),new RegExp(name));
  assert.equal(await player.page.locator('.atlas-header-save').isDisabled(),true);
  assert.deepEqual(player.errors,[]);await player.ctx.close();
  const dm=await openAs('test_dm',{width:1280,height:900});
  await dm.page.locator('[data-atlas-review-open]').click();
  const item=dm.page.locator('.atlas-review-item').filter({hasText:'Shield'}).filter({hasText:'Reaction'}).first();
  await item.waitFor();
  assert.match(await item.innerText(),/Action/);
  assert.match(await dm.page.locator('[data-atlas-review-modal]').innerText(),/Synthetic pending confirmation/);
  const before=await db.prepare('SELECT revision,data_json FROM characters WHERE id=?').bind(fixture.id).first();
  dm.page.once('dialog',d=>d.accept());
  await item.locator('button.primary').first().click();
  await dm.page.locator('[data-atlas-review-modal] [data-action="close-modal"]').click();
  await dm.page.locator('.atlas-header-save:enabled').waitFor();
  assert.deepEqual(await db.prepare('SELECT revision,data_json FROM characters WHERE id=?').bind(fixture.id).first(),before);
  await dm.page.locator('.atlas-header-save:enabled').click();
  await dm.page.locator('.atlas-header-save:disabled').waitFor();
  const after=await db.prepare('SELECT revision,data_json FROM characters WHERE id=?').bind(fixture.id).first();
  assert.equal(after.revision,before.revision+1);
  const expected=JSON.parse(before.data_json);expected.spellbook.find(s=>s.id==='test-shield').cast='Reaction';
  const actual=JSON.parse(after.data_json);assert.equal(actual.spellbook.find(s=>s.id==='test-shield').cast,'Reaction');assert.equal(actual.backgroundStory,expected.backgroundStory);
  assert.deepEqual(actual.spellbook,expected.spellbook);
  assert.deepEqual(dm.errors,[]);await dm.ctx.close();
  const creator=await openAs('test_creator',{width:390,height:844});
  await creator.page.locator('[data-atlas-review-open]').waitFor();
  assert.equal(await creator.page.locator('.atlas-spell-group').count(),3);
  assert.deepEqual(creator.errors,[]);await creator.ctx.close();
 }finally{if(browser)await browser.close();if(mf)await mf.dispose();await new Promise(r=>server.close(r))}
});
