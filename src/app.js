(() => {
 'use strict';
 const D=window.ATLAS_DATA;
 const L=window.ATLAS_I18N;
 const R=window.ATLAS_RULES_2024;
 const APP_VERSION='3.3.0';
 const KEY='character-atlas:characters:v1', VIEWKEY='character-atlas:ui:v1';
 // 2.1.1: self-contained inventory mastery controls and weapon condition tags.
 const extraStyle=document.createElement('style');
 extraStyle.id='atlas-weapons-211';
 extraStyle.textContent=`
 .atlas-mastery-alert { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; padding:13px 16px; margin:14px 0; border-radius:12px; border:1px solid #b58941; background:rgba(177,132,46,.10); }
 .atlas-mastery-alert p {margin:4px 0 0; font-size:.87rem; opacity:.9;}
 .atlas-inventory-mastery {margin:14px 0 20px;}
 .atlas-mastery-button { font-size:23px; line-height:1; min-width:32px; border:1px solid currentColor; border-radius:8px; padding:2px 6px; background:transparent; color:#a6adb9; cursor:pointer; }
 .atlas-mastery-button[aria-pressed="true"] {color:#f3c864; background:rgba(243,200,100,.14);}
 .atlas-mastery-button:disabled {opacity:.35;cursor:not-allowed;}
 .atlas-inventory-meta {display:flex;flex-wrap:wrap;gap:7px;margin-top:7px;align-items:center}
 .atlas-weapon-status {font-size:.74rem;padding:3px 8px;border-radius:99px;background:rgba(255,193,99,.13);border:1px solid rgba(255,193,99,.3);}
 .atlas-weapon-status[data-state="lost"],.atlas-weapon-status[data-state="destroyed"],.atlas-weapon-status[data-state="stolen"] { background:rgba(235,97,91,.12);border-color:rgba(235,97,91,.4); }
 .atlas-item-weapon-tools {display:flex;align-items:center;gap:8px;flex-wrap:wrap}
 .atlas-combat-weapon-state {margin-top:6px;display:block}
 .atlas-mastery-count {font-weight:700; font-variant-numeric:tabular-nums;}
 .atlas-attack-unavailable {opacity:.66;border-style:dashed !important;}
 .atlas-status-help {margin:6px 0 0;font-size:.79rem;opacity:.85;}
 `;
 document.head.appendChild(extraStyle);

 const uiText=(el,en)=>L.getLanguage()==='el'?el:en;
 const ico={overview:'⌂',combat:'⚔',character:'◈',spells:'✦',inventory:'▣',journal:'☰',library:'◇'};
 const navigation=[['overview','Overview'],['character','Character'],['combat','Combat'],['inventory','Inventory'],['journal','Journal'],['library','Library']];
 const SKILL_ABB={STR:'STR',DEX:'DEX',CON:'CON',INT:'INT',WIS:'WIS',CHA:'CHA'};
 const slotsTable=[[],[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]];
 const pactTable={1:[1,1],2:[2,1],3:[2,2],4:[2,2],5:[2,3],6:[2,3],7:[2,4],8:[2,4],9:[2,5],10:[2,5],11:[3,5],12:[3,5],13:[3,5],14:[3,5],15:[3,5],16:[3,5],17:[4,5],18:[4,5],19:[4,5],20:[4,5]};
 const uid=()=>Math.random().toString(36).slice(2,10);
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
 const esc=(v)=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 const attr=esc;
 // Only locally generated raster data URLs are rendered (never arbitrary URLs from an import).
 const safePortrait=(src)=>typeof src==='string' && /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(src) && src.length<750000 ? src : '';
 const initials=(ch)=>esc((ch.name||'?').split(' ').filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?');
 const portraitMarkup=(ch)=>safePortrait(ch.portrait)?`<img class="portrait-image" src="${attr(ch.portrait)}" alt="${attr(ch.name)} portrait" draggable="false">`:`<span class="portrait-initials">${initials(ch)}</span>`;
 const signed=(n)=>n>=0?`+${n}`:`${n}`;
 const abilityMod=(v)=>Math.floor((Number(v||10)-10)/2);
 const formatLevel=(l)=>l===0?'Cantrip':`Level ${l}`;
 const totalLevel=(c)=>Math.max(1,(c.classes||[]).reduce((s,x)=>s+(Number(x.level)||0),0));
 const prof=(c)=>c.proficiencyOverride!==''&&c.proficiencyOverride!=null ? +c.proficiencyOverride : (Math.ceil(totalLevel(c)/4)+1);
 const ability=(c,k)=>abilityMod((c.abilities||{})[k]??10);
 const classLabel=(c)=>(c.classes||[]).map(x=>`${x.name} ${x.level}${x.subclass&&Number(x.level)>=3?' · '+x.subclass:''}`).join(' / ');
 const activeLoadout=(c)=>(c.loadouts||[])[c.activeLoadout||0]||{name:'Custom',ac:c.ac||10};
 const AC=(c)=>Number(activeLoadout(c).ac)||Number(c.ac)||10;
 const skillMod=(c,name)=>{const def=D.skills.find(s=>s[0]===name);return ability(c,def?def[1]:'WIS')+prof(c)*(c.skills?.[name]||0)};
 const saveMod=(c,k)=>ability(c,k)+((c.saves||[]).includes(k)?prof(c):0);
 const initMod=(c)=>ability(c,'DEX')+(Number(c.initiativeBonus)||0);
 const spellMod=(c)=>ability(c,c.spellAbility||'INT');
 const spellDC=(c)=>c.spellDCOverride!==''&&c.spellDCOverride!=null?+c.spellDCOverride:8+prof(c)+spellMod(c);
 const spellAttack=(c)=>c.spellAttackOverride!==''&&c.spellAttackOverride!=null?+c.spellAttackOverride:prof(c)+spellMod(c);
 const modifierFor=(c,k)=>k==='SPELL'?spellMod(c):ability(c,k||'STR');
 const attackStats=(ch,a)=>R.attackBreakdown(ch,a,D.weapons);
 const attackBonus=(ch,a)=>attackStats(ch,a).hit;
 const attackDamage=(ch,a)=>`${a.damage||'1d6'}${signed(attackStats(ch,a).damageMod)}`;
 const E=window.ATLAS_SPELL_EFFECTS;
 const spellEffect=(spell,ch=c(),slot)=>E.show(spell,ch,slot);
 function spellTag(spell,ch=c(),compact=false){
  const e=spellEffect(spell,ch);if(!e || e.kind==='none')return compact?'':`<span class="spell-effect-mini neutral">${esc(e.label)}</span>`;
  const sc=E.scalingInfo(spell,ch);
  return `<span class="spell-effect-mini ${attr(e.kind)}">${esc(e.label)}</span>${sc.mode==='slot'||sc.mode==='character'?`<span class="spell-scaling-mini">${esc(sc.brief)}</span>`:''}`;
 }
 function spellEffectPanel(spell,ch=c()){
  const effect=spellEffect(spell,ch);
  if(!effect)return '';
  const el=L.getLanguage()==='el';
  const scale=E.scalingInfo(spell,ch), levels=E.progression(spell,ch);
  const preview=levels.length?`<div class="spell-scaling-caption">${scale.mode==='character'?(el?'ΑΝΑ ΣΥΝΟΛΙΚΟ CHARACTER LEVEL':'BY TOTAL CHARACTER LEVEL'):(el?'ΑΝΑ SPELL SLOT LEVEL':'BY SPELL SLOT LEVEL')}</div><div class="spell-progress-grid">${levels.map((x,i)=>`<div class="spell-progress-row ${i===0?'is-base':''}"><span>${scale.mode==='character'?'Lv':'Slot'} ${x.level}</span><strong>${esc(x.formula)}</strong></div>`).join('')}</div>`:'';
  const mode=effect.hit?`<div class="spell-effect-rule"><b>${el?'Επίθεση / Save':'Attack / Save'}:</b> ${esc(effect.hit)}${effect.saveHalf?` · ${el?'μισή ζημιά σε επιτυχία':'half damage on success'}`:''}</div>`:'';
  return `<div class="spell-effect-panel ${attr(effect.kind)}"><div class="spell-effect-head"><span>${esc(effect.title)}</span><strong>${esc(effect.label)}</strong></div>${mode}<div class="spell-effect-rule spell-scaling-explanation"><b>${el?'Αύξηση':'Scaling'}:</b> ${esc(scale.text)}</div>${preview}${effect.detail?`<div class="spell-effect-note">${esc(effect.detail)}</div>`:''}</div>`;
 }

 // Dropdown catalogs include expanded official/legacy options; not every supplement/homebrew entry is listed.
 // Only names are provided: rule mechanics are not granted automatically. Players must verify source/level with their DM.
 const EXTRA_SUBCLASSES={
  Barbarian:['Path of the Ancestral Guardian','Path of the Beast','Path of the Storm Herald','Path of the Totem Warrior','Path of Wild Magic'],
  Bard:['College of Creation','College of Eloquence','College of Spirits','College of Swords','College of Whispers'],
  Cleric:['Arcana Domain','Death Domain','Forge Domain','Grave Domain','Knowledge Domain','Nature Domain','Order Domain','Peace Domain','Tempest Domain','Twilight Domain'],
  Druid:['Circle of Dreams','Circle of the Shepherd','Circle of Spores','Circle of Wildfire'],
  Fighter:['Arcane Archer','Banneret','Cavalier','Echo Knight','Purple Dragon Knight','Rune Knight','Samurai'],
  Monk:['Way of the Ascendant Dragon','Way of the Astral Self','Way of the Drunken Master','Way of the Four Elements','Way of the Kensei','Way of the Long Death','Way of the Sun Soul'],
  Paladin:['Oath of Conquest','Oath of the Crown','Oath of Redemption','Oath of the Watchers','Oathbreaker'],
  Ranger:['Drakewarden','Horizon Walker','Monster Slayer','Swarmkeeper'],
  Rogue:['Inquisitive','Mastermind','Phantom','Scout','Swashbuckler'],
  Sorcerer:['Divine Soul','Lunar Sorcery','Shadow Magic','Storm Sorcery'],
  Warlock:['The Fathomless','The Genie','The Hexblade','The Undead','The Undying'],
  Wizard:['Bladesinging','Chronurgy Magic','Graviturgy Magic','Order of Scribes','School of Abjuration','School of Conjuration','School of Divination','School of Enchantment','School of Evocation','School of Illusion','School of Necromancy','School of Transmutation','War Magic'],
  Artificer:[]
 };
 const ALIGNMENTS=['Lawful Good','Neutral Good','Chaotic Good','Lawful Neutral','True Neutral','Chaotic Neutral','Lawful Evil','Neutral Evil','Chaotic Evil','Unaligned'];
 const CHARACTER_LANGUAGES=['Common','Common Sign Language','Dwarvish','Elvish','Giant','Gnomish','Goblin','Halfling','Orc','Draconic','Abyssal','Celestial','Deep Speech','Druidic','Infernal','Primordial','Sylvan','Thieves’ Cant','Undercommon','Gith','Quori'];
 const FEATURE_SOURCES=['Class','Subclass','Species','Background','Feat','Magic Item','Custom'];
 const ACTION_TYPES=['Passive','Action','Bonus Action','Reaction','Free','Part of Attack','On hit','On miss','Special','Other'];
 const SPELL_SCHOOLS=['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation'];
 const SPELL_CAST_TIMES=['Action','Bonus Action','Reaction','1 minute','10 minutes','1 hour','8 hours','Special'];
 const COMPANION_TYPES=['Familiar','Pet','Mount','Summon','Animal Companion','Construct','NPC Ally','Other'];
 const distinct=(vals)=>[...new Set(vals.map(x=>String(x||'').trim()).filter(Boolean))];
 function classSubclasses(cls){return distinct([...(D.classes[cls]?.subs||[]).filter(x=>!x.includes('legacy')&&x!=='Custom…'),...(EXTRA_SUBCLASSES[cls]||[])]).sort((a,b)=>a.localeCompare(b));}
 const isCustomValue=(v)=>v==='__custom__';
 function subclassField(index,cls,current=''){
  const options=classSubclasses(cls),isOther=!!current&&!options.includes(current);
  return `<div class="field wide"><label for="f-subclass${index}">${uiText('Subclass / Αρχέτυπο','Subclass / Archetype')}</label>`+
   `<select id="f-subclass${index}" name="subclass${index}" data-subclass-select="${index}" aria-label="Subclass ${index+1}"><option value="">${uiText('— Χωρίς subclass —','— No subclass —')}</option>${options.map(x=>`<option value="${attr(x)}" ${!isOther&&x===current?'selected':''}>${esc(x)}</option>`).join('')}<option value="__custom__" ${isOther?'selected':''}>${uiText('Άλλο / Homebrew…','Other / Homebrew…')}</option></select>`+
   `<input id="f-subclassCustom${index}" name="subclassCustom${index}" type="text" aria-label="${uiText('Όνομα custom subclass','Custom subclass name')}" placeholder="${uiText('Πληκτρολόγησε subclass…','Type subclass name…')}" value="${attr(isOther?current:'')}" style="${isOther?'margin-top:8px;':'display:none;margin-top:8px;'}" />`+
   `</div>`;
 }
 function languageList(value){return distinct(String(value||'').split(/[,;\n]+/).map(x=>x.trim()));}
 function languagesField(value){
  const existing=languageList(value);
  return `<div class="field wide"><label for="atlas-language-pick">${uiText('Γλώσσες χαρακτήρα','Character languages')}</label>`+
   `<select id="atlas-language-pick" data-language-pick aria-label="${uiText('Πρόσθεσε γλώσσα','Add a language')}"><option value="">${uiText('+ Επίλεξε γλώσσα…','+ Select language…')}</option>${CHARACTER_LANGUAGES.map(x=>`<option value="${attr(x)}">${esc(x)}</option>`).join('')}<option value="__custom__">${uiText('+ Άλλη / Homebrew…','+ Other / Homebrew…')}</option></select>`+
   `<div id="selected-language-list" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">${existing.map(lang=>`<button type="button" class="btn sm" data-language-remove="${attr(lang)}" title="${uiText('Αφαίρεση γλώσσας','Remove language')}">${esc(lang)} ×</button>`).join('')}</div>`+
   `<div id="language-custom-box" style="display:none;gap:6px;margin-top:8px;"><input id="language-custom-input" type="text" maxlength="90" placeholder="${uiText('Όνομα γλώσσας','Language name')}" /><button type="button" class="btn sm" data-action="add-custom-language">${uiText('Προσθήκη','Add')}</button></div>`+
   `<input type="hidden" name="languages" id="f-languages" value="${attr(existing.join(', '))}"/>`+
   `<span class="tiny muted">${uiText('Πάτησε × για αφαίρεση. Μπορείς να προσθέσεις πολλές γλώσσες.','Tap × to remove. You can select multiple languages.')}</span></div>`;
 }
 function refreshLanguageChips(){
  const hidden=document.getElementById('f-languages'),target=document.getElementById('selected-language-list');if(!hidden||!target)return;
  target.innerHTML=languageList(hidden.value).map(lang=>`<button type="button" class="btn sm" data-language-remove="${attr(lang)}" title="${uiText('Αφαίρεση','Remove')}">${esc(lang)} ×</button>`).join('');
 }
 function addLanguage(value){const hidden=document.getElementById('f-languages');if(!hidden||!value||isCustomValue(value))return;
  const v=String(value).trim().slice(0,90);if(!v)return;
  const list=languageList(hidden.value);if(!list.some(x=>x.toLocaleLowerCase()===v.toLocaleLowerCase()))list.push(v);
  hidden.value=list.join(', ');refreshLanguageChips();
 }
 function referenceSelect(kind,items){
  const opts=[...items].sort((a,b)=>a.name.localeCompare(b.name));
  return `<div class="field wide" style="margin:0 0 12px;"><label for="atlas-reference-select">${uiText('Επιλογή από dropdown','Select from dropdown')}</label><select id="atlas-reference-select" data-reference-select="${attr(kind)}"><option value="">${uiText('— Διάλεξε καταχώριση —','— Choose an entry —')}</option>${opts.map(x=>`<option value="${attr(x.id)}">${esc(x.name)}${x.kind==='Spell'?' · '+formatLevel(x.level):x.kind==='Feat'?' · '+x.tier:''}</option>`).join('')}</select><div class="actions-inline" style="margin-top:8px;"><button class="btn primary sm" data-action="add-selected-reference">+ ${uiText('Προσθήκη / Αφαίρεση','Add / Remove')}</button><button class="btn sm" data-action="details-selected-reference">${uiText('Πληροφορίες','Details')}</button>${kind==='feats'?`<button class="btn sm" data-action="add-custom-feat">+ ${uiText('Custom feat','Custom feat')}</button>`:''}</div></div>`;
 }
 function customFeatDetail(id){let feat=(c().customFeats||[]).find(x=>x.id===id);if(!feat)return;
  openModal(feat.name,`<div class="detail-meta"><span class="chip gold">${esc(feat.tier||'Custom')} Feat</span></div><div class="detail-description">${esc(feat.summary||'—')}</div>`,btn(uiText('Αφαίρεση','Remove'),'remove-custom-feat:'+id,'warn')+btn(uiText('Κλείσιμο','Close'),'close-modal'));
 }
 function createCustomFeat(){formModal(uiText('Προσθήκη custom feat','Add a custom feat'),field('name','Feat name','')+selectField('tier','Feat type','General',['Origin','General','Epic Boon','Fighting Style','Custom'])+field('summary','Effect / notes','','textarea','wide'),'save-custom-feat');}
 const initialClass = (cls='Fighter')=>({name:cls,level:1,subclass:''});
 const defaultChar=(name='New Adventurer',cls='Fighter')=>{
  const conf=D.classes[cls]||D.classes.Custom;
  const c={id:uid(),name,player:'',species:'Human',background:'Custom',alignment:'',classes:[initialClass(cls)],abilities:{STR:10,DEX:10,CON:10,INT:10,WIS:10,CHA:10},skills:{},saves:[...conf.saves],hp:{max:12,current:12,temp:0},ac:12,loadouts:[{id:uid(),name:'Default',ac:12}],activeLoadout:0,speed:30,initiativeBonus:0,proficiencyOverride:'',passivePerceptionOverride:'',inspiration:false,conditions:[],exhaustion:0,attacks:[],resources:[],features:[],companions:[],feats:[],customFeats:[],maneuvers:[],spellbook:[],slots:{},pact:{level:1,max:0,used:0},spellAbility:conf.ability||'INT',spellDCOverride:'',spellAttackOverride:'',concentrating:'',inventory:[],currency:{cp:0,sp:0,ep:0,gp:0,pp:0},notes:'',journal:[],hitDice:{max:1,used:0},death:{success:0,fail:0},languages:'Common',proficiencies:'',plan:'',portrait:'',rolls:[],rulesVersion:'2024'};
  applyClassResources(c,cls);return c;
 };
 function applyClassResources(c,cls){
   const resource=(name,max,recharge='long',detail='')=>c.resources.push({id:uid(),name,max,current:max,recharge,detail});
   if(cls==='Fighter'){resource('Second Wind',2,'short1','Bonus Action: regain 1d10 + Fighter level HP');if(totalLevel(c)>=2)resource('Action Surge',1,'short','Extra action, not Magic action');}
   if(cls==='Barbarian')resource('Rage',2,'long','Bonus Action · Rage uses by level');
   if(cls==='Bard')resource('Bardic Inspiration',Math.max(1,ability(c,'CHA')),'long','Number of dice usually uses CHA modifier; edit when stats are set');
   if(cls==='Cleric')resource('Channel Divinity',2,'short1','Varies by subclass and level');
   if(cls==='Druid')resource('Wild Shape',2,'short1','Varies by Circle and level');
   if(cls==='Monk')resource('Focus Points',1,'short','Normally scales with Monk level');
   if(cls==='Paladin')resource('Lay on Hands',5,'long','Healing pool; scales with Paladin level');
   if(cls==='Sorcerer')resource('Sorcery Points',2,'long','Available from Sorcerer level 2');
   if(cls==='Warlock')c.pact={level:1,max:1,used:0};
   if(cls==='Wizard')resource('Arcane Recovery',1,'long','Recover spell slots after Short Rest within class limits');
   if(confFor(cls).caster==='full')c.slots={1:{max:2,used:0}};
 }
 const confFor=(cls)=>D.classes[cls]||D.classes.Custom;
 function makeBorruk(){
  const c=defaultChar('Borruk Thunderfist','Fighter');
  c.player='';c.species='Human';c.background='Soldier';c.alignment='Neutral Good';c.classes=[{name:'Fighter',level:3,subclass:'Battle Master'}];c.abilities={STR:15,DEX:14,CON:13,INT:8,WIS:10,CHA:12};c.hp={max:30,current:30,temp:0};c.hitDice={max:3,used:0};c.skills={'Athletics':1,'Intimidation':1,'Medicine':1,'Survival':1,'Perception':1};c.saves=['STR','CON'];c.loadouts=[{id:uid(),name:'Spear + Shield',ac:18},{id:uid(),name:'Greatsword (two-handed)',ac:16}];c.activeLoadout=0;
  c.attacks=[
   {id:uid(),name:'Spear',ability:'STR',damage:'1d6',type:'Piercing',mastery:'Sap',proficient:true,magicBonus:0,damageBonus:0,bonusOverride:'',notes:'Versatile (1d8). Thrown 20/60 ft.',equipped:true},
   {id:uid(),name:'Greatsword',ability:'STR',damage:'2d6',type:'Slashing',mastery:'Graze',proficient:true,magicBonus:0,damageBonus:0,bonusOverride:'',notes:'Heavy, Two-Handed. Requires both hands; AC 16 in greatsword loadout.',equipped:true},
   {id:uid(),name:'Dagger',ability:'DEX',damage:'1d4',type:'Piercing',mastery:'',proficient:true,magicBonus:0,damageBonus:0,bonusOverride:'',notes:'Finesse, Light, Thrown.',equipped:true},
   {id:uid(),name:'Light Crossbow',ability:'DEX',damage:'1d8',type:'Piercing',mastery:'Slow',proficient:true,magicBonus:0,damageBonus:0,bonusOverride:'',notes:'Ammunition, Loading, Two-Handed.',equipped:true}
  ];
  c.resources=[{id:uid(),name:'Second Wind',current:2,max:2,recharge:'short1',detail:'Bonus Action, heal 1d10+3'},{id:uid(),name:'Action Surge',current:1,max:1,recharge:'short',detail:'One additional action'},{id:uid(),name:'Superiority Dice',current:4,max:4,recharge:'short',detail:'d8 · Maneuver Save DC 12'}];
  c.features=[{id:uid(),name:'Protection Fighting Style',detail:'Όταν σύμμαχος δίπλα σου δέχεται επίθεση και κρατάς Shield, μπορείς να χρησιμοποιήσεις Reaction ώστε να δυσκολέψεις τις επιθέσεις εναντίον του μέχρι την αρχή του επόμενου turn σου.',action:'Reaction',source:'Fighter',level:1},{id:uid(),name:'Tactical Mind',detail:'Σε αποτυχημένο Ability Check μπορείς να ξοδέψεις χρήση Second Wind για +1d10 στο check· αν παραμείνει αποτυχία, δεν χάνεται η χρήση.',action:'Special',source:'Fighter',level:2},{id:uid(),name:'Student of War',detail:'Ως Battle Master αποκτάς 1 extra Fighter skill proficiency και 1 artisan tool proficiency. Καταχώρισέ τα στο Character tab.',action:'Passive',source:'Battle Master',level:3}];
  c.feats=['feat-tough','feat-savageattacker'];c.maneuvers=['man-precisionattack','man-baitandswitch','man-menacingattack'];c.currency={gp:9,cp:0,sp:0,ep:0,pp:0};
  c.inventory=[{id:uid(),name:'Chain Mail',qty:1,description:'Heavy Armor · AC 16',weight:55,equipped:true},{id:uid(),name:'Shield',qty:1,description:'+2 AC when wielded. Equipping/doffing requires Utilize action (2024).',weight:6,equipped:true},{id:uid(),name:'Spear',qty:1,description:'Main one-handed weapon',weight:3,equipped:true},{id:uid(),name:'Greatsword',qty:1,description:'Two-handed high-damage weapon',weight:6,equipped:false},{id:uid(),name:'Dagger',qty:1,description:'Backup weapon',weight:1,equipped:false},{id:uid(),name:'Light Crossbow',qty:1,description:'Ranged weapon; requires bolts',weight:5,equipped:false}];
  c.passivePerceptionOverride=10; c.notes='Borruk — level 3 example based on the supplied character sheet. Check the chosen maneuvers, skill proficiencies and available inventory with the DM.\n\nWarhammer: destroyed; not in inventory.';
  c.plan='Level 4: consider +1 STR / +1 CON (ASI), Shield Master, or other feat. Check with DM.';
  c.proficiencies='Armor: Light, Medium, Heavy, Shields. Weapons: Simple, Martial. Tools: choose Student of War tool.';return c;
 }
 function makeWizardDemo(){const c=defaultChar('Astra Vale','Wizard');c.classes=[{name:'Wizard',level:5,subclass:'Evoker'}];c.species='Elf';c.background='Sage';c.abilities={STR:8,DEX:14,CON:14,INT:18,WIS:12,CHA:10};c.hp={max:32,current:32,temp:0};c.hitDice={max:5,used:0};c.ac=12;c.loadouts=[{id:uid(),name:'Mage Armor',ac:15},{id:uid(),name:'Unarmored',ac:12}];c.skills={Arcana:1,History:1,Investigation:1,Perception:1};c.spellAbility='INT';c.slots={1:{max:4,used:0},2:{max:3,used:0},3:{max:2,used:0}};c.spellbook=['Fire Bolt','Mage Hand','Prestidigitation','Shield','Magic Missile','Mage Armor','Misty Step','Hold Person','Fireball','Counterspell','Detect Magic'].map(n=>({id:uid(),ref:D.spells.find(s=>s.name===n)?.id||'',name:n,prepared:!['Detect Magic'].includes(n)}));c.resources=[{id:uid(),name:'Arcane Recovery',max:1,current:1,recharge:'long',detail:'Recover spell slots after a Short Rest'}];c.notes='Demo character to show how a spellcaster sheet looks. All values are editable.';return c;}
 function makeRogueDemo(){const c=defaultChar('Kestrel','Rogue');c.classes=[{name:'Rogue',level:3,subclass:'Thief'}];c.abilities={STR:10,DEX:17,CON:12,INT:12,WIS:13,CHA:14};c.species='Halfling';c.background='Criminal';c.hp={max:24,current:24,temp:0};c.hitDice={max:3,used:0};c.loadouts=[{id:uid(),name:'Leather Armor',ac:14}];c.skills={Stealth:2,'Sleight of Hand':2,Acrobatics:1,Deception:1,Perception:1};c.attacks=[{id:uid(),name:'Shortsword',ability:'DEX',damage:'1d6',type:'Piercing',mastery:'Vex',proficient:true,magicBonus:0,damageBonus:0,bonusOverride:'',notes:'Finesse, Light'}, {id:uid(),name:'Shortbow',ability:'DEX',damage:'1d6',type:'Piercing',mastery:'Vex',proficient:true,magicBonus:0,damageBonus:0,bonusOverride:'',notes:'Ranged'}];c.features=[{id:uid(),name:'Sneak Attack',detail:'Προσθέτεις damage μία φορά ανά turn σε κατάλληλο hit εφόσον ικανοποιούνται οι προϋποθέσεις (Finesse ή ranged, Advantage ή κατάλληλος σύμμαχος). Για Rogue level 3: 2d6.',action:'Once per turn',source:'Rogue',level:1}];c.notes='Demo character to illustrate skill Expertise and noncaster classes.';return c;}
 let characters,selectedId,view='overview',libraryCategory='all',libraryQuery='',libraryLevel='all',spellQuery='',spellLevel='all';
 let lastFocus=null,modalOpen=false;
 const cloud={enabled:false,ready:false,url:'',token:'',user:null,revisions:{},queues:new Map(),imageTags:{}};
 try{const s=JSON.parse(localStorage.getItem(KEY));characters=Array.isArray(s?.characters)&&s.characters.length?s.characters:null;selectedId=s?.selectedId;}catch{}
 if(!characters){characters=[defaultChar('New Adventurer')];selectedId=characters[0].id;}
 try{const u=JSON.parse(localStorage.getItem(VIEWKEY));if(navigation.some(x=>x[0]===u.view))view=u.view;}catch{}
 let c=()=>characters.find(x=>x.id===selectedId)||characters[0];
 function save(){if(cloud.enabled){if(cloud.user&&cloud.ready)cloudPush(c());return;}try{localStorage.setItem(KEY,JSON.stringify({characters,selectedId}));}catch(e){toast('Unable to save locally. Export a backup.');}}
 function saveView(){try{localStorage.setItem(VIEWKEY,JSON.stringify({view}));}catch{}}
 const findReference=id=>[...D.maneuvers,...D.feats,...D.spells,...D.conditions,...D.actions,...D.masteries].find(x=>x.id===id);
 const charFeatures=(ch)=>ch.features||[];
 const btn=(label,action,cls='')=>`<button class="btn ${cls}" data-action="${attr(action)}">${label}</button>`;
 const iconSvg=(name)=>({overview:'<path d="M3 10 12 3l9 7v11H3Z"/><path d="M9 21v-8h6v8"/>',combat:'<path d="m3 20 8-8M7 4l13 13-3 3L4 7zM21 4 4 21"/>',character:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',spells:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',inventory:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18"/>',journal:'<path d="M4 4h15v16H4zM8 8h8M8 12h8M8 16h5"/>',library:'<path d="M4 5h8a4 4 0 0 1 4 4v12H8a4 4 0 0 0-4-4zM20 5h-4a4 4 0 0 0-4 4v12h4a4 4 0 0 1 4-4z"/>',dice:'<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',add:'<path d="M12 4v16M4 12h16"/>',edit:'<path d="m4 16-1 5 5-1L20 8l-4-4z"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 18v3h16v-3"/>',chevron:'<path d="m7 10 5 5 5-5"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',book:'<path d="M4 5h8a4 4 0 0 1 4 4v12H8a4 4 0 0 0-4-4zM20 5h-4a4 4 0 0 0-4 4v12h4a4 4 0 0 1 4-4z"/>',close:'<path d="M5 5l14 14M19 5 5 19"/>',shield:'<path d="m12 2 9 4v5c0 6-4 9-9 11-5-2-9-5-9-11V6z"/>',bolt:'<path d="m13 2-9 12h8l-1 8 9-12h-8z"/>'})[name]||'<circle cx="12" cy="12" r="8"/>';
 const svg=(name)=>`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconSvg(name)}</svg>`;
 const panel=(title,content,actions='',hint='')=>`<section class="panel"><div class="panel-title"><h3>${title}</h3><div class="actions-inline">${hint?`<span>${hint}</span>`:''}${actions}</div></div><div class="panel-content">${content}</div></section>`;
 const textbutton=(name,ref)=>`<button class="linklike" data-detail="${attr(ref)}">${esc(name)}</button>`;
 function renderApp(){
  const ch=c();if(!ch)return;
  const lvl=totalLevel(ch);document.title=`${ch.name} · Character Atlas`;
  document.getElementById('app').innerHTML=`<div class="app"><header class="topbar"><div class="brand"><div class="logo">A</div><div><strong>CHARACTER ATLAS</strong><small>D&D 2024 · Shared party</small></div></div><div class="top-actions"><select class="language-select" data-language-select aria-label="Language"><option value="en" ${L.getLanguage()==="en"?"selected":""}>EN</option><option value="el" ${L.getLanguage()==="el"?"selected":""}>ΕΛ</option></select><select class="select-character" aria-label="Επιλογή χαρακτήρα" data-char-select>${characters.map(x=>`<option value="${attr(x.id)}" ${x.id===ch.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select><button class="btn sm" data-action="new-character" title="New Character">+ ${tr('Νέος Χαρακτήρας','New Character')}</button><button class="btn sm" type="button" data-atlas-session title="Cloud account">☁ ${tr('Σύνδεση','Account')}</button><button class="btn sm" data-action="settings" aria-label="Settings">${svg('settings')} ${tr('Ρυθμίσεις','Settings')}</button></div></header><div class="shell"><aside class="sidebar"><div class="side-head">ADVENTURE DESK</div><nav class="nav-list">${navigation.map(([id,name])=>`<button data-tab="${id}" class="nav-item ${id===view?'active':''}">${svg(id)} ${name}</button>`).join('')}</nav><div class="side-footer"><span class="chip gold">2024 Rules Only</span><br/>Οι χαρακτήρες συγχρονίζονται από Cloudflare D1 όταν έχεις συνδεθεί.</div></aside><main class="main"><div class="content">${view==='overview'?'':hero(ch)}${renderPage(ch)}<footer class="footer">D&D Atlas v${APP_VERSION} · Fan-made, unofficial companion · Summaries only · Rulebook/DM have final say · <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noopener">SRD 5.2.1</a> (CC BY 4.0). Not affiliated with Wizards of the Coast.</footer></div></main></div><nav class="mobile-nav">${navigation.map(([id,name])=>`<button data-tab="${id}" class="${id===view?'active':''}">${svg(id)}<span>${name}</span></button>`).join('')}</nav><input id="edit-json-file" type="file" accept="application/json,.json" hidden><input id="import-docx-file" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden><input id="session-import-file" type="file" accept=".json,application/json" hidden><input id="portrait-file" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif" aria-label="Choose character image" hidden /></div>`;
  L.translateRoot(document.getElementById('app'));
 }
 function hero(ch){let load=activeLoadout(ch);return `<section class="hero"><div class="hero-title"><button class="avatar portrait-trigger" type="button" data-action="portrait" aria-label="Character portrait" title="Character portrait">${portraitMarkup(ch)}<span class="portrait-camera" aria-hidden="true">✎</span></button><div><h1>${esc(ch.name)}</h1><div class="subline">${esc(ch.species)} · ${esc(classLabel(ch))}</div><div class="hero-meta"><span class="chip gold">LVL ${totalLevel(ch)}</span><span class="chip">${esc(ch.background||'No background')}</span><span class="chip">PB ${signed(prof(ch))}</span>${ch.inspiration?'<span class="chip good">✧ Inspired</span>':''}${ch.concentrating?`<span class="chip good">◉ Conc: ${esc(ch.concentrating)}</span>`:''}</div></div></div><div class="hero-tools"><button class="btn sm" data-action="edit-character">${svg('edit')} Edit</button><button class="btn sm" data-action="level-up">Level ↑</button></div></section>`;}
 function renderPage(ch){return ({overview:renderOverview,combat:renderCombat,character:renderCharacter,spells:renderSpells,inventory:renderInventory,journal:renderJournal,library:renderLibrary}[view]||renderOverview)(ch)}
 const pb=(text,action,css='')=>`<button class="pill ${css}" data-action="${attr(action)}">${text}</button>`;
 function hpCard(ch){const p=ch.hp||{max:1,current:0,temp:0},percentage=clamp((p.current/Math.max(1,p.max))*100,0,100);
 return `<div class="statcard"><div class="lbl">HIT POINTS</div><div class="big red mono">${p.current}<span style="font-size:16px;color:#96a9b6"> / ${p.max}</span></div><div class="hp-rail"><div style="width:${percentage}%"></div></div>${p.temp?`<div class="hint">Temporary HP: +${p.temp}</div>`:''}<div class="actions-inline"><button class="btn sm" data-action="hp-damage">− Damage</button><button class="btn sm" data-action="hp-heal">+ Heal</button><button class="btn sm" data-action="hp-edit">Edit</button></div></div>`;}
 function statCards(ch){return `<div class="stat-cards">${hpCard(ch)}<div class="statcard"><div class="lbl">ARMOR CLASS</div><div class="big aqua">${AC(ch)}</div><div class="hint">${esc(activeLoadout(ch).name)}</div><div class="actions-inline" style="margin-top:10px">${ch.loadouts?.length>1?`<button class="btn sm" data-action="change-loadout">⇄ Loadout</button>`:''}<button class="btn sm" data-action="edit-loadouts">Edit</button></div></div><div class="statcard"><div class="lbl">INITIATIVE</div><div class="big gold">${signed(initMod(ch))}</div><div class="hint">Speed ${ch.speed} ft</div><div class="actions-inline" style="margin-top:10px"><button class="btn sm" data-roll="1d20${signed(initMod(ch))}" data-roll-label="Initiative">${svg('dice')} Roll</button></div></div><div class="statcard"><div class="lbl">PROFICIENCY</div><div class="big">${signed(prof(ch))}</div><div class="hint">Level ${totalLevel(ch)} · ${esc(ch.rulesVersion||'2024')}</div><div class="actions-inline" style="margin-top:10px"><button class="btn sm" data-action="inspiration">${ch.inspiration?'✦ Inspired':'☆ Inspiration'}</button></div></div></div>`;}
 function abilityCards(ch){return `<div class="ability-grid">${Object.entries(D.abilities).map(([k,n])=>`<button class="ability" data-ability="${k}" title="${n} · click for roll"><span class="title">${k}</span><span class="mod">${signed(ability(ch,k))}</span><span class="score">${ch.abilities[k]}</span></button>`).join('')}</div>`}
 function resources(ch,short=false){if(!ch.resources?.length)return `<div class="empty"><strong>Δεν υπάρχουν ακόμη resources</strong>Πρόσθεσε Ki / Focus, Rage, Lay on Hands, Channel Divinity κ.λπ.</div>`;
 return `<div>${ch.resources.map(r=>`<div class="resource-row"><div class="resource-meta"><div class="name"><button class="linklike" data-resource-detail="${attr(r.id)}">${esc(r.name)}</button></div><small>${esc(r.detail||r.recharge)}</small></div><div class="counter"><button class="btn sm" data-resource-step="${attr(r.id)}:-1" aria-label="Spend ${attr(r.name)}">−</button><span class="counter-val">${r.current} / ${r.max}</span><button class="btn sm" data-resource-step="${attr(r.id)}:1" aria-label="Restore ${attr(r.name)}">+</button></div></div>`).join('')}</div>`;}
 function twoHandedShieldConflict(ch,a){
  const weaponName=String(a?.name||'').toLowerCase();
  const canonicalTwoHanded=['greatsword','greataxe','glaive','halberd','maul','pike','longbow','shortbow','light crossbow','heavy crossbow'];
  const requiresTwoHands=canonicalTwoHanded.includes(weaponName)||(/\btwo[- ]handed\b/i.test(a?.notes||''));
  const active=(ch.loadouts||[])[ch.activeLoadout||0];
  return requiresTwoHands&&/\bshield\b/i.test(active?.name||'');
 }
 // The mastery property belongs to the official weapon, not to a stale attack record.
 function atlasAttackMastery(ch,a){
   const name=String(a?.weaponType||a?.name||'').trim().toLowerCase();
   const item=(ch.inventory||[]).find(i=>String(i.name||'').trim().toLowerCase()===name);
   const weapon=D.weapons.find(w=>w.name.toLowerCase()===String(item?.weaponType||name).toLowerCase());
   if(!weapon||!selectedMasteries(ch).includes(weapon.name))return null;
   const rule=D.masteries.find(m=>m.name===weapon.mastery);
   return rule?{name:weapon.mastery,summary:L.summary(rule)||rule.summary||'',weapon:weapon.name}:null;
 }
 function atlasMasteryHelp(ch,a){const m=atlasAttackMastery(ch,a);if(!m)return '';
   const nick=m.name==='Nick'?tr('Nick: η επιπλέον επίθεση από την ιδιότητα Light μπορεί να γίνει ως μέρος της ενέργειας Attack αντί για Bonus Action, μία φορά ανά γύρο. Χρειάζεται να πληρούνται οι όροι του Light· δεν προστίθεται αυτόματα ζημιά.','Nick: make the extra attack granted by the Light property as part of the Attack action instead of a Bonus Action, once per turn. All Light requirements still apply; no automatic extra damage.'):m.summary;
   return `<span class="atlas-feature-selected">★ ${esc(m.name)} — ${esc(nick)}</span>`;
 }
 function atlasBarbarianPending(ch){const level=(ch.classes||[]).find(x=>x.name==='Barbarian')?.level||0;if(level<1)return '';
   const count=masteryCapacity(ch),chosen=selectedMasteries(ch),missing=count-chosen.length;
   return missing>0?`<div class="atlas-mastery-alert" role="status"><strong>${tr('Εκκρεμούν επιλογές Weapon Mastery','Weapon Mastery choices pending')}: ${chosen.length}/${count}</strong><p>${tr('Επίλεξε τους τύπους όπλων στο Inventory. Οι ιδιότητες (Cleave, Nick, Vex, Push κ.ά.) ενεργοποιούνται μόνο για επιλεγμένα όπλα.','Choose weapon kinds in Inventory. Properties (Cleave, Nick, Vex, Push, etc.) apply only to selected weapons.')}</p><button class="btn sm" type="button" data-action="choose-masteries">${tr('Επιλογή όπλων','Choose weapons')}</button></div>`:'';
 }
 function attackList(ch,showEdit=false){
  if(!ch.attacks?.length)return `<div class="empty">${tr('Δεν υπάρχουν καταχωρισμένες επιθέσεις.','No attacks recorded.')} ${btn(tr('Προσθήκη','Add'),'add-attack','sm')}</div>`;
  return `<div class="tile-list">${ch.attacks.map(a=>{const mastery=atlasAttackMastery(ch,a);const mastered=!!mastery;const status=weaponStateForAttack(ch,a);return `<div class="tile"><button class="linklike" data-attack-detail="${attr(a.id)}" style="text-align:left;flex:1;min-width:0"><span class="name">${esc(a.name)} ${mastery?`<span style="color:#e5c17a">★ ${esc(mastery.name)}</span>`:''}</span><span class="desc">${esc(attackDamage(ch,a))} ${esc(a.type||'')} · ${tr('Επίθεση','Attack')} ${signed(attackBonus(ch,a))}</span>${twoHandedShieldConflict(ch,a)?`<span class="atlas-combat-weapon-state" style="color:#e5c17a">${tr('Μη διαθέσιμο: δίχειρο όπλο με ασπίδα. Άλλαξε loadout.','Unavailable: two-handed weapon with shield. Change loadout.')}</span>`:''}${status?`<span class="atlas-combat-weapon-state">${weaponStateTag(status)}</span>`:''}${atlasMasteryHelp(ch,a)}</button><div class="actions-inline"><button class="btn sm" data-attack-detail="${attr(a.id)}">${tr('Οδηγίες ζαριών','Dice instructions')}</button>${showEdit?`<button class="btn sm" data-edit-attack="${attr(a.id)}">${tr('Επεξεργασία','Edit')}</button>`:''}</div></div>`}).join('')}</div>`;
 }

 function miniSpellList(ch,limit=7){let rows=(ch.spellbook||[]).map(s=>({...s,def:s.ref?findReference(s.ref):null})).filter(x=>x.prepared!==false).sort((a,b)=>(a.def?.level??a.level??0)-(b.def?.level??b.level??0));if(!rows.length)return `<div class="empty">Δεν υπάρχουν prepared spells.</div>`;return `<div class="tile-list">${rows.slice(0,limit).map(s=>`<button class="tile" data-owned-spell="${attr(s.id)}"><div><span class="name">${esc(s.name)}</span><span class="desc">${formatLevel(s.def?.level??s.level??0)} · ${esc(s.def?.cast||s.cast||'Action')}</span>${spellTag(s.damage?{...s,level:s.def?.level??s.level}:s.def||s,ch,true)}</div><span class="right">View →</span></button>`).join('')}</div>${rows.length>limit?`<button class="linklike" style="margin-top:10px" data-tab="spells">+ ${rows.length-limit} περισσότερα →</button>`:''}`;}
 function conditionPills(ch){return `<div class="pills">${(ch.conditions||[]).map(id=>{let d=findReference(id);return `<button class="pill danger active" data-detail="${attr(id)}">${esc(d?.name||id)} ✕</button>`}).join('')||'<span class="muted small">Καμία ενεργή κατάσταση</span>'}</div>`;}
 // 2024: computed features take precedence over imported 2014/legacy labels.
 const fighterMasteryLimit=level=>level>=16?6:level>=10?5:level>=4?4:level>=1?3:0;
 const weaponMasterySources=ch=>(ch.classes||[]).filter(q=>['Fighter','Barbarian','Paladin','Ranger','Rogue'].includes(q.name)&&Number(q.level)>=1);
 function masteryCapacity(ch){
  const capacities=weaponMasterySources(ch).map(q=>{
   const lv=Number(q.level);
   if(q.name==='Fighter')return fighterMasteryLimit(lv);
   if(q.name==='Barbarian')return lv>=10?4:lv>=4?3:2;
   if(q.name==='Rogue')return 2;
   return 2;
  });
  // Multiclass mastery choices: avoid double-counting without a rule-confirmed combined list.
  return capacities.length?Math.max(...capacities):0;
 }
 const isBattleMaster=ch=>(ch.classes||[]).some(q=>q.name==='Fighter'&&Number(q.level)>=3&&q.subclass==='Battle Master');
 function studentSelection(ch){return R.studentSelection(ch);}

 function fighterStyle(ch){
   if(ch.fightingStyle)return String(ch.fightingStyle).trim();
   const legacy=(ch.features||[]).find(f=>/\bFighting Style\b/i.test(f.name));
   return legacy?String(legacy.name).replace(/\s*Fighting Style\s*/i,'').trim():'';
 }
 function selectedMasteries(ch){return [...new Set((ch.weaponMasteries||[]).filter(n=>R.masteryEligible(ch,D.weapons.find(w=>w.name===n),D.weapons)))].slice(0,masteryCapacity(ch));}
 function atlasWeaponKind(item){
  const raw=String(item?.weaponType||item?.name||'').trim().toLowerCase();
  return D.weapons.find(w=>w.name.toLowerCase()===raw)?.name||'';
 }
 const weaponStates=['normal','damaged','broken','poisoned','lost','stolen','destroyed','other'];
 function weaponStateLabel(state){
  const v=String(state||'normal');const labels={
   normal:['Κανονικό','Normal'],damaged:['Φθαρμένο','Damaged'],broken:['Σπασμένο','Broken'],
   poisoned:['Με δηλητήριο','Poisoned coating'],lost:['Χαμένο','Lost'],stolen:['Κλεμμένο','Stolen'],
   destroyed:['Κατεστραμμένο','Destroyed'],other:['Άλλη κατάσταση','Other']};
  return tr(...(labels[v]||labels.normal));
 }
 function weaponStateTag(item){const state=item?.weaponStatus||'normal';return state==='normal'?'':`<span class="atlas-weapon-status" data-state="${attr(state)}" title="${attr(item?.weaponStatusNote||'')}">${esc(weaponStateLabel(state))}</span>`;}
 function weaponStateForAttack(ch,a){
  const found=(ch.inventory||[]).find(i=>String(i.name||'').toLowerCase()===String(a.name||'').toLowerCase()) || (ch.inventory||[]).find(i=>atlasWeaponKind(i)===a.name);
  return found&&found.weaponStatus&&found.weaponStatus!=='normal'?found:null;
 }
 function masteryAlert(ch){
  const limit=masteryCapacity(ch);
  if(!limit)return '';
  const count=selectedMasteries(ch).length;
  if(count>=limit)return '';
  return `<div class="atlas-mastery-alert" role="status"><div><strong>${tr('⚠ Εκκρεμούν εξειδικεύσεις όπλων','⚠ Weapon Masteries pending')}: <span class="atlas-mastery-count">${count}/${limit}</span></strong><p>${tr('Επίλεξε τα όπλα εσύ από τον Εξοπλισμό, πατώντας ☆. Δεν υπάρχουν αυτόματες επιλογές.','Choose your weapon kinds in Inventory using ☆. None are auto-selected.')}</p></div><button class="btn sm" data-tab="inventory">${tr('Μετάβαση στον Εξοπλισμό','Go to Inventory')} →</button></div>`;
 }
 function atlasMasteryToggle(ch,name){
  const limit=masteryCapacity(ch);
  if(!limit)return;
  const official=D.weapons.find(w=>w.name===name);
  if(!official)return toast(tr('Δεν αναγνωρίστηκε τύπος όπλου στους κανόνες 2024.','Unknown weapon type under 2024 rules.'));
  const active=selectedMasteries(ch),idx=active.indexOf(name);
  if(idx!==-1){ch.weaponMasteries=active.filter(x=>x!==name);}
  else if(active.length>=limit){toast(tr(`Έχεις ήδη επιλέξει ${limit} είδη όπλων. Αφαίρεσε ένα αστεράκι πρώτα.`,`You already selected ${limit} weapon kinds. Remove one star first.`));return;}
  else ch.weaponMasteries=[...active,name];
  save();renderApp();
 }
 function masteryStar(ch,weaponName){
  if(!masteryCapacity(ch)||!weaponName)return '';const weapon=D.weapons.find(w=>w.name===weaponName);if(!R.masteryEligible(ch,weapon,D.weapons))return '';
  const on=selectedMasteries(ch).includes(weaponName);
  return `<button class="atlas-mastery-button" type="button" data-atlas-toggle-mastery="${attr(weaponName)}" aria-label="${attr(tr(on?'Αφαίρεση εξειδίκευσης: ':'Επιλογή εξειδίκευσης: ',on?'Remove mastery: ':'Select mastery: ')+weaponName)}" title="${attr(tr(on?'Επιλεγμένη εξειδίκευση':'Επιλογή εξειδίκευσης',on?'Selected mastery':'Choose mastery'))}" aria-pressed="${on}">${on?'★':'☆'}</button>`;
 }

 function atlasAutoFeatures(ch){
  const level=Number((ch.classes||[]).find(x=>x.name==='Fighter')?.level||0),x=[];
  const add=(name,detail,lvl,source='Fighter',extra={})=>x.push({id:'atlas-'+name.toLowerCase().replace(/[^a-z]/g,''),name,detail,level:lvl,source,action:'Feature',...extra});
  if(level>=1){
    add('Second Wind',tr('Ως πρόσθετη ενέργεια ανακτάς 1d10 + επίπεδο Fighter σε πόντους ζωής. Οι διαθέσιμες χρήσεις εξαρτώνται από το επίπεδό σου.','As a Bonus Action, regain 1d10 + Fighter level Hit Points. Uses scale with Fighter level.'),1);
    const count=fighterMasteryLimit(level),names=selectedMasteries(ch);
    const list=names.map(n=>{const w=D.weapons.find(w=>w.name===n);return n+' ('+w.mastery+')';});
    add('Weapon Mastery',names.length?`${tr('Επιλεγμένα όπλα','Selected weapons')}: ${list.join(', ')}. ${tr('Επιτρέπεται αλλαγή μίας επιλογής μετά από Παρατεταμένη ανάπαυση, σύμφωνα με τους κανόνες Fighter 2024.','You can exchange one choice after a Long Rest under the Fighter 2024 rules.')}`:tr(`Δικαιούσαι ${count} επιλογές εξειδίκευσης όπλων στο επίπεδο ${level}. Δεν έχουν καταχωριστεί ακόμη.`,`You have ${count} weapon mastery choices at Fighter level ${level}; none are recorded yet.`),1,'Fighter',{subline:`${names.length}/${count} · ${names.length?list.join(' · '):tr('Δεν έχουν επιλεγεί όπλα','No weapons selected')}`,masteryPicker:true,selectedValue:list.join(' · ')});
    const style=fighterStyle(ch);
    add('Fighting Style'+(style?' — '+style:''),style?tr('Επιλεγμένο στυλ: ','Selected style: ')+style+'. '+(style==='Protection'?tr('Όταν κρατάς ασπίδα μπορείς να χρησιμοποιήσεις την Αντίδρασή σου για να προστατεύσεις κοντινό σύμμαχο, σύμφωνα με τους κανόνες Protection του 2024.','While wielding a Shield, you can use your Reaction to protect a nearby ally under the 2024 Protection rules.'):''):tr('Δεν έχει επιλεγεί ακόμη Στυλ μάχης.','No Fighting Style has been selected yet.'),1,'Fighter',{subline:style?style:tr('Εκκρεμεί επιλογή','Choice pending'),selectedValue:style});
  }
  if(level>=2){add('Action Surge',tr('Αποκτάς μία επιπλέον Ενέργεια στον γύρο σου, όχι όμως Magic action.','Gain an extra Action on your turn, excluding the Magic action.'),2);add('Tactical Mind',tr('Σε αποτυχημένο έλεγχο χαρακτηριστικού μπορείς να χρησιμοποιήσεις Second Wind και να προσθέσεις 1d10. Αν εξακολουθεί να αποτυγχάνει, η χρήση δεν καταναλώνεται.','After failing an ability check, expend Second Wind to add 1d10. If the check still fails, the use is not spent.'),2);}
  if(level>=3&&(ch.classes||[]).some(y=>y.name==='Fighter'&&y.subclass==='Battle Master')){add('Combat Superiority',tr('Μαθαίνεις 3 ελιγμούς και έχεις 4 ζάρια ανωτερότητας d8 που ανακτάς σε Σύντομη ή Παρατεταμένη ανάπαυση.','Learn 3 maneuvers and gain 4 d8 Superiority Dice, recovered on a Short or Long Rest.'),3,'Battle Master');add('Student of War',tr('Αυτόματη ικανότητα της υποκλάσης Battle Master στο Fighter Level 3: επιλέγεις επάρκεια σε 1 επιπλέον Skill από τη λίστα Fighter και σε 1 είδος Artisan’s Tools.','Automatically granted by Battle Master at Fighter level 3: choose proficiency in 1 additional Fighter skill and 1 Artisan’s Tools type.'),3,'Battle Master',{selectedValue:[studentSelection(ch).tool,studentSelection(ch).skill].filter(Boolean).join(' · '),subline:[studentSelection(ch).tool,studentSelection(ch).skill].filter(Boolean).join(' · ')||tr('Εκκρεμούν επιλογές','Selections pending')});}
  if(!level&&masteryCapacity(ch)){
    const names=selectedMasteries(ch),limit=masteryCapacity(ch);
    add('Weapon Mastery',tr('Επέλεξε τα είδη όπλων για τα οποία διαθέτεις Weapon Mastery.','Choose the weapon kinds for your Weapon Mastery feature.'),1,weaponMasterySources(ch).map(q=>q.name).join(' / '),{subline:`${names.length}/${limit} · ${names.join(' · ')||tr('Εκκρεμεί επιλογή','Choice pending')}`,masteryPicker:true,selectedValue:names.map(n=>n+' ('+(D.weapons.find(w=>w.name===n)?.mastery||'')+')').join(' · ')});
  }
  if(!level&&['Paladin','Ranger'].some(name=>(ch.classes||[]).some(q=>q.name===name&&Number(q.level)>=2))&&ch.fightingStyle){add('Fighting Style — '+ch.fightingStyle,tr('Επιλεγμένο στυλ μάχης','Selected fighting style')+': '+ch.fightingStyle,2,(ch.classes||[]).filter(q=>['Paladin','Ranger'].includes(q.name)).map(q=>q.name).join(' / '),{selectedValue:ch.fightingStyle});}
  if(ch.species==='Human'){
    add('Human Traits',tr('Resourceful (Ευρηματικότητα): κερδίζεις Heroic Inspiration μετά από κάθε Παρατεταμένη ανάπαυση. Skillful (Επιδεξιότητα): επιλέγεις μία επάρκεια Skill. Versatile (Προσαρμοστικότητα): επιλέγεις ένα Origin Feat. Και τα τρία ισχύουν ταυτόχρονα στους Humans του 2024.','Resourceful: gain Heroic Inspiration after a Long Rest. Skillful: gain one skill proficiency. Versatile: choose one Origin Feat. All three traits apply to 2024 Humans.'),1,'Human',{subline:'Resourceful · Skillful · Versatile'});
  }
  return x;
 }
 function atlasAllFeatures(ch){
  const generated=atlasAutoFeatures(ch),list=[...generated];
  const covered=new Set(generated.map(f=>f.name.toLowerCase()));
  const isHuman=ch.species==='Human',fighter=Number((ch.classes||[]).find(x=>x.name==='Fighter')?.level||0)>0;
  const metas=[];
  for(const f of ch.features||[]){
    const name=String(f.name||'').trim(),low=name.toLowerCase();if(!name)continue;
    if(isHuman&&['resourceful','skillful','versatile'].includes(low))continue;
    if(fighter&&(low==='fighter subclass'||low.includes('fighting style')||low==='weapon mastery'))continue;
    if(covered.has(low))continue;
    if(low.startsWith('metamagic: ')){metas.push(name.slice('Metamagic: '.length));continue;}
    if(low==='metamagic')continue; // below: one aggregated entry with selected Metamagic options
    if(!list.some(x=>x.name.toLowerCase()===low))list.push({...f,selectedValue:f.selectedValue||f.choice||f.selectedOption||''});
  }
  if(metas.length){list.push({id:'atlas-metamagic-options',name:'Metamagic',detail:tr('Επιλεγμένες τεχνικές Μεταμαγείας: ','Selected Metamagic options: ')+metas.join(', '),subline:metas.join(' · '),source:'Sorcerer',level:2,action:'Feature',selectedValue:metas.join(' · ')});}
  else if((ch.features||[]).some(f=>String(f.name).toLowerCase()==='metamagic')){const m=ch.features.find(f=>String(f.name).toLowerCase()==='metamagic');list.push(m);}
  return list;
 }
 function studentOverviewAlert(ch){if(!isBattleMaster(ch))return '';const {tool,skill}=studentSelection(ch);if(tool&&skill)return '';return `<div class="atlas-mastery-alert" role="status"><div><strong>Student of War · ${tr('Εκκρεμεί επιλογή','Choice pending')}</strong><p>${tr('Επίλεξε Artisan’s Tools και επιπλέον Fighter skill από τον Εξοπλισμό.','Choose Artisan’s Tools and an additional Fighter skill in Inventory.')}</p></div><button type="button" class="btn sm" data-tab="inventory">${tr('Μετάβαση στον Εξοπλισμό','Go to Inventory')} →</button></div>`;}
 function atlasStory(ch){const story=String(ch.backgroundStory||'').trim();const text=story||tr('Δεν έχει καταχωριστεί ιστορία χαρακτήρα. Μπορείς να την προσθέσεις από την επεξεργασία ιστορίας.','No background story has been added. Use Edit Story to write your character history.');return `<section class="panel atlas-story"><div class="panel-title"><h3>BACKGROUND STORY</h3><div class="actions-inline"><button class="btn sm" data-action="atlas-edit-story">${svg('edit')} ${tr('Επεξεργασία','Edit story')}</button><button class="btn sm" data-action="atlas-toggle-story" id="atlas-story-toggle">Expand ↓</button></div></div><div class="panel-content"><div id="atlas-story-text" class="atlas-story-text">${esc(text)}</div></div></section>`;}
 function atlasOverviewHeader(ch){const f=ch.classes||[];return `<section class="atlas-profile panel"><div class="atlas-profile-top"><button class="atlas-portrait portrait-trigger" type="button" data-action="portrait" aria-label="Change character image">${mediaSrc(ch.portrait)?`<img src="${attr(mediaSrc(ch.portrait))}" alt="Portrait of ${attr(ch.name)}">`:`<div class="atlas-portrait-fallback">${esc(ch.name.trim().split(/\s+/).map(x=>x[0]||'').slice(0,2).join('').toUpperCase())}</div>`}<span class="atlas-portrait-edit">✎ Change portrait</span></button><div class="atlas-profile-details"><div class="atlas-profile-name-row"><div><div class="atlas-eyebrow">CHARACTER PROFILE</div><h1>${esc(ch.name)}</h1></div><span class="atlas-level-pill">LEVEL ${totalLevel(ch)}</span></div><div class="atlas-profile-facts"><div><small>SPECIES</small><strong>${esc(ch.species||'—')}</strong></div><div><small>CLASS</small><strong>${esc(f.map(x=>x.name+' '+x.level).join(' / ')||'—')}</strong></div>${f.some(x=>Number(x.level)>=3&&x.subclass)?`<div><small>SUBCLASS</small><strong>${esc(f.filter(x=>Number(x.level)>=3&&x.subclass).map(x=>x.subclass).join(' / '))}</strong></div>`:''}<div><small>ALIGNMENT</small><strong>${esc(ch.alignment||'—')}</strong></div><div><small>BACKGROUND</small><strong>${esc(ch.background||'—')}</strong></div><div><small title="${attr(tr('Μπόνους επάρκειας: εξαρτάται από το επίπεδο και προστίθεται μόνο στις κατάλληλες ικανότητες/επιθέσεις. Η Πρωτοβουλία βασίζεται συνήθως στην Επιδεξιότητα.','Proficiency Bonus scales with level and applies only to proficient checks/attacks. Initiative is usually based on Dexterity.'))}">PROFICIENCY BONUS ⓘ</small><strong>${signed(prof(ch))}</strong></div></div><div class="atlas-profile-actions"><button class="btn sm" data-action="edit-character">${svg('edit')} Edit character</button><button class="btn sm" data-action="level-up">Level Up</button></div></div></div></section>`;}
 function atlasCoreStats(ch){const hp=ch.hp||{current:0,max:1,temp:0};const pp=ch.passivePerceptionOverride!==''&&ch.passivePerceptionOverride!=null?Number(ch.passivePerceptionOverride):10+skillMod(ch,'Perception');return `<section class="atlas-core-stats">
  <div class="atlas-core-card atlas-core-hp"><small>HIT POINTS</small><strong>${hp.current}<i> / ${hp.max}</i></strong><div class="hp-rail"><div style="width:${clamp(hp.current/Math.max(1,hp.max)*100,0,100)}%"></div></div><div class="atlas-mini-actions"><button data-action="hp-damage">− Damage</button><button data-action="hp-heal">+ Heal</button></div></div>
  <div class="atlas-core-card"><small>ARMOR CLASS</small><strong>${AC(ch)}</strong><span>${esc(activeLoadout(ch).name)}</span></div>
  <div class="atlas-core-card"><small>INITIATIVE</small><strong>${signed(initMod(ch))}</strong><span>Modifier</span></div>
  <button class="atlas-core-card atlas-inspiration ${ch.inspiration?'is-on':'is-off'}" data-action="inspiration" aria-pressed="${!!ch.inspiration}" title="Toggle Heroic Inspiration"><small>HEROIC INSPIRATION</small><span class="atlas-star" aria-hidden="true">${ch.inspiration?'★':'☆'}</span><span>${ch.inspiration?'Inspired · Tap to clear':'Empty · Tap to activate'}</span></button>
  <div class="atlas-core-card"><small>PASSIVE PERCEPTION</small><strong>${pp}</strong><span>${ch.passivePerceptionOverride!==''&&ch.passivePerceptionOverride!=null?'Campaign override':'Calculated'}</span></div>
  <div class="atlas-core-card"><small>SPEED</small><strong>${ch.speed}<i> ft</i></strong><span>Walking speed</span></div>
 </section>`;}
 function atlasOverviewAbilities(ch){return `<div class="atlas-scores">${Object.keys(D.abilities).map(k=>`<div class="atlas-score"><small>${k}</small><strong>${signed(ability(ch,k))}</strong><span>${Number(ch.abilities?.[k]??10)}</span></div>`).join('')}</div>`;}
 function atlasOverviewSkills(ch){return `<div class="atlas-skill-grid">${D.skills.map(([name,k])=>{const rank=ch.skills?.[name]||0;return `<div class="atlas-skill" title="${attr(name)} · ${rank===2?'Expertise':rank===1?'Proficient':'Not proficient'}"><span class="atlas-prof-dot ${rank===1?'proficient':rank===2?'expert':''}">${rank===2?'✦':rank===1?'●':'○'}</span><span class="atlas-skill-name">${esc(name)} <small>${k}</small></span><strong>${signed(skillMod(ch,name))}</strong></div>`}).join('')}</div><div class="atlas-footnote">● Proficiency &nbsp; ✦ Expertise &nbsp; ○ No proficiency &nbsp; · Bonuses are calculated automatically</div>`;}
 function atlasOverviewOwned(ch,type){
  if(type==='feat'){
   const arr=(ch.feats||[]).map(findReference).filter(Boolean).map(z=>({name:z.name,id:z.id,kind:'ref',source:z.tier||'Feat'}));
   for(const f of ch.customFeats||[])arr.push({name:f.name,id:f.id,kind:'custom',source:'Custom'});
   return arr.length?arr.map(f=>`<button class="atlas-reference-row" ${f.kind==='ref'?`data-detail="${attr(f.id)}"`:`data-custom-feat-detail="${attr(f.id)}"`}><span><b>${esc(pairedTerm(f.name))}</b><small>${esc(f.source)}</small></span><span class="atlas-chevron">›</span></button>`).join(''):`<p class="muted">${tr('Δεν υπάρχουν επιλεγμένα προνόμια.','No feats selected.')}</p>`;
  }
  const items=atlasAllFeatures(ch);
  return items.length?items.map(f=>`<button class="atlas-reference-row" data-feature-detail="${attr(f.id)}"><span><b>${esc(pairedTerm(f.name))}</b><small class="${f.selectedValue?'atlas-feature-selected':''}">${esc(f.selectedValue||f.subline||f.source||'')}${f.level?' · '+tr('Επίπεδο','Level')+' '+f.level:''}</small></span><span class="atlas-chevron">›</span></button>`).join(''):`<p class="muted">${tr('Δεν υπάρχουν καταχωρισμένες ικανότητες.','No features recorded.')}</p>`;
 }

 function pendingChoiceAlert(ch){
  const choices=(ch.pendingChoices2024||[]).filter(x=>x.status!=='resolved');
  if(!choices.length)return '';
  const can= !cloud.enabled||canEditCharacter(ch);
  return '<section class="atlas-mastery-alert" role="status"><div><strong>'+esc(tr('Εκκρεμείς επιλογές χαρακτήρα','Pending character choices'))+' ('+choices.length+')</strong><p>'+esc(tr('Ο χαρακτήρας χρειάζεται επιβεβαίωση πριν θεωρηθεί ολοκληρωμένος.','This character needs choices confirmed before it is complete.'))+'</p></div>'+(can?'<button class="btn primary" data-action="pending-choices">'+esc(tr('Διαχείριση επιλογών','Review choices'))+'</button>':'')+'</section>';
 }
 function showPendingChoices(){
  const ch=c(),choices=ch.pendingChoices2024||[];
  if(cloud.enabled&&!canEditCharacter(ch))return toast(tr('Δεν έχεις δικαίωμα επεξεργασίας.','You cannot edit this character.'));
  const list=choices.map((p,i)=>'<div class="tile"><div><strong>'+esc(p.label||p.key)+'</strong><p class="muted small">'+esc(p.notes||'')+'</p><p class="small">'+esc(p.status==='resolved'?tr('Επιβεβαιωμένο','Confirmed'):tr('Εκκρεμεί','Pending'))+(p.value?' · '+esc(p.value):'')+'</p></div><button class="btn sm" data-action="pending-edit:'+i+'">'+esc(tr('Επιλογή','Choose'))+'</button></div>').join('');
  openModal(tr('Εκκρεμείς επιλογές','Pending choices'),'<p class="muted">'+esc(tr('Οι επιλογές αποθηκεύονται στον χαρακτήρα. Για skills, feats και spells έλεγξε επίσης τις αντίστοιχες καρτέλες.','Choices are saved to this character. For skills, feats and spells, also verify the appropriate tabs.'))+'</p><div class="tile-list">'+list+'</div>',btn(tr('Κλείσιμο','Close'),'close-modal'),true);
 }
 function editPendingChoice(index){
  const ch=c(),p=(ch.pendingChoices2024||[])[index];if(!p)return;
  const options=Array.isArray(p.options)?p.options:[];
  const control=options.length?'<select name="pendingValue" required><option value="">—</option>'+options.map(v=>'<option value="'+attr(v)+'" '+(p.value===v?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select>':'<textarea name="pendingValue" required maxlength="1000" rows="3" placeholder="'+attr(tr('Η επιλογή που επιβεβαιώνει ο παίκτης','Player-confirmed choice'))+'">'+esc(p.value||'')+'</textarea>';
  openModal(p.label||p.key,'<form id="atlas-pending-choice-form" data-choice-index="'+index+'"><p class="muted">'+esc(p.notes||'')+'</p><label>'+esc(tr('Επιλογή / επιβεβαίωση','Choice / confirmation'))+control+'</label><div class="actions-inline"><button class="btn primary" type="submit">'+esc(tr('Αποθήκευση επιλογής','Save choice'))+'</button><button class="btn" type="button" data-action="pending-choices">'+esc(tr('Πίσω','Back'))+'</button></div></form>','',true);
 }

 function renderOverview(ch){return `<div class="atlas-overview">${atlasOverviewHeader(ch)}<div class="atlas-rest-row"><button class="btn primary" data-action="short-rest">🪑 ${tr('Σύντομη ανάπαυση','Short Rest')}</button><button class="btn primary" data-action="long-rest">🛏️ ${tr('Παρατεταμένη ανάπαυση','Long Rest')}</button></div>${masteryAlert(ch)}${studentOverviewAlert(ch)}${pendingChoiceAlert(ch)}${atlasStory(ch)}${atlasCoreStats(ch)}${panel('ABILITY SCORES',atlasOverviewAbilities(ch),'<button class="btn sm" data-action="edit-abilities">Edit</button>')}${panel('SKILLS',atlasOverviewSkills(ch),'','All 18 skills')}<div class="atlas-overview-bottom">${panel('FEATS',atlasOverviewOwned(ch,'feat'))}${panel('FEATURES',atlasOverviewOwned(ch,'feature'))}</div><div class="atlas-overview-bottom-note">${tr('Κανόνες: D&D 2024. Τα εισαγόμενα φύλλα ίσως χρειάζονται έλεγχο εκκρεμών επιλογών.','Ruleset: D&D 2024 only. Existing/imported sheets may need review for unresolved character choices.')}</div></div>`;}

 function quickDice(ch){return `<div class="actions-inline">${[4,6,8,10,12,20,100].map(n=>`<button class="btn sm" data-roll="1d${n}" data-roll-label="d${n}">d${n}</button>`).join('')}</div><div class="section-caption">RECENT ROLLS</div><div class="tile-list">${(ch.rolls||[]).slice(0,3).map(r=>`<div class="rowline"><div><span class="name">${esc(r.label)}</span><small>${esc(r.formula)} · [${esc(r.parts)}]</small></div><strong class="value">${r.total}</strong></div>`).join('')||'<span class="muted tiny">Roll a die to begin.</span>'}</div>`;}
 function featuredItems(ch){let items=[];for(const id of ch.feats||[]){let x=findReference(id);if(x)items.push({n:x.name,ref:id,k:'Feat'});}for(const id of ch.maneuvers||[]){let x=findReference(id);if(x)items.push({n:x.name,ref:id,k:'Maneuver'});}for(const f of ch.features||[])items.push({n:f.name,ref:f.id,k:'Feature'});return `<div class="tile-list">${items.slice(0,7).map(x=>`<button class="tile" ${x.k==='Feature'?`data-feature-detail="${attr(x.ref)}"`:`data-detail="${attr(x.ref)}"`}><span class="name">${esc(x.n)}</span><span class="right">${x.k} →</span></button>`).join('')||'<div class="empty">Πρόσθεσε features και feats.</div>'}</div>`;}
 function renderCombat(ch){return `${statCards(ch)}<div class="grid asym"><div class="grid">${panel('WEAPONS & ATTACKS',attackList(ch,true),`<button class="btn sm" data-action="add-attack">+ Weapon</button>`,`${ch.attacks?.length||0} attacks`)}${panel('MANEUVERS / COMBAT TECHNIQUES',renderOwnedManeuvers(ch),`<button class="btn sm" data-action="pick-maneuvers">+ Choose</button>`)}${panel('CONDITIONS',conditionPills(ch),`<button class="btn sm" data-action="conditions">Update</button>`)}${panel('COMPANIONS & SUMMONS',renderCompanions(ch),`<button class="btn sm" data-action="add-companion">+ Add</button>`)}</div><div class="grid">${panel('CLASS RESOURCES',resources(ch),`<button class="btn sm" data-action="add-resource">+ Add</button>`)}${panel('SPELL SLOTS',renderSlots(ch),`<button class="btn sm" data-action="edit-spell-setup">Configure</button>`)}${panel('DEATH SAVES & HIT DICE',renderSurvival(ch))}${panel('ACTIONS REFERENCE',`<div class="pills">${D.actions.map(x=>`<button class="pill" data-detail="${x.id}">${esc(x.name)}</button>`).join('')}</div>`)}</div></div>`;}
 function renderOwnedManeuvers(ch){const x=(ch.maneuvers||[]).map(findReference).filter(Boolean);if(!x.length)return `<div class="empty">Δεν έχεις επιλέξει maneuvers. Η βιβλιοθήκη μπορεί να χρησιμοποιηθεί και από custom/homebrew classes.</div>`;return `<div class="tile-list">${x.map(m=>`<div class="tile"><button style="flex:1;min-width:0;text-align:left" class="linklike" data-detail="${attr(m.id)}"><span class="name">${esc(m.name)}</span><span class="desc">${esc(m.action)} · ${esc(m.cost)}</span></button><button class="btn sm" data-action="spend-superiority">Use d8</button></div>`).join('')}</div><div class="notice" style="margin-top:9px">Save DC (STR/DEX): <b>${8+prof(ch)+Math.max(ability(ch,'STR'),ability(ch,'DEX'))}</b> · Υπολογίζεται με STR ή DEX της επιλογής σου. Επιβεβαίωσε με τον DM.</div>`;}
 function renderSlots(ch){let any=false,rows='';for(let i=1;i<=9;i++){const s=ch.slots?.[i];if(!s||!s.max)continue;any=true;rows+=slotCell(ch,'slot',i,s.max,s.used||0);}let p=ch.pact||{max:0,used:0,level:1};if(p.max){any=true;rows+=slotCell(ch,'pact',p.level,p.max,p.used);}
 return any?`<div class="slots">${rows}</div><div class="tiny muted" style="margin-top:9px">Πατάς κύκλο όταν ξοδεύεις/ανακτάς slot. Long Rest επαναφέρει τα συνήθη slots· Pact Magic και σε Short Rest.</div>`:`<div class="empty"><strong>No spell slots</strong>Κανονικό για αρκετές martial classes. ${btn('Configure','edit-spell-setup','sm')}</div>`;}
 function slotCell(ch,type,lvl,max,used){return `<div class="slot"><div class="slot-head"><strong>${type==='pact'?'PACT · ':''}L${lvl}</strong><span>${Math.max(0,max-used)}/${max}</span></div><div class="dots">${Array.from({length:max},(_,i)=>`<button class="dot ${i<max-used?'filled':''}" title="${i<max-used?'Spend':'Restore'} slot" data-slot="${type}:${lvl}:${i<max-used?'spend':'restore'}">${i<max-used?'✓':'·'}</button>`).join('')}</div></div>`;}
 function renderCompanions(ch){const list=ch.companions||[];return list.length?`<div class="tile-list">${list.map(p=>`<div class="tile"><button class="linklike" style="text-align:left;min-width:0;flex:1" data-companion-detail="${attr(p.id)}"><span class="name">${esc(p.name)} · HP ${p.hp}/${p.maxHp}</span><span class="desc">${esc(p.type||'Companion')} · AC ${p.ac} · Speed ${p.speed} ft</span></button><button class="btn sm" data-edit-companion="${attr(p.id)}">Edit</button></div>`).join('')}</div>`:'<div class="empty">Familiars, wild shapes, mounts και companions μπορούν να προστεθούν εδώ.</div>';}
 function renderSurvival(ch){const d=ch.death||{success:0,fail:0};const h=ch.hitDice||{max:totalLevel(ch),used:0};return `<div class="rowline"><span class="name">Death saves · Success</span><div class="dots">${[0,1,2].map(i=>`<button class="dot ${i<d.success?'filled':''}" data-death="success:${i}">${i<d.success?'✓':'·'}</button>`).join('')}</div></div><div class="rowline"><span class="name">Death saves · Failure</span><div class="dots">${[0,1,2].map(i=>`<button class="dot ${i<d.fail?'filled':''}" style="${i<d.fail?'background:#a85d61':''}" data-death="fail:${i}">${i<d.fail?'✕':'·'}</button>`).join('')}</div></div><div class="rowline"><div><span class="name">Hit Dice</span><small>${h.max-h.used} / ${h.max} remaining</small></div><div class="actions-inline"><button class="btn sm" data-action="spend-hitdie">Mark used</button><button class="btn sm" data-action="edit-hitdice">Edit</button></div></div><div class="rowline"><span class="name">Exhaustion</span><div class="counter"><button class="btn sm" data-action="exhaust-down">−</button><span class="counter-val">${ch.exhaustion||0} / 6</span><button class="btn sm" data-action="exhaust-up">+</button></div></div>`;}
const ATLAS_SKILL_RULES_2024={classes:{"Barbarian":[2,"Animal Handling,Athletics,Intimidation,Nature,Perception,Survival"],"Bard":[3,"*"],"Cleric":[2,"History,Insight,Medicine,Persuasion,Religion"],"Druid":[2,"Arcana,Animal Handling,Insight,Medicine,Nature,Perception,Religion,Survival"],"Fighter":[2,"Acrobatics,Animal Handling,Athletics,History,Insight,Intimidation,Perception,Persuasion,Survival"],"Monk":[2,"Acrobatics,Athletics,History,Insight,Religion,Stealth"],"Paladin":[2,"Athletics,Insight,Intimidation,Medicine,Persuasion,Religion"],"Ranger":[3,"Animal Handling,Athletics,Insight,Investigation,Nature,Perception,Stealth,Survival"],"Rogue":[4,"Acrobatics,Athletics,Deception,Insight,Intimidation,Investigation,Perception,Performance,Persuasion,Sleight of Hand,Stealth"],"Sorcerer":[2,"Arcana,Deception,Insight,Intimidation,Persuasion,Religion"],"Warlock":[2,"Arcana,Deception,History,Intimidation,Investigation,Nature,Religion"],"Wizard":[2,"Arcana,History,Insight,Investigation,Medicine,Religion"]},backgrounds:{"Acolyte":"Insight,Religion","Artisan":"Investigation,Persuasion","Charlatan":"Deception,Sleight of Hand","Criminal":"Sleight of Hand,Stealth","Entertainer":"Acrobatics,Performance","Farmer":"Animal Handling,Nature","Guard":"Athletics,Perception","Guide":"Stealth,Survival","Hermit":"Medicine,Religion","Merchant":"Animal Handling,Persuasion","Noble":"History,Persuasion","Sage":"Arcana,History","Sailor":"Acrobatics,Perception","Scribe":"Investigation,Perception","Soldier":"Athletics,Intimidation","Wayfarer":"Insight,Stealth"}};
function atlasSkillPlan(ch){
 const all=D.skills.map(x=>x[0]);const background=String(ch.background||'').trim();
 const fixed=String(ATLAS_SKILL_RULES_2024.backgrounds[background]||'').split(',').filter(Boolean);
 const sources=[];const primary=(ch.classes||[])[0];const r=primary&&ATLAS_SKILL_RULES_2024.classes[primary.name];
 if(r){sources.push({key:'class',title:primary.name,count:r[0],options:r[1]==='*'?all:r[1].split(',')});}
 if(ch.species==='Human')sources.push({key:'species',title:'Human — Skillful',count:1,options:all});
 if(ch.species==='Elf')sources.push({key:'species',title:'Elf — Keen Senses',count:1,options:['Insight','Perception','Survival']});
 // Student of War is managed independently; preserve the feature's skill choice.
 const featNames=(ch.feats||[]).map(x=>typeof x==='string'?x:(x?.name||''));
 if(['Charlatan','Noble','Scribe'].includes(ch.background)||featNames.some(x=>/\bSkilled\b/i.test(x)))sources.push({key:'feat',title:'Skilled (Origin Feat)',count:3,options:all});
 return {all,background,fixed,sources};
}
function atlasEditSkills(){
 if(cloud.enabled&&!canEditCharacter(c()))return toast(tr('Δεν έχεις δικαίωμα επεξεργασίας αυτού του χαρακτήρα.','You cannot edit this character.'));
 const ch=c(),plan=atlasSkillPlan(ch),stored=ch.skillChoiceSources2024||{};
 const oldRank=ch.skills||{},reserved=new Set(plan.fixed);
 const picks={};
 // On the first edit, infer choices only when currently proficient; do not invent new proficiencies.
 for(const source of plan.sources){
  const previous=Array.isArray(stored[source.key])?stored[source.key].filter(x=>source.options.includes(x)):[];
  const matched=previous.length?previous:source.options.filter(x=>Number(oldRank[x])>=1&&!reserved.has(x)).slice(0,source.count);
  picks[source.key]=matched.slice(0,source.count);
  for(const n of picks[source.key])reserved.add(n);
 }
 const legacy=Object.entries(oldRank).filter(([name,rank])=>Number(rank)>=1&&!reserved.has(name)).map(([name])=>name);
 const options=(source,slot)=>['',...source.options].map(v=>`<option value="${attr(v)}" ${picks[source.key][slot]===v?'selected':''}>${esc(v||tr('Επίλεξε skill','Choose skill'))}</option>`).join('');
 const groups=plan.sources.map(source=>`<div class="field"><label><b>${esc(source.title)}</b> — ${tr('επίλεξε','choose')} ${source.count}</label>${Array.from({length:source.count},(_,slot)=>`<select required name="${attr(source.key+':'+slot)}" style="width:100%;margin-top:6px">${options(source,slot)}</select>`).join('')}</div>`).join('');
 const header=`<p class="muted small">${tr('Οι επιλογές προέρχονται από τις επίσημες λίστες 2024. Τα skills του Background είναι υποχρεωτικά, όχι ελεύθερες επιλογές.','Selections follow 2024 class lists. Background skills are fixed, not freely selected.')}</p><div class="detail-note"><b>${tr('Background','Background')}: ${esc(plan.background)}</b><div>${plan.fixed.map(esc).join(' · ')||tr('Απαιτείται έλεγχος από DM για custom background.','Custom background requires DM review.')}</div></div>`;
 const imported=legacy.length?`<p class="muted small">${tr('Υπάρχοντα skills από εισαγωγή ή άλλες πηγές — δεν τροποποιούνται αυτόματα:','Existing imported or other-source skills — kept unchanged:')} ${legacy.map(esc).join(', ')}. ${tr('Έλεγξε την προέλευσή τους με τον DM πριν αλλάξεις τις επιλογές.','Confirm their sources with the DM before changing selections.')}</p>`:'';
 openModal(tr('Επιλογές Skill Proficiency','Skill Proficiency Choices'),`<form id="atlas-skill-sources-form">${header}${groups||'<p>No editable class skill choices.</p>'}${imported}<div class="modal-footer"><button class="btn primary" type="submit">${tr('Αποθήκευση','Save')}</button></div></form>`,`<button class="btn" data-action="close-modal">${tr('Κλείσιμο','Close')}</button>`,true);
}
document.addEventListener('submit',e=>{
 if(e.target.id!=='atlas-skill-sources-form')return;
 e.preventDefault();e.stopImmediatePropagation();
 const ch=c(),plan=atlasSkillPlan(ch),fd=new FormData(e.target),next={},allTaken=new Set(plan.fixed);
 if(cloud.enabled&&!canEditCharacter(ch))return toast(tr('Δεν έχεις δικαίωμα επεξεργασίας.','You do not have editing permission.'));
 for(const source of plan.sources){
  const selected=Array.from({length:source.count},(_,i)=>String(fd.get(source.key+':'+i)||''));
  if(selected.some(x=>!source.options.includes(x)||!x)||selected.some(x=>allTaken.has(x))||new Set(selected).size!==source.count){toast(tr('Συμπλήρωσε μοναδικές και επιτρεπόμενες επιλογές για κάθε πηγή.','Choose distinct legal skills for every source.'));return;}
  selected.forEach(x=>allTaken.add(x));next[source.key]=selected;
 }
 const old=ch.skillChoiceSources2024||{},before=atlasSkillPlan(ch);
 const oldOwned=new Set(before.fixed);
 for(const s of before.sources){const a=Array.isArray(old[s.key])?old[s.key]:[];a.forEach(x=>oldOwned.add(x));}
 // First save: match previously selected skills against source choices to avoid stacking old+new.
 if(!Object.keys(old).length){
  const claimed=new Set(before.fixed);
  for(const source of before.sources){
   const a=source.options.filter(n=>Number(ch.skills?.[n])>=1&&!claimed.has(n)).slice(0,source.count);
   a.forEach(x=>{claimed.add(x);oldOwned.add(x);});
  }
 }
 const ranks={...(ch.skills||{})};
 for(const n of oldOwned){if(Number(ranks[n])===1)delete ranks[n];}
 for(const n of allTaken)ranks[n]=Math.max(1,Number(ranks[n])||0);
 ch.skills=ranks;
 ch.skillChoiceSources2024=next;
 closeModal();update();toast(tr('Οι νόμιμες επιλογές skills αποθηκεύτηκαν.','Skill choices saved.'));
},true);

 function renderCharacter(ch){return `<div class="page-title"><div><h2>Character & Abilities</h2><p>Κάθε skill, feat και ability ανοίγει περισσότερες πληροφορίες με tap.</p></div>${btn('Edit profile','edit-character','sm')}${btn(tr('Εξέλιξη επιπέδων','Level Progression'),'level-progression','sm')}</div>${panel('ABILITY SCORES',abilityCards(ch),`<button class="btn sm" data-action="edit-abilities">Edit</button>`)}<div class="grid two" style="margin-top:12px"><div class="grid">${panel('SAVING THROWS',Object.entries(D.abilities).map(([k,n])=>`<div class="skill-row"><button class="prof-dot ${(ch.saves||[]).includes(k)?'prof':''}" data-save-toggle="${k}" title="Toggle proficiency">${(ch.saves||[]).includes(k)?'●':'○'}</button><span class="sk-name">${esc(n)}</span><button class="btn sm" data-roll="1d20${signed(saveMod(ch,k))}" data-roll-label="${attr(n)} Save">${signed(saveMod(ch,k))} ${svg('dice')}</button></div>`).join(''),'', 'Tap dot to toggle')}${panel('SKILLS',D.skills.map(([n,k])=>`<div class="skill-row"><button class="prof-dot ${ch.skills?.[n]===2?'expert':ch.skills?.[n]===1?'prof':''}" data-skill-toggle="${attr(n)}" title="${attr(tr('Επεξεργασία Skill Proficiencies βάσει κανόνων 2024','Edit rule-based skill proficiencies'))}">${ch.skills?.[n]===2?'✦':ch.skills?.[n]===1?'●':'○'}</button><span class="sk-name">${esc(n)} <small>${k}</small></span><button class="btn sm" data-roll="1d20${signed(skillMod(ch,n))}" data-roll-label="${attr(n)} Check">${signed(skillMod(ch,n))} ${svg('dice')}</button></div>`).join(''),`<button class="btn sm" data-action="manage-skills">${tr('Επιλογές','Choose skills')}</button>`, '○ Untrained · ● Prof · ✦ Expert')}</div><div class="grid">${panel('CLASS & SUBCLASS',`<div class="tile-list">${ch.classes.map((x,i)=>`<button class="tile" data-action="edit-classes"><span class="name">${esc(x.name)} ${x.level}<span class="desc">${esc(x.subclass||'No subclass selected')}</span></span><span class="right">Edit →</span></button>`).join('')}</div><div class="rowline"><span>Passive Perception</span><strong class="value">${ch.passivePerceptionOverride!==''&&ch.passivePerceptionOverride!=null?Number(ch.passivePerceptionOverride):10+skillMod(ch,'Perception')}</strong></div><div class="rowline"><span>Speed</span><strong>${ch.speed} ft</strong></div>`,`<button class="btn sm" data-action="edit-classes">Multiclass +</button>`)}${panel('FEATS',ownedReferences(ch,'feats'),`<button class="btn sm" data-action="pick-feats">+ Feat</button>`)}${panel('CLASS / SPECIES FEATURES',renderOwnedFeatures(ch),`<button class="btn sm" data-action="add-feature">+ Ability</button>`)}${panel('MANEUVERS',renderOwnedManeuvers(ch),`<button class="btn sm" data-action="pick-maneuvers">+ Maneuver</button>`)}${panel('COMPANIONS / FAMILIARS',renderCompanions(ch),`<button class="btn sm" data-action="add-companion">+ Add</button>`)}${panel('PROFICIENCIES, LANGUAGES & MORE',`<div class="rowline"><div><span class="name">Languages</span><small>${esc(ch.languages||'Not set')}</small></div></div><div class="rowline"><div><span class="name">Other proficiencies</span><small style="white-space:normal">${esc(ch.proficiencies||'Not set')}</small></div></div>`,`<button class="btn sm" data-action="edit-character">Edit</button>`)}</div></div>`;}
 function ownedReferences(ch,field){const ls=(ch[field]||[]).map(findReference).filter(Boolean);const extra=field==='feats'?(ch.customFeats||[]):[];return ls.length||extra.length?`<div class="tile-list">${ls.map(x=>`<button class="tile" data-detail="${attr(x.id)}"><span class="name">${esc(x.name)}</span><span class="right">Details →</span></button>`).join('')}${extra.map(x=>`<button class="tile" data-custom-feat-detail="${attr(x.id)}"><span class="name">${esc(x.name)}</span><span class="right">Custom →</span></button>`).join('')}</div>`:'<div class="empty">Καμία καταχώριση.</div>';}
 function renderOwnedFeatures(ch){return ch.features?.length?`<div class="tile-list">${ch.features.map(f=>`<div class="tile"><button class="linklike" style="flex:1;text-align:left" data-feature-detail="${attr(f.id)}"><span class="name">${esc(f.name)}</span><span class="desc">${esc(f.source||'Custom')} · ${esc(f.action||'Passive')}</span></button><button class="btn sm" data-edit-feature="${attr(f.id)}">Edit</button></div>`).join('')}</div>`:'<div class="empty">Μπορείς να προσθέσεις subclass, racial ή homebrew abilities.</div>';}
 function renderSpells(ch){const book=(ch.spellbook||[]).filter(s=>{let d=s.ref?findReference(s.ref):null;let lvl=d?.level??s.level??0;return (spellLevel==='all'||String(lvl)===spellLevel)&&`${s.name} ${d?.school||s.school||''}`.toLowerCase().includes(spellQuery.toLowerCase());}).sort((a,b)=>(findReference(a.ref)?.level??a.level??0)-(findReference(b.ref)?.level??b.level??0)||a.name.localeCompare(b.name));return `<div class="page-title"><div><h2>Spellbook</h2><p>Cantrips, prepared spells, Concentration, Slots, Pact Magic — για οποιαδήποτε class.</p></div>${btn('+ Add Spell','add-spell','primary sm')}</div><div class="grid two">${panel('SPELLCASTING',`<div class="statgrid"><div class="meta-box"><small>Ability</small><strong>${esc(ch.spellAbility||'INT')}</strong></div><div class="meta-box"><small>Spell DC</small><strong>${spellDC(ch)}</strong></div><div class="meta-box"><small>Spell Attack</small><strong>${signed(spellAttack(ch))}</strong></div></div><div class="rowline"><div><span class="name">Concentration</span><small>${esc(ch.concentrating||'None')}</small></div>${ch.concentrating?`<button class="btn sm warn" data-action="end-concentration">End</button>`:''}</div>`,`<button class="btn sm" data-action="edit-spell-setup">Configure</button>`)}${panel('SPELL SLOTS',renderSlots(ch),`<button class="btn sm" data-action="edit-spell-setup">Edit</button>`)}</div><div class="page-title"><div><h2>Known / Prepared Spells <span class="muted small">(${book.length})</span></h2></div></div><div class="toolbar"><label class="search"><input data-spell-search placeholder="Search your spells…" value="${attr(spellQuery)}" /></label><select class="filter" data-spell-level><option value="all">All levels</option>${Array.from({length:10},(_,i)=>`<option value="${i}" ${String(i)===spellLevel?'selected':''}>${formatLevel(i)}</option>`).join('')}</select>${btn('Browse Spell Library','browse-spells','sm')}</div><div class="grid two">${book.length?book.map(s=>{let d=findReference(s.ref);return `<div class="tile"><button style="flex:1;min-width:0;text-align:left" class="linklike" data-owned-spell="${attr(s.id)}"><span class="name">${esc(s.name)} ${s.prepared===false?'<span class="chip">Not prepared</span>':''}</span><span class="desc">${formatLevel(d?.level??s.level??0)} · ${esc(d?.cast||s.cast||'Action')} ${d?.concentration?'· Concentration':''}</span>${spellTag(s.damage?{...s,level:d?.level??s.level}:d||s,ch,true)}</button><div class="actions-inline"><button class="btn sm" data-toggle-prepared="${attr(s.id)}" title="Toggle prepared">${s.prepared===false?'◇':'◆'}</button><button class="btn sm" data-edit-owned-spell="${attr(s.id)}" title="Edit spell">Edit</button></div></div>`;}).join(''):`<div class="panel pad"><div class="empty"><strong>Άδειο spellbook</strong>Αυτό είναι φυσιολογικό για non-caster classes. Πάτα Add Spell για class spells, racial magic, scrolls ή custom spells.</div></div>`}</div>`;}
 function renderInventory(ch){
  const money=ch.currency||{},fighter=Number((ch.classes||[]).find(q=>q.name==='Fighter')?.level||0),limit=fighterMasteryLimit(fighter),chosen=selectedMasteries(ch);
  const visibleItems=(ch.inventory||[]).filter(i=>!atlasWeaponKind(i)&&!isConsumable(i)).map(i=>{
    const kind=atlasWeaponKind(i),state=kind?weaponStateTag(i):'',star=kind?masteryStar(ch,kind):'';
    return `<div class="inv-item"><div class="overflow-hidden"><button class="linklike" data-item-detail="${attr(i.id)}" style="font-size:12px;text-align:left">${esc(i.name)}</button><div class="tiny muted">${esc(i.description||tr('Χωρίς περιγραφή','No description'))}${i.equipped?' · '+tr('Εξοπλισμένο','Equipped'):''}</div><div class="atlas-inventory-meta">${state}${kind?`<button type="button" class="btn sm" data-edit-item="${attr(i.id)}">${tr('Κατάσταση όπλου','Weapon condition')}</button>`:''}</div></div><div class="atlas-item-weapon-tools">${star}<span class="qty">×${i.qty}</span><button class="btn sm" data-edit-item="${attr(i.id)}">${tr('Επεξεργασία','Edit')}</button></div></div>`;
  }).join('')||`<div class="empty">${tr('Δεν έχουν προστεθεί αντικείμενα.','No items have been added.')}</div>`;
  const masteryInfo=masteryCapacity(ch)&&chosen.length<masteryCapacity(ch)?`<div class="atlas-inventory-mastery"><div class="atlas-mastery-alert"><div><strong>${tr('Weapon Mastery (Εξειδίκευση όπλων)','Weapon Mastery')} · ${chosen.length}/${masteryCapacity(ch)}</strong><p>${tr('Πάτησε ☆ δίπλα στον τύπο όπλου. Το ★ σημαίνει επιλεγμένη εξειδίκευση. Μπορείς να αλλάξεις μία επιλογή μετά από Παρατεταμένη ανάπαυση· για διορθώσεις ισχύει η απόφαση του DM.','Tap ☆ next to a weapon kind; ★ means selected. You can exchange one choice after a Long Rest; corrections require DM approval.')}</p></div><button class="btn sm" data-action="choose-masteries">${tr('Άλλοι τύποι όπλων','Other weapon kinds')}</button></div></div>`:'';
  return `<div class="page-title"><div><h2>${tr('Εξοπλισμός','Inventory & Equipment')}</h2><p>${tr('Όπλα, πανοπλίες, χρήματα και κατάσταση κάθε όπλου.','Weapons, armor, currency, and individual weapon conditions.')}</p></div>${btn(tr('+ Προσθήκη αντικειμένου','+ Add Item'),'add-item','primary sm')}</div>
  <div class="grid three">${panel(tr('ΧΡΗΜΑΤΑ','CURRENCY'),`<div class="grid" style="grid-template-columns:repeat(5,minmax(0,1fr));gap:4px">${['cp','sp','ep','gp','pp'].map(k=>`<div class="meta-box" style="text-align:center;padding:7px 2px"><small>${k.toUpperCase()}</small><strong>${money[k]||0}</strong></div>`).join('')}</div>`,`<button class="btn sm" data-action="edit-currency">${tr('Αλλαγή','Edit')}</button>`)}${panel(tr('ΣΥΝΔΥΑΣΜΟΙ ΕΞΟΠΛΙΣΜΟΥ','LOADOUTS'),`<div class="tile-list">${(ch.loadouts||[]).map((l,i)=>`<button class="tile" data-set-loadout="${i}"><span class="name">${i===ch.activeLoadout?'◉':'○'} ${esc(l.name)}</span><span class="right"><strong>AC ${l.ac}</strong></span></button>`).join('')}</div>`,`<button class="btn sm" data-action="edit-loadouts">${tr('Αλλαγή','Edit')}</button>`)}${panel(tr('ΒΑΡΟΣ','CARRYING'),`<div class="meta-box"><small>${tr('Συνολικό καταχωρισμένο βάρος (λίβρες)','Total listed weight (lb)')}</small><strong>${(ch.inventory||[]).reduce((sum,i)=>sum+(Number(i.weight)||0)*(Number(i.qty)||1),0).toFixed(1)}</strong></div>`)}</div>
  ${masteryInfo}${studentInventoryPanel(ch)}<div class="page-title"><h2>${tr('Αναλώσιμα','Consumables')}</h2><button class="btn sm" data-atlas-add-consumable>${tr('+ Αναλώσιμο','+ Consumable')}</button></div>${panel(tr('ΑΝΑΛΩΣΙΜΑ','CONSUMABLES'),consumableRows(ch))}<div class="page-title"><h2>${tr('Λοιπά αντικείμενα','Other Items')}</h2></div><div class="item-grid">${visibleItems}</div>
  <div class="page-title"><h2>${tr('Όπλα','Weapons')}</h2><div class="actions-inline">${btn(tr('+ Όπλο στο inventory','+ Inventory weapon'),'add-item','sm')}${btn(tr('+ Ρύθμιση επίθεσης','+ Attack formula'),'add-attack','sm')}</div></div>${panel(tr('ΟΠΛΑ ΚΑΙ ΚΑΤΑΣΤΑΣΗ','WEAPONS & CONDITIONS'),weaponInventoryRows(ch))}`;
 }

 function renderJournal(ch){return `<div class="page-title"><div><h2>Journal & Notes</h2><p>Backstory, campaign events, quests, επόμενο level και προσωπικές σημειώσεις.</p></div>${btn('+ Entry','add-journal','primary sm')}</div><div class="grid two"><div class="grid">${panel('CHARACTER NOTES',`<textarea id="notes-editor" rows="13" placeholder="Background, relationships, motivations…">${esc(ch.notes||'')}</textarea><div class="actions-inline" style="margin-top:8px"><button class="btn sm primary" data-action="save-notes">Save notes</button></div>`)}${panel('LEVEL PLAN',`<textarea id="plan-editor" rows="5" placeholder="Level 4 feats, multiclass goals, spells…">${esc(ch.plan||'')}</textarea><div class="actions-inline" style="margin-top:8px"><button class="btn sm" data-action="save-plan">Save plan</button></div>`)}</div><div class="grid">${panel('ADVENTURE LOG',`<div class="tile-list">${(ch.journal||[]).slice().reverse().map(j=>`<button class="tile" data-journal-detail="${attr(j.id)}"><div><span class="name">${esc(j.title)}</span><span class="desc">${esc(j.date||'')} · ${esc(j.text||'').slice(0,100)}</span></div><span class="right">Read →</span></button>`).join('')||'<div class="empty">Δεν υπάρχουν καταχωρίσεις ακόμη.</div>'}</div>`,`<button class="btn sm" data-action="add-journal">+ Add</button>`)}</div></div>`;}
 function renderLibrary(ch){let all=[...D.spells,...D.maneuvers,...D.feats,...D.conditions,...D.actions,...D.masteries];let ls=all.filter(x=>(libraryCategory==='all'||x.kind===libraryCategory)&&(libraryCategory!=='Spell'||libraryLevel==='all'||String(x.level)===libraryLevel)&&`${x.name} ${x.summary||''} ${L.summary(x)||''} ${x.kind} ${L.translate(x.kind)}`.toLowerCase().includes(libraryQuery.toLowerCase()));return `<div class="page-title"><div><h2>Rules & Content Library</h2><p>Πατάς μία καταχώριση για αναλυτικό popup. Το περιεχόμενο είναι συνοπτικό, όχι πλήρες βιβλίο κανόνων.</p></div></div><div class="toolbar"><label class="search"><input data-library-search placeholder="Search feats, spells, conditions…" value="${attr(libraryQuery)}" /></label><select class="filter" data-library-kind><option value="all">All (${all.length})</option>${['Spell','Maneuver','Feat','Condition','Action','Weapon Mastery'].map(k=>`<option value="${k}" ${libraryCategory===k?'selected':''}>${k}</option>`).join('')}</select>${libraryCategory==='Spell'?`<select class="filter" data-library-level><option value="all">All spell levels</option>${Array.from({length:10},(_,i)=>`<option value="${i}" ${libraryLevel==String(i)?'selected':''}>${formatLevel(i)}</option>`).join('')}</select>`:''}</div><div class="section-caption">${ls.length} ENTRIES · TAP FOR DETAIL</div><div class="grid two">${ls.map(x=>`<button class="tile" data-detail="${attr(x.id)}"><span class="overflow-hidden"><span class="name">${esc(x.name)}</span><span class="desc" style="display:block;margin-top:8px">${esc(x.kind)}${x.kind==='Spell'?' · '+formatLevel(x.level)+' · '+x.school:''}${x.kind==='Feat'?' · '+x.tier:''}</span>${x.kind==='Spell'?spellTag(x,ch,true):''}</span><span class="right">Details →</span></button>`).join('')||'<div class="empty">No results found. Try another search.</div>'}</div>`;}
 function toast(message){const root=document.getElementById('toast-root');if(!root)return;root.innerHTML=`<div class="toast-box"><div class="toast">${esc(L.translate(message))}</div></div>`;setTimeout(()=>{root.innerHTML='';},2900);}
 function openModal(title,body,footer='',wide=false){lastFocus=document.activeElement;modalOpen=true;document.getElementById('modal-root').innerHTML=`<div class="modal-back" data-backdrop><section class="modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${attr(title)}"><div class="modal-header"><div><span class="tagkey">CHARACTER ATLAS</span><h2>${esc(title)}</h2></div><button class="btn icon" aria-label="Close popup" data-action="close-modal">${svg('close')}</button></div><div class="modal-body">${body}</div>${footer?`<div class="modal-footer">${footer}</div>`:''}</section></div>`;document.body.style.overflow='hidden';L.translateRoot(document.getElementById('modal-root'));document.querySelector('#modal-root .modal [data-action="close-modal"]')?.focus();}
 function closeModal(){document.getElementById('modal-root').innerHTML='';document.body.style.overflow='';modalOpen=false;lastFocus?.focus?.();}
 function detailRef(id){const r=findReference(id);if(!r){toast('Δεν βρέθηκε reference.');return;}let extra='';let ch=c();let taken=false;
 if(r.kind==='Spell'){extra=`<div class="detail-meta"><span class="chip gold">${formatLevel(r.level)}</span><span class="chip">${esc(r.school)}</span>${r.concentration?'<span class="chip good">Concentration</span>':''}${r.ritual?'<span class="chip">Ritual</span>':''}</div><div class="grid two mini-two"><div class="meta-box"><small>Casting</small><strong>${esc(r.cast)}</strong></div><div class="meta-box"><small>Range</small><strong>${esc(r.range)}</strong></div><div class="meta-box"><small>Duration</small><strong>${esc(r.duration)}</strong></div><div class="meta-box"><small>Components</small><strong>${esc(r.components)}</strong></div></div>${spellEffectPanel(r,ch)}<div class="section-caption">CLASSES</div><div class="pills">${r.classes.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div>`;taken=(ch.spellbook||[]).some(x=>x.ref===id);}
 else if(r.kind==='Maneuver'){extra=`<div class="detail-meta"><span class="chip gold">${esc(r.cost)}</span><span class="chip">${esc(r.action)}</span>${r.save!=='—'?`<span class="chip">${esc(r.save)} Save</span>`:''}</div><div class="notice">Battle Master: έως ένα maneuver ανά επίθεση. Το Save DC βασίζεται στο δικό σου STR ή DEX modifier: <b>${8+prof(ch)+Math.max(ability(ch,'STR'),ability(ch,'DEX'))}</b> (αν επιλέξεις το υψηλότερο από τα δύο).</div>`;taken=ch.maneuvers.includes(id);}
 else if(r.kind==='Feat'){extra=`<div class="detail-meta"><span class="chip gold">${esc(r.tier)} Feat</span><span class="chip">Requirements vary</span></div>`;taken=ch.feats.includes(id);}
 else if(r.kind==='Condition')extra=`<div class="notice">Condition: το βασικό effect περιγράφεται συνοπτικά. Τσέκαρε το βιβλίο/DM για ακριβείς εξαιρέσεις.</div>`;
 openModal(r.name,`${extra}<div class="section-caption">HOW IT WORKS</div><div class="detail-description">${esc(L.summary(r))}</div><div class="detail-note">${esc(r.source||'Rule summary')} · ${view==='library'?tr('Περίληψη. Για το πλήρες επίσημο κείμενο άνοιξε το SRD 5.2.1 στη Βιβλιοθήκη.','Summary. For the complete official text open SRD 5.2.1 in the Library.'):'Quick reference σε δική μας διατύπωση, όχι πλήρης αναπαραγωγή των επίσημων κανόνων.'}</div>`,`${r.kind==='Spell'||r.kind==='Maneuver'||r.kind==='Feat'?`<button class="btn ${taken?'warn':'primary'}" data-toggle-ref="${attr(id)}">${taken?'Remove from character':r.kind==='Spell'?'Add to Spellbook':'Add to character'}</button>`:''}<button class="btn" data-action="close-modal">Close</button>`);
 }
 function featureDetail(id){const f=atlasAllFeatures(c()).find(x=>x.id===id)||(c().features||[]).find(x=>x.id===id);if(!f)return;openModal(pairedTerm(f.name),`<div class="detail-meta"><span class="chip">${esc(f.source||'Character')}</span>${f.level?`<span class="chip">${tr('Επίπεδο','Level')} ${f.level}</span>`:''}</div><div class="detail-description">${esc(f.detail||tr('Δεν υπάρχει ακόμη περιγραφή.','No description recorded.'))}</div>`,(f.masteryPicker?`<button class="btn primary" data-tab="inventory">${tr('Επιλογή στον Εξοπλισμό','Choose in Inventory')}</button>`:'')+(id.startsWith('atlas-')?'':btn(tr('Επεξεργασία','Edit'),'edit-feature:'+id,'sm'))+btn(tr('Κλείσιμο','Close'),'close-modal'));}
 function resourceDetail(id){const r=c().resources.find(x=>x.id===id);if(!r)return;openModal(r.name,`<div class="detail-meta"><span class="chip gold">${r.current} / ${r.max} available</span><span class="chip">Recharge: ${esc(r.recharge)}</span></div><div class="detail-description">${esc(r.detail||'Add a short explanation to your resource.')}</div>`,btn('Spend 1','spend-resource:'+id,'sm')+btn('Edit','edit-resource:'+id,'sm')+btn('Close','close-modal'));}
 function attackDetail(id){const a=c().attacks.find(x=>x.id===id);if(!a)return;const ch=c();let mastery=atlasAttackMastery(ch,a);openModal(a.name,`<div class="detail-meta"><span class="chip gold">Attack ${signed(attackBonus(ch,a))}</span><span class="chip">Damage ${esc(attackDamage(ch,a))} ${esc(a.type||'')}</span><span class="chip">Ability ${esc(a.ability||'STR')}</span></div><div class="section-caption">WEAPON NOTES</div><div class="detail-description">${esc(a.notes||'No additional notes.')}</div>${mastery?`<div class="section-caption">WEAPON MASTERY — ${esc(mastery.name)}</div><div class="detail-description">${esc(mastery.name==='Nick'?tr('Το Nick μεταφέρει την επιπλέον επίθεση Light στην ενέργεια Attack, μία φορά ανά γύρο.','Nick moves the Light extra attack into the Attack action, once per turn.'):mastery.summary)}</div>`:''}`,`<button class="btn sm" data-roll="1d20${signed(attackBonus(ch,a))}" data-roll-label="${attr(a.name)} attack">Roll Attack</button><button class="btn sm" data-roll="${attr(attackDamage(ch,a))}" data-roll-label="${attr(a.name)} damage">Roll Damage</button><button class="btn" data-edit-attack="${attr(id)}">Edit</button>`);}
 function ownedSpell(id){const x=c().spellbook.find(z=>z.id===id);if(!x)return;const r=x.ref?findReference(x.ref):null;const lvl=r?.level??(Number(x.level)||0);const hasSlots=Object.values(c().slots||{}).some(s=>s.max>s.used&&lvl>0)||((c().pact?.max||0)>(c().pact?.used||0)&&c().pact.level>=lvl&&lvl>0);
 const options=lvl===0?'<button class="btn primary" data-cast="'+attr(id)+':cantrip:0">Cast cantrip</button>':`<div class="section-caption">CAST USING A SLOT</div><div class="actions-inline">${Object.entries(c().slots||{}).filter(([k,s])=>Number(k)>=lvl&&s.max>s.used).map(([k])=>`<button class="btn sm primary" data-cast="${attr(id)}:slot:${k}">Level ${k}</button>`).join('')}${(c().pact?.max||0)>(c().pact?.used||0)&&c().pact.level>=lvl?`<button class="btn sm primary" data-cast="${attr(id)}:pact:${c().pact.level}">Pact L${c().pact.level}</button>`:''}${!hasSlots?'<span class="muted tiny">No available compatible slots. Add/edit spell slots in Spellbook.</span>':''}</div>`;
 openModal(x.name,`<div class="detail-meta"><span class="chip gold">${formatLevel(lvl)}</span>${r?`<span class="chip">${esc(r.school)}</span><span class="chip">${esc(r.cast)}</span>`:`<span class="chip">${esc(x.school||'Custom')}</span><span class="chip">${esc(x.cast||'Action')}</span>`}${r?.concentration||x.concentration?'<span class="chip good">Concentration</span>':''}</div><div class="detail-description">${esc(x.summary||(r?L.summary(r):'No description. Add one in Edit.'))}</div>${r?`<div class="detail-meta"><span class="chip">Range ${esc(r.range)}</span><span class="chip">Duration ${esc(r.duration)}</span><span class="chip">${esc(r.components)}</span></div>`:''}${spellEffectPanel(x.damage?{...x,level:r?.level??x.level}:r||x,c())}${options}<div class="detail-note">Cast buttons update the slot counters and Concentration status. The DM resolves targets, saving throws and material components.</div>`,`<button class="btn" data-edit-owned-spell="${attr(id)}">Edit</button><button class="btn" data-action="close-modal">Close</button>`);
 }
 function itemDetail(id){const i=c().inventory.find(x=>x.id===id);if(!i)return;if(isConsumable(i)){atlasConsumablePopup(id);return;}
 const st=atlasWeaponKind(i)&&i.weaponStatus&&i.weaponStatus!=='normal'?`<div class="notice"><b>${tr('Κατάσταση','Condition')}: ${esc(weaponStateLabel(i.weaponStatus))}</b><p>${esc(i.weaponStatusNote||tr('Δεν έχει προστεθεί σημείωση.','No condition details added.'))}</p></div>`:'';
 openModal(i.name,`<div class="detail-meta"><span class="chip">${tr('Ποσότητα','Quantity')} ${i.qty}</span><span class="chip">${i.weight||0} lb</span>${i.equipped?`<span class="chip good">${tr('Εξοπλισμένο','Equipped')}</span>`:''}</div>${st}<div class="detail-description">${esc(i.description||tr('Χωρίς περιγραφή.','No description.'))}</div>`,btn(tr('Επεξεργασία','Edit'),'edit-item:'+id,'sm')+btn(tr('Κλείσιμο','Close'),'close-modal'));} 
 function journalDetail(id){const j=c().journal.find(x=>x.id===id);if(!j)return;openModal(j.title,`<div class="muted small">${esc(j.date||'')}</div><div class="detail-description" style="margin-top:10px">${esc(j.text||'')}</div>`,btn('Edit','edit-journal:'+id,'sm')+btn('Close','close-modal'));}
 function field(name,label,value='',type='text',extra=''){return `<div class="field ${extra==='wide'?'wide':''}"><label for="f-${attr(name)}">${esc(label)}</label>${type==='textarea'?`<textarea name="${attr(name)}" id="f-${attr(name)}">${esc(value)}</textarea>`:`<input type="${attr(type)}" name="${attr(name)}" id="f-${attr(name)}" value="${attr(value)}" ${type==='number'?'step="any"':''}/>`}</div>`;}
 function selectField(name,label,value,options,extra=''){const opts=[...options];if(value!==''&&value!=null&&!opts.some(o=>String(Array.isArray(o)?o[0]:o)===String(value)))opts.unshift([value,value]);return `<div class="field ${extra==='wide'?'wide':''}"><label for="f-${attr(name)}">${esc(label)}</label><select name="${attr(name)}" id="f-${attr(name)}">${opts.map(o=>{let [v,t]=Array.isArray(o)?o:[o,o];return `<option value="${attr(v)}" ${String(v)===String(value)?'selected':''}>${esc(t)}</option>`}).join('')}</select></div>`;}
 function formModal(title,fields,submitAction,extra='',wide=false){const [kind,id]=submitAction.split(':');const names={'save-attack':'attack','save-feature':'feature','save-item':'item','save-resource':'resource','save-owned-spell':'spell','save-journal':'journal','save-companion':'companion'};const remove=id&&names[kind]&&[...(c().attacks||[]),...(c().features||[]),...(c().inventory||[]),...(c().resources||[]),...(c().spellbook||[]),...(c().journal||[]),...(c().companions||[])].some(x=>x.id===id)?`<button class="btn warn" data-delete-object="${names[kind]}:${attr(id)}">Delete</button>`:'';openModal(title,`<form id="atlas-form"><div class="form-grid">${fields}</div>${extra}</form>`,remove+btn('Cancel','close-modal')+`<button class="btn primary" type="submit" form="atlas-form" data-form-action="${attr(submitAction)}">Save changes</button>`,wide);}
 function getForm(){const f=document.getElementById('atlas-form');if(!f)return{};const values=Object.fromEntries(new FormData(f).entries());for(let i=0;i<3;i++){const k='subclass'+i,custom='subclassCustom'+i;if(values[k]==='__custom__')values[k]=(values[custom]||'').trim();delete values[custom];}return values;}
 function chooseReference(kind){let list=kind==='feats'?D.feats:kind==='maneuvers'?D.maneuvers:D.spells;let owned=kind==='feats'?c().feats:kind==='maneuvers'?c().maneuvers:c().spellbook.map(x=>x.ref).filter(Boolean);
 let body=`${referenceSelect(kind,list)}<div class="search"><input data-picker-search placeholder="Search ${esc(kind)}…" data-picker-kind="${attr(kind)}" /></div><div class="section-caption">${list.length} AVAILABLE ENTRIES</div><div class="library-results" id="picker-results">${pickerRows(list,owned,kind)}</div>${kind==='spells'?'<div class="hintnote" style="margin-top:10px">Δεν εμφανίζεται κάθε δημοσιευμένο spell ή homebrew. Μπορείς να προσθέσεις Custom Spell στο Spellbook.</div>':''}`;
 openModal(kind==='feats'?'Choose a Feat':kind==='maneuvers'?'Choose Maneuvers':'Choose Spells',body,btn('Done','close-modal'),true);
 }
 function pickerRows(list,owned,kind){return list.map(x=>`<div class="option-row" data-picker-row="${attr((x.name+' '+(x.summary||'')).toLowerCase())}"><div style="min-width:0;flex:1"><button class="linklike" data-picker-detail="${attr(x.id)}">${esc(x.name)}</button><div class="tiny muted">${esc(x.kind==='Spell'?formatLevel(x.level)+' · '+x.school:x.kind==='Feat'?x.tier:x.trigger)}</div>${x.kind==='Spell'?spellTag(x,c(),true):''}</div><button class="btn sm ${owned.includes(x.id)?'warn':'primary'}" data-picker-toggle="${attr(x.id)}">${owned.includes(x.id)?'Remove':'+ Add'}</button></div>`).join('');}
 function openNewCharacter(){formModal('Create a Character',field('name','Name','New Adventurer')+selectField('class','Main class','Fighter',Object.keys(D.classes)).replace('id="f-class"','id="f-class" data-class-name="0"')+subclassField(0,'Fighter','')+selectField('species','Species','Human',D.species)+selectField('background','Background','Custom',D.background)+field('player','Player (optional)',''), 'create-character',`<p class="hintnote">${uiText('Το subclass μπορεί να αποθηκευτεί ως μελλοντική επιλογή. Τα class features δεν ενεργοποιούνται αυτόματα: επιβεβαίωσε το level με τον DM.','Subclass can be saved as a planned choice. Class features are not granted automatically; confirm the required level with your DM.')}</p>`);}
 function editChar(){const ch=c();formModal('Edit Character Profile',field('name','Character name',ch.name)+field('player','Player',ch.player)+selectField('species','Species',ch.species,[...new Set([...D.species,ch.species])])+selectField('background','Background',ch.background,[...new Set([...D.background,ch.background])])+selectField('alignment','Alignment',ch.alignment,['',...ALIGNMENTS])+field('speed','Speed (ft)',ch.speed,'number')+field('initiativeBonus','Additional Initiative bonus',ch.initiativeBonus,'number')+field('proficiencyOverride','Override Proficiency Bonus (leave empty for auto)',ch.proficiencyOverride,'number')+field('passivePerceptionOverride','Passive Perception override (optional; DM house rule)',ch.passivePerceptionOverride??'','number')+selectField('rulesVersion','Rules version','2024',['2024'])+languagesField(ch.languages)+field('proficiencies','Other proficiencies',ch.proficiencies,'textarea','wide'),'save-profile',`<div class="actions-inline"><button type="button" class="btn" data-action="edit-json">${tr('Αντικατάσταση από JSON','Replace from JSON')}</button><button type="button" class="btn" data-action="download-character-docx">${tr('Εξαγωγή DOCX','Export DOCX')}</button></div>`,true);}
 function editAbilities(){let ch=c();formModal('Ability Scores',Object.keys(D.abilities).map(k=>field(k,`${k} — ${D.abilities[k]}`,ch.abilities[k],'number')).join(''),'save-abilities');}
 function editClasses(){const ch=c();const options=Object.keys(D.classes);let inputs='';for(let i=0;i<3;i++){const x=ch.classes[i]||{name:'',level:0,subclass:''};inputs+=`<div class="form-section">${i===0?'PRIMARY CLASS':`MULTICLASS ${i}`} ${i?'(optional)':''}</div>`+selectField(`class${i}`,'Class',x.name||'',i?['',...options]:options).replace(`id="f-class${i}"`,`id="f-class${i}" data-class-name="${i}"`)+field(`level${i}`,'Class level (0 to remove)',x.level,'number')+subclassField(i,x.name||'Custom',x.subclass);}
 formModal('Classes & Multiclass',inputs,'save-classes',`<div class="hintnote">Σύνολο levels έως 20. Το Proficiency Bonus υπολογίζεται αυτόματα. Τα spell slots, HP, skill proficiencies και class resources παραμένουν πλήρως editable — για σωστούς multiclass κανόνες επιβεβαίωσε με τον DM.</div>`,true);}
 function editLoadouts(){let ch=c();let content='';for(let i=0;i<5;i++){let x=ch.loadouts?.[i]||{};content+=field('name'+i,`Loadout ${i+1}`,x.name||'')+field('ac'+i,`AC ${i+1}`,x.ac||'', 'number');}formModal('Loadouts / Armor Class',content,'save-loadouts',`<div class="hintnote">Το AC αλλάζει με ένα tap. Όπλα δύο χεριών και equipped Shield δεν μπορούν να χρησιμοποιούνται ταυτόχρονα. Ο εξοπλισμός ασπίδας/αφαίρεσή της απαιτεί χρόνο/action σύμφωνα με τους κανόνες.</div>`);}
 function editAttack(id){let ch=c(),a=ch.attacks.find(x=>x.id===id)||{id:uid(),name:'',ability:'STR',damage:'1d8',type:'Slashing',mastery:'',proficient:true,magicBonus:0,damageBonus:0,bonusOverride:'',notes:''};let fields=selectField('weaponTemplate','Start from weapon', '',[['','Custom / keep manual'],...D.weapons.map(w=>[w.name,w.name])])+field('name','Weapon / attack name',a.name)+selectField('ability','Attack ability',a.ability,[...Object.keys(D.abilities),'SPELL'])+field('damage','Weapon damage dice e.g. 2d6',a.damage)+selectField('type','Damage type',a.type,['Slashing','Piercing','Bludgeoning','Fire','Cold','Lightning','Force','Radiant','Necrotic','Poison','Psychic','Thunder','Acid','Other'])+selectField('mastery','Weapon Mastery',a.mastery,['',...D.masteries.map(x=>x.name)])+field('magicBonus','Magic bonus (attack & damage)',a.magicBonus,'number')+field('damageBonus','Extra flat damage',a.damageBonus,'number')+field('bonusOverride','Attack bonus override (blank for automatic)',a.bonusOverride,'number')+selectField('proficiencyMode',tr('Επάρκεια όπλου (2024)','Weapon proficiency (2024)'),a.proficiencyMode||'auto',[['auto',tr('Αυτόματα από την κλάση','Automatic from class')],['yes',tr('Επάρκεια από άλλη ικανότητα / DM','Proficient from feature / DM')],['no',tr('Χωρίς επάρκεια','Not proficient')]])+field('notes','Properties / notes',a.notes,'textarea','wide');formModal(a.name?'Edit Attack':'Add Attack',fields,'save-attack:'+id,`<div class="tiny muted" style="margin-top:10px">Weapon preset fills the editable fields. Attack Bonus calculated from ability, PB, magic bonus; spell attacks may use SPELL ability.</div>`,true);}
 function editResource(id){let r=c().resources.find(x=>x.id===id)||{name:'',max:1,current:1,recharge:'long',detail:''};formModal(r.name?'Edit Resource':'Add Resource',field('name','Resource / uses name',r.name)+field('max','Maximum',r.max,'number')+field('current','Currently available',r.current,'number')+selectField('recharge','Refreshes on',r.recharge,[['long','Long Rest'],['short','Short or Long Rest'],['short1','Short Rest: +1 use / Long: full'],['manual','Manual only']])+field('detail','Description / mechanic',r.detail,'textarea','wide'),'save-resource:'+id);}
 function editFeature(id){let f=c().features.find(x=>x.id===id)||{name:'',detail:'',action:'Passive',source:'Custom',level:totalLevel(c())};formModal(f.name?'Edit Feature':'Add Feature',field('name','Ability / feature name',f.name)+selectField('source','Source',f.source,FEATURE_SOURCES)+field('level','Gained at level',f.level,'number')+selectField('action','Action cost',f.action,ACTION_TYPES)+field('detail','Description and rules',f.detail,'textarea','wide'),'save-feature:'+id);}
 const ATLAS_CONSUMABLES_2024={
  healing:{name:'Potion of Healing',weight:0.5,effect:'heal',en:'As a Bonus Action, drink this potion or administer it to a creature within 5 feet. The recipient regains 2d4 + 2 HP. Roll physical dice and enter the result.',el:'Με Bonus Action πίνεις το φίλτρο ή το δίνεις σε πλάσμα εντός 5 ft. Ο αποδέκτης ανακτά 2d4 + 2 HP. Ρίξε πραγματικά ζάρια και καταχώρισε το αποτέλεσμα.'},
  antitoxin:{name:'Antitoxin',weight:0,effect:'none',en:'A consumable remedy with rules for resisting poison. Check the official 2024 Equipment entry for its exact duration and benefit; record the effect with your DM.',el:'Αναλώσιμο αντίδοτο με κανόνες για αντίσταση σε δηλητήριο. Δες το επίσημο Equipment 2024 για ακριβή διάρκεια και επίδραση και συμφώνησέ την με τον DM.'},
  acid:{name:'Acid',weight:1,effect:'none',en:'When taking the Attack action, replace one attack by throwing acid at a visible target within 20 ft. Dexterity save, DC 8 + DEX modifier + proficiency bonus, or 2d6 Acid damage.',el:'Στο Attack action αντικαθιστάς μία επίθεση με ρίψη οξέος σε ορατό στόχο εντός 20 ft. Dexterity save με DC 8 + DEX modifier + proficiency bonus, αλλιώς 2d6 Acid damage.'},
  alchemist:{name:"Alchemist’s Fire",weight:1,effect:'none',en:'Replace one attack of the Attack action with a throw at a target within 20 ft. On a failed Dexterity save (DC 8 + DEX modifier + proficiency bonus), deal 1d4 Fire damage and the target starts burning.',el:'Αντικαθιστάς μία επίθεση του Attack action με ρίψη εντός 20 ft. Αν αποτύχει Dexterity save (DC 8 + DEX modifier + proficiency bonus), προκαλεί 1d4 Fire damage και ο στόχος αρχίζει να καίγεται.'},
  holywater:{name:'Holy Water',weight:1,effect:'none',en:'Blessed water used offensively against certain creatures. See the official 2024 Equipment entry for its exact attack and damage procedure.',el:'Αγιασμένο νερό που χρησιμοποιείται επιθετικά εναντίον συγκεκριμένων πλασμάτων. Δες το επίσημο Equipment 2024 για την ακριβή διαδικασία και ζημιά.'},
  oil:{name:'Oil',weight:1,effect:'none',en:'Can coat a target, cover ground, or fuel a lamp. In combat it may cause extra Fire damage when ignited; see the official rules for the distinct uses and durations.',el:'Μπορεί να καλύψει στόχο ή έδαφος ή να τροφοδοτήσει λάμπα. Όταν αναφλεγεί μπορεί να προκαλέσει επιπλέον Fire damage. Δες τους ξεχωριστούς κανόνες χρήσης και διάρκειας.'},
  poison:{name:'Poison, Basic',weight:0,effect:'none',en:'As a Bonus Action, coat one weapon or up to three pieces of ammunition. Piercing or Slashing damage from them deals an extra 1d4 Poison damage. The coating lasts up to 1 minute or until the damage is dealt.',el:'Με Bonus Action καλύπτεις ένα όπλο ή έως τρία βλήματα. Όταν προκαλέσουν Piercing ή Slashing damage, προστίθεται 1d4 Poison damage. Η επίδραση κρατά έως 1 λεπτό ή μέχρι να προκαλέσει ζημιά.'},
  healer:{name:"Healer’s Kit (1 use)",weight:0,effect:'none',en:'One use of a Healer’s Kit. Take the Utilize action to stabilize an Unconscious creature at 0 HP without a Wisdom (Medicine) check. A complete kit normally has 10 uses.',el:'Μία χρήση από Healer’s Kit. Με Utilize action σταθεροποιείς Unconscious πλάσμα στα 0 HP χωρίς Wisdom (Medicine) check. Ένα πλήρες kit έχει συνήθως 10 χρήσεις.'},
  scroll0:{name:'Spell Scroll (Cantrip)',weight:0,effect:'none',en:'A one-use scroll of a specific cantrip. The spell must be on your class spell list; cast it with its normal casting time, without Material components. Scroll is destroyed after use.',el:'Περγαμηνή μίας χρήσης με συγκεκριμένο cantrip. Το spell πρέπει να βρίσκεται στη λίστα της κλάσης σου· το κάνεις cast με τον κανονικό χρόνο, χωρίς Material components. Η περγαμηνή καταστρέφεται.'},
  scroll1:{name:'Spell Scroll (Level 1)',weight:0,effect:'none',en:'A one-use scroll of a specific level 1 spell. The spell must be on your class spell list; use its normal casting time without Material components. For attack/save the scroll has attack +5 / save DC 13.',el:'Περγαμηνή μίας χρήσης με συγκεκριμένο spell 1ου επιπέδου. Πρέπει να βρίσκεται στη λίστα της κλάσης σου. Χρόνος cast κανονικός, χωρίς Material components· spell attack +5 / save DC 13.'}
 };
 const ATLAS_EQUIPMENT_2024_URL='https://www.dndbeyond.com/sources/dnd/br-2024/equipment';
 function atlasConsumablePreset(item){if(item.consumablePreset&&ATLAS_CONSUMABLES_2024[item.consumablePreset])return [item.consumablePreset,ATLAS_CONSUMABLES_2024[item.consumablePreset]];return Object.entries(ATLAS_CONSUMABLES_2024).find(([k,v])=>v.name.toLowerCase()===String(item.name||'').toLowerCase())||null;}
 function atlasConsumableInfo(item){const found=atlasConsumablePreset(item),entry=found?.[1];const description=entry?tr(entry.el,entry.en):(item.description||tr('Custom αναλώσιμο: η χρήση και οι επιδράσεις καθορίζονται από τον DM.','Custom consumable: use and effects are decided by the DM.'));return {entry,description};}
 function atlasConsumablePopup(id){const item=c().inventory.find(x=>x.id===id);if(!item)return;const {entry,description}=atlasConsumableInfo(item);openModal(item.name,`<div class="detail-meta"><span class="chip">${tr('Ποσότητα','Quantity')}: ${Number(item.qty)||0}</span><span class="chip">D&D 5e / 2024</span></div><div class="detail-description">${esc(description)}</div>${item.description&&entry&&item.description!==description?`<div class="section-caption">${tr('Σημειώσεις χαρακτήρα','Character notes')}</div><div class="detail-description">${esc(item.description)}</div>`:''}<p class="detail-note">${entry?tr('Περίληψη με βάση τους επίσημους Basic Rules 2024, όχι αυτούσιο κείμενο PHB.','Summary based on official 2024 Basic Rules, not verbatim PHB text.'):tr('Custom / DM κανόνας.','Custom / DM ruling.')}</p>${entry?`<a href="${ATLAS_EQUIPMENT_2024_URL}" target="_blank" rel="noopener noreferrer">${tr('Επίσημο Equipment 2024 ↗','Official Equipment 2024 ↗')}</a>`:''}`,btn(tr('Επεξεργασία','Edit'),'edit-item:'+id,'sm')+btn(tr('Κλείσιμο','Close'),'close-modal'));}
 const ATLAS_CANON_GEAR_2024=['Backpack','Bedroll','Bell','Blanket','Block and Tackle','Book','Bucket','Caltrops','Candle','Chain','Chest','Climber’s Kit','Clothes, Traveler’s','Crowbar','Flask','Grappling Hook','Hammer','Healer’s Kit','Hooded Lantern','Hunting Trap','Ink','Iron Pot','Iron Spikes','Ladder','Lamp','Lock','Manacles','Mirror','Oil','Paper','Parchment','Pole','Pouch','Rations','Rope','Sack','Shovel','Signal Whistle','Tinderbox','Torch','Waterskin','Whetstone','Shield'];
 function atlasCanonItemPicker(kind){
  const options=kind==='weapon'?D.weapons.map(w=>w.name):kind==='consumable'?Object.values(ATLAS_CONSUMABLES_2024).map(x=>x.name):ATLAS_CANON_GEAR_2024;
  const title=kind==='weapon'?tr('Επίλεξε όπλο (2024)','Choose weapon (2024)'):kind==='consumable'?tr('Επίλεξε αναλώσιμο (2024)','Choose consumable (2024)'):tr('Επίλεξε εξοπλισμό (2024)','Choose equipment (2024)');
  const html=`<div class="field"><label>${title}<select id="atlas-canon-name"><option value="">${tr('— Επίλεξε —','— Choose —')}</option>${options.map(n=>`<option value="${attr(n)}">${esc(n)}</option>`).join('')}</select></label></div><p class="muted small">${tr('Επίσημες ονομασίες βασικού εξοπλισμού 2024. Η καταχώριση διατηρεί τη βασική κατηγορία και δεν προσθέτει ιδιότητες homebrew.','Official 2024 baseline equipment names. No homebrew properties are added.')}</p>`;
  openModal(title,html,btn(tr('Πίσω','Back'),'add-item')+btn(tr('Προσθήκη','Add'),'canon-item-add:'+kind,'primary'));
 }
 function atlasAddItemKind(){openModal(tr('Προσθήκη αντικειμένου','Add inventory item'),`<div class="grid two"><button class="btn" data-action="choose-item-kind:weapon">${tr('Όπλο','Weapon')}</button><button class="btn" data-action="choose-item-kind:consumable">${tr('Αναλώσιμο','Consumable')}</button><button class="btn" data-action="choose-item-kind:item">${tr('Αντικείμενο','Equipment')}</button><button class="btn" data-action="choose-item-kind:custom">${tr('Άλλο / Custom','Other / Custom')}</button></div>`,'',true);}
 function atlasAddCanonicalItem(kind){
  const name=document.getElementById('atlas-canon-name')?.value;
  if(!name)return toast(tr('Επίλεξε αντικείμενο.','Choose an item.'));
  const weapon=D.weapons.find(w=>w.name===name);
  const consumable=Object.entries(ATLAS_CONSUMABLES_2024).find(([,x])=>x.name===name);
  const record={id:uid(),name,qty:1,weight:kind==='consumable'?(consumable?.[1].weight||0):0,category:kind==='weapon'?'weapon':kind==='consumable'?'consumable':'',weaponType:weapon?.name||'',weaponStatus:'normal',weaponStatusNote:'',equipped:false,description:kind==='consumable'?tr(consumable?.[1].el||'',consumable?.[1].en||''):'',effectKind:consumable?.[1].effect||'none',consumablePreset:consumable?.[0]||'',source:'2024-canon'};
  c().inventory.push(record);save();closeModal();renderApp();toast(tr('Προστέθηκε από τον εξοπλισμό 2024.','Added from the 2024 equipment catalog.'));
 }
 function editItem(id,initialCategory=''){let i=c().inventory.find(x=>x.id===id)||{name:'',qty:1,weight:0,description:'',equipped:false,category:initialCategory,weaponStatus:'normal',weaponStatusNote:'',weaponType:''};
 const types=[['',tr('Όχι όπλο / αυτόματη αναγνώριση','Not a weapon / auto-detect')],...D.weapons.map(w=>[w.name,w.name])];
 const states=weaponStates.map(state=>[state,weaponStateLabel(state)]);
 const preset=atlasConsumablePreset(i)?.[0]||'custom';
 const presetField=selectField('consumablePreset',tr('Γνωστό αναλώσιμο (2024) ή Custom','Known consumable (2024) or Custom'),preset,[['custom',tr('Custom — δικό μου αντικείμενο','Custom — my own item')],...Object.entries(ATLAS_CONSUMABLES_2024).map(([key,v])=>[key,v.name])]);
 const fields=presetField+selectField('category',tr('Κατηγορία','Category'),i.category||'',[['',tr('Λοιπό αντικείμενο','Other item')],['consumable',tr('Αναλώσιμο','Consumable')],['weapon',tr('Όπλο','Weapon')]])+field('name',tr('Όνομα αντικειμένου','Item name'),i.name)+field('qty',tr('Ποσότητα','Quantity'),i.qty,'number')+field('weight',tr('Βάρος (λίβρες)','Weight (lb)'),i.weight,'number')+selectField('equipped',tr('Εξοπλισμένο;','Equipped?'),String(!!i.equipped),[['true',tr('Ναι','Yes')],['false',tr('Όχι','No')]])+selectField('weaponType',tr('Τύπος όπλου (για μαγικά / ειδικά όπλα)','Weapon kind (for magic / custom weapons)'),i.weaponType||'',types)+selectField('weaponStatus',tr('Κατάσταση όπλου','Weapon condition'),i.weaponStatus||'normal',states)+field('weaponStatusNote',tr('Σημείωση κατάστασης — λήξη δηλητηρίου, ζημιά, DM κ.λπ.','Condition notes — poison expiry, damage, DM ruling'),i.weaponStatusNote||'','textarea','wide')+selectField('effectKind',tr('Επίδραση αναλώσιμου (μόνο με επιβεβαίωση κανόνα / DM)','Consumable effect (verify rule / DM)'),i.effectKind||'none',[['none',tr('Χειροκίνητη / καμία αυτόματη','Manual / no automatic effect')],['heal',tr('Θεραπεία (εισαγωγή αποτελέσματος)','Healing (enter result)')],['temp_hp',tr('Προσωρινοί πόντοι ζωής','Temporary HP')],['add_condition',tr('Προσθήκη κατάστασης','Apply condition')],['remove_condition',tr('Αφαίρεση κατάστασης','Remove condition')]])+selectField('effectCondition',tr('Κατάσταση (αν ισχύει)','Condition (if applicable)'),i.effectCondition||'',[['','—'],...D.conditions.map(c=>[c.id,c.name])])+field('description',tr('Περιγραφή / επιδράσεις','Description / effects'),i.description,'textarea','wide');
 formModal(i.name?tr('Επεξεργασία αντικειμένου','Edit Item'):tr('Προσθήκη αντικειμένου','Add Item'),fields,'save-item:'+id,`<p class="atlas-status-help">${tr('Η κατάσταση «φθαρμένο» ή «σπασμένο» δεν ορίζει αυτόματη ποινή. Ο DM αποφασίζει τις συνέπειες. Το δηλητήριο στην επιφάνεια του όπλου δεν σημαίνει ότι το όπλο έχει την κατάσταση Poisoned (Δηλητηριασμένο), που αφορά πλάσματα.','Damaged or Broken does not impose an automatic penalty; the DM decides. A poisoned coating is not the Poisoned creature condition.')}</p>`,true);
 }
 document.addEventListener('change',e=>{if(e.target?.id!=='f-consumablePreset')return;const key=e.target.value,preset=ATLAS_CONSUMABLES_2024[key],form=e.target.closest('form');if(!form)return;if(preset){form.elements.category.value='consumable';form.elements.name.value=preset.name;form.elements.weight.value=preset.weight;form.elements.effectKind.value=preset.effect;form.elements.description.value=tr(preset.el,preset.en);}});
 function editCompanion(id){let q=(c().companions||[]).find(x=>x.id===id)||{name:'',type:'Familiar',hp:1,maxHp:1,ac:10,speed:30,description:''};formModal(q.name?'Edit Companion':'Add Companion',field('name','Name',q.name)+selectField('type','Type / role',q.type,COMPANION_TYPES)+field('maxHp','Max HP',q.maxHp,'number')+field('hp','Current HP',q.hp,'number')+field('ac','AC',q.ac,'number')+field('speed','Speed (ft)',q.speed,'number')+field('description','Actions / attacks / notes',q.description,'textarea','wide'),'save-companion:'+id);}
 function companionDetail(id){let q=(c().companions||[]).find(x=>x.id===id);if(!q)return;openModal(q.name,`<div class="detail-meta"><span class="chip gold">HP ${q.hp}/${q.maxHp}</span><span class="chip">AC ${q.ac}</span><span class="chip">Speed ${q.speed} ft</span></div><div class="detail-description">${esc(q.description||'Add attacks and abilities in Edit.')}</div>`,btn('− HP','companion-hp:'+id+':-1','sm')+btn('+ HP','companion-hp:'+id+':1','sm')+btn('Edit','edit-companion:'+id,'sm'));}
 function editOwnedSpell(id){let x=c().spellbook.find(s=>s.id===id)||{name:'',level:0,school:'',cast:'Action',range:'',duration:'',components:'',summary:'',prepared:true,ref:''};let r=x.ref?findReference(x.ref):null;formModal(x.name?'Edit Prepared Spell':'Add Custom Spell',field('name','Spell name',x.name)+selectField('level','Level',r?.level??x.level,Array.from({length:10},(_,i)=>[i,formatLevel(i)]))+selectField('school','School',x.school||r?.school||'',['',...SPELL_SCHOOLS])+selectField('cast','Casting time',x.cast||r?.cast||'Action',SPELL_CAST_TIMES)+field('range','Range',x.range||r?.range||'')+field('duration','Duration',x.duration||r?.duration||'')+field('components','Components',x.components||r?.components||'')+selectField('prepared','Prepared?',String(x.prepared!==false),[['true','Yes'],['false','No']])+field('summary','Spell effect / notes',x.summary||r?.summary||'','textarea','wide')+field('damage','Damage / Healing formula (e.g. 3d8+2)',x.damage||'')+selectField('effectKind','Effect type',x.effectKind||'damage', [['damage','Damage'],['healing','Healing'],['hp','HP increase']])+field('damageType','Damage type (e.g. Fire)',x.damageType||'')+field('upcastBonus','Bonus per higher spell slot (e.g. 1d6, 2d8, 5)',x.upcastBonus||'')+field('damageNote','Damage / effect notes',x.damageNote||'','textarea','wide'),'save-owned-spell:'+id,`<div class="tiny muted">Για αλλαγές σε spell της βιβλιοθήκης, το local description υπερισχύει. Το ενσωματωμένο reference δεν τροποποιείται.</div>`,true);}
 function editSpellSetup(){let ch=c(),fields=selectField('spellAbility','Spellcasting ability',ch.spellAbility||'INT',Object.keys(D.abilities))+field('spellDCOverride','Spell Save DC override (optional)',ch.spellDCOverride,'number')+field('spellAttackOverride','Spell Attack override (optional)',ch.spellAttackOverride,'number')+'<div class="form-section">NORMAL SPELL SLOTS — set MAX, used adjusts on save</div>';
 for(let i=1;i<=9;i++)fields+=field('slot'+i,`Level ${i} max slots`,ch.slots?.[i]?.max||0,'number');fields+='<div class="form-section">PACT MAGIC (WARLOCK / CUSTOM)</div>'+field('pactLevel','Pact slot level',ch.pact?.level||1,'number')+field('pactMax','Max Pact slots',ch.pact?.max||0,'number');formModal('Configure Spellcasting',fields,'save-spell-setup',`<div class="hintnote">Κράτα τα slots editable για multiclass, homebrew και ειδικούς κανόνες. Τα class tables δεν εφαρμόζονται αυτόματα για να μην εισαχθούν λάθη.</div>`,true);}
 function editCurrency(){formModal('Edit Currency',['cp','sp','ep','gp','pp'].map(k=>field(k,k.toUpperCase(),c().currency?.[k]||0,'number')).join(''),'save-currency');}
 function editJournal(id){let j=c().journal.find(x=>x.id===id)||{title:'',date:new Date().toISOString().slice(0,10),text:''};formModal(j.title?'Edit Journal Entry':'New Journal Entry',field('title','Entry title',j.title)+field('date','Date',j.date,'date')+field('text','Notes / discoveries / quests',j.text,'textarea','wide'),'save-journal:'+id);}
 function editHP(action){const ch=c();const name=action==='hp-damage'?'Take Damage':action==='hp-heal'?'Heal HP':'Edit Hit Points';let fields=action==='hp-edit'?field('max','Max HP',ch.hp.max,'number')+field('current','Current HP',ch.hp.current,'number')+field('temp','Temporary HP',ch.hp.temp,'number'):field('amount',action==='hp-damage'?'Damage amount':'Healing amount',5,'number');formModal(name,fields,'save-hp:'+action,`<p class="tiny muted">Current HP ${ch.hp.current}/${ch.hp.max}, Temporary HP ${ch.hp.temp||0}. Damage subtracts temporary HP first.</p>`);}
 function editHitDice(){formModal('Hit Dice',field('max','Total Hit Dice',c().hitDice?.max||totalLevel(c()),'number')+field('used','Spent Hit Dice',c().hitDice?.used||0,'number'),'save-hitdice');}
 function fixedHpGain(ch,cls){const data=window.ATLAS_PROGRESSION_2024?.[cls];const die=data?.[0]?.hitDie||8;const con=Math.floor(((Number(ch.abilities?.CON)||10)-10)/2);const tough=(ch.feats||[]).some(f=>/tough/i.test(typeof f==='string'?f:(f.name||'')))?2:0;const dwarf=ch.species==='Dwarf'?1:0;const draconic=cls==='Sorcerer'&&ch.classes.some(x=>x.name==='Sorcerer'&&/Draconic/i.test(x.subclass||''))?1:0;return Math.max(1,Math.floor(die/2)+1+con+tough+dwarf+draconic);}
 function levelUp(){const ch=c(),cls=ch.classes[0]?.name||'Fighter';const fields=selectField('className',tr('Κλάση','Class to level up'),cls,ch.classes.map(x=>x.name))+field('hpGain',tr('Αύξηση Max HP (fixed 2024)','Increase Max HP (2024 fixed)'),fixedHpGain(ch,cls),'number');formModal('Level Up',fields,'apply-levelup',`<p class="hintnote">${tr('Προεπιλογή: σταθερά HP της κλάσης + CON + τυχόν Feats. Οι νέες επιλογές επισημαίνονται ως εκκρεμείς.','Default: fixed class HP + CON + applicable feats. New choices are flagged for review.')}</p>`);}
 function progressionRows(cls,ch){const rows=window.ATLAS_PROGRESSION_2024?.[cls]||[];const at=ch.classes.find(x=>x.name===cls)?.level||0;return rows.map(x=>`<tr ${x.level===at?'style="background:rgba(243,200,100,.12)"':''}><td>${x.level===at?'★ ':''}${x.level}</td><td>+${x.proficiencyBonus}</td><td>${esc(x.features.join(', ')||'—')}</td><td>${x.level===1?x.hitDie:`+${x.fixedHpAfterFirst} + CON`}</td></tr>`).join('');}
 function showProgression(){const ch=c(),all=window.ATLAS_PROGRESSION_2024||{},cls=ch.classes[0]?.name||'Fighter';openModal(tr('Εξέλιξη Επίπεδων · D&D 2024','Level Progression · D&D 2024'),`<div class="field"><label>${tr('Κλάση','Class')}<select id="progression-class">${Object.keys(all).map(x=>`<option ${x===cls?'selected':''}>${esc(x)}</option>`).join('')}</select></label></div><div style="max-height:55vh;overflow:auto"><table class="atlas-progression-table" style="width:100%"><thead><tr><th>Lv</th><th>PB</th><th>${tr('Ικανότητες','Features')}</th><th>HP</th></tr></thead><tbody id="progression-rows">${progressionRows(cls,ch)}</tbody></table></div><p class="muted small">${tr('Σύνοψη χαρακτηριστικών επιπέδου· για subclass και επιλογές χρησιμοποίησε τον Builder και τα επίσημα βιβλία 2024.','Core class milestones only; subclass features and choices require the 2024 rules and player selection.')}</p>`,btn(tr('Κλείσιμο','Close'),'close-modal'),true);}

 function restHitDieSides(ch){const cls=(ch.classes||[])[0]?.name||'Fighter';return Number(D.classes?.[cls]?.die)||({Fighter:10,Barbarian:12,Paladin:10,Ranger:10,Monk:8,Rogue:8,Cleric:8,Druid:8,Bard:8,Warlock:8,Sorcerer:6,Wizard:6}[cls]||8);}
 function restReport(type,changes){const ch=c(),isLong=type==='long',hd=ch.hitDice||{max:totalLevel(ch),used:0},remaining=Math.max(0,hd.max-hd.used);openModal(tr(isLong?'Παρατεταμένη ανάπαυση ολοκληρώθηκε':'Σύντομη ανάπαυση ολοκληρώθηκε',isLong?'Long Rest completed':'Short Rest completed'),`<div class="detail-description"><b>${tr('Ανανεώθηκαν','Restored')}</b></div><ul style="padding-left:22px;line-height:1.7">${changes.map(x=>`<li>${esc(x)}</li>`).join('')||`<li>${tr('Κανένας πόρος δεν χρειαζόταν ανανέωση.','Nothing needed to be restored.')}</li>`}</ul>${!isLong?`<div class="detail-note">${tr(`HP ${ch.hp.current}/${ch.hp.max} · Διαθέσιμα Hit Dice: ${remaining}/${hd.max}. Μπορείς να ξοδέψεις Hit Dice, ένα τη φορά, για να ανακτήσεις HP.`,`HP ${ch.hp.current}/${ch.hp.max} · Hit Dice remaining: ${remaining}/${hd.max}. You may spend Hit Dice one at a time to regain HP.`)}</div>`:''}`,(!isLong&&remaining>0&&ch.hp.current<ch.hp.max?btn(tr('Χρήση Hit Die για θεραπεία','Spend a Hit Die to heal'),'rest-hitdie-open','primary'):'')+btn(tr('Τέλος','Done'),'close-modal'));}
 function restHitDiePrompt(){const ch=c(),hd=ch.hitDice||{max:totalLevel(ch),used:0};if(ch.hp.current>=ch.hp.max||hd.used>=hd.max)return restReport('short',[]);const die=restHitDieSides(ch),con=Math.floor(((Number(ch.abilities?.CON)||10)-10)/2);openModal(tr('Θεραπεία με Hit Die','Healing with a Hit Die'),`<p class="detail-description">${tr(`Ρίξε πραγματικό d${die} και πρόσθεσε το Constitution modifier (${signed(con)}). Ελάχιστη θεραπεία: 1 HP.`, `Roll a physical d${die} and add your Constitution modifier (${signed(con)}). Minimum healing: 1 HP.`)}</p><div class="detail-note">HP: ${ch.hp.current}/${ch.hp.max} · ${tr('Διαθέσιμα Hit Dice','Available Hit Dice')}: ${hd.max-hd.used}/${hd.max}</div><div class="field"><label for="atlas-rest-die-roll">${tr(`Αποτέλεσμα ζαριού (1–${die})`,`Die result (1–${die})`)}</label><input id="atlas-rest-die-roll" type="number" inputmode="numeric" min="1" max="${die}" step="1" placeholder="1–${die}"></div>`,btn(tr('Όχι άλλο Hit Die','No more Hit Dice'),'close-modal')+btn(tr('Χρήση 1 Hit Die','Spend 1 Hit Die'),'rest-hitdie-apply','primary'));}
 function rest(type){const isLong=type==='long';openModal(tr(isLong?'Παρατεταμένη ανάπαυση':'Σύντομη ανάπαυση',isLong?'Long Rest':'Short Rest'),`<p class="detail-description">${isLong?tr('Στο Long Rest ανακτάς όλα τα χαμένα HP και όλα τα ξοδεμένα Hit Dice, καθώς και τους διαθέσιμους πόρους που ανανεώνονται με Long Rest. Δεν χρειάζεται να ρίξεις Hit Dice.','A Long Rest restores all lost HP and all spent Hit Dice, alongside the resources that recharge on a Long Rest. You do not roll Hit Dice.'):tr('Στο Short Rest ανανεώνονται οι πόροι που επαναφορτίζονται σε σύντομη ανάπαυση. Μετά μπορείς προαιρετικά να ξοδέψεις ένα ή περισσότερα Hit Dice για θεραπεία, εισάγοντας τις πραγματικές ζαριές σου.','A Short Rest refreshes Short Rest resources. Afterwards you may optionally spend Hit Dice for healing using physical dice results.')}</p><p class="detail-note">${tr('Ο DM επιβεβαιώνει ότι ολοκληρώθηκε η ανάπαυση (τουλάχιστον 1 HP στην αρχή).','The DM confirms the rest was completed (at least 1 HP to begin).')}</p>`,btn(tr('Άκυρο','Cancel'),'close-modal')+btn(tr('Ολοκλήρωση Rest','Complete Rest'),'confirm-rest:'+type,'primary'));}
 function conditionsModal(){const ls=D.conditions;openModal('Conditions & Status',`<div class="section-caption">TAP TO TOGGLE · TAP NAME FOR RULES</div><div class="field" style="margin-bottom:12px"><label for="atlas-condition-pick">${uiText('Επιλογή condition','Choose condition')}</label><select id="atlas-condition-pick" data-condition-pick><option value="">${uiText('— Επίλεξε —','— Select —')}</option>${ls.map(x=>`<option value="${attr(x.id)}">${esc(x.name)}</option>`).join('')}</select><button type="button" class="btn sm" data-action="toggle-selected-condition" style="margin-top:6px">${uiText('Ενεργοποίηση / απενεργοποίηση','Toggle condition')}</button></div><div class="grid two">${ls.map(x=>`<div class="option-row"><button class="linklike" data-picker-detail="${x.id}">${esc(x.name)}</button><button class="btn sm ${(c().conditions||[]).includes(x.id)?'warn':''}" data-condition-toggle="${x.id}">${(c().conditions||[]).includes(x.id)?'Active ✓':'Activate'}</button></div>`).join('')}</div>`,btn('Done','close-modal'),true);}
 function roller(){openModal('Dice Roller',`<div class="form-grid"><div class="field wide"><label>Formula (e.g. 2d6+3)</label><input id="dice-formula" value="1d20${signed(initMod(c()))}"></div><div class="field wide"><label>Roll label</label><input id="dice-label" value="Custom roll"></div></div><div class="section-caption">QUICK DICE</div><div class="actions-inline">${[4,6,8,10,12,20,100].map(n=>`<button class="btn sm" data-dice-insert="d${n}">d${n}</button>`).join('')}</div><div class="section-caption">ROLL HISTORY</div><div class="dice-log" id="modal-dice-history">${(c().rolls||[]).slice(0,9).map(r=>`<div class="roll-entry"><div><b>${esc(r.label)}</b><div class="tiny muted">${esc(r.formula)} · [${esc(r.parts)}]</div></div><strong>${r.total}</strong></div>`).join('')}</div>`,btn('Roll','roll-manual','primary')+btn('Close','close-modal'))}
 async function selectDrivePortrait(){if(!sharedLoaded||!campaignImages.length)await fetchSharedData();const choices=campaignImages.filter(x=>mediaSrc(x.path)).slice(0,100);openModal(tr('Εικόνα χαρακτήρα από κοινή συλλογή','Choose portrait from shared gallery'),choices.length?'<div class="campaign-gallery">'+choices.map(x=>'<button type="button" class="campaign-option" data-action="portrait-drive-select:'+attr(x.id)+'"><img alt="'+attr(x.title)+'" loading="lazy" style="width:115px;height:100px;object-fit:cover" src="'+attr(mediaSrc(x.path))+'"><span>'+esc(x.title)+'</span></button>').join('')+'</div>':tr('Δεν βρέθηκαν εικόνες.','No shared images available.'),btn(tr('Κλείσιμο','Close'),'close-modal'),true);}
 function portraitDialog(){
  const ch=c(), has=!!mediaSrc(ch.portrait);
  const preview=has?`<img class="portrait-preview" src="${attr(ch.portrait)}" alt="${attr(ch.name)} portrait">`:`<div class="portrait-preview portrait-placeholder">${initials(ch)}</div>`;
  openModal('Character portrait',`<div class="portrait-editor">${preview}<div class="portrait-instructions"><strong>${esc(ch.name)}</strong><p>Choose an image from your device. It will be resized to save space, stored only on this device and included in JSON backups.</p><p class="tiny muted">JPEG, PNG, WebP or another supported image format. Max file size 15 MB.</p></div></div>`, `<button class="btn primary" data-action="choose-portrait">${has?'Change image':'Choose image'}</button><button class="btn" data-action="portrait-drive">${tr('Κοινές εικόνες Drive','Shared Drive Gallery')}</button>${has?'<button class="btn warn" data-action="remove-portrait">Remove image</button>':''}<button class="btn" data-action="close-modal">Close</button>`);
 }
 function loadImage(file){return new Promise((resolve,reject)=>{   let url=URL.createObjectURL(file),img=new Image();
   img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
   img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Unsupported or damaged image'));};
   img.src=url;
 });}
 async function compressPortrait(file){
   if(!file || !file.type.startsWith('image/') || file.type==='image/svg+xml' || file.size>15*1024*1024) throw Error('Choose an image under 15 MB (not SVG).');
   const img=await loadImage(file); const w=img.naturalWidth,h=img.naturalHeight;
   if(!w || !h || w*h>150000000)throw Error('Image is too large.');
   const ratio=Math.min(1,720/Math.max(w,h));
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*ratio));canvas.height=Math.max(1,Math.round(h*ratio));
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image processing is unavailable on this device.');
   ctx.fillStyle='#162538';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
   let result='';for(const quality of [.82,.72,.6]){result=canvas.toDataURL('image/jpeg',quality);if(result.length<390000)break;}
   canvas.width=0;canvas.height=0;
   if(!safePortrait(result)||result.length>650000)throw Error('Image is too complex to store. Try a smaller image.');
   return result;
 }
 async function handlePortrait(file){
   if(!file)return;
   const characterId=c().id;
   try{
     const value=await compressPortrait(file);
     const ch=characters.find(x=>x.id===characterId);if(!ch)return;
     const old=ch.portrait;ch.portrait=value;
     // A failed quota write must not claim the portrait was saved.
     if(!cloud.enabled){try{localStorage.setItem(KEY,JSON.stringify({characters,selectedId}));}catch(e){ch.portrait=old;throw Error('Browser storage is full. Export a backup and try a smaller image.');}}
     closeModal();update();toast('Character image saved.');
   }catch(e){toast(e.message||'Could not open image.');}
 }
 function settings(){
  const el=L.getLanguage()==='el';
  const t=(el,en)=>uiText(el,en);
  const updateInfo=`<div class="section-caption">${t('ΕΚΔΟΣΗ & ΕΝΗΜΕΡΩΣΕΙΣ','VERSION & UPDATES')}</div>
   <div class="detail-note">${t('Έκδοση','Version')} <strong>${APP_VERSION}</strong> · ${t('GitHub Pages / PWA. Όταν κάνεις push στο GitHub, η εφαρμογή μπορεί να φορτώσει τα νέα αρχεία χωρίς να σβήσει τους χαρακτήρες σου.','GitHub Pages / PWA. When you push changes to GitHub, the app can load new files without erasing your characters.')}</div>
   <div class="actions-inline atlas-update-actions"><button class="btn primary" data-action="check-updates">↻ ${t('Έλεγχος νέας έκδοσης','Check for updates')}</button></div>
   <div id="update-status" class="tiny muted" aria-live="polite">${t('Οι χαρακτήρες και οι εικόνες δεν διαγράφονται με την ενημέρωση.','Updates do not delete your characters or portraits.')}</div>
   <div class="section-caption">${t('ΚΑΘΑΡΙΣΜΟΣ CACHE & COOKIES','CACHE & COOKIES')}</div>
   <div class="detail-description">${t('Η εφαρμογή δεν αποθηκεύει χαρακτήρες σε cookies. Βρίσκονται στο localStorage. Ο καθαρισμός παρακάτω αφαιρεί τα προσωρινά αρχεία της εφαρμογής και προσβάσιμα cookies για τη διαδρομή της, αλλά κρατά όλους τους χαρακτήρες, εικόνες και ρυθμίσεις.','Characters are not stored in cookies. They live in localStorage. The action below removes app cached files and accessible app-path cookies while preserving characters, portraits and settings.')}</div>
   <div class="actions-inline"><button class="btn" data-action="clear-app-cache">${t('Καθαρισμός cache & cookies (χωρίς απώλεια)','Clear cache & cookies (keep data)')}</button></div>
   <div class="section-caption">${t('ΤΟΠΙΚΑ ΔΕΔΟΜΕΝΑ — ΠΡΟΣΟΧΗ','LOCAL DATA — DANGER')}</div>
   <div class="detail-description">${t('Η πλήρης επαναφορά διαγράφει τα τοπικά δεδομένα Character Atlas αυτής της συσκευής. Δημιούργησε νέο χαρακτήρα από τον Builder ή εισήγαγε αντίγραφο JSON. Πάρε πρώτα backup.','Full reset clears locally stored Character Atlas data on this device. Create a new character with the Builder or import a JSON backup. Back up first.')}</div>
   <div class="actions-inline"><button class="btn warn" data-action="reset-local-data">${t('Διαγραφή χαρακτήρων & επαναφορά','Delete characters & reset')}</button></div>`;
  openModal(t('Ρυθμίσεις & Δεδομένα','Settings & Data'),`${updateInfo}<div class="section-caption">${t('BACKUP & RESTORE','BACKUP & RESTORE')}</div><div class="actions-inline"><button class="btn primary" data-action="backup">Export all characters (.json)</button><button class="btn" data-action="import">Import backup (.json)</button><button class="btn" data-action="import-character">${t('Εισαγωγή χαρακτήρα (.json)','Import character (.json)')}</button><button class="btn" data-action="download-docx-template">${t('Λήψη προτύπου DOCX','Download DOCX template')}</button></div><div class="section-caption">${t('ΧΑΡΑΚΤΗΡΕΣ','CHARACTERS')}</div><div class="tile-list">${characters.map(x=>`<div class="tile"><span class="name">${esc(x.name)} · Level ${totalLevel(x)}</span>${(cloud.enabled&&['creator','dm'].includes(cloud.user?.role||''))?`<button class="btn sm warn" data-delete-character="${x.id}">${t('Διαγραφή','Delete')}</button>`:''}</div>`).join('')}</div><div class="section-caption">${t('ΠΕΡΙΕΧΟΜΕΝΟ ΚΑΝΟΝΩΝ','RULES SCOPE')}</div><div class="detail-note">Content: short summaries of 5e/2024 rules. Optional, legacy, and homebrew features may require manual input; confirm with the DM.</div><input id="import-file" type="file" accept="application/json,.json" style="display:none"/><input id="import-character-file" type="file" accept="application/json,.json" style="display:none"/>`,btn(t('Κλείσιμο','Close'),'close-modal'),true);
 }

 function backup(){const str=JSON.stringify({application:'Character Atlas',schema:1,exportedAt:new Date().toISOString(),characters},null,2);const blob=new Blob([str],{type:'application/json'});let url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='character-atlas-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup exported.');}
 let checkingUpdates=false, updateAvailable=false, lastUpdateCheck=0;
 function setUpdateStatus(msg){const target=document.getElementById('update-status');if(target)target.textContent=msg;}
 function updateBanner(){
  if(document.getElementById('atlas-update-banner'))return;
  const node=document.createElement('div');node.id='atlas-update-banner';node.className='atlas-update-banner';
  node.innerHTML=`<div><strong>${uiText('Νέα έκδοση D&D Atlas διαθέσιμη','D&D Atlas update available')}</strong><small>${uiText('Τα δεδομένα σου παραμένουν αποθηκευμένα.','Your character data will be preserved.')}</small></div><button class="btn primary sm" data-action="reload-app">${uiText('Ενημέρωση','Update now')}</button><button class="btn sm" data-action="dismiss-update" aria-label="Dismiss">×</button>`;
  document.body.appendChild(node);
 }
 function workerMessage(worker,request,timeout=16000){return new Promise((resolve,reject)=>{
  const channel=new MessageChannel();let done=false;
  const clock=setTimeout(()=>{if(!done){done=true;channel.port1.close();reject(new Error('Update check timed out'));}},timeout);
  channel.port1.onmessage=(e)=>{if(done)return;done=true;clearTimeout(clock);channel.port1.close();resolve(e.data||{});};
  try{worker.postMessage(request,[channel.port2]);}catch(err){clearTimeout(clock);reject(err);}
 });}
 async function checkUpdates(manual=false){
  if(checkingUpdates)return;
  if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol)){
   if(manual)setUpdateStatus(uiText('Ο αυτόματος έλεγχος απαιτεί τη δημοσιευμένη HTTPS PWA.','Update checking needs the hosted HTTPS PWA.'));
   return;
  }
  checkingUpdates=true;lastUpdateCheck=Date.now();
  if(manual)setUpdateStatus(uiText('Έλεγχος αρχείων στο GitHub Pages…','Checking deployed files…'));
  try{
   const reg=await navigator.serviceWorker.getRegistration('./');
   if(!reg){if(manual)setUpdateStatus(uiText('Επανεκκίνησε την εφαρμογή ώστε να ενεργοποιηθεί η PWA.','Reopen the app to activate the PWA.'));return;}
   await reg.update().catch(()=>{});
   const worker=navigator.serviceWorker.controller||reg.active;
   if(!worker){if(manual)setUpdateStatus(uiText('Η PWA ενεργοποιείται. Δοκίμασε ξανά.','PWA is activating. Try again.'));return;}
   const result=await workerMessage(worker,{type:'CHECK_UPDATES'});
   if(!result.ok)throw new Error(result.error||'Network unavailable');
   if(result.changed?.length){updateAvailable=true;updateBanner();setUpdateStatus(uiText('Βρέθηκε νέα έκδοση. Πάτησε «Ενημέρωση».','An update is ready. Select Update now.'));}
   else if(manual){setUpdateStatus(uiText('Η εφαρμογή είναι ενημερωμένη.','The app is up to date.'));}
  }catch(e){if(manual)setUpdateStatus(uiText('Ο έλεγχος απέτυχε. Έλεγξε το Internet και ξαναδοκίμασε.','Could not check updates. Check your connection and try again.'));}
  finally{checkingUpdates=false;}
 }
 async function refreshApp(clearCache=false){
  // Keep KEY / VIEWKEY / language in localStorage: update must never delete player progress.
  try{
   if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
    const reg=await navigator.serviceWorker.getRegistration('./');
    if(reg){await reg.update().catch(()=>{});const worker=navigator.serviceWorker.controller||reg.active;
     if(worker){const out=await workerMessage(worker,{type:clearCache?'CLEAR_SHELL_CACHE':'CHECK_UPDATES'}).catch(()=>({}));
      if(clearCache&&!out.ok)throw Error(out.error||'Cache cleanup failed');}
    }
   }
   if(clearCache){
    // Cookies visible to this page only; HttpOnly cookies require browser Settings.
    const path=location.pathname.endsWith('/')?location.pathname:location.pathname.replace(/[^/]+$/,'');
    document.cookie.split(';').forEach(part=>{const name=part.split('=')[0]?.trim();if(name)document.cookie=encodeURIComponent(decodeURIComponent(name))+'=; Max-Age=0; path='+path+'; SameSite=Lax';});
   }
   const next=new URL(location.href);next.searchParams.set('_refresh',Date.now().toString());location.replace(next.href);
  }catch(e){setUpdateStatus(uiText('Δεν έγινε ανανέωση: ','Could not refresh: ')+e.message);}
 }
 function resetLocalData(){
  if(!confirm(uiText('ΠΡΟΣΟΧΗ: Θα διαγραφούν όλοι οι αποθηκευμένοι χαρακτήρες και εικόνες σε αυτή τη συσκευή. Πάρε πρώτα JSON Backup. Συνέχεια;','WARNING: Deletes ALL saved characters and portraits on this device. Export JSON backup first. Continue?')))return;
  if(!confirm(uiText('Τελική επιβεβαίωση: διαγραφή τοπικών δεδομένων;','Final confirmation: delete local data?')))return;
  localStorage.removeItem(KEY);localStorage.removeItem(VIEWKEY);location.reload();
 }

 function rollDice(formula,label){let s=String(formula).replace(/\s/g,'').toLowerCase();if(!/^([+-]?(?:\d{0,2}d(?:4|6|8|10|12|20|100)|\d{1,4}))(?:[+-](?:\d{0,2}d(?:4|6|8|10|12|20|100)|\d{1,4}))*$/i.test(s)){toast('Μη έγκυρο dice formula. Παράδειγμα: 2d6+3');return null;}let chunks=s.match(/[+-]?[^+-]+/g)||[],sum=0,parts=[];for(let chunk of chunks){let sign=chunk[0]==='-'?-1:1,term=chunk.replace(/^[+-]/,'');if(term.includes('d')){let [count,die]=term.split('d').map(Number);count=count||1;if(count>30){toast('Max 30 dice ανά term.');return null;}let numbers=Array.from({length:count},()=>1+Math.floor(Math.random()*die));sum+=sign*numbers.reduce((a,b)=>a+b,0);parts.push(`${sign<0?'-':''}[${numbers.join(', ')}]`);}else{sum+=sign*+term;parts.push((sign<0?'-':'+')+term);}}let ch=c();ch.rolls=[{id:uid(),label:label||'Roll',formula:s,parts:parts.join(' '),total:sum},...(ch.rolls||[])].slice(0,50);save();toast(`${label||s}: ${sum}  (${parts.join(' ')})`);return sum;}
 function update(){save();renderApp();}
 function safeFocusSearch(q){let el=document.querySelector(q);if(el){let p=el.selectionStart;el.focus();try{el.setSelectionRange(p,p);}catch{}}}
 function updatePicker(kind){let list=kind==='feats'?D.feats:kind==='maneuvers'?D.maneuvers:D.spells, owned=kind==='feats'?c().feats:kind==='maneuvers'?c().maneuvers:c().spellbook.map(x=>x.ref).filter(Boolean);let q=document.querySelector('[data-picker-search]')?.value||'';let root=document.getElementById('picker-results');if(root){root.innerHTML=pickerRows(list.filter(x=>x.name.toLowerCase().includes(q.toLowerCase())||x.summary?.toLowerCase().includes(q.toLowerCase())||L.summary(x)?.toLowerCase().includes(q.toLowerCase())),owned,kind);L.translateRoot(root);}}
 function currentPickerKind(){return document.querySelector('[data-picker-search]')?.dataset.pickerKind||null;}
 function tryToggleRef(id){const ch=c(),ref=findReference(id);if(!ref)return;let arr=ref.kind==='Feat'?ch.feats:ref.kind==='Maneuver'?ch.maneuvers:null;if(arr){if(arr.includes(id)){ch[ref.kind==='Feat'?'feats':'maneuvers']=arr.filter(x=>x!==id);toast('Removed from character.');}else {arr.push(id);toast('Added to character.');}}else if(ref.kind==='Spell'){let existing=ch.spellbook.find(x=>x.ref===id);if(existing){ch.spellbook=ch.spellbook.filter(x=>x!==existing);toast('Spell removed.');}else {ch.spellbook.push({id:uid(),ref:id,name:ref.name,prepared:true});toast('Spell added.');}}save();}
 function classUpdateResources(ch){const fighter=ch.classes.find(x=>x.name==='Fighter');if(fighter){let wind=ch.resources.find(x=>x.name==='Second Wind');if(wind){let n=fighter.level>=4?fighter.level>=10?4:3:2;if(wind.max<n){wind.current+=(n-wind.max);wind.max=n;}}let surge=ch.resources.find(x=>x.name==='Action Surge');if(fighter.level>=2&&!surge)ch.resources.push({id:uid(),name:'Action Surge',current:1,max:1,recharge:'short',detail:'Extra action'});}if(ch.hitDice)ch.hitDice.max=totalLevel(ch);}
 function handleForm(action,v){let ch=c(),id=action.split(':')[1],n=x=>Number(v[x])||0;
 switch(action.split(':')[0]){
  case 'create-character':{
   if(!v.name.trim())return toast('Το όνομα είναι υποχρεωτικό.');let q=defaultChar(v.name.trim(),v.class);q.classes[0].subclass=(v.subclass0||'').trim();q.species=v.species;q.background=v.background;q.player=v.player;characters.push(q);selectedId=q.id;view='overview';break;}
  case 'atlas-save-story':{ch.backgroundStory=v.story||'';ch.storyPublic=v.storyPublic==='true';break;}
  case 'save-profile':{
   ch.name=v.name.trim()||ch.name;ch.player=v.player;ch.species=v.species;ch.background=v.background;ch.alignment=v.alignment;ch.speed=clamp(n('speed'),0,300);ch.initiativeBonus=n('initiativeBonus');ch.proficiencyOverride=v.proficiencyOverride;ch.passivePerceptionOverride=v.passivePerceptionOverride;ch.rulesVersion='2024';ch.languages=v.languages;ch.proficiencies=v.proficiencies;break;}
  case 'save-custom-feat':{if(!(v.name||'').trim())return toast(uiText('Δώσε όνομα feat.','Enter a feat name.'));ch.customFeats=ch.customFeats||[];ch.customFeats.push({id:uid(),name:v.name.trim(),tier:v.tier||'Custom',summary:v.summary||''});break;}
  case 'save-abilities':for(let k of Object.keys(D.abilities))ch.abilities[k]=clamp(n(k),1,30);break;
  case 'save-classes':{
   let arr=[];for(let i=0;i<3;i++)if(v['class'+i]&&n('level'+i)>0)arr.push({name:v['class'+i],level:clamp(n('level'+i),1,20),subclass:(v['subclass'+i]||'').trim()});if(!arr.length)return toast('Χρειάζεται τουλάχιστον μία κλάση.');if(arr.reduce((s,x)=>s+x.level,0)>20)return toast('Το συνολικό level δεν μπορεί να υπερβαίνει το 20.');ch.classes=arr;classUpdateResources(ch);break;}
  case 'save-loadouts':{
   let x=[];for(let i=0;i<5;i++)if(v['name'+i]?.trim())x.push({id:ch.loadouts?.[i]?.id||uid(),name:v['name'+i],ac:clamp(n('ac'+i),0,99)});if(!x.length)return toast('Χρειάζεται ένα loadout.');ch.loadouts=x;ch.activeLoadout=clamp(ch.activeLoadout||0,0,x.length-1);break;}
  case 'save-attack':{
   if(!v.name.trim())return toast('Συμπλήρωσε όνομα όπλου.');let a=ch.attacks.find(x=>x.id===id);const d={id:a?.id||uid(),name:v.name.trim(),ability:v.ability,damage:v.damage||'1d8',type:v.type,mastery:v.mastery,proficient:a?.proficient!==false,proficiencyMode:v.proficiencyMode||'auto',magicBonus:n('magicBonus'),damageBonus:n('damageBonus'),bonusOverride:v.bonusOverride,notes:v.notes};if(a)Object.assign(a,d);else ch.attacks.push(d);break;}
  case 'save-resource':{
   if(!v.name.trim())return toast('Συμπλήρωσε όνομα resource.');let a=ch.resources.find(x=>x.id===id),max=clamp(n('max'),0,999);const d={id:a?.id||uid(),name:v.name,max,current:clamp(n('current'),0,max),recharge:v.recharge,detail:v.detail};if(a)Object.assign(a,d);else ch.resources.push(d);break;}
  case 'save-feature':{
   if(!v.name.trim())return toast('Συμπλήρωσε όνομα feature.');let a=ch.features.find(x=>x.id===id),d={id:a?.id||uid(),name:v.name,source:v.source,level:n('level'),action:v.action,detail:v.detail};if(a)Object.assign(a,d);else ch.features.push(d);break;}
  case 'save-item':{
   if(!v.name.trim())return toast('Συμπλήρωσε όνομα αντικειμένου.');let a=ch.inventory.find(x=>x.id===id),d={consumablePreset:v.category==='consumable'?((ATLAS_CONSUMABLES_2024[v.consumablePreset]&&v.name.trim()===ATLAS_CONSUMABLES_2024[v.consumablePreset].name)?v.consumablePreset:'custom'):'',id:a?.id||uid(),name:v.name,qty:clamp(n('qty'),0,9999),weight:clamp(n('weight'),0,9999),equipped:v.equipped==='true',weaponType:v.weaponType||'',category:v.category||'',effectKind:v.effectKind||'none',effectCondition:v.effectCondition||'',weaponStatus:weaponStates.includes(v.weaponStatus)?v.weaponStatus:'normal',weaponStatusNote:v.weaponStatusNote||'',description:v.description};if(a)Object.assign(a,d);else ch.inventory.push(d);break;}
  case 'save-owned-spell':{
   if(!v.name.trim())return toast('Συμπλήρωσε όνομα spell.');let a=ch.spellbook.find(x=>x.id===id),d={id:a?.id||uid(),ref:a?.ref||'',name:v.name,level:n('level'),school:v.school,cast:v.cast,range:v.range,duration:v.duration,components:v.components,summary:v.summary,damage:v.damage,damageType:v.damageType,upcastBonus:v.upcastBonus,damageNote:v.damageNote,effectKind:v.effectKind,prepared:v.prepared==='true',concentration:/conc/i.test(v.duration)};if(a)Object.assign(a,d);else ch.spellbook.push(d);break;}
  case 'save-spell-setup':{
   ch.spellAbility=v.spellAbility;ch.spellDCOverride=v.spellDCOverride;ch.spellAttackOverride=v.spellAttackOverride;let s={};for(let i=1;i<=9;i++){let max=clamp(n('slot'+i),0,20),prev=ch.slots?.[i];if(max)s[i]={max,used:clamp(prev?.used||0,0,max)};}ch.slots=s;ch.pact={level:clamp(n('pactLevel'),1,5),max:clamp(n('pactMax'),0,4),used:clamp(ch.pact?.used||0,0,n('pactMax'))};break;}
  case 'save-currency':ch.currency={};for(let k of ['cp','sp','ep','gp','pp'])ch.currency[k]=clamp(n(k),0,100000000);break;
  case 'save-journal':{
   if(!v.title.trim())return toast('Συμπλήρωσε τίτλο.');let a=ch.journal.find(x=>x.id===id),d={id:a?.id||uid(),title:v.title,date:v.date,text:v.text};if(a)Object.assign(a,d);else ch.journal.push(d);break;}
  case 'save-hp':{
   let mode=action.split(':')[1];if(mode==='hp-edit'){ch.hp.max=clamp(n('max'),1,99999);ch.hp.current=clamp(n('current'),0,ch.hp.max);ch.hp.temp=clamp(n('temp'),0,9999);}else if(mode==='hp-heal'){ch.hp.current=clamp(ch.hp.current+Math.max(0,n('amount')),0,ch.hp.max);}else{let dmg=Math.max(0,n('amount'));let t=Math.min(ch.hp.temp||0,dmg);ch.hp.temp-=t;ch.hp.current=clamp(ch.hp.current-(dmg-t),0,ch.hp.max);}break;}
  case 'save-companion':{if(!v.name.trim())return toast('Companion name required.');ch.companions=ch.companions||[];let a=ch.companions.find(x=>x.id===id),d={id:a?.id||uid(),name:v.name,type:v.type,maxHp:clamp(n('maxHp'),1,9999),hp:clamp(n('hp'),0,n('maxHp')),ac:clamp(n('ac'),0,99),speed:clamp(n('speed'),0,999),description:v.description};if(a)Object.assign(a,d);else ch.companions.push(d);break;}
  case 'save-hitdice':ch.hitDice={max:clamp(n('max'),1,20),used:clamp(n('used'),0,n('max'))};break;
  case 'apply-levelup':{
   const newLevel=totalLevel(ch)+1;if(newLevel>20)return toast('Maximum level 20.');let clazz=ch.classes.find(x=>x.name===v.className);if(!clazz)return toast('Class not found.');clazz.level++;const milestones=window.ATLAS_PROGRESSION_2024?.[clazz.name]?.[clazz.level-1]?.features||[];ch.pendingChoices2024=ch.pendingChoices2024||[];for(const feature of milestones.filter(x=>/Ability Score Improvement|Epic Boon|Subclass feature|Weapon Mastery|Metamagic|Fighting Style|Expertise/i.test(x))){const key='level-'+clazz.name+'-'+clazz.level+'-'+feature;if(!ch.pendingChoices2024.some(x=>x.key===key))ch.pendingChoices2024.push({key,label:clazz.name+' Lv'+clazz.level+': '+feature,notes:'Confirm the 2024 choice with your DM.',status:'pending'});}ch.hp.max=Math.max(1,ch.hp.max+n('hpGain'));ch.hp.current=Math.min(ch.hp.max,ch.hp.current+Math.max(0,n('hpGain')));classUpdateResources(ch);toast('Level up! Update feats/spells/features manually.');break;}
  default:return toast('Unknown form action: '+action);
 }
 closeModal();update();toast('Saved locally ✓');}

 function atlasToggleStory(){const el=document.getElementById('atlas-story-text');const b=document.getElementById('atlas-story-toggle');if(!el)return;let opened=el.classList.toggle('expanded');if(b)b.textContent=opened?'Collapse ↑':'Expand ↓';}
 function atlasEditStory(){formModal(tr('Ιστορία χαρακτήρα','Background Story'),`<div class="field wide"><label>${tr('Πλήρης ιστορία','Full character history')}</label><textarea name="story" rows="12" style="min-height:260px">${esc(c().backgroundStory||'')}</textarea></div><div class="field wide"><label>${tr('Ορατότητα','Visibility')}</label><select name="storyPublic"><option value="false" ${c().storyPublic!==true?'selected':''}>${tr('Ιδιωτική — τη βλέπω εγώ και ο DM','Private — only me and DM')}</option><option value="true" ${c().storyPublic===true?'selected':''}>${tr('Δημόσια — τη βλέπουν όλοι','Public — visible to everyone')}</option></select></div>`,'atlas-save-story',tr('Η ιδιωτικότητα επιβάλλεται από τον server.','Privacy is enforced server-side.'));}
 function eventAction(action){const ch=c(),[key,id]=action.split(':');switch(key){
  case 'check-updates':checkUpdates(true);break;
  case 'reload-app':refreshApp(false);break;
  case 'clear-app-cache':refreshApp(true);break;
  case 'reset-local-data':resetLocalData();break;
  case 'dismiss-update':document.getElementById('atlas-update-banner')?.remove();break;
  case 'portrait':portraitDialog();break;
  case 'choose-portrait':document.getElementById('portrait-file')?.click();break;
  case 'remove-portrait':{const old=ch.portrait;ch.portrait='';try{localStorage.setItem(KEY,JSON.stringify({characters,selectedId}));}catch(e){ch.portrait=old;return toast('Could not save.');}closeModal();renderApp();toast('Character image removed.');break;}
  case 'atlas-edit-story':atlasEditStory();break;
  case 'atlas-toggle-story':atlasToggleStory();break;
  case 'new-character':atlasBuilderOpen();break;
  case 'level-progression':showProgression();break;
  case 'download-docx-template':window.ATLAS_DOCX?.template();break;
  case 'download-character-docx':window.ATLAS_DOCX?.exportCharacter(c());break;
  case 'edit-json':document.getElementById('edit-json-file')?.click();break;
  case 'choose-docx':document.getElementById('import-docx-file')?.click();break;
  case 'portrait-drive':selectDrivePortrait();break;
  case 'portrait-drive-select':{const choice=campaignImages.find(x=>x.id===id);if(!choice)return;ch.portrait=choice.path;closeModal();update();toast(tr('Η εικόνα ενημερώθηκε.','Portrait updated.'));break;}case 'edit-character':editChar();break;case 'edit-abilities':editAbilities();break;case 'edit-classes':editClasses();break;case 'edit-loadouts':editLoadouts();break;
  case 'add-attack':editAttack('');break;case 'add-resource':editResource('');break;case 'add-feature':editFeature('');break;case 'add-item':atlasAddItemKind();break;case 'choose-item-kind':id==='custom'?editItem('','custom'):atlasCanonItemPicker(id);break;case 'canon-item-add':atlasAddCanonicalItem(id);break;case 'add-spell':editOwnedSpell('');break;case 'add-journal':editJournal('');break;case 'add-companion':editCompanion('');break;
  case 'add-selected-reference':{const id=document.getElementById('atlas-reference-select')?.value;if(!id)return toast(uiText('Διάλεξε πρώτα μία επιλογή.','Choose an entry first.'));tryToggleRef(id);updatePicker(currentPickerKind());return;}
  case 'details-selected-reference':{const id=document.getElementById('atlas-reference-select')?.value;if(!id)return toast(uiText('Διάλεξε πρώτα μία επιλογή.','Choose an entry first.'));detailRef(id);return;}
  case 'add-custom-feat':createCustomFeat();break;
  case 'toggle-selected-condition':{const id=document.getElementById('atlas-condition-pick')?.value;if(!id)return toast(uiText('Επίλεξε condition.','Choose a condition.'));const conditions=ch.conditions||[];ch.conditions=conditions.includes(id)?conditions.filter(x=>x!==id):[...conditions,id];save();conditionsModal();return;}
  case 'add-custom-language':{const inp=document.getElementById('language-custom-input');if(!inp||!inp.value.trim())return;addLanguage(inp.value);inp.value='';document.getElementById('language-custom-box').style.display='none';document.getElementById('atlas-language-pick').value='';return;}
  case 'pick-feats':chooseReference('feats');break;case 'pick-maneuvers':chooseReference('maneuvers');break;case 'browse-spells':chooseReference('spells');break;
  case 'edit-spell-setup':editSpellSetup();break;case 'edit-currency':editCurrency();break;case 'edit-hitdice':editHitDice();break;case 'hp-edit':case 'hp-damage':case 'hp-heal':editHP(key);break;
  case 'short-rest':rest('short');break;case 'long-rest':rest('long');break;case 'settings':settings();break;case 'backup':backup();break;
  case 'level-up':levelUp();break;case 'open-roller':toast(tr('Δεν υπάρχουν ψηφιακές ζαριές. Χρησιμοποίησε πραγματικά ζάρια.','Digital dice are disabled. Use physical dice.'));break;case 'conditions':conditionsModal();break;
  case 'change-loadout':ch.activeLoadout=((ch.activeLoadout||0)+1)%ch.loadouts.length;update();break;
  case 'inspiration':ch.inspiration=!ch.inspiration;update();break;
  case 'end-concentration':ch.concentrating='';update();break;
  case 'save-notes':ch.notes=document.getElementById('notes-editor')?.value||'';update();toast('Notes saved.');break;
  case 'save-plan':ch.plan=document.getElementById('plan-editor')?.value||'';update();toast('Plan saved.');break;
  case 'spend-superiority':{let r=ch.resources.find(x=>x.name==='Superiority Dice');if(!r)return toast('Add Superiority Dice resource first.');if(!r.current)return toast('No superiority dice remain.');r.current--;update();toast(`${r.current}/${r.max} Superiority Dice remain`);break;}
  case 'exhaust-up':ch.exhaustion=clamp((ch.exhaustion||0)+1,0,6);update();break;
  case 'exhaust-down':ch.exhaustion=clamp((ch.exhaustion||0)-1,0,6);update();break;
  case 'spend-hitdie':{let h=ch.hitDice||{max:totalLevel(ch),used:0};if(h.used>=h.max)return toast('No Hit Dice remain.');h.used++;update();toast('Hit Die marked used. Enter healing manually in HP to avoid dice rolls.');break;}
  case 'rest-hitdie-open':restHitDiePrompt();break;
  case 'rest-hitdie-apply':{let die=restHitDieSides(ch),el=document.getElementById('atlas-rest-die-roll'),roll=Number(el?.value),h=ch.hitDice||{max:totalLevel(ch),used:0};if(!el?.value||!Number.isInteger(roll)||roll<1||roll>die)return toast(tr('Πληκτρολόγησε έγκυρο αποτέλεσμα ζαριού.','Enter a valid die result.'));if(h.used>=h.max||ch.hp.current>=ch.hp.max)return toast(tr('Δεν χρειάζεται ή δεν είναι διαθέσιμη άλλη θεραπεία.','No more healing is needed or available.'));ch.hitDice=h;let con=Math.floor(((Number(ch.abilities?.CON)||10)-10)/2),heal=Math.max(1,roll+con),before=ch.hp.current;ch.hp.current=Math.min(ch.hp.max,ch.hp.current+heal);h.used++;update();openModal(tr('Θεραπεία από Hit Die','Hit Die healing'),`<p class="detail-description">${tr('Ανάκτησες','Recovered')} <b>${ch.hp.current-before} HP</b> (${roll} ${signed(con)} = ${heal}, ${tr('μέχρι το Max HP','capped at Max HP')}).</p><p>${tr('Τωρινά HP','Current HP')}: <b>${ch.hp.current}/${ch.hp.max}</b> · ${tr('Hit Dice που απομένουν','Hit Dice left')}: <b>${h.max-h.used}/${h.max}</b>.</p>`,(h.used<h.max&&ch.hp.current<ch.hp.max?btn(tr('Άλλο 1 Hit Die','Spend another Hit Die'),'rest-hitdie-open','primary'):'')+btn(tr('Τέλος','Done'),'close-modal'));break;}
  case 'confirm-rest':{
   const isLong=id==='long',changes=[];if((ch.hp.current||0)<=0)return toast(tr('Χρειάζεσαι τουλάχιστον 1 HP για να αρχίσεις Rest.','You need at least 1 HP to begin a Rest.'));
   if(isLong){const previous=ch.hp.current,hd=ch.hitDice||(ch.hitDice={max:totalLevel(ch),used:0});ch.hp.current=ch.hp.max;changes.push(`HP: ${previous} → ${ch.hp.max}`);if(hd.used>0)changes.push(`Hit Dice: +${hd.used} (${hd.max}/${hd.max})`);hd.used=0;const oldEx=ch.exhaustion||0;if(oldEx){ch.exhaustion=Math.max(0,oldEx-1);changes.push(`Exhaustion: ${oldEx} → ${ch.exhaustion}`);}ch.death={success:0,fail:0};for(const [level,slot] of Object.entries(ch.slots||{})){if(slot.used>0){changes.push(`Spell Slots Lv ${level}: +${slot.used}`);slot.used=0;}}if(ch.species==='Human'&&!ch.inspiration){ch.inspiration=true;changes.push('Heroic Inspiration (Human · Resourceful)');}}
   for(const r of ch.resources||[]){let before=Number(r.current)||0,maximum=Number(r.max)||0;if(isLong){if(r.recharge!=='manual')r.current=maximum;}else if(r.recharge==='short')r.current=maximum;else if(r.recharge==='short1')r.current=Math.min(maximum,before+1);if(r.current>before)changes.push(`${r.name}: +${r.current-before} (${r.current}/${maximum})`);}
   if(ch.pact?.max&&ch.pact.used>0){changes.push(`Pact Magic: +${ch.pact.used}`);ch.pact.used=0;}
   if(ch.concentrating){ch.concentrating='';changes.push(tr('Συγκέντρωση τερματίστηκε','Concentration ended'));}
   closeModal();update();restReport(id,changes);break;}
  case 'remove-custom-feat':ch.customFeats=(ch.customFeats||[]).filter(x=>x.id!==id);closeModal();update();break;
  case 'close-modal':closeModal();break;
  case 'edit-feature':editFeature(id);break;case 'edit-companion':editCompanion(id);break;case 'companion-hp':{let [_,cid,amount]=action.split(':'),z=(ch.companions||[]).find(x=>x.id===cid);if(z){z.hp=clamp(z.hp+Number(amount),0,z.maxHp);closeModal();update();companionDetail(cid);}break;}case 'edit-resource':editResource(id);break;case 'edit-item':editItem(id);break;case 'edit-journal':editJournal(id);break;
  case 'spend-resource':{let r=ch.resources.find(x=>x.id===id);if(!r)return;if(r.current>0){r.current--;closeModal();update();}else toast('No uses remaining.');break;}
  case 'roll-manual':toast(tr('Δεν υπάρχουν ψηφιακές ζαριές. Χρησιμοποίησε πραγματικά ζάρια.','Digital dice are disabled. Use physical dice.'));break;
  case 'import':document.getElementById('import-file')?.click();break;
  case 'import-character':document.getElementById('import-character-file')?.click();break;
  case 'pending-choices':showPendingChoices();break;
  case 'pending-edit':editPendingChoice(Number(id));break;
  default:toast(`Unknown action ${action}`);
 }}
 function castSpell(token){const [id,type,level]=token.split(':');let ch=c(),s=ch.spellbook.find(x=>x.id===id);if(!s)return;let d=findReference(s.ref);if(type==='slot'){let slot=ch.slots?.[level];if(!slot||slot.used>=slot.max)return toast('No slots available.');slot.used++;}else if(type==='pact'){if(!ch.pact||ch.pact.used>=ch.pact.max)return toast('No pact slots.');ch.pact.used++;}if(d?.concentration||s.concentration)ch.concentrating=s.name;closeModal();update();toast('Cast: '+s.name+(type==='slot'?' using slot L'+level:type==='pact'?' using Pact Slot':' (cantrip)'));}
 function deleteItem(kind,id){let ch=c(),mapping={'character':characters,attack:ch.attacks,resource:ch.resources,feature:ch.features,item:ch.inventory,spell:ch.spellbook,journal:ch.journal,companion:ch.companions||[]},obj=mapping[kind];if(!obj)return;if(kind==='character'&&(!cloud.enabled||!['creator','dm'].includes(cloud.user?.role||''))){toast(tr('Μόνο ο Creator και ο DM διαγράφουν χαρακτήρες.','Only Creator or DM can delete characters.'));return;}const item=obj.find(x=>x.id===id);if(!item)return;let name=item.name||item.title;if(!confirm(`Delete ${name}? This cannot be undone.`))return;if(kind==='character'){cloudRequest('/characters/'+encodeURIComponent(id),'DELETE').then(()=>cloudRefresh()).then(()=>{closeModal();toast(tr('Ο χαρακτήρας διαγράφηκε.','Character deleted.'));}).catch(err=>toast(err.message));return;}else ch[kind==='attack'?'attacks':kind==='resource'?'resources':kind==='feature'?'features':kind==='item'?'inventory':kind==='spell'?'spellbook':kind==='companion'?'companions':'journal']=obj.filter(x=>x.id!==id);closeModal();update();toast('Deleted.');}
 /* v1.7 prototype: guided new-character builder. Does not modify existing characters. */
 const B_SKILLS=['Acrobatics','Animal Handling','Athletics','History','Insight','Intimidation','Perception','Persuasion','Survival'];
 const B_ORIGINS=D.feats.filter(f=>f.tier==='Origin');
 const B_LANGUAGES=['Common Sign Language','Draconic','Dwarvish','Elvish','Giant','Gnomish','Goblin','Halfling','Orc'];
 const B_STYLES=['Archery','Blind Fighting','Defense','Dueling','Great Weapon Fighting','Interception','Protection','Thrown Weapon Fighting','Two-Weapon Fighting','Unarmed Fighting'];
 const B_ARTISAN=['Alchemist’s Supplies','Brewer’s Supplies','Calligrapher’s Supplies','Carpenter’s Tools','Cartographer’s Tools','Cobbler’s Tools','Cook’s Utensils','Glassblower’s Tools','Jeweler’s Tools','Leatherworker’s Tools','Mason’s Tools','Painter’s Supplies','Potter’s Tools','Smith’s Tools','Tinker’s Tools','Weaver’s Tools','Woodcarver’s Tools'];
 const B_GAMES=['Dice Set','Dragonchess Set','Playing Card Set','Three-Dragon Ante Set'];
 const B_WEAPONS=['Greatsword','Battleaxe','Spear','Trident','Longsword','Warhammer','War Pick','Rapier','Longbow','Shortbow','Dagger','Light Crossbow','Handaxe','Maul','Glaive','Pike','Halberd','Quarterstaff'];
 let B=null;
 const bSel=(name,options,current='',hint='')=>`<div class="b-field"><label>${esc(name)}</label><select data-b-field="${attr(hint||name)}">${options.map(x=>{const value=Array.isArray(x)?x[0]:x,text=Array.isArray(x)?x[1]:x;return `<option value="${attr(value)}" ${String(value)===String(current)?'selected':''}>${esc(text)}</option>`}).join('')}</select></div>`;
 const bInput=(label,key,value='',type='text')=>`<div class="b-field"><label>${esc(label)}</label><input data-b-field="${attr(key)}" type="${type}" value="${attr(value)}" ${type==='number'?'min="1" max="20"':''}/></div>`;
 function atlasBuilderOpen(){B={step:0,name:'New Adventurer',player:'',class:'Fighter',species:'Human',background:'Soldier',level:1,alignment:'Neutral Good',size:'Medium',rules:'2024',dmOverride:false,dmReason:'',method:'Standard Array',base:{STR:15,DEX:14,CON:13,INT:8,WIS:10,CHA:12},boostA:'STR',boostB:'CON',boostPattern:'2+1',skills:{fighter1:'Perception',fighter2:'Survival',human:'Medicine',bm:''},originFeat:'feat-tough',fightingStyle:'Protection',subclass:'',maneuvers:[],weapons:['Greatsword','Spear','Battleaxe'],languages:['Giant','Gnomish'],spells:[],story:'',portrait:'',equipment:'Chain Mail, Shield, Greatsword, Spear',artisanTool:'',gamingSet:'Dice Set',passiveOverride:'',acceptManual:false};bRender();}
 function bClose(){document.getElementById('builder-root').innerHTML='';document.body.classList.remove('building');B=null;}
 function bG(name){return B?.[name]||'';}
 function bStep(n){if(!B)return;B.step=clamp(n,0,7);bRender();document.getElementById('builder-root').querySelector('.b-scroll')?.scrollTo(0,0);}
 function bFields(){const b=B;const lang=(i)=>bSel('Language '+(i+1),[['','— Select —'],...B_LANGUAGES],b.languages[i],'language'+i);
 switch(b.step){
 case 0:return `<div class="b-intro"><span class="b-icon">⚖</span><div><h2>Rules & Campaign</h2><p>Ο Builder ακολουθεί D&D 2024. Περιεχόμενο που δεν έχει ακόμη μηχανοποιηθεί θα απαιτεί έλεγχο DM, όχι σιωπηρή έγκριση.</p></div></div><div class="b-grid">${bSel('Ruleset',[['2024','D&D 2024 · Player’s Handbook']],b.rules,'rules')}<div class="b-field"><label>Source material</label><div class="b-locked">Player’s Handbook 2024 <span>Core</span></div></div></div><div class="b-notice">ℹ Υλοποιημένος λεπτομερής έλεγχος: Human + Fighter + Soldier (levels 1–3). Άλλα combinations εμφανίζονται ως “DM review required”.</div><label class="b-checkbox"><input type="checkbox" data-b-checkbox="dmOverride" ${b.dmOverride?'checked':''}> Enable DM Overrides for unsupported or homebrew combinations</label>${b.dmOverride?`<div class="b-field"><label>DM override reason</label><textarea data-b-field="dmReason" placeholder="Explain the house rule">${esc(b.dmReason)}</textarea></div>`:''}`;
 case 1:return `<div class="b-grid">${bInput('Character name','name',b.name)}${bInput('Player (optional)','player',b.player)}${bSel('Class',Object.keys(D.classes),b.class,'class')}${bSel('Species',D.species,b.species,'species')}${bSel('Background',D.background,b.background,'background')}${bSel('Starting level',Array.from({length:20},(_,i)=>String(i+1)),String(b.level),'level')}${bSel('Size',['Medium','Small'],b.size,'size')}${bSel('Alignment',['Lawful Good','Neutral Good','Chaotic Good','Lawful Neutral','Neutral','Chaotic Neutral','Lawful Evil','Neutral Evil','Chaotic Evil','Unaligned'],b.alignment,'alignment')}</div><div class="b-notice">${b.class==='Fighter'?'✓ Fighter chosen. Subclass unlocks at Fighter level 3.':'△ Selected class needs a manual rule review until its complete class package is implemented.'} ${b.species==='Human'&&b.background==='Soldier'?'✓ Human & Soldier core rules available.':'△ This origin combination currently needs DM review.'}</div>`;
 case 2:{const final=bFinalAbilities();return `<div class="b-grid">${bSel('Ability Score Method',['Standard Array','Point Buy','Manual / Rolled'],b.method,'method')}${bSel('Background increase',['2+1','1+1+1'],b.boostPattern,'boostPattern')}</div><div class="b-ability-grid">${Object.keys(D.abilities).map(k=>`<div class="b-ability"><label>${k}</label><input type="number" min="3" max="20" data-b-ability="${k}" value="${b.base[k]}"><strong>${final[k]}</strong><small>final</small></div>`).join('')}</div><div class="b-grid">${bSel('Primary bonus ability', ['STR','DEX','CON','INT','WIS','CHA'],b.boostA,'boostA')}${bSel('Secondary bonus ability', ['STR','DEX','CON','INT','WIS','CHA'],b.boostB,'boostB')}${b.boostPattern==='1+1+1'?bSel('Third bonus ability', ['STR','DEX','CON','INT','WIS','CHA'],b.boostC||'DEX','boostC'):''}</div><div class="b-notice">Soldier background: ability increases must be applied to STR / DEX / CON. Standard Array must use 15, 14, 13, 12, 10, 8 exactly once. Point Buy validation uses 27 points.</div>`;}
 case 3:{const soldier=b.background==='Soldier',fighter=b.class==='Fighter',human=b.species==='Human',fighterOpts=[['','— Choose Fighter skill —'],...B_SKILLS.map(s=>[s,s])],allOpts=[['','— Choose any skill —'],...D.skills.map(x=>[x[0],x[0]])];return `<div class="b-subheading">SKILL PROFICIENCIES <span>Each source is separate</span></div><div class="b-locked-list">${soldier?'<span>● Athletics <small>Soldier · fixed</small></span><span>● Intimidation <small>Soldier · fixed</small></span>':'<span>⚠ Background skills require DM review</span>'}</div><div class="b-grid">${fighter?bSel('Fighter skill 1',fighterOpts,b.skills.fighter1,'skill:fighter1')+bSel('Fighter skill 2',fighterOpts,b.skills.fighter2,'skill:fighter2'):'<div class="b-notice">The chosen class skill list is not yet fully validated in this prototype.</div>'}${human?bSel('Human · Skillful (any skill)',allOpts,b.skills.human,'skill:human'):'<div class="b-notice">Non-Human species features require DM review.</div>'}${fighter&&Number(b.level)>=3&&b.subclass==='Battle Master'?bSel('Student of War · Fighter skill',fighterOpts,b.skills.bm,'skill:bm'):''}</div><div class="b-subheading">LANGUAGES <span>Common is automatic</span></div><div class="b-locked-list"><span>● Common <small>automatic</small></span></div><div class="b-grid">${lang(0)}${lang(1)}</div><div class="b-subheading">TOOL PROFICIENCIES</div><div class="b-grid">${soldier?bSel('Soldier · Gaming Set',B_GAMES,b.gamingSet,'gamingSet'):''}${fighter&&Number(b.level)>=3&&b.subclass==='Battle Master'?bSel('Student of War · Artisan’s Tool',[['','— Choose Artisan’s Tool —'],...B_ARTISAN],b.artisanTool,'artisanTool'):''}</div><div class="b-notice">Choose two different Standard Languages. Additional languages require an explicit feature or DM approval.</div>`;}
 case 4:{const subs=D.classes[b.class]?.subs.filter(x=>!x.includes('legacy')&&!x.includes('Custom'))||[],bm=b.class==='Fighter'&&Number(b.level)>=3&&b.subclass==='Battle Master';return `<div class="b-subheading">CLASS FEATURES <span>Granted automatically; not a shopping list</span></div><div class="b-locked-list">${b.class==='Fighter'?['Second Wind · Fighter 1','Weapon Mastery · Fighter 1','Fighting Style · Fighter 1',...(Number(b.level)>=2?['Action Surge · Fighter 2','Tactical Mind · Fighter 2']:[]),...(Number(b.level)>=3?['Fighter Subclass · Fighter 3']:[])].map(s=>`<span>✓ ${s}</span>`).join(''):'<span>△ Automatic class features pending full rules coverage</span>'}</div><div class="b-grid">${b.class==='Fighter'?bSel('Fighting Style',B_STYLES,b.fightingStyle,'fightingStyle'):''}${b.species==='Human'?bSel('Human · Versatile Origin Feat',B_ORIGINS.map(f=>[f.id,f.name]),b.originFeat,'originFeat'):''}${Number(b.level)>=3?bSel('Subclass',[['','— Choose subclass —'],...subs],b.subclass,'subclass'):'<div class="b-locked">Subclass: unlocks at level 3</div>'}</div>${b.class==='Fighter'?`<div class="b-subheading">WEAPON MASTERIES <span>Select 3 weapon types</span></div><div class="b-grid">${[0,1,2].map(i=>bSel('Mastery '+(i+1),B_WEAPONS,b.weapons[i]||'','weapon:'+i)).join('')}</div>`:''}${bm?`<div class="b-subheading">STUDENT OF WAR <span>2 required selections</span></div><div class="b-grid">${bSel('Additional Fighter Skill',[['','— Choose Fighter Skill —'],...B_SKILLS],b.skills.bm,'skill:bm')}${bSel('Artisan’s Tool Proficiency',[['','— Choose Artisan’s Tool —'],...B_ARTISAN],b.artisanTool,'artisanTool')}</div><div class="b-subheading">BATTLE MASTER MANEUVERS <span>${b.maneuvers.length}/3 selected</span></div><div class="b-maneuver-grid">${D.maneuvers.map(m=>`<label class="b-checktile ${b.maneuvers.includes(m.id)?'selected':''}"><input type="checkbox" data-b-maneuver="${m.id}" ${b.maneuvers.includes(m.id)?'checked':''} ${b.maneuvers.length>=3&&!b.maneuvers.includes(m.id)?'disabled':''}><span>${esc(m.name)}</span><small title="${attr(m.summary)}">ⓘ</small></label>`).join('')}</div><div class="b-notice">Also grants 4d8 Superiority Dice and Student of War (one Fighter skill + one Artisan’s Tool proficiency).</div>`:''}${b.background==='Soldier'?'<div class="b-notice">✓ Soldier automatically grants Savage Attacker. It is not an additional selectable slot.</div>':''}`;}
 case 5:{const cc=D.classes[b.class]||D.classes.Custom, caster=cc.caster!=='none'||b.subclass==='Eldritch Knight';const sl=D.spells.filter(s=>s.classes?.includes(b.class)||b.subclass==='Eldritch Knight'&&s.classes?.includes('Wizard'));return `<div class="b-subheading">SPELLCASTING <span>Depends on class / subclass</span></div>${caster?`<p class="muted">Library entries for <b>${esc(b.class)}</b> are shown below. Cantrips, prepared-spell limits and slot progression still require complete per-class validation, so use DM Review for this demo.</p><div class="b-spell-list">${sl.slice(0,65).map(s=>`<label class="b-checktile"><input type="checkbox" data-b-spell="${s.id}" ${b.spells.includes(s.id)?'checked':''}><span>${esc(s.name)}</span><small>Lv ${s.level||'C'}</small></label>`).join('')||'<p>No indexed spells for this class.</p>'}</div>`:'<div class="b-empty">This class has no default Spellcasting at the selected level. You can skip this step.</div>'}<div class="b-notice">The spell list in this preview is informational: choosing a spell does not by itself establish that it is prepared or legal at this level.</div>`;}
 case 6:return `<div class="b-grid">${bInput('Equipment / starting package','equipment',b.equipment)}${bInput('Passive Perception DM override (optional)','passiveOverride',b.passiveOverride,'number')}</div><div class="b-field"><label>Background Story · full text</label><textarea data-b-field="story" rows="7" placeholder="Character history, motivations, relationships…">${esc(b.story)}</textarea></div><div class="b-field"><label>Portrait (optional)</label><input type="file" accept="image/*" data-b-portrait><small>Image is resized before saving locally.</small>${b.portrait?'<div class="b-portrait-preview"><img src="'+attr(b.portrait)+'" alt="Selected portrait"></div>':''}</div><div class="b-notice">The story is displayed full-width below the large character portrait on Overview. Equipment remains editable after creation.</div>`;
 case 7:{const {errors,review}=bValidate();return `<div class="b-subheading">REVIEW CHARACTER <span>${errors.length?'Issues to resolve':'Ready for review'}</span></div><div class="b-summary"><div><small>CHARACTER</small><b>${esc(b.name)}</b></div><div><small>CLASS</small><b>${esc(b.class)} ${b.level}</b></div><div><small>ORIGIN</small><b>${esc(b.species)} · ${esc(b.background)}</b></div><div><small>SUBCLASS</small><b>${esc(b.subclass||'None')}</b></div><div><small>ORIGIN FEAT</small><b>${esc(D.feats.find(f=>f.id===b.originFeat)?.name||'—')}</b></div><div><small>RULE COVERAGE</small><b>${review?'DM review required':'Core rules checked'}</b></div></div>${errors.length?`<div class="b-errors"><strong>⚠ ${errors.length} issue(s)</strong>${errors.map(e=>`<div>• ${esc(e)}</div>`).join('')}</div>`:'<div class="b-valid">✓ All implemented validations passed. This is not a certification of every published rule.</div>'}${review?`<div class="b-notice">Some rules are not covered by the automated engine. This combination requires a documented DM Override.</div><label class="b-checkbox"><input type="checkbox" data-b-checkbox="dmOverride" ${b.dmOverride?'checked':''}> Mark unsupported rules as DM-approved</label><div class="b-field"><label>DM approval reason</label><textarea data-b-field="dmReason">${esc(b.dmReason)}</textarea></div>`:''}<div class="b-notice">Creating a character stores it only in your browser. It does not replace any existing character.</div>`;}
 }
 }
 function bFinalAbilities(){const s={...B.base},a=B.boostA,b=B.boostB,c=B.boostC||'DEX';if(B.boostPattern==='2+1'){s[a]=(Number(s[a])||0)+2;s[b]=(Number(s[b])||0)+1;}else{[a,b,c].forEach(k=>{s[k]=(Number(s[k])||0)+1;});}return s;}
 function bValidate(){const b=B,e=[],needed=b.class==='Fighter'&&b.species==='Human'&&b.background==='Soldier'&&Number(b.level)<=3;
 if(!b.name.trim())e.push('A character name is required.');
 if(Object.values(b.base).some(x=>!Number.isFinite(Number(x))||Number(x)<3||Number(x)>20))e.push('Base ability scores must be between 3 and 20.');
 if(b.method==='Standard Array'&&JSON.stringify(Object.values(b.base).map(Number).sort((a,z)=>a-z))!==JSON.stringify([8,10,12,13,14,15]))e.push('Standard Array must contain 8, 10, 12, 13, 14, 15 exactly once.');
 if(b.method==='Point Buy'){const costs={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};const nums=Object.values(b.base).map(Number);if(nums.some(n=>!(n in costs))||nums.reduce((s,n)=>s+(costs[n]??99),0)>27)e.push('Point Buy must use values 8–15 with a maximum cost of 27 points.');}
 if(new Set([b.boostA,b.boostB,...(b.boostPattern==='1+1+1'?[b.boostC||'DEX']:[])]).size !== (b.boostPattern==='1+1+1'?3:2))e.push('Ability bonus choices must be different.');
 if(b.background==='Soldier'&&[b.boostA,b.boostB,...(b.boostPattern==='1+1+1'?[b.boostC||'DEX']:[])].some(x=>!['STR','DEX','CON'].includes(x)))e.push('Soldier background increases only STR, DEX or CON.');
 if(b.background==='Soldier'&&!B_GAMES.includes(b.gamingSet))e.push('Soldier background requires a valid Gaming Set proficiency.');
 if(new Set(b.languages).size!==2||b.languages.some(x=>!x||!B_LANGUAGES.includes(x)))e.push('Choose two different Standard Languages.');
 if(needed){const sk=['Athletics','Intimidation',b.skills.fighter1,b.skills.fighter2,b.skills.human,...(Number(b.level)>=3&&b.subclass==='Battle Master'?[b.skills.bm]:[])];if(sk.some(x=>!x)||new Set(sk).size!==sk.length)e.push('Skills must be selected once each, without duplicating background proficiencies.');
 if(!B_SKILLS.includes(b.skills.fighter1)||!B_SKILLS.includes(b.skills.fighter2))e.push('Fighter skills must come from the Fighter skill list.');
 if(!D.skills.some(x=>x[0]===b.skills.human))e.push('Human Skillful requires one valid skill.');
 if(!B_ORIGINS.some(f=>f.id===b.originFeat))e.push('Human Versatile requires one Origin Feat.');
 if(new Set(b.weapons.filter(Boolean)).size!==3||b.weapons.filter(Boolean).length!==3)e.push('Fighter level 1 requires three different Weapon Mastery selections.');
 if(Number(b.level)>=3&&!b.subclass)e.push('Fighter level 3 requires a subclass.');
 if(b.subclass==='Battle Master'&&Number(b.level)>=3){if(!B_SKILLS.includes(b.skills.bm))e.push('Student of War requires one Fighter skill.');if(!B_ARTISAN.includes(b.artisanTool))e.push('Student of War requires an Artisan’s Tool proficiency.');if(b.maneuvers.length!==3)e.push('Battle Master level 3 requires three maneuvers.');}}
 const review=!needed||b.method==='Manual / Rolled'||(b.class==='Fighter'&&Number(b.level)>=3&&!['Battle Master','Champion','Eldritch Knight','Psi Warrior'].includes(b.subclass))||((D.classes[b.class]||{}).caster!=='none');
 if(review&&(!b.dmOverride||!b.dmReason.trim()))e.push('Unsupported or manual rules require DM Override and a reason.');
 return {errors:e,review};}
 function bRender(){if(!B)return;const steps=['Rules','Identity','Abilities','Skills','Features','Spells','Story','Review'],idx=B.step;document.body.classList.add('building');document.getElementById('builder-root').innerHTML=`<div class="atlas-builder" role="dialog" aria-modal="true" aria-label="Create New Character"><header class="b-header"><div><span class="b-brand">✦ D&D ATLAS</span><h1>Character Builder</h1><p>New Character · Guided D&D 2024 rules</p></div><button class="btn" data-bgo="close">✕ Close</button></header><div class="b-layout"><aside class="b-steps">${steps.map((s,i)=>`<button class="b-step ${i===idx?'current':''} ${i<idx?'done':''}" data-bgo="jump:${i}"><span>${i<idx?'✓':i+1}</span><b>${s}</b></button>`).join('')}<div class="b-sidebar-tip">✓ Automatic options<br>🔒 Restricted selections<br>⚖ DM Overrides logged</div></aside><div class="b-scroll"><div class="b-main"><div class="b-step-kicker">STEP ${idx+1} OF ${steps.length}</div><h2>${['Set campaign rules','Who is your character?','Allocate ability scores','Choose proficiencies','Features, feats & subclass','Spellcasting & magic','Equipment & story','Review & create'][idx]}</h2><div class="b-step-detail">${idx===0?`<div class="actions-inline"><button class="btn" type="button" data-action="download-docx-template">${tr('Κατέβασε DOCX template','Download DOCX template')}</button><button class="btn primary" type="button" data-action="choose-docx">${tr('Εισαγωγή συμπληρωμένου DOCX','Import completed DOCX')}</button></div>`:''}${bFields()}</div><div class="b-bottom"><button class="btn" data-bgo="prev" ${idx===0?'disabled':''}>← Back</button><span>Changes are not saved until Create</span>${idx===7?`<button class="btn primary" data-bgo="create">✓ Create Character</button>`:`<button class="btn primary" data-bgo="next">Continue →</button>`}</div></div></div></div></div>`;}
 function bCreate(){if(!B)return;const {errors}=bValidate();if(errors.length){B.step=7;bRender();toast('Resolve the listed issues first.');return;}const b=B,q=defaultChar(b.name.trim(),b.class);q.player=b.player;q.species=b.species;q.background=b.background;q.alignment=b.alignment;q.classes=[{name:b.class,level:Number(b.level),subclass:b.level>=3?b.subclass:''}];q.abilities=bFinalAbilities();q.speed=30;q.backgroundStory=b.story;q.portrait=b.portrait||'';q.languages=['Common',...b.languages].join(', ');q.skillOrigins={};let skills=b.background==='Soldier'?['Athletics','Intimidation']:[];if(b.class==='Fighter')skills.push(b.skills.fighter1,b.skills.fighter2);if(b.species==='Human')skills.push(b.skills.human);if(b.class==='Fighter'&&Number(b.level)>=3&&b.subclass==='Battle Master')skills.push(b.skills.bm);q.skills=Object.fromEntries(skills.filter(Boolean).map(x=>[x,1]));q.proficiencies=[b.background==='Soldier'?'Gaming Set: '+b.gamingSet:'',b.class==='Fighter'&&Number(b.level)>=3&&b.subclass==='Battle Master'?'Artisan’s Tools: '+b.artisanTool:''].filter(Boolean).join('; ');q.feats=b.background==='Soldier'?['feat-savageattacker']:[];if(b.species==='Human'&&b.originFeat&&!q.feats.includes(b.originFeat))q.feats.push(b.originFeat);q.hitDice={max:Number(b.level),used:0};const con=Math.floor((q.abilities.CON-10)/2),die=D.classes[b.class]?.die||8,haveTough=q.feats.includes('feat-tough');const maxHP=die+con+(Number(b.level)-1)*(Math.floor(die/2)+1+con)+(haveTough?2*Number(b.level):0);q.hp={max:Math.max(1,maxHP),current:Math.max(1,maxHP),temp:0};q.features=[];if(b.class==='Fighter'){q.features.push({id:uid(),name:b.fightingStyle+' Fighting Style',source:'Fighter',level:1,action:'Passive',detail:'Selected Fighter fighting style. See corresponding feat for details.'});q.weaponMasteries=b.weapons.slice();if(Number(b.level)>=3&&b.subclass==='Battle Master'){q.studentOfWarTool=b.artisanTool;q.studentOfWarSkill=b.skills.bm;q.studentOfWarSkillPreviousRank=0;q.maneuvers=[...b.maneuvers];q.resources.push({id:uid(),name:'Superiority Dice',current:4,max:4,recharge:'short',detail:'d8 · Battle Master'});}}
 classUpdateResources(q);q.passivePerceptionOverride=b.passiveOverride.trim()===''?'':Number(b.passiveOverride);if(b.dmOverride)q.dmRuleOverrides=[{reason:b.dmReason||'Approved by DM',version:'2024',date:new Date().toISOString().slice(0,10)}];q.inventory=[{id:uid(),name:b.equipment||'Starting Equipment',qty:1,description:'Review items and quantities with DM',weight:0,equipped:false}];if(b.spells?.length)q.spellbook=b.spells.map(id=>{const s=D.spells.find(x=>x.id===id);return {id:uid(),name:s?.name||id,ref:id,prepared:true}});characters.push(q);selectedId=q.id;view='overview';save();bClose();renderApp();window.scrollTo(0,0);toast('Character created ✓');}
 document.addEventListener('click',e=>{const button=e.target.closest('[data-bgo]');if(!button)return;e.stopImmediatePropagation();e.preventDefault();if(!B)return;const a=button.dataset.bgo;if(a==='close'){bClose();return;}if(a==='prev')return bStep(B.step-1);if(a==='next')return bStep(B.step+1);if(a.startsWith('jump:'))return bStep(Number(a.split(':')[1]));if(a==='create')return bCreate();},true);
 document.addEventListener('change',e=>{if(!B)return;let el=e.target;if(el.matches('[data-b-checkbox]')){B[el.dataset.bCheckbox]=el.checked;bRender();return;}if(el.matches('[data-b-ability]')){B.base[el.dataset.bAbility]=Number(el.value);bRender();return;}if(el.matches('[data-b-field]')){const k=el.dataset.bField;if(k.startsWith('skill:'))B.skills[k.split(':')[1]]=el.value;else if(k.startsWith('language'))B.languages[Number(k.slice(-1))]=el.value;else if(k.startsWith('weapon:'))B.weapons[Number(k.split(':')[1])]=el.value;else if(k==='level')B.level=Number(el.value);else B[k]=el.value;if(k==='class'||k==='species'||k==='background'||k==='level'||k==='subclass'||k==='boostPattern'||k==='method') {if(k==='class') {B.subclass='';B.maneuvers=[];}bRender();}return;}if(el.matches('[data-b-maneuver]')){const id=el.dataset.bManeuver;B.maneuvers=el.checked?[...new Set([...B.maneuvers,id])]:B.maneuvers.filter(x=>x!==id);bRender();return;}if(el.matches('[data-b-spell]')){const id=el.dataset.bSpell;B.spells=el.checked?[...new Set([...B.spells,id])]:B.spells.filter(x=>x!==id);return;}if(el.matches('[data-b-portrait]')&&el.files?.[0]){const file=el.files[0];if(file.size>15000000){toast('Image exceeds 15 MB');return;}const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const canvas=document.createElement('canvas');const scale=Math.min(1,800/Math.max(img.width,img.height));canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);B.portrait=canvas.toDataURL('image/jpeg',.79);bRender();};img.src=reader.result;};reader.readAsDataURL(file);}},true);
 document.addEventListener('input',e=>{if(!B)return;const el=e.target;if(el.matches('input[data-b-field],textarea[data-b-field]')){const k=el.dataset.bField;if(!k.includes(':')&&!k.startsWith('language'))B[k]=el.value;}},true);

  /* D&D Atlas v2: six-tab layout, strictly 2024 combat reference, shared campaign media.
     This module runs inside the core app closure so that local characters remain compatible. */
  const tr=(el,en)=>L.getLanguage()==='el'?el:en;
  const section=(el,en,body,actions='')=>panel(tr(el,en),body,actions);
  const greekTerms={Fighter:'Μαχητής',Sorcerer:'Έμφυτος μάγος',Human:'Άνθρωπος',Aasimar:'Ουράνιας καταγωγής',Dragonborn:'Δρακογενής',Soldier:'Στρατιώτης',Entertainer:'Καλλιτέχνης',Noble:'Ευγενής','Battle Master':'Δάσκαλος της μάχης','Weapon Mastery':'Εξειδίκευση όπλων','Fighting Style':'Στυλ μάχης','Human Traits':'Χαρακτηριστικά ανθρώπου','Student of War':'Μαθητής του πολέμου','Combat Superiority':'Πολεμική υπεροχή','Metamagic':'Μεταμαγεία','Draconic Spells':'Δρακονικά ξόρκια','Psionic Spells':'Ψυχικά ξόρκια','Second Wind':'Δεύτερη ανάσα','Action Surge':'Έκρηξη δράσης','Tactical Mind':'Τακτική σκέψη','Innate Sorcery':'Έμφυτη μαγεία','Font of Magic':'Πηγή μαγείας','Aberrant Sorcery':'Αλλόκοτη μαγεία','Draconic Sorcery':'Δρακονική μαγεία',Greatsword:'Μεγάλο δίχειρο σπαθί',Spear:'Δόρυ',Dagger:'Στιλέτο',Shortbow:'Κοντό τόξο','Light Crossbow':'Ελαφριά βαλλίστρα','Fire Bolt':'Πύρινο βλήμα','Shield':'Μαγική ασπίδα','Magic Missile':'Μαγικά βλήματα','Scorching Ray':'Ακτίνα φωτιάς','Chromatic Orb':'Χρωματική σφαίρα','Mind Sliver':'Ψυχική αιχμή','Mind Spike':'Ψυχικό κεντρί','Detect Magic':'Ανίχνευση μαγείας','Misty Step':'Ομιχλώδες βήμα','True Strike':'Ακριβές πλήγμα','Message':'Μήνυμα','Light':'Φως','Sleep':'Ύπνος','Mending':'Επιδιόρθωση','Prestidigitation':'Μικρό ταχυδακτυλουργικό','Ice Knife':'Παγωμένο μαχαίρι','Command':'Διαταγή','Dragon’s Breath':'Ανάσα δράκου','Dragons Breath':'Ανάσα δράκου','Ray of Sickness':'Ακτίνα αρρώστιας','Arms of Hadar':'Βραχίονες του Χαντάρ','Dissonant Whispers':'Δυσαρμονικοί ψίθυροι','Calm Emotions':'Κατευνασμός συναισθημάτων','Detect Thoughts':'Ανίχνευση σκέψεων'};
  const pairedTerm=name=>L.getLanguage()==='el'&&greekTerms[name]?`${name} (${greekTerms[name]})`:name;
  const isBM=ch=>(ch.classes||[]).some(x=>x.name==='Fighter'&&x.subclass==='Battle Master'&&x.level>=3);
  const hasSpells=ch=>(ch.spellbook||[]).length>0;
  const hasSlots=ch=>Object.values(ch.slots||{}).some(v=>(+v?.max||0)>0)||(+ch.pact?.max||0)>0;
  const portraitState=ch=>{let p=ch.overviewPortrait||{};return {zoom:clamp(p.zoom||1,1,3),x:Math.max(-100,Math.min(100,Number(p.x)||0)),y:Math.max(-100,Math.min(100,Number(p.y)||0))};};
  const portraitStyle=(p)=>`transform:translate(${p.x}%,${p.y}%) scale(${p.zoom});`;
  let portraitDraft=null,portraitDrag=null;
  const baseOverviewHeader=atlasOverviewHeader;
  atlasOverviewHeader=function(ch){
    const html=baseOverviewHeader(ch),p=portraitState(ch);
    let localized=html;if(L.getLanguage()==='el'){for(const name of [ch.species,ch.background])if(greekTerms[name])localized=localized.replace(`<strong>${esc(name)}</strong>`,`<strong>${esc(pairedTerm(name))}</strong>`);for(const x of ch.classes||[]){let n=x.name+' '+x.level;localized=localized.replace(n,pairedTerm(x.name)+' '+x.level);if(greekTerms[x.subclass])localized=localized.replace(`<strong>${esc(x.subclass)}</strong>`,`<strong>${esc(pairedTerm(x.subclass))}</strong>`);}}
    return localized.replace(/(<img src="[^"]+" alt="Portrait of [^"]+")>/,`$1 class="overview-positioned-image" style="${portraitStyle(p)}">`)
      .replace('✎ Change portrait',tr('✎ Ρύθμιση εικόνας','✎ Adjust portrait'));
  };
  portraitDialog=function(){
    const ch=c(),has=!!safePortrait(ch.portrait);portraitDraft={...portraitState(ch)};
    const img=has?`<img class="overview-positioned-image" id="portrait-adjust-image" src="${attr(ch.portrait)}" alt="${attr(ch.name)}" style="${portraitStyle(portraitDraft)}">`:`<div class="atlas-portrait-fallback">${initials(ch)}</div>`;
    openModal(tr('Ρύθμιση εικόνας στην Επισκόπηση','Adjust Overview portrait'),`<div class="portrait-adjust-layout">
      <div><div class="portrait-adjust-frame" id="portrait-adjust-preview" aria-label="${tr('Σύρε την εικόνα για αλλαγή θέσης','Drag to reposition image')}">${img}</div><p class="muted small">${tr('Σύρε την εικόνα με ποντίκι ή δάχτυλο για να αλλάξεις το κάδρο.','Drag the image with a mouse or your finger to frame it.')}</p></div>
      <div class="portrait-controls"><label>${tr('Μεγέθυνση','Zoom')} <strong id="portrait-zoom-label">${Math.round(portraitDraft.zoom*100)}%</strong></label><input id="portrait-zoom-range" data-portrait-zoom type="range" min="1" max="3" step="0.05" value="${portraitDraft.zoom}" ${has?'':'disabled'}>
      <p class="muted small">${tr('Η ρύθμιση ισχύει ΜΟΝΟ για τη μεγάλη εικόνα της Επισκόπησης. Δεν αλλοιώνει το αρχικό αρχείο.','This adjustment affects ONLY the large Overview portrait. The original image is unchanged.')}</p>
      <button type="button" class="btn sm" data-portrait-reset ${has?'':'disabled'}>${tr('Επαναφορά κάδρου','Reset framing')}</button><button type="button" class="btn sm" data-action="choose-portrait">${tr('Επιλογή / αλλαγή εικόνας','Choose / change image')}</button></div></div>`,
      `${has?`<button class="btn primary" type="button" data-portrait-save>${tr('Αποθήκευση θέσης','Save framing')}</button><button class="btn warn" data-action="remove-portrait">${tr('Αφαίρεση εικόνας','Remove image')}</button>`:''}<button class="btn" data-action="close-modal">${tr('Κλείσιμο','Close')}</button>`,true);
  };
  const portraitRefresh=()=>{if(!portraitDraft)return;const image=document.getElementById('portrait-adjust-image');if(image)image.style.cssText=portraitStyle(portraitDraft);const z=document.getElementById('portrait-zoom-label');if(z)z.textContent=Math.round(portraitDraft.zoom*100)+'%';};

  /* Verified Fighter 2024 milestones; other classes are shown with explicit limited coverage. */
  const fighterMilestones={1:['Fighting Style','Second Wind','Weapon Mastery'],2:['Action Surge','Tactical Mind'],3:['Fighter Subclass'],4:['Ability Score Improvement / Feat'],5:['Extra Attack','Tactical Shift'],6:['Ability Score Improvement / Feat'],7:['Subclass Feature'],8:['Ability Score Improvement / Feat'],9:['Indomitable','Tactical Master'],10:['Subclass Feature'],11:['Two Extra Attacks'],12:['Ability Score Improvement / Feat'],13:['Indomitable (2)','Studied Attacks'],14:['Ability Score Improvement / Feat'],15:['Subclass Feature'],16:['Ability Score Improvement / Feat'],17:['Action Surge (2)','Indomitable (3)'],18:['Subclass Feature'],19:['Epic Boon'],20:['Three Extra Attacks']};
  const fighterGreek={'Fighting Style':'Στυλ μάχης','Second Wind':'Δεύτερη ανάσα','Weapon Mastery':'Εξειδίκευση όπλων','Action Surge':'Έκρηξη δράσης','Tactical Mind':'Τακτική σκέψη','Fighter Subclass':'Επιλογή υποκλάσης','Ability Score Improvement / Feat':'Αύξηση χαρακτηριστικών ή ειδικό προνόμιο','Extra Attack':'Επιπλέον επίθεση','Tactical Shift':'Τακτική μετακίνηση','Subclass Feature':'Ικανότητα υποκλάσης','Indomitable':'Ακατάβλητος','Tactical Master':'Κυρίαρχος τακτικής','Two Extra Attacks':'Δύο επιπλέον επιθέσεις','Studied Attacks':'Μελετημένες επιθέσεις','Epic Boon':'Επικό προνόμιο','Three Extra Attacks':'Τρεις επιπλέον επιθέσεις'};
  const fighterDescription={ 'Extra Attack':['Δύο επιθέσεις αντί για μία όταν εκτελείς την ενέργεια Επίθεσης.','Make two attacks instead of one when taking the Attack action.'], 'Ability Score Improvement / Feat':['Επιλέγεις το επιτρεπόμενο προνόμιο ή αύξηση χαρακτηριστικών για το επίπεδό σου.','Choose an eligible feat or ability score improvement for your level.'],'Fighter Subclass':['Επιλέγεις την υποκλάση σου. Οι διαθέσιμες ικανότητες εξαρτώνται από αυτήν.','Choose a subclass and gain its level-specific features.'],'Weapon Mastery':['Επιλέγεις τους νόμιμους τύπους όπλων των οποίων τις ιδιότητες εξειδίκευσης γνωρίζεις.','Choose eligible weapons whose mastery properties you can use.']};
  const sorcererMilestones={1:['Spellcasting','Innate Sorcery'],2:['Font of Magic','Metamagic'],3:['Sorcerer Subclass'],4:['Ability Score Improvement / Feat'],5:['Level 3 Spell Slots'],7:['Sorcery Incarnate'],10:['Metamagic Options'],17:['Level 9 Spell Slots'],19:['Epic Boon'],20:['Arcane Apotheosis']};
  function progression(ch){const main=(ch.classes||[])[0]||{name:'Fighter',level:1},current=Number(main.level)||1;const isF=main.name==='Fighter', milestones=isF?fighterMilestones:main.name==='Sorcerer'?sorcererMilestones:{};
    return `<div class="progression-grid">${Array.from({length:20},(_,j)=>{const lvl=j+1,names=milestones[lvl]||[],unmapped=!isF&&main.name!=='Sorcerer';return `<details class="level-row ${lvl===current?'current':''} ${lvl<current?'completed':''}" ${lvl===current||lvl===current+1?'open':''}><summary><span class="level-number">${lvl}</span><strong>${tr('Επίπεδο','Level')} ${lvl}</strong><span class="level-status">${lvl<current?'✓':lvl===current?tr('Τώρα','Current'):tr('Επόμενο','Upcoming')}</span></summary><div class="level-content">${names.length?names.map(n=>`<p><b>${esc(n)}${L.getLanguage()==='el'?' ('+esc(fighterGreek[n]||n)+')':''}</b><br><span class="muted">${esc((fighterDescription[n]||[tr('Αποκτάς τη δυνατότητα στο συγκεκριμένο επίπεδο. Για λεπτομέρειες δες τη Βιβλιοθήκη και τους κανόνες της υποκλάσης.','Feature becomes available at this level. Check the Library and subclass rules for details.'), 'Feature unlocks at this class level. Consult the class and subclass rules.'])[L.getLanguage()==='el'?0:1])}</span></p>`).join(''):`<p class="muted">${unmapped?tr('Δεν υπάρχει ακόμη πλήρως ελεγμένος πίνακας για αυτή την κλάση. Συμβουλεύσου τους κανόνες 2024.','A fully verified progression table is not yet implemented for this class. Consult the 2024 rules.'):tr('Περισσότερες βελτιώσεις και επιλογές εξαρτώνται από την κλάση και την υποκλάση.','Further improvements and choices depend on class and subclass.')}</p>`}</div></details>`;}).join('')}</div>`;
  }
  renderCharacter=function(ch){
    const group=ch.classes.map(x=>`${esc(pairedTerm(x.name))} ${x.level}${x.subclass?' · '+esc(pairedTerm(x.subclass)):''}`).join(' / ');
    return `<div class="page-title"><div><h2>${tr('Χαρακτήρας','Character')}</h2><p>${tr('Στοιχεία χαρακτήρα και εξέλιξη από το επίπεδο 1 έως το 20.','Character details and level progression from 1 to 20.')}</p></div>${btn(tr('Επεξεργασία','Edit'),'edit-character','sm')}</div>
    <div class="grid two">${section('Ταυτότητα','Identity',`<div class="rowline"><span>${tr('Όνομα','Name')}</span><strong>${esc(ch.name)}</strong></div><div class="rowline"><span>${tr('Είδος','Species')}</span><strong>${esc(ch.species)}</strong></div><div class="rowline"><span>${tr('Υπόβαθρο','Background')}</span><strong>${esc(ch.background||'—')}</strong></div><div class="rowline"><span>${tr('Κλάση / Υποκλάση','Class / Subclass')}</span><strong>${group}</strong></div><div class="rowline"><span>${tr('Ευθυγράμμιση','Alignment')}</span><strong>${esc(ch.alignment||'—')}</strong></div>`)}${section('Επάρκειες και γλώσσες','Proficiencies & languages',`<div class="detail-description">${esc(ch.proficiencies||tr('Δεν έχουν καταχωριστεί.','Not recorded.'))}</div><hr><div class="detail-description">${esc(ch.languages||tr('Δεν έχουν καταχωριστεί.','Not recorded.'))}</div>`)}</div>
    ${section('Εξέλιξη επιπέδων 1–20','Level progression 1–20',progression(ch),`<button class="btn sm" data-action="level-up">${tr('Αύξηση επιπέδου','Level Up')}</button>`)}
    ${section('Εξαγωγή και αντίγραφα','Export & backups',`<div class="actions-inline"><button class="btn sm primary" data-atlas-print>${tr('Εκτύπωση φύλλου χαρακτήρα 2024 / PDF','Print 2024 character sheet / PDF')}</button><button class="btn sm" data-action="backup">${tr('Αντίγραφο JSON','JSON backup')}</button></div><p class="muted small">${tr('Η εκτυπώσιμη μορφή ακολουθεί τα δεδομένα και τους υπολογισμούς του 2024. Δεν είναι το επίσημο PDF της Wizards.','This printable layout uses 2024 rules and values. It is not the Wizards official PDF template.')}</p>`)}`;
  };

  let combatSpellMode='combat';
  const combatSpellNames=new Set(['Fire Bolt','Ray of Frost','Sorcerous Burst','Sorcerer\'s Burst','Mind Sliver','True Strike','Magic Missile','Chromatic Orb','Shield','Scorching Ray','Ice Knife','Ray of Sickness','Arms of Hadar','Dissonant Whispers','Dragon\'s Breath','Dragons Breath','Burning Hands','Thunderwave','Witch Bolt','Sleep','Web','Hold Person','Misty Step','Healing Word','Cure Wounds','Aid','Counterspell','Fireball','Spirit Guardians','Shatter','Command','Mind Spike','Blade Ward','Armor of Agathys']);
  function combatSpell(ch,x){const r=x.ref?findReference(x.ref):null,n=x.name||r?.name||'',lev=Number(x.level??r?.level??0),damage=x.damage||r?.damage||'',desc=r?.summary||x.summary||'';return combatSpellNames.has(n)||!!damage||/damage|attack|heal|hit points|saving throw|resistance|defense|armor class/i.test(desc);}
  function combatSpellList(ch){const all=ch.spellbook||[];let list=combatSpellMode==='all'?all:all.filter(x=>combatSpell(ch,x));
    return `<div class="toolbar"><button type="button" class="btn sm ${combatSpellMode==='combat'?'primary':''}" data-combat-spell-mode="combat">${tr('Ξόρκια μάχης','Combat spells')}</button><button type="button" class="btn sm ${combatSpellMode==='all'?'primary':''}" data-combat-spell-mode="all">${tr('Όλα τα ξόρκια μου','All My Spells')}</button></div>
    <div class="tile-list">${list.map(x=>{const r=x.ref?findReference(x.ref):null;let lvl=r?.level??x.level??0;return `<button class="tile" data-owned-spell="${attr(x.id)}"><span><b>${esc(pairedTerm(x.name))}</b><small>${lvl?tr('Επίπεδο','Level')+' '+lvl:tr('Ξόρκι μηδενικού επιπέδου','Cantrip')}${x.prepared===false?' · '+tr('Μη προετοιμασμένο','Not prepared'):''}</small></span><span class="right">${svg('chevron')}</span></button>`;}).join('')||`<div class="empty">${tr('Δεν υπάρχουν καταχωρισμένα ξόρκια σε αυτήν την προβολή.','No recorded spells in this view.')}</div>`}</div>`;
  }
  function combatAttackRows(ch){return atlasBarbarianPending(ch)+(ch.attacks||[]).map(a=>{const bonus=attackBonus(ch,a),dmg=attackDamage(ch,a),itemState=weaponStateForAttack(ch,a),savage=(ch.feats||[]).includes('feat-savageattacker')||ch.features?.some(f=>/Savage Attacker/i.test(f.name));return `<button class="combat-attack ${itemState&&['lost','broken','destroyed','stolen'].includes(itemState.weaponStatus)?'atlas-attack-unavailable':''}" data-attack-detail="${attr(a.id)}"><div class="combat-attack-title"><b>${esc(pairedTerm(a.name))}</b><small>${esc(a.type||'')} ${atlasAttackMastery(ch,a)?' · ★ '+esc(atlasAttackMastery(ch,a).name):''}</small></div><div class="combat-attack-values"><span>${tr('Επίθεση','Attack')} <b>1d20${signed(bonus)}</b></span><span>${tr('Ζημιά','Damage')} <b>${esc(dmg)}</b></span></div><span class="muted small">${attackStats(ch,a).proficient?tr('Επάρκεια όπλου: +PB μόνο στην επίθεση','Weapon proficient: +PB to attack only'):tr('Χωρίς επάρκεια όπλου','Not weapon proficient')} · ${atlasAttackMastery(ch,a)?tr('Mastery ενεργό','Mastery active'):tr('Mastery μη επιλεγμένο','Mastery not selected')}</span>${atlasMasteryHelp(ch,a)}${itemState?`<span class="atlas-combat-weapon-state">${weaponStateTag(itemState)}${itemState.weaponStatusNote?` <span class="muted small">${esc(itemState.weaponStatusNote)}</span>`:''}</span>`:''}${savage?`<span class="muted small">Savage Attacker (${tr('Άγριος επιτιθέμενος','Savage Attacker')}) · ${tr('μία φορά ανά γύρο','once per turn')}</span>`:''}<span class="combat-help">${tr('Πάτησε για τον υπολογισμό των ζαριών','Tap for the dice explanation')} →</span></button>`;}).join('')||`<div class="empty">${tr('Δεν υπάρχουν καταχωρισμένα όπλα ή επιθέσεις.','No recorded weapons or attacks.')}</div>`;}
  function combatResources(ch){const resources=ch.resources||[];let parts=[];
    if(resources.length)parts.push(resources.map(r=>`<div class="rowline"><div><button class="linklike" data-resource-detail="${attr(r.id)}">${esc(r.name)}</button><small>${esc(r.recharge||'')}</small></div><div class="counter"><button class="btn sm" data-resource-step="${attr(r.id)}:-1" ${r.current<=0?'disabled':''}>−</button><b>${Number(r.current)||0}/${Number(r.max)||0}</b><button class="btn sm" data-resource-step="${attr(r.id)}:1" ${r.current>=r.max?'disabled':''}>+</button></div></div>`).join(''));
    if(isBM(ch)&&!resources.some(r=>/superiority/i.test(r.name)))parts.push(`<div class="notice">${tr('Battle Master: 4 ζάρια ανωτερότητας (d8) στο επίπεδο 3. Χρειάζεται καταχώριση πόρων για καταμέτρηση.','Battle Master: 4 Superiority Dice (d8) at level 3. Add the resource to track expenditures.')}</div>`);
    if(hasSlots(ch))parts.push(renderSlots(ch));
    return parts.join('<div class="subtle-divider"></div>');
  }
  function combatFeatures(ch){const entries=(ch.features||[]).filter(f=>/action|reaction|attack|combat|wind|surge|metamagic|innate|maneuver|breath|protection|spell|rage|shroud|hands|revelation|tactical/i.test([f.action,f.name,f.detail].join(' '))).slice(0,30);
    const auto=atlasAutoFeatures(ch).filter(f=>['Second Wind','Action Surge','Tactical Mind'].includes(f.name));const feats=[...auto,...entries.filter(f=>!auto.some(a=>a.name===f.name)&&!(/fighting style/i.test(f.name)&&f.name!=='Fighting Style'))];
    return feats.length?`<div class="tile-list combat-feature-list">${feats.map(f=>`<button class="tile" data-feature-detail="${attr(f.id)}"><span><b>${esc(pairedTerm(f.name))}</b><small class="combat-feature-summary">${esc(String(f.detail||f.action||f.source||'').slice(0,155))}</small></span><span class="right">${svg('chevron')}</span></button>`).join('')}</div>`:'';
  }
  renderCombat=function(ch){const pp=ch.passivePerceptionOverride!==''&&ch.passivePerceptionOverride!=null?Number(ch.passivePerceptionOverride):10+skillMod(ch,'Perception'); const spellFeature=hasSpells(ch), bm=isBM(ch)||!!ch.maneuvers?.length;const classFeatures=combatFeatures(ch);const res=combatResources(ch);
    const saves=Object.entries(D.abilities).map(([k,name])=>`<div class="combat-save"><span>${esc(k)}${L.getLanguage()==='el'?' · '+tr(({STR:'Δύναμη',DEX:'Επιδεξιότητα',CON:'Αντοχή',INT:'Νοημοσύνη',WIS:'Σοφία',CHA:'Χάρισμα'})[k],name):''}</span><b>${signed(saveMod(ch,k))}</b>${(ch.saves||[]).includes(k)?'<i>●</i>':''}</div>`).join('');
    const loadoutUI=(ch.loadouts||[]).length>1?section('Ενεργός οπλισμός','Active loadout',`<div class="combat-loadouts">${ch.loadouts.map((x,i)=>`<button class="btn ${i===(ch.activeLoadout||0)?'primary':''}" data-set-loadout="${i}">${esc(x.name)} · AC ${x.ac}</button>`).join('')}</div><p class="muted small">${tr('Η εφαρμογή ενημερώνει την Άμυνα. Η αλλαγή ασπίδας στο παιχνίδι ακολουθεί το κόστος ενέργειας των κανόνων 2024.','The app updates AC. Equipping or removing a shield in play still follows the 2024 action rules.')}</p>`):'';
    return `<div class="page-title"><div><h2>${tr('Μάχη','Combat')}</h2><p>${tr('Οι πραγματικές δυνατότητές σου και ο τρόπος χρήσης τους με ζάρια.','Your available abilities and how to use physical dice.')}</p></div></div>
      <div class="combat-status"><div><small>${tr('Ζωή','HP')}</small><b>${ch.hp?.current||0}/${ch.hp?.max||1}</b></div><div><small>${tr('Άμυνα','AC')}</small><b>${AC(ch)}</b></div><div><small>${tr('Πρωτοβουλία','Initiative')}</small><b>${signed(initMod(ch))}</b></div><div><small>${tr('Ταχύτητα','Speed')}</small><b>${ch.speed||30} ft</b></div>${ch.hp?.temp?`<div><small>${tr('Προσωρινή ζωή','Temp HP')}</small><b>${ch.hp.temp}</b></div>`:''}</div>
      ${loadoutUI}<div class="combat-columns"><div class="grid">${section('Όπλα και επιθέσεις','Weapons & Attacks',combatAttackRows(ch),`<button class="btn sm" data-action="add-attack">${tr('+ Όπλο','+ Weapon')}</button>`)}
      ${spellFeature?section('Ξόρκια','Spells',`<div class="notice">${tr('Μαγική επίθεση','Spell Attack')}: <b>${signed(spellAttack(ch))}</b> · ${tr('Δυσκολία σωτηρίας','Spell Save DC')}: <b>${spellDC(ch)}</b></div>`+combatSpellList(ch)):''}
      ${bm?section('Πολεμικοί ελιγμοί','Maneuvers',renderOwnedManeuvers(ch),`<button class="btn sm" data-action="pick-maneuvers">${tr('Επιλογή','Choose')}</button>`):''}
      ${classFeatures?section('Ικανότητες μάχης','Combat abilities',classFeatures):''}</div><div class="grid">
      ${res?section('Διαθέσιμοι πόροι','Available resources',res):''}
      ${section('Ζαριές σωτηρίας','Saving Throws',`<div class="combat-saves">${saves}</div><p class="muted small">${tr('● Επάρκεια: προστίθεται το μπόνους επάρκειας.','● Proficient: add Proficiency Bonus.')}</p>`)}
      ${section('Ενεργές καταστάσεις','Active Conditions',conditionPills(ch),`<button class="btn sm" data-action="conditions">${tr('Διαχείριση','Manage')}</button>`)}
      ${ch.concentrating?section('Συγκέντρωση','Concentration',`<strong>${esc(ch.concentrating)}</strong><p class="muted small">${tr('Μετά από ζημιά: ζαριά σωτηρίας Αντοχής με δυσκολία 10 ή τη μισή ζημιά, όποιο είναι μεγαλύτερο.','After taking damage: Constitution saving throw, DC 10 or half the damage taken, whichever is higher.')}</p>`):''}
      ${ch.hp?.current<=0||ch.death?.success||ch.death?.fail?section('Ζαριές θανάτου','Death Saving Throws',renderSurvival(ch)):''}
      ${(ch.inventory||[]).some(isConsumable)?section('Αναλώσιμα','Consumables',consumableRows(ch)):''}${section('Ενέργειες γύρου','Turn actions',`<p class="muted small">${tr('Συνήθως διαθέτεις μία Ενέργεια, μία Πρόσθετη ενέργεια εφόσον κάποια δυνατότητα τη χρησιμοποιεί, μία Αντίδραση έως την αρχή του επόμενου γύρου σου και κίνηση έως την ταχύτητά σου. Οι συγκεκριμένοι περιορισμοί υπερισχύουν.','Normally you have one Action, one Bonus Action if an ability uses it, one Reaction until the start of your next turn, and movement up to your Speed. Specific rules take precedence.')}</p>`)}</div></div>`;
  };
  attackDetail=function(id){const ch=c(),a=(ch.attacks||[]).find(z=>z.id===id);if(!a)return;let stats=attackStats(ch,a),mod=stats.mod,pb=stats.pb,magic=stats.magic,bonus=attackBonus(ch,a),damage=attackDamage(ch,a),savage=ch.feats?.includes('feat-savageattacker')||ch.features?.some(f=>/Savage Attacker/i.test(f.name));const mastery=atlasAttackMastery(ch,a);const mastered=!!mastery;const dice=(String(a.damage||'').match(/\d+d\d+/)||[])[0]||a.damage||'?';const twoHanded=/greatsword|maul|greataxe|longbow|shortbow/i.test(a.name)||/two.hand/i.test(a.notes||'');
    const status=weaponStateForAttack(ch,a);const steps=`<div class="attack-guide">${twoHandedShieldConflict(ch,a)?`<div class="notice"><b>${tr('Μη έγκυρη επίθεση: η ενεργή διαμόρφωση έχει ασπίδα. Το Greatsword παραμένει 2d6 και Two-Handed, δεν μετατρέπεται σε 1d8. Αλλάζεις loadout για να επιτεθείς.','Invalid attack: active loadout has a shield. Greatsword stays 2d6 and Two-Handed; it does not become 1d8. Switch loadout to attack.')}</b></div>`:''}${status?`<div class="notice"><b>${tr('Κατάσταση όπλου','Weapon condition')}: ${esc(weaponStateLabel(status.weaponStatus))}</b><p>${esc(status.weaponStatusNote||'')}</p>${['lost','broken','stolen','destroyed'].includes(status.weaponStatus)?`<p>${tr('Το όπλο δεν είναι διαθέσιμο για επίθεση.','The weapon is unavailable for attacks.')}</p>`:tr('Τυχόν ποινές ή επιπλέον επιδράσεις εξαρτώνται από τον DM και τους κανόνες της επίδρασης.','Penalties and additional effects depend on the DM and the specific effect.')}</div>`:''}<div><b>1 · ${tr('Ζαριά επίθεσης','Attack Roll')}</b><p>${tr('Ρίχνεις ένα εικοσάπλευρο ζάρι και προσθέτεις:','Roll one d20 and add:')} <b>${signed(mod)} ${a.ability||'STR'}</b> + <b>${signed(pb)} ${tr('μπόνους επάρκειας','Proficiency Bonus')}</b>${magic?' + '+magic+' '+tr('μαγικό μπόνους','magic bonus'):''}. ${tr('Τελικό αποτέλεσμα:','Total formula:')} <b>1d20${signed(bonus)}</b>. ${tr('Πρέπει να φτάσεις ή να ξεπεράσεις την Άμυνα του στόχου.','You must equal or exceed the target’s Armor Class.')}</p></div><div><b>2 · ${tr('Ζημιά','Damage')}</b><p>${tr('Ρίχνεις τα ζάρια ζημιάς του όπλου','Roll the weapon damage dice')} <b>${esc(dice)}</b> ${tr('και προσθέτεις τον κατάλληλο τροποποιητή χαρακτηριστικού (όχι το μπόνους επάρκειας).','and add the applicable ability modifier (not your Proficiency Bonus).')} <b>${esc(damage)}</b> ${esc(a.type||'')}.</p></div>${savage?`<div><b>3 · Savage Attacker (${tr('Άγριος επιτιθέμενος','Savage Attacker')})</b><p>${tr('Μία φορά ανά γύρο σου όταν πετύχει επίθεση με όπλο, ρίχνεις δύο φορές τα ζάρια ζημιάς του όπλου και επιλέγεις ποιο αποτέλεσμα θα χρησιμοποιήσεις. Δεν προσθέτεις δύο φορές τον τροποποιητή.','Once per turn when you hit with a weapon, roll the weapon’s damage dice twice and use either result. Do not add your modifier twice.')}</p></div>`:''}<div><b>${savage?'4':'3'} · ${tr('Κρίσιμο χτύπημα','Critical Hit')}</b><p>${tr('Αν το φυσικό αποτέλεσμα του d20 είναι 20, διπλασιάζεις τα ζάρια ζημιάς, όχι το σταθερό μπόνους.','On a natural 20, double the damage dice, not the flat modifier.')}</p></div>${mastery?`<div><b>${tr('Εξειδίκευση όπλου','Weapon Mastery')}: ${esc(mastery.name)}</b><p>${esc(mastery.name==='Nick'?tr('Το Nick μεταφέρει την επιπλέον επίθεση Light στην ενέργεια Attack, μία φορά ανά γύρο. Δεν δίνει αυτόματα επιπλέον ζημιά.','Nick moves the Light extra attack into the Attack action, once per turn. It grants no automatic extra damage.'):mastery.summary)}</p>${mastered?'':`<span class="muted small">${tr('Χρησιμοποιείται μόνο αν έχεις επιλέξει εξειδίκευση σε αυτό το όπλο.','Applies only if you selected mastery for this weapon.')}</span>`}</div>`:''}${twoHanded?`<div class="notice">${tr('Το δίχειρο όπλο απαιτεί δύο χέρια κατά την επίθεση. Δεν μπορείς να χρησιμοποιήσεις ασπίδα ταυτόχρονα.','A two-handed weapon needs both hands when attacking. You cannot use a shield at the same time.')}</div>`:''}</div>`;
    openModal(pairedTerm(a.name),`<div class="detail-meta"><span class="chip gold">${tr('Επίθεση','Attack')} 1d20${signed(bonus)}</span><span class="chip">${tr('Ζημιά','Damage')} ${esc(damage)}</span></div>${steps}`,`<button class="btn" data-edit-attack="${attr(id)}">${tr('Επεξεργασία','Edit')}</button><button class="btn" data-action="close-modal">${tr('Κλείσιμο','Close')}</button>`,true);
  };

  /* Shared sessions are maintained on GitHub; shared images may be served from a public Drive folder.
     Drive uses the official files.list endpoint with a referrer-restricted API key, no player OAuth. */
  let sharedSessions=[],campaignImages=[],sharedLoaded=false,sharedStatus='',sharedHidden=[],sharedEdits={},campaignImageSource='github',driveThumbs={};
  const JOURNAL_KEY='dndatlas:journal-overrides:v2';
  try{const v=JSON.parse(localStorage.getItem(JOURNAL_KEY)||'{}');sharedHidden=Array.isArray(v.hidden)?v.hidden:[];sharedEdits=v.edits&&typeof v.edits==='object'?v.edits:{};}catch{}
  const saveSharedPref=()=>{try{localStorage.setItem(JOURNAL_KEY,JSON.stringify({hidden:sharedHidden,edits:sharedEdits}));}catch{toast(tr('Ο χώρος αποθήκευσης γέμισε.','Local storage is full.'));}};
  const validDriveId=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{10,}$/.test(v);
  const drivePath=v=>typeof v==='string'&&v.startsWith('drive:')&&validDriveId(v.slice(6));
  const driveImageUrl=id=>`https://dndatlas-drive.pagkalosgeo.workers.dev/image/${encodeURIComponent(id)}`;
  const safeMediaPath=v=>{
    if(drivePath(v)){const id=v.slice(6);return driveThumbs[id]||driveImageUrl(id);}
    return typeof v==='string'&&/^assets\/campaign\/[a-zA-Z0-9][a-zA-Z0-9_.\/-]*\.(png|jpg|jpeg|webp|gif)$/i.test(v)&&!v.includes('..')?'./'+v:'';
  };
  const mediaSrc=v=>safePortrait(v)?v:safeMediaPath(v);
  const mediaTitle=v=>campaignImages.find(x=>x.path===v)?.title||(v.startsWith('drive:')?'Google Drive image':v.split('/').pop())||'';
  // The gallery works with Google Drive, GitHub images, and personal session photos.
  // Captions are text-only; the large image is opened in a separate accessible viewer.
  const mediaCards=(paths)=>`<div class="campaign-gallery">${(paths||[]).map((src,i)=>mediaSrc(src)?`<figure><button type="button" class="campaign-preview-btn" data-atlas-gallery-open="${i}" aria-label="${attr(tr('Άνοιγμα εικόνας: ','Open image: ')+mediaTitle(src))}"><img loading="lazy" referrerpolicy="no-referrer" src="${attr(mediaSrc(src))}" data-atlas-drive-id="${drivePath(src)?attr(src.slice(6)):''}" alt="${attr(mediaTitle(src))}"></button><figcaption>${esc(mediaTitle(src))}</figcaption></figure>`:'').join('')}</div>`;
  // Keep this enhancement confined to app.js: a GitHub update needs just one file.
  function ensureCampaignViewerCSS(){
    if(document.getElementById('atlas-gallery-viewer-css'))return;
    const style=document.createElement('style');style.id='atlas-gallery-viewer-css';
    style.textContent=`
      .campaign-gallery .campaign-preview-btn{appearance:none;border:0;background:none;padding:0;margin:0;display:block;width:100%;cursor:zoom-in;overflow:hidden;color:inherit;text-align:inherit}
      .campaign-gallery .campaign-preview-btn img{transition:transform .17s ease}
      .campaign-gallery .campaign-preview-btn:hover img{transform:scale(1.035)}
      .campaign-gallery .campaign-preview-btn:focus-visible{outline:3px solid #e8be77;outline-offset:-3px}
      .atlas-gallery-backdrop{position:fixed;inset:0;z-index:20000;background:rgba(4,8,16,.97);color:#f1f4f8;display:flex;flex-direction:column;align-items:stretch;justify-content:center;padding:max(env(safe-area-inset-top),12px) max(env(safe-area-inset-right),10px) max(env(safe-area-inset-bottom),12px) max(env(safe-area-inset-left),10px);box-sizing:border-box}
      .atlas-gallery-toolbar{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;max-width:1400px;margin:0 auto 10px}
      .atlas-gallery-counter{font-size:13px;color:#c9d4e2;white-space:nowrap;font-variant-numeric:tabular-nums}
      .atlas-gallery-close,.atlas-gallery-nav{appearance:none;background:rgba(27,40,56,.94);color:#fff;border:1px solid #647488;border-radius:50%;height:46px;width:46px;flex:0 0 46px;cursor:pointer;font-size:28px;display:flex;align-items:center;justify-content:center;line-height:1}
      .atlas-gallery-close:hover,.atlas-gallery-nav:hover{background:#38536a}
      .atlas-gallery-close:focus-visible,.atlas-gallery-nav:focus-visible{outline:3px solid #e8be77;outline-offset:3px}
      .atlas-gallery-nav:disabled{opacity:.2;cursor:default}
      .atlas-gallery-nav[hidden]{display:none}
      .atlas-gallery-close{font-size:25px}
      .atlas-gallery-stage{width:100%;max-width:1400px;margin:0 auto;display:grid;grid-template-columns:52px minmax(0,1fr) 52px;gap:9px;align-items:center;flex:1;min-height:0;touch-action:pan-y}
      .atlas-gallery-photo{min-width:0;min-height:0;display:flex;justify-content:center;align-items:center;height:100%;overflow:hidden}
      .atlas-gallery-photo img{max-width:100%;max-height:100%;height:auto;width:auto;object-fit:contain;border-radius:6px;box-shadow:0 5px 34px #0009}
      .atlas-gallery-footer{max-width:1200px;width:100%;margin:10px auto 0;text-align:center;min-height:28px;color:#d2dbe7;font-size:13px;overflow-wrap:anywhere}
      @media(max-width:600px){.atlas-gallery-stage{grid-template-columns:38px minmax(0,1fr) 38px;gap:2px}.atlas-gallery-nav{width:36px;height:44px;flex-basis:36px;font-size:24px}.atlas-gallery-close{width:40px;height:40px;flex-basis:40px}.atlas-gallery-footer{font-size:12px}}
      @media(prefers-reduced-motion:reduce){.campaign-gallery .campaign-preview-btn img{transition:none}}
    `;
    document.head.appendChild(style);
  }
  ensureCampaignViewerCSS();
  let campaignViewer=null;
  function showCampaignViewerImage(next){
    if(!campaignViewer)return;
    const {items,root}=campaignViewer;
    campaignViewer.index=(next+items.length)%items.length;
    const item=items[campaignViewer.index];
    const photo=root.querySelector('[data-atlas-gallery-photo]');
    photo.alt=item.title;
    photo.onerror=()=>{
      // A public Drive preview can occasionally reject a high-resolution request.
      if(photo.src!==item.thumbnail){photo.onerror=null;photo.src=item.thumbnail;}
    };
    photo.src=item.full;
    root.querySelector('[data-atlas-gallery-count]').textContent=`${campaignViewer.index+1} / ${items.length}`;
    root.querySelector('[data-atlas-gallery-caption]').textContent=item.title;
  }
  function closeCampaignViewer(){
    if(!campaignViewer)return;
    const {root,previousOverflow,focusTarget}=campaignViewer;
    root.remove();campaignViewer=null;
    document.body.style.overflow=previousOverflow;
    if(focusTarget?.isConnected)focusTarget.focus({preventScroll:true});
  }
  function openCampaignViewer(trigger){
    const gallery=trigger.closest('.campaign-gallery');if(!gallery)return;
    const buttons=[...gallery.querySelectorAll('[data-atlas-gallery-open]')];
    const items=buttons.map(button=>{
      const image=button.querySelector('img'),id=image?.dataset.atlasDriveId||'';
      const thumb=image?.getAttribute('src')||'';
      return {full:id?driveImageUrl(id):thumb,
        thumbnail:thumb,title:button.closest('figure')?.querySelector('figcaption')?.textContent||image?.alt||''};
    }).filter(item=>item.thumbnail);
    if(!items.length)return;
    const index=Math.max(0,buttons.indexOf(trigger));
    closeCampaignViewer();ensureCampaignViewerCSS();
    const root=document.createElement('div');root.className='atlas-gallery-backdrop';root.id='atlas-campaign-viewer';
    root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
    root.setAttribute('aria-label',tr('Προβολή εικόνων της περιπέτειας','Campaign image viewer'));
    root.innerHTML=`<div class="atlas-gallery-toolbar"><span class="atlas-gallery-counter" data-atlas-gallery-count></span><button type="button" class="atlas-gallery-close" data-atlas-gallery-close aria-label="${attr(tr('Κλείσιμο εικόνας','Close image'))}" title="${attr(tr('Κλείσιμο (Esc)','Close (Esc)'))}">×</button></div><div class="atlas-gallery-stage"><button type="button" class="atlas-gallery-nav" data-atlas-gallery-prev aria-label="${attr(tr('Προηγούμενη εικόνα','Previous image'))}" title="${attr(tr('Προηγούμενη εικόνα (←)','Previous image (←)'))}">‹</button><div class="atlas-gallery-photo"><img data-atlas-gallery-photo referrerpolicy="no-referrer" alt=""></div><button type="button" class="atlas-gallery-nav" data-atlas-gallery-next aria-label="${attr(tr('Επόμενη εικόνα','Next image'))}" title="${attr(tr('Επόμενη εικόνα (→)','Next image (→)'))}">›</button></div><div class="atlas-gallery-footer" data-atlas-gallery-caption></div>`;
    if(items.length===1){root.querySelector('[data-atlas-gallery-prev]').hidden=true;root.querySelector('[data-atlas-gallery-next]').hidden=true;}
    const previousOverflow=document.body.style.overflow;
    document.body.appendChild(root);document.body.style.overflow='hidden';
    campaignViewer={items,index:0,root,previousOverflow,focusTarget:trigger};
    showCampaignViewerImage(Math.min(index,items.length-1));
    root.querySelector('[data-atlas-gallery-close]')?.focus();
  }
  document.addEventListener('click',event=>{
    // The entire gallery figure, including caption, can open the viewer.
    // This also handles clicks coming from the image rather than its button.
    const trigger=event.target.closest('[data-atlas-gallery-open],[data-atlas-gallery-next],[data-atlas-gallery-prev],[data-atlas-gallery-close]')
      || event.target.closest('.campaign-gallery figure')?.querySelector('[data-atlas-gallery-open]');
    if(trigger){event.preventDefault();event.stopImmediatePropagation();
      if(trigger.hasAttribute('data-atlas-gallery-open'))openCampaignViewer(trigger);
      else if(trigger.hasAttribute('data-atlas-gallery-close'))closeCampaignViewer();
      else if(campaignViewer)showCampaignViewerImage(campaignViewer.index+(trigger.hasAttribute('data-atlas-gallery-next')?1:-1));
      return;
    }
    if(campaignViewer&&event.target===campaignViewer.root){event.stopImmediatePropagation();closeCampaignViewer();}
  },true);
  document.addEventListener('keydown',event=>{
    if(!campaignViewer)return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeCampaignViewer();}
    else if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
      event.preventDefault();event.stopImmediatePropagation();
      if(campaignViewer.items.length>1)showCampaignViewerImage(campaignViewer.index+(event.key==='ArrowRight'?1:-1));
    }else if(event.key==='Tab'){
      const buttons=[...campaignViewer.root.querySelectorAll('button:not([hidden])')];
      if(!buttons.length)return;
      const idx=buttons.indexOf(document.activeElement);
      if(event.shiftKey&&idx<=0){event.preventDefault();buttons.at(-1).focus();}
      else if(!event.shiftKey&&idx===buttons.length-1){event.preventDefault();buttons[0].focus();}
    }
  },true);
  let galleryTouchStart=null;
  document.addEventListener('touchstart',event=>{
    if(!campaignViewer||!campaignViewer.root.contains(event.target)||event.touches.length!==1)return;
    galleryTouchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};
  },{passive:true,capture:true});
  document.addEventListener('touchend',event=>{
    if(!campaignViewer||!galleryTouchStart||!event.changedTouches.length)return;
    const dx=event.changedTouches[0].clientX-galleryTouchStart.x;
    const dy=event.changedTouches[0].clientY-galleryTouchStart.y;
    galleryTouchStart=null;
    if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3&&campaignViewer.items.length>1){
      event.preventDefault();showCampaignViewerImage(campaignViewer.index+(dx<0?1:-1));
    }
  },{passive:false,capture:true});
  // Read the publicly available gallery index through the Cloudflare Worker.
  // The Google Drive API key stays server-side as a Worker secret and is NEVER read by the PWA.
  async function listWorkerImages(workerUrl){
    if(typeof workerUrl!=='string')throw Error('Worker URL is missing');
    let url;
    try{url=new URL(workerUrl);}catch{throw Error('Worker URL is invalid');}
    if(url.protocol!=='https:' || url.username || url.password || url.search || url.hash ||
       url.hostname!=='dndatlas-drive.pagkalosgeo.workers.dev' || url.pathname!=='/images'){
      throw Error('Worker URL is not an approved endpoint');
    }
    const response=await fetch(url.href,{cache:'no-store'});
    if(!response.ok)throw Error('Worker HTTP '+response.status);
    const data=await response.json();
    if(!data||!Array.isArray(data.images))throw Error('Worker returned an invalid gallery');
    const found=[];
    const seen=new Set();
    for(const item of data.images){
      if(!item || !validDriveId(item.id) ||
         (item.path && item.path!=='drive:'+item.id) || seen.has(item.id))continue;
      seen.add(item.id);
      found.push({id:item.id,title:typeof item.title==='string' ? item.title.slice(0,200) : item.id,path:'drive:'+item.id});
    }
    return found;  }
  // Non-blocking status for real network work. Short requests do not flash a loader.
  let atlasPendingCount=0, atlasPendingTimer=0;
  function atlasSetBusy(label){
    atlasPendingCount++;
    let node=document.getElementById('atlas-network-status');
    if(!node){node=document.createElement('div');node.id='atlas-network-status';node.className='atlas-network-status';node.setAttribute('role','status');node.setAttribute('aria-live','polite');document.body.appendChild(node);}
    node.textContent=label||tr('Γίνεται φόρτωση…','Loading…');
    clearTimeout(atlasPendingTimer);
    atlasPendingTimer=setTimeout(()=>{if(atlasPendingCount>0)node.classList.add('visible');},180);
  }
  function atlasClearBusy(){
    atlasPendingCount=Math.max(0,atlasPendingCount-1);
    if(!atlasPendingCount){clearTimeout(atlasPendingTimer);document.getElementById('atlas-network-status')?.classList.remove('visible');}
  }
  document.addEventListener('load',event=>{if(event.target.matches?.('.campaign-gallery img'))event.target.classList.add('atlas-img-ready');},true);
  document.addEventListener('error',event=>{if(event.target.matches?.('.campaign-gallery img'))event.target.classList.add('atlas-img-failed');},true);
  async function fetchSharedData(){
    atlasSetBusy(tr('Φόρτωση Journal και εικόνων…','Loading journal and images…'));
    sharedStatus=tr('Γίνεται λήψη κοινών δεδομένων…','Loading shared data…');
    try{
      const s=await fetch('./data/sessions.json',{cache:'no-store'});
      if(!s.ok)throw Error('Sessions HTTP '+s.status);
      const sessions=await s.json();
      sharedSessions=(Array.isArray(sessions)?sessions:sessions.sessions||[]).filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string').map(x=>({id:x.id,title:x.title,date:x.date||'',text:x.text||'',images:Array.isArray(x.images)?x.images.filter(mediaSrc):[]}));
      campaignImages=[];campaignImageSource='github';driveThumbs={};
      let driveConfigured=false,driveError='';
      try{
        const confResponse=await fetch('./data/drive-config.json',{cache:'no-store'});
        if(confResponse.ok){
          const config=await confResponse.json();
          if(config.enabled===true){
            driveConfigured=true;
            try{campaignImages=await listWorkerImages(config.workerUrl);campaignImageSource='drive';}
            catch(err){driveError=String(err.message||err);}
          }
        }
      }catch(err){driveError=String(err.message||err);}
      if(campaignImageSource!=='drive'){
        const m=await fetch('./data/campaign-images.json',{cache:'no-store'});
        if(m.ok){const items=await m.json();campaignImages=(Array.isArray(items)?items:items.images||[]).filter(x=>x&&typeof x.path==='string'&&safeMediaPath(x.path)).map(x=>({id:x.id||x.path,title:x.title||x.path.split('/').pop(),path:x.path}));}
      }
      sharedLoaded=true;
      sharedStatus=driveConfigured&&driveError?tr('Δεν φορτώθηκαν οι εικόνες μέσω Cloudflare. Εμφανίζεται η εναλλακτική συλλογή GitHub.','Cloudflare gallery images could not load. The GitHub fallback gallery is shown.')+' ('+driveError+')':'';
    }catch(err){sharedStatus=tr('Δεν ήταν δυνατή η λήψη. Τα τοπικά δεδομένα παραμένουν διαθέσιμα.','Shared data could not be loaded. Local entries remain available.');}
    atlasClearBusy();
    if(view==='journal')renderApp();
  }
  function journalEntry(id,remote=false){if(remote)return {...sharedSessions.find(x=>x.id===id),...(sharedEdits[id]||{})};return (c().journal||[]).find(x=>x.id===id);}
  function journalTiles(entries,remote){return entries.map(item=>{const j=remote?journalEntry(item.id,true):item;if(!j)return '';const hidden=remote&&sharedHidden.includes(j.id);if(hidden)return '';
    return `<article class="campaign-entry"><div class="campaign-entry-head"><button class="linklike" data-atlas-journal-open="${remote?'shared:':'local:'}${attr(j.id)}"><strong>${esc(j.title||'')}</strong><small>${esc(j.date||'')} · ${remote?tr('Κοινό από το GitHub','Shared from GitHub'):tr('Τοπικό στη συσκευή','Local on this device')}</small></button><button class="btn sm" data-atlas-journal-edit="${remote?'shared:':'local:'}${attr(j.id)}">${tr('Επεξεργασία','Edit')}</button><button class="btn sm ${remote?'':'warn'}" data-atlas-journal-remove="${remote?'shared:':'local:'}${attr(j.id)}">${remote?tr('Απόκρυψη','Hide'):tr('Διαγραφή','Delete')}</button></div>${mediaCards(j.images||[])}<p class="campaign-excerpt">${esc((j.text||'').slice(0,360))}</p></article>`;}).join('')||`<div class="empty">${tr('Δεν υπάρχουν καταχωρίσεις.','No entries available.')}</div>`;}
  renderJournal=function(ch){return `<div class="atlas-journal-page"><div class="page-title"><div><h2>${tr('Ημερολόγιο περιπέτειας','Campaign Journal')}</h2><p>${tr('Κοινά sessions και εικόνες από το GitHub ή το Google Drive, με προσωπικές αλλαγές.','Shared sessions and GitHub or Google Drive images, with personal customizations.')}</p></div><button class="btn primary sm" data-atlas-journal-new>${tr('+ Καταχώριση','+ Entry')}</button></div>
    ${section('Κοινά sessions','Shared sessions',`<p class="muted small">${tr('Τα κοινά sessions φορτώνονται από το GitHub. Οι αλλαγές και αποκρύψεις εδώ ισχύουν μόνο στη συσκευή σου.','Shared sessions are loaded from GitHub. Your edits and hidden entries remain local to this device.')}</p>${sharedStatus?`<div class="notice">${esc(sharedStatus)}</div>`:''}${journalTiles(sharedSessions,true)}${sharedHidden.length?`<button class="btn sm" data-atlas-journal-restore>${tr('Επαναφορά κρυμμένων κοινών sessions','Restore hidden shared sessions')} (${sharedHidden.length})</button>`:''}`,`<button class="btn sm" data-atlas-journal-refresh>${tr('Ανανέωση κοινών δεδομένων','Refresh shared data')}</button>`)}
    ${section(campaignImageSource==='drive'?'Κοινές εικόνες · Google Drive':'Κοινές εικόνες campaign',campaignImageSource==='drive'?'Shared images · Google Drive':'Shared campaign images',campaignImages.length?`${(()=>{const sessionOptions=[...new Set(Object.values(cloud.imageTags).flatMap(x=>x.sessions||[]))].sort((a,b)=>a.localeCompare(b));const otherTagOptions=[...new Set(Object.values(cloud.imageTags).flatMap(x=>x.tags||[]))].sort((a,b)=>a.localeCompare(b));const filteredImages=campaignImages.filter(x=>{const meta=cloud.imageTags[x.id]||{sessions:[],tags:[]};const sessionMatch=campaignTagFilter==='all'||(meta.sessions||[]).includes(campaignTagFilter);const otherTagMatch=campaignOtherTagFilter==='all'||(meta.tags||[]).includes(campaignOtherTagFilter);return sessionMatch&&otherTagMatch;});return `<div class="atlas-tag-filter"><label>${tr('Φίλτρο Session','Session filter')}</label><select style="max-width:250px" data-atlas-session-filter><option value="all">${tr('Όλες οι εικόνες','All images')}</option>${sessionOptions.map(t=>`<option value="${attr(t)}" ${campaignTagFilter===t?'selected':''}>${esc(t)}</option>`).join('')}</select><label>${tr('Φίλτρο Other Tags','Other tags filter')}</label><select style="max-width:250px" data-atlas-other-tag-filter><option value="all">${tr('Όλα τα tags','All tags')}</option>${otherTagOptions.map(t=>`<option value="${attr(t)}" ${campaignOtherTagFilter===t?'selected':''}>${esc(t)}</option>`).join('')}</select></div>${filteredImages.length?mediaCards(filteredImages.map(x=>x.path)):`<div class="empty">${tr('Δεν βρέθηκαν εικόνες με αυτά τα φίλτρα.','No images match these filters.')}</div>`}<div class="cloud-image-tag-list">${filteredImages.map(x=>`<div class="rowline"><span>${esc(x.title)} <small>${esc([...(cloud.imageTags[x.id]?.sessions||[]),...(cloud.imageTags[x.id]?.tags||[])].join(' · '))}</small></span>${cloud.user&&['creator','dm'].includes(cloud.user.role)?`<button type="button" class="btn sm" data-atlas-tags="${attr(x.id)}">${tr('Ετικέτες','Tags')}</button>`:''}</div>`).join('')}</div>`;})()}`:`<p class="muted">${tr('Πρόσθεσε φωτογραφίες στον δημόσιο φάκελο Drive που εξυπηρετεί ο Cloudflare Worker ή στο εναλλακτικό GitHub manifest.','Add photos to the public Drive folder served by the Cloudflare Worker or to the fallback GitHub manifest.')}</p>`)}
    ${section('Οι προσωπικές μου καταχωρίσεις','My personal entries',journalTiles((ch.journal||[]).slice().reverse(),false),`<button class="btn sm" data-atlas-journal-new>${tr('+ Προσθήκη','+ Add')}</button>`)}
    ${section('Προσωπικές σημειώσεις','Personal notes',`<textarea id="notes-editor" rows="5" placeholder="${tr('Σημειώσεις και παρατηρήσεις…','Notes and observations…')}">${esc(ch.notes||'')}</textarea><button class="btn sm primary" data-action="save-notes">${tr('Αποθήκευση','Save')}</button>`)}</div>`;
  };
  function journalOpen(id,remote){const j=journalEntry(id,remote);if(!j)return;openModal(j.title,`<p class="muted">${esc(j.date||'')} · ${remote?tr('Κοινή καταχώριση','Shared entry'):tr('Προσωπική καταχώριση','Personal entry')}</p>${mediaCards(j.images||[])}<div class="detail-description">${esc(j.text||'').replace(/\n/g,'<br>')}</div>`, `<button class="btn" data-atlas-journal-edit="${remote?'shared:':'local:'}${attr(id)}">${tr('Επεξεργασία','Edit')}</button><button class="btn" data-action="close-modal">${tr('Κλείσιμο','Close')}</button>`,true);}
  function journalEdit(id='',remote=false){const j=id?journalEntry(id,remote):{id:'',title:'',date:new Date().toISOString().slice(0,10),text:'',images:[]};if(!j)return;const paths=new Set(j.images||[]);const options=campaignImages.map(x=>`<label class="campaign-option"><input type="checkbox" name="image" value="${attr(x.path)}" ${paths.has(x.path)?'checked':''}><span>${esc(x.title)}</span></label>`).join('');openModal(id?tr('Επεξεργασία session','Edit session'):tr('Νέα καταχώριση','New entry'),`<form id="campaign-entry-form" data-remote="${remote?'1':'0'}" data-id="${attr(id)}"><div class="form-grid"><div class="field wide"><label>${tr('Τίτλος','Title')}</label><input name="title" maxlength="160" value="${attr(j.title||'')}" required></div><div class="field"><label>${tr('Ημερομηνία','Date')}</label><input type="date" name="date" value="${attr(j.date||'')}"></div><div class="field wide"><label>${tr('Περιγραφή / σημειώσεις','Description / notes')}</label><textarea name="text" rows="8">${esc(j.text||'')}</textarea></div></div><h3>${tr('Κοινές εικόνες','Shared images')} · ${campaignImageSource==='drive'?'Google Drive':'GitHub'}</h3><div class="campaign-options">${options||tr('Δεν έχουν δηλωθεί ακόμα κοινές εικόνες.','No shared images are listed yet.')}</div><h3>${tr('Προσωπική εικόνα από συσκευή','Personal image from device')}</h3><input type="file" name="uploadImage" accept="image/png,image/jpeg,image/webp"><p class="muted small">${tr('Η προσωπική εικόνα παραμένει στη συσκευή σου και στο αντίγραφο JSON. Για κοινή εικόνα χρησιμοποίησε τον δημόσιο φάκελο Google Drive ή το GitHub.','Personal images remain on your device and in your JSON backup. For shared images, use the public Google Drive folder or GitHub.')}</p><input type="hidden" name="previousLocal" value="${attr((j.images||[]).find(x=>safePortrait(x))||'')}"><div class="modal-footer"><button class="btn primary" type="submit">${tr('Αποθήκευση','Save')}</button><button class="btn" type="button" data-action="close-modal">${tr('Ακύρωση','Cancel')}</button></div></form>`,'',true);}
  async function journalSubmit(form){const fd=new FormData(form),remote=form.dataset.remote==='1',id=form.dataset.id;const title=String(fd.get('title')||'').trim(),date=String(fd.get('date')||''),text=String(fd.get('text')||'');if(!title)return;let images=fd.getAll('image').filter(mediaSrc),keep=String(fd.get('previousLocal')||'');if(safePortrait(keep))images.push(keep);const image=fd.get('uploadImage');if(image instanceof File&&image.size>0){try{images.push(await compressPortrait(image));}catch(e){toast(tr('Αδύνατη προσθήκη εικόνας: ','Could not add image: ')+e.message);return;}}if(remote){sharedEdits[id]={title,date,text,images};saveSharedPref();}else{const j=(c().journal||[]).find(x=>x.id===id),record={id:id||uid(),title,date,text,images};if(j)Object.assign(j,record);else c().journal.push(record);save();}closeModal();renderApp();toast(tr('Η καταχώριση αποθηκεύτηκε.','Entry saved.'));}
  let libraryClass='all',libraryOwned='all';
  const priorRenderLibrary=renderLibrary;
  renderLibrary=function(ch){let entries=[...D.spells,...D.maneuvers,...D.feats,...D.conditions,...D.actions,...D.masteries];let filtered=entries.filter(x=>(libraryCategory==='all'||x.kind===libraryCategory)&&(libraryCategory!=='Spell'||libraryLevel==='all'||String(x.level)===libraryLevel)&&(libraryClass==='all'||x.kind!=='Spell'||(x.classes||[]).includes(libraryClass))&&(libraryOwned==='all'||(libraryOwned==='owned'?((ch.spellbook||[]).some(s=>s.ref===x.id)||(ch.feats||[]).includes(x.id)||(ch.maneuvers||[]).includes(x.id)):!((ch.spellbook||[]).some(s=>s.ref===x.id)||(ch.feats||[]).includes(x.id)||(ch.maneuvers||[]).includes(x.id))))&&`${x.name} ${x.summary||''} ${L.summary(x)||''} ${x.kind}`.toLowerCase().includes(libraryQuery.toLowerCase()));
    return `<div class="page-title"><div><h2>${tr('Βιβλιοθήκη κανόνων','Rules Library')}</h2><p>${tr('Αναζήτηση και φίλτρα σε ξόρκια, προνόμια, ικανότητες και καταστάσεις.','Search and filter spells, feats, abilities, and conditions.')}</p></div></div><div class="library-filters"><input type="search" data-library-search placeholder="${tr('Αναζήτηση…','Search…')}" value="${attr(libraryQuery)}"><select data-library-kind><option value="all">${tr('Όλες οι κατηγορίες','All categories')}</option>${['Spell','Maneuver','Feat','Condition','Action','Weapon Mastery'].map(k=>`<option value="${k}" ${libraryCategory===k?'selected':''}>${tr(({Spell:'Ξόρκια',Maneuver:'Ελιγμοί',Feat:'Προνόμια',Condition:'Καταστάσεις',Action:'Ενέργειες','Weapon Mastery':'Εξειδικεύσεις όπλων'})[k],k)}</option>`).join('')}</select><select data-library-level ${libraryCategory!=='Spell'?'disabled':''}><option value="all">${tr('Όλα τα επίπεδα','All levels')}</option>${Array.from({length:10},(_,i)=>`<option value="${i}" ${String(libraryLevel)===String(i)?'selected':''}>${i===0?tr('Ξόρκια μηδενικού επιπέδου','Cantrips'):tr('Επίπεδο','Level')+' '+i}</option>`).join('')}</select><select data-atlas-library-class><option value="all">${tr('Όλες οι κλάσεις','All classes')}</option>${Object.keys(D.classes).filter(x=>x!=='Custom').map(x=>`<option ${libraryClass===x?'selected':''}>${x}</option>`).join('')}</select><select data-atlas-library-owned><option value="all">${tr('Όλα','All')}</option><option value="owned" ${libraryOwned==='owned'?'selected':''}>${tr('Στον χαρακτήρα μου','Owned')}</option><option value="unowned" ${libraryOwned==='unowned'?'selected':''}>${tr('Δεν τα έχω','Not owned')}</option></select></div><details class="atlas-srd-viewer"><summary>${tr('Επίσημο πλήρες SRD 5.2.1 (κανόνες 2024)','Official complete SRD 5.2.1 (2024 rules)')}</summary><p>${tr('Το πρωτότυπο, πλήρες επίσημο κείμενο βρίσκεται στο ενσωματωμένο έγγραφο (στα Αγγλικά). Οι σύντομες κάρτες παρακάτω είναι ξεχωριστές περιλήψεις, όχι αυτούσιες αποδόσεις.','Read the complete original official text in the embedded document (English). The cards below remain separate summaries, not verbatim transcriptions.')}</p><a href="https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf" target="_blank" rel="noopener noreferrer">${tr('Άνοιγμα ολόκληρου επίσημου SRD 5.2.1 σε νέα καρτέλα ↗','Open the complete official SRD 5.2.1 in a new tab ↗')}</a><iframe title="Official SRD 5.2.1" loading="lazy" src="https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf#page=1"></iframe><p class="atlas-srd-credit">This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.</p></details><p class="muted small">${filtered.length} ${tr('αποτελέσματα','results')}</p><div class="grid two">${filtered.map(x=>`<button class="tile" data-detail="${attr(x.id)}"><span class="atlas-library-entry"><strong class="atlas-library-entry-title">${esc(x.name)}</strong><small class="atlas-library-entry-meta">${esc(x.kind)}${x.level!=null?' · '+(x.level||0):''}</small></span><span class="right">${svg('chevron')}</span></button>`).join('')||`<div class="empty">${tr('Δεν βρέθηκαν αποτελέσματα.','No matching entries.')}</div>`}</div>`;
  };

  backup=function(){const payload={application:'D&D Atlas',schema:2,rulesVersion:'2024',exportedAt:new Date().toISOString(),characters,journalPreferences:{hiddenSharedSessions:sharedHidden,sharedSessionEdits:sharedEdits}};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='dndatlas-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast(tr('Το αντίγραφο ασφαλείας δημιουργήθηκε.','Backup exported.'));};
  function print2024(ch){const win=window.open('','_blank');if(!win){toast(tr('Επίτρεψε αναδυόμενα παράθυρα για εκτύπωση.','Allow popups to print.'));return;}const p=ch.passivePerceptionOverride!==''&&ch.passivePerceptionOverride!=null?Number(ch.passivePerceptionOverride):10+skillMod(ch,'Perception');let a=Object.entries(D.abilities).map(([k,n])=>`<div class="ability"><b>${esc(k)}</b><strong>${ch.abilities?.[k]||10}</strong><em>${signed(ability(ch,k))}</em></div>`).join('');let skills=D.skills.map(([n])=>`<tr><td>${ch.skills?.[n]?'●':'○'} ${esc(n)}</td><td>${signed(skillMod(ch,n))}</td></tr>`).join('');win.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(ch.name)} - D&D 2024</title><style>body{font:13px Arial;margin:25px;color:#111}h1{margin-bottom:4px}header{border-bottom:3px solid #111}.meta{display:flex;gap:25px;flex-wrap:wrap;padding:10px 0}.abilities{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.ability{border:2px solid #444;border-radius:8px;padding:12px 4px;text-align:center}.ability>*{display:block}.ability strong{font-size:24px}.ability em{font-size:18px}.two{display:grid;grid-template-columns:1fr 1fr;gap:24px}table{width:100%;border-collapse:collapse}td{padding:4px;border-bottom:1px solid #ddd}h3{border-bottom:1px solid}button{padding:10px;margin:8px 0}@media print{button{display:none}@page{margin:13mm}}.small{font-size:11px;color:#555}</style></head><body><button onclick="print()">Print / Save as PDF</button><header><h1>${esc(ch.name)}</h1><div>D&D 5e 2024 · Personal reference sheet (not official artwork/template)</div></header><div class="meta"><b>${esc(classLabel(ch))}</b><span>${esc(ch.species)} · ${esc(ch.background)}</span><span>Level ${totalLevel(ch)}</span><span>Proficiency Bonus ${signed(prof(ch))}</span></div><div class="abilities">${a}</div><div class="meta"><b>HP ${ch.hp?.current||0}/${ch.hp?.max||1}</b><b>AC ${AC(ch)}</b><b>Initiative ${signed(initMod(ch))}</b><b>Speed ${ch.speed} ft</b><b>Passive Perception ${p}</b></div><div class="two"><section><h3>Skills</h3><table>${skills}</table></section><section><h3>Saving Throws</h3><table>${Object.entries(D.abilities).map(([k,n])=>`<tr><td>${esc(n)} ${(ch.saves||[]).includes(k)?'●':'○'}</td><td>${signed(saveMod(ch,k))}</td></tr>`).join('')}</table><h3>Weapons</h3>${(ch.attacks||[]).map(x=>`<div>${esc(x.name)}: 1d20${signed(attackBonus(ch,x))} · ${esc(attackDamage(ch,x))} ${esc(x.type||'')}</div>`).join('')}<h3>Feats</h3><div>${(ch.feats||[]).map(id=>esc(findReference(id)?.name||id)).join(' · ')}</div><h3>Features</h3>${atlasAllFeatures(ch).map(x=>`<div>${esc(x.name)}</div>`).join('')}</section></div><h3>Spells</h3><div>${(ch.spellbook||[]).map(x=>esc(x.name)).join(' · ')}</div><h3>Background story</h3><p>${esc(ch.backgroundStory||'').replace(/\n/g,'<br>')}</p><p class="small">Fan-made 2024 rules reference. For the official blank 2024 sheet, visit dndbeyond.com/resources/1779-d-d-character-sheets.</p></body></html>`);win.document.close();win.focus();}

  /* Intercept new, deliberately scoped UI interactions before generic app handlers. */
  function chooseMasteries(){
    const ch=c(),lvl=totalLevel(ch);if(!masteryCapacity(ch))return;
    const limit=masteryCapacity(ch),chosen=new Set(selectedMasteries(ch));
    openModal(tr('Εξειδικεύσεις όπλων','Weapon Masteries'),`<form id="atlas-mastery-form"><p class="muted small">${tr(`Επίλεξε έως ${limit} είδη όπλων. Αν δεν έχουν συμπληρωθεί όλα, θα εμφανίζεται προειδοποίηση στην Επισκόπηση.`,`Choose up to ${limit} weapon kinds. An Overview warning remains until all are selected.`)}</p><div class="mastery-picker">${D.weapons.filter(w=>R.masteryEligible(ch,w,D.weapons)).map(w=>`<label class="mastery-choice"><input type="checkbox" name="weaponMastery" value="${attr(w.name)}" ${chosen.has(w.name)?'checked':''}><span><b>${esc(w.name)}</b><small>${esc(w.group)} · ${esc(w.mastery)} · ${esc(w.damage)}</small></span></label>`).join('')}</div><div class="modal-footer"><button type="submit" class="btn primary">${tr('Αποθήκευση επιλογών','Save selections')}</button><button type="button" class="btn" data-action="close-modal">${tr('Ακύρωση','Cancel')}</button></div></form>`,'',true);
  }
  document.addEventListener('submit',e=>{if(e.target.id!=='atlas-mastery-form')return;e.preventDefault();e.stopImmediatePropagation();const ch=c(),lvl=Number((ch.classes||[]).find(x=>x.name==='Fighter')?.level||0),limit=masteryCapacity(ch),names=[...new FormData(e.target).getAll('weaponMastery')];if(names.length>limit||new Set(names).size!==names.length||names.some(name=>!R.masteryEligible(ch,D.weapons.find(w=>w.name===name),D.weapons))){toast(tr(`Επίλεξε έως ${limit} νόμιμα και διαφορετικά όπλα σύμφωνα με την κλάση σου.`,`Choose up to ${limit} distinct, class-eligible weapon types.`));return;}ch.weaponMasteries=names;save();closeModal();renderApp();toast(tr('Οι εξειδικεύσεις αποθηκεύτηκαν.','Weapon Masteries saved.'));},true);
  document.addEventListener('click',e=>{const el=e.target.closest('[data-atlas-toggle-mastery]');if(!el)return;e.preventDefault();e.stopImmediatePropagation();atlasMasteryToggle(c(),el.dataset.atlasToggleMastery);},true);
  document.addEventListener('click',e=>{const el=e.target.closest('[data-action="choose-masteries"]');if(!el)return;e.preventDefault();e.stopImmediatePropagation();chooseMasteries();},true);
  document.addEventListener('click',e=>{const el=e.target.closest('[data-portrait-save],[data-portrait-reset],[data-combat-spell-mode],[data-atlas-journal-new],[data-atlas-journal-open],[data-atlas-journal-edit],[data-atlas-journal-remove],[data-atlas-journal-restore],[data-atlas-journal-refresh],[data-atlas-print]');if(!el)return;e.stopImmediatePropagation();e.preventDefault();
    if(el.hasAttribute('data-portrait-save')){if(!portraitDraft)return;c().overviewPortrait={...portraitDraft};save();closeModal();renderApp();toast(tr('Το κάδρο αποθηκεύτηκε.','Framing saved.'));return;}
    if(el.hasAttribute('data-portrait-reset')){portraitDraft={zoom:1,x:0,y:0};let r=document.getElementById('portrait-zoom-range');if(r)r.value=1;portraitRefresh();return;}
    if(el.dataset.combatSpellMode){combatSpellMode=el.dataset.combatSpellMode;renderApp();return;}
    if(el.hasAttribute('data-atlas-journal-new')){journalEdit();return;}
    if(el.dataset.atlasJournalOpen){let [origin,id]=el.dataset.atlasJournalOpen.split(':');journalOpen(id,origin==='shared');return;}
    if(el.dataset.atlasJournalEdit){let [origin,id]=el.dataset.atlasJournalEdit.split(':');journalEdit(id,origin==='shared');return;}
    if(el.dataset.atlasJournalRemove){let [origin,id]=el.dataset.atlasJournalRemove.split(':');if(!confirm(origin==='shared'?tr('Να κρύψεις αυτό το κοινό session μόνο στη συσκευή σου;','Hide this shared session only on your device?'):tr('Να διαγραφεί η προσωπική καταχώριση;','Delete your local entry?')))return;if(origin==='shared'){sharedHidden=[...new Set([...sharedHidden,id])];saveSharedPref();}else{c().journal=c().journal.filter(x=>x.id!==id);save();}renderApp();return;}
    if(el.hasAttribute('data-atlas-journal-restore')){sharedHidden=[];saveSharedPref();renderApp();return;}
    if(el.hasAttribute('data-atlas-journal-refresh')){fetchSharedData();return;}
    if(el.hasAttribute('data-atlas-print')){if(window.ATLAS_EXPORT_PDF){window.ATLAS_EXPORT_PDF(c(),{proficiency:prof(c()),armorClass:AC(c()),initiative:initMod(c()),spellDC:spellDC(c()),spellAttack:spellAttack(c()),skillMod:skillMod,saveMod:saveMod,abilityMod:ability}).catch(e=>toast('PDF: '+e.message));}else print2024(c());return;}
  },true);
  document.addEventListener('input',e=>{if(e.target.matches('[data-portrait-zoom]')&&portraitDraft){portraitDraft.zoom=clamp(Number(e.target.value),1,3);const max=(portraitDraft.zoom-1)*50;portraitDraft.x=Math.max(-max,Math.min(max,portraitDraft.x));portraitDraft.y=Math.max(-max,Math.min(max,portraitDraft.y));portraitRefresh();}},true);
  document.addEventListener('pointerdown',e=>{const frame=e.target.closest('#portrait-adjust-preview');if(!frame||!portraitDraft||!frame.querySelector('img'))return;portraitDrag={x:e.clientX,y:e.clientY,baseX:portraitDraft.x,baseY:portraitDraft.y,w:frame.offsetWidth||1,h:frame.offsetHeight||1};frame.setPointerCapture(e.pointerId);e.preventDefault();},true);
  document.addEventListener('pointermove',e=>{if(!portraitDrag||!portraitDraft)return;const max=(portraitDraft.zoom-1)*50;portraitDraft.x=Math.max(-max,Math.min(max,portraitDrag.baseX+(e.clientX-portraitDrag.x)/portraitDrag.w*100));portraitDraft.y=Math.max(-max,Math.min(max,portraitDrag.baseY+(e.clientY-portraitDrag.y)/portraitDrag.h*100));portraitRefresh();},true);
  document.addEventListener('pointerup',()=>{portraitDrag=null;},true);
  document.addEventListener('submit',e=>{if(e.target.id==='campaign-entry-form'){e.preventDefault();e.stopImmediatePropagation();journalSubmit(e.target);}},true);
  document.addEventListener('change',e=>{if(e.target.matches('[data-atlas-library-class]')){libraryClass=e.target.value;renderApp();}if(e.target.matches('[data-atlas-library-owned]')){libraryOwned=e.target.value;renderApp();}},true);
  /* GitHub JSON is only read on first use. Never overwrite saved browser characters. */

  fetchSharedData();
  cloudBoot();

  // Cloudflare D1 characters and role-based UI. The server independently enforces every permission.
  let campaignTagFilter='all';
  let campaignOtherTagFilter='all';
  const cloudMsg=(el,en)=>L.getLanguage()==='el'?el:en;
  const canEditCharacter=ch=>!cloud.enabled||(cloud.user&&(['creator','dm'].includes(cloud.user.role)||cloud.user.id===ch._ownerId));
  const canManageUsers=()=>cloud.enabled&&cloud.user?.role==='creator';
  const cloudHeaders=()=>({'Authorization':'Bearer '+cloud.token,'Content-Type':'application/json'});
  async function cloudRequest(path,method='GET',body=null,auth=true){
   const label=method==='GET'?cloudMsg('Έλεγχος και φόρτωση δεδομένων…','Checking and loading data…'):cloudMsg('Αποθήκευση αλλαγών…','Saving changes…');
   atlasSetBusy(label);
   try{
    const r=await fetch(cloud.url+path,{method,headers:auth?cloudHeaders():{'Content-Type':'application/json'},body:body===null?undefined:JSON.stringify(body),cache:'no-store'});
    const data=await r.json().catch(()=>({error:'Invalid response'}));
    if(!r.ok)throw Object.assign(new Error(data.error||'HTTP '+r.status),{status:r.status});
    return data;
   }finally{atlasClearBusy();}
  }
  function cloudOverlay(content){
   document.body.classList.add('cloud-auth-locked');let root=document.getElementById('cloud-auth');if(!root){root=document.createElement('div');root.id='cloud-auth';document.body.appendChild(root);}
   root.className='cloud-auth-overlay';root.innerHTML='<div class="cloud-auth-card">'+content+'</div>';
  }
  function cloudUnlock(){document.body.classList.remove('cloud-auth-locked');document.getElementById('cloud-auth')?.remove();}
  function cloudLoginScreen(error=''){
   cloudOverlay(`<h1>D&D Atlas</h1><p>${cloudMsg('Σύνδεση στην κοινή campaign','Sign in to your shared campaign')}</p>${error?`<div class="notice">${esc(error)}</div>`:''}<form id="cloud-login-form"><label>${cloudMsg('Όνομα χρήστη','Username')}<input name="username" autocomplete="username" required minlength="3"></label><label>${cloudMsg('PIN / κωδικός','PIN / passphrase')}<input name="pin" type="password" autocomplete="current-password" required></label><label class="toggle-line"><input name="remember" type="checkbox" style="width:auto">${cloudMsg('Να παραμείνω συνδεδεμένος','Stay signed in')}</label><button type="submit" class="btn primary">${cloudMsg('Σύνδεση','Sign in')}</button></form><button class="btn" data-cloud-recover>${cloudMsg('Ανάκτηση Creator με εφεδρικό κωδικό','Creator recovery with backup code')}</button><small style="display:block;margin-top:14px;color:#a4b5c5">${cloudMsg('Οι χαρακτήρες φορτώνονται από τη βάση D1. Δεν χρησιμοποιείται Google login.','Characters load from D1. No Google account needed.')}</small>`);
  }
  async function cloudBoot(){
   try{
    const response=await fetch('./data/api-config.json',{cache:'no-store'});if(!response.ok)return;
    const cfg=await response.json();if(cfg.enabled!==true)return;
    if(!/^https:\/\/[\w.-]+\.workers\.dev\/?$/.test(cfg.apiUrl||'')){
      cloudOverlay(`<h1>D&D Atlas</h1><div class="notice">${cloudMsg('Το API δεν έχει ρυθμιστεί σωστά. Διόρθωσε το data/api-config.json.','Invalid API configuration. Fix data/api-config.json.')}</div>`);return;
    }
    cloud.url=cfg.apiUrl.replace(/\/$/,'');cloud.enabled=true;
    cloud.token=sessionStorage.getItem('dndatlas:session')||localStorage.getItem('dndatlas:remember')||'';
    if(cloud.token){try{cloud.user=(await cloudRequest('/auth/me')).me;await cloudRefresh();await cloudTagsRefresh();cloudUnlock();return;}catch{cloud.token='';sessionStorage.removeItem('dndatlas:session');localStorage.removeItem('dndatlas:remember');}}
    cloudLoginScreen();
   }catch(e){cloudOverlay(`<h1>D&D Atlas</h1><div class="notice">${cloudMsg('Δεν είναι διαθέσιμο το API.','API unavailable.')} ${esc(e.message)}</div><button class="btn" onclick="location.reload()">Retry</button>`);}
  }
  async function cloudRefresh(){
   if(!cloud.token)return;
   const result=await cloudRequest('/characters');const prev=selectedId;
   characters=(result.characters||[]).map(row=>({...row.data,_ownerId:row.ownerUserId}));
   cloud.revisions=Object.fromEntries((result.characters||[]).map(row=>[row.id,row.revision]));
   cloud.user=result.me||cloud.user;
   if(!characters.length)characters=[defaultChar('No characters yet')];
   selectedId=characters.find(x=>x.id===prev)?.id||characters[0].id;
   cloud.ready=true;renderApp();
  }
  function cloudPush(character){
   if(!cloud.enabled||!cloud.ready||!cloud.user||!character)return;
   if(!canEditCharacter(character)){toast(cloudMsg('Δεν έχεις δικαίωμα επεξεργασίας αυτού του χαρακτήρα.','You cannot edit this character.'));cloudRefresh().catch(()=>{});return;}
   const snapshot=structuredClone(character);delete snapshot._ownerId;
   const id=snapshot.id;
   const previous=cloud.queues.get(id)||Promise.resolve();
   const next=previous.catch(()=>{}).then(async()=>{
    if(cloud.revisions[id]){
     const updated=await cloudRequest('/characters/'+encodeURIComponent(id),'PUT',{character:snapshot,revision:cloud.revisions[id]});
     cloud.revisions[id]=updated.revision;
    }else{
     if(!['creator','dm'].includes(cloud.user.role))throw Error('Admin permission required to create a character');
     const created=await cloudRequest('/characters/'+encodeURIComponent(id),'POST',{character:snapshot});cloud.revisions[id]=created.revision;
    }
   });
   cloud.queues.set(id,next);
   next.catch(e=>{toast((e.status===409?cloudMsg('Σύγκρουση αλλαγών. Ανανέωσε τα δεδομένα.','Conflicting changes. Refresh before editing.'):'Save failed: ')+e.message);});
  }
  function cloudAccount(){
   if(!cloud.enabled)return;
   let u=cloud.user;const options=`<button class="btn" data-cloud-refresh>${cloudMsg('Ανανέωση χαρακτήρων','Refresh characters')}</button>${u.role==='creator'?`<button class="btn primary" data-cloud-admin>${cloudMsg('Διαχείριση χρηστών','Manage users')}</button>`:''}<button class="btn warn" data-cloud-logout>${cloudMsg('Αποσύνδεση','Sign out')}</button>`;
   openModal(cloudMsg('Λογαριασμός','Account'),`<p>${cloudMsg('Συνδεδεμένος ως','Signed in as')} <strong>${esc(u.username)}</strong> (${esc(u.role)})</p><p>${cloudMsg('Τα δεδομένα της παρέας είναι κοινά στη Cloudflare D1.','Party data is shared in Cloudflare D1.')}</p><div class="cloud-account-grid">${options}</div>`, `<button class="btn" data-action="close-modal">${cloudMsg('Κλείσιμο','Close')}</button>`);
  }
  async function cloudResetPinScreen(id){
   if(!canManageUsers())return;
   const result=await cloudRequest('/users');
   const u=result.users.find(x=>String(x.id)===String(id));
   if(!u)return toast(cloudMsg('Ο χρήστης δεν βρέθηκε.','User not found.'));
   const creator=u.role==='creator';
   const help=creator?cloudMsg('Κωδικός Creator: τουλάχιστον 8 χαρακτήρες.','Creator password: at least 8 characters.'):cloudMsg('PIN παίκτη/DM: 6–12 ψηφία.','Player/DM PIN: 6–12 digits.');
   openModal(cloudMsg('Αλλαγή κωδικού','Reset password'),`<p>${cloudMsg('Χρήστης','User')}: <strong>${esc(u.username)}</strong> (${esc(u.role)})</p><p class="muted small">${help} ${cloudMsg('Οι προηγούμενες συνδέσεις του χρήστη θα ακυρωθούν.','Existing sessions for this user will be revoked.')}</p><form id="cloud-reset-pin-form" data-user-id="${u.id}" data-user-role="${esc(u.role)}"><div class="form-grid"><div class="field"><label>${cloudMsg('Νέος κωδικός','New password')}<input name="pin" type="password" autocomplete="new-password" required minlength="${creator?8:6}" ${creator?'':'maxlength="12" inputmode="numeric" pattern="[0-9]{6,12}"'}></label></div><div class="field"><label>${cloudMsg('Επιβεβαίωση κωδικού','Confirm password')}<input name="confirm" type="password" autocomplete="new-password" required minlength="${creator?8:6}" ${creator?'':'maxlength="12" inputmode="numeric" pattern="[0-9]{6,12}"'}></label></div></div><button class="btn primary" type="submit">${cloudMsg('Αποθήκευση νέου κωδικού','Save new password')}</button></form>`,`<button class="btn" data-cloud-admin>${cloudMsg('Πίσω στους χρήστες','Back to users')}</button>`);
  }
  async function cloudUsers(){
   const d=await cloudRequest('/users');
   let rows=d.users.map(u=>`<div class="cloud-account-row"><strong>${esc(u.username)} · ${esc(u.role)} ${u.active?'':'(inactive)'}</strong><small>${cloudMsg('Χαρακτήρας','Character')}: ${esc(characters.find(ch=>ch.id===u.ownerCharacterId)?.name||'—')}</small><div class="actions-inline"><button class="btn sm" data-cloud-edit="${u.id}" data-username="${attr(u.username)}">${cloudMsg('Όνομα χρήστη','Edit username')}</button><button class="btn sm" data-cloud-pin="${u.id}">${cloudMsg('Νέο PIN','Reset PIN')}</button><button class="btn sm" data-cloud-assign="${u.id}">${cloudMsg('Ανάθεση','Assign')}</button>${u.role!=='creator'?`<button class="btn sm" data-cloud-toggle="${u.id}" data-active="${u.active?'1':'0'}">${u.active?cloudMsg('Απενεργοποίηση','Disable'):cloudMsg('Ενεργοποίηση','Enable')}</button><button class="btn sm warn" data-cloud-delete="${u.id}" data-username="${attr(u.username)}">${cloudMsg('Οριστική διαγραφή','Delete permanently')}</button>`:''}</div></div>`).join('');
   openModal(cloudMsg('Χρήστες — μόνο Creator','Users — Creator only'),`<p>${cloudMsg('Τα υπάρχοντα PIN δεν εμφανίζονται. Μπορείς μόνο να τα αλλάξεις.','Existing PINs cannot be viewed, only reset.')}</p><form id="cloud-create-user"><div class="form-grid"><div class="field"><label>Username<input name="username" required pattern="[A-Za-z][A-Za-z0-9_-]{2,29}"></label></div><div class="field"><label>${cloudMsg('PIN (6–12 ψηφία)','PIN (6–12 digits)')}<input type="password" name="pin" required minlength="6" maxlength="12" pattern="[0-9]{6,12}" inputmode="numeric" autocomplete="new-password" title="6–12 digits (0–9)"></label></div><div class="field"><label>Role<select name="role"><option value="player">Player</option><option value="dm">DM</option></select></label></div></div><button class="btn primary" type="submit">${cloudMsg('Προσθήκη χρήστη','Add user')}</button></form>${rows}`,`<button class="btn" data-action="close-modal">${cloudMsg('Κλείσιμο','Close')}</button>`,true);
  }
  async function cloudTagsRefresh(){
   if(!cloud.enabled||!cloud.token)return;
   const r=await cloudRequest('/images/tags');
   cloud.imageTags=Object.fromEntries((r.images||[]).map(i=>[i.id,i]));
   if(view==='journal')renderApp();
  }
  function editImageTags(fileId){
   if(!['dm','creator'].includes(cloud.user?.role))return toast(cloudMsg('Μόνο DM ή Creator.','DM or Creator only.'));
   const prev=cloud.imageTags[fileId]||{sessions:[],tags:[]};
   const label=campaignImages.find(x=>x.id===fileId)?.title||fileId;
   openModal(cloudMsg('Ετικέτες εικόνας','Image tags'),
    `<p class="muted small">${esc(label)}</p><form id="atlas-image-tags-form" data-file-id="${attr(fileId)}">`+
    `<div class="field"><label>${cloudMsg('Sessions (διαχωρισμένα με κόμμα)','Sessions (comma separated)')}<input name="sessions" maxlength="1600" value="${attr((prev.sessions||[]).join(', '))}"></label></div>`+
    `<div class="field"><label>${cloudMsg('Άλλα tags (διαχωρισμένα με κόμμα)','Other tags (comma separated)')}<input name="tags" maxlength="2400" value="${attr((prev.tags||[]).join(', '))}"></label></div>`+
    `<button type="submit" class="btn primary">${cloudMsg('Αποθήκευση','Save')}</button></form>`,
    `<button type="button" class="btn" data-action="close-modal">${cloudMsg('Άκυρο','Cancel')}</button>`);
  }
  function cloudApplyAccessUI(){
   if(!cloud.enabled||!cloud.user)return;
   const readOnly=!canEditCharacter(c());
   document.querySelectorAll('[data-atlas-session]').forEach(x=>x.textContent='☁ '+cloud.user.username);
   if(readOnly){document.querySelectorAll('input#notes-editor,textarea#notes-editor').forEach(x=>x.readOnly=true);}
  }
  const renderAppOriginal=renderApp;
  renderApp=function(){renderAppOriginal();cloudApplyAccessUI();};
  function isConsumable(item){const kind=String(item?.category||'').toLowerCase(),name=String(item?.name||'').toLowerCase();return kind==='consumable'||/potion|antidote|elixir|healing draught|φίλτρο|αντίδοτο/.test(name);}
  function weaponInventoryRows(ch){
   const owned=(ch.inventory||[]).filter(i=>!!atlasWeaponKind(i)||i.category==='weapon');
   const rows=owned.map(i=>{
    const name=atlasWeaponKind(i),attack=(ch.attacks||[]).find(a=>String(a.name).toLowerCase()===String(i.name).toLowerCase());
    return `<div class="inv-item"><div class="overflow-hidden"><button class="linklike" data-item-detail="${attr(i.id)}"><strong>${esc(i.name)}</strong></button><div class="tiny muted">${attack?`1d20${signed(attackBonus(ch,attack))} · ${esc(attackDamage(ch,attack))} ${esc(attack.type||'')}`:tr('Δεν υπάρχει ακόμα τύπος επίθεσης','No attack formula yet')}</div><div class="atlas-inventory-meta">${weaponStateTag(i)}</div></div><div class="atlas-item-weapon-tools">${name?masteryStar(ch,name):''}<span class="qty">×${i.qty||0}</span><button class="btn sm" data-edit-item="${attr(i.id)}">${tr('Κατάσταση / αλλαγή','Condition / Edit')}</button></div></div>`;
   });
   const missing=(ch.attacks||[]).filter(a=>!owned.some(i=>String(i.name).toLowerCase()===String(a.name).toLowerCase()));
   for(const a of missing)rows.push(`<div class="inv-item"><div><strong>${esc(a.name)}</strong><small>${tr('Υπάρχει ως επίθεση αλλά δεν είναι καταχωρισμένο στον Εξοπλισμό.','Attack exists but not recorded in Inventory.')}</small></div><button class="btn sm" data-action="add-item">${tr('Καταχώριση','Add item')}</button></div>`);
   return rows.join('')||`<div class="empty">${tr('Δεν υπάρχουν όπλα στον Εξοπλισμό.','No weapons in Inventory.')}</div>`;
 }
 function studentInventoryPanel(ch){
  if(!isBattleMaster(ch))return '';
  const {tool,skill}=studentSelection(ch),missing=!tool||!skill;
  const info=R.TOOL_RULES[tool],translated=L.getLanguage()==='el'?R.TOOL_RULES_EL[tool]:null;
  const toolCard=tool?`<div class="atlas-tool-card"><strong>${esc(tool)} · ${tr('Επάρκεια','Proficiency')} ${signed(prof(ch))}</strong><p class="muted small">${tr('Η επάρκεια δεν σημαίνει ότι διαθέτεις φυσικό σετ εργαλείων.','Proficiency does not automatically grant the physical tool set.')}</p>${info?`<div class="rowline"><b>Utilize · ${esc(info[0])}</b><span>${esc(translated?.[0]||info[1])}</span></div><div class="rowline"><b>Craft</b><span>${esc(translated?.[1]||info[2])}</span></div>`:''}<a href="${ATLAS_EQUIPMENT_2024_URL}" rel="noopener noreferrer" target="_blank">${tr('Επίσημοι κανόνες εργαλείων 2024 ↗','Official 2024 tool rules ↗')}</a></div>`:'';
  return `<section class="panel atlas-student-panel"><div class="panel-title"><h3>STUDENT OF WAR</h3><button type="button" class="btn sm" data-atlas-student-edit>${tr('Επεξεργασία επιλογών','Edit choices')}</button></div><div class="panel-content">${missing?`<div class="atlas-mastery-alert" role="status">${tr('Επίλεξε ένα Artisan’s Tool ΚΑΙ μία επιπλέον Fighter skill proficiency.','Choose one Artisan’s Tool AND one additional Fighter skill proficiency.')}</div>`:''}<div class="atlas-feature-selected">${esc([tool,skill].filter(Boolean).join(' · ')||tr('Εκκρεμούν επιλογές','Selections pending'))}</div>${toolCard}</div></section>`;
 }
 function editStudentOfWar(){
  const ch=c();if(!isBattleMaster(ch))return;
  const picked=studentSelection(ch);
  const tools=R.ARTISAN_TOOLS,skillChoices=R.FIGHTER_SKILLS;
  openModal('Student of War',`<form id="atlas-student-form"><p class="muted small">${tr('Οι κανόνες 2024 δίνουν και τις δύο επιλογές: 1 skill ΚΑΙ 1 Artisan’s Tool.','2024 rules grant both: 1 skill AND 1 Artisan’s Tool.')}</p><div class="field"><label>${tr('Artisan’s Tools επιλογή','Choose Artisan’s Tools')}<select name="tool" required><option value="">—</option>${tools.map(x=>`<option value="${attr(x)}" ${picked.tool===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label></div><div class="field"><label>${tr('Επιπλέον Fighter skill','Additional Fighter skill')}<select name="skill" required><option value="">—</option>${skillChoices.map(x=>`<option value="${attr(x)}" ${picked.skill===x?'selected':''} ${ch.skills?.[x]&&picked.skill!==x?'disabled':''}>${esc(x)}</option>`).join('')}</select></label></div><p class="muted small">${tr('Θα εμφανιστούν στο Inventory οι επίσημες δυνατότητες Utilize/Craft του εργαλείου. Δεν αποκτάς αυτόματα φυσικό σετ.','The selected tool’s official Utilize/Craft actions will appear in Inventory. You do not automatically receive a physical set.')}</p><button class="btn primary" type="submit">${tr('Αποθήκευση','Save')}</button></form>`,btn(tr('Άκυρο','Cancel'),'close-modal'));
 }
 document.addEventListener('submit',e=>{if(e.target.id!=='atlas-student-form')return;e.preventDefault();e.stopImmediatePropagation();const ch=c(),fd=new FormData(e.target),tool=String(fd.get('tool')||''),skill=String(fd.get('skill')||'');if(!tool||!skill)return;try{R.applyStudentSelection(ch,tool,skill);}catch(ex){toast(ex.message);return;}save();closeModal();renderApp();toast(tr('Οι επιλογές αποθηκεύτηκαν.','Choices saved.'));},true);
 document.addEventListener('click',e=>{const t=e.target.closest('[data-atlas-student-edit]');if(!t)return;e.preventDefault();e.stopImmediatePropagation();editStudentOfWar();},true);
 function consumableRows(ch){const items=(ch.inventory||[]).filter(isConsumable);return items.length?items.map(i=>`<div class="rowline"><div><button type="button" class="linklike" data-atlas-consumable-detail="${attr(i.id)}"><b>${esc(i.name)}</b></button><small>${esc(i.description||'')}</small></div><div class="actions-inline"><b>×${Number(i.qty)||0}</b><button class="btn sm" data-atlas-use-consumable="${attr(i.id)}" ${!i.qty?'disabled':''}>${tr('Χρήση','Use')}</button></div></div>`).join(''):`<div class="empty">${tr('Δεν υπάρχουν αναλώσιμα.','No consumables.')}</div>`;}
  function useConsumable(id){const ch=c(),item=(ch.inventory||[]).find(i=>i.id===id);if(!item||!isConsumable(item)||Number(item.qty)<=0)return;
   if(!canEditCharacter(ch))return toast(tr('Μόνο ο ιδιοκτήτης ή ο DM μπορούν να το χρησιμοποιήσουν.','Only the owner or DM can use this.'));
   const standardHealing=/^potion of healing$|^φίλτρο θεραπείας$/i.test(item.name);
   const effect=standardHealing?'heal':(item.effectKind||'none');let amount=0;
   if(['heal','temp_hp'].includes(effect)){
     const answer=prompt(standardHealing?tr('Potion of Healing: ρίξε 2d4+2 και γράψε το αποτέλεσμα (4–10).','Potion of Healing: roll 2d4+2 and enter the result (4–10).'):tr('Εισήγαγε το αποτέλεσμα από πραγματικά ζάρια ή την εγκεκριμένη επίδραση DM.','Enter your physical dice result or the DM-approved effect.'),standardHealing?'7':'0');
     if(answer===null)return;amount=Number(answer);
     if(!Number.isInteger(amount)||amount<0||(standardHealing&&(amount<4||amount>10))){toast(tr('Μη έγκυρο αποτέλεσμα.','Invalid result.'));return;}
   }else if(!confirm(tr('Κατανάλωση ενός αντικειμένου; Η επίδραση πρέπει να έχει εγκριθεί από τον DM.','Use one item? The effect must be approved by the DM.')))return;
   if(['add_condition','remove_condition'].includes(effect)&&!D.conditions.some(x=>x.id===item.effectCondition))return toast(tr('Διάλεξε πρώτα έγκυρη κατάσταση στο αντικείμενο.','Choose a valid condition on the item first.'));
   item.qty--;
   if(effect==='heal'&&ch.hp)ch.hp.current=clamp(ch.hp.current+amount,0,ch.hp.max);
   if(effect==='temp_hp'&&ch.hp)ch.hp.temp=Math.max(ch.hp.temp||0,amount);
   if(effect==='add_condition'){ch.conditions=Array.isArray(ch.conditions)?ch.conditions:[];if(!ch.conditions.includes(item.effectCondition))ch.conditions.push(item.effectCondition);}
   if(effect==='remove_condition')ch.conditions=(ch.conditions||[]).filter(x=>x!==item.effectCondition);
   update();toast(tr('Το αναλώσιμο χρησιμοποιήθηκε και τα δεδομένα ενημερώθηκαν.','Consumable used and character state updated.'));
  }
  // Network is authoritative: authorization is enforced twice (UI and API).
  const writeActions=new Set(['save-notes','save-plan','new-character','delete-character','reset-data','load-demo','add-journal','add-item','add-attack','atlas-edit-story','portrait','inspiration','short-rest','long-rest','hp-heal','hp-damage','level-up','save-hp','edit-character','edit-abilities','edit-classes','edit-loadouts','choose-masteries','pick-maneuvers','pick-feats','add-feature','add-resource','conditions','save-currency','edit-currency','edit-hitdice','spend-hitdie','exhaust-down','exhaust-up']);
  document.addEventListener('click',e=>{
   const el=e.target.closest('[data-atlas-session],[data-cloud-admin],[data-cloud-refresh],[data-cloud-logout],[data-cloud-import],[data-cloud-pin],[data-cloud-edit],[data-cloud-assign],[data-cloud-toggle],[data-cloud-delete],[data-cloud-recover],[data-atlas-use-consumable],[data-atlas-add-consumable],[data-atlas-consumable-detail],[data-atlas-tags],[data-atlas-session-filter]');
   if(el){e.preventDefault();e.stopImmediatePropagation();const d=el.dataset;
    if(d.atlasSession!==undefined){cloudAccount();return;}
    if(d.cloudAdmin!==undefined){cloudUsers().catch(e=>toast(e.message));return;}
    if(d.cloudRefresh!==undefined){cloudRefresh().then(()=>toast('Synced')).catch(e=>toast(e.message));return;}
    if(d.cloudLogout!==undefined){cloudRequest('/auth/logout','POST',{}).catch(()=>{});cloud.user=null;cloud.token='';cloud.ready=false;sessionStorage.removeItem('dndatlas:session');localStorage.removeItem('dndatlas:remember');closeModal();cloudLoginScreen();return;}
    if(d.cloudEdit!==undefined){
     if(!canManageUsers())return;
     const next=prompt(cloudMsg('Νέο username (3–30 χαρακτήρες, λατινικά/αριθμοί/_/-):','New username (3–30 characters, letters/numbers/_/-):'),d.username||'');
     if(next===null||next.trim()===(d.username||''))return;
     if(!/^[a-z][a-z0-9_-]{2,29}$/i.test(next.trim()))return toast(cloudMsg('Μη έγκυρο username.','Invalid username.'));
     cloudRequest('/users/'+encodeURIComponent(d.cloudEdit),'PATCH',{username:next.trim()}).then(()=>cloudUsers()).then(()=>toast(cloudMsg('Το username ενημερώθηκε.','Username updated.'))).catch(e=>toast(e.message));return;
    }
    if(d.cloudPin!==undefined){cloudResetPinScreen(d.cloudPin).catch(e=>toast(e.message));return;}
    if(d.cloudAssign!==undefined){if(!canManageUsers())return;const id=prompt('Character ID to assign (blank to unassign):\n'+characters.map(c=>c.name+': '+c.id).join('\n'));if(id===null)return;cloudRequest('/users/'+d.cloudAssign,'PATCH',{characterId:id||null}).then(()=>Promise.all([cloudRefresh(),cloudUsers()])).catch(e=>toast(e.message));return;}
    if(d.cloudToggle!==undefined){if(!canManageUsers())return;cloudRequest('/users/'+d.cloudToggle,'PATCH',{active:d.active!=='1'}).then(()=>cloudUsers()).catch(e=>toast(e.message));return;}
    if(d.cloudDelete!==undefined){
     if(!canManageUsers())return;
     const username=d.username||'',id=d.cloudDelete;
     if(!confirm(cloudMsg(`Να διαγραφεί ΟΡΙΣΤΙΚΑ ο χρήστης «${username}»; Ο λογαριασμός και οι συνδέσεις θα διαγραφούν. Ο χαρακτήρας του θα παραμείνει χωρίς ιδιοκτήτη.`, `Permanently delete user "${username}"? The account and sessions will be removed. Their character will remain unassigned.`)))return;
     const typed=prompt(cloudMsg(`Για επιβεβαίωση γράψε ακριβώς το username: ${username}`, `To confirm, type the exact username: ${username}`));
     if(typed!==username){if(typed!==null)toast(cloudMsg('Η επιβεβαίωση δεν ταιριάζει. Δεν έγινε διαγραφή.','Confirmation did not match. Nothing was deleted.'));return;}
     cloudRequest('/users/'+encodeURIComponent(id),'DELETE').then(()=>cloudUsers()).then(()=>toast(cloudMsg('Ο λογαριασμός διαγράφηκε. Ο χαρακτήρας διατηρήθηκε.','Account deleted. Character preserved.'))).catch(e=>toast(e.message));return;
    }

    if(d.cloudRecover!==undefined){const code=prompt('Enter one unused Creator recovery code:');if(!code)return;const newPin=prompt('Enter new Creator passphrase (8+ characters):');if(!newPin)return;cloudRequest('/auth/recover','POST',{code,newPin},false).then(()=>cloudLoginScreen('Creator recovered. Sign in with the new passphrase.')).catch(e=>cloudLoginScreen(e.message));return;}
    if(d.atlasAddConsumable!==undefined){if(canEditCharacter(c()))editItem('','consumable');else toast(tr('Δεν έχεις δικαίωμα επεξεργασίας.','You cannot edit this character.'));return;}
    if(d.atlasConsumableDetail!==undefined){atlasConsumablePopup(d.atlasConsumableDetail);return;}
    if(d.atlasUseConsumable!==undefined){useConsumable(d.atlasUseConsumable);return;}
    if(d.atlasTags!==undefined){editImageTags(d.atlasTags);return;}
   }
   if(!cloud.enabled||!cloud.user)return;
   if(canEditCharacter(c()))return;
   const t=e.target.closest('[data-action],[data-skill-toggle],[data-save-toggle],[data-resource-step],[data-edit-item],[data-atlas-toggle-mastery],[data-set-loadout],[data-edit-attack],[data-death],[data-slot],[data-toggle-prepared],[data-edit-owned-spell],[data-edit-feature],[data-condition-toggle],[data-delete-object],[data-delete-character],[data-picker-toggle],[data-atlas-journal-edit],[data-atlas-journal-new],[data-portrait-save]');
   if(!t)return;
   const action=t.dataset.action;
   if(action&&!writeActions.has(action)&&!action.startsWith('edit-')&&!action.startsWith('add-')&&!action.startsWith('save-')&&!action.startsWith('spend-')&&!action.startsWith('exhaust-'))return;
   e.preventDefault();e.stopImmediatePropagation();toast(tr('Μόνο ο ιδιοκτήτης, ο DM ή ο Creator μπορούν να επεξεργαστούν αυτόν τον χαρακτήρα.','Only the owner, DM or Creator can edit this character.'));
  },true);
  document.addEventListener('change',e=>{if(e.target.matches('[data-atlas-session-filter]')){campaignTagFilter=e.target.value;renderApp();return;}if(e.target.matches('[data-atlas-other-tag-filter]')){campaignOtherTagFilter=e.target.value;renderApp();}},true);
  document.addEventListener('submit',async e=>{
   if(e.target.id==='atlas-pending-choice-form'){
    e.preventDefault();const index=Number(e.target.dataset.choiceIndex),ch=c(),p=(ch.pendingChoices2024||[])[index];
    const value=String(new FormData(e.target).get('pendingValue')||'').trim();
    if(!p||!value)return toast(tr('Συμπλήρωσε την επιλογή.','Choose a value.'));
    if(cloud.enabled&&!canEditCharacter(ch))return toast(tr('Δεν έχεις δικαίωμα επεξεργασίας.','Permission denied.'));
    p.value=value;p.status='resolved';p.resolvedAt=new Date().toISOString();
    update();showPendingChoices();return;
   }

   if(e.target.id==='atlas-image-tags-form'){
    e.preventDefault();e.stopImmediatePropagation();
    const form=e.target, fileId=form.dataset.fileId, fd=new FormData(form);
    const parse=value=>[...new Set(String(value||'').split(',').map(x=>x.trim()).filter(Boolean))];
    const sessions=parse(fd.get('sessions')),tags=parse(fd.get('tags'));
    if(sessions.length>20||tags.length>30||[...sessions,...tags].some(x=>x.length>=80)){
     toast(cloudMsg('Έως 20 sessions, 30 tags και 79 χαρακτήρες ανά tag.','Maximum 20 sessions, 30 tags, and 79 characters per tag.'));return;
    }
    const button=form.querySelector('button[type="submit"]');if(button)button.disabled=true;
    try{
     await cloudRequest('/images/tags','PUT',{id:fileId,sessions,tags});
     await cloudTagsRefresh();
     closeModal();
     toast(cloudMsg('Οι ετικέτες αποθηκεύτηκαν.','Tags saved.'));
    }catch(ex){toast(cloudMsg('Η αποθήκευση απέτυχε: ','Save failed: ')+ex.message);if(button)button.disabled=false;}
    return;
   }
   if(e.target.id==='cloud-login-form'){
    e.preventDefault();e.stopImmediatePropagation();const fd=new FormData(e.target);
    try{const info=await cloudRequest('/auth/login','POST',{username:fd.get('username'),pin:fd.get('pin')},false);
      cloud.user=info.me;cloud.token=info.token;
      if(fd.get('remember'))localStorage.setItem('dndatlas:remember',info.token);else sessionStorage.setItem('dndatlas:session',info.token);
      await cloudRefresh();cloudUnlock();cloudTagsRefresh().catch(e=>console.warn('Image tags unavailable',e));
    }catch(ex){cloudLoginScreen(ex.message);}
   }
   if(e.target.id==='cloud-reset-pin-form'){
    e.preventDefault();e.stopImmediatePropagation();
    if(!canManageUsers())return;
    const form=e.target,fd=new FormData(form),pin=String(fd.get('pin')||''),confirmPin=String(fd.get('confirm')||'');
    const creator=form.dataset.userRole==='creator';
    if(pin!==confirmPin)return toast(cloudMsg('Οι κωδικοί δεν ταιριάζουν.','Passwords do not match.'));
    if(creator?pin.length<8:!/^\d{6,12}$/.test(pin))return toast(creator?cloudMsg('Ο κωδικός Creator πρέπει να έχει τουλάχιστον 8 χαρακτήρες.','Creator password must have at least 8 characters.'):cloudMsg('Το PIN πρέπει να αποτελείται από 6–12 ψηφία.','PIN must contain 6–12 digits.'));
    const btn=form.querySelector('button[type="submit"]');if(btn)btn.disabled=true;
    try{
      await cloudRequest('/users/'+encodeURIComponent(form.dataset.userId),'PATCH',{pin});
      if(String(form.dataset.userId)===String(cloud.user.id)){
        cloud.token='';cloud.user=null;sessionStorage.removeItem('dndatlas:session');localStorage.removeItem('dndatlas:remember');closeModal();cloudLoginScreen(cloudMsg('Ο κωδικός άλλαξε. Συνδέσου ξανά.','Password updated. Please sign in again.'));
      }else{await cloudUsers();toast(cloudMsg('Ο κωδικός άλλαξε και οι παλιές συνδέσεις ακυρώθηκαν.','Password updated and existing sessions revoked.'));}
    }catch(ex){toast(ex.message);if(btn)btn.disabled=false;}
   }
   if(e.target.id==='cloud-create-user'){
    e.preventDefault();e.stopImmediatePropagation();const fd=new FormData(e.target);
    const username=String(fd.get('username')||'').trim(),pin=String(fd.get('pin')||''),role=String(fd.get('role')||'player');
    if(!/^[A-Za-z][A-Za-z0-9_-]{2,29}$/.test(username)){toast(cloudMsg('Username: 3–30 χαρακτήρες, αρχίζει με λατινικό γράμμα και επιτρέπει λατινικά, αριθμούς, _ ή -.','Username: 3–30 characters, starting with a Latin letter; Latin letters, numbers, _ and - only.'));return;}
    if(!/^[0-9]{6,12}$/.test(pin)){toast(cloudMsg('Το PIN πρέπει να έχει 6–12 αριθμητικά ψηφία (0–9).','PIN must contain 6–12 numeric digits (0–9).'));return;}
    const submit=e.target.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
    try{await cloudRequest('/users','POST',{username,pin,role});await cloudUsers();toast(cloudMsg('Ο χρήστης δημιουργήθηκε.','User created.'));}catch(ex){toast(ex.message);if(submit)submit.disabled=false;}
   }
  },true);

 document.addEventListener('click',e=>{
  if(e.target.hasAttribute('data-backdrop')){closeModal();return;}
  let el=e.target.closest('[data-tab],[data-detail],[data-action],[data-ability],[data-roll],[data-skill-toggle],[data-save-toggle],[data-resource-step],[data-resource-detail],[data-attack-detail],[data-edit-attack],[data-slot],[data-death],[data-owned-spell],[data-toggle-prepared],[data-edit-owned-spell],[data-feature-detail],[data-edit-feature],[data-item-detail],[data-edit-item],[data-journal-detail],[data-set-loadout],[data-picker-toggle],[data-picker-detail],[data-condition-toggle],[data-dice-insert],[data-toggle-ref],[data-cast],[data-delete-character],[data-delete-object],[data-companion-detail],[data-edit-companion],[data-language-remove],[data-custom-feat-detail]');if(!el||el.disabled)return;
  if(el.dataset.tab){if(modalOpen)closeModal();view=el.dataset.tab;saveView();renderApp();window.scrollTo({top:0,behavior:'instant'});return;}
  if(el.dataset.detail){detailRef(el.dataset.detail);return;}
  if(el.dataset.action){eventAction(el.dataset.action);return;}
  if(el.dataset.ability){const k=el.dataset.ability;openModal(D.abilities[k],`<div class="statgrid"><div class="meta-box"><small>Score</small><strong>${c().abilities[k]}</strong></div><div class="meta-box"><small>Modifier</small><strong>${signed(ability(c(),k))}</strong></div><div class="meta-box"><small>Save</small><strong>${signed(saveMod(c(),k))}</strong></div></div><div class="section-caption">ABILITY CHECK</div><div class="detail-description">Roll d20 + modifier. Proficiency applies to relevant trained skills, not automatically to raw ability checks.</div>`, `<button class="btn primary" data-roll="1d20${signed(ability(c(),k))}" data-roll-label="${attr(D.abilities[k])} Check">Roll Check</button><button class="btn" data-roll="1d20${signed(saveMod(c(),k))}" data-roll-label="${attr(D.abilities[k])} Save">Roll Save</button>`);return;}
  if(el.dataset.roll){toast(tr('Δεν υπάρχουν ψηφιακές ζαριές. Χρησιμοποίησε πραγματικά ζάρια.','Digital dice are disabled. Use physical dice.'));return;}
  if(el.dataset.skillToggle){atlasEditSkills();return;}
  if(el.dataset.saveToggle){let k=el.dataset.saveToggle,arr=c().saves||[];c().saves=arr.includes(k)?arr.filter(x=>x!==k):[...arr,k];update();return;}
  if(el.dataset.resourceStep){let [id,step]=el.dataset.resourceStep.split(':'),r=c().resources.find(x=>x.id===id);if(r){r.current=clamp(r.current+Number(step),0,r.max);update();}return;}
  if(el.dataset.resourceDetail){resourceDetail(el.dataset.resourceDetail);return;}
  if(el.dataset.attackDetail){attackDetail(el.dataset.attackDetail);return;}
  if(el.dataset.editAttack){editAttack(el.dataset.editAttack);return;}
  if(el.dataset.slot){let [type,lvl,dir]=el.dataset.slot.split(':'),x=type==='pact'?c().pact:c().slots?.[lvl];if(x){x.used=clamp(x.used+(dir==='spend'?1:-1),0,x.max);update();}return;}
  if(el.dataset.death){let [k,i]=el.dataset.death.split(':'),d=c().death;d[k]=Number(i)<d[k]?Number(i):Number(i)+1;update();return;}
  if(el.dataset.ownedSpell){ownedSpell(el.dataset.ownedSpell);return;}
  if(el.dataset.togglePrepared){let x=c().spellbook.find(z=>z.id===el.dataset.togglePrepared);if(x){x.prepared=x.prepared===false;update();}return;}
  if(el.dataset.editOwnedSpell){editOwnedSpell(el.dataset.editOwnedSpell);return;}
  if(el.dataset.featureDetail){featureDetail(el.dataset.featureDetail);return;}
  if(el.dataset.customFeatDetail){customFeatDetail(el.dataset.customFeatDetail);return;}
  if(el.dataset.languageRemove){const hidden=document.getElementById('f-languages');if(hidden){hidden.value=languageList(hidden.value).filter(v=>v!==el.dataset.languageRemove).join(', ');refreshLanguageChips();}return;}
  if(el.dataset.editFeature){editFeature(el.dataset.editFeature);return;}
  if(el.dataset.itemDetail){itemDetail(el.dataset.itemDetail);return;}
  if(el.dataset.companionDetail){companionDetail(el.dataset.companionDetail);return;}
  if(el.dataset.editCompanion){editCompanion(el.dataset.editCompanion);return;}
  if(el.dataset.editItem){editItem(el.dataset.editItem);return;}
  if(el.dataset.journalDetail){journalDetail(el.dataset.journalDetail);return;}
  if(el.dataset.setLoadout!==undefined){c().activeLoadout=Number(el.dataset.setLoadout);update();return;}
  if(el.dataset.pickerToggle){let id=el.dataset.pickerToggle,kind=currentPickerKind();tryToggleRef(id);updatePicker(kind);renderApp();return;}
  if(el.dataset.pickerDetail){detailRef(el.dataset.pickerDetail);return;}
  if(el.dataset.conditionToggle){let id=el.dataset.conditionToggle,arr=c().conditions||[];c().conditions=arr.includes(id)?arr.filter(x=>x!==id):[...arr,id];save();conditionsModal();renderApp();return;}
  if(el.dataset.diceInsert){let q=document.getElementById('dice-formula');if(q){q.value='1'+el.dataset.diceInsert;}return;}
  if(el.dataset.toggleRef){tryToggleRef(el.dataset.toggleRef);closeModal();renderApp();return;}
  if(el.dataset.cast){castSpell(el.dataset.cast);return;}
  if(el.dataset.deleteCharacter){deleteItem('character',el.dataset.deleteCharacter);return;}
  if(el.dataset.deleteObject){let [kind,id]=el.dataset.deleteObject.split(':');deleteItem(kind,id);return;}
 });
 document.addEventListener('submit',e=>{if(e.target.id==='atlas-form'){e.preventDefault();let action=e.submitter?.dataset.formAction||document.querySelector('[data-form-action]')?.dataset.formAction;if(action)handleForm(action,getForm());}});
 document.addEventListener('change',e=>{
  if(e.target.matches('[data-subclass-select]')){const i=e.target.dataset.subclassSelect,custom=document.getElementById('f-subclassCustom'+i);if(custom){custom.style.display=isCustomValue(e.target.value)?'block':'none';if(isCustomValue(e.target.value))custom.focus();}return;}
  if(e.target.matches('[data-language-pick]')){const box=document.getElementById('language-custom-box');if(e.target.value==='__custom__'){if(box){box.style.display='flex';document.getElementById('language-custom-input')?.focus();}}else{if(e.target.value)addLanguage(e.target.value);if(box)box.style.display='none';e.target.value='';}return;}
  if(e.target.matches('[data-class-name]')){const i=Number(e.target.dataset.className),select=document.getElementById('f-subclass'+i),custom=document.getElementById('f-subclassCustom'+i);if(select){const previous=select.value,newOptions=classSubclasses(e.target.value),keep=newOptions.includes(previous)?previous:'';select.innerHTML=`<option value="">${uiText('— Χωρίς subclass —','— No subclass —')}</option>`+newOptions.map(x=>`<option value="${attr(x)}">${esc(x)}</option>`).join('')+`<option value="__custom__">${uiText('Άλλο / Homebrew…','Other / Homebrew…')}</option>`;select.value=keep;if(custom){custom.value='';custom.style.display='none';}}return;}
  if(e.target.matches('#portrait-file')){const file=e.target.files?.[0];e.target.value='';if(file)handlePortrait(file);return;}
  if(e.target.matches('[data-language-select]')){L.setLanguage(e.target.value);renderApp();toast(L.getLanguage()==='el'?'Η γλώσσα άλλαξε σε Ελληνικά.':'Language switched to English.');return;}
  if(e.target.matches('[data-char-select]')){selectedId=e.target.value;update();return;}
  if(e.target.matches('[data-library-kind]')){libraryCategory=e.target.value;renderApp();return;}
  if(e.target.matches('[data-library-level]')){libraryLevel=e.target.value;renderApp();return;}
  if(e.target.matches('[data-spell-level]')){spellLevel=e.target.value;renderApp();return;}
  if(e.target.matches('#f-weaponTemplate')){let w=D.weapons.find(x=>x.name===e.target.value);if(w){for(const [k,v] of Object.entries({name:w.name,ability:w.ability,damage:w.damage,type:w.type,mastery:w.mastery})){let t=document.getElementById('f-'+k);if(t)t.value=v;}toast('Weapon preset applied · edit fields as needed.');}return;}
  if(e.target.matches('#import-character-file')){
   const picker=e.target,file=picker.files?.[0];if(!file)return;picker.value='';
   (async()=>{
    let documentData;
    try{documentData=JSON.parse(await file.text());}catch{throw Error(tr('Μη έγκυρο JSON.','Invalid JSON file.'));}
    const ch=documentData?.character||(Array.isArray(documentData?.characters)&&documentData.characters.length===1?documentData.characters[0]:documentData);
    if(!ch||typeof ch!=='object'||Array.isArray(ch)||typeof ch.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(ch.id)||typeof ch.name!=='string'||!ch.name.trim()||!Array.isArray(ch.classes)||!ch.classes.length){
     throw Error(tr('Το JSON πρέπει να περιέχει ακριβώς έναν χαρακτήρα.','JSON must contain exactly one valid character.'));
    }
    if(cloud.enabled&&(!cloud.ready||!['creator','dm'].includes(cloud.user?.role||'')))throw Error(tr('Μόνο Creator ή DM μπορούν να εισάγουν χαρακτήρα στην D1.','Only Creator or DM can import a character into D1.'));
    if(characters.some(x=>x.id===ch.id))throw Error(tr('Υπάρχει ήδη χαρακτήρας με αυτό το ID.','A character with this ID already exists.'));
    if(!confirm(tr('Να προστεθεί ο χαρακτήρας '+ch.name+' χωρίς αντικατάσταση άλλων χαρακτήρων;','Add '+ch.name+' without replacing other characters?')))return;
    const button=document.querySelector('[data-action="import-character"]');if(button)button.disabled=true;
    try{
      if(cloud.enabled){await cloudRequest('/characters/'+encodeURIComponent(ch.id),'POST',{character:ch});await cloudRefresh();}
      else{characters.push(structuredClone(ch));selectedId=ch.id;update();}
      closeModal();toast(tr('Ο χαρακτήρας προστέθηκε.','Character added.'));
    }finally{if(button?.isConnected)button.disabled=false;}
   })().catch(err=>toast(tr('Αποτυχία εισαγωγής: ','Import failed: ')+(err.message||String(err))));
   return;
  }
  if(e.target.matches('#import-file')){let file=e.target.files?.[0];if(!file)return;file.text().then(str=>{let doc;try{doc=JSON.parse(str);}catch{return toast('Invalid JSON backup.');}if(!Array.isArray(doc.characters)||!doc.characters.length||doc.characters.some(x=>!x.id||!x.name||!Array.isArray(x.classes)))return toast('Backup format not recognized.');if(!confirm(cloud.enabled?tr('Η εισαγωγή θα αντικαταστήσει τους χαρακτήρες του campaign στη D1. Μόνο ο Creator μπορεί να συνεχίσει. Εξήγαγε πρώτα backup.','This will replace campaign characters in D1. Creator only. Export a backup first.'):tr('Η εισαγωγή θα αντικαταστήσει όλους τους τοπικούς χαρακτήρες. Συνέχεια;','Import will replace all local characters. Continue?')))return;if(cloud.enabled){if(!cloud.ready||cloud.user?.role!=='creator')return toast(tr('Απαιτείται λογαριασμός Creator.','Creator account required.'));cloudRequest('/characters/replace','POST',{characters:doc.characters}).then(()=>cloudRefresh()).then(()=>{closeModal();toast(tr('Το party αντικαταστάθηκε.','Party replaced.'));}).catch(err=>toast(tr('Αποτυχία εισαγωγής: ','Import failed: ')+(err.message||String(err))));return;}if(doc.journalPreferences){sharedHidden=Array.isArray(doc.journalPreferences.hiddenSharedSessions)?doc.journalPreferences.hiddenSharedSessions:[];sharedEdits=doc.journalPreferences.sharedSessionEdits||{};saveSharedPref();}characters=doc.characters;selectedId=characters[0].id;view='overview';closeModal();update();toast('Backup imported.');}).catch(()=>toast('Could not read file.'));return;}
 });
 document.addEventListener('input',e=>{
  if(e.target.matches('[data-library-search]')){libraryQuery=e.target.value;let pos=e.target.selectionStart;renderApp();let q=document.querySelector('[data-library-search]');q?.focus();q?.setSelectionRange(pos,pos);return;}
  if(e.target.matches('[data-spell-search]')){spellQuery=e.target.value;let pos=e.target.selectionStart;renderApp();let q=document.querySelector('[data-spell-search]');q?.focus();q?.setSelectionRange(pos,pos);return;}
  if(e.target.matches('[data-picker-search]')){updatePicker(currentPickerKind());return;}
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modalOpen)closeModal();});
 renderApp();
 if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
  const controlledAtBoot=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(controlledAtBoot){updateAvailable=true;updateBanner();}});
  window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(()=>{
   setTimeout(()=>checkUpdates(false),2500);
  }).catch(()=>{});});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&Date.now()-lastUpdateCheck>15*60*1000)checkUpdates(false);});
  window.addEventListener('online',()=>{if(Date.now()-lastUpdateCheck>60*1000)checkUpdates(false);});
 }

})();