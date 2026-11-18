import { useI18n } from '@/i18n';
import { abilityNames, backgrounds } from '@/mock/reference';
import { ABILITY_KEYS, type AbilityKey } from '@/types';
import { Segmented, NumberStepper } from '@/components/ui/Controls';
import { StatusBanner } from '@/components/ui/Feedback';
import { engine } from '@/engine/atlas2024';
import { STANDARD_ARRAY, POINT_BUY_BUDGET, POINT_BUY_COST, boostTotal, type StepProps } from '../builderModel';

const keys=ABILITY_KEYS;
const points=(scores: number[])=>scores.reduce((sum,v)=>sum+(POINT_BUY_COST[v]??0),0);
export function AbilitiesStep({draft,update}:StepProps){
 const {t,l,locale}=useI18n();
 const bg=backgrounds.find(b=>b.id===draft.backgroundId);
 const mode=draft.abilityMethod;
 const base=keys.map((k,i)=>draft.abilities[k]??(mode==='pointbuy'?8:STANDARD_ARRAY[i]));
 const engineStatus=engine().abilities.validate(mode,base);
 const standardRemaining=STANDARD_ARRAY.reduce((s,n)=>s+n,0)-base.reduce((s,n)=>s+n,0);
 const buyRemaining=POINT_BUY_BUDGET-points(base);
 const remaining=mode==='standard'?standardRemaining:mode==='pointbuy'?buyRemaining:null;
 const boosts=boostTotal(draft);
 const setMethod=(method:typeof mode)=>update({abilityMethod:method,abilities:Object.fromEntries(keys.map((k,i)=>[k,method==='pointbuy'?8:STANDARD_ARRAY[i]])),backgroundBoosts:{}});
 const adjust=(key:AbilityKey,direction:number)=>{
   const idx=keys.indexOf(key);
   if(mode==='manual'){const next=Math.max(3,Math.min(18,base[idx]+direction));update({abilities:{...draft.abilities,[key]:next}});return;}
   const next=engine().abilities.adjust(base,idx,direction,mode);
   if(!next)return;
   update({abilities:Object.fromEntries(keys.map((k,i)=>[k,next[i]]))});
 };
 const boost=(key:AbilityKey,delta:number)=>{
   const next=Math.max(0,Math.min(2,(draft.backgroundBoosts[key]??0)+delta));
   const values={...draft.backgroundBoosts,[key]:next};
   const total=Object.values(values).reduce<number>((sum,x)=>sum+(x??0),0);
   if(total<=3)update({backgroundBoosts:values});
 };
 return <div className="space-y-5">
  <h2 className="h-display text-2xl">{t('builder.step.abilities')}</h2>
  <Segmented label={t('step.abilities.method')} value={mode} onChange={setMethod} options={[
    {id:'standard',label:t('step.abilities.standard')},{id:'pointbuy',label:t('step.abilities.pointbuy')},{id:'manual',label:t('step.abilities.manual')}
  ]}/>
  {mode==='manual'&&<StatusBanner kind="pending" title={t('step.abilities.manualNeedsApproval')}>{t('step.abilities.manualBody')}</StatusBanner>}
  {remaining!==null&&<div className="surface sticky top-[65px] z-10 flex flex-wrap items-center justify-between gap-3 border-gold-500/40 p-3" aria-live="polite">
    <span>{locale==='el'?(mode==='standard'?'Πόντοι προς ανακατανομή':'Διαθέσιμοι πόντοι'):(mode==='standard'?'Score points to reassign':'Points remaining')}</span>
    <span className="font-display text-2xl text-gold-300">{remaining}{mode==='pointbuy'?' / 27':''}</span>
    {mode==='standard'&&!engineStatus.valid&&<small className="w-full text-star-300">{locale==='el'?'Το τελικό σύνολο πρέπει να είναι 15, 14, 13, 12, 10, 8.':'Final scores must use exactly 15, 14, 13, 12, 10, 8.'}</small>}
  </div>}
  <div className="grid gap-3 sm:grid-cols-2">{keys.map((key,i)=>{
    const value=base[i],backgroundBoost=draft.backgroundBoosts[key]??0,final=value+backgroundBoost,modifier=Math.floor((final-10)/2);
    const canDown=mode==='manual'?value>3:!!engine().abilities.adjust(base,i,-1,mode);
    const canUp=mode==='manual'?value<18:!!engine().abilities.adjust(base,i,1,mode);
    return <section key={key} className="surface p-4">
      <div className="mb-3 flex items-center justify-between"><b>{abilityNames[key][locale]}</b><span className="text-xs text-star-300">{key.toUpperCase()}</span></div>
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="rounded-xl border border-night-500 px-4 py-2 text-2xl disabled:opacity-30" disabled={!canDown} onClick={()=>adjust(key,-1)} aria-label={`Decrease ${key}`}>−</button>
        <div className="text-center"><div className="font-display text-3xl text-gold-300">{value}</div><div className="text-sm text-star-300">{locale==='el'?'Βάση':'Base'}</div></div>
        <button type="button" className="rounded-xl border border-night-500 px-4 py-2 text-2xl disabled:opacity-30" disabled={!canUp} onClick={()=>adjust(key,1)} aria-label={`Increase ${key}`}>+</button>
      </div>
      <div className="mt-3 flex justify-between border-t border-night-500 pt-3 text-sm"><span>{locale==='el'?'Background Boost':'Background boost'} +{backgroundBoost}</span><span>{locale==='el'?'Τελικό':'Final'} <b>{final}</b></span><strong className="text-gold-300">{modifier>=0?'+':''}{modifier}</strong></div>
    </section>;
  })}</div>
  {bg&&<section className="surface space-y-3 p-4"><h3 className="h-display text-xl">{t('step.abilities.bgBoosts')} · {l(bg.name)}</h3>
    <p className="text-sm text-star-300">{locale==='el'?'Επίλεξε +2/+1 σε δύο διαφορετικά επιτρεπόμενα Abilities ή +1/+1/+1 και στα τρία.':'Choose +2/+1 on two different permitted abilities, or +1/+1/+1 on all three.'} <b>{boosts}/3</b></p>
    <div className="grid gap-3 sm:grid-cols-3">{bg.abilityBoostOptions.map(key=><div key={key} className="flex items-center justify-between rounded-xl bg-night-900 p-3"><span>{abilityNames[key][locale]}</span>
       <NumberStepper label={abilityNames[key][locale]} value={draft.backgroundBoosts[key]??0} min={0} max={Math.min(2,(draft.backgroundBoosts[key]??0)+(3-boosts))} onChange={v=>boost(key,v-(draft.backgroundBoosts[key]??0))}/>
     </div>)}</div>
  </section>}
 </div>;
}
