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

## Codex agent system

Codex-specific workflows live in `.agents/skills/lapesquerapp-*`.

Tool-neutral agent documentation lives in:

- `docs/agent-system/`

This folder contains portable rules, workflows, command mappings, operational
roles, memory and GAP migration notes. It is the preferred source for new
Codex-native behavior.

### Codex command mapping

When the user invokes a Claude-like command, Codex must map it to the matching
Codex skill/workflow:

| User input | Codex behavior |
| --- | --- |
| `/audit-code quality\|migrate\|arch [scope]` | Use `lapesquerapp-code-audit`. |
| `/audit-mobile [scope]` | Use `lapesquerapp-ui-audit` in mobile mode. |
| `/audit-desktop [scope]` | Use `lapesquerapp-ui-audit` in desktop mode. |
| `/audit-design visual\|copy\|consistency [scope]` | Use `lapesquerapp-design-audit`. |
| `/mobile [view]` | Use `lapesquerapp-mobile-ui`. |
| `/idea [text]` | Use `lapesquerapp-ideas` capture mode. |
| `/ideas [module]` | Use `lapesquerapp-ideas` list mode. |
| `/ideas promote [NNN]` | Use `lapesquerapp-gap-discovery`. |
| `crea un GAP`, `documenta este cambio` | Use `lapesquerapp-gap-discovery`. |
| `implementa GAP-NNN` | Use `lapesquerapp-gap-implementor`. |
| `audita GAP-NNN` | Use `lapesquerapp-gap-auditor`. |
| `recuerda esto`, `añade esto al sistema` | Use `lapesquerapp-system-learner`. |

Detailed mappings are documented in `docs/agent-system/commands/README.md`.

### Claude Code compatibility boundary

The existing Claude Code ecosystem remains in `.claude/**`.

Codex must treat `.claude/**` as read-only by default. Do not modify, move,
delete or rewrite Claude-specific files unless the user explicitly requests that
exact action.

Limited exceptions:

- GAP workflow actions may read and update `.claude/gaps/**` because that is
  still the active GAP store for v1.
- Idea workflow actions may read and update `.claude/ideas/parking-lot.md`
  when the user invokes `/idea`, `/ideas`, or `/ideas promote`.

Do not migrate Claude Code to `docs/agent-system/` until Jose explicitly asks.

### Rule precedence

When a generic skill conflicts with La PesquerApp-specific documentation, follow
La PesquerApp documentation.

Important examples:

- Forms follow `docs/ai-context/03-form-system.md`: React Hook Form with
  `register()` and `Controller`, not the default shadcn `FormField` pattern.
- API calls follow the existing service layer and `fetchWithTenant` rules.
- UI work follows the operational ERP design rules in `docs/ai-context/` and
  `docs/agent-system/rules/design.md`.

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
