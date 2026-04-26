# Auditoría: API Client Agent
# Bloque: Pedidos - servicios, endpoints y errores

**Fecha:** 2026-04-26
**Rol auditor:** API Client Agent
**Scope:** servicios de pedidos, llamadas HTTP, payloads, errores, auth, tenant y descargas

---

## 1. Archivos inspeccionados

| Archivo | Propósito |
|---|---|
| `src/services/orderService.ts` | Servicio principal histórico de pedidos |
| `src/services/domain/orders/orderService.js` | Adapter de dominio para EntityClient y AI tools |
| `src/hooks/useOrder.js` | Consumidor principal de mutaciones y descargas |
| `src/hooks/useOrders.js` | Listado activo usado por gestor admin |
| `src/hooks/useComercialOrders.ts` | Listado comercial vía CRM |
| `src/hooks/useFieldOrders.ts` | Listado/detalle/mutación field |
| `src/services/palletService` | Acciones de palets consumidas por pedidos |
| `src/configs/entitiesConfig.js` | Endpoints de listado y exportaciones masivas |

---

## 2. Endpoints detectados

| Endpoint | Uso frontend | Referencia |
|---|---|---|
| `GET /api/v2/orders` | EntityClient listado paginado | `src/services/domain/orders/orderService.js:53` |
| `GET /api/v2/orders/active` | Gestor admin | `src/services/orderService.ts:284` |
| `GET /api/v2/orders/:id` | Detalle de pedido | `src/services/orderService.ts:202` |
| `PUT /api/v2/orders/:id` | Edición cabecera y temperatura | `src/services/orderService.ts:249` |
| `PUT /api/v2/orders/:id/status` | Cambio de estado | `src/services/orderService.ts:423` |
| `GET /api/v2/orders/:id/cost-analysis` | Análisis económico | `src/services/orderService.ts:224` |
| `POST/PUT/DELETE /api/v2/orders/:id/incident` | Incidencias | `src/services/orderService.ts:451` |
| `POST/PUT/DELETE /api/v2/order-planned-product-details` | Líneas previstas | `src/services/orderService.ts:336` |
| `GET /api/v2/orders/:id/{type}/{document}` | Exportación documento individual | `src/hooks/useOrder.js:61` |
| `POST /api/v2/orders/:id/send-custom-documents` | Envío documental custom | `src/hooks/useOrder.js:486` |
| `POST /api/v2/orders/:id/send-standard-documents` | Envío documental estándar | `src/hooks/useOrder.js:514` |
| `GET /api/v2/orders/xls/...` | Exportaciones masivas | `src/configs/entitiesConfig.js:143` |

---

## 3. Resultado general

La capa API usa `fetchWithTenant` en las rutas principales y tiene cobertura parcial de tests. El problema estructural es la convivencia de dos servicios de pedidos: uno histórico TypeScript con endpoints concretos y un adapter JS de dominio para EntityClient. Además, `useOrder.js` contiene llamadas HTTP directas para documentos, lo que mezcla hook de estado con service layer.

### Nota global: **5.2 / 10**

---

## 4. Hallazgos

| ID | Severidad | Hallazgo | Explicación del problema | Referencia | Solución / mejora recomendada | Estado | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OB03-01 | Alta | El adapter de dominio imprime token parcial y stack en consola al obtener pedidos activos. Aunque solo muestra primeros caracteres, no debe loguearse token. | Los logs pueden acabar en herramientas externas o capturas; cualquier fragmento de credencial es superficie innecesaria. | `src/services/domain/orders/orderService.js:172` | Eliminar logs sensibles y usar telemetría sin credenciales. | Pendiente |  |
| OB03-02 | Alta | Hay dos servicios oficiales para pedidos, con responsabilidades solapadas y contratos distintos. | Cada nueva llamada obliga a decidir entre dos capas y puede propagar errores o payloads de forma diferente. | `src/services/orderService.ts:1`, `src/services/domain/orders/orderService.js:1` | Consolidar en un facade único o documentar adapter transitorio. | Pendiente |  |
| OB03-03 | Alta | `useOrder.js` hace llamadas HTTP de documentos directamente en el hook, fuera de `orderService`. | El hook mezcla estado React con transporte HTTP, dificultando tests, reutilización y consistencia de errores. | `src/hooks/useOrder.js:441`, `src/hooks/useOrder.js:486` | Mover exportación/envío documental a `orderService.ts`. | Pendiente |  |
| OB03-04 | Media | El adapter declara que `/orders` "debería" devolver paginado; el propio comentario expresa incertidumbre del contrato. | Un contrato incierto puede romper EntityClient o paginación sin que el frontend lo detecte temprano. | `src/services/domain/orders/orderService.js:41` | Confirmar contrato backend y convertir comentario en documentación estable. | Pendiente |  |
| OB03-05 | Media | `setOrderStatus` tipa `status` como `number`, pero el sistema llama con strings como `pending` o `finished`. | El tipado comunica un contrato falso y reduce la utilidad de TypeScript para prevenir errores. | `src/services/orderService.ts:423`, `src/components/Admin/OrdersManager/Order/index.js:82` | Corregir tipo a enum/string de estados reales. | Pendiente |  |
| OB03-06 | Media | Algunas funciones lanzan `Error` plano y pierden `status/data`, dificultando `setErrorsFrom422`. | La UI no puede distinguir 422, 403 o errores de red con precisión, y pierde errores de campo. | `src/services/orderService.ts:355`, `src/services/orderService.ts:411` | Usar `ApiError` en todas las mutaciones con `status` y `data`. | Pendiente |  |
| OB03-07 | Media | Descargas individuales construyen URLs en el hook y usan `navigator.userAgent` directamente. | Repite detalles técnicos fuera del service layer y complica cambios futuros de endpoints o headers. | `src/hooks/useOrder.js:441` | Centralizar construcción de URLs y headers en el service layer. | Pendiente |  |
| OB03-08 | Baja | Importaciones no usadas en el adapter (`fetchEntityDataGeneric`, `submitEntityFormGeneric`) sugieren deuda o refactor incompleto. | La presencia de código muerto confunde sobre qué patrón debe seguirse. | `src/services/domain/orders/orderService.js:23` | Eliminar imports muertos al tocar el adapter. | Pendiente |  |

---

## 5. Recomendaciones

1. Eliminar logs de token en `src/services/domain/orders/orderService.js`.
2. Definir un único service facade para pedidos, con métodos de dominio y endpoints documentados.
3. Mover exportación y envío documental desde `useOrder.js` a `orderService.ts`.
4. Normalizar errores con `ApiError` en todas las mutaciones para preservar `status` y `data`.
5. Corregir tipos de `setOrderStatus` para usar el enum real de estados o `string`.

---

## 6. Checks manuales sugeridos

- [ ] Revisar consola del navegador al cargar gestor: no debe aparecer token ni fragmentos.
- [ ] Forzar 422 en edición de pedido y comprobar mapeo de errores de campo.
- [ ] Forzar 403 en exportación individual y confirmar mensaje amigable.
- [ ] Probar exportaciones masivas A3ERP, A3ERP2, Facilcom y hojas de pedido.
- [ ] Probar envío documental sin emails configurados.
