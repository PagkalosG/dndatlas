/* Atlas v2 — single-surface expandable identity cards, original EN/EL summaries.
 * Source facts are SRD 5.2.1 only; never imply access to locked PHB mechanics.
 */
(function(){
'use strict';
const T={
 en:{traits:'Traits',classFeatures:'Class at a glance',backgroundBenefits:'What you gain',hitDie:'Hit Die',saves:'Saving Throws',proficiencies:'Proficiencies',skills:'Choose skills',feat:'Origin Feat',ability:'Ability increases',equipment:'Starting packages',choose:'Choose',selected:'Selected',expand:'Details',collapse:'Hide details',locked:'This option needs an enabled, appropriately licensed content pack.',srd:'SRD 5.2.1'},
 el:{traits:'Χαρακτηριστικά (Traits)',classFeatures:'Η κλάση με μια ματιά',backgroundBenefits:'Τι προσφέρει',hitDie:'Ζάρι Ζωής',saves:'Σωτήριες Βολές',proficiencies:'Εξοικειώσεις',skills:'Επιλογή δεξιοτήτων',feat:'Ταλέντο Προέλευσης (Origin Feat)',ability:'Αυξήσεις χαρακτηριστικών',equipment:'Πακέτα αρχικού εξοπλισμού',choose:'Επιλογή',selected:'Επιλεγμένο',expand:'Λεπτομέρειες',collapse:'Απόκρυψη',locked:'Απαιτείται ενεργή βιβλιοθήκη περιεχομένου με κατάλληλη άδεια.',srd:'SRD 5.2.1'}
};
const traitCopy={
 human:[
 ['Resourceful','Resourceful: you begin with Heroic Inspiration after a Long Rest.','Ευρηματικότητα: αποκτάς Ηρωική Έμπνευση (Heroic Inspiration) μετά από Long Rest.'],
 ['Skillful','Skillful: gain proficiency in one skill of your choice.','Επιδεξιότητα: αποκτάς εξοικείωση (Proficiency) σε μία δεξιότητα της επιλογής σου.'],
 ['Versatile','Versatile: gain an additional Origin feat of your choice.','Ευελιξία: αποκτάς ένα επιπλέον Origin Feat της επιλογής σου.']
 ],
 elf:[
 ['Darkvision','See in darkness within the range provided by the species.','Βλέπεις στο σκοτάδι έως την απόσταση που ορίζει το Species.'],
 ['Elven Lineage','Choose an elven lineage, granting spells and other benefits at specified levels.','Επιλέγεις ξωτική καταγωγή (Lineage), που δίνει ξόρκια και άλλα οφέλη σε συγκεκριμένα levels.'],
 ['Fey Ancestry','You have an advantage against being Charmed.','Έχεις Advantage σε Saving Throws για να αποφύγεις ή να τερματίσεις την κατάσταση Charmed.'],
 ['Keen Senses','Gain a skill proficiency from the options provided by this trait.','Αποκτάς εξοικείωση σε μία από τις δεξιότητες που προσφέρει το trait.'],
 ['Trance','You can complete a Long Rest using your elven trance.','Μπορείς να ολοκληρώσεις Long Rest μέσω της ξωτικής έκστασης (Trance).']
 ],
 dwarf:[
 ['Darkvision','See in darkness within your species range.','Βλέπεις στο σκοτάδι έως την απόσταση του Species.'],
 ['Dwarven Resilience','You resist Poison damage and have an edge against being Poisoned.','Έχεις αντίσταση σε ζημιά Poison και πλεονέκτημα κατά της κατάστασης Poisoned.'],
 ['Dwarven Toughness','Your Hit Point maximum increases by one per level.','Το μέγιστο HP αυξάνεται κατά 1 για κάθε level.'],
 ['Stonecunning','Gain an enhanced sense for nearby stonework for limited uses.','Αντιλαμβάνεσαι καλύτερα γειτονική λιθοδομή με περιορισμένες χρήσεις.']
 ],
 halfling:[
 ['Brave','You have an advantage against the Frightened condition.','Έχεις Advantage απέναντι στην κατάσταση Frightened.'],
 ['Halfling Nimbleness','You can pass through spaces occupied by creatures larger than you.','Μπορείς να περνάς μέσα από χώρο που καταλαμβάνει μεγαλύτερο πλάσμα.'],
 ['Luck','When you roll a 1 on a D20 Test, you can reroll it.','Όταν φέρεις 1 σε D20 Test, μπορείς να ξαναρίξεις το ζάρι.'],
 ['Naturally Stealthy','You can hide when partially obscured by a larger creature.','Μπορείς να κρυφτείς όταν σε καλύπτει μεγαλύτερο πλάσμα.']
 ],
 dragonborn:[
 ['Draconic Ancestry','Choose a draconic ancestry that determines damage type.','Διαλέγεις δρακόνεια καταγωγή που καθορίζει τύπο ζημιάς.'],
 ['Breath Weapon','Replace an attack with an area breath effect, with level-based scaling.','Αντικαθιστάς μία επίθεση με δρακόνεια αναπνοή περιοχής, που βελτιώνεται με το level.'],
 ['Damage Resistance','Resist the damage type linked to your ancestry.','Έχεις αντίσταση στον τύπο ζημιάς της δρακόνειας καταγωγής σου.'],
 ['Darkvision','See in darkness within your species range.','Βλέπεις στο σκοτάδι έως την απόσταση του Species.']
 ],
 gnome:[
 ['Darkvision','See in darkness within your species range.','Βλέπεις στο σκοτάδι έως την απόσταση του Species.'],
 ['Gnomish Cunning','Gain an advantage on mental saving throws against magical effects.','Έχεις Advantage σε νοητικές Saving Throws έναντι μαγικών επιδράσεων.'],
 ['Gnomish Lineage','Choose a lineage granting distinct magical traits.','Επιλέγεις καταγωγή (Lineage) που προσφέρει διαφορετικές μαγικές ικανότητες.']
 ],
 goliath:[
 ['Giant Ancestry','Choose a giant heritage that grants a signature special effect.','Επιλέγεις γιγάντια καταγωγή που προσφέρει ξεχωριστή ικανότητα.'],
 ['Large Form','At a higher level, briefly grow larger for additional advantages.','Σε μεγαλύτερο level μπορείς προσωρινά να μεγαλώσεις και να αποκτήσεις οφέλη.'],
 ['Powerful Build','You can carry and move more weight than a similar-size creature.','Μπορείς να μεταφέρεις και να μετακινείς μεγαλύτερο βάρος.']
 ],
 orc:[
 ['Adrenaline Rush','Dash as a Bonus Action with temporary Hit Points on use.','Κάνεις Dash ως Bonus Action και αποκτάς προσωρινά HP.'],
 ['Darkvision','See in darkness within your species range.','Βλέπεις στο σκοτάδι έως την απόσταση του Species.'],
 ['Relentless Endurance','Once per Long Rest, avoid dropping unconscious when reduced to zero HP.','Μία φορά ανά Long Rest μπορείς να παραμείνεις στα 1 HP αντί να πέσεις στα 0.']
 ],
 tiefling:[
 ['Darkvision','See in darkness within your species range.','Βλέπεις στο σκοτάδι έως την απόσταση του Species.'],
 ['Fiendish Legacy','Choose a fiendish legacy with a damage resistance and spell progression.','Επιλέγεις δαιμονική καταγωγή με αντίσταση ζημιάς και ξόρκια σε επόμενα levels.'],
 ['Otherworldly Presence','You know the Thaumaturgy cantrip.','Γνωρίζεις το cantrip Thaumaturgy.']
 ]
};
const classCopy={
 barbarian:['Fight up close, channel Rage, and absorb punishment.','Μάχεσαι στην πρώτη γραμμή με Rage και μεγάλη αντοχή.'],
 bard:['Support the party with inspiration, skills, and flexible magic.','Υποστηρίζεις την ομάδα με έμπνευση, δεξιότητες και μαγεία.'],
 cleric:['Blend divine spells, healing, protection, and damage.','Συνδυάζεις θεϊκά ξόρκια, θεραπεία, προστασία και επίθεση.'],
 druid:['Use nature magic and shapeshifting to adapt to situations.','Αξιοποιείς τη μαγεία της φύσης και μεταμορφώσεις.'],
 fighter:['Master weapons, armor, and adaptable martial tactics.','Εξειδικεύεσαι στα όπλα, τις πανοπλίες και την τακτική της μάχης.'],
 monk:['Fight with mobility, discipline, and Focus-based techniques.','Πολεμάς με κινητικότητα, πειθαρχία και τεχνικές Focus.'],
 paladin:['Combine frontline combat, protective abilities, and sacred magic.','Συνδυάζεις μάχη στην πρώτη γραμμή, προστασία και ιερή μαγεία.'],
 ranger:['Explore, track enemies, use weapons and nature-themed spells.','Εξερευνάς, εντοπίζεις εχθρούς και συνδυάζεις όπλα με ξόρκια.'],
 rogue:['Use stealth, skills, and precise Sneak Attacks.','Χρησιμοποιείς Stealth, δεξιότητες και στοχευμένες Sneak Attacks.'],
 sorcerer:['Shape innate magic using a limited selection of flexible spells.','Διαμορφώνεις έμφυτη μαγεία με εξειδικευμένα ξόρκια.'],
 warlock:['Wield pact magic and customize your abilities through Invocations.','Αποκτάς μαγεία μέσω συμφώνου και επιλογές Invocations.'],
 wizard:['Study a broad spellbook and prepare solutions for many encounters.','Μελετάς μεγάλο spellbook και προετοιμάζεις ξόρκια για διαφορετικές περιστάσεις.']
};
const positions=window.ATLAS_V2_IDENTITY?.positions||{};
function portrait(item,esc){
 const pos=positions[item.id];
 const background=pos?`background-image:url('assets/portraits/species-grid.webp');background-size:300% 300%;background-position:${pos[0]*50}% ${pos[1]*50}%`:'';
 return `<div class="identity-v2-photo ${pos?'has-photo':''}" style="${esc(background)}"><img src="${esc(item.art||'')}" loading="lazy" decoding="async" alt=""></div>`;
}
const compact=(str,max=480)=>String(str||'').slice(0,max);
function renderCard({item,group,selected,expanded,locale,esc,sourceClass,sourceBackground}){
 const lang=locale==='el'?'el':'en',t=T[lang],name=item.title?.[lang]||item.title?.en||item.id;
 const introduction=group==='classes'?classCopy[item.id]?.[lang==='el'?1:0]:
   group==='species'?window.ATLAS_V2_IDENTITY?.descriptions?.species?.[item.id]?.[lang==='el'?1:0]:null;
 const summary=compact(introduction||item.description?.[lang]||'');
 const cl=group==='classes'?sourceClass?.(item.id):null;
 const bg=group==='backgrounds'?sourceBackground?.(item.id):null;
 const traits=group==='species'?(traitCopy[item.id]||[]):[];
 const cFacts=cl?[[t.hitDie,'d'+cl.hitDie],[t.saves,(cl.savingThrows||[]).map(x=>x.name).join(', ')],[t.proficiencies,(cl.proficiencies||[]).filter(x=>!x.id.startsWith('saving-throw-')).map(x=>x.name).join(', ')],[t.skills,(cl.skillChoices||[]).map(x=>x.count+' / '+x.options.map(o=>o.name).join(', ')).join('; ')]]:[];
 const bgFacts=bg?[[t.feat,bg.feat?.name||'—'],[t.proficiencies,(bg.proficiencies||[]).map(x=>x.name).join(', ')],[t.ability,(bg.abilityScores||[]).map(x=>x.name).join(', ')],[t.equipment,String(bg.startingOptions?.length||0)]]:[];
 const facts=cl?cFacts:bgFacts;
 return `<article class="identity-v2-card ${expanded?'expanded':''} ${selected?'selected':''}" data-option-card data-available="${!!item.licensed}" data-search="${esc((name+' '+item.title?.en+' '+item.title?.el).toLowerCase())}">
   <div class="identity-v2-main">
     ${portrait(item,esc)}
     <div class="identity-v2-heading"><strong>${esc(name)}</strong><p>${esc(summary)}</p><span class="identity-v2-source">${esc(item.source||'')}</span></div>
     <button type="button" class="identity-v2-expand" data-action="expand-option" data-kind="${esc(group)}" data-id="${esc(item.id)}" aria-expanded="${expanded}" aria-label="${esc((expanded?t.collapse:t.expand)+' '+name)}"><span aria-hidden="true">${expanded?'−':'+'}</span></button>
   </div>
   <div class="identity-v2-reveal" aria-hidden="${!expanded}"><div class="identity-v2-reveal-inner">
     ${traits.length?`<div class="identity-v2-traits"><h4>${esc(t.traits)}</h4>${traits.map(([label,en,el])=>`<div class="identity-v2-trait"><strong>${esc(label)}</strong><p>${esc(lang==='el'?el:en)}</p></div>`).join('')}</div>`:''}
     ${group==='classes'?`<div class="identity-v2-traits"><h4>${esc(t.classFeatures)}</h4><p>${esc(summary)}</p></div>`:''}
     ${group==='backgrounds'?`<div class="identity-v2-traits"><h4>${esc(t.backgroundBenefits)}</h4><p>${esc(summary)}</p></div>`:''}
     ${facts.length?`<dl class="identity-v2-facts">${facts.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v||'—')}</dd></div>`).join('')}</dl>`:''}
     ${item.licensed?`<button type="button" class="btn ${selected?'secondary':'primary'}" data-action="choose" data-kind="${esc(group)}" data-id="${esc(item.id)}" aria-pressed="${selected}">${selected?'✓ '+esc(t.selected):esc(t.choose)}</button>`:`<p class="identity-locked">${esc(t.locked)}</p>`}
   </div></div>
 </article>`;
}
window.ATLAS_V2_IDENTITY_V2=Object.freeze({renderCard,traitCopy,classCopy});
})();
