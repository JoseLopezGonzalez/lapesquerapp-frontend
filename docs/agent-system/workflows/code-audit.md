# Code Audit Workflow

## Modes

- `quality`: code quality violations and rule breaches.
- `migrate`: JS to TS migration candidates and deprecated patterns.
- `arch`: React/Next.js architecture risks.

## Startup

Read:

- `AGENTS.md`
- `docs/agent-system/rules/typescript.md`
- `docs/agent-system/rules/components.md`
- `docs/agent-system/rules/hooks.md`
- `docs/agent-system/rules/api-client.md`
- `docs/agent-system/rules/testing.md`
- `docs/agent-system/memory/project-learnings.md`

## Process

1. Discover files in scope.
2. Present an inventory before deep audit when the scope is broad.
3. Audit in batches by file type.
4. Report findings with severity and file references.
5. Offer GAP creation for approved findings.

## Findings

Use:

- Blocking: must fix before merge or closure.
- Important: should fix soon.
- Improvement: optional, lower risk.

Do not modify production code during audit.
