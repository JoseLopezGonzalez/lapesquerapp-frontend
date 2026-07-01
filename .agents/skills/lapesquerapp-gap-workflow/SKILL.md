---
name: lapesquerapp-gap-workflow
description: Coordinates the La PesquerApp GAP lifecycle for Codex. Use when Codex needs shared context for GAP Discovery, GAP Implementation, GAP Audit, or any request involving GAP files, acceptance criteria, workflow state, or moving work through discovery to implementation to audit.
---

# La PesquerApp GAP Workflow

Read before acting:

- `AGENTS.md`
- `docs/agent-system/workflows/gap-workflow.md`
- `docs/agent-system/rules/typescript.md`
- `docs/agent-system/rules/api-client.md`
- `docs/agent-system/rules/hooks.md`
- `docs/agent-system/rules/components.md`

## Rules

- Treat `.claude/gaps/` as the active GAP store for v1.
- Do not touch other `.claude/**` files.
- Use the current GAP template and numbering convention.
- Keep discovery, implementation and audit as separate responsibilities.
- Do not implement during discovery.
- Do not close a GAP without audit.
- Do not work outside GAP-listed files without telling Jose and getting approval.

## Output

Match the active GAP phase:

- Discovery: confirmed GAP content and file location.
- Implementation: files changed, checks run, deviations.
- Audit: criteria verdict, blocking findings, final GAP state.
