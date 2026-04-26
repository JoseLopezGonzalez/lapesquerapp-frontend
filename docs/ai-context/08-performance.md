# Frontend Performance

## Common risks

- Loading too much data into tables.
- Large dropdown option lists.
- Re-rendering large forms unnecessarily.
- Fetching data repeatedly.
- Storing huge API responses in state.
- Rendering many modals/components unnecessarily.
- Overusing client-side logic that should be server/API-side.

## Rules

- Use pagination/filtering for large datasets.
- Keep option endpoints lightweight.
- Avoid unnecessary re-fetching.
- Prefer clear loading states.
- Avoid premature optimization.
- Measure or reason before optimizing.

## For agents

When reviewing performance, identify:

1. Data volume risk.
2. Rendering risk.
3. API payload risk.
4. UX impact.
5. Minimal fix.
