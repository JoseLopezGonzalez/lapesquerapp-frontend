# GAP-013 — Field App: status badges con patrón incorrecto

## Metadata

- **Tipo:** Mejora
- **Módulo:** Field (repartidores)
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-06-27
- **Autor:** Jose
- **Origen:** /audit-mobile Phase 4 — findings A2-I2, A3-I1

---

## Contexto y problema

El patrón de badge de estado primario en PesquerApp mobile usa un `span` inline con dot indicator y colores semánticos específicos:

```tsx
<span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-orange-500/15 text-orange-700 dark:text-orange-300">
  <span className="h-1.5 w-1.5 rounded-full bg-current" />
  Pendiente
</span>
```

El patrón incorrecto `<Badge variant="secondary">` aplica un estilo genérico gris que no comunica el estado semánticamente al usuario (no hay diferencia visual entre estados).

Vistas afectadas:

1. **`FieldRoutesListPage.jsx`** (A2-I2) — usa `<Badge variant="secondary">` para el estado de la ruta (activa, completada, etc.)
2. **`FieldRouteExecutionPage.jsx`** (A3-I1) — usa `<Badge variant="secondary">` para el estado de las paradas o la ruta en ejecución

Referencia de implementación correcta: `FieldOrdersPage.jsx` → `FieldOrderCard` ya usa el patrón inline correcto con dot indicator en la rama mobile (líneas 155–173 aproximadas).

---

## Solución acordada

Reemplazar `<Badge variant="secondary">` por el patrón inline con dot indicator, usando los colores semánticos definidos en `design-context.md`:

| Estado | Colores |
|---|---|
| Pendiente / En curso | `bg-orange-500/15 text-orange-700 dark:text-orange-300` |
| Completado / Finalizado | `bg-green-500/15 text-green-700 dark:text-green-300` |
| Cancelado / Error | `bg-red-500/15 text-red-700 dark:text-red-300` |
| Neutral / Desconocido | `bg-muted text-muted-foreground` |

Verificar qué estados tienen cada entidad (ruta, parada) para asignar el color correcto a cada uno.

---

## UI Brief

- **Vista de referencia:** `src/components/Field/FieldOrdersPage.jsx` → `FieldOrderCard` (rama mobile) — usa el patrón inline correcto
- **Tipo de layout:** Inline dentro de las tarjetas de ruta — sin cambio de layout
- **Componentes clave:** `span` inline (no shadcn Badge) con clases Tailwind semánticas
- **Estados requeridos:** Sin cambio en estados de la vista — solo el estilo del badge
- **Mobile:** aplica ahora

---

## Referencias

- `FieldOrderCard` en `FieldOrdersPage.jsx` — referencia de patrón correcto
- `design-context.md` — sección "Status Badges": colores semánticos por estado
- `.claude/project-learnings.md` — PL-006: nunca usar `Badge variant="secondary"` para estado primario

---

## Criterios de aceptación

- [ ] `FieldRoutesListPage.jsx` no usa `<Badge variant="secondary">` para estados de ruta
- [ ] Los estados de ruta en `FieldRoutesListPage.jsx` usan el patrón inline con dot indicator y colores semánticos
- [ ] `FieldRouteExecutionPage.jsx` no usa `<Badge variant="secondary">` para estados
- [ ] Los estados en `FieldRouteExecutionPage.jsx` usan el patrón inline con dot indicator y colores semánticos
- [ ] Los colores de estado son correctos: completado=verde, en curso=naranja, cancelado=rojo
- [ ] `FieldOrderCard` no se toca — ya es correcto
- [ ] No quedan `<Badge variant="secondary">` para comunicar estado primario de entidad en vistas mobile del Field App

---

## Archivos a crear o modificar

- `src/components/Field/FieldRoutesListPage.jsx` — reemplazar Badge por patrón inline
- `src/components/Field/FieldRouteExecutionPage.jsx` — reemplazar Badge por patrón inline

---

## Restricciones

- NO cambiar `Badge variant="outline"` u otras variantes de Badge que se usen para propósitos no-estado (etiquetas, categorías)
- NO tocar `FieldOrderCard` — ya está correcto
- Verificar con el equipo qué estados devuelve la API para rutas y paradas antes de asignar colores

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
