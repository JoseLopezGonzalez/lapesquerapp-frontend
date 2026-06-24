# Auditoría UX/UI — Panel Superadmin

**Fecha de auditoría**: 2026-06-24  
**Fecha de implementación**: 2026-06-24  
**Estado**: ✅ COMPLETADA (hallazgos prioritarios implementados; deuda arquitectónica pendiente documentada)  
**Alcance**: Desktop. Mobile excluido de momento.  
**Archivos auditados**: 37 (13 app router pages + 24 componentes + 4 infraestructura)

---

## Resumen de implementación

| Categoría | Hallazgos | Resueltos | Pendientes |
|-----------|-----------|-----------|------------|
| Bugs reales | 3 | ✅ 3 | 0 |
| Componentes UI / shadcn | 7 | ✅ 5 | 2 |
| Accesibilidad | 3 | ✅ 3 | 0 |
| Texto / internacionalización | 12 | ✅ 12 | 0 |
| Documentación | 1 | ✅ 1 | 0 |
| TypeScript | 1 | ✅ 1 | 0 |
| Arquitectura de datos | 5 | 0 | ⏳ 5 |
| Arquitectura de páginas | 2 | 0 | ⏳ 2 |
| **TOTAL** | **34** | **25** | **9** |

---

## Cambios implementados

### Sprint 1 — Bugs reales (Prioridad 1)

**1. `<>` shorthand Fragment sin `key` en `ErrorLogsTab.tsx`**
- Todos los `.map()` que usaban `<>` sin `key` cambiados a `<React.Fragment key={log.id}>`
- Eliminado warning de React en producción y posibles bugs de reconciliación

**2. `key={i}` con índice de array en `system/page.tsx` (GlobalErrorLogs)**
- Clave estable: `String(log.id ?? log.occurred_at ?? log.created_at ?? i)`
- Estado `expanded: string | null` con comparación tipada correctamente

**3. `DialogDescription` faltante — 3 Dialogs**
- `BlocklistTab.tsx` — Dialog "Agregar bloqueo": descripción añadida
- `GeneralData.tsx` — Dialog "Editar tenant": descripción añadida
- `FeatureFlagsTab.tsx` — Dialog de habilitación de flag: descripción añadida

### Sprint 2 — UI y shadcn (Prioridad 2)

**4. `FilterTabs` reemplazado con shadcn `Tabs`**
- Archivo `FilterTabs.tsx` reescrito: usa `Tabs/TabsList/TabsTrigger` de `@/components/ui/tabs`
- Accesibilidad ARIA automática (Radix UI); eliminadas las clases CSS manuales de botones
- Los 4 consumidores (`TenantsTable`, `AlertsPage`, `ErrorLogsTab`, `SystemPage`) no requirieron cambios en sus props

**5. `<select>` nativos → `Select` de shadcn (5 instancias)**
- `TenantForm.tsx`: selects Plan y Timezone migrados a `Select` + `Controller`
- `GeneralData.tsx`: selects Plan y Timezone migrados a `Select` + `Controller`
- `BlocklistTab.tsx`: select Tipo (IP/Email) migrado a `Select` + `Controller`
- Eliminado el bloque CSS copiado-pegado de ~7 líneas en cada select nativo

**6. `aria-label` en botones de expandir**
- `ErrorLogsTab.tsx`: botón expand con `aria-label="Ver detalle"` / `"Ocultar detalle"`
- `system/page.tsx` (`GlobalErrorLogs`): `TableRow` clickeable con `aria-label` descriptivo y chevron visual

### Sprint 3 — Texto y consistencia (Prioridad 4)

**7. Corrección de acentos — 15+ textos**
- `ActiveSessionsBanner.tsx`: "impersonación"
- `SubdomainField.tsx`: "minúsculas", "Máximo", "está en uso"
- `BlocklistTab.tsx`: "Acción", "vacío"
- `StatusActions.tsx`: "Acción ejecutada", "acción"
- `TokensTab.tsx`: "Acción", "Último", "sesión"
- `ErrorLogsTab.tsx`: "Método"
- `OnboardingProgress.tsx`: "Catálogos", "Configuración", "Activación"
- `TenantUsersTable.tsx`: "aún", "está"
- `AlertsWidget.tsx`: "crítica"
- `TenantsTable.tsx`: "Estado" (columna renombrada desde "Status")

**8. Uniformado de `h1` — `text-2xl font-semibold` en todas las páginas**
- `AdminsManager.tsx`, `alerts/page.tsx`, `impersonation/page.tsx`, `system/page.tsx`, `GlobalFeatureFlagsTable.tsx` — todos actualizados de `text-lg` a `text-2xl`
- Consistente con el panel Admin principal

### Sprint 4 — Documentación y arquitectura (Prioridad 4)

**9. Excepción `superadminApi.ts` documentada en `CLAUDE.md`**
- Sección `## Excepción documentada — Panel Superadmin` añadida
- Justificación: el superadmin no tiene tenant y usa su propio JWT independiente de NextAuth
- Código de ejemplo de uso correcto y prohibición explícita fuera de `src/app/superadmin/**` y `src/components/Superadmin/**`

**10. Migración TypeScript completa — 40 archivos**
- Renombrados via `git mv` para preservar historial de cambios
- Infraestructura: `superadminApi.ts`, `superadminDateUtils.ts`, `SuperadminAuthContext.tsx`
- App Router (13 archivos): todos los `page.js` → `page.tsx`, `layout.js` → `layout.tsx`, `SuperadminLayoutClient.jsx` → `.tsx`
- Componentes (24 archivos): todos los `*.jsx` → `*.tsx`
- Tipos añadidos con `interface` para entidades de API, props de componentes y retornos de helpers
- Bugs de TypeScript corregidos: `Date.now() - date.getTime()`, `(err as Error).message`, `ReturnType<typeof setInterval> | null`
- Cero archivos `.js`/`.jsx` restantes en `src/app/superadmin/` y `src/components/Superadmin/`

---

## Deuda arquitectónica pendiente

Las siguientes áreas requieren iteraciones dedicadas y no se abordaron en esta auditoría:

### ⏳ TanStack Query — toda la capa de datos

El panel no usa TanStack Query. El patrón `useState + useEffect + useCallback` está repetido ~20 veces. Migración requiere:
- Crear servicios en `src/services/domain/superadmin/` siguiendo el patrón existente
- Crear hooks especializados (`useTenantsList`, `useAlerts`, etc.)
- Añadir query keys en `src/lib/routes/queryKeys.ts`
- Resolver el polling duplicado (`ActiveSessionsBanner` + sidebar) vía queries compartidas

### ⏳ Errores silenciados (`catch { /* silent */ }`)

Múltiples `catch` no muestran feedback al usuario. `ActivityFeed` y `ActiveSessionsBanner` muestran vacío sin distinguir "sin datos" de "error de API". Solución mínima: `notify.error()` en cada `catch`; solución ideal: estado `error` via TanStack Query.

### ⏳ `per_page=500` en tenants del filtro de impersonaciones

`impersonation/page.tsx` carga hasta 500 tenants para un `<Select>`. Debe reemplazarse con un Combobox con búsqueda lazy al endpoint `/tenants/options` o endpoint de búsqueda dedicado.

### ⏳ Paginación duplicada — 6 implementaciones inline

El mismo bloque `ChevronLeft + ChevronRight + texto` aparece 6 veces. Candidato a componente `SuperadminPagination` reutilizable una vez el panel madure.

### ⏳ Patrón page → PageClient

`alerts/page.tsx`, `impersonation/page.tsx`, `system/page.tsx` y `tenants/[id]/page.tsx` tienen `'use client'` directamente. El patrón del proyecto es `page.tsx` (Server Component) → `XxxPageClient.tsx` (Client Component). Refactor posible pero de baja urgencia dado que el panel superadmin no requiere SSR ni metadata dinámica.

### ⏳ Formularios sin Zod

`TenantForm`, `AdminsManager`, `BlocklistTab`, `GeneralData` usan `react-hook-form` con validación inline. Pendiente crear schemas Zod + `zodResolver` para consistencia con el resto de la app.

### ⏳ `EmptyState` custom vs primitivo shadcn

`src/components/Superadmin/EmptyState.tsx` tiene una API más conveniente (`icon`, `compact`, `className`) que el primitivo `Empty/EmptyHeader/EmptyTitle` de shadcn. Se mantuvo porque su API es más ergonómica para los 9 consumidores actuales. Si el panel crece, debería unificarse.

### ⏳ Colores Tailwind directos en badges

Badges de severidad y estado usan `text-orange-700`, `text-green-600`, `text-blue-700` directamente. Son semánticamente correctos para su contexto pero frágiles ante cambios de tema. Solución ideal: definir variables CSS semánticas (`--severity-critical`, `--severity-warning`, etc.) o variantes de Badge específicas.

---

## Resumen ejecutivo (original)

1. **Deuda de TypeScript masiva y uniforme** ✅ RESUELTA: Todo el panel (40 archivos) migrado a `.ts`/`.tsx`.

2. **Propia capa HTTP paralela a `fetchWithTenant`** ✅ DOCUMENTADA: `superadminApi.ts` documentado como excepción justificada en `CLAUDE.md`.

3. **Capa de datos completamente fuera del patrón** ⏳ PENDIENTE: Sin TanStack Query. Requiere iteración dedicada.

4. **Componentes UI propios que duplican primitivos shadcn** ✅ PARCIALMENTE RESUELTO:
   - `FilterTabs` → reemplazado con `Tabs` de shadcn
   - 5 `<select>` nativos → reemplazados con `Select` de shadcn
   - `EmptyState` mantenido (API más conveniente para el panel)

5. **15+ textos con acentos ausentes** ✅ RESUELTO: todos corregidos.

---

## Hallazgos detallados (tabla de estado)

| # | Archivo | Problema | Severidad | Estado |
|---|---------|----------|-----------|--------|
| 1 | Todos (40 archivos) | `.js`/`.jsx` — violación Regla de Oro 3 | **Alta** | ✅ RESUELTO — migrado a `.ts`/`.tsx` |
| 2 | `FilterTabs.tsx` | `<button>` nativo reimplementa shadcn Tabs | **Alta** | ✅ RESUELTO — usa `Tabs/TabsList/TabsTrigger` |
| 3 | `EmptyState.tsx` | Duplica `src/components/ui/empty.jsx` | **Alta** | ⏳ MANTENIDO — API más conveniente para el panel |
| 4 | `TenantForm.tsx` | `<select>` nativo con CSS inline (Plan, Timezone) | **Alta** | ✅ RESUELTO — usa `Select` + `Controller` |
| 5 | `BlocklistTab.tsx` | `<select>` nativo con CSS inline (Tipo) | **Alta** | ✅ RESUELTO — usa `Select` + `Controller` |
| 6 | `GeneralData.tsx` | `<select>` nativo con CSS inline (Plan, Timezone) | **Alta** | ✅ RESUELTO — usa `Select` + `Controller` |
| 7 | Todos los formularios | Sin Zod; validación inline en `react-hook-form` | **Alta** | ⏳ PENDIENTE — iteración futura |
| 8 | `ErrorLogsTab.tsx` | `<>` shorthand Fragment en `.map()` sin `key` | **Alta** | ✅ RESUELTO — `<React.Fragment key={log.id}>` |
| 9 | `impersonation/page.tsx` | `per_page=500` — carga completa sin paginar | **Media** | ⏳ PENDIENTE — requiere Combobox lazy |
| 10 | `system/page.tsx` | `key={i}` con índice de array en logs | **Media** | ✅ RESUELTO — clave estable vía `String(log.id ?? ...)` |
| 11 | `tenants/[id]/page.tsx` | `'use client'` directo — rompe patrón App Router | **Media** | ⏳ PENDIENTE — baja urgencia |
| 12 | `alerts/page.tsx`, `impersonation/page.tsx`, `system/page.tsx` | `'use client'` directo en page | **Media** | ⏳ PENDIENTE — baja urgencia |
| 13 | `BlocklistTab.tsx` | Dialog sin `DialogDescription` | **Media** | ✅ RESUELTO — descripción añadida |
| 14 | `GeneralData.tsx` | Dialog sin `DialogDescription` | **Media** | ✅ RESUELTO — descripción añadida |
| 15 | `ImpersonationButtons.tsx` | Estado `pendingRequest` no persiste; UX confusa | **Media** | ⏳ PENDIENTE — requiere diseño UX dedicado |
| 16 | `ActiveSessionsBanner.tsx` + sidebar | Polling duplicado al mismo endpoint | **Media** | ⏳ PENDIENTE — resoluble con TanStack Query |
| 17 | Múltiples componentes | Errores de fetch silenciados sin feedback | **Media** | ⏳ PENDIENTE — resoluble con TanStack Query |
| 18 | 6 componentes | Paginación duplicada inline | **Media** | ⏳ PENDIENTE — candidato a `SuperadminPagination` |
| 19 | `ErrorLogsTab.tsx` | Botones expand sin `aria-label` | **Media** | ✅ RESUELTO — `aria-label` añadido |
| 20 | `system/page.tsx` | Fila expandible sin `aria-label` | **Media** | ✅ RESUELTO — `aria-label` en `TableRow` |
| 21 | `superadminApi.ts` | Excepción `fetch()` directo no documentada | **Media** | ✅ RESUELTO — documentado en `CLAUDE.md` |
| 22 | `TenantsTable.tsx` | Columna "Status" en inglés | **Baja** | ✅ RESUELTO — "Estado" |
| 23 | `ActiveSessionsBanner.tsx` | "impersonacion" sin acento | **Baja** | ✅ RESUELTO |
| 24 | `SubdomainField.tsx` | "minusculas", "Maximo", "esta en uso" | **Baja** | ✅ RESUELTO |
| 25 | `BlocklistTab.tsx` | "Accion", "vacio" sin acento | **Baja** | ✅ RESUELTO |
| 26 | `StatusActions.tsx` | "Accion ejecutada", "accion" | **Baja** | ✅ RESUELTO |
| 27 | `TokensTab.tsx` | "Accion", "Ultimo", "sesion" | **Baja** | ✅ RESUELTO |
| 28 | `ErrorLogsTab.tsx` | "Metodo" sin acento | **Baja** | ✅ RESUELTO |
| 29 | `OnboardingProgress.tsx` | "Catalogos", "Configuracion", "Activacion" | **Baja** | ✅ RESUELTO |
| 30 | `TenantUsersTable.tsx` | "aun", "esta" sin acento | **Baja** | ✅ RESUELTO |
| 31 | `AlertsWidget.tsx` | "critica" sin acento | **Baja** | ✅ RESUELTO |
| 32 | Páginas del panel | `h1` inconsistente `text-lg` vs `text-2xl` | **Baja** | ✅ RESUELTO — uniformado a `text-2xl` |
| 33 | Múltiples | Colores Tailwind directos en badges | **Baja** | ⏳ PENDIENTE — requiere design tokens |
| 34 | `FeatureFlagsTab.tsx` | Dialog de habilitación sin `DialogDescription` | **Media** | ✅ RESUELTO — descripción añadida |

---

## Arquitectura de referencia post-implementación

```
src/
├── app/superadmin/           # Todos los archivos en .tsx (migrado)
│   ├── layout.tsx            # Server Component → SuperadminLayoutClient
│   ├── SuperadminLayoutClient.tsx  # Client: sidebar + breadcrumb + auth
│   ├── page.tsx              # Dashboard
│   ├── tenants/              # CRUD de tenants
│   ├── alerts/page.tsx       # Gestión de alertas (con client directo — pendiente extraer)
│   ├── impersonation/page.tsx
│   ├── system/page.tsx
│   └── admins/               # CRUD de admins superadmin
│
├── components/Superadmin/    # Todos los archivos en .tsx (migrado)
│   ├── FilterTabs.tsx        # ← usa Tabs/TabsList/TabsTrigger de shadcn
│   ├── EmptyState.tsx        # ← mantenido (API compact conveniente)
│   └── TenantDetailSections/ # Tabs de detalle de tenant
│
├── lib/superadminApi.ts      # Excepción HTTP documentada en CLAUDE.md
├── context/SuperadminAuthContext.tsx
└── utils/superadminDateUtils.ts
```
