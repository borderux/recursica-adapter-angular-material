# Publishing

This document describes how `@recursica/adapter-angular-material` is published to npm using Changesets.

## Overview

1. A PR adds a changeset (`npx changeset`) describing the change and bump type.
2. On merge to `main`, `.github/workflows/release.yml` runs. If pending changesets exist, it opens/updates a "Version Packages" PR (version bumps + changelog, no publish yet).
3. Merging the "Version Packages" PR triggers the same workflow again, which this time runs `npm run release` (`changeset publish`) — bumping `package.json`, publishing to npm, and creating a GitHub release.

Publishing uses NPM OIDC Trusted Publishing (`NPM_CONFIG_PROVENANCE: true`).

## Adding a changeset

```bash
npx changeset
```

Pick the affected package, bump type (patch/minor/major), and write a summary — it becomes the changelog entry. Commit the generated `.changeset/*.md` file with your PR.

## First-Time Package Publishing (404/401 Errors)

When publishing a completely new scoped package for the first time via CI or Changesets, npm may fail with a `404 Not Found` or `401 Unauthorized` error. This happens because granular access tokens (OIDC) cannot be pre-scoped to packages that don't exist yet, and a CI `.npmrc` intended for CI may interfere with local authentication.

To publish a new package for the first time:

1. Temporarily bypass the CI `.npmrc`:
   ```bash
   mv .npmrc .npmrc.bak
   ```
2. Authenticate globally:
   ```bash
   npm login
   ```
3. Publish manually with public access:
   ```bash
   npm publish --access public
   ```
4. Restore the original `.npmrc` so CI continues working:
   ```bash
   mv .npmrc.bak .npmrc
   ```
5. Go to the npm registry website to configure Provenance/OIDC for the new package and add it to the CI's Granular Access Token scope.
6. Make sure to alow `npm publish` (which is less safe) as part of the OIDC publishing process

## Dependencies

- **Node.js**: release workflow runs on Node 24
- **Changesets**: provides versioning and the publish command (`changeset publish`)
