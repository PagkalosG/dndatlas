# D&D Atlas v3.5.0 — Character Sheet & Stability Quality Wave

## Delivered

- Sticky compact status summary for Overview, Combat and Character: HP, AC, Initiative, Passive Perception, Speed and pending choices.
- Combat Spells appear first (prepared/known Action, Bonus Action and Reaction spells from the owned spellbook), plus All My Spells for every class. No new dice UI.
- Failed D1 save protection: visible warning, paused automatic refresh, local JSON draft export and explicitly confirmed discard/refresh. Never show a false save success.
- Builder rules: stronger D&D 5e 2024 class/species/background, level, ability, subclass and skill validation. Background skills now follow mapped 2024 grants rather than Soldier-only code. Class-skill options are now selectable from each PHB 2024 class list (including Bard, Ranger and Rogue), and Elf Keen Senses offers its skill choice; non-mechanized features remain pending DM review.
- Story visibility is private by default with an explicit public/private choice. Next level's known features preview in Level Up; unsupported rules remain pending DM review.
- Player character creation exports an explicit JSON draft for DM review rather than pretending it was inserted into D1. Players cannot authorize DM Overrides.
- Journal sessions now retain a session number and display in chronological order; existing image galleries, session tags and Drive integration are preserved.
- Existing Creator/DM skill/stat edits, activity history, manual Drive workflow and privacy rules are preserved.
- New regression tests in PR and GitHub Pages CI; current production Worker and D1 data unchanged in this release.

## Limitations — not safe to mark as finished

The current production roster is a single shared campaign. Multi-party isolation, self-service invitations/registration, QR enrollment and server-side DM character approvals are NOT implemented by this release. Doing so safely requires partitioning all existing character, session, image tag, history, authentication and administrative endpoints by party; otherwise global read routes could leak data across parties.

A separate remote staging D1/Worker cannot currently be verified with the available Cloudflare permissions. The isolated local D1 integration test suite remains a required release gate. Do not enable invitations until cross-party access and roles are tested on a separate staging deployment.

Unsupported or only partially automated 2024 character builds still explicitly require review. Client-visible JSON exports may omit private fields. When configured, use the Creator-only encrypted full roster backup.

## Next gated migration

1. Provision staging Worker with its own separate D1 and scoped credentials.
2. Create and migrate party/member/invite/character-approval data with owner and DM role checks at every Worker API boundary.
3. Implement expiring hashed invite tokens, rate-limited player registration and DM approval queue.
4. Refuse legacy unscoped roster endpoints for multi-party users and verify cross-party data isolation.
5. Publish EL/EN Party UI and only enable after passing real staging integration tests.

## Verification

PR and release CI run syntax, D&D 2024 rules, UX regression and isolated D1 integration tests. The ZIP must include only changed files with preserved relative paths.