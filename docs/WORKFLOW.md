# Aliester Team Workflow

This document defines how to work on Aliester now that the repo is split into **desktop** and **mobile** apps with a **shared backend**.

## Repo model

Aliester uses **one repo** with:

- `apps/desktop/` — desktop web app
- `apps/mobile/` — mobile app/webview shell
- shared backend at repo root:
  - `functions/`
  - `migrations/`
  - `insforge.toml`

This keeps product logic, database changes, auth, and infrastructure in one place while allowing each frontend to evolve separately.

## Ownership

### Desktop owner

Main responsibility:

- `apps/desktop/**`

### Mobile owner

Main responsibility:

- `apps/mobile/**`

### Shared ownership

These paths affect both apps and must be changed carefully:

- `functions/**`
- `migrations/**`
- `insforge.toml`
- `docs/**`
- root deployment/config files

## Branch strategy

Use these branches:

- `main` → production
- `dev` → integration / staging
- `feat/...` → individual work
- `fix/...` → bug fixes
- `refactor/...` → structural cleanup

### Examples

- `feat/desktop-dashboard-filters`
- `feat/mobile-login-screen`
- `feat/backend-reminders-table`
- `fix/desktop-calendar-sync`

## Daily workflow

### 1. Start from `dev`

```bash
git checkout dev
git pull origin dev
```

### 2. Create your working branch

Desktop example:

```bash
git checkout -b feat/desktop-kanban-improvements
```

Mobile example:

```bash
git checkout -b feat/mobile-home-screen
```

### 3. Work only in your area when possible

- Desktop work should stay inside `apps/desktop/**`
- Mobile work should stay inside `apps/mobile/**`
- Backend changes should be announced before changing them

### 4. Commit clearly

Examples:

```bash
git commit -m "feat(desktop): improve task kanban details"
git commit -m "feat(mobile): add home shell navigation"
git commit -m "feat(backend): add reminders table"
git commit -m "fix(desktop): correct google oauth redirect"
```

### 5. Push your feature branch

```bash
git push origin feat/desktop-kanban-improvements
```

### 6. Merge into `dev`

After review/testing, merge into `dev`.

If you are doing it manually:

```bash
git checkout dev
git pull origin dev
git merge feat/desktop-kanban-improvements
git push origin dev
```

## Releasing to production

When `dev` is stable and tested:

```bash
git checkout main
git pull origin main
git merge dev
git push origin main
```

That is the promotion step from staging/integration to production.

## Rules for shared backend changes

If a change touches any of these:

- database schema
- auth flow
- edge functions
- shared config

then the person making the change must communicate:

1. what changed
2. which files changed
3. whether desktop is affected
4. whether mobile is affected
5. whether teammates need to pull `dev`

## Verification checklist before merging to `dev`

- [ ] App runs locally
- [ ] No unrelated files changed
- [ ] `git status` is clean except intended files
- [ ] If backend changed, affected flow was tested
- [ ] If auth/config changed, deploy/config apply was done if needed
- [ ] Desktop/mobile owner knows if the shared backend changed

## Verification checklist before merging `dev` to `main`

- [ ] `dev` is clean and pushed
- [ ] Desktop main flows were tested
- [ ] Mobile main flows were tested
- [ ] Shared backend changes are already applied where required
- [ ] No unfinished experimental work is mixed in

## What NOT to do

- Do not build features directly on `main`
- Do not both work directly on `dev` for large changes
- Do not change backend contracts silently
- Do not mix desktop, mobile, and backend refactors in one unclear commit

## Worktrees

### What a worktree is

A **git worktree** lets you check out the same repo in another folder at the same time, on a different branch.

That means:

- one branch in one folder
- another branch in another folder
- same repo history underneath

### Why worktrees help

They are useful when you want to:

- keep `dev` open while testing a feature branch
- work on desktop and backend in separate folders
- review or hotfix something without stashing your current work

### Example

Main repo folder:

```bash
/home/sebas/Projects/Aliester
```

Add another worktree for a desktop feature:

```bash
git worktree add ../Aliester-desktop feat/desktop-new-layout
```

Now you have:

- `/home/sebas/Projects/Aliester` → maybe on `dev`
- `/home/sebas/Projects/Aliester-desktop` → on `feat/desktop-new-layout`

Both are real folders. You can open both in the editor at once.

### Useful commands

List worktrees:

```bash
git worktree list
```

Create a new one:

```bash
git worktree add ../Aliester-mobile feat/mobile-auth-refresh
```

Remove one when done:

```bash
git worktree remove ../Aliester-mobile
```

### When to use worktrees here

Use them when:

- one of you needs a clean testing folder
- one person is doing a risky refactor
- you want parallel branches without stashing constantly

Do **not** use them just because they sound advanced. If normal feature branches are enough, stick with normal feature branches.

## Recommended workflow for Aliester right now

For now, the simplest professional setup is:

1. one shared repo
2. one shared backend
3. desktop and mobile separated by folder ownership
4. feature branches for all non-trivial work
5. `dev` for integration
6. `main` for production

Worktrees are optional. They are a power tool, not a requirement.
