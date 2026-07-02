# GAP-062 — Eliminar logging de token en orderService.js (domain wrapper)

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

`src/services/domain/orders/orderService.js` es el wrapper de dominio que adapta
`src/services/orderService.ts` a la interfaz estándar que usa `EntityClient`/
`entityServiceMapper.ts` (distinto del `orderService.ts` que ya migró su token-as-parameter
en GAP-056 — este es un archivo separado).

Su método `getActiveOrders()` (líneas 179-207) loguea en cada llamada:

```js
async getActiveOrders() {
  try {
    console.log('[orderService.getActiveOrders] 🔄 Obteniendo token...');
    const token = await getAuthToken();
    console.log(
      '[orderService.getActiveOrders] ✅ Token obtenido, longitud:',
      token?.length || 0,
      'primeros 10 chars:',
      token?.substring(0, 10) || 'none'
    );
    const orders = await orderServiceFunctions.getActiveOrders(token);
    console.log(/* ... */);
    return orders;
  } catch (error) {
    console.error('[orderService.getActiveOrders] ❌ Error obteniendo pedidos activos:', error.message);
    console.error('[orderService.getActiveOrders] ❌ Stack:', error.stack);
    throw error;
  }
}
```

Esto expone los primeros 10 caracteres del JWT de autenticación y su longitud en la consola
del navegador en cada carga de pedidos activos, en producción. Es una fuga de información
de seguridad, no solo una violación de estilo (console.log en producción).

Detectado en auditoría MIGRATE del módulo orders manager (2026-07-01). No cubierto por
GAP-056 (que solo tocó `services/orderService.ts`, un archivo distinto).

## Solución acordada

Eliminar todos los `console.log`/`console.error` de depuración del método `getActiveOrders()`
en `src/services/domain/orders/orderService.js` — no solo las líneas que exponen el token.
No hay logs legítimos para producción en este método; se deja limpio por completo,
manteniendo el `throw error` para que el caller (TanStack Query) gestione el error.

```js
async getActiveOrders() {
  const token = await getAuthToken();
  return orderServiceFunctions.getActiveOrders(token);
}
```

## Referencias e inspiración

- PL-010 / GAP-056: mismo módulo, patrón de limpieza de logging ya aplicado en otros archivos
- Regla GENERAL de `.claude/agents/code-audit-agent.md`: "No console.log, console.error left in production code"

## Criterios de aceptación

- [x] `getActiveOrders()` en `src/services/domain/orders/orderService.js` no contiene ningún
      `console.log` ni `console.error`
- [x] No se loguea el token, su longitud, ni ningún fragmento del mismo en ningún punto del archivo
- [x] El método sigue propagando el error (`throw`) para que el caller lo gestione
- [x] `npm run lint` pasa sin warnings en el archivo modificado
- [x] El listado de pedidos activos (donde se usa `getActiveOrders`) sigue funcionando igual

## Archivos a crear o modificar

**Modificar:**
- `src/services/domain/orders/orderService.js` — eliminar los 6 `console.log`/`console.error`
  de depuración en `getActiveOrders()`

## Restricciones

- No modificar la firma del método ni su comportamiento de retorno/error
- No tocar el resto de métodos del archivo — el fix es específico a `getActiveOrders()`
- No renombrar el archivo a `.ts` en este GAP — es scope de un GAP de migración distinto
  (candidato LOW-MEDIUM complexity, ver auditoría MIGRATE 2026-07-01)

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

Ninguno.

### Archivos modificados

- `src/services/domain/orders/orderService.js` — eliminados los 6 `console.log`/`console.error` de depuración en `getActiveOrders()`, incluyendo los que exponían longitud y fragmento del JWT. El método queda en 3 líneas: obtiene token y delega al service subyacente.

### Decisiones tomadas durante la implementación

- Se eliminó el bloque `try/catch` junto con los logs: en funciones `async`, los errores de `getAuthToken()` y `getActiveOrders()` se propagan al caller sin necesidad de `throw` explícito, cumpliendo el criterio de aceptación.

### Desviaciones del plan (si las hay)

Ninguna.

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO

### Puntuación: 10/10

### Checklist

- [x] Criterios de aceptación cumplidos
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta

### Observaciones para Jose

Fix mínimo y correcto. El método coincide exactamente con la solución acordada en el GAP.
La propagación de errores se mantiene: al ser `async` sin `try/catch`, las excepciones de
`getAuthToken()` o `getActiveOrders()` llegan al caller sin intervención.

Nota: el listado principal de pedidos activos (`useOrders` → `@/services/orderService`) no
pasa por este wrapper; los consumidores del domain wrapper son `orderTools.js` (AI Chat) y
`entityServiceMapper`. El cambio no altera la firma ni el flujo de retorno/error.

### Estado final de la implementación

GAP cerrado. Fuga de JWT en consola eliminada en `getActiveOrders()` del domain wrapper.
