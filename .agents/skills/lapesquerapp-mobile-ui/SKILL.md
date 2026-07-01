---
name: lapesquerapp-mobile-ui
description: Builds, improves, or reviews La PesquerApp mobile UI. Use for '/mobile [vista]', mobile-first ERP screens, responsive switches, BottomNav-safe layouts, mobile CRUD, touch-target fixes, and mobile UX implementation.
---

# La PesquerApp Mobile UI

Read before acting:

- `AGENTS.md`
- `docs/agent-system/workflows/mobile-ui.md`
- `docs/agent-system/rules/design.md`
- `docs/agent-system/rules/components.md`
- `docs/ai-context/02-ui-conventions.md`
- `docs/ai-context/06-design-system.md`

## Rules

- Use `useIsMobileSafe`; do not use `useMediaQuery`.
- Preserve desktop behavior.
- Do not change business logic while doing mobile UI work.
- Use existing mobile infrastructure and shadcn primitives.
- New files must be `.ts` or `.tsx`.
- Verify 375px, 390px, bottom nav overlap, touch targets and dark mode.
