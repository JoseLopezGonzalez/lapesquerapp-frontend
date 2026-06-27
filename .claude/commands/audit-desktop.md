# Command: /audit-desktop

## Purpose

Launch a full autonomous desktop UI/UX audit of PesquerApp views.
Runs Phase 1 → 2 → 3 → 4 → 5 of the `ui-audit-agent` protocol.

## Usage

```
/audit-desktop              — audits all desktop views
/audit-desktop [module]     — audits only views in that module (e.g. /audit-desktop crm)
/audit-desktop [route]      — audits a single specific view
```

## Startup sequence

1. Detect context (LOCAL/CLOUD) per Git Policy in `CLAUDE.md`
2. Read `.claude/design-context.md`
3. Read `.claude/project-learnings.md`
4. Invoke `ui-audit-agent` in DESKTOP mode

## What to expect

Same phase structure as `/audit-mobile` but with the DESKTOP checklist:

- **Phase 1** — Inventory queue approval
- **Phase 2** — Autonomous view-by-view audit with 30-second auto-continue
- **Phase 3** — Consolidated findings report
- **Phase 4** — GAP generation for approved findings (via `gap-discovery`)
- **Phase 5** — System Learner handoff for discovered patterns

## Output

Each view produces a findings report with:
- 🔴 BLOCKING issues (must fix before closure)
- 🟡 IMPORTANT issues (should fix)
- 🟢 IMPROVEMENTS (nice to have)

Final consolidated report shows total findings and recommended GAP order.
