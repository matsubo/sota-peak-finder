# Version Management Guide

## How to Update Version

In this project, the version in `package.json` is the single source of truth.

### To update the version:

```bash
# Patch version bump (2.1.0 → 2.1.1) - Bug fixes
bun run version:patch

# Minor version bump (2.1.0 → 2.2.0) - New features
bun run version:minor

# Major version bump (2.1.0 → 3.0.0) - Breaking changes
bun run version:major

# Or manually edit package.json
# "version": "2.1.0" → "version": "2.2.0"
```

### Automatically reflected in:

- ✅ App footer (displayed as v2.1.0)
- ✅ Globally injected as `__APP_VERSION__` at build time
- ✅ TypeScript type definitions are also automatically generated

### Semantic Versioning

- **MAJOR (3.0.0)**: Breaking changes
  - Example: Major API changes, incompatible changes

- **MINOR (2.1.0)**: New features
  - Example: New language support, new feature additions

- **PATCH (2.0.1)**: Bug fixes
  - Example: Bug fixes, minor improvements

## Update Procedure

1. Update version:
   ```bash
   bun run version:minor
   ```

2. Build:
   ```bash
   bun run build
   ```

3. Commit & create tag (npm version does this automatically):
   ```bash
   git push && git push --tags
   ```

## Check Current Version

```bash
# Check from package.json
cat package.json | grep version

# Or
bun run --version
```

## Changelog

### v2.3.2 (2026-02-06)
- Added offline map tile caching
- Automatic OpenStreetMap tile caching (max 500 tiles, 30 days)
- Leaflet marker icon caching (1 year)
- Offline warning banner display
- Added offline map usage guide

### v2.3.1 (2026-02-06)
- Implemented programmatic SEO (9,000+ pages supported)
- Correct translation file import (moved to src/locales)
- Added pre-commit linting (Husky + lint-staged)
- Fixed LocationPage type definition
- Added react-helmet-async (SEO meta tag support)

### v2.1.0 (2024-02-03)
- Added automatic version management system
- Fixed l10n issues
- Improved PWA cache handling

### v2.0.0 (2024-02-03)
- Complete rewrite with React + TypeScript + Tailwind CSS
- Bun support
- Added E2E tests
- i18n/l10n support (Japanese & English)
