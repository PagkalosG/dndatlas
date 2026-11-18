import { useId } from 'react';
import { useI18n } from '@/i18n';
import { Field } from '@/components/ui/Controls';
import { PrivateBadge } from '@/components/ui/Feedback';
import type { StepProps } from '../builderModel';
const alignments=['lawful-good','neutral-good','chaotic-good','lawful-neutral','true-neutral','chaotic-neutral','lawful-evil','neutral-evil','chaotic-evil'];
export function DetailsStep({draft,update}:StepProps){
 const {t,locale}=useI18n();const id=useId();
 const portrait=(file:File|undefined)=>{
  if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>900*1024)return alert(locale==='el'?'Μόνο PNG/JPEG/WebP έως 900 KB.':'Only PNG/JPEG/WebP up to 900 KB.');
  const reader=new FileReader();reader.onload=()=>{const result=String(reader.result||'');if(result.startsWith('data:image/'))update({portraitData:result});};reader.readAsDataURL(file);
 };
 return <div className="space-y-4"><h2 className="h-display text-2xl">{t('builder.step.details')}</h2>
 <section className="surface space-y-4 p-4"><Field label={t('step.details.name')} htmlFor={`${id}-name`} error={!draft.name.trim()?t('val.name'):undefined}>
  <input id={`${id}-name`} className="input" maxLength={60} value={draft.name} onChange={e=>update({name:e.target.value})} placeholder={t('step.details.namePlaceholder')}/>
 </Field>
 <Field label={locale==='el'?'Alignment (Ηθική στάση)':'Alignment'} htmlFor={`${id}-alignment`}>
  <select className="input" id={`${id}-alignment`} value={draft.alignment||''} onChange={e=>update({alignment:e.target.value})}><option value="">{locale==='el'?'Επιλογή':'Choose'}</option>
   {alignments.map(x=><option value={x} key={x}>{x.replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
  </select>
 </Field>
 <Field label={locale==='el'?'Πορτρέτο χαρακτήρα':'Character portrait'} htmlFor={`${id}-portrait`} hint={locale==='el'?'Πρωτότυπο προσωπικό πορτρέτο, αποθηκεύεται μόνο στη συσκευή.':'Original personal portrait, stored only on your device.'}>
   <input id={`${id}-portrait`} className="input" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>portrait(e.target.files?.[0])}/>
 </Field>
 {draft.portraitData&&<img src={draft.portraitData} alt="" className="h-44 w-36 rounded-xl object-cover"/>}
 </section>
 <section className="surface space-y-4 border-nebula-400/40 p-4"><div className="flex items-center gap-2"><PrivateBadge/><p className="text-xs text-star-300">{t('private.explain')}</p></div>
   <Field label={t('step.details.story')} htmlFor={`${id}-story`} optional={t('common.optional')} hint={t('step.details.storyHint')}>
     <textarea className="input min-h-[120px]" id={`${id}-story`} value={draft.story} onChange={e=>update({story:e.target.value})}/>
   </Field>
   <Field label={t('step.details.notes')} htmlFor={`${id}-notes`} optional={t('common.optional')}>
     <textarea className="input min-h-[90px]" id={`${id}-notes`} value={draft.privateNotes} onChange={e=>update({privateNotes:e.target.value})}/>
   </Field>
 </section></div>;
}
