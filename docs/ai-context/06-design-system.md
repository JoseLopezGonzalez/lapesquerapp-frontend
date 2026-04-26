# Design System

## UI base

The frontend uses shadcn/ui and Tailwind CSS.

## Design principles

- Use existing components before creating new ones.
- Prefer composition over editing base UI primitives.
- Keep spacing consistent.
- Keep typography readable.
- Use design tokens where available.
- Avoid arbitrary colors if tokens exist.
- Avoid unnecessary visual noise.
- Keep operational density appropriate.

## Components

When creating new components:

- make them reusable only if they are likely to be reused;
- keep props clear;
- avoid excessive variants;
- avoid hiding business-specific behavior in generic components.

## For agents

Before changing design system files:

1. Inspect existing components.
2. Check whether the change can be local instead.
3. Avoid breaking existing screens.
4. Explain why design-system-level change is necessary.
