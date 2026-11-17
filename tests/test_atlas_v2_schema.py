"""D&D Atlas 2.0 foundation migration: SQLite contract tests (no external deps)."""
from pathlib import Path
import sqlite3
import unittest

SCHEMA = Path(__file__).resolve().parents[1] / 'database/migrations/0001_atlas_v2_foundation.sql'


class SchemaContractTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.execute('PRAGMA foreign_keys = ON')
        self.db.executescript(SCHEMA.read_text(encoding='utf8'))
        self.db.execute("INSERT INTO users(id, display_name) VALUES('u1', 'DM'), ('u2', 'Player')")
        self.db.execute("INSERT INTO campaigns(id, created_by, ruleset_id, name) VALUES('c1','u1','dnd5e-2024','Alpha'),('c2','u1','dnd5e-2024','Beta')")
        self.db.execute("INSERT INTO campaign_members(campaign_id,user_id,role,status) VALUES('c1','u1','dm','active'),('c1','u2','player','active'),('c2','u1','dm','active')")

    def tearDown(self):
        self.db.close()

    def test_integrity_and_2024_seed(self):
        self.assertEqual(self.db.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
        self.assertEqual(self.db.execute('PRAGMA foreign_key_check').fetchall(), [])
        self.assertEqual(self.db.execute('SELECT id FROM rulesets').fetchall(), [('dnd5e-2024',)])
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO rulesets(id,display_name,edition,engine_version) VALUES('old','Legacy','2014','1')")

    def test_google_sub_is_unique_not_email(self):
        self.db.execute("INSERT INTO auth_identities(id,user_id,provider,provider_subject,email) VALUES('a1','u1','google','google-sub-1','some@example.com')")
        self.db.execute("INSERT INTO auth_identities(id,user_id,provider,provider_subject,email) VALUES('a2','u2','google','google-sub-2','some@example.com')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO auth_identities(id,user_id,provider,provider_subject) VALUES('a3','u2','google','google-sub-1')")

    def test_character_must_belong_to_campaign_member(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO characters(id,campaign_id,owner_user_id,name) VALUES('bad','c2','u2','Bad')")
        self.db.execute("INSERT INTO characters(id,campaign_id,owner_user_id,name) VALUES('ch1','c1','u2','Test')")
        self.assertEqual(self.db.execute("SELECT revision FROM characters WHERE id='ch1'").fetchone()[0], 1)

    def test_roster_cannot_mix_campaigns(self):
        self.db.execute("INSERT INTO characters(id,campaign_id,owner_user_id,name) VALUES('ch1','c1','u2','Test')")
        self.db.execute("INSERT INTO parties(id,campaign_id,name) VALUES('p1','c1','Party A'),('p2','c2','Party B')")
        self.db.execute("INSERT INTO party_roster(party_id,campaign_id,character_id) VALUES('p1','c1','ch1')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO party_roster(party_id,campaign_id,character_id) VALUES('p2','c2','ch1')")

    def test_only_one_pending_approval_per_character(self):
        self.db.execute("INSERT INTO characters(id,campaign_id,owner_user_id,name) VALUES('ch1','c1','u2','Test')")
        self.db.execute("INSERT INTO character_approval_requests(id,character_id,campaign_id,requested_by,submitted_revision) VALUES('ar1','ch1','c1','u2',1)")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO character_approval_requests(id,character_id,campaign_id,requested_by,submitted_revision) VALUES('ar2','ch1','c1','u2',1)")
        self.db.execute("UPDATE character_approval_requests SET status='changes_requested' WHERE id='ar1'")
        self.db.execute("INSERT INTO character_approval_requests(id,character_id,campaign_id,requested_by,submitted_revision) VALUES('ar2','ch1','c1','u2',1)")

    def test_json_check_prevents_invalid_payloads(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("UPDATE campaigns SET settings_json='{bad-json' WHERE id='c1'")

    def test_inventory_requires_exactly_one_kind(self):
        self.db.execute("INSERT INTO characters(id,campaign_id,owner_user_id,name) VALUES('ch1','c1','u2','Test')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO character_inventory(id,character_id) VALUES('item1','ch1')")
        self.db.execute("INSERT INTO character_inventory(id,character_id,custom_item_json) VALUES('item2','ch1','{}')")

    def test_source_requires_explicit_license_and_scope(self):
        self.db.execute("INSERT INTO content_sources(id,ruleset_id,title,publisher,source_version,license_code) VALUES('srd','dnd5e-2024','SRD 5.2.1','Wizards','5.2.1','CC_BY_4_0')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO content_sources(id,ruleset_id,title,publisher,source_version,license_code,scope) VALUES('private','dnd5e-2024','Custom','DM','1','PRIVATE_USER','campaign')")


if __name__ == '__main__':
    unittest.main()
