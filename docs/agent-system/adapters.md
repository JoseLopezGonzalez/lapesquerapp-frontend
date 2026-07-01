# Agent Adapters

This document explains how each AI tool consumes the neutral agent system.

## Neutral source

Shared source of truth:

- `AGENTS.md`
- `docs/agent-system/`
- `docs/ai-context/`
- `docs/templates/`
- `docs/decisions/`

## Codex

Codex uses:

- `.agents/skills/lapesquerapp-*`
- `AGENTS.md`
- `docs/agent-system/`

Codex skills are thin adapters. They trigger on user intent and load the
relevant neutral workflow.

After adding or changing skills, start a fresh Codex session so the skill
metadata is re-indexed.

## Cursor

Cursor uses:

- `.cursor/rules/05-agent-system.mdc`
- `.cursor/rules/15-gap-workflow.mdc`
- `.cursor/rules/16-audit-workflows.mdc`
- Existing role-specific rules in `.cursor/rules/`

Cursor rules point to `docs/agent-system/` so any model used inside Cursor can
follow the same workflows.

## GitHub Copilot

Copilot uses:

- `.github/copilot-instructions.md`
- `.github/instructions/agent-system.instructions.md`
- Existing scoped instruction files in `.github/instructions/`

These files cannot behave like Codex skills, but they expose the same source of
truth and command mapping.

## Claude Code

Claude Code still uses:

- `CLAUDE.md`
- `.claude/**`

Claude migration to `docs/agent-system/` is not part of the Codex/Cursor v1
adapter. Do not edit `.claude/**` unless Jose explicitly asks for that migration.
