// Export into the official 2024 fillable PDF uploaded by the campaign owner.
// Online dependency: pdf-lib 1.17.1. File remains editable after download.
(() => {
 let loader;
 function ensureLib(){
  if(window.PDFLib)return Promise.resolve(window.PDFLib);
  if(!loader)loader=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
   script.onload=()=>window.PDFLib?resolve(window.PDFLib):reject(Error('PDF library unavailable'));
   script.onerror=()=>reject(Error('Cannot load PDF library. Connect to the Internet.'));
   document.head.appendChild(script);
  });return loader;
 }
 const greek={'Α':'A','Β':'V','Γ':'G','Δ':'D','Ε':'E','Ζ':'Z','Η':'I','Θ':'Th','Ι':'I','Κ':'K','Λ':'L','Μ':'M','Ν':'N','Ξ':'X','Ο':'O','Π':'P','Ρ':'R','Σ':'S','Τ':'T','Υ':'Y','Φ':'F','Χ':'Ch','Ψ':'Ps','Ω':'O','α':'a','β':'v','γ':'g','δ':'d','ε':'e','ζ':'z','η':'i','θ':'th','ι':'i','κ':'k','λ':'l','μ':'m','ν':'n','ξ':'x','ο':'o','π':'p','ρ':'r','σ':'s','ς':'s','τ':'t','υ':'y','φ':'f','χ':'ch','ψ':'ps','ω':'o'};
 const latin=s=>Array.from(String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,''),ch=>greek[ch]||ch).join('').replace(/[^\x20-\x7E\n\r\t]/g,'').slice(0,4000);
 const mod=n=>Math.floor((Number(n)||10)/2)-5;
 const bonus=n=>n>=0?'+'+n:String(n);
 const level=ch=>(ch.classes||[]).reduce((a,x)=>a+(Number(x.level)||0),0);
 function set(form,key,value,opts={}){try{
   const field=form.getTextField(key);field.setText(latin(value ?? ''));
   if(opts.multiline){try{field.enableMultiline()}catch(e){}}
   if(opts.size)field.setFontSize(opts.size);
  }catch(e){console.warn('PDF field skipped:',key,e.message)}}
 const featureName=v=>typeof v==='string'?v:String(v?.name||v?.id||'');
 const cleanFeat=v=>featureName(v).replace(/^feat[-_]/i,'').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[-_]/g,' ').replace(/\b[a-z]/g,m=>m.toUpperCase());
 const featureGroup=v=>String(v?.source||v?.category||v?.type||'').toLowerCase();
 const SPECIES_TRAITS=new Set(['resourceful','skillful','versatile']);
 function featureText(ch,species){
  const rows=(ch.features||[]).filter(x=>{
    const name=featureName(x).toLowerCase();
    const group=featureGroup(x);
    return species ? SPECIES_TRAITS.has(name)||group.includes('species')||group.includes('human')
      : !SPECIES_TRAITS.has(name)&&!group.includes('species')&&!group.includes('human');
  });
  return [...new Set(rows.map(featureName).filter(Boolean))].join('\n');
 }
 function splitProficiencies(ch){
  const pr=ch.proficiencies||{};
  if(typeof pr==='string'){
   const items=pr.split(/(?=\b(?:Armor|Weapons|Tools):)/i);
   const armor=items.filter(x=>/^\s*(?:Armor|Weapons):/i.test(x)).join(' ').trim();
   const tools=items.filter(x=>/^\s*Tools:/i.test(x)).join(' ').trim();
   return {training:armor,tools};
  }
  const arr=x=>Array.isArray(x)?x.join(', '):String(x||'');
  return {training:[arr(pr.armor)&&'Armor: '+arr(pr.armor),arr(pr.weapons)&&'Weapons: '+arr(pr.weapons)].filter(Boolean).join('\n'),tools:arr(pr.tools)};
 }
 function languagesText(ch){
  const data=ch.languages;
  if(Array.isArray(data))return data.map(x=>typeof x==='string'?x:(x?.name||'')).filter(Boolean).join(', ');
  return typeof data==='string'?data:'';
 }
 function speciesText(ch){
  const feats=featureText(ch,true);
  const extras=Array.isArray(ch.speciesTraits)?ch.speciesTraits.map(featureName).join('\n'):(ch.speciesTraits||'');
  return [...new Set([feats,extras].filter(Boolean).join('\n').split('\n').filter(Boolean))].join('\n');
 }
 function checked(form,key,yes){try{const field=form.getCheckBox(key);if(yes)field.check();else field.uncheck()}catch(e){console.warn('PDF checkbox skipped:',key,e.message)}}
 // These names were verified against the field positions of the uploaded 2024 fillable template.
 const SAVE_ROWS={
  STR:['text_60zpuk','checkbox_125msvq'],DEX:['text_68bipd','checkbox_127neck'],
  CON:['text_72gnbq','checkbox_131jtbq'],INT:['text_54bfgy','checkbox_119phvx'],
  WIS:['text_62yaan','checkbox_245mnu'],CHA:['text_73cwxt','checkbox_251dtie']
 };
 const SKILL_ROWS={
  Arcana:['text_55nptn','checkbox_120drb'],History:['text_56ksru','checkbox_121xgrv'],
  Investigation:['text_57bjob','checkbox_122zffm'],Nature:['text_58zoel','checkbox_123smy'],
  Religion:['text_59mfqs','checkbox_124zscb'],Athletics:['text_61knsn','checkbox_126dqaq'],
  'Animal Handling':['text_63uhiv','checkbox_246hqns'],Insight:['text_64odvk','checkbox_247lffe'],
  Medicine:['text_65hnhb','checkbox_248scbg'],Perception:['text_66djlf','checkbox_249voxf'],
  Survival:['text_67cr','checkbox_250mjvi'],Acrobatics:['text_69srmm','checkbox_128cefr'],
  'Sleight of Hand':['text_70obrk','checkbox_129tlov'],Stealth:['text_71pflk','checkbox_130ukqx'],
  Deception:['text_74rkfi','checkbox_252naxc'],Intimidation:['text_75pauh','checkbox_253mbyq'],
  Performance:['text_76vfsc','checkbox_254ypds'],Persuasion:['text_77nads','checkbox_255ltdr']
 };
 window.ATLAS_EXPORT_PDF=async function(ch,calc){
  const PDFLib=await ensureLib();
  const response=await fetch('./official-2024-character-sheet.pdf',{cache:'no-store'});
  if(!response.ok)throw Error('Official PDF template not found');
  const pdf=await PDFLib.PDFDocument.load(await response.arrayBuffer());const form=pdf.getForm();
  const ability=k=>calc.abilityMod?calc.abilityMod(ch,k):mod(ch.abilities?.[k]);
  const first=ch.classes?.[0]||{};
  const pairs={
   'text_1imkp':ch.name,'text_2qgox':ch.background,'text_3bfkv':ch.species,
   'text_4deth':level(ch),'text_5mocb':ch.xp||0,'text_6agjh':calc.armorClass,
   'text_8bjml':ch.hp?.current??0,'text_9efgi':ch.hp?.temp??0,
   'text_10mexx':ch.hp?.max??1,'text_11dcsb':ch.hitDice?.max??level(ch),
   'text_12kvai':ch.hitDice?.used??0,'text_13wrft':bonus(calc.initiative),
   'text_14lvnq':ch.speed||30,'text_15cqja':ch.size||'Medium',
   'text_16wgea':ch.passivePerceptionOverride!==''&&ch.passivePerceptionOverride!=null?ch.passivePerceptionOverride:10+calc.skillMod(ch,'Perception'),
   'text_17vpmg':bonus(ability('STR')),'text_18ruyf':bonus(ability('DEX')),
   'text_19lqwv':bonus(ability('INT')),'text_20zbar':bonus(ability('WIS')),
   'text_21kabi':bonus(ability('CON')),'text_22bxjy':bonus(ability('CHA')),
   'text_23ewgq':ch.abilities?.STR||10,'text_24rqar':ch.abilities?.INT||10,
   'text_25blbj':ch.abilities?.WIS||10,'text_26ccgh':ch.abilities?.DEX||10,
   'text_27jhio':ch.abilities?.CHA||10,'text_28owjh':ch.abilities?.CON||10,
   'text_427aebp':bonus(calc.proficiency),
   'textarea_93szqe':featureText(ch,false),
   'textarea_91jawi':speciesText(ch),
   'textarea_92aaks':(ch.feats||[]).map(cleanFeat).filter(Boolean).join('\n'),
   'textarea_89gsxf':splitProficiencies(ch).training,
   'textarea_90mfnr':splitProficiencies(ch).tools,
   'textarea_273pluw':ch.appearance||'',
   'textarea_274seuz':ch.backgroundStory||'',
   'textarea_259fnwq':languagesText(ch),
   'textarea_260nudr':(ch.inventory||[]).map(i=>`${i.qty||1} x ${i.name}`).join('\n')
  };
  // PDF form defaults produce oversized text and overflow in the feature panels.
  // Set font size for the actual form field so it remains editable after export.
  const panelFonts={
   textarea_89gsxf:8,textarea_90mfnr:8,textarea_91jawi:10,
   textarea_92aaks:10,textarea_93szqe:9,textarea_94ci:9,
   textarea_259fnwq:9,textarea_260nudr:8,
   textarea_273pluw:9,textarea_274seuz:9
  };
  for(const [name,value]of Object.entries(pairs))set(form,name,value,
   name in panelFonts?{size:panelFonts[name],multiline:true}:{});
  // Identity fields stay in their own boxes with readable, bounded type.
  ['text_1imkp','text_2qgox','text_3bfkv'].forEach(k=>{
   try{form.getTextField(k).setFontSize(10)}catch(e){}
  });
  // A Fighter without learned spells has no spellcasting statistics.
  const hasSpells=Array.isArray(ch.spellbook)&&ch.spellbook.length>0;
  if(hasSpells){
   set(form,'text_270axdp',ch.spellAbility||'');
   set(form,'text_271dmmw',calc.spellDC??'');
   set(form,'text_272rsuk',calc.spellAttack==null?'':bonus(calc.spellAttack));
  }
  // Class/subclass labels are printed on the official PDF but have no separate form widgets.
  // Draw them at their actual label positions; all genuine form fields stay editable.
  try{
   const page=pdf.getPage(0),font=await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
   const draw=(value,x,y,max=100)=>{const s=latin(value||'');if(s)page.drawText(s.slice(0,40),{x,y,size:9,font,maxWidth:max});};
   draw((ch.classes||[]).map(c=>c.name||c.class||c.id).filter(Boolean).join(' / '),145,741,100);
   draw(first.subclass||ch.subclass||'',145,719,100);
  }catch(e){console.warn('Class labels cannot be rendered',e)}
  for(const [stat,[field,check]] of Object.entries(SAVE_ROWS)){
   set(form,field,bonus(calc.saveMod?calc.saveMod(ch,stat):ability(stat)+(ch.saves||[]).includes(stat)*calc.proficiency));
   checked(form,check,(ch.saves||[]).includes(stat));
  }
  for(const [skill,[field,check]] of Object.entries(SKILL_ROWS)){
   const rank=Number(ch.skills?.[skill]||0);
   // Expertise doubles PB in the numeric box; the sheet only has a proficiency checkbox.
   set(form,field,bonus(calc.skillMod?calc.skillMod(ch,skill):0));
   checked(form,check,rank>0);
  }
  // Heroic Inspiration: a marked checkbox is more accurate than an empty sheet.
  checked(form,'checkbox_132oesm',Boolean(ch.inspiration));
  // Death Save success/failure boxes (top right), all 3 each.
  for(let i=0;i<3;i++){
   checked(form,['checkbox_83uays','checkbox_84cpmm','checkbox_85xlev'][i],i<(Number(ch.death?.success)||0));
   checked(form,['checkbox_86iksy','checkbox_87keam','checkbox_88iabv'][i],i<(Number(ch.death?.fail)||0));
  }
  // Keep the second independent Notes column for the weapon's own notes / mastery.
  const notes=['text_107qvwl','text_108aybq','text_109slbn','text_110lbdh','text_111ubex','text_112omg'];
  // Weapon table (name / hit modifier / damage) in the original layout.
  const rows=(ch.attacks||[]).slice(0,6);
  rows.forEach((a,i)=>{const names=['text_95mtme','text_96nzoa','text_97iydj','text_98wnad','text_99bdzl','text_100zmbl'];
   const atk=['text_101ohoi','text_102yibj','text_103rlae','text_104qwkw','text_105gvuz','text_106vkdo'];
   const damage=['text_113tpwa','text_114lhuk','text_115pcxn','text_116sohv','text_117fabc','text_118cokl'];
   set(form,names[i],a.name);set(form,atk[i],bonus(calc.attackBonus?calc.attackBonus(ch,a):(a.ability==='DEX'?ability('DEX'):ability('STR'))+(a.proficient===false?0:calc.proficiency)+(Number(a.magicBonus)||0)));set(form,notes[i],[a.mastery,a.notes].filter(Boolean).join(' · '));set(form,damage[i],(calc.attackDamage?calc.attackDamage(ch,a):(a.damage||''))+' '+(a.type||''));
  });
  // User's spell names fill the first available spell rows; other columns stay editable.
  (hasSpells?ch.spellbook:[]).slice(0,30).forEach((x,i)=>{const labelField=['text_306noh','text_307kiz','text_308oany','text_309vlmr','text_310iatm','text_311eska','text_312trhs','text_313jros','text_314gyue','text_315plkl','text_316ndrn','text_317gkbw','text_318ogf','text_319huqd','text_320kzak','text_321ucnv','text_322wcdj','text_323kmpj','text_324jzvi','text_325xpvz','text_326ydhp','text_327kpws','text_328uom','text_329yurm','text_330jyte','text_331jfme','text_332xoqp','text_333ekrb','text_334zias','text_335znlw'][i];if(labelField)set(form,labelField,x.name);});
  // Keep fields editable (do not flatten); render appearances.
  try{form.updateFieldAppearances()}catch(e){console.warn('Some PDF appearances require a reader refresh',e)}
  const data=await pdf.save({useObjectStreams:true});const blob=new Blob([data],{type:'application/pdf'});
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=(ch.name||'character').replace(/[^\w -]/g,'_')+'-DND-2024.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),10000);
  if(/[α-ωΑ-Ω]/.test(JSON.stringify(ch)))alert('The official PDF uses a Latin font. Greek text was transliterated for compatibility; review the result before sharing.');
 };
})();
