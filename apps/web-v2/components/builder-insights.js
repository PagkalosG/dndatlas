/* Atlas v2: explainable, UI-only 2024 preview and inventory provenance.
 * Canonical rules legality is not supplied by this module; only explicit source grants are shown.
 */
(function () {
  'use strict';
  const ABILITIES=['str','dex','con','int','wis','cha'];
  const SKILL_ABILITY={
    'skill-acrobatics':'dex','skill-animal-handling':'wis','skill-arcana':'int','skill-athletics':'str',
    'skill-deception':'cha','skill-history':'int','skill-insight':'wis','skill-intimidation':'cha',
    'skill-investigation':'int','skill-medicine':'wis','skill-nature':'int','skill-perception':'wis',
    'skill-performance':'cha','skill-persuasion':'cha','skill-religion':'int','skill-sleight-of-hand':'dex',
    'skill-stealth':'dex','skill-survival':'wis'
  };
  const L={
    en:{hitDie:'Hit Die',originFeat:'Origin Feat',base:'Assigned',bonus:'Background',final:'Final score',modifier:'Modifier',grants:'Proficiencies & bonuses',automatic:'Automatically granted',class:'Class',background:'Background',classChoice:'Chosen from class',backgroundChoice:'Chosen from background',saves:'Saving throws',skills:'Skills',tools:'Tools',weapons:'Weapons & armor',none:'No additional grants yet',skill:'Skill',uses:'Uses',weight:'Weight',damage:'Damage',properties:'Properties',mastery:'Mastery',ac:'Armor class',contains:'Contains',category:'Category',details:'Details',included:'Starting equipment',owned:'Already selected',fromPack:'Included in pack',bought:'Purchased separately',packContents:'Contents of this pack',unknownContents:'No detailed pack contents in the SRD snapshot',notOfficial:'Original concept art shown until licensed realistic images are added.',model:'UI preview values, not full rules validation',currency:'Available funds',selectedItems:'Selected / included',primaryAbility:'Key abilities',extra:'Selected via a class or background choice'},
    el:{hitDie:'Ζάρι Ζωής',originFeat:'Ταλέντο Προέλευσης',base:'Ανάθεση',bonus:'Προέλευση',final:'Τελική τιμή',modifier:'Τροποποιητής',grants:'Εξοικειώσεις & μπόνους',automatic:'Αυτόματες εξοικειώσεις',class:'Κλάση',background:'Προέλευση',classChoice:'Επιλογή Κλάσης',backgroundChoice:'Επιλογή Προέλευσης',saves:'Σωτήριες Βολές',skills:'Δεξιότητες',tools:'Εργαλεία',weapons:'Όπλα & πανοπλίες',none:'Δεν υπάρχουν άλλες εξοικειώσεις',skill:'Δεξιότητα',uses:'Χρήσεις',weight:'Βάρος',damage:'Ζημιά',properties:'Ιδιότητες',mastery:'Ικανότητα Όπλου',ac:'Κλάση πανοπλίας',contains:'Περιέχει',category:'Κατηγορία',details:'Λεπτομέρειες',included:'Αρχικός εξοπλισμός',owned:'Ήδη επιλεγμένο',fromPack:'Περιλαμβάνεται στο πακέτο',bought:'Αγοράστηκε ξεχωριστά',packContents:'Περιεχόμενα πακέτου',unknownContents:'Δεν υπάρχουν αναλυτικά περιεχόμενα για αυτό το πακέτο στην πηγή',notOfficial:'Προσωρινές εικονογραφήσεις, μέχρι να προστεθούν ρεαλιστικές εικόνες με κατάλληλη άδεια.',model:'Προεπισκόπηση UI — όχι πλήρης επικύρωση κανόνων',currency:'Διαθέσιμα χρήματα',selectedItems:'Επιλεγμένα / περιλαμβανόμενα',primaryAbility:'Βασικά χαρακτηριστικά',extra:'Επιλογή από Κλάση ή Προέλευση'}
  };
  const sign=value=>value>=0?`+${value}`:String(value);
  const modifier=score=>Math.floor((Number(score)-10)/2);
  const score=(draft,key,bonusFor)=>{
    const index=ABILITIES.indexOf(key);
    if(index<0)return null;
    const base=Number(draft.abilities[index]);
    const bonus=Number(bonusFor(draft,key)||0);
    return {key,base,bonus,total:base+bonus,modifier:modifier(base+bonus)};
  };
  const proficiencyBonus=()=>2; // Level 1 UI preview; class-level rules are not yet authoritative.
  function grants(draft,cl,bg){
    const entries=[];
    const add=(item,origin,source)=>{
      if(!item||typeof item.id!=='string')return;
      const old=entries.find(row=>row.id===item.id);
      if(old){if(!old.sources.some(s=>s.source===source&&s.origin===origin))old.sources.push({source,origin});return;}
      entries.push({id:item.id,name:item.name||item.id,kind:item.id.startsWith('skill-')?'skill':item.id.startsWith('tool-')?'tool':item.id.startsWith('saving-throw-')?'save':'equipment',sources:[{source,origin}]});
    };
    for(const item of cl?.proficiencies||[])add(item,'class','automatic');
    for(const item of bg?.proficiencies||[])add(item,'background','automatic');
    for(const group of cl?.skillChoices||[])for(const id of draft.classChoices[group.id]||[])add(group.options.find(x=>x.id===id), 'class','choice');
    for(const group of bg?.skillChoices||[])for(const id of draft.backgroundChoices[group.id]||[])add(group.options.find(x=>x.id===id),'background','choice');
    return entries;
  }
  function abilityForGrant(id){
    if(id.startsWith('saving-throw-'))return id.slice('saving-throw-'.length);
    return SKILL_ABILITY[id]||null;
  }
  function grantScore(draft,id,bonusFor,isProficient=true){
    const key=abilityForGrant(id);
    if(!key)return null;
    const value=score(draft,key,bonusFor);
    return value?value.modifier+(isProficient?proficiencyBonus():0):null;
  }
  function cleanName(item){return String(item.name||item.id).replace(/^(Skill|Tool|Saving Throw):\s*/i,'');}
  function renderGrantOverview({draft,locale,esc,cl,bg,bonusFor}){
    const t=L[locale]; const values=grants(draft,cl,bg);
    const sections=[['save',t.saves],['skill',t.skills],['tool',t.tools],['equipment',t.weapons]];
    return `<section class="grant-overview"><h3>${esc(t.grants)}</h3><p class="insights-footnote">${esc(t.model)} · PB +${proficiencyBonus()}</p>
      ${sections.map(([kind,title])=>{const entries=values.filter(e=>e.kind===kind);if(!entries.length)return '';
        return `<div class="grant-group"><h4>${esc(title)}</h4><div class="grant-rows">${entries.map(e=>{
          const total=grantScore(draft,e.id,bonusFor);
          const from=e.sources.map(s=>s.source==='choice'?(s.origin==='class'?t.classChoice:t.backgroundChoice):(s.origin==='class'?t.class:t.background)).join(' + ');
          return `<div class="grant-row"><span><strong>${esc(cleanName(e))}</strong><small>${esc(from)}</small></span>${total!==null?`<b class="grant-modifier">${esc(sign(total))}</b>`:''}</div>`;
        }).join('')}</div></div>`;}).join('')}</section>`;
  }
  function contents(draft,builder){
    const catalog=builder.source.equipment;const byId=new Map(catalog.map(x=>[x.id,x]));
    const results=new Map();
    const add=(id,qty,source)=>{if(!byId.has(id)||!Number.isFinite(qty)||qty<1)return;
      if(!results.has(id))results.set(id,{id,quantity:0,sources:[]});
      const row=results.get(id);row.quantity+=qty;const exists=row.sources.find(x=>x.label===source);if(exists)exists.quantity+=qty;else row.sources.push({label:source,quantity:qty});
    };
    const expand=(id,qty,label)=>{const pack=byId.get(id);if(!pack?.isPack&&!/(?:^|-)pack$/.test(id))return;
      for(const part of pack.contents||[]){if(part?.id&&Number.isInteger(part.quantity))add(part.id,part.quantity*qty,label);}
    };
    for(const origin of ['class','background']){
      const title=origin==='class'?'Class':'Background';
      for(const [i,item] of (builder.pack(draft,origin)?.items||[]).entries()){
        if(item.type==='item' && byId.has(item.id)){
          add(item.id,item.qty||1,title);
          expand(item.id,item.qty||1,`${title}: ${byId.get(item.id).name}`);
        }else if(item.type==='choice'||(item.type==='item'&&!byId.has(item.id))){
          const id=draft.packageChoices[`${origin}:${i}`];if(byId.has(id)){
            add(id,1,title);
            expand(id,1,`${title}: ${byId.get(id).name}`);
          }
        }
      }
    }
    for(const [id,qty] of Object.entries(draft.purchases||{})){
      if(!Number.isInteger(qty)||qty<1||!byId.has(id))continue;
      add(id,qty,'Purchased');
      expand(id,qty,`Purchased: ${byId.get(id).name}`);
    }
    return results;
  }
  const isPack=item=>item?.isPack===true||/(?:^|-)pack$/.test(item?.id||'')||item?.categories?.includes('equipment-packs');
  const itemGroup=item=>isPack(item)?'packs':item?.category;
  const sourceLabel=(label,locale)=>locale==='el'?label.replace(/^Class/,'Κλάση').replace(/^Background/,'Προέλευση').replace(/^Purchased/,'Αγορά').replace(/^Purchased:/,'Αγορασμένο:'):label;
  function ownershipBadge({id,owned,locale,esc}){
    const result=owned.get(id);if(!result)return '';
    const t=L[locale];return `<div class="ownership-badges"><span class="chip owned">✓ ${esc(t.owned)} ×${result.quantity}</span>${result.sources.map(s=>`<span class="chip muted" title="${esc(sourceLabel(s.label,locale))}">${esc(sourceLabel(s.label,locale))} ×${s.quantity}</span>`).join('')}</div>`;
  }
  function itemDetails({item,locale,esc}){
    const t=L[locale],facts=[];
    if(item.cost)facts.push(`${item.cost.amount} ${String(item.cost.unit).toUpperCase()}`);
    if(Number.isFinite(item.weight))facts.push(`${t.weight}: ${item.weight} lb`);
    if(item.damage){const d=item.damage;facts.push(`${t.damage}: ${d.damage_dice||d.dice||''} ${d.damage_type?.name||''}`.trim());}
    if(item.mastery?.name||item.mastery)facts.push(`${t.mastery}: ${typeof item.mastery==='string'?item.mastery:item.mastery.name}`);
    if(item.armorClass?.base!=null)facts.push(`${t.ac}: ${item.armorClass.base}`);
    const props=(item.properties||[]).map(p=>p.name||p).filter(Boolean);
    if(props.length)facts.push(`${t.properties}: ${props.join(', ')}`);
    const description=(item.description||[]).filter(Boolean).join(' ');
    const parts=(item.contents||[]).map(p=>`${p.quantity} × ${p.name||p.id}`);
    return `<details class="item-details"><summary>${esc(t.details)}</summary><div class="item-details-body">
      ${facts.length?`<div class="item-facts">${facts.map(s=>`<span>${esc(s)}</span>`).join('')}</div>`:''}
      ${description?`<p>${esc(description)}</p>`:''}
      ${isPack(item)?`<p><strong>${esc(t.packContents)}</strong></p>${parts.length?`<ul>${parts.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:`<p>${esc(t.unknownContents)}</p>`}`:''}
      ${!description&&!facts.length&&!isPack(item)?`<p>${esc(item.name)}</p>`:''}</div></details>`;
  }
  function renderSelectionDetails({item,group,locale,esc,builder}){
    if(!item)return '';
    const t=L[locale],details=[];
    if(group==='classes'){
      const x=builder.classInfo(item.id);
      if(x){details.push(`${t.hitDie}: d${x.hitDie}`);
        details.push(`${t.saves}: ${(x.savingThrows||[]).map(i=>i.name).join(', ')}`);
        details.push(`${t.automatic}: ${(x.proficiencies||[]).filter(p=>!p.id.startsWith('saving-throw-')).map(p=>p.name).join(', ')}`);
        details.push(`${t.skills}: ${(x.skillChoices||[]).map(g=>g.count+' / '+g.options.map(p=>cleanName(p)).join(', ')).join('; ')}`);
      }
    }
    if(group==='backgrounds'){
      const bg=builder.backgroundInfo(item.id);
      if(bg){details.push(`${t.automatic}: ${(bg.proficiencies||[]).map(p=>p.name).join(', ')}`);
        details.push(`${t.originFeat}: ${bg.feat?.name||'—'}`);
        details.push(`${t.skills}: ${(bg.skillChoices||[]).map(g=>g.options.map(o=>cleanName(o)).join(', ')).join('; ')}`);
      }
    }
    return `<section class="selection-explanation" aria-live="polite"><div class="explanation-header"><strong>${esc(item.title?.[locale]||item.id)}</strong><span class="chip muted">${esc(item.source||'')}</span></div>
      <p>${esc(item.description?.[locale]||'')}</p>${details.length?`<ul>${details.map(d=>`<li>${esc(d)}</li>`).join('')}</ul>`:''}
      <small>${esc(t.model)}</small></section>`;
  }
  window.ATLAS_V2_INSIGHTS=Object.freeze({L,ABILITIES,SKILL_ABILITY,sign,modifier,score,proficiencyBonus,grants,grantScore,renderGrantOverview,contents,isPack,itemGroup,ownershipBadge,itemDetails,renderSelectionDetails});
})();
