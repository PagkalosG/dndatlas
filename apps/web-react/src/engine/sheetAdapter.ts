import { ABILITY_KEYS, type AbilityKey, type CharacterDraft, type SheetCharacter } from '@/types';
import { engine, toEngineDraft, uiSkillId, L } from './atlas2024';
import { backgrounds, classes, skills, species } from '@/mock/reference';

const format=(n:number)=>n>=0?'+'+n:''+n;
const number=(n:number)=>Math.floor(n);
/** 2024 engine-backed base preview. Incomplete feature effects are intentionally not fabricated. */
export function sheetFromDraft(d:CharacterDraft):SheetCharacter {
 const {rules,insights,catalog}=engine();
 const src=toEngineDraft(d),cl=rules.classInfo(d.classId),bg=rules.backgroundInfo(d.backgroundId);
 const chosenCls=classes.find(x=>x.id===d.classId),chosenBg=backgrounds.find(x=>x.id===d.backgroundId),chosenSpecies=species.find(x=>x.id===d.speciesId);
 const grants=insights.grants(src,cl,bg);
 const grantIds=new Set(grants.map(x=>x.id));
 const scores=Object.fromEntries(ABILITY_KEYS.map(k=>[k,insights.score(src,k,rules.bonusFor)])) as Record<AbilityKey,{base:number;bonus:number;total:number;modifier:number}>;
 const pb=2+Math.floor((d.level-1)/4);
 const saveProficiencies=new Set((cl?.savingThrows||[]).map(x=>x.id.replace(/^saving-throw-/,'').replace(/^ability-/,'').toLowerCase()));
 const fullScores=Object.fromEntries(ABILITY_KEYS.map(k=>[k,{
    score:scores[k].total,modifier:format(scores[k].modifier),save:format(scores[k].modifier+(saveProficiencies.has(k)?pb:0))
 }])) as SheetCharacter['abilities'];
 const con=scores.con.modifier,dex=scores.dex.modifier;
 const hp=cl?Math.max(1,cl.hitDie+con)+Math.max(0,d.level-1)*Math.max(1,number(cl.hitDie/2)+1+con):0;
 const owned=insights.contents(src,rules);
 const shield=d.choices.equipped_shield?.[0]==='shield'&&owned.has('shield');
 const worn=catalog.equipment.find(x=>x.id===d.choices.equipped_armor?.[0]&&owned.has(x.id));
 const armor=worn?.armorClass;
 const ac=(armor?armor.base+(armor.dex_bonus?Math.min(dex,armor.max_bonus??99):0):10+dex)+(shield?2:0);
 const initiative=dex+((bg?.feat?.id==='alert'||d.choices.human_origin_feat?.[0]==='alert')?pb:0);
 const actions:SheetCharacter['actions']=[];
 for(const [id,row] of owned){
   const item=catalog.equipment.find(x=>x.id===id);
   if(item?.category!=='weapons'||!item.damage)continue;
   const props=item.properties?.map(p=>p.name)||[];
   const ranged=item.categories?.includes('ranged-weapons');
   const ability=ranged?'dex':props.includes('Finesse')&&dex>scores.str.modifier?'dex':'str';
   const mod=scores[ability].modifier;
   const category=item.categories?.some(c=>c.startsWith('martial'))?'martial-weapons':'simple-weapons';
   const proficiency=cl?.proficiencies.some(p=>p.id===category)||false;
   const attack=mod+(proficiency?pb:0);
   const mastery=d.choices.weapon_masteries?.includes(id)?item.mastery?.name:'';
   actions.push({id:'attack-'+id,name:L(item.name),kind:'attack',
    detail:`${format(attack)} to hit · ${item.damage.damage_dice}${format(mod)} ${item.damage.damage_type?.name||''}`,
    tag:mastery?`Mastery: ${mastery}`:undefined});
 }
 const skillsOut=skills.map(s=>({
    id:s.id,proficient:grantIds.has('skill-'+s.id.replaceAll('_','-')),
    bonus:format(scores[s.ability].modifier+(grantIds.has('skill-'+s.id.replaceAll('_','-'))?pb:0))
 }));
 const inventory=[...owned].map(([id,row])=>({itemId:id,qty:row.quantity,equipped:id===d.choices.equipped_weapon?.[0]||id===worn?.id||(id==='shield'&&shield)}));
 const wallet=rules.wallet(src);
 return {
   id:d.id,name:d.name,campaignId:d.campaignId,ownerId:'u1',ownerName:'Demo Player',
   speciesName:chosenSpecies?.name||L(d.speciesId||'—'),className:chosenCls?.name||L(d.classId||'—'),
   subclassName:chosenCls?.subclasses.find(s=>s.id===d.subclassId)?.name,
   backgroundName:chosenBg?.name||L(d.backgroundId||'—'), level:d.level,status:d.status,
   abilities:fullScores,
   vitals:{hpCurrent:hp,hpMax:hp,hpTemp:0,ac,speed:'—',initiative:format(initiative),proficiency:'+'+pb,
    passivePerception:10}, // DM's fixed passive Perception rule, not generic PHB calculation.
   skills:skillsOut,conditions:[],actions,resources:[],spellSlots:[],spellsKnown:[],spellsPrepared:[],inventory,
   currency:{gp:Math.floor(wallet.remaining/100),sp:Math.floor((wallet.remaining%100)/10),cp:wallet.remaining%10},
   story:d.story,privateNotes:d.privateNotes,
 };
}
