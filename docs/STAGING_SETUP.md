# Staging frontend / API

Only the staging branch is deployed to this separate Cloudflare Pages project. Production stays on GitHub Pages.

## Cloudflare Pages (one-time connection)
- Repository: PagkalosG/dndatlas
- Project name: dndatlas-staging (if available)
- Production branch: staging (this project's production branch is the test environment)
- Framework: None
- Build command: node scripts/build-staging.cjs
- Output directory: _staging_site
- Disable preview deployments for other branches.
- Use Node.js 22 or newer.

The build refuses all other branches, includes the staging API URL only in its generated config, disables Drive, omits campaign/session fixtures, adds a staging banner and restricts browser network requests. The source configuration files in Git stay unchanged. API deployment is separate and verifies the approved staging D1 binding.

## Worker settings
Set ALLOWED_ORIGIN to the exact staging Pages origin (no trailing slash). Configure new staging-only RECOVERY_PEPPER (24+ characters), ATLAS_BACKUP_SECRET (32+ characters), and a temporary BOOTSTRAP_TOKEN. Do not copy production secrets. The creator must be initialized in staging; then remove BOOTSTRAP_TOKEN. Do not commit secrets or real character backups.

## Promotion
The app source can be merged to main only after browser tests and explicit approval. Do not merge staging-specific credentials or database data. No automatic merge/deploy of main is performed by staging CI.
