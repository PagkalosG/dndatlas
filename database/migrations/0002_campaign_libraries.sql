-- D&D Atlas 2.0 - campaign-scoped DM content libraries.
-- Every version is a new immutable content source; no changes to SRD entries.
-- Importing is only permitted through authenticated Worker endpoints (not implemented here).

CREATE TABLE campaign_library_packs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL UNIQUE REFERENCES content_sources(id) ON DELETE RESTRICT,
  pack_key TEXT NOT NULL CHECK (length(pack_key) BETWEEN 2 AND 64),
  pack_version TEXT NOT NULL CHECK (length(pack_version) BETWEEN 5 AND 40),
  uploaded_by TEXT NOT NULL,
  sha256 TEXT NOT NULL CHECK (length(sha256) = 64),
  manifest_json TEXT NOT NULL CHECK (json_valid(manifest_json)),
  rights_attested INTEGER NOT NULL DEFAULT 0 CHECK (rights_attested IN (0, 1)),
  state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'validated', 'active', 'disabled', 'rejected')),
  error_summary TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  activated_at TEXT,
  FOREIGN KEY (campaign_id, uploaded_by) REFERENCES campaign_members(campaign_id, user_id) ON DELETE RESTRICT,
  UNIQUE(campaign_id, pack_key, pack_version)
);
CREATE UNIQUE INDEX idx_library_one_active_version
  ON campaign_library_packs(campaign_id, pack_key) WHERE state = 'active';
CREATE INDEX idx_library_packs_campaign ON campaign_library_packs(campaign_id, state);

CREATE TRIGGER trg_library_pack_campaign_scope_insert
BEFORE INSERT ON campaign_library_packs
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM content_sources s
    WHERE s.id = NEW.source_id AND s.scope = 'campaign' AND s.campaign_id = NEW.campaign_id
  ) THEN RAISE(ABORT, 'Library source must belong to campaign') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM campaign_members m
    WHERE m.campaign_id = NEW.campaign_id AND m.user_id = NEW.uploaded_by
      AND m.status = 'active' AND m.role = 'dm'
  ) THEN RAISE(ABORT, 'Only an active campaign DM can upload libraries') END;
END;

-- Pack identity and content immutability; changes require a new version.
CREATE TRIGGER trg_library_pack_no_rewrite
BEFORE UPDATE OF campaign_id, source_id, pack_key, pack_version, uploaded_by, sha256, manifest_json
ON campaign_library_packs
BEGIN
  SELECT RAISE(ABORT, 'Published pack metadata is immutable; upload a new version');
END;

CREATE TRIGGER trg_allowed_source_campaign_insert
BEFORE INSERT ON campaign_allowed_sources
WHEN EXISTS (
 SELECT 1 FROM content_sources s
 WHERE s.id = NEW.source_id AND s.scope = 'campaign' AND s.campaign_id <> NEW.campaign_id
)
BEGIN
  SELECT RAISE(ABORT, 'Cannot use a library from another campaign');
END;

CREATE TRIGGER trg_allowed_source_campaign_update
BEFORE UPDATE OF campaign_id, source_id ON campaign_allowed_sources
WHEN EXISTS (
 SELECT 1 FROM content_sources s
 WHERE s.id = NEW.source_id AND s.scope = 'campaign' AND s.campaign_id <> NEW.campaign_id
)
BEGIN
  SELECT RAISE(ABORT, 'Cannot use a library from another campaign');
END;

CREATE TABLE campaign_library_dependencies (
  pack_id TEXT NOT NULL REFERENCES campaign_library_packs(id) ON DELETE CASCADE,
  required_source_id TEXT NOT NULL REFERENCES content_sources(id) ON DELETE RESTRICT,
  required_version TEXT,
  PRIMARY KEY (pack_id, required_source_id)
);

-- Asset files are uploaded separately, authenticated, scanned and stored by the media Worker.
-- No raw URLs, inline base64 or third-party hotlinking in pack data.
CREATE TABLE campaign_library_assets (
  pack_id TEXT NOT NULL REFERENCES campaign_library_packs(id) ON DELETE CASCADE,
  asset_key TEXT NOT NULL,
  media_reference TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image/png','image/jpeg','image/webp','image/svg+xml')),
  attribution TEXT NOT NULL DEFAULT '',
  rights_attested INTEGER NOT NULL DEFAULT 0 CHECK (rights_attested IN (0, 1)),
  PRIMARY KEY (pack_id, asset_key)
);

CREATE TABLE campaign_library_import_jobs (
  id TEXT PRIMARY KEY,
  pack_id TEXT NOT NULL REFERENCES campaign_library_packs(id) ON DELETE CASCADE,
  started_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','processing','validated','failed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  safe_error TEXT,
  started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  finished_at TEXT
);
CREATE INDEX idx_library_import_jobs_pack ON campaign_library_import_jobs(pack_id, started_at DESC);
