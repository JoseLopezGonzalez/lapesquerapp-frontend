# ADR-0004 — Documentation Agent Role

## Decision

A Documentation Agent role is established as a named, bounded agent responsible for maintaining and updating all project documentation.

## Reason

As the codebase grows and AI-assisted development becomes part of the workflow, documentation risks becoming stale faster than it is updated. A dedicated Documentation Agent role clarifies responsibility and provides a reusable activation prompt for documentation tasks.

## Scope

The Documentation Agent is responsible for:

- `AGENTS.md`, `CLAUDE.md`
- `.cursor/rules/*.mdc`
- `.github/copilot-instructions.md`, `.github/instructions/*.md`
- `docs/ai-context/*.md`
- `docs/agents/*.md`
- `docs/decisions/*.md`
- `docs/templates/*.md`

## What the agent must NOT do

- Change functional code.
- Invent decisions.
- Delete documentation without confirmation.

## Activation phrase

```
Actúa como Documentation Agent de La PesquerApp. Revisa el estado actual de la documentación en docs/ai-context/ y dime qué está desactualizado o falta.
```

## Impact

Documentation tasks can be delegated to a named agent with clear constraints, reducing the risk of stale or inconsistent documentation.

## Date

2026-04-26

## Status

accepted
