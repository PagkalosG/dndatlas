-- D&D Atlas 2.0: initial foundation (D&D 5e 2024 only).
-- Non-destructive migration; never imports the legacy D1 automatically.
-- Every public API must enforce campaign permissions and content licensing server-side.

CREATE TABLE rulesets (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  edition TEXT NOT NULL CHECK (edition = '2024'),
  engine_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 120),
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'el')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE auth_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'email')),
  provider_subject TEXT NOT NULL CHECK (length(provider_subject) > 0),
  email TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(provider, provider_subject)
);
CREATE INDEX idx_auth_identities_user ON auth_identities(user_id);

CREATE TABLE auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_auth_sessions_user_expiry ON auth_sessions(user_id, expires_at);

-- Global superadmin is never granted by a public registration endpoint.
CREATE TABLE platform_admins (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
  granted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  granted_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  ruleset_id TEXT NOT NULL REFERENCES rulesets(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 160),
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'suspended')),
  visibility TEXT NOT NULL DEFAULT 'invite_only' CHECK (visibility = 'invite_only'),
  settings_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(settings_json)),
  settings_revision INTEGER NOT NULL DEFAULT 1 CHECK (settings_revision >= 1),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_campaigns_creator ON campaigns(created_by, status);

CREATE TABLE campaign_members (
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('dm', 'co_dm', 'player')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed', 'banned')),
  joined_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  approved_at TEXT,
  PRIMARY KEY (campaign_id, user_id)
);
CREATE INDEX idx_campaign_members_user ON campaign_members(user_id, status);

CREATE TABLE campaign_invitations (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  token_hash TEXT NOT NULL UNIQUE,
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (max_uses IS NULL OR used_count <= max_uses)
);
CREATE INDEX idx_campaign_invitations_campaign ON campaign_invitations(campaign_id, revoked_at);

CREATE TABLE parties (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(id, campaign_id)
);
CREATE INDEX idx_parties_campaign ON parties(campaign_id);

-- Content catalog: schema supports proprietary sources but never assumes redistribution rights.
CREATE TABLE content_sources (
  id TEXT PRIMARY KEY,
  ruleset_id TEXT NOT NULL REFERENCES rulesets(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  source_version TEXT NOT NULL,
  source_url TEXT,
  license_code TEXT NOT NULL CHECK (license_code IN ('CC_BY_4_0', 'PROPRIETARY', 'PRIVATE_USER', 'CUSTOM_LICENSE')),
  redistributable INTEGER NOT NULL DEFAULT 0 CHECK (redistributable IN (0, 1)),
  scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'campaign', 'user')),
  owner_user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK ((scope = 'global' AND owner_user_id IS NULL AND campaign_id IS NULL)
      OR (scope = 'campaign' AND campaign_id IS NOT NULL)
      OR (scope = 'user' AND owner_user_id IS NOT NULL AND campaign_id IS NULL)),
  UNIQUE(id, ruleset_id)
);
CREATE INDEX idx_content_sources_license ON content_sources(license_code, scope);

CREATE TABLE content_entries (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES content_sources(id) ON DELETE RESTRICT,
  entry_key TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN (
    'class', 'subclass', 'species', 'background', 'feat', 'spell', 'item',
    'feature', 'skill', 'tool', 'condition', 'monster', 'rule', 'option'
  )),
  visibility TEXT NOT NULL DEFAULT 'restricted' CHECK (visibility IN ('public', 'restricted', 'private')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'deprecated')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(source_id, entry_key)
);
CREATE INDEX idx_content_entries_kind ON content_entries(kind, status);

CREATE TABLE content_entry_versions (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES content_entries(id) ON DELETE RESTRICT,
  version_label TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version >= 1),
  mechanics_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(mechanics_json)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'deprecated')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(entry_id, version_label),
  UNIQUE(id, entry_id)
);
CREATE INDEX idx_content_versions_entry ON content_entry_versions(entry_id, status);

CREATE TABLE content_translations (
  version_id TEXT NOT NULL REFERENCES content_entry_versions(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'el')),
  display_name TEXT NOT NULL,
  summary TEXT,
  text_license TEXT NOT NULL DEFAULT 'NONE' CHECK (text_license IN ('NONE', 'CC_BY_4_0', 'LICENSED', 'USER_SUPPLIED')),
  PRIMARY KEY (version_id, locale)
);

CREATE TABLE content_prerequisites (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL REFERENCES content_entry_versions(id) ON DELETE CASCADE,
  predicate_json TEXT NOT NULL CHECK (json_valid(predicate_json)),
  description_key TEXT
);
CREATE INDEX idx_content_prerequisites_version ON content_prerequisites(version_id);

CREATE TABLE content_choices (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL REFERENCES content_entry_versions(id) ON DELETE CASCADE,
  choice_key TEXT NOT NULL,
  min_choices INTEGER NOT NULL DEFAULT 1 CHECK (min_choices >= 0),
  max_choices INTEGER NOT NULL DEFAULT 1 CHECK (max_choices >= min_choices),
  filter_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(filter_json)),
  UNIQUE(version_id, choice_key)
);

CREATE TABLE content_effects (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL REFERENCES content_entry_versions(id) ON DELETE CASCADE,
  effect_type TEXT NOT NULL,
  parameters_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(parameters_json)),
  predicate_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(predicate_json)),
  priority INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_content_effects_version ON content_effects(version_id, priority);

CREATE TABLE content_relationships (
  id TEXT PRIMARY KEY,
  from_entry_id TEXT NOT NULL REFERENCES content_entries(id) ON DELETE CASCADE,
  to_entry_id TEXT NOT NULL REFERENCES content_entries(id) ON DELETE RESTRICT,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'subclass_of', 'spell_list', 'grants', 'replaces', 'related', 'requires'
  )),
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  UNIQUE(from_entry_id, to_entry_id, relationship_type)
);
CREATE INDEX idx_content_relations_to ON content_relationships(to_entry_id, relationship_type);

CREATE TABLE campaign_allowed_sources (
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES content_sources(id) ON DELETE RESTRICT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (campaign_id, source_id)
);

CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 160),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending', 'approved', 'retired', 'deceased', 'archived'
  )),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  character_level INTEGER NOT NULL DEFAULT 1 CHECK (character_level BETWEEN 1 AND 20),
  state_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(state_json)),
  story_public INTEGER NOT NULL DEFAULT 0 CHECK (story_public IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (campaign_id, owner_user_id) REFERENCES campaign_members(campaign_id, user_id) ON DELETE RESTRICT,
  UNIQUE(id, campaign_id)
);
CREATE INDEX idx_characters_campaign_status ON characters(campaign_id, status);
CREATE INDEX idx_characters_owner ON characters(owner_user_id, status);

CREATE TABLE party_roster (
  party_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (party_id, character_id),
  FOREIGN KEY (party_id, campaign_id) REFERENCES parties(id, campaign_id) ON DELETE CASCADE,
  FOREIGN KEY (character_id, campaign_id) REFERENCES characters(id, campaign_id) ON DELETE CASCADE
);
CREATE INDEX idx_party_roster_character ON party_roster(character_id, status);

CREATE TABLE character_classes (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  class_entry_id TEXT NOT NULL REFERENCES content_entries(id) ON DELETE RESTRICT,
  subclass_entry_id TEXT REFERENCES content_entries(id) ON DELETE RESTRICT,
  class_level INTEGER NOT NULL CHECK (class_level BETWEEN 1 AND 20),
  class_order INTEGER NOT NULL CHECK (class_order >= 1),
  UNIQUE(character_id, class_order),
  UNIQUE(character_id, class_entry_id)
);
CREATE INDEX idx_character_classes_character ON character_classes(character_id);

CREATE TABLE character_selections (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  selected_entry_id TEXT NOT NULL REFERENCES content_entries(id) ON DELETE RESTRICT,
  granted_by_entry_id TEXT REFERENCES content_entries(id) ON DELETE RESTRICT,
  choice_id TEXT REFERENCES content_choices(id) ON DELETE RESTRICT,
  selected_at_level INTEGER CHECK (selected_at_level BETWEEN 1 AND 20),
  selection_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(selection_json)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_character_selections_char ON character_selections(character_id);

CREATE TABLE character_resources (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  resource_key TEXT NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  max_value INTEGER NOT NULL DEFAULT 0 CHECK (max_value >= 0),
  source_entry_id TEXT REFERENCES content_entries(id) ON DELETE RESTRICT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (current_value <= max_value),
  UNIQUE(character_id, resource_key)
);

CREATE TABLE character_inventory (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  item_entry_id TEXT REFERENCES content_entries(id) ON DELETE RESTRICT,
  custom_item_json TEXT CHECK (custom_item_json IS NULL OR json_valid(custom_item_json)),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  item_state TEXT NOT NULL DEFAULT 'normal' CHECK (item_state IN ('normal', 'lost', 'destroyed', 'poisoned')),
  equipped INTEGER NOT NULL DEFAULT 0 CHECK (equipped IN (0, 1)),
  attuned INTEGER NOT NULL DEFAULT 0 CHECK (attuned IN (0, 1)),
  instance_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(instance_json)),
  CHECK ((item_entry_id IS NOT NULL) <> (custom_item_json IS NOT NULL))
);
CREATE INDEX idx_character_inventory_char ON character_inventory(character_id);

-- Sensitive notes are NEVER included in party fetches or realtime events by default.
CREATE TABLE character_private_content (
  character_id TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  background_story TEXT NOT NULL DEFAULT '',
  private_notes TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE character_revisions (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  change_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(change_json)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(character_id, revision)
);
CREATE INDEX idx_character_revisions_char ON character_revisions(character_id, revision DESC);

CREATE TABLE character_approval_requests (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  requested_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewer_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  submitted_revision INTEGER NOT NULL CHECK (submitted_revision >= 1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'changes_requested', 'rejected', 'cancelled'
  )),
  reviewer_comment TEXT,
  submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  reviewed_at TEXT,
  FOREIGN KEY (character_id, campaign_id) REFERENCES characters(id, campaign_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX idx_approval_one_pending_per_character
  ON character_approval_requests(character_id) WHERE status = 'pending';
CREATE INDEX idx_approval_campaign_status ON character_approval_requests(campaign_id, status);

CREATE TABLE game_sessions (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL CHECK (session_number >= 1),
  title TEXT NOT NULL DEFAULT '',
  starts_at TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(campaign_id, session_number)
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  subject_id TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(payload_json)),
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at, created_at DESC);

-- Outbox allows reliable fan-out after the D1 transaction commits.
CREATE TABLE realtime_outbox (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  subject_revision INTEGER,
  payload_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(payload_json)),
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_realtime_outbox_pending ON realtime_outbox(published_at, created_at);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_audit_campaign_created ON audit_log(campaign_id, created_at DESC);

INSERT INTO rulesets(id, display_name, edition, engine_version)
VALUES ('dnd5e-2024', 'Dungeons & Dragons 5e (2024)', '2024', '2.0.0');
