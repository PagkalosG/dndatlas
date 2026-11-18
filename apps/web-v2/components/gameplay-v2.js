/* D&D Atlas 2.0 — original D&D-Beyond-inspired sheet layout, not a copy.
 * All values come from the existing 2024 Atlas model or explicit local input.
 * Never silently invent spell slots, features, or permission enforcement.
 */
(function () {
  'use strict';
  const CHAR = window.ATLAS_V2_CHARACTER_SHEET;
  const ORIGIN = window.ATLAS_V2_ORIGINS;
  const KEYS = ['str','dex','con','int','wis','cha'];
  const T = {
    en: {
      overview:'Overview',actions:'Actions & Combat',spells:'Spells',equipment:'Equipment',features:'Features & Traits',description:'Description',notes:'Notes',
      level:'Level',hp:'Current HP',baseHp:'Estimated base HP',temp:'Temporary HP',ac:'Armor Class',initiative:'Initiative',prof:'Proficiency',speed:'Speed',unresolved:'Not calculated',
      restShort:'Short Rest',restLong:'Long Rest',shortHint:'Record a rest; adjust HP manually for Hit Dice spent. No dice rolling UI.',
      longHint:'Restore displayed HP and clear death saves. Class resources and spell slots require explicit management.',
      abilities:'Ability Scores',saves:'Saving Throws',skills:'Skills',current:'Current',maximum:'Base maximum',death:'Death Saves',success:'Successes',failure:'Failures',
      conditions:'Conditions',actionsTitle:'Weapons & Attacks',actionHelp:'Use these values for tabletop rolls. Attack rolls are never made inside Atlas.',
      generalActions:'Core 2024 Actions',noAttacks:'No equipped starting weapons found.',damage:'Damage',mastery:'Weapon Mastery',shieldWarning:'A Two-Handed weapon cannot be used while holding a shield.',
      spellInfo:'Spellbook and slots are currently manual notes. Automatic spell choices, slots and prepared lists still require 2024 rules-engine support.',
      spellName:'Spell name',spellLevel:'Level',addSpell:'Add spell note',spellNone:'No spells recorded yet.',spellSlot:'Slots',maxSlots:'Total slots',usedSlots:'Used',use:'Use',restore:'Restore',remove:'Remove',
      inventoryInfo:'All starting equipment and purchases come from your current character build. Changes to quantities below are tracked locally.',
      inventoryEmpty:'No equipment yet. Choose a starting package in the Builder.',remaining:'Remaining',sources:'Source',consume:'Consume / remove',recover:'Restore one',
      traitsHint:'Class and species details shown here are a reference preview; unmodeled abilities are not automatically calculated.',
      story:'Character story',alignment:'Alignment',background:'Background',private:'Local demo only — private story access will be enforced by the future backend.',
      notesHelp:'Personal notes are stored in this browser only.',notesLabel:'Personal notes',saveNotes:'Save notes',
      journal:'Session Journal',journalHelp:'Record session events locally. Shared/private labels are descriptive until accounts exist.',
      journalTitle:'Entry title',journalText:'What happened?',journalVisibility:'Visibility',journalPrivate:'Private',journalShared:'Campaign',addEntry:'Add entry',noEntries:'No journal entries yet.',
      required:'Enter a name and note before saving.',savedLocal:'Saved on this device.',localOnly:'Local-only prototype; not synchronized across browsers or devices.',
      hpNote:'HP shown is based on fixed progression and known modifiers; class feats and special effects may alter the true maximum.',
      spellLimit:'Set spell slots manually; this preview does not grant slots automatically.',hitDice:'Hit Dice',dmMode:'DM preview',playerMode:'Player preview',
      armor:'Worn armor',shield:'Shield equipped',unarmored:'Unarmored',money:'Remaining GP',owned:'Owned',quantity:'Qty',noSelected:'No selection',
      chooseBuilder:'Build a character first',editBuilder:'Edit character',details:'Show details',noStory:'Add a story in Character Identity.',
      proficiency:'Proficiency',proficient:'Proficient',notProficient:'Not proficient'
    },
    el: {
      overview:'Επισκόπηση',actions:'Ενέργειες & Μάχη',spells:'Ξόρκια',equipment:'Εξοπλισμός',features:'Ικανότητες & Traits',description:'Περιγραφή',notes:'Σημειώσεις',
      level:'Επίπεδο',hp:'Τρέχον HP',baseHp:'Εκτίμηση βασικού HP',temp:'Προσωρινό HP',ac:'Κλάση Πανοπλίας',initiative:'Πρωτοβουλία',prof:'Εξοικείωση',speed:'Ταχύτητα',unresolved:'Δεν υπολογίζεται',
      restShort:'Σύντομη Ανάπαυση (Short Rest)',restLong:'Μακρά Ανάπαυση (Long Rest)',shortHint:'Καταγράφει ανάπαυση· συμπλήρωσε χειροκίνητα τα HP από Hit Dice. Χωρίς UI ρίψης ζαριών.',
      longHint:'Επαναφέρει τα εμφανιζόμενα HP και τα Death Saves. Τα class resources και spell slots χρειάζονται ξεχωριστό χειρισμό.',
      abilities:'Χαρακτηριστικά',saves:'Σωτήριες Βολές',skills:'Δεξιότητες',current:'Τρέχον',maximum:'Βασικό μέγιστο',death:'Death Saves',success:'Επιτυχίες',failure:'Αποτυχίες',
      conditions:'Καταστάσεις',actionsTitle:'Όπλα & Επιθέσεις',actionHelp:'Χρησιμοποίησε τις τιμές στις φυσικές ζαριές σου. Το Atlas δεν πραγματοποιεί ρίψεις.',
      generalActions:'Βασικές Ενέργειες 2024',noAttacks:'Δεν υπάρχουν όπλα από τον αρχικό εξοπλισμό.',damage:'Ζημιά',mastery:'Weapon Mastery',shieldWarning:'Το Two-Handed όπλο δεν χρησιμοποιείται με εξοπλισμένη ασπίδα.',
      spellInfo:'Το Spellbook και τα slots είναι προς το παρόν χειροκίνητες σημειώσεις. Οι αυτόματες επιλογές ξορκιών και τα διαθέσιμα slots απαιτούν επέκταση του Rules Engine 2024.',
      spellName:'Όνομα ξορκιού',spellLevel:'Επίπεδο',addSpell:'Προσθήκη σημείωσης ξορκιού',spellNone:'Δεν έχουν καταχωριστεί ξόρκια.',spellSlot:'Θέσεις ξορκιών (Slots)',maxSlots:'Σύνολο',usedSlots:'Χρησιμοποιήθηκαν',use:'Χρήση',restore:'Επαναφορά',remove:'Αφαίρεση',
      inventoryInfo:'Ο αρχικός εξοπλισμός και οι αγορές προέρχονται από το build σου. Οι αλλαγές ποσοτήτων αποθηκεύονται τοπικά.',
      inventoryEmpty:'Δεν υπάρχει εξοπλισμός. Επίλεξε αρχικό πακέτο στον Builder.',remaining:'Υπόλοιπο',sources:'Προέλευση',consume:'Κατανάλωση / αφαίρεση',recover:'Επαναφορά ενός',
      traitsHint:'Τα Class και Species Traits είναι προεπισκόπηση: οι επιδράσεις που δεν έχουν υλοποιηθεί δεν υπολογίζονται αυτόματα.',
      story:'Ιστορία χαρακτήρα',alignment:'Ηθική στάση (Alignment)',background:'Προέλευση',private:'Μόνο τοπικό demo — τα δικαιώματα ιδιωτικότητας θα ελέγχονται αργότερα στο backend.',
      notesHelp:'Οι προσωπικές σημειώσεις αποθηκεύονται μόνο σε αυτόν τον browser.',notesLabel:'Προσωπικές σημειώσεις',saveNotes:'Αποθήκευση σημειώσεων',
      journal:'Ημερολόγιο Συνεδριών',journalHelp:'Κατάγραψε τα γεγονότα τοπικά. Οι ενδείξεις κοινόχρηστο/ιδιωτικό είναι πληροφοριακές μέχρι να υπάρχουν λογαριασμοί.',
      journalTitle:'Τίτλος καταχώρισης',journalText:'Τι συνέβη;',journalVisibility:'Ορατότητα',journalPrivate:'Ιδιωτικό',journalShared:'Campaign',addEntry:'Προσθήκη καταχώρισης',noEntries:'Δεν υπάρχουν καταχωρίσεις ακόμη.',
      required:'Συμπλήρωσε τίτλο και περιγραφή.',savedLocal:'Αποθηκεύτηκε στη συσκευή.',localOnly:'Τοπικό prototype — δεν συγχρονίζεται μεταξύ browsers ή συσκευών.',
      hpNote:'Το HP προκύπτει από τη σταθερή αύξηση και τα γνωστά modifiers. Feats και ειδικά effects μπορεί να αλλάζουν το πραγματικό μέγιστο.',
      spellLimit:'Ρύθμισε τα slots χειροκίνητα· δεν χορηγούνται αυτόματα.',hitDice:'Hit Dice',dmMode:'Προεπισκόπηση DM',playerMode:'Προεπισκόπηση Παίκτη',
      armor:'Φορεμένη πανοπλία',shield:'Ασπίδα εξοπλισμένη',unarmored:'Χωρίς πανοπλία',money:'Υπόλοιπο GP',owned:'Στο Inventory',quantity:'Ποσότητα',noSelected:'Καμία επιλογή',
      chooseBuilder:'Δημιούργησε πρώτα χαρακτήρα',editBuilder:'Επεξεργασία χαρακτήρα',details:'Λεπτομέρειες',noStory:'Πρόσθεσε ιστορικό στο Character Identity.',
      proficiency:'Εξοικείωση',proficient:'Με εξοικείωση',notProficient:'Χωρίς εξοικείωση'
    }
  };
  const CONDITIONS = ['Blinded','Charmed','Deafened','Frightened','Grappled','Incapacitated','Invisible','Paralyzed','Petrified','Poisoned','Prone','Restrained','Stunned','Unconscious'];
  const ACTIONS = {
    en:[['Attack','Attack with equipped weapons.'],['Dash','Gain extra movement equal to Speed.'],['Disengage','Move without triggering Opportunity Attacks.'],['Dodge','Make yourself harder to hit.'],['Help','Aid an ally in a task or attack.'],['Hide','Attempt to become Hidden.'],['Influence','Try to influence another creature.'],['Magic','Cast a spell or use a magical feature.'],['Ready','Prepare an action for a trigger.'],['Search','Examine your surroundings.'],['Study','Recall or learn information.'],['Utilize','Use a tool or object.']],
    el:[['Attack','Επίθεση με όπλο.'],['Dash','Επιπλέον μετακίνηση ίση με το Speed.'],['Disengage','Κίνηση χωρίς Opportunity Attacks.'],['Dodge','Δυσκολεύεις τα χτυπήματα εναντίον σου.'],['Help','Βοηθάς σύμμαχο.'],['Hide','Προσπαθείς να κρυφτείς.'],['Influence','Προσπαθείς να επηρεάσεις ένα πλάσμα.'],['Magic','Χρησιμοποιείς ξόρκι ή μαγική ικανότητα.'],['Ready','Ετοιμάζεις μια ενέργεια με συνθήκη.'],['Search','Ερευνάς το περιβάλλον.'],['Study','Μελετάς ή θυμάσαι πληροφορίες.'],['Utilize','Χρησιμοποιείς εργαλείο ή αντικείμενο.']]
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sign = n => n >= 0 ? '+' + n : '' + n;
  const copy = obj => JSON.parse(JSON.stringify(obj));
  function defaults() {
    return { hpCurrent: null, tempHp: 0, conditions: [], deathSuccess: 0, deathFail: 0, shortRests: 0, longRests: 0,
      spellNotes: [], spellSlots: {}, inventoryUsed: {}, personalNotes: '', journal: [] };
  }
  function normalize(game) {
    const g = game && typeof game === 'object' ? game : {};
    return Object.assign(defaults(), copy(g));
  }
  function derived(draft, builder, insights, level) { return CHAR.derived(draft,builder,insights,level); }
  function remainingItem(baseCount, usedCount) {
    return Math.max(0, Number(baseCount) - Math.max(0, Number(usedCount) || 0));
  }
  function adjust(g, action, data, ctx) {
    const d = ctx.draft, builder = ctx.builder, insights = ctx.insights, level=ctx.level;
    const core = derived(d,builder,insights,level), cap=Math.max(0,core.hp||0);
    const current = Math.max(0,Math.min(cap,g.hpCurrent==null?cap:g.hpCurrent));
    if (action==='game-hp-minus') g.hpCurrent=Math.max(0,current-1);
    else if(action==='game-hp-plus') g.hpCurrent=Math.min(cap,current+1);
    else if(action==='game-temp-minus') g.tempHp=Math.max(0,(g.tempHp||0)-1);
    else if(action==='game-temp-plus') g.tempHp=Math.min(500,(g.tempHp||0)+1);
    else if(action==='game-death-success') g.deathSuccess=(g.deathSuccess+1)%4;
    else if(action==='game-death-fail') g.deathFail=(g.deathFail+1)%4;
    else if(action==='game-toggle-condition') {
      if(!CONDITIONS.includes(data))return false;
      g.conditions=g.conditions.includes(data)?g.conditions.filter(x=>x!==data):[...g.conditions,data];
    }
    else if(action==='game-short-rest')g.shortRests++;
    else if(action==='game-long-rest'){g.longRests++;g.hpCurrent=cap;g.deathSuccess=0;g.deathFail=0;}
    else if(action==='game-item-use'||action==='game-item-restore'){
      const owned=insights.contents(d,builder),custom=(d.customItems||[]).find(x=>x.id===data);
      const base=owned.get(data)?.quantity??custom?.quantity??0;
      if(!base)return false;
      const old=g.inventoryUsed[data]||0;
      const next=action==='game-item-use'?Math.min(base,old+1):Math.max(0,old-1);
      g.inventoryUsed[data]=next;
    }
    else if(action==='game-spell-remove'){g.spellNotes=g.spellNotes.filter(x=>x.id!==data);}
    else if(action==='game-journal-remove'){g.journal=g.journal.filter(x=>x.id!==data);}
    else if(action==='game-slot-use'||action==='game-slot-restore'){
      if(!/^[1-9]$/.test(String(data)))return false;
      const slot=g.spellSlots[data]||{total:0,used:0};
      slot.used=action==='game-slot-use'?Math.min(slot.total,slot.used+1):Math.max(0,slot.used-1);
      g.spellSlots[data]=slot;
    }
    else return false;
    return true;
  }
  function render({draft,game,tab,locale,builder,insights,level,status,role,speciesName,className,backgroundName,subclassName}) {
    const l=locale==='el'?'el':'en',t=T[l],d=draft,g=game,core=derived(d,builder,insights,level);
    const cap=Math.max(0,core.hp||0),current=Math.max(0,Math.min(cap,g.hpCurrent==null?cap:g.hpCurrent));
    const avatar=/^data:image\/(png|jpeg|webp);base64,/.test(d.portraitData||'')?d.portraitData:null;
    const species=speciesName||'—',klass=className||'—',bg=backgroundName||'—';
    const abilities=KEYS.map(k=>{const v=core.ability[k];return '<div class="play-ability"><span>'+k.toUpperCase()+'</span><strong>'+sign(v.modifier)+'</strong><small>'+v.total+'</small></div>';}).join('');
    const saveIds=new Set((builder.classInfo(d.class)?.savingThrows||[]).map(x=>x.id));
    const grantIds=new Set(core.grants.map(x=>x.id));
    const skillList=CHAR.SKILLS.map(([id,k,en,el])=>{
      const prof=grantIds.has('skill-'+id);
      return '<div class="play-skill '+(prof?'trained':'')+'"><span>'+(prof?'● ':'○ ')+esc(l==='el'?el+' ('+en+')':en)+'</span><b>'+sign(core.ability[k].modifier+(prof?core.pb:0))+'</b></div>';
    }).join('');
    const saves=KEYS.map(k=>'<div class="play-skill '+(saveIds.has(k)?'trained':'')+'"><span>'+(saveIds.has(k)?'● ':'○ ')+k.toUpperCase()+'</span><b>'+sign(core.ability[k].modifier+(saveIds.has(k)?core.pb:0))+'</b></div>').join('');
    const button=(action,content,id,extra='',cls='play-action')=>'<button type="button" class="'+cls+'" data-action="'+action+'" '+(id?'data-id="'+esc(id)+'" ':'')+extra+'>'+content+'</button>';
    const stat=(name,value,tip='')=>'<div class="play-stat"><small>'+esc(name)+'</small><strong>'+esc(value)+'</strong>'+(tip?'<span>'+esc(tip)+'</span>':'')+'</div>';
    const tabs=['overview','actions','spells','equipment','features','description','notes'];
    const nav='<div class="play-tabs" role="tablist" aria-label="Character sheet sections">'+tabs.map(k=>button('sheet-tab',esc(t[k]),k,'role="tab" aria-selected="'+(tab===k)+'"','play-action play-tab')).join('')+'</div>';
    function hud(){
      return '<div class="play-hud">'+stat(t.ac,core.ac,core.armor?.name||t.unarmored)+stat(t.initiative,sign(core.initiative))+stat(t.prof,'+'+core.pb)+stat(t.speed,'—',t.unresolved)+
        '<div class="play-health"><div><span>'+esc(t.hp)+'</span><strong>'+current+' <small>/ '+cap+'</small></strong></div><div class="play-hp-actions">'+button('game-hp-minus','−')+button('game-hp-plus','+')+'</div><small>'+esc(t.baseHp)+'</small></div>'+
        '<div class="play-health"><div><span>'+esc(t.temp)+'</span><strong>'+Math.max(0,g.tempHp||0)+'</strong></div><div class="play-hp-actions">'+button('game-temp-minus','−')+button('game-temp-plus','+')+'</div></div>'+
        '</div>';
    }
    function overview(){
      return '<div class="play-content-grid"><div class="play-pane"><h3>'+t.abilities+'</h3><div class="play-abilities">'+abilities+'</div><h3>'+t.saves+'</h3><div class="play-skill-grid">'+saves+'</div><h3>'+t.skills+'</h3><div class="play-skill-grid">'+skillList+'</div></div>'+
      '<div class="play-pane"><h3>'+t.actionsTitle+'</h3>'+attacks(true)+
      '<div class="play-rests"><h3>'+t.restShort+' / '+t.restLong+'</h3><p>'+t.shortHint+'</p>'+button('game-short-rest','♧ '+t.restShort)+' '+button('game-long-rest','☾ '+t.restLong)+'</div>'+
      '<h3>'+t.conditions+'</h3>'+conditionList()+'<p class="play-disclaimer">'+t.hpNote+'</p></div></div>';
    }
    function attacks(compact=false) {
      const rows=CHAR.attackRows(d,builder,insights,level);
      if(!rows.length)return '<p class="play-muted">'+t.noAttacks+'</p>';
      return '<div class="play-attacks">'+rows.map(a=>'<div class="play-attack"><div><b>'+esc(a.name)+'</b><span>'+esc(t.damage)+': '+esc(a.damage)+' '+esc(a.damageType)+'</span></div><strong>'+sign(a.bonus)+'</strong>'+
        (!compact&&a.mastery?'<p><b>'+t.mastery+': '+esc(a.mastery)+'</b> — '+esc(ORIGIN.MASTERIES[a.mastery.toLowerCase()]?.[l]||'')+'</p>':'')+
        (a.shieldConflict?'<p class="play-warning">'+t.shieldWarning+'</p>':'')+'</div>').join('')+'</div>';
    }
    function conditionList(){
      return '<div class="play-conditions">'+CONDITIONS.map(c=>button('game-toggle-condition',esc(c),c,'aria-pressed="'+g.conditions.includes(c)+'"','play-action play-condition '+(g.conditions.includes(c)?'active':'')+'')).join('')+'</div>';
    }
    function combat(){
      return '<div class="play-columns"><section class="play-pane"><h3>'+t.actionsTitle+'</h3><p class="play-muted">'+t.actionHelp+'</p>'+attacks()+
      '<h3>'+t.death+'</h3><div class="play-death">'+button('game-death-success',t.success+': '+g.deathSuccess+' / 3')+button('game-death-fail',t.failure+': '+g.deathFail+' / 3')+'</div>'+
      '<h3>'+t.conditions+'</h3>'+conditionList()+'</section><section class="play-pane"><h3>'+t.generalActions+'</h3>'+
      ACTIONS[l].map(([n,desc])=>'<details class="play-action-description"><summary>'+esc(n)+'</summary><p>'+esc(desc)+'</p></details>').join('')+
      '<div class="play-rests"><p>'+t.longHint+'</p>'+button('game-short-rest',t.restShort)+' '+button('game-long-rest',t.restLong)+'</div></section></div>';
    }
    function spellbook(){
      const entries=g.spellNotes||[];
      return '<section class="play-pane"><h3>'+t.spells+'</h3><p class="play-disclaimer">'+t.spellInfo+'</p>'+
      '<form id="play-spell-form" class="play-inline-form"><label>'+t.spellName+'<input name="name" maxlength="100" required></label><label>'+t.spellLevel+'<select name="level">'+Array.from({length:10},(_,i)=>'<option value="'+i+'">'+(i===0?'Cantrip':i)+'</option>').join('')+'</select></label><button class="btn primary">'+t.addSpell+'</button></form>'+
      (entries.length?'<div class="play-item-list">'+entries.map(x=>'<div class="play-item"><span><b>'+esc(x.name)+'</b><small>'+esc(x.level===0?'Cantrip':'Level '+x.level)+' · '+esc(t.localOnly)+'</small></span>'+button('game-spell-remove',t.remove,x.id)+'</div>').join('')+'</div>':'<p class="play-muted">'+t.spellNone+'</p>')+
      '<h3>'+t.spellSlot+'</h3><p class="play-muted">'+t.spellLimit+'</p>'+
      '<div class="play-slots">'+Array.from({length:9},(_,i)=>{const k=String(i+1),slot=g.spellSlots[k]||{total:0,used:0};return '<div class="play-slot"><span>Level '+k+'</span><label>'+t.maxSlots+'<input type="number" min="0" max="20" value="'+slot.total+'" data-game-slot="'+k+'"></label><b>'+slot.used+' / '+slot.total+' '+t.usedSlots+'</b>'+button('game-slot-use','−',k)+button('game-slot-restore','+',k)+'</div>';}).join('')+'</div></section>';
    }
    function equipment(){
      const owned=insights.contents(d,builder);
      const entries=[...owned.values()].map(row=>({id:row.id,name:builder.itemById.get(row.id)?.name||row.id,base:row.quantity,
        sources:row.sources.map(x=>x.label).join(' · '),category:builder.itemById.get(row.id)?.category||'adventuring'}))
      .concat((d.customItems||[]).map(x=>({id:x.id,name:x.name,base:x.quantity,sources:'Custom item',category:x.category})));
      return '<section class="play-pane"><h3>'+t.equipment+'</h3><p class="play-muted">'+t.inventoryInfo+'</p>'+
        '<div class="play-wallet">'+t.money+': <strong>'+esc(builder.gb(builder.wallet(d).remaining))+'</strong></div>'+
        (entries.length?'<div class="play-item-list">'+entries.map(row=>{const left=remainingItem(row.base,g.inventoryUsed[row.id]);
          return '<div class="play-item"><span><b>'+esc(row.name)+'</b><small>'+esc(row.sources)+' · '+esc(row.category)+'</small></span><div class="play-item-count">'+button('game-item-use','−',row.id,left?'':'disabled')+' <strong>'+left+' / '+row.base+'</strong> '+button('game-item-restore','+',row.id,left===row.base?'disabled':'')+'</div></div>';}).join('')+'</div>':'<p class="play-muted">'+t.inventoryEmpty+'</p>')+
        '<div class="play-equipment-controls"><label>'+t.armor+'<select id="play-worn-armor"><option value="">'+t.unarmored+'</option>'+CHAR.ownedArmor(d,builder,insights).map(x=>'<option value="'+esc(x.id)+'" '+(d.equippedArmor===x.id?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></label><label><input type="checkbox" id="play-shield" '+(d.shieldEquipped?'checked':'')+' '+(!owned.has('shield')?'disabled':'')+'> '+t.shield+'</label></div></section>';
    }
    function features(){
      const speciesTraits=(window.ATLAS_V2_IDENTITY_V2.traitCopy[d.species]||[]).map(([label,en,el])=>'<details class="play-action-description" open><summary>'+esc(label)+'</summary><p>'+esc(l==='el'?el:en)+'</p></details>').join('');
      const feat=builder.backgroundInfo(d.background)?.feat;
      const feats=[feat&&'<div class="play-feature"><b>'+esc(feat.name)+'</b><p>'+esc(ORIGIN.FEATS[feat.id]?.[l]||'')+'</p></div>',
        d.humanFeat&&'<div class="play-feature"><b>Human · Versatile: '+esc(ORIGIN.FEATS[d.humanFeat]?.name||d.humanFeat)+'</b><p>'+esc(ORIGIN.FEATS[d.humanFeat]?.[l]||'')+'</p></div>',
        d.humanSkill&&'<div class="play-feature"><b>Human · Skillful</b><p>'+esc(d.humanSkill.replace('skill-',''))+'</p></div>',
        d.fightingStyle&&'<div class="play-feature"><b>Fighting Style · '+esc(d.fightingStyle)+'</b></div>'].filter(Boolean).join('');
      return '<div class="play-columns"><section class="play-pane"><h3>'+t.features+'</h3><p class="play-muted">'+t.traitsHint+'</p>'+feats+
      '<h3>Species Traits</h3>'+speciesTraits+'</section><section class="play-pane"><h3>'+t.actionsTitle+'</h3>'+attacks()+'</section></div>';
    }
    function description(){
      const alignment=CHAR.ALIGNMENTS.find(x=>x[0]===d.alignment);
      return '<section class="play-pane"><h3>'+t.description+'</h3><div class="play-facts"><div><small>'+t.alignment+'</small><b>'+esc(alignment?.[l==='el'?2:1]||'—')+'</b></div><div><small>'+t.background+'</small><b>'+esc(bg)+'</b></div></div>'+
        '<h3>'+t.story+'</h3><p class="play-story">'+esc(d.backgroundStory||t.noStory)+'</p><p class="play-disclaimer">'+t.private+'</p>'+
        '<button class="btn secondary" data-action="navigate" data-view="builder">'+t.editBuilder+'</button></section>';
    }
    function notes(){
      return '<section class="play-pane"><h3>'+t.notes+'</h3><p class="play-muted">'+t.notesHelp+'</p><form id="play-notes-form"><label>'+t.notesLabel+'<textarea id="play-personal-notes" rows="12" maxlength="20000">'+esc(g.personalNotes||'')+'</textarea></label><button class="btn primary">'+t.saveNotes+'</button></form></section>';
    }
    const body=({overview,actions:combat,spells:spellbook,equipment,features,description,notes})[tab]||overview;
    return '<div class="page play-page"><header class="play-character"><div class="play-portrait">'+(avatar?'<img src="'+esc(avatar)+'" alt="">':'✧')+'</div><div><span class="eyebrow accent">D&D 5e · 2024 · '+esc(role==='dm'?t.dmMode:t.playerMode)+'</span><h1>'+esc(d.name||'Adventurer')+'</h1><p>'+esc(species)+' · '+esc(klass)+(subclassName?' · '+esc(subclassName):'')+' · '+esc(bg)+'</p><div class="play-tags"><span>'+t.level+' '+level+'</span><span>'+esc(status)+'</span></div></div><button class="btn quiet" data-action="navigate" data-view="builder">'+t.editBuilder+'</button></header>'+
      hud()+nav+body()+'<p class="play-disclaimer">'+t.localOnly+'</p></div>';
  }
  function journal({game,locale}) {
    const t=T[locale==='el'?'el':'en'];
    return '<div class="page play-page"><div class="section-lead"><span class="eyebrow accent">D&D Atlas · 2024</span><h1>'+t.journal+'</h1><p>'+t.journalHelp+'</p></div>'+
      '<div class="play-columns"><section class="play-pane"><form id="play-journal-form"><label>'+t.journalTitle+'<input name="title" required maxlength="120"></label><label>'+t.journalText+'<textarea name="body" rows="6" required maxlength="10000"></textarea></label>'+
      '<label>'+t.journalVisibility+'<select name="visibility"><option value="private">'+t.journalPrivate+'</option><option value="campaign">'+t.journalShared+'</option></select></label><button class="btn primary">'+t.addEntry+'</button></form></section>'+
      '<section class="play-pane"><h3>'+t.journal+'</h3>'+(game.journal.length?game.journal.slice().reverse().map(x=>'<article class="play-journal-entry"><div><small>'+esc(x.createdAt.slice(0,10))+' · '+esc(x.visibility)+'</small><h4>'+esc(x.title)+'</h4><p>'+esc(x.body)+'</p></div><button class="btn quiet" data-action="game-journal-remove" data-id="'+esc(x.id)+'">'+t.remove+'</button></article>').join(''):'<p class="play-muted">'+t.noEntries+'</p>')+'</section></div><p class="play-disclaimer">'+t.localOnly+'</p></div>';
  }
  window.ATLAS_V2_PLAY=Object.freeze({T,CONDITIONS,ACTIONS,defaults,normalize,adjust,remainingItem,render,journal});
})();