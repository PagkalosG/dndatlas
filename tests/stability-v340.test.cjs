const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const frontend=fs.readFileSync('src/app.js','utf8');
const worker=fs.readFileSync('workers/production/history-drive-extension.js','utf8');

test('revision polling is authenticated, read only and includes no character JSON',()=>{
 assert.match(worker,/pathname==='\/sync\/revisions'/);
 assert.match(worker,/method!=='GET'/);
 assert.match(worker,/SELECT id,revision FROM characters/);
 assert.doesNotMatch(worker,/SELECT \* FROM characters WHERE.*sync\/revisions/);
});
test('live refresh does not overwrite unsaved drafts and avoids aggressive D1 polling',()=>{
 assert.match(frontend,/cloud\.pendingWrites\|\|cloud\.syncBlocked\|\|/);
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
