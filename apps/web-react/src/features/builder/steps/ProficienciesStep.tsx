import { useI18n } from '@/i18n';
import { classes, backgrounds, skills } from '@/mock/reference';
import { engine, uiSkillId } from '@/engine/atlas2024';
import { Badge } from '@/components/ui/Controls';
import type { StepProps } from '../builderModel';

export function ProficienciesStep({draft,update}:StepProps){
 const {t,l,locale}=useI18n();
 const cls=classes.find(c=>c.id===draft.classId),bg=backgrounds.find(b=>b.id===draft.backgroundId);
 if(!cls||!bg)return <p className="surface p-6">{t('step.prof.needBoth')}</p>;
 const {rules,origins}=engine();
 const classData=rules.classInfo(draft.classId),bgData=rules.backgroundInfo(draft.backgroundId);
 const skillSelect=cls.skillOptions;
 const owned=new Set(bg.skills);
 const human=draft.choices.human_skill?.[0];
 const chosen=draft.skills.filter(id=>skillSelect.includes(id)&&!owned.has(id));
 const allKnown=new Set([...owned,...chosen,...(human?[human]:[])]);
 const toggleClass=(id:string)=>{
   if(owned.has(id)||id===human)return;
   const next=chosen.includes(id)?chosen.filter(x=>x!==id):chosen.length<cls.skillPicks?[...chosen,id]:chosen;
   update({skills:next});
 };
 const toggleHuman=(id:string)=>{
   if(owned.has(id)||chosen.includes(id))return;
   update({choices:{...draft.choices,human_skill:human===id?[]:[id]}});
 };
 const readable=(id:string)=>{const row=skills.find(s=>s.id===id);return row?l(row.name):id;};
 const ability=(id:string)=>skills.find(s=>s.id===id)?.ability;
 const proficiencyBonus=2+Math.floor((draft.level-1)/4);
 const modifier=(id:string)=>{
   const a=ability(id);if(!a)return '—';
   const score=(draft.abilities[a]??10)+(draft.backgroundBoosts[a]??0);
   const result=Math.floor((score-10)/2)+proficiencyBonus;
   return (result>=0?'+':'')+result;
 };
 return <div className="space-y-5">
  <h2 className="h-display text-2xl">{t('builder.step.proficiencies')}</h2>
  <section className="surface p-4"><h3 className="h-display text-xl">{locale==='el'?'Αυτόματες εξοικειώσεις':'Granted by default'}</h3>
    <p className="mt-1 text-xs text-star-300">{locale==='el'?'Προέρχονται από την Class και το Background, χωρίς να απαιτούν επιλογή.':'These come from your Class and Background. You do not need to choose them again.'}</p>
    <div className="mt-3 flex flex-wrap gap-2">{[...(bgData?.proficiencies||[])].filter(p=>p.id.startsWith('skill-')||p.id.startsWith('tool-')).map(p=><Badge key={p.id} tone="gold">{p.name.replace(/^(Skill|Tool): /,'')} · {l(bg.name)}</Badge>)}
      {classData?.savingThrows?.map(p=><Badge key={p.id}>{p.name} {locale==='el'?'Σωτήρια Βολή':'Saving Throw'} · {l(cls.name)}</Badge>)}
    </div>
  </section>
  <section className="surface p-4"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="h-display text-xl">{locale==='el'?'Επιλογή Skills κλάσης':'Class Skill choices'}</h3><Badge tone={chosen.length===cls.skillPicks?'ok':'warn'}>{chosen.length}/{cls.skillPicks}</Badge></div>
   <div className="grid gap-2 sm:grid-cols-2">{skillSelect.map(id=>{
    const isDefault=owned.has(id),selected=chosen.includes(id),takenByHuman=id===human;
    const disabled=!selected&&(isDefault||takenByHuman||chosen.length>=cls.skillPicks);
    return <button key={id} type="button" disabled={disabled} aria-pressed={selected} onClick={()=>toggleClass(id)}
       className={`flex min-h-[54px] items-center justify-between rounded-xl border p-3 text-left text-sm ${selected?'border-gold-500 bg-gold-500/10':'border-night-500 hover:border-star-400'} disabled:opacity-50`}>
      <span>{selected?'✓ ':''}{readable(id)}{isDefault&&<small className="block text-star-300">{locale==='el'?'Από Background':'From Background'}</small>}</span>
      <b className="text-gold-300">{modifier(id)}</b>
     </button>;
   })}</div></section>
   {draft.speciesId==='human'&&<section className="surface p-4"><div className="mb-3 flex items-center justify-between gap-2"><div><h3 className="h-display text-xl">Human · Skillful</h3><p className="text-xs text-star-300">{locale==='el'?'Επίλεξε μία επιπλέον δεξιότητα πέρα από τις δύο της Class και τις αυτόματες του Background.':'Choose one additional skill beyond the Class picks and automatic Background skills.'}</p></div><Badge tone={human?'ok':'warn'}>{human?'1':'0'}/1</Badge></div>
     <div className="grid gap-2 sm:grid-cols-2">{origins.skillOptions.map(o=>{
       const id=uiSkillId(o.id),used=allKnown.has(id)&&human!==id;
       return <button key={id} type="button" disabled={used} aria-pressed={human===id} onClick={()=>toggleHuman(id)}
         className={`flex min-h-[50px] items-center justify-between rounded-xl border p-3 text-left text-sm ${human===id?'border-gold-500 bg-gold-500/10':'border-night-500'} disabled:opacity-45`}>
         <span>{human===id?'✓ ':''}{locale==='el'?o.el+' ('+o.en+')':o.en}</span><strong>{modifier(id)}</strong>
       </button>;
     })}</div>
   </section>}
   <p className="text-xs text-star-300">{locale==='el'?'Ο Rules Engine ελέγχει αν οι επιλεγμένες εξοικειώσεις είναι διαφορετικές και νόμιμες.':'The 2024 engine checks that selected proficiencies are distinct and legal.'}</p>
 </div>;
}
