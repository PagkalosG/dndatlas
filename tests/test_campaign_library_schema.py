"""D1 migration 0002 contract checks against the unchanged 0001 schema."""
from pathlib import Path
import sqlite3
import unittest

BASE = Path(__file__).resolve().parents[1]
FOUNDATION = BASE / 'database/migrations/0001_atlas_v2_foundation.sql'
PACKS = BASE / 'database/migrations/0002_campaign_libraries.sql'


class CampaignLibrariesMigrationTest(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.execute('PRAGMA foreign_keys = ON')
        self.db.executescript(FOUNDATION.read_text(encoding='utf-8'))
        self.db.executescript(PACKS.read_text(encoding='utf-8'))
        self.db.execute("INSERT INTO users(id,display_name) VALUES ('dm','Dungeon Master'),('player','Player')")
        self.db.execute("INSERT INTO campaigns(id,created_by,ruleset_id,name) VALUES ('c1','dm','dnd5e-2024','One'),('c2','dm','dnd5e-2024','Two')")
        self.db.execute("INSERT INTO campaign_members(campaign_id,user_id,role,status) VALUES ('c1','dm','dm','active'),('c2','dm','dm','active'),('c1','player','player','active')")
        for camp, sid in [('c1','pack-c1'),('c2','pack-c2')]:
            self.db.execute("INSERT INTO content_sources(id,ruleset_id,title,publisher,source_version,license_code,scope,campaign_id) VALUES (?,'dnd5e-2024','Homebrew','DM','1.0.0','PRIVATE_USER','campaign',?)",(sid,camp))

    def tearDown(self):
        self.db.close()

    def pack(self, id, campaign, source, uploader='dm', key='starward', ver='1.0.0'):
        self.db.execute("INSERT INTO campaign_library_packs(id,campaign_id,source_id,pack_key,pack_version,uploaded_by,sha256,manifest_json,rights_attested,state) VALUES (?,?,?,?,?,?,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','{}',1,'active')", (id,campaign,source,key,ver,uploader))

    def test_migrations_are_integral(self):
        self.assertEqual(self.db.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
        self.assertEqual(self.db.execute('PRAGMA foreign_key_check').fetchall(), [])

    def test_dm_only_upload_and_campaign_scope(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.pack('x','c1','pack-c1',uploader='player')
        with self.assertRaises(sqlite3.IntegrityError):
            self.pack('x','c2','pack-c1')
        self.pack('p1','c1','pack-c1')

    def test_cross_campaign_library_enable_blocked(self):
        self.pack('p1','c1','pack-c1')
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO campaign_allowed_sources(campaign_id,source_id) VALUES ('c2','pack-c1')")
        self.db.execute("INSERT INTO campaign_allowed_sources(campaign_id,source_id) VALUES ('c1','pack-c1')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("UPDATE campaign_allowed_sources SET campaign_id='c2' WHERE campaign_id='c1' AND source_id='pack-c1'")

    def test_pack_versions_immutable_one_active(self):
        self.pack('p1','c1','pack-c1')
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("UPDATE campaign_library_packs SET pack_version='9.9.9' WHERE id='p1'")
        self.db.execute("INSERT INTO content_sources(id,ruleset_id,title,publisher,source_version,license_code,scope,campaign_id) VALUES ('pack-c1-v2','dnd5e-2024','Homebrew','DM','2.0.0','PRIVATE_USER','campaign','c1')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.pack('p2','c1','pack-c1-v2',ver='2.0.0')
        self.db.execute("UPDATE campaign_library_packs SET state='disabled' WHERE id='p1'")
        self.pack('p2','c1','pack-c1-v2',ver='2.0.0')


if __name__ == '__main__':
    unittest.main()
