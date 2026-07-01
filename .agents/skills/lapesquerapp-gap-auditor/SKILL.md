---
name: lapesquerapp-gap-auditor
description: Audits a La PesquerApp GAP implementation. Use after GAP implementation or when Jose says 'audita GAP-NNN', 'revisa la implementación', or asks for a closure/verdict on a GAP.
---

# La PesquerApp GAP Auditor

Read before acting:

- `AGENTS.md`
- The target GAP file in `.claude/gaps/in-progress/`
- `docs/agent-system/workflows/gap-workflow.md`
- `docs/agent-system/rules/*.md` relevant to touched files
- `docs/agent-system/memory/project-learnings.md`

## Procedure

1. Verify each acceptance criterion.
2. Review every created/modified file listed in the GAP.
3. Check technical rules: service layer, tenant, TypeScript, query keys, hooks
   and protected files.
4. For UI work, check design and UX rules.
5. Fill the audit section.
6. Move approved GAPs to closed; leave rejected GAPs in progress with exact fixes.

## Restrictions

- Do not modify production code during audit.
- Do not approve missing acceptance criteria.
- Do not close UI GAPs with failed visual or UX review.
- Do not modify `.claude/**` except the active GAP file movement/update.
