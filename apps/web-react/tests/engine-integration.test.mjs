import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function loadEngine(){
 const ctx=vm.createContext({window:{},console});
 for(const file of ['catalog/srd-2024.js','components/builder-2024.js','components/builder-insights.js','components/origin-choices-2024.js','components/ability-allocation.js']){
   const f=path.join(root,'public/engine',file);
   vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:file});
 }
 return ctx.window;
}
test('React uses unmodified current Atlas v2 SRD 2024 catalog, not the original mock counts',()=>{
 const e=loadEngine();
 assert.equal(e.ATLAS_V2_SRD.edition,'2024');
 assert.equal(e.ATLAS_V2_SRD.classes.length,12);
 assert.equal(e.ATLAS_V2_SRD.backgrounds.length,4);
 assert.equal(e.ATLAS_V2_SRD.equipment.length,182);
 assert.ok(e.ATLAS_V2_BUILDER.classInfo('fighter'));
 assert.ok(e.ATLAS_V2_ORIGINS.validHumanSkill);
 assert.ok(e.ATLAS_V2_INSIGHTS.score);
});
test('Human Fighter Soldier 2024 skill and feat requirements are enforced by existing engine',()=>{
 const e=loadEngine(),b=e.ATLAS_V2_BUILDER,origins=e.ATLAS_V2_ORIGINS;
 const example={class:'fighter',species:'human',background:'soldier',classChoices:{0:['skill-perception','skill-survival']},
  backgroundChoices:{},humanSkill:'skill-medicine',humanFeat:'alert',skilledChoices:[],
  fightingStyle:'Protection',weaponMasteries:['greatsword','spear','light-crossbow'],
  bonusMode:'split',bonusTwo:'str',bonusOne:'con',abilities:[15,14,13,12,10,8],classPackage:null,backgroundPackage:null,
  packageChoices:{},purchases:{}};
 assert.equal(b.classChoicesValid(example),true);
 assert.equal(b.fighterChoicesValid(example),true);
 assert.equal(origins.validHumanSkill(example),true);
 assert.equal(origins.validHumanFeat(example),true);
 example.humanSkill=null;
 assert.equal(origins.validHumanSkill(example),false);
});
test('role switch and local data boundaries contain no authentication or sync transport',()=>{
 const app=fs.readFileSync(path.join(root,'src/app/AppState.tsx'),'utf8');
 const client=fs.readFileSync(path.join(root,'src/services/localStore.ts'),'utf8');
 const packageScripts=fs.readFileSync(path.join(root,'scripts/sync-engine.mjs'),'utf8');
 assert.match(app,/setRolePreview/);
 assert.match(client,/indexedDB.open/);
 assert.doesNotMatch(client,/fetch\(|WebSocket\(|Cloudflare/);
 assert.match(packageScripts,/\.\.\/web-v2/);
});
