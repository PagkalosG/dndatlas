/* D&D Atlas 2.0 UI-only 2024 Builder helpers. No rules authority or network. */
(function () {
  'use strict';
  const source = window.ATLAS_V2_SRD;
  if (!source || source.edition !== '2024') throw new Error('Missing versioned SRD 2024 catalog');
  const itemById = new Map(source.equipment.map(item => [item.id, item]));
  const classById = new Map(source.classes.map(item => [item.id, item]));
  const bgById = new Map(source.backgrounds.map(item => [item.id, item]));
  const copper = { cp:1, sp:10, ep:50, gp:100, pp:1000 };
  const categories = ['weapons', 'armor', 'adventuring', 'consumables', 'tools'];
  const fighterStyles=['Archery','Defense','Dueling','Great Weapon Fighting','Protection','Two-Weapon Fighting'];
  const skillEL = {
    'skill-acrobatics':'Ακροβατικά','skill-animal-handling':'Χειρισμός Ζώων','skill-arcana':'Απόκρυφη Γνώση',
    'skill-athletics':'Αθλητισμός','skill-deception':'Εξαπάτηση','skill-history':'Ιστορία',
    'skill-insight':'Διορατικότητα','skill-intimidation':'Εκφοβισμός','skill-investigation':'Έρευνα',
    'skill-medicine':'Ιατρική','skill-nature':'Φύση','skill-perception':'Αντίληψη','skill-performance':'Παράσταση',
    'skill-persuasion':'Πειθώ','skill-religion':'Θρησκεία','skill-sleight-of-hand':'Ταχυδακτυλουργία',
    'skill-stealth':'Απόκρυψη','skill-survival':'Επιβίωση',
    'tool-dice':'Ζάρια','tool-dragonchess':'Δρακοσκάκι','tool-playing-cards':'Τράπουλα',
    'tool-three-dragon-ante':'Three-Dragon Ante',
  };
  const prefLabel = (option, locale) => {
    const en = option.name.replace(/^(Skill|Tool): /, '');
    const el = skillEL[option.id];
    return locale === 'el' && el ? `${el} (${en})` : en;
  };
  const gb = (num) => `${(Math.round(num) / 100).toFixed(2)} GP`;
  const price = item => item.cost ? `${item.cost.amount} ${item.cost.unit.toUpperCase()}` : '—';
  const classInfo = id => classById.get(id) || null;
  const backgroundInfo = id => bgById.get(id) || null;
  const granted = bg => bg?.proficiencies?.filter(p => /^skill-|^tool-/.test(p.id)).map(p => p.id) ?? [];
  const grantLabel=(p,locale)=>{
    const translated={'all-armor':'Πανοπλίες','light-armor':'Ελαφριές πανοπλίες','medium-armor':'Μεσαίες πανοπλίες','heavy-armor':'Βαριές πανοπλίες',
      'shields':'Ασπίδες','simple-weapons':'Απλά όπλα','martial-weapons':'Πολεμικά όπλα'}[p.id];
    return locale==='el' && translated?translated+' ('+p.name+')':p.name;
  };
  const classChoicesValid = draft => {
    const cl=classInfo(draft.class);
    if(!cl)return false;
    const grantedSkills = new Set(granted(backgroundInfo(draft.background)));
    return cl.skillChoices.every(group=>{
      const selected=draft.classChoices[group.id]||[];
      return selected.length===group.count && new Set(selected).size===selected.length &&
        selected.every(id => group.options.some(o=>o.id===id) && !grantedSkills.has(id));
    });
  };
  const fighterChoicesValid = draft => draft.class !== 'fighter' ||
    (fighterStyles.includes(draft.fightingStyle) && draft.weaponMasteries.length===3 &&
      new Set(draft.weaponMasteries).size===3 && draft.weaponMasteries.every(id=>itemById.get(id)?.category==='weapons'));
  const backgroundChoicesValid = draft => {
    const bg=backgroundInfo(draft.background);
    if(!bg)return false;
    return bg.skillChoices.every(group=>{
      const selected=draft.backgroundChoices[group.id]||[];
      return selected.length===group.count && new Set(selected).size===selected.length &&
        selected.every(id=>group.options.some(o=>o.id===id));
    });
  };
  const bonusesValid = draft => {
    const bg=backgroundInfo(draft.background);
    const ids=bg?.abilityScores?.map(s=>s.id)??[];
    if(ids.length!==3)return false;
    if(draft.bonusMode==='triple')return true;
    return ids.includes(draft.bonusTwo) && ids.includes(draft.bonusOne) && draft.bonusOne!==draft.bonusTwo;
  };
  const bonusFor=(draft,id)=>{
    const bg=backgroundInfo(draft.background);
    if(!bg?.abilityScores?.some(x=>x.id===id))return 0;
    if(draft.bonusMode==='triple')return 1;
    return (draft.bonusTwo===id?2:0)+(draft.bonusOne===id?1:0);
  };
  const pack=(draft,origin)=>{
    const def=origin==='class'?classInfo(draft.class):backgroundInfo(draft.background);
    const selected=origin==='class'?draft.classPackage:draft.backgroundPackage;
    return def?.startingOptions.find(o=>o.id===selected)??null;
  };
  const bundled=(draft)=>['class','background'].flatMap(origin=>pack(draft,origin)?.items??[]);
  const coinsGranted=draft=>bundled(draft).filter(item=>item.type==='money').reduce((v,m)=>v+m.amount*(copper[m.unit]??0),0);
  const costTotal=draft=>Object.entries(draft.purchases).reduce((sum,[id,qty])=>sum+(itemById.get(id)?.cost?.cp??0)*qty,0);
  const wallet=draft=>({starting:coinsGranted(draft),spent:costTotal(draft),remaining:coinsGranted(draft)-costTotal(draft)});
  const nestedOptions=(entry)=>{
    if(entry.type==='choice'){
      const matches=(entry.items??[]).filter(x=>x.type==='item');
      return matches.length?matches:source.equipment.filter(x=>x.categories.includes(entry.category)).map(x=>({id:x.id,name:x.name,type:'item'}));
    }
    if(entry.type==='item' && !itemById.has(entry.id)){
      return source.equipment.filter(x=>x.categories.includes(entry.id)).map(x=>({id:x.id,name:x.name,type:'item'}));
    }
    return [];
  };
  const choicesMissing=draft=>{
    let missing=0;
    for(const origin of ['class','background']){
      for(const [index,item] of (pack(draft,origin)?.items??[]).entries()){
        if(item.type==='choice'||(item.type==='item'&&!itemById.has(item.id))){
          const selected=draft.packageChoices[`${origin}:${index}`];
          if(!nestedOptions(item).some(opt=>opt.id===selected))missing++;
        }
      }
    }
    return missing;
  };
  const packReady=draft=>Boolean(pack(draft,'class') && pack(draft,'background')) && choicesMissing(draft)===0;
  const describeItem=(item,loc)=>item.type==='money'?`${item.amount} ${item.unit.toUpperCase()}`:
    item.type==='item'?`${item.qty||1} × ${item.name||item.id}`:
    item.type==='choice'?(loc==='el'?'Επιλογή εξοπλισμού':'Equipment choice'):'—';
  function renderChoices({groups,selected,action,locale,t,esc,disabledIds=[]}){
    if(!groups.length)return `<p class="inline-info">${esc(t('fixedTrainingOnly'))}</p>`;
    return groups.map(group=>{
      const selection=selected[group.id]||[];
      return `<section class="training-group"><div class="training-head"><strong>${esc(t('chooseProficiencies'))}</strong>
        <span class="chip ${selection.length===group.count?'gold':'muted'}">${selection.length}/${group.count}</span></div>
        <p>${esc(t('proficiencyHint'))}</p><div class="skill-picker" role="group" aria-label="${esc(t('chooseProficiencies'))}">
        ${group.options.map(opt=>{
          const checked=selection.includes(opt.id),blocked=disabledIds.includes(opt.id);
          return `<button type="button" class="skill-chip ${checked?'active':''}" aria-pressed="${checked}"
            data-action="${action}" data-group="${esc(group.id)}" data-id="${esc(opt.id)}" ${blocked?'disabled':''}>
            ${checked?'✓ ':''}${esc(prefLabel(opt,locale))}${blocked?' · '+esc(t('alreadyGranted')):''}</button>`;
        }).join('')}</div></section>`;
    }).join('');
  }
  function renderClassTraining({draft,locale,t,esc}){
    const cl=classInfo(draft.class);
    if(!cl)return `<p class="inline-warning">${esc(t('selectClassFirst'))}</p>`;
    const bg=backgroundInfo(draft.background);
    const selected=Object.values(draft.classChoices).flat();
    const duplicate=selected.filter(id=>granted(bg).includes(id));
    return `<div class="training-panel">
      <div class="training-highlight"><strong>${esc(cl.name)}</strong>
        <span>${esc(t('hitDie'))}: d${cl.hitDie}</span>
        <span>${esc(t('savingThrows'))}: ${cl.savingThrows.map(s=>esc(s.name)).join(', ')}</span></div>
      <h3>${esc(t('classProficiencies'))}</h3>
      ${renderChoices({groups:cl.skillChoices,selected:draft.classChoices,action:'class-proficiency',locale,t,esc,disabledIds:granted(bg)})}
      <div class="training-grants"><b>${esc(t('automaticallyGranted'))}</b><div class="grant-chips">
        ${cl.proficiencies.filter(p=>!/^saving-throw/.test(p.id)).map(p=>`<span class="chip muted">${esc(grantLabel(p,locale))}</span>`).join('')}</div></div>
      ${duplicate.length?`<div class="inline-warning">${esc(t('duplicateProficiency'))}</div>`:''}
      ${draft.class==='fighter'?`<section class="training-group"><div class="training-head"><strong>${esc(t('fightingStyle'))}</strong><span class="chip muted">1/1</span></div>
        <p>${esc(t('fighterStyleHint'))}</p><div class="skill-picker">
        ${fighterStyles.map(style=>`<button type="button" class="skill-chip ${draft.fightingStyle===style?'active':''}" aria-pressed="${draft.fightingStyle===style}"
          data-action="fighting-style" data-id="${esc(style)}">${esc(style)}</button>`).join('')}</div></section>
        <section class="training-group"><div class="training-head"><strong>${esc(t('weaponMastery'))}</strong><span class="chip ${draft.weaponMasteries.length===3?'gold':'muted'}">${draft.weaponMasteries.length}/3</span></div>
          <p>${esc(t('fighterMasteryHint'))}</p><div class="mastery-grid">${source.equipment.filter(i=>i.category==='weapons').map(item=>`
            <button type="button" class="skill-chip ${draft.weaponMasteries.includes(item.id)?'active':''}" aria-pressed="${draft.weaponMasteries.includes(item.id)}"
              data-action="weapon-mastery" data-id="${esc(item.id)}">${draft.weaponMasteries.includes(item.id)?'★ ':''}${esc(item.name)}</button>`).join('')}</div></section>`:
        `<div class="inline-info">${esc(t('advancedClassOptions'))}</div>`}
      
      ${cl.subclasses.length?`<p class="source-note">${esc(t('subclassAfterLevelThree'))}: ${cl.subclasses.map(x=>esc(x.name)).join(', ')} (${esc(t('srdSource'))})</p>`:''}
    </div>`;
  }
  function renderBackgroundTraining({draft,locale,t,esc}){
    const bg=backgroundInfo(draft.background);
    if(!bg)return `<p class="inline-warning">${esc(t('selectBackgroundFirst'))}</p>`;
    return `<div class="training-panel"><div class="training-highlight"><strong>${esc(bg.name)}</strong>
      <span>${esc(t('originFeat'))}: ${esc(bg.feat?.name||'—')}</span></div>
      <h3>${esc(t('backgroundGrants'))}</h3><div class="grant-chips">
      ${bg.proficiencies.map(p=>`<span class="chip muted">${esc(prefLabel(p,locale))}</span>`).join('')}</div>
      ${renderChoices({groups:bg.skillChoices,selected:draft.backgroundChoices,action:'background-proficiency',locale,t,esc})}
      <div class="inline-info">${esc(t('backgroundBonusHint'))}</div></div>`;
  }
  function renderBackgroundBonuses({draft,t,esc}){
    const bg=backgroundInfo(draft.background);
    if(!bg)return `<div class="inline-warning">${esc(t('selectBackgroundFirst'))}</div>`;
    const groups=[['split','+2 / +1'],['triple','+1 / +1 / +1']];
    return `<section class="bonus-panel"><div class="training-head"><strong>${esc(t('backgroundBonuses'))}</strong></div>
      <p>${esc(t('backgroundBonusHint'))}</p><div class="bonus-modes">${groups.map(([id,name])=>
      `<button class="skill-chip ${draft.bonusMode===id?'active':''}" data-action="bonus-mode" data-mode="${id}" aria-pressed="${draft.bonusMode===id}">${name}</button>`).join('')}</div>
      <div class="bonus-grid">${bg.abilityScores.map(a=>`<div class="bonus-ability"><strong>${esc(a.name)}</strong><small>${draft.bonusMode==='triple'?'+1':(draft.bonusTwo===a.id?'+2':draft.bonusOne===a.id?'+1':'—')}</small>
      ${draft.bonusMode==='split'?`<div class="bonus-actions"><button type="button" data-action="bonus-select" data-ability="${esc(a.id)}" data-boost="2" class="skill-chip ${draft.bonusTwo===a.id?'active':''}">+2</button>
       <button type="button" data-action="bonus-select" data-ability="${esc(a.id)}" data-boost="1" class="skill-chip ${draft.bonusOne===a.id?'active':''}">+1</button></div>`:''}</div>`).join('')}</div>
    </section>`;
  }
  function renderPackages({draft,locale,t,esc}){
    let html='';
    for(const origin of ['class','background']){
      const def=origin==='class'?classInfo(draft.class):backgroundInfo(draft.background);
      const selected=origin==='class'?draft.classPackage:draft.backgroundPackage;
      if(!def?.startingOptions.length)continue;
      html+=`<section class="package-section"><div class="training-head"><h3>${esc(t(origin==='class'?'classStartingPackage':'backgroundStartingPackage'))}</h3><span class="chip muted">${esc(def.name)}</span></div>
        <div class="package-grid">${def.startingOptions.map((option,i)=>{
          const active=selected===option.id;
          return `<button type="button" data-action="select-package" data-origin="${origin}" data-id="${esc(option.id)}" class="package-card ${active?'active':''}" aria-pressed="${active}">
            <span class="package-letter">${String.fromCharCode(65+i)}</span><strong>${option.items.every(item=>item.type==='money')?esc(t('goldInstead')):esc(t('equipmentPackage'))}</strong>
            <span>${esc(option.items.map(item=>describeItem(item,locale)).join(' · '))}</span></button>`;
        }).join('')}</div>`;
      for(const [index,item] of (pack(draft,origin)?.items||[]).entries()){
        const options=nestedOptions(item);
        if(item.type==='choice'||(item.type==='item'&&!itemById.has(item.id))){
          html+=`<label class="package-subchoice"><span>${esc(t('resolvePackageChoice'))}: ${esc(item.name||item.category||'')}</span><select data-package-choice="${origin}:${index}">
            <option value="">${esc(t('choose'))}</option>${options.map(opt=>`<option value="${esc(opt.id)}" ${draft.packageChoices[`${origin}:${index}`]===opt.id?'selected':''}>${esc(opt.name)}</option>`).join('')}</select></label>`;
          if(!options.length)html+=`<p class="inline-warning">${esc(t('unavailablePackageChoice'))}</p>`;
        }
      }
      html+='</section>';
    }
    const w=wallet(draft);
    return html+`<div class="wallet-summary"><div><span>${esc(t('startingMoney'))}</span><strong>${gb(w.starting)}</strong></div>
       <div><span>${esc(t('spentMoney'))}</span><strong>${gb(w.spent)}</strong></div>
       <div><span>${esc(t('remainingMoney'))}</span><strong>${gb(w.remaining)}</strong></div></div>`;
  }
  function purchased(draft,id){return draft.purchases[id]||0;}
  function renderShop({draft,category,query,locale,t,esc}){
    const w=wallet(draft);
    const items=source.equipment.filter(x=>x.category===category && (!query || x.name.toLowerCase().includes(query.toLowerCase())));
    return `<div class="shop-panel"><div class="wallet-summary"><div><span>${esc(t('startingMoney'))}</span><strong>${gb(w.starting)}</strong></div>
      <div><span>${esc(t('spentMoney'))}</span><strong>${gb(w.spent)}</strong></div>
      <div><span>${esc(t('remainingMoney'))}</span><strong>${gb(w.remaining)}</strong></div></div>
      <p class="inline-info">${esc(t('shopHint'))}</p>
      <div class="shop-categories">${categories.map(c=>`<button type="button" data-action="gear-category" data-category="${c}" class="filter-chip ${c===category?'active':''}">${esc(t('category'+c[0].toUpperCase()+c.slice(1)))}</button>`).join('')}</div>
      <label class="shop-search"><span>${esc(t('search'))}</span><input id="gear-search" type="search" value="${esc(query)}" placeholder="${esc(t('filterPlaceholder'))}"></label>
      <div class="shop-grid">${items.map(item=>{
        const qty=purchased(draft,item.id), affordable=Number.isInteger(item.cost?.cp) && item.cost.cp<=w.remaining;
        const fallback=`assets/item-${item.id}.svg`;
        const available=['greatsword','spear','shield','light-crossbow','chain-mail','quarterstaff'].includes(item.id);
        const img=available?`<img src="${esc(item.id==='quarterstaff'?'assets/item-staff.svg':fallback)}" loading="lazy" alt="">`:
          `<span class="gear-glyph" aria-hidden="true">${item.category==='weapons'?'⚔':item.category==='armor'?'◈':item.category==='tools'?'⚙':item.category==='consumables'?'✧':'♧'}</span>`;
        return `<article class="shop-item" data-search="${esc(item.name.toLowerCase())}"><div class="shop-image">${img}</div><div class="shop-copy"><strong>${esc(item.name)}</strong>
         <span>${esc(price(item))} · ${esc(t('srdSource'))}</span><small>${esc(locale==='el'?t('itemCatalogDescription'):(item.description[0]||t('itemCatalogDescription')))}</small></div>
         <div class="shop-actions"><button type="button" data-action="shop-remove" data-id="${esc(item.id)}" ${qty<1?'disabled':''} aria-label="${esc(t('removeItem'))}">−</button>
         <span>${qty}</span><button type="button" data-action="shop-add" data-id="${esc(item.id)}" ${!affordable?'disabled':''} aria-label="${esc(t('addItem'))}">+</button></div></article>`;
      }).join('')}</div>
      <div class="source-note">${esc(t('itemCountLabel'))}: ${items.length} · ${esc(t('shopUnvalidated'))}</div></div>`;
  }
  window.ATLAS_V2_BUILDER = Object.freeze({source,itemById,classInfo,backgroundInfo,granted,
    classChoicesValid,backgroundChoicesValid,fighterChoicesValid,bonusesValid,bonusFor,pack,coinsGranted,costTotal,wallet,packReady,
    choicesMissing,renderClassTraining,renderBackgroundTraining,renderBackgroundBonuses,renderPackages,renderShop,categories,gb});
})();
