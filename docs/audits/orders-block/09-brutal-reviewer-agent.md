# Auditoría: Brutal Reviewer Agent
# Bloque: Pedidos - revisión sin suavizar

**Fecha:** 2026-04-26
**Rol auditor:** Brutal Reviewer Agent
**Scope:** riesgos reales, deuda técnica, duplicidad, bugs probables y prioridades P0/P1

---

## 1. Diagnóstico rápido

Pedidos funciona y soporta mucho negocio real. También es una bola de nieve: `useOrder.js` sabe demasiado, hay dos servicios de pedidos, el gestor admin y el gestor comercial duplican estructura, y hay acciones financieras/logísticas sin suficiente prueba de interfaz.

### Nota global: **4.4 / 10**

---

## 2. Qué está débil

### 2.1 Se loguea parte del token

`src/services/domain/orders/orderService.js:172-178` imprime la longitud y los primeros caracteres del token. No es aceptable. Un token no debe aparecer en logs, ni parcialmente, ni "solo para debug".

### 2.2 El bloque tiene dos service layers para la misma entidad

`src/services/orderService.ts` es el servicio real con endpoints concretos. `src/services/domain/orders/orderService.js` es un adapter que reexporta y envuelve. Esto duplica decisiones y crea preguntas permanentes: ¿qué servicio uso?, ¿qué método propaga bien errores?, ¿qué contrato está vigente?

### 2.3 `useOrder.js` es un backend en miniatura

El hook consulta pedido, muta cabecera, cambia estado, edita líneas, exporta documentos, envía emails, gestiona incidencias, palets, análisis económico y recarga. Eso no es un hook, es una capa de aplicación completa embutida en React.

### 2.4 Eliminar líneas previstas sin confirmación es un error UX serio

`OrderPlannedProductDetails` elimina líneas persistidas con `notify.promise`, pero sin confirm dialog. En un ERP, borrar una línea de pedido no debe depender de que el usuario no se equivoque con un botón.

### 2.5 `readOnly` comercial es una barrera visual, no una garantía

El componente `Order` bloquea secciones en modo comercial si el pedido no está terminado. Correcto como UX. Insuficiente como seguridad. Si backend no impide mutaciones por rol, esto es una puerta abierta.

---

## 3. Qué es confuso

| Confusión | Por qué importa |
|---|---|
| `/admin/orders` vs `/admin/orders-manager` | Uno es listado EntityClient; otro es operación real. No está documentado. |
| `createForm` en config de `orders` | Parece usable, pero el alta real vive en `CreateOrderForm` dentro del gestor. |
| Estados `pending`, `finished`, `incident` | Se usan como negocio, UI y filtros, pero no hay contrato visible. |
| `A3ERP`, `A3ERP2`, `Facilcom`, Excel y PDFs | Hay exportaciones masivas e individuales en sitios distintos. |
| Admin y comercial comparten UI | Bueno, pero la duplicidad de gestores dice que el patrón no terminó de abstraerse. |

---

## 4. Qué está sobrecomplicado

- `CreateOrderFormMobile` tiene animaciones, stepper circular y lógica propia para un formulario que ya es complejo.
- `OrderDocuments` tiene tres modelos de envío en un solo componente grande.
- `OrderPallets` mezcla búsqueda, selección, clonado, creación desde previsión, etiquetas, confirmaciones y estado de diálogos.
- El adapter de dominio intenta encajar pedidos en EntityClient mientras el flujo real vive fuera de EntityClient.

---

## 5. Qué debe corregirse primero

| Prioridad | Problema | Acción |
|---|---|---|
| P0 | Logs de token | Eliminar inmediatamente cualquier log de token en `orderService.js`. |
| P0 | Acción destructiva sin confirmación | Confirm dialog para eliminar líneas previstas persistidas. |
| P1 | Doble service layer | Definir facade único y documentar migración. |
| P1 | `readOnly` sin test | Tests que prueben bloqueo UI y verificación backend por rol. |
| P1 | `useOrder.js` sobredimensionado | Extraer servicios de documentos, líneas, palets y análisis cuando se toque el bloque. |

---

## 6. Recomendación final

No reescribir el bloque entero. Sería caro y arriesgado. Pero sí cortar las fugas más graves:

1. quitar logs de token;
2. añadir confirmaciones destructivas;
3. cubrir read-only comercial con tests;
4. sacar llamadas documentales del hook;
5. documentar arquitectura real de pedidos.

Después de eso, cualquier mejora nueva debería pagar una pequeña deuda: si toca palets, extraer palets; si toca documentos, extraer documentos; si toca líneas, validar líneas.

