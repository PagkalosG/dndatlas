/* D&D Atlas v2: character identity, homebrew inventory, and complete review UI.
 * Browser-only previews. No upload, cloud synchronization, or authorization.
 * Unknown class features/spellcasting are shown as unresolved, never invented.
 */
(function(){
'use strict';
const ABILITIES=['str','dex','con','int','wis','cha'];
const ALIGNMENTS=[
 ['lawful-good','Lawful Good','Νόμιμος Καλός'],['neutral-good','Neutral Good','Ουδέτερος Καλός'],
 ['chaotic-good','Chaotic Good','Χαοτικός Καλός'],['lawful-neutral','Lawful Neutral','Νόμιμος Ουδέτερος'],
 ['true-neutral','True Neutral','Αληθινά Ουδέτερος'],['chaotic-neutral','Chaotic Neutral','Χαοτικός Ουδέτερος'],
 ['lawful-evil','Lawful Evil','Νόμιμος Κακός'],['neutral-evil','Neutral Evil','Ουδέτερος Κακός'],
 ['chaotic-evil','Chaotic Evil','Χαοτικός Κακός']
];
const TEXT={
en:{profile:'Character identity & background story',profileHint:'Customize your character before final review. Artwork stays on this device in the current prototype.',alignment:'Alignment',unspecified:'Choose alignment',story:'Background story',storyHint:'Write your own character history. This is distinct from the mechanical Background option.',portrait:'Character portrait',portraitHint:'PNG, JPEG or WebP; up to 900 KB. Stored in this browser session, never uploaded.',imageEmpty:'No portrait uploaded',customItem:'Create a custom item',customName:'Item name',customCategory:'Category',customQuantity:'Quantity',customWeight:'Weight (lb)',customCost:'Price (GP)',customDescription:'Description / use',customNotice:'Custom entries add inventory records, not unvalidated combat or magical rules.',addItem:'Add to inventory',remove:'Remove',customItems:'Custom items',abilities:'Ability scores',derived:'Combat & derived stats',hp:'Base HP (fixed progression)',hpHelp:'Before feats or unmodeled class features',ac:'Armor Class',armor:'Worn armor',unarmored:'Unarmored',shield:'Equip shield',initiative:'Initiative',speed:'Speed',speedUnknown:'Not resolved',proficiency:'Proficiency Bonus',savingThrows:'Saving throws',skills:'Skills',prof:'Proficient',notProf:'Not proficient',feats:'Feats & features',equipment:'Inventory and starting equipment',gold:'Unspent gold',weapons:'Weapon masteries',styles:'Fighting Style',spells:'Spells & spell slots',spellsUnknown:'Spell preparation, granted spells and slots are not yet modeled for this class. Do not treat this section as a complete spellbook.',conditions:'Conditions',conditionsNone:'None recorded',notes:'Character story',rulesNotice:'Calculated preview from selected SRD fields. Unmodeled class features, species choices, magic and equipment effects require the later Rules Engine.',source:'Source',class:'Class',background:'Background',custom:'Custom',quantity:'Quantity',armorNotOwned:'Only owned armor can be equipped',private:'Private story: Player + DM (future server enforcement)'},
el:{profile:'Ταυτότητα & ιστορικό χαρακτήρα',profileHint:'Διαμόρφωσε τον χαρακτήρα πριν από τον τελικό έλεγχο. Η εικόνα παραμένει σε αυτή τη συσκευή στο τρέχον prototype.',alignment:'Ηθική στάση (Alignment)',unspecified:'Επιλογή στάσης',story:'Προσωπικό ιστορικό',storyHint:'Γράψε την ιστορία του χαρακτήρα σου. Διαφέρει από το μηχανικό Background.',portrait:'Πορτρέτο χαρακτήρα',portraitHint:'PNG, JPEG ή WebP, έως 900 KB. Αποθηκεύεται μόνο σε αυτή τη συνεδρία browser.',imageEmpty:'Δεν έχει προστεθεί πορτρέτο',customItem:'Προσθήκη custom αντικειμένου',customName:'Όνομα αντικειμένου',customCategory:'Κατηγορία',customQuantity:'Ποσότητα',customWeight:'Βάρος (lb)',customCost:'Τιμή (GP)',customDescription:'Περιγραφή / χρήση',customNotice:'Τα custom αντικείμενα προστίθενται στο Inventory χωρίς να ενεργοποιούν ανεπιβεβαίωτους κανόνες μάχης ή μαγείας.',addItem:'Προσθήκη στο Inventory',remove:'Αφαίρεση',customItems:'Custom αντικείμενα',abilities:'Χαρακτηριστικά (Abilities)',derived:'Μάχη & υπολογισμένα στατιστικά',hp:'Βασικά HP (σταθερή αύξηση)',hpHelp:'Χωρίς feats ή class features που δεν έχουν υλοποιηθεί',ac:'Κλάση πανοπλίας (AC)',armor:'Φορεμένη πανοπλία',unarmored:'Χωρίς πανοπλία',shield:'Εξοπλισμένη ασπίδα',initiative:'Πρωτοβουλία',speed:'Ταχύτητα',speedUnknown:'Δεν υπολογίζεται ακόμη',proficiency:'Μπόνους Εξοικείωσης',savingThrows:'Σωτήριες Βολές',skills:'Δεξιότητες (Skills)',prof:'Με εξοικείωση',notProf:'Χωρίς εξοικείωση',feats:'Feats & Features',equipment:'Inventory & αρχικός εξοπλισμός',gold:'Χρήματα που απομένουν',weapons:'Weapon Masteries',styles:'Fighting Style',spells:'Ξόρκια & θέσεις ξορκιών',spellsUnknown:'Η προετοιμασία, τα επιπλέον ξόρκια και τα spell slots δεν έχουν ακόμη υπολογιστεί πλήρως για την κλάση. Αυτή η ενότητα δεν αποτελεί πλήρες spellbook.',conditions:'Καταστάσεις (Conditions)',conditionsNone:'Δεν έχουν καταγραφεί',notes:'Ιστορικό χαρακτήρα',rulesNotice:'Προεπισκόπηση από τα διαθέσιμα SRD στοιχεία. Class features, επιλογές Species, μαγεία και ειδικά equipment effects θα συνδεθούν με τον ολοκληρωμένο Rules Engine.',source:'Πηγή',class:'Κλάση',background:'Προέλευση',custom:'Custom',quantity:'Ποσότητα',armorNotOwned:'Επιτρέπεται μόνο πανοπλία που υπάρχει στο Inventory',private:'Ιδιωτικό ιστορικό: Παίκτης + DM (μελλοντικός server-side έλεγχος)'}
};
const CATEGORIES=[['weapons','Weapons','Όπλα'],['armor','Armor & shields','Πανοπλίες & ασπίδες'],['adventuring','Adventuring gear','Εξοπλισμός'],['consumables','Consumables','Αναλώσιμα'],['tools','Tools','Εργαλεία'],['packs','Packs','Πακέτα'],['magic','Magic / special','Μαγικά / ειδικά']];
const SKILLS=[
 ['acrobatics','dex','Acrobatics','Ακροβατικά'],['animal-handling','wis','Animal Handling','Χειρισμός ζώων'],
 ['arcana','int','Arcana','Απόκρυφη γνώση'],['athletics','str','Athletics','Αθλητισμός'],
 ['deception','cha','Deception','Εξαπάτηση'],['history','int','History','Ιστορία'],
 ['insight','wis','Insight','Διορατικότητα'],['intimidation','cha','Intimidation','Εκφοβισμός'],
 ['investigation','int','Investigation','Έρευνα'],['medicine','wis','Medicine','Ιατρική'],
 ['nature','int','Nature','Φύση'],['perception','wis','Perception','Αντίληψη'],
 ['performance','cha','Performance','Παράσταση'],['persuasion','cha','Persuasion','Πειθώ'],
 ['religion','int','Religion','Θρησκεία'],['sleight-of-hand','dex','Sleight of Hand','Ταχυδακτυλουργία'],
 ['stealth','dex','Stealth','Απόκρυψη'],['survival','wis','Survival','Επιβίωση']
];
const esc=(v)=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const sign=(n)=>n>=0?'+'+n:String(n);
const textFor=(lang)=>TEXT[lang==='el'?'el':'en'];
function normalizeCustom(raw){
 const name=String(raw.name||'').trim().slice(0,100);
 const category=String(raw.category||'adventuring');
 const amount=Number(raw.cost),weight=Number(raw.weight),quantity=Number(raw.quantity);
 if(!name||!CATEGORIES.some(x=>x[0]===category)||!Number.isInteger(quantity)||quantity<1||quantity>999||
 !Number.isFinite(amount)||amount<0||amount>100000||!Number.isFinite(weight)||weight<0||weight>5000)return null;
 return {id:'custom-'+Date.now()+'-'+Math.floor(Math.random()*1000000),name,category,quantity,costGp:amount,weight,description:String(raw.description||'').trim().slice(0,1000)};
}
function ownedArmor(d,builder,insights){
 const all=insights.contents(d,builder);
 return [...all.values()].map(row=>builder.itemById.get(row.id))
   .filter(item=>item&&item.category==='armor'&&item.id!=='shield'&&item.armorClass&&Number.isFinite(item.armorClass.base));
}
function derived(d,builder,insights,level){
 const ability=Object.fromEntries(ABILITIES.map(k=>[k,insights.score(d,k,builder.bonusFor)]));
 const cl=builder.classInfo(d.class),pb=2+Math.floor((level-1)/4);
 const hp=cl?Math.max(1,cl.hitDie+ability.con.modifier)+Math.max(0,level-1)*Math.max(1,Math.floor(cl.hitDie/2)+1+ability.con.modifier):null;
 const owned=ownedArmor(d,builder,insights);
 const armor=owned.find(x=>x.id===d.equippedArmor);
 const ac=(armor?armor.armorClass.base+(armor.armorClass.dex_bonus?Math.min(ability.dex.modifier,armor.armorClass.max_bonus??100):0):10+ability.dex.modifier)+ (d.shieldEquipped&&insights.contents(d,builder).has('shield')?2:0);
 return {ability,pb,hp,ac,armor,owned,initiative:ability.dex.modifier,grants:insights.grants(d,cl,builder.backgroundInfo(d.background))};
}
function profile({draft,locale,esc:escape=esc}){
 const t=textFor(locale),lang=locale==='el'?'el':'en';
 return `<section class="character-profile">
 <h3>${escape(t.profile)}</h3><p class="character-muted">${escape(t.profileHint)}</p>
 <div class="profile-fields"><div class="profile-photo">${draft.portraitData?`<img src="${escape(draft.portraitData)}" alt="">`:`<span>${escape(t.imageEmpty)}</span>`}</div>
 <div class="profile-controls"><label class="form-field"><span>${escape(t.portrait)}</span><input id="character-portrait" type="file" accept="image/png,image/jpeg,image/webp"><small>${escape(t.portraitHint)}</small></label>
 <label class="form-field"><span>${escape(t.alignment)}</span><select id="character-alignment"><option value="">${escape(t.unspecified)}</option>${ALIGNMENTS.map(([id,en,el])=>`<option value="${id}" ${draft.alignment===id?'selected':''}>${escape(lang==='el'?el+' ('+en+')':en)}</option>`).join('')}</select></label></div></div>
 <label class="form-field"><span>${escape(t.story)}</span><textarea id="character-story" rows="6" maxlength="10000" placeholder="${escape(t.storyHint)}">${escape(draft.backgroundStory||'')}</textarea><small>${escape(t.private)}</small></label></section>`;
}
function customInventory({draft,locale,esc:escape=esc}){
 const t=textFor(locale),lang=locale==='el'?'el':'en';
 return `<section class="custom-inventory"><h3>${escape(t.customItem)}</h3><p class="character-muted">${escape(t.customNotice)}</p>
 <form id="custom-item-form" class="custom-item-grid">
 <label><span>${escape(t.customName)} *</span><input name="name" required maxlength="100"></label>
 <label><span>${escape(t.customCategory)}</span><select name="category">${CATEGORIES.map(([id,en,el])=>`<option value="${id}">${escape(lang==='el'?el:en)}</option>`).join('')}</select></label>
 <label><span>${escape(t.customQuantity)}</span><input type="number" name="quantity" min="1" max="999" value="1" required></label>
 <label><span>${escape(t.customWeight)}</span><input type="number" name="weight" min="0" max="5000" step="0.1" value="0"></label>
 <label><span>${escape(t.customCost)}</span><input type="number" name="cost" min="0" max="100000" step="0.01" value="0"></label>
 <label class="wide"><span>${escape(t.customDescription)}</span><textarea name="description" rows="2" maxlength="1000"></textarea></label>
 <button type="submit" class="btn primary">${escape(t.addItem)}</button></form>
 ${(draft.customItems||[]).length?`<div class="custom-item-added"><h4>${escape(t.customItems)}</h4>${draft.customItems.map(item=>`<div class="custom-item-row"><span><b>${escape(item.name)}</b> ×${item.quantity}<small>${escape(item.description||'')}</small></span><button type="button" class="btn quiet" data-action="remove-custom-item" data-id="${escape(item.id)}">${escape(t.remove)}</button></div>`).join('')}</div>`:''}</section>`;
}
function review({draft,locale,builder,insights,level=1,selectedSpecies,selectedClass,selectedBackground,selectedSubclass,editIdentity}){
 const t=textFor(locale),lang=locale==='el'?'el':'en',d=draft;
 const summary=derived(d,builder,insights,level);
 const bg=builder.backgroundInfo(d.background),cl=builder.classInfo(d.class),grants=summary.grants;
 const proficient=new Set(grants.map(x=>x.id));
 const saveProfs=new Set((cl?.savingThrows||[]).map(x=>x.id));
 const skillNames=Object.fromEntries(SKILLS.map(([id,a,en,el])=>[id,lang==='el'?el+' ('+en+')':en]));
 const skillRows=SKILLS.map(([id,ability])=>{
  const prof=proficient.has('skill-'+id);
  const score=summary.ability[ability].modifier+(prof?summary.pb:0);
  return `<div class="sheet-skill ${prof?'is-proficient':''}"><span>${prof?'●':'○'} ${esc(skillNames[id])}</span><b>${sign(score)}</b></div>`;
 }).join('');
 const saveRows=ABILITIES.map(id=>{
  const score=summary.ability[id].modifier+(saveProfs.has(id)?summary.pb:0);
  return `<div class="sheet-skill ${saveProfs.has(id)?'is-proficient':''}"><span>${saveProfs.has(id)?'●':'○'} ${id.toUpperCase()}</span><b>${sign(score)}</b></div>`;
 }).join('');
 const wallet=builder.wallet(d),owned=insights.contents(d,builder);
 const armorOptions=summary.owned.map(x=>`<option value="${esc(x.id)}" ${d.equippedArmor===x.id?'selected':''}>${esc(x.name)}</option>`).join('');
 const items=[...owned.values()].map(row=>{
  const item=builder.itemById.get(row.id);
  const provenance=row.sources.map(s=>s.label).join(', ');
  return `<div class="sheet-equipment-row"><strong>${esc(item?.name||row.id)}</strong><span>×${row.quantity}</span><small>${esc(provenance)}</small></div>`;
 }).join('');
 const customs=(d.customItems||[]).map(item=>`<div class="sheet-equipment-row"><strong>${esc(item.name)}</strong><span>×${item.quantity}</span><small>${esc(t.custom)} · ${esc(item.description||'')}</small></div>`).join('');
 const abilityRows=ABILITIES.map(id=>{const s=summary.ability[id];return `<div class="sheet-ability"><span>${id.toUpperCase()}</span><strong>${s.total}</strong><b>${sign(s.modifier)}</b><small>${s.base} + ${s.bonus}</small></div>`;}).join('');
 const features=[...(bg?.feat?[t.background+': '+bg.feat.name]:[]),...(d.fightingStyle?[t.styles+': '+d.fightingStyle]:[]),
  ...(d.weaponMasteries?.length?[t.weapons+': '+d.weaponMasteries.join(', ')]:[])];
 const photo=d.portraitData&&/^data:image\/(png|jpeg|webp);base64,/.test(d.portraitData)?`<img src="${esc(d.portraitData)}" alt="">`:'';
 return `<div class="full-sheet-review">
 <header class="sheet-review-header"><div class="sheet-review-photo">${photo||'<span>✧</span>'}</div><div><h2>${esc(d.name.trim()||'Unnamed Adventurer')}</h2><p>${esc(selectedSpecies||'—')} · ${esc(selectedClass||'—')}${selectedSubclass?' · '+esc(selectedSubclass):''} · ${esc(selectedBackground||'—')}</p><p>${esc(ALIGNMENTS.find(a=>a[0]===d.alignment)?.[lang==='el'?2:1]||'—')} · Level ${level}</p></div></header>
 <section class="sheet-section"><h3>${esc(t.abilities)}</h3><div class="sheet-abilities">${abilityRows}</div></section>
 <section class="sheet-section"><h3>${esc(t.derived)}</h3>
 <div class="sheet-stat-list"><div><small>${esc(t.hp)}</small><strong>${summary.hp??'—'}</strong><small>${esc(t.hpHelp)}</small></div>
 <div><small>${esc(t.ac)}</small><strong>${summary.ac}</strong><small>${esc(summary.armor?.name||t.unarmored)}</small></div>
 <div><small>${esc(t.initiative)}</small><strong>${sign(summary.initiative)}</strong></div>
 <div><small>${esc(t.proficiency)}</small><strong>+${summary.pb}</strong></div>
 <div><small>${esc(t.speed)}</small><strong>—</strong><small>${esc(t.speedUnknown)}</small></div>
 <div><small>${esc(t.gold)}</small><strong>${esc(builder.gb(wallet.remaining))}</strong></div></div>
 <div class="sheet-armor-controls"><label>${esc(t.armor)}<select id="review-worn-armor"><option value="">${esc(t.unarmored)}</option>${armorOptions}</select></label>
 <label class="sheet-shield-label"><input type="checkbox" id="review-shield" ${d.shieldEquipped?'checked':''} ${!owned.has('shield')?'disabled':''}> ${esc(t.shield)}</label></div>
 </section>
 <div class="sheet-columns"><section class="sheet-section"><h3>${esc(t.savingThrows)}</h3><div class="sheet-skill-list">${saveRows}</div></section>
 <section class="sheet-section"><h3>${esc(t.skills)}</h3><div class="sheet-skill-list">${skillRows}</div></section></div>
 <section class="sheet-section"><h3>${esc(t.feats)}</h3><div class="sheet-features">${features.map(v=>`<div>${esc(v)}</div>`).join('')||'—'}</div></section>
 <section class="sheet-section"><h3>${esc(t.equipment)}</h3><div class="sheet-equipment-grid">${items}${customs}</div></section>
 <section class="sheet-section"><h3>${esc(t.spells)}</h3><p class="character-muted">${esc(t.spellsUnknown)}</p></section>
 <section class="sheet-section"><h3>${esc(t.conditions)}</h3><p class="character-muted">${esc(t.conditionsNone)}</p></section>
 <section class="sheet-section"><h3>${esc(t.notes)}</h3><p class="character-story">${esc(d.backgroundStory||'—')}</p><small>${esc(t.private)}</small></section>
 <p class="sheet-validation-note">${esc(t.rulesNotice)}</p></div>`;
}
window.ATLAS_V2_CHARACTER_SHEET=Object.freeze({TEXT,ALIGNMENTS,SKILLS,normalizeCustom,ownedArmor,derived,profile,customInventory,review});
})();
