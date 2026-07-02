# Orders (Pedidos) — Auditoría

> Única fuente de estado de este módulo. No crear `audit-v2.md`, `audit-final.md`
> ni variantes con fecha — este archivo se actualiza in-place en cada pasada.

## NEXT ACTION

```text
Ejecutar (elige una):

A) Implementar el primer sub-GAP code-quality de mutaciones:
   /implement-next module=orders category=code-quality limit=1 risk=medium
   → cogería GAP-V2-023.

Contexto:
Primera auditoría real del sistema completada y ampliada al circuito acotado de
5 carriles: code-audit-agent, ui-audit-agent, domain-business-auditor,
design-quality-auditor y permissions-multitenant-auditor. 20 GAPs documentados:
3 ready, 15 done, 0 blocked y 2 rejected/superseded.

Restricciones:
No volver a auditar los mismos 5 carriles sobre los mismos archivos sin
evidencia de que algo cambió — usar needs_reaudit si aplica.
Las reglas de negocio de GAP-V2-011/012/013 fueron confirmadas por Jose el 2026-07-02.
```

---

## 1. Estado del módulo

```text
Estado general: ready_for_implementation

Funcional:        sin incidentes bloqueantes detectados
UI/copy:           drift textual y hallazgo a11y-responsive mobile resueltos
UX:                 cubierto parcialmente vía carriles ux-ui/design-quality (sin ux-reviewer aparte)
Código:              5 hallazgos de code-quality, todos con solución clara
Arquitectura:         cubierto parcialmente (sub-hooks de mutación + permisos comerciales)
Responsive:            hallazgo de touch targets mobile resuelto
Accesibilidad:           cubierto solo de forma incidental (a11y-responsive), sin pase dedicado
Permisos/tenant:          2 hallazgos P1 + 1 señal fusionada en GAP-V2-002; sin P0 de tenant isolation
Performance:               sin auditar (no hubo carril de performance en este piloto)
Testing:                     sin auditar directamente (se listó como plan de validación por GAP)
Documentación:                 cruce legacy acotado completado

P0 abiertos: 0   P1 abiertos: 3 (GAP-V2-023, GAP-V2-024, GAP-V2-025)
P2 abiertos: 0   P3 abiertos: 0

Estado de auditoría:      audited_acotado (5 de 5 carriles previstos ejecutados)
Estado de implementación: batch_13_done (GAP-V2-002, GAP-V2-004, GAP-V2-021, GAP-V2-011, GAP-V2-012, GAP-V2-013, GAP-V2-020, GAP-V2-003, GAP-V2-005, GAP-V2-006, GAP-V2-008, GAP-V2-009, GAP-V2-014, GAP-V2-007, GAP-V2-022)
Estado de verificación:   GAP-V2-022 audited_done
```

## 2. Cobertura

Superficies × carriles. Estados: `pending · partial · audited · needs_reaudit · not_applicable`.

| Superficie         | ux-ui          | code-quality   | architecture-refactor | data-api       | domain-business | a11y-responsive |
| ------------------ | -------------- | -------------- | --------------------- | -------------- | --------------- | --------------- |
| listado            | partial        | pending        | pending               | pending        | not_applicable  | pending         |
| detalle            | partial        | pending        | pending               | pending        | partial         | pending         |
| creación           | audited        | pending        | pending               | pending        | not_applicable  | pending         |
| edición            | pending        | partial        | pending               | pending        | partial         | pending         |
| formularios        | audited        | partial        | pending               | pending        | partial         | pending         |
| tablas/listados    | partial        | pending        | pending               | pending        | not_applicable  | pending         |
| estados loading    | pending        | not_applicable | not_applicable        | not_applicable | not_applicable  | pending         |
| estados empty      | pending        | not_applicable | not_applicable        | not_applicable | not_applicable  | pending         |
| estados error      | audited        | not_applicable | not_applicable        | partial        | not_applicable  | pending         |
| estados success    | pending        | not_applicable | not_applicable        | pending        | not_applicable  | pending         |
| permisos/roles     | pending        | not_applicable | audited               | audited        | not_applicable  | not_applicable  |
| integración API    | not_applicable | partial        | partial               | audited        | pending         | not_applicable  |
| validaciones       | pending        | partial        | not_applicable        | pending        | audited         | not_applicable  |
| tipos/interfaces   | not_applicable | partial        | partial               | pending        | not_applicable  | not_applicable  |
| componentización   | not_applicable | partial        | partial               | not_applicable | not_applicable  | not_applicable  |
| dominio de negocio | not_applicable | not_applicable | not_applicable        | pending        | partial         | not_applicable  |
| testing            | not_applicable | pending        | pending               | pending        | not_applicable  | not_applicable  |

Pendiente explícitamente fuera de este circuito: performance, testing directo, documentación y un pase visual con screenshots autenticados. `design-quality-auditor` se ejecutó en modo heurístico/copy/consistency, sin capturas.

## 3. Resumen ejecutivo

Primera auditoría real ejecutada sobre el módulo `orders` con 3 carriles iniciales en paralelo (`code-audit-agent`, `ui-audit-agent` y `domain-business-auditor`) y continuada el 2026-07-02 con los 2 carriles pendientes (`design-quality-auditor` y `permissions-multitenant-auditor`). Cobertura acotada a un conjunto de archivos concreto por carril, no exhaustiva del módulo completo. Se completó además el cruce legacy acotado contra `.claude/gaps/closed/` para evitar duplicar GAPs ya cerrados.

20 GAPs documentados en total: 3 `ready`, 15 `done`, 0 `blocked` y 2 `rejected/superseded`. El primer lote `/implement-next` cerró los dos GAPs code-quality de bajo riesgo: queryKey tenant-aware del detalle de pedido (GAP-V2-002) y migración a TypeScript del wrapper de dominio `orders` (GAP-V2-004). El segundo lote cerró GAP-V2-021, ocultando la creación de pedidos en el manager comercial readOnly. El tercer lote cerró GAP-V2-011, sustituyendo la tolerancia fija de 30 kg por la regla híbrida confirmada. El cuarto lote cerró GAP-V2-012, distinguiendo IVA pendiente/inválido de IVA 0% legítimo. El quinto lote cerró GAP-V2-013 con confirmación explícita antes de finalizar pedidos con producción pendiente/no planificada. El sexto lote cerró GAP-V2-020, separando `readOnly` de la capacidad `canViewCostData` para ocultar coste/margen/análisis en vistas comerciales y evitar la carga de análisis económico. El séptimo lote cerró GAP-V2-005 y GAP-V2-003, migrando opciones/formularios/análisis de pedidos a TanStack Query y eliminando recurrencias de token-as-parameter en formularios. El octavo lote cerró GAP-V2-006, añadiendo cancelación explícita al formulario desktop de creación de pedidos. El noveno lote cerró GAP-V2-008, separando el error recuperable del estado "pedido no encontrado" en el detalle de pedido. El décimo lote cerró GAP-V2-009, normalizando la tilde de la pestaña de documentos y la capitalización de `ID` en el buscador. El undécimo lote cerró GAP-V2-014, normalizando `palet/palets`, `pedido`, tildes y sentence case restante en Orders Manager. El duodécimo lote cerró GAP-V2-007, ampliando a 44x44px los triggers móviles de estado y temperatura sin cambiar el contenido visual. El GAP grande GAP-V2-001 se dividió en cuatro sub-GAPs implementables; GAP-V2-022 ya migró incidencias a `useMutation` + invalidación, y quedan detalles planificados (GAP-V2-023), líneas auxiliares (GAP-V2-024) y palets (GAP-V2-025).

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

- `useOrderIncidents.ts`, `useOrderPlannedDetails.ts`, `useOrderAuxiliaryLines.ts`, `useOrderPallets.ts` usan promesas manuales + escritura de caché a mano en vez de `useMutation`; contraste directo con `useOrderAttachments.ts` que sí lo hace bien. GAP-V2-001 queda superseded por GAP-V2-022/023/024/025.
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

## 7. GAPs generados/actualizados

Ver `docs/ai/modules/orders/gaps-registry.md` (regenerado). Resumen: 3 `ready`, 15 `done`, 0 `blocked`, 0 `later`, 2 `rejected`.

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

## 9. Bloqueos y riesgos

**Reglas confirmadas por Jose el 2026-07-02:**

1. **Tolerancia planificado vs. producido (GAP-V2-011):** fórmula híbrida por línea `min(max(10 kg, kg_planificados * 3%), 75 kg)`.
2. **IVA 0% legítimo (GAP-V2-012):** sí existe y debe seguir soportándose como caso fiscal válido; debe distinguirse de dato ausente/no parseable.
3. **Guarda de estado "finalizado" (GAP-V2-013):** permitir finalizar con producción incompleta solo tras advertencia y confirmación explícita; no bloqueo duro.

**Bloqueos:** ninguno vigente.

**Riesgos (no bloqueantes, para contexto):**

- Los sub-GAPs GAP-V2-023/024/025 tocan `src/hooks/useOrder.ts` de forma sucesiva; implementarlos de uno en uno y regenerar registry tras cada cierre.
- GAP-V2-020 ya oculta/evita la carga de coste/margen en frontend para comercial, pero la frontera real debería reforzarse también en API/policy/resource.
- Se detectó un segundo hook llamado `useOrderPallets` en `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts`, fuera del alcance auditado, que genera ambigüedad de nombres con `src/hooks/orders/useOrderPallets.ts` — no se abrió GAP, queda anotado para una futura pasada.

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

## 12. Instrucciones para retomar en otro chat/modelo

Leer este archivo completo y `docs/ai/next-action.md`. Los 20 GAPs documentados viven en `docs/ai/gaps/orders/` con frontmatter completo — el registry generado en `docs/ai/modules/orders/gaps-registry.md` es la vista rápida de qué está `ready` vs `blocked` vs `rejected`. GAP-V2-001 no debe implementarse como lote único: está rechazado por división en GAP-V2-022/023/024/025.

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
