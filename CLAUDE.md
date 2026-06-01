# La PesquerApp — Frontend

SaaS multi-tenant ERP para el sector pesquero y de congelados. Cubre módulos de ventas, stock, etiquetas, catálogos de sector, CRM comercial, gestión de proveedores y maquiladores. Backend Laravel · Frontend Next.js con App Router.

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
│   ├── entitiesConfig.js  # ⛔ 121 KB — ZONA PROTEGIDA (ver sección archivos protegidos)
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

| Archivo                                | Razón                                                          | Acción requerida                                         |
| -------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| `src/configs/entitiesConfig.js`        | 121 KB · monolito · afecta a **todas** las entidades del admin | **Detener y preguntar al dev antes de cualquier cambio** |
| `src/hooks/useOrder.js` (~40 KB)       | Hook gigante — no añadir lógica aquí                           | Crear sub-hook en `src/hooks/orders/useOrderXxx.ts`      |
| `src/hooks/usePallet.js` (~48 KB)      | Hook gigante — no añadir lógica aquí                           | Crear sub-hook en `src/hooks/pallets/usePalletXxx.ts`    |
| `src/hooks/useLabelEditor.ts` (~52 KB) | Hook gigante — no añadir lógica aquí                           | Crear sub-hook en `src/hooks/labels/useLabelXxx.ts`      |
| `src/middleware.ts`                    | Auth + tenant + RBAC crítico                                   | Revisar impacto en todos los roles antes de modificar    |
| `src/lib/fetchWithTenant.js`           | Único punto HTTP — un cambio aquí afecta a toda la aplicación  | Solo con revisión explícita del dev                      |

---

## Deuda técnica documentada

1. **React 19-rc canary** — versión no estable en producción. Riesgo de breaking changes en cada rc update.
2. **Codebase mixto JS/TS** — servicios legacy en `.js`. Migrar al tocar cualquier archivo legacy.
3. **Sin pre-commit hooks** — Husky/lint-staged pendiente de configurar en fase posterior.
4. **Sin tests de UI** — Vitest solo cubre lógica (hooks, services, utils), no componentes React.
5. **`entitiesConfig.js` de 121 KB** — monolito pendiente de partir en módulos por dominio de negocio.
6. **Hooks gigantes** — `useOrder` 40 KB · `usePallet` 48 KB · `useLabelEditor` 52 KB. Pendiente refactor en sub-hooks.
7. **Cobertura de tests** — 20 archivos de test para 269 componentes y 84+ hooks.
8. **`entityServiceMapper.js`** — candidato prioritario de migración a TypeScript.

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
