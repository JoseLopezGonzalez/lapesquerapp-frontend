# GAP-020 — MobileStoreListView: estados vacíos sin componente `EmptyState`

## Metadata

- **Tipo:** Mejora
- **Módulo:** Stock / Almacén
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-06-27
- **Autor:** Jose
- **Origen:** /audit-mobile Phase 4 — finding B1-I2

---

## Contexto y problema

`MobileStoreListView.tsx` tiene dos estados vacíos implementados con `<p>` simples:

```tsx
// Estado: sin almacenes
<div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
  <p className="text-sm font-medium">Sin almacenes</p>
  <p className="text-muted-foreground text-xs">No hay almacenes disponibles.</p>
</div>

// Estado: sin resultados de búsqueda
<div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
  <p className="text-sm font-medium">Sin resultados</p>
  <p className="text-muted-foreground text-xs">...</p>
</div>
```

El proyecto tiene un componente `EmptyState` en `src/components/Utilities/EmptyState/` que acepta `title`, `description`, `icon` (opcional, default `Package`) y `button`. Usar `EmptyState` produce consistencia visual en todos los estados vacíos del sistema.

---

## Solución acordada

Reemplazar los dos bloques de texto plano por el componente `EmptyState`:

```tsx
// Sin almacenes
<EmptyState
  title="Sin almacenes"
  description="No hay almacenes disponibles."
  icon={Warehouse}
/>

// Sin resultados de búsqueda
<EmptyState
  title="Sin resultados"
  description={search.trim()
    ? `No hay almacenes que coincidan con «${search}».`
    : 'No hay almacenes con este estado.'}
  icon={Search}
/>
```

Los iconos `Warehouse` y `Search` ya están importados en el archivo.

---

## UI Brief

- **Vista de referencia:** `src/components/Utilities/EmptyState/index.js` — API: `title`, `description`, `icon?`, `button?`
- **Tipo de layout:** Inline — reemplaza los `div` de texto plano en el mismo lugar del JSX
- **Componentes clave:** `EmptyState` de `@/components/Utilities/EmptyState`
- **Estados requeridos:** empty (EmptyState) — el resto de estados no se tocan
- **Mobile:** aplica ahora

---

## Referencias

- `src/components/Utilities/EmptyState/index.js` — implementación del componente
- `design-context.md` — sección "Empty States": usar `EmptyState` para consistencia

---

## Criterios de aceptación

- [ ] El estado "sin almacenes" (lista vacía) usa `EmptyState` con `title`, `description` y un icono apropiado (`Warehouse`)
- [ ] El estado "sin resultados" (búsqueda o filtro sin coincidencias) usa `EmptyState` con el texto dinámico correcto y un icono apropiado (`Search`)
- [ ] No quedan `<div>` con `<p>` de texto plano para comunicar estados vacíos en `MobileStoreListView.tsx`
- [ ] Los textos de `title` y `description` son idénticos a los actuales — no cambiar el copy
- [ ] `EmptyState` se importa desde `@/components/Utilities/EmptyState`

---

## Archivos a crear o modificar

- `src/components/Admin/Stores/Mobile/MobileStoreListView.tsx` — reemplazar los dos estados vacíos por `EmptyState`

---

## Restricciones

- NO cambiar los textos de los estados vacíos
- NO tocar el resto de la vista (lista, tabs, búsqueda, IntersectionObserver)
- Solo afectar los dos bloques de empty state

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/Stores/Mobile/MobileStoreListView.tsx` — añadido import de `EmptyState`; reemplazados los dos bloques de texto plano (`<div>...<p>...<p>`) por `<EmptyState>` con `icon`, `title` y `description`. Iconos: `Warehouse` (sin almacenes) y `Search` (sin resultados). Ambos ya importados de lucide-react.

### Decisiones tomadas durante la implementación

Se envolvió cada `EmptyState` en `<div className="flex flex-1 items-center justify-center">` para mantener el centrado vertical, siguiendo el patrón de uso en `FieldOrdersPage.jsx` y `FieldRoutesListPage.jsx`.

### Desviaciones del plan (si las hay)

Ninguna.

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
