# PesquerApp — Project Learnings

> This file is maintained exclusively by the system-learner agent.
> Do not edit manually unless correcting an error.
> Last updated: 2026-07-28
> Total entries: 36

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
- `gap-implementor` (before implementing any GAP)
- `gap-auditor` (before running any checklist)
- `ux-reviewer` (before simulating any flow)
- `ui-audit-agent` (before starting any audit)
- `code-audit-agent` (before starting any audit)
- `design-quality-auditor` (before starting any audit)
- `skeleton-fidelity-auditor` (before starting any audit)
- `domain-business-auditor` (before starting any audit)
- `permissions-multitenant-auditor` (before starting any audit)
- `frontend-developer` (before implementing any feature)
- `mobile-ui-agent` (before implementing any mobile view)
- `system-learner` (always, to avoid duplicates)

---

## AUDIT_RULES

> Rules the auditor must actively check for — discovered through experience, not preset.
> These extend the checklists in gap-auditor.md and design-context.md.

### PL-016
- **Date:** 2026-06-30
- **Source:** /audit-desktop Phase 5 (system-learner)
- **Category:** AUDIT_RULE
- **Confidence:** HIGH
- **Entry:** `// @ts-nocheck` a nivel de fichero nunca es aceptable como solución permanente.
  Suprimir TypeScript para el archivo completo oculta errores reales y viola strict mode.
  Si un `.tsx` tiene errores en cascada tras una migración, aplicar el protocolo PL-012:
  leer todo el output de `npm run type-check`, corregir TODOS los errores del fichero antes de pushear.
  Nunca resolver errores de migración con `@ts-nocheck`.
- **Found in:** `src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx:1`
- **Status:** Follow-up: GAP-039.

### PL-022
- **Date:** 2026-07-01
- **Source:** /audit-desktop order editor (system-learner)
- **Category:** AUDIT_RULE
- **Confidence:** HIGH
- **Entry:** `useIsMobile` (la variante sin guard de `mounted`) usado para render condicional
  estructural (ternarios que cambian el árbol de componentes, no solo una clase CSS) recurre
  en 3+ módulos distintos pese a que el propio docstring de `src/hooks/use-mobile.jsx` lo
  desaconseja explícitamente: CRM (`GAP-042-useismobile-safe-admin-crm`), Field app
  (`GAP-016-field-app-useismobile-render-condicional`), y 15 archivos del editor de pedidos
  (`GAP-067`). **Regla:** cualquier auditoría de UI (mobile o desktop) debe ejecutar
  `grep -rn "useIsMobile()" --include="*.tsx" --include="*.ts" --include="*.js" --include="*.jsx"`
  sobre el módulo completo como paso estándar inicial, no solo revisar los archivos
  muestreados — el patrón recurre lo suficiente como para justificar un grep exhaustivo
  desde el principio en vez de un spot-check.
- **Found in:** `src/app/admin/orders/[id]/OrderClient.js` y 14 archivos más bajo
  `src/components/Admin/OrdersManager/Order/` (ver GAP-067 para el listado completo)
- **Status:** Follow-up: GAP-067.

### PL-023
- **Date:** 2026-07-01
- **Source:** /audit-design visual order editor (system-learner)
- **Category:** AUDIT_RULE
- **Confidence:** HIGH
- **Entry:** El componente `<Loader>` (spinner de sesión/auth) se usa como estado de carga de
  datos en 2 archivos / 3 sitios del editor de pedidos, pese a estar documentado en
  `design-context.md` § Loading States como exclusivo para gates de sesión/auth de página
  completa — nunca como reemplazo de `Skeleton` para carga de datos. **Regla:** cualquier
  auditoría de UI debe ejecutar `grep -rn "<Loader\b"` sobre componentes de tab/sección y
  verificar en cada resultado que no está sustituyendo un `Skeleton` de carga de datos.
- **Found in:** `src/components/Admin/OrdersManager/Order/components/OrderSectionContentMobile.jsx:10-30`
  (fallback de Suspense para secciones lazy en móvil, mientras el equivalente desktop en
  `OrderTabsDesktop.jsx:79-84` sí usa `Skeleton` correctamente) y
  `src/components/Admin/OrdersManager/Order/OrderCustomerHistory/components/CustomerOrderHistoryView/index.jsx:51,62,196-198,241-242`
  (carga inicial y recarga al filtrar).
- **Status:** Follow-up: GAP-078.

### PL-026
- **Date:** 2026-07-01
- **Source:** /audit-design visual order editor (system-learner)
- **Category:** AUDIT_RULE
- **Confidence:** HIGH
- **Entry:** Antes de marcar "falta skeleton de carga inicial" como hallazgo, verificar si el
  componente lee datos ya cargados desde el contexto padre (p.ej. `useOrderContext()`) que ya
  gatea el render completo detrás de su propio `Skeleton` de página completa antes de montar
  cualquier tab/sección hija. Un componente hijo sin su propia rama `isLoading` no es un bug si
  el padre ya garantiza que los datos existen antes de renderizarlo. **Regla:** verificar la
  fuente de datos (contexto vs query propia) antes de reportar un hallazgo de "falta skeleton".
- **Found in:** Dos hallazgos descartados en esta sesión tras verificación —
  `OrderPlannedProductDetails/index.js` y `OrderProductDetails/index.js` ambos leen `order` de
  `useOrderContext()`, ya gateado por `Order/index.tsx:148-166`.
- **Status:** Corregido en el mismo audit antes de generar GAPs (no se creó GAP para el falso
  positivo).

### PL-027
- **Date:** 2026-07-02
- **Source:** /audit-skeletons orders manager (skeleton-fidelity-auditor)
- **Category:** AUDIT_RULE
- **Confidence:** HIGH
- **Entry:** Los skeletons de carga del módulo Orders Manager repiten un mismo hueco de
  fidelidad: el markup del skeleton no tiene rama `isMobile` (o la ignora) aunque el
  componente real al que sustituye sí ramifica por `isMobile` — ya sea cambiando el número de
  columnas (`grid-cols-1` en mobile vs grid multi-columna en desktop) o cambiando a un árbol
  de componentes totalmente distinto (p.ej. la card estrecha centrada de `OrderSectionList`
  frente al `Card`+barra de tabs de `OrderTabsDesktop`). Encontrado en 3 archivos distintos en
  una sola pasada de auditoría. **Regla:** cuando el componente real ramifica por `isMobile`,
  comprobar con grep que el skeleton correspondiente tiene la misma rama antes de asumir que
  ya está cubierto — un skeleton que "parece correcto" en un viewport a menudo omite
  silenciosamente el otro.
- **Found in:** `OrdersManagerLayout.jsx:16-27`, `Order/index.tsx:148-165`,
  `OrderEditSheet/index.js:446-471` (`OrderEditFormSkeleton`),
  `OrderCostAnalysis/index.jsx:206-222`.
- **Status:** Follow-up: GAP-111, GAP-112, GAP-113, GAP-114.

### PL-030
- **Date:** 2026-07-28
- **Source:** GAP-123 (Fase D landing — blog + GEO/AEO), auditoría — System Learner check candidate 1b
- **Category:** AUDIT_RULE
- **Confidence:** HIGH
- **Entry:** Ninguna verificación de i18n (en un GAP, en una auditoría, o en el self-check del
  implementador) puede darse por completa comprobando solo `<title>`/`generateMetadata`/
  `alternates.languages` o el código de estado HTTP (`curl -o /dev/null -w "%{http_code}"`). Esas
  tres señales pueden estar perfectamente correctas mientras el **body** entero se sirve en el
  locale por defecto — exactamente lo que ocurrió en Fases B1/B2/C hasta GAP-123, invisible en 4
  auditorías previas. **Regla:** cualquier verificación de i18n futura debe inspeccionar
  contenido de body real (`<h1>`, texto visible, `href` de navegación) en al menos una ruta
  prefijada por locale (`/pt/*` o `/en/*`), e idealmente con **verificación intercalada**
  (varias requests a distintos locales en secuencia, p.ej. es/pt/en/pt/en/es/pt) para descartar
  bugs de caché o de contexto de request compartido entre locales — el bug real de este GAP era
  intermitente/dependiente del orden de requests hasta que se corrigió por completo (ver PL-031).
- **Found in:** Verificación manual de `/pt/pricing`, `/en/legal/privacy` y home en `/pt` durante
  GAP-123 — el `<title>` estaba correctamente traducido pero el `<h1>`/cuerpo visible se servía
  en español.
- **Status:** Aplicado en el cierre de GAP-123 (7 rondas intercaladas es/pt/en sobre
  `/pricing` y `/blog/etiquetado-normativa-pesca`). Aplicable a `landing-auditor` y a cualquier
  `gap-auditor` que audite un GAP bajo `src/app/[locale]/`.

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

### PL-020

- **Date:** 2026-07-01
- **Source:** /audit-code migrate orders manager
- **Category:** CODEBASE_PATTERN
- **Confidence:** HIGH
- **Entry:** `react-icons` (Bs/Ri/Pi/Fa/Tb) es un patrón establecido y aceptado en PesquerApp
  específicamente para iconos de marca/formato de archivo que Lucide React no cubre
  (Excel, PDF, logos). No es una desviación aislada como el caso de `@heroicons` (PL-015).
  Regla: Lucide React para iconografía general de UI; `react-icons` solo para logos de
  marca/formato de archivo sin equivalente en Lucide.
- **Found in:** 20 archivos del proyecto — `EntityClient/index.js`, `OrderExport/index.js`,
  `StoreCard/index.js`, varios cards de `Dashboard/`, etc. (`PiMicrosoftExcelLogo*`,
  `FaRegFilePdf`, `BsFileEarmarkPdf`, `RiFileExcel2Line`, `TbTruckLoading`, `PiChartLineUp`)

### PL-028

- **Date:** 2026-07-24
- **Source:** Jose — fix de desbordamiento en OrderDetails/InfoRow y OrderAttachments/AttachmentViewer, confirmado como patrón a mantener
- **Category:** CODEBASE_PATTERN
- **Confidence:** HIGH
- **Entry:** Patrón establecido para valores de texto de longitud variable (nombres, formas
  de pago, nombres de archivo, direcciones…) dentro de una fila `flex`: `truncate` por sí
  solo no basta si el elemento es hijo directo de un contenedor `flex` — por defecto los
  flex items tienen `min-width: auto` y se niegan a encoger por debajo del ancho de su
  contenido, desbordando la fila/card/dialog completo aunque tengan `truncate`. **Regla:**
  cualquier `<span>`/`<p>` con `truncate` dentro de un `flex` DEBE llevar también `min-w-0`
  (y normalmente `flex-1` si debe ocupar el espacio disponible). Además, mostrar el texto
  completo al pasar el cursor: atributo nativo `title={valor}` para casos simples, o
  `Tooltip`/`TooltipTrigger`/`TooltipContent` de shadcn envuelto en `TooltipProvider`
  cuando se quiere un tooltip estilizado consistente con el resto de la UI. Documentado
  como regla obligatoria en `.claude/rules/components.md` § "Truncado de texto + Tooltip".
- **Found in:** `src/components/Admin/OrdersManager/Order/OrderDetails/index.tsx`
  (`InfoRow` — el `<span>` de valor tenía `truncate` pero no `min-w-0`) y
  `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx` (toolbar de
  `AttachmentViewer` — mismo bug en el `<p>` del nombre de archivo).
- **Status:** Corregido en ambos archivos el 2026-07-24. Candidato a check en futuras
  auditorías de UI (`ui-audit-agent`, `design-quality-auditor`): grep de `truncate` sin
  `min-w-0` dentro de contenedores `flex`.

### PL-032

- **Date:** 2026-07-28
- **Source:** GAP-123 (Fase D landing — blog + GEO/AEO), implementación — System Learner check candidate 2
- **Category:** CODEBASE_PATTERN
- **Confidence:** MEDIUM
- **Entry:** Para contenido versionado en git con frontmatter (blog, páginas pilar de topic
  cluster, casos de estudio futuros), el patrón del proyecto es "registro estático +
  `meta.ts` tipado por carpeta de contenido": una carpeta por pieza de contenido con un
  archivo `.md` por locale (solo cuerpo, sin frontmatter) y un `meta.ts` único que exporta un
  `Record<Locale, Frontmatter>` tipado, leído en build/request time con `fs`/`path` desde un
  repository server-only (nunca desde un Client Component). Evita parsear frontmatter en
  runtime (sin `gray-matter`), da autocompletado y type-safety completos, y es coherente con
  "TypeScript first" (`.claude/rules/typescript.md`). El registro estático de slugs sigue el
  mismo patrón ya usado para los tiers de pricing (`TIER_KEYS` en `pricing/page.tsx`).
- **Found in:** `src/lib/blog/blogRepository.ts` + `src/content/blog/{slug}/meta.ts` (los 3
  artículos de GAP-123); precedente parcial en `src/app/[locale]/pricing/page.tsx`
  (`TIER_KEYS`, registro estático sin `meta.ts` por carpeta).
- **Status:** Confianza MEDIA — encontrado en 2 lugares, no confirmado aún por Jose como regla
  obligatoria. Reevaluar a HIGH si se reutiliza en un tercer contenido (páginas pilar de Fase D
  ampliada, casos de estudio).

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
- **Status:** Still live in production. Follow-up: GAP-029.

### PL-002

- **Date:** 2026-06-27
- **Source:** GAP-008 audit (LoginFormContent.tsx)
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** `LoginFormContent.tsx` uses `eslint-disable` to suppress a rules-of-hooks
  violation instead of extracting an `OtpCodeWatcher` sub-component. `eslint-disable`
  is never acceptable as a permanent fix for rules-of-hooks violations.
  The correct fix is extracting the offending logic into a separate component.
- **Status:** Still live in production. Follow-up: GAP-024.

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

### PL-008
- **Date:** 2026-06-28
- **Source:** Code quality audit (audit-code quality) — CRM components
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry (PL-NEW-A):** `fetch()` calls to internal Next.js `/api/*` routes made
  directly from React components violate the service layer rule. These calls must
  live in a dedicated service file (e.g. `crmAiService.ts`) and be called via the
  service from the component/hook. Unlike calls to Laravel endpoints (which use
  `fetchWithTenant`), calls to internal Next.js API routes use plain `fetch()` —
  that is architecturally correct — but the function must be in a service file, not
  inline in the component.
- **Found in:** `ResolveNextActionDialog.jsx:199`, `ProspectFormSheet.jsx:181`,
  `QuickInteractionModal.jsx:203`
- **Status:** Follow-up: GAP-023.

### PL-009
- **Date:** 2026-06-28
- **Source:** Code quality audit (audit-code quality) — useSpainAverageDieselPrice, useProcessOptions
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry (PL-NEW-B):** `fetch()` calls to external public APIs (no auth, no X-Tenant)
  made directly inside a hook file violate the service layer separation. The function
  must move to a service file (e.g. `fuelService.ts`). The use of plain `fetch()` is
  architecturally correct for external public APIs — it must NOT use `fetchWithTenant`.
  Only the location (hook file vs. service file) is the problem.
- **Found in:** `useSpainAverageDieselPrice.ts:31-62` (government fuel price API),
  `useProcessOptions.ts:7` (wrong layer for HTTP call)
- **Status:** Follow-up: GAP-026 (fuel), GAP-025 (processes).

### PL-010
- **Date:** 2026-06-28
- **Source:** Code quality audit (audit-code quality) — storeService, orderService, useOrdersStats
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry (PL-NEW-C):** Token-as-parameter anti-pattern: hooks extract
  `session?.user?.accessToken` via `useSession()` and pass the token as a parameter
  to service functions (`service.list(filters, token)`). The token must be obtained
  internally by the service via `getAuthToken()`. Hooks must never extract or forward
  the auth token. Side effect: `status` (session loading state string) must never
  appear in TanStack Query `queryKey` arrays — it belongs only in `enabled`, causing
  extra refetches if included in the key.
- **Found in:** `storeService.ts` (7 functions), `orderService.ts` (9 functions),
  `useStockStats.ts`, `useOrdersStats.ts`, `useDashboardCharts.ts`,
  `useProcessOptions.ts`
- **Status:** Follow-up: GAP-027 (store), GAP-028 (order), GAP-025 (processes).

### PL-011
- **Date:** 2026-06-28
- **Source:** Code quality audit (audit-code quality) — useProspects, useCommercialInteractions
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry (PL-NEW-D):** Local queryKey helper functions or variables defined inside a
  hook file do NOT satisfy the ESLint `no-inline-query-keys` rule. This includes:
  `useTenantQueryKey()` local hooks that build arrays, `normalizeQueryParams` functions
  duplicated locally, and any helper that returns `unknown[]`. All queryKey factories
  must live exclusively in `src/lib/routes/queryKeys.ts` and be imported by name.
  A helper that wraps an array is still an inline array from the ESLint rule's
  perspective.
- **Found in:** `useProspects.ts` (local `useTenantQueryKey()`),
  `useCommercialInteractions.ts` (local `normalizeQueryParams` duplicate),
  `useDashboardCharts.ts` (`useChartData` helper accepting `queryKey: unknown[]`)
- **Status:** Follow-up: GAP-030.

### PL-012
- **Date:** 2026-06-28
- **Source:** Recurring Vercel deploy failures — ProspectFormSheet.tsx type errors
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** TypeScript errors appear in cascade in migrated files: fixing Error X
  changes type inference, revealing Error Y that was hidden (TypeScript stopped
  evaluating the expression at Error X). This is especially common after JSX→TSX
  migrations where parameters were left untyped.
  **CLOUD context protocol:** when modifying a `.tsx` file (especially recently
  migrated from `.jsx`), review the ENTIRE file for type issues before pushing —
  not just the error reported by Vercel. Patterns to check: (a) function/callback
  parameters without types, (b) `useState([])` without generic, (c) payload fields
  typed as `string` when the interface expects a union (e.g., `ProspectOrigin`),
  (d) object passed as `Record<string,unknown>` when it's a typed interface.

### PL-013
- **Date:** 2026-06-28
- **Source:** Recurring Vercel deploy failures — pre-push type-check infrastructure
- **Category:** CODEBASE_PATTERN
- **Confidence:** HIGH
- **Entry:** The pre-push Husky hook (`.husky/pre-push`) runs `npm run type-check`
  + `npm run lint` before every `git push`. Prerequisites for the hook to run:
  (1) `node_modules/` must exist, (2) `next-env.d.ts` must exist (generated by
  `next dev` or `next build`). Both are gitignored. In CLOUD context (no
  node_modules), the hook skips silently — type safety relies on manual review
  per PL-012 protocol. In LOCAL context (developer machine), the hook blocks
  pushes with type errors automatically. `npm run type-check` uses `tsc --noEmit`
  with incremental cache (`tsconfig.tsbuildinfo`, also gitignored). Do NOT run
  `tsc --noEmit --incremental false` in cloud context — without node_modules and
  next-env.d.ts it produces hundreds of false-positive errors.

### PL-014
- **Date:** 2026-06-30
- **Source:** /audit-desktop Phase 5 (system-learner)
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** `'use client'` en archivos `page.js/tsx` del App Router es un anti-patrón.
  Los pages de Next.js App Router deben ser **Server Components** (sin directiva) que importan
  el `XxxPageClient`. Añadir `'use client'` al page convierte toda la ruta en Client Component,
  impide optimizaciones RSC y no es el patrón canónico del proyecto. La directiva `'use client'`
  pertenece exclusivamente al componente `XxxPageClient`, nunca al `page.tsx`.
- **Found in:** `src/app/comercial/ofertas/page.js:1`, `src/app/comercial/orders-manager/page.js:1`
- **Status:** Follow-up: GAP-046.

### PL-015
- **Date:** 2026-06-30
- **Source:** /audit-desktop Phase 5 (system-learner)
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** La librería de iconos estándar de PesquerApp es **Lucide React** (ya instalada).
  Nunca importar de `@heroicons/react` — buscar el equivalente en Lucide o usar el más cercano.
  Si un import de Heroicons aparece en una PR o en un archivo legacy, reemplazarlo en el mismo commit.
  Los imports muertos de cualquier librería de iconos también deben eliminarse inmediatamente.
- **Found in:** `src/components/Admin/LabelEditor/index.js:74` (BoldIcon de @heroicons/react/20/solid),
  `src/components/Admin/OrdersManager/OrdersList/index.js:2` (InboxIcon muerto de @heroicons/react/24/outline)
- **Status:** Follow-up: GAP-041.

### PL-017

- **Date:** 2026-07-01
- **Source:** PR #58 post-mortem (GAP-039/040/042/043)
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** Al eliminar una variable de un componente durante un refactor (p.ej. `session`
  al aplicar el patrón token-as-parameter, PL-010), no basta con quitar su declaración y
  usos directos — hay que buscar TODAS las referencias en el archivo, incluyendo arrays de
  dependencias de `useEffect`/`useCallback`/`useMemo`. Una referencia huérfana en un
  dependency array puede pasar desapercibida en una revisión rápida y falla en el build de
  Vercel. **Regla:** tras eliminar cualquier variable, ejecutar grep del nombre en el
  archivo completo antes de dar el refactor por terminado.
- **Found in:** `src/components/Admin/OrdersManager/CreateOrderForm/index.tsx:249`
  (`session` huérfano en deps de `useEffect`, tras GAP-043)
- **Status:** Corregido en el mismo PR (commit `0303cd6`).

### PL-018

- **Date:** 2026-07-01
- **Source:** PR #58 post-mortem (GAP-039, PalletView)
- **Category:** CODEBASE_PATTERN
- **Confidence:** HIGH
- **Entry:** Los componentes `Select`/`SelectItem`/`Combobox` de shadcn son controlados y
  esperan `value: string | undefined` — nunca `null` ni `number`. Cuando el valor de dominio
  es `number | string | null | undefined` (patrón común en IDs de entidades: `orderId`,
  `productId`), convertir siempre en el punto de render: `value={id != null ? String(id) : undefined}`.
  Aplicar la conversión inversa en `onValueChange`/`onChange` si el estado interno espera
  `number`. Este mismo error de tipos apareció 3 veces en un solo archivo
  (`PalletView/index.tsx`) en el PR #58 porque no se aplicó de forma sistemática la primera vez.
- **Found in:** `src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx`
  (`orderId` en `Select`, `oldProductId`/`newProductId` en `Combobox`)
- **Status:** Corregido en PR #58. Aplicar preventivamente en cualquier `Select`/`Combobox`
  controlado por un ID de entidad.

### PL-021

- **Date:** 2026-07-01
- **Source:** /audit-desktop order editor (system-learner)
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** Un hook puede tener cobertura correcta de `notify.error` en la mayoría de sus
  manejadores (20+ sitios en `useOrderPallets.js`) y aun así dejar unos pocos bloques
  `catch` con solo `console.error`, sin ningún aviso al usuario. Esta cobertura parcial es
  fácil de pasar por alto en una revisión rápida porque el archivo "parece limpio" a
  primera vista (el patrón correcto domina visualmente). **Regla para auditores:** al
  revisar el manejo de errores de un hook, hacer `grep -n "console.error"` y `grep -n
  "catch"` sobre el archivo completo y verificar que CADA `catch` tiene su
  `notify.error`/`notify.warning` correspondiente — no basta con confirmar que el patrón
  correcto existe en el archivo.
- **Found in:** `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js`
  (4 catches silenciosos de 8 revisados: líneas 120, 338, 543, 626)
- **Status:** Follow-up: GAP-065.

### PL-024
- **Date:** 2026-07-01
- **Source:** /audit-design visual order editor (system-learner)
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** El peso `font-semibold` se usa de forma recurrente en 5 archivos del editor de
  pedidos, tanto para identificadores primarios como para metadatos secundarios, pese a que
  `design-context.md` § Typography documenta una escala cerrada donde `font-semibold` no
  aparece en ningún punto (solo `font-medium` en sus distintos tamaños). Esto además debilita
  la jerarquía visual, ya que el identificador primario y sus metadatos secundarios terminan
  casi al mismo peso. Normalizado a `font-medium` vía GAP-096.
- **Found in:** `OrderSummaryMobile.jsx:46,105,110,117,141,147`, `OrderDetails/index.tsx:106,283,289,316`,
  `OrderProductDetails/index.js:84,95,101,109,117,123,131`, `OrderCostAnalysis/index.jsx:52-54,71,76,127,132`,
  `OrderLabels/index.js:243,297,316,324,424`.
- **Status:** Follow-up: GAP-096.

### PL-025
- **Date:** 2026-07-01
- **Source:** /audit-design visual order editor (system-learner)
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** El patrón documentado de badges de estado (`bg-{color}-500/15 text-{color}-700
  dark:text-{color}-300`, ver `design-context.md` § Status Colors) no se propagó al módulo
  Order — 3 archivos usan 3 tratamientos ad-hoc distintos entre sí y respecto al patrón
  documentado: `OrderProduction` usa fondo sólido `bg-green-500`/`bg-orange-500` (además
  duplicado entre tarjeta móvil y celda desktop), `OrderCostAnalysis` usa `variant="outline"`
  con solo el color de texto sobreescrito, `OrderIncident` usa el par `/50`+`bg-{color}-50`
  (también duplicado entre vista móvil y cabecera desktop). Normalizado vía GAP-088.
- **Found in:** `OrderProduction/index.js:97,101,314,318`, `OrderCostAnalysis/index.jsx:441-445`,
  `OrderIncident/index.js:117-131,290-304`.
- **Status:** Follow-up: GAP-088.

### PL-029
- **Date:** 2026-07-27
- **Source:** Jose, navegación de prueba manual (tab Información/rentabilidad y tab Análisis del editor de pedidos)
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** Varios cards de KPI/rentabilidad y la tabla del tab Análisis usaban frases
  completas al estilo IA para representar un valor vacío o cero (p.ej. "Sin margen
  calculado", "Sin coste de transporte registrado para este pedido") en lugar de un
  tratamiento numérico consistente con el resto de la UI. Estas frases leen como copy
  generado, no como copy de producto. Regla aplicada: usar siempre `-` para dato ausente
  o `0` / `0,00 €` / `0%` para un cero real — nunca una oración descriptiva. Documentado en
  `design-context.md` § Microcopy for empty/zero numeric values. Aplica a cualquier
  card/tabla KPI de la app, no solo al editor de pedidos.
- **Found in:** `OrderCostAnalysis/index.jsx` (cards de rentabilidad, tab Información) y
  cards + tabla del tab Análisis del mismo módulo.
- **Status:** Corregido en el mismo turno (ver commit de la sesión 2026-07-27).

### PL-031
- **Date:** 2026-07-28
- **Source:** GAP-123 (Fase D landing — blog + GEO/AEO), implementación — bug pre-existente
  descubierto y confirmado explícitamente por Jose durante la sesión — System Learner check
  candidate 1a
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** `setRequestLocale()` de `next-intl` nunca se llamaba en ninguna página del
  proyecto. `src/middleware.ts` solo invoca `intlMiddleware` para rutas **sin** prefijo de
  locale (`isPublicLocalePath()`); las rutas ya prefijadas (`/pt/*`, `/en/*`) nunca pasan por
  el middleware — Next.js resuelve el segmento `[locale]` por carpetas sin necesitarlo — pero
  `next-intl` necesita `setRequestLocale()` para fijar el locale ambiental que usan
  `getTranslations()`/`useTranslations()` **sin locale explícito** (el patrón usado en casi
  todos los componentes de la landing). Sin esa llamada, esas invocaciones ambientales caían
  siempre al locale por defecto (`es`) bajo `/pt/*`/`/en/*` — un bug que afectó a
  prácticamente todo el contenido de body de las Fases B1/B2/C ya cerradas (Hero,
  ModulesBento, HowItWorks, Footer, TrustBadge, PricingPreview, LeadCaptureForm, páginas
  legales), invisible en 4 auditorías previas porque solo el `<title>` (vía `generateMetadata`,
  que sí recibe el locale explícito) se libraba. Con `generateStaticParams` declarado en
  `[locale]/layout.tsx`, `setRequestLocale()` solo en el layout resultó inestable entre
  requests intercaladas de distintos locales — cada página necesita su propia llamada, no
  solo el layout (comportamiento documentado de `next-intl`). **Regla:** toda página bajo
  `src/app/[locale]/**` DEBE llamar `setRequestLocale(locale)` como primera línea tras
  `const { locale } = await params;`, antes de cualquier `getTranslations()`/render — tanto en
  el `layout.tsx` como en cada `page.tsx` de la ruta.
- **Found in:** Corregido en `[locale]/layout.tsx`, `[locale]/page.tsx`, `pricing/page.tsx`,
  `legal/privacy/page.tsx`, `legal/terms/page.tsx`, `blog/page.tsx`, `blog/[slug]/page.tsx`
  (las 7 páginas existentes bajo `[locale]` en el momento de GAP-123).
- **Status:** Corregido en GAP-123, verificado con 7 rondas intercaladas es/pt/en (ver
  PL-030). Toda página nueva bajo `[locale]` (Fase D ampliada, Fase E) debe incluir esta
  llamada desde el primer commit — reflejado en `.claude/landing-context.md` §4.7 y
  `.claude/agents/gap-discovery.md`.

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

### PL-BUILD-05

- **Date:** 2026-07-01
- **Source:** PR #58 post-mortem (rama `claude/gaps-039-040-042-043-gsbxkf`) — GAP-039 eliminar `@ts-nocheck` de PalletView
- **Category:** ANTI_PATTERN
- **Confidence:** HIGH
- **Entry:** **Recurrencia de PL-BUILD-01 / PL-012 / PL-016.** 15 deployments consecutivos
  en ERROR en Vercel antes de un READY, cada uno corrigiendo un único error de TypeScript
  revelado al quitar `@ts-nocheck` de `PalletView/index.tsx` (~1100 líneas). El propio
  archivo ya estaba señalado en PL-016 como candidato exacto a este problema y aun así se
  repitió el patrón commit-por-error. Dos síntomas nuevos detectados en esta recurrencia,
  no cubiertos hasta ahora:
  1. **Commit "Trigger Vercel redeploy" sin cambio de código real** (commit `480cbb5`):
     en vez de diagnosticar el error, se reintentó el deploy sin tocar el archivo afectado.
     Esto desperdicia un ciclo de build completo (~2-3 min) sin ninguna posibilidad de
     éxito, porque el código no cambió.
  2. **Errores en archivos distintos al que se está migrando** aparecen en la misma tanda
     de commits cuando el PR mezcla varios GAPs (aquí GAP-043 tocó `CreateOrderForm` a la
     vez que GAP-039 tocaba `PalletView` — ver PL-017). Un error en un archivo no
     relacionado con la migración principal puede pasar desapercibido si la revisión se
     centra solo en el archivo "grande".
  **Regla reforzada:** cuando un GAP implica quitar `@ts-nocheck` o migrar un archivo
  grande (>500 líneas), tratarlo como PR aislado (no mezclado con otros GAPs) y dedicar un
  paso explícito de lectura completa del archivo símbolo por símbolo (tipos de estado,
  props, callbacks, valores controlados de Select/Combobox — ver PL-018) ANTES del primer
  push, no de forma reactiva tras cada fallo de Vercel. Nunca pushear un commit de
  "reintento": si Vercel falla, el siguiente commit debe contener un fix verificable, nunca
  un push vacío o sin relación con el error reportado.
- **Found in:** PR #58, commits `eadd7d3` → `2d9b705` (15 deployments ERROR en el proyecto
  Vercel `lapesquerapp-frontend`)
- **Regla aplicada:** GIT POLICY → reforzada la prohibición de "commit por error de
  TypeScript" con la prohibición explícita de commits de reintento sin fix, y la
  recomendación de aislar GAPs de eliminación de `@ts-nocheck`/migración TS grande en PRs
  propios.

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

### PL-019

- **Date:** 2026-07-01
- **Source:** /audit-code migrate orders manager
- **Category:** CORRECTION
- **Confidence:** HIGH
- **Entry:** La tabla "Hooks gigantes" en CLAUDE.md y `.claude/rules/hooks.md`, y la lista de
  "archivos protegidos" en `.claude/agents/gap-discovery.md`, estaban desactualizadas para
  `useOrder` y `usePallet`. Ambos YA fueron migrados a TypeScript y refactorizados en
  sub-hooks: `useOrder.ts` (284 líneas, delega en `hooks/orders/*`) y `usePallet.ts`
  (302 líneas, delega en `hooks/pallets/*`) — exactamente el patrón que la propia regla
  exige. Solo `useLabelEditor.ts` (822 líneas / 28KB) sigue siendo el hook monolítico real
  pendiente de refactor. Un futuro audit o GAP podría asumir erróneamente que
  `useOrder`/`usePallet` siguen sin migrar, proponer trabajo ya hecho, o bloquear cambios
  legítimos tratándolos como "archivo protegido" cuando ya no aplica el mismo riesgo de
  tamaño. Corregido directamente en CLAUDE.md, `rules/hooks.md` y `gap-discovery.md` en la
  misma fecha.
- **Found in:** `src/hooks/useOrder.ts`, `src/hooks/usePallet.ts` (verificados directamente:
  tamaño e imports de sub-hooks)
