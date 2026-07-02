# Orders (Pedidos) — Auditoría

> Única fuente de estado de este módulo. No crear `audit-v2.md`, `audit-final.md`
> ni variantes con fecha — este archivo se actualiza in-place en cada pasada.

## NEXT ACTION

```text
Ejecutar (elige una):

A) Resolver bloqueos de negocio antes de seguir auditando/implementando:
   Jose debe confirmar 3 reglas operativas (ver §9 Bloqueos) que bloquean
   GAP-V2-011 y GAP-V2-013.

B) Empezar a implementar lo que ya está ready y sin ambigüedad de negocio:
   /implement-next module=orders category=architecture-refactor limit=1 risk=low
   → coge GAP-V2-021 (P1, S, low). GAP-V2-020 es P1 pero risk=medium.

C) Si Jose autoriza risk=medium, continuar code-quality:
   /implement-next module=orders category=code-quality limit=2 risk=medium
   → candidatos: GAP-V2-003 y GAP-V2-005. GAP-V2-001 es size L y requiere
   autorización explícita adicional.

Contexto:
Primera auditoría real del sistema completada y ampliada al circuito acotado de
5 carriles: code-audit-agent, ui-audit-agent, domain-business-auditor,
design-quality-auditor y permissions-multitenant-auditor. 16 GAPs documentados:
11 ready, 2 done, 2 blocked por reglas de negocio pendientes y 1 rejected por merge.

Restricciones:
No volver a auditar los mismos 5 carriles sobre los mismos archivos sin
evidencia de que algo cambió — usar needs_reaudit si aplica.
No marcar GAP-V2-011/013 como ready sin que Jose confirme la regla de negocio.
```

---

## 1. Estado del módulo

```text
Estado general: ready_for_implementation (con 2 GAPs bloqueados en paralelo)

Funcional:        sin incidentes bloqueantes detectados
UI/copy:           4 hallazgos ux-ui/a11y, incluyendo drift de copy restante
UX:                 cubierto parcialmente vía carriles ux-ui/design-quality (sin ux-reviewer aparte)
Código:              5 hallazgos de code-quality, todos con solución clara
Arquitectura:         cubierto parcialmente (sub-hooks de mutación + permisos comerciales)
Responsive:            1 hallazgo (touch targets mobile)
Accesibilidad:           cubierto solo de forma incidental (a11y-responsive), sin pase dedicado
Permisos/tenant:          2 hallazgos P1 + 1 señal fusionada en GAP-V2-002; sin P0 de tenant isolation
Performance:               sin auditar (no hubo carril de performance en este piloto)
Testing:                     sin auditar directamente (se listó como plan de validación por GAP)
Documentación:                 cruce legacy acotado completado

P0 abiertos: 0   P1 abiertos: 8 (GAP-V2-001, 005, 006, 011, 012, 013, 020, 021)
P2 abiertos: 3   P3 abiertos: 2

Estado de auditoría:      audited_acotado (5 de 5 carriles previstos ejecutados)
Estado de implementación: batch_1_done (GAP-V2-002, GAP-V2-004)
Estado de verificación:   checks_passed_pending_audit
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

16 GAPs documentados en total: 11 `ready`, 2 `done`, 2 `blocked` y 1 `rejected` por merge. El primer lote `/implement-next` cerró los dos GAPs code-quality de bajo riesgo: queryKey tenant-aware del detalle de pedido (GAP-V2-002) y migración a TypeScript del wrapper de dominio `orders` (GAP-V2-004). El hallazgo más significativo de código pendiente sigue siendo el patrón sistémico de sub-hooks de mutación sin `useMutation`/`invalidateQueries` (GAP-V2-001). La continuación añadió dos riesgos de permisos en vistas comerciales: exposición de coste/margen en detalle readOnly (GAP-V2-020) y acción de creación visible en manager comercial readOnly (GAP-V2-021).

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

- `useOrderIncidents.ts`, `useOrderPlannedDetails.ts`, `useOrderAuxiliaryLines.ts`, `useOrderPallets.ts` usan promesas manuales + escritura de caché a mano en vez de `useMutation`; contraste directo con `useOrderAttachments.ts` que sí lo hace bien (GAP-V2-001)
- `useOrder.ts:101` — queryKey como array literal, sin factory y sin tenantId para un detalle tenant-scoped (GAP-V2-002; fusiona GAP-V2-019)
- `useOrderCostAnalysis.ts`/`useOrderOptions.ts` — fetching manual con useState/useEffect (GAP-V2-003)
- `src/services/domain/orders/orderService.js` — legacy JS confirmado vivo, importado por `orderTools.js` y `ProductionView.jsx` (GAP-V2-004)
- Recurrencia de PL-010 (token-as-parameter) en `useOrderFormOptions.ts`/`useOrderCreateFormConfig.ts`, con bug de loading colgado en catch (GAP-V2-005)

**ux-ui / a11y-responsive (carril `ui-audit-agent`):**

- `CreateOrderForm/index.tsx` desktop sin botón cancelar/cerrar — la rama mobile sí lo resuelve (GAP-V2-006)
- Touch targets bajo 44px en `OrderStatusDropdown`/`OrderSummaryMobile` mobile (GAP-V2-007)
- Estado error/no-encontrado del detalle de pedido sin distinguir color ni ocultar "Reintentar" cuando no aplica (GAP-V2-008)
- Inconsistencias menores de copy: tilde en pestaña, capitalización de placeholder (GAP-V2-009)
- Drift textual restante en design-quality: "Pallet/Pallets/pallet" vs. "palet/palets", "orden" vs. "pedido", tildes y capitalización (GAP-V2-014)
- Descartado tras verificación: inconsistencia de badges documentada en `project-learnings.md` ya no reproduce en código actual
- No verificable sin renderizado real: posible rotura de layout en breakpoint `xl` (768–1279px) de `OrdersManagerLayout` — mencionado, no convertido en GAP

**domain-business (carril `domain-business-auditor`):**

- Tolerancia fija de 30kg entre planificado/producido no escala con el tamaño del pedido, invierte la señal operativa en pedidos grandes casi exactos (GAP-V2-011, blocked)
- `parseTaxRate` degrada silenciosamente IVA inválido/negativo a 0%, indistinguible de una exención real — riesgo de facturación (GAP-V2-012)
- Un pedido puede marcarse "finished" sin validar que la producción cubre lo planificado (GAP-V2-013, blocked, depende de GAP-V2-011)

**permissions / multitenant (carril `permissions-multitenant-auditor`):**

- `ComercialOrderDetailClient` monta `<Order readOnly />`, pero `readOnly` no oculta coste/margen ni evita cargar análisis económico en detalle comercial (GAP-V2-020)
- `ComercialOrdersManager` pasa `readOnly` a `OrdersList`, pero la lista sigue mostrando acciones/CTA de crear pedido y puede montar `CreateOrderForm` (GAP-V2-021)
- `useOrder.ts:101` omite `tenantId` en la queryKey del detalle; fusionado en GAP-V2-002 para evitar duplicar el mismo cambio (GAP-V2-019 rejected)

## 7. GAPs generados/actualizados

Ver `docs/ai/modules/orders/gaps-registry.md` (regenerado). Resumen: 11 `ready`, 2 `done`, 2 `blocked`, 0 `later`, 1 `rejected`.

## 8. GAPs resueltos o descartados

- GAP-V2-019 descartado como GAP independiente: duplicaba GAP-V2-002. La señal multitenant quedó fusionada en GAP-V2-002.
- GAP-V2-002 resuelto: `useOrder.ts` usa `orderKeys.detail(tenantId, orderId)` y la query queda condicionada por tenant.
- GAP-V2-004 resuelto: `src/services/domain/orders/orderService.js` migrado a `orderService.ts` con firmas tipadas.

## 9. Bloqueos y riesgos

**Bloqueos — requieren respuesta de Jose antes de que estos GAPs puedan pasar a `ready`:**

1. **Tolerancia planificado vs. producido (GAP-V2-011):** ¿la regla es porcentual, absoluta, combinada (mínimo+máximo), y depende de si el producto es fresco o congelado?
2. **IVA 0% legítimo (GAP-V2-012, no bloqueante pero a confirmar durante implementación):** ¿existen casos reales de líneas a IVA 0% (exportación extracomunitaria, inversión del sujeto pasivo) que deban seguir soportándose de forma explícita?
3. **Guarda de estado "finalizado" (GAP-V2-013):** ¿debe ser un bloqueo duro o una confirmación con advertencia cuando quedan líneas sin producir?

**Riesgos (no bloqueantes, para contexto):**

- El patrón de mutaciones sin `useMutation` (GAP-V2-001) es de tamaño L — no entra por defecto en `/implement-next` con los filtros por defecto (`size XS/S/M`). Requiere que Jose lo autorice explícitamente o se divida en sub-GAPs más pequeños antes de implementarlo.
- GAP-V2-020 afecta visibilidad de coste/margen para comercial y debería coordinarse con backend: la UI debe ocultar/evitar carga, pero la frontera real debería estar también en API/policy/resource.
- Se detectó un segundo hook llamado `useOrderPallets` en `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts`, fuera del alcance auditado, que genera ambigüedad de nombres con `src/hooks/orders/useOrderPallets.ts` — no se abrió GAP, queda anotado para una futura pasada.

## 10. Decisiones tomadas

- 2026-07-02 — Jose: implementar el sistema completo (Fase 0 + Fase 1) antes de ejecutar el piloto.
- 2026-07-02 — Jose: ejecutar el piloto real de `/deep-audit-module module=orders` inmediatamente tras terminar la infraestructura, con el alcance acotado a 3 carriles ya propuesto.
- 2026-07-02 — Jose: continuar la auditoría de `orders` según el circuito acotado para agentes IA y gestión de workflow deep audit; se añaden los carriles `design-quality-auditor` y `permissions-multitenant-auditor`.

## 11. Cambios desde la última auditoría

- 2026-07-02 — Continuación del circuito acotado: se ejecutan `design-quality-auditor` y `permissions-multitenant-auditor`; se crean GAP-V2-014, 019, 020 y 021; GAP-V2-019 se fusiona en GAP-V2-002; registry regenerado.
- 2026-07-02 — Continuación documental del circuito: cruce legacy acotado de GAPs cerrados relacionados con `orders`; no se crean GAPs nuevos ni se reabren carriles.
- 2026-07-02 — Implementación batch 1 code-quality low: GAP-V2-002 y GAP-V2-004 marcados `done`; registry regenerado.

## 12. Instrucciones para retomar en otro chat/modelo

Leer este archivo completo y `docs/ai/next-action.md`. Los 16 GAPs documentados viven en `docs/ai/gaps/orders/` con frontmatter completo — el registry generado en `docs/ai/modules/orders/gaps-registry.md` es la vista rápida de qué está `ready` vs `blocked` vs `rejected`. Antes de implementar cualquier GAP de riesgo `medium` (GAP-V2-001, 003, 005, 012, 020), confirmar con Jose si se amplía el `risk` permitido o si se mantiene el filtro por defecto (`low`).

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
