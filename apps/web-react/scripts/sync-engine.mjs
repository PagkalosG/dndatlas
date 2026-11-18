/** Copies the CURRENT Atlas v2 2024 rules/data modules; never forks the engine. */
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const engineRoot = path.resolve(root, '../web-v2');
const files = [
  'catalog/srd-2024.js',
  'components/builder-2024.js',
  'components/builder-insights.js',
  'components/origin-choices-2024.js',
  'components/ability-allocation.js',
];
for (const file of files) {
  const source = path.join(engineRoot, file);
  const content = await readFile(source, 'utf8');
  if (file === 'catalog/srd-2024.js' && (!content.includes("'2024'") && !content.includes('"2024"'))) {
    throw new Error('Refusing to bundle a non-2024 content catalog');
  }
  const target = path.join(root, 'public/engine', file);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
}
console.log(`Atlas engine synchronized from ${engineRoot} (${files.length} exact files).`);
