# Design Audit Workflow

## Purpose

Use `/audit-design` for design craft checks that sit above code correctness and
basic UI conformance.

This audit does not replace:

- `code-audit`: technical correctness.
- `ui-audit`: documented UI conformance.
- `gap-auditor`: implementation closure.
- UX review: flow and friction.

It adds three design-quality modes:

- `visual`: hierarchy, rhythm, proportion, balance and native shadcn feel.
- `copy`: terminology, tone, capitalization and message clarity.
- `consistency`: cross-view drift within structurally similar UI families.

## Command Forms

```text
/audit-design visual [module|route]
/audit-design copy [module]
/audit-design consistency [family]
```

Families for consistency mode:

- `listados`
- `paneles-edicion`
- `formularios-creacion`
- `confirmaciones`
- `estados-vacios`
- `tablas`

## Startup

Read:

- `AGENTS.md`
- `docs/agent-system/rules/design.md`
- `docs/agent-system/rules/components.md`
- `docs/agent-system/memory/project-learnings.md`
- `docs/ai-context/02-ui-conventions.md`
- `docs/ai-context/06-design-system.md`

## Visual Mode

Preferred mode is screenshot-based. If screenshots are not available, run
heuristic mode and tag every finding as heuristic.

Capability probe:

1. Check whether the dev server responds on `http://localhost:3000`.
2. Probe Playwright availability without changing `package.json`.
3. Do not download browser binaries without Jose's explicit approval.
4. If auth state is unavailable for protected routes, report screenshot capture
   as unavailable and use heuristic mode for that route.

Checklist:

- hierarchy between title, section labels, body and metadata.
- primary row/card identifier is visually dominant.
- spacing rhythm is deliberate and uniform.
- icon, button and padding proportions match context.
- composition is balanced and not lopsided.
- repeated elements align on stable axes.
- shadcn primitives still look native, not reskinned.

## Copy Mode

Scan user-facing strings:

- JSX text nodes and rendered string literals.
- notifications.
- placeholders, titles and aria labels.
- EmptyState text.
- buttons, menus, tabs and table headers.
- form labels and confirmation dialogs.

Checklist:

- terminology is stable for each domain concept.
- action verbs are consistent.
- formal register is not mixed.
- capitalization is consistent within equivalent UI elements.
- errors are actionable and not raw backend output.
- empty states are context-specific.
- confirmation dialogs state concrete consequences.
- truncated text exposes the full value via `title`.
- Spanish punctuation and accents are correct.

## Consistency Mode

Compare a family of similar views or components. This mode defends the majority
pattern already present in the codebase; it does not invent a new house style.

For each family:

1. Find members by pattern search.
2. Cap the first pass at roughly 10 members.
3. Prioritize orders, pallets, labels, customers and other primary domains.
4. Build a comparison table across dimensions such as width, component choice,
   loading pattern, empty state, submit placement and destructive confirmation.
5. Flag outliers only when there is no documented exception.

## Reporting

For each mode, report:

- scope audited.
- sub-mode for visual: screenshot or heuristic.
- findings by severity.
- file and line references when possible.
- confidence: confirmed or heuristic.
- recommended GAP order.
- project-learning candidates.

Do not implement fixes during design audit.

## Restrictions

- Never modify production code.
- Never download Playwright browsers without explicit approval.
- Never present heuristic findings as visually confirmed.
- Never treat a login redirect screenshot as the requested view.
- Never invent a shadcn or registry component; verify first.
- Never create GAPs without Jose approving the finding.
