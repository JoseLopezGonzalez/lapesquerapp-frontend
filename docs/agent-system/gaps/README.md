# GAP Storage

The active GAP history currently remains in:

- `.claude/gaps/open/`
- `.claude/gaps/in-progress/`
- `.claude/gaps/closed/`

Codex adapter v1 must not migrate or rewrite that history.

Codex may read active GAPs when implementing or auditing them. Codex may create
or move GAP files in `.claude/gaps/` only when Jose explicitly invokes the GAP
workflow, because that folder is still the active operational store.

A future migration may move the live GAP store to:

- `docs/agent-system/gaps/open/`
- `docs/agent-system/gaps/in-progress/`
- `docs/agent-system/gaps/closed/`

That migration is intentionally out of scope for ADR-0006.
