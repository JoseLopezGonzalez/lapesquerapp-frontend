# GAP-035 — Loader → Skeleton en PalletView, ProductionView y LoadMoreStoreCard

## Metadata

- **Tipo:** Refactor
- **Módulo:** Stock / Maquiladores / Almacén
- **Prioridad:** Alta
- **Estado:** open
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
