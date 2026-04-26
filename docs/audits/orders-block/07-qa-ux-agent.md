# Auditoría: QA/UX Agent
# Bloque: Pedidos - flujos, edge cases y cobertura

**Fecha:** 2026-04-26
**Rol auditor:** QA/UX Agent
**Scope:** flujos críticos de usuario, estados rotos, acciones destructivas, read-only comercial, field y tests

---

## 1. Archivos inspeccionados

| Archivo | Propósito |
|---|---|
| `src/components/Admin/OrdersManager/index.js` | Flujo gestor admin |
| `src/components/Admin/OrdersManager/Order/index.js` | Detalle/editor |
| `src/components/Admin/OrdersManager/CreateOrderForm/index.js` | Alta de pedido |
| `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js` | Previsión |
| `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js` | Palets |
| `src/components/Admin/OrdersManager/Order/OrderDocuments/index.js` | Envío documental |
| `src/components/Comercial/CRM/ComercialOrdersManager.jsx` | Flujo comercial |
| `src/components/Field/FieldOrdersPage.jsx` | Lista field |
| `src/components/Field/FieldOrderExecutionPage.jsx` | Ejecución field |
| `src/__tests__/hooks/useOrder.test.js` | Tests hook detalle |
| `src/__tests__/services/orderService.test.js` | Tests servicio |
| `src/lib/field/__tests__/fieldOrderExecution.test.ts` | Tests helpers field |

---

## 2. Resultado general

La cobertura del bloque es mejor que en otros sistemas críticos: hay tests para `useOrder`, `useOrders`, `orderService`, rentabilidad, helpers comerciales y helpers field. El problema es que faltan tests de UI para flujos completos y hay acciones destructivas o sensibles que dependen de convenciones visuales. UX entrega valor, pero necesita más defensa ante errores operativos.

### Nota global: **5.8 / 10**

---

## 3. Hallazgos

| Severidad | Hallazgo | Referencia |
|---|---|---|
| Alta | Eliminar línea prevista persistida no pide confirmación. Impacta pedido y datos comerciales. | `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js:221` |
| Alta | Read-only comercial bloquea secciones sensibles por UI; falta test que demuestre ausencia de mutaciones. | `src/components/Admin/OrdersManager/Order/index.js:43` |
| Alta | Envío documental estándar no muestra revisión de destinatarios/documentos antes de enviar. | `src/components/Admin/OrdersManager/Order/OrderDocuments/index.js:196` |
| Media | Crear pedido móvil evita Enter y navega por pasos, pero no muestra resumen final antes de crear. | `src/components/Admin/OrdersManager/CreateOrderFormMobile.jsx:301` |
| Media | `ProductionView` con mock data en lista vacía puede confundir QA/producto si no hay indicador. | `src/components/Admin/OrdersManager/index.js:390` |
| Media | Field permite avanzar desde paso de cajas sin cajas; se valida al guardar si no hay productos, pero el usuario puede llegar tarde al error. | `src/components/Field/FieldOrderExecutionPage.jsx:153` |
| Media | En creación desde prefill, si falla `sessionStorage`, el usuario solo recibe un toast y el formulario abre vacío. | `src/components/Admin/OrdersManager/index.js:85` |
| Baja | No se detectaron tests de componentes para `CreateOrderForm`, `OrderEditSheet`, `OrderDocuments` ni `OrderPallets`. | `src/__tests__/` |

---

## 4. Cobertura detectada

| Área | Cobertura |
|---|---|
| `useOrders` | Carga, vacío, error, query key |
| `useOrder` | Carga, estado, exportaciones, análisis lazy, errores |
| `orderService` | Detalle, activos, rentabilidad, update, status, create |
| Comercial helpers | Enriquecimiento con ofertas, categorías y filtros |
| Field helpers | Items iniciales, agregación de cajas, validación y payload |
| UI forms y secciones | Sin tests de componente detectados |

---

## 5. Recomendaciones

1. Añadir confirmación para eliminar líneas previstas persistidas.
2. Añadir tests de componente o integración para `readOnly` comercial: no editar, no documentos sensibles, no incidencias, palets restringidos.
3. Añadir test de creación de pedido con líneas, 422 y prefill.
4. Añadir test de `OrderDocuments` para no enviar si no hay selección y para payload agrupado.
5. Añadir guardas UX más tempranas en field cuando no hay cajas/productos servidos.

---

## 6. Checklist manual prioritario

- [ ] Crear pedido completo desktop.
- [ ] Crear pedido completo móvil con varios productos.
- [ ] Editar cabecera y cancelar con cambios.
- [ ] Añadir, editar y eliminar línea prevista persistida.
- [ ] Vincular, desvincular y eliminar palet desde pedido.
- [ ] Enviar documentos custom y estándar.
- [ ] Abrir pedido comercial en curso y confirmar que no hay acciones sensibles.
- [ ] Ejecutar pedido field con cajas escaneadas, precio y guardado final.

