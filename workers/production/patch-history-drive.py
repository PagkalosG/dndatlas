#!/usr/bin/env python3
"""Patch exactly the verified production Atlas Worker; never deploy stale source.

Builds directly from Cloudflare's live module and injects the reviewed extension.
Hard SHA guard prevents accidental code replacement. Runs node --check in CI.
"""
import argparse
import hashlib
from pathlib import Path
from email import policy
from email.parser import BytesParser

EXPECTED = '77938550d5f82e43f7f77de6005d9fe0f87d0cd5870a9921727354f5bd499132'

def main_module(data):
    if not data.startswith(b'--'):return data
    boundary=data.splitlines()[0][2:].strip()
    msg=BytesParser(policy=policy.default).parsebytes(b'MIME-Version: 1.0\r\nContent-Type: multipart/form-data; boundary="'+boundary+b'"\r\n\r\n'+data)
    mods=[p.get_payload(decode=True) or b'' for p in msg.iter_parts()]
    matches=[data for data in mods if b'export default' in data and b'const characterRoute=pathname.match(' in data]
    if len(matches)!=1:raise ValueError('Expected one production main module, found '+str(len(matches)))
    return matches[0]

def only(text,old,new,label):
    count=text.count(old)
    if count!=1:raise ValueError(label+' matched '+str(count)+' times, expected exactly one')
    return text.replace(old,new,1)

def section(text,a,b,replacement,label):
    i=text.find(a)
    j=text.find(b,i+len(a)) if i>=0 else -1
    if i<0 or j<0:raise ValueError('Section anchors not found: '+label)
    return text[:i]+replacement+'\n  '+text[j:]

def patch(data,extension):
    raw=main_module(data)
    sha=hashlib.sha256(raw).hexdigest()
    print('Original production SHA256:',sha)
    if sha!=EXPECTED:raise ValueError('Live production Worker changed. Refusing unsafe deployment.')
    text=raw.decode('utf-8-sig')
    # Replace the existing Creator-only JSON roster endpoints with logged operations.
    text=section(text,
        "if(pathname==='/characters/import'&&method==='POST'){",
        "if(pathname==='/characters/replace'&&method==='POST'){",
        """if(pathname==='/characters/import'&&method==='POST'){
    if(actor.role!=='creator')throw err(403,'Creator only');
    const b=await jsonBody(request);
    if(!Array.isArray(b.characters)||b.characters.length>25)throw err(400,'Invalid import');
    const characters=b.characters.filter(validCharacter);
    const current=(await env.DB.prepare('SELECT id FROM characters').all()).results;
    const ids=new Set(current.map(r=>r.id));
    const missing=characters.filter(ch=>!ids.has(ch.id));
    if(missing.length){
      await atlasEnsureHistory(env);
      const writes=[];
      for(const item of missing){
        const ch=structuredClone(item);delete ch._ownerId;
        writes.push(env.DB.prepare('INSERT INTO characters(id,data_json,modified_by) VALUES(?,?,?)').bind(ch.id,JSON.stringify(ch),actor.id));
        writes.push(atlasHistoryWrite(env,actor,'import',ch.id,null,ch,null,null));
      }
      await env.DB.batch(writes);
    }
    await audit(env,actor.id,'import-party',missing.length);
    return respond({created:missing.length});
  }""",'import')
    text=section(text,
        "if(pathname==='/characters/replace'&&method==='POST'){",
        "if(pathname==='/characters/bulk-delete'&&method==='POST'){",
        """if(pathname==='/characters/replace'&&method==='POST'){
    if(!['creator','dm'].includes(actor.role))throw err(403,'Creator/DM only');
    const b=await jsonBody(request);
    if(!atlasValidRoster(b.characters,validCharacter))throw err(400,'Invalid roster');
    const result=await atlasReplaceRoster(env,actor,b.characters,'replace');
    await audit(env,actor.id,'replace-party',b.characters.length);
    return respond(result);
  }""",'replace')
    text=section(text,
        "if(pathname==='/characters/bulk-delete'&&method==='POST'){",
        "const characterRoute=pathname.match(",
        """if(pathname==='/characters/bulk-delete'&&method==='POST'){
    if(!['creator','dm'].includes(actor.role))throw err(403,'Creator/DM only');
    const b=await jsonBody(request),ids=b.ids;
    if(!Array.isArray(ids)||ids.length<1||ids.length>25||ids.some(id=>typeof id!=='string'||!/^[\\w-]{1,80}$/.test(id))||new Set(ids).size!==ids.length)throw err(400,'Invalid character IDs');
    const slots=ids.map(()=>'?').join(',');
    const existing=(await env.DB.prepare('SELECT * FROM characters WHERE id IN ('+slots+')').bind(...ids).all()).results;
    await atlasEnsureHistory(env);
    const group=crypto.randomUUID();
    const writes=[
      env.DB.prepare('UPDATE users SET owner_character_id=NULL WHERE owner_character_id IN ('+slots+')').bind(...ids),
      env.DB.prepare('DELETE FROM characters WHERE id IN ('+slots+')').bind(...ids),
      ...existing.map(r=>atlasHistoryWrite(env,actor,'bulk-delete',r.id,atlasSnapshot(r),null,r.owner_user_id,null,group))
    ];
    const results=await env.DB.batch(writes);
    await audit(env,actor.id,'bulk-delete-characters',ids.join(','));
    return respond({ok:true,deleted:results[1]?.meta?.changes??0});
  }""",'bulk delete')

    # Individual character creation and deletion are recorded in the same D1 batch.
    insert_old="await env.DB.prepare('INSERT INTO characters(id,data_json,modified_by) VALUES(?,?,?)').bind(id,JSON.stringify(b.character),actor.id).run();"
    insert_new="await atlasEnsureHistory(env);await env.DB.batch([env.DB.prepare('INSERT INTO characters(id,data_json,modified_by) VALUES(?,?,?)').bind(id,JSON.stringify(b.character),actor.id),atlasHistoryWrite(env,actor,'create',id,null,b.character,null,null)]);"
    text=only(text,insert_old,insert_new,'single character insert')
    delete_old="""await env.DB.batch([
         env.DB.prepare('UPDATE users SET owner_character_id=NULL WHERE owner_character_id=?').bind(id),
         env.DB.prepare('DELETE FROM characters WHERE id=?').bind(id)
        ]);"""
    if delete_old not in text:
        # Match earlier patch without depending on spaces/indentation.
        anchor="env.DB.prepare('DELETE FROM characters WHERE id=?').bind(id)"
        text=only(text,anchor,anchor+",\n         atlasHistoryWrite(env,actor,'delete',id,atlasSnapshot(r),null,r.owner_user_id,null)",'individual delete snapshot')
        anchor="if(method==='DELETE'){"
        text=only(text,anchor,anchor+"\n       await atlasEnsureHistory(env);",'individual delete prepare')
    else:
        text=only(text,delete_old,delete_old.replace("await env.DB.batch([","await atlasEnsureHistory(env);await env.DB.batch([").replace("env.DB.prepare('DELETE FROM characters WHERE id=?').bind(id)","env.DB.prepare('DELETE FROM characters WHERE id=?').bind(id),atlasHistoryWrite(env,actor,'delete',id,atlasSnapshot(r),null,r.owner_user_id,null)"),'single delete')
    # Optimistic lock prevents undo from accidentally overriding concurrent edits.
    update_old="""const result=await env.DB.prepare('UPDATE characters SET data_json=?,revision=revision+1,modified_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=?').bind(JSON.stringify(next),actor.id,id,b.revision).run();"""
    update_new="""if(r.revision!==b.revision)throw err(409,'Character changed elsewhere. Refresh before saving.');
        await atlasEnsureHistory(env);
        const results=await env.DB.batch([
          env.DB.prepare('UPDATE characters SET data_json=?,revision=revision+1,modified_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=?').bind(JSON.stringify(next),actor.id,id,b.revision),
          atlasHistoryWrite(env,actor,'edit',id,original,next,r.owner_user_id,r.owner_user_id)
        ]);
        const result=results[0];"""
    text=only(text,update_old,update_new,'single character update')

    # Resolve extension routes immediately after authentication, before the standard routes.
    auth_anchor="if(!actor)throw err(401,'Session expired');"
    injection=auth_anchor+"\n   const ext=await atlasExtensionRequest({request,env,actor,pathname,method,respond,err,jsonBody,validCharacter,audit});\n   if(ext)return ext;"
    text=only(text,auth_anchor,injection,'authenticated route dispatch')
    text=only(text,"export default {async fetch(request,env){",extension+"\n\nexport default {async fetch(request,env){",'extension injection')
    if 'await atlasEnsureHistory(env)' not in text or "pathname==='/sync/drive/import'" not in text or "pathname==='/history'" not in text:raise ValueError('Critical extension route missing')
    return text.encode('utf-8')

if __name__=='__main__':
    args=argparse.ArgumentParser()
    args.add_argument('input',type=Path)
    args.add_argument('output',type=Path)
    args.add_argument('extension',type=Path)
    a=args.parse_args()
    result=patch(a.input.read_bytes(),a.extension.read_text())
    a.output.write_bytes(result)
    print('Patched production SHA256:',hashlib.sha256(result).hexdigest())
