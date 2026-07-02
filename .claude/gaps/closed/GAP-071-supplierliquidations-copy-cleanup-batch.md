# GAP-071 — Batch: quitar ':' final en label y unificar comillas en SupplierLiquidations

## Metadata

- **Tipo:** Mejora
- **Módulo:** Proveedores
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Batch de 2 findings de baja severidad detectados en `/audit-design copy` (prueba
real sobre el módulo SupplierLiquidations, 2026-07-01) — ninguno rompe
funcionalidad, ambos son deriva de copy dentro del mismo módulo.

### FND-A — Dos puntos final inconsistente en labels de formulario

`SupplierLiquidationPdfDialog.tsx:59`:
```tsx
<label className="text-sm font-medium">Método de pago cebo:</label>
```
lleva `:` final, mientras que el resto de labels del mismo diálogo y del módulo no:
- `SupplierLiquidationList.tsx:120` → "Rango de fechas" (sin `:`)
- `SupplierLiquidationPdfDialog.tsx:88` → "Lleva gasto de gestión" (sin `:`)

### FND-B — Comillas como entities HTML en vez de comillas rectas

`SupplierLiquidationList.tsx:250`:
```tsx
Seleccione un rango de fechas o active &ldquo;Solo no liquidadas&rdquo; para comenzar
```
usa `&ldquo;`/`&rdquo;` (entities HTML), mientras que el mensaje de error del mismo
archivo, línea 84, usa comillas rectas para el mismo término:
```tsx
description: 'Seleccione un rango de fechas o active "Solo no liquidadas".',
```
Las entities son más frágiles si el texto se reutiliza fuera de JSX (p. ej. en un
`notify.error`) y crean una inconsistencia visual mínima con el resto del texto.

## Solución acordada

- FND-A: quitar el `:` final → `"Método de pago cebo"`
- FND-B: sustituir `&ldquo;Solo no liquidadas&rdquo;` por comillas rectas
  `"Solo no liquidadas"`, igualando el patrón ya usado en la línea 84 del mismo archivo

## Criterios de aceptación

- [ ] `SupplierLiquidationPdfDialog.tsx:59` — label sin `:` final
- [ ] `SupplierLiquidationList.tsx:250` — comillas rectas en vez de entities HTML
- [ ] Sin cambios de comportamiento ni de estructura, solo texto

## Archivos a crear o modificar

- `src/components/Admin/SupplierLiquidations/SupplierLiquidationPdfDialog.tsx` (modificar)
- `src/components/Admin/SupplierLiquidations/SupplierLiquidationList.tsx` (modificar)

## Restricciones

- No tocar ningún otro texto de estos archivos fuera de los dos puntos exactos citados
- No extender a otros módulos — este batch es solo de SupplierLiquidations

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/SupplierLiquidations/SupplierLiquidationPdfDialog.tsx` — FND-A: quitado `:` final del label "Método de pago cebo"

### Decisiones tomadas durante la implementación

- FND-B ya estaba resuelto: GAP-069 (implementado y cerrado en esta misma sesión, justo
  antes de este GAP) migró el estado vacío de `SupplierLiquidationList.tsx:250` a
  `EmptyState`, y de paso sustituyó `&ldquo;Solo no liquidadas&rdquo;` por comillas
  españolas `«Solo no liquidadas»` en la nueva descripción — el propio GAP-069 documenta
  la nota "ver GAP-071 para el resto de limpieza de comillas/puntuación del módulo, no
  repetir ese fix aquí". Verificado con grep que no queda ninguna entity HTML `&ldquo;`/
  `&rdquo;` en el módulo. No se tocó ese archivo de nuevo para FND-B.

### Desviaciones del plan (si las hay)

- FND-B no requirió cambio de código en este GAP — ya cubierto por GAP-069 (con comillas
  «» en vez de comillas rectas `"..."`, pero cumpliendo el mismo objetivo: eliminar las
  entities HTML frágiles). Criterio de aceptación de FND-B verificado como cumplido por
  herencia, no por un cambio nuevo en este commit.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10 — FND-A exacto según lo acordado; FND-B verificado como ya resuelto por GAP-069 sin necesidad de duplicar el cambio

### Checklist

- [x] Criterios de aceptación cumplidos — `SupplierLiquidationPdfDialog.tsx:59` sin `:` final; `SupplierLiquidationList.tsx` sin entities HTML (resuelto vía GAP-069)
- [x] Patrones de .claude/rules/ respetados

### Observaciones para Jose

FND-B se solapaba con el cambio ya hecho en GAP-069 en la misma sesión (ambos tocaban el
mismo estado vacío). Se verificó con grep que el resultado final cumple el criterio de
aceptación (sin entities HTML) aunque el texto final use comillas españolas «» en vez de
comillas rectas — mismo objetivo, sin duplicar trabajo. No bloquea el cierre.

### Estado final de la implementación

El label "Método de pago cebo" ya no lleva `:` final, consistente con el resto de labels
del módulo. El módulo SupplierLiquidations no tiene ninguna entity HTML de comillas
residual.
