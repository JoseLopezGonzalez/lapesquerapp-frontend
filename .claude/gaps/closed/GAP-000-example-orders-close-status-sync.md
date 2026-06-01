# GAP-000 — Cerrar pedido no actualiza el estado en el listado sin recargar

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-05-20
- **Autor:** Jose

---

## Contexto y problema

En el módulo de pedidos (`/admin/orders`), cuando el usuario pulsa el botón "Cerrar pedido" dentro del detalle de un pedido, la acción se ejecuta correctamente en el backend (el estado cambia a `closed`), pero el listado de pedidos sigue mostrando ese pedido como "abierto" hasta que el usuario recarga manualmente la página.

El problema: la mutación `useOrderClose` no invalida la query del listado tras el éxito. El cache de TanStack Query mantiene el snapshot anterior.

Detectado por Jose al probar el flujo completo del módulo de ventas. Afecta a todos los roles con acceso a `/admin/orders`.

## Solución acordada

Añadir `queryClient.invalidateQueries` en el `onSuccess` del hook `useOrderClose` para que apunte al prefijo del listado de pedidos (`orderListKeys.listPrefix(tenantId)`). Tras el cierre, el listado se recarga automáticamente y el estado queda sincronizado.

No es necesario tocar el componente ni el service — solo el hook de mutación.

## Referencias e inspiración

Patrón de invalidación real del proyecto: `useCustomerCreate` invalida con `customerListKeys.listPrefix(tenantId)` tras crear un cliente. El mismo patrón aplica aquí.

Ver `.claude/agents/db-architect.md` — sección "Estrategias de invalidación".

## Criterios de aceptación

- [ ] Al pulsar "Cerrar pedido", el pedido desaparece del listado de pedidos abiertos en menos de 2 segundos, sin recargar la página manualmente
- [ ] La notificación toast de éxito sigue mostrándose tras el cierre
- [ ] Si el cierre falla (error de API), el listado NO se invalida y el pedido sigue apareciendo como abierto
- [ ] El hook sigue el patrón de mutación del proyecto (onSuccess, onError con notify)

## Archivos a crear o modificar

- `src/hooks/useOrderClose.ts` — añadir `invalidateQueries` en `onSuccess`

## Restricciones

- No tocar `src/hooks/useOrder.js` directamente — si `useOrderClose` está dentro de ese archivo, extraerlo como sub-hook en `src/hooks/orders/useOrderClose.ts`
- No modificar el componente que llama al hook — el fix es solo en el hook
- No tocar el service `orderService` — la llamada al backend ya funciona correctamente

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

- `src/hooks/orders/useOrderClose.ts` — sub-hook extraído con la mutación y la invalidación correcta

### Archivos modificados

- `src/hooks/useOrder.js` — añadida importación y re-exportación de `useOrderClose` desde el sub-hook (sin añadir lógica nueva al hook gigante)

### Decisiones tomadas durante la implementación

1. `useOrderClose` estaba embebido dentro de `useOrder.js` como función interna. Se extrajo a `src/hooks/orders/useOrderClose.ts` siguiendo la regla de hooks gigantes del proyecto.

2. Se usó `orderListKeys.listPrefix(tenantId)` para invalidar, lo que invalida todos los listados de pedidos independientemente de los filtros activos en ese momento. Alternativa descartada: invalidar solo la página actual — se descartó porque el cierre puede afectar al orden de los resultados por fecha.

3. Se mantuvo el mismo contrato de retorno que tenía la función original (`mutate`, `isPending`) para no romper los componentes que la consumen.

### Desviaciones del plan (si las hay)

Ninguna. La extracción fue directa, el patrón de invalidación ya existía en `useCustomerCreate`.

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
- [x] Hooks gigantes no tocados sin permiso (se extrajo correctamente a sub-hook)
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta

### Observaciones para Jose

La implementación es correcta y limpia. Destacar dos cosas positivas:

1. La extracción del sub-hook se hizo bien: `useOrder.js` ahora importa y re-exporta `useOrderClose` sin añadir lógica nueva — exactamente como manda la regla de hooks gigantes.

2. La elección de `listPrefix` en lugar de una key más específica es la correcta aquí: al cerrar un pedido cambia su estado y puede cambiar su posición en cualquier listado filtrado, así que tiene sentido invalidar todos los listados.

Verificado manualmente: el criterio "si falla, el listado no se invalida" está cubierto porque `invalidateQueries` solo está en `onSuccess`, no en `onSettled`.

Puntuación 10/10 — implementación ajustada exactamente al GAP, patrón correcto, extracción bien hecha.

### Estado final de la implementación

`src/hooks/orders/useOrderClose.ts` expone `useOrderClose()` que devuelve `{ mutate: closeOrder, isPending }`. Al llamar a `closeOrder(orderId)`, ejecuta `orderService.close(orderId)` y en caso de éxito invalida todas las queries de listado de pedidos del tenant actual. Los componentes existentes que llamaban a la función anterior no requirieron cambios.
