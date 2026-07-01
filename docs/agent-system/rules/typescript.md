# TypeScript Rules

## Hard Rules

- New source files must be `.ts` or `.tsx`; do not create new `.js` files.
- `strict` mode is active. Avoid `any`; use `unknown`, domain types or explicit
  interfaces.
- Do not add `@ts-nocheck` to files.
- Do not use `@ts-ignore` without a specific justification comment.
- Prefer `interface` for domain objects and API response shapes.
- Prefer `type` for unions, utility types and function signatures.
- Use project aliases (`@/`, `@lib/` only when already valid in the repo); avoid
  deep relative imports across major folders.

## Legacy JS Policy

The codebase still contains legacy JS. If a task touches a legacy `.js` or `.jsx`
file, prefer migrating it in the same change when the blast radius is small. For
large files, document the risk and keep the edit minimal unless the task is
explicitly a migration.

## Protected Files

Do not add logic directly to:

- `src/hooks/useOrder.js`
- `src/hooks/usePallet.ts`
- `src/hooks/useLabelEditor.ts`

Create sub-hooks under the relevant domain folder instead.
