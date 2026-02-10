# Maintenance Guide

## Automated SOTA Database Updates

### Overview

The SOTA database is automatically updated **every Sunday at 00:00 UTC** via GitHub Actions. This ensures users always have access to the latest summit data, including:
- New summit additions
- Updated activation counts
- Summit information corrections
- Retired or reactivated summits

**Important**: Database files are **NOT committed to the repository**. They are generated fresh during each deployment to keep the repository lean and ensure data freshness.

### How It Works

The weekly update process is integrated into the main deployment workflow (`.github/workflows/deploy.yml`):

1. **Trigger**: Cron schedule (`0 0 * * 0`) runs every Sunday at midnight UTC
2. **Download**: Fetches the latest CSV from https://storage.sota.org.uk/summitslist.csv (~24 MB)
3. **Build**: Runs `bun run build:sota` to rebuild the SQLite database (~44 MB)
4. **Package**: Database is included in the build output
5. **Deploy**: Deploys the entire app with fresh database to GitHub Pages

**Note**: Database files are generated during deployment and not stored in git (see `.gitignore`).

### Workflow Configuration

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at 00:00 UTC
```

### Manual Update

You can manually trigger an update at any time:

#### Via GitHub Actions UI
1. Go to **Actions** tab in the repository
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow** → **Run workflow**

#### Via Command Line
```bash
# Download latest SOTA CSV
curl -L -o /tmp/sota-summits-worldwide.csv https://storage.sota.org.uk/summitslist.csv

# Rebuild database
bun run build:sota

# Build and deploy
bun run build:all
```

## Local Development Setup

### For Developers

Since database files are not committed to the repository, you must generate them locally:

#### Quick Setup (Recommended)
```bash
# One command to download and build database
bun run setup
```

This runs `scripts/setup-dev-database.ts` which:
- Downloads the latest SOTA CSV
- Builds the SQLite database
- Displays statistics

#### Manual Setup
```bash
# 1. Download latest SOTA CSV
curl -L -o /tmp/sota-summits-worldwide.csv https://storage.sota.org.uk/summitslist.csv

# 2. Build database
bun run build:sota

# 3. Verify database exists
ls -lh public/data/sota.db
```

#### Verify Setup
```bash
# Check database is working
bun -e "
import { Database } from 'bun:sqlite';
const db = new Database('public/data/sota.db');
const count = db.query('SELECT COUNT(*) as count FROM summits').get();
console.log(\`Database ready with \${count.count.toLocaleString()} summits\`);
db.close();
"
```

### For AI Assistants / CI

Before running tests or automated tasks:

```bash
# Setup database if not exists (cross-platform)
bun run -e "
import fs from 'fs';
if (!fs.existsSync('public/data/sota.db')) {
  await import('./scripts/setup-dev-database.ts');
}
"

# Or simply run setup (it's idempotent)
bun run setup

# Then run your tests
bun run test:e2e
```

### Troubleshooting

**Database file not found**
- Run `bun run setup`
- Or manually download and build as shown above

**Build fails**
- Check that `/tmp/sota-summits-worldwide.csv` exists and is valid
- Verify bun is installed: `bun --version`
- Check disk space (database needs ~100 MB free)

### Database Build Process

The `build-sota-database.mjs` script:
- Parses the SOTA CSV file
- Creates SQLite database with R*Tree spatial index
- Stores metadata including build date and source URL
- Optimizes database with VACUUM and ANALYZE
- Outputs statistics (summit count, file size, etc.)

### Monitoring

#### Check Update Status
- Visit the [Actions tab](../../actions/workflows/deploy.yml) to see recent runs
- Successful updates will show green checkmarks
- Failed updates will show red X marks

#### Database Metadata
The database stores build information in the `metadata` table:
```sql
SELECT * FROM metadata;
```

Fields:
- `build_date`: ISO timestamp of when the database was built
- `sota_version`: Database schema version
- `source`: Official SOTA data source URL

### Troubleshooting

#### Update Fails
If the weekly update fails:
1. Check the [Actions logs](../../actions) for error messages
2. Common issues:
   - SOTA CSV format changed → Update parser in `scripts/build-sota-database.mjs`
   - Download URL unavailable → Verify https://storage.sota.org.uk/summitslist.csv is accessible
   - Build script error → Check Node/Bun version compatibility

#### Manual Recovery
```bash
# Download and rebuild locally
curl -L -o /tmp/sota-summits-worldwide.csv https://storage.sota.org.uk/summitslist.csv
bun run build:sota

# Commit and push
git add public/data/sota.db
git commit -m "chore: manual SOTA database update"
git push
```

### Database Statistics

Current database specs:
- **Format**: SQLite 3 with R*Tree spatial index
- **Size**: ~44 MB (compressed from ~24 MB CSV)
- **Summits**: ~179,000+ worldwide
- **Query Performance**: Sub-10ms for nearby summit searches
- **Journal Mode**: DELETE (for portability with WASM)

### Update Schedule Customization

To change the update frequency, edit `.github/workflows/deploy.yml`:

```yaml
schedule:
  # Daily at 3:00 AM UTC
  - cron: '0 3 * * *'

  # Every Monday at noon UTC
  - cron: '0 12 * * 1'

  # First day of every month at midnight UTC
  - cron: '0 0 1 * *'
```

[Cron syntax reference](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)

### Data Source Information

- **Official Source**: SOTA Management Team
- **CSV URL**: https://storage.sota.org.uk/summitslist.csv
- **Website**: https://www.sotadata.org.uk/
- **Format**: CSV with 15 columns (ref, association, region, name, altitude, coordinates, points, etc.)
- **Update Frequency**: The official SOTA database is updated by the SOTA team when summits are added, modified, or retired

### Deployment

After the database is updated, the full deployment pipeline runs:
1. Database rebuild (as described above)
2. Sitemap generation (`build:sitemaps`)
3. TypeScript compilation + Vite build
4. Deploy to GitHub Pages

Total deployment time: ~3-5 minutes

### Best Practices

1. **Monitor Weekly**: Check Actions tab on Mondays to verify Sunday's update succeeded
2. **Review Logs**: If update fails multiple times, investigate immediately
3. **Test Locally**: Before modifying build scripts, test with latest CSV locally
4. **Version Bumps**: Database schema changes should increment `sota_version` in metadata
5. **Announce Changes**: Major database updates should be mentioned in release notes

### Contact

For issues with:
- **SOTA data quality**: Contact SOTA Management Team via https://www.sota.org.uk/
- **Build pipeline**: Open issue in this repository
- **Manual updates needed**: Use workflow_dispatch or contact maintainer

---

Last updated: 2026-02-11
