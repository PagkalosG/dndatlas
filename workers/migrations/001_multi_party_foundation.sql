-- D&D Atlas | Staging migration 001 | Multi-party foundation
-- D&D 5e 2024. Additive only: does not alter existing tables or user data.
-- Run against dndatlas-staging, NOT the production D1 database.
-- GitHub commit alone does not execute this migration.
-- No invite or membership endpoint may be enabled before server-side
-- party scoping is enforced for characters, sessions, images, and users.

CREATE TABLE IF NOT EXISTS atlas_parties (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 100),
  description TEXT NOT NULL DEFAULT '',
  owner_user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_atlas_parties_owner
ON atlas_parties(owner_user_id);

CREATE TABLE IF NOT EXISTS atlas_party_members (
  party_id TEXT NOT NULL REFERENCES atlas_parties(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('dm', 'player')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_by_user_id INTEGER REFERENCES users(id),
  approved_at TEXT,
  PRIMARY KEY (party_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_atlas_party_members_user
ON atlas_party_members(user_id, status);

CREATE TABLE IF NOT EXISTS atlas_party_invites (
  id TEXT PRIMARY KEY NOT NULL,
  party_id TEXT NOT NULL REFERENCES atlas_parties(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_by_user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at INTEGER NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  uses_count INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_atlas_party_invites_party
ON atlas_party_invites(party_id);

CREATE TABLE IF NOT EXISTS atlas_party_character_requests (
  id TEXT PRIMARY KEY NOT NULL,
  party_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  character_id TEXT NOT NULL REFERENCES characters(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by_user_id INTEGER REFERENCES users(id),
  reviewed_at TEXT,
  review_note TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (party_id, user_id)
    REFERENCES atlas_party_members(party_id, user_id) ON DELETE CASCADE
);

-- At most one pending/approved character per player per party.
CREATE UNIQUE INDEX IF NOT EXISTS idx_atlas_party_character_active
ON atlas_party_character_requests(party_id, user_id)
WHERE status IN ('pending', 'approved');

CREATE INDEX IF NOT EXISTS idx_atlas_party_character_party_status
ON atlas_party_character_requests(party_id, status);
