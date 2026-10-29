// D&D Atlas v3 API. Cloudflare Worker + D1. Never place secrets in your GitHub Pages repository.

const enc=new TextEncoder();

const bytes=n=>crypto.getRandomValues(new Uint8Array(n));

const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');

const sha=async value=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value))));

const pinHash=async(pin,salt)=>{

 const key=await crypto.subtle.importKey('raw',enc.encode(pin),'PBKDF2',false,['deriveBits']);

 return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},key,256)));

};

const equal=(a,b)=>{if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0;};

const usernameOk=u=>typeof u==='string'&&/^[a-z][a-z0-9_-]{2,29}$/i.test(u);

const allowedPin=(pin,role)=>typeof pin==='string'&&(role==='creator'?pin.length>=8: /^(?=.*\d)[0-9]{6,12}$/.test(pin));

const token=()=>hex(bytes(32));

const err=(code,message)=>Object.assign(new Error(message),{code});

const jsonBody=async req=>{if(Number(req.headers.get('content-length')||0)>1800000)throw err(413,'Payload too large');const raw=await req.text();if(raw.length>1800000)throw err(413,'Payload too large');try{return JSON.parse(raw||'{}')}catch{throw err(400,'Invalid JSON')}};

const redact=(ch,actor,ownerId)=>{const out=structuredClone(ch);if(out.storyPublic!==true && actor.role!=='dm' && actor.id!==ownerId){delete out.backgroundStory;delete out.story;out.storyPrivate=true;}return out;};

const audit=async(env,actor,action,subject)=>env.DB.prepare('INSERT INTO audit_log(actor_user_id,action,subject) VALUES(?,?,?)').bind(actor||null,action,String(subject).slice(0,180)).run();

const canEdit=(actor,ownerId)=>actor.role==='creator'||actor.role==='dm'||(actor.role==='player'&&ownerId!==null&&actor.id===ownerId);

const publicUser=u=>({id:u.id,username:u.username,role:u.role,active:!!u.active,ownerCharacterId:u.owner_character_id||null});

const validCharacter=c=>c&&typeof c==='object'&&!Array.isArray(c)&&typeof c.id==='string'&&/^[\w-]{1,80}$/.test(c.id)&&typeof c.name==='string'&&c.name.length>0&&c.name.length<160&&Array.isArray(c.classes);


// D1 is the authority for live data. Drive is a private, whole-party JSON mirror.
// Google Service Account must be granted Editor on an existing user-owned JSON file.
let googleAccessCache=null;
const driveReady=env=>Boolean(env.GOOGLE_SERVICE_ACCOUNT_EMAIL&&env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY&&env.GOOGLE_DRIVE_PARTY_FILE_ID);
const b64url=data=>btoa(String.fromCharCode(...data)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const jwtPart=value=>b64url(enc.encode(JSON.stringify(value)));
async function googleAccessToken(env){
 if(googleAccessCache&&googleAccessCache.exp>Date.now()+60000)return googleAccessCache.token;
 const email=String(env.GOOGLE_SERVICE_ACCOUNT_EMAIL||'');
 const pem=String(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY||'').replace(/\\n/g,'\n');
 const raw=pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');
 if(!email||!raw)throw Error('Google Drive service-account credentials are missing');
 const key=await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(raw),c=>c.charCodeAt(0)),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const now=Math.floor(Date.now()/1000);
 const unsigned=jwtPart({alg:'RS256',typ:'JWT'})+'.'+jwtPart({iss:email,scope:'https://www.googleapis.com/auth/drive',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3500});
 const signature=new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,enc.encode(unsigned)));
 const reply=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:unsigned+'.'+b64url(signature)})});
 if(!reply.ok)throw Error('Google OAuth rejected service-account credentials: '+reply.status);
 const token=await reply.json();if(!token.access_token)throw Error('Google OAuth response omitted access token');
 googleAccessCache={token:token.access_token,exp:Date.now()+(Number(token.expires_in)||3300)*1000};return token.access_token;
}
const driveId=env=>{
 const id=String(env.GOOGLE_DRIVE_PARTY_FILE_ID||'');
 if(!/^[a-zA-Z0-9_-]{10,160}$/.test(id))throw Error('Invalid GOOGLE_DRIVE_PARTY_FILE_ID');
 return id;
};
async function driveRead(env){
 const access=await googleAccessToken(env);
 const reply=await fetch('https://www.googleapis.com/drive/v3/files/'+driveId(env)+'?alt=media&supportsAllDrives=true',{headers:{Authorization:'Bearer '+access},cache:'no-store'});
 if(!reply.ok)throw Error('Cannot read private Drive JSON: '+reply.status);
 const raw=await reply.text();if(raw.length>1800000)throw Error('Drive JSON exceeds size limit');
 try{return JSON.parse(raw)}catch{throw Error('Drive file does not contain valid JSON')}
}
async function driveWrite(env,doc){
 const access=await googleAccessToken(env);
 const raw=JSON.stringify(doc,null,2);
 if(raw.length>1800000)throw Error('Party JSON too large for Drive mirror');
 const reply=await fetch('https://www.googleapis.com/upload/drive/v3/files/'+driveId(env)+'?uploadType=media&supportsAllDrives=true',{
   method:'PATCH',headers:{Authorization:'Bearer '+access,'Content-Type':'application/json; charset=utf-8'},body:raw
 });
 if(!reply.ok)throw Error('Cannot update Drive JSON: '+reply.status);
}
async function syncState(env){
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS atlas_sync_state (id INTEGER PRIMARY KEY, version INTEGER NOT NULL DEFAULT 0, published_version INTEGER NOT NULL DEFAULT -1, lease_until INTEGER NOT NULL DEFAULT 0)').run();
 await env.DB.prepare('INSERT OR IGNORE INTO atlas_sync_state(id,version,published_version,lease_until) VALUES(1,0,-1,0)').run();
}
async function markChanged(env){
 await syncState(env);
 await env.DB.prepare('UPDATE atlas_sync_state SET version=version+1 WHERE id=1').run();
}
async function snapshotParty(env,version){
 const rows=(await env.DB.prepare('SELECT id,data_json FROM characters ORDER BY id').all()).results;
 const doc={application:'Character Atlas',schema:1,rulesVersion:'2024',syncVersion:version,exportedAt:new Date().toISOString(),characters:rows.map(row=>{const ch=JSON.parse(row.data_json);if(ch.storyPublic!==true){delete ch.backgroundStory;delete ch.story;ch.storyPrivate=true;}return ch;})};
 try{
  const rows=(await env.DB.prepare('SELECT session_number,title,story,session_date,images_json FROM campaign_sessions ORDER BY session_number').all()).results;
  doc.sessions=rows.map(r=>({sessionNumber:r.session_number,title:r.title,story:r.story,date:r.session_date,images:JSON.parse(r.images_json)}));
 }catch{doc.sessions=[];}
 // No user accounts, credentials, D1 session tokens, recovery codes or permissions.
 return doc;
}
// A short D1 lease keeps parallel Worker requests from replacing a newer snapshot
// with an older one. A following save or explicit sync retries after failures.
async function publishDrive(env){
 if(!driveReady(env))return {configured:false};
 await syncState(env);
 const now=Date.now();
 const acquired=await env.DB.prepare('UPDATE atlas_sync_state SET lease_until=? WHERE id=1 AND lease_until<?').bind(now+25000,now).run();
 if(!acquired.meta.changes)return {queued:true};
 try{
  let exportedVersion=0;
  for(let turn=0;turn<3;turn++){
   const state=await env.DB.prepare('SELECT version,published_version FROM atlas_sync_state WHERE id=1').first();
   if(state.published_version>=state.version)return {publishedVersion:state.published_version};
   const doc=await snapshotParty(env,state.version);
   await driveWrite(env,doc);
   exportedVersion=state.version;
   await env.DB.prepare('UPDATE atlas_sync_state SET published_version=MAX(published_version,?) WHERE id=1').bind(exportedVersion).run();
  }
  return {publishedVersion:exportedVersion};
 }finally{
  await env.DB.prepare('UPDATE atlas_sync_state SET lease_until=0 WHERE id=1').run();
 }
}
const scheduleDrive=(env,ctx)=>{
 if(!ctx?.waitUntil||!driveReady(env))return;
 ctx.waitUntil(publishDrive(env).catch(error=>console.error('D&D Atlas Drive mirror failed:',String(error))));
};

const validImageId=id=>/^[a-zA-Z0-9_-]{10,120}$/.test(id||'');

export default {async fetch(request,env,ctx){

 const origin=env.ALLOWED_ORIGIN||'https\://pagkalosg.github.io';

 const incoming=request.headers.get('Origin');

 const cors={'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'Authorization, Content-Type, X-Atlas-Setup','Access-Control-Allow-Methods':'GET, POST, PUT, PATCH, DELETE, OPTIONS','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};

 const respond=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}});

 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});

 // Other origins can retrieve no account data, even if someone bypasses browser CORS.

 if(incoming&&incoming!==origin)return respond({error:'Origin not allowed'},403);

 if(!env.DB)return respond({error:'D1 binding missing'},500);

 const {pathname}=new URL(request.url),method=request.method;

 try{

  if(pathname==='/health')return respond({status:'ok',api:'3.0'});

  if(pathname==='/setup/creator'&&method==='POST'){

   if(!env.BOOTSTRAP_TOKEN)return respond({error:'Bootstrap disabled'},503);

   const secret=request.headers.get('X-Atlas-Setup')||'';

   if(!equal(secret,env.BOOTSTRAP_TOKEN))throw err(403,'Invalid bootstrap token');

   const found=await env.DB.prepare("SELECT id FROM users WHERE role='creator' LIMIT 1").first();

   if(found)throw err(409,'Creator already exists');

   const body=await jsonBody(request);

   if(!usernameOk(body.username)||!allowedPin(body.pin,'creator'))throw err(400,'Creator needs a username and an 8+ character passphrase');

   if(!env.RECOVERY_PEPPER||env.RECOVERY_PEPPER.length<24)throw err(500,'Recovery secret not configured');

   const salt=hex(bytes(16)),hash=await pinHash(body.pin,salt);

   const codes=Array.from({length:10},()=>hex(bytes(8)));

   const digest=await Promise.all(codes.map(c=>sha(env.RECOVERY_PEPPER+':'+c)));

   await env.DB.batch([

    env.DB.prepare('INSERT INTO users(username,role,password_salt,password_hash) VALUES(?,?,?,?)').bind(body.username.toLowerCase(),'creator',salt,hash),

    ...digest.map(d=>env.DB.prepare('INSERT INTO recovery_codes(digest) VALUES(?)').bind(d))

   ]);

   return respond({message:'Creator created; save recovery codes OFFLINE. Codes are shown only once.',recoveryCodes:codes},201);

  }

  if(pathname==='/auth/login'&&method==='POST'){

   const body=await jsonBody(request),u=String(body.username||'').toLowerCase().trim();

   if(!usernameOk(u)||typeof body.pin!=='string')throw err(401,'Invalid credentials');

   const now=Date.now(),attempt=await env.DB.prepare('SELECT failures,locked_until FROM login_attempts WHERE username=?').bind(u).first();

   if(attempt&&attempt.locked_until>now)throw err(429,'Too many attempts. Try later.');

   const user=await env.DB.prepare('SELECT * FROM users WHERE username=? AND active=1').bind(u).first();

   const check=await pinHash(body.pin,user?.password_salt||'00000000000000000000000000000000');

   if(!user||!equal(check,user.password_hash)){

    const fails=(attempt?.failures||0)+1;

    await env.DB.prepare('INSERT INTO login_attempts(username,failures,locked_until) VALUES(?,?,?) ON CONFLICT(username) DO UPDATE SET failures=excluded.failures, locked_until=excluded.locked_until').bind(u,fails,fails>=5?now+15*60*1000:0).run();

    throw err(401,'Invalid credentials');

   }

   await env.DB.prepare('DELETE FROM login_attempts WHERE username=?').bind(u).run();

   const raw=token(),expires=now+7*86400000;

   await env.DB.prepare('INSERT INTO auth_sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').bind(await sha(raw),user.id,expires,now).run();

   await audit(env,user.id,'login',u);

   return respond({token:raw,expires,me:publicUser(user)});

  }

  if(pathname==='/auth/recover'&&method==='POST'){

   if(!env.RECOVERY_PEPPER)throw err(503,'Recovery not configured');

   const body=await jsonBody(request);

   if(typeof body.code!=='string'||!allowedPin(body.newPin,'creator'))throw err(400,'Invalid recovery request');

   const digest=await sha(env.RECOVERY_PEPPER+':'+body.code.trim());

   const code=await env.DB.prepare('SELECT digest FROM recovery_codes WHERE digest=? AND used_at IS NULL').bind(digest).first();

   if(!code)throw err(401,'Invalid or used recovery code');

   const creator=await env.DB.prepare("SELECT id FROM users WHERE role='creator' LIMIT 1").first();

   if(!creator)throw err(404,'Creator not initialized');

   const salt=hex(bytes(16)),hash=await pinHash(body.newPin,salt);

   await env.DB.batch([

    env.DB.prepare('UPDATE recovery_codes SET used_at=? WHERE digest=? AND used_at IS NULL').bind(Date.now(),digest),

    env.DB.prepare('UPDATE users SET password_salt=?, password_hash=?, active=1 WHERE id=?').bind(salt,hash,creator.id),

    env.DB.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(creator.id)

   ]);

   await audit(env,creator.id,'creator-recovered','self');return respond({ok:true});

  }

  const auth=request.headers.get('Authorization')||'';

  if(!/^Bearer [0-9a-f]{64}$/i.test(auth))throw err(401,'Login required');

  const tokenHash=await sha(auth.slice(7));

  const actor=await env.DB.prepare('SELECT u.* FROM auth_sessions s JOIN users u ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1').bind(tokenHash,Date.now()).first();

  if(!actor)throw err(401,'Session expired');

  if(pathname==='/auth/me'&&method==='GET')return respond({me:publicUser(actor)});

  if(pathname==='/auth/logout'&&method==='POST'){

   await env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(tokenHash).run();return respond({ok:true});

  }

  if(pathname==='/users'){

   if(actor.role!=='creator')throw err(403,'Creator only');

   if(method==='GET')return respond({users:(await env.DB.prepare("SELECT id,username,role,active,owner_character_id FROM users WHERE username NOT LIKE 'deleted_%' ORDER BY id").all()).results.map(publicUser)});

   if(method==='POST'){

    const b=await jsonBody(request),role=String(b.role||'player');

    if(!usernameOk(b.username)||!['player','dm'].includes(role)||!allowedPin(b.pin,role))throw err(400,'Invalid username, role or PIN');

    const salt=hex(bytes(16)),hash=await pinHash(b.pin,salt);

    const r=await env.DB.prepare('INSERT INTO users(username,role,password_salt,password_hash) VALUES(?,?,?,?)').bind(b.username.toLowerCase(),role,salt,hash).run();

    await audit(env,actor.id,'create-user',b.username);return respond({id:r.meta.last_row_id},201);

   }

  }

  const userUpdate=pathname.match(/^\/users\/(\d+)$/);

  if(userUpdate&&method==='PATCH'){

   if(actor.role!=='creator')throw err(403,'Creator only');

   const id=Number(userUpdate[1]),target=await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first();

   if(!target)throw err(404,'User not found');

   const b=await jsonBody(request);

   if(target.role==='creator'&&(b.active===false||b.role&&b.role!=='creator'))throw err(403,'Cannot deactivate/demote Creator');

      if(b.username!==undefined){
    const username=String(b.username).trim().toLowerCase();
    if(!usernameOk(username))throw err(400,'Invalid username');
    if(username!==target.username){
     const existing=await env.DB.prepare('SELECT id FROM users WHERE username=? AND id<>?').bind(username,id).first();
     if(existing)throw err(409,'Username already exists');
     await env.DB.prepare('UPDATE users SET username=? WHERE id=?').bind(username,id).run();
     // Invalidate sessions so clients reauthenticate against the new username.
     await env.DB.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(id).run();
     await env.DB.prepare('DELETE FROM login_attempts WHERE username IN (?,?)').bind(target.username,username).run();
    }
   }
if(b.pin!==undefined){if(!allowedPin(b.pin,target.role))throw err(400,'Invalid PIN');const salt=hex(bytes(16)),hash=await pinHash(b.pin,salt);await env.DB.prepare('UPDATE users SET password_salt=?,password_hash=? WHERE id=?').bind(salt,hash,id).run();await env.DB.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(id).run();}

   if(b.active!==undefined)await env.DB.prepare('UPDATE users SET active=? WHERE id=?').bind(b.active?1:0,id).run();

   if(b.role!==undefined){if(target.role==='creator'||!['player','dm'].includes(b.role))throw err(400,'Invalid role');await env.DB.prepare('UPDATE users SET role=? WHERE id=?').bind(b.role,id).run();}

   if(b.characterId!==undefined){const chId=b.characterId===null?null:String(b.characterId);if(chId){const row=await env.DB.prepare('SELECT id FROM characters WHERE id=?').bind(chId).first();if(!row)throw err(404,'Character not found');}await env.DB.prepare('UPDATE users SET owner_character_id=? WHERE id=?').bind(chId,id).run();await env.DB.prepare('UPDATE characters SET owner_user_id=NULL WHERE owner_user_id=?').bind(id).run();if(chId){await env.DB.prepare('UPDATE users SET owner_character_id=NULL WHERE owner_character_id=? AND id<>?').bind(chId,id).run();await env.DB.prepare('UPDATE characters SET owner_user_id=? WHERE id=?').bind(id,chId).run();}}

   await audit(env,actor.id,'update-user',id);return respond({ok:true});

  }

     if(userUpdate&&method==='DELETE'){
    if(actor.role!=='creator')throw err(403,'Creator only');
    const id=Number(userUpdate[1]);
    const target=await env.DB.prepare('SELECT id,role,username FROM users WHERE id=?').bind(id).first();
    if(!target)throw err(404,'User not found');
    if(target.role==='creator'||id===actor.id)throw err(403,'Cannot delete Creator');
    // Soft deletion preserves foreign-key integrity and audit history, while making
    // the account permanently unable to sign in. Characters remain unassigned.
    const tombstone='deleted_'+id+'_'+Date.now();
    await env.DB.batch([
     env.DB.prepare('UPDATE characters SET owner_user_id=NULL WHERE owner_user_id=?').bind(id),
     env.DB.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(id),
     env.DB.prepare('UPDATE users SET username=?,active=0,owner_character_id=NULL WHERE id=?').bind(tombstone,id)
    ]);
    await audit(env,actor.id,'delete-user',id);
    return respond({ok:true,deleted:true,mode:'soft-delete'});
   }


  // Lightweight authenticated version check for all connected PWA clients.
  if(pathname==='/sync/revisions'&&method==='GET'){
   const rows=(await env.DB.prepare('SELECT id,revision FROM characters ORDER BY id').all()).results;
   await syncState(env);const state=await env.DB.prepare('SELECT version FROM atlas_sync_state WHERE id=1').first();
   return respond({revisions:Object.fromEntries(rows.map(r=>[r.id,r.revision])),syncVersion:state.version,checkedAt:Date.now()});
  }
  if(pathname==='/sync/drive/status'&&method==='GET'){
   await syncState(env);
   const row=await env.DB.prepare('SELECT version,published_version FROM atlas_sync_state WHERE id=1').first();
   return respond({configured:driveReady(env),version:row.version,publishedVersion:row.published_version,upToDate:row.version<=row.published_version});
  }
  // Creator can seed missing party characters from the private Drive JSON.
  // Existing D1 characters are deliberately NEVER overwritten by this action.
  if(pathname==='/sync/drive/import'&&method==='POST'){
   if(actor.role!=='creator')throw err(403,'Creator only');
   if(!driveReady(env))throw err(503,'Google Drive service account/file ID not configured');
   const doc=await driveRead(env),list=doc?.characters;
   if(doc?.application!=='Character Atlas'||!Array.isArray(list)||list.length<1||list.length>25||
      list.some(ch=>!validCharacter(ch))||new Set(list.map(ch=>ch.id)).size!==list.length)
      throw err(400,'Invalid Character Atlas JSON in private Drive file');
   const existing=(await env.DB.prepare('SELECT id FROM characters').all()).results;
   const keep=new Set(existing.map(x=>x.id));
   const missing=list.filter(x=>!keep.has(x.id)).map(item=>{const ch=structuredClone(item);if(ch.storyPublic!==true){delete ch.backgroundStory;delete ch.story;ch.storyPrivate=true;}return ch;});
   if(missing.length){
    await env.DB.batch(missing.map(ch=>env.DB.prepare('INSERT INTO characters(id,data_json,modified_by) VALUES(?,?,?)').bind(ch.id,JSON.stringify(ch),actor.id)));
    await markChanged(env);scheduleDrive(env,ctx);
   }
   await audit(env,actor.id,'import-drive-party',String(missing.length));
   return respond({ok:true,added:missing.length,unchanged:list.length-missing.length,existingD1Protected:true});
  }
  // Save Now button explicitly waits for a Drive mirror attempt.
  if(pathname==='/sync/drive/publish'&&method==='POST'){
   if(!['creator','dm','player'].includes(actor.role))throw err(403,'Account required');
   if(!driveReady(env))throw err(503,'Google Drive mirror not configured');
   const result=await publishDrive(env);
   return respond({ok:true,...result});
  }

if(pathname==='/characters'&&method==='GET'){

   const rows=(await env.DB.prepare('SELECT id,owner_user_id,data_json,revision FROM characters ORDER BY updated_at DESC').all()).results;

   return respond({characters:rows.map(r=>({id:r.id,revision:r.revision,ownerUserId:r.owner_user_id,data:redact(JSON.parse(r.data_json),actor,r.owner_user_id)})),me:publicUser(actor)});

  }

  if(pathname==='/characters/import'&&method==='POST'){

   if(actor.role!=='creator')throw err(403,'Creator only');

   const b=await jsonBody(request);if(!Array.isArray(b.characters)||b.characters.length>25)throw err(400,'Invalid import');

   let created=0;

   for(const item of b.characters){if(!validCharacter(item))continue;const result=await env.DB.prepare('INSERT OR IGNORE INTO characters(id,data_json,modified_by) VALUES(?,?,?)').bind(item.id,JSON.stringify(item),actor.id).run();if(result.meta.changes)created++;}

   if(created){await markChanged(env);scheduleDrive(env,ctx);}await audit(env,actor.id,'import-party',created);return respond({created});

  }


  // Atomic campaign replacement, Creator only. Preserve ownership and private
  // story fields for existing characters, including stories the Creator cannot read.
  if(pathname==='/characters/replace'&&method==='POST'){
   if(actor.role!=='creator')throw err(403,'Creator only');
   const b=await jsonBody(request),incoming=b.characters;
   if(!Array.isArray(incoming)||incoming.length<1||incoming.length>25)throw err(400,'Expected 1 to 25 characters.');
   const invalidIndex=incoming.findIndex(c=>!validCharacter(c));
   if(invalidIndex>=0)throw err(400,'Invalid character at index '+(invalidIndex+1)+': id, name and classes[] are required.');
   if(new Set(incoming.map(c=>c.id)).size!==incoming.length)throw err(400,'Duplicate character IDs in backup.');
   const existing=(await env.DB.prepare('SELECT id,owner_user_id,data_json FROM characters').all()).results;
   const existingMap=new Map(existing.map(row=>[row.id,row]));
   const keep=new Set(incoming.map(c=>c.id));
   const statements=[];
   // Detach players from characters absent in the new campaign, without deleting accounts.
   for(const row of existing){
    if(!keep.has(row.id)){
     statements.push(env.DB.prepare('UPDATE users SET owner_character_id=NULL WHERE owner_character_id=?').bind(row.id));
     statements.push(env.DB.prepare('DELETE FROM characters WHERE id=?').bind(row.id));
    }
   }
   for(const item of incoming){
    const old=existingMap.get(item.id), next=structuredClone(item);
    if(old){
     const original=JSON.parse(old.data_json);
     if(original.storyPublic!==true&&actor.id!==old.owner_user_id){
      if(original.backgroundStory!==undefined)next.backgroundStory=original.backgroundStory;
      else delete next.backgroundStory;
      if(original.story!==undefined)next.story=original.story;
      else delete next.story;
      next.storyPublic=false;
     }
     statements.push(env.DB.prepare('UPDATE characters SET data_json=?,revision=revision+1,modified_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(JSON.stringify(next),actor.id,item.id));
    }else statements.push(env.DB.prepare('INSERT INTO characters(id,data_json,modified_by) VALUES(?,?,?)').bind(item.id,JSON.stringify(next),actor.id));
   }
   await env.DB.batch(statements);
   await markChanged(env);scheduleDrive(env,ctx);
   await audit(env,actor.id,'replace-party',String(incoming.length));
   return respond({ok:true,characters:incoming.length});
  }


  // Sessions live in a dedicated D1 table. Legacy GitHub sessions remain a read fallback.
  // This table is created lazily so an existing D1 deployment needs no manual migration.
  const ensureSessions=()=>env.DB.prepare(`CREATE TABLE IF NOT EXISTS campaign_sessions (
    session_number INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    story TEXT NOT NULL DEFAULT '',
    session_date TEXT NOT NULL DEFAULT '',
    images_json TEXT NOT NULL DEFAULT '[]',
    modified_by INTEGER,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  if(pathname==='/sessions'&&method==='GET'){
    await ensureSessions();
    const rows=(await env.DB.prepare('SELECT session_number,title,story,session_date,images_json,updated_at FROM campaign_sessions ORDER BY session_number').all()).results;
    return respond({sessions:rows.map(r=>({id:'session-'+r.session_number,sessionNumber:r.session_number,title:r.title,text:r.story,date:r.session_date,images:JSON.parse(r.images_json),updatedAt:r.updated_at}))});
  }
  if(pathname==='/sessions/import'&&method==='POST'){
    if(!['creator','dm'].includes(actor.role))throw err(403,'Only Creator or DM can import sessions.');
    const body=await jsonBody(request);
    const input=body.session&&typeof body.session==='object'?body.session:body;
    const number=Number(input.sessionNumber??input.number??input.session);
    const title=String(input.title||'').trim();
    const story=String(input.text??input.story??'');
    const date=String(input.date||'').trim();
    const images=Array.isArray(input.images)?input.images:[];
    if(!Number.isInteger(number)||number<1||number>9999||title.length<1||title.length>200||story.length>100000||date.length>40||
       images.length>40||images.some(x=>typeof x!=='string'||x.length>300))throw err(400,'Session JSON requires sessionNumber (1–9999), title and story.');
    await ensureSessions();
    await env.DB.prepare(`INSERT INTO campaign_sessions(session_number,title,story,session_date,images_json,modified_by)
      VALUES(?,?,?,?,?,?) ON CONFLICT(session_number) DO UPDATE SET
      title=excluded.title,story=excluded.story,session_date=excluded.session_date,
      images_json=excluded.images_json,modified_by=excluded.modified_by,updated_at=CURRENT_TIMESTAMP`)
      .bind(number,title,story,date,JSON.stringify(images),actor.id).run();
    await markChanged(env);scheduleDrive(env,ctx);
    await audit(env,actor.id,'import-session',String(number));
    return respond({ok:true,sessionNumber:number});
  }
  const sessionRoute=pathname.match(/^\/sessions\/(\d{1,4})$/);
  if(sessionRoute&&method==='DELETE'){
    if(!['creator','dm'].includes(actor.role))throw err(403,'Only Creator or DM can delete sessions.');
    await ensureSessions();
    await env.DB.prepare('DELETE FROM campaign_sessions WHERE session_number=?').bind(Number(sessionRoute[1])).run();
    await markChanged(env);scheduleDrive(env,ctx);
    await audit(env,actor.id,'delete-session',sessionRoute[1]);
    return respond({ok:true});
  }

  const characterRoute=pathname.match(/^\/characters\/([\w-]{1,80})$/);

  if(characterRoute){

   const id=characterRoute[1],r=await env.DB.prepare('SELECT * FROM characters WHERE id=?').bind(id).first();

   if(method==='POST'){

    if(actor.role==='player')throw err(403,'Admin only');if(r)throw err(409,'Character exists');

    const b=await jsonBody(request);if(!validCharacter(b.character)||b.character.id!==id)throw err(400,'Invalid character');

    await env.DB.prepare('INSERT INTO characters(id,data_json,modified_by) VALUES(?,?,?)').bind(id,JSON.stringify(b.character),actor.id).run();await markChanged(env);scheduleDrive(env,ctx);await audit(env,actor.id,'create-character',id);return respond({revision:1},201);

   }

   if(!r)throw err(404,'Character not found');

   if(method==='GET')return respond({id,revision:r.revision,ownerUserId:r.owner_user_id,data:redact(JSON.parse(r.data_json),actor,r.owner_user_id)});

   if(method==='DELETE'){
    if(!['creator','dm'].includes(actor.role))throw err(403,'Only Creator or DM may delete party characters.');
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET owner_character_id=NULL WHERE owner_character_id=?').bind(id),
      env.DB.prepare('DELETE FROM characters WHERE id=?').bind(id)
    ]);
    await markChanged(env);scheduleDrive(env,ctx);
    await audit(env,actor.id,'delete-character',id);
    return respond({ok:true,deleted:id});
   }

   if(method==='PUT'){

    if(!canEdit(actor,r.owner_user_id))throw err(403,'Cannot edit this character');

    const b=await jsonBody(request);

    if(!validCharacter(b.character)||b.character.id!==id||!Number.isInteger(b.revision)||b.revision<1)throw err(400,'Invalid character or revision');

    const original=JSON.parse(r.data_json),next=structuredClone(b.character);

    // Creator may edit abilities, equipment etc. but cannot read/replace another player's private story.

    if(actor.role==='creator'&&actor.id!==r.owner_user_id&&actor.role!=='dm'&&original.storyPublic!==true){next.backgroundStory=original.backgroundStory;next.storyPublic=false;}

    const result=await env.DB.prepare('UPDATE characters SET data_json=?,revision=revision+1,modified_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=?').bind(JSON.stringify(next),actor.id,id,b.revision).run();

    if(!result.meta.changes)throw err(409,'Character changed elsewhere. Refresh before saving.');

    await markChanged(env);scheduleDrive(env,ctx);await audit(env,actor.id,'save-character',id);return respond({revision:b.revision+1});

   }

  }

  if(pathname==='/images/tags'){

   if(method==='GET')return respond({images:(await env.DB.prepare('SELECT file_id,session_ids,tags FROM image_tags').all()).results.map(r=>({id:r.file_id,sessions:JSON.parse(r.session_ids),tags:JSON.parse(r.tags)}))});

   if(method==='PUT'){

    if(!['creator','dm'].includes(actor.role))throw err(403,'DM/Creator only');

    const b=await jsonBody(request);

    if(!validImageId(b.id)||!Array.isArray(b.sessions)||!Array.isArray(b.tags)||b.sessions.length>20||b.tags.length>30)throw err(400,'Invalid image tags');

    const clean=list=>[...new Set(list.filter(x=>typeof x==='string'&&x.length<80).map(x=>x.trim()).filter(Boolean))];

    await env.DB.prepare('INSERT INTO image_tags(file_id,session_ids,tags) VALUES(?,?,?) ON CONFLICT(file_id) DO UPDATE SET session_ids=excluded.session_ids,tags=excluded.tags,updated_at=CURRENT_TIMESTAMP').bind(b.id,JSON.stringify(clean(b.sessions)),JSON.stringify(clean(b.tags))).run();

    await audit(env,actor.id,'image-tags',b.id);return respond({ok:true});

   }

  }

  throw err(404,'Unknown route');

 }catch(ex){return respond({error:ex.message||'Request failed'},ex.code>=400&&ex.code<=599?ex.code:500)}

}};
