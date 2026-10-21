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
 function set(form,key,value){try{form.getTextField(key).setText(latin(value))}catch(e){console.warn('PDF field skipped:',key,e.message)}}
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
   'text_8bjml':ch.hp?.current||0,'text_9efgi':ch.hp?.temp||0,
   'text_10mexx':ch.hp?.max||1,'text_11dcsb':ch.hitDice?.max||level(ch),
   'text_12kvai':ch.hitDice?.used||0,'text_13wrft':bonus(calc.initiative),
   'text_14lvnq':ch.speed||30,'text_15cqja':ch.size||'Medium',
   'text_16wgea':ch.passivePerceptionOverride!==''&&ch.passivePerceptionOverride!=null?ch.passivePerceptionOverride:10+calc.skillMod(ch,'Perception'),
   'text_17vpmg':bonus(ability('STR')),'text_18ruyf':bonus(ability('DEX')),
   'text_19lqwv':bonus(ability('INT')),'text_20zbar':bonus(ability('WIS')),
   'text_21kabi':bonus(ability('CON')),'text_22bxjy':bonus(ability('CHA')),
   'text_23ewgq':ch.abilities?.STR||10,'text_24rqar':ch.abilities?.INT||10,
   'text_25blbj':ch.abilities?.WIS||10,'text_26ccgh':ch.abilities?.DEX||10,
   'text_27jhio':ch.abilities?.CHA||10,'text_28owjh':ch.abilities?.CON||10,
   'text_427aebp':bonus(calc.proficiency),
   'textarea_93szqe':(ch.features||[]).map(x=>x.name).join('\n'),
   'textarea_91jawi':`${ch.species||''}\n${ch.speciesTraits||''}`,
   'textarea_92aaks':(ch.feats||[]).join('\n'),
   'textarea_89gsxf':ch.proficiencies||'',
   'textarea_90mfnr':ch.languages||'',
   'text_270axdp':ch.spellAbility||'',
   'text_271dmmw':calc.spellDC??'',
   'text_272rsuk':bonus(calc.spellAttack||0),
   'textarea_273pluw':ch.appearance||'',
   'textarea_274seuz':ch.backgroundStory||'',
   'textarea_259fnwq':(ch.inventory||[]).map(i=>`${i.qty||1} x ${i.name}`).join('\n')
  };
  for(const [name,value]of Object.entries(pairs))set(form,name,value);
  // Weapon table (name / hit modifier / damage) in the original layout.
  const rows=(ch.attacks||[]).slice(0,6);
  rows.forEach((a,i)=>{const names=['text_95mtme','text_96nzoa','text_97iydj','text_98wnad','text_99bdzl','text_100zmbl'];
   const atk=['text_101ohoi','text_102yibj','text_103rlae','text_104qwkw','text_105gvuz','text_106vkdo'];
   const damage=['text_113tpwa','text_114lhuk','text_115pcxn','text_116sohv','text_117fabc','text_118cokl'];
   set(form,names[i],a.name);set(form,atk[i],bonus((a.ability==='DEX'?ability('DEX'):ability('STR'))+calc.proficiency+(Number(a.magicBonus)||0)));set(form,damage[i],(a.damage||'')+' '+(a.type||''));
  });
  // User's spell names fill the first available spell rows; other columns stay editable.
  (ch.spellbook||[]).slice(0,30).forEach((x,i)=>{const labelField=['text_306noh','text_307kiz','text_308oany','text_309vlmr','text_310iatm','text_311eska','text_312trhs','text_313jros','text_314gyue','text_315plkl','text_316ndrn','text_317gkbw','text_318ogf','text_319huqd','text_320kzak','text_321ucnv','text_322wcdj','text_323kmpj','text_324jzvi','text_325xpvz','text_326ydhp','text_327kpws','text_328uom','text_329yurm','text_330jyte','text_331jfme','text_332xoqp','text_333ekrb','text_334zias','text_335znlw'][i];if(labelField)set(form,labelField,x.name);});
  // Keep fields editable (do not flatten); render appearances.
  try{form.updateFieldAppearances()}catch(e){console.warn('Some PDF appearances require a reader refresh',e)}
  const data=await pdf.save({useObjectStreams:true});const blob=new Blob([data],{type:'application/pdf'});
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=(ch.name||'character').replace(/[^\w -]/g,'_')+'-DND-2024.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),10000);
  if(/[α-ωΑ-Ω]/.test(JSON.stringify(ch)))alert('The official PDF uses a Latin font. Greek text was transliterated for compatibility; review the result before sharing.');
 };
})();
