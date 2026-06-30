# GAP-035 — Loader → Skeleton en PalletView, ProductionView y LoadMoreStoreCard

## Metadata

- **Tipo:** Refactor
- **Módulo:** Stock / Maquiladores / Almacén
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-06-30
- **Autor:** Jose

---

## Contexto y problema

`PalletView/index.tsx` y `ProductionView.jsx` usan `<Loader>` como estado de carga primario de datos. Según el design system, este componente es exclusivo para gates de sesión/auth. Para carga de datos → `<Skeleton>`.

**Archivos afectados:**

1. `PalletView/index.tsx:534–537` — `<Loader>` durante carga de datos del palet en el diálogo de detalle
2. `ProductionView.jsx:128–133` — `<Loader>` durante carga de datos de producción
3. `ProductionView.jsx:77` — `<Loader>` como `loading` fallback en `dynamic()` (importación dinámica)
4. `Stores/StoresManager/StoreCard/LoadMoreStoreCard.js:26` — `<Loader>` en el botón "cargar más" de la lista de almacenes

Nota: `PalletView/index.tsx` tiene también `// @ts-nocheck` (cubierto por GAP-039) — este GAP solo aborda el loading state.

---

## Solución acordada

1. **PalletView**: Reemplazar `<Loader>` por Skeleton que reproduzca la silueta del diálogo de detalle de palet (header con código/estado + secciones de datos + tabla de cajas).
2. **ProductionView**: Reemplazar `<Loader>` inline por Skeleton de formulario/detalle de producción. Para el `dynamic()` loading fallback: usar un Skeleton simple de pantalla completa o `null` (el contenido se carga muy rápido).

## UI Brief

- **Vista de referencia:** `src/components/Admin/Pallets/PalletDialog/index.tsx` — diálogo de palet con `useIsMobileSafe` correcto; la silueta del Skeleton debe coincidir con su estructura
- **Tipo de layout:** Skeleton dentro de diálogo (PalletView) y Skeleton de página completa (ProductionView)
- **Componentes clave:** `<Skeleton>` de `@/components/ui/skeleton`
- **Estados requeridos:** loading (Skeleton) / loaded (contenido real)
- **Mobile:** no aplica — vistas de admin

---

## Criterios de aceptación

- [ ] `PalletView/index.tsx` no renderiza `<Loader>` en ninguna condición de carga de datos
- [ ] `ProductionView.jsx` no renderiza `<Loader>` en ninguna condición de carga de datos (ni inline ni en `dynamic()`)
- [ ] Los Skeletons muestran una silueta reconocible del contenido que reemplazan
- [ ] El import de `<Loader>` se elimina de los archivos modificados (si no tiene otros usos)
- [ ] El comportamiento funcional (carga de datos, acciones) no cambia

## Archivos a crear o modificar

- `src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx`
- `src/components/Admin/Productions/ProductionView.jsx`
- `src/components/Admin/Stores/StoresManager/StoreCard/LoadMoreStoreCard.js`

## Restricciones

- No tocar la lógica de negocio ni los handlers de PalletView ni ProductionView
- No tocar `src/hooks/usePallet.ts` (hook protegido)
- Este GAP NO aborda el `// @ts-nocheck` de PalletView (ver GAP-039)
- Este GAP NO aborda el token-as-parameter de PalletView (ver GAP-043)

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx` — import `Loader` → `Skeleton`; bloque `loading || !temporalPallet` → Skeleton de diálogo (header código/estado + grid 6 métricas + 5 filas de datos).
- `src/components/Admin/Productions/ProductionView.jsx` — import `Loader` → `Skeleton`; `dynamic()` loading fallback → Skeleton full-height; early return `if (loading)` → Skeleton de página de producción (header + grid métricas + tabs + filas).
- `src/components/Admin/Stores/StoresManager/StoreCard/LoadMoreStoreCard.js` — import `Loader` → `Skeleton`; spinner de "cargando más" → Skeleton de 2 elementos apilados.

### Decisiones tomadas durante la implementación

- El `dynamic()` loading fallback de `ProductionDiagram` usaba `<Loader text="...">`. Al ser un componente de importación dinámica que carga rápido, se reemplaza con un Skeleton de pantalla completa (h-[600px]) que sigue la misma geometría del diagrama.
- `LoadMoreStoreCard.js` sigue siendo `.js` (archivo legado existente), no se crea uno nuevo.

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
- [x] Hooks gigantes no tocados sin permiso (usePallet.ts no tocado)
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta

### Observaciones para Jose

GAP-039 (ts-nocheck en PalletView) y GAP-043 (token-as-parameter) quedan pendientes según lo acordado.

### Estado final de la implementación

Implementado y cerrado en el mismo commit que el código.
