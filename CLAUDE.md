# La PesquerApp — Frontend

SaaS multi-tenant ERP para el sector pesquero y de congelados. Cubre módulos de ventas, stock, etiquetas, catálogos de sector, CRM comercial, gestión de proveedores y maquiladores. Backend Laravel · Frontend Next.js con App Router.

---

## Mandatory Context Files

Read these before starting any work in the relevant area:

| File                                | When to read                                                                                                                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/design-context.md`         | **Mandatory before implementing any UI.** Contains the visual and UX criteria extracted from the codebase. Kept current by the `/ui-feedback` skill.                                      |
| `.claude/landing-context.md`        | **Mandatory before touching the public marketing site** (landing, pricing, blog, legal pages) — real brand identity, locked strategic decisions, and market-research-backed guidelines. Separate from `design-context.md`, which covers the authenticated ERP. |
| `.claude/landing-proposal.md`       | **Mandatory before implementing any landing GAP.** Living execution plan for the public site: audit findings, 2026 market comparison, full proposal by area, visual asset production spec, and phased roadmap with live status (Fase A–E). Companion to `landing-context.md`. |
| `.claude/product-catalog.md`        | **Mandatory before writing landing/blog copy about product features, or making pricing/plan decisions.** Full functional inventory of the ERP (all roles/modules), built from real code analysis — maturity status per feature (Activo/En progreso/Placeholder) and an initial Core-vs-Add-on classification proposal, cross-referenced with the real feature-flag system (`module.*`) already in the codebase. |
| `.claude/project-learnings.md`      | **Mandatory before any audit, GAP, or implementation.** Institutional memory — PesquerApp-specific rules, patterns, and corrections discovered over time. Maintained by `system-learner`. |
| `.claude/rules/typescript.md`       | All TypeScript work — interfaces, types, strict mode rules                                                                                                                                |
| `.claude/rules/components.md`       | All React component work — structure, patterns, naming                                                                                                                                    |
| `.claude/rules/hooks.md`            | All hook work — TanStack Query, mutations, staleTime                                                                                                                                      |
| `.claude/rules/api-client.md`       | All service / HTTP work — fetchWithTenant, helpers                                                                                                                                        |
| `.claude/rules/testing.md`          | All test work — Vitest patterns, mocking                                                                                                                                                  |
| `.claude/skills/mobile-ui/SKILL.md` | All mobile UI work — hooks, tokens, layout shell                                                                                                                                          |

---

## Stack

| Tecnología           | Versión                           | Rol                                                      |
| -------------------- | --------------------------------- | -------------------------------------------------------- |
| Next.js              | 16.0.7                            | Framework (App Router)                                   |
| React                | 19.0.0-rc canary                  | UI — **BLOQUEADO: no actualizar**                        |
| TypeScript           | 5.9.3 · strict: true              | Tipado                                                   |
| Tailwind CSS         | 4.2.1                             | Estilos                                                  |
| shadcn/ui + Radix UI | —                                 | Componentes UI (52 primitivos en `src/components/ui/`)   |
| TanStack Query       | 5.90.21                           | Data fetching y caché de servidor                        |
| TanStack Table       | 8.21.3                            | Tablas de datos                                          |
| React Hook Form      | 7.54.2                            | Estado de formularios                                    |
| Zod                  | 3.25.76                           | Validación y schemas                                     |
| NextAuth             | 4.24.13                           | Autenticación JWT                                        |
| Sonner               | 2.0.7                             | Notificaciones toast (via `notify`)                      |
| Vitest               | 4.0.18 + Testing Library 16       | Tests                                                    |
| Prettier             | 3.x + prettier-plugin-tailwindcss | Formateo                                                 |
| Mapbox GL            | 3.20.0                            | Mapas                                                    |
| Recharts             | 2.15.4                            | Gráficos                                                 |
| Framer Motion        | 11.18.2                           | Animaciones (solo puntuales, no en pantallas operativas) |
| @ai-sdk/openai       | 3.0.12                            | Integración IA (extracción de documentos de lonja)       |

> **⚠️ React 19-rc canary:** Versión bloqueada — no actualizar ni hacer downgrade sin decisión explícita del dev.
> Tratar como React 18 a efectos de patrones de código: no usar features experimentales exclusivas de React 19.
> Server Components: usar con cautela y documentar en PR cualquier nuevo uso.

---

## Arquitectura de carpetas

```
src/
├── app/                   # App Router — rutas por rol de usuario
│   ├── admin/             # Administrador, dirección, técnico
│   ├── comercial/         # Comercial (CRM + ventas)
│   ├── operator/          # Operario (almacén)
│   ├── field/             # Repartidor autoventa (mobile-first)
│   ├── production/        # Producción
│   └── warehouse/         # Almacén
│
├── components/            # 269 archivos React organizados por dominio
│   ├── Admin/             # 28 subdirectorios (Orders, Pallets, Labels, CRM…)
│   ├── Comercial/ Warehouse/ Field/ External/
│   └── ui/                # Primitivos shadcn generados — NO editar directamente
│
├── services/
│   ├── domain/            # 34 servicios de entidad (un .ts por entidad)
│   │   └── entityServiceMapper.js  # mapea string endpoint → service instance
│   └── generic/           # Helpers CRUD: entityService.js · createEntityService.js · editEntityService.js
│
├── hooks/                 # 84+ hooks
│   └── production/        # Sub-hooks de producción
│
├── lib/
│   ├── fetchWithTenant.js # ← ÚNICO punto de salida HTTP de toda la app
│   ├── notifications.ts   # notify.success / notify.error / notify.warning (wrapper Sonner)
│   ├── routes/queryKeys.ts# Factories de TanStack Query keys (enforzado por ESLint)
│   ├── validation/setErrorsFrom422.js  # mapper errores 422 → react-hook-form
│   └── api/apiHelpers.js  # ApiError class · getErrorMessage · apiGet/Post/Put/Delete
│
├── configs/
│   ├── entitiesConfig.js  # Reexporta desde entities/ — ver src/configs/entities/index.ts
│   ├── roleConfig.ts      # Mapa rol → rutas permitidas
│   ├── navigationConfig.js# Menús de navegación por rol
│   └── config.js          # API_URL_V2, API_BASE_URL
│
├── types/                 # 14 archivos: catalog.ts · crm.ts · user.ts · product.ts …
├── schemas/               # Schemas Zod: loginSchema.ts · settingsSchema.js
├── context/               # 7 providers React (OrderContext, OptionsContext, LogoutContext…)
├── helpers/ utils/ constants/ parsers/ validators/ errors/ exportHelpers/
├── __tests__/             # 20 archivos Vitest — hooks, services, utils, validators
└── middleware.ts          # Auth + tenant detection + RBAC (274 líneas)
```

**Patrón de organización:** Layer-based global (services / hooks / components / lib) + feature-based dentro de `components/Admin/`.

---

## Flujo de datos (siempre seguir este orden)

```
Componente
  → hook (useX)
    → service (xService.list/create/update)
      → helper genérico (fetchEntitiesGeneric / createEntityGeneric)
        → fetchWithTenant (añade X-Tenant + Authorization automáticamente)
          → API Laravel /api/v2/
```

---

## Regla de oro 1 — NUNCA usar `fetch()` directo

Todo HTTP pasa por `fetchWithTenant` o los helpers genéricos del service layer.

```typescript
// ❌ PROHIBIDO — en componentes, hooks o services
const res = await fetch('/api/v2/customers');
const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

// ✅ CORRECTO — desde un service, usando el helper genérico
import { fetchEntitiesGeneric } from '@/services/generic/entityService';
const data = await fetchEntitiesGeneric(`${API_URL_V2}customers`, token);
```

---

## Regla de oro 2 — NUNCA hardcodear tenant

El tenant se detecta automáticamente del hostname. `fetchWithTenant` inyecta `X-Tenant` solo.

```typescript
// ❌ PROHIBIDO
headers: { 'X-Tenant': 'brisamar' }
const tenant = 'dev';

// ✅ Solo para queryKeys — nunca para headers HTTP
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
const tenantId = getCurrentTenant();
```

---

## Regla de oro 3 — NUNCA crear archivos `.js` nuevos

Todo código nuevo es `.ts` o `.tsx`. Si tocas un `.js` legacy por cualquier motivo, migrarlo a `.ts` en ese mismo commit.

---

## Excepción documentada — Panel Superadmin

El panel en `src/app/superadmin/` tiene su propia capa HTTP independiente:

```
src/lib/superadminApi.js   ← fetch directo al backend de superadmin (SIN tenant)
src/context/SuperadminAuthContext.jsx
```

**Por qué es una excepción válida:**

- El superadmin no pertenece a ningún tenant: no existe `X-Tenant` que inyectar.
- Usa autenticación propia (JWT de superadmin, distinto al JWT de NextAuth).
- `fetchWithTenant` asumiría un contexto multi-tenant que aquí no aplica.

**Reglas específicas del panel Superadmin:**

```typescript
// ✅ CORRECTO dentro de src/app/superadmin/ y src/components/Superadmin/
import { fetchSuperadmin, SuperadminApiError } from '@/lib/superadminApi';
const res = await fetchSuperadmin('/tenants', { method: 'POST', body: JSON.stringify(data) });

// ❌ NUNCA mezclar fetchWithTenant con rutas de superadmin
import { fetchWithTenant } from '@/lib/fetchWithTenant'; // ← prohibido aquí

// ❌ NUNCA usar fetchSuperadmin fuera del panel superadmin
// Solo válido en: src/app/superadmin/**, src/components/Superadmin/**,
//                src/lib/superadminApi.js, src/context/SuperadminAuthContext.jsx
```

---

## Módulos del dominio

| Módulo                    | Entidades principales                                              | Estado                               |
| ------------------------- | ------------------------------------------------------------------ | ------------------------------------ |
| Ventas / Pedidos          | `orders`, `customers`, `salespeople`, `payment-terms`, `incoterms` | Activo — gestor operacional complejo |
| Stock / Almacén           | `pallets`, `boxes`, `lots`, `stores`                               | Activo — operativa warehouse         |
| Etiquetas                 | `labelEditor`                                                      | Activo — editor visual propio        |
| Catálogos de sector       | `species`, `fishing-gears`, `capture-zones`, `countries`           | Activo — EntityClient                |
| CRM                       | `customers`, `prospects`, `interactions`, agenda                   | **En progreso** — agenda pendiente   |
| Proveedores               | `suppliers`, `supplier-liquidations`                               | Activo                               |
| Maquiladores / Producción | `productions`, `raw-material-receptions`                           | Activo                               |
| Repartidores              | `field-operators`, `cebo-dispatches`                               | Activo — mobile-first                |
| Administración            | `users`, `roles`, `employees`, `taxes`, `transports`               | Activo — EntityClient                |
| IA / Extracción           | MarketDataExtractor (documentos lonja)                             | Activo — Azure + OpenAI              |

---

## Comandos esenciales

```bash
npm run dev              # Servidor de desarrollo (puerto 3000, proxy → localhost:8000)
npm run build            # Build de producción
npm run lint             # ESLint (next/core-web-vitals + regla custom de queryKeys)
npm run format           # Prettier --write . (con prettier-plugin-tailwindcss)
npm run test             # Vitest en modo watch
npm run test:run         # Vitest una ejecución (para CI)
npm run type-check       # TypeScript check (requiere node_modules + next-env.d.ts)
```

## Workflow pre-push — protección contra errores de deploy

### Contexto LOCAL (node_modules instalado, `next dev` ha corrido al menos una vez)

El Husky `pre-push` hook ejecuta automáticamente en cada `git push`:
```
TypeScript check (npm run type-check) + ESLint (npm run lint)
```
Si cualquiera falla, el push queda bloqueado. Corregir el error y volver a empujar.

Para ejecutarlo manualmente antes de push:
```bash
npm run type-check   # TypeScript check (requiere next-env.d.ts y node_modules)
npm run lint         # ESLint
```

### Contexto CLOUD — Claude Code en sesión remota (sin node_modules)

En sesiones cloud, el hook detecta la ausencia de `node_modules` y pasa silenciosamente.
**Claude Code debe aplicar el protocolo manual antes de cada push:**

#### 1. Revisar tipos en archivos JSX→TSX migrados
Tras una migración `.jsx` → `.tsx`, revisar el archivo COMPLETO de una vez:
- Todos los parámetros de función/callback (sin `any` implícito)
- Estado con `useState` (tipar el genérico: `useState<Tipo[]>([])`)
- Props de componentes (interfaz explícita)
- Tipos de retorno de mutaciones contra las interfaces del backend (`src/types/`)

#### 2. Protocolo de errores TypeScript en cascada
TypeScript revela errores en cascada: corregir Error X puede revelar Error Y (que estaba
"tapado" porque TypeScript dejó de evaluar la expresión al toparse con X).

**Regla:** al corregir cualquier error TypeScript en un archivo, revisar el archivo completo
antes de hacer push. No asumir que porque el error anterior ya no existe, el archivo está limpio.

**Señales de que habrá más errores:**
- Un parámetro se tipó como `string` cuando la interfaz del backend espera una unión (`ProspectOrigin`)
- Se pasó un objeto a una función que espera `Record<string, unknown>` con una interfaz concreta
- Una función callback no tiene tipos en sus parámetros

#### 3. Verificar contra interfaces del backend
Antes de hacer push con payload de formulario, comparar el objeto construido contra
`src/types/` para confirmar que todos los campos son del tipo correcto (especialmente
uniones como `ProspectOrigin`, `ProspectStatus`, etc.).

#### 4. Eliminar `@ts-nocheck` de un archivo grande (>500 líneas) — protocolo reforzado
Ver PL-BUILD-05 (recurrencia del PR #58, 15 deployments en ERROR seguidos sobre el mismo
archivo ya señalado en PL-016). Al eliminar `@ts-nocheck`:

- **PR aislado:** no mezclar esta tarea con otros GAPs en el mismo commit/PR. Un archivo
  grande sin tipos genera su propia cascada; mezclarlo con cambios no relacionados dificulta
  aislar qué error viene de dónde (ver el caso `CreateOrderForm` afectado por un GAP distinto
  en el mismo PR).
- **Lectura completa antes del primer push:** recorrer el archivo símbolo por símbolo
  (estado, props, callbacks, valores controlados de `Select`/`Combobox` — string vs
  number vs null, ver patrón en project-learnings.md PL-018) en vez de pushear y esperar el
  error de Vercel uno a uno.
- **Grep de variables eliminadas:** si el refactor elimina una variable (p.ej. `session` en
  el patrón token-as-parameter), buscar TODAS sus referencias en el archivo, incluyendo
  arrays de dependencias de `useEffect`/`useCallback`/`useMemo` — no solo su declaración y
  usos obvios.
- **Prohibido pushear un commit de "reintento"** (p.ej. "Trigger Vercel redeploy") sin un
  fix de código verificable. Si Vercel falla, el siguiente commit debe corregir el error
  reportado; un push vacío o sin relación con el error desperdicia un ciclo de build completo.

---

## Archivos protegidos — detener y preguntar antes de tocar

| Archivo                          | Razón                                                                         | Acción requerida                                                     |
| -------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/configs/entitiesConfig.js`  | Punto de entrada del config modular — reexporta desde `src/configs/entities/` | Solo modificar el reexport; nunca añadir entidades directamente aquí |
| `src/hooks/useLabelEditor.ts` (~28 KB / 822 líneas) | Único hook gigante real pendiente de refactor — no añadir lógica aquí | Crear sub-hook en `src/hooks/labels/useLabelXxx.ts`                  |
| `src/middleware.ts`              | Auth + tenant + RBAC crítico                                                  | Revisar impacto en todos los roles antes de modificar                |
| `src/lib/fetchWithTenant.js`     | Único punto HTTP — un cambio aquí afecta a toda la aplicación                 | Solo con revisión explícita del dev                                  |

---

## Deuda técnica documentada

1. **React 19-rc canary** — versión no estable en producción. Riesgo de breaking changes en cada rc update.
2. **Codebase mixto JS/TS** — servicios legacy en `.js`. Migrar al tocar cualquier archivo legacy.
3. ✅ **Husky hooks configurados** — `pre-commit` (lint-staged: Prettier + ESLint en archivos staged) · `pre-push` (TypeScript check limpio + ESLint completo).
4. **Sin tests de UI** — Vitest solo cubre lógica (hooks, services, utils), no componentes React.
5. **`entitiesConfig.js`** — ✅ partido en módulos por dominio en `src/configs/entities/` (GAP-007).
6. **Hooks gigantes** — ✅ `useOrder` y `usePallet` ya migrados a `.ts` y refactorizados en sub-hooks (`hooks/orders/*`, `hooks/pallets/*`). Solo `useLabelEditor` (~28 KB / 822 líneas) sigue pendiente de refactor.
7. **Cobertura de tests** — 20 archivos de test para 269 componentes y 84+ hooks.
8. **`entityServiceMapper.js`** — candidato prioritario de migración a TypeScript.
9. **`maxDuration` en extracción de PDF** — `src/app/api/extraction/chatgpt/route.js` tiene `maxDuration = 60` por límite del plan Hobby de Vercel (máx 60s). El ideal sería 300s para extracciones con modelos lentos (o-series). Opciones: (a) mover la extracción a un endpoint del backend Laravel, (b) upgrade a Vercel Pro, (c) implementar extracción asíncrona con polling.

---

## Claude Code workflow

Antes de modificar archivos:

1. Inspeccionar los archivos relevantes.
2. Explicar qué se entendió.
3. Listar los archivos que pueden cambiar.
4. Proponer un plan de implementación.
5. Pedir aprobación si el cambio es amplio, arriesgado o arquitectónico.

Después de modificar:

1. Resumir los archivos cambiados.
2. Explicar por qué se hizo cada cambio.
3. Sugerir tests o comandos a ejecutar.
4. Mencionar riesgos o trabajo de seguimiento.

## Reglas importantes

- No hacer cambios destructivos.
- No añadir dependencias sin aprobación.
- No refactorizar archivos no relacionados.
- No inventar campos de API.
- No cambiar lógica de negocio salvo que la tarea lo requiera explícitamente.
- Mantener UI consistente con los patrones shadcn/Tailwind existentes.
- Mantener formularios consistentes con los patrones React Hook Form/Zod existentes.

## UI Stack

Este proyecto usa shadcn/ui para todos los componentes de UI.

- **Usar siempre componentes shadcn nativamente** — nunca reescribir ni sobrescribir internos
- **Extender solo via** `className` con `cn()`, variantes CVA, o composición
- **Nunca hardcodear colores** — usar siempre variables semánticas CSS (`--primary`, `--muted`, `--accent`, etc.)
- **Antes de escribir cualquier primitivo UI desde cero**, ejecutar: `npx shadcn@latest add <component>`
- **Verificar primero en `src/components/ui/`** — el proyecto tiene 52 primitivos instalados
- Usar `gap` en lugar de `space-y` para spacing en flex/grid
- Siempre incluir `DialogTitle` en componentes `Dialog`
- Validar correctamente los estados `data-invalid` en campos de formulario
- Usar `data-slot` para identificar partes de componentes compound

---

## Contexto adicional

Para documentación extendida, ver `docs/ai-context/`. Para el estado operativo del flujo v2 (auditorías multi-módulo, GAPs candidatos, próxima acción), ver `docs/ai/` — contrato completo en `docs/ai/README.md`. Para reglas específicas por área, ver `.claude/rules/`. Para agentes especializados, ver `.claude/agents/`.

### Agentes disponibles en `.claude/agents/`

| Agente               | Rol                                                                                                                | Se activa cuando                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `gap-discovery`      | Tech lead — convierte ideas en GAPs verificables (modo hilo principal, no es un subagente)                         | Jose describe un problema, mejora o feature                                                               |
| `gap-implementor`    | Desarrollador senior — ejecuta exactamente lo que el GAP describe (modo hilo principal, no es un subagente)        | Jose confirma un GAP para implementar                                                                     |
| `gap-auditor`        | Senior engineer independiente — veredicto técnico + visual + UX (Full review vía `ux-reviewer`, orquestado por el hilo principal). También corre en modo lote para `/implement-next` | El Implementador termina, o el orquestador de `/implement-next` al cerrar un lote |
| `ux-reviewer`        | UX specialist — simula flujos reales, identifica fricción, bloquea cierre por fallos UX. Escribe su propio veredicto en el GAP | Invocado por el hilo principal cuando `gap-auditor` señala que un GAP requiere Full Review. Full (flujos complejos) / Light (cambios menores) |
| `frontend-developer` | Desarrollador frontend generalista                                                                                 | Tareas de desarrollo que no siguen el flujo GAP                                                           |
| `mobile-ui-agent`    | Especialista en UI mobile                                                                                          | Trabajo en vistas mobile con `/mobile`                                                                    |
| `ui-audit-agent`     | Auditor autónomo de UI — recorre vistas, genera findings, convierte en GAPs                                        | Invocado por `/audit-mobile`, `/audit-desktop`, o como carril de `/deep-audit-module` (ux-ui, a11y-responsive) |
| `system-learner`     | Memoria institucional — traduce hallazgos y correcciones en reglas permanentes en `project-learnings.md`           | Invocado por el hilo principal a partir de un PL candidate señalado por cualquier auditor, o directamente por Jose |
| `code-audit-agent`   | Auditor técnico autónomo — calidad de código, deuda de migración y arquitectura React/Next.js. Nunca evalúa UI/UX. | Invocado por `/audit-code [quality\|migrate\|arch]`, o como carril de `/deep-audit-module` (code-quality, architecture-refactor) |
| `design-quality-auditor` | Auditor de craft de diseño — armonía/proporción/jerarquía visual (con captura real cuando es posible), consistencia de textos, y drift entre vistas de la misma familia. Nunca evalúa código ni flujo UX. | Invocado por `/audit-design [visual\|copy\|consistency]`, o como carril de `/deep-audit-module` (ux-ui) |
| `skeleton-fidelity-auditor` | Auditor de fidelidad de loading states — compara (con captura real cuando es posible) cada `Skeleton` contra el componente real que sustituye: estructura, dimensiones, jerarquía. Mobile y desktop como targets separados. Nunca evalúa si falta el Skeleton (eso es `ui-audit-agent`). | Invocado por `/audit-skeletons [mobile\|desktop\|both]`                                                   |
| `skeleton-implementor` | Especialista en construir/corregir skeletons fieles al componente real — nunca adivina medidas, siempre variantes mobile/desktop separadas cuando aplica                                          | Jose confirma un GAP `AUDIT-SKEL-*`, o pide directamente un skeleton                                       |
| `domain-business-auditor` | Audita si los flujos y reglas de negocio de un módulo reflejan cómo opera realmente una empresa de pesca/congelados (pesos, formatos, lotes, trazabilidad, fresco/congelado, maquila). Único carril que evalúa corrección de dominio, no código ni UI. | Carril de `/deep-audit-module` (categoría domain-business)                                                |
| `permissions-multitenant-auditor` | Audita visibilidad de acciones por rol y aislamiento de datos multi-tenant — las dos áreas sin cobertura dedicada previa. | Carril de `/deep-audit-module` (hallazgos de seguridad/tenant, categoría data-api o architecture-refactor) |
| `gap-normalizer`    | Deduplica, fusiona, divide y clasifica los GAP v2 candidatos generados por `/deep-audit-module` en GAPs implementables con frontmatter completo. Nunca implementa ni audita código directamente. | Fase 6 de `/deep-audit-module` cuando hay más de ~15 candidatos                                            |
| `code-reviewer`      | Revisor de código independiente                                                                                    | Revisión de PRs y diffs                                                                                   |
| `db-architect`       | Diseño de caché TanStack Query — factories de queryKey, estrategia de invalidación, staleTime, prefetch, updates optimistas | Cambios en el diseño de queries/mutaciones y su caché                                                     |
| `design-fidelity-auditor` | Compara una vista implementada contra su mockup original de Claude Design (con captura real cuando es posible) y clasifica cada diferencia como fiel / adaptación acordada / drift no acordado. Nunca evalúa craft visual absoluto (eso es `design-quality-auditor`) ni corrección de código. | Invocado por el skill `design-to-code` (PASO D) tras una implementación, o directamente vía `/design-to-code audit [vista]` |
| `landing-auditor`   | Auditor del sitio público de marketing (landing, pricing, blog, legal) — marca/diseño, conversión (CRO), SEO técnico, GEO/AEO, paridad i18n ES/PT/EN, accesibilidad, performance y honestidad de contenido. Nunca audita el ERP autenticado (eso es `ui-audit-agent`/`design-quality-auditor`). Nunca implementa. | Invocado por `/audit-landing` — cadencia trimestral acordada con Jose |
| `landing-content-writer` | Redacta y mantiene copy/artículos del sitio público (blog, secciones de landing, pricing) en ES con traducción a PT/EN, siguiendo el tono y las reglas de honestidad de `.claude/landing-context.md`. Nunca toca código ni inventa cifras/testimonios. | Jose pide contenido nuevo, o `landing-auditor` señala un hallazgo puramente editorial |

Nota sobre invocación entre agentes: ningún agente de esta tabla (salvo el hilo
principal) tiene la tool `Agent` — no pueden lanzarse subagentes entre sí. Cuando
un agente necesita el resultado de otro (p. ej. `gap-auditor` necesitando a
`ux-reviewer`, o cualquier auditor señalando un PL candidate a `system-learner`),
devuelve una señal estructurada a quien lo invocó (el hilo principal, o el
orquestador de `/deep-audit-module`/`/implement-next`), que es quien lanza el
siguiente agente y retoma el flujo.

### Slash commands disponibles

| Comando                       | Agente             | Descripción                               |
| ----------------------------- | ------------------ | ----------------------------------------- |
| `/audit-mobile`               | `ui-audit-agent`   | Auditoría UI de vistas mobile             |
| `/audit-desktop`              | `ui-audit-agent`   | Auditoría UI de vistas desktop            |
| `/audit-code quality`         | `code-audit-agent` | Violaciones de calidad de código y reglas |
| `/audit-code migrate`         | `code-audit-agent` | Candidatos JS→TS y patrones deprecated    |
| `/audit-code arch`            | `code-audit-agent` | Problemas arquitectónicos React/Next.js   |
| `/audit-code [mode] [module]` | `code-audit-agent` | Scope reducido a un módulo específico     |
| `/audit-design visual`        | `design-quality-auditor` | Armonía, proporción, jerarquía y ritmo visual (captura real si hay Playwright+sesión) |
| `/audit-design copy`          | `design-quality-auditor` | Terminología, tono, capitalización y claridad de mensajes |
| `/audit-design consistency [family]` | `design-quality-auditor` | Drift entre vistas de la misma familia (listados, sheets, forms, confirmaciones...) |
| `/audit-skeletons [mobile\|desktop\|both]` | `skeleton-fidelity-auditor` | Fidelidad de `Skeleton` vs el componente real que sustituye — estructura, dimensiones, jerarquía |
| `/audit-landing [página\|locale]` | `landing-auditor` | Auditoría del sitio público (marca, CRO, SEO técnico, GEO/AEO, i18n, a11y, performance, honestidad de contenido) — cadencia trimestral |
| `/deep-audit-module module={módulo}` | code-audit-agent, ui-audit-agent, design-quality-auditor, domain-business-auditor, permissions-multitenant-auditor | Auditoría profunda multi-carril de un módulo; escribe GAP candidates a `docs/ai/gaps/{module}/` (skill, no agente único) |
| `/implement-next module={módulo} category={cat}` | `gap-implementor` + `gap-auditor` (modo lote) | Implementa el siguiente lote de GAPs v2 `ready` y los verifica con contexto limpio (skill) |
| `/mobile [vista]`             | `mobile-ui-agent`  | Workflow completo de UI mobile para una vista (crear/qa/merge/status/list) |
| `/design-to-code [vista] [fuente]` | `mobile-ui-agent` / `frontend-developer` + `design-fidelity-auditor` | Circuito recurrente: importa un diseño de Claude Design, propone mapeo de fidelidad vs adaptación, implementa y audita fidelidad contra el mockup original (skill) |
| `/design-to-code refine [vista] [fuente]` | `design-fidelity-auditor` + `mobile-ui-agent` / `frontend-developer` | Modo REFINAR: audita primero una vista ya implementada (con o sin circuito previo) contra su diseño original y afina solo el drift detectado, sin reescribir |
| `/design-to-code audit [vista]` | `design-fidelity-auditor` | Re-ejecuta solo la auditoría de fidelidad de una vista ya implementada |
| `/idea [texto libre]`         | —                   | Captura rápida en el parking de ideas — sin preguntas |
| `/ideas [módulo]`             | —                   | Lista el backlog de `.claude/ideas/parking-lot.md`    |
| `/ideas promote [NNN]`        | `gap-discovery`     | Promociona una idea parked a GAP con protocolo completo |
| `/help`                       | —                   | Referencia rápida de todos los comandos y agentes activos |

---

## Git Policy

### Context auto-detection

Claude Code determines the working context automatically at the start of every session:

**LOCAL context** — All of the following are true:

- The project filesystem is accessible (`src/`, `.claude/`, `package.json` exist and are readable)
- A `.git` directory is present at the project root
- Claude Code is running via an editor extension (Cursor, VS Code, etc.)

**CLOUD context** — Any of the following:

- The project filesystem is NOT accessible
- No `.git` directory is present
- Claude Code is running in a sandboxed or remote environment (Claude.ai mobile, web)

At session start, Claude Code MUST silently check for `src/` and `.git/` to determine
context. No need to inform the user unless the context affects an action being requested.

---

### LOCAL context rules

Claude Code NEVER runs git commands that modify repository state:

- No: `git commit`, `git push`, `git branch`, `git checkout -b`, `git merge`, `git rebase`
- Yes (read-only): `git status`, `git log`, `git diff` — only if needed for context

Claude Code ONLY edits files. The user manages all git operations manually.

**Exception:** If the user explicitly requests a specific git action in their message
("haz commit", "crea una rama para esto"), Claude Code may execute that single
requested action only. This does not unlock git for the rest of the session.

**Why:** In local context the user has Cursor open, sees every file change in real time,
and commits deliberately. Automatic git operations would pollute their commit history
and potentially interfere with their branching strategy.

---

### CLOUD context rules

Full git workflow is available and expected:

- Branch per GAP: `feature/GAP-NNN-short-description`
- Commit messages: `[GAP-NNN] Short description of what changed`
- Never commit directly to `main` or `master` — always branch + merge
- Never force-push without explicit user instruction
- Before any commit to a branch, verify it has not already been merged:
  run `git branch --merged` and abort if the branch appears in the output
- Merge only when the user explicitly instructs it

**Why:** In cloud context (Claude.ai mobile) the user is not watching file changes
in real time. Git operations are the primary way to structure and deliver work.

---

## GIT POLICY — PROTOCOLO OBLIGATORIO PRE-PUSH

### Regla absoluta antes de cualquier `git push`

**PASO 1** — Verificar que node_modules existe:

```bash
ls node_modules/.bin/next 2>/dev/null && echo "OK" || echo "INSTALAR"
```

Si no existe:

```bash
npm ci
```

**PASO 2** — Ejecutar type-check completo y leer TODO el output:

```bash
npm run type-check 2>&1
```

- Si hay errores → **NO hacer push**. Leer TODOS los errores de golpe, agruparlos por fichero, corregirlos TODOS en el mismo turno, y volver al Paso 2.
- Si el output es limpio (exit 0) → continuar al Paso 3.

**PASO 3** — Solo entonces hacer `git push`.

### Regla: NUNCA corregir un error de TypeScript en commit individual

Cuando hay múltiples errores de tipos en un fichero, el agente DEBE:

1. Leer el output completo de `npm run type-check 2>&1` (no solo el primer error)
2. Identificar TODOS los errores del fichero afectado
3. Corregirlos TODOS en un único commit
4. Volver a ejecutar type-check hasta que sea limpio
5. Entonces hacer push

**Nunca**: un commit por error. Eso genera la cascada de deploys fallidos.

### Regla: alias de paths

El alias correcto en este proyecto es siempre `@/` (con barra).

- ✅ `import { X } from '@/lib/utils'`
- ❌ `import { X } from '@lib/utils'`
- ❌ `import { X } from '@lib/'`

Antes de cualquier import nuevo, verificar `tsconfig.json paths`.

### Regla: commits de documentación

Los commits de documentación (`.claude/gaps/`, `project-learnings.md`, etc.) van **siempre en el mismo commit** que el código al que corresponden. Nunca en commits separados.

**Mal**: commit de código → commit de doc → dos deploys fallidos o superfluos.
**Bien**: un único commit con código + doc juntos.

### Protocolo cuando Vercel reporta un error de build

Si el usuario pega un error de Vercel build log:

1. Pedir el **log completo** (desde el principio, no solo el último error visible)
2. Extraer TODOS los errores del log de una vez
3. Agrupar por fichero
4. Corregir todos en el mismo turno
5. Ejecutar `npm run type-check` localmente para confirmar
6. Un único commit con todos los fixes

### Regla: migraciones .jsx → .tsx

Las migraciones de JavaScript a TypeScript son operaciones de alto riesgo.
Antes de migrar CUALQUIER fichero `.jsx` a `.tsx`:

1. Ejecutar `npm run type-check 2>&1` para tener el baseline actual
2. Migrar el fichero
3. Ejecutar `npm run type-check 2>&1` inmediatamente
4. Resolver TODOS los errores nuevos antes de pasar al siguiente fichero
5. NUNCA migrar múltiples ficheros .jsx→.tsx en el mismo commit si generan errores
