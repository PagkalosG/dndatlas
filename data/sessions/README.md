# D&D Atlas shared sessions · 2024
The source-of-truth for new shared sessions is Cloudflare D1 table `campaign_sessions`.
Use Journal → Import Session JSON as Creator/DM, with one JSON per numbered session.
Required: `sessionNumber` (positive integer) and `title`. Use `story` (or `text`) for narrative.
Example: session-template.json. Same session number will be updated, not duplicated.
`data/sessions.json` stays as read-only GitHub fallback for legacy sessions.
Cloudflare Worker deployment is independent from GitHub Pages; deploy workers/api-worker.js before D1 import.
