#!/usr/bin/env python3
"""Safely patch only the deployed D&D Atlas production Worker delete route.

Accepts the raw source fetched from Cloudflare on GitHub Actions. Never uses an
old copy of the Worker. Production SHA lock prevents unexpected replacements.
"""
import argparse
import hashlib
import re
from pathlib import Path

BASELINE_SHA256 = '36ff8add509937fbf3946aec15ebc2c4edce928d194c0d7e03d6c2660fcaf5b7'

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

def patch(source: bytes) -> bytes:
    source = extract_module_bytes(source)
    digest = hashlib.sha256(source).hexdigest()
    print('Main JavaScript module SHA256:', digest)
    print('Main JavaScript module bytes:', len(source))
    if digest != BASELINE_SHA256:
        raise ValueError(f'Production source hash mismatch: {digest}. Aborting without deployment.')
    text = source.decode('utf-8-sig')
    if 'export default' not in text or 'const characterRoute=pathname.match(' not in text:
        raise ValueError('Expected module Worker or character route not found; refusing to deploy.')

    cors_pattern = re.compile(r"(['\"]Access-Control-Allow-Methods['\"]\s*:\s*['\"])([^'\"]+)(['\"])")
    def add_delete(m):
        methods = [part.strip() for part in m.group(2).split(',')]
        if 'DELETE' not in methods: methods.append('DELETE')
        return m.group(1) + ', '.join(methods) + m.group(3)
    text, header_count = cors_pattern.subn(add_delete, text)
    if header_count != 1:
        raise ValueError(f'Expected one CORS methods header, found {header_count}.')

    section_start = text.find('const characterRoute=pathname.match(')
    if section_start == -1:
        raise ValueError('Character route section missing.')
    section_end = text.find("if(pathname==='/images/tags')", section_start)
    if section_end < 0:
        raise ValueError('Expected next route section missing.')
    prefix, section, suffix = text[:section_start], text[section_start:section_end], text[section_end:]
    if "if(method==='DELETE')" in section:
        raise ValueError('Character DELETE route already exists. Refusing to duplicate it.')
    pattern = re.compile(r"(?m)^(?P<indent>[^\S\r\n]*)if\(method==='PUT'\)\s*\{")
    found = list(pattern.finditer(section))
    if len(found) != 1:
        raise ValueError(f'Expected exactly one character PUT branch, found {len(found)}.')
    indent = found[0].group('indent')
    delete = (
        f"{indent}if(method==='DELETE'){{\n"
        f"{indent} if(!['creator','dm'].includes(actor.role))throw err(403,'Creator/DM only');\n"
        f"{indent} await env.DB.batch([\n"
        f"{indent}  env.DB.prepare('UPDATE users SET owner_character_id=NULL WHERE owner_character_id=?').bind(id),\n"
        f"{indent}  env.DB.prepare('DELETE FROM characters WHERE id=?').bind(id)\n"
        f"{indent} ]);\n"
        f"{indent} await audit(env,actor.id,'delete-character',id);\n"
        f"{indent} return respond({{ok:true}});\n"
        f"{indent}}}\n"
    )
    section = section[:found[0].start()] + delete + section[found[0].start():]
    updated = (prefix + section + suffix).encode('utf-8')
    if len(updated) <= len(source) or updated.count(b"DELETE FROM characters WHERE id=?") != 1:
        raise ValueError('Post-patch content assertion failed.')
    return updated

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('input', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    patched = patch(args.input.read_bytes())
    args.output.write_bytes(patched)
    print('Expected original SHA256:', BASELINE_SHA256)
    print('Patched SHA256:', hashlib.sha256(patched).hexdigest())
    print('Patch scope: CORS DELETE method + permissioned D1 character delete route.')
