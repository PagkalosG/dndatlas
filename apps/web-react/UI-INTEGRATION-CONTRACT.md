# D&D Atlas 2.0 — UI Integration Contract

This prototype is **UI only**. It contains no backend, authentication, database, API endpoints, Cloudflare or Google Drive code, and **no rules engine**. Everything below describes what the real application must provide so this UI can be moved into the production PWA.

> **Security note.** Every role check in this prototype (`can.*` in `src/app/AppState.tsx`, the "preview role" switch in the prototype toolbar) is a *visibility simulation*. None of it is security. The server must enforce roles, campaign membership, private-note visibility and approval rules.

---

## 1. Architecture

```
src/
  types/            Shared TypeScript contracts (API-shaped view models + AtlasEvent union)
  i18n/             en.ts (source of TKey), el.ts (typed Record<TKey,string>), provider + useI18n()
  mock/             reference.ts (species, classes, spells, items…), campaignData.ts, demoCharacters.ts
  services/
    atlasService.ts The ONLY mutation/read boundary used by screens (interface AtlasService)
    rules.mock.ts   Mock availability rules ("why is this unavailable?") — replaced by rules engine
    simulation.ts   Prototype-only: offline/error/conflict switches + event log
  hooks/useSaver.ts Explicit Save/Cancel/dirty/sync state + useAsync loader
  components/ui/    Foundations (Button, Combobox, Controls, Feedback, SelectionCard, Illustration)
  components/content/ContentArtwork.tsx   Licensed-artwork component with fallback
  features/         builder/ sheet/ campaigns/ dm/ misc/   (screens)
  app/              AppShell, AppState (session + role simulation), App (routes), DevToolbar
```

**Rule of the codebase:** screens call `mockAtlasService` (interface `AtlasService`) and `useI18n()`. They never contain DB-shaped data or hard-coded bilingual strings.

### Replace-list (mock functions the team must replace)

| File | What is mocked | Replace with |
|---|---|---|
| `services/atlasService.ts` | whole `mockAtlasService` (in-memory `db`, `sleep`, simulated errors) | HTTP/RPC client implementing the same `AtlasService` interface; keep the `Result<T>` shape |
| `services/rules.mock.ts` | `speciesAvailability`, `spellAvailability`, `itemAvailability`, `featAvailable`, `mockMaxSpellLevel` | Rules/permissions engine returning `Availability` (`state`, localized `reason`, `needsApproval`) |
| `features/builder/builderModel.ts` | `STANDARD_ARRAY`, `POINT_BUY_*`, `validate()`, `loadoutWarnings()` | Server-side validation result (`StepIssue[]`) + warnings |
| `mock/reference.ts` | species/class/background/spell/item/feat catalogs | Content API with licensing metadata; backgrounds, class features and spell data from licensed sources only |
| `mock/campaignData.ts` | users, campaigns, characters, approvals, notifications, journal, media | API data |
| `mock/demoCharacters.ts` | Borruk / Luna demo drafts | Remove (test fixtures only) |
| `app/AppState.tsx` | `login`, `logout`, localStorage session flag, `rolePreview` | Real session + memberships from the auth backend. Remove `rolePreview` |
| `services/simulation.ts`, `app/DevToolbar.tsx` | offline/error/conflict switch, event log | Delete from production build |
| `components/QrPlaceholder.tsx` | non-scannable QR graphic | Real QR generator from the invite URL |
| `components/ui/Illustration.tsx` | generated placeholder art | Stays as fallback; real art via `ContentArtwork.assetUrl` |

---

## 2. Route map (HashRouter — works on GitHub Pages)

| Route | Screen | Roles | Notes |
|---|---|---|---|
| `/login` | `Login` | public | Google / email mock |
| `/join/:code?` | `JoinFlow` | signed in | QR deep link prefills `code` |
| `/campaigns` | `CampaignSelector` | signed in | one tile per membership |
| `/campaigns/new` | `CampaignWizard` | signed in | creator becomes DM |
| `/c/:campaignId` | `CampaignHome` | member | DM/Co-DM see dashboard; Player sees home; Pending sees waiting state |
| `/c/:campaignId/party` | `Party` | member | role changes: DM only |
| `/c/:campaignId/approvals` | `Approvals` | DM, Co-DM | |
| `/c/:campaignId/characters/new` | `CharacterBuilder` | Player, DM, Co-DM | read-only for Pending |
| `/c/:campaignId/characters/:characterId` | `CharacterSheet` | member | edit: owner (+DM); others read-only |
| `/c/:campaignId/journal` | `JournalPanel` | member | visibility: private / party / dm_only |
| `/c/:campaignId/gallery` | `GalleryPanel` | member | dm_only items hidden for players |
| `/notifications` | `Notifications` | signed in | |
| `/profile` | `Profile` | signed in | language + privacy note |
| `/admin` | `SuperadminDashboard` | Superadmin | health, users, campaigns, audit |
| `/future` | `Future` | signed in | non-functional placeholders (no payment flow) |
| `/catalog` | `Catalog` | prototype only | component/state catalog; drop in production |

---

## 3. Data models (`src/types/index.ts`)

All numeric rules results (modifiers, saves, AC, HP, DCs) are **delivered by the backend** inside `SheetCharacter`; the UI never computes them.

Key interfaces: `User`, `Membership` (`role: 'superadmin'|'dm'|'co_dm'|'player'|'pending'`), `Campaign`, `Species`, `ClassDef` (+`ClassChoiceGroup`), `Background`, `Feat`, `Skill`, `Spell`, `Item`, `CharacterDraft` (builder state, has `version` for optimistic concurrency and `status: ApprovalStatus`), `SheetCharacter` (read model for the sheet), `Member`, `ApprovalRequest` (`changes[]` before/after), `AppNotification`, `JournalEntry`, `MediaItem`, `SessionInfo`, `AuditEntry`, `SystemHealth`.

`Availability { state: 'available'|'unavailable'|'incompatible'; reason?: LocalizedString; needsApproval?: boolean }` is how the UI explains *why* an option is blocked. The backend must always supply a human-readable `reason`.

`LocalizedString { en, el }` — catalog content ships both languages. UI chrome uses the dictionaries instead.

### Privacy fields
`CharacterDraft.story`, `CharacterDraft.privateNotes`, `SheetCharacter.story/privateNotes`, journal entries with `visibility: 'private'|'dm_only'`. The prototype shows a "Private" badge and hides private notes from non-owners; **the API must not return them to unauthorized users at all**.

### Artwork (`ContentArtwork`)
Props: `assetUrl, alt, sourceTitle, artist, licenseStatus ('licensed'|'original'|'pending_license'|'missing'), isOfficial, fallback {hue,glyph}, focusX, focusY, showStatus`. An image renders **only** when `licenseStatus === 'licensed'` and the URL loads; otherwise an original generated placeholder is drawn and labelled "Original placeholder" / "License pending" / "Image unavailable". Placeholders are never labelled official. The media catalog should provide `licenseStatus`, `isOfficial`, `sourceTitle`, `artist` per asset.

---

## 4. Backend operations to connect (`AtlasService`)

| Method | Used by | Mock event emitted | Errors the UI handles |
|---|---|---|---|
| `currentUser()` | AppState | — | offline, server |
| `listMemberships()` | selector, shell | — | offline |
| `createCampaign(input)` | wizard | `campaign.create` | offline, server |
| `joinByCode(code)` | join flow | `campaign.join` | `not_found` (also needed: expired, revoked, full, banned, already-member) |
| `listMembers(campaignId)` | party, dashboard | — | offline |
| `changeMemberRole(campaignId,userId,role)` | party | `member.role.change` | forbidden, offline |
| `removeMember(campaignId,userId)` | party | `member.remove` | forbidden |
| `listApprovals(campaignId)` | approvals, dashboard | — | |
| `decideApproval(id, decision, feedback?)` | approvals | `character.approval.decide` | `conflict` if already decided |
| `getPendingDraft(id)` | approvals | — | |
| `listCharacters(campaignId?)` / `getCharacter(id)` | home, sheet | — | `not_found`, forbidden |
| `saveCharacter(sheet)` | sheet | `character.sheet.save` | **`conflict`** (needs revision/version check), offline |
| `saveDraft(draft)` | builder | `character.draft.save` | conflict via `version` |
| `submitDraft(draft)` | builder | `character.submit` | validation failures |
| `listNotifications()` / `markNotificationRead(id)` | notifications, shell badge | `notification.read` | |
| `listJournal(campaignId)` / `listMedia(campaignId)` / `listSessions()` | journal, gallery, home | — | |
| `adminOverview()` | superadmin | — | forbidden |

Result type: `Result<T> = { ok:true, data } | { ok:false, error:'offline'|'server'|'conflict'|'not_found'|'forbidden', message }`. `useSaver` maps these to the UI sync states.

Additional operations referenced by the UI but **not yet in the service interface**: `character.rest` (event emitted), journal create/edit, notification preferences, invite create/revoke/expiry, admin actions (`admin.action` event only), approval-request creation for items.

### Emitted events (`AtlasEvent`)
`auth.login`, `auth.logout`, `campaign.select`, `campaign.create`, `campaign.join`, `member.role.change`, `member.remove`, `character.draft.save`, `character.submit`, `character.approval.decide`, `character.sheet.save`, `character.rest`, `notification.read`, `admin.action`. In the prototype they go through `emitMockEvent()` and appear in the toolbar log. In production map each to an API command/audit record.

---

## 5. Component map and contracts

### Foundations (`components/ui`)
| Component | Key props | Events | States handled |
|---|---|---|---|
| `Button` | `variant, size, loading, icon` | native | loading, disabled |
| `Combobox` | `label, options[{id,label,hint,disabled,disabledReason}], value, error, readOnly, disabled` | `onChange(id?)` | ARIA combobox, arrows/Enter/Esc, disabled with reason |
| `Segmented<T>` | `label, options, value, hideLabel` | `onChange(v)` | radiogroup, arrow keys |
| `Toggle`, `Chip`, `NumberStepper`, `Badge`, `Field`, `InfoTip` (Controls.tsx) | see source | `onChange` | disabled/read-only |
| `SelectionCard` | `title, subtitle, description, hue, glyph, artworkUrl, selected, mode, availability, badges, compact` | `onSelect, onInfo` | unavailable/incompatible/needs-approval with visible reason |
| `StatusBanner`, `SyncBanner` | `kind: success|error|conflict|offline|pending|readonly|info|loading` | actions slot | all required states |
| `SaveBar` | `dirty, saving, disabled, readOnly` | `onSave, onCancel` | unsaved indicator, read-only |
| `Modal` | `open, title, footer` | `onClose` | focus trap, Esc, restores focus |
| `Tabs`, `Stepper`, `Skeleton`, `EmptyState`, `Avatar`, `RoleBadge`, `ApprovalBadge`, `PrivateBadge` | | | |
| `ContentArtwork`, `SourceLicenseIndicator` | see §3 | | missing / pending / licensed |

### Domain
- **Builder:** `CharacterBuilder` (state via `useSaver<CharacterDraft>`), step components `SpeciesStep … ReviewStep` each take `StepProps { draft, update(patch), readOnly, goTo }`; `CharacterSummary({draft})` (live; shows selections and granted features only, never calculated rules values).
- **Sheet:** `CharacterSheet` → tabs Overview / Combat / Spells / Inventory, plus `JournalPanel`, `GalleryPanel`.
- **Campaign:** `CampaignSelector`, `CampaignWizard`, `JoinFlow`, `CampaignHome`, `Party`, `Approvals`, `Notifications`, `SuperadminDashboard`.

---

## 6. UI states required from the backend/flow
Loading (`Skeleton`), empty (`EmptyState`), success, error (retry), **conflict** (keep mine / load theirs), offline (kept locally), pending (locked while DM reviews), disabled, read-only. Every explicit Save/Cancel surface uses `useSaver` + `SaveBar`; no autosave. Unsaved changes: `beforeunload` guard, in-app discard confirmation on Exit.

## 7. Internationalisation
`TKey` is derived from `en.ts`; `el.ts` is typed `Record<TKey,string>` so a missing Greek key fails `tsc`. Dynamic keys (`role.${role}`, `approval.${status}`, `school.${…}`…) are all present in both files. Catalog content uses `LocalizedString`. Greek screens may show the English game term in parentheses (e.g. «Συγκέντρωση (Concentration)»).

## 8. Known gaps vs. the design brief (not built in this pass)
Be aware before planning integration work:
- **Phase A moodboards**: one direction ("Celestial Atlas") was implemented directly; no separate moodboard artefacts.
- **Builder:** "Import a character" step, multiclass flow, weapon-mastery picker/limits, portrait upload/crop, species/class art beyond placeholders, spell sources (granted vs feat vs class) tagging.
- **Sheet:** Features tab, death saves, concentration tracker, attack breakdown/mastery tooltips, shared party inventory/transfers, carry capacity/attunement-slot counters, custom-item creation.
- **Approvals:** "Make DM Edit", DM Override panel with mandatory reason, level-up request flow.
- **Campaign:** advanced wizard options (HP method, progression, multiclass toggle, invite expiry/max uses/revoke UI, player cap), invite edge cases (expired/revoked/full/banned), pinned/recent campaigns, auto-enter when only one campaign (currently always shows the selector).
- **Gallery:** full-screen viewer with swipe, session/tag filters. **Journal:** quests/NPCs/locations/timeline structure.
- **Shell:** theme toggle / light theme, breadcrumbs, toast system (banners are used instead), PWA service worker/installability beyond a web manifest (no icons yet), Lucide icons (Unicode glyphs used).
- **Admin:** search/filter, moderation/support-access views; dangerous actions use a confirm modal and emit `admin.action` only.
- No automated test suite; verification was manual plus scripted Playwright/axe runs (not committed).
