# Design and UI Rules

## Source of Truth

Read these before UI work:

- `docs/ai-context/02-ui-conventions.md`
- `docs/ai-context/06-design-system.md`
- `docs/agent-system/rules/components.md`

## Product Feel

La PesquerApp is an operational ERP. UI should be quiet, dense and efficient.
Avoid landing-page styling, decorative sections, gratuitous animation or
marketing layouts.

## Components and Tokens

- Use existing shadcn/ui primitives and project wrappers.
- Use semantic Tailwind tokens such as `bg-background`, `text-muted-foreground`,
  `border-border`, `bg-success`, `bg-warning`, `bg-info`.
- Do not use arbitrary hex/rgb/oklch values in components.
- Existing documented status Tailwind classes are allowed when they match the
  status pattern in the design system docs.

## Forms

This project does not use the default shadcn `FormField` pattern as its primary
form system. Follow `docs/ai-context/03-form-system.md`: React Hook Form with
`register()` for simple fields and `Controller` for custom inputs.
