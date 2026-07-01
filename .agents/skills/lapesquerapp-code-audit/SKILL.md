---
name: lapesquerapp-code-audit
description: Runs La PesquerApp technical audits for '/audit-code quality', '/audit-code migrate', '/audit-code arch', scoped code-quality reviews, JS-to-TS migration audits, and React/Next architecture audits.
---

# La PesquerApp Code Audit

Read before acting:

- `AGENTS.md`
- `docs/agent-system/workflows/code-audit.md`
- `docs/agent-system/rules/typescript.md`
- `docs/agent-system/rules/components.md`
- `docs/agent-system/rules/hooks.md`
- `docs/agent-system/rules/api-client.md`
- `docs/agent-system/rules/testing.md`
- `docs/agent-system/memory/project-learnings.md`

## Modes

- `quality`: rule violations and unsafe patterns.
- `migrate`: JS to TS candidates and deprecated patterns.
- `arch`: React, Next.js, client/server and state architecture risks.

## Rules

- Present inventory before broad audits.
- Report findings with severity and file references.
- Do not modify production code during audit.
- Offer GAP creation for findings Jose approves.
