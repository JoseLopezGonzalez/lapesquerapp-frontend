# AGENTS.md — La PesquerApp Frontend

## Project

La PesquerApp is a multi-tenant ERP for the fishing and frozen seafood sector.

This repository contains the frontend application.

The frontend is responsible for operational screens and workflows related to:

- customers;
- suppliers;
- products;
- product families and categories;
- orders;
- logistics;
- warehouses;
- pallets;
- boxes;
- lots;
- production;
- traceability;
- incidents;
- time tracking;
- sector catalogs;
- business administration screens;
- lonja document extraction and ERP export (MarketDataExtractor).

The backend is a Laravel API exposed through `/api/v2`.

## Stack

The frontend uses:

- Next.js;
- Tailwind CSS;
- shadcn/ui;
- React Hook Form;
- Zod;
- reusable components;
- service-based API access;
- modals;
- data tables;
- entity-driven screens.

## AI agent operating principles

AI agents working in this repository must behave like members of a professional software team.

They must:

1. Understand the existing structure before changing files.
2. Respect current conventions.
3. Prefer small, safe and reviewable changes.
4. Avoid inventing unrequested features.
5. Avoid broad refactors unless explicitly requested.
6. Avoid adding dependencies without approval.
7. Keep UI practical, clear and consistent.
8. Keep forms reliable and aligned with backend payloads.
9. Keep API calls inside the existing service layer.
10. Explain assumptions, risks and affected files.

## Essential documentation

Before non-trivial work, read the relevant files in:

- `docs/ai-context/00-project-brief.md`
- `docs/ai-context/01-frontend-architecture.md`
- `docs/ai-context/02-ui-conventions.md`
- `docs/ai-context/03-form-system.md`
- `docs/ai-context/04-api-services.md`
- `docs/ai-context/05-entity-client.md`
- `docs/ai-context/10-current-priorities.md`

For agent roles, check:

- `docs/agents/`

For reusable output formats, check:

- `docs/templates/`

For architectural and product decisions, check:

- `docs/decisions/`

## Standard implementation response

For implementation tasks, return:

1. What you understood.
2. Files you inspected.
3. Files you plan to touch.
4. Implementation plan.
5. Risks or assumptions.
6. Changes made.
7. Suggested tests or manual checks.

## Forbidden behavior

Do not:

- rewrite large parts of the codebase without approval;
- introduce new state management patterns without justification;
- bypass existing API services;
- duplicate form logic unnecessarily;
- add UI libraries without approval;
- invent backend fields;
- assume API responses without checking existing services/types;
- add unnecessary animations to operational screens;
- break existing entity/table/form patterns;
- expose tokens, tenant data or sensitive information;
- implement features outside the requested scope.
