# D&D Atlas — πλήρες GitHub Pages release v3.2.2

1. Φτιάξε backup του τρέχοντος repository και των Cloudflare Workers/D1 πριν την αντικατάσταση.
2. Το ZIP έχει τα αρχεία στη ρίζα του repository (index.html, app.js, ...).
3. Μη χάσεις live αλλαγές που έγιναν μετά τη v3.2.1 — κάνε diff, ειδικά στο `app.js`.
4. Έλεγξε ότι `data/api-config.json` και `data/drive-config.json` δείχνουν στους δικούς σου Workers. Κράτησε τις live ρυθμίσεις αν διαφέρουν.
5. Ανέβασε τα αρχεία στο branch του GitHub Pages (συνήθως `main`, root).
6. Επίβεβαίωσε GitHub Pages deployment και κάνε hard refresh. Για εγκατεστημένη PWA, άνοιξέ την ξανά· αν επιμένει το παλιό εικονίδιο, κάνε επανεγκατάσταση αφού επιβεβαιώσεις συγχρονισμό δεδομένων.

## Εικόνες
- `icon-192.png`, `icon-512.png`: Celestial Atlas
- `favicon-48.png`, `icon.svg`: μικρά εικονίδια στο ίδιο ύφος
- `manifest.webmanifest`, `index.html`, `sw.js`, `version.json`: ενημέρωση references/cache

Δεν περιλαμβάνονται μυστικά Cloudflare. Το deployment των Workers γίνεται χωριστά.
