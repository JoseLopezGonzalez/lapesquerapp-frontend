# ADR-0005 — shadcn/Tailwind UI Agent Role

## Decision

A dedicated shadcn/Tailwind UI Agent role is established as the resident expert for all UI component and design system work.

## Reason

The project uses Tailwind CSS v4 (which differs significantly from v3), the `radix-nova` shadcn style (not the default), oklch color tokens, and a custom registry from `reui.io`. These specifics are easily missed by a generic frontend agent, leading to inconsistent UI, wrong token usage, or components that break the design system.

A dedicated agent with deep knowledge of the exact versions in use reduces the risk of:

- Arbitrary color values instead of semantic tokens.
- Duplicated UI components that shadow/ui already provides.
- Incorrect Tailwind v4 syntax (e.g., using v3 `@layer` patterns).
- Modifications to generated shadcn files instead of composing them.

## Stack documented

- Tailwind CSS v4.2.1 (`@theme inline`, `@import "tailwindcss"`)
- shadcn/ui style: `radix-nova`
- oklch color space
- Extra semantic tokens: `info`, `success`, `warning`, `invert`, `foreground-50/100/300/400`
- Custom breakpoints: `sm-md` through `3xl`
- Custom registry: `@reui` from `reui.io`

## Agent files

- `docs/agents/shadcn-tailwind-agent.md`
- `.cursor/rules/55-shadcn-tailwind-agent.mdc`
- `.github/instructions/shadcn-tailwind.instructions.md`
- `docs/ai-context/06-design-system.md` (updated)

## Date

2026-04-26

## Status

accepted
