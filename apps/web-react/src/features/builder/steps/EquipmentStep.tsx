import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { engine, toEngineDraft, type SrdItem } from '@/engine/atlas2024';
import { Badge } from '@/components/ui/Controls';
import { ItemThumb } from '@/components/ItemThumb';
import { StatusBanner } from '@/components/ui/Feedback';
import type { StepProps } from '../builderModel';
import { loadoutWarnings } from '../builderModel';
import { items } from '@/mock/reference';

const CATEGORIES=[['packs','Packs','Πακέτα'],['weapons','Weapons','Όπλα'],['armor','Armor','Πανοπλίες'],['adventuring','Adventuring gear','Εξοπλισμός'],['consumables','Consumables','Αναλώσιμα'],['tools','Tools','Εργαλεία']];
const fmt=(cp:number)=>`${(cp/100).toFixed(2)} GP`;
const content=(arr:unknown[],depth=0):string[]=>{
 if(depth>5)return [];
 return arr.flatMap(x=>{
   if(!x||typeof x!=='object')return [];
   const q=x as Record<string,unknown>;
   if(q.type==='money')return [`${q.amount} ${String(q.unit??'').toUpperCase()}`];
   if(q.type==='item')return [`${q.qty??1} × ${q.name||q.id||'item'}`];
   if(q.type==='choice')return [`${q.count??1} × ${q.category||'Choice'} (${content(Array.isArray(q.items)?q.items:[],depth+1).slice(0,4).join(', ')})`];
   if(q.type==='set')return content(Array.isArray(q.items)?q.items:[],depth+1);
   return [];
 });
};
export function EquipmentStep({draft,update}:StepProps){
 const {locale,t}=useI18n();
 const [cat,setCat]=useState('packs'),[query,setQuery]=useState('');
 const [expanded,setExpanded]=useState<string|null>(null);
 const [customOpen,setCustomOpen]=useState(false);
 const [customName,setCustomName]=useState(''),[customDescription,setCustomDescription]=useState('');
 const [customCost,setCustomCost]=useState(0),[customQty,setCustomQty]=useState(1);
 const {catalog,rules,insights}=engine();
 const legacy=toEngineDraft(draft),wallet=rules.wallet(legacy),owned=insights.contents(legacy,rules);
 const cls=rules.classInfo(draft.classId),bg=rules.backgroundInfo(draft.backgroundId);
 const selection=(group:string,id:string)=>update({choices:{...draft.choices,[group]:[id]},equipment:[],equipmentQuantities:{}});
 const purchase=(item:SrdItem,direction:number)=>{
   const qty=draft.equipmentQuantities?.[item.id]??(draft.equipment.includes(item.id)?1:0);
   const next=Math.max(0,qty+direction);
   const delta=(next-qty)*(item.cost?.cp||0);
   if(delta>0&&wallet.remaining<delta)return;
   update({equipment:next===0?draft.equipment.filter(id=>id!==item.id):draft.equipment.includes(item.id)?draft.equipment:[...draft.equipment,item.id],
     equipmentQuantities:{...draft.equipmentQuantities,[item.id]:next}});
 };
 const grouped=useMemo(()=>catalog.equipment.filter(x=>{
   const isPack=x.isPack||x.category==='packs'||/pack$/.test(x.id);
   const kind=isPack?'packs':x.category;
   return kind===cat&&(!query||x.name.toLowerCase().includes(query.toLowerCase()));
 }),[catalog,cat,query]);
 const addCustom=()=>{
   if(!customName.trim()||customQty<1||customQty>999||customCost<0)return;
   update({customItems:[...(draft.customItems||[]),{id:crypto.randomUUID(),name:customName.trim().slice(0,100),category:'adventuring',quantity:customQty,costGp:customCost,weight:0,description:customDescription.slice(0,1000)}]});
   setCustomOpen(false);setCustomName('');setCustomDescription('');setCustomCost(0);setCustomQty(1);
 };
 return <div className="space-y-5">
   <h2 className="h-display text-2xl">{t('builder.step.equipment')}</h2>
   <div className="surface sticky top-[65px] z-10 flex items-center justify-between gap-3 border-gold-500/40 p-3 shadow-lg" aria-live="polite">
     <div><span className="block text-xs text-star-300">{locale==='el'?'Αρχικά χρήματα / έξοδα':'Starting gold / spent'}</span><span className="text-sm">{fmt(wallet.starting)} / {fmt(wallet.spent)}</span></div>
     <div className="text-right"><span className="block text-xs text-star-300">{locale==='el'?'Υπόλοιπο':'Remaining'}</span><strong className={`font-display text-2xl ${wallet.remaining<0?'text-danger':'text-gold-300'}`}>{fmt(wallet.remaining)}</strong></div>
   </div>
   {loadoutWarnings(draft).includes('twoHandedShield')&&<StatusBanner kind="conflict" title={t('warn.twoHandedShield')}>{t('warn.twoHandedShieldBody')}</StatusBanner>}
   {([['class','Class','Κλάση',cls?.startingOptions||[]],['background','Background','Προέλευση',bg?.startingOptions||[]]] as const).map(([type,en,el,options])=><section key={type} className="surface p-4">
      <h3 className="h-display text-xl">{locale==='el'?el:en} — {locale==='el'?'Αρχικό πακέτο':'Starting package'}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{options.map((o,i)=>{
        const key=type+'_package',on=draft.choices[key]?.[0]===o.id;
        return <button type="button" key={o.id} onClick={()=>selection(key,o.id)} aria-pressed={on} className={`rounded-xl border p-3 text-left ${on?'border-gold-500 bg-gold-500/10':'border-night-500 hover:border-star-400'}`}>
          <strong>{locale==='el'?'Επιλογή':'Option'} {i+1}{on?' ✓':''}</strong>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-star-300">{content(o.items).map((line,n)=><li key={n}>{line}</li>)}</ul>
        </button>;
      })}</div>
   </section>)}
   <section className="surface p-4"><h3 className="h-display text-xl">{locale==='el'?'Αντικείμενα, επιπλέον αγορές & Packs':'Gear, optional purchases & packs'}</h3>
     <div className="mt-3 flex flex-wrap gap-2">{CATEGORIES.map(([id,en,el])=><button key={id} type="button" onClick={()=>setCat(id)} aria-pressed={cat===id} className={`rounded-xl border px-3 py-2 text-xs ${cat===id?'border-gold-500 bg-gold-500/10':'border-night-500'}`}>{locale==='el'?el:en}</button>)}</div>
     <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={locale==='el'?'Αναζήτηση...':'Search gear...'} className="input my-3" aria-label="Search items" />
     <div className="grid gap-3 sm:grid-cols-2">{grouped.map(item=>{
       const itemMeta=items.find(x=>x.id===item.id);
       const from=owned.get(item.id),qty=draft.equipmentQuantities?.[item.id]??(draft.equipment.includes(item.id)?1:0);
       const ownedFrom=from?.sources.map(s=>s.label).filter(Boolean)||[];
       const isExpanded=expanded===item.id;
       return <div key={item.id} className="rounded-2xl border border-night-500 p-3">
         <div className="flex items-center gap-3"><div className="shrink-0">{itemMeta&&<ItemThumb item={itemMeta} size={36}/>}</div><div className="min-w-0 flex-1">
           <strong className="block text-sm">{item.name}</strong><span className="text-xs text-star-300">{item.cost?`${item.cost.amount} ${item.cost.unit.toUpperCase()}`:'—'} · {item.weight??0} lb</span></div>
           {from&&<Badge tone="gold">×{from.quantity}</Badge>}
         </div>
         {ownedFrom.length>0&&<p className="mt-2 text-xs text-ok">✓ {locale==='el'?'Περιέχεται / επιλέχθηκε από':'Included / selected via'}: {ownedFrom.join(', ')}</p>}
         <div className="mt-3 flex items-center justify-between gap-2"><button type="button" className="text-xs text-gold-300 underline" onClick={()=>setExpanded(isExpanded?null:item.id)}>{locale==='el'?'Λεπτομέρειες':'Details'}</button>
           <div className="flex items-center gap-2"><button type="button" className="rounded-lg border border-night-500 px-3 py-1" disabled={qty===0} onClick={()=>purchase(item,-1)} aria-label="Remove one">−</button>
             <b>{qty}</b><button type="button" className="rounded-lg border border-night-500 px-3 py-1" disabled={!!item.cost&&wallet.remaining<(item.cost.cp||0)} onClick={()=>purchase(item,1)} aria-label="Add one">+</button></div>
         </div>
         {isExpanded&&<div className="mt-3 border-t border-night-500 pt-2 text-xs leading-relaxed text-star-300">
           {item.description?.map((line,i)=><p key={i} className="mb-1">{line}</p>)}
           {item.mastery&&<p className="text-gold-300">{item.mastery.name} — {engine().origins.MASTERIES[item.mastery.index??'']?.[locale]}</p>}
           {(item.contents?.length ?? 0)>0&&<ul>{item.contents?.map(part=><li key={part.id}>{part.quantity} × {part.name}</li>)}</ul>}
         </div>}
       </div>;
     })}</div>
   </section>
   <section className="surface p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="h-display text-xl">{locale==='el'?'Custom αντικείμενα':'Custom items'}</h3><button className="rounded-lg border border-gold-500 px-3 py-2 text-sm text-gold-300" type="button" onClick={()=>setCustomOpen(!customOpen)}>{customOpen?'−':'+'} {locale==='el'?'Νέο αντικείμενο':'New item'}</button></div>
    {customOpen&&<div className="mt-3 grid gap-2"><input className="input" placeholder={locale==='el'?'Όνομα':'Name'} value={customName} onChange={e=>setCustomName(e.target.value)} maxLength={100}/>
      <textarea className="input" placeholder={locale==='el'?'Περιγραφή':'Description'} value={customDescription} onChange={e=>setCustomDescription(e.target.value)}/>
      <div className="flex flex-wrap gap-3"><label className="text-xs">GP <input className="input" type="number" min="0" value={customCost} onChange={e=>setCustomCost(Math.max(0,Number(e.target.value)))}/></label>
      <label className="text-xs">{locale==='el'?'Ποσότητα':'Quantity'} <input className="input" type="number" min="1" max="999" value={customQty} onChange={e=>setCustomQty(Math.max(1,Math.min(999,Number(e.target.value))))}/></label></div>
      <button type="button" className="rounded-xl bg-gold-500 p-3 text-night-950" onClick={addCustom}>{locale==='el'?'Προσθήκη':'Add custom item'}</button>
    </div>}
    <ul className="mt-2 space-y-1 text-sm">{draft.customItems?.map(item=><li key={item.id} className="flex items-center justify-between gap-2 border-t border-night-500 py-2"><span>{item.name} ×{item.quantity} — {item.description}</span><button type="button" onClick={()=>update({customItems:draft.customItems?.filter(x=>x.id!==item.id)})}>✕</button></li>)}</ul>
   </section>
 </div>;
}
