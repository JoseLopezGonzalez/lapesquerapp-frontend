# PesquerApp — Project Learnings
> This file is maintained exclusively by the system-learner agent.
> Do not edit manually unless correcting an error.
> Last updated: 2026-06-27
> Total entries: 6

## How this file works

Every entry has:
- **ID:** PL-NNN (sequential, never reused)
- **Date discovered**
- **Source:** which agent or correction triggered this
- **Category:** AUDIT_RULE / CODEBASE_PATTERN / ANTI_PATTERN / CORRECTION
- **Confidence:** HIGH (found in 3+ places or confirmed by Jose) / MEDIUM (found once, not yet confirmed)
- **Entry:** the actual rule, pattern, or finding

**Agents that must read this file before working:**
- `gap-discovery` (before writing any GAP)
- `gap-auditor` (before running any checklist)
- `ux-reviewer` (before simulating any flow)
- `ui-audit-agent` (before starting any audit)
- `code-audit-agent` (before starting any audit)
- `system-learner` (always, to avoid duplicates)

---

## AUDIT_RULES
> Rules the auditor must actively check for — discovered through experience, not preset.
> These extend the checklists in gap-auditor.md and design-context.md.

[No entries yet — first entries will be added by system-learner as audits run]

---

## CODEBASE_PATTERNS
> How this specific project does things. Discovered by reading the actual codebase.
> These are facts about PesquerApp, not general best practices.

### PL-005
- **Date:** 2026-06-27
- **Source:** Codebase audit Phase 1 (v2.0 upgrade)
- **Category:** CODEBASE_PATTERN
- **Confidence:** HIGH
- **Entry:** `EntityBody` is the canonical table pattern in PesquerApp. Always use
  `EntityBody` for list views — never raw TanStack Table without the wrapper.
  `EntityBody` provides: 17-row Skeleton loading, `AccordionBody` mobile variant,
  backdrop-blur-sm processing overlay, and standardized empty/error states.

### PL-006
- **Date:** 2026-06-27
- **Source:** Codebase audit Phase 1 (v2.0 upgrade)
- **Category:** CODEBASE_PATTERN
- **Confidence:** HIGH
- **Entry:** shadcn components must be used natively with zero className overrides
  unless the override is explicitly documented in `design-context.md`. When a
  variant or style deviation is needed, create a shadcn variant — do not
  override with className. This is the single most common quality issue found
  in UI reviews.

---

## ANTI_PATTERNS
> Mistakes found in the codebase, recurring errors, things that must not be repeated.
> Each entry includes the files where the anti-pattern was found.

### PL-001
- **Date:** 2026-06-27
- **Source:** GAP-004 audit (useOrderDocuments)
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** `useOrderDocuments` calls `fetchWithTenant` directly from the hook,
  bypassing the service layer. Binary file downloads must go through a dedicated
  service method (e.g. `downloadOrderDocument()` in `orderService.ts`), not called
  directly from hooks. No follow-up GAP exists yet.
- **Status:** Still live in production. No follow-up GAP exists.

### PL-002
- **Date:** 2026-06-27
- **Source:** GAP-008 audit (LoginFormContent.tsx)
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** `LoginFormContent.tsx` uses `eslint-disable` to suppress a rules-of-hooks
  violation instead of extracting an `OtpCodeWatcher` sub-component. `eslint-disable`
  is never acceptable as a permanent fix for rules-of-hooks violations.
  The correct fix is extracting the offending logic into a separate component.
- **Status:** Still live in production. No follow-up GAP exists.

### PL-003
- **Date:** 2026-06-27
- **Source:** GAP-007 audit (entitiesConfig split)
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** `entitiesConfig.orders.ts` (839 lines) and `entitiesConfig.admin.ts`
  (946 lines) exceed the 300-line criterion established when splitting
  `entitiesConfig.js`. These files need further domain splitting.
- **Status:** Flagged in GAP-007 auditor section. No follow-up GAP exists.

### PL-004
- **Date:** 2026-06-27
- **Source:** GAP-005 audit (usePalletBoxOperations)
- **Category:** ANTI_PATTERN
- **Confidence:** MEDIUM
- **Entry:** `React.Dispatch` used without explicit import in `usePalletBoxOperations`
  and `usePalletBoxCreation`. Always import `Dispatch` explicitly:
  `import { Dispatch } from 'react'` — never rely on global React namespace.

---

## CORRECTIONS_LOG
> Things Jose corrected manually that the agents missed or got wrong.
> Each entry is translated into a concrete rule to prevent recurrence.

### PL-007
- **Date:** 2026-06-27
- **Source:** Jose correction during /audit-mobile Phase 4 (GAP creation Q&A)
- **Category:** CORRECTION
- **Confidence:** HIGH
- **Entry:** All questions presented by any agent (gap-discovery, gap-auditor, ux-reviewer,
  ui-audit-agent, or any other) MUST mark which option the agent recommends. No question
  block is valid without a recommendation marker. Format: append "(Recomendada)" to the
  recommended option. This applies to: clarification questions, UI Brief confirmation
  questions, AskUserQuestion calls, and any other structured Q&A format. A question block
  without a recommended option is considered incomplete and must be rewritten before
  Jose can answer.
