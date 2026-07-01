---
name: lapesquerapp-ideas
description: Manages the La PesquerApp idea parking workflow. Use for '/idea [text]', '/ideas', '/ideas [module]', '/ideas promote [NNN]', quick idea capture, listing parked ideas, and promoting ideas into GAP Discovery.
---

# La PesquerApp Ideas

Read before acting:

- `docs/agent-system/workflows/ideas.md`
- `docs/agent-system/workflows/gap-workflow.md` when promoting

## Rules

- For `/idea`, capture quickly without asking follow-up questions unless the
  text is unusable.
- For `/ideas`, list only; do not modify files.
- For `/ideas promote`, run GAP Discovery and only mark promoted after Jose
  confirms the GAP.
- Do not write production code from the ideas workflow.
- Do not modify `.claude/**` except the parking lot during explicit idea
  workflow actions.
