# STEP 1 — Análisis: Ventas

**Bloque**: Ventas  
**Fecha**: 2026-02-14  
**Scope**: OrdersManager, Order (12 subsecciones), CreateOrderForm, OrdersList, EntityClient (orders), hooks, contextos, servicios

---

## Rating antes: 4/10

**Justificación**: Componentes muy grandes (OrderPallets 1475 L, OrderCustomerHistory 1225 L, Order 681 L) que bloquean mantenibilidad y pruebas. Data fetching manual (useEffect + useState) sin React Query; no hay caché ni invalidación unificada. Todo en JavaScript; sin TypeScript. Sin tests para el módulo. Formularios sí usan react-hook-form + zod; shadcn/ui consistente. Multi-tenant correcto vía fetchWithTenant.

---

## 1. Calidad estructural por entidad

### OrdersManager (411 L)
- **Estado**: P1 (>150 L)
- **Patrones**: useSession, useEffect para getActiveOrders, useDebounce, useMemo para filtrado
- **Problemas**: Data fetching manual; sin React Query; lógica de categorías/filtrado mezclada con UI

### Order (681 L)
- **Estado**: P0 (>200 L)
- **Patrones**: OrderProvider, lazy + Suspense para subcomponentes, tabs
- **Problemas**: Componente demasiado grande; StatusBadge inline; SECTIONS_CONFIG con 11 secciones

### OrderPallets (1475 L)
- **Estado**: P0 crítico
- **Problemas**: Mega-componente; lógica de vinculación, búsqueda, modales y tabla en un solo archivo

### OrderCustomerHistory (1225 L)
- **Estado**: P0 crítico
- **Problemas**: Histórico + lógica compleja en un solo archivo

### OrderPlannedProductDetails (657 L), OrderLabels (597 L), OrderDocuments (516 L)
- **Estado**: P1 (>150 L)
- **Problemas**: Componentes grandes; oportunidad de extraer hooks y subcomponentes

### OrdersList (427 L), CreateOrderForm (494 L), CreateOrderFormMobile (613 L)
- **Estado**: P1 (>150 L)
- **Problemas**: Lógica de exportación directa con fetch; formulario extenso

### useOrder (681 L)
- **Estado**: P1 — hook muy grande
- **Problemas**: Mezcla datos, mutaciones, exportDocuments, sendDocuments, pallets, incidencias; debería dividirse en hooks más pequeños (useOrderData, useOrderMutations, useOrderDocuments, etc.)

---

## 2. Uso de patrones Next.js/React

| Patrón | Presencia | Comentario |
|--------|-----------|------------|
| Server/Client Components | Parcial | Páginas Server; OrdersManager, Order, CreateOrderForm son Client |
| Custom Hooks | Sí | useOrder, useOrderFormConfig, useOrderFormOptions, useOrderCreateFormConfig |
| Data Fetching | Manual | useEffect + useState; sin React Query |
| Formularios | react-hook-form + zod | Correcto |
| State Management | Context (OrderContext, OrdersManagerOptionsContext) | Adecuado |
| API Layer | orderService, fetchWithTenant | Centralizado |
| TypeScript | No | Todo en JavaScript |
| UI Library | shadcn/ui | Consistente |
| Testing | No | Sin tests para Ventas |

---

## 3. Cumplimiento del stack del proyecto

| Criterio | Estado |
|----------|--------|
| Data Fetching: React Query | ❌ P1 — useEffect + useState; migrar a React Query |
| Forms: Zod | ✅ Sí |
| TypeScript | ❌ P0/P1 — Todo en .js/.jsx |
| Multi-tenancy: useTenant | ⚠️ Usa getCurrentTenant implícito vía fetchWithTenant; no TenantContext |
| Tests | ❌ P0 — Sin tests para orderService, useOrder, componentes críticos |
| Componentes >150 L | ❌ Varios P1; >200 L son P0 |

---

## 4. UI/UX y sistema de diseño

- shadcn/ui usado de forma consistente
- No se detectan NextUI u otras librerías en Ventas
- Diseño responsive (mobile/desktop) implementado

---

## 5. Deuda técnica detectada

### P0 (Críticos)
- OrderPallets (1475 L) — dividir en subcomponentes/hooks
- OrderCustomerHistory (1225 L) — dividir
- Order (681 L) — dividir; extraer StatusBadge, secciones
- Sin tests para orderService, useOrder
- Sin TypeScript en servicios ni componentes

### P1 (Altos)
- Data fetching manual → migrar a React Query
- useOrder (681 L) → dividir en useOrderData, useOrderMutations, useOrderDocuments, etc.
- OrdersManager, OrderPlannedProductDetails, CreateOrderForm, OrderLabels, OrderDocuments, OrderDetails, OrderProduction, OrderIncident, OrderEditSheet, OrdersList >150 L
- Sin TenantContext; usar useTenant() cuando exista

### P2 (Medios)
- OrdersList: exportDocument con fetch directo; extraer a servicio o hook
- EntityClient (orders): compartido; evaluar si refactor forma parte de bloque Entity genérico

---

## 6. Riesgos identificados

1. **Regresión**: Sin tests; cualquier refactor es arriesgado
2. **Mantenibilidad**: Componentes gigantes dificultan cambios
3. **Consistencia de datos**: Sin React Query; posibles estados obsoletos entre lista y detalle
4. **Onboarding**: Código difícil de seguir por tamaño y mezcla de responsabilidades

---

## 7. Oportunidades de mejora (priorizadas)

| Prioridad | Mejora | Impacto |
|-----------|--------|---------|
| P0 | Dividir OrderPallets en subcomponentes/hooks | Crítico |
| P0 | Dividir OrderCustomerHistory | Crítico |
| P0 | Reducir Order; extraer StatusBadge, secciones | Crítico |
| P0 | Añadir tests a orderService | Crítico |
| P1 | Migrar getActiveOrders, getOrder a React Query | Alto |
| P1 | Dividir useOrder en hooks más pequeños | Alto |
| P1 | Migrar a TypeScript (servicios primero) | Alto |
| P2 | Extraer lógica de exportación a servicio/hook | Medio |

---

## 8. Alcance de EntityClient (orders)

EntityClient es un componente genérico que usa `configs.entitiesConfig.orders` para listar pedidos con filtros, paginación y exports. Comparte lógica con otras entidades (products, customers, etc.). El análisis de EntityClient como sistema genérico es P2 dentro de Ventas; las mejoras de OrdersManager/Order/CreateOrderForm tienen prioridad.
