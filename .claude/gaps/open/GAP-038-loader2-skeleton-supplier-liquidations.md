# GAP-038 — Loader2 → Skeleton en SupplierLiquidations

## Metadata

- **Tipo:** Refactor
- **Módulo:** Proveedores
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-30
- **Autor:** Jose

---

## Contexto y problema

Los dos componentes del módulo de Liquidaciones de Proveedores usan `<Loader2 className="animate-spin">` de Lucide como spinner de carga primaria de datos. Según el design system (`design-context.md` §4):

- `Loader2` solo es válido como **processing overlay** sobre contenido ya cargado (ej.: botón de submit en mutación, overlay de procesamiento encima de una tabla).
- Para carga primaria de datos del servidor → `<Skeleton>`.

**Archivos afectados:**

| Archivo | Líneas | Contexto |
|---|---|---|
| `SupplierLiquidationList.tsx` | 164–168 | `isLoading` de `useSuppliersWithActivity` — spinner centrado en pantalla |
| `SupplierLiquidationShowDetail.tsx` | 151–156 | Carga de detalle de liquidación — spinner centrado en pantalla |

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
