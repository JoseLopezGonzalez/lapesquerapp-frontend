# UI Audit Workflow

## Modes

- `mobile`: mobile views, touch targets, bottom nav, drawers and responsive
  behavior.
- `desktop`: desktop tables, modals, forms, navigation and operational density.

## Startup

Read:

- `docs/ai-context/02-ui-conventions.md`
- `docs/ai-context/06-design-system.md`
- `docs/agent-system/rules/design.md`
- `docs/agent-system/memory/project-learnings.md`

For mobile mode also read:

- `docs/agent-system/workflows/mobile-ui.md`

## Process

1. Discover views from `src/app/`.
2. Filter by requested mode and scope.
3. Present the queue before a broad audit.
4. Read the route, client component, relevant components and hooks.
5. Check loading, empty, error, success, accessibility and responsive behavior.
6. Report findings by severity.
7. Offer GAP creation for approved findings.

Do not implement fixes during audit unless Jose explicitly switches from audit to
implementation.
