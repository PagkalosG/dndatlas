/* Atlas v2 concept UI: mock interactions only. Real permissions and D&D calculations belong on the Worker. */
(() => {
  'use strict';
  const catalog = window.ATLAS_V2_DEMO;
  const campaignUI = window.ATLAS_V2_CAMPAIGN_FLOW;
  const libraryUI = window.ATLAS_V2_LIBRARY_UI;
  const builderUI = window.ATLAS_V2_BUILDER;
  const insights = window.ATLAS_V2_INSIGHTS;
  if (!insights) throw new Error('Missing Atlas 2024 insights components');
  if (!builderUI) throw new Error('Missing 2024 Builder components');
  if (!campaignUI) throw new Error('Missing campaign UI components');
  if (!libraryUI) throw new Error('Missing library UI components');
  if (!catalog) throw new Error('Missing Atlas UI fixtures');

  const array = [15, 14, 13, 12, 10, 8];
  const abilityKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const stepKeys = ['Species', 'Class', 'ClassTraining', 'Background', 'BackgroundTraining', 'Ability', 'StartingEquipment', 'Inventory', 'Review'];
  const defaultDraft = () => ({ name: '', species: null, class: null, background: null, equipment: null, abilities: [15, 14, 13, 12, 10, 8],
    classChoices: {}, backgroundChoices: {}, fightingStyle: null, weaponMasteries: [], bonusMode: 'split', bonusTwo: null, bonusOne: null,
    classPackage: null, backgroundPackage: null, packageChoices: {}, purchases: {} });
  const state = { locale: 'en', view: 'home', role: 'player', step: 0, draft: defaultDraft(), saved: null, dirty: false, status: 'draft', filter: 'all', query: '', gearCategory: 'weapons', gearQuery: '', busy: false, campaign: campaignUI.originalSettings(), savedCampaign: campaignUI.originalSettings(), campaignBusy: false, campaignDirty: false, inviteCreated: false, libraryPreview: null, libraryError: null, libraryStaged: [], libraryBusy: false, libraryRights: false };
  const main = document.getElementById('main');
  const text = (key) => catalog.strings[state.locale][key] ?? key;
  const label = (item) => item?.title?.[state.locale] ?? text('notChosen');
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const image = (item) => item.photo ? `<picture><source srcset="${escape(item.photo)}" type="image/webp"><img src="${escape(item.art)}" alt="${escape(item.title?.[state.locale] || text('originalArt'))}" loading="lazy" decoding="async"></picture>` : `<img src="${escape(item.art)}" alt="${escape(item.title?.[state.locale] || text('originalArt'))}" loading="lazy" decoding="async">`;
  const entry = (group, id) => catalog[group].find((item) => item.id === id);
  const completion = () => [!!state.draft.species, !!state.draft.class, (builderUI.classChoicesValid(state.draft)&&builderUI.fighterChoicesValid(state.draft)), !!state.draft.background, builderUI.backgroundChoicesValid(state.draft), builderUI.bonusesValid(state.draft), builderUI.packReady(state.draft)].filter(Boolean).length;
  const selectable = () => completion() === 7 && validAbilities() && builderUI.wallet(state.draft).remaining >= 0;
  const validAbilities = () => [...state.draft.abilities].sort((a,b)=>a-b).join(',') === [...array].sort((a,b)=>a-b).join(',');
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
    document.getElementById('role-pill').textContent = text(state.role === 'dm' ? 'roleDm' : 'rolePlayer');
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
    return `<nav class="steps" aria-label="Character creation progress">${stepKeys.map((key,i)=>`<button class="step ${i===state.step?'current':''} ${i<state.step?'complete':''}" type="button" data-action="step" data-step="${i}" ${i===state.step?'aria-current="step"':''}>
      <span class="step-number">${i<state.step?'✓':i+1}</span><span>${escape(text('step'+key))}</span>
    </button>`).join('')}</nav>`;
  }

  function optionCards(group, key) {
    return `<div class="catalog-toolbar"><label class="search-box"><span aria-hidden="true">⌕</span><input id="choice-search" type="search" placeholder="${escape(text('filterPlaceholder'))}" aria-label="${escape(text('search'))}" value="${escape(state.query)}"></label>
      <div class="filter-set" role="group" aria-label="Filters"><button type="button" data-action="filter" data-filter="all" class="filter-chip ${state.filter==='all'?'active':''}">${escape(text('showAll'))}</button>
      <button type="button" data-action="filter" data-filter="available" class="filter-chip ${state.filter==='available'?'active':''}">${escape(text('availableOnly'))}</button></div></div>
      <div class="option-grid" id="choice-grid">${catalog[group].map((item) => {
        const selected = state.draft[key] === item.id;
        return `<button type="button" class="illustrated-option ${selected?'selected':''} ${!item.licensed?'locked':''}" data-action="choose" data-id="${item.id}" data-kind="${group}" data-search="${escape((item.title.en+' '+item.title.el).toLowerCase())}" ${!item.licensed?'disabled':''} aria-pressed="${selected}">
          <div class="illustration">${image(item)}<span class="art-corner" title="${escape(text('originalArt'))}">✧</span>${selected?'<span class="selected-check" aria-hidden="true">✓</span>':''}</div>
          <div class="option-detail"><div class="option-title-row"><strong>${escape(label(item))}</strong>${!item.licensed?'<span class="lock-symbol" aria-hidden="true">♢</span>':''}</div>
          <p>${escape(item.description[state.locale])}</p><span class="option-source">${escape(item.source)}</span>
          ${!item.licensed?`<span class="lock-hint">${escape(text('lockedHint'))}</span>`:''}</div>
        </button>`;
      }).join('')}</div>${insights.renderSelectionDetails({item:entry(group,state.draft[key]),group,locale:state.locale,esc:escape,builder:builderUI})}<div class="empty-filter" id="empty-filter" hidden>${escape(text('noResults'))}</div>
      <p class="art-disclaimer">${escape(text('originalArtworkNote'))}</p>`;
  }

  function abilityStep() {
    const abilities = state.draft.abilities;
    return `<div class="ability-head">${badge(text('arrayInfo'), 'muted')}
      <span>${escape(text('statSample'))}</span></div>
      <div class="ability-grid">${abilityKeys.map((key,i)=>{const result=insights.score(state.draft,key,builderUI.bonusFor);return `<label class="ability-select"><span>${escape(text('ability'+key[0].toUpperCase()+key.slice(1)))}</span><select data-ability="${i}" aria-label="${escape(text('ability'+key[0].toUpperCase()+key.slice(1)))}">
      ${array.map(value=>`<option value="${value}" ${abilities[i]===value?'selected':''}>${value}</option>`).join('')}</select><div class="ability-derived"><span>${escape(insights.L[state.locale].base)} ${result.base} ${result.bonus?`+ ${result.bonus}`:''}</span><strong>${insights.L[state.locale].final}: ${result.total}</strong><b class="ability-modifier">${escape(insights.L[state.locale].modifier)} ${insights.sign(result.modifier)}</b></div></label>`;}).join('')}</div>
      ${insights.renderGrantOverview({draft:state.draft,locale:state.locale,esc:escape,cl:builderUI.classInfo(state.draft.class),bg:builderUI.backgroundInfo(state.draft.background),bonusFor:builderUI.bonusFor})}
      ${!validAbilities()?`<div class="inline-warning" role="alert">${escape(text('selectionRequired'))} — ${escape(text('arrayInfo'))}</div>`:''}`;
  }

  function reviewStep() {
    const d=state.draft;
    const rows=[['stepSpecies','species'],['stepClass','class'],['stepBackground','background']];
    const chosenClass=builderUI.classInfo(d.class), chosenBg=builderUI.backgroundInfo(d.background);
    const selectedSkills=Object.values(d.classChoices).flat().map(id=>id.replace(/^skill-/, '').replaceAll('-',' ')).join(', ') || '—';
    const gold=builderUI.wallet(d);
    return `<div class="review-panel"><div class="review-head"><h2>${escape(text('reviewTitle'))}</h2>${badge(text(({approved:'approvedStatus',changes_requested:'changesRequestedStatus',rejected:'rejectedStatus',pending:'pending',draft:'draft'})[state.status] || 'draft'), state.status==='pending'?'gold':'muted')}</div>
      <label class="form-field"><span>${escape(text('name'))}</span><input id="character-name" type="text" maxlength="80" autocomplete="off" placeholder="${escape(text('namePlaceholder'))}" value="${escape(d.name)}"><small>${escape(text('nameHint'))}</small></label>
      <div class="review-rows">${rows.map(([key,id])=>`<div class="review-row"><span>${escape(text(key))}</span><strong>${escape(label(entry(id==='class'?'classes':id==='background'?'backgrounds':id, d[id])))}</strong></div>`).join('')}
        <div class="review-row"><span>${escape(text('classProficiencies'))}</span><strong>${escape(selectedSkills)}</strong></div>
        ${abilityKeys.map(key=>{const x=insights.score(d,key,builderUI.bonusFor);return `<div class="review-row"><span>${escape(key.toUpperCase())}</span><strong>${x.total} (${insights.sign(x.modifier)})</strong></div>`;}).join('')}
        ${d.class==='fighter'?`<div class="review-row"><span>${escape(text('fightingStyle'))}</span><strong>${escape(d.fightingStyle||'—')}</strong></div><div class="review-row"><span>${escape(text('weaponMastery'))}</span><strong>${escape(d.weaponMasteries.join(', ')||'—')}</strong></div>`:''}
        <div class="review-row"><span>${escape(text('originFeat'))}</span><strong>${escape(chosenBg?.feat?.name||'—')}</strong></div>
        <div class="review-row"><span>${escape(text('stepClassTraining'))}</span><strong>${escape(chosenClass?.name||'—')}</strong></div>
        <div class="review-row"><span>${escape(text('stepStartingEquipment'))}</span><strong>${builderUI.pack(d,'class')?'✓':'—'} / ${builderUI.pack(d,'background')?'✓':'—'}</strong></div>
        <div class="review-row"><span>${escape(text('remainingMoney'))}</span><strong>${builderUI.gb(gold.remaining)}</strong></div>
        <div class="review-row"><span>${escape(text('purchasedItems'))}</span><strong>${Object.values(d.purchases).reduce((a,b)=>a+b,0)}</strong></div></div>
      <div class="inline-info">✧ ${escape(text('selectionInfo'))}</div></div>`;
  }

  function previewPanel() {
    const d=state.draft;
    const chosen = (group,id) => label(entry(group,id));
    return `<aside class="preview-panel" aria-label="${escape(text('livePreview'))}">
      <div class="eyebrow accent">${escape(text('livePreview'))}</div>
      <div class="preview-avatar">${d.species?image(entry('species',d.species)):'<span aria-hidden="true">✧</span>'}</div>
      <h3>${escape(d.name.trim()||text('characterLabel'))}</h3>
      <p>${escape(text('levelOne'))}</p>
      <div class="preview-progress"><div class="preview-progress-title"><span>${escape(text('progress'))}</span><strong>${completion()}/7</strong></div><div class="progress-track"><span style="width:${completion()*100/7}%"></span></div></div>
      <dl class="preview-details"><div><dt>${escape(text('stepSpecies'))}</dt><dd>${escape(chosen('species',d.species))}</dd></div>
      <div><dt>${escape(text('stepClass'))}</dt><dd>${escape(chosen('classes',d.class))}</dd></div>
      <div><dt>${escape(text('stepBackground'))}</dt><dd>${escape(chosen('backgrounds',d.background))}</dd></div>
      <div><dt>${escape(text('classProficiencies'))}</dt><dd>${Object.values(d.classChoices).flat().length}</dd></div>
       <div><dt>${escape(text('remainingMoney'))}</dt><dd>${builderUI.gb(builderUI.wallet(d).remaining)}</dd></div></dl>
      <div class="preview-disclaimer">${escape(text('statSample'))}</div>
    </aside>`;
  }

  function builder() {
    const step=state.step, kind=stepKeys[step];
    const descriptions = stepKeys.map(k=>'step'+k+'Hint');
    const props={draft:state.draft,locale:state.locale,t:text,esc:escape};
    const panels=[()=>optionCards('species','species'),()=>optionCards('classes','class'),
      ()=>builderUI.renderClassTraining(props),()=>optionCards('backgrounds','background'),
      ()=>builderUI.renderBackgroundTraining(props),()=>abilityStep()+builderUI.renderBackgroundBonuses(props),
      ()=>builderUI.renderPackages(props),()=>builderUI.renderShop({...props,category:state.gearCategory,query:state.gearQuery}),
      ()=>reviewStep()];
    const panel=panels[step]();
    return `<div class="page builder-page"><div class="eyebrow accent">${escape(text('builderEyebrow'))} ${badge('D&D 2024','outline')}</div>
      <div class="builder-heading"><h1>${escape(text('builderTitle'))}</h1><p>${escape(text('builderIntro'))}</p></div>
      ${stepProgress()}
      <div class="builder-layout"><section class="builder-card" aria-labelledby="builder-step-heading"><div class="step-heading"><span class="eyebrow">${String(step+1).padStart(2,'0')} / ${stepKeys.length}</span><h2 id="builder-step-heading">${escape(text('step'+kind))}</h2><p>${escape(text(descriptions[step]))}</p></div>
        ${panel}<footer class="builder-controls"><button type="button" class="btn quiet" data-action="previous" ${step===0?'disabled':''}>← ${escape(text('back'))}</button>
        <div class="control-right"><button type="button" class="btn secondary" data-action="save" ${state.busy?'disabled':''}>${state.busy?'<span class="spinner"></span> ':''}${escape(text('saveDraft'))}</button>
        ${step===stepKeys.length-1?`<button class="btn primary" data-action="submit" ${state.busy?'disabled':''}>${escape(text('submit'))} →</button>`:`<button type="button" class="btn primary" data-action="next">${escape(text('next'))} →</button>`}</div>
        </footer></section>${previewPanel()}</div></div>`;
  }

  function sheet() {
    const d=state.draft;
    const name=d.name.trim()||text('characterLabel');
    const sp=entry('species',d.species), cl=entry('classes',d.class);
    return `<div class="page">${titleArea('characterLabel','sheetTitle','sheetSubtitle')}
      ${!d.species||!d.class?`<div class="empty-page"><span>✧</span><h2>${escape(text('sheetNoData'))}</h2><button class="btn primary" data-action="navigate" data-view="builder">${escape(text('continueBuilding'))}</button></div>`:`
      <div class="sheet-hero"><div class="sheet-art">${image(sp)}</div><div class="sheet-identity"><div class="eyebrow accent">${escape(text('levelOne'))}</div><h2>${escape(name)}</h2><p>${escape(label(sp))} · ${escape(label(cl))}</p>
      <div class="sheet-badges">${badge(text(state.status),'gold')}${badge(text('private'),'muted')}</div>
      <div class="sheet-actions"><button class="btn secondary" data-action="navigate" data-view="builder">${escape(text('edit'))}</button></div></div></div>
      <div class="stat-grid"><div class="stat-box"><span>${escape(text('health'))}</span><strong>—</strong><small>${escape(text('statSample'))}</small></div>
      <div class="stat-box"><span>${escape(text('armor'))}</span><strong>—</strong></div><div class="stat-box"><span>${escape(text('initiative'))}</span><strong>—</strong></div>
      <div class="stat-box"><span>${escape(text('prof'))}</span><strong>—</strong></div></div>
      <div class="sheet-lower"><div class="panel"><h3>${escape(text('features'))}</h3><p>${escape(text('selectionInfo'))}</p></div><div class="panel"><h3>${escape(text('restShort'))} / ${escape(text('restLong'))}</h3><p>${escape(text('restHint'))}</p>
      <div class="rest-controls"><button class="btn quiet" data-action="rest">♧ ${escape(text('restShort'))}</button><button class="btn quiet" data-action="rest">☾ ${escape(text('restLong'))}</button></div></div></div>`}
    </div>`;
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
      journal: () => stub('journalTitle','journalIntro'),
      settings: () => stub('settingsTitle','settingsIntro',true),
    })[state.view]();
    document.title = `D&D Atlas 2.0 · ${text(({home:'navHome',builder:'navBuilder',sheet:'navSheet',party:'navParty',journal:'navJournal',settings:'navSettings',campaign:'navCampaign'})[state.view])}`;
    applyFilter();
  }

  function applyFilter() {
    const cards = main.querySelectorAll('[data-action="choose"]');
    let visible = 0;
    cards.forEach((card) => {
      const found = card.dataset.search.includes(state.query.toLowerCase());
      const allowed = state.filter === 'all' || !card.disabled;
      const shown = found && allowed;
      card.hidden = !shown;
      if (shown) visible++;
    });
    const empty = document.getElementById('empty-filter');
    if (empty) empty.hidden = visible !== 0;
  }

  function canAdvance() {
    const d=state.draft;
    return [() => !!d.species, () => !!d.class, () => builderUI.classChoicesValid(d) && builderUI.fighterChoicesValid(d),
      () => !!d.background, () => builderUI.backgroundChoicesValid(d),
      () => validAbilities() && builderUI.bonusesValid(d), () => builderUI.packReady(d),
      () => builderUI.wallet(d).remaining >= 0, () => true][state.step]();
  }

  function mockSave(submit=false) {
    if (state.busy) return;
    if (submit && (!selectable() || !validAbilities() || !state.draft.name.trim())) {
      notify(!state.draft.name.trim() ? text('missingName') : text('missingChoices'));
      return;
    }
    state.busy = true;
    render();
    setTimeout(() => {
      state.saved = structuredClone(state.draft);
      state.dirty = false;
      state.status = submit ? 'pending' : 'draft';
      state.busy = false;
      render();
      notify(text(submit ? 'submitted' : 'saved') + '. ' + text('demoOnly'));
    }, 450);
  }

  function mockCampaignSave() {
    if (state.role !== 'dm' || state.campaignBusy) return;
    const checked = campaignUI.validateSettings(state.campaign);
    if (!checked.valid) { notify(text('campaignInvalid')); return; }
    state.campaignBusy = true;
    render();
    setTimeout(() => {
      state.savedCampaign = structuredClone(state.campaign);
      state.campaignDirty = false;
      state.campaignBusy = false;
      render();
      notify(text('campaignSavedDemo') + '. ' + text('demoOnly'));
    }, 400);
  }

  function mockReview(decision) {
    if (state.role !== 'dm' || state.status !== 'pending' || state.campaignBusy || !['approved','changes_requested','rejected'].includes(decision)) {
      notify(text('unauthorizedDemo'));
      return;
    }
    state.campaignBusy = true;
    render();
    setTimeout(() => {
      state.campaignBusy = false;
      state.status = decision;
      render();
      notify(text({approved:'reviewApprovedDemo',changes_requested:'reviewChangesDemo',rejected:'reviewRejectedDemo'}[decision]) + '. ' + text('demoOnly'));
    }, 400);
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action]');
    if (!trigger || trigger.disabled) return;
    const { action } = trigger.dataset;
    if (action === 'navigate') navigate(trigger.dataset.view);
    if (action === 'step') { state.step=Number(trigger.dataset.step);state.query='';state.gearQuery=''; render(); }
    if (action === 'choose') {
      const group = trigger.dataset.kind;
      const prop = group === 'classes' ? 'class' : group === 'backgrounds' ? 'background' : group;
      const next = catalog[group].find(item=>item.id===trigger.dataset.id);
      if (!next?.licensed) return;
      if (state.draft[prop] !== next.id && prop==='class') {
        state.draft.classChoices={};state.draft.fightingStyle=null;state.draft.weaponMasteries=[]; state.draft.classPackage=null; state.draft.packageChoices={}; state.draft.purchases={};
      }
      if (state.draft[prop] !== next.id && prop==='background') {
        state.draft.backgroundChoices={}; state.draft.backgroundPackage=null; state.draft.bonusTwo=null;state.draft.bonusOne=null;
        state.draft.packageChoices={};state.draft.purchases={};
      }
      state.draft[prop] = next.id; markDirty(); render();
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
    if (action === 'class-proficiency' || action === 'background-proficiency') {
      const groups=action==='class-proficiency'?builderUI.classInfo(state.draft.class)?.skillChoices:builderUI.backgroundInfo(state.draft.background)?.skillChoices;
      const group=groups?.find(x=>x.id===trigger.dataset.group);
      const option=trigger.dataset.id;
      if (!group?.options.some(x=>x.id===option)) return;
      const values=action==='class-proficiency'?state.draft.classChoices:state.draft.backgroundChoices;
      const current=values[group.id]||[];
      if(current.includes(option))values[group.id]=current.filter(x=>x!==option);
      else if(current.length<group.count)values[group.id]=[...current,option];
      else {notify(text('proficiencyLimit'));return;}
      markDirty();render();
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
    if (action === 'previous') { state.step=Math.max(0,state.step-1);state.query='';state.gearQuery=''; render(); }
    if (action === 'next') {
      if (!canAdvance()) { notify(text('selectionRequired')); return; }
      state.step=Math.min(stepKeys.length-1,state.step+1);state.query='';state.gearQuery=''; render();
    }
    if (action === 'save') mockSave(false);
    if (action === 'submit') mockSave(true);
    if (action === 'role') { state.role=trigger.dataset.role; if (state.role !== 'dm' && state.view === 'campaign') { state.view='party'; } render(); }
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
    if (action === 'reset') { state.libraryPreview=null;state.libraryError=null;state.libraryStaged=[];state.libraryBusy=false;state.libraryRights=false;  state.draft=defaultDraft();state.saved=null;state.dirty=false;state.status='draft';state.step=0;state.inviteCreated=false;state.campaign=campaignUI.originalSettings();state.savedCampaign=campaignUI.originalSettings();state.campaignDirty=false;render();notify(text('resetDone')); }
    if (action === 'rest') notify(text('restDemo'));
  });

  document.addEventListener('input',(event)=>{
    const target=event.target;
    if (target.id==='choice-search') { state.query=target.value; applyFilter(); }
    if (target.id==='gear-search') { state.gearQuery=target.value;main.querySelectorAll('.shop-item').forEach(card=>{card.hidden=!card.dataset.search.includes(state.gearQuery.toLowerCase());}); }
    if (target.id==='character-name') { state.draft.name=target.value; markDirty(); }
    if (target.id==='campaign-name') { state.campaign.name=target.value; state.campaignDirty=true; const preview=main.querySelector('.campaign-info h3'); if (preview) preview.textContent = target.value.trim() || text('campaignName'); renderNav(); }
  });
  document.addEventListener('change',(event)=>{
    const target=event.target;
    if (target.id === 'library-rights-confirm') { state.libraryRights=target.checked; render(); return; }
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
    if (target.dataset.ability !== undefined) {
      const index = Number(target.dataset.ability);
      const nextValue = Number(target.value);
      const existing = state.draft.abilities.indexOf(nextValue);
      if (existing !== -1 && existing !== index) {
        state.draft.abilities[existing] = state.draft.abilities[index];
      }
      state.draft.abilities[index] = nextValue;
      markDirty(); render();
    }
  });
  render();
})();
