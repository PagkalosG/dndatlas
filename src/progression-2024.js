/* D&D 5e 2024 core class progression: concise feature labels (not complete rules text). */
(function(root){'use strict';
const rows={
Barbarian:['Rage; Unarmored Defense; Weapon Mastery','Danger Sense; Reckless Attack','Barbarian Subclass; Primal Knowledge','','Extra Attack; Fast Movement','Subclass feature','Feral Instinct; Instinctive Pounce','','Brutal Strike','Subclass feature','Relentless Rage','','Improved Brutal Strike','Subclass feature','Persistent Rage','','Improved Brutal Strike','Indomitable Might','','Primal Champion'],
Bard:['Bardic Inspiration; Spellcasting','Expertise; Jack of All Trades','Bard Subclass','','Font of Inspiration','Subclass feature','Countercharm','','Expertise','Magical Secrets','','','', 'Subclass feature','','','','Superior Inspiration','','Words of Creation'],
Cleric:['Spellcasting; Divine Order','Channel Divinity','Divine Domain','','Sear Undead','Subclass feature','Blessed Strikes','','','Divine Intervention','','','', 'Improved Blessed Strikes','','','Subclass feature','Channel Divinity','','Greater Divine Intervention'],
Druid:['Spellcasting; Primal Order','Wild Shape; Wild Companion','Druid Subclass','','Wild Resurgence','Subclass feature','Elemental Fury','','','Subclass feature','Improved Elemental Fury','','','Subclass feature','','','', 'Beast Spells','','Archdruid'],
Fighter:['Fighting Style; Second Wind; Weapon Mastery','Action Surge; Tactical Mind','Fighter Subclass','','Extra Attack; Tactical Shift','','Subclass feature','','Indomitable; Tactical Master','Subclass feature','Two Extra Attacks','','Indomitable; Studied Attacks','','Subclass feature','','Action Surge; Indomitable','Subclass feature','','Three Extra Attacks'],
Monk:['Martial Arts; Unarmored Defense','Monk’s Focus; Unarmored Movement; Uncanny Metabolism','Deflect Attacks; Monk Subclass','Slow Fall','Extra Attack; Stunning Strike','Empowered Strikes; Subclass feature','Evasion','','Acrobatic Movement','Heightened Focus; Self-Restoration','Subclass feature','','Deflect Energy','Disciplined Survivor','Perfect Focus','','Subclass feature','Superior Defense','','Body and Mind'],
Paladin:['Lay on Hands; Spellcasting; Weapon Mastery','Fighting Style; Paladin’s Smite','Channel Divinity; Paladin Subclass','','Extra Attack; Faithful Steed','Aura of Protection','Subclass feature','','Abjure Foes','Aura of Courage','Radiant Strikes','','','Restoring Touch','Subclass feature','','','Aura Expansion','','Subclass feature'],
Ranger:['Spellcasting; Favored Enemy; Weapon Mastery','Deft Explorer; Fighting Style','Ranger Subclass','','Extra Attack','Roving','Subclass feature','','Expertise','Tireless','Subclass feature','','Relentless Hunter','Nature’s Veil','Subclass feature','','Precise Hunter','Feral Senses','','Foe Slayer'],
Rogue:['Expertise; Sneak Attack; Thieves’ Cant; Weapon Mastery','Cunning Action','Rogue Subclass; Steady Aim','','Cunning Strike; Uncanny Dodge','Expertise','Evasion; Reliable Talent','','Subclass feature','','Improved Cunning Strike','','Subclass feature','Devious Strikes','Slippery Mind','','Subclass feature','Elusive','','Stroke of Luck'],
Sorcerer:['Spellcasting; Innate Sorcery','Font of Magic; Metamagic','Sorcerer Subclass','','Sorcerous Restoration','Subclass feature','Sorcery Incarnate','','','Metamagic','','','', 'Subclass feature','','','Metamagic','Subclass feature','','Arcane Apotheosis'],
Warlock:['Eldritch Invocations; Pact Magic','Magical Cunning','Warlock Subclass','','','Subclass feature','','','Contact Patron','Subclass feature','Mystic Arcanum','','Mystic Arcanum','Subclass feature','Mystic Arcanum','','Mystic Arcanum','','','Eldritch Master'],
Wizard:['Spellcasting; Ritual Adept; Arcane Recovery','Scholar','Wizard Subclass','','Memorize Spell','Subclass feature','','','', 'Subclass feature','','','', 'Subclass feature','','','', 'Spell Mastery','','Signature Spells']
};
const die={Barbarian:12,Bard:8,Cleric:8,Druid:8,Fighter:10,Monk:8,Paladin:10,Ranger:10,Rogue:8,Sorcerer:6,Warlock:8,Wizard:6};
const extraASI={Fighter:[6,14],Rogue:[10]};
const standardASI=[4,8,12,16];
const data={};
for(const [name,features] of Object.entries(rows)){
 if(features.length!==20)throw Error('Invalid progression: '+name+' '+features.length);
 data[name]=features.map((raw,i)=>{const level=i+1;let f=raw?raw.split('; ').filter(Boolean):[];
 if(standardASI.includes(level)||extraASI[name]?.includes(level))f.push('Ability Score Improvement / eligible feat');
 if(level===19)f.push('Epic Boon');
 return {level,proficiencyBonus:Math.ceil(level/4)+1,hitDie:die[name],fixedHpAfterFirst:Math.floor(die[name]/2)+1,features:f};
 });
}
root.ATLAS_PROGRESSION_2024=data;
})(window);
