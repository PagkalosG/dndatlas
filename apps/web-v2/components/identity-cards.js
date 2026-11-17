/* Expandable, bilingual 2024 Species/Class discovery cards.
 * Original summary copy; SRD trait names; no proprietary book text or scripts.
 * The optional photoreal sprite is original artwork, with SVG fallbacks.
 */
(function(){
'use strict';
const descriptions={
 species:{
 human:["Adaptable adventurers who can make nearly any approach their own.","Προσαρμοστικοί τυχοδιώκτες που μπορούν να ακολουθήσουν σχεδόν κάθε δρόμο.",["Resourceful","Skillful","Versatile"]],
 elf:["Long-lived explorers with keen awareness and magical lineages.","Μακρόβιοι εξερευνητές με οξυμένες αισθήσεις και μαγικές καταγωγές.",["Darkvision","Elven Lineage","Fey Ancestry","Keen Senses","Trance"]],
 dwarf:["Steadfast adventurers who value resilience and a bond with stone.","Σταθεροί και ανθεκτικοί ήρωες με βαθιά σύνδεση με την πέτρα.",["Darkvision","Dwarven Resilience","Dwarven Toughness","Stonecunning"]],
 halfling:["Small but brave and resourceful, with luck on their side.","Μικρόσωμοι αλλά θαρραλέοι, ευρηματικοί και τυχεροί.",["Brave","Halfling Nimbleness","Luck","Naturally Stealthy"]],
 dragonborn:["Draconic heritage provides a breath weapon and elemental identity.","Δρακόνεια κληρονομιά με επίθεση αναπνοής και στοιχειακές ιδιότητες.",["Draconic Ancestry","Breath Weapon","Damage Resistance","Darkvision"]],
 gnome:["Curious thinkers with clever minds and a distinct magical lineage.","Ευρηματικοί στοχαστές με ξεχωριστή μαγική κληρονομιά.",["Darkvision","Gnomish Cunning","Gnomish Lineage"]],
 goliath:["Descendants of giants who draw on impressive physical heritage.","Απόγονοι γιγάντων με εντυπωσιακή σωματική κληρονομιά.",["Giant Ancestry","Large Form","Powerful Build"]],
 orc:["Determined survivors combining endurance and forward momentum.","Αποφασιστικοί επιζώντες που συνδυάζουν αντοχή και ορμή.",["Adrenaline Rush","Darkvision","Relentless Endurance"]],
 tiefling:["An otherworldly lineage shapes magic and distinctive resistances.","Εξωκοσμική καταγωγή που καθορίζει ιδιαίτερη μαγεία και αντιστάσεις.",["Darkvision","Fiendish Legacy","Otherworldly Presence"]],
 aasimar:["A celestial-themed option outside this SRD-only library.","Ουράνια καταγωγή εκτός αυτής της βιβλιοθήκης SRD.",[]]
 },
 classes:{
 barbarian:["Physical power, resilience and aggressive martial play.","Δύναμη, αντοχή και επιθετική μάχη."],
 bard:["Magic and inspiration, with a versatile supporting role.","Μαγεία και έμπνευση με ευέλικτη υποστηρικτική δράση."],
 cleric:["Divine spellcasting for healing, protection and offense.","Θεϊκή μαγεία για θεραπεία, προστασία και επίθεση."],
 druid:["Nature magic, transformation and control over the battlefield.","Φυσική μαγεία, μεταμορφώσεις και έλεγχος πεδίου."],
 fighter:["Weapons, armor and tactical choices, from simple to complex builds.","Όπλα, πανοπλίες και τακτικές επιλογές για ποικίλους χαρακτήρες."],
 monk:["Martial precision, mobility and careful resource management.","Μαχητική ακρίβεια, ταχύτητα και διαχείριση πόρων."],
 paladin:["Protect allies with martial training and divine power.","Προστασία συμμάχων με μαχητική εκπαίδευση και θεϊκή δύναμη."],
 ranger:["Exploration, weapon combat and helpful magic.","Εξερεύνηση, μάχη με όπλα και υποστηρικτική μαγεία."],
 rogue:["Skills, positioning and carefully timed attacks.","Δεξιότητες, τοποθέτηση και επιθέσεις την κατάλληλη στιγμή."],
 sorcerer:["Innate arcane spellcasting, specialized magical power.","Έμφυτη μαγεία με εξειδικευμένες μαγικές δυνατότητες."],
 warlock:["Unusual magical abilities and meaningful pact choices.","Ξεχωριστές μαγικές δυνάμεις και σημαντικές επιλογές συμφώνου."],
 wizard:["Broad arcane knowledge and strategic spell preparation.","Ευρεία μαγική γνώση και στρατηγική προετοιμασία ξορκιών."]
 }
};
const labels={
 en:{overview:"What is it?",traits:"2024 traits",facts:"Class essentials",hit:"Hit Die",saves:"Saving throws",automatic:"Automatic proficiencies",choose:"Select",selected:"Selected",expand:"Explore",close:"Collapse",locked:"Not available in enabled SRD content",rules:"Original summary; SRD 5.2.1 trait names and class facts. Full rules validation is not implemented."},
 el:{overview:"Τι είναι;",traits:"Χαρακτηριστικά 2024",facts:"Στοιχεία κλάσης",hit:"Ζάρι ζωής",saves:"Σωτήριες βολές",automatic:"Αυτόματες εξοικειώσεις",choose:"Επιλογή",selected:"Επιλεγμένο",expand:"Περισσότερα",close:"Σύμπτυξη",locked:"Δεν είναι διαθέσιμο στην ενεργή βιβλιοθήκη SRD",rules:"Πρωτότυπη περίληψη· ονόματα traits και στοιχεία κλάσης από το SRD 5.2.1. Δεν αποτελεί πλήρη έλεγχο κανόνων."}
};
const positions={human:[0,0],elf:[1,0],dwarf:[2,0],halfling:[0,1],dragonborn:[1,1],gnome:[2,1],goliath:[0,2],orc:[1,2],tiefling:[2,2],
 barbarian:[0,2],bard:[0,1],cleric:[2,0],druid:[1,0],fighter:[0,0],monk:[1,2],paladin:[2,0],ranger:[1,0],rogue:[0,1],sorcerer:[2,2],warlock:[2,2],wizard:[2,1]};
function initPhotos(){
 if(typeof Image==='undefined'||typeof document==='undefined')return;
 const test=new Image();
 test.addEventListener('load',()=>document.documentElement.classList.add('atlas-photo-ready'));
 test.src='assets/portraits/species-grid.webp';
}
function portrait(item,esc){
 const pos=positions[item.id], style=pos?`background-image:url('assets/portraits/species-grid.webp');background-size:300% 300%;background-position:${pos[0]*50}% ${pos[1]*50}%`:'';
 return `<div class="identity-portrait ${pos?'has-portrait':''}" style="${esc(style)}"><img loading="lazy" decoding="async" src="${esc(item.art)}" alt=""></div>`;
}
function renderCard({item,group,selected,expanded,locale,esc,sourceClass}){
 const l=labels[locale==='el'?'el':'en'],info=descriptions[group]?.[item.id]||[],name=item.title?.[locale]||item.title?.en||item.id;
 const desc=info[locale==='el'?1:0]||item.description?.[locale]||'';
 const c=group==='classes'?sourceClass?.(item.id):null;
 const details=c?[[l.hit,'d'+c.hitDie],[l.saves,(c.savingThrows||[]).map(x=>x.name).join(', ')],
 [l.automatic,(c.proficiencies||[]).filter(x=>!x.id.startsWith('saving-throw-')).map(x=>x.name).join(', ')]]:[];
 const traits=group==='species'?(info[2]||[]):[];
 return `<article class="identity-card ${expanded?'expanded':''} ${selected?'selected':''}" data-option-card data-available="${!!item.licensed}" data-search="${esc((name+' '+item.title?.en+' '+item.title?.el).toLowerCase())}">
  <button type="button" class="identity-toggle" data-action="expand-option" data-kind="${esc(group)}" data-id="${esc(item.id)}" aria-expanded="${expanded}" aria-label="${esc((expanded?l.close:l.expand)+' '+name)}">
   ${portrait(item,esc)}<span><strong>${esc(name)}</strong><small>${esc(item.description?.[locale]||'')}</small></span><b aria-hidden="true">${expanded?'−':'+'}</b>
  </button>
  ${expanded?`<div class="identity-details"><div class="identity-hero">${portrait(item,esc)}<section><h3>${esc(l.overview)}</h3><p>${esc(desc)}</p></section></div>
   ${traits.length?`<section class="identity-traits"><h4>${esc(l.traits)}</h4><ul>${traits.map(v=>`<li>${esc(v)}</li>`).join('')}</ul></section>`:''}
   ${details.length?`<section class="identity-traits"><h4>${esc(l.facts)}</h4><dl>${details.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v||'—')}</dd></div>`).join('')}</dl></section>`:''}
   <small>${esc(l.rules)} · ${esc(item.source||'')}</small>
   ${item.licensed?`<button type="button" class="btn ${selected?'secondary':'primary'}" data-action="choose" data-kind="${esc(group)}" data-id="${esc(item.id)}" aria-pressed="${selected}">${selected?'✓ '+esc(l.selected):esc(l.choose)}</button>`:`<p class="identity-locked">${esc(l.locked)}</p>`}
  </div>`:''}
 </article>`;
}
window.ATLAS_V2_IDENTITY=Object.freeze({descriptions,labels,positions,initPhotos,renderCard});
})();
