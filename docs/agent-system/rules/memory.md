# Memory Rules

## Purpose

Project memory captures PesquerApp-specific rules, anti-patterns and corrections
that future agents must remember.

## Current Neutral Memory

The initial neutral memory mirror lives at:

- `docs/agent-system/memory/project-learnings.md`

Claude Code still maintains its own operational memory in `.claude/**`. Codex
must not modify `.claude/**` unless Jose explicitly asks.

## Adding New Memory

Only add a new memory entry when:

- Jose explicitly says to remember something.
- An audit finds a recurring pattern not covered by current rules.
- A user correction reveals a project-specific rule.
- A task took extra effort because stable context was missing.

Before writing:

1. Read the current memory file.
2. Check for duplicates or contradictions.
3. Propose the entry to Jose.
4. Write only after confirmation.

Entries must be concrete, project-specific and grounded in observed evidence.
