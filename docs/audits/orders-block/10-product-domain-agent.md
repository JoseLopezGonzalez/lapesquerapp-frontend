# Auditoría: Product & Domain Agent
# Bloque: Pedidos - encaje de negocio, ownership y multi-rol

**Fecha:** 2026-04-26
**Rol auditor:** Product & Domain Agent
**Scope:** dominio de pedidos, estados, preparación, palets, comercial, autoventa, rentabilidad y ownership frontend/backend

---

## 1. Archivos inspeccionados

| Archivo | Propósito |
|---|---|
| `src/configs/entitiesConfig.js` | Estado, tipo y exportaciones de pedidos |
| `src/components/Admin/OrdersManager/index.js` | Operación admin |
| `src/components/Admin/OrdersManager/Order/index.js` | Detalle y permisos visuales |
| `src/hooks/useOrder.js` | Reglas de estado, documentos, líneas y palets |
| `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js` | Preparación y palets |
| `src/components/Comercial/CRM/ComercialOrdersManager.jsx` | Operación comercial |
| `src/lib/comercial/comercialOrders.ts` | Reglas comerciales de visibilidad |
| `src/components/Field/FieldOrderExecutionPage.jsx` | Ejecución field/autoventa |
| `src/lib/field/fieldOrderExecution.ts` | Payload operativo servido |

---

## 2. Resultado general

El bloque modela bastante bien el flujo real: pedido previsto, producción/preparación, palets, documentos, comercial y ejecución field. La debilidad de dominio es que varias reglas de negocio viven en frontend: ocultar terminados antiguos, bloquear secciones comerciales, clasificar estados, decidir payload operativo de cajas y extras, y generar cajas desde previsión. Algunas pueden ser UX, pero deben estar respaldadas por backend.

### Nota global: **5.9 / 10**

---

## 3. Inventario de reglas de negocio en frontend

| Regla/dato | Ownership recomendado | Referencia |
|---|---|---|
| No mostrar pedidos `finished` antiguos en gestor | Backend para query, frontend como UX secundaria | `src/components/Admin/OrdersManager/index.js:206`, `src/lib/comercial/comercialOrders.ts:98` |
| Categorías Hoy/Mañana según `loadDate` | Frontend aceptable, pero backend podría exponer filtros | `src/components/Admin/OrdersManager/index.js:125` |
| Bloquear documentos, etiquetas, incidencias y export en comercial read-only | Backend obligatorio, frontend UX | `src/components/Admin/OrdersManager/Order/index.js:43` |
| Palets read-only para comercial si pedido no terminado | Backend obligatorio, frontend UX | `src/components/Admin/OrdersManager/Order/index.js:50` |
| Generar cajas desde previsión y construir GS1-128 fallback | Debería validarse/backend o servicio de dominio compartido | `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js:496` |
| Detectar productos extra en field y construir `plannedExtras` | Backend debe validar; frontend puede preparar payload | `src/lib/field/fieldOrderExecution.ts:137` |
| Ajustes de precios e IVA en field | Backend debe validar contra permisos y reglas comerciales | `src/lib/field/fieldOrderExecution.ts:154` |
| Estados `pending`, `finished`, `incident` | Contrato backend documentado | `src/configs/entitiesConfig.js:346` |

---

## 4. Hallazgos

| Severidad | Hallazgo | Referencia |
|---|---|---|
| Alta | Reglas críticas de visibilidad comercial están en UI. Si backend no las replica, un comercial podría mutar por API. | `src/components/Admin/OrdersManager/Order/index.js:43` |
| Alta | El frontend construye payload operativo field con cajas, extras y ajustes. Es correcto como asistente UX, pero backend debe ser fuente de verdad. | `src/components/Field/FieldOrderExecutionPage.jsx:179` |
| Alta | Crear palet desde previsión genera GS1-128 con fallback basado en ID de producto. Eso puede ser inválido para trazabilidad si no lo valida backend. | `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js:496` |
| Media | Ocultar terminados antiguos en frontend puede crear diferencias entre usuarios y reportes. | `src/components/Admin/OrdersManager/index.js:206` |
| Media | Exportaciones A3ERP/A3ERP2/Facilcom están expuestas como opciones de pedido sin doc de cuándo usar cada una. | `src/configs/entitiesConfig.js:143` |
| Media | `orderType` distingue `standard` y `autoventa`, pero las implicaciones funcionales no están documentadas. | `src/configs/entitiesConfig.js:242` |

---

## 5. Missing admin/domain clarity

| Tema | Necesidad |
|---|---|
| Estados de pedido | Definir ciclo permitido, transiciones y roles |
| Tipos de pedido | Definir diferencias entre estándar y autoventa |
| Documentos de pedido | Definir destinatarios estándar y editabilidad por tenant |
| Exportaciones ERP | Definir cuándo usar A3ERP, A3ERP2, Facilcom y Excel |
| Field/autoventa | Definir ownership del ajuste final servido |
| GS1-128 | Definir si frontend puede generar fallback o debe venir de producto/backend |

---

## 6. Recomendaciones

1. Validar en backend todas las restricciones que hoy se expresan con `readOnly`.
2. Documentar estados y transiciones de pedido con roles permitidos.
3. Revisar generación GS1-128 desde previsión con negocio y trazabilidad.
4. Mover filtros de negocio recurrentes a endpoints o parámetros: activos, hoy, mañana, terminados visibles.
5. Crear documentación de exportaciones por destino ERP.

---

## 7. Prioridad de dominio

| Prioridad | Acción |
|---|---|
| P0 | Confirmar backend role policies para comercial read-only y field. |
| P1 | Documentar ciclo de vida de pedido y `orderType`. |
| P1 | Validar generación de cajas/GS1 desde previsión con trazabilidad. |
| P2 | Convertir filtros cliente de pedidos en filtros backend cuando crezca volumen. |
| P2 | Documentar matriz de documentos y destinatarios por tenant. |

