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

test('2024 Builder validation rejects illegal levels, duplicate skills and self-approved overrides',()=>{
 const source=extract('function bFinalAbilities(){','function bRender(){');
 const base={
  rules:'2024',name:'Borruk',class:'Fighter',species:'Human',background:'Soldier',level:1,
  base:{STR:15,DEX:14,CON:13,INT:8,WIS:10,CHA:12},method:'Standard Array',
  boostA:'STR',boostB:'CON',boostPattern:'2+1',languages:['Draconic','Elvish'],
  gamingSet:'Dice Set',subclass:'',originFeat:'feat-tough',weapons:['Greatsword','Spear','Battleaxe'],
  skills:{fighter1:'Perception',fighter2:'Survival',human:'Medicine',bm:'',class1:'',class2:'',class3:'',class4:'',elf:''},maneuvers:[],
  dmOverride:false,dmReason:''
 };
 const context={
  B:base,
  D:{
   species:['Human','Elf'],
   background:['Soldier','Acolyte'],
   classes:{Fighter:{caster:'none'},Bard:{caster:'full'}},
   skills:[['Athletics','STR'],['Intimidation','CHA'],['Perception','WIS'],['Survival','WIS'],['Medicine','WIS'],['Arcana','INT'],['Insight','WIS']]
  },
  cloud:{enabled:false,user:null},
  B_GAMES:['Dice Set'],
  B_LANGUAGES:['Draconic','Elvish'],
  B_SKILLS:['Perception','Survival','Medicine','Athletics','Intimidation'],
  B_ORIGINS:[{id:'feat-tough'}],
  B_ARTISAN:['Smith’s Tools'],
  ATLAS_SKILL_RULES_2024:{backgrounds:{Soldier:'Athletics,Intimidation',Acolyte:'Insight,Religion'},classes:{Fighter:[2,'Perception,Survival,Athletics,Intimidation,Medicine'],Bard:[3,'*']}}
 };
 const check=vm.runInNewContext(source+';bValidate',context);
 assert.equal(check().errors.length,0,JSON.stringify(check()));
 context.B={...base,level:21};
 assert.ok(check().errors.some(e=>e.includes('1–20')));
 context.B={...base,skills:{...base.skills,fighter1:'Athletics'}};
 assert.ok(check().errors.some(e=>e.includes('duplicate')));
 context.B={...base,species:'Unknown'};
 assert.ok(check().errors.some(e=>e.includes('2024 species')));
 context.B={...base,dmOverride:true,dmReason:'Approved by myself'};
 context.cloud={enabled:true,user:{role:'player'}};
 assert.ok(check().errors.some(e=>e.includes('Players may not grant')));
 context.B={...base,class:'Bard',skills:{...base.skills,class1:'Perception',class2:'Survival',class3:'Arcana'},dmOverride:false,dmReason:''};
 const result=check();
 assert.equal(result.review,true);
 assert.ok(!result.errors.some(e=>e.includes('DM Override and a reason')));
 assert.equal(result.errors.length,0,JSON.stringify(result.errors));
 context.B={...base,species:'Elf',skills:{...base.skills,elf:'Insight'},dmOverride:false,dmReason:''};
 assert.equal(check().errors.length,0,JSON.stringify(check().errors));
 context.B={...base,species:'Elf',skills:{...base.skills,elf:''},dmOverride:false,dmReason:''};
 assert.ok(check().errors.some(e=>e.includes('Elf Keen Senses')));
});

test('DM Player draft import asks for manual review and only resolves approval on import',()=>{
 const source=extract("if(e.target.matches('#import-character-file'))","if(e.target.matches('#import-file, #drive-restore-file'))");
 assert.match(source,/playerDraft=documentData\?\.exportScope==='player-draft-for-dm-review'/);
 assert.match(source,/DM review/);
 assert.match(source,/entry\.key==='dm-character-approval'/);
 assert.match(source,/approval\.status='resolved'/);
 assert.match(source,/cloudRequest\('\/characters\/'\+encodeURIComponent\(reviewed\.id\),'POST'/);
});

test('Journal keeps and sorts session numbers without changing image gallery behavior',()=>{
 assert.match(app,/sessionNumber:Number\.isInteger\(x\.sessionNumber\)/);
 assert.match(app,/function journalTiles\(entries,remote\)\{return \[\.\.\.entries\]\.sort/);
 assert.match(app,/atlas-session-timeline-entry/);
 assert.match(app,/data-atlas-journal-open/);
 assert.match(app,/mediaCards\(j\.images\|\|\[\]\)/);
 assert.match(css,/\.atlas-session-timeline-entry/);
});
