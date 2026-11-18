/* Atlas 2.0 — Human Skillful, Versatile, and SRD 5.2.1 Origin Feats.
 * Builder UI helper; pure selections and local validation. No external requests.
 */
(function () {
  'use strict';
  const FEATS = Object.freeze({
    'alert':{
      name:'Alert',
      en:'You react faster to danger. Add your Proficiency Bonus to Initiative, and after rolling Initiative you may exchange your result with a willing ally in the same encounter.',
      el:'Αντιδράς γρηγορότερα στην αρχή μιας μάχης. Προσθέτεις το Proficiency Bonus στο Initiative και, μετά τον υπολογισμό του, μπορείς να ανταλλάξεις τη σειρά σου με πρόθυμο σύμμαχο.'
    },
    'magic-initiate':{
      name:'Magic Initiate',
      en:'Learn two cantrips and one level-1 spell from the Cleric, Druid or Wizard list. The level-1 spell can be cast once without a slot per Long Rest, or with available slots. The spell list, spells and casting ability require separate choices.',
      el:'Μαθαίνεις δύο cantrips και ένα ξόρκι level 1 από τη λίστα Cleric, Druid ή Wizard. Το ξόρκι level 1 μπορεί να χρησιμοποιηθεί δωρεάν μία φορά ανά Long Rest ή με spell slots. Απαιτούνται επιπλέον επιλογές λίστας, ξορκιών και spellcasting ability.'
    },
    'savage-attacker':{
      name:'Savage Attacker',
      en:'Once on each of your turns when a weapon attack hits, you can roll the weapon damage dice twice and choose which result to use. This improves the weapon dice, not the attack roll.',
      el:'Μία φορά στον γύρο σου, όταν πετύχεις επίθεση με όπλο, μπορείς να υπολογίσεις δύο φορές τα damage dice του όπλου και να χρησιμοποιήσεις το καλύτερο αποτέλεσμα. Δεν αλλάζει το attack roll.'
    },
    'skilled':{
      name:'Skilled',
      en:'Choose any three distinct Skill or Tool Proficiencies you do not already have. This Origin Feat is repeatable, but each new choice must be a new proficiency.',
      el:'Αποκτάς τρεις επιπλέον εξοικειώσεις (Skill ή Tool Proficiencies) που δεν έχεις ήδη. Το Origin Feat μπορεί να επιλεγεί περισσότερες φορές, αλλά κάθε επιλογή πρέπει να προσθέτει διαφορετική εξοικείωση.'
    }
  });
  const MASTERIES = Object.freeze({
    'cleave':{
      en:'After hitting a creature with a melee attack, make an additional attack with the same weapon against a second enemy next to the first and within your reach (once per turn).',
      el:'Αν πετύχεις εχθρό σε melee επίθεση, μπορείς μία φορά ανά γύρο να επιτεθείς και σε δεύτερο κοντινό εχθρό με το ίδιο όπλο.'
    },
    'graze':{
      en:'On a missed weapon attack, deal damage equal to the ability modifier used for the attack (minimum 0). The weapon damage dice do not apply to this miss.',
      el:'Ακόμη και αν αποτύχει η επίθεση, προκαλείς ζημιά ίση με το Ability Modifier της επίθεσης (ελάχιστο 0), χωρίς τα damage dice του όπλου.'
    },
    'nick':{
      en:'Make the extra attack granted by the Light weapon property within the Attack action instead of using your Bonus Action (once per turn).',
      el:'Η επιπλέον επίθεση που δίνει το Light weapon property γίνεται μέσα στο Attack action αντί να καταναλώνει Bonus Action (μία φορά ανά γύρο).'
    },
    'push':{
      en:'On a hit, push a Large or smaller target up to 10 feet straight away from you, without a saving throw.',
      el:'Όταν πετυχαίνεις επίθεση, σπρώχνεις στόχο μεγέθους Large ή μικρότερου έως 10 feet μακριά σου, χωρίς Saving Throw.'
    },
    'sap':{
      en:'A creature hit by this weapon has Disadvantage on its next attack roll before the start of your next turn.',
      el:'Ο στόχος που δέχεται το χτύπημα έχει Disadvantage στην επόμενη επίθεσή του, αν αυτή γίνει πριν αρχίσει ο επόμενος γύρος σου.'
    },
    'slow':{
      en:'On a hit, reduce the target’s Speed by 10 feet until the start of your next turn. Multiple Slow effects cannot reduce it more than 10 feet.',
      el:'Όταν πετυχαίνεις επίθεση, η ταχύτητα του στόχου μειώνεται κατά 10 feet έως τον επόμενο γύρο σου. Πολλαπλές εφαρμογές Slow δεν αθροίζονται.'
    },
    'topple':{
      en:'On a hit, the target makes a Constitution saving throw (DC 8 + your Proficiency Bonus + the attack ability modifier) or falls Prone.',
      el:'Όταν πετυχαίνεις επίθεση, ο στόχος κάνει Constitution Saving Throw (DC 8 + Proficiency Bonus + Ability Modifier επίθεσης)· αν αποτύχει πέφτει Prone.'
    },
    'vex':{
      en:'After hitting and damaging a creature, gain Advantage on your next attack roll against it before the end of your next turn.',
      el:'Όταν πετυχαίνεις και προκαλείς ζημιά σε εχθρό, έχεις Advantage στην επόμενη επίθεσή σου εναντίον του μέχρι το τέλος του επόμενου γύρου σου.'
    }
  });
  const SKILL_NAMES = Object.freeze({
    'acrobatics':['Acrobatics','Ακροβατικά'],'animal-handling':['Animal Handling','Χειρισμός Ζώων'],
    'arcana':['Arcana','Απόκρυφη Γνώση'],'athletics':['Athletics','Αθλητισμός'],
    'deception':['Deception','Εξαπάτηση'],'history':['History','Ιστορία'],
    'insight':['Insight','Διορατικότητα'],'intimidation':['Intimidation','Εκφοβισμός'],
    'investigation':['Investigation','Έρευνα'],'medicine':['Medicine','Ιατρική'],
    'nature':['Nature','Φύση'],'perception':['Perception','Αντίληψη'],
    'performance':['Performance','Παράσταση'],'persuasion':['Persuasion','Πειθώ'],
    'religion':['Religion','Θρησκεία'],'sleight-of-hand':['Sleight of Hand','Ταχυδακτυλουργία'],
    'stealth':['Stealth','Απόκρυψη'],'survival':['Survival','Επιβίωση']
  });
  const skillOptions=Object.entries(SKILL_NAMES).map(([id,[en,el]])=>({id:'skill-'+id,en,el,kind:'skill'}));
  const toolOptions=window.ATLAS_V2_SRD.equipment.filter(x=>x.category==='tools').map(x=>({id:'tool-'+x.id,en:x.name,el:x.name,kind:'tool'}));
  const langKey=locale=>locale==='el'?'el':'en';
  const skillLabel=(option,locale)=>locale==='el' ? option.el+' ('+option.en+')' : option.en;
  const ownedBackground=draft=>new Set((window.ATLAS_V2_BUILDER.backgroundInfo(draft.background)?.proficiencies||[]).map(p=>p.id));
  const ownedClass=draft=>new Set([
    ...(window.ATLAS_V2_BUILDER.classInfo(draft.class)?.proficiencies||[]).map(p=>p.id),
    ...Object.values(draft.classChoices||{}).flat()
  ]);
  function alreadyGranted(draft,{exclude=''}={}){
    const ids=new Set([...ownedBackground(draft),...ownedClass(draft)]);
    for(const arr of Object.values(draft.backgroundChoices||{}))for(const id of arr)ids.add(id);
    if(exclude!=='human' && draft.species==='human' && draft.humanSkill)ids.add(draft.humanSkill);
    if(exclude!=='skilled'&&draft.humanFeat==='skilled')for(const id of draft.skilledChoices||[])ids.add(id);
    return ids;
  }
  const backgroundFeat=draft=>window.ATLAS_V2_BUILDER.backgroundInfo(draft.background)?.feat?.id||null;
  function validHumanSkill(draft){
    if(draft.species!=='human')return true;
    return !!draft.humanSkill&&skillOptions.some(o=>o.id===draft.humanSkill)&&!alreadyGranted(draft,{exclude:'human'}).has(draft.humanSkill);
  }
  function validHumanFeat(draft){
    if(draft.species!=='human')return true;
    if(!FEATS[draft.humanFeat])return false;
    const original=backgroundFeat(draft);
    if(draft.humanFeat===original && !['skilled','magic-initiate'].includes(draft.humanFeat))return false;
    if(draft.humanFeat==='magic-initiate')return false; // Requires spell/list/casting choices not yet available in catalog.
    if(draft.humanFeat==='skilled'){
      const selected=draft.skilledChoices||[];
      if(selected.length!==3||new Set(selected).size!==3)return false;
      const excluded=alreadyGranted(draft,{exclude:'skilled'});
      return selected.every(id=>[...skillOptions,...toolOptions].some(o=>o.id===id)&&!excluded.has(id));
    }
    return true;
  }
  const validSpeciesChoices=draft=>validHumanSkill(draft)&&validHumanFeat(draft);
  function renderOption({item,selected,disabled,action,locale,esc,explanation='',group='',note='' }){
    return `<button type="button" class="atlas-choice-row ${selected?'active':''}" data-action="${action}" data-id="${esc(item.id)}" ${group?`data-group="${esc(group)}"`:''} aria-pressed="${selected}" ${disabled?'disabled':''}>
       <span class="atlas-choice-indicator">${selected?'✓':'+'}</span><span class="atlas-choice-name"><strong>${esc(skillLabel(item,locale))}</strong>${explanation?`<small>${esc(explanation)}</small>`:''}${note?`<small class="atlas-choice-note">${esc(note)}</small>`:''}</span>
     </button>`;
  }
  function renderHumanSkill({draft,locale,esc}){
    if(draft.species!=='human')return '';
    const lang=langKey(locale),blocked=alreadyGranted(draft,{exclude:'human'});
    const selected=draft.humanSkill||null;
    return `<section class="atlas-extra-choice"><div class="atlas-extra-heading"><div><h3>Human · Skillful</h3><p>${esc(lang==='el'?'Διάλεξε μία επιπλέον δεξιότητα που δεν έχεις ήδη. Προστίθεται στις επιλογές Class και Background.':'Choose one additional Skill Proficiency you do not already have. This is separate from your Class and Background skills.')}</p></div><span class="chip ${selected?'gold':'muted'}">${selected?'1':'0'} / 1</span></div>
     <div class="atlas-choices-grid">${skillOptions.map(o=>renderOption({item:o,selected:selected===o.id,disabled:blocked.has(o.id),action:'human-skill',locale,esc,note:blocked.has(o.id)?(lang==='el'?'Δίνεται ήδη':'Already proficient'):''})).join('')}</div></section>`;
  }
  function renderHumanFeat({draft,locale,esc}){
    if(draft.species!=='human')return '';
    const lang=langKey(locale),chosen=draft.humanFeat;
    const origin=backgroundFeat(draft);
    const items=Object.entries(FEATS);
    const feats=`<div class="atlas-feat-grid">${items.map(([id,info])=>{
      const disabled=id===origin && !['skilled','magic-initiate'].includes(id);
      return `<button type="button" data-action="human-feat" data-id="${esc(id)}" aria-pressed="${chosen===id}" class="atlas-feat-card ${chosen===id?'active':''}" ${disabled?'disabled':''}><strong>${esc(info.name)}</strong><p>${esc(info[lang])}</p>${disabled?`<small>${esc(lang==='el'?'Έχει ήδη δοθεί από το Background.':'Already granted by your Background.')}</small>`:''}</button>`;
    }).join('')}</div>`;
    const skillSelected=draft.skilledChoices||[];
    const skillBlocked=alreadyGranted(draft,{exclude:'skilled'});
    const skilled=chosen==='skilled'?`<div class="atlas-extra-choice"><div class="atlas-extra-heading"><h4>${esc(lang==='el'?'Skilled — τρεις εξοικειώσεις σε Skills ή Tools':'Skilled — choose three Skill or Tool Proficiencies')}</h4><span class="chip ${skillSelected.length===3?'gold':'muted'}">${skillSelected.length}/3</span></div>
      <div class="atlas-choices-grid">${[...skillOptions,...toolOptions].map(o=>renderOption({item:o,selected:skillSelected.includes(o.id),disabled:skillBlocked.has(o.id),action:'skilled-proficiency',locale,esc,note:skillBlocked.has(o.id)?(lang==='el'?'Δίνεται ήδη':'Already proficient'):''})).join('')}</div></div>`:'';
    const magic=chosen==='magic-initiate'?`<p class="inline-warning" role="status">${esc(lang==='el'?'Το Magic Initiate απαιτεί spell list, δύο cantrips, ένα spell Level 1 και spellcasting ability. Η επιλογή αυτή παραμένει πρόχειρη έως ότου ολοκληρωθεί το spell picker.':'Magic Initiate requires a spell list, two cantrips, one level-1 spell, and a spellcasting ability. This choice remains incomplete until the spell picker is implemented.')}</p>`:'';
    return `<section class="atlas-extra-choice"><div class="atlas-extra-heading"><div><h3>Human · Versatile</h3><p>${esc(lang==='el'?'Διάλεξε ένα επιπλέον Origin Feat, εκτός από αυτό που δίνει το Background.':'Choose an additional Origin Feat, in addition to the one already provided by your Background.')}</p></div><span class="chip ${validHumanFeat(draft)?'gold':'muted'}">${chosen?'1':'0'} / 1</span></div>
     ${feats}${skilled}${magic}</section>`;
  }
  function renderBackgroundFeat({draft,locale,esc}){
    const bg=window.ATLAS_V2_BUILDER.backgroundInfo(draft.background);
    if(!bg?.feat)return '';
    const lang=langKey(locale),feat=FEATS[bg.feat.id];
    return `<section class="atlas-origin-explanation"><span class="atlas-origin-tag">${esc(lang==='el'?'Αυτόματα από Background':'Automatically granted by Background')}</span>
      <h4>${esc(bg.feat.name)}</h4><p>${esc(feat?.[lang]||'')}</p>
      ${bg.feat.id==='magic-initiate'?`<p class="inline-info">${esc(lang==='el'?'Απαιτείται πρόσθετη ρύθμιση ξορκιών από το spell picker.':'This feat also requires spell selection in the forthcoming spell picker.')}</p>`:''}
      </section>`;
  }
  function renderClassSkillPreview({draft,cl,locale,esc}){
    if(draft.class!==cl?.id||!cl.skillChoices?.length)return '';
    const lang=langKey(locale),bg=ownedBackground(draft);
    return `<div class="atlas-class-skill-preview">${cl.skillChoices.map(group=>{
      const values=draft.classChoices?.[group.id]||[];
      const blocked=new Set([...bg,...(draft.humanSkill?[draft.humanSkill]:[]),...(draft.humanFeat==='skilled'?(draft.skilledChoices||[]):[])]);
      return `<div class="atlas-extra-heading"><div><h4>${esc(lang==='el'?'Επίλεξε δεξιότητες Class':'Choose Class Skills')}</h4><p>${esc(lang==='el'?'Οι επιλογές εδώ αποθηκεύονται και στο βήμα Class Training.':'Choices made here carry over to Class Training.')}</p></div><span class="chip ${values.length===group.count?'gold':'muted'}">${values.length}/${group.count}</span></div>
        <div class="atlas-choices-grid">${group.options.map(o=>{
          const option=skillOptions.find(s=>s.id===o.id);
          if(!option)return '';
          return renderOption({item:option,selected:values.includes(o.id),disabled:blocked.has(o.id)&&!values.includes(o.id),action:'class-proficiency',group:group.id,locale,esc,note:blocked.has(o.id)?(lang==='el'?'Δίνεται ήδη':'Already proficient'):''});
        }).join('')}</div>`;
    }).join('')}</div>`;
  }
  window.ATLAS_V2_ORIGINS=Object.freeze({
    FEATS,MASTERIES,SKILL_NAMES,skillOptions,toolOptions,skillLabel,alreadyGranted,backgroundFeat,
    validHumanSkill,validHumanFeat,validSpeciesChoices,renderHumanSkill,renderHumanFeat,
    renderBackgroundFeat,renderClassSkillPreview
  });
})();