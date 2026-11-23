#!/usr/bin/env python3
"""One-time SHA-locked deployment of privacy-safe Activity History and atomic party Undo.

Reads live Cloudflare Worker, verifies exact module hash AND the existing
extension source against the previous GitHub commit, then replaces ONLY
that extension. No D1 writes or changes to Worker bindings.
"""
import hashlib
import sys
from pathlib import Path
from email import policy
from email.parser import BytesParser

CURRENT_SHA = '20bd990902fc734f33ca6851d446e67c516271fd1616bbf786638eaaba5c6b0f'
START='const atlasHistorySchema = '
END='export default {async fetch(request,env){'

def extract(data):
    if not data.startswith(b'--'): return data
    boundary=data.splitlines()[0][2:].strip()
    if not boundary or len(boundary)>200:raise ValueError('Invalid Cloudflare multipart boundary')
    envelope=b'MIME-Version: 1.0\r\nContent-Type: multipart/form-data; boundary="'+boundary+b'"\r\n\r\n'
    parsed=BytesParser(policy=policy.default).parsebytes(envelope+data)
    found=[p.get_payload(decode=True) or b'' for p in parsed.iter_parts()]
    candidates=[b for b in found if b'export default' in b and START.encode() in b]
    if len(candidates)!=1:raise ValueError('Expected exactly one Atlas Worker module')
    return candidates[0]

def patch(raw,previous,updated):
    original=extract(raw)
    sha=hashlib.sha256(original).hexdigest()
    print('Live Worker SHA256:',sha)
    if sha!=CURRENT_SHA:raise ValueError('Production source changed; refusing deploy')
    source=original.decode('utf-8-sig')
    if source.count(START)!=1 or source.count(END)!=1:raise ValueError('Expected unique extension anchors')
    begin=source.index(START)
    finish=source.index(END,begin)
    old_region=source[begin:finish]
    if previous.count(START)!=1:raise ValueError('Previous extension must contain one history anchor')
    previous_region=previous[previous.index(START):]
    if old_region.strip()!=previous_region.strip():raise ValueError('Existing production extension differs from backed-up historical source')
    result=source[:begin]+updated.rstrip()+'\n\n'+source[finish:]
    if source[:begin]!=result[:begin] or not result.endswith(source[finish:]):raise ValueError('Unexpected patch region')
    if 'atlasHistorySchema' not in result or 'atlasExtensionRequest' not in result:
        raise ValueError('History/Undo handlers missing')
    if 'GOOGLE_CLIENT_ID' in result or 'atlasDriveAccessToken' in result or 'atlasGoogleJSON' in result:
        raise ValueError('Google Drive OAuth/write code still exists')
    if "Direct Google Drive sync disabled" not in result:
        raise ValueError('Drive endpoint blocking missing')
    if "pathname==='/sync/revisions'" not in result:
        raise ValueError('Revision endpoint missing')
    if "pathname==='/history/group/" not in result and "history\\/group\\/" not in result:
        raise ValueError('Group Undo endpoint missing')
    if 'atlasHistorySafeNumbers' not in result:
        raise ValueError('Privacy-safe history display guard missing')
    return result.encode('utf-8')

if __name__=='__main__':
    if len(sys.argv)!=5:raise SystemExit('usage: patch.py live.raw previous.js updated.js patched.mjs')
    live,previous,updated,out=map(Path,sys.argv[1:])
    result=patch(live.read_bytes(),previous.read_text(),updated.read_text())
    out.write_bytes(result)
    print('Updated Worker SHA256:',hashlib.sha256(result).hexdigest())
