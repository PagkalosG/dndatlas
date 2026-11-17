/* Atlas 2.0: DM-only presentation prototype for campaign content pack imports.
 * Security, entitlements and final schema validation MUST be implemented in Worker.
 * Local file preview only; nothing is uploaded or persisted by this module.
 */
(function () {
  'use strict';
  const dictionary = {
    en: {
      eyebrow:'CAMPAIGN LIBRARIES', title:'Choose your campaign content',
      intro:'The SRD 5.2.1 is always available. Import original or properly licensed JSON libraries for additional 2024 character options.',
      baseline:'Core Library',srd:'SRD 5.2.1 · D&D 2024', coreActive:'Core library enabled',
      libraryImport:'Import JSON library', upload:'Select a .json file', max:'Maximum 512 KiB · up to 200 definitions',
      noUpload:'Select a JSON library to preview its contents before installing it.',
      preview:'Library preview', version:'Version', entries:'Entries', categories:'Content included',
      legal:'I confirm I have the rights to share this content with invited campaign members.',
      localOnly:'Preview only: this is an in-browser UI demo. No data is uploaded, installed or saved to D1.',
      stage:'Add to demo selection', staged:'Demo selections (not installed)', remove:'Remove demo selection',
      ready:'Ready for server verification', invalid:'Invalid library file', required:'Rights confirmation required.',
      rightsMissing:'The JSON must include pack.license.rightToShare=true.', invalidJson:'Invalid JSON.',
      edition:'Only the 2024 ruleset is supported.', invalidFormat:'Expected a dndatlas.content-pack schemaVersion 1 JSON.',
      empty:'Library must contain 1–200 definitions.', tooBig:'File exceeds 512 KiB.',
      packMissing:'The library must have an ID, version and a valid campaign scope.',
      dmOnly:'Only the Campaign DM can import or activate libraries.',
      noMechanics:'Full rules, reference and dependency validation will run on the server before activation.',
      sourceBadge:'Campaign-scoped • 2024', categoryTitle:'Supported content categories',
      categoryIntro:'Species, Classes, Subclasses, Backgrounds, Feats, Spells, Features, Items, equipment, magic items and DM options.',
      pending:'Staged locally • not saved', clear:'Clear preview', processing:'Reading JSON…',
    },
    el: {
      eyebrow:'ΒΙΒΛΙΟΘΗΚΕΣ ΕΚΣΤΡΑΤΕΙΑΣ', title:'Επίλεξε περιεχόμενο για την εκστρατεία',
      intro:'Το SRD 5.2.1 είναι πάντα διαθέσιμο. Εισήγαγε δικές σου ή κατάλληλα αδειοδοτημένες βιβλιοθήκες JSON για πρόσθετες επιλογές χαρακτήρων 2024.',
      baseline:'Βασική βιβλιοθήκη',srd:'SRD 5.2.1 · D&D 2024', coreActive:'Η βασική βιβλιοθήκη είναι ενεργή',
      libraryImport:'Εισαγωγή βιβλιοθήκης JSON', upload:'Επιλογή αρχείου .json', max:'Έως 512 KiB · έως 200 καταχωρίσεις',
      noUpload:'Επίλεξε αρχείο JSON για να δεις τις καταχωρίσεις του πριν την εγκατάσταση.',
      preview:'Προεπισκόπηση βιβλιοθήκης', version:'Έκδοση', entries:'Καταχωρίσεις', categories:'Περιλαμβανόμενο περιεχόμενο',
      legal:'Επιβεβαιώνω ότι έχω δικαίωμα να μοιραστώ το περιεχόμενο με τα μέλη της εκστρατείας.',
      localOnly:'Μόνο προεπισκόπηση: πρόκειται για δοκιμαστικό UI στον browser. Δεν ανεβαίνουν, εγκαθίστανται ή αποθηκεύονται δεδομένα στη D1.',
      stage:'Προσθήκη στις δοκιμαστικές επιλογές', staged:'Δοκιμαστικές επιλογές (όχι εγκατεστημένες)', remove:'Αφαίρεση δοκιμαστικής επιλογής',
      ready:'Έτοιμο για έλεγχο στον server', invalid:'Μη έγκυρο αρχείο βιβλιοθήκης', required:'Χρειάζεται επιβεβαίωση δικαιωμάτων.',
      rightsMissing:'Το JSON πρέπει να περιέχει pack.license.rightToShare=true.', invalidJson:'Μη έγκυρο JSON.',
      edition:'Υποστηρίζεται μόνο το ruleset 2024.', invalidFormat:'Αναμένεται JSON dndatlas.content-pack με schemaVersion 1.',
      empty:'Η βιβλιοθήκη πρέπει να έχει 1–200 καταχωρίσεις.', tooBig:'Το αρχείο υπερβαίνει τα 512 KiB.',
      packMissing:'Η βιβλιοθήκη χρειάζεται ID, έκδοση και campaign scope.',
      dmOnly:'Μόνο ο DM της εκστρατείας μπορεί να εισάγει ή να ενεργοποιεί βιβλιοθήκες.',
      noMechanics:'Ο πλήρης έλεγχος κανόνων, αναφορών και dependencies θα γίνεται στον server πριν την ενεργοποίηση.',
      sourceBadge:'Μόνο για την εκστρατεία • 2024', categoryTitle:'Υποστηριζόμενες κατηγορίες περιεχομένου',
      categoryIntro:'Species, Classes, Subclasses, Backgrounds, Feats, Spells, Features, Items, εξοπλισμός, μαγικά αντικείμενα και επιλογές DM.',
      pending:'Μόνο τοπική δοκιμή • χωρίς αποθήκευση', clear:'Καθαρισμός προεπισκόπησης', processing:'Ανάγνωση JSON…',
    },
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const t = (locale, key) => dictionary[locale === 'el' ? 'el' : 'en'][key];
  const safeName = x => x && typeof x==='object' ? (x.en || '') : '';
  const kinds = ['class','subclass','species','background','feat','spell','item','feature','option','rule','monster','condition','skill','tool'];

  function inspectJSON(source, bytes) {
    if (bytes > 512 * 1024) return { valid:false, error:'tooBig' };
    let pack;
    try { pack = JSON.parse(source); } catch { return { valid:false, error:'invalidJson' }; }
    if (!pack || pack.format !== 'dndatlas.content-pack' || pack.schemaVersion !== 1) return {valid:false,error:'invalidFormat'};
    if (!pack.pack || !pack.pack.id || !pack.pack.version || pack.pack.scope !== 'campaign') return {valid:false,error:'packMissing'};
    if (pack.pack.ruleset !== 'dnd5e-2024') return {valid:false,error:'edition'};
    if (pack.pack.license?.rightToShare !== true) return {valid:false,error:'rightsMissing'};
    if (!Array.isArray(pack.entries) || pack.entries.length < 1 || pack.entries.length > 200) return {valid:false,error:'empty'};
    const byKind = {};
    for (const entry of pack.entries) {
      if (!entry || !kinds.includes(entry.kind) || !entry.name || !safeName(entry.name)) return {valid:false,error:'invalidFormat'};
      byKind[entry.kind] = (byKind[entry.kind] || 0) + 1;
    }
    return {valid:true,id:String(pack.pack.id).slice(0,80),version:String(pack.pack.version).slice(0,50),
      name: safeName(pack.pack.name).slice(0,160) || String(pack.pack.id).slice(0,80),count:pack.entries.length,byKind};
  }

  function render({locale='en', role='player', preview=null, error=null, staged=[], busy=false, rights=false}={}) {
    if (role !== 'dm') return '';
    const title = (key) => esc(t(locale,key));
    const warning = error ? `<p class="library-warning" role="alert">${title(error)}</p>` : '';
    const summary = preview?.valid ? `<div class="library-preview"><div class="library-preview-head"><strong>${esc(preview.name)}</strong><span class="library-status">${title('ready')}</span></div>
      <p>${title('version')}: ${esc(preview.version)} · ${title('entries')}: ${Number(preview.count)}</p>
      <div class="library-type-list">${Object.entries(preview.byKind).map(([k,v])=>`<span class="chip muted">${esc(k)}: ${Number(v)}</span>`).join('')}</div>
      <label class="library-rights"><input type="checkbox" id="library-rights-confirm" ${rights?'checked':''}><span>${title('legal')}</span></label>
      <button type="button" class="btn secondary" data-action="library-demo-stage" ${(!rights||busy)?'disabled':''}>${title('stage')}</button>
      <button type="button" class="btn quiet" data-action="library-demo-clear">${title('clear')}</button></div>` : '';
    return `<section class="page library-page" aria-label="${title('eyebrow')}"><div class="section-lead"><span class="eyebrow accent">${title('eyebrow')}</span><h2>${title('title')}</h2><p>${title('intro')}</p></div>
      <div class="library-layout"><article class="panel library-panel"><div class="library-icon" aria-hidden="true">✦</div><div><small>${title('baseline')}</small><h3>${title('srd')}</h3><p class="library-success">✓ ${title('coreActive')}</p></div></article>
      <article class="panel library-panel library-upload"><div><small>${title('sourceBadge')}</small><h3>${title('libraryImport')}</h3><p>${title('max')}</p></div><label class="btn quiet library-file-label" for="library-json-file">${title('upload')}<input id="library-json-file" type="file" accept=".json,application/json" ${busy?'disabled':''}></label>
      ${busy?`<p aria-live="polite"><span class="spinner"></span> ${title('processing')}</p>`:''}
      ${warning}${summary}${!summary&&!warning?`<p class="library-empty">${title('noUpload')}</p>`:''}
      <p class="library-guidance">${title('noMechanics')}</p><p class="library-demo-notice">${title('localOnly')}</p></article></div>
      <div class="panel library-list"><h3>${title('categoryTitle')}</h3><p>${title('categoryIntro')}</p>
      ${staged.length?`<h3>${title('staged')}</h3>${staged.map((item,i)=>`<div class="library-added-row"><span><strong>${esc(item.name)}</strong> · ${esc(item.version)} (${Number(item.count)} ${title('entries')}) <small>${title('pending')}</small></span><button class="btn quiet" type="button" data-action="library-demo-remove" data-pack-index="${i}">${title('remove')}</button></div>`).join('')}`:''}</div></section>`;
  }

  window.ATLAS_V2_LIBRARY_UI = { render, inspectJSON, dictionary };
})();
