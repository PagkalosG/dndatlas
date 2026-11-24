# D&D Atlas v3.6 — UX & product direction

Delivered: guided/advanced presentation preference, search for navigation, public catalog and selected character's visible attack/spell/item names, local account-scoped catalog favorites, current-engine calculation inspector, shared pure rest preview/commit logic. No dice UI. No Worker changes. Local preferences are not synced or a security boundary. No private notes or stories indexed. Existing character and server roles remain unchanged. Long Rest removes temporary HP; concentration termination is explicit (default on Long Rest, off on Short Rest), since it depends on duration and circumstances.

## Approved target authorization (not yet deployed)
Exactly three roles: global Administrator (current creator migration), campaign DM, campaign Player. No Co-DM. Admin may access all campaign/user/character data including private fields, through audited server-side authorization. DM only within own campaigns, Player own characters and permitted shared projections. No client role switch grants access. Existing Creator redactions remain until an audited Worker migration with explicit privacy notice, separate staging D1 and cross-campaign integration tests. Do not claim current production has unrestricted Admin or multi-campaign.

## Incremental roadmap
- v3.6: UX foundation; subsequent accessibility audit, browser testing, validation report.
- v3.7: combat action economy, spell provenance and recharge.
- v3.8: inventory/loadout validation, containers, attunement, progression/build planning.
- v3.9: guided builder, draft persistence, catalog cards and equipment shop.
- v4.0: isolated staging Worker/D1, campaign membership, expiring invites/QR, approval queue, role migration, admin audit.
- v4.1: validated campaign libraries/homebrew, pinned versions.
- v4.2: quests, NPC codex, session recaps/timeline, maps, calendar, notifications, crafting and bastions as optional modules.
- Cross-cutting: conflict-safe offline queue and revision-aware undo, bilingual UI, 2024 SRD/licensed content only, accessible mobile controls, no dice rolling. Character comparison remains a non-mutating sandbox.

Release gates: automated tests, production Worker checksum/integration tests, no destructive migrations without tested backup/rollback. Never use production data in staging.
