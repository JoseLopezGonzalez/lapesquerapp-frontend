# Generic Agent Quickstart

Use this when an AI tool does not support Codex skills, Cursor rules or GitHub
instruction files.

## Start Here

Read in this order:

1. `AGENTS.md`
2. `docs/agent-system/README.md`
3. `docs/agent-system/commands/README.md`
4. The relevant workflow in `docs/agent-system/workflows/`
5. The relevant rules in `docs/agent-system/rules/`
6. The relevant project docs in `docs/ai-context/`

## Command Routing

- GAP creation: `workflows/gap-workflow.md`
- GAP implementation: `workflows/gap-workflow.md`
- GAP audit: `workflows/gap-workflow.md`
- Code audit: `workflows/code-audit.md`
- UI audit: `workflows/ui-audit.md`
- Design audit: `workflows/design-audit.md`
- Mobile UI: `workflows/mobile-ui.md`
- Ideas: `workflows/ideas.md`
- Memory: `workflows/system-learner.md`

## Non-Negotiables

- Do not modify `.claude/**` unless the workflow explicitly allows it.
- Do not create new `.js` files.
- Do not bypass the API service layer.
- Do not hardcode tenants or expose tokens.
- Do not invent backend fields.
- Do not add dependencies without approval.
- Follow La PesquerApp docs when generic framework advice conflicts.

## Standard Response

For implementation work, report:

1. What was understood.
2. Files inspected.
3. Files touched.
4. Changes made.
5. Checks run.
6. Risks or assumptions.
