---
name: lapesquerapp-design-audit
description: Runs La PesquerApp design-quality audits for '/audit-design visual', '/audit-design copy', and '/audit-design consistency'. Use for visual craft, copy/content quality, terminology drift, capitalization, message clarity, cross-view consistency, shadcn native feel, rhythm, hierarchy, proportion, balance, and design outlier reviews.
---

# La PesquerApp Design Audit

Read before acting:

- `AGENTS.md`
- `docs/agent-system/workflows/design-audit.md`
- `docs/agent-system/rules/design.md`
- `docs/agent-system/rules/components.md`
- `docs/agent-system/memory/project-learnings.md`
- `docs/ai-context/02-ui-conventions.md`
- `docs/ai-context/06-design-system.md`

## Modes

- `visual`: composition craft, preferably screenshot-based; heuristic fallback
  must be tagged as heuristic.
- `copy`: user-facing text, terminology, tone, capitalization and message
  quality.
- `consistency`: cross-view drift across UI families.

## Rules

- Audit only; do not implement fixes.
- Present inventory before broad audits.
- Do not download Playwright browser binaries without Jose's explicit approval.
- Do not treat heuristic visual findings as confirmed.
- Offer GAP creation only after Jose approves findings.
