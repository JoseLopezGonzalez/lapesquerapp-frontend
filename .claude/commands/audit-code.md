# Command: /audit-code

## Purpose
Launch a full autonomous technical code audit of PesquerApp.
Separate from UI/UX audits — focuses exclusively on code quality,
technical debt, and architectural correctness.

## Usage
```
/audit-code quality              — code quality violations and rule breaches
/audit-code migrate              — JS→TS migration candidates and deprecated patterns
/audit-code arch                 — React/Next.js architectural issues
/audit-code quality [module]     — scope to a specific module (e.g. /audit-code quality hooks)
/audit-code migrate services     — scope to services only
```

## Startup sequence
1. Detect context (LOCAL/CLOUD) per Git Policy in CLAUDE.md
2. Read CLAUDE.md (stack, rules, protected files)
3. Read .claude/rules/typescript.md
4. Read .claude/rules/components.md
5. Read .claude/rules/hooks.md
6. Read .claude/rules/api-client.md
7. Read .claude/rules/testing.md
8. Read .claude/project-learnings.md
9. Invoke code-audit-agent in the requested mode

## What to expect
- Phase 1: inventory presented for approval before auditing starts
- Phase 2: autonomous batch processing — auto-continues every 30 seconds
- Phase 3: consolidated report — Jose selects findings to convert to GAPs
- Phase 4: gap-discovery runs with full Q&A for each approved finding
- Phase 5: system-learner captures new patterns discovered

## Important notes
- QUALITY mode: expect many findings on first run — 18+ .js files, mixed patterns
- MIGRATE mode: LOW complexity files can be batched into a single GAP
- ARCH mode: fewer findings but each may require architectural discussion
- Protected files (useOrder, usePallet, useLabelEditor) are read-only in audits
