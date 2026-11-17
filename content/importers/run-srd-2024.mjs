#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { import2024, COLLECTIONS } from './srd-2024.mjs';

const target = process.argv[2];
if (!target || process.argv.length !== 3) {
  console.error('Usage: node content/importers/run-srd-2024.mjs <output-dir>');
  process.exitCode = 2;
} else {
  const out = path.resolve(target);
  const { files, manifest } = await import2024({
    onProgress: (group, count) => console.log(`Verified 2024 ${group}: ${count}`),
  });
  await mkdir(out, { recursive: true });
  for (const [name, data] of Object.entries(files)) {
    if (!Object.hasOwn(COLLECTIONS, name.slice(0, -4))) throw new Error('Unexpected generated file');
    await writeFile(path.join(out, name), data, 'utf8');
  }
  await writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Draft import generated: ${manifest.total} 2024 entries.`);
}
