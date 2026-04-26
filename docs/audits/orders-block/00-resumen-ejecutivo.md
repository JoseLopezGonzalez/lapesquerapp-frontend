# Resumen Ejecutivo - Auditoría del bloque de pedidos

**Fecha:** 2026-04-26
**Sistema auditado:** bloque completo de pedidos
**Scope:** EntityClient, gestor de pedidos, creación, editor/detalle, palets, producción, documentos, exportaciones, rentabilidad, comercial y field/autoventa
**Agentes participantes:** 11 roles completos
**Documentos generados:** `01` a `11` en este mismo directorio

---

> **Escala de notas:** 0 = fallo crítico / inexistente · 5 = funciona con problemas significativos · 10 = correcto, sin observaciones

---

## Diagnóstico general

El bloque de pedidos es uno de los sistemas con mayor valor operativo del frontend. Cubre bien el ciclo real: listado, creación, edición, preparación, palets, documentos, comercial, field/autoventa y análisis económico. La base funciona, pero concentra demasiada lógica en frontend y especialmente en `useOrder.js`, mantiene dos servicios de pedidos solapados y tiene algunas acciones sensibles sin la defensa UX o documental suficiente.

### Nota global del bloque: **5.5 / 10**

---

## Resumen por auditoría

| Auditoría | Rol | Área | Nota |
|---|---|---|---|
| 01 | Frontend Next.js Agent | Rutas, estructura y reutilización | 8.1 / 10 |
| 02 | UI/Form System Agent | Formularios, Zod, payloads y líneas | 6.4 / 10 |
| 03 | API Client Agent | Servicios, endpoints, errores y tenant | 5.2 / 10 |
| 04 | EntityClient Agent | Config de listado, filtros y exports | 7.1 / 10 |
| 05 | Design System Agent | Consistencia UI, shadcn y responsive | 6.7 / 10 |
| 06 | Frontend Performance Agent | Renders, queries, opciones y listas | 5.6 / 10 |
| 07 | QA/UX Agent | Flujos críticos, edge cases y tests | 5.8 / 10 |
| 08 | Documentation Agent | Contexto IA, ADRs y docs del bloque | 3.0 / 10 |
| 09 | Brutal Reviewer Agent | Riesgos graves y deuda estructural | 4.4 / 10 |
| 10 | Product & Domain Agent | Dominio, roles, estados y ownership | 5.9 / 10 |
| 11 | shadcn/Tailwind UI Agent | Tokens, cn(), ScrollArea, inline styles | 5.1 / 10 |

---

## Hallazgos críticos y prioritarios

| ID | Prioridad | Problema | Explicación del problema | Tipo | Referencia | Solución / mejora recomendada | Estado | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OB00-01 | P0 | El adapter de dominio loguea longitud y primeros caracteres del token. | Las credenciales no deben aparecer en consola ni parcialmente. | Riesgo actual | `src/services/domain/orders/orderService.js:172` | Eliminar logs de token y dejar solo métricas no sensibles si hacen falta. | Pendiente |  |
| OB00-02 | P0 | Eliminar líneas previstas persistidas no pide confirmación. | Una acción accidental puede alterar un pedido real y sus importes. | Bug UX / riesgo operativo | `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js:221` | Añadir confirm dialog antes de llamar a delete para líneas persistidas. | Pendiente |  |
| OB00-03 | P1 | Dos servicios de pedidos conviven con contratos y responsabilidades solapadas. | Aumenta ambigüedad y puede generar diferencias de payload, errores y comportamiento. | Deuda técnica | `src/services/orderService.ts:1`, `src/services/domain/orders/orderService.js:1` | Definir facade único y documentar qué métodos quedan vigentes. | Pendiente |  |
| OB00-04 | P1 | `useOrder.js` concentra detalle, mutaciones, documentos, incidencias, palets y análisis. | Cualquier cambio en un subflujo puede afectar a todo el editor de pedido. | Deuda arquitectónica | `src/hooks/useOrder.js:135` | Extraer hooks/servicios por responsabilidad al tocar cada subflujo. | Pendiente |  |
| OB00-05 | P1 | El modo comercial `readOnly` bloquea por UI; requiere garantía backend y tests. | La UI no sustituye políticas de permisos en endpoints mutables. | Riesgo de permisos | `src/components/Admin/OrdersManager/Order/index.js:43` | Verificar políticas backend por rol y añadir tests de bloqueo read-only. | Pendiente |  |
| OB00-06 | P1 | No existe documentación estable del bloque de pedidos. | El bloque es demasiado amplio para depender de lectura casual del código. | Riesgo de mantenimiento | `docs/ai-context/` | Crear `docs/ai-context/12-orders-block.md` y enlazarlo desde contexto/API/QA. | Pendiente |  |
| OB00-07 | P2 | Gestor admin y gestor comercial duplican layout y lógica de búsqueda/categorías. | La duplicidad provoca divergencias entre roles y encarece cada mejora. | Deuda técnica | `src/components/Admin/OrdersManager/index.js:21`, `src/components/Comercial/CRM/ComercialOrdersManager.jsx:25` | Extraer hook/componente compartido para layout, búsqueda, categorías y selección. | Pendiente |  |
| OB00-08 | P2 | Filtros de pedidos activos y comerciales se hacen en cliente. | El enfoque escala mal si crece el volumen de pedidos activos o comerciales. | Performance / dominio | `src/components/Admin/OrdersManager/index.js:178`, `src/lib/comercial/comercialOrders.ts:66` | Añadir filtros backend/paginación cuando el volumen supere el umbral operativo. | Pendiente |  |
| OB00-09 | P2 | Crear palet desde previsión genera GS1-128 con fallback local. | Un código de trazabilidad inventado desde frontend puede no ser válido operacionalmente. | Trazabilidad / dominio | `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js:496` | Validar generación GS1-128 en backend o exigir GTIN real configurado en producto. | Pendiente |  |
| OB11-01 | P2 | Barras de acción móviles con `fixed` y `env(safe-area-inset-bottom)` repetidas ×5 como inline style. | La lógica de safe-area duplicada en 5 archivos impide ajustes globales y bypassa el sistema de diseño. | Deuda UI técnica | `OrderPalletsToolbar.jsx:23`, `OrderProductDetails/index.js:100`, `OrderIncident/index.js:199`, `OrderProduction/index.js:131`, `OrderPlannedProductDetails/index.js:460` | Extraer `MobileActionBar` compartido; definir token `--safe-bottom` en `globals.css`. | Pendiente |  |
| OB11-02 | P2 | Colores de estado en `OrderCard` con clases Tailwind directas en lugar de tokens semánticos. | `bg-orange-500/15`, `bg-green-500/15`, `bg-red-500/15`, `bg-slate-*` no responden al theme; deben ser `bg-warning/15`, `bg-success/15`, `bg-destructive/15`, `bg-muted`. | Deuda UI técnica | `OrderCard/index.js:72-96`, `OrderHeaderMobile.jsx:60` | Reemplazar clases directas por tokens semánticos del design system. | Pendiente |  |
| OB11-03 | P2 | Template literals de `className` sin `cn()` en `OrderSectionList` y componentes CRM. | Sin `tailwind-merge`, clases conflictivas de padding/margin coexisten; resultado depende del orden de build. | Deuda UI técnica | `OrderSectionList.jsx:22` + `src/components/Comercial/CRM/` (3+ archivos) | Migrar a `cn()` en todas las concatenaciones de clase condicionales. | Pendiente |  |

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

| ID | Categoría | Riesgo principal | Explicación del problema | Solución / mejora recomendada | Estado | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| OB00-10 | Bugs actuales | Logs de token y eliminación de líneas sin confirmación | Son riesgos presentes hoy, no mejoras futuras. | Corregir P0 antes de ampliar funcionalidad del bloque. | Pendiente |  |
| OB00-11 | Deuda técnica | Doble service layer y `useOrder.js` sobredimensionado | Dificultan cambios seguros y aumentan el radio de impacto. | Consolidar service facade y extraer responsabilidades por subflujo. | Pendiente |  |
| OB00-12 | UX | Envíos documentales y acciones destructivas necesitan más confirmación/revisión | Los errores de usuario pueden tener efectos comerciales o logísticos. | Añadir confirmaciones, resúmenes previos y estados de error claros. | Pendiente |  |
| OB00-13 | Backend | Restricciones read-only y field deben estar garantizadas por permisos reales | La UI puede ocultar botones, pero no proteger endpoints por sí sola. | Auditar policies backend y cubrirlas con tests de permisos. | Pendiente |  |
| OB00-14 | Negocio | Estados, tipos de pedido, documentos y exportaciones no están documentados | Las reglas se interpretan desde el código y pueden divergir entre equipos. | Documentar ciclo de vida y matriz de documentos/exportaciones. | Pendiente |  |
| OB00-15 | Performance | Filtros y opciones se cargan demasiado en cliente para crecimiento futuro | Lo aceptable con pocos pedidos puede degradarse con más volumen. | Mover filtrado a backend y cargar opciones bajo demanda/cache granular. | Pendiente |  |
| OB11-04 | UI técnica — shadcn/Tailwind | Inline styles, tokens sin usar y `ScrollArea` ausente en 16 archivos | `env(safe-area-inset-bottom)` como `style={{}}`, colores sin tokens, `overflow-y-auto` nativo en listas con altura fija. | Extraer `MobileActionBar`, aplicar tokens semánticos, migrar a `ScrollArea` en contenedores con scroll interno. | Pendiente |  |

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
| `11-shadcn-tailwind-agent.md` | Tokens Tailwind v4, `cn()`, inline styles, ScrollArea y API shadcn |

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
- [ ] iOS Safari: abrir gestor y verificar que las barras móviles inferiores no quedan cortadas por el safe area.
- [ ] `OrderCard` con estado activo/pendiente/cancelado: confirmar que los colores son los tokens semánticos (`warning`, `success`, `destructive`), no clases directas de Tailwind.
- [ ] Inspeccionar en DevTools los elementos con `style={{}}` en toolbars móviles: confirmar ausencia de conflictos con clases Tailwind.
- [ ] Hover sobre botones con `title=""` en móvil: confirmar que el tooltip nativo no aparece (evidencia del problema).
