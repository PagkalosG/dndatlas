'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
const root=path.resolve(__dirname,'../apps/web-v2'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'components/ability-allocation.js'),'utf8'),ctx);
const a=ctx.window.ATLAS_V2_ABILITIES;
test('2024 standard array uses fixed six scores',()=>{
  assert.deepEqual(Array.from(a.initialScores('standard')),[15,14,13,12,10,8]);
  assert.equal(a.validate('standard',[15,14,13,12,10,8]).valid,true);
  assert.equal(a.validate('standard',[15,15,13,12,10,8]).valid,false);
});
test('Standard Array minus frees points without silently changing another score',()=>{
  const first=[15,14,13,12,10,8],next=a.adjust(first,0,-1,'standard');
  assert.deepEqual(Array.from(next),[14,14,13,12,10,8]);
  assert.equal(a.validate('standard',next).remaining,1);
  assert.equal(a.validate('standard',next).valid,false);
  const restored=a.adjust(next,1,1,'standard');
  assert.deepEqual(Array.from(restored),[14,15,13,12,10,8]);
  assert.equal(a.validate('standard',restored).valid,true);
  assert.equal(a.adjust(first,0,1,'standard'),null);
  assert.equal(a.adjust(next,0,1,'standard')[0],15);
  assert.equal(a.adjust([9,9,9,9,9,9],0,1,'standard')[0],10);
});
test('point buy uses 27 budget and exact costs, not linear pricing',()=>{
  assert.deepEqual(Array.from(a.initialScores('pointbuy')),[8,8,8,8,8,8]);
  assert.equal(a.validate('pointbuy',[8,8,8,8,8,8]).remaining,27);
  assert.equal(a.validate('pointbuy',[15,15,15,8,8,8]).remaining,0);
  assert.equal(a.validate('pointbuy',[15,15,15,9,8,8]).valid,false);
  assert.equal(a.COST[13],5);assert.equal(a.COST[14],7);assert.equal(a.COST[15],9);
});
test('point buy controls enforce 8–15 and reject overspending',()=>{
  assert.equal(a.adjust([15,15,15,8,8,8],3,1,'pointbuy'),null);
  assert.equal(a.adjust([15,15,15,8,8,8],0,1,'pointbuy'),null);
  assert.equal(a.adjust([8,8,8,8,8,8],0,-1,'pointbuy'),null);
  assert.equal(a.validate('pointbuy',[16,8,8,8,8,8]).valid,false);
  assert.equal(a.validate('pointbuy',[8,8,8,8,8,7]).valid,false);
});
test('bilingual ability UI shows modifier after background boosts',()=>{
  const draft={abilityMethod:'pointbuy',abilities:[15,14,13,12,10,8]};
  const score=(d,k,boost)=>{const base=d.abilities[['str','dex','con','int','wis','cha'].indexOf(k)],b=boost(d,k),total=base+b;return{base,bonus:b,total,modifier:Math.floor((total-10)/2)}};
  const name=k=>k,esc=x=>String(x);
  const html=a.render({draft,locale:'el',t:name,esc,score,bonusFor:(d,k)=>k==='str'?2:0});
  assert.match(html,/Πόντοι που απομένουν/);assert.match(html,/Τελική τιμή/);
  assert.match(html,/data-action="ability-adjust"/);assert.match(html,/\+3/);
  assert.doesNotMatch(html,/<select/);
});
test('builder loads ability component and no dropdown score handler remains',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  assert.ok(html.indexOf('ability-allocation.js')<html.indexOf('src="app.js"'));
  assert.match(app,/abilityUI\.validate/);assert.match(app,/abilityUI\.adjust/);
  assert.doesNotMatch(app,/target\.dataset\.ability !== undefined/);
});
