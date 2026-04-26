# Frontend Security

## Main concerns

- token exposure;
- tenant-sensitive data;
- unsafe route assumptions;
- destructive actions;
- displaying data the user should not see;
- trusting client-side checks too much.

## Rules

- Do not expose tokens in logs or UI.
- Do not store sensitive data unnecessarily.
- Do not rely only on frontend checks for authorization.
- Keep tenant assumptions explicit.
- Confirm destructive actions.
- Avoid leaking backend errors directly to users if they contain sensitive data.

## For agents

When implementing security-sensitive UI:

1. Check whether backend authorization exists or is expected.
2. Keep frontend checks as UX helpers, not security guarantees.
3. Avoid logging sensitive values.
4. Add confirmation for destructive actions.
