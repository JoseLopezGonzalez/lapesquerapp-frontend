# Hook Rules

## Server State

- Use TanStack Query for server data.
- Do not load server data with `useEffect` plus `useState` when a query hook is
  appropriate.
- Query keys must come from factories in `src/lib/routes/queryKeys.ts`.
- Include tenant identity in query keys where data is tenant-scoped.
- Condition queries with tenant availability: `enabled: !!tenantId && enabled`.

## Services and Auth

- Hooks must not extract or forward auth tokens.
- Services obtain tokens internally with the existing auth helper.
- Hooks call domain services, not `fetchWithTenant` directly.

## Mutation Pattern

- Invalidate the relevant query-key prefix after successful mutations.
- Use project notification helpers for success and error feedback.
- Map 422 validation errors to forms with the existing 422 helper.

## Giant Hooks

Do not add new logic directly to giant hooks. Add sub-hooks under:

- `src/hooks/orders/`
- `src/hooks/pallets/`
- `src/hooks/labels/`
