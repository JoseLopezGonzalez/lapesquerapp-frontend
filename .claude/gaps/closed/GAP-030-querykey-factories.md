# GAP-030 — Añadir factories queryKey y eliminar inline arrays en hooks CRM/Comercial/Catálogos

## Metadata

- **Tipo:** Refactor
- **Módulo:** Global (CRM, Comercial, Catálogos, Usuarios)
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-28
- **Autor:** Jose

---

## Contexto y problema

El proyecto tiene una regla ESLint activa que prohíbe inline arrays en `queryKey`.
Todos los queryKeys deben usar factories de `src/lib/routes/queryKeys.ts`. La regla
está activa pero no ha sido retroaplicada a hooks legacy.

Los siguientes hooks aún usan inline arrays en `queryKey` (excluyendo los ya cubiertos
en GAP-025 a GAP-029):

| Hook | Inline arrays detectados |
|------|--------------------------|
| `useIncotermsList.ts` | 1 — falta staleTime (catálogo, 10 min) |
| `useDispatchesList.js` | 1 — además es archivo .js (migrar a .ts) |
| `useFieldOperators.ts` | 2 hooks + invalidateQueries |
| `useDashboardCharts.ts` | 2 restantes: useReceptionChartData, useDispatchChartData |
| `useSuppliersList.ts` | 1 — falta staleTime (catálogo, 10 min) |
| `useCrmDashboard.ts` | 3 inline en useQueries |
| `useCommercialInteractions.ts` | 1 — normalizeQueryParams local (PL-NEW-D) |
| `useMe.ts` | 1 |
| `useOffers.ts` | 2 hooks + invalidateQueries |
| `useAgenda.ts` | 3 hooks |
| `useProspects.ts` | Usa `useTenantQueryKey()` local en lugar de factory (PL-NEW-D) |

Adicionalmente:
- `useCommercialInteractions.ts` duplica `normalizeQueryParams` localmente (PL-NEW-D)
  en lugar de importarla desde `queryKeys.ts`.
- `useProspects.ts` tiene un helper `useTenantQueryKey()` local que construye arrays
  dinámicos — no satisface la regla aunque parezca una factory.
- `useDashboardCharts.ts`: la función helper `useChartData` acepta `queryKey: unknown[]`
  permitiendo arrays inline indirectos.

## Solución acordada

1. Añadir las factories necesarias a `src/lib/routes/queryKeys.ts`:

   ```ts
   // Catálogos
   export const incotermQueryKeys = { list: (tenantId) => [...] }
   export const supplierListKeys = { list: (tenantId, filters, page, perPage) => [...] }

   // Usuarios
   export const userQueryKeys = { me: (tenantId) => [...] }

   // Ofertas
   export const offerQueryKeys = {
     list: (tenantId, filters, page) => [...],
     listPrefix: (tenantId) => [...]
   }

   // Agenda CRM
   export const agendaQueryKeys = {
     summary: (tenantId, filters) => [...],
     pending: (tenantId, targetType, targetId) => [...],
     calendar: (tenantId, filters) => [...]
   }

   // Despachos
   export const dispatchQueryKeys = { list: (tenantId, filters, page) => [...] }

   // Field operators
   export const fieldOperatorQueryKeys = {
     list: (tenantId, filters, page) => [...],
     options: (tenantId) => [...]
   }

   // CRM Dashboard
   export const crmDashboardKeys = {
     customers: (tenantId, filters) => [...],
     prospects: (tenantId, filters) => [...],
     pendingActions: (tenantId, filters) => [...]
   }

   // Interacciones comerciales
   export const commercialInteractionKeys = {
     list: (tenantId, filters, page) => [...]
   }

   // Prospectos
   export const prospectQueryKeys = {
     list: (tenantId, filters, page) => [...],
     listPrefix: (tenantId) => [...]
   }

   // Charts recepciones y despachos (completar los de useDashboardCharts)
   export const receptionChartKeys = {
     chart: (tenantId, from, to, speciesId, categoryId, familyId, unit, groupBy) => [...]
   }
   export const dispatchChartKeys = {
     chart: (tenantId, from, to, speciesId, categoryId, familyId, unit, groupBy) => [...]
   }
   ```

2. Actualizar cada hook para usar su factory correspondiente.

3. `useDispatchesList.js` → renombrar a `useDispatchesList.ts` y migrar tipado mínimo.

4. `useCommercialInteractions.ts` → eliminar la función local `normalizeQueryParams`,
   importar desde `queryKeys.ts`.

5. `useProspects.ts` → eliminar `useTenantQueryKey()` local, usar `prospectQueryKeys` factory.

6. `useDashboardCharts.ts` → actualizar `useChartData` helper para aceptar la factory
   como función `() => unknown[]` en lugar de `unknown[]` ya construido, eliminando
   el inline indirecto.

7. Para hooks de catálogo con staleTime faltante (`useIncotermsList.ts`, `useSuppliersList.ts`):
   añadir `staleTime: 10 * 60 * 1000` (10 minutos, regla de catálogos).

## Referencias e inspiración

- PL-NEW-D (project-learnings.md): helpers locales de queryKey no satisfacen la regla.
- rules/hooks.md: "queryKey factories used — no inline queryKey arrays".
- `src/lib/routes/queryKeys.ts` — factories existentes como referencia de formato.
- Regla ESLint activa: `no-inline-query-keys` (ya genera warnings).
- staleTime para catálogos: 10 minutos (rules/hooks.md).

## Criterios de aceptación

- [ ] Las factories listadas existen en `queryKeys.ts`
- [ ] Ninguno de los 11 hooks listados tiene inline `queryKey: [...]` arrays
- [ ] `useDispatchesList.js` ha sido renombrado a `.ts` y el `.js` eliminado
- [ ] `useCommercialInteractions.ts` no tiene `normalizeQueryParams` local
- [ ] `useProspects.ts` no tiene `useTenantQueryKey()` local
- [ ] `useDashboardCharts.ts` — `useReceptionChartData` y `useDispatchChartData` usan factories
- [ ] `useIncotermsList.ts` y `useSuppliersList.ts` tienen `staleTime: 10 * 60 * 1000`
- [ ] `npm run lint` — cero warnings de inline queryKey en los archivos modificados
- [ ] `npm run build` pasa sin errores

## Archivos a crear o modificar

**Modificar:**
- `src/lib/routes/queryKeys.ts` — añadir ~12 factories nuevas

- `src/hooks/useIncotermsList.ts`
- `src/hooks/useDispatchesList.js` → renombrar a `.ts` (eliminar .js)
- `src/hooks/useFieldOperators.ts`
- `src/hooks/useDashboardCharts.ts`
- `src/hooks/useSuppliersList.ts`
- `src/hooks/useCrmDashboard.ts`
- `src/hooks/useCommercialInteractions.ts`
- `src/hooks/useMe.ts`
- `src/hooks/useOffers.ts`
- `src/hooks/useAgenda.ts`
- `src/hooks/useProspects.ts`

## Restricciones

- No cambiar las interfaces públicas de los hooks
- Solo añadir factories — no reorganizar `queryKeys.ts` ni renombrar las existentes
- No cambiar lógica de negocio en los hooks — solo los `queryKey` y `staleTime`
- No tocar hooks protegidos (useOrder, usePallet, useLabelEditor)
- No añadir tests en este GAP
- Los GAPs 025-029 cubren sus respectivos hooks — no duplicar

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
