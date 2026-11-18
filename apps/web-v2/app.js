/* Atlas v2 concept UI: mock interactions only. Real permissions and D&D calculations belong on the Worker. */
(() => {
  'use strict';
  const catalog = window.ATLAS_V2_DEMO;
  const campaignUI = window.ATLAS_V2_CAMPAIGN_FLOW;
  const libraryUI = window.ATLAS_V2_LIBRARY_UI;
  const builderUI = window.ATLAS_V2_BUILDER;
  const insights = window.ATLAS_V2_INSIGHTS;
  const abilityUI = window.ATLAS_V2_ABILITIES;
  const identityUI = window.ATLAS_V2_IDENTITY;
  const identityV2 = window.ATLAS_V2_IDENTITY_V2;
  const characterUI = window.ATLAS_V2_CHARACTER_SHEET;
  const originUI = window.ATLAS_V2_ORIGINS;
  const playUI = window.ATLAS_V2_PLAY;
  const localStore = window.ATLAS_V2_LOCAL;
  if(!playUI || !localStore)throw new Error('Missing local playable character components');
  if (!identityV2 || !characterUI || !originUI) throw new Error('Missing character details and Origin choices components');
  if (!identityUI) throw new Error('Missing identity card UI');
  identityUI.initPhotos();
  if (!abilityUI) throw new Error('Missing 2024 Ability Allocation component');
  if (!insights) throw new Error('Missing Atlas 2024 insights components');
  if (!builderUI) throw new Error('Missing 2024 Builder components');
  if (!campaignUI) throw new Error('Missing campaign UI components');
  if (!libraryUI) throw new Error('Missing library UI components');
  if (!catalog) throw new Error('Missing Atlas UI fixtures');

  const abilityKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  // v0.6: single-class starting-level flow. Class-specific multiclass leveling comes later.
  const stepKeys = () => ['Species', 'Class', ...(state.savedCampaign.startingLevel >= 3 ? ['Subclass'] : []),
    'Background', 'Ability', 'ClassTraining', 'BackgroundTraining', 'StartingEquipment', 'Inventory', 'Profile', 'Review'];
  const subclassOptions = () => builderUI.classInfo(state.draft.class)?.subclasses || [];
  const subclassRequired = () => state.savedCampaign.startingLevel >= 3 && subclassOptions().length > 0;
  const defaultDraft = () => ({ name: '', species: null, class: null, subclass: null, background: null, equipment: null, abilityMethod: 'standard', abilities: abilityUI.initialScores('standard'), abilityAllocations: {},
    classChoices: {}, backgroundChoices: {}, fightingStyle: null, weaponMasteries: [], bonusMode: 'split', bonusTwo: null, bonusOne: null,
    classPackage: null, backgroundPackage: null, packageChoices: {}, purchases: {}, customItems: [],
    alignment: '', backgroundStory: '', portraitData: null, equippedArmor: null, shieldEquipped: false,
    humanSkill:null, humanFeat:null, skilledChoices:[] });
  const state = { locale: 'en', view: 'home', role: 'player', step: 0, draft: defaultDraft(), saved: null, dirty: false, status: 'draft', filter: 'all', query: '', gearCategory: 'weapons', gearQuery: '', busy: false, campaign: campaignUI.originalSettings(), savedCampaign: campaignUI.originalSettings(), campaignBusy: false, campaignDirty: false, inviteCreated: false, libraryPreview: null, libraryError: null, libraryStaged: [], libraryBusy: false, libraryRights: false, expandedOption: null, sheetTab:'overview', gameplay: playUI.defaults(), localLoaded:false };
  const main = document.getElementById('main');
  const text = (key) => catalog.strings[state.locale][key] ?? key;
  const label = (item) => item?.title?.[state.locale] ?? text('notChosen');
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const image = (item) => item.photo ? `<picture><source srcset="${escape(item.photo)}" type="image/webp"><img src="${escape(item.art)}" alt="${escape(item.title?.[state.locale] || text('originalArt'))}" loading="lazy" decoding="async"></picture>` : `<img src="${escape(item.art)}" alt="${escape(item.title?.[state.locale] || text('originalArt'))}" loading="lazy" decoding="async">`;
  const entry = (group, id) => catalog[group].find((item) => item.id === id);
  const totalRequired = () => 7 + (subclassRequired() ? 1 : 0);
  const completion = () => [!!state.draft.species, !!state.draft.class, ...(subclassRequired() ? [!!state.draft.subclass] : []),
    !!state.draft.background, validAbilities() && builderUI.bonusesValid(state.draft),
    builderUI.classChoicesValid(state.draft) && builderUI.fighterChoicesValid(state.draft) && originUI.validHumanSkill(state.draft),
    builderUI.backgroundChoicesValid(state.draft) && originUI.validHumanFeat(state.draft), builderUI.packReady(state.draft)].filter(Boolean).length;
  const selectable = () => completion() === totalRequired() && builderUI.wallet(state.draft).remaining >= 0;
  const validAbilities = () => abilityUI.validate(state.draft.abilityMethod, state.draft.abilities).valid;
  const markDirty = () => { state.dirty = true; state.status = 'draft'; };
  const icon = (symbol) => `<span class="nav-symbol" aria-hidden="true">${symbol}</span>`;

  function notify(message) {
    const region = document.getElementById('toast-region');
    const node = document.createElement('div');
    node.className = 'toast';
    node.textContent = message;
    region.appendChild(node);
    setTimeout(() => node.remove(), 3700);
  }

  function navigate(view) {
    if (state.view === 'builder' && view !== 'builder' && state.dirty && !window.confirm(text('leaveWarning'))) return;
    if (state.view === 'campaign' && view !== 'campaign' && state.campaignDirty && !window.confirm(text('leaveWarning'))) return;
    state.view = view;
    state.query = '';
    state.gearQuery = '';
    state.filter = 'all';
    state.expandedOption = null;
    render();
    main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function renderNav() {
    const items = [
      ['home', 'navHome', '◈'], ['builder', 'navBuilder', '✧'], ['sheet', 'navSheet', '▣'],
      ['party', 'navParty', '♧'], ...(state.role === 'dm' ? [['campaign', 'navCampaign', '⚙']] : []), ['journal', 'navJournal', '▤'], ['settings', 'navSettings', '⚙'],
    ];
    document.getElementById('primary-nav').innerHTML = items.map(([id, title, symbol]) => `
      <button type="button" data-action="navigate" data-view="${id}" class="nav-button ${state.view === id ? 'current' : ''}" ${state.view===id?'aria-current="page"':''}>
        ${icon(symbol)}<span>${escape(text(title))}</span>${(id === 'builder' && state.dirty || id === 'campaign' && state.campaignDirty) ? '<span class="dirty-marker" aria-label="Unsaved changes"></span>' : ''}
      </button>`).join('');
    document.querySelectorAll('[data-role-mode]').forEach(button=>{
      const active=button.dataset.roleMode===state.role;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
      button.textContent=text(button.dataset.roleMode==='dm'?'roleDm':'rolePlayer');
    });
    document.getElementById('current-view-label').textContent = text(({home:'navHome',builder:'navBuilder',sheet:'navSheet',party:'navParty',journal:'navJournal',settings:'navSettings',campaign:'navCampaign'})[state.view]);
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = text(el.dataset.i18n); });
    document.getElementById('lang-select').value = state.locale;
    document.getElementById('lang-select').setAttribute('aria-label', text('language'));
    document.getElementById('primary-nav').setAttribute('aria-label', text('navigationAria'));
    document.querySelector('.sidebar').setAttribute('aria-label', text('navigationAria'));
    document.querySelector('.skip-link').textContent = text('skipToContent');
    document.getElementById('active-campaign-name').textContent = state.savedCampaign.name;
    document.documentElement.lang = state.locale;
  }

  const badge = (value, cls = '') => `<span class="chip ${cls}">${escape(value)}</span>`;
  const titleArea = (eyebrow, heading, description) => `<div class="section-lead"><div class="eyebrow accent">${escape(text(eyebrow))}</div><h1>${escape(text(heading))}</h1><p>${escape(text(description))}</p></div>`;

  function home() {
    return `<div class="page">
      <section class="welcome-hero">
        <div class="hero-glow" aria-hidden="true"></div>
        <div class="hero-content"><span class="eyebrow accent">${escape(text('heroEyebrow'))}</span>
          <h1>${escape(text('dashboardTitle'))}</h1><p>${escape(text('dashboardIntro'))}</p>
          <div class="hero-actions"><button class="btn primary" data-action="navigate" data-view="builder">${escape(text('continueBuilding'))}<span aria-hidden="true"> →</span></button>
          <button class="btn quiet" data-action="navigate" data-view="sheet">${escape(text('openSheet'))}</button></div>
        </div>
        <img class="hero-emblem" src="assets/atlas-mark.svg" alt="" aria-hidden="true">
      </section>
      <div class="eyebrow block-label">${escape(text('campaignActivity'))}</div>
      <div class="overview-grid">
        <div class="metric"><span class="metric-icon">♙</span><strong>4</strong><span>${escape(text('campaignMembers'))}</span></div>
        <div class="metric"><span class="metric-icon">◎</span><strong>${state.status==='pending'?'1':'0'}</strong><span>${escape(text('pendingApprovals'))}</span></div>
        <div class="metric"><span class="metric-icon">✦</span><strong>${state.status==='approved'?'1':'0'}</strong><span>${escape(text('activeCharacters'))}</span></div>
      </div>
      <div class="concept-banner"><span>✧</span><div><strong>${escape(text('previewBadge'))}</strong><p>${escape(text('demoPrivacy'))}</p></div></div>
    </div>`;
  }

  function stepProgress() {
    return `<nav class="steps" aria-label="Character creation progress">${stepKeys().map((key,i)=>`<button class="step ${i===state.step?'current':''} ${i<state.step?'complete':''}" type="button" data-action="step" data-step="${i}" ${i===state.step?'aria-current="step"':''}>
      <span class="step-number">${i<state.step?'✓':i+1}</span><span>${escape(text('step'+key))}</span>
    </button>`).join('')}</nav>`;
  }

  function optionCards(group,key){
    const discovery=['species','classes','backgrounds'].includes(group);
    return `<div class="catalog-toolbar"><label class="search-box"><span aria-hidden="true">⌕</span><input id="choice-search" type="search" placeholder="${escape(text('filterPlaceholder'))}" aria-label="${escape(text('search'))}" value="${escape(state.query)}"></label>
      <div class="filter-set" role="group"><button data-action="filter" data-filter="all" class="filter-chip ${state.filter==='all'?'active':''}">${escape(text('showAll'))}</button>
      <button data-action="filter" data-filter="available" class="filter-chip ${state.filter==='available'?'active':''}">${escape(text('availableOnly'))}</button></div></div>
      <div class="${discovery?'identity-grid':'option-grid'}" id="choice-grid">${catalog[group].map(item=>{
       const selected=state.draft[key]===item.id;
       if(discovery)return identityV2.renderCard({item,group,selected,expanded:state.expandedOption===group+':'+item.id,locale:state.locale,esc:escape,sourceClass:builderUI.classInfo,sourceBackground:builderUI.backgroundInfo,draft:state.draft});
       return `<button type="button" data-option-card data-available="${!!item.licensed}" class="illustrated-option ${selected?'selected':''} ${!item.licensed?'locked':''}" data-action="choose" data-id="${escape(item.id)}" data-kind="${escape(group)}" data-search="${escape((item.title.en+' '+item.title.el).toLowerCase())}" ${!item.licensed?'disabled':''} aria-pressed="${selected}">
         <div class="illustration">${image(item)}${selected?'<span class="selected-check">✓</span>':''}</div>
         <div class="option-detail"><strong>${escape(label(item))}</strong><p>${escape(item.description[state.locale])}</p><span class="option-source">${escape(item.source)}</span>${!item.licensed?`<span class="lock-hint">${escape(text('lockedHint'))}</span>`:''}</div></button>`;
      }).join('')}</div>
      ${!discovery?insights.renderSelectionDetails({item:entry(group,state.draft[key]),group,locale:state.locale,esc:escape,builder:builderUI}):''}
      <div class="empty-filter" id="empty-filter" hidden>${escape(text('noResults'))}</div>
      <p class="art-disclaimer">${escape(text('originalArtworkNote'))}</p>`;
  }

  function subclassStep(){
    const options=subclassOptions(),cl=builderUI.classInfo(state.draft.class);
    return `<section class="subclass-intro"><p>${escape(text('subclass2024Hint'))}</p><span class="chip muted">${escape(cl?.name||'')} · ${escape(text('levelThree'))}</span></section>
      <div class="identity-grid">${options.map(x=>`<article class="identity-card ${state.draft.subclass===x.id?'selected':''}"><div class="identity-details">
        <h3>${escape(x.name)}</h3><p>${escape(state.locale==='el'?'Επίλεξε υποκλάση για την εξέλιξη της κλάσης σου από το τρίτο επίπεδό της. Επιπλέον βιβλιοθήκες DM μπορούν να προσθέσουν υποκλάσεις αργότερα.':'Choose a subclass for your class progression starting at class level 3. DM libraries can provide more eligible options later.')}</p>
        <span class="chip muted">SRD 5.2.1</span>
        <button type="button" class="btn ${state.draft.subclass===x.id?'secondary':'primary'}" data-action="select-subclass" data-id="${escape(x.id)}" aria-pressed="${state.draft.subclass===x.id}">${state.draft.subclass===x.id?'✓ '+escape(text('selected')):escape(text('choose'))}</button></div></article>`).join('')}</div>`;
  }

  function abilityStep() {
    return abilityUI.render({draft:state.draft,locale:state.locale,t:text,esc:escape,
      score:insights.score,bonusFor:builderUI.bonusFor}) +
      insights.renderGrantOverview({draft:state.draft,locale:state.locale,esc:escape,
      cl:builderUI.classInfo(state.draft.class),bg:builderUI.backgroundInfo(state.draft.background),bonusFor:builderUI.bonusFor});
  }

  function reviewStep() {
    const d=state.draft;
    return `<section class="review-panel">
      <div class="review-head"><h2>${escape(text('reviewTitle'))}</h2>${badge(text(({approved:'approvedStatus',changes_requested:'changesRequestedStatus',rejected:'rejectedStatus',pending:'pending',draft:'draft'})[state.status] || 'draft'),'gold')}</div>
      <label class="form-field"><span>${escape(text('name'))}</span><input id="character-name" type="text" maxlength="80" autocomplete="off" placeholder="${escape(text('namePlaceholder'))}" value="${escape(d.name)}"><small>${escape(text('nameHint'))}</small></label>
      ${characterUI.review({draft:d,locale:state.locale,builder:builderUI,insights,level:state.savedCampaign.startingLevel,
        selectedSpecies:label(entry('species',d.species)),selectedClass:label(entry('classes',d.class)),
        selectedBackground:label(entry('backgrounds',d.background)),selectedSubclass:subclassOptions().find(x=>x.id===d.subclass)?.name||null})}
    </section>`;
  }

  function previewPanel() {
    const d=state.draft;
    const chosen = (group,id) => label(entry(group,id));
    return `<aside class="preview-panel" aria-label="${escape(text('livePreview'))}">
      <div class="eyebrow accent">${escape(text('livePreview'))}</div>
      <div class="preview-avatar">${d.species?image(entry('species',d.species)):'<span aria-hidden="true">✧</span>'}</div>
      <h3>${escape(d.name.trim()||text('characterLabel'))}</h3>
      <p>${escape(text('levelOne'))}</p>
      <div class="preview-progress"><div class="preview-progress-title"><span>${escape(text('progress'))}</span><strong>${completion()}/${totalRequired()}</strong></div><div class="progress-track"><span style="width:${completion()*100/totalRequired()}%"></span></div></div>
      <dl class="preview-details"><div><dt>${escape(text('stepSpecies'))}</dt><dd>${escape(chosen('species',d.species))}</dd></div>
      <div><dt>${escape(text('stepClass'))}</dt><dd>${escape(chosen('classes',d.class))}</dd></div>
      ${subclassRequired()?`<div><dt>${escape(text('stepSubclass'))}</dt><dd>${escape(subclassOptions().find(x=>x.id===d.subclass)?.name||text('notChosen'))}</dd></div>`:''}
      <div><dt>${escape(text('stepBackground'))}</dt><dd>${escape(chosen('backgrounds',d.background))}</dd></div>
      <div><dt>${escape(text('classProficiencies'))}</dt><dd>${Object.values(d.classChoices).flat().length}</dd></div>
       <div><dt>${escape(text('remainingMoney'))}</dt><dd>${builderUI.gb(builderUI.wallet(d).remaining)}</dd></div></dl>
      <div class="preview-disclaimer">${escape(text('statSample'))}</div>
    </aside>`;
  }

  function builder() {
    const step=state.step, keys=stepKeys(), kind=keys[step];
    const descriptions = keys.map(k=>'step'+k+'Hint');
    const props={draft:state.draft,locale:state.locale,t:text,esc:escape};
    const panels={Species:()=>optionCards('species','species'),Class:()=>optionCards('classes','class'),
      Subclass:()=>subclassStep(),Background:()=>optionCards('backgrounds','background'),
      Ability:()=>abilityStep()+builderUI.renderBackgroundBonuses(props),
      ClassTraining:()=>builderUI.renderClassTraining(props),
      BackgroundTraining:()=>builderUI.renderBackgroundTraining(props),
      StartingEquipment:()=>builderUI.renderPackages(props),
      Inventory:()=>builderUI.renderShop({...props,category:state.gearCategory,query:state.gearQuery})+characterUI.customInventory(props),
      Profile:()=>characterUI.profile(props),
      Review:()=>reviewStep()};
    const panel=panels[kind]();
    return `<div class="page builder-page"><div class="eyebrow accent">${escape(text('builderEyebrow'))} ${badge('D&D 2024','outline')}</div>
      <div class="builder-heading"><h1>${escape(text('builderTitle'))}</h1><p>${escape(text('builderIntro'))}</p></div>
      ${stepProgress()}
      <div class="builder-layout"><section class="builder-card" aria-labelledby="builder-step-heading"><div class="step-heading"><span class="eyebrow">${String(step+1).padStart(2,'0')} / ${keys.length}</span><h2 id="builder-step-heading">${escape(text('step'+kind))}</h2><p>${escape(text(descriptions[step]))}</p></div>
        ${panel}<footer class="builder-controls"><button type="button" class="btn quiet" data-action="previous" ${step===0?'disabled':''}>← ${escape(text('back'))}</button>
        <div class="control-right"><button type="button" class="btn secondary" data-action="save" ${state.busy?'disabled':''}>${state.busy?'<span class="spinner"></span> ':''}${escape(text('saveDraft'))}</button>
        ${step===keys.length-1?`<button class="btn primary" data-action="submit" ${state.busy?'disabled':''}>${escape(text('submit'))} →</button>`:`<button type="button" class="btn primary" data-action="next">${escape(text('next'))} →</button>`}</div>
        </footer></section>${previewPanel()}</div></div>`;
  }

  function sheet() {
    if(!state.draft.species||!state.draft.class){
      return '<div class="page">'+titleArea('characterLabel','sheetTitle','sheetSubtitle')+
        '<div class="empty-page"><span>✧</span><h2>'+escape(text('sheetNoData'))+'</h2><button class="btn primary" data-action="navigate" data-view="builder">'+escape(text('continueBuilding'))+'</button></div></div>';
    }
    const d=state.draft;
    return playUI.render({draft:d,game:state.gameplay,tab:state.sheetTab,locale:state.locale,
      builder:builderUI,insights,level:state.savedCampaign.startingLevel,status:state.status,role:state.role,
      speciesName:label(entry('species',d.species)),className:label(entry('classes',d.class)),
      backgroundName:label(entry('backgrounds',d.background)),
      subclassName:subclassOptions().find(x=>x.id===d.subclass)?.name||null});
  }

  function stub(titleKey,introKey,withRole=false) {
    return `<div class="page">${titleArea('previewBadge',titleKey,introKey)}<div class="panel stub-panel"><div class="stub-art">✧</div>
      ${withRole?`<div class="role-switcher"><span>${escape(text('rolePreview'))}</span><button data-action="role" data-role="player" class="btn ${state.role==='player'?'primary':'quiet'}">${escape(text('rolePlayer'))}</button><button data-action="role" data-role="dm" class="btn ${state.role==='dm'?'primary':'quiet'}">${escape(text('roleDm'))}</button></div>`:''}
      <p>${escape(text(withRole?'demoPrivacy':'readonlyNotice'))}</p>
      ${state.view==='settings'?`<button class="btn secondary" data-action="reset">${escape(text('reset'))}</button>`:''}
    </div></div>`;
  }

  function render() {
    renderNav();
    main.innerHTML = ({
      home, builder, sheet,
      party: () => campaignUI.renderParty({ role: state.role, status: state.status, draft: state.draft, campaign: state.savedCampaign, inviteCreated: state.inviteCreated, busy: state.campaignBusy, locale: state.locale, t: text, esc: escape, label, lookup: entry }),
      campaign: () => state.role === 'dm' ? campaignUI.renderCampaign({ campaign: state.campaign, busy: state.campaignBusy, locale: state.locale, t: text, esc: escape }) + libraryUI.render({locale:state.locale,role:state.role,preview:state.libraryPreview,error:state.libraryError,staged:state.libraryStaged,busy:state.libraryBusy,rights:state.libraryRights}) : stub('partyTitle','dmOnlyDemo'),
      journal: () => playUI.journal({game:state.gameplay,locale:state.locale}),
      settings: () => stub('settingsTitle','settingsIntro',true),
    })[state.view]();
    document.title = `D&D Atlas 2.0 · ${text(({home:'navHome',builder:'navBuilder',sheet:'navSheet',party:'navParty',journal:'navJournal',settings:'navSettings',campaign:'navCampaign'})[state.view])}`;
    applyFilter();
  }

  function applyFilter(){
    let visible=0;
    main.querySelectorAll('[data-option-card]').forEach(card=>{
      const match=(card.dataset.search||'').includes(state.query.toLowerCase());
      const allowed=state.filter==='all'||card.dataset.available==='true';
      card.hidden=!(match&&allowed);if(!card.hidden)visible++;
    });
    const empty=document.getElementById('empty-filter');if(empty)empty.hidden=visible!==0;
  }
  function canAdvance(){
    const d=state.draft;
    const checks={Species:()=>!!d.species,Class:()=>!!d.class,Subclass:()=>!subclassRequired()||subclassOptions().some(x=>x.id===d.subclass),
      Background:()=>!!d.background,Ability:()=>validAbilities()&&builderUI.bonusesValid(d),
      ClassTraining:()=>builderUI.classChoicesValid(d)&&builderUI.fighterChoicesValid(d)&&originUI.validHumanSkill(d),
      BackgroundTraining:()=>builderUI.backgroundChoicesValid(d)&&originUI.validHumanFeat(d),StartingEquipment:()=>builderUI.packReady(d),
      Inventory:()=>builderUI.wallet(d).remaining>=0,Profile:()=>true,Review:()=>true};
    return checks[stepKeys()[state.step]]();
  }

  // The prototype stores a real snapshot in IndexedDB, never in D1 or a remote API.
  let writeQueue=Promise.resolve();
  function snapshot() {
    return {draft:structuredClone(state.draft),saved:state.saved?structuredClone(state.saved):null,
      status:state.status,campaign:structuredClone(state.campaign),
      savedCampaign:structuredClone(state.savedCampaign),inviteCreated:state.inviteCreated,
      gameplay:structuredClone(state.gameplay)};
  }
  function persistLocal() {
    const copy=snapshot();
    writeQueue=writeQueue.catch(()=>{}).then(()=>localStore.save(copy));
    return writeQueue;
  }
  function saveGameplay() {
    persistLocal().then(()=>{},()=>notify(state.locale==='el'?
      'Αδυναμία τοπικής αποθήκευσης. Έλεγξε τον διαθέσιμο χώρο ή τις ρυθμίσεις browser.':
      'Local save failed. Check browser storage permissions or free space.'));
  }
  function mockSave(submit=false) {
    if(state.busy)return;
    if(submit&&(!selectable()||!validAbilities()||!state.draft.name.trim())){
      notify(!state.draft.name.trim()?text('missingName'):text('missingChoices'));return;
    }
    const previous={saved:state.saved,status:state.status,dirty:state.dirty};
    state.saved=structuredClone(state.draft);state.status=submit?'pending':'draft';state.dirty=false;
    state.busy=true;render();
    persistLocal().then(()=>{
      state.busy=false;render();
      notify(state.locale==='el'?(submit?'Υποβλήθηκε τοπικά στον DM demo.':'Πρόχειρο αποθηκεύτηκε σε αυτή τη συσκευή.'):
        (submit?'Submitted to local DM demo.':'Draft saved on this device.'));
    }).catch(()=>{
      state.saved=previous.saved;state.status=previous.status;state.dirty=previous.dirty;
      state.busy=false;render();notify(state.locale==='el'?'Η τοπική αποθήκευση απέτυχε.':'Local save failed.');
    });
  }

  function mockCampaignSave() {
    if(state.role!=='dm'||state.campaignBusy)return;
    if(!campaignUI.validateSettings(state.campaign).valid){notify(text('campaignInvalid'));return;}
    const old=structuredClone(state.savedCampaign);
    state.savedCampaign=structuredClone(state.campaign);state.campaignDirty=false;state.campaignBusy=true;render();
    persistLocal().then(()=>{
      state.campaignBusy=false;render();notify(state.locale==='el'?'Οι ρυθμίσεις αποθηκεύτηκαν τοπικά.':'Campaign settings saved locally.');
    }).catch(()=>{
      state.savedCampaign=old;state.campaignDirty=true;state.campaignBusy=false;render();
      notify(state.locale==='el'?'Η αποθήκευση απέτυχε.':'Save failed.');
    });
  }

  function mockReview(decision) {
    if(state.role!=='dm'||state.status!=='pending'||state.campaignBusy||
      !['approved','changes_requested','rejected'].includes(decision)){
      notify(text('unauthorizedDemo'));return;
    }
    const previous=state.status;
    state.status=decision;state.campaignBusy=true;render();
    persistLocal().then(()=>{
      state.campaignBusy=false;render();
      notify(state.locale==='el'?'Η απόφαση DM αποθηκεύτηκε τοπικά.':'DM decision saved locally.');
    }).catch(()=>{
      state.status=previous;state.campaignBusy=false;render();notify('Local save failed.');
    });
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action]');
    if (!trigger || trigger.disabled) return;
    const { action } = trigger.dataset;
    if (action === 'navigate') { navigate(trigger.dataset.view); return; }
    if (action === 'sheet-tab') {
      if(!['overview','actions','spells','equipment','features','description','notes'].includes(trigger.dataset.id))return;
      state.sheetTab=trigger.dataset.id;render();return;
    }
    if (action.startsWith('game-')) {
      const changed=playUI.adjust(state.gameplay,action,trigger.dataset.id,{draft:state.draft,builder:builderUI,insights,level:state.savedCampaign.startingLevel});
      if(changed){saveGameplay();render();}return;
    }
    if (action === 'remove-custom-item') {
      state.draft.customItems=(state.draft.customItems||[]).filter(item=>item.id!==trigger.dataset.id);
      markDirty();render();return;
    }
    if (action === 'step') { const next=Number(trigger.dataset.step);if(Number.isInteger(next)&&next>=0&&next<stepKeys().length){state.step=next;state.query='';state.gearQuery='';state.expandedOption=null;render();} }
    if (action === 'expand-option') {
      const key=trigger.dataset.kind+':'+trigger.dataset.id;
      const previous=state.expandedOption;
      state.expandedOption=previous===key?null:key;
      main.querySelectorAll('.identity-v2-card').forEach(card=>{
        const button=card.querySelector('[data-action="expand-option"]');
        const open=button && state.expandedOption===button.dataset.kind+':'+button.dataset.id;
        card.classList.toggle('expanded',!!open);
        button?.setAttribute('aria-expanded',String(!!open));
        const reveal=card.querySelector('.identity-v2-reveal');
        reveal?.setAttribute('aria-hidden',String(!open));
        const indicator=button?.querySelector('[aria-hidden="true"]');
        if(indicator)indicator.textContent=open?'−':'+';
      });
      return;
    }
    if (action === 'select-subclass') {
      if(!subclassOptions().some(x=>x.id===trigger.dataset.id))return;
      state.draft.subclass=trigger.dataset.id;markDirty();render();
    }
    if (action === 'choose') {
      const group = trigger.dataset.kind;
      const prop = group === 'classes' ? 'class' : group === 'backgrounds' ? 'background' : group;
      const next = catalog[group].find(item=>item.id===trigger.dataset.id);
      if (!next?.licensed) return;
      if (state.draft[prop] !== next.id && prop==='species') {
        state.draft.humanSkill=null;state.draft.humanFeat=null;state.draft.skilledChoices=[];
      }
      if (state.draft[prop] !== next.id && prop==='class') {
        state.draft.subclass=null;state.draft.classChoices={};state.draft.fightingStyle=null;state.draft.weaponMasteries=[]; state.draft.classPackage=null; state.draft.packageChoices={}; state.draft.purchases={};
      }
      if (state.draft[prop] !== next.id && prop==='background') {
        state.draft.backgroundChoices={}; state.draft.backgroundPackage=null; state.draft.bonusTwo=null;state.draft.bonusOne=null;
        state.draft.packageChoices={};state.draft.purchases={};
        const grants=new Set(builderUI.backgroundInfo(next.id)?.proficiencies?.map(x=>x.id)||[]);
        for(const id of Object.keys(state.draft.classChoices))state.draft.classChoices[id]=state.draft.classChoices[id].filter(x=>!grants.has(x));
        if(grants.has(state.draft.humanSkill))state.draft.humanSkill=null;
        state.draft.skilledChoices=state.draft.skilledChoices.filter(x=>!grants.has(x));
      }
      state.draft[prop] = next.id;state.expandedOption=group+':'+next.id;markDirty();render();
    }
    if (action === 'filter') { state.filter=trigger.dataset.filter; render(); }
    if (action === 'fighting-style') {
      const styles=['Archery','Defense','Dueling','Great Weapon Fighting','Protection','Two-Weapon Fighting'];
      if(state.draft.class!=='fighter'||!styles.includes(trigger.dataset.id))return;
      state.draft.fightingStyle=trigger.dataset.id;markDirty();render();
    }
    if (action === 'weapon-mastery') {
      const id=trigger.dataset.id;
      if(state.draft.class!=='fighter'||builderUI.itemById.get(id)?.category!=='weapons')return;
      const values=state.draft.weaponMasteries;
      if(values.includes(id))state.draft.weaponMasteries=values.filter(x=>x!==id);
      else if(values.length<3)state.draft.weaponMasteries=[...values,id];
      else{notify(text('masteryLimit'));return;}
      markDirty();render();
    }
    if (action === 'human-skill') {
      const id=trigger.dataset.id;
      if(state.draft.species!=='human'||!originUI.skillOptions.some(o=>o.id===id))return;
      if(originUI.alreadyGranted(state.draft,{exclude:'human'}).has(id)){notify(text('alreadyGranted'));return;}
      state.draft.humanSkill=state.draft.humanSkill===id?null:id;markDirty();render();return;
    }
    if (action === 'human-feat') {
      const id=trigger.dataset.id,original=originUI.backgroundFeat(state.draft);
      if(state.draft.species!=='human'||!originUI.FEATS[id])return;
      if(id===original&&!['skilled','magic-initiate'].includes(id)){notify(text('alreadyGranted'));return;}
      state.draft.humanFeat=state.draft.humanFeat===id?null:id;
      state.draft.skilledChoices=[];markDirty();render();return;
    }
    if (action === 'skilled-proficiency') {
      const id=trigger.dataset.id,choices=state.draft.skilledChoices||[];
      if(state.draft.species!=='human'||state.draft.humanFeat!=='skilled')return;
      if(![...originUI.skillOptions,...originUI.toolOptions].some(o=>o.id===id))return;
      if(originUI.alreadyGranted(state.draft,{exclude:'skilled'}).has(id)){notify(text('alreadyGranted'));return;}
      if(choices.includes(id))state.draft.skilledChoices=choices.filter(x=>x!==id);
      else if(choices.length<3)state.draft.skilledChoices=[...choices,id];
      else{notify(text('proficiencyLimit'));return;}
      markDirty();render();return;
    }
    if (action === 'class-proficiency' || action === 'background-proficiency') {
      const groups=action==='class-proficiency'?builderUI.classInfo(state.draft.class)?.skillChoices:builderUI.backgroundInfo(state.draft.background)?.skillChoices;
      const group=groups?.find(x=>x.id===trigger.dataset.group);
      const option=trigger.dataset.id;
      if (!group?.options.some(x=>x.id===option)) return;
      const values=action==='class-proficiency'?state.draft.classChoices:state.draft.backgroundChoices;
      const current=values[group.id]||[];
      if(!current.includes(option)&&(
        (action==='class-proficiency'&&builderUI.granted(builderUI.backgroundInfo(state.draft.background)).includes(option))||
        state.draft.humanSkill===option||
        (state.draft.humanFeat==='skilled'&&state.draft.skilledChoices.includes(option))
      )){notify(text('alreadyGranted'));return;}
      if(current.includes(option))values[group.id]=current.filter(x=>x!==option);
      else if(current.length<group.count)values[group.id]=[...current,option];
      else {notify(text('proficiencyLimit'));return;}
      markDirty();render();
    }
    if (action === 'ability-method') {
      const method=trigger.dataset.method;
      if (!['standard','pointbuy'].includes(method) || method===state.draft.abilityMethod) return;
      state.draft.abilityAllocations ||= {};
      state.draft.abilityAllocations[state.draft.abilityMethod]=[...state.draft.abilities];
      state.draft.abilities=[...(state.draft.abilityAllocations[method] || abilityUI.initialScores(method))];
      state.draft.abilityMethod=method;markDirty();render();
    }
    if (action === 'ability-adjust') {
      const index=Number(trigger.dataset.index),dir=Number(trigger.dataset.direction);
      const values=abilityUI.adjust(state.draft.abilities,index,dir,state.draft.abilityMethod);
      if (!values) return;
      state.draft.abilities=values;markDirty();render();
    }
    if (action === 'bonus-mode') {state.draft.bonusMode=trigger.dataset.mode;markDirty();render();}
    if (action === 'bonus-select') {
      const prop=trigger.dataset.boost==='2'?'bonusTwo':'bonusOne';
      const other=prop==='bonusTwo'?'bonusOne':'bonusTwo';
      const value=trigger.dataset.ability;
      if (state.draft[other]===value)state.draft[other]=null;
      state.draft[prop]=state.draft[prop]===value?null:value;markDirty();render();
    }
    if(action==='select-package'){
      const prop=trigger.dataset.origin==='class'?'classPackage':'backgroundPackage';
      state.draft[prop]=trigger.dataset.id;
      for(const key of Object.keys(state.draft.packageChoices))if(key.startsWith(trigger.dataset.origin+':'))delete state.draft.packageChoices[key];
      markDirty();render();
    }
    if(action==='gear-category'){state.gearCategory=trigger.dataset.category;state.gearQuery='';render();}
    if(action==='shop-add'||action==='shop-remove'){
      const id=trigger.dataset.id;
      const item=builderUI.itemById.get(id);
      if(!item?.cost||!Number.isInteger(item.cost.cp))return;
      const previous=state.draft.purchases[id]||0;
      if(action==='shop-add' && item.cost.cp>builderUI.wallet(state.draft).remaining)return;
      const next=action==='shop-add'?previous+1:Math.max(0,previous-1);
      if(next)state.draft.purchases[id]=next; else delete state.draft.purchases[id];
      markDirty();render();
    }
    if (action === 'previous') { state.step=Math.max(0,state.step-1);state.query='';state.gearQuery='';state.expandedOption=null;render(); }
    if (action === 'next') {
      if (!canAdvance()) { notify(text('selectionRequired')); return; }
      state.step=Math.min(stepKeys().length-1,state.step+1);state.query='';state.gearQuery='';state.expandedOption=null;render();
    }
    if (action === 'save') mockSave(false);
    if (action === 'submit') mockSave(true);
    if (action === 'role' || action === 'role-mode') { state.role=action==='role-mode'?trigger.dataset.roleMode:trigger.dataset.role; if (state.role !== 'dm' && state.view === 'campaign') { state.view='party'; } render(); }
    if (action === 'save-campaign') mockCampaignSave();
    if (action === 'review') mockReview(trigger.dataset.decision);
    if (action === 'create-invite' && state.role === 'dm') { state.inviteCreated = true; render(); notify(text('inviteGeneratedDemo')); }
    if (action === 'preview-join' && state.role === 'dm') { state.role = 'player'; render(); notify(text('joinedDemo')); }
    if (action === 'library-demo-stage' && state.role === 'dm' && state.libraryPreview?.valid && state.libraryRights && !state.libraryBusy) {
      state.libraryStaged.push({ ...state.libraryPreview });
      state.libraryPreview = null; state.libraryRights = false; state.libraryError = null;
      render(); notify(libraryUI.dictionary[state.locale].localOnly);
    }
    if (action === 'library-demo-clear' && state.role === 'dm') { state.libraryPreview=null;state.libraryError=null;state.libraryRights=false;render(); }
    if (action === 'library-demo-remove' && state.role === 'dm') {
      const i=Number(trigger.dataset.packIndex);
      if (Number.isInteger(i) && i>=0 && i<state.libraryStaged.length) { state.libraryStaged.splice(i,1);render(); }
    }
    if(action==='reset'){
      if(!window.confirm(state.locale==='el'?'Να διαγραφούν όλα τα τοπικά δεδομένα του prototype;':'Erase all local prototype data?'))return;
      localStore.clear().then(()=>{
        state.libraryPreview=null;state.libraryError=null;state.libraryStaged=[];state.libraryBusy=false;state.libraryRights=false;
        state.draft=defaultDraft();state.saved=null;state.dirty=false;state.status='draft';state.step=0;
        state.inviteCreated=false;state.gameplay=playUI.defaults();state.campaign=campaignUI.originalSettings();
        state.savedCampaign=campaignUI.originalSettings();state.campaignDirty=false;render();notify(text('resetDone'));
      },()=>notify('Local data could not be cleared.'));return;
    }
    if (action === 'rest') {state.gameplay.shortRests++;saveGameplay();render();}
  });

  document.addEventListener('submit',(event)=>{
    const form=event.target, id=form.id;
    if(!['custom-item-form','play-spell-form','play-journal-form','play-notes-form'].includes(id))return;
    event.preventDefault();
    if(id==='custom-item-form'){
      const item=characterUI.normalizeCustom(Object.fromEntries(new FormData(form).entries()));
      if(!item){notify(state.locale==='el'?'Έλεγξε τα στοιχεία του αντικειμένου.':'Check item details.');return;}
      state.draft.customItems||=[];state.draft.customItems.push(item);markDirty();render();return;
    }
    if(id==='play-notes-form'){
      state.gameplay.personalNotes=String(form.querySelector('#play-personal-notes')?.value||'').slice(0,20000);
    } else if(id==='play-spell-form'){
      const values=new FormData(form),name=String(values.get('name')||'').trim().slice(0,100),level=Number(values.get('level'));
      if(!name||!Number.isInteger(level)||level<0||level>9)return;
      state.gameplay.spellNotes.push({id:crypto.randomUUID(),name,level});
    } else if(id==='play-journal-form'){
      const values=new FormData(form),title=String(values.get('title')||'').trim().slice(0,120),
        body=String(values.get('body')||'').trim().slice(0,10000),visibility=values.get('visibility')==='campaign'?'campaign':'private';
      if(!title||!body){notify(playUI.T[state.locale].required);return;}
      state.gameplay.journal.push({id:crypto.randomUUID(),title,body,visibility,createdAt:new Date().toISOString()});
    }
    saveGameplay();render();notify(playUI.T[state.locale].savedLocal);
  });

  document.addEventListener('input',(event)=>{
    const target=event.target;
    if (target.id==='choice-search') { state.query=target.value; applyFilter(); }
    if (target.id==='gear-search') { state.gearQuery=target.value;main.querySelectorAll('.shop-item').forEach(card=>{card.hidden=!card.dataset.search.includes(state.gearQuery.toLowerCase());}); }
    if (target.id==='character-name') { state.draft.name=target.value; markDirty(); }
    if (target.id==='character-story') { state.draft.backgroundStory=target.value.slice(0,10000);markDirty(); }
    if (target.id==='campaign-name') { state.campaign.name=target.value; state.campaignDirty=true; const preview=main.querySelector('.campaign-info h3'); if (preview) preview.textContent = target.value.trim() || text('campaignName'); renderNav(); }
  });
  document.addEventListener('change',(event)=>{
    const target=event.target;
    if(target.dataset.gameSlot){
      const level=target.dataset.gameSlot;
      const total=Number(target.value);
      if(!/^[1-9]$/.test(level)||!Number.isInteger(total)||total<0||total>20)return;
      const old=state.gameplay.spellSlots[level]||{total:0,used:0};
      state.gameplay.spellSlots[level]={total,used:Math.min(old.used,total)};
      saveGameplay();render();return;
    }
    if(target.id==='play-worn-armor'){
      if(target.value&&!characterUI.ownedArmor(state.draft,builderUI,insights).some(x=>x.id===target.value))return;
      state.draft.equippedArmor=target.value||null;saveGameplay();render();return;
    }
    if(target.id==='play-shield'){
      state.draft.shieldEquipped=target.checked&&insights.contents(state.draft,builderUI).has('shield');
      saveGameplay();render();return;
    }
    if (target.id === 'library-rights-confirm') { state.libraryRights=target.checked; render(); return; }
    if (target.id==='character-alignment') {state.draft.alignment=characterUI.ALIGNMENTS.some(row=>row[0]===target.value)?target.value:'';markDirty();render();return;}
    if (target.id==='review-worn-armor') {
      if(target.value&&!characterUI.ownedArmor(state.draft,builderUI,insights).some(x=>x.id===target.value))return;
      state.draft.equippedArmor=target.value||null;markDirty();render();return;
    }
    if (target.id==='review-shield') {state.draft.shieldEquipped=target.checked&&insights.contents(state.draft,builderUI).has('shield');markDirty();render();return;}
    if (target.id==='character-portrait') {
      const file=target.files?.[0];if(!file)return;
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>900*1024){notify(state.locale==='el'?'Δέχονται μόνο PNG/JPEG/WebP έως 900 KB.':'PNG/JPEG/WebP only, up to 900 KB.');return;}
      const reader=new FileReader();reader.onload=()=>{
        const value=String(reader.result||'');if(!new RegExp('^data:image/(png|jpeg|webp);base64,').test(value))return;
        state.draft.portraitData=value;markDirty();render();
      };reader.readAsDataURL(file);return;
    }
    if (target.id === 'library-json-file' && state.role === 'dm') {
      const file=target.files?.[0]; if (!file) return;
      state.libraryBusy=true;state.libraryError=null;state.libraryPreview=null;state.libraryRights=false;render();
      Promise.resolve().then(async () => {
        if (file.size>512*1024) return {valid:false,error:'tooBig'};
        return libraryUI.inspectJSON(await file.text(),file.size);
      }).then(result => {
        state.libraryPreview=result.valid?result:null;
        state.libraryError=result.valid?null:result.error;
      }).catch(() => {state.libraryError='invalidJson';}).finally(()=>{
        state.libraryBusy=false;render();
      });
      return;
    }

    if (target.id==='lang-select') { state.locale=target.value==='el'?'el':'en'; render(); }
    if (target.dataset.packageChoice !== undefined) {
      state.draft.packageChoices[target.dataset.packageChoice]=target.value;markDirty();render();
    }
    if (target.dataset.campaignField !== undefined) {
      const key=target.dataset.campaignField;
      const integerFields=['startingLevel','characterLimit','inviteDays'];
      state.campaign[key] = target.type==='checkbox' ? target.checked : integerFields.includes(key) ? Number(target.value) : target.value;
      state.campaignDirty=true; renderNav();
    }

  });
  render();
  localStore.load().then(saved=>{
    if(saved){
      state.draft=Object.assign(defaultDraft(),saved.draft||{});
      state.saved=saved.saved||null;
      state.status=['draft','pending','approved','changes_requested','rejected'].includes(saved.status)?saved.status:'draft';
      state.campaign=Object.assign(campaignUI.originalSettings(),saved.campaign||{});
      state.savedCampaign=Object.assign(campaignUI.originalSettings(),saved.savedCampaign||{});
      state.inviteCreated=!!saved.inviteCreated;
      state.gameplay=playUI.normalize(saved.gameplay);
      state.dirty=false;state.campaignDirty=false;
    }
    state.localLoaded=true;render();
  }).catch(()=>{
    state.localLoaded=true;render();
    notify(state.locale==='el'?'Η τοπική αποθήκευση δεν είναι διαθέσιμη.':'Local persistence is unavailable.');
  });
})();
