import { useI18n } from '@/i18n';
import { classes } from '@/mock/reference';
import { SelectionCard } from '@/components/ui/SelectionCard';
import { StatusBanner } from '@/components/ui/Feedback';
import type { StepProps } from '../builderModel';
export function SubclassStep({draft,update}:StepProps){
 const {l,locale}=useI18n();
 const cl=classes.find(c=>c.id===draft.classId);
 if(!cl)return <StatusBanner kind="info" title={locale==='el'?'Επίλεξε πρώτα Κλάση':'Choose a Class first'} />;
 if(draft.level<cl.subclassLevel)return <StatusBanner kind="info" title={locale==='el'?'Η Subclass δεν είναι ακόμη διαθέσιμη':'Subclass not unlocked yet'} />;
 return <section className="space-y-4"><h2 className="h-display text-2xl">{locale==='el'?'Επιλογή Subclass':'Choose a Subclass'}</h2>
 <p className="text-sm text-star-300">{locale==='el'?'Εμφανίζονται μόνο οι επιλογές του ενεργού SRD 5.2.1. Πρόσθετες Subclasses θα προέρχονται αποκλειστικά από ενεργές DM βιβλιοθήκες.':'Only SRD 5.2.1 subclasses are available. Additional subclasses require an enabled, licensed DM content pack.'}</p>
 <div className="grid gap-3 sm:grid-cols-2">{cl.subclasses.map(s=><SelectionCard key={s.id} title={l(s.name)} description={l(s.note)} hue={cl.hue} glyph={cl.glyph} selected={draft.subclassId===s.id} onSelect={()=>update({subclassId:s.id})} />)}</div>
 </section>;
}
