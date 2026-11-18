/* D&D Atlas v2 — SRD 2024 Standard Array and 27-point Point Buy UI.
 * Browser-only preview; the final Worker must validate saved character choices.
 */
(function () {
  'use strict';
  const STANDARD=[15,14,13,12,10,8];
  const STANDARD_TOTAL=STANDARD.reduce((sum,v)=>sum+v,0);
  const COST={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};
  const BUDGET=27;
  const KEYS=['str','dex','con','int','wis','cha'];
  const L={
    en:{title:'How would you like to assign your abilities?',standard:'Standard Array',pointbuy:'Point Buy',
      standardHelp:'Use + / − to reassign the six fixed scores. A decrease frees score points, without changing another ability. The final six values must still be 15, 14, 13, 12, 10, 8.',
      pointbuyHelp:'Start at 8 and spend up to 27 points. Raising 13 → 14 or 14 → 15 costs two points.',
      remaining:'Points remaining',spent:'Points spent',base:'Base',boost:'Background boost',
      final:'Final score',mod:'Modifier',decrease:'Decrease',increase:'Increase',
      boostHelp:'Select +2/+1 or +1/+1/+1 from your Background below. Modifiers update automatically.',
      leftOver:'You still have available points. You can keep them or spend more.',invalid:'Invalid ability allocation.',standardRemaining:'Score points left to reassign',standardInvalid:'Standard Array requires exactly 15, 14, 13, 12, 10, 8. Reassign the freed points to another ability before continuing.'},
    el:{title:'Πώς θέλεις να κατανείμεις τα χαρακτηριστικά;',standard:'Τυπική Σειρά (Standard Array)',pointbuy:'Αγορά Πόντων (Point Buy)',
      standardHelp:'Με τα + / − ανακατανέμεις τις έξι σταθερές τιμές. Κάθε μείωση επιστρέφει πόντους χωρίς να αλλάζει άλλο χαρακτηριστικό. Στο τέλος οι τιμές πρέπει να είναι 15, 14, 13, 12, 10, 8.',
      pointbuyHelp:'Ξεκινάς από 8 και έχεις έως 27 πόντους. Οι αυξήσεις 13 → 14 και 14 → 15 κοστίζουν δύο πόντους.',
      remaining:'Πόντοι που απομένουν',spent:'Πόντοι που ξοδεύτηκαν',base:'Αρχική τιμή',boost:'Βελτίωση Προέλευσης',
      final:'Τελική τιμή',mod:'Τροποποιητής',decrease:'Μείωση',increase:'Αύξηση',
      boostHelp:'Παρακάτω ορίζεις +2/+1 ή +1/+1/+1 από το Background. Οι modifiers ενημερώνονται αυτόματα.',
      leftOver:'Έχεις διαθέσιμους πόντους. Μπορείς να συνεχίσεις ή να τους αξιοποιήσεις.',invalid:'Μη έγκυρη κατανομή χαρακτηριστικών.',standardRemaining:'Πόντοι τιμών προς ανακατανομή',standardInvalid:'Η Τυπική Σειρά απαιτεί ακριβώς τις τιμές 15, 14, 13, 12, 10, 8. Ανάθεσε τους διαθέσιμους πόντους προτού συνεχίσεις.'}
  };
  const initialScores=method=>method==='pointbuy'?[8,8,8,8,8,8]:[...STANDARD];
  const spent=values=>values.reduce((sum,v)=>sum+(COST[v]??NaN),0);
  function validate(method,values) {
    if(!Array.isArray(values)||values.length!==6||!values.every(Number.isInteger))return {valid:false,remaining:null,spent:null};
    if(method==='standard'){
      const remaining=STANDARD_TOTAL-values.reduce((sum,v)=>sum+v,0);
      const valid=values.every(v=>v>=8&&v<=15)&&remaining===0&&[...values].sort((a,b)=>a-b).join(',')===[...STANDARD].sort((a,b)=>a-b).join(',');
      return {valid,remaining,spent:STANDARD_TOTAL-remaining};
    }
    if(method!=='pointbuy'||!values.every(v=>v>=8&&v<=15))return {valid:false,remaining:null,spent:null};
    const used=spent(values);return {valid:Number.isFinite(used)&&used<=BUDGET,remaining:BUDGET-used,spent:used};
  }
  function adjust(values,index,dir,method) {
    if(!Array.isArray(values)||values.length!==6||!values.every(Number.isInteger)||!Number.isInteger(index)||index<0||index>5||![-1,1].includes(dir))return null;
    if(method==='pointbuy'&&!validate(method,values).valid)return null;
    const next=[...values];
    if(method==='standard') {
      const value=next[index]+dir;
      if(value<8||value>15)return null;
      next[index]=value;
      if(STANDARD_TOTAL-next.reduce((sum,v)=>sum+v,0)<0)return null;
    }else{
      const value=next[index]+dir;
      if(value<8||value>15)return null;
      next[index]=value;
      if(spent(next)>BUDGET)return null;
    }
    return next;
  }
  function render({draft,locale,t,esc,score,bonusFor}) {
    const l=L[locale==='el'?'el':'en'];
    const method=draft.abilityMethod==='pointbuy'?'pointbuy':'standard';
    const status=validate(method,draft.abilities);
    const modeButtons=['standard','pointbuy'].map(key=>'<button type="button" data-action="ability-method" data-method="'+key+'" aria-pressed="'+(key===method)+'" class="ability-mode '+(key===method?'active':'')+'">'+esc(l[key])+'</button>').join('');
    const budget='<div class="ability-budget" role="status"><div><strong>'+esc(method==='standard'?l.standardRemaining:l.remaining)+'</strong><b>'+status.remaining+(method==='pointbuy'?' / '+BUDGET:'')+'</b></div><div class="ability-budget-progress"><span style="width:'+(method==='pointbuy'?(status.spent/BUDGET)*100:(status.spent/STANDARD_TOTAL)*100)+'%"></span></div></div>';
    const cards=KEYS.map((key,i)=>{
      const name=t('ability'+key[0].toUpperCase()+key.slice(1));
      const base=draft.abilities[i];
      const item=score(draft,key,bonusFor);
      const minusDisabled=adjust(draft.abilities,i,-1,method)===null;
      const plusDisabled=adjust(draft.abilities,i,1,method)===null;
      const button=(dir,disabled,label,sign)=>'<button type="button" data-action="ability-adjust" data-index="'+i+'" data-direction="'+dir+'" aria-label="'+esc(label+' '+name)+'" '+(disabled?'disabled':'')+'>'+sign+'</button>';
      return '<div class="ability-select ability-stepper-card"><span class="ability-name">'+esc(name)+' <small>'+key.toUpperCase()+'</small></span>'+
        '<div class="ability-stepper">'+button(-1,minusDisabled,l.decrease,'−')+'<output>'+base+'</output>'+button(1,plusDisabled,l.increase,'+')
        +'</div><dl class="ability-score-breakdown"><div><dt>'+esc(l.base)+'</dt><dd>'+base+'</dd></div><div><dt>'+esc(l.boost)+'</dt><dd>+'+item.bonus+'</dd></div><div class="score-final"><dt>'+esc(l.final)+'</dt><dd>'+item.total+'</dd></div></dl>'
        +'<div class="ability-modifier-line"><span>'+esc(l.mod)+'</span><b class="ability-modifier">'+(item.modifier>=0?'+':'')+item.modifier+'</b></div></div>';
    }).join('');
    const hint=method==='standard'?l.standardHelp:l.pointbuyHelp;
    return '<section class="ability-allocation"><fieldset class="ability-methods"><legend>'+esc(l.title)+'</legend><div class="ability-mode-options">'+modeButtons+'</div><p>'+esc(hint)+'</p></fieldset>'+budget+
      '<div class="ability-grid">'+cards+'</div><p class="inline-info">'+esc(l.boostHelp)+'</p>'+
      (!status.valid?'<p class="inline-warning" role="alert">'+esc(method==='standard'?l.standardInvalid:l.invalid)+'</p>':method==='pointbuy'&&status.remaining>0?'<p class="ability-point-notice">'+esc(l.leftOver)+'</p>':'')+'</section>';
  }
  window.ATLAS_V2_ABILITIES=Object.freeze({STANDARD,COST,BUDGET,L,initialScores,spent,validate,adjust,render});
})();