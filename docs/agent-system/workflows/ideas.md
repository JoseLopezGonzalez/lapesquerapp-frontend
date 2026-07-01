# Ideas Workflow

## Purpose

Capture loose ideas without forcing a full GAP immediately.

## Storage

For Codex adapter v1, the active parking lot remains:

- `.claude/ideas/parking-lot.md`

Codex may write there only when Jose explicitly invokes `/idea`, `/ideas promote`
or asks to manage the idea backlog. Otherwise `.claude/**` remains read-only.

## Capture

For `/idea [text]`:

1. Read the parking lot.
2. Allocate the next `IDEA-NNN`.
3. Infer type and module without asking unless the input is unusable.
4. Append under parked ideas.
5. Confirm in one line.

Never write production code from idea capture.

## List

For `/ideas [module]`:

1. Read the parking lot.
2. List parked and promoted ideas.
3. Filter by module if supplied.
4. Do not modify files.

## Promote

For `/ideas promote [NNN]`:

1. Find the parked idea.
2. Run GAP Discovery with the idea as seed context.
3. Move the idea to promoted only after Jose confirms the GAP.
