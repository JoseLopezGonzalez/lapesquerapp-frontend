# GAP Workflow

## Purpose

GAPs turn ambiguous work into reviewable, auditable changes.

## States

For the Codex adapter v1, GAP files continue to live in `.claude/gaps/`.
Codex may read them and, when explicitly asked to operate on GAPs, may create or
move GAP files there as part of the GAP workflow. Outside that explicit workflow,
`.claude/**` is read-only.

Future migration may move GAPs to `docs/agent-system/gaps/`.

## Flow

```text
Discovery -> Implementation -> Audit
```

## Discovery

Use when Jose describes a bug, improvement, feature or refactor that should be
documented before coding.

Discovery must:

- Ask clarifying questions until scope, UX, API assumptions and acceptance
  criteria are clear.
- Use the next `GAP-NNN` number across open, in-progress and closed GAPs.
- Create a GAP using the current GAP template.
- Include a UI brief for any UI work.
- Never write production code.

## Implementation

Use when Jose asks to implement a confirmed GAP.

Implementation must:

- Read the full GAP.
- Move it from open to in-progress.
- Work only on listed files unless Jose approves a deviation.
- Fill the implementation section.
- Run relevant checks.
- Hand off to audit.

## Audit

Use after implementation or when Jose asks to audit a GAP.

Audit must:

- Verify every acceptance criterion.
- Review touched files.
- Check technical, visual and UX rules.
- Fill the audit section.
- Move approved GAPs to closed.
- Leave rejected GAPs in in-progress with concrete corrections.
