/* Atlas v2 concept UI: mock interactions only. Real permissions and D&D calculations belong on the Worker. */
(() => {
  'use strict';
  const catalog = window.ATLAS_V2_DEMO;
  const campaignUI = window.ATLAS_V2_CAMPAIGN_FLOW;
  if (!campaignUI) throw new Error('Missing campaign UI components');
  if (!catalog) throw new Error('Missing Atlas UI fixtures');

  const array = [15, 14, 13, 12, 10, 8];
  const abilityKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const stepKeys = ['Species', 'Class', 'Background', 'Ability', 'Equipment', 'Review'];
  const defaultDraft = () => ({ name: '', species: null, class: null, background: null, equipment: null, abilities: [15, 14, 13, 12, 10, 8] });
  const state = { locale: 'en', view: 'home', role: 'player', step: 0, draft: defaultDraft(), saved: null, dirty: false, status: 'draft', filter: 'all', query: '', busy: false, campaign: campaignUI.originalSettings(), savedCampaign: campaignUI.originalSettings(), campaignBusy: false, campaignDirty: false, inviteCreated: false };
  const main = document.getElementById('main');
  const text = (key) => catalog.strings[state.locale][key] ?? key;
  const label = (item) => item?.title?.[state.locale] ?? text('notChosen');
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const image = (item) => `<img src="${escape(item.art)}" alt="${escape(text('originalArt'))}" loading="lazy" decoding="async">`;
  const entry = (group, id) => catalog[group].find((item) => item.id === id);
  const completion = () => ['species', 'class', 'background', 'equipment'].filter((key) => !!state.draft[key]).length;
  const selectable = () => ['species', 'class', 'background', 'equipment'].every((key) => Boolean(state.draft[key]));
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
      }).join('')}</div><div class="empty-filter" id="empty-filter" hidden>${escape(text('noResults'))}</div>
      <p class="art-disclaimer">${escape(text('originalArtworkNote'))}</p>`;
  }

  function abilityStep() {
    const abilities = state.draft.abilities;
    return `<div class="ability-head">${badge(text('arrayInfo'), 'muted')}
      <span>${escape(text('statSample'))}</span></div>
      <div class="ability-grid">${abilityKeys.map((key,i)=>`<label class="ability-select"><span>${escape(text('ability'+key[0].toUpperCase()+key.slice(1)))}</span><select data-ability="${i}" aria-label="${escape(text('ability'+key[0].toUpperCase()+key.slice(1)))}">
      ${array.map(value=>`<option value="${value}" ${abilities[i]===value?'selected':''}>${value}</option>`).join('')}</select></label>`).join('')}</div>
      ${!validAbilities()?`<div class="inline-warning" role="alert">${escape(text('selectionRequired'))} — ${escape(text('arrayInfo'))}</div>`:''}`;
  }

  function reviewStep() {
    const d=state.draft;
    const rows=[['stepSpecies','species'],['stepClass','class'],['stepBackground','background'],['stepEquipment','equipment']];
    return `<div class="review-panel"><div class="review-head"><h2>${escape(text('reviewTitle'))}</h2>${badge(text(({approved:'approvedStatus',changes_requested:'changesRequestedStatus',rejected:'rejectedStatus',pending:'pending',draft:'draft'})[state.status] || 'draft'), state.status==='pending'?'gold':'muted')}</div>
      <label class="form-field"><span>${escape(text('name'))}</span><input id="character-name" type="text" maxlength="80" autocomplete="off" placeholder="${escape(text('namePlaceholder'))}" value="${escape(d.name)}"><small>${escape(text('nameHint'))}</small></label>
      <div class="review-rows">${rows.map(([key,id])=>`<div class="review-row"><span>${escape(text(key))}</span><strong>${escape(label(entry(id==='class'?'classes':id==='background'?'backgrounds':id==='equipment'?'equipment':id, d[id])))}</strong></div>`).join('')}</div>
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
      <div class="preview-progress"><div class="preview-progress-title"><span>${escape(text('progress'))}</span><strong>${completion()}/4</strong></div><div class="progress-track"><span style="width:${completion()*25}%"></span></div></div>
      <dl class="preview-details"><div><dt>${escape(text('stepSpecies'))}</dt><dd>${escape(chosen('species',d.species))}</dd></div>
      <div><dt>${escape(text('stepClass'))}</dt><dd>${escape(chosen('classes',d.class))}</dd></div>
      <div><dt>${escape(text('stepBackground'))}</dt><dd>${escape(chosen('backgrounds',d.background))}</dd></div>
      <div><dt>${escape(text('stepEquipment'))}</dt><dd>${escape(chosen('equipment',d.equipment))}</dd></div></dl>
      <div class="preview-disclaimer">${escape(text('statSample'))}</div>
    </aside>`;
  }

  function builder() {
    const step=state.step, kind=stepKeys[step];
    const descriptions = ['stepSpeciesHint','stepClassHint','stepBackgroundHint','stepAbilityHint','stepEquipmentHint','stepReviewHint'];
    const panel = step===0?optionCards('species','species') : step===1?optionCards('classes','class') : step===2?optionCards('backgrounds','background') : step===3?abilityStep() : step===4?optionCards('equipment','equipment') : reviewStep();
    return `<div class="page builder-page"><div class="eyebrow accent">${escape(text('builderEyebrow'))} ${badge('D&D 2024','outline')}</div>
      <div class="builder-heading"><h1>${escape(text('builderTitle'))}</h1><p>${escape(text('builderIntro'))}</p></div>
      ${stepProgress()}
      <div class="builder-layout"><section class="builder-card" aria-labelledby="builder-step-heading"><div class="step-heading"><span class="eyebrow">${String(step+1).padStart(2,'0')} / ${stepKeys.length}</span><h2 id="builder-step-heading">${escape(text('step'+kind))}</h2><p>${escape(text(descriptions[step]))}</p></div>
        ${panel}<footer class="builder-controls"><button type="button" class="btn quiet" data-action="previous" ${step===0?'disabled':''}>← ${escape(text('back'))}</button>
        <div class="control-right"><button type="button" class="btn secondary" data-action="save" ${state.busy?'disabled':''}>${state.busy?'<span class="spinner"></span> ':''}${escape(text('saveDraft'))}</button>
        ${step===5?`<button class="btn primary" data-action="submit" ${state.busy?'disabled':''}>${escape(text('submit'))} →</button>`:`<button type="button" class="btn primary" data-action="next">${escape(text('next'))} →</button>`}</div>
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
      campaign: () => state.role === 'dm' ? campaignUI.renderCampaign({ campaign: state.campaign, busy: state.campaignBusy, locale: state.locale, t: text, esc: escape }) : stub('partyTitle','dmOnlyDemo'),
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
    const keys = ['species','class','background',null,'equipment'];
    if (state.step === 3 && !validAbilities()) return false;
    const key = keys[state.step];
    return !key || Boolean(state.draft[key]);
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
    if (action === 'step') { state.step=Number(trigger.dataset.step); render(); }
    if (action === 'choose') {
      const group = trigger.dataset.kind;
      const prop = group === 'classes' ? 'class' : group === 'backgrounds' ? 'background' : group;
      const next = catalog[group].find(item=>item.id===trigger.dataset.id);
      if (!next?.licensed) return;
      state.draft[prop] = next.id; markDirty(); render();
    }
    if (action === 'filter') { state.filter=trigger.dataset.filter; render(); }
    if (action === 'previous') { state.step=Math.max(0,state.step-1); render(); }
    if (action === 'next') {
      if (!canAdvance()) { notify(text('selectionRequired')); return; }
      state.step=Math.min(stepKeys.length-1,state.step+1); render();
    }
    if (action === 'save') mockSave(false);
    if (action === 'submit') mockSave(true);
    if (action === 'role') { state.role=trigger.dataset.role; if (state.role !== 'dm' && state.view === 'campaign') { state.view='party'; } render(); }
    if (action === 'save-campaign') mockCampaignSave();
    if (action === 'review') mockReview(trigger.dataset.decision);
    if (action === 'create-invite' && state.role === 'dm') { state.inviteCreated = true; render(); notify(text('inviteGeneratedDemo')); }
    if (action === 'preview-join' && state.role === 'dm') { state.role = 'player'; render(); notify(text('joinedDemo')); }
    if (action === 'reset') { state.draft=defaultDraft();state.saved=null;state.dirty=false;state.status='draft';state.step=0;state.inviteCreated=false;state.campaign=campaignUI.originalSettings();state.savedCampaign=campaignUI.originalSettings();state.campaignDirty=false;render();notify(text('resetDone')); }
    if (action === 'rest') notify(text('restDemo'));
  });

  document.addEventListener('input',(event)=>{
    const target=event.target;
    if (target.id==='choice-search') { state.query=target.value; applyFilter(); }
    if (target.id==='character-name') { state.draft.name=target.value; markDirty(); }
    if (target.id==='campaign-name') { state.campaign.name=target.value; state.campaignDirty=true; const preview=main.querySelector('.campaign-info h3'); if (preview) preview.textContent = target.value.trim() || text('campaignName'); renderNav(); }
  });
  document.addEventListener('change',(event)=>{
    const target=event.target;
    if (target.id==='lang-select') { state.locale=target.value==='el'?'el':'en'; render(); }
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
