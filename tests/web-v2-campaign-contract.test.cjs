'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');
const web = path.resolve(__dirname, '../apps/web-v2');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(web, 'data.js'), 'utf8'), context);
vm.runInNewContext(fs.readFileSync(path.join(web,'components/campaign-flows.js'), 'utf8'), context);
const components = context.window.ATLAS_V2_CAMPAIGN_FLOW;
const catalog = context.window.ATLAS_V2_DEMO;
const escape = value => String(value??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t = k=>catalog.strings.en[k]??k;
const label = item => item?.title?.en ?? 'Not chosen';
const lookup = (group,id)=>catalog[group].find(item=>item.id===id);

const ownCharacter = {
 name:'Borruk',species:'human',class:'fighter',background:'soldier',equipment:'spear',
 abilities:[15,14,13,12,10,8],
};

test('campaign defaults are 2024-compatible and user selections are verified',()=>{
 const config = components.originalSettings();
 assert.equal(config.abilityMethod, 'standard');
 assert.equal(config.startingLevel,1);
 assert.equal(components.validateSettings(config).valid,true);
 for(const [key,bad] of [['name','a'],['startingLevel',21],['characterLimit',0],['inviteDays',60],['abilityMethod','roll-ui'],['hpMethod','2014'],['requireApproval','yes']]){
   assert.equal(components.validateSettings({...config,[key]:bad}).valid,false,`${key} must be rejected`);
 }
});

test('Campaign settings render accessible select-driven controls and private-by-default story',()=>{
 const config = {...components.originalSettings(),name:'Aether & Beyond'};
 const html=components.renderCampaign({campaign:config,busy:false,locale:'en',t,esc:escape});
 assert.match(html,/2024/);
 assert.match(html,/SRD 5.2.1/);
 assert.match(html,/data-campaign-field="abilityMethod"/);
 assert.match(html,/data-campaign-field="privateStoryDefault" checked/);
 assert.match(html,/Aether &amp; Beyond/);
 assert.match(html,/data-action="save-campaign"/);
 assert.doesNotMatch(html,/data-action="roll"|rollDice|dice-roller/i);
});

test('DM approval actions appear only for a pending mock character',()=>{
 const base={role:'dm',draft:ownCharacter,campaign:components.originalSettings(),inviteCreated:false,busy:false,locale:'en',t,esc:escape,label,lookup};
 const pending = components.renderParty({...base,status:'pending'});
 assert.match(pending,/data-decision="approved"/);
 assert.match(pending,/data-decision="changes_requested"/);
 assert.match(pending,/data-decision="rejected"/);
 const approved = components.renderParty({...base,status:'approved'});
 assert.doesNotMatch(approved,/data-decision="approved"/);
});

test('Player view shows a read-only party and no DM controls, not real authentication',()=>{
 const html=components.renderParty({role:'player',status:'approved',draft:ownCharacter,campaign:components.originalSettings(),inviteCreated:true,busy:false,locale:'en',t,esc:escape,label,lookup});
 assert.match(html,/Read-only preview/);
 assert.doesNotMatch(html,/data-decision="approved"|data-action="create-invite"|data-view="campaign"/);
 assert.match(html,/does not implement authentication|backend|server/i);
});

test('mock invite can never be mistaken for a real invite or QR payload',()=>{
 const html=components.renderParty({role:'dm',status:'draft',draft:ownCharacter,campaign:components.originalSettings(),inviteCreated:true,busy:false,locale:'en',t,esc:escape,label,lookup});
 assert.match(html,/https:\/\/example\.invalid\/atlas-demo-invite/);
 assert.match(html,/NON-FUNCTIONAL DEMO LINK/);
 assert.match(html,/not functional/);
 assert.doesNotMatch(html,/data-action="copy-live-invite"/);
});

test('HTML escapes campaign names and character names without parsing injection',()=>{
 const campaign = components.originalSettings(); campaign.name='<img src=x onerror=alert(1)>';
 const html=components.renderCampaign({campaign,busy:false,locale:'en',t,esc:escape});
 assert.doesNotMatch(html,/<img src=x/);
 assert.match(html,/&lt;img/);
 const draft={...ownCharacter,name:'<script>alert(1)</script>'};
 const party=components.renderParty({role:'dm',status:'pending',draft,campaign,inviteCreated:false,busy:false,locale:'en',t,esc:escape,label,lookup});
 assert.doesNotMatch(party,/<script>alert/);
});

test('Greek translations cover every new Campaign/DM label and UI remains mock-only',()=>{
 assert.deepEqual(Object.keys(catalog.strings.en).sort(),Object.keys(catalog.strings.el).sort());
 const html=components.renderParty({role:'dm',status:'pending',draft:ownCharacter,campaign:components.originalSettings(),inviteCreated:true,busy:false,locale:'el',t:k=>catalog.strings.el[k],esc:escape,label:i=>i?.title?.el||'—',lookup});
 assert.match(html,/Έγκριση/);
 assert.match(html,/Αίτημα αλλαγών/);
 const app=fs.readFileSync(path.join(web,'app.js'),'utf8');
 assert.doesNotMatch(app,/\bfetch\s*\(|XMLHttpRequest|new WebSocket\s*\(/);
 assert.match(app,/mockReview\(/);
 assert.match(app,/mockCampaignSave\(/);
});
