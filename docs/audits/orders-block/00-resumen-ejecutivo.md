# Resumen Ejecutivo - Auditoría del bloque de pedidos

**Fecha:** 2026-04-26
**Sistema auditado:** bloque completo de pedidos
**Scope:** EntityClient, gestor de pedidos, creación, editor/detalle, palets, producción, documentos, exportaciones, rentabilidad, comercial y field/autoventa
**Agentes participantes:** 10 roles completos
**Documentos generados:** `01` a `10` en este mismo directorio

---

> **Escala de notas:** 0 = fallo crítico / inexistente · 5 = funciona con problemas significativos · 10 = correcto, sin observaciones

---

## Diagnóstico general

El bloque de pedidos es uno de los sistemas con mayor valor operativo del frontend. Cubre bien el ciclo real: listado, creación, edición, preparación, palets, documentos, comercial, field/autoventa y análisis económico. La base funciona, pero concentra demasiada lógica en frontend y especialmente en `useOrder.js`, mantiene dos servicios de pedidos solapados y tiene algunas acciones sensibles sin la defensa UX o documental suficiente.

### Nota global del bloque: **5.6 / 10**

---

## Resumen por auditoría

| Auditoría | Rol | Área | Nota |
|---|---|---|---|
| 01 | Frontend Next.js Agent | Rutas, estructura y reutilización | 6.2 / 10 |
| 02 | UI/Form System Agent | Formularios, Zod, payloads y líneas | 6.4 / 10 |
| 03 | API Client Agent | Servicios, endpoints, errores y tenant | 5.2 / 10 |
| 04 | EntityClient Agent | Config de listado, filtros y exports | 7.1 / 10 |
| 05 | Design System Agent | Consistencia UI, shadcn y responsive | 6.7 / 10 |
| 06 | Frontend Performance Agent | Renders, queries, opciones y listas | 5.6 / 10 |
| 07 | QA/UX Agent | Flujos críticos, edge cases y tests | 5.8 / 10 |
| 08 | Documentation Agent | Contexto IA, ADRs y docs del bloque | 3.0 / 10 |
| 09 | Brutal Reviewer Agent | Riesgos graves y deuda estructural | 4.4 / 10 |
| 10 | Product & Domain Agent | Dominio, roles, estados y ownership | 5.9 / 10 |

---

## Hallazgos críticos y prioritarios

| Prioridad | Problema | Tipo | Referencia |
|---|---|---|---|
| P0 | El adapter de dominio loguea longitud y primeros caracteres del token. | Riesgo actual | `src/services/domain/orders/orderService.js:172` |
| P0 | Eliminar líneas previstas persistidas no pide confirmación. | Bug UX / riesgo operativo | `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js:221` |
| P1 | Dos servicios de pedidos conviven con contratos y responsabilidades solapadas. | Deuda técnica | `src/services/orderService.ts:1`, `src/services/domain/orders/orderService.js:1` |
| P1 | `useOrder.js` concentra detalle, mutaciones, documentos, incidencias, palets y análisis. | Deuda arquitectónica | `src/hooks/useOrder.js:135` |
| P1 | El modo comercial `readOnly` bloquea por UI; requiere garantía backend y tests. | Riesgo de permisos | `src/components/Admin/OrdersManager/Order/index.js:43` |
| P1 | No existe documentación estable del bloque de pedidos. | Riesgo de mantenimiento | `docs/ai-context/` |
| P2 | Gestor admin y gestor comercial duplican layout y lógica de búsqueda/categorías. | Deuda técnica | `src/components/Admin/OrdersManager/index.js:21`, `src/components/Comercial/CRM/ComercialOrdersManager.jsx:25` |
| P2 | Filtros de pedidos activos y comerciales se hacen en cliente. | Performance / dominio | `src/components/Admin/OrdersManager/index.js:178`, `src/lib/comercial/comercialOrders.ts:66` |
| P2 | Crear palet desde previsión genera GS1-128 con fallback local. | Trazabilidad / dominio | `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js:496` |

---

## Fortalezas relevantes

- El bloque cubre de forma amplia el flujo real de negocio: pedido previsto, producción/preparación, palets, documentos, comercial y field.
- EntityClient está bien usado para listados y exportaciones masivas.
- El gestor dedicado está justificado: el flujo no cabe razonablemente en EntityClient.
- Hay tests para `useOrder`, `useOrders`, `orderService`, rentabilidad, helpers comerciales y helpers field.
- Field/autoventa tiene hooks propios con query keys tenant-aware y field-operator-aware.
- El detalle de pedido ya tiene buena separación visual por secciones.

---

## Riesgos por categoría

| Categoría | Riesgo principal |
|---|---|
| Bugs actuales | Logs de token y eliminación de líneas sin confirmación |
| Deuda técnica | Doble service layer y `useOrder.js` sobredimensionado |
| UX | Envíos documentales y acciones destructivas necesitan más confirmación/revisión |
| Backend | Restricciones read-only y field deben estar garantizadas por permisos reales |
| Negocio | Estados, tipos de pedido, documentos y exportaciones no están documentados |
| Performance | Filtros y opciones se cargan demasiado en cliente para crecimiento futuro |

---

## Recomendación de intervención

No se recomienda una reescritura grande. El bloque funciona y es central para la operación. La estrategia correcta es reducir riesgo en capas:

1. **P0 inmediato:** quitar logs de token y añadir confirmación para borrar líneas previstas.
2. **P1 corto plazo:** documentar arquitectura real de pedidos y asegurar permisos backend/read-only con tests.
3. **P1 medio plazo:** mover documentos/exportaciones del hook al service layer y definir facade único de pedidos.
4. **P2 evolutivo:** extraer lógica común admin/comercial y mover filtros pesados al backend cuando el volumen lo exija.

---

## Documentos generados

| Archivo | Contenido |
|---|---|
| `01-frontend-next-agent.md` | Rutas, estructura, duplicidad admin/comercial y App Router |
| `02-ui-form-system-agent.md` | Alta, edición, líneas, Zod, RHF y payloads |
| `03-api-client-agent.md` | Endpoints, servicios, errores, tenant y descargas |
| `04-entity-client-agent.md` | Config `orders`, filtros, exports y listado comercial |
| `05-design-system-agent.md` | shadcn/ui, Tailwind, responsive y consistencia visual |
| `06-frontend-performance-agent.md` | Renders, queries, opciones, listas y palets |
| `07-qa-ux-agent.md` | Flujos críticos, cobertura de tests y checklist manual |
| `08-documentation-agent.md` | Gaps de documentación y ADRs recomendados |
| `09-brutal-reviewer-agent.md` | Riesgos graves, sobrecomplejidad y prioridades |
| `10-product-domain-agent.md` | Ownership de reglas, permisos, estados y dominio |

---

## Checklist manual consolidado

- [ ] `/admin/orders`: listado, filtros, selección, exportaciones y navegación.
- [ ] `/admin/orders-manager`: crear pedido, seleccionar pedido, editar cabecera, cambiar estado y temperatura.
- [ ] Previsión: añadir, editar y eliminar líneas, incluyendo línea persistida.
- [ ] Palets: crear desde previsión, vincular, desvincular, clonar y eliminar.
- [ ] Documentos: exportar, enviar estándar y enviar custom.
- [ ] `/comercial/orders` y `/comercial/orders-manager`: validar read-only y ausencia de acciones sensibles.
- [ ] `/field/pedidos`: imprimir ticket y ejecutar pedido operativo completo.
- [ ] Rentabilidad: abrir análisis económico y verificar carga lazy.

