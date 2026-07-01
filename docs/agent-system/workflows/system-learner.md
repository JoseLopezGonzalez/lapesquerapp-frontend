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

1. Read `docs/agent-system/memory/project-learnings.md`.
2. Check for duplicate or contradictory entries.
3. Classify the entry:
   - `AUDIT_RULE`
   - `CODEBASE_PATTERN`
   - `ANTI_PATTERN`
   - `CORRECTION`
4. Propose the new entry to Jose with evidence.
5. Write only after explicit confirmation.

## Restrictions

- Do not add vague best practices.
- Do not invent evidence.
- Do not modify `.claude/**` from Codex system learner unless Jose explicitly
  asks to synchronize Claude memory too.
