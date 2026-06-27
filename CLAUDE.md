# La PesquerApp — Frontend

SaaS multi-tenant ERP para el sector pesquero y de congelados. Cubre módulos de ventas, stock, etiquetas, catálogos de sector, CRM comercial, gestión de proveedores y maquiladores. Backend Laravel · Frontend Next.js con App Router.

---

## Mandatory Context Files

Read these before starting any work in the relevant area:

| File | When to read |
|---|---|
| `.claude/design-context.md` | **Mandatory before implementing any UI.** Contains the visual and UX criteria extracted from the codebase. Kept current by the `/ui-feedback` skill. |
| `.claude/project-learnings.md` | **Mandatory before any audit, GAP, or implementation.** Institutional memory — PesquerApp-specific rules, patterns, and corrections discovered over time. Maintained by `system-learner`. |
| `.claude/rules/typescript.md` | All TypeScript work — interfaces, types, strict mode rules |
| `.claude/rules/components.md` | All React component work — structure, patterns, naming |
| `.claude/rules/hooks.md` | All hook work — TanStack Query, mutations, staleTime |
| `.claude/rules/api-client.md` | All service / HTTP work — fetchWithTenant, helpers |
| `.claude/rules/testing.md` | All test work — Vitest patterns, mocking |
| `.claude/skills/mobile-ui/SKILL.md` | All mobile UI work — hooks, tokens, layout shell |

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
npm run dev          # Servidor de desarrollo (puerto 3000, proxy → localhost:8000)
npm run build        # Build de producción
npm run lint         # ESLint (next/core-web-vitals + regla custom de queryKeys)
npm run format       # Prettier --write . (con prettier-plugin-tailwindcss)
npm run test         # Vitest en modo watch
npm run test:run     # Vitest una ejecución (para CI)
```

---

## Archivos protegidos — detener y preguntar antes de tocar

| Archivo                          | Razón                                                                         | Acción requerida                                                     |
| -------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/configs/entitiesConfig.js`  | Punto de entrada del config modular — reexporta desde `src/configs/entities/` | Solo modificar el reexport; nunca añadir entidades directamente aquí |
| `src/hooks/useOrder.js` (~40 KB) | Hook gigante — no añadir lógica aquí                                          | Crear sub-hook en `src/hooks/orders/useOrderXxx.ts`                  |
| `src/hooks/usePallet.ts`         | Hook gigante — no añadir lógica aquí                                          | Crear sub-hook en `src/hooks/pallets/usePalletXxx.ts`                |
| `src/hooks/useLabelEditor.ts`    | Hook gigante refactorizado — no añadir lógica aquí                            | Crear sub-hook en `src/hooks/labels/useLabelXxx.ts`                  |
| `src/middleware.ts`              | Auth + tenant + RBAC crítico                                                  | Revisar impacto en todos los roles antes de modificar                |
| `src/lib/fetchWithTenant.js`     | Único punto HTTP — un cambio aquí afecta a toda la aplicación                 | Solo con revisión explícita del dev                                  |

---

## Deuda técnica documentada

1. **React 19-rc canary** — versión no estable en producción. Riesgo de breaking changes en cada rc update.
2. **Codebase mixto JS/TS** — servicios legacy en `.js`. Migrar al tocar cualquier archivo legacy.
3. **Sin pre-commit hooks** — Husky/lint-staged pendiente de configurar en fase posterior.
4. **Sin tests de UI** — Vitest solo cubre lógica (hooks, services, utils), no componentes React.
5. **`entitiesConfig.js`** — ✅ partido en módulos por dominio en `src/configs/entities/` (GAP-007).
6. **Hooks gigantes** — `useOrder` 40 KB · `usePallet` 48 KB · `useLabelEditor` 52 KB. Pendiente refactor en sub-hooks.
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

Para documentación extendida, ver `docs/ai-context/`. Para reglas específicas por área, ver `.claude/rules/`. Para agentes especializados, ver `.claude/agents/`.

### Agentes disponibles en `.claude/agents/`

| Agente | Rol | Se activa cuando |
|---|---|---|
| `gap-discovery` | Tech lead — convierte ideas en GAPs verificables | Jose describe un problema, mejora o feature |
| `gap-implementor` | Desarrollador senior — ejecuta exactamente lo que el GAP describe | Jose confirma un GAP para implementar |
| `gap-auditor` | Senior engineer independiente — veredicto técnico + visual + invoca UX Reviewer | El Implementador termina |
| `ux-reviewer` | UX specialist — simula flujos reales, identifica fricción, bloquea cierre por fallos UX | Invocado por el Auditor tras revisión técnica + visual. Full (flujos complejos) / Light (cambios menores) |
| `frontend-developer` | Desarrollador frontend generalista | Tareas de desarrollo que no siguen el flujo GAP |
| `mobile-ui-agent` | Especialista en UI mobile | Trabajo en vistas mobile con `/mobile` |
| `ui-audit-agent` | Auditor autónomo de UI — recorre vistas, genera findings, convierte en GAPs | Invocado por `/audit-mobile` o `/audit-desktop` |
| `system-learner` | Memoria institucional — traduce hallazgos y correcciones en reglas permanentes en `project-learnings.md` | Invocado por el Auditor, UX Reviewer, o Jose |
| `code-audit-agent` | Auditor técnico autónomo — calidad de código, deuda de migración y arquitectura React/Next.js. Nunca evalúa UI/UX. | Invocado por `/audit-code [quality\|migrate\|arch]` |
| `code-reviewer` | Revisor de código independiente | Revisión de PRs y diffs |
| `db-architect` | Arquitecto de base de datos | Cambios de esquema o modelos |

### Slash commands disponibles

| Comando | Agente | Descripción |
|---|---|---|
| `/audit-mobile` | `ui-audit-agent` | Auditoría UI de vistas mobile |
| `/audit-desktop` | `ui-audit-agent` | Auditoría UI de vistas desktop |
| `/audit-code quality` | `code-audit-agent` | Violaciones de calidad de código y reglas |
| `/audit-code migrate` | `code-audit-agent` | Candidatos JS→TS y patrones deprecated |
| `/audit-code arch` | `code-audit-agent` | Problemas arquitectónicos React/Next.js |
| `/audit-code [mode] [module]` | `code-audit-agent` | Scope reducido a un módulo específico |

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
