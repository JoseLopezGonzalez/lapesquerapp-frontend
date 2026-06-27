# GAP-016 — Field App: `useIsMobile` en condicional de render → `useIsMobileSafe`

## Metadata

- **Tipo:** Bug
- **Módulo:** Field (repartidores)
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-06-27
- **Autor:** Jose
- **Origen:** /audit-mobile Phase 4 — finding A4-I1

---

## Contexto y problema

El proyecto define dos hooks de detección mobile:

- **`useIsMobile`** — devuelve `false` en SSR (server), `true/false` en cliente. **Solo para lógica que no afecte al render.**
- **`useIsMobileSafe`** — devuelve `null` en SSR, después hidrata correctamente. **Obligatorio cuando el resultado condiciona qué JSX se renderiza**, porque evita el hydration mismatch entre server y cliente.

En `FieldOrdersPage.jsx`, la sub-componente `FieldOrderCard` usa `useIsMobile()` en un condicional de render (`if (isMobile) return <MobileCard>; else return <DesktopCard>;`). Esto puede causar hydration mismatch: el servidor renderiza la versión "no mobile" y el cliente renderiza la versión "mobile" en el primer render, produciendo un flash o warning de React.

---

## Solución acordada

Reemplazar `useIsMobile()` por `useIsMobileSafe()` en `FieldOrderCard` (o donde se use en `FieldOrdersPage.jsx`) y añadir el manejo del estado `null`:

```tsx
const isMobile = useIsMobileSafe(); // null durante SSR

// En el render:
if (isMobile === null) return <SkeletonCard />; // o el estado "no montado" preferido
if (isMobile) return <MobileCard />;
return <DesktopCard />;
```

Si `FieldOrderCard` es un componente exclusivamente mobile (por su ubicación y uso), la alternativa más limpia es eliminar el condicional y renderizar siempre la variante mobile — verificar con el código.

---

## UI Brief

- **Vista de referencia:** Sin referencia directa — patrón de hook documentado en `skills/mobile-ui/SKILL.md`
- **Tipo de layout:** Sin cambio de layout
- **Componentes clave:** `useIsMobileSafe` (ya existe en el proyecto)
- **Estados requeridos:** Sin cambio en estados visibles
- **Mobile:** aplica ahora

---

## Referencias

- `.claude/skills/mobile-ui/SKILL.md` — sección "Hooks": `useIsMobileSafe` vs `useIsMobile`
- `design-context.md` — regla: usar `useIsMobileSafe` en condicionales de render

---

## Criterios de aceptación

- [ ] `FieldOrdersPage.jsx` / `FieldOrderCard` no usa `useIsMobile()` en condicionales de render JSX
- [ ] Si se usa `useIsMobileSafe()`, el estado `null` tiene un fallback apropiado (Skeleton o render vacío, no crash)
- [ ] No hay hydration mismatch warnings en consola al cargar `FieldOrdersPage`
- [ ] El comportamiento visual del componente en mobile es idéntico al actual

---

## Archivos a crear o modificar

- `src/components/Field/FieldOrdersPage.jsx` — reemplazar `useIsMobile` por `useIsMobileSafe` en `FieldOrderCard`

---

## Restricciones

- NO cambiar la lógica de negocio ni los hooks de datos
- NO refactorizar `FieldOrderCard` más allá del cambio de hook
- Si `FieldOrderCard` es exclusivamente mobile, evaluar eliminar el condicional completamente (la variante más limpia)

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
