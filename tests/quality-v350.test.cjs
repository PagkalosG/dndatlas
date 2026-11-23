const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const app=fs.readFileSync('src/app.js','utf8');
const css=fs.readFileSync('src/style.css','utf8');
function extract(start,end) {
  const a=app.indexOf(start),b=app.indexOf(end,a+start.length);
  assert.ok(a>=0 && b>a, 'Source block not found: '+start+' => '+end);
  return app.slice(a,b);
}
const t=(greek,english)=>english;

test('compact D&D Beyond-style quickbar includes live combat stats and pending choices',()=>{
 const source=extract('function atlasQuickBar(ch){','function renderPage(ch){');
 const fun=vm.runInNewContext(source+';atlasQuickBar',{
  view:'overview',tr:t,esc:String,attr:String,
  AC:()=>17,initMod:()=>3,signed:n=>n>=0?'+'+n:String(n),
  skillMod:()=>4
 });
 const html=fun({hp:{current:25,max:31},speed:30,pendingChoices2024:[{status:'pending'},{status:'resolved'}]});
 assert.match(html,/atlas-quickbar/);
 assert.match(html,/25 \/ 31/);
 assert.match(html,/\+3/);
 assert.match(html,/14/);
 assert.match(html,/30 ft/);
 assert.match(html,/pending choices/);
 assert.match(html,/data-action="pending-choices"/);
 assert.doesNotMatch(html,/data-roll/);
 const none=vm.runInNewContext(source+';atlasQuickBar',{
  view:'journal',tr:t,esc:String,attr:String,AC:()=>17,initMod:()=>0,signed:String,skillMod:()=>0
 });
 assert.equal(none({}), '');
 assert.match(css,/\.atlas-quickbar\s*\{\s*position:sticky/);
});

test('combat spell list uses owned prepared spells and cantrips for any class',()=>{
 const source=extract('function renderCombatSpells(ch){','function renderCombat(ch){');
 const refs={
  cantrip:{name:'Fire Bolt',level:0,cast:'Action'},
  heal:{name:'Healing Word',level:1,cast:'Bonus Action'},
  ward:{name:'Shield',level:1,cast:'Reaction'},
  absent:{name:'Thunderwave',level:1,cast:'Action'}
 };
 const fun=vm.runInNewContext(source+';renderCombatSpells',{
  findReference:id=>refs[id],panel:(title,body,actions,note)=>title+'|'+body+'|'+actions+'|'+note,
  tr:t,esc:String,attr:String
 });
 const html=fun({classes:[{name:'Sorcerer',level:2}],spellbook:[
  {id:'1',name:'Fire Bolt',ref:'cantrip',prepared:false},
  {id:'2',name:'Healing Word',ref:'heal',prepared:true},
  {id:'3',name:'Shield',ref:'ward',prepared:true},
  {id:'4',name:'Thunderwave',ref:'absent',prepared:false}
 ]});
 assert.match(html,/Combat Spells/);
 assert.match(html,/Fire Bolt/);
 assert.match(html,/Healing Word/);
 assert.match(html,/Shield/);
 assert.doesNotMatch(html,/Thunderwave/);
 assert.match(html,/All My Spells/);
 assert.match(html,/data-owned-spell="1"/);
 assert.match(html,/data-tab="spells"/);
 assert.ok(html.indexOf('Healing Word')<html.indexOf('Shield'));
 assert.doesNotMatch(html,/data-roll/);
});

test('failed saves keep an explicit downloadable local draft and block automatic clobber',()=>{
 assert.match(app,/failedDrafts:new Map\(\)/);
 assert.match(app,/cloud\.failedDrafts\.set\(id,snapshot\)/);
 assert.match(app,/cloud\.failedWrites\.has\(id\)/);
 assert.match(app,/exportScope:'unsynced-local-draft'/);
 assert.match(app,/data-action="download-unsaved-draft"/);
 assert.match(app,/data-action="discard-unsaved-refresh"/);
 assert.match(app,/if\(cloud\.failedWrites\.size\)return atlasDiscardUnsavedRefresh\(\)/);
 assert.match(app,/if\(cloud\.failedWrites\.size\)throw Error/);
 assert.match(css,/\.atlas-sync-notice\s*\{/);
});

test('Builder requires D&D 2024, private story default, valid ability scores and DM review',()=>{
 assert.match(app,/storyPublic:false,portrait:/);
 assert.match(app,/q\.storyPublic=b\.storyPublic===true\|\|b\.storyPublic==='true'/);
 assert.match(app,/if\(b\.rules!=='2024'\)/);
 assert.match(app,/Starting level must be 1–20/);
 assert.match(app,/Final ability scores must be within 3–20/);
 assert.match(app,/Skill choices may not duplicate background or class skills/);
 assert.match(app,/dm-review-new-character/);
 assert.match(app,/2024.*DM review/);
 assert.match(app,/String\(ATLAS_SKILL_RULES_2024\.backgrounds\[b\.background\]\|\|''\)\.split\(','\)\.filter\(Boolean\)/);
});

test('online Player Builder exports a draft for DM without spoofing a successful D1 save',()=>{
 const src=extract('function bCreate(){','document.addEventListener(\'click\',e=>{const button=e.target.closest(\'[data-bgo]\')');
 assert.match(src,/if\(cloud\.enabled&&cloud\.user\?\.role==='player'\)/);
 assert.match(src,/exportScope:'player-draft-for-dm-review'/);
 assert.match(src,/key:'dm-character-approval'/);
 assert.match(src,/It has NOT been saved to D1/);
 const playerGuard=src.indexOf("if(cloud.enabled&&cloud.user?.role==='player')");
 const mutation=src.lastIndexOf('characters.push(q)');
 assert.ok(playerGuard>=0 && mutation>playerGuard);
 assert.match(src,/if\(cloud\.enabled&&\(!cloud\.ready\|\|!\['creator','dm'\]\.includes/);
});

test('Level Up previews next 2024 milestones before making changes',()=>{
 const source=extract('function levelUp(){','function progressionRows(');
 let modal=null;
 const fun=vm.runInNewContext(source+';levelUp',{
  c:()=>({classes:[{name:'Fighter',level:3}]}),totalLevel:()=>3,
  tr:t,esc:String,fixedHpGain:()=>7,selectField:()=>'<select/>',field:()=>'<input/>',
  formModal:(...args)=>modal=args,
  window:{ATLAS_PROGRESSION_2024:{Fighter:[
    {features:[]},{features:[]},{features:[]},{features:['Ability Score Improvement']}
  ]}},
  toast:()=>{throw Error('Unexpected toast')}
 });
 fun();
 assert.ok(modal);
 assert.match(modal[3],/Ability Score Improvement/);
 assert.match(modal[3],/Next level/);
 assert.match(modal[3],/marked as pending/);
 assert.match(css,/\.atlas-level-preview\s*\{/);
});

test('PWA behavior, rule limits and existing Creator/DM permissions remain unchanged',()=>{
 assert.match(app,/APP_VERSION='3\.5\.0'/);
 assert.match(app,/const R=window\.ATLAS_RULES_2024/);
 assert.match(app,/data-action="short-rest"/);
 assert.match(app,/data-action="long-rest"/);
 assert.match(app,/atlasCanDmOverride/);
 assert.match(app,/data-action="cloud-secure-backup"/);
 assert.match(app,/data-action="cloud-history"/);
});
