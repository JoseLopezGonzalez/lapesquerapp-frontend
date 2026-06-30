# GAP-038 — Loader2 → Skeleton en SupplierLiquidations

## Metadata

- **Tipo:** Refactor
- **Módulo:** Proveedores
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-06-30
- **Autor:** Jose

---

## Contexto y problema

Los dos componentes del módulo de Liquidaciones de Proveedores usan `<Loader2 className="animate-spin">` de Lucide como spinner de carga primaria de datos. Según el design system (`design-context.md` §4):

- `Loader2` solo es válido como **processing overlay** sobre contenido ya cargado (ej.: botón de submit en mutación, overlay de procesamiento encima de una tabla).
- Para carga primaria de datos del servidor → `<Skeleton>`.

**Archivos afectados:**

| Archivo                             | Líneas  | Contexto                                                                 |
| ----------------------------------- | ------- | ------------------------------------------------------------------------ |
| `SupplierLiquidationList.tsx`       | 164–168 | `isLoading` de `useSuppliersWithActivity` — spinner centrado en pantalla |
| `SupplierLiquidationShowDetail.tsx` | 151–156 | Carga de detalle de liquidación — spinner centrado en pantalla           |

---

## Solución acordada

1. **SupplierLiquidationList**: Reemplazar el `<Loader2>` spinner por Skeleton de tabla (cabecera + N filas) que se muestre donde ahora aparece el spinner.
2. **SupplierLiquidationShowDetail**: Reemplazar el `<Loader2>` spinner por Skeleton de vista de detalle de liquidación (secciones con datos de proveedor, recepciones, salidas).

## UI Brief

- **Vista de referencia:** `SupplierLiquidationList.tsx` (tabla con 8 columnas) y `SupplierLiquidationShowDetail.tsx` — los Skeletons deben replicar la silueta de estas vistas
- **Tipo de layout:** Skeleton dentro del `flex-1 overflow-hidden` que ya existe en cada componente
- **Componentes clave:** `<Skeleton>` de `@/components/ui/skeleton`
- **Estados requeridos:** loading (Skeleton de tabla / Skeleton de detalle) / loaded (contenido real) / error (ya existe)
- **Mobile:** no aplica — vistas de admin desktop

---

## Criterios de aceptación

- [ ] `SupplierLiquidationList.tsx` no usa `<Loader2>` como spinner de carga de datos principal
- [ ] `SupplierLiquidationShowDetail.tsx` no usa `<Loader2>` como spinner de carga de datos principal
- [ ] El estado de carga muestra Skeleton en el área donde aparecerían los datos
- [ ] Los Skeletons reproducen la silueta de la tabla / vista de detalle correspondiente
- [ ] El uso de `<Loader2>` dentro de botones de acción (si los hay) se mantiene — ese es un uso válido
- [ ] TypeScript compila sin errores en los archivos modificados

## Archivos a crear o modificar

- `src/components/Admin/SupplierLiquidations/SupplierLiquidationList.tsx`
- `src/components/Admin/SupplierLiquidations/SupplierLiquidationShowDetail.tsx`

## Restricciones

- No modificar la lógica de filtros ni las queries de datos
- No cambiar la estructura del layout (flex columnas, overflow)
- No tocar hooks ni services de proveedores

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/SupplierLiquidations/SupplierLiquidationList.tsx` — añadido import `Skeleton`; bloque `isLoading && <Loader2 spinner>` → Skeleton de tabla con cabecera (8 celdas en grid) + 8 filas. Los usos de `Loader2` dentro de botones de acción no se tocan.
- `src/components/Admin/SupplierLiquidations/SupplierLiquidationShowDetail.tsx` — añadido import `Skeleton`; early return `if (isLoading) <Loader2 spinner>` → Skeleton de vista de detalle con header + grid 6 secciones + 5 filas de datos. Los usos de `Loader2` en botones de descarga y acciones inline no se tocan.

### Decisiones tomadas durante la implementación

- Ambos archivos tienen `// @ts-nocheck` (cubierto por otro GAP); no se elimina aquí.
- Los usos de `Loader2` dentro de botones (`disabled={downloadingPdf}`, overlay inline) son usos válidos de processing overlay según el design system — se preservan.

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

Los usos de `Loader2` dentro de botones de descarga/acción se mantienen — son overlays de procesamiento válidos, no carga primaria de datos.

### Estado final de la implementación

Implementado y cerrado en el mismo commit que el código.
