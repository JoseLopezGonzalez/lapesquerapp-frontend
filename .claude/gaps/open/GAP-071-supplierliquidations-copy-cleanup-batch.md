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
- [ ] Patrones de .claude/rules/ respetados

### Observaciones para Jose

### Estado final de la implementación
