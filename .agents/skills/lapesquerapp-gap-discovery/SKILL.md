---
name: lapesquerapp-gap-discovery
description: Creates or prepares La PesquerApp GAPs from bugs, features, improvements, refactors, '/ideas promote NNN', 'crea un GAP', or 'documenta este cambio'. Use when Codex must clarify scope and write a confirmed GAP before implementation.
---

# La PesquerApp GAP Discovery

Read before acting:

- `AGENTS.md`
- `docs/agent-system/workflows/gap-workflow.md`
- `docs/agent-system/agents/operational-roles.md`
- `docs/agent-system/rules/design.md` for UI work
- `docs/agent-system/memory/project-learnings.md`

## Procedure

1. Clarify only decisions that affect scope, UX, API assumptions or acceptance
   criteria.
2. Inspect existing code/docs before asking discoverable questions.
3. Use the next `GAP-NNN` across `.claude/gaps/open`, `in-progress` and `closed`.
4. Create the GAP in `.claude/gaps/open/` only after Jose confirms the spec.
5. Include a UI brief for any UI or visual change.

## Restrictions

- Do not write production code.
- Do not modify files outside the GAP workflow.
- Do not invent backend fields, endpoints or business rules.
- Do not modify `.claude/**` except the relevant GAP file and only during this
  explicit workflow.
