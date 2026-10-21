/* D&D Atlas — verified core 2024 rule helpers. Pure logic; no D1 calls. */
(function(root){
 'use strict';
 const SIMPLE_ONLY=new Set(['Bard','Cleric','Druid','Sorcerer','Warlock','Wizard']);
 const ALL_WEAPONS=new Set(['Barbarian','Fighter','Paladin','Ranger']);
 const LIGHT_MARTIAL=new Set(['Scimitar','Shortsword']);
 const FINESSE_MARTIAL=new Set(['Rapier','Scimitar','Shortsword','Whip']);
 const FIGHTER_SKILLS=['Acrobatics','Animal Handling','Athletics','History','Insight','Intimidation','Persuasion','Perception','Survival'];
 const ARTISAN_TOOLS=[
  'Alchemist’s Supplies','Brewer’s Supplies','Calligrapher’s Supplies','Carpenter’s Tools','Cartographer’s Tools','Cobbler’s Tools','Cook’s Utensils','Glassblower’s Tools','Jeweler’s Tools','Leatherworker’s Tools','Mason’s Tools','Painter’s Supplies','Potter’s Tools','Smith’s Tools','Tinker’s Tools','Weaver’s Tools','Woodcarver’s Tools'
 ];
 const TOOL_RULES={
  'Alchemist’s Supplies':['INT','Identify a substance or start a fire (DC 15)','Acid, Alchemist’s Fire, Component Pouch, Oil, Paper, Perfume'],
  'Brewer’s Supplies':['INT','Detect poisoned drink (DC 15); identify alcohol (DC 10)','Antitoxin'],
  'Calligrapher’s Supplies':['DEX','Write forgery-resistant decorative text (DC 15)','Ink, Spell Scroll'],
  'Carpenter’s Tools':['STR','Seal or pry open a door or container (DC 20)','Club, Greatclub, Quarterstaff, Barrel, Chest, Ladder, Pole, Portable Ram, Torch'],
  'Cartographer’s Tools':['WIS','Draft a map of a small area (DC 15)','Map'],
  'Cobbler’s Tools':['DEX','Modify footwear for Advantage on next Acrobatics check (DC 10)','Climber’s Kit'],
  'Cook’s Utensils':['WIS','Improve food flavor (DC 10); detect spoiled or poisoned food (DC 15)','Rations'],
  'Glassblower’s Tools':['INT','Discern what a glass object held in the past 24 hours (DC 15)','Glass Bottle, Magnifying Glass, Spyglass, Vial'],
  'Jeweler’s Tools':['INT','Discern a gem’s value (DC 15)','Arcane Focus, Holy Symbol'],
  'Leatherworker’s Tools':['DEX','Add a design to leather (DC 10)','Sling, Whip, Hide/Leather/Studded Leather Armor, Backpack, Pouch, Quiver, Waterskin, and related gear'],
  'Mason’s Tools':['STR','Chisel a symbol or hole in stone (DC 10)','Block and Tackle'],
  'Painter’s Supplies':['WIS','Paint a recognizable image (DC 10)','Druidic Focus, Holy Symbol'],
  'Potter’s Tools':['INT','Discern what a ceramic object held in the past 24 hours (DC 15)','Jug, Lamp'],
  'Smith’s Tools':['STR','Pry open a door or container (DC 20)','Melee weapons (except Club, Greatclub, Quarterstaff, Whip); Medium armor (except Hide); Heavy armor; Ball Bearings, Bucket, Caltrops, Chain, Crowbar, Firearm Bullets, Grappling Hook, Iron Pot, Iron Spikes, Sling Bullets'],
  'Tinker’s Tools':['DEX','Assemble a temporary Tiny scrap item (DC 20)','Musket, Pistol, Bell, Lanterns, Flask, Hunting Trap, Lock, Manacles, Mirror, Shovel, Signal Whistle, Tinderbox'],
  'Weaver’s Tools':['DEX','Mend clothing or sew a Tiny design (DC 10)','Padded Armor, Basket, Bedroll, Blanket, Clothes, Net, Robe, Rope, Sack, String, Tent'],
  'Woodcarver’s Tools':['DEX','Carve a pattern in wood (DC 10)','Club, Greatclub, Quarterstaff, ranged weapons except Pistol/Musket/Sling, Foci, Arrows, Bolts, Ink Pen, Needles']
 };
 const TOOL_RULES_EL={
  'Alchemist’s Supplies':['Αναγνώριση ουσίας ή άναμμα φωτιάς (DC 15)','Οξύ, Αλχημική Φωτιά, θήκη υλικών, λάδι, χαρτί, άρωμα'],
  'Brewer’s Supplies':['Εντοπισμός δηλητηριασμένου ποτού (DC 15), αναγνώριση αλκοόλ (DC 10)','Αντίδοτο'],
  'Calligrapher’s Supplies':['Καλλιγραφικό κείμενο ανθεκτικό στην πλαστογράφηση (DC 15)','Μελάνι, περγαμηνή ξορκιού'],
  'Carpenter’s Tools':['Σφράγιση ή παραβίαση πόρτας/δοχείου (DC 20)','Ρόπαλα, ραβδί, βαρέλι, μπαούλο, σκάλα, κοντάρι, κριός, δάδα'],
  'Cartographer’s Tools':['Χαρτογράφηση μικρής περιοχής (DC 15)','Χάρτης'],
  'Cobbler’s Tools':['Τροποποίηση υποδήματος για Advantage στον επόμενο έλεγχο Acrobatics (DC 10)','Εξοπλισμός αναρρίχησης'],
  'Cook’s Utensils':['Βελτίωση γεύσης (DC 10), εντοπισμός αλλοιωμένης ή δηλητηριασμένης τροφής (DC 15)','Μερίδες τροφής'],
  'Glassblower’s Tools':['Εξακρίβωση περιεχομένου γυάλινου αντικειμένου τις τελευταίες 24 ώρες (DC 15)','Γυάλινο μπουκάλι, μεγεθυντικός φακός, τηλεσκόπιο, φιαλίδιο'],
  'Jeweler’s Tools':['Εκτίμηση αξίας πολύτιμου λίθου (DC 15)','Μαγική εστία, ιερό σύμβολο'],
  'Leatherworker’s Tools':['Διακόσμηση δερμάτινου αντικειμένου (DC 10)','Σφεντόνα, μαστίγιο, δερμάτινες πανοπλίες, σακίδιο, θήκες και σχετικά αντικείμενα'],
  'Mason’s Tools':['Χάραξη συμβόλου ή οπής σε πέτρα (DC 10)','Σύστημα τροχαλιών'],
  'Painter’s Supplies':['Ζωγραφική αναγνωρίσιμης εικόνας (DC 10)','Δρυιδική εστία, ιερό σύμβολο'],
  'Potter’s Tools':['Εξακρίβωση περιεχομένου κεραμικού αντικειμένου τις τελευταίες 24 ώρες (DC 15)','Κανάτα, λυχνάρι'],
  'Smith’s Tools':['Παραβίαση πόρτας ή δοχείου (DC 20)','Όπλα μάχης σώμα με σώμα εκτός από Club, Greatclub, Quarterstaff, Whip· μεσαίες πανοπλίες εκτός Hide· βαριές πανοπλίες· μεταλλικός εξοπλισμός όπως αλυσίδες, καρφιά, γάντζοι'],
  'Tinker’s Tools':['Κατασκευή προσωρινού Tiny αντικειμένου από υπολείμματα (DC 20)','Μουσκέτο, πιστόλι, καμπανάκι, φανάρια, παγίδα, κλειδαριά, χειροπέδες, καθρέφτης, φτυάρι, σφυρίχτρα'],
  'Weaver’s Tools':['Επιδιόρθωση υφάσματος ή μικρό κέντημα (DC 10)','Ελαφριά ρούχα, σχοινί, δίχτυ, σκηνή, σακί, κλινοσκεπάσματα'],
  'Woodcarver’s Tools':['Χάραξη σχεδίου σε ξύλο (DC 10)','Ξύλινα ρόπαλα/ραβδιά, κατάλληλα ranged weapons, βέλη, βλήματα, μαγικές εστίες']
 };
 // Weapon proficiency is NOT Weapon Mastery. First class grants its core weapon traits;
 // multiclass Barbarian/Fighter/Paladin/Ranger explicitly grant Martial weapons. Other unusual grants use override.
 function classWeaponProficiency(cls,weapon){
  if(!weapon)return null;
  if(ALL_WEAPONS.has(cls))return true;
  if(SIMPLE_ONLY.has(cls))return weapon.group==='Simple';
  if(weapon.group==='Simple' && ['Monk','Rogue'].includes(cls))return true;
  if(cls==='Monk')return weapon.group==='Martial'&&LIGHT_MARTIAL.has(weapon.name);
  if(cls==='Rogue')return weapon.group==='Martial'&&FINESSE_MARTIAL.has(weapon.name);
  return null;
 }
 function proficiency(ch,attack,weapons){
  if(attack.proficiencyMode==='yes')return true;
  if(attack.proficiencyMode==='no')return false;
  const weapon=weapons.find(w=>w.name.toLowerCase()===String(attack.name||'').toLowerCase());
  if(!weapon)return attack.proficient!==false; // Custom/unlisted: retain manually recorded choice
  const classes=(ch.classes||[]).filter(c=>Number(c.level)>0);
  if(!classes.length)return attack.proficient!==false;
  const initial=classWeaponProficiency(classes[0].name,weapon);
  if(initial===true)return true;
  // 2024 multiclass Barbarian, Fighter, Paladin, Ranger grant Martial weapon proficiency.
  if(classes.slice(1).some(c=>['Barbarian','Fighter','Paladin','Ranger'].includes(c.name)&&weapon.group==='Martial'))return true;
  if(initial!==null)return false;
  return attack.proficient!==false; // Custom classes require an explicit proficiency record
 }
 function masteryEligible(ch,weapon,weapons){
  if(!weapon || !proficiency(ch,{name:weapon.name,proficiencyMode:'auto'},weapons))return false;
  const sources=(ch.classes||[]).filter(x=>Number(x.level)>=1&&['Barbarian','Fighter','Paladin','Ranger','Rogue'].includes(x.name));
  if(!sources.length)return false;
  // Barbarian alone: only melee weapon types. Other mastery grants allow proficient weapons.
  if(sources.every(c=>c.name==='Barbarian')){
   return !['Longbow','Shortbow','Light Crossbow','Heavy Crossbow','Hand Crossbow','Blowgun','Sling','Dart','Pistol','Musket'].includes(weapon.name);
  }
  return true;
 }
 function attackBreakdown(ch,attack,weapons){
  const ability=attack.ability==='SPELL'?(ch.spellAbility||'INT'):(attack.ability||'STR');
  const mod=Math.floor((Number(ch.abilities?.[ability]??10)-10)/2);
  const totalLevel=(ch.classes||[]).reduce((n,c)=>n+(Number(c.level)||0),0);
  const pb=ch.proficiencyOverride!==''&&ch.proficiencyOverride!=null?Number(ch.proficiencyOverride):Math.ceil(Math.max(1,totalLevel)/4)+1;
  const proficient=attack.ability==='SPELL'?true:proficiency(ch,attack,weapons);
  const magic=Number(attack.magicBonus)||0;
  const other=Number(attack.damageBonus)||0;
  const hit=attack.bonusOverride!==''&&attack.bonusOverride!=null?Number(attack.bonusOverride):mod+(proficient?pb:0)+magic;
  return {ability,mod,pb:proficient?pb:0,proficient,magic,other,hit,damageMod:(attack.ability==='SPELL'?0:mod)+magic+other};
 }
 function studentSelection(ch){
  // Do not count arbitrary tool proficiencies (Monk/Background/Origin Feat) as Student of War.
  const skill=ch.studentOfWarSkill||'';
  const legacy=skill && !ch.studentOfWarTool && (ch.classes||[]).some(c=>c.name==='Fighter'&&Number(c.level)>=3&&c.subclass==='Battle Master')
    ? String(ch.proficiencies||'').match(/Artisan[’']s Tools:\s*([^;]+)/i)?.[1]?.trim() : '';
  return {tool:ch.studentOfWarTool||legacy||'',skill};
 }
 function applyStudentSelection(ch,tool,skill){
  if(!ARTISAN_TOOLS.includes(tool)||!FIGHTER_SKILLS.includes(skill))throw Error('Invalid Student of War choice');
  const old=studentSelection(ch);
  ch.skills=ch.skills||{};
  if(old.skill!==skill){
   if(old.skill){
    // Baseline tracked since the first edit. For old imports without provenance,
    // the former Student-of-War grant was normally rank 1; never destroy Expertise.
    const baseline=Number.isInteger(ch.studentOfWarSkillPreviousRank)?ch.studentOfWarSkillPreviousRank:0;
    if(ch.skills[old.skill]===1)ch.skills[old.skill]=baseline;
   }
   ch.studentOfWarSkillPreviousRank=Number(ch.skills[skill]||0);
   ch.skills[skill]=Math.max(1,Number(ch.skills[skill]||0));
  }else if(!Number.isInteger(ch.studentOfWarSkillPreviousRank)){
   ch.studentOfWarSkillPreviousRank=0;
   ch.skills[skill]=Math.max(1,Number(ch.skills[skill]||0));
  }
  ch.studentOfWarTool=tool;
  ch.studentOfWarSkill=skill;
  // Remove legacy Student of War label when it was the selected tool; preserve unrelated tool grants.
  const parts=String(ch.proficiencies||'').split(';').map(x=>x.trim()).filter(Boolean).filter(x=>!/^Student of War Tools?:/i.test(x) && !(old.tool && x===('Artisan’s Tools: '+old.tool))); 
  parts.push('Student of War Tool: '+tool);
  ch.proficiencies=parts.join('; ');
  return ch;
 }
 const api=Object.freeze({FIGHTER_SKILLS,ARTISAN_TOOLS,TOOL_RULES,TOOL_RULES_EL,classWeaponProficiency,proficiency,masteryEligible,attackBreakdown,studentSelection,applyStudentSelection});
 root.ATLAS_RULES_2024=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);