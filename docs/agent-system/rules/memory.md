# Memory Rules

## Purpose

Project memory captures PesquerApp-specific rules, anti-patterns and corrections
that future agents must remember.

## Current Canonical Memory

As of 2026-07-02, there is a **single canonical memory file** for the whole
project, shared by Claude Code and Codex:

- `.claude/project-learnings.md`

`docs/agent-system/memory/project-learnings.md` used to be a separate mirror for
Codex, but it drifted out of sync with the Claude copy (23 vs 32 entries, never
reconciled) because nothing synchronized the two. It is now a pointer file only
— read `.claude/project-learnings.md` directly instead.

This is the one explicit exception to "Codex must not modify `.claude/**`
unless Jose explicitly asks" (see `docs/agent-system/README.md` § Operating
Principles #3) — Jose has authorized Codex to read and write
`.claude/project-learnings.md` specifically, to avoid re-introducing the same
drift. No other path under `.claude/**` is included in this exception.

## Adding New Memory

Only add a new memory entry when:

- Jose explicitly says to remember something.
- An audit finds a recurring pattern not covered by current rules.
- A user correction reveals a project-specific rule.
- A task took extra effort because stable context was missing.

Before writing:

1. Read `.claude/project-learnings.md` (the current memory file).
2. Check for duplicates or contradictions.
3. Propose the entry to Jose.
4. Write only after confirmation, directly to `.claude/project-learnings.md`,
   following its existing PL-NNN entry format.

Entries must be concrete, project-specific and grounded in observed evidence.
