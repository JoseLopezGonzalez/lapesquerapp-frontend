# API Client Rules

## Layering

All Laravel API access follows this path:

```text
Component
  -> Hook
    -> Domain service
      -> Generic service helper
        -> fetchWithTenant
          -> Laravel /api/v2
```

## Hard Rules

- Do not call `fetch()` directly from components, hooks or Laravel domain
  services.
- Do not hardcode `X-Tenant`; tenant detection is centralized.
- Do not expose tokens in React state, logs or UI.
- Use `API_URL_V2` from `src/configs/config.js` for API URLs.
- Use existing services before creating a new service.
- For selects and comboboxes, prefer `/options` methods over full list endpoints.

## Valid Exceptions

- Internal Next.js API routes and external public APIs may use plain `fetch()`,
  but the call belongs in a service file, not inline in a component.
- The superadmin area has its own API helper and does not use tenant headers.

## Errors

- Use `getErrorMessage` for user-facing API errors.
- Use `setErrorsFrom422` when backend validation errors target form fields.
- Do not show technical backend messages containing SQL, paths or stack traces.
