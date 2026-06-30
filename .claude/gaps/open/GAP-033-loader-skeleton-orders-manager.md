# GAP-033 — Loader → Skeleton en OrdersManager

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** open
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
