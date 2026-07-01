# GitHub Copilot Instructions — La PesquerApp Frontend

La PesquerApp is a multi-tenant ERP for fishing and frozen seafood companies.

This repository contains the frontend application.

## Stack

- Next.js
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- API service layer
- Entity-driven screens and reusable components

## General instructions

When working in this repository:

- Respect the existing architecture.
- Prefer small, reviewable changes.
- Do not introduce new dependencies without justification.
- Do not invent backend fields or endpoints.
- Do not bypass the existing API service layer.
- Keep forms aligned with React Hook Form and Zod patterns.
- Keep UI dense, clear and practical for operational users.
- Avoid broad refactors unless the issue explicitly asks for it.
- For PRs, include a clear summary, changed files and suggested tests.

## Documentation

Check relevant documentation in:

- `docs/ai-context/`
- `docs/agent-system/`
- `docs/agents/`
- `docs/templates/`
- `docs/decisions/`

## Agent workflows

Use `docs/agent-system/` for GAP workflows, audits, mobile UI, idea parking and
project memory. Command mapping is documented in
`docs/agent-system/commands/README.md`.

Do not modify `.claude/**` by default. The only allowed exceptions are explicit
GAP workflow updates in `.claude/gaps/**` and explicit idea workflow updates in
`.claude/ideas/parking-lot.md`.

If generic AI guidance conflicts with La PesquerApp documentation, follow
La PesquerApp documentation.

Do not implement unrequested features.
Do not make destructive changes.
