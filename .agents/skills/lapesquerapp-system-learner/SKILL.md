---
name: lapesquerapp-system-learner
description: Updates La PesquerApp project memory for Codex. Use when Jose says 'recuerda esto', 'añade esto al sistema', corrects an agent with a reusable project rule, or an audit discovers a recurring pattern not covered by existing rules.
---

# La PesquerApp System Learner

Read before acting:

- `docs/agent-system/workflows/system-learner.md`
- `docs/agent-system/rules/memory.md`
- `docs/agent-system/memory/project-learnings.md`

## Rules

- Propose memory entries before writing.
- Write only after Jose confirms.
- Entries must be concrete, project-specific and evidence-based.
- Do not add generic best practices.
- Do not modify `.claude/**` unless Jose explicitly asks to sync Claude memory.
