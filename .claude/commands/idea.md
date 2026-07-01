# Command: /idea

## Purpose
Capture a loose idea, bug, or feature thought into the parking lot
(`.claude/ideas/parking-lot.md`) with zero friction. No clarification
questions, no GAP structure — just get it written down before it's lost.

This is deliberately lighter than the GAP Discovery flow. `/idea` never asks
questions and never writes production code.

## Usage
```
/idea [texto libre describiendo la idea, bug o feature]
```

## Examples
```
/idea el filtro de fecha en pedidos no persiste al cambiar de pestaña
/idea sería útil poder duplicar una liquidación de proveedor
/idea el kanban de stores en mobile podría tener drag & drop
```

## What this command does

1. Read `.claude/ideas/parking-lot.md`.
2. Determine the next `IDEA-NNN` number: scan all entries under both
   `## 🅿️ Parked` and `## ✅ Promoted` sections, take the highest number found,
   +1. If none exist, start at `IDEA-001`.
3. Infer from the free text (do not ask the user — make a reasonable call):
   - **Tipo:** Bug | Feature | Mejora | Refactor
   - **Módulo:** best-guess module from CLAUDE.md's module table, or `Global`
     if unclear
   - **Descripción:** tighten the user's text into 1-2 clear lines — do not
     invent details or expand scope beyond what was said
4. Append a new entry under `## 🅿️ Parked` in `.claude/ideas/parking-lot.md`
   using the format defined at the bottom of that file. Today's date for
   `Fecha`.
5. Confirm back to Jose in **one line**:
   ```
   🅿️ IDEA-NNN parked: [título breve]
   ```
   Do not summarize the whole file, do not ask follow-up questions, do not
   propose a solution. This command's only job is fast capture.

## Important notes
- Never write production code from this command.
- Never touch `.claude/gaps/` from this command — that only happens via
  `/ideas promote [NNN]`.
- If the free text is genuinely too vague to classify (single ambiguous word),
  it's fine to leave Módulo as `Global` and Descripción as close to verbatim —
  don't block capture on ambiguity. Ambiguity gets resolved later, at
  promotion time, by `gap-discovery`.
