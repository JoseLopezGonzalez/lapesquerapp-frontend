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

Design-quality audit is exposed through `lapesquerapp-design-audit` and the
`/audit-design visual|copy|consistency` command family.

## Cursor

Cursor uses:

- `.cursor/rules/05-agent-system.mdc`
- `.cursor/rules/06-project-skills.mdc`
- `.cursor/rules/15-gap-workflow.mdc`
- `.cursor/rules/16-audit-workflows.mdc`
- `.cursor/rules/17-design-audit.mdc`
- Existing role-specific rules in `.cursor/rules/`

Cursor rules point to `docs/agent-system/` so any model used inside Cursor can
follow the same workflows.

Project skills are exposed to Cursor through
`.cursor/rules/06-project-skills.mdc`. Cursor agents should treat it as a
compact index, then read the matching `.agents/skills/<skill>/SKILL.md` only
when the user intent requires that skill.

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
