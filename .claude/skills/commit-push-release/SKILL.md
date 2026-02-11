---
name: commit-push-release
description: Commit changes, bump PWA version, and create a GitHub release with automated release notes. Use when releasing a new version. Call with version type (patch/minor/major).
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(npm version *), Bash(gh release *), Edit(package.json), Read(*)
---

# Commit, Push, and Release Workflow for PWA

Automate the complete release workflow for the SOTA Peak Finder PWA. This skill handles version bumping, committing, pushing, and creating GitHub releases with proper release notes.

## Usage

Invoke this skill with a version bump type:
- `/commit-push-release patch` - Bug fixes and minor updates (3.2.2 → 3.2.3)
- `/commit-push-release minor` - New features (3.2.2 → 3.3.0)
- `/commit-push-release major` - Breaking changes (3.2.2 → 4.0.0)

## Workflow Steps

### Step 1: Pre-flight Checks

1. Check current branch: `git branch --show-current`
2. Verify we're on `main` branch
3. Check git status: `git status`
4. Review all changes to be committed

### Step 2: Bump Version

1. Update `package.json` version based on `$ARGUMENTS` (patch/minor/major)
2. If `$ARGUMENTS` is:
   - `patch`: Increment patch version (x.x.X)
   - `minor`: Increment minor version (x.X.0)
   - `major`: Increment major version (X.0.0)
3. Read the new version from package.json

### Step 3: Generate Release Notes

1. Get commit history since last version: `git log --oneline --pretty=format:"%s" $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD`
2. Categorize commits by conventional commit type:
   - `feat:` → Features
   - `fix:` → Bug Fixes
   - `refactor:` → Code Improvements
   - `docs:` → Documentation
   - `chore:` → Maintenance
3. Format release notes in markdown with sections

### Step 4: Commit Changes

1. Stage all modified files: `git add -A`
2. Create commit with message format:
   ```
   chore: bump version to vX.Y.Z

   Release notes will be added to GitHub release

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   ```
3. Verify commit was successful: `git log -1 --oneline`

### Step 5: Create Git Tag

1. Create annotated tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
2. Verify tag created: `git tag -l "v*" | tail -1`

### Step 6: Push to GitHub

1. Push commits: `git push origin main`
2. Push tags: `git push origin --tags`
3. Verify push was successful

### Step 7: Create GitHub Release

1. Use GitHub CLI to create release:
   ```bash
   gh release create vX.Y.Z \
     --title "Release vX.Y.Z" \
     --notes "<generated_release_notes>"
   ```
2. Display release URL to user
3. Confirm release is visible on GitHub

## Important Notes

- **PWA Update**: The version bump triggers service worker update, users will see the new version on next visit
- **Conventional Commits**: Use standard commit prefixes (feat:, fix:, chore:, etc.)
- **Release Notes**: Should be user-friendly, not developer-focused
- **Always on main**: Only release from the main branch
- **GitHub CLI Required**: Ensure `gh` is authenticated: `gh auth status`

## Error Handling

If any step fails:
1. **Stop the workflow** - don't proceed to next steps
2. **Show the error** to the user
3. **Explain what went wrong** and how to fix it
4. **Ask the user** if they want to retry or abort

## Example Release Notes Format

```markdown
## 🎉 What's New

- Add donation support with Buy Me a Coffee and GitHub Sponsors
- Add GitHub Discussions link for community support

## 🔧 Improvements

- Update footer design with new support section
- Improve README with contribution guidelines

## 📝 Documentation

- Add support badges to README
- Update contributing section

---

**Full Changelog**: https://github.com/matsubo/sota-peak-finder/compare/vOLD...vNEW
```

## After Release

The PWA will automatically update for users due to:
1. GitHub Actions deployment triggered by push to main
2. Service worker will detect new version
3. Users will be prompted to reload on next visit

## Safety Checks

Before proceeding:
- ✅ Check if there are uncommitted changes
- ✅ Verify we're on the correct branch (main)
- ✅ Confirm all tests pass (if applicable)
- ✅ Ensure package.json exists and is valid JSON
- ✅ Verify GitHub CLI is authenticated

DO NOT proceed if any safety checks fail!
