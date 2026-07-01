# Agent System Smoke Tests

Use these checks after merging or checking out this branch in a fresh AI session.

## Codex

Start a new Codex session in the repository root and verify the available skills
include:

- `lapesquerapp-gap-discovery`
- `lapesquerapp-gap-implementor`
- `lapesquerapp-gap-auditor`
- `lapesquerapp-code-audit`
- `lapesquerapp-ui-audit`
- `lapesquerapp-mobile-ui`
- `lapesquerapp-ideas`
- `lapesquerapp-system-learner`
- `lapesquerapp-ui-system`

Then use dry prompts that should not modify production code:

```text
/audit-code quality hooks
```

Expected behavior: Codex uses `lapesquerapp-code-audit`, reads
`docs/agent-system/workflows/code-audit.md`, and presents or prepares an audit
inventory before modifying anything.

```text
crea un GAP para revisar si el listado de pedidos necesita mejor estado vacío
```

Expected behavior: Codex uses GAP Discovery, asks clarifying questions if needed,
and does not write production code.

```text
/mobile /admin/orders-manager
```

Expected behavior: Codex uses the mobile UI workflow, inspects the current view
and proposes structure before broad UI changes.

## Cursor

Open the project in Cursor and verify rules are visible/applied:

- `.cursor/rules/05-agent-system.mdc`
- `.cursor/rules/15-gap-workflow.mdc`
- `.cursor/rules/16-audit-workflows.mdc`

Use a dry prompt:

```text
/audit-desktop /admin/orders-manager
```

Expected behavior: Cursor follows `docs/agent-system/workflows/ui-audit.md` and
does not implement fixes unless explicitly asked.

## GitHub Copilot

Verify these files are present:

- `.github/copilot-instructions.md`
- `.github/instructions/agent-system.instructions.md`

Use a prompt in a documentation or PR context asking for a GAP/audit workflow.
Expected behavior: Copilot references `docs/agent-system/`.

## Safety Check

Before committing, run:

```bash
git diff --name-only | rg '^\.claude/' || true
```

Expected output: empty.
