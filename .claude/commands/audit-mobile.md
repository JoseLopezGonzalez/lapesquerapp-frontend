# Command: /audit-mobile

## Purpose

Launch a full autonomous mobile UI/UX audit of PesquerApp views.
Runs Phase 1 → 2 → 3 → 4 → 5 of the `ui-audit-agent` protocol.

## Usage

```
/audit-mobile              — audits all mobile views
/audit-mobile [module]     — audits only views in that module (e.g. /audit-mobile sales)
/audit-mobile [route]      — audits a single specific view
```

## Startup sequence

1. Detect context (LOCAL/CLOUD) per Git Policy in `CLAUDE.md`
2. Read `.claude/design-context.md`
3. Read `.claude/project-learnings.md`
4. Read `.claude/skills/mobile-ui/SKILL.md`
5. Invoke `ui-audit-agent` in MOBILE mode

## What to expect

- **Phase 1** presents the inventory queue — Jose approves before auditing starts
- **Phase 2** runs autonomously view by view — auto-continues every 30 seconds unless Jose responds
- **Phase 3** presents consolidated report — Jose decides which findings become GAPs
- **Phase 4** runs `gap-discovery` for each approved finding with full Q&A
- **Phase 5** invokes `system-learner` with discovered patterns

## Output

Each view produces a findings report with:
- 🔴 BLOCKING issues (must fix before closure)
- 🟡 IMPORTANT issues (should fix)
- 🟢 IMPROVEMENTS (nice to have)

Final consolidated report shows total findings and recommended GAP order.
