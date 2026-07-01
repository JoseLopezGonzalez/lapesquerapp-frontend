# GAP-069 — Usar el componente EmptyState en los dos estados vacíos de SupplierLiquidationList

## Metadata

- **Tipo:** Mejora
- **Módulo:** Proveedores
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Detectado en `/audit-design copy` (prueba real sobre el módulo SupplierLiquidations,
2026-07-01). `src/components/Admin/SupplierLiquidations/SupplierLiquidationList.tsx`
implementa dos estados "sin contenido" a mano con `<div>` suelto, en vez de usar
`EmptyState` (`@/components/Utilities/EmptyState`), que ya es el patrón estándar
documentado en `.claude/design-context.md` § Empty States y usado en el resto de la
app (`MobileStoreListView`, `PalletView`, `OrderAuxiliaryLines`, `OrderAttachments`,
`DispatchesListCard`, etc.).

Consecuencia: ambos estados quedan visualmente más pobres que el resto de la app (sin
el icono en círculo del patrón estándar) y uno de los dos ni siquiera sigue la
estructura título+descripción — es una única frase suelta.

**Estado A — "sin resultados tras buscar"** (líneas 177-187):
```tsx
{suppliers.length === 0 ? (
  <div className="text-muted-foreground flex h-full items-center justify-center py-12 text-center">
    <div>
      <p className="mb-2 text-lg font-medium">No se encontraron proveedores con actividad</p>
      <p className="text-sm">No hay recepciones ni salidas de cebo en el rango de fechas seleccionado.</p>
    </div>
  </div>
) : ( ... )}
```

**Estado B — "antes de buscar"** (líneas 247-253):
```tsx
{!isLoading && !error && !applied && (
  <div className="text-muted-foreground flex h-full items-center justify-center py-12 text-center">
    <p className="text-sm">
      Seleccione un rango de fechas o active &ldquo;Solo no liquidadas&rdquo; para comenzar
    </p>
  </div>
)}
```

## Solución acordada

Sustituir ambos bloques por `<EmptyState>` (`import { EmptyState } from
'@/components/Utilities/EmptyState';`), con icono en los dos casos.

**Estado A** — sin cambios de copy, solo migrar al componente:
- `title`: "No se encontraron proveedores con actividad"
- `description`: "No hay recepciones ni salidas de cebo en el rango de fechas seleccionado."
- `icon`: un icono de "sin resultados" (p. ej. `SearchX` de `lucide-react`, coherente
  con el `Search` que ya usa el botón "Buscar" del propio componente)

**Estado B** — dividir la frase única en título accionable + detalle (acordado con Jose):
- `title`: "Selecciona un rango de fechas"
- `description`: "O activa «Solo no liquidadas» para ver proveedores pendientes."
- `icon`: `Search` de `lucide-react` (coherente con el estado "antes de buscar")

Nota de copy: la descripción usa comillas españolas «» en vez de las entities HTML
`&ldquo;`/`&rdquo;` del texto original — ver GAP-071 para el resto de limpieza de
comillas/puntuación del módulo, no repetir ese fix aquí.

## Referencias e inspiración

- Patrón EmptyState: `src/components/Utilities/EmptyState/index.d.ts` (`title`,
  `description` obligatorios; `icon?: ReactNode`, `button?`, `className?`)
- Referencia de uso real: `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx`
- `.claude/design-context.md` § Empty States (icono + título + descripción)

## Criterios de aceptación

- [ ] Estado A usa `<EmptyState>` con el copy exacto indicado arriba y un icono de tipo "sin resultados"
- [ ] Estado B usa `<EmptyState>` con título+descripción separados (copy exacto indicado arriba) e icono `Search`
- [ ] No queda ningún `<div>` de empty state construido a mano en este archivo
- [ ] Sin cambios de comportamiento — las condiciones que muestran cada estado no se tocan

## Archivos a crear o modificar

- `src/components/Admin/SupplierLiquidations/SupplierLiquidationList.tsx` (modificar)

## Restricciones

- No tocar la lógica de búsqueda, filtros, ni las llamadas a `useSuppliersWithActivity`
- No extender este cambio a `SupplierLiquidationsCrudList.tsx` ni a otros componentes
  del módulo — fuera de scope de este GAP
- Archivo tiene `// @ts-nocheck` en cabecera — no forma parte de este GAP quitarlo

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
