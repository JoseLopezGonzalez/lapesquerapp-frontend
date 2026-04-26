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

| ID | Regla/dato | Ownership recomendado | Explicación del problema | Referencia | Solución / mejora recomendada | Estado | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OB10-01 | No mostrar pedidos `finished` antiguos en gestor | Backend para query, frontend como UX secundaria | Si cada pantalla decide qué ocultar, reportes/listados pueden no coincidir. | `src/components/Admin/OrdersManager/index.js:206`, `src/lib/comercial/comercialOrders.ts:98` | Exponer filtro backend `active/visible` y mantener fallback UX. | Pendiente |  |
| OB10-02 | Categorías Hoy/Mañana según `loadDate` | Frontend aceptable, pero backend podría exponer filtros | Es una regla simple, pero se recalcula en varias variantes del gestor. | `src/components/Admin/OrdersManager/index.js:125` | Mantener en frontend mientras el volumen sea bajo; backend si escala. | Pendiente |  |
| OB10-03 | Bloquear documentos, etiquetas, incidencias y export en comercial read-only | Backend obligatorio, frontend UX | Son acciones sensibles que no deben depender solo de botones ocultos. | `src/components/Admin/OrdersManager/Order/index.js:43` | Auditar policies backend y cubrir mutaciones con tests por rol. | Pendiente |  |
| OB10-04 | Palets read-only para comercial si pedido no terminado | Backend obligatorio, frontend UX | Los palets afectan preparación y trazabilidad del pedido. | `src/components/Admin/OrdersManager/Order/index.js:50` | Bloquear endpoints de palets por rol/estado, no solo botones. | Pendiente |  |
| OB10-05 | Generar cajas desde previsión y construir GS1-128 fallback | Debería validarse/backend o servicio de dominio compartido | Un fallback de trazabilidad mal formado puede contaminar etiquetas y almacén. | `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js:496` | Validar GTIN/GS1 en backend o impedir fallback no trazable. | Pendiente |  |
| OB10-06 | Detectar productos extra en field y construir `plannedExtras` | Backend debe validar; frontend puede preparar payload | El repartidor puede servir productos no previstos; backend debe reconciliarlo con el pedido. | `src/lib/field/fieldOrderExecution.ts:137` | Backend debe reconciliar extras con pedido y permisos. | Pendiente |  |
| OB10-07 | Ajustes de precios e IVA en field | Backend debe validar contra permisos y reglas comerciales | Cambios de precio/IVA tienen impacto financiero y no son solo UI. | `src/lib/field/fieldOrderExecution.ts:154` | Definir qué roles pueden ajustar precio/IVA y validarlo servidor. | Pendiente |  |
| OB10-08 | Estados `pending`, `finished`, `incident` | Contrato backend documentado | Los estados gobiernan visibilidad, permisos y operaciones posteriores. | `src/configs/entitiesConfig.js:346` | Documentar enum, transiciones y efectos por estado. | Pendiente |  |

---

## 4. Hallazgos

| ID | Severidad | Hallazgo | Explicación del problema | Referencia | Solución / mejora recomendada | Estado | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OB10-09 | Alta | Reglas críticas de visibilidad comercial están en UI. Si backend no las replica, un comercial podría mutar por API. | El control de rol debe vivir en servidor; el frontend solo mejora la experiencia. | `src/components/Admin/OrdersManager/Order/index.js:43` | Confirmar policies backend y añadir pruebas de permisos. | Pendiente |  |
| OB10-10 | Alta | El frontend construye payload operativo field con cajas, extras y ajustes. Es correcto como asistente UX, pero backend debe ser fuente de verdad. | El cierre operativo del pedido afecta stock, facturación y trazabilidad. | `src/components/Field/FieldOrderExecutionPage.jsx:179` | Backend debe validar/reconciliar payload final servido. | Pendiente |  |
| OB10-11 | Alta | Crear palet desde previsión genera GS1-128 con fallback basado en ID de producto. Eso puede ser inválido para trazabilidad si no lo valida backend. | GS1-128 no debería inventarse desde un ID interno si falta GTIN real. | `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.js:496` | Exigir GTIN real o delegar generación GS1-128 a backend. | Pendiente |  |
| OB10-12 | Media | Ocultar terminados antiguos en frontend puede crear diferencias entre usuarios y reportes. | Dos pantallas pueden responder diferente a la pregunta "qué pedidos están activos". | `src/components/Admin/OrdersManager/index.js:206` | Mover criterio a endpoint/filtro compartido. | Pendiente |  |
| OB10-13 | Media | Exportaciones A3ERP/A3ERP2/Facilcom están expuestas como opciones de pedido sin doc de cuándo usar cada una. | Una exportación equivocada puede generar trabajo administrativo o errores ERP. | `src/configs/entitiesConfig.js:143` | Documentar matriz de exportación por destino y rol. | Pendiente |  |
| OB10-14 | Media | `orderType` distingue `standard` y `autoventa`, pero las implicaciones funcionales no están documentadas. | Tipo de pedido afecta campos, field, facturación y permisos, pero no hay contrato visible. | `src/configs/entitiesConfig.js:242` | Documentar diferencias funcionales y restricciones por tipo. | Pendiente |  |

---

## 5. Missing admin/domain clarity

| ID | Tema | Necesidad | Explicación del problema | Solución / mejora recomendada | Estado | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| OB10-15 | Estados de pedido | Definir ciclo permitido, transiciones y roles | Los estados son reglas de negocio, no simples badges. | Crear tabla de estados/transiciones en documentación de pedidos. | Pendiente |  |
| OB10-16 | Tipos de pedido | Definir diferencias entre estándar y autoventa | El tipo cambia comportamiento y validaciones esperadas. | Documentar efectos de `orderType` en UI, API y field. | Pendiente |  |
| OB10-17 | Documentos de pedido | Definir destinatarios estándar y editabilidad por tenant | Enviar documentos depende de relaciones de negocio y puede variar por tenant. | Crear matriz documento/destinatario/rol configurable. | Pendiente |  |
| OB10-18 | Exportaciones ERP | Definir cuándo usar A3ERP, A3ERP2, Facilcom y Excel | Son integraciones externas con consecuencias administrativas. | Añadir guía de uso y ownership de cada exportación. | Pendiente |  |
| OB10-19 | Field/autoventa | Definir ownership del ajuste final servido | El resultado servido puede diferir de la previsión y debe reconciliarse. | Establecer backend como fuente de verdad del cierre operativo. | Pendiente |  |
| OB10-20 | GS1-128 | Definir si frontend puede generar fallback o debe venir de producto/backend | La trazabilidad requiere identificadores válidos y auditables. | Revisar con trazabilidad y eliminar fallback si no es válido. | Pendiente |  |

---

## 6. Recomendaciones

1. Validar en backend todas las restricciones que hoy se expresan con `readOnly`.
2. Documentar estados y transiciones de pedido con roles permitidos.
3. Revisar generación GS1-128 desde previsión con negocio y trazabilidad.
4. Mover filtros de negocio recurrentes a endpoints o parámetros: activos, hoy, mañana, terminados visibles.
5. Crear documentación de exportaciones por destino ERP.

---

## 7. Prioridad de dominio

| ID | Prioridad | Acción | Explicación del problema | Solución / mejora recomendada | Estado | Observaciones |
| --- | --- | --- | --- | --- | --- | --- |
| OB10-21 | P0 | Confirmar backend role policies para comercial read-only y field. | Son fronteras de seguridad y negocio, no preferencias visuales. | Revisar endpoints mutables y añadir tests de autorización. | Pendiente |  |
| OB10-22 | P1 | Documentar ciclo de vida de pedido y `orderType`. | Sin contrato, cada pantalla interpreta el dominio por su cuenta. | Crear sección en doc de pedidos con estados, tipos y transiciones. | Pendiente |  |
| OB10-23 | P1 | Validar generación de cajas/GS1 desde previsión con trazabilidad. | Los errores de trazabilidad se arrastran a almacén, etiquetas y auditoría. | Coordinar decisión con backend/negocio antes de ampliar el flujo. | Pendiente |  |
| OB10-24 | P2 | Convertir filtros cliente de pedidos en filtros backend cuando crezca volumen. | Evita divergencias y problemas de rendimiento a futuro. | Añadir parámetros backend equivalentes a categorías actuales. | Pendiente |  |
| OB10-25 | P2 | Documentar matriz de documentos y destinatarios por tenant. | Documentos y destinatarios son reglas operativas del cliente. | Definir configuración por tenant o confirmar que es global. | Pendiente |  |
