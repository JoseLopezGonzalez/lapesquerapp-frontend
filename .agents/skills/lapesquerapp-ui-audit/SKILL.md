---
name: lapesquerapp-ui-audit
description: Runs La PesquerApp UI and UX audits for '/audit-mobile', '/audit-desktop', mobile view reviews, desktop operational UI reviews, visual consistency checks, and design-system conformance audits.
---

# La PesquerApp UI Audit

Read before acting:

- `AGENTS.md`
- `docs/agent-system/workflows/ui-audit.md`
- `docs/agent-system/rules/design.md`
- `docs/ai-context/02-ui-conventions.md`
- `docs/ai-context/06-design-system.md`
- `docs/agent-system/memory/project-learnings.md`

For mobile mode also read:

- `docs/agent-system/workflows/mobile-ui.md`

## Rules

- Audit only; do not implement fixes unless Jose explicitly changes the task.
- Present a route/view inventory before broad audits.
- Check loading, empty, error and success states.
- Check destructive confirmations, accessibility and responsive behavior.
- Report findings as blocking, important or improvement.
