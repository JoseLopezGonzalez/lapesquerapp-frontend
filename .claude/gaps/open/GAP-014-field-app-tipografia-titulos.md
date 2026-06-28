# GAP-014 — Field App: tipografía de títulos fuera de la escala del sistema

## Metadata

- **Tipo:** Mejora
- **Módulo:** Field (repartidores)
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-06-27
- **Autor:** Jose
- **Origen:** /audit-mobile Phase 4 — findings A2-I1, A4-I2

---

## Contexto y problema

La escala tipográfica del sistema establece `text-xl font-medium` como máximo para títulos de página en vistas operativas. Dos vistas del Field App usan `text-2xl font-semibold` para sus títulos de lista, que excede esta escala y produce inconsistencia visual respecto al resto de vistas mobile (Admin, Stores, etc.).

Archivos afectados:

1. **`FieldRoutesListPage.jsx`** (A2-I1) — título de página usa `text-2xl font-semibold`
2. **`FieldOrdersPage.jsx`** (A4-I2) — título de página usa `text-2xl font-semibold`

**Excepción deliberada confirmada:** El saludo en `FieldDashboard.jsx` usa `text-3xl font-light` de forma intencional — es la pantalla de bienvenida, no una pantalla operativa. No se toca.

---

## Solución acordada

Cambiar los títulos afectados a `text-xl font-medium` para alinearse con la escala del sistema.

Si el título es parte de un header con subtítulo, el subtítulo debe usar `text-sm text-muted-foreground`.

---

## UI Brief

- **Vista de referencia:** `src/components/Admin/Stores/Mobile/MobileStoreListView.tsx` — header con `text-xl font-normal` (título "Almacenes")
- **Tipo de layout:** Sin cambio de layout — solo cambio de clase CSS en el título
- **Componentes clave:** Sin componentes nuevos — cambio de clases Tailwind
- **Estados requeridos:** Sin cambio en estados
- **Mobile:** aplica ahora

---

## Referencias

- `MobileStoreListView.tsx` línea 247 — `text-xl font-normal` en título "Almacenes"
- `design-context.md` — sección "Typography Scale": `text-xl font-medium` como máximo para títulos operativos

---

## Criterios de aceptación

- [ ] `FieldRoutesListPage.jsx` usa `text-xl font-medium` (o `font-normal`) para el título de la vista
- [ ] `FieldOrdersPage.jsx` usa `text-xl font-medium` (o `font-normal`) para el título de la vista
- [ ] `FieldDashboard.jsx` no se toca — el `text-3xl` del saludo es intencional
- [ ] El tamaño de los títulos es visualmente consistente con los títulos de otras vistas mobile del sistema

---

## Archivos a crear o modificar

- `src/components/Field/FieldRoutesListPage.jsx` — cambiar clase del título
- `src/components/Field/FieldOrdersPage.jsx` — cambiar clase del título

---

## Restricciones

- NO tocar `FieldDashboard.jsx` — el `text-3xl` del saludo es diseño deliberado confirmado
- Solo cambiar las clases del título de página — sin otros cambios de layout

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Field/FieldRoutesListPage.jsx` — `text-2xl font-semibold` → `text-xl font-medium` en `<h1>Mis rutas</h1>`
- `src/components/Field/FieldOrdersPage.jsx` — `text-2xl font-semibold` → `text-xl font-medium` en `<h1>Pedidos operativos</h1>`

### Decisiones tomadas durante la implementación

`FieldDashboard.jsx` no tocado — el `text-3xl font-light` del saludo es intencional (confirmado Q2 respuesta a).

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
