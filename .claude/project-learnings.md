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

## DEPLOY_RULES

> Build and deploy failures observed in production (Vercel). Each entry documents a recurring pattern and the rule that prevents it.

### PL-BUILD-01

- **Date:** 2026-06-28/29
- **Source:** PR #50 post-mortem (rama claude/help-request-yimlz2)
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** 14+ commits seguidos corrigiendo errores de TypeScript uno a uno. Todos en estado ERROR en Vercel. Causa raíz: al migrar `.jsx` → `.tsx` (GAP-023), se generaron múltiples errores de tipos en cascada. Vercel con Turbopack solo reporta el primer error. El agente corregía uno por commit y pusheaba sin verificar que no había más. **Solución**: ejecutar `npm run type-check 2>&1` completo antes de pushear. Leer TODO el output. Resolver todos los errores del fichero antes de commitear.
- **Regla aplicada:** GIT POLICY → "NUNCA corregir un error de TypeScript en commit individual".

### PL-BUILD-02

- **Date:** 2026-06-28
- **Source:** GAP-025, GAP-027, GAP-028, GAP-029
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** Commits de refactorización al service layer fallaban en Vercel por imports con alias `@lib/` en lugar de `@/lib/`. El agente usó el alias sin verificar `tsconfig.json paths`. En local el bundler era más permisivo. **Solución**: antes de cualquier import nuevo, leer `tsconfig.json compilerOptions.paths`. El alias correcto es `@/` (con barra tras la arroba).
- **Regla aplicada:** GIT POLICY → "alias de paths".

### PL-BUILD-03

- **Date:** 2026-06-28
- **Source:** Múltiples commits "[GAP-xxx] Documentar..."
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** El agente hacía commit del código y luego un segundo commit solo con el GAP.md o project-learnings actualizado. Cada commit generaba un deploy en Vercel, contaminando el historial y añadiendo tiempo perdido. **Solución**: código y documentación van siempre en el mismo commit.
- **Regla aplicada:** GIT POLICY → "commits de documentación".

### PL-BUILD-04

- **Date:** 2026-06
- **Source:** General (observación continuada)
- **Category:** CODEBASE_PATTERN
- **Confidence:** HIGH
- **Entry:** Turbopack en Vercel es más estricto que `tsc --noEmit` en local. Código que compila sin errores localmente puede fallar en el build de Vercel por diferencias en resolución de módulos y tipos. El script `npm run type-check` es primera capa; el GitHub Action `build-check.yml` (que ejecuta `npm run build` completo en CI) es la segunda capa de seguridad. Si se detecta un error que pasa type-check pero falla en Vercel, documentar el patrón específico aquí.
- **Regla aplicada:** CI pipeline en `.github/workflows/build-check.yml`.

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
