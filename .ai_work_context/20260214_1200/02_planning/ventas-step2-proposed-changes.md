# STEP 2 — Cambios propuestos: Ventas

**Bloque**: Ventas  
**Fecha**: 2026-02-14  
**Estado**: Pendiente de aprobación del usuario

**Referencia**: STEP 1 — Análisis (`01_analysis/ventas-step1-analisis.md`)  
**Rating antes**: 4/10

---

## Resumen de mejoras identificadas

Se han agrupado en **sub-bloques** para implementación incremental y reversible.

---

## Sub-bloque 1: Tests para orderService (P0 — base de seguridad)

**Objetivo**: Evitar regresiones al refactorizar; requisito del plan CORE.

| Cambio | Descripción | Riesgo |
|--------|-------------|--------|
| Añadir Vitest (si no existe) | Configurar vitest.config; setup para mocks de fetchWithTenant | Bajo |
| Tests para orderService | getOrder, getActiveOrders, createOrder, updateOrder, setOrderStatus (mocks) | Bajo |

**Verificación**: `npm run test` pasa  
**Plan de rollback**: Eliminar archivos de test si causan problemas  
**Impacto**: Sin cambios en UI ni comportamiento; solo tests

**Rating después esperado**: 4.5/10 (mejora marginal; base para refactors seguros)

---

## Sub-bloque 2: Migrar data fetching a React Query (P1)

**Objetivo**: Caché, invalidación y consistencia; alinear con stack del proyecto.

| Cambio | Descripción | Riesgo |
|--------|-------------|--------|
| useOrders (nuevo hook) | useQuery para getActiveOrders; queryKey con tenantId | Medio |
| useOrder (refactor) | Sustituir useEffect por useQuery para getOrder | Medio |
| OrdersManager | Usar useOrders en lugar de useEffect + getActiveOrders | Medio |
| Invalidación | Al crear/actualizar pedido, invalidar ['orders', tenantId] | Medio |

**Dependencias**: TenantContext o getCurrentTenant para queryKey (evaluar si TenantContext existe)  
**Verificación**: Lista y detalle cargan igual; al editar, lista se actualiza  
**Plan de rollback**: Revertir a useEffect si hay problemas  
**Breaking**: No; misma API pública de componentes

**Rating después esperado**: 5.5/10

---

## Sub-bloque 3: Extraer StatusBadge y reducir Order (P0 parcial)

**Objetivo**: Reducir tamaño de Order; componente reutilizable.

| Cambio | Descripción | Riesgo |
|--------|-------------|--------|
| StatusBadge | Extraer a `components/ui/status-badge.jsx` o `OrdersManager/StatusBadge.jsx` | Bajo |
| Order | Importar StatusBadge; eliminar definición inline | Bajo |

**Verificación**: UI idéntica; Order pasa de ~681 L a ~650 L (reducción pequeña pero paso incremental)  
**Rating después esperado**: 4.5/10 (Order sigue >200 L; necesario sub-bloque 4)

---

## Sub-bloque 4: Dividir OrderPallets (P0 crítico)

**Objetivo**: Reducir OrderPallets de 1475 L a componentes <200 L.

| Cambio | Descripción | Riesgo |
|--------|-------------|--------|
| Análisis de OrderPallets | Mapear secciones lógicas (tabla, búsqueda, modales, vinculación) | Bajo |
| Extraer componentes | OrderPalletsTable, SearchPalletDialog, LinkPalletsDialog, etc. | Medio-Alto |
| Extraer hooks | useOrderPallets, usePalletSearch (si aplica) | Medio |

**Verificación**: Funcionalidad de palets idéntica; tests manuales de vincular/desvincular  
**Plan de rollback**: Revertir commits  
**Nota**: Sub-bloque más complejo; puede dividirse en 4a (extraer tabla) y 4b (extraer modales)

**Rating después esperado**: 6/10 (si se completa bien)

---

## Sub-bloque 5: Dividir OrderCustomerHistory (P0 crítico)

**Objetivo**: Reducir OrderCustomerHistory de 1225 L.

| Cambio | Descripción | Riesgo |
|--------|-------------|--------|
| Análisis de OrderCustomerHistory | Identificar secciones (histórico, filtros, tabla, etc.) | Bajo |
| Extraer componentes | CustomerHistoryTable, CustomerHistoryFilters, etc. | Medio |
| Extraer hooks | useCustomerHistory (si hay lógica de fetch/filtrado) | Medio |

**Verificación**: Histórico de cliente se muestra correctamente  
**Rating después esperado**: 6.5/10

---

## Sub-bloque 6: TypeScript en servicios (P1)

**Objetivo**: Empezar migración a TypeScript; prioridad en API.

| Cambio | Descripción | Riesgo |
|--------|-------------|--------|
| orderService.ts | Renombrar orderService.js → .ts; añadir tipos para Order, OrderItem, etc. | Medio |
| Tipos compartidos | types/order.ts con interfaces Order, PlannedProductDetail, etc. | Bajo |

**Verificación**: Build sin errores; imports actualizados  
**Nota**: Requiere tsconfig si no existe  
**Rating después esperado**: 5.5/10

---

## Orden de ejecución recomendado

1. **Sub-bloque 1** (tests) — Base de seguridad; sin riesgo para UI  
2. **Sub-bloque 3** (StatusBadge) — Rápido, bajo riesgo  
3. **Sub-bloque 2** (React Query) — Impacto alto en arquitectura  
4. **Sub-bloque 6** (TypeScript servicios) — Puede hacerse en paralelo o después de 2  
5. **Sub-bloque 4** (OrderPallets) — Más esfuerzo; mejor con tests ya en marcha  
6. **Sub-bloque 5** (OrderCustomerHistory) — Similar a 4  

---

## Qué NO se incluye en esta propuesta (requiere decisión o scope aparte)

- Cambios en EntityClient (orders) — sistema genérico; evaluar en bloque Entity
- TenantContext — si no existe, crearlo es P1 pero afecta a toda la app
- Refactor completo de useOrder — muy grande; podría ser sub-bloque 7 tras 2 y 4
- Cambios de UI/UX (colores, layout, copy) — prohibidos sin aprobación explícita

---

## Solicitud de aprobación

**¿Apruebas ejecutar el Sub-bloque 1 (Tests para orderService) como primer paso?**

Si apruebas, procederé con la implementación de Sub-bloque 1.  
Si prefieres otro sub-bloque primero o ajustar el plan, indícalo.
