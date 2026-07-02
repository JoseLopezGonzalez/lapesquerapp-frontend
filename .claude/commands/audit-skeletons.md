# Command: /audit-skeletons

## Purpose
Audit whether `Skeleton` loading states are faithful to the real components
they stand in for — structure, dimensions, hierarchy — not just "Skeleton was
used instead of a spinner" (that check already lives in `/audit-mobile` and
`/audit-desktop`). Mobile and desktop layers are audited as separate targets.

## Usage
```
/audit-skeletons                        — audits both mobile and desktop, whole app
/audit-skeletons desktop                — desktop-layer skeletons only
/audit-skeletons mobile                 — mobile-layer skeletons only
/audit-skeletons both [module|route]    — scope to a module or single view
```

## Startup sequence
1. Detect context (LOCAL/CLOUD) per Git Policy in CLAUDE.md
2. Read `.claude/design-context.md` § Loading States
3. Read `.claude/project-learnings.md`
4. Read `.claude/skills/mobile-ui/SKILL.md` (needed when auditing mobile targets)
5. Run the Phase 0 capability probe in `skeleton-fidelity-auditor.md`
   (dev server check, Playwright probe, auth session check) before presenting
   inventory
6. Invoke `skeleton-fidelity-auditor`

## What to expect
- Phase 1: inventory of skeleton instances found, presented for approval
- Phase 2: autonomous batch processing — captures a skeleton/loaded screenshot
  pair per instance (SCREENSHOT sub-mode) or reads source side by side
  (HEURISTIC sub-mode), auto-continues every 30 seconds
- Phase 3: consolidated report with a fidelity score per instance
- Phase 4: `gap-discovery` runs for each approved finding; resulting GAPs
  carry a `## Skeleton Reference` section with the exact measurements captured,
  so `skeleton-implementor` doesn't re-measure from scratch
- Phase 5: `system-learner` captures reusable reference dimensions per pattern

## Important notes
- SCREENSHOT mode needs the same one-time setup as `/audit-design visual`:
  ```bash
  npx --yes -p playwright playwright install chromium
  npx --yes -p playwright -p tsx tsx .claude/tools/auth-setup.ts
  ```
  Without it, findings still run in HEURISTIC sub-mode, tagged with lower
  confidence — never presented as equivalent to a SCREENSHOT finding.
- This command does not implement fixes. Confirmed GAPs are picked up by
  `skeleton-implementor` (not the generic `gap-implementor`) when Jose
  confirms them.
- Findings about a Skeleton being entirely absent (not a fidelity issue, a
  presence issue) belong to `/audit-mobile` or `/audit-desktop` — this agent
  cross-checks and skips those to avoid duplicate GAPs.
