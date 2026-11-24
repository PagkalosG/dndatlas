#!/usr/bin/env python3
"""Add one authenticated route to the exact reviewed production module.
Idempotent: remove the exact addition and verify the original SHA on subsequent deploys.
No bindings or existing routes are changed.
"""
import hashlib
from pathlib import Path
from importlib.machinery import SourceFileLoader
import sys
BASE='546753c94bad98bca9f0998053b6439cbab1ad4ce11252994d45b5f366830980'
ANCHOR='async function atlasExtensionRequest({request,env,actor,pathname,method,respond,err,jsonBody,validCharacter,audit}) {'
HOOK='\n if(pathname===\'/encounter\')return atlasEncounterRequest({request,env,actor,pathname,method,respond,err,jsonBody,audit});'
def patch(raw,extension):
    parser=SourceFileLoader('phase1',str(Path(__file__).with_name('patch-v342-phase1.py'))).load_module()
    original=parser.extract(raw)
    source=original.decode('utf-8')
    extra=extension.rstrip()+'\n\n'
    if source.count(ANCHOR)!=1:raise ValueError('Missing unique extension anchor')
    if hashlib.sha256(original).hexdigest()==BASE:
        return source.replace(ANCHOR,extra+ANCHOR+HOOK).encode('utf-8')
    legacy=Path(__file__).with_name('encounter-extension-v3100.js').read_text().rstrip()+'\n\n'
    if source.count(ANCHOR+HOOK)!=1:raise ValueError('Unknown production module')
    legacy2=Path(__file__).with_name('encounter-extension-v3101.js').read_text().rstrip()+'\n\n'
    legacy3=Path(__file__).with_name('encounter-extension-v3110.js').read_text().rstrip()+'\n\n'
    for known in (extra,legacy,legacy2,legacy3):
        if source.count(known)!=1:continue
        restored=source.replace(known,'',1).replace(ANCHOR+HOOK,ANCHOR,1).encode('utf-8')
        if hashlib.sha256(restored).hexdigest()!=BASE:raise ValueError('Production base differs from reviewed hash')
        return source.replace(known,extra,1).encode('utf-8')
    raise ValueError('Unknown production extension')
if __name__=='__main__':
    raw,extension,out=map(Path,sys.argv[1:])
    out.write_bytes(patch(raw.read_bytes(),extension.read_text()))
