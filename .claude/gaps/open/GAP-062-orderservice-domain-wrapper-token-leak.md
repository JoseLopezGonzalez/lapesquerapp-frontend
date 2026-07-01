# GAP-062 — Eliminar logging de token en orderService.js (domain wrapper)

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Alta
- **Estado:** open
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

- [ ] `getActiveOrders()` en `src/services/domain/orders/orderService.js` no contiene ningún
      `console.log` ni `console.error`
- [ ] No se loguea el token, su longitud, ni ningún fragmento del mismo en ningún punto del archivo
- [ ] El método sigue propagando el error (`throw`) para que el caller lo gestione
- [ ] `npm run lint` pasa sin warnings en el archivo modificado
- [ ] El listado de pedidos activos (donde se usa `getActiveOrders`) sigue funcionando igual

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

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
