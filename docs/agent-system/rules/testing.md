# Testing Rules

## Preferred Checks

- Run focused tests for touched hooks, services, helpers or validators.
- Run `npm run type-check` for TypeScript-sensitive changes when dependencies
  are installed.
- Run `npm run lint` for structural or query-key changes when feasible.

## Test Targets

Prioritize:

- `src/__tests__/hooks/`
- `src/__tests__/services/`
- `src/__tests__/utils/`
- `src/__tests__/validators/`
- `src/__tests__/helpers/`
- `src/__tests__/exportHelpers/`

Avoid adding broad UI component tests unless the task explicitly expands UI test
coverage.

## Mocking

- Hook tests mock domain services.
- Service tests mock generic service helpers and auth token helpers.
- Do not mock `fetchWithTenant` directly unless testing that helper itself.
