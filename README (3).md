# D&D Atlas · 2024 PWA

Production: https://pagkalosg.github.io/dndatlas/

## Repository structure
- `src/`: JavaScript, translations, styles
- `public/`: app shell, PWA manifest, service worker and version
- `assets/`: icons and campaign asset placeholders
- `data/`: public configuration and campaign JSON
- `workers/`: independently deployed Cloudflare Worker source (do not commit secrets)
- `docs/`: documentation and deployment instructions
- `tests/`: legacy fixtures / room for regression tests
- `.github/workflows/`: builds the GitHub Pages publish directory from these folders

**Deployment:** GitHub repository Settings → Pages → Build and deployment → Source: **GitHub Actions**. Push to `main`. Do not set deployment to branch `/root` with this layout. The workflow assembles `_site` at build time and preserves the existing URLs under `/dndatlas/`.

See `docs/DEPLOY_ORGANIZED_EL.md` for Greek instructions.
