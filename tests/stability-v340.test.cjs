const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const frontend=fs.readFileSync('src/app.js','utf8');
const worker=fs.readFileSync('workers/production/history-drive-extension.js','utf8');

test('revision polling is authenticated, read only and includes no character JSON',()=>{
 assert.match(worker,/pathname==='\/sync\/revisions'/);
 assert.match(worker,/method!=='GET'/);
 assert.match(worker,/SELECT id,revision FROM characters/);
 assert.doesNotMatch(worker,/SELECT \* FROM characters WHERE.*sync\/revisions/);
});
test('live refresh does not overwrite unsaved drafts and avoids aggressive D1 polling',()=>{
 assert.match(frontend,/if\(atlasHasPending\(\)\|\|cloud\.syncBlocked\)\{/);
 assert.match(frontend,/!cloud\.pendingWrites&&!cloud\.syncBlocked&&!atlasHasPending\(\)&&!atlasManualSaving/);
 assert.match(frontend,/\},30000\);/);
 assert.match(frontend,/cloud\.syncBlocked=true;/);
 assert.match(frontend,/failedWrites:new Set\(\)/);
 assert.match(frontend,/cloud\.failedWrites\.add\(id\)/);
 assert.match(frontend,/cloud\.failedWrites\.delete\(id\)/);
 assert.match(frontend,/!cloud\.pendingWrites\&\&!cloud\.syncBlocked/);
 assert.match(frontend,/cloud\.syncBlocked=false;/);
});
test('client JSON backup warns about privacy redaction and marks scope',()=>{
 assert.match(frontend,/exportScope:cloud\.enabled\?'visible-to-current-user':'local'/);
 assert.match(frontend,/not necessarily a complete D1 backup/i);
});
test('Creator-only history and manual Drive restore remain available',()=>{
 assert.match(worker,/if\(actor\.role!=='creator'\)throw err\(403,'Creator only'\)/);
 assert.match(frontend,/function cloudImportFromDrive\(\)/);
 assert.match(frontend,/function cloudHistoryOpen\(\)/);
 assert.match(worker,/Direct Google Drive sync disabled/);
});

test('live polling never overwrites an unsaved draft, including changes during the revision request',async()=>{
 const start=frontend.indexOf('  function cloudStartLive(){'),end=frontend.indexOf('  function cloudPush(character){',start);
 assert.ok(start>=0&&end>start);
 let tick,delay,dirty=false,refreshes=0,reads=0,revisionReads=0,duringRequest=null;
 const cloud={enabled:true,ready:true,token:'test',polling:false,pendingWrites:0,syncBlocked:false,revisions:{a:1},lastSyncVersion:0,url:'https://test.invalid'};
 const ctx={cloud,atlasManualSaving:false,modalOpen:false,document:{visibilityState:'visible',body:{classList:{contains:()=>false}},activeElement:null},view:'overview',atlasHasPending:()=>dirty,atlasDmAllowed:()=>false,atlasPublicBattleRead:async()=>{reads++;},cloudHeaders:()=>({}),cloudRefresh:async()=>{refreshes++;},fetch:async()=>{revisionReads++;duringRequest?.();return {ok:true,json:async()=>({revisions:{a:2},syncVersion:0})};},setInterval:(fn,ms)=>{tick=fn;delay=ms;return 1;},console:{warn:()=>{}}};
 vm.runInNewContext(frontend.slice(start,end)+';cloudStartLive();',ctx);
 assert.equal(delay,30000);
 dirty=true;await tick();assert.equal(refreshes,0);assert.equal(revisionReads,0);assert.equal(reads,1);
 dirty=false;cloud.syncBlocked=true;await tick();assert.equal(refreshes,0);assert.equal(revisionReads,0);
 cloud.syncBlocked=false;ctx.atlasManualSaving=true;await tick();assert.equal(revisionReads,0);
 ctx.atlasManualSaving=false;duringRequest=()=>{dirty=true;};await tick();assert.equal(revisionReads,1);assert.equal(refreshes,0);
 dirty=false;duringRequest=null;await tick();assert.equal(refreshes,1);assert.equal(cloud.polling,false);
});
