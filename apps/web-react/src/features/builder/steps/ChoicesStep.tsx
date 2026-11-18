import { useI18n } from '@/i18n';
import { classes, backgrounds } from '@/mock/reference';
import { engine, uiSkillId } from '@/engine/atlas2024';
import { Badge } from '@/components/ui/Controls';
import { StatusBanner } from '@/components/ui/Feedback';
import type { StepProps } from '../builderModel';
const FIGHTING_STYLES=[
  ['Archery','+2 to Ranged weapon attack rolls.','+2 στα Ranged attack rolls.'],
  ['Defense','+1 Armor Class while wearing armor.','+1 AC όσο φοράς πανοπλία.'],
  ['Dueling','+2 damage with one one-handed melee weapon (shield allowed).','+2 damage με ένα όπλο ενός χεριού (επιτρέπεται Shield).'],
  ['Great Weapon Fighting','Treat each 1 or 2 on two-handed melee weapon damage dice as 3.','Τα damage dice 1 ή 2 από δίχειρο melee weapon υπολογίζονται ως 3.'],
  ['Protection','Use a Reaction and shield to impose Disadvantage on attacks against a nearby ally.','Χρησιμοποιείς Reaction και Shield για Disadvantage σε επιθέσεις κατά κοντινού συμμάχου.'],
  ['Two-Weapon Fighting','Add your ability modifier to the extra Light weapon attack’s damage.','Προσθέτεις το Ability Modifier στη ζημιά της επιπλέον επίθεσης με Light όπλο.'],
] as const;

export function ChoicesStep({draft,update}:StepProps){
 const {t,l,locale}=useI18n();
 const cl=classes.find(x=>x.id===draft.classId),bg=backgrounds.find(x=>x.id===draft.backgroundId);
 const {rules,origins,catalog}=engine();
 const originalFeat=rules.backgroundInfo(draft.backgroundId)?.feat;
 const human=draft.speciesId==='human';
 const selectedFeat=draft.choices.human_origin_feat?.[0];
 const trained=new Set([...bg?.skills||[],...draft.skills,...(draft.choices.human_skill||[])]);
 const skilled=draft.choices.skilled_proficiencies||[];
 const masterySelected=draft.choices.weapon_masteries||[];
 const style=draft.choices.fighting_style?.[0];
 const choose=(key:string,id:string,max:number)=>{
   const current=draft.choices[key]||[];
   const next=current.includes(id)?current.filter(x=>x!==id):current.length>=max?[...current.slice(1),id]:[...current,id];
   update({choices:{...draft.choices,[key]:next}});
 };
 const toggleSkilled=(id:string)=>{
   if(trained.has(id)||(!skilled.includes(id)&&skilled.length>=3))return;
   update({choices:{...draft.choices,skilled_proficiencies:skilled.includes(id)?skilled.filter(x=>x!==id):[...skilled,id]}});
 };
 const masteryWeapons=catalog.equipment.filter(x=>x.category==='weapons'&&x.mastery?.index);
 return <div className="space-y-5">
  <h2 className="h-display text-2xl">{t('builder.step.choices')}</h2>
  {bg&&<section className="surface p-4"><h3 className="h-display text-xl">{locale==='el'?'Origin Feat — από Background':'Origin Feat — from Background'}</h3>
    <p className="mt-2 text-sm text-star-200"><strong>{originalFeat?.name??l(bg.feat)}</strong></p>
    <p className="mt-1 text-sm text-star-300">{origins.FEATS[originalFeat?.id||'']?.[locale]|| (locale==='el'?'Αυτόματο χαρακτηριστικό του Background.':'Granted automatically by your Background.')}</p>
  </section>}
  {human&&<section className="surface space-y-3 p-4"><div className="flex items-center justify-between gap-2"><h3 className="h-display text-xl">Human · Versatile</h3><Badge tone={selectedFeat?'ok':'warn'}>{selectedFeat?'1':'0'}/1</Badge></div>
    <p className="text-sm text-star-300">{locale==='el'?'Επιπλέον Origin Feat, πέρα από αυτό που δίνει το Background.':'An additional Origin Feat, in addition to the Background’s granted feat.'}</p>
    <div className="grid gap-2 sm:grid-cols-2">{Object.entries(origins.FEATS).map(([id,feat])=>{
      const duplicate=id===originalFeat?.id&&id!=='skilled'&&id!=='magic-initiate';
      return <button type="button" key={id} disabled={duplicate} aria-pressed={selectedFeat===id} onClick={()=>update({choices:{...draft.choices,human_origin_feat:selectedFeat===id?[]:[id],skilled_proficiencies:[]}})}
        className={`rounded-xl border p-4 text-left ${selectedFeat===id?'border-gold-500 bg-gold-500/10':'border-night-500 hover:border-star-400'} disabled:opacity-40`}>
         <strong className="block text-gold-300">{feat.name}</strong><span className="mt-2 block text-xs leading-relaxed text-star-300">{feat[locale]}</span>
       </button>;
    })}</div>
    {selectedFeat==='skilled'&&<div className="mt-3 space-y-2"><h4 className="font-medium">Skilled — {skilled.length}/3</h4>
      <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">{[
        ...origins.skillOptions.map(x=>({id:uiSkillId(x.id),en:x.en,el:x.el})),
        ...catalog.equipment.filter(x=>x.category==='tools').map(x=>({id:'tool-'+x.id,en:x.name,el:x.name}))
      ].map(opt=><button type="button" key={opt.id} disabled={trained.has(opt.id)} onClick={()=>toggleSkilled(opt.id)} aria-pressed={skilled.includes(opt.id)}
        className={`rounded-xl border p-2 text-left text-xs ${skilled.includes(opt.id)?'border-gold-500 bg-gold-500/10':'border-night-500'} disabled:opacity-40`}>{skilled.includes(opt.id)?'✓ ':''}{locale==='el'?opt.el:opt.en}</button>)}</div>
    </div>}
    {selectedFeat==='magic-initiate'&&<StatusBanner kind="pending" title={locale==='el'?'Απαιτούνται επιπλέον επιλογές ξορκιών':'Spell choices are required'}>{locale==='el'?'Θα συνδεθεί με το επόμενο Spell Picker (λίστα, 2 cantrips, 1 spell level 1 και Spellcasting Ability). Δεν μπορεί να οριστικοποιηθεί χωρίς αυτές τις επιλογές.':'This requires a spell list, two cantrips, one level-1 spell, and casting ability. It cannot be finalized without those choices.'}</StatusBanner>}
  </section>}
  {cl?.id==='fighter'&&<><section className="surface p-4"><div className="flex justify-between"><h3 className="h-display text-xl">Fighting Style</h3><Badge tone={style?'ok':'warn'}>{style?'1':'0'}/1</Badge></div>
   <div className="mt-3 grid gap-2 sm:grid-cols-2">{FIGHTING_STYLES.map(([id,en,el])=><button key={id} type="button" aria-pressed={style===id} onClick={()=>choose('fighting_style',id,1)}
     className={`rounded-xl border p-4 text-left ${style===id?'border-gold-500 bg-gold-500/10':'border-night-500 hover:border-star-400'}`}><strong className="text-gold-300">{id}</strong><p className="mt-2 text-xs leading-relaxed text-star-300">{locale==='el'?el:en}</p></button>)}</div>
  </section>
  <section className="surface p-4"><div className="flex justify-between"><h3 className="h-display text-xl">Weapon Masteries</h3><Badge tone={masterySelected.length===3?'ok':'warn'}>{masterySelected.length}/3</Badge></div>
   <p className="mb-3 text-xs text-star-300">{locale==='el'?'Διάλεξε τρία όπλα και δες τι κάνει το Mastery του καθενός.':'Choose three weapons and read their Mastery effects.'}</p>
   <div className="grid max-h-[450px] gap-2 overflow-auto sm:grid-cols-2">{masteryWeapons.map(item=>{
     const chosen=masterySelected.includes(item.id),desc=origins.MASTERIES[item.mastery!.index!]?.[locale]||'';
     return <button key={item.id} type="button" disabled={!chosen&&masterySelected.length>=3} aria-pressed={chosen}
      onClick={()=>{const next=chosen?masterySelected.filter(x=>x!==item.id):[...masterySelected,item.id];update({choices:{...draft.choices,weapon_masteries:next}});}}
      className={`rounded-xl border p-3 text-left ${chosen?'border-gold-500 bg-gold-500/10':'border-night-500 hover:border-star-400'} disabled:opacity-50`}>
       <strong className="block">{chosen?'★ ':''}{item.name}</strong><span className="block text-xs text-gold-300">{item.mastery?.name}</span><span className="mt-1 block text-xs leading-relaxed text-star-300">{desc}</span>
      </button>;
    })}</div>
  </section></>}
  {cl?.id!=='fighter'&&<StatusBanner kind="info" title={locale==='el'?'Επιλογές Class στο επόμενο engine milestone':'Additional Class choices'}>{locale==='el'?'Θα προστεθούν τα πλήρη class-specific choices όταν επικυρωθούν οι 2024 rule handlers. Δεν επινοούμε επιλογές.':'Full class-specific 2024 choices will be enabled when the corresponding engine handlers are verified.'}</StatusBanner>}
 </div>;
}
