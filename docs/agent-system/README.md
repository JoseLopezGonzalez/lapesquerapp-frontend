# Agent System — La PesquerApp

This folder is the tool-neutral agent system for La PesquerApp frontend.

It exists so Codex can use the same professional workflows that were first
developed for Claude Code, without depending on `.claude/**` as runtime
instructions.

## Status

- `docs/agent-system/` is the neutral source for new agent workflows.
- `.agents/skills/lapesquerapp-*` is the Codex adapter layer.
- `.claude/**` remains untouched and continues to serve Claude Code.
- Migration of Claude Code to this neutral layer is intentionally out of scope
  for the first Codex adapter.

## Structure

| Path | Purpose |
| --- | --- |
| `rules/` | Project rules grouped by technical area. |
| `workflows/` | Multi-step procedures such as GAP, code/UI/design audit, mobile, ideas and memory. |
| `commands/` | Claude-like command mapping for tools that do not have slash commands. |
| `agents/` | Portable role definitions. |
| `memory/` | Pointer to the canonical memory file — `.claude/project-learnings.md` is the single source of truth as of 2026-07-02, see `rules/memory.md`. |
| `gaps/` | Notes about GAP storage and future migration. |
| `adapters.md` | How Codex, Cursor, Copilot and Claude consume this system. |
| `generic-agent-quickstart.md` | Minimal entrypoint for tools without native adapters. |
| `smoke-tests.md` | Manual checks to confirm adapters activate in fresh tool sessions. |

## Operating Principles

1. Keep tool-specific behavior in adapters.
2. Keep project knowledge in `docs/ai-context/` and `docs/agent-system/`.
3. Do not edit `.claude/**` from Codex workflows unless Jose explicitly asks.
4. Prefer small, reviewable changes.
5. Never bypass the service layer, invent backend fields or hardcode tenant data.

## Required Reads

For non-trivial implementation work, read:

- `AGENTS.md`
- `docs/ai-context/00-project-brief.md`
- `docs/ai-context/01-frontend-architecture.md`
- `docs/ai-context/02-ui-conventions.md`
- `docs/ai-context/03-form-system.md`
- `docs/ai-context/04-api-services.md`
- `docs/ai-context/05-entity-client.md`
- `docs/ai-context/10-current-priorities.md`
- Relevant files in `docs/agent-system/rules/`

For tool-specific activation behavior, read:

- `docs/agent-system/adapters.md`
- `docs/agent-system/commands/README.md`
- `docs/agent-system/generic-agent-quickstart.md`
- `docs/agent-system/smoke-tests.md`
