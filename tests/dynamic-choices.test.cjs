const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('src/app.js','utf8'),ctx={window:{},tr:(el,en)=>en,document:{addEventListener(){}},attr:String,esc:String};
vm.runInNewContext(fs.readFileSync('src/data.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync('src/rules-2024.js','utf8'),ctx);
ctx.D=ctx.window.ATLAS_DATA;ctx.R=ctx.window.ATLAS_RULES_2024;
Object.assign(ctx,{findReference:id=>ctx.D.spells.find(s=>s.id===id),uid:(()=>{let i=0;return()=>String(++i)})(),totalLevel:ch=>ch.classes.reduce((n,x)=>n+x.level,0),languageList:s=>String(s||'').split(/[,;\n]/).map(x=>x.trim()).filter(Boolean),CHARACTER_LANGUAGES:['Common','Elvish','Dwarvish','Giant','Gnomish','Draconic','Sylvan'],masteryCapacity:ch=>ch.classes.some(x=>x.name==='Ranger')?2:0,selectedMasteries:ch=>ch.weaponMasteries||[],atlasPrimalLevel:ch=>ch.classes.some(x=>x.name==='Ranger'&&x.subclass==='Beast Master')?ch.classes[0].level:0,atlasPrimalStats:ch=>ch.primalCompanion?.form?{}:null,isBattleMaster:()=>false,studentSelection:()=>({}),atlasCanDmOverride:()=>false});
const skill=app.slice(app.indexOf('const ATLAS_SKILL_RULES_2024='),app.indexOf('function atlasEditSkills()'));
const block=app.slice(app.indexOf(' // v3.18.0: typed'),app.indexOf(' function pendingChoiceAlert(ch)'));
const api=vm.runInNewContext(skill+block+';({atlasPendingEntries,atlasPendingApply,atlasPendingKind,atlasPendingFields,atlasPendingResolved,atlasPendingRangerPlan,atlasPendingDruidPlan,atlasPendingArrayScores})',ctx);
const fd=values=>({get:k=>Array.isArray(values[k])?values[k][0]:values[k]??null,getAll:k=>Array.isArray(values[k])?values[k]:values[k]==null?[]:[values[k]]});
const make=()=>({id:'test',species:'Wood Elf',background:'Hermit',classes:[{name:'Ranger',level:3,subclass:'Beast Master'}],skills:{Stealth:1,Survival:1,Perception:1},abilities:{STR:10,DEX:15,CON:13,INT:8,WIS:14,CHA:12},hp:{max:25,current:20,temp:0},languages:'Common, Elvish',weaponMasteries:[],spellbook:[],resources:[],slots:{1:{max:3,used:1}},fightingStyle:'Druidic Warrior',pendingChoices2024:[
{key:'skills',label:'Choose and verify Ranger class skills + Hermit background skills + Keen Senses skill',status:'resolved',value:'old text'},
{key:'deft-explorer',label:'Choose Deft Explorer expertise from an eligible proficient skill',status:'pending'},
{key:'masteries',label:'Choose TWO Ranger Weapon Masteries',status:'pending'},
{key:'cantrips',label:'Choose two Druid cantrips, excluding Guidance and Starry Wisp',status:'pending'},
{key:'companion',label:'Choose Primal Companion form Land, Sea or Sky',status:'pending'},
{key:'spells',label:'Verify Ranger prepared spells and subclass spells',status:'pending'},
{key:'scores',label:'REQUIRED: Rebuild Aelyn scores from Standard Array and Hermit 2024 bonuses',status:'pending'}]});
const status=(ch,k)=>api.atlasPendingEntries(ch).find(p=>p.kind===k)?.status;
test('legacy text resolution does not count as an actual choice; all seven requirements have typed routes',()=>{
 const ch=make(),rows=api.atlasPendingEntries(ch);
 assert.equal(rows.length,7);assert.equal(status(ch,'skills'),'pending');
 assert.deepEqual(Array.from(rows,x=>x.kind),['skills','deft','mastery','druidic','primal','ranger-spells','array']);
 for(const p of rows.filter(p=>p.kind!=='primal')){const html=api.atlasPendingFields(ch,p);assert.match(html,/<(?:select|input)\b/);assert.doesNotMatch(html,/<textarea\b/);}
 assert.match(app,/p\.kind==='primal'&&atlasPendingSupported\(ch,p\.kind\)\)return atlasPrimalForm\(ch,'summon'\)/);
});
test('skill sources are distinct and apply real ranks; expertise reopens after rank changes',()=>{
 const ch=make();
 assert.throws(()=>api.atlasPendingApply(ch,'skills',fd({'skill:class:0':'Perception','skill:class:1':'Stealth','skill:class:2':'Survival','skill:species:0':'Perception',confirm:'on'})));
 api.atlasPendingApply(ch,'skills',fd({'skill:class:0':'Animal Handling','skill:class:1':'Stealth','skill:class:2':'Survival','skill:species:0':'Perception',confirm:'on'}));
 assert.equal(ch.skills.Medicine,1);assert.equal(ch.skills.Religion,1);assert.equal(Object.keys(ch.skills).length,6);assert.equal(status(ch,'skills'),'resolved');
 api.atlasPendingApply(ch,'deft',fd({expertise:['Perception'],language0:'Giant',language1:'Gnomish',confirm:'on'}));
 assert.equal(ch.skills.Perception,2);assert.match(ch.languages,/Giant/);assert.equal(status(ch,'deft'),'resolved');ch.skills.Perception=1;assert.equal(status(ch,'deft'),'pending');
});
test('masteries select weapon kinds, exactly two; clearing one reopens',()=>{
 const ch=make();assert.throws(()=>api.atlasPendingApply(ch,'mastery',fd({mastery:['Slow','Nick']})));
 api.atlasPendingApply(ch,'mastery',fd({mastery:['Longbow','Scimitar']}));assert.equal(status(ch,'mastery'),'resolved');ch.weaponMasteries.pop();assert.equal(status(ch,'mastery'),'pending');
});
test('all indexed Ranger and Druidic Warrior options have metadata; automatic spells do not count toward prepared limit',()=>{
 const ch=make(),p=api.atlasPendingRangerPlan(ch);assert.equal(p.limit,4);assert.equal(p.options.length,12);
 assert.ok(!p.options.some(d=>['Hunter’s Mark','Longstrider'].includes(d.name)));
 const cantrips=api.atlasPendingDruidPlan(ch);assert.equal(cantrips.options.length,12);assert.ok(cantrips.options.some(d=>d.name==='Guidance'));assert.ok(!cantrips.options.some(d=>d.name==='Druidcraft'));
 const ids=p.options.filter(d=>['Cure Wounds','Goodberry','Entangle','Alarm'].includes(d.name)).map(d=>d.id);assert.equal(ids.length,4);
 api.atlasPendingApply(ch,'ranger-spells',fd({spells:ids,confirm:'on'}));
 assert.equal(status(ch,'ranger-spells'),'resolved');assert.equal(ch.spellbook.filter(s=>s.spellSource==='Ranger'&&s.prepared).length,4);
 const hm=ch.spellbook.find(s=>s.spellSource==='Favored Enemy');assert.ok(hm.alwaysPrepared);assert.equal(ch.resources.find(r=>r.id===hm.freeResourceId).max,2);assert.equal(ch.slots[1].used,1);
 const old=ch.spellbook.find(s=>s.spellSource==='Ranger');old.prepared=false;assert.equal(status(ch,'ranger-spells'),'pending');
 const can=cantrips.options.filter(d=>['Thorn Whip','Shillelagh'].includes(d.name)).map(d=>d.id);assert.equal(can.length,2);api.atlasPendingApply(ch,'druidic',fd({spells:can,confirm:'on'}));assert.equal(status(ch,'druidic'),'resolved');
});
test('standard array and background restrictions are validated and HP deficit stays intact',()=>{
 const ch=make(),base={STR:10,DEX:15,CON:13,INT:8,WIS:14,CHA:12};assert.equal(api.atlasPendingArrayScores(base,{DEX:2,WIS:1},'Hermit'),null);
 assert.equal(api.atlasPendingArrayScores({...base,STR:15},{CON:1,WIS:2},'Hermit'),null);
 const values=Object.fromEntries(Object.entries(base).map(([k,v])=>['base:'+k,v]));api.atlasPendingApply(ch,'array',fd({...values,'boost:CON':'1','boost:WIS':'2','boost:CHA':'0',confirm:'on'}));assert.equal(ch.abilities.CON,14);assert.equal(ch.abilities.WIS,16);assert.equal(ch.hp.max,28);assert.equal(ch.hp.current,23);assert.equal(status(ch,'array'),'resolved');ch.abilities.WIS=15;assert.equal(status(ch,'array'),'pending');
});
test('unknown pending records are never auto-confirmed by legacy free text; manual Save is preserved',()=>{
 const ch=make();ch.pendingChoices2024.push({key:'custom-missing',label:'Unimplemented custom choice',status:'resolved',value:'note'});assert.equal(status(ch,'unsupported'),'pending');
 assert.doesNotMatch(block,/cloudRequest|cloudPush|fetch\(/);assert.match(app,/Object\.assign\(ch,draft\);update\(\);showPendingChoices\(\)/);
 assert.doesNotMatch(app,/name="pendingValue"/);
});