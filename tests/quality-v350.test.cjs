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

test('quickbar is removed and calculation inspector is in header only',()=>{
 assert.doesNotMatch(app,/function atlasQuickBar\(/);
 assert.doesNotMatch(app,/\$\{atlasQuickBar\(ch\)\}/);
 assert.match(app,/class="btn sm atlas-header-calculator" data-action="atlas-calculations"/);
 const guide=extract('function atlasUxGuide(ch){','function atlasValidationIssues(ch){');
 assert.doesNotMatch(guide,/data-action="atlas-mode"|data-action="atlas-calculations"/);
 assert.match(guide,/mode!==\x27beginner\x27/);
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
 assert.match(app,/if\(atlasHasPending\(\)\|\|cloud\.failedWrites\.size\)return atlasDiscardUnsavedRefresh\(\)/);
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
 assert.match(app,/APP_VERSION='3\.11\.0'/);
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
 assert.match(source,/characters\.push\(reviewed\);selectedId=reviewed\.id;update\(\)/);
});

test('Journal keeps and sorts session numbers without changing image gallery behavior',()=>{
 assert.match(app,/sessionNumber:Number\.isInteger\(x\.sessionNumber\)/);
 assert.match(app,/function journalTiles\(entries,remote\)\{return \[\.\.\.entries\]\.sort/);
 assert.match(app,/atlas-session-timeline-entry/);
 assert.match(app,/data-atlas-journal-open/);
 assert.match(app,/mediaCards\(j\.images\|\|\[\]\)/);
 assert.match(css,/\.atlas-session-timeline-entry/);
});


test('mobile navigation is fixed, with compact accessible header and safe-area spacing',()=>{
 const index=fs.readFileSync('public/index.html','utf8');
 const sw=fs.readFileSync('public/sw.js','utf8');
 const version=JSON.parse(fs.readFileSync('public/version.json','utf8'));
 assert.equal(version.version,'3.11.0');
 for(const asset of ['style.css','app.js']){
  assert.ok(index.includes(asset+'?v=3.11.0'));
  assert.ok(sw.includes(asset+'?v=3.11.0'));
 }
 assert.match(sw,/dndatlas-shell-v3\.11\.0/);
 assert.match(css,/\.topbar\{position:fixed;inset:0 0 auto/);
 assert.match(css,/\.mobile-nav\{display:grid;position:fixed;z-index:30;inset:auto 0 0/);
 assert.match(css,/\.main\{padding-bottom:calc\(var\(--atlas-bottom-height\) \+ 24px\)/);
 assert.match(css,/\.atlas-header-toggle\[aria-expanded="true"\]\+\.atlas-header-panel\{display:flex\}/);
 assert.match(app,/data-action="settings" aria-label="\$\{attr\(tr/);
 const source=extract('function atlasHeaderMenu(controls){','function atlasSetHeaderMenu(');
 const menu=vm.runInNewContext(source+';atlasHeaderMenu',{tr:t,attr:String});
 const html=menu('<button data-action="new-character">New</button>');
 assert.match(html,/aria-expanded="false" aria-controls="atlas-header-panel"/);
 assert.match(html,/aria-label="Menu"/);
 assert.match(html,/id="atlas-header-panel"/);
 assert.match(html,/data-action="new-character"/);
 const greek=vm.runInNewContext(source+';atlasHeaderMenu',{tr:(el,en)=>el,attr:String});
 assert.match(greek(''),/aria-label="Μενού"/);
 assert.match(app,/atlasHeaderMenu\(`/);
});

test('header menu preserves controls and closes on selection, outside click and Escape',()=>{
 let expanded='false',focused=0;const handlers={};
 const button={getAttribute:()=>expanded,setAttribute:(name,value)=>{assert.equal(name,'aria-expanded');expanded=value;},focus:()=>focused++};
 const document={querySelector:s=>s.includes('="true"')?(expanded==='true'?button:null):button,addEventListener:(name,fn)=>handlers[name]=fn};
 const source=extract('function atlasSetHeaderMenu(','// v3.6: presentation preferences');
 vm.runInNewContext(source,{document});
 const click=(matches)=>handlers.click({target:{closest:s=>matches.includes(s)?button:null}});
 click(['[data-atlas-header-toggle]']);assert.equal(expanded,'true');
 click(['#atlas-header-panel']);assert.equal(expanded,'true');
 handlers.change({target:{matches:s=>s==='#atlas-header-panel select'}});assert.equal(expanded,'false');
 click(['[data-atlas-header-toggle]']);click([]);assert.equal(expanded,'false');
 click(['[data-atlas-header-toggle]']);click(['#atlas-header-panel','#atlas-header-panel button']);assert.equal(expanded,'false');
 click(['[data-atlas-header-toggle]']);
 let prevented=false;handlers.keydown({key:'Escape',preventDefault:()=>prevented=true,stopImmediatePropagation:()=>{}});
 assert.equal(expanded,'false');assert.equal(prevented,true);assert.ok(focused>=3);
});


test('unified header has accessible offline language flags and no language dropdown',()=>{
 const source=extract('function atlasLanguageButtons(){','function atlasHeaderMenu(controls){');
 let lang='en',rendered=0,focused=0,messages=[];
 const L={getLanguage:()=>lang,setLanguage:x=>lang=x};
 const context={L,tr:t,attr:String,renderApp:()=>rendered++,document:{querySelector:()=>({focus:()=>focused++})},toast:x=>messages.push(x)};
 const api=vm.runInNewContext(source+';({atlasLanguageButtons,atlasChangeLanguage})',context);
 let html=api.atlasLanguageButtons();
 assert.match(html,/data-atlas-language="en" aria-pressed="true" aria-label="English"/);
 assert.match(html,/data-atlas-language="el" aria-pressed="false" aria-label="Ελληνικά"/);
 assert.equal((html.match(/<svg /g)||[]).length,2);
 api.atlasChangeLanguage('el');
 assert.equal(lang,'el');assert.equal(rendered,1);assert.equal(focused,1);
 assert.match(api.atlasLanguageButtons(),/data-atlas-language="el" aria-pressed="true"/);
 api.atlasChangeLanguage('el');api.atlasChangeLanguage('invalid');
 assert.equal(rendered,1);assert.equal(messages.length,1);
 assert.doesNotMatch(app,/data-language-select/);
 assert.match(app,/data-atlas-account-label/);
 assert.match(app,/data-action="cloud-save-now"/);
 assert.match(css,/\.atlas-language-flag\[aria-pressed="true"\]/);
 assert.match(css,/\/\* v3\.5\.2 — unified header controls/);
 assert.match(css,/\.atlas-header-toggle,\.top-actions \.atlas-header-settings\{display:inline-flex/);
});


test('UX preferences are account-scoped and only store presentation/catalog favorites',()=>{
 const src=extract('function atlasUxKey(){','function atlasUxMenu(){');
 const values=new Map(),cloud={enabled:true,user:{id:'one'}};
 const ctx={cloud,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},tr:t,toast:()=>{},closeModal:()=>{},renderApp:()=>{}};
 const api=vm.runInNewContext(src+';({atlasUxKey,atlasUxPrefs,atlasWriteUx,atlasSetMode})',ctx);
 api.atlasSetMode('advanced');api.atlasWriteUx({mode:'advanced',favorites:['spell-shield']});
 assert.equal(api.atlasUxPrefs().mode,'advanced');assert.equal(api.atlasUxPrefs().favorites[0],'spell-shield');
 cloud.user={id:'two'};assert.equal(api.atlasUxPrefs().mode,'beginner');assert.equal(api.atlasUxPrefs().favorites.length,0);
 assert.doesNotMatch(src,/cloudRequest|cloudPush/);
});
test('search index includes only catalog, navigation and current character item names, no private notes',()=>{
 const src=extract('function atlasSearchIndex(ch){','function atlasSearchResults(');
 const D={spells:[{id:'shield',name:'Shield',kind:'Spell',summary:'Protection'}],maneuvers:[],feats:[],conditions:[],actions:[],masteries:[]};
 const fun=vm.runInNewContext(src+';atlasSearchIndex',{D,navigation:[['overview','Overview']],L:{translate:x=>x,summary:x=>x.summary},tr:t});
 const rows=fun({attacks:[{id:'a',name:'Sword',notes:'secret'}],spellbook:[],inventory:[{id:'i',name:'Rope'}],backgroundStory:'private story',notes:'private notes'});
 assert.equal(rows.length,4);assert.ok(rows.some(x=>x.id==='shield'&&x.favorite));assert.doesNotMatch(JSON.stringify(rows),/private|secret/);
});
test('rest preview is pure, restores only tracked resources, and preserves concentration unless explicitly ended',()=>{
 const src=extract('function atlasRestPlan(ch,type,endConcentration=false){','function atlasRestPreview(');
 const plan=vm.runInNewContext(src+';atlasRestPlan',{tr:t,totalLevel:()=>3});
 const ch={hp:{current:10,max:31,temp:4},hitDice:{max:3,used:2},species:'Human',inspiration:false,exhaustion:2,death:{success:1,fail:0},slots:{1:{max:2,used:1}},pact:{max:2,used:1},concentrating:'Hex',resources:[{name:'Second Wind',current:0,max:2,recharge:'short1'},{name:'Manual',current:0,max:1,recharge:'manual'}]};
 const before=JSON.stringify(ch),short=plan(ch,'short'),long=plan(ch,'long',true);
 assert.equal(JSON.stringify(ch),before);assert.equal(short.next.resources[0].current,1);assert.equal(short.next.hp.temp,4);assert.equal(short.next.concentrating,'Hex');assert.equal(short.next.slots[1].used,1);
 assert.equal(long.next.hp.current,31);assert.equal(long.next.hp.temp,0);assert.equal(long.next.hitDice.used,0);assert.equal(long.next.resources[1].current,0);assert.equal(long.next.concentrating,'');assert.equal(long.next.exhaustion,1);assert.equal(long.next.inspiration,true);
 assert.equal(plan({...ch,hp:{current:0,max:31}},'long').allowed,false);
});
test('calculation inspector reuses current engine and labels stored/overridden values',()=>{
 const src=extract('function atlasCalculationRows(ch){','function atlasCalculations(){');
 const ctx={tr:t,prof:()=>2,ability:()=>3,skillMod:()=>7,initMod:()=>3,AC:()=>16,totalLevel:()=>3,signed:n=>n>=0?'+'+n:String(n),activeLoadout:()=>({name:'Shield'}),D:{abilities:{STR:'Strength'},skills:[['Athletics','STR']]},saveMod:()=>5,attackStats:()=>({hit:5,ability:'STR',mod:3,pb:2,magic:0,damageMod:3}),attackDamage:()=> '2d6+3'};
 const fun=vm.runInNewContext(src+';atlasCalculationRows',ctx);
 const rows=fun({hp:{max:31},passivePerceptionOverride:10,abilities:{STR:16},skills:{Athletics:2},attacks:[{name:'Sword',damage:'2d6'}]});
 assert.ok(rows.some(x=>x.name==='Passive Perception'&&x.value==='10'&&x.formula.includes('override')));
 assert.ok(rows.some(x=>x.name==='Athletics'&&x.value==='+7'&&x.formula.includes('2 × 2')));
 assert.ok(rows.some(x=>x.name==='Sword · Attack'&&x.value==='+5'));
 assert.ok(rows.some(x=>x.name==='Armor Class'&&x.formula.includes('Stored')));
});

test('partial validation reports counters, pending choices and overrides without mutation',()=>{
 const src=extract('function atlasValidationIssues(ch){','function atlasValidationOpen(){');
 const check=vm.runInNewContext(src+';atlasValidationIssues',{tr:t,D:{abilities:{STR:'Strength'},skills:[['Athletics','STR']]},twoHandedShieldConflict:()=>true,atlasAttunementCount:()=>0,atlasContainerAllowed:()=>true});
 const ch={classes:[{level:3}],abilities:{STR:16},hp:{max:31,current:35},skills:{Athletics:2},attacks:[{name:'Greatsword'}],resources:[{name:'Wind',max:2,current:3}],spellbook:[{name:'Light',freeResourceId:'missing'}],pendingChoices2024:[{label:'Feat'}],passivePerceptionOverride:10};
 const before=JSON.stringify(ch),rows=check(ch);assert.equal(JSON.stringify(ch),before);assert.ok(rows.some(x=>x.title==='HP'&&x.kind==='error'));assert.ok(rows.some(x=>x.title==='Greatsword'&&x.kind==='warning'));assert.ok(rows.some(x=>x.title==='Passive Perception'&&x.kind==='override'));assert.ok(rows.some(x=>x.title==='Light'));
});
test('spell casting options respect level, preparation, explicit source and free resource',()=>{
 const src=extract('function atlasSpellInfo(ch,s,ref){','function atlasSpellMeta(');
 const info=vm.runInNewContext(src+';atlasSpellInfo',{});
 const ch={classes:[{name:'Wizard'}],slots:{1:{max:2,used:0},2:{max:1,used:0}},pact:{max:1,used:0,level:1},resources:[{id:'gift',current:1,max:1}]};
 let x=info(ch,{prepared:true,freeResourceId:'gift'},{level:2,cast:'Bonus Action'});assert.equal(x.kind,'bonus');assert.equal(x.slots.join(','),'2');assert.equal(x.pact,false);assert.equal(x.canFree,true);
 x=info(ch,{prepared:false,spellSource:'Wizard'},{level:1,cast:'Action',ritual:true});assert.equal(x.slots.length,0);assert.equal(x.canRitual,true);
 x=info(ch,{prepared:false},{level:1,ritual:true});assert.equal(x.canRitual,false);assert.equal(x.canFree,false);
 x=info(ch,{prepared:false},{level:0,cast:'Reaction'});assert.equal(x.prepared,true);assert.equal(x.kind,'reaction');
});
test('turn tracker resets reaction only at own turn and clears slot marker for other turn',()=>{
 const src=extract('const atlasTurnStates=new Map();','function atlasTurnPanel(');
 const ch={id:'a'},ctx={atlasUxKey:()=> 'account',c:()=>ch,canEditCharacter:()=>true,renderApp:()=>{}};
 const a=vm.runInNewContext(src+';({atlasTurnState,atlasTurnAction})',ctx);
 a.atlasTurnAction('start');a.atlasTurnAction('reaction');a.atlasTurnAction('slot');a.atlasTurnAction('other');assert.equal(a.atlasTurnState(ch).reaction,true);assert.equal(a.atlasTurnState(ch).slot,false);a.atlasTurnAction('start');assert.equal(a.atlasTurnState(ch).reaction,false);assert.equal(a.atlasTurnState(ch).turn,2);
});

test('canonical ritual flag cannot be overridden by a custom spell field',()=>{
 const src=extract('function atlasSpellInfo(ch,s,ref){','function atlasSpellMeta(');
 const info=vm.runInNewContext(src+';atlasSpellInfo',{});
 assert.equal(info({}, {ritual:true}, {level:1,ritual:false}).canRitual,false);
 assert.equal(info({}, {level:1,ritual:true}, null).canRitual,true);
 assert.match(app,/data-atlas-spell-filter/);
 assert.match(app,/aria-current="page"/);
});

test('release check compares semantic versions and update guards unsaved changes',()=>{
 const src=extract('function atlasVersionCompare(a,b){','function atlasUpdateBusy(');
 const cmp=vm.runInNewContext(src+';atlasVersionCompare',{});
 assert.equal(cmp('3.11.0','3.8.0'),1);assert.equal(cmp('3.8.0','3.8.0'),0);assert.equal(cmp('3.7.0','3.8.0'),-1);assert.throws(()=>cmp('broken','3.8.0'));
 const refresh=extract('async function refreshApp(clearCache=false){','function resetLocalData(){');
 assert.match(refresh,/cloud\.failedWrites\.size/);assert.match(refresh,/await atlasAwaitWorker\(reg,remote\)/);assert.match(refresh,/atlasUpdateBusy\(false\)/);
});
test('inventory metadata rejects self/nested containers, fourth attunement and invalid charges',()=>{
 const src=extract('function atlasAttunementCount(ch){','function atlasInventoryMeta(')+extract('function atlasItemMetadata(ch,existing,v,qty){','function renderInventory(ch){');
 const api=vm.runInNewContext(src+';({atlasContainerAllowed,atlasItemMetadata})',{tr:t});
 const ch={inventory:[{id:'bag',category:'container',qty:1},{id:'nested',category:'container',containerId:'bag',qty:1},...['a','b','c'].map(id=>({id,attuned:true}))]};
 assert.equal(api.atlasContainerAllowed(ch,'bag','bag'),false);assert.equal(api.atlasContainerAllowed(ch,'item','nested'),false);assert.equal(api.atlasContainerAllowed(ch,'item','bag'),true);
 assert.throws(()=>api.atlasItemMetadata(ch,null,{attuned:'true',requiresAttunement:'true'},1));assert.throws(()=>api.atlasItemMetadata(ch,null,{chargesMax:2,chargesCurrent:3},1));
 assert.equal(api.atlasItemMetadata(ch,null,{containerId:'bag',chargesMax:3,chargesCurrent:2},1).chargesCurrent,2);
});
test('build preview does not mutate character and respects ASI cap',()=>{
 const src=extract('function atlasBuildScenario(ch,first,second,split){','function atlasPlannerPreview(');
 const scenario=vm.runInNewContext(src+';atlasBuildScenario',{D:{abilities:{STR:'Strength',DEX:'Dexterity'}},tr:t});
 const ch={abilities:{STR:18,DEX:14},hp:{max:30}};
 assert.equal(scenario(ch,'STR','',false).abilities.STR,20);assert.equal(ch.abilities.STR,18);
 assert.equal(scenario(ch,'STR','DEX',true).abilities.DEX,15);assert.throws(()=>scenario(ch,'STR','STR',true));
 assert.throws(()=>scenario({abilities:{STR:19}},'STR','',false));
});

test('combat tabs keep selection per character and account and support noncasters',()=>{
 const src=extract('const atlasCombatTabs=new Map();','  document.addEventListener(\'click\',e=>{const b=e.target.closest(\'[data-atlas-combat-tab]\')');
 let account='a',renders=0;
 const api=vm.runInNewContext(src+';({atlasCombatTab,atlasSetCombatTab,atlasCombatTabBar})',{atlasUxKey:()=>account,hasSpells:ch=>!!ch.spellbook?.length,hasSlots:ch=>!!ch.slots,tr:t,attr:String,svg:()=>'<svg></svg>',renderApp:()=>renders++,document:{querySelector:()=>null}});
 const fighter={id:'f',attacks:[{}]},wizard={id:'w',spellbook:[{}]};
 assert.equal(api.atlasCombatTab(fighter),'attacks');assert.equal(api.atlasCombatTab(wizard),'spells');
 api.atlasSetCombatTab(fighter,'spells');assert.equal(api.atlasCombatTab(fighter),'spells');assert.equal(renders,1);
 account='b';assert.equal(api.atlasCombatTab(fighter),'attacks');api.atlasSetCombatTab(fighter,'bad');assert.equal(renders,1);
 assert.match(api.atlasCombatTabBar('spells'),/aria-selected="true" tabindex="0"[^>]*data-atlas-combat-tab="spells"/);
});
test('active combat renderer separates spell slots from weapons and retains shared resources',()=>{
 const src=extract('renderCombat=function(ch){','  attackDetail=function(id)');
 assert.match(src,/id="atlas-combat-panel-attacks"[\s\S]*combatAttackRows\(ch\)[\s\S]*id="atlas-combat-panel-spells"[\s\S]*renderSlots\(ch\)[\s\S]*combatSpellList\(ch\)/);
 assert.match(src,/atlasCombatTabBar\(active\).*atlasTurnPanel\(ch\)/);
 assert.match(src,/atlas-combat-shared[\s\S]*Available resources[\s\S]*Saving Throws[\s\S]*Active Conditions[\s\S]*Concentration/);
 assert.doesNotMatch(extract('function combatResources(ch){','function combatFeatures(ch){'),/renderSlots\(ch\)/);
 assert.match(css,/\.atlas-combat-tab-layout \[hidden\]\{display:none!important\}/);
});

test('builder equipment uses independent class/background choices, bundle quantities and integer copper',()=>{
 const source=extract('const B_GOLD_2024=','function bEquipmentFields(b){');
 const api=vm.runInNewContext(source+';({bEquipmentPlan,bEquipmentAC,bCoins})',{});
 const b={class:'Fighter',background:'Soldier',classPackage:'fighter-a',backgroundPackage:'gold',equipmentMode:'structured',purchases:{Shield:1,Javelin:2,Arrows:1},armorChoice:'Chain Mail',shieldChoice:true,fightingStyle:'Defense'};
 const plan=api.bEquipmentPlan(b);assert.equal(plan.grant,5400);assert.equal(plan.cost,1200);assert.equal(plan.remaining,4200);assert.equal(plan.items.find(x=>x.name==='Javelin').qty,10);assert.equal(plan.items.find(x=>x.name==='Arrows').qty,20);assert.equal(api.bEquipmentAC(b,plan,{DEX:14}).ac,19);
 assert.ok(api.bEquipmentPlan({...b,purchases:{Greatsword:99}}).errors.length);
 assert.ok(api.bEquipmentPlan({...b,class:'Wizard'}).errors.length);
 assert.equal(api.bEquipmentPlan({...b,classPackage:'gold',backgroundPackage:'gold',purchases:{}}).grant,20500);
});
test('draft snapshot excludes private narrative and privileged fields',()=>{
 const src=extract('function bDraftSnapshot(b){','function bDraftRestore(doc){');
 const snap=vm.runInNewContext(src+';bDraftSnapshot',{});
 const b={name:'Hero',story:'private',portrait:'data:image/jpeg;base64,private',player:'private',dmReason:'private',dmOverride:true,passiveOverride:'10',purchases:{Spear:1}};
 const doc=snap(b);assert.equal(doc.schema,1);assert.equal(doc.state.name,'Hero');assert.equal(doc.state.purchases.Spear,1);assert.doesNotMatch(JSON.stringify(doc),/private|dmOverride|passiveOverride/);
 assert.match(app,/data-bgo="save"/);assert.match(app,/b-live-preview-slot/);assert.match(css,/\.atlas-builder \.b-workspace/);
});

test('standard array exchanges scores without introducing duplicates',()=>{
 const src=extract('function bStandardArrayAssign(base,key,value){','function bAbilityInput(b,k){');
 const api=vm.runInNewContext(src+';({bStandardArrayAssign,bPointBuyCost})',{});
 const base={STR:15,DEX:14,CON:13,INT:8,WIS:10,CHA:12};
 assert.equal(api.bStandardArrayAssign(base,'STR',14),true);assert.equal(base.STR,14);assert.equal(base.DEX,15);assert.equal(new Set(Object.values(base)).size,6);
 assert.equal(api.bStandardArrayAssign(base,'STR',20),false);assert.equal(api.bPointBuyCost({STR:15,DEX:15,CON:15,INT:8,WIS:8,CHA:8}),27);
 assert.match(app,/builder-art\//);assert.match(fs.readFileSync('public/sw.js','utf8'),/builder-art\//);
});

test('proficiency parser preserves unknown and feature-specific records, and supports legacy labels',()=>{
 const src=extract('const ATLAS_PROF_GROUPS=[','function atlasProfCanManage(ch){');
 const api=vm.runInNewContext(src+';({atlasProfParse,atlasProfFixed,atlasProfSerialize})',{D:{weapons:[{name:'Spear'},{name:'Greatsword'}]},R:{ARTISAN_TOOLS:['Smith’s Tools','Calligrapher’s Supplies'],studentSelection:ch=>({tool:ch.studentOfWarTool})},B_GAMES:['Dice Set']});
 const parsed=api.atlasProfParse("Armor: Light, Medium, Heavy, Shields. Weapons: Simple, Martial. Tools: Smith's Tools; Gaming Set: Dice Set; Student of War Tool: Smith’s Tools; Unmapped private note");
 assert.equal(parsed.selected.armor.length,4);assert.equal(parsed.selected.weapons.length,2);assert.equal(parsed.selected.artisan[0],'Smith’s Tools');assert.equal(parsed.selected.games[0],'Dice Set');
 assert.equal(parsed.legacy.length,2);const again=api.atlasProfParse(api.atlasProfSerialize(parsed.selected,parsed.legacy));assert.equal(JSON.stringify(again),JSON.stringify(parsed));
 const unknown=api.atlasProfParse('Tools: Smith’s Tools, Unknown Custom Tool');assert.equal(unknown.legacy[0],'Tools: Smith’s Tools, Unknown Custom Tool');
 const fixed=api.atlasProfFixed({classes:[{name:'Wizard',level:1},{name:'Fighter',level:3,subclass:'Battle Master'}],studentOfWarTool:'Smith’s Tools'});
 assert.ok(fixed.armor['Light Armor']);assert.ok(!fixed.armor['Heavy Armor']);assert.ok(fixed.weapons['Martial Weapons']);assert.ok(fixed.artisan['Smith’s Tools']);
 assert.throws(()=>api.atlasProfSerialize({armor:['Unknown']},[]));
});
test('proficiency editing has explicit role and ownership checks and profile cannot erase fields',()=>{
 const src=extract('function atlasProfCanManage(ch){','function atlasProfLabel(key){');
 const cloud={enabled:true,ready:true,user:{role:'player'}};
 const api=vm.runInNewContext(src+';({atlasProfCanManage,atlasProfCanChooseLanguages})',{cloud,canEditCharacter:()=>true,languageList:s=>s.split(', '),B_LANGUAGES:['Elvish','Giant']});
 assert.equal(api.atlasProfCanManage({}),false);assert.equal(api.atlasProfCanChooseLanguages({languages:'Common, Giant, Elvish'}),true);assert.equal(api.atlasProfCanChooseLanguages({languages:'Common, Giant, Elvish, Infernal'}),false);
 cloud.user.role='dm';assert.equal(api.atlasProfCanManage({}),true);
 assert.doesNotMatch(extract('function editChar(){','function editAbilities'),/field\('proficiencies'/);
 assert.match(app,/if\(!atlasProfCanManage\(ch\)\|\|ch.id!==e.target.dataset.character\)/);
});

test('soldier gaming choice is scoped to one identifiable legacy grant',()=>{
 const src=extract('function atlasSoldierGame(ch){','function atlasSoldierGameEditor(){');
 const grant=vm.runInNewContext(src+';atlasSoldierGame',{B_GAMES:['Dice Set','Playing Card Set']});
 assert.equal(grant({background:'Soldier',proficiencies:'Gaming Set: Dice Set; Smith’s Tools'}).value,'Dice Set');
 assert.equal(grant({background:'Soldier',proficiencies:'Gaming Set: Dice Set; Gaming Set: Playing Card Set'}),null);
 assert.equal(grant({background:'Sage',proficiencies:'Gaming Set: Dice Set'}),null);
});

test('short rest spending tracks cumulative hit dice and rejects overspending',()=>{
 const source=extract('function atlasRestDicePool(ch){','function atlasRestDiceFields(ch){');
 const api=vm.runInNewContext(source+';({atlasRestDicePool,atlasRestDiceApply,atlasRestDieTypes})',{tr:t,totalLevel:()=>4,D:{classes:{Fighter:{die:10},Wizard:{die:6}}}});
 const ch={classes:[{name:'Fighter',level:4}],hp:{current:10,max:31,temp:2},abilities:{CON:13},hitDice:{max:4,used:1}};
 assert.equal(api.atlasRestDieTypes(ch),10);
 assert.equal(api.atlasRestDiceApply(ch,2,'results',['4','6'],10).healed,12);assert.equal(ch.hp.current,22);assert.equal(ch.hitDice.used,3);assert.equal(ch.hp.temp,2);
 assert.throws(()=>api.atlasRestDiceApply(ch,2,'manual',[],10));
 assert.throws(()=>api.atlasRestDiceApply(ch,1,'results',[''],10));assert.equal(ch.hitDice.used,3);
 assert.equal(api.atlasRestDiceApply(ch,1,'manual',[],10).healed,0);assert.equal(ch.hitDice.used,4);assert.equal(ch.hp.current,22);
 assert.equal(api.atlasRestDiceApply(ch,0,'manual',[],10).spent,0);
 assert.equal(api.atlasRestDieTypes({classes:[{name:'Fighter',level:2},{name:'Wizard',level:2}]}),0);
 const full={hp:{current:30,max:31},abilities:{CON:8},hitDice:{max:4,used:0}};assert.throws(()=>api.atlasRestDiceApply(full,2,'results',[1,1],10));assert.equal(full.hitDice.used,0);
 assert.equal(api.atlasRestDiceApply(full,1,'results',[1],10).healed,1);assert.equal(full.hp.current,31);
});
test('header save is outside menu and settings is inside',()=>{
 const line=app.split('\n').find(x=>x.includes('atlas-header-calculator')&&x.includes('atlasHeaderMenu'));
 assert.ok(line.indexOf('data-action="settings"')<line.indexOf('atlas-header-calculator'));
 assert.ok(line.indexOf('atlasHeaderSave(ch)')>line.indexOf('atlas-header-calculator'));
 assert.match(app,/finally\{atlasManualSaving=false;setBusy\(\);renderApp\(\);\}/);
 assert.match(css,/\.top-actions \.atlas-header-save/);
});

test('DM multiview is limited to authenticated privileged roles and current roster targets',()=>{
 const src=extract('function atlasDmAllowed(){','function atlasDmNav(){');
 const cloud={enabled:true,ready:true,token:'test',user:{role:'player'}},characters=[{id:'a'},{id:'b'}];
 const api=vm.runInNewContext(src+';({atlasDmAllowed,atlasDmTarget})',{cloud,characters,canEditCharacter:ch=>ch.id==='a'});
 assert.equal(api.atlasDmAllowed(),false);assert.equal(api.atlasDmTarget('a'),undefined);
 cloud.user.role='dm';assert.equal(api.atlasDmAllowed(),true);assert.equal(api.atlasDmTarget('a').id,'a');assert.equal(api.atlasDmTarget('b'),undefined);assert.equal(api.atlasDmTarget('missing'),undefined);
 cloud.user.role='creator';assert.equal(api.atlasDmAllowed(),true);cloud.token='';assert.equal(api.atlasDmAllowed(),false);
});
test('DM multiview summary uses current engine values and supports missing HP filters',()=>{
 const src=extract('function atlasDmStats(ch){','function atlasDmStatus(ch,s){');
 const api=vm.runInNewContext(src+';({atlasDmStats,atlasDmRows})',{totalLevel:()=>3,skillMod:()=>5,AC:()=>16,initMod:()=>2});
 const a={name:'A',hp:{max:30,current:15,temp:2},hitDice:{max:3,used:1},passivePerceptionOverride:10,slots:{1:{max:3,used:1}},pact:{max:1,used:1,level:2}},b={name:'B',hp:{max:20,current:0}};
 const s=api.atlasDmStats(a);assert.equal(s.pp,10);assert.equal(s.ratio,.5);assert.equal(s.hdRemaining,2);assert.equal(s.slotRemaining,2);assert.equal(s.slotMax,4);
 assert.equal(api.atlasDmRows([a,b],'zero','name')[0].ch.name,'B');assert.equal(api.atlasDmRows([a,b],'injured','health')[0].ch.name,'B');assert.equal(a.hp.current,15);
});
test('DM quick HP mutation is pure, consumes temporary HP, caps healing and rejects invalid inputs',()=>{
 const src=extract('function atlasDmHpChange(hp,mode,amount){','function atlasDmHpOpen(');
 const change=vm.runInNewContext(src+';atlasDmHpChange',{tr:t});
 const hp={current:20,max:30,temp:5};
 assert.equal(change(hp,'damage',3).temp,2);assert.equal(change(hp,'damage',9).current,16);assert.equal(change(hp,'damage',50).current,0);assert.equal(change(hp,'heal',50).current,30);assert.equal(hp.current,20);assert.equal(hp.temp,5);
 assert.throws(()=>change(hp,'damage',-1));assert.throws(()=>change(hp,'heal',1.5));assert.throws(()=>change(hp,'unknown',1));
 const submit=extract('async function atlasDmSubmitHp(form){'," document.addEventListener('click',e=>{");
 assert.match(submit,/atlasDmTarget\(id\)/);assert.match(submit,/String\(cloud\.revisions\[id\]\)!==revision/);assert.match(submit,/ch.hp=next/);assert.doesNotMatch(submit,/cloudPush\(ch\)/);assert.doesNotMatch(submit,/selectedId\s*=/);
});

test('DM card controls do not stay disabled after transient revision polling',()=>{
 const src=extract('function atlasDmActions(ch){','function atlasDmCard(ch,s){');
 const cloud={polling:true,pendingWrites:0,syncBlocked:false,revisions:{a:1}};
 const render=vm.runInNewContext(src+';atlasDmActions',{cloud,atlasDmSaving:false,tr:t,attr:String});
 assert.doesNotMatch(render({id:'a'}),/\bdisabled\b/);
 cloud.syncBlocked=true;assert.match(render({id:'a'}),/\bdisabled\b/);
});

test('battle turn navigation preserves fixed order, round boundaries and explicit out status',()=>{
 const src=extract('function atlasBattleStep(state,direction){','function atlasBattleParticipant(ch){');
 const step=vm.runInNewContext(src+';atlasBattleStep',{});
 const b={phase:'active',round:1,activeId:'a',participants:[{id:'a',out:false},{id:'b',out:true},{id:'c',out:false}]};
 assert.equal(step(b,1).activeId,'c');assert.equal(step(b,-1).activeId,'a');assert.equal(step(b,1).round,1);
 const n=step(step(b,1),1);assert.equal(n.activeId,'a');assert.equal(n.round,2);assert.equal(step(n,-1).activeId,'c');assert.equal(step(n,-1).round,1);assert.equal(b.activeId,'a');assert.equal(step({...b,phase:'paused'},1).activeId,'a');
});
test('encounter API validates allowlisted state and rejects duplicate players or injected HP',()=>{
 const src=fs.readFileSync('workers/production/encounter-extension.js','utf8');
 const validate=vm.runInNewContext(src+';atlasEncounterValidate',{});
 const err=(code,msg)=>Object.assign(Error(msg),{code});
 const p={id:'a',type:'player',characterId:'borruk',name:'Borruk',initiative:15,out:false};
 const state={name:'Battle',phase:'active',round:1,activeId:'a',participants:[p]};
 assert.equal(validate(state,err),state);
 assert.throws(()=>validate({...state,participants:[p,{...p,id:'b'}]},err));
 assert.throws(()=>validate({...state,participants:[{...p,hp:10}]},err));
 assert.throws(()=>validate({...state,activeId:'missing'},err));
 assert.throws(()=>validate({...state,participants:[{...p,initiative:null}]},err));
 assert.match(src,/if\(!\['creator','dm'\]\.includes\(actor.role\)&&!publicView\)throw err\(403/);
 assert.match(src,/WHERE id=1 AND revision=\?/);
});

test('ending an encounter clears initiative and temporary participants without modifying sheets',()=>{
 const src=fs.readFileSync('workers/production/encounter-extension.js','utf8');
 const finish=vm.runInNewContext(src+';atlasEncounterFinish',{});
 const state={name:'Fight',phase:'active',round:5,activeId:'e',participants:[{id:'p',type:'player',characterId:'borruk',initiative:19,out:true},{id:'e',type:'enemy',initiative:8,hp:0},{id:'a',type:'ally',initiative:10,hp:5}]};
 const ended=finish(state);
 assert.equal(ended.phase,'ended');assert.equal(ended.round,1);assert.equal(ended.activeId,null);assert.equal(ended.participants.length,1);assert.equal(ended.participants[0].initiative,null);assert.equal(ended.participants[0].out,false);assert.equal(state.participants.length,3);assert.equal(state.participants[0].initiative,19);
 assert.match(src,/JSON.stringify\(\{encounter:null,history\}\)/);assert.match(app,/atlasBattleSave\(null,'DELETE'\)/);
});

test('manual Save compares acknowledged sheet snapshots and does not auto write',()=>{
 const src=extract('function atlasSheetSnapshot(ch){','function atlasSaveUi(){');
 const ch={id:'a',hp:{current:10},_ownerId:3};const cloud={enabled:true,ready:true,user:{id:3}},atlasSavedSheets=new Map(),atlasPendingOps=new Map();
 const api=vm.runInNewContext(src+';({atlasSheetSnapshot,atlasDirtySheets,atlasHasPending})',{cloud,characters:[ch],atlasSavedSheets,atlasPendingOps,atlasBattleDirty:false,canEditCharacter:()=>true,structuredClone});
 atlasSavedSheets.set('a',api.atlasSheetSnapshot(ch));assert.equal(api.atlasHasPending(),false);ch.hp.current=9;assert.equal(api.atlasDirtySheets().length,1);ch.hp.current=10;assert.equal(api.atlasHasPending(),false);
 const save=extract('function save(){','function saveView(){');assert.doesNotMatch(save,/cloudPush|cloudRequest/);
 assert.match(app,/if\(!atlasManualSaving\)return;\s*if\(!cloud.enabled/);
 const battle=extract("function atlasBattleSave(next,method='PUT'){",'function atlasBattleStep');assert.doesNotMatch(battle,/cloudRequest/);
});
test('combat log report uses effective amounts and does not invent an actor for quick HP adjustments',()=>{
 const src=extract('function atlasBattleStats(events){','function atlasBattleReport(h){');
 const stats=vm.runInNewContext(src+';atlasBattleStats',{});
 const rows=stats([{actor:'a',actorName:'A',target:'b',targetName:'B',kind:'attack',outcome:'critical',hpMode:'damage',amount:5},{actor:'',target:'a',targetName:'A',kind:'damage',amount:3},{actor:'a',actorName:'A',kind:'attack',outcome:'miss',amount:0}]);
 assert.equal(rows.find(r=>r.name==='A').damage,5);assert.equal(rows.find(r=>r.name==='A').taken,3);assert.equal(rows.find(r=>r.name==='A').crit,1);assert.equal(rows.find(r=>r.name==='A').misses,1);assert.equal(rows.find(r=>r.name==='B').taken,5);
});
