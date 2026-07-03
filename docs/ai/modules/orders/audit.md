# Orders (Pedidos) — Auditoría

> Única fuente de estado de este módulo. No crear `audit-v2.md`, `audit-final.md`
> ni variantes con fecha — este archivo se actualiza in-place en cada pasada.

## NEXT ACTION

```text
Ejecutar (elige una):

A) Implementar el GAP más rápido, ya validado como seguimiento de la pasada anterior:
   /implement-next module=orders category=code-quality limit=1 risk=low
   → cogería GAP-V2-026 (`refetchType: 'none'` en `useOrderPallets.ts`, P3/XS).

B) Implementar el lote de P1 ready más urgente de la ampliación de auditoría (guard
   de cierre + validación de líneas + IVA duplicado + export sin gate):
   /implement-next module=orders category=code-quality limit=1 risk=low
   → cogería GAP-V2-057 (guard de "descartar cambios" en `OrderEditSheet` — este GAP
     se creó originalmente como GAP-V2-026 en esta rama, pero se renombró a GAP-V2-057
     al reconciliar con `claude/orders-deep-audit-lv9qnf`, que ya usaba ese número para
     un hallazgo distinto y ya estaba mergeada a `main`).

C) Pedir a Jose las 3 decisiones pendientes que desbloquean los GAPs `blocked`:
   - GAP-V2-027 (¿sigue vigente el componente `OrdersListFiltersSheet` para un
     plan mobile Fase 3, o se elimina como código muerto?)
   - GAP-V2-036 (elegir entre 3 opciones de UX para explicar secciones
     bloqueadas a comercial readOnly)
   - GAP-V2-028 (autorizar explícitamente refactor L/riesgo medium de
     `orderService.ts` — 35 funciones — o pedir que se divida en sub-GAPs)

Contexto:
Dos líneas de trabajo paralelas sobre `orders` se reconciliaron el 2026-07-03. La rama
`claude/orders-deep-audit-lv9qnf` cerró GAP-V2-024/025 vía `/implement-next` y creó
GAP-V2-026 (seguimiento de doble refetch en `useOrderPallets`) — ya mergeada a `main`
(PR #68). En paralelo, esta rama (`claude/orders-deep-audit-ewomf1`) amplió la auditoría
a los 5 carriles sobre las superficies `pending`/`partial` restantes de la matriz
(confirmado por Jose: "todo el módulo, los 5 carriles"), generando 20 candidatos nuevos
normalizados por `gap-normalizer` a 17 `ready` + 3 `blocked`. Al mergear `main` en esta
rama se detectó que el primer hallazgo de esta pasada también se había numerado
`GAP-V2-026` — colisión con el de `lv9qnf` — y se renombró a `GAP-V2-057` antes de
consolidar. Total del módulo tras la reconciliación: 41 GAPs — 18 `ready`, 3 `blocked`,
18 `done`, 0 `later`, 2 `rejected/superseded`.

Restricciones:
No volver a auditar los mismos 5 carriles sobre los mismos archivos sin
evidencia de que algo cambió — usar needs_reaudit si aplica.
Las reglas de negocio de GAP-V2-011/012/013 fueron confirmadas por Jose el 2026-07-02.
GAP-V2-051 debe reutilizar el `parseTaxRate` ya corregido en
`useOrderPlannedDetails.ts` (GAP-V2-012, done) — no reimplementar la lógica.
Queda pendiente confirmar con Jose si las líneas auxiliares deben admitir
cantidad/precio negativo (abonos/devoluciones) — ver §9 Bloqueos y riesgos.
GAP-V2-026 (doble refetch en `useOrderPallets`) y GAP-V2-057 (guard de cierre de
`OrderEditSheet`) son GAPs completamente distintos pese a haber compartido el mismo
número originalmente — no confundirlos al leer el histórico de commits.
```

---

## 1. Estado del módulo

```text
Estado general: ready_for_implementation

Funcional:        sin incidentes bloqueantes detectados
UI/copy:           drift textual y hallazgo a11y-responsive mobile resueltos; nuevo drift tipográfico (font-semibold) detectado en detalle/listado
UX:                 cubierto ampliamente vía carriles ux-ui/design-quality (sin ux-reviewer aparte); nuevos huecos de validación inline y explicabilidad de permisos detectados
Código:              14 hallazgos nuevos de code-quality/architecture-refactor (services, hooks de formulario, componentización), sumados a los 5 de la pasada anterior
Arquitectura:         cubierto ampliamente (sub-hooks de mutación + permisos comerciales + orderService.ts completo revisado)
Responsive:            hallazgo de touch targets mobile resuelto; a11y-responsive de edición ahora audited
Accesibilidad:           edición y validaciones ahora audited (aria-invalid nativo); resto de superficies siguen parciales
Permisos/tenant:          2 hallazgos P1 previos + 1 hallazgo P1 nuevo (GAP-V2-056, botón exportar sin gate de rol); sin P0 de tenant isolation en ninguna pasada
Performance:               sin auditar (sigue fuera de alcance)
Testing:                     code-quality ahora audited (falta de cobertura en hooks de formulario, GAP-V2-034); architecture-refactor/data-api siguen pending/partial
Documentación:                 cruce legacy acotado completado

P0 abiertos: 0   P1 abiertos: 4 (GAP-V2-038, GAP-V2-051, GAP-V2-056, GAP-V2-057 — todos ready)
P2 abiertos: 7 (ready: GAP-V2-029, GAP-V2-030, GAP-V2-037, GAP-V2-047, GAP-V2-052 · blocked: GAP-V2-028, GAP-V2-036)
P3 abiertos: 10 (ready: GAP-V2-026, GAP-V2-031, GAP-V2-032, GAP-V2-033, GAP-V2-034, GAP-V2-046, GAP-V2-048, GAP-V2-049, GAP-V2-050 · blocked: GAP-V2-027)

Estado de auditoría:      audited_ampliado (5 de 5 carriles ejecutados en tres pasadas — piloto acotado + cierre de GAP-024/025 con seguimiento GAP-026 + ampliación a superficies pending)
Estado de implementación: batch_16_done (GAP-V2-002, GAP-V2-004, GAP-V2-021, GAP-V2-011, GAP-V2-012, GAP-V2-013, GAP-V2-020, GAP-V2-003, GAP-V2-005, GAP-V2-006, GAP-V2-008, GAP-V2-009, GAP-V2-014, GAP-V2-007, GAP-V2-022, GAP-V2-023, GAP-V2-024, GAP-V2-025)
Estado de verificación:   GAP-V2-025 audited_done (aprobado con observación no bloqueante → generó GAP-V2-026); 20 candidatos nuevos de la ampliación normalizados por `gap-normalizer` — 17 ready, 3 blocked (GAP-V2-027, GAP-V2-028, GAP-V2-036), 0 later/rejected (uno renombrado de GAP-V2-026 a GAP-V2-057 por colisión de numeración con la rama `lv9qnf` al reconciliar)
```

## 2. Cobertura

Superficies × carriles. Estados: `pending · partial · audited · needs_reaudit · not_applicable`.

| Superficie         | ux-ui          | code-quality   | architecture-refactor | data-api       | domain-business | a11y-responsive |
| ------------------ | -------------- | -------------- | --------------------- | -------------- | --------------- | --------------- |
| listado            | audited        | audited        | audited               | audited        | not_applicable  | partial         |
| detalle            | audited        | audited        | audited               | audited        | audited         | partial         |
| creación           | audited        | audited        | audited               | partial        | not_applicable  | pending         |
| edición            | audited        | audited        | audited               | partial        | audited         | audited         |
| formularios        | audited        | audited        | partial               | partial        | audited         | pending         |
| tablas/listados    | audited        | audited        | partial               | audited        | not_applicable  | partial         |
| estados loading    | audited        | not_applicable | not_applicable        | not_applicable | not_applicable  | partial         |
| estados empty      | audited        | not_applicable | not_applicable        | not_applicable | not_applicable  | partial         |
| estados error      | audited        | not_applicable | not_applicable        | partial        | not_applicable  | pending         |
| estados success    | audited        | not_applicable | not_applicable        | audited        | not_applicable  | pending         |
| permisos/roles     | audited        | not_applicable | audited               | audited        | not_applicable  | not_applicable  |
| integración API    | not_applicable | audited        | audited               | audited        | audited         | not_applicable  |
| validaciones       | audited        | partial        | not_applicable        | audited        | audited         | audited         |
| tipos/interfaces   | not_applicable | audited        | partial               | partial        | not_applicable  | not_applicable  |
| componentización   | not_applicable | audited        | partial               | not_applicable | not_applicable  | not_applicable  |
| dominio de negocio | not_applicable | not_applicable | not_applicable        | partial        | audited         | not_applicable  |
| testing            | not_applicable | audited        | pending               | partial        | not_applicable  | not_applicable  |

Pendiente explícitamente fuera de este circuito: performance, un pase visual con screenshots autenticados (`design-quality-auditor` sigue en modo heurístico/copy/consistency, sin capturas), y celdas puntuales de a11y-responsive (creación/formularios/estados error/success) y architecture-refactor de testing.

## 3. Resumen ejecutivo

Primera auditoría real ejecutada sobre el módulo `orders` con 3 carriles iniciales en paralelo (`code-audit-agent`, `ui-audit-agent` y `domain-business-auditor`) y continuada el 2026-07-02 con los 2 carriles pendientes (`design-quality-auditor` y `permissions-multitenant-auditor`). Cobertura acotada a un conjunto de archivos concreto por carril, no exhaustiva del módulo completo. Se completó además el cruce legacy acotado contra `.claude/gaps/closed/` para evitar duplicar GAPs ya cerrados.

21 GAPs documentados en aquel momento: 1 `ready` (GAP-V2-026, de seguimiento), 18 `done`, 0 `blocked` y 2 `rejected/superseded`. El primer lote `/implement-next` cerró los dos GAPs code-quality de bajo riesgo: queryKey tenant-aware del detalle de pedido (GAP-V2-002) y migración a TypeScript del wrapper de dominio `orders` (GAP-V2-004). El segundo lote cerró GAP-V2-021, ocultando la creación de pedidos en el manager comercial readOnly. El tercer lote cerró GAP-V2-011, sustituyendo la tolerancia fija de 30 kg por la regla híbrida confirmada. El cuarto lote cerró GAP-V2-012, distinguiendo IVA pendiente/inválido de IVA 0% legítimo. El quinto lote cerró GAP-V2-013 con confirmación explícita antes de finalizar pedidos con producción pendiente/no planificada. El sexto lote cerró GAP-V2-020, separando `readOnly` de la capacidad `canViewCostData` para ocultar coste/margen/análisis en vistas comerciales y evitar la carga de análisis económico. El séptimo lote cerró GAP-V2-005 y GAP-V2-003, migrando opciones/formularios/análisis de pedidos a TanStack Query y eliminando recurrencias de token-as-parameter en formularios. El octavo lote cerró GAP-V2-006, añadiendo cancelación explícita al formulario desktop de creación de pedidos. El noveno lote cerró GAP-V2-008, separando el error recuperable del estado "pedido no encontrado" en el detalle de pedido. El décimo lote cerró GAP-V2-009, normalizando la tilde de la pestaña de documentos y la capitalización de `ID` en el buscador. El undécimo lote cerró GAP-V2-014, normalizando `palet/palets`, `pedido`, tildes y sentence case restante en Orders Manager. El duodécimo lote cerró GAP-V2-007, ampliando a 44x44px los triggers móviles de estado y temperatura sin cambiar el contenido visual. El GAP grande GAP-V2-001 se dividió en cuatro sub-GAPs implementables: GAP-V2-022 y GAP-V2-023 migraron incidencias y detalles planificados a `useMutation` + invalidación, el decimoquinto lote cerró GAP-V2-024 con el mismo patrón para líneas auxiliares, y el decimosexto lote cerró GAP-V2-025 para palets (aprobado con una observación no bloqueante de doble refetch). Esa observación se convirtió en GAP-V2-026, un GAP de seguimiento puntual (P3, low, XS) para aplicar `refetchType: 'none'` en la invalidación de `useOrderPallets.ts`. Este trabajo se hizo en la rama `claude/orders-deep-audit-lv9qnf`, ya mergeada a `main` (PR #68).

**Continuación 2026-07-03 — ampliación a los 5 carriles sobre las superficies `pending` restantes de la matriz, en paralelo en la rama `claude/orders-deep-audit-ewomf1`** (confirmado por Jose: "todo el módulo, los 5 carriles"). `code-audit-agent` auditó `OrdersList`, `OrderCard`, las pestañas de detalle no revisadas antes (`OrderDetails`, `OrderProductDetails`, `OrderEditSheet`, `OrderProduction`, `OrderCustomerHistory`, `OrderExport`, `OrderMap`, `OrderLabels`), `src/services/orderService.ts` completo (1383 líneas) y cobertura de tests de hooks de formulario — 9 candidatos (GAP-V2-027 a 034, más GAP-V2-057). `ui-audit-agent` cubrió listado/detalle/edición/estados loading-empty-success/permisos-roles/validaciones — 3 candidatos (GAP-V2-036 a 038). `design-quality-auditor` amplió su revisión visual/copy a listado, detalle y edición (antes solo había cubierto creación/formularios) — 5 candidatos (GAP-V2-046 a 050), incluyendo una recurrencia notable del anti-patrón `font-semibold` (PL-024) en varios componentes de detalle. `domain-business-auditor` confirmó que las 3 reglas de negocio ya cerradas (GAP-V2-011/012/013) no necesitan reabrirse y encontró una recurrencia de regla de negocio duplicada: `parseTaxRate` de `OrderAuxiliaryLines` nunca recibió el fix de GAP-V2-012 — 2 candidatos (GAP-V2-051, 052). `permissions-multitenant-auditor` confirmó que `orderService.ts` completo usa `fetchWithTenant` sin excepciones y que las queryKeys de `useOrders`/`useOrdersStats`/`useComercialOrders`/`useFieldOrders` son tenant-aware, pero detectó que el botón "Exportar" del listado no está gateado por `canCreateOrder`/`readOnly` como sus botones hermanos — 1 candidato (GAP-V2-056).

Total de esta pasada: 20 candidatos nuevos, procesados por `gap-normalizer` (más de 15, según regla del skill): 17 `ready`, 3 `blocked` (GAP-V2-027, GAP-V2-028, GAP-V2-036 — requieren decisión de Jose antes de implementarse), 0 `later`/`rejected`. Ver §7 para el detalle final normalizado.

**Reconciliación 2026-07-03** — al mergear `main` (con GAP-V2-024/025/026 ya cerrados/creados por `lv9qnf`) en esta rama, se detectó que el primer candidato de esta pasada se había numerado también `GAP-V2-026`, colisionando con el `GAP-V2-026` de doble refetch de `lv9qnf`. Se renombró el archivo y todas sus referencias a `GAP-V2-057` antes de consolidar. Total del módulo tras la reconciliación de ambas ramas: **41 GAPs — 18 `ready`, 3 `blocked`, 18 `done`, 0 `later`, 2 `rejected/superseded`.**

## 4. Baseline anterior

Ninguna — primera pasada.

## 5. Alcance del módulo

```text
Rutas:       src/app/admin/orders/, src/app/admin/orders-manager/,
             src/app/comercial/orders/, src/app/comercial/orders-manager/
Componentes: src/components/Admin/OrdersManager/ (list/detail/create/tabs/status)
Hooks:        src/hooks/useOrder.ts + src/hooks/orders/*.ts (9 sub-hooks) +
              src/hooks/useOrders.ts, useOrderFormOptions.ts, useOrderFormConfig.ts,
              useOrderCreateFormConfig.ts, useOrdersStats.ts, useComercialOrders.ts
Services:      src/services/orderService.ts (1383 líneas) +
              src/services/domain/orders/ (orderService.js legacy, orderDocumentService.ts,
              orderAttachmentService.ts)
Tipos:          no localizados en un único archivo dedicado — pendiente de mapeo fino
```

Esta pasada auditó solo un subconjunto acotado de lo anterior (ver §2 Cobertura) — no todo el alcance mapeado.

## 6. Hallazgos vigentes

**code-quality / architecture-refactor (carril `code-audit-agent`):**

- `useOrderIncidents.ts`, `useOrderPlannedDetails.ts`, `useOrderAuxiliaryLines.ts`, `useOrderPallets.ts` usan promesas manuales + escritura de caché a mano en vez de `useMutation`; contraste directo con `useOrderAttachments.ts` que sí lo hace bien. GAP-V2-001 queda superseded por GAP-V2-022/023/024/025 — los cuatro ya resueltos, ninguno de los cuatro sub-hooks de mutación de `orders` escribe caché a mano.
- `useOrder.ts:101` — queryKey como array literal, sin factory y sin tenantId para un detalle tenant-scoped (GAP-V2-002; resuelto, fusiona GAP-V2-019)
- `useOrderCostAnalysis.ts`/`useOrderOptions.ts` — fetching manual con useState/useEffect (GAP-V2-003; resuelto)
- `src/services/domain/orders/orderService.js` — legacy JS confirmado vivo, importado por `orderTools.js` y `ProductionView.jsx` (GAP-V2-004; resuelto)
- Recurrencia de PL-010 (token-as-parameter) en `useOrderFormOptions.ts`/`useOrderCreateFormConfig.ts`, con bug de loading colgado en catch (GAP-V2-005; resuelto)

**ux-ui / a11y-responsive (carril `ui-audit-agent`):**

- `CreateOrderForm/index.tsx` desktop sin botón cancelar/cerrar — resuelto con botón `Cancelar` en el footer desktop (GAP-V2-006; resuelto)
- Touch targets bajo 44px en `OrderStatusDropdown`/`OrderSummaryMobile` mobile; resuelto ampliando el área interactiva de los triggers a 44x44px (GAP-V2-007; resuelto)
- Estado error/no-encontrado del detalle de pedido separado con `EmptyState`; el error mantiene `Reintentar` y el no encontrado no ofrece acción engañosa (GAP-V2-008; resuelto)
- Inconsistencias menores de copy: tilde en pestaña y capitalización de placeholder resueltas (GAP-V2-009; resuelto)
- Drift textual restante en design-quality: "Pallet/Pallets/pallet" vs. "palet/palets", "orden" vs. "pedido", tildes y capitalización (GAP-V2-014; resuelto)
- Descartado tras verificación: inconsistencia de badges documentada en `project-learnings.md` ya no reproduce en código actual
- No verificable sin renderizado real: posible rotura de layout en breakpoint `xl` (768–1279px) de `OrdersManagerLayout` — mencionado, no convertido en GAP

**domain-business (carril `domain-business-auditor`):**

- Tolerancia fija de 30kg entre planificado/producido no escalaba con el tamaño del pedido; resuelto con la regla confirmada `min(max(10 kg, kg_planificados * 3%), 75 kg)` (GAP-V2-011; resuelto)
- `parseTaxRate` degradaba silenciosamente IVA inválido/negativo a 0%, indistinguible de una exención real; resuelto mostrando `IVA pendiente` para dato ausente/no parseable/negativo y manteniendo `0%` explícito como válido (GAP-V2-012; resuelto)
- Un pedido podía marcarse "finished" sin validar que la producción cubre lo planificado; resuelto con advertencia + confirmación explícita, no bloqueo duro (GAP-V2-013; resuelto)

**permissions / multitenant (carril `permissions-multitenant-auditor`):**

- `ComercialOrderDetailClient` montaba `<Order readOnly />`, pero `readOnly` no ocultaba coste/margen ni evitaba cargar análisis económico en detalle comercial; resuelto con `canViewCostData=false` y guard de carga (GAP-V2-020; resuelto)
- `ComercialOrdersManager` pasaba `readOnly` a `OrdersList`, pero la lista seguía mostrando acciones/CTA de crear pedido y podía montar `CreateOrderForm` (GAP-V2-021; resuelto)
- `useOrder.ts:101` omite `tenantId` en la queryKey del detalle; fusionado en GAP-V2-002 para evitar duplicar el mismo cambio (GAP-V2-019 rejected)

**Continuación 2026-07-03 — code-quality / architecture-refactor (carril `code-audit-agent`):**

- `OrderEditSheet/index.tsx:311` — `onOpenChange={setOpen}` evita el guard de "descartar cambios" (`onCloseSheet` queda muerto con `void onCloseSheet;`), permitiendo cerrar con cambios sin guardar vía click fuera/Escape/swipe (GAP-V2-057; ready)
- `OrdersList/OrdersListFiltersSheet.tsx` — componente muerto, no importado en ningún lado (GAP-V2-027; blocked)
- `services/orderService.ts` — 35 funciones exportadas duplican boilerplate de fetch/headers/token en vez de usar los helpers genéricos de `api-client.md` (GAP-V2-028; blocked)
- `services/orderService.ts:1120-1211` — recurrencia de PL-010 (token-as-parameter) en 3 funciones de exportación de rentabilidad, sin llamadores en producción (solo el test las referencia) (GAP-V2-029; ready)
- `useOrderFormConfig.ts` — `formGroups`/`defaultValues` se espejan a `useState` vía `useEffect` desde valores ya derivados, a diferencia de `useOrderCreateFormConfig.ts` que usa `useMemo` correctamente (GAP-V2-030; ready)
- `OrderProduction/index.tsx`, `OrderLabels/index.tsx` — falta `'use client'` pese a usar hooks, inconsistente con las 5 pestañas hermanas (GAP-V2-031; ready)
- `services/orderService.ts:16-306` — ~15 interfaces de dominio definidas inline en el service en vez de `src/types/` (GAP-V2-032; ready)
- `OrderCard/index.tsx:114-134` — variante mobile reimplementa el badge de estado inline en vez de extender `StatusBadge` compartido (GAP-V2-033; ready)
- `useComercialOrders.ts`, `useOrderFormConfig.ts`, `useOrderCreateFormConfig.ts` — sin cobertura de test pese a tener lógica de mapeo específica de dominio (GAP-V2-034; ready)

**Continuación 2026-07-03 — ux-ui / a11y-responsive (carril `ui-audit-agent`):**

- Secciones/acciones bloqueadas para comercial `readOnly` desaparecen sin explicación (sin usar el toast ya existente en `useOrderDocuments.ts:197-205` como precedente) — `orderReadOnlyPermissions.ts`, `OrderTabsDesktop.tsx`, `OrderSectionList.tsx`, `OrderPalletsToolbar.tsx` (GAP-V2-036; blocked)
- `OrderEditSheet/index.tsx` no usa el `aria-invalid` nativo de shadcn (`input.jsx:15`), envuelve campos en un div `border-red-300` a mano, perdiendo la señal de accesibilidad (GAP-V2-037; ready)
- Editores de línea inline en `OrderAuxiliaryLines`/`OrderPlannedProductDetails` nunca deshabilitan "Guardar" ni validan campos requeridos antes de enviar, a diferencia del resto del módulo (GAP-V2-038; ready)

**Continuación 2026-07-03 — ux-ui/copy/consistencia (carril `design-quality-auditor`, ampliación a listado/detalle/edición):**

- Recurrencia del anti-patrón `font-semibold` (PL-024) en `OrdersList`, `OrderProduction`, `OrderPallets`, filas de total de `OrderAuxiliaryLines`/`OrderPlannedProductDetails` (GAP-V2-046; ready)
- `OrderCustomerHistory` (familia completa) codifica pesos de fuente distintos mobile vs. desktop para el mismo dato — la concentración más alta de PL-024 encontrada (GAP-V2-047; ready)
- Título de `OrdersList` con pesos de fuente distintos mobile/desktop, sin seguir la escala documentada `text-xl font-medium` (GAP-V2-048; ready)
- `OrderCard` desktop iguala el peso visual de ID y nombre de cliente, diluyendo el identificador primario (GAP-V2-049; ready)
- `OrderIncident` es la única de 5 pestañas hermanas sin la sub-escala documentada de `CardTitle` (GAP-V2-050; ready)

**Continuación 2026-07-03 — domain-business (carril `domain-business-auditor`):**

- `OrderAuxiliaryLines/index.tsx:67-74` reimplementa `parseTaxRate` localmente con el mismo fallback silencioso a 0% que GAP-V2-012 ya corrigió en `useOrderPlannedDetails.ts` — la corrección nunca se propagó a líneas auxiliares (GAP-V2-051; ready)
- `OrderAuxiliaryLines/index.tsx:383,602` muestra toda cantidad con `formatDecimalWeight` (sufijo `kg` fijo) ignorando `row.unit`, que puede ser `ud` u otra unidad no-peso según el catálogo (GAP-V2-052; ready)

**Continuación 2026-07-03 — permissions / multitenant (carril `permissions-multitenant-auditor`):**

- `OrdersList/index.tsx:236-245` — el botón "Exportar" no está gateado por ninguna capacidad, a diferencia de "Vista de Producción" (`!readOnly`) y "Crear" (`canCreateOrder`) en la misma barra; visible/funcional para `comercial` en modo readOnly sin confirmar si el xlsx expone coste/margen (GAP-V2-056; ready)
- Verificado sin hallazgos: `orderService.ts` completo (34 endpoints) usa `fetchWithTenant` sin excepciones; queryKeys de `useOrders`/`useOrdersStats`/`useComercialOrders`/`useFieldOrders` son tenant-aware; `ProductionView` no expone coste/margen y no es alcanzable por `operario`/`comercial`; `middleware.ts` aplica RBAC server-side real, no solo oculto en UI

## 7. GAPs generados/actualizados

**Rama `claude/orders-deep-audit-lv9qnf` (mergeada a `main`, PR #68):** GAP-V2-024 y GAP-V2-025
cerrados `done`; GAP-V2-026 (doble refetch en `useOrderPallets`) creado `ready` como
seguimiento no bloqueante. Resumen en ese momento: 1 `ready`, 18 `done`, 0 `blocked`, 0
`later`, 2 `rejected`.

**Rama `claude/orders-deep-audit-ewomf1` (esta rama) — normalizados por `gap-normalizer` el
2026-07-03** (20 candidatos → 20 GAPs finales: ninguno se fusionó como GAP independiente
completo, aunque GAP-V2-046 cedió el caso `OrdersList/index.tsx:202` a GAP-V2-048 por solape
exacto de archivo/línea; ninguno se dividió; uno renombrado de GAP-V2-026 a **GAP-V2-057**
al reconciliar con `main`, que ya usaba ese número para el GAP de doble refetch de
`lv9qnf`). Estado final tras normalizar:

**Ready (17):**

- GAP-V2-057 — `OrderEditSheet`: guard de "descartar cambios" nunca se invoca (code-quality, P1)
- GAP-V2-029 — Token-as-parameter + código muerto en 3 funciones de export de rentabilidad (code-quality, P2)
- GAP-V2-030 — `useOrderFormConfig` sincroniza estado derivado con `useEffect` (code-quality, P2)
- GAP-V2-031 — `OrderProduction`/`OrderLabels` sin `'use client'` (code-quality, P3)
- GAP-V2-032 — Tipos de dominio de `orders` inline en `orderService.ts` (code-quality, P3)
- GAP-V2-033 — `OrderCard` duplica `StatusBadge` en su variante mobile (code-quality, P3)
- GAP-V2-034 — Sin cobertura de test en 3 hooks de formulario (code-quality, P3)
- GAP-V2-037 — `OrderEditSheet` sin `aria-invalid` nativo (a11y-responsive, P2)
- GAP-V2-038 — Editores de línea sin validación de campos requeridos antes de guardar (ux-ui, P1)
- GAP-V2-046 — Recurrencia `font-semibold` en producción/palets/líneas auxiliares/previsión (ux-ui, P3)
- GAP-V2-047 — Drift tipográfico de `OrderCustomerHistory` mobile↔desktop (ux-ui, P2)
- GAP-V2-048 — Título de `OrdersList` no sigue `text-xl font-medium` (ux-ui, P3; incorpora el caso de `font-semibold` desktop originalmente en GAP-V2-046)
- GAP-V2-049 — Jerarquía ID vs. cliente en `OrderCard` desktop (ux-ui, P3)
- GAP-V2-050 — `OrderIncident` sin la sub-escala de `CardTitle` (ux-ui, P3)
- GAP-V2-051 — `parseTaxRate` reimplementado en `OrderAuxiliaryLines` con el fallback silencioso a 0% (domain-business, P1)
- GAP-V2-052 — Cantidad de línea auxiliar siempre en "kg" ignorando `row.unit` (domain-business, P2)
- GAP-V2-056 — Botón "Exportar" de `OrdersList` gateado por `canExportListData` (default `!readOnly`) (architecture-refactor, P1)

**Blocked (3):**

- GAP-V2-027 — `OrdersListFiltersSheet.tsx` código muerto (code-quality, P3): bloqueado a la
  espera de que Jose confirme si el plan mobile Fase 3 referenciado en el propio archivo sigue
  vigente (determina eliminar vs. conectar).
- GAP-V2-028 — `orderService.ts` duplica boilerplate de fetch/headers en 35 funciones
  (architecture-refactor, P2, tamaño **L**): bloqueado por regla del skill — ningún GAP L/XL
  puede quedar `ready` sin autorización explícita de Jose. Contenido completo y verificable;
  solo falta el visto bueno o la decisión de dividirlo en sub-GAPs más pequeños (como se hizo con
  GAP-V2-001 → 022/023/024/025).
- GAP-V2-036 — Secciones/acciones bloqueadas para comercial readOnly desaparecen sin explicación
  (ux-ui, P2): bloqueado porque el propio GAP lista 3 opciones de UX distintas y pide
  explícitamente confirmación de Jose antes de implementar, sin default seguro.

Sin overlap real entre GAP-V2-057 (guard de cierre de `OrderEditSheet`) y GAP-V2-028
(boilerplate de `orderService.ts`) pese a tocar superficies relacionadas del mismo flujo de
edición — quedan independientes, como anticipaba `audit.md` §9. GAP-V2-057 tampoco se solapa
con GAP-V2-026 (doble refetch de `useOrderPallets`, de la rama `lv9qnf`) — son hallazgos
distintos que solo compartieron número por accidente antes de la reconciliación.

Ver `docs/ai/modules/orders/gaps-registry.md` (regenerado tras la reconciliación de ambas
ramas). Resumen total del módulo: **18 `ready`** (1 de `lv9qnf` + 17 de esta rama), **18
`done`**, **3 `blocked`**, 0 `later`, **2 `rejected`** — 41 GAPs en total.

## 8. GAPs resueltos o descartados

- GAP-V2-019 descartado como GAP independiente: duplicaba GAP-V2-002. La señal multitenant quedó fusionada en GAP-V2-002.
- GAP-V2-001 descartado como GAP implementable único: se divide en GAP-V2-022 (incidencias), GAP-V2-023 (detalles planificados), GAP-V2-024 (líneas auxiliares) y GAP-V2-025 (palets).
- GAP-V2-002 resuelto: `useOrder.ts` usa `orderKeys.detail(tenantId, orderId)` y la query queda condicionada por tenant.
- GAP-V2-004 resuelto: `src/services/domain/orders/orderService.js` migrado a `orderService.ts` con firmas tipadas.
- GAP-V2-021 resuelto: el manager comercial readOnly ya no muestra acciones/CTA de creación ni monta `CreateOrderForm`; el flujo admin conserva la creación.
- GAP-V2-011 resuelto: `mergeOrderDetails` usa tolerancia híbrida por línea (`3%`, mínimo 10 kg, máximo 75 kg) y pruebas de clasificación relativa.
- GAP-V2-012 resuelto: los tipos de IVA ausentes/no parseables/negativos se normalizan como `null`, la UI los muestra como `IVA pendiente`, y el IVA 0% explícito sigue mostrándose como `0%`.
- GAP-V2-013 resuelto: finalizar un pedido con líneas `pending` o `noPlanned` abre una confirmación explícita con detalle de las líneas afectadas; pedidos cubiertos por `success`/`difference` mantienen el flujo directo.
- GAP-V2-020 resuelto: las vistas comerciales montan `Order` sin permiso de coste, ocultan rentabilidad/análisis/costes de palets y no invocan `getOrderCostAnalysis`; las vistas admin conservan visibilidad económica.
- GAP-V2-005 resuelto: las opciones de formularios de pedido usan TanStack Query, query keys tenant-aware y services de dominio sin reenviar `accessToken` desde hooks.
- GAP-V2-003 resuelto: `useOrderCostAnalysis` y `useOrderOptions` usan TanStack Query con `staleTime` adecuado, manteniendo sus APIs públicas para `useOrder.ts`.
- GAP-V2-006 resuelto: el formulario desktop de creación de pedidos muestra `Cancelar` antes del submit, usa `variant="outline"` y cierra el panel mediante `onClose` sin tocar el flujo mobile.
- GAP-V2-008 resuelto: el detalle de pedido usa `EmptyState` para error/no encontrado, diferencia el error con `AlertCircle` rojo y limita `Reintentar` a errores recuperables.
- GAP-V2-009 resuelto: la pestaña desktop usa `Envío de Documentos` y el placeholder del buscador queda unificado como `Buscar por ID o cliente` en mobile y desktop.
- GAP-V2-014 resuelto: Orders Manager usa `palet/palets`, `pedido`, tildes correctas y sentence case consistente en etiquetas, producción, palets y creación de pedidos.
- GAP-V2-007 resuelto: los triggers móviles de estado y temperatura aplican `min-h-[44px] min-w-[44px]` sobre `DropdownMenuTrigger`, conservando el badge/texto interior.
- GAP-V2-022 resuelto: `useOrderIncidents` usa `useMutation` + `mutateAsync`, invalida `orderKeys.detail(tenantId, orderId)` y deja de hacer merge local con `onOrderUpdate`.
- GAP-V2-023 resuelto: `useOrderPlannedDetails` usa `useMutation` + `mutateAsync`, invalida `orderKeys.detail(tenantId, orderId)`, deja de hacer merge local de detalles planificados y conserva la normalización derivada para la UI.
- GAP-V2-024 resuelto: `useOrderAuxiliaryLines` usa `useMutation` + `mutateAsync` para crear/editar/eliminar líneas auxiliares, invalida `orderKeys.detail(tenantId, orderId)`, elimina `onOrderUpdate` del sub-hook y de su llamada en `useOrder.ts`, y conserva `auxiliaryLines` como derivado memoizado de `order.auxiliaryLines`.
- GAP-V2-025 resuelto: `useOrderPallets` usa `useMutation` para borrar/desvincular/vincular/desvincular-todos, invalida `orderKeys.detail(tenantId, orderId)` en `onSuccess`, elimina toda escritura manual de `order.pallets` en caché y las firmas públicas de los seis handlers se mantienen. Aprobado con una observación no bloqueante: la invalidación de TanStack Query se suma a `reload()` (mantenido deliberadamente por `resetCostAnalysis()` y el `onChange` externo hacia el listado), lo que produce un doble refetch por operación — queda anotado como riesgo de rendimiento no bloqueante en §9, no como GAP nuevo.

## 9. Bloqueos y riesgos

**Reglas confirmadas por Jose el 2026-07-02:**

1. **Tolerancia planificado vs. producido (GAP-V2-011):** fórmula híbrida por línea `min(max(10 kg, kg_planificados * 3%), 75 kg)`.
2. **IVA 0% legítimo (GAP-V2-012):** sí existe y debe seguir soportándose como caso fiscal válido; debe distinguirse de dato ausente/no parseable.
3. **Guarda de estado "finalizado" (GAP-V2-013):** permitir finalizar con producción incompleta solo tras advertencia y confirmación explícita; no bloqueo duro.

**Bloqueos:** ninguno vigente.

**Pendiente de confirmación de Jose (no adivinado, bloquea `ready` de un candidato futuro sobre validación de signo):**

- ¿Las líneas auxiliares de pedido (`OrderAuxiliaryLines`) deben permitir cantidad/precio unitario negativo para representar abonos/devoluciones, o deben bloquearse? No hay validación de signo en el formulario actual ni convención documentada. Señalado por `domain-business-auditor` en la continuación 2026-07-03; no se abrió GAP sobre esto a la espera de la respuesta.
- GAP-V2-056 (botón "Exportar" del listado sin gate de rol) requiere verificar con backend si el xlsx generado (`downloadActivePlannedProductsXls`) contiene coste/margen antes de decidir si el fix es igual al de GAP-V2-020 (ocultar) o más ligero (solo confirmar que no expone datos económicos).

**Riesgos (no bloqueantes, para contexto):**

- El auditor de GAP-V2-024 señaló que `invalidateOrderDetail` corre dentro de `onSuccess` de `useMutation`, por lo que el toast de éxito y el cierre de edición en `OrderAuxiliaryLines/index.tsx` ahora esperan al refetch del detalle (latencia percibida ligeramente mayor, datos más frescos). No bloqueante; pendiente de probar manualmente en red lenta.
- El auditor de GAP-V2-025 señaló doble refetch en `useOrderPallets.ts`: cada mutación exitosa dispara `invalidateOrderDetail()` (refetch automático por ser query activa) y además `reload()` (su propio `queryRefetch()`), duplicando la petición de red al detalle del pedido por cada operación de palet. No rompe nada funcionalmente. Convertido en GAP-V2-026 (P3, low, XS) — acotado a este archivo, GAP-V2-022/023/024 no comparten el problema porque no llaman a `reload()` tras invalidar.
- GAP-V2-020 ya oculta/evita la carga de coste/margen en frontend para comercial, pero la frontera real debería reforzarse también en API/policy/resource.
- Se detectó un segundo hook llamado `useOrderPallets` en `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts`, fuera del alcance auditado, que genera ambigüedad de nombres con `src/hooks/orders/useOrderPallets.ts` — no se abrió GAP, queda anotado para una futura pasada.
- GAP-V2-057 y GAP-V2-028 tocan el mismo archivo (`OrderEditSheet/index.tsx`) y `orderService.ts` respectivamente desde ángulos distintos (guard de cierre vs. boilerplate de fetch) — revisar en `gap-normalizer` si conviene ordenarlos como dependencia o quedan independientes.
- PL candidate señalado por `domain-business-auditor` (no auto-aplicado, pendiente de que `system-learner` lo evalúe): "al corregir una función de negocio compartida (no solo queryKey), grep del nombre de la función en todo el módulo para detectar copias locales no refactorizadas" — visto con `parseTaxRate` duplicado entre `useOrderPlannedDetails.ts` (ya corregido en GAP-V2-012) y `OrderAuxiliaryLines/index.tsx` (todavía con el fallback silencioso, GAP-V2-051).

## 10. Decisiones tomadas

- 2026-07-02 — Jose: implementar el sistema completo (Fase 0 + Fase 1) antes de ejecutar el piloto.
- 2026-07-02 — Jose: ejecutar el piloto real de `/deep-audit-module module=orders` inmediatamente tras terminar la infraestructura, con el alcance acotado a 3 carriles ya propuesto.
- 2026-07-02 — Jose: continuar la auditoría de `orders` según el circuito acotado para agentes IA y gestión de workflow deep audit; se añaden los carriles `design-quality-auditor` y `permissions-multitenant-auditor`.

## 11. Cambios desde la última auditoría

- 2026-07-02 — Continuación del circuito acotado: se ejecutan `design-quality-auditor` y `permissions-multitenant-auditor`; se crean GAP-V2-014, 019, 020 y 021; GAP-V2-019 se fusiona en GAP-V2-002; registry regenerado.
- 2026-07-02 — Continuación documental del circuito: cruce legacy acotado de GAPs cerrados relacionados con `orders`; no se crean GAPs nuevos ni se reabren carriles.
- 2026-07-02 — Implementación batch 1 code-quality low: GAP-V2-002 y GAP-V2-004 marcados `done`; registry regenerado.
- 2026-07-02 — Implementación batch 2 architecture-refactor low: GAP-V2-021 marcado `done`; registry regenerado.
- 2026-07-02 — Jose confirma reglas de negocio de GAP-V2-011/012/013; GAP-V2-011 y GAP-V2-013 pasan a `ready`.
- 2026-07-02 — Implementación batch 3 domain-business medium: GAP-V2-011 marcado `done`; registry regenerado.
- 2026-07-02 — Implementación batch 4 domain-business medium: GAP-V2-012 marcado `done`; registry regenerado.
- 2026-07-02 — Implementación batch 5 domain-business medium: GAP-V2-013 marcado `done`; registry regenerado.
- 2026-07-02 — Implementación batch 6 architecture-refactor medium: GAP-V2-020 marcado `done`; registry regenerado.
- 2026-07-02 — Implementación batch 7 code-quality medium: GAP-V2-005 y GAP-V2-003 marcados `done`; registry regenerado.
- 2026-07-02 — Implementación batch 8 ux-ui low: GAP-V2-006 marcado `done`; registry regenerado.
- 2026-07-02 — Implementación batch 9 ux-ui low: GAP-V2-008 marcado `done`; registry regenerado.
- 2026-07-02 — Implementación batch 10 ux-ui low: GAP-V2-009 marcado `done`; registry regenerado.
- 2026-07-02 — Implementación batch 11 ux-ui low: GAP-V2-014 marcado `done`; registry regenerado.
- 2026-07-02 — Implementación batch 12 a11y-responsive low: GAP-V2-007 marcado `done`; registry regenerado.
- 2026-07-02 — División documental code-quality: GAP-V2-001 queda `rejected/superseded`; se crean GAP-V2-022, GAP-V2-023, GAP-V2-024 y GAP-V2-025 como `ready`; registry regenerado.
- 2026-07-02 — Implementación batch 13 code-quality medium: GAP-V2-022 marcado `done`; registry regenerado.
- 2026-07-02 — Implementación batch 14 code-quality medium: GAP-V2-023 marcado `done`; registry regenerado.
- 2026-07-03 — [rama `claude/orders-deep-audit-lv9qnf`] Implementación batch 15 code-quality medium: GAP-V2-024 marcado `done` tras verificación `gap-auditor` (veredicto DONE, contexto limpio); registry regenerado. Rama recreada desde `origin/main` porque el PR anterior de esa rama ya estaba mergeado.
- 2026-07-03 — [rama `claude/orders-deep-audit-lv9qnf`] Implementación batch 16 code-quality medium: GAP-V2-025 marcado `done` tras verificación `gap-auditor` (veredicto aprobado con observación no bloqueante de doble refetch); registry regenerado. Circuito acotado de 5 carriles queda sin GAPs `ready` (0 ready, 18 done, 0 blocked, 2 rejected).
- 2026-07-03 — [rama `claude/orders-deep-audit-lv9qnf`] Se crea GAP-V2-026 (P3, low, XS) a partir de la observación no bloqueante de GAP-V2-025: `refetchType: 'none'` en la invalidación de `useOrderPallets.ts` para eliminar el doble refetch; registry regenerado (1 ready, 18 done, 0 blocked, 2 rejected). Esta rama se mergea a `main` vía PR #68.
- 2026-07-03 — [rama `claude/orders-deep-audit-ewomf1`, en paralelo] Jose confirma alcance de nueva pasada: "todo el módulo, los 5 carriles" sobre las celdas `pending`/`partial` restantes de la matriz. Se lanzan `code-audit-agent`, `ui-audit-agent`, `design-quality-auditor`, `domain-business-auditor` y `permissions-multitenant-auditor` en paralelo con rangos de GAP-V2 reservados (026-035, 036-045, 046-050, 051-055, 056-060). 20 candidatos escritos (GAP-V2-026 a 056, no consecutivos); matriz de cobertura actualizada de mayoritariamente `pending` a mayoritariamente `audited`. Un carril (`domain-business-auditor`) editó `audit.md` directamente durante su ejecución, violando la regla del skill — revertido antes del merge; su contenido se incorporó correctamente en esta misma pasada a partir de su resumen devuelto.
- 2026-07-03 — [rama `claude/orders-deep-audit-ewomf1`] `gap-normalizer` procesa los 20 candidatos: 17 `ready`, 3 `blocked` (GAP-V2-027, GAP-V2-028, GAP-V2-036), 0 `later`/`rejected`; registry regenerado.
- 2026-07-03 — **Reconciliación**: Jose señala que la rama `lv9qnf` (sesión anterior) llevaba tiempo sin mergear. Se hace `git fetch` + `git merge origin/main` en `claude/orders-deep-audit-ewomf1`. Se detecta que ambas ramas habían numerado de forma independiente un `GAP-V2-026` distinto (esta rama: guard de cierre de `OrderEditSheet`; `lv9qnf`: doble refetch de `useOrderPallets`, ya mergeado). Se renombra el de esta rama a `GAP-V2-057` (archivo, frontmatter `id`, y todas las referencias cruzadas en otros GAPs y en este `audit.md`). Se reconcilian manualmente los 4 bloques en conflicto de `audit.md` (NEXT ACTION, Estado del módulo, Resumen ejecutivo, §7 y §11) combinando ambas historias sin perder información de ninguna. Registry regenerado con el estado final: 41 GAPs — 18 `ready`, 3 `blocked`, 18 `done`, 0 `later`, 2 `rejected`.

## 12. Instrucciones para retomar en otro chat/modelo

Leer este archivo completo y `docs/ai/next-action.md`. Los 41 GAPs documentados viven en `docs/ai/gaps/orders/` con frontmatter completo — el registry generado en `docs/ai/modules/orders/gaps-registry.md` es la vista rápida de qué está `ready` vs `blocked` vs `done` vs `rejected`. GAP-V2-001 no debe implementarse como lote único: está rechazado por división en GAP-V2-022/023/024/025. GAP-V2-026 (doble refetch en `useOrderPallets`) y GAP-V2-057 (guard de cierre de `OrderEditSheet`) son GAPs distintos que compartieron número por accidente entre dos ramas paralelas antes de reconciliarse el 2026-07-03 — no confundirlos.

## 13. Reglas específicas para futuras auditorías de este módulo

- Los archivos `src/hooks/orders/*` y `src/hooks/useOrder.ts` fueron ya refactorizados de un hook gigante legacy (`.claude/gaps/closed/GAP-004`) — cualquier hallazgo de arquitectura debe evaluarse contra ese contexto, no tratarlo como si nunca se hubiera refactorizado.
- `useOrderAttachments.ts` es el patrón de referencia correcto de mutaciones en este módulo — citarlo como ejemplo en vez de proponer un patrón externo al proyecto.
- Existe un segundo `useOrderPallets` fuera de `src/hooks/orders/` (ver §9) — confirmar en el mapeo de la próxima pasada si es duplicación real o una responsabilidad distinta antes de tratarlo como bug.

## Legacy references

~53 de los 115 GAPs cerrados en `.claude/gaps/closed/` mencionan "order" o tocan superficies compartidas. En esta continuación se hizo un cruce acotado de los GAPs legacy con mayor probabilidad de solaparse con los 16 GAPs v2 de `orders`. Resultado: no hay GAP v2 duplicado que deba rechazarse adicionalmente; los legacy relevantes quedan como contexto, precedente o señal de deuda ya separada.

| Legacy GAP (`.claude/gaps/`)                             | Estado legacy | Relación           | Nota                                                                                                                                                          |
| -------------------------------------------------------- | ------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GAP-004-refactor-useorder-extract-sub-hooks.md           | closed        | contexto           | Origen de la estructura `src/hooks/orders/*` que esta auditoría revisó — GAP-V2-001 continúa ese trabajo, no lo contradice                                    |
| GAP-028-orderservice-token-interno.md                    | closed        | precedente         | Migró stats/charts de `orderService.ts`; GAP-V2-005 cubre otra recurrencia en hooks de formulario, no duplica el cierre                                       |
| GAP-029-order-document-service.md                        | closed        | precedente         | `useOrderDocuments` ya fue movido al service layer; no hay GAP v2 nuevo sobre documentos HTTP directos                                                        |
| GAP-030-querykey-factories.md                            | closed        | precedente global  | Establece la regla de factories; GAP-V2-002 aplica esa regla al detalle `useOrder`, no listado en ese GAP global                                              |
| GAP-044-inline-querykey-comercial-orders.md              | closed        | precedente puntual | Corrigió una invalidación en `ComercialOrdersManager`; GAP-V2-002/GAP-V2-019 tratan la queryKey del detalle de pedido                                         |
| GAP-056-orderservice-crud-token-interno.md               | closed        | precedente         | Limpió token-as-parameter en CRUD y sub-hooks principales; GAP-V2-005 queda fuera de ese scope al estar en `useOrderFormOptions`/`useOrderCreateFormConfig`   |
| GAP-057-useorderpallets-component-token-palletservice.md | closed        | contexto           | Confirma que el `useOrderPallets` del componente es distinto del sub-hook `src/hooks/orders/useOrderPallets.ts`; mantiene vigente la ambigüedad anotada en §9 |
| GAP-059-ordersmanageroptionscontext-tanstack-query.md    | closed        | precedente         | Migró el contexto de opciones a TanStack Query; GAP-V2-003 cubre `useOrderCostAnalysis`/`useOrderOptions`, y GAP-V2-005 cubre formularios                     |
| GAP-061-orders-manager-jsx-to-tsx-migration.md           | closed        | contexto           | Explica rutas ya migradas a `.tsx` y confirma que `src/services/domain/orders/orderService.js` siguió vivo tras la migración                                  |
| GAP-062-orderservice-domain-wrapper-token-leak.md        | closed        | precedente         | Eliminó fuga de token en el wrapper JS; GAP-V2-004 propone migrar ese wrapper a TypeScript, no repetir el fix de seguridad                                    |
| GAP-065-useorderpallets-silent-catch-errors.md           | closed        | contexto           | Antecedente de limpieza en el hook de palets del componente; no cubre las mutaciones manuales del sub-hook `src/hooks/orders/useOrderPallets.ts`              |
| GAP-078-loader-skeleton-parity-orders.md                 | closed        | precedente UI      | Parte de los loaders del editor ya migraron a Skeleton; no invalida los pendientes de estados loading/empty fuera del circuito actual                         |
| GAP-079-order-header-dead-menu-items.md                  | closed        | precedente UI      | Acciones "próximamente" ya retiradas del header; no se detectó duplicado v2                                                                                   |
| GAP-080-order-tabs-scroll-affordance.md                  | closed        | precedente UI      | La barra de tabs ya tiene affordance de scroll; el posible breakpoint `xl` quedó sin GAP hasta verificar con render real                                      |
| GAP-086-order-cost-analysis-quick-fixes.md               | closed        | precedente UI      | Quick fixes visuales de análisis de costes ya cerrados; GAP-V2-020 trata permisos/visibilidad de coste, no composición visual                                 |
| GAP-088-order-status-badge-color-normalize.md            | closed        | precedente UI      | Normalización de badges ya cerrada; se descartó crear GAP v2 por badges al no reproducirse                                                                    |
| GAP-089-order-pallets-row-actions-dropdown.md            | closed        | precedente UI      | Acciones de filas de palets ya normalizadas; no duplica GAP-V2-020 sobre exposición de costes                                                                 |
| GAP-100-standardize-empty-state-copy-order-editor.md     | closed        | precedente copy    | Empty-state copy ya recibió una pasada; GAP-V2-009/GAP-V2-014 cubren drift textual restante y localizado                                                      |
| GAP-106-orders-page-remove-use-client.md                 | closed        | precedente Next.js | Pages de orders ya limpiadas de `use client`; no hay GAP v2 de directivas de página                                                                           |
| GAP-111-orders-list-skeleton-mobile-desktop-fidelity.md  | closed        | precedente UI      | Skeleton de lista ya ajustado mobile/desktop; estados loading siguen fuera del circuito salvo evidencia nueva                                                 |
| GAP-112-order-detail-skeleton-mobile-desktop-fidelity.md | closed        | precedente UI      | Skeleton de detalle ya ajustado mobile/desktop; no duplica GAP-V2-008, que trata error/no encontrado                                                          |
| GAP-114-order-cost-analysis-skeleton-mobile-grid.md      | closed        | precedente UI      | Skeleton de análisis de costes ya ajustado; GAP-V2-020 se centra en permisos comerciales y evitar carga de análisis económico                                 |
