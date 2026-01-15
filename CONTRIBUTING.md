# Contributing to Queue Insights

## Development Workflow

This project uses a professional CI/CD pipeline with automated checks and code review.

### Branch Strategy

```
main (protected) ← feature branches
     │
     └── Always deployable, auto-deploys to production
```

### How to Make Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "Add: description of your change"
   ```

3. **Push to GitHub:**
   ```bash
   git push -u origin feature/your-feature-name
   ```

4. **Create a Pull Request** on GitHub

5. **Wait for CI checks** to pass:
   - Frontend: Lint, TypeScript, Build
   - Backend: Lint, Type check

6. **Get code review** (Claude assists with review)

7. **Merge to main** → Auto-deploys to production

### Commit Message Format

```
Type: Short description

- Detailed bullet point 1
- Detailed bullet point 2

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Types:**
- `Add:` New feature
- `Fix:` Bug fix
- `Update:` Enhancement to existing feature
- `Refactor:` Code restructuring (no behavior change)
- `Docs:` Documentation only
- `Style:` Formatting, linting (no code change)
- `Test:` Adding tests

### Local Development

```bash
# Frontend (localhost:3000)
cd frontend && npm run dev

# Backend (localhost:8001)
cd backend && uvicorn app.main:app --reload --port 8001
```

### CI Checks

All PRs must pass:
- **Frontend:** ESLint, TypeScript compilation, Next.js build
- **Backend:** Ruff linting, mypy type checking

### Branch Protection (GitHub Settings)

To enable branch protection on `main`:
1. Go to Settings → Branches
2. Add rule for `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass (Frontend CI, Backend CI)
   - ✅ Require branches to be up to date
