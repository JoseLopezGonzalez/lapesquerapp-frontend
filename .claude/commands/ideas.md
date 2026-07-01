# Command: /ideas

## Purpose
List the idea parking lot and promote parked ideas into real GAPs when
they're ready to become work.

## Usage
```
/ideas                     — list everything, grouped by status
/ideas [módulo]             — scope the list to one module (e.g. /ideas Stock)
/ideas promote [NNN]        — promote IDEA-NNN into a GAP via gap-discovery
```

## Examples
```
/ideas
/ideas CRM
/ideas promote 5
```

## What `/ideas` (list) does

1. Read `.claude/ideas/parking-lot.md`.
2. Output inline in the chat (never delegate to a side panel), grouped:
   - **🅿️ Parked** — table or list: `IDEA-NNN` · tipo · módulo · descripción
   - **✅ Promoted** — same, plus the linked `GAP-NNN`
3. If a módulo argument was given, filter to that módulo only across both
   sections.
4. If the parking lot is empty, say so plainly — don't invent ideas.
5. End with a one-line nudge: `Para promocionar una: /ideas promote [NNN]`

## What `/ideas promote [NNN]` does

1. Read `.claude/ideas/parking-lot.md`, find `IDEA-NNN` under `## 🅿️ Parked`.
   - If it doesn't exist or is already promoted, say so and stop.
2. Hand off to the **gap-discovery** agent per its normal activation rules
   (CLAUDE.md → `.claude/agents/gap-discovery.md`), seeding it with the
   idea's Tipo, Módulo, and Descripción as the starting context. Discovery
   still runs its **full clarification protocol** — promotion skips nothing,
   it only avoids re-typing the initial description.
3. Once Discovery finishes and Jose confirms the GAP (per its own step 6-7),
   move the `IDEA-NNN` entry from `## 🅿️ Parked` to `## ✅ Promoted` in
   `.claude/ideas/parking-lot.md`, appending `- **Promovida a:** GAP-NNN`.
4. This is a single logical change to `parking-lot.md` — do it in the same
   turn as the GAP being written, not as a separate lingering step.

## Important notes
- `/ideas` (list/filter) never modifies files — read-only.
- `/ideas promote` never writes GAP content itself — that's exclusively
  gap-discovery's job, with its own restrictions (never write production
  code, never assume business logic, full Q&A before writing).
- If Jose abandons the promotion mid-flow (doesn't confirm the GAP), leave
  the idea as `🅿️ Parked` — do not mark it promoted on a GAP that was never
  confirmed.
