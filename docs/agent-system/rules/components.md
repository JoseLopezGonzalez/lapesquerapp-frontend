# Component Rules

## Structure

- Inspect nearby components before creating a new pattern.
- Keep operational screens dense, clear and practical.
- Use `page.tsx` or `page.js` as route entry and put client behavior in a
  dedicated client component when needed.
- Add `'use client'` only when the file uses client-only APIs, state, effects,
  event handlers or browser APIs.
- Keep business logic in hooks or services, not in JSX-heavy components.

## UI Components

- Use existing shadcn/ui components from `@/components/ui/` first.
- Do not install new UI libraries without explicit approval.
- Use `lucide-react` for icons.
- Do not edit generated shadcn primitives unless the task specifically requires
  changing the primitive.
- Prefer composition over local one-off replicas of Button, Card, Input, Badge,
  Dialog, Sheet, Table, Skeleton or Select.

## Operational UX

- Every data view needs loading, empty and error states.
- Use `Skeleton` for primary loading states.
- Destructive actions need confirmation.
- Do not add decorative animation to operational screens.
