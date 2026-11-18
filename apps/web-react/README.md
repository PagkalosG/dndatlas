# D&D Atlas 2.0 — Claude UI + Atlas 2024 engine (integrated prototype)

**Status: local functional integration, not production.** Read `INTEGRATION_NOTES_EL.md` for what works and what is intentionally incomplete. The original Claude prototype documentation remains below for reference; the mock-only claims are superseded by the integration notes.

- **No authentication or network synchronization.** Switch Player / DM in the header.
- **SRD 2024 source**: actual Atlas catalog and engine loaded from the sibling `apps/web-v2` at build time.
- **Persistence**: IndexedDB; local Save / Submit / Approve.
- **Deployment**: separate staging Worker only, leaving GitHub Pages production unchanged.
- **Licensed assets only**; no unofficial copying of non-SRD rule text or PHB illustrations.
- **No dice-rolling UI.**

---

# D&D Atlas 2.0 — UI/UX prototype

Interactive React + TypeScript + Tailwind prototype of the **Celestial Atlas** design for D&D 5e (2024). **UI only**: no backend, no auth, no rules engine. See `UI-INTEGRATION-CONTRACT.md` for what must be connected later.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the build
```

The app uses a hash router, so `dist/` works on GitHub Pages as-is.

## Demo walkthrough (5 minutes)

1. **Sign in** → any button signs in a demo user ("George").
2. **Campaigns** → four tiles, four different roles for the same account: DM, Player, Co-DM, Pending.
3. **Character Builder** (Player in *Embers of Hydra* → "New character"):
   - Open **Load a demo character** → **Borruk**. Go to *Equipment*: greatsword + shield shows a loadout conflict warning. The right-hand summary lists granted features (Protection, Tough, Smith's Tools — proficiency only).
   - Load **Luna** (Aasimar Sorcerer 3): *Light* is shown as species-granted and doesn't use a class cantrip slot; Healing Hands 1/long rest; Celestial Revelation selected.
   - Go to *Review* → **Submit for DM approval**; the draft locks (read-only/pending).
4. **DM view** (*The Starfall Expedition*): Dashboard → **Approvals** → select *Selene of Moonwell* → write feedback or **Approve**.
5. **Character Sheet** (*Embers of Hydra* → Character): edit HP / slots, take a **Long rest**, see the unsaved indicator, then **Save** or **Cancel**. Private story/notes carry a *Private* badge.
6. **Superadmin** → "Admin" in the header: health, users, audit log; actions need confirmation.
7. **Language**: EN / ΕΛ switch in the header — all chrome and tooltips change.
8. **Component catalog**: Campaigns sidebar → *Catalog* shows every state (loading, empty, success, error, conflict, offline, pending, read-only, disabled) and the artwork-license states.

### Prototype toolbar (bottom-right "🛠")
Simulate **offline**, force the **next save** to succeed / error / conflict, **preview a role** (DM / Co-DM / Player / Pending), and watch emitted mock events. Remove it in production.

## Design notes
- **Select, don't type:** illustrated cards, searchable combobox, segmented controls, steppers, chips; text only for names, notes, stories, search.
- **No dice UI**, no invented official rules: all rules-derived numbers are marked as backend-supplied; mock availability rules are labelled illustrative.
- **Art:** original generated placeholders only, always labelled; `ContentArtwork` is ready for licensed assets and never shows a placeholder as official.
- **Accessibility:** keyboard-operable combobox/tabs/segmented controls, modal focus trap, visible focus ring, reduced-motion support, no colour-only status. Automated axe-core (WCAG 2.1 AA) run reported no violations on the main screens in EN and ΕΛ; some text on translucent backgrounds can't be judged automatically and should be checked manually.

## Honest scope
This is a substantial first pass, not the full brief. The gap list is in `UI-INTEGRATION-CONTRACT.md` §8.
