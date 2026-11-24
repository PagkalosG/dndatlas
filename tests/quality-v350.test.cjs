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
 assert.match(app,/APP_VERSION='3\.7\.0'/);
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


test('mobile navigation is fixed, with compact accessible header and safe-area spacing',()=>{
 const index=fs.readFileSync('public/index.html','utf8');
 const sw=fs.readFileSync('public/sw.js','utf8');
 const version=JSON.parse(fs.readFileSync('public/version.json','utf8'));
 assert.equal(version.version,'3.7.0');
 for(const asset of ['style.css','app.js']){
  assert.ok(index.includes(asset+'?v=3.7.0'));
  assert.ok(sw.includes(asset+'?v=3.7.0'));
 }
 assert.match(sw,/dndatlas-shell-v3\.7\.0/);
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
 const check=vm.runInNewContext(src+';atlasValidationIssues',{tr:t,D:{abilities:{STR:'Strength'},skills:[['Athletics','STR']]},twoHandedShieldConflict:()=>true});
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
