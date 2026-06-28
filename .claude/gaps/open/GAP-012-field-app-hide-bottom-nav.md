# GAP-012 — Field App: `useHideBottomNav(true)` faltante en vistas de detalle

## Metadata

- **Tipo:** Bug
- **Módulo:** Field (repartidores)
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-06-27
- **Autor:** Jose
- **Origen:** /audit-mobile Phase 4 — findings A3-I2, A5-I1, A6-I1

---

## Contexto y problema

`useHideBottomNav(true)` oculta el BottomNav cuando se entra en una vista de detalle o ejecución. En estas vistas, el BottomNav ocupa espacio innecesario y puede interferir visualmente con los controles de la pantalla (mapas, botones de acción, wizards).

La referencia de uso correcto es `CreateOrderFormMobile.jsx`, que llama `useHideBottomNav(true)` en el wizard de creación de pedido.

Tres vistas de ejecución del Field App no llaman a este hook:

1. **`FieldRouteExecutionPage.jsx`** — vista de mapa con ejecución de paradas. El BottomNav se superpone al panel inferior del mapa.
2. **`FieldOrderExecutionPage.jsx`** — wizard de 6 pasos de ejecución de pedido.
3. **`FieldAutoventaWizard.jsx`** — wizard de 6 pasos de autoventa.

---

## Solución acordada

Añadir `useHideBottomNav(true)` al inicio de cada uno de los tres componentes afectados.

```tsx
// Al inicio del componente, junto a los otros hooks
useHideBottomNav(true);
```

El hook ya existe en `@/hooks/useHideBottomNav` (o similar — verificar path exacto en el proyecto).

---

## UI Brief

- **Vista de referencia:** `src/components/Admin/OrdersManager/CreateOrderForm/CreateOrderFormMobile.jsx` — uso correcto de `useHideBottomNav(true)`
- **Tipo de layout:** Sin cambio de layout — solo comportamiento del BottomNav
- **Componentes clave:** hook `useHideBottomNav` (ya existe)
- **Estados requeridos:** Sin cambio en estados UI
- **Mobile:** aplica ahora — todas son vistas mobile de ejecución

---

## Referencias

- `CreateOrderFormMobile.jsx` — referencia de uso correcto
- `.claude/skills/mobile-ui/SKILL.md` — sección "useHideBottomNav": requerido en todas las vistas de detalle/ejecución

---

## Criterios de aceptación

- [ ] `FieldRouteExecutionPage.jsx` llama `useHideBottomNav(true)` — el BottomNav desaparece al entrar en la vista de ejecución de ruta
- [ ] `FieldOrderExecutionPage.jsx` llama `useHideBottomNav(true)` — el BottomNav desaparece durante el wizard de ejecución de pedido
- [ ] `FieldAutoventaWizard.jsx` llama `useHideBottomNav(true)` — el BottomNav desaparece durante el wizard de autoventa
- [ ] El BottomNav reaparece al navegar de vuelta (comportamiento inherente del hook — verificar que no se rompa)
- [ ] `CreateOrderFormMobile.jsx` no se toca — ya es correcto

---

## Archivos a crear o modificar

- `src/components/Field/FieldRouteExecutionPage.jsx` — añadir `useHideBottomNav(true)`
- `src/components/Field/FieldOrderExecutionPage.jsx` — añadir `useHideBottomNav(true)`
- `src/components/Field/FieldAutoventaWizard.jsx` — añadir `useHideBottomNav(true)`

---

## Restricciones

- NO tocar la implementación del hook `useHideBottomNav`
- NO tocar otros componentes que ya usan el hook correctamente
- Solo añadir la llamada al hook — sin otros cambios

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Field/FieldRouteExecutionPage.jsx` — añadido `useHideBottomNav(true)` + import desde `@/context/BottomNavContext`
- `src/components/Field/FieldOrderExecutionPage.jsx` — añadido `useHideBottomNav(true)` + import
- `src/components/Field/FieldAutoventaWizard.jsx` — añadido `useHideBottomNav(true)` + import

### Decisiones tomadas durante la implementación

Hook ubicado como primera llamada del componente, antes de cualquier otro hook o lógica.

### Desviaciones del plan

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
