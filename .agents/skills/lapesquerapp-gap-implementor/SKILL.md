---
name: lapesquerapp-gap-implementor
description: Implements a confirmed La PesquerApp GAP. Use when Jose says 'implementa GAP-NNN', 'adelante con el GAP', or asks Codex to execute an already documented GAP.
---

# La PesquerApp GAP Implementor

Read before acting:

- `AGENTS.md`
- The target GAP file in `.claude/gaps/open/`
- `docs/agent-system/workflows/gap-workflow.md`
- All relevant `docs/agent-system/rules/*.md`
- UI docs when the GAP contains UI work

## Procedure

1. Read the full GAP.
2. Move it to `.claude/gaps/in-progress/`.
3. Confirm the touched file set if the GAP is broad or risky.
4. Implement only the agreed scope.
5. Fill the GAP implementation section.
6. Run relevant checks.
7. Hand off to audit.

## Restrictions

- Do not touch files outside the GAP without approval.
- Do not create new `.js` files.
- Do not bypass services, hardcode tenants or forward tokens from hooks.
- Do not modify `.claude/**` except moving/updating the active GAP file.
