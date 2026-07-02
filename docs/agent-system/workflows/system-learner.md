# System Learner Workflow

## Purpose

Convert recurring corrections and discoveries into durable project memory.

## Triggers

Use when:

- Jose says to remember something.
- An audit finds an uncovered project-specific pattern.
- Jose corrects an agent in a way that should affect future work.
- A repeated failure shows missing instructions.

## Process

1. Read `.claude/project-learnings.md` (canonical memory file — as of 2026-07-02
   this is the single source of truth for both Claude Code and Codex; the old
   `docs/agent-system/memory/project-learnings.md` is now just a pointer to it,
   see `docs/agent-system/rules/memory.md`).
2. Check for duplicate or contradictory entries.
3. Classify the entry:
   - `AUDIT_RULE`
   - `CODEBASE_PATTERN`
   - `ANTI_PATTERN`
   - `CORRECTION`
4. Propose the new entry to Jose with evidence.
5. Write only after explicit confirmation — write directly to
   `.claude/project-learnings.md`, following its existing entry format (PL-NNN
   sequential ID, never reused).

## Restrictions

- Do not add vague best practices.
- Do not invent evidence.
- `.claude/project-learnings.md` is the one exception to "do not modify
  `.claude/**` from Codex" — Jose has explicitly authorized reading and writing
  this specific file from Codex to keep a single canonical memory. Do not touch
  any other path under `.claude/**`.
