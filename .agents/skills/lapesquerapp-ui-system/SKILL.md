---
name: lapesquerapp-ui-system
description: Applies La PesquerApp-specific UI, shadcn, Tailwind, form, and design-system rules. Use for any UI implementation where generic shadcn guidance might conflict with project conventions, especially forms, operational screens, tokens, tables, dialogs, mobile layouts, and component selection.
---

# La PesquerApp UI System

Read before acting:

- `docs/agent-system/rules/design.md`
- `docs/agent-system/rules/components.md`
- `docs/ai-context/02-ui-conventions.md`
- `docs/ai-context/03-form-system.md`
- `docs/ai-context/06-design-system.md`

## Precedence

When generic shadcn skills conflict with La PesquerApp docs, follow
La PesquerApp docs.

Important example: this project primarily uses React Hook Form with direct
`register()` and `Controller`, not the default shadcn `FormField` pattern.

## Rules

- Use existing project components first.
- Keep ERP screens operational, dense and calm.
- Use semantic tokens and documented status classes.
- Use Skeleton for primary loading.
- Do not add unrequested animations or UI libraries.
