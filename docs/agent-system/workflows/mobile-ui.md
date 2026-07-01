# Mobile UI Workflow

## Purpose

Use for creating, improving or reviewing mobile-first views in PesquerApp.

## Required Rules

- Use `useIsMobileSafe` from `src/hooks/use-mobile.jsx` for render switches.
- Do not use `useMediaQuery`.
- Do not change business logic while doing mobile UI work.
- Do not install new dependencies without approval.
- New files must be `.ts` or `.tsx`.
- Use existing mobile infrastructure: BottomNav, NavigationSheet, mobile tokens
  and existing mobile components.

## Workflow

1. Investigate the current view, route, layout, hooks and existing mobile code.
2. Present the mobile structure before coding when the change is broad.
3. Implement the smallest mobile layer that preserves desktop behavior.
4. Use Skeleton loading, clear empty states and visible error states.
5. Verify 375px and 390px widths, bottom navigation overlap, touch targets,
   dark mode and desktop preservation.

## Preview Branches

Claude-specific mobile preview branches are not part of the Codex default.
In local Codex work, edit the current branch unless Jose explicitly asks for a
preview branch workflow.
