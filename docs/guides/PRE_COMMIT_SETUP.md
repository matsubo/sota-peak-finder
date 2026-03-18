# Pre-Commit Linting Setup

This project uses **Husky** and **lint-staged** to automatically lint and fix code before every commit.

## How It Works

1. **When you commit**: Git runs `.husky/pre-commit` hook
2. **lint-staged runs**: Only lints files you've staged (changed files)
3. **ESLint auto-fixes**: Automatically fixes fixable issues
4. **Commit succeeds or fails**:
   - ✅ If all issues are fixed → Commit proceeds
   - ❌ If unfixable errors remain → Commit is blocked

## What Gets Linted

All staged TypeScript and TSX files (`*.ts`, `*.tsx`) are checked with:
```bash
eslint --fix
```

## Configuration Files

- **`.husky/pre-commit`**: Git hook that runs before commits
- **`package.json`**: Contains `lint-staged` configuration
- **`eslint.config.js`**: ESLint rules

## Testing the Hook

To test that the pre-commit hook works:

```bash
# Make a change with linting issues
echo "const unused = 'test'" >> src/test.ts

# Try to commit (should fail)
git add src/test.ts
git commit -m "Test commit"

# Fix will be attempted automatically
# If auto-fix succeeds, commit will proceed
# If errors remain, you'll see them and commit will be blocked
```

## Manual Linting

You can also run linting manually:

```bash
# Check for issues (no fixes)
bun run lint

# Auto-fix issues
bun run lint:fix
```

## Bypassing the Hook (Not Recommended)

If you absolutely need to bypass the pre-commit hook:

```bash
git commit --no-verify -m "Your message"
```

**Warning:** Only use this in emergencies. All code should pass linting before being committed.

## Troubleshooting

### Hook not running
```bash
# Ensure husky is installed
bun install

# Make pre-commit executable
chmod +x .husky/pre-commit
```

### Persistent linting errors

If you keep getting linting errors that won't auto-fix:

1. Review the error messages
2. Fix them manually in your code
3. Re-stage the files: `git add <file>`
4. Try committing again

### Disable for a specific commit

If you have a legitimate reason to bypass linting for one commit:
```bash
git commit --no-verify -m "Special case commit"
```

## Benefits

✅ **Consistent code quality** - All commits meet linting standards
✅ **Automatic fixes** - No manual formatting needed
✅ **Faster reviews** - PRs don't need style feedback
✅ **Prevent bugs** - Catch common issues before they're committed

## Common Linting Rules

- No unused variables
- Proper React hooks usage
- No console statements in production code
- Consistent code formatting
- JSX comments must be in braces: `{/* comment */}`

---

**Questions?** Check the [ESLint documentation](https://eslint.org/docs/latest/) or run `bun run lint` to see all issues.
