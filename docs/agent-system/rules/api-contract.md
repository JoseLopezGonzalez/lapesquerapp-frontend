# API Contract Rules

> Condensed pointer. Full rules live in `.claude/rules/api-contract.md`
> (canonical source). Day-to-day guide: `.claude/api-contract-guide.md`.

## Source of truth

The Laravel backend publishes an OpenAPI contract at
`{APP_URL}/openapi/frontend.yaml` (+ `meta.json`). It is the source of truth
for API types. Do not hand-write an interface that duplicates a response
already covered by a migrated module's generated types.

## Files

- `openapi/frontend.yaml`, `meta.json`, `contract-lock.json` — versioned in
  git, read-only (only `npm run contract:fetch` writes them).
- `src/types/generated/api.d.ts` — generated, NOT versioned, regenerated on
  `postinstall` from `openapi/frontend.yaml`. Never edit by hand.

## Commands

`npm run contract:update` (fetch + generate) · `npm run contract:generate`
(offline) · `npm run contract:verify` (offline, runs in CI) ·
`npm run contract:drift` (scheduled CI only).

## Hard rules

- Do not edit `src/types/generated/api.d.ts`.
- Do not treat `[key: string]: unknown` as the permanent answer for a new API
  entity now that a contract exists.
- Do not assume two endpoints returning the "same" entity share a shape —
  use the specific endpoint's generated type.
- Do not migrate Orders, Pallets, Products, or Customers yet — see
  `FRONTEND_API_CONTRACT_AUDIT.md` and the "Módulos migrados" table in
  `.claude/rules/api-contract.md` for current status.
- Forms (Zod), ViewModels, and `queryKeys.ts` stay manual — the contract only
  covers API request/response types.

If you touch API types for any module, read `.claude/api-contract-guide.md`
first.
