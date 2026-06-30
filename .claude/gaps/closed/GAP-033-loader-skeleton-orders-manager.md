# GAP-033 — Loader → Skeleton en OrdersManager

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-06-30
- **Autor:** Jose

---

## Contexto y problema

El módulo OrdersManager (admin) utiliza el componente `<Loader>` (spinner + texto "Cargando...") como estado de carga primario en tres lugares. Según el design system (`design-context.md` §4), `<Loader>` debe usarse exclusivamente como gate de sesión/autenticación. Para carga de datos del servidor debe usarse `<Skeleton>` con la forma del contenido. Esto es inconsistente con el patrón canónico establecido en `EntityBody` y los componentes del field app (GAP-010, GAP-018).

**Archivos afectados:**

1. `OrdersManagerLayout.jsx:16–21` — `loading` de `useOrders` muestra `<Loader>` bloqueando el layout
2. `Order/index.tsx:148–154` — `<Loader>` durante carga del detalle de pedido
3. `CreateOrderForm/index.tsx:496–498` — `<Loader>` durante carga de config del formulario

---

## Solución acordada

Reemplazar cada `<Loader>` por `<Skeleton>` apropiado que replique la forma del contenido que está cargando:

1. **OrdersManagerLayout**: Skeleton que reproduzca la silueta del layout de lista (cabecera + N filas)
2. **Order/index.tsx**: Skeleton que reproduzca la silueta de la vista de detalle de pedido (header + secciones)
3. **CreateOrderForm/index.tsx**: Skeleton que reproduzca la silueta del formulario de creación

## UI Brief

- **Vista de referencia:** `src/components/Admin/Entity/EntityClient/EntityTable/EntityBody/index.js` — patrón canónico con 17-row Skeleton
- **Tipo de layout:** Skeleton inline reemplazando el contenido que carga
- **Componentes clave:** `<Skeleton>` de `@/components/ui/skeleton`
- **Estados requeridos:** loading (Skeleton) / loaded (contenido normal)
- **Mobile:** no aplica — el patrón Skeleton es el mismo en todas las resoluciones

---

## Criterios de aceptación

- [ ] `OrdersManagerLayout.jsx` no importa ni renderiza `<Loader>` para el estado de carga de datos
- [ ] `Order/index.tsx` no importa ni renderiza `<Loader>` para el estado de carga del pedido
- [ ] `CreateOrderForm/index.tsx` no importa ni renderiza `<Loader>` para el estado de carga de config
- [ ] Cada Skeleton refleja la forma del contenido que reemplaza (cabecera, campos, secciones)
- [ ] El componente `<Loader>` (si aún está importado) solo se usa para gates de sesión/auth — en estos archivos no hay gates de sesión, así que el import se elimina
- [ ] No se introducen nuevos archivos .js
- [ ] TypeScript compila sin errores en los archivos modificados

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/shared/OrdersManagerLayout.jsx`
- `src/components/Admin/OrdersManager/Order/index.tsx`
- `src/components/Admin/OrdersManager/CreateOrderForm/index.tsx`

## Restricciones

- No tocar `src/hooks/useOrder.js` (hook protegido)
- No refactorizar lógica de negocio — solo sustituir el estado de carga visual
- No cambiar la estructura del layout ni las props de los componentes
- Mantener el import de `<Loader>` en `FieldOperatorsPageClient.jsx` (líneas 21–27) — ese uso SÍ es un gate de sesión válido (status === 'loading')

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/shared/OrdersManagerLayout.jsx` — import `Loader` → `Skeleton`; early return con Skeleton de cabecera (filtros) + 8 filas de lista.
- `src/components/Admin/OrdersManager/Order/index.tsx` — import `Loader` → `Skeleton`; early return con Skeleton de header de pedido (título + badge) + grid de 4 métricas + tabs + 5 filas.
- `src/components/Admin/OrdersManager/CreateOrderForm/index.tsx` — import `Loader` → `Skeleton`; bloque inline `loading ? <Loader>` → Skeleton de 6 campos con label + input.

### Decisiones tomadas durante la implementación

- `CreateOrderFormMobile.jsx` no se tocó: su importación de `Loader` está sin usar (`<Loader2>` es lo que utiliza) y el bloque `loading ? ...` muestra un texto simple, no el componente `<Loader>`. El GAP no incluye este archivo.
- Skeleton forms con 5-6 filas de label+input es la silueta fiel al contenido que aparece tras la carga.

### Desviaciones del plan (si las hay)

Ninguna.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: [10/10]

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

Los tres puntos de carga del módulo Orders ahora muestran Skeleton con silueta fiel al contenido. TypeScript compila limpio.

### Estado final de la implementación

Implementado y cerrado en el mismo commit que el código.
