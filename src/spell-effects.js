/* Character Atlas spell effect quick-reference · D&D 2024, SRD-style summaries.
   Descriptions here are original short-form references, not a replacement for official rules.
   Spell slot / class scaling is computed at display time and never consumes a slot. */
window.ATLAS_SPELL_EFFECTS = (() => {
 'use strict';
 const effects = {};
 const put=(names,kind,formula,type='',opts={})=>{
  for(const name of names.split('|')) effects[name] = {kind,formula,type,...opts};
 };
 // cantrips: the number of damage dice scales with TOTAL character level, not caster class level.
 put('Fire Bolt','damage','1d10','Fire',{cantrip:true,hit:'attack'});
 put('Eldritch Blast','damage','1d10','Force',{cantrip:true,beams:true,hit:'attack',noteEl:'1d10 ανά βολή. Κάθε βολή απαιτεί ξεχωριστό attack roll.',noteEn:'1d10 per beam. Each beam needs its own attack roll.'});
 put('Sacred Flame','damage','1d8','Radiant',{cantrip:true,hit:'DEX save',saveHalf:false});
 put('Ray of Frost','damage','1d8','Cold',{cantrip:true,hit:'attack',noteEl:'Επιπλέον επιβραδύνει την ταχύτητα του στόχου.',noteEn:'Also slows the target.'});
 put('Shocking Grasp','damage','1d8','Lightning',{cantrip:true,hit:'attack',noteEl:'Ο στόχος δεν μπορεί να κάνει Opportunity Attacks για λίγο.',noteEn:'Target briefly cannot make Opportunity Attacks.'});
 put('True Strike','damage','Weapon + 0d6','Radiant',{special:'trueStrike',hit:'weapon attack',noteEl:'Η βασική ζημιά προέρχεται από το όπλο (με το spellcasting ability). Από level 5 προστίθεται radiant damage.',noteEn:'Base damage comes from the weapon (using spellcasting ability). Extra radiant dice start at character level 5.'});
 // Level 1 spells.
 put('Magic Missile','damage','3 × (1d4+1)','Force',{special:'missiles',inc:1,hit:'auto',noteEl:'3 darts στο βασικό slot, +1 dart ανά υψηλότερο slot. Το damage είναι ανά dart.',noteEn:'3 darts at base slot, +1 dart per higher slot. Formula is per dart.'});
 put('Thunderwave','damage','2d8','Thunder',{inc:'1d8',hit:'CON save',saveHalf:true,noteEl:'Area effect, πιθανό push σε αποτυχημένο save.',noteEn:'Area effect; may push targets on a failed save.'});
 put('Burning Hands','damage','3d6','Fire',{inc:'1d6',hit:'DEX save',saveHalf:true});
 put('Divine Favor','damage','1d4','Radiant',{hit:'weapon hit',noteEl:'Επιπλέον 1d4 ανά επιτυχημένο weapon hit όσο διαρκεί.',noteEn:'Extra 1d4 per successful weapon hit during the duration.'});
 put('Hunter’s Mark','damage','1d6','Force',{hit:'weapon hit',noteEl:'Επιπλέον damage ανά weapon hit εναντίον του marked στόχου.',noteEn:'Extra damage per weapon hit against the marked target.'});
 put('Inflict Wounds','damage','2d10','Necrotic',{inc:'1d10',hit:'CON save',saveHalf:true,noteEl:'Στους κανόνες 2024 χρησιμοποιεί CON save, όχι spell attack.',noteEn:'Uses a CON save in 2024, not a spell attack.'});
 put('Cure Wounds','healing','2d8+@','',{inc:'2d8',noteEl:'Θεραπεία με επαφή. Το @ είναι το spellcasting modifier σου.',noteEn:'Touch healing. @ is your spellcasting modifier.'});
 put('Healing Word','healing','2d4+@','',{inc:'2d4',noteEl:'Θεραπεία ως Bonus Action από απόσταση.',noteEn:'Ranged healing using a Bonus Action.'});
 // Level 2 spells.
 put('Spiritual Weapon','damage','1d8+@','Force',{inc:'1d8',hit:'spell attack',noteEl:'2024: απαιτεί Concentration. Μπορεί να ξαναεπιτίθεται με Bonus Action.',noteEn:'2024: requires Concentration. Can attack again with a Bonus Action.'});
 put('Enlarge/Reduce','damage','1d4','Weapon type',{hit:'enlarged weapon hit',noteEl:'Μόνο στο Enlarge: +1d4 bonus damage στα weapon attacks, όχι ανεξάρτητο attack.',noteEn:'Enlarge only: +1d4 extra weapon damage on a hit, not a separate attack.'});
 put('Scorching Ray','damage','3 × 2d6','Fire',{special:'rays',hit:'spell attack',noteEl:'2d6 ανά ray. Κάθε ray απαιτεί ξεχωριστό spell attack.',noteEn:'2d6 per ray. Each ray has its own spell attack.'});
 put('Shatter','damage','3d8','Thunder',{inc:'1d8',hit:'CON save',saveHalf:true});
 put('Moonbeam','damage','2d10','Radiant',{inc:'1d10',hit:'CON save',saveHalf:true,noteEl:'Μπορεί να βλάψει ξανά σε επόμενα turns· δεν προκαλεί όλο το damage κάθε στιγμή.',noteEn:'May deal damage on later turns under its trigger rules; not continuously.'});
 put('Aid','hp','+5 max/current HP','',{special:'aid',incFlat:5,noteEl:'Αυξάνει τόσο τα μέγιστα όσο και τα τρέχοντα HP έως 3 στόχων· δεν είναι temporary HP.',noteEn:'Raises both maximum and current HP of up to 3 targets; not temporary HP.'});
 // Level 3 spells.
 put('Fireball|Lightning Bolt','damage','8d6', 'Fire',{inc:'1d6',hit:'DEX save',saveHalf:true});
 effects['Lightning Bolt'].type='Lightning';
 put('Spirit Guardians','damage','3d8','Radiant / Necrotic',{inc:'1d8',hit:'WIS save',saveHalf:true,noteEl:'Damage ανά επηρεαζόμενο στόχο όταν ενεργοποιούνται τα σχετικά triggers, έως μία φορά ανά turn ανά στόχο.',noteEn:'Damage per affected target when the relevant triggers occur, at most once per turn per creature.'});
 put('Conjure Animals','damage','3d10','Slashing',{inc:'1d10',hit:'DEX save',saveHalf:false,noteEl:'2024: η αγέλη προκαλεί ζημιά σε failed save όταν ενεργοποιείται το effect, μία φορά ανά turn ανά στόχο.',noteEn:'2024: the pack deals damage on a failed save when triggered, once per turn per creature.'});
 // Level 4+ spells.
 put('Wall of Fire','damage','5d8','Fire',{inc:'1d8',hit:'DEX save initially',saveHalf:true,noteEl:'Η αρχική επαφή επιτρέπει μισό damage σε επιτυχημένο save. Είσοδος/παραμονή στη θερμή πλευρά προκαλεί damage όπως ορίζει το spell.',noteEn:'Initial wall impact allows half damage on success. Entering/staying near the hot side deals damage per spell triggers.'});
 put('Mass Cure Wounds','healing','5d8+@','',{inc:'1d8',noteEl:'Θεραπεύει έως 6 πλάσματα· κάθε στόχος ανακτά το αντίστοιχο ποσό.',noteEn:'Heals up to 6 creatures; each regains the rolled amount.'});
 put('Flame Strike','damage','5d6 + 5d6','Fire + Radiant',{special:'flameStrike',hit:'DEX save',saveHalf:true,noteEl:'5d6 Fire και 5d6 Radiant, με μισό συνολικό damage σε επιτυχημένο save.',noteEn:'5d6 Fire and 5d6 Radiant, half total damage on a successful save.'});
 put('Heal','healing','70 HP','',{special:'heal',noteEl:'Σταθερή θεραπεία 70 HP, όχι ζάρια, στο Level 6 slot.',noteEn:'Fixed 70 HP healing, no dice, at a level-6 slot.'});
 put('Chain Lightning','damage','10d8','Lightning',{hit:'DEX save',saveHalf:true,noteEl:'Ξεχωριστά επιλεγμένοι στόχοι, ίδιο damage ανά στόχο.',noteEn:'Multiple designated targets; same damage per target.'});
 put('Heroes’ Feast','hp','2d10 max/current HP','',{noteEl:'Αυξάνει τα Max και Current HP των συμμετεχόντων κατά 2d10 (σύμφωνα με τους κανόνες 2024).',noteEn:'Increases participants’ maximum and current HP by 2d10 (2024).'});
 put('Fire Storm','damage','7d10','Fire',{hit:'DEX save',saveHalf:true});
 put('Regenerate','healing','4d8+15 HP','',{noteEl:'Αρχική θεραπεία 4d8+15 και έπειτα 1 HP στην αρχή κάθε turn του στόχου.',noteEn:'Initial healing of 4d8+15 and then 1 HP at the start of each target turn.'});
 put('Sunburst','damage','12d6','Radiant',{hit:'CON save',saveHalf:true,noteEl:'Μπορεί επίσης να προκαλέσει Blinded σε failed save.',noteEn:'Can also cause Blinded on a failed save.'});
 put('Meteor Swarm','damage','20d6 + 20d6','Fire + Bludgeoning',{hit:'DEX save',saveHalf:true,noteEl:'20d6 Fire + 20d6 Bludgeoning ανά στόχο σε επηρεαζόμενη περιοχή.',noteEn:'20d6 Fire + 20d6 Bludgeoning per affected creature.'});
 put('Mass Heal','healing','700 HP pool','',{noteEl:'Μοίρασε συνολικά έως 700 HP μεταξύ επιλεγμένων πλασμάτων, όχι 700 ανά στόχο.',noteEn:'Distribute a total pool of up to 700 HP among targets, not 700 each.'});
 put('Prismatic Wall','damage','12d6 per damage layer','Varies',{special:'prismatic',hit:'DEX saves',saveHalf:true,noteEl:'Το 12d6 είναι ανά damaging layer (π.χ. Fire, Acid, Lightning κ.λπ.), όχι ενιαίο hit· κάθε layer έχει δικό του effect/save.',noteEn:'12d6 per damaging layer (Fire, Acid, Lightning, etc.), not one combined attack; layers have separate saves/effects.'});
 put('Wish','variable','DM-defined','',{noteEl:'Δεν έχει προκαθορισμένο damage· εξαρτάται από το αποτέλεσμα που ζητάς ή το spell που αντιγράφεις.',noteEn:'No fixed damage; depends on the effect requested or the spell duplicated.'});

 const langEl=()=>window.ATLAS_I18N?.getLanguage?.()==='el';
 const tr=(el,en)=>langEl()?el:en;
 const digits=(formula, delta, step=1)=>String(formula).replace(/(\d+)d(\d+)/g,(_,n,d)=>(Number(n)+Number(delta)*step)+'d'+d);
 const modFormula=(formula,mod)=>String(formula).replace(/\+@/g, Number(mod)>=0?`+${mod}`:`${mod}`);
 const pretty=(spec,spell,ch,slot)=>{
   const characterLevel=Math.max(1,(ch.classes||[]).reduce((a,x)=>a+(Number(x.level)||0),0));
   const stage=characterLevel>=17?4:characterLevel>=11?3:characterLevel>=5?2:1;
   const base=Number(spell.level)||0, chosen=Math.max(base,Number(slot)||base), delta=Math.max(0,chosen-base);
   const casterMod=Math.floor((Number((ch.abilities||{})[ch.spellAbility||'INT']??10)-10)/2);
   const value=Number.isFinite(casterMod)?casterMod:0;
   if(spec.special==='missiles')return `${3+delta} × (1d4+1)`;
   if(spec.special==='rays')return `${3+delta} × 2d6`;
   if(spec.special==='trueStrike')return stage===1?'Weapon damage':`Weapon + ${stage-1}d6 Radiant`;
   if(spec.special==='heal')return `${70+10*delta} HP`;
   if(spec.special==='aid')return `+${5+5*delta} max/current HP`;
   if(spec.special==='flameStrike')return `5d6 Fire + 5d6 Radiant${delta?` + ${delta}d6 (choice)`:''}`;
   if(spec.special==='prismatic')return spec.formula;
   if(spec.incFlat&&delta){const n=Number(spec.incFlat)*delta;return `${modFormula(spec.formula,value)} + ${n}`;}
   let val=modFormula(spec.formula,value);
   if(spec.beams)return `1d10 × ${stage} ${stage===1?'beam':'beams'}`;
   if(spec.cantrip)return digits(val,stage-1);
   if(spec.inc&&delta){
     const m=String(spec.inc).match(/^(\d+)d(\d+)$/);
     if(m){const n=Number(m[1])*delta, sides=Number(m[2]), sameDie=new RegExp('\\b(\\d+)d'+sides+'\\b');
       // Built-in effects usually increase the first dice group; homebrew effects may append distinct dice.
       val=sameDie.test(val)?val.replace(sameDie,(_,a)=>(Number(a)+n)+'d'+sides):`${val} + ${n}d${sides}`;
     }
   }
   return val;
 };
 const describeScaling=(spell,spec)=>{
  if(!spec)return '';
  if(spec.beams)return tr('Level 5: 2 beams · Level 11: 3 · Level 17: 4.','Level 5: 2 beams · Level 11: 3 · Level 17: 4.');
  if(spec.cantrip||spec.special==='trueStrike')return tr('Character level: 1–4 / 5–10 / 11–16 / 17–20 → αυξημένη ζημιά.','Character level: 1–4 / 5–10 / 11–16 / 17–20 → increased damage.');
  if(spec.special==='missiles')return tr('+1 dart ανά slot level πάνω από 1.','+1 dart per slot above level 1.');
  if(spec.special==='rays')return tr('+1 ray ανά slot level πάνω από 2.','+1 ray per slot above level 2.');
  if(spec.special==='aid')return tr('+5 Max και Current HP ανά slot level πάνω από 2.','+5 Max and Current HP per slot above level 2.');
  if(spec.special==='heal')return tr('+10 HP ανά slot level πάνω από 6.','+10 HP per slot above level 6.');
  if(spec.special==='flameStrike')return tr('+1d6 επιπλέον Fire ή Radiant ανά slot level πάνω από 5.','+1d6 extra Fire or Radiant per slot above level 5.');
  if(spec.inc)return tr(`+${spec.inc} ανά spell slot level πάνω από ${spell.level}.`,`+${spec.inc} per spell slot above level ${spell.level}.`);
  return '';
 };
 // Distinguish spell-slot scaling, cantrip character-level scaling, and spells with no
 // defined damage progression. 2024 spell rules remain authoritative.
 const scalingInfo=(spell,character)=>{
  const spec=(spell?.damage?{kind:spell.effectKind||'damage',formula:spell.damage,inc:/^\+?\d+d\d+$/.test((spell.upcastBonus||'').trim())?(spell.upcastBonus||'').trim().replace(/^\+/,''):null,incFlat:/^\+?\d+$/.test((spell.upcastBonus||'').trim())?Number(spell.upcastBonus):null}:null)||effects[spell?.name];
  if(!spec)return {mode:'unknown',brief:'',text:tr('Δεν υπάρχουν στοιχεία αύξησης ζημιάς.','No damage-scaling data available.')};
  if(spec.beams)return {mode:'character',brief:tr('Character Lv 5/11/17','Character Lv 5/11/17'),text:tr('Οι βολές γίνονται 2 / 3 / 4 στα συνολικά character levels 5 / 11 / 17.','Beams become 2 / 3 / 4 at total character levels 5 / 11 / 17.')};
  if(spec.cantrip||spec.special==='trueStrike')return {mode:'character',brief:tr('Character Lv 5/11/17','Character Lv 5/11/17'),text:tr('Το damage αυξάνεται στα συνολικά character levels 5, 11 και 17 — όχι ανά spell slot.','Damage increases at total character levels 5, 11 and 17 — not per spell slot.')};
  const base=Number(spell.level)||0;
  let bonus='',description='';
  if(spec.special==='missiles'){bonus=tr('+1 βλήμα / slot','+1 dart / slot');description=tr('Ένα επιπλέον βλήμα (1d4+1 Force) για κάθε slot level πάνω από 1.','One additional dart (1d4+1 Force) for each slot level above 1.');}
  else if(spec.special==='rays'){bonus=tr('+1 ακτίνα / slot','+1 ray / slot');description=tr('Μία επιπλέον ακτίνα (2d6 Fire) για κάθε slot level πάνω από 2.','One additional ray (2d6 Fire) for each slot level above 2.');}
  else if(spec.special==='aid'){bonus='+5 HP / slot';description=tr('Τα Max και Current HP αυξάνονται κατά 5 ανά slot level πάνω από 2.','Maximum and current HP increase by 5 per slot level above 2.');}
  else if(spec.special==='heal'){bonus='+10 HP / slot';description=tr('Η θεραπεία αυξάνεται κατά 10 HP ανά slot level πάνω από 6.','Healing increases by 10 HP per slot level above 6.');}
  else if(spec.special==='flameStrike'){bonus='+1d6 / slot';description=tr('Προσθέτεις 1d6 Fire ή Radiant για κάθε slot level πάνω από 5.','Add 1d6 Fire or Radiant per slot level above 5.');}
  else if(spec.incFlat){bonus=`+${spec.incFlat} / slot`;description=tr(`+${spec.incFlat} ανά slot level πάνω από ${base}.`,`+${spec.incFlat} per slot level above ${base}.`);}
  else if(spec.inc){bonus=`+${spec.inc} / slot`;description=tr(`+${spec.inc} ανά slot level πάνω από ${base}.`,`+${spec.inc} per slot level above ${base}.`);}
  if(bonus&&base>0)return {mode:'slot',brief:bonus,text:description};
  return {mode:'none',brief:'',text:tr('Δεν έχει καταγεγραμμένη αύξηση damage/healing ανά slot level. Άλλες ιδιότητες (διάρκεια, στόχοι) ενδέχεται να αλλάζουν.','No damage/healing increase per slot level is recorded. Other properties (duration, targets) may still change.')};
 };
 // Full level-by-level preview. Calculate all legal slots instead of suggesting that
 // a character can cast spells at levels they haven't unlocked.
 const progression=(spell,ch)=>{
  const info=scalingInfo(spell,ch), out=[];
  if(info.mode==='slot'){
   const base=Number(spell.level)||0;
   for(let level=base;level<=9;level++)out.push({level,formula:show(spell,ch,level).label});
  }else if(info.mode==='character'){
   for(const lvl of [1,5,11,17]){
    const alt={...ch,classes:[{name:'Preview',level:lvl}]};
    out.push({level:lvl,formula:show(spell,alt).label});
   }
  }
  return out;
 };
 const show=(s,ch,level)=>{
   if(!s)return null;
   const spec=(s.damage?{kind:s.effectKind||'damage',formula:s.damage,type:s.damageType||'',inc: /^\+?\d+d\d+$/.test((s.upcastBonus||'').trim()) ? (s.upcastBonus||'').trim().replace(/^\+/,'') : null, incFlat: /^\+?\d+$/.test((s.upcastBonus||'').trim()) ? Number((s.upcastBonus||'').trim()) : null, noteEl:s.damageNote||'',noteEn:s.damageNote||''}:null) || effects[s.name];
   if(!spec)return {kind:'none',title:tr('Χωρίς άμεσο damage','No direct damage'),label:tr('Utility / Control','Utility / Control'),detail:tr('Δεν προκαλεί άμεσο damage ή θεραπεία. Δες την περιγραφή για τα υπόλοιπα effects.','Does not deal direct damage or healing. See the description for other effects.')};
   const category=spec.kind==='healing'?'healing':spec.kind==='hp'?'hp':spec.kind==='damage'?'damage':'variable';
   const categoryTitle=category==='damage'?tr('Ζημιά','Damage'):category==='healing'?tr('Θεραπεία','Healing'):category==='hp'?tr('Αύξηση HP','HP increase'):tr('Μεταβλητό effect','Variable effect');
   const formula=pretty(spec,s,ch,level);
   const suffix=spec.type && !formula.includes(spec.type) ? ` ${spec.type}` : '';
   const note=langEl()?spec.noteEl:spec.noteEn;
   const scaling=describeScaling(s,spec);
   return {kind:category,title:categoryTitle,formula,label:formula+suffix,detail:note||'',scaling,hit:spec.hit||'',saveHalf:spec.saveHalf===true,minimum:s.level||0,type:spec.type||'',special:spec.special||''};
 };
 return {effects,show,scalingInfo,progression};
})();
