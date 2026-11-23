#!/usr/bin/env python3
"""Safely patch only the deployed D&D Atlas production Worker delete route.

Accepts the raw source fetched from Cloudflare on GitHub Actions. Never uses an
old copy of the Worker. Production SHA lock prevents unexpected replacements.
"""
import argparse
import hashlib
import re
from pathlib import Path

BASELINE_SHA256 = 'e436302f597c5f30c595f7ff245a1e1ff2fdf39b37419064a3148f320dde6f8d'

def extract_module_bytes(download: bytes) -> bytes:
    """Cloudflare module downloads are multipart, with random boundary per GET."""
    if not download.startswith(b'--'):
        return download
    from email import policy
    from email.parser import BytesParser
    boundary = download.splitlines()[0][2:].strip()
    if not boundary or len(boundary) > 200:
        raise ValueError('Invalid multipart response boundary')
    header = b'MIME-Version: 1.0\r\nContent-Type: multipart/form-data; boundary="' + boundary + b'"\r\n\r\n'
    msg = BytesParser(policy=policy.default).parsebytes(header + download)
    candidates = []
    for part in msg.iter_parts():
        content = part.get_payload(decode=True) or b''
        if b'export default' in content and b'const characterRoute=pathname.match(' in content:
            candidates.append(content)
    if len(candidates) != 1:
        raise ValueError(f'Expected exactly one main Worker module, found {len(candidates)}')
    return candidates[0]


ROSTER_ROUTES = """
  // Manual roster replacement. Creator only; existing ownership is retained.
  if(pathname==='/characters/replace'&&method==='POST'){
    if(actor.role!=='creator')throw err(403,'Creator only');
    const b=await jsonBody(request);
    const roster=b.characters;
    if(!Array.isArray(roster)||roster.length>25||roster.some(c=>!validCharacter(c))||new Set(roster.map(c=>c.id)).size!==roster.length)throw err(400,'Invalid character or duplicate ID');
    const before=(await env.DB.prepare('SELECT id,owner_user_id,data_json FROM characters').all()).results;
    const previous=new Map(before.map(x=>[x.id,x]));
    const statements=[env.DB.prepare('UPDATE users SET owner_character_id=NULL WHERE owner_character_id IS NOT NULL'),env.DB.prepare('DELETE FROM characters')];
    for(const item of roster){
      const character=structuredClone(item);
      delete character._ownerId;
      const old=previous.get(character.id);
      if(old&&old.owner_user_id!==null){
        const oldChar=JSON.parse(old.data_json);
        // Protect another player's private story during a Creator replacement.
        if(oldChar.storyPublic!==true){
          character.backgroundStory=oldChar.backgroundStory;
          character.story=oldChar.story;
          character.storyPublic=false;
        }
      }
      statements.push(env.DB.prepare('INSERT INTO characters(id,owner_user_id,data_json,modified_by) VALUES(?,?,?,?)').bind(character.id,old?.owner_user_id??null,JSON.stringify(character),actor.id));
      if(old?.owner_user_id!==null&&old?.owner_user_id!==undefined)statements.push(env.DB.prepare('UPDATE users SET owner_character_id=? WHERE id=?').bind(character.id,old.owner_user_id));
    }
    await env.DB.batch(statements);
    await audit(env,actor.id,'replace-party',roster.length);
    return respond({ok:true,count:roster.length});
  }

  // Explicit bulk delete, Creator/DM only; not triggered by page reload or sync.
  if(pathname==='/characters/bulk-delete'&&method==='POST'){
    if(!['creator','dm'].includes(actor.role))throw err(403,'Creator/DM only');
    const b=await jsonBody(request),ids=b.ids;
    if(!Array.isArray(ids)||ids.length<1||ids.length>25||ids.some(id=>typeof id!=='string'||!/^[\w-]{1,80}$/.test(id))||new Set(ids).size!==ids.length)throw err(400,'Invalid character IDs');
    const slots=ids.map(()=>'?').join(',');
    const results=await env.DB.batch([
      env.DB.prepare('UPDATE users SET owner_character_id=NULL WHERE owner_character_id IN ('+slots+')').bind(...ids),
      env.DB.prepare('DELETE FROM characters WHERE id IN ('+slots+')').bind(...ids)
    ]);
    await audit(env,actor.id,'bulk-delete-characters',ids.join(','));
    return respond({ok:true,deleted:results[1]?.meta?.changes??0});
  }

"""

def patch(raw):
    original=extract_module_bytes(raw)
    digest=hashlib.sha256(original).hexdigest()
    print('Production JavaScript SHA256:',digest)
    if digest!=BASELINE_SHA256:
        raise ValueError('Production source changed. Aborting without deployment.')
    text=original.decode('utf-8-sig')
    anchor='const characterRoute=pathname.match('
    if text.count(anchor)!=1 or '/characters/replace' in text or '/characters/bulk-delete' in text:
        raise ValueError('Unexpected character endpoint structure.')
    text=text.replace(anchor,ROSTER_ROUTES+anchor,1)
    if "pathname==='/characters/bulk-delete'" not in text:
        raise ValueError('Missing bulk-delete route')
    return text.encode('utf-8')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('input', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    changed=patch(args.input.read_bytes())
    args.output.write_bytes(changed)
    print('Patched JavaScript SHA256:',hashlib.sha256(changed).hexdigest())
