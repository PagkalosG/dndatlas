/* Atlas 2.0 campaign UI primitives. Pure HTML renderers over mock view models.
   SECURITY: never treat role props as authorization. Server-side checks are required. */
(function () {
  'use strict';

  const originalSettings = () => ({
    name: 'Echoes of Aether', startingLevel: 1, abilityMethod: 'standard',
    hpMethod: 'fixed', progression: 'milestone', characterLimit: 1,
    inviteDays: 7, requireApproval: true, allowMulticlass: false,
    privateStoryDefault: true, requireRestApproval: false,
  });

  function validateSettings(input) {
    const errors = [];
    if (typeof input.name !== 'string' || input.name.trim().length < 3 || input.name.trim().length > 80) errors.push('name');
    if (!Number.isInteger(input.startingLevel) || input.startingLevel < 1 || input.startingLevel > 20) errors.push('startingLevel');
    if (!['standard', 'pointbuy', 'manual'].includes(input.abilityMethod)) errors.push('abilityMethod');
    if (!['fixed', 'manual'].includes(input.hpMethod)) errors.push('hpMethod');
    if (!['milestone', 'xp'].includes(input.progression)) errors.push('progression');
    if (!Number.isInteger(input.characterLimit) || input.characterLimit < 1 || input.characterLimit > 5) errors.push('characterLimit');
    if (![1, 7, 30].includes(input.inviteDays)) errors.push('inviteDays');
    for (const key of ['requireApproval', 'allowMulticlass', 'privateStoryDefault', 'requireRestApproval']) {
      if (typeof input[key] !== 'boolean') errors.push(key);
    }
    return { valid: errors.length === 0, errors };
  }

  function renderCampaign({ campaign, busy, locale, t, esc }) {
    const e = (value) => esc(value);
    const field = (name, key, value, options) => `<label class="campaign-field"><span>${e(t(key))}</span><select data-campaign-field="${name}" ${busy?'disabled':''}>
      ${options.map(([id, title]) => `<option value="${e(id)}" ${String(value)===String(id)?'selected':''}>${e(title)}</option>`).join('')}
      </select></label>`;
    const yesno = (key) => `<label class="campaign-toggle"><input type="checkbox" data-campaign-field="${key}" ${campaign[key]?'checked':''} ${busy?'disabled':''}><span><b>${e(t(key))}</b><small>${e(t(key+'Hint'))}</small></span></label>`;
    const level = Array.from({length: 20}, (_, index) => [index + 1, String(index + 1)]);
    return `<div class="page campaign-page">
      <div class="section-lead"><span class="eyebrow accent">${e(t('campaignSetupLabel'))}</span><h1>${e(t('campaignSetupTitle'))}</h1><p>${e(t('campaignSetupIntro'))}</p></div>
      <div class="campaign-layout">
        <section class="panel campaign-editor" aria-labelledby="campaign-editor-heading">
          <div class="campaign-card-header"><span class="eyebrow">${e(t('campaignDetails'))}</span><span class="chip">D&D 5e · 2024</span></div>
          <h2 id="campaign-editor-heading">${e(t('campaignIdentity'))}</h2>
          <label class="campaign-field"><span>${e(t('campaignName'))}</span><input id="campaign-name" maxlength="80" type="text" value="${e(campaign.name)}" ${busy?'disabled':''} required></label>
          <div class="campaign-grid">
            ${field('startingLevel','startingLevel',campaign.startingLevel,level)}
            ${field('abilityMethod','abilityMethod',campaign.abilityMethod,[['standard',t('methodStandard')],['pointbuy',t('methodPointBuy')],['manual',t('methodManual')]])}
            ${field('hpMethod','hpMethod',campaign.hpMethod,[['fixed',t('hpFixed')],['manual',t('hpManual')]])}
            ${field('progression','progressionMethod',campaign.progression,[['milestone',t('milestone')],['xp',t('xp')]])}
            ${field('characterLimit','characterLimit',campaign.characterLimit,[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']])}
            ${field('inviteDays','inviteDuration',campaign.inviteDays,[[1,t('oneDay')],[7,t('sevenDays')],[30,t('thirtyDays')]])}
          </div>
          <h3 class="campaign-section-title">${e(t('campaignPermissions'))}</h3>
          <div class="campaign-toggle-grid">${yesno('requireApproval')}${yesno('allowMulticlass')}${yesno('privateStoryDefault')}${yesno('requireRestApproval')}</div>
          <div class="inline-info">✧ ${e(t('campaignSourcesInfo'))} <strong>SRD 5.2.1</strong></div>
          <div class="campaign-action-row">
            <button type="button" class="btn quiet" data-action="navigate" data-view="party" ${busy?'disabled':''}>← ${e(t('backToParty'))}</button>
            <button type="button" class="btn primary" data-action="save-campaign" ${busy?'disabled':''}>${busy?'<span class="spinner" aria-hidden="true"></span>':''}${e(t('saveCampaignDemo'))}</button>
          </div>
        </section>
        <aside class="panel campaign-info"><div class="context-orb">✦</div><div class="eyebrow accent">${e(t('campaignPreview'))}</div><h3>${e(campaign.name||t('campaignName'))}</h3><p>${e(t('campaignPreviewDesc'))}</p>
          <div class="preview-details"><div><dt>${e(t('ruleEdition'))}</dt><dd>D&D 5e 2024</dd></div><div><dt>${e(t('startingLevel'))}</dt><dd>${e(campaign.startingLevel)}</dd></div><div><dt>${e(t('source'))}</dt><dd>SRD 5.2.1</dd></div></div>
          <div class="preview-disclaimer">${e(t('noCloudWrites'))}</div>
        </aside>
      </div>
    </div>`;
  }

  function renderParty({ role, status, draft, campaign, inviteCreated, busy, locale, t, esc, label, lookup }) {
    const e = value => esc(value);
    const isDm = role === 'dm';
    const roleButtons = `<div class="role-switcher"><span>${e(t('rolePreview'))}</span><button type="button" data-action="role" data-role="player" class="btn ${isDm?'quiet':'primary'}">${e(t('rolePlayer'))}</button><button type="button" data-action="role" data-role="dm" class="btn ${isDm?'primary':'quiet'}">${e(t('roleDm'))}</button></div>`;
    const characterName = draft.name.trim() || t('characterLabel');
    const characterParts = [label(lookup('species',draft.species)),label(lookup('classes',draft.class))].filter(Boolean).join(' · ');
    const ownStatus = t(status === 'approved' ? 'approvedStatus' : status === 'changes_requested' ? 'changesRequestedStatus' : status === 'rejected' ? 'rejectedStatus' : status === 'pending' ? 'pending' : 'draft');
    const characterCard = `<div class="party-character">
      <div class="party-character-portrait"><img src="${e(lookup('species', draft.species)?.art || 'assets/atlas-mark.svg')}" alt="" loading="lazy"></div>
      <div class="party-character-copy"><strong>${e(characterName)}</strong><span>${e(characterParts||t('characterNotReady'))}</span><small>${e(t('yourCharacter'))} · ${e(t('levelOne'))}</small></div>
      <span class="chip ${status==='approved'?'gold':'muted'}">${e(ownStatus)}</span>
    </div>`;
    const playerRoster = `<div class="party-roster">${characterCard}<div class="party-character demo-companion"><div class="party-character-avatar">✦</div><div class="party-character-copy"><strong>${e(t('partyCompanion'))}</strong><span>${e(t('partyCompanionHint'))}</span><small>${e(t('readOnly'))}</small></div><span class="chip muted">${e(t('sampleData'))}</span></div></div>`;
    const review = status === 'pending'
      ? `<div class="review-request"><div class="review-request-top"><span class="chip gold">${e(t('pending'))}</span><span>${e(t('characterRevisionNotice'))}</span></div>${characterCard}
          <p>${e(t('reviewDisclaimer'))}</p>
          <div class="review-decision-row"><button type="button" class="btn primary" data-action="review" data-decision="approved" ${busy?'disabled':''}>${e(t('approveCharacter'))}</button>
          <button type="button" class="btn secondary" data-action="review" data-decision="changes_requested" ${busy?'disabled':''}>${e(t('requestChanges'))}</button>
          <button type="button" class="btn quiet" data-action="review" data-decision="rejected" ${busy?'disabled':''}>${e(t('rejectCharacter'))}</button></div></div>`
      : `<div class="empty-approval"><span aria-hidden="true">✓</span><h3>${e(t('approvalEmpty'))}</h3><p>${e(t('approvalEmptyHint'))}</p></div>`;
    const invitation = `<div class="invite-panel"><div class="invite-art" aria-hidden="true">✧<span>QR</span></div><div class="invite-copy"><h3>${e(t('invitationTitle'))}</h3><p>${e(t('invitationDesc'))}</p>
      ${inviteCreated?`<div class="fake-invite">https://example.invalid/atlas-demo-invite <small>${e(t('inviteNotReal'))}</small></div>`:''}
      <div class="invite-actions"><button type="button" class="btn ${inviteCreated?'secondary':'primary'}" data-action="create-invite" ${busy?'disabled':''}>${e(t(inviteCreated?'regenerateInvite':'generateInvite'))}</button>
      <button type="button" class="btn quiet" data-action="preview-join">${e(t('previewJoin'))}</button></div></div></div>`;
    return `<div class="page"><div class="section-lead"><span class="eyebrow accent">${e(t('partyLabel'))}</span><h1>${e(t(isDm?'dmPartyTitle':'partyTitle'))}</h1><p>${e(t(isDm?'dmPartyIntro':'partyIntro'))}</p></div>
      <div class="concept-banner campaign-demo-banner"><span>◇</span><div><strong>${e(t('previewBadge'))}</strong><p>${e(t('demoPrivacy'))}</p></div></div>
      ${roleButtons}
      <div class="party-metrics"><div class="metric"><span class="metric-icon">♙</span><strong>4</strong><span>${e(t('campaignMembers'))} · ${e(t('sampleData'))}</span></div>
        <div class="metric"><span class="metric-icon">◎</span><strong>${status==='pending'?'1':'0'}</strong><span>${e(t('pendingApprovals'))}</span></div>
        <div class="metric"><span class="metric-icon">✦</span><strong>${status==='approved'?'1':'0'}</strong><span>${e(t('activeCharacters'))}</span></div></div>
      <div class="party-layout"><section class="panel"><div class="party-section-head"><div><span class="eyebrow">${e(t('partySection'))}</span><h2>${e(t('rosterTitle'))}</h2></div>
        ${isDm?`<button type="button" class="btn quiet" data-action="navigate" data-view="campaign">⚙ ${e(t('campaignSettings'))}</button>`:''}</div>${playerRoster}
        ${!isDm?`<div class="party-action-row"><button type="button" class="btn primary" data-action="navigate" data-view="builder">${e(t('continueBuilding'))}</button><span>${e(t('readonlyNotice'))}</span></div>`:''}</section>
        <section class="panel"><span class="eyebrow">${e(t(isDm?'approvalQueue':'membershipTitle'))}</span>
          ${isDm?review:`<h2>${e(t('membershipStatus'))}</h2><p>${e(t(status==='pending'?'playerPendingHint':status==='approved'?'playerApprovedHint':status==='changes_requested'?'playerChangesHint':'playerDraftHint'))}</p>
           <button type="button" class="btn secondary" data-action="navigate" data-view="builder">${e(t('continueBuilding'))}</button>`}
        </section></div>
      ${isDm?`<section class="panel invite-section"><span class="eyebrow accent">${e(t('inviteSection'))}</span>${invitation}</section>`:''}
    </div>`;
  }

  window.ATLAS_V2_CAMPAIGN_FLOW = Object.freeze({ originalSettings, validateSettings, renderCampaign, renderParty });
})();
