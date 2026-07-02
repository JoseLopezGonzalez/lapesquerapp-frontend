# GAP-108 — Usar EmptyState canónico en SupplierLiquidationsCrudList

## Metadata

- **Tipo:** Refactor
- **Módulo:** Proveedores
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-02
- **Autor:** Jose (vía /audit-design consistency — familia `estados-vacios`)

---

## Contexto y problema

`/audit-design consistency` verificó 9 vistas de la familia `estados-vacios`: 8 de 8
más el componente de referencia (`EntityBody`) usan correctamente el componente
canónico `EmptyState` de `@/components/Utilities/EmptyState` (patrón: icono → título →
descripción, documentado en `design-context.md` § Empty States).

`src/components/Admin/SupplierLiquidations/SupplierLiquidationsCrudList.tsx`
(líneas ~282-289) es el único outlier: renderiza el estado vacío como un `<div>` manual
con solo un `<p>` en negrita como título y otro `<p>` como descripción, sin icono y sin
usar el componente compartido.

```tsx
<div className="text-muted-foreground flex h-full items-center justify-center p-6 text-center">
  <div>
    <p className="mb-1 font-medium">No hay liquidaciones cerradas</p>
    <p className="text-sm">
      {hasActiveFilters ? 'Prueba a ajustar los filtros.' : 'Aún no se ha cerrado ninguna liquidación.'}
    </p>
  </div>
</div>
```

## Solución acordada

Reemplazar el `<div>` manual por el componente `EmptyState`, manteniendo el mismo
texto condicional según `hasActiveFilters` ya existente.

## UI Brief

- **Vista de referencia:** `src/components/Admin/Entity/EntityClient/EntityTable/EntityBody/index.js`
  — uso canónico de `EmptyState` dentro de un contenedor de tabla
- **Tipo de layout:** inline, dentro del mismo contenedor donde ya vive el estado vacío
  actual (no cambia la estructura del componente, solo el contenido de esa rama)
- **Componentes clave:** `EmptyState` de `@/components/Utilities/EmptyState`
- **Estados requeridos:** solo el estado vacío (loading/error del componente no se tocan)
- **Mobile:** aplica ahora — mismo componente responsive ya usado en el resto de la app

### Preguntas de confirmación para Jose

Ya respondida en la ronda de clarificación previa: confirmado sin necesidad de revisar
icono/copy por adelantado — el implementador elige un icono coherente con el contexto
(liquidaciones/documentos) del set ya usado en la app (Lucide).

## Criterios de aceptación

- [ ] Import de `EmptyState` desde `@/components/Utilities/EmptyState`
- [ ] El `<div>` manual (líneas ~282-289) se reemplaza por `<EmptyState title=... description=... />`
      (o el compound `Empty`/`EmptyHeader`/`EmptyMedia`/`EmptyTitle`/`EmptyDescription`
      si el componente `EmptyState` no soporta icono directamente — verificar la firma
      real antes de implementar)
- [ ] El texto condicional según `hasActiveFilters` se mantiene igual
- [ ] Icono coherente con el contexto (p.ej. `PackageOpen`, `FileX` o similar ya usado
      en otras vistas de la app)
- [ ] `npm run type-check` limpio

## Archivos a crear o modificar

- `src/components/Admin/SupplierLiquidations/SupplierLiquidationsCrudList.tsx`

## Restricciones

- No tocar el resto del componente (filtros, tabla, paginación, lógica de reapertura)
- No modificar el mensaje de negocio, solo la presentación visual

---

## Implementación

Implementado por Codex el 2026-07-02.

### Archivos creados

- Ninguno.

### Archivos modificados

- `src/components/Admin/SupplierLiquidations/SupplierLiquidationsCrudList.tsx`
- `.claude/gaps/in-progress/GAP-108-supplier-liquidations-emptystate.md`

### Decisiones tomadas durante la implementación

- Se reemplazó el estado vacío manual por `EmptyState`.
- Se mantuvo exactamente el copy condicional existente según `hasActiveFilters`.
- Se usó `FileX` de `lucide-react` como icono coherente con liquidaciones/documentos ausentes.
- Se ejecutaron `npx eslint src/components/Admin/SupplierLiquidations/SupplierLiquidationsCrudList.tsx` y `npm run type-check`.

### Desviaciones del plan (si las hay)

- No hubo desviaciones.
- El archivo conserva su `@ts-nocheck` preexistente; no se añadió ni modificó.

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
