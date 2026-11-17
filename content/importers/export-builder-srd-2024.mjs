// Generate a 2024-only, reviewable SRD catalog for the Atlas UI prototype.
// Licensed source: SRD 5.2.1, CC BY 4.0, via dnd5eapi.co.
// This is not the authoritative Rules Engine and does not include official artwork.
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE='https://www.dnd5eapi.co/api/2024/';
const COUNTS={classes:12,backgrounds:4,equipment:182};
const ensureUrl = (url) => {
  const u=new URL(url,BASE);
  if(u.origin!==new URL(BASE).origin || !u.pathname.startsWith('/api/2024/') || u.search || u.hash) throw Error('Non-2024 source: '+url);
  return u.href;
};
async function get(url){
  const target=ensureUrl(url);
  for(let attempt=0;attempt<3;attempt++){
    try{
      const r=await fetch(target,{headers:{Accept:'application/json'}});
      if(!r.ok)throw Error('HTTP '+r.status+' '+target);
      return await r.json();
    }catch(err){if(attempt===2)throw err;await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)))}
  }
}
const plainRef=x=>x&&typeof x==='object'?{id:String(x.index??''),name:String(x.name??'')}:null;
const choices=(list=[])=>list.filter(x=>x.from).map((group,i)=>({
  id:String(i),count:group.choose,kind:group.type,
  options:(group.from?.options??[]).map(o=>plainRef(o.item)).filter(x=>x?.id),
  description:group.desc??''
}));
const normalizedItem=(v)=> {
  if(v.option_type==='multiple')return {type:'set',items:(v.items??[]).map(normalizedItem)};
  if(v.option_type==='counted_reference')return {type:'item',id:v.of?.index,name:v.of?.name,qty:v.count??1,note:v.note??''};
  if(v.option_type==='money')return {type:'money',amount:v.count,unit:v.unit};
  if(v.option_type==='choice'){
    const c=v.choice??{};
    return {type:'choice',count:c.choose??1,category:c.from?.equipment_category?.index??null,items:(c.from?.options??[]).map(normalizedItem)};
  }
  if(v.option_type==='reference')return {type:'item',id:v.item?.index,name:v.item?.name,qty:1};
  throw Error('Unrecognized 2024 equipment option type: '+String(v.option_type));
};
const equipmentOptions=(list=[])=>list.flatMap((c)=>c.from?.options??[]).map((o,i)=>({
  id:String(i),items: o.option_type==='multiple'?(o.items??[]).map(normalizedItem):[normalizedItem(o)]
}));
const coins={cp:1,sp:10,ep:50,gp:100,pp:1000};
const category=(categories,id,name)=>{
  const keys=categories.map(c=>c.index);
  if(keys.some(c=>c.includes('weapon')))return 'weapons';
  if(keys.some(c=>c.includes('armor')||c.includes('shield')))return 'armor';
  if(keys.some(c=>c.includes('tool')||c.includes('instrument')||c.includes('gaming-set')))return 'tools';
  if(keys.some(c=>c.includes('ammunition'))||/potion|poison|antitoxin|holy-water|acid|alchemist|torch|rations|oil|arrows|bolts|healers-kit|healer.s-kit/i.test(id+' '+name))return 'consumables';
  if(keys.some(c=>c.includes('mount')||c.includes('vehicle')))return 'transport';
  return 'adventuring';
};
const output={schemaVersion:1,edition:'2024',source:'SRD 5.2.1',license:'CC BY 4.0',attributionUrl:'https://www.dndbeyond.com/srd',
  warning:'UI-only SRD snapshot. Server must validate legality, progression and permissions.',
  classes:[],backgrounds:[],equipment:[]};
for(const [group,expected] of Object.entries(COUNTS)){
  const listing=await get(group);
  if(!Array.isArray(listing.results)||listing.results.length!==expected)throw Error('Unexpected '+group+' count '+listing.results?.length);
  const results=[];
  for(let i=0;i<listing.results.length;i+=8){
    const slice=listing.results.slice(i,i+8);
    const next=await Promise.all(slice.map(r=>get(r.url)));
    results.push(...next);
  }
  if(group==='classes')output.classes=results.map(x=>({
    id:x.index,name:x.name,hitDie:x.hit_die,primaryAbility:plainRef(x.primary_ability),
    savingThrows:(x.saving_throws??[]).map(plainRef),
    proficiencies:(x.proficiencies??[]).map(plainRef),
    skillChoices:choices(x.proficiency_choices),
    startingOptions:equipmentOptions(x.starting_equipment_options),
    subclasses:(x.subclasses??[]).map(plainRef)
  }));
  if(group==='backgrounds')output.backgrounds=results.map(x=>({
    id:x.index,name:x.name,abilityScores:(x.ability_scores??[]).map(plainRef),
    feat:plainRef(x.feat),proficiencies:(x.proficiencies??[]).map(plainRef),
    skillChoices:choices(x.proficiency_choices),
    startingOptions:equipmentOptions(x.equipment_options)
  }));
  if(group==='equipment')output.equipment=results.map(x=>{
    const categories=x.equipment_categories??[];
    const cost=x.cost&&Number.isFinite(x.cost.quantity)?{amount:x.cost.quantity,unit:x.cost.unit,cp:Math.round(x.cost.quantity*(coins[x.cost.unit]??0))}:null;
    return {id:x.index,name:x.name,category:category(categories,x.index,x.name),categories:categories.map(x=>x.index),
      cost,weight:x.weight??null,
      description:Array.isArray(x.description)?x.description.filter(v=>typeof v==='string').slice(0,4):[],
      damage:x.damage??null, mastery:x.mastery??null, armorClass:x.armor_class??null,
      properties:Array.isArray(x.properties)?x.properties.map(p=>({name:p.name??String(p)})):[],
      contents:Array.isArray(x.contents)?x.contents.map(part=>({
        id:part.item?.index||part.of?.index||part.index||'',
        name:part.item?.name||part.of?.name||part.name||'',
        quantity:part.quantity??part.count??1,
      })).filter(p=>p.id):[],
      isPack: /(?:^|-)pack$/.test(x.index)||categories.some(c=>c.index==='equipment-packs')};
  });
  console.log('2024 '+group+': '+results.length);
}
for(const c of output.classes){
  if(!c.startingOptions.length || !c.skillChoices.length)throw Error('Missing class choices '+c.id);
}
const json=JSON.stringify(output);
const dest=path.resolve('apps/web-v2/catalog/srd-2024.js');
await fs.mkdir(path.dirname(dest),{recursive:true});
await fs.writeFile(dest,'/* SRD 5.2.1 CC BY 4.0 · UI fixture, not rules engine */\nwindow.ATLAS_V2_SRD = '+json+';\n','utf8');
console.log('Created '+dest+' / '+json.length+' bytes');
