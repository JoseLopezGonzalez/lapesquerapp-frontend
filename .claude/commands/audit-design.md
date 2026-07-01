# Command: /audit-design

## Purpose
Launch a full autonomous design-craft audit of PesquerApp — the layer above pure
code correctness (`/audit-code`) and pure UX flow (`/audit-mobile`/`/audit-desktop`).
Judges whether things actually look and read well, not just whether they follow
the documented tokens.

## Usage
```
/audit-design visual                    — composition craft: hierarchy, rhythm, proportion, balance (all views)
/audit-design visual [module|route]     — scope to a module or single view
/audit-design copy                      — content craft: terminology, tone, message clarity (whole app)
/audit-design copy [module]             — scope to a module
/audit-design consistency               — cross-view drift, every family in the taxonomy
/audit-design consistency [family]      — scope to one family: listados, paneles-edicion,
                                           formularios-creacion, confirmaciones, estados-vacios, tablas
```

## Startup sequence
1. Detect context (LOCAL/CLOUD) per Git Policy in CLAUDE.md
2. Read `.claude/design-context.md`
3. Read `.claude/project-learnings.md`
4. Read `.claude/rules/components.md`
5. VISUAL mode only: run the Phase 0 capability probe in `design-quality-auditor.md`
   (dev server check, Playwright probe, auth session check) before presenting inventory
6. Invoke `design-quality-auditor` in the requested mode

## What to expect
- Phase 1: inventory/queue/member-list presented for approval before auditing starts
- Phase 2: autonomous batch processing — auto-continues every 30 seconds
- Phase 3: consolidated report — Jose selects findings to convert to GAPs
- Phase 4: `gap-discovery` runs with full Q&A for each approved finding
- Phase 5: `system-learner` captures new patterns, including ESLint-rule candidates

## Important notes
- VISUAL mode without a working Playwright + auth session runs in HEURISTIC
  sub-mode — findings are still produced but tagged with lower confidence.
  One-time setup for full SCREENSHOT mode:
  ```bash
  npx --yes -p playwright playwright install chromium
  npx --yes -p playwright -p tsx tsx .claude/tools/auth-setup.ts
  ```
- COPY and CONSISTENCY modes need no setup — they run on source alone.
- CONSISTENCY mode never invents a new house style — it defends whatever pattern
  is already the majority in the codebase and flags the outliers.
- Protected files (`useLabelEditor`) are read-only, partial-read only, same as
  every other audit agent.
