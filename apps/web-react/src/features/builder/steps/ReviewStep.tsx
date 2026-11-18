import { useI18n } from '@/i18n';
import { Badge } from '@/components/ui/Controls';
import { Button } from '@/components/ui/Button';
import { StatusBanner } from '@/components/ui/Feedback';
import { skills, items } from '@/mock/reference';
import { engine, toEngineDraft } from '@/engine/atlas2024';
import { sheetFromDraft } from '@/engine/sheetAdapter';
import { validate, loadoutWarnings, type StepProps } from '../builderModel';
import { CharacterSummary } from '../CharacterSummary';
import { ABILITY_KEYS } from '@/types';
export function ReviewStep({draft,goTo}:StepProps){
 const {t,l,locale}=useI18n();
 const issues=validate(draft),sheet=sheetFromDraft(draft);
 const {rules,insights}=engine(),owned=insights.contents(toEngineDraft(draft),rules);
 const text=(en:string,el:string)=>locale==='el'?el:en;
 return <div className="space-y-5">
  <h2 className="h-display text-2xl">{text('Complete character review','Πλήρης έλεγχος χαρακτήρα')}</h2>
  {issues.length>0&&<section className="surface border-warn/40 p-4"><h3 className="text-warn">{text('Missing required decisions','Υποχρεωτικές επιλογές που λείπουν')}: {issues.length}</h3>
   {issues.map((issue,i)=><div key={i} className="mt-2 flex items-center justify-between text-sm"><span>{t(issue.key)}</span><Button size="sm" onClick={()=>goTo(issue.step)}>{text('Fix','Διόρθωση')}</Button></div>)}
  </section>}
  {!issues.length&&<StatusBanner kind="success" title={text('Ready for DM review','Έτοιμος για έγκριση DM')}/>}
  {loadoutWarnings(draft).length>0&&<StatusBanner kind="conflict" title={t('warn.twoHandedShield')}>{t('warn.twoHandedShieldBody')}</StatusBanner>}
  <header className="surface flex flex-wrap items-center gap-4 p-4">
   {draft.portraitData&&<img src={draft.portraitData} alt="" className="h-28 w-24 rounded-lg object-cover"/>}
   <div><h3 className="h-display text-3xl">{draft.name||'—'}</h3><p>{l(sheet.speciesName)} · {l(sheet.className)} · {l(sheet.backgroundName)}</p><p>Level {sheet.level} · {draft.alignment||'—'}</p></div>
  </header>
  <section className="surface p-4"><h3 className="h-display text-xl">{text('Ability Scores & Modifiers','Χαρακτηριστικά & Modifiers')}</h3>
   <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">{ABILITY_KEYS.map(key=><div key={key} className="rounded-xl border border-night-500 p-3 text-center">
     <span className="text-xs uppercase text-star-300">{key}</span><strong className="block font-display text-2xl">{sheet.abilities[key].score}</strong><b className="text-gold-300">{sheet.abilities[key].modifier}</b>
    </div>)}</div>
  </section>
  <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">{([
    [text('Hit Points','HP'),sheet.vitals.hpMax],[text('Armor Class','AC'),sheet.vitals.ac],[text('Initiative','Initiative'),sheet.vitals.initiative],[text('Proficiency','Proficiency'),sheet.vitals.proficiency],
  ] as const).map(([label,value])=><div key={label} className="surface p-4 text-center"><span className="block text-xs text-star-300">{label}</span><strong className="font-display text-2xl text-gold-300">{value}</strong></div>)}</section>
  <div className="grid gap-3 sm:grid-cols-2"><section className="surface p-4"><h3 className="h-display text-xl">{text('Saving Throws','Σωτήριες Βολές')}</h3>
    {ABILITY_KEYS.map(key=><div key={key} className="flex justify-between border-b border-night-500 py-2 text-sm"><span>{key.toUpperCase()}</span><b>{sheet.abilities[key].save}</b></div>)}</section>
    <section className="surface p-4"><h3 className="h-display text-xl">Skills</h3>
    {sheet.skills.map(s=><div key={s.id} className="flex justify-between border-b border-night-500 py-1.5 text-xs"><span>{s.proficient?'● ':'○ '}{l(skills.find(x=>x.id===s.id)!.name)}</span><b>{s.bonus}</b></div>)}</section></div>
  <section className="surface p-4"><h3 className="h-display text-xl">{text('Attacks & Weapon Mastery','Επιθέσεις & Weapon Mastery')}</h3>
   {sheet.actions.length?sheet.actions.map(a=><div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-night-500 py-2 text-sm"><strong>{l(a.name)}</strong><span>{a.detail}</span>{a.tag&&<Badge tone="gold">{a.tag}</Badge>}</div>):<p className="text-sm text-star-300">{text('No weapons equipped.','Δεν έχεις εξοπλίσει όπλα.')}</p>}
  </section>
  <section className="surface p-4"><h3 className="h-display text-xl">{text('Inventory & Starting Packs','Inventory & Αρχικά Πακέτα')}</h3>
   <div className="mt-2 grid gap-2 sm:grid-cols-2">{[...owned].map(([id,row])=><div key={id} className="rounded-xl bg-night-900 p-3 text-sm"><strong>{items.find(x=>x.id===id)?.name.en||id}</strong> ×{row.quantity}
     <p className="text-xs text-star-300">{row.sources.map(s=>s.label).join(', ')}</p></div>)}</div>
   {draft.customItems?.map(it=><p className="mt-2 text-xs" key={it.id}>{it.name} ×{it.quantity} — {it.description}</p>)}
   <p className="mt-3 text-sm text-gold-300">{text('Remaining gold','Χρήματα που απομένουν')}: {sheet.currency.gp} GP</p>
  </section>
  <section className="surface p-4"><h3 className="h-display text-xl">{text('Features, Feats & Resources','Features, Feats & Resources')}</h3>
   <p className="text-sm text-star-300">{rules.backgroundInfo(draft.backgroundId)?.feat?.name||'—'}</p>
   <p className="text-sm text-star-300">{draft.choices.human_origin_feat?.join(', ')||''} {draft.choices.fighting_style?.join(', ')||''}</p>
   <p className="mt-3 text-xs text-warn">{text('More class resources, spell slots, and special item effects are not yet resolved by the verified engine. The sheet does not invent their values.','Οι επιπλέον Class resources, spell slots και ειδικά item effects δεν υπολογίζονται πλήρως ακόμη. Δεν εμφανίζονται επινοημένες τιμές.')}</p>
  </section>
  <section className="surface p-4"><h3 className="h-display text-xl">{text('Story & Notes','Ιστορικό & Σημειώσεις')}</h3><p className="whitespace-pre-wrap text-sm">{draft.story||'—'}</p><p className="mt-3 text-xs text-nebula-300">{text('Private (local prototype)','Ιδιωτικό (τοπικό prototype)')}</p></section>
  <CharacterSummary draft={draft}/>
 </div>;
}
