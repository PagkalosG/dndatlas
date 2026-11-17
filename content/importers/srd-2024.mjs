// D&D Atlas 2.0 — controlled SRD 2024 importer.
// Imports unreviewed content as DRAFT. Never imports 2014 content or artwork.
import { createHash } from 'node:crypto';

export const API_BASE = 'https://www.dnd5eapi.co/api/2024';
export const SOURCE_ID = 'srd-5-2-2024-api';
export const COLLECTIONS = Object.freeze({
  classes: { kind: 'class', count: 12 },
  species: { kind: 'species', count: 9 },
  backgrounds: { kind: 'background', count: 4 },
  feats: { kind: 'feat', count: 17 },
  subclasses: { kind: 'subclass', count: 12 },
});

const KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const quote = (value) => "'" + String(value).replaceAll("'", "''") + "'";
const digest = (text) => createHash('sha256').update(text).digest('hex');

const sqlInsert = (table, values) => {
  const cols = Object.keys(values);
  return `INSERT OR IGNORE INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((c) => quote(values[c])).join(', ')});`;
};

const ensure2024 = (url) => {
  const target = new URL(url, API_BASE);
  const base = new URL(API_BASE);
  if (target.origin !== base.origin || !target.pathname.startsWith('/api/2024/') || target.search) {
    throw new Error(`Only 2024 API URLs are accepted: ${url}`);
  }
  return target.toString();
};

export const normalizeResource = (group, listItem, detail) => {
  const definition = COLLECTIONS[group];
  if (!definition) throw new Error(`Unsupported collection: ${group}`);
  if (!listItem || !KEY_PATTERN.test(listItem.index || '')) throw new Error('Invalid resource slug');
  const slug = listItem.index;
  if (listItem.url !== `/api/2024/${group}/${slug}`) throw new Error('Unexpected 2024 resource URL');
  if (!detail || detail.index !== slug || typeof detail.name !== 'string' || !detail.name.trim()) {
    throw new Error(`Invalid resource details: ${group}/${slug}`);
  }
  if (detail.url && detail.url !== listItem.url) throw new Error('Detail endpoint mismatch');
  const serialized = JSON.stringify(detail);
  const versionTag = digest(serialized).slice(0, 16);
  const entryId = `${SOURCE_ID}:${definition.kind}:${slug}`;
  const versionId = `${entryId}:${versionTag}`;
  const text = Array.isArray(detail.desc) ? detail.desc.find((v) => typeof v === 'string') : detail.desc;
  return {
    group, slug, kind: definition.kind, entryId, versionId,
    versionTag, name: detail.name,
    summary: typeof text === 'string' ? text.slice(0, 400) : '',
    mechanics: JSON.stringify({ origin: 'srd-2024-api', validated: false, raw: detail }),
  };
};

export function serializeCollection(group, resources) {
  if (!COLLECTIONS[group]) throw new Error('Unsupported collection: ' + group);
  const lines = [
    '-- Generated from dnd5eapi /api/2024. DRAFT ONLY; human/rules validation required.',
    'PRAGMA foreign_keys = ON;',
    sqlInsert('content_sources', {
      id: SOURCE_ID,
      ruleset_id: 'dnd5e-2024',
      title: 'D&D 2024 System Reference Document (API snapshot)',
      publisher: 'Wizards of the Coast LLC (via 5e-bits API)',
      source_version: 'SRD-5.2-2024',
      source_url: 'https://www.dnd5eapi.co/api/2024',
      license_code: 'CC_BY_4_0',
      redistributable: 0,
      scope: 'global',
    }),
  ];
  for (const r of [...resources].sort((a, b) => a.slug.localeCompare(b.slug))) {
    lines.push(sqlInsert('content_entries', {
      id: r.entryId, source_id: SOURCE_ID, entry_key: `${r.kind}:${r.slug}`,
      kind: r.kind, visibility: 'restricted', status: 'draft',
    }));
    lines.push(sqlInsert('content_entry_versions', {
      id: r.versionId, entry_id: r.entryId,
      version_label: `api-sha256-${r.versionTag}`,
      schema_version: 1, mechanics_json: r.mechanics, status: 'draft',
    }));
    lines.push(sqlInsert('content_translations', {
      version_id: r.versionId, locale: 'en', display_name: r.name,
      summary: r.summary, text_license: 'CC_BY_4_0',
    }));
  }
  return lines.join('\n') + '\n';
}

async function requestJson(fetchImpl, target) {
  const res = await fetchImpl(ensure2024(target), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Source API returned HTTP ${res.status} on ${target}`);
  return res.json();
}

export async function import2024({ fetchImpl = fetch, collections = Object.keys(COLLECTIONS), onProgress = () => {} } = {}) {
  const manifest = { source: API_BASE, collections: {}, total: 0, isValidatedRulesContent: false };
  const files = {};
  const rootResponse = await fetchImpl(API_BASE, { headers: { Accept: 'application/json' } });
  if (!rootResponse.ok) throw new Error('Could not read 2024 resource index');
  const root = await rootResponse.json();
  const index = root.index || root;
  for (const group of collections) {
    const definition = COLLECTIONS[group];
    if (!definition) throw new Error(`Unknown collection: ${group}`);
    const listUrl = index[group];
    if (typeof listUrl !== 'string') throw new Error(`Missing expected 2024 resource: ${group}`);
    const list = await requestJson(fetchImpl, listUrl);
    const rows = list.results;
    if (!Array.isArray(rows) || rows.length !== definition.count) {
      throw new Error(`2024 ${group} count changed: expected ${definition.count}, received ${rows?.length}`);
    }
    const seen = new Set();
    const resources = [];
    for (const item of rows) {
      if (seen.has(item.index)) throw new Error(`Duplicate slug: ${group}/${item.index}`);
      seen.add(item.index);
      const details = await requestJson(fetchImpl, item.url);
      resources.push(normalizeResource(group, item, details));
    }
    files[`${group}.sql`] = serializeCollection(group, resources);
    manifest.collections[group] = { count: resources.length, sha256: digest(files[`${group}.sql`]) };
    manifest.total += resources.length;
    onProgress(group, resources.length);
  }
  return { files, manifest };
}
