const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const app=fs.readFileSync('src/app.js','utf8');
const css=fs.readFileSync('src/style.css','utf8');
const slice=(first,last)=>{
 const a=app.indexOf(first),b=app.indexOf(last,a+first.length);
 assert.ok(a>=0&&b>a,'Missing source anchors: '+first);
 return app.slice(a,b);
};

test('Overview and Character skills preserve plain clickable proficiency dots',()=>{
 assert.match(app,/class="atlas-prof-dot atlas-prof-dot-toggle/);
 assert.match(app,/class="prof-dot atlas-prof-dot-toggle/);
 assert.match(app,/data-skill-toggle="\\\$\{attr\(name\)\}"/);
 assert.match(css,/button\.atlas-prof-dot-toggle,[\s\S]*?border:0;[\s\S]*?background:transparent;/);
 assert.match(css,/button\.atlas-prof-dot-toggle\.proficient/);
 assert.match(css,/button\.atlas-prof-dot-toggle\.expert/);
 assert.doesNotMatch(app,/atlasDmEditButton\('maxHp','✎/);
});

test('DM pencil control is only an icon, retains role gate and accessible label',()=>{
 const source=slice('const atlasDmEditButton=', 'async function atlasDmOverride(');
 const evaluate=role=>vm.runInNewContext(source+';\natlasDmEditButton',{
  atlasCanDmOverride:()=>role,
  tr:(_el,en)=>en,
  attr:String,
  svg:key=>'<svg data-icon="'+key+'"></svg>'
 });
 const button=evaluate(true)('maxHp');
 assert.match(button,/class="atlas-stat-edit"/);
 assert.match(button,/data-action="dm-edit-stat:maxHp"/);
 assert.match(button,/aria-label="Edit Max HP"/);
 assert.match(button,/data-icon="edit"/);
 assert.doesNotMatch(button,/class="btn sm"/);
 assert.equal(evaluate(false)('maxHp'),'');
 assert.match(evaluate(true)('speed',true),/atlas-stat-edit-inline/);
});

test('Max HP, Passive Perception and Speed open compact Atlas popups instead of generic forms',()=>{
 const source=slice('function atlasDmEditStat(statKey){','function atlasSkillPlan(ch){');
 let opened=null,focus=0,select=0,modalClass='';
 const editor=vm.runInNewContext(source+';\natlasDmEditStat',{
  atlasCanDmOverride:()=>true,
  c:()=>({hp:{max:31,current:22},passivePerceptionOverride:'',speed:30}),
  tr:(_el,en)=>en,
  toast:()=>{throw Error('Unexpected toast')},
  esc:String,
  attr:String,
  skillMod:()=>5,
  document:{
   querySelector:()=>({classList:{add:c=>modalClass=c}}),
   getElementById:()=>({focus:()=>focus++,select:()=>select++})
  },
  openModal:(title,body,footer)=>opened={title,body,footer}
 });
 editor('maxHp');
 assert.equal(opened.title,'Maximum HP');
 assert.match(opened.body,/name="value"/);
 assert.match(opened.body,/min="1" max="99999"/);
 assert.match(opened.body,/Current value/);
 assert.match(opened.body,/31 HP/);
 assert.match(opened.footer,/data-form-action="save-dm-stat:maxHp"/);
 assert.match(opened.footer,/Cancel/);
 assert.equal(modalClass,'atlas-stat-modal');
 editor('passivePerception');
 assert.match(opened.body,/15/);
 assert.match(opened.body,/Leave blank for automatic calculation/);
 assert.doesNotMatch(opened.body,/autocomplete="off" required/);
 editor('speed');
 assert.match(opened.body,/min="0" max="300"/);
 assert.match(opened.body,/30 ft/);
 assert.equal(focus,3);
 assert.equal(select,3);
 assert.doesNotMatch(source,/formModal\(/);
});

test('Sheet layout and server-side privilege checks remain intact',()=>{
 assert.match(app,/atlasDmOverride\(\{field:id,value\}\)/);
 assert.match(app,/atlasDmOverride\(\{skill:name,rank:\(rank\+1\)%3\}\)/);
 assert.match(app,/function atlasOverviewSkills\(ch\)/);
 assert.match(app,/function atlasCoreStats\(ch\)/);
 assert.match(app,/function hpCard\(ch\)/);
 assert.match(app,/function statCards\(ch\)/);
 assert.match(css,/\.atlas-stat-edit\{[\s\S]*?background:transparent/);
 assert.match(css,/\.modal\.atlas-stat-modal\{width:min\(100%,420px\)\}/);
});
