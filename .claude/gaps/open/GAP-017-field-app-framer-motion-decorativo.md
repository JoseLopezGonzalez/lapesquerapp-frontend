# GAP-017 — Field App: animaciones Framer Motion decorativas en wizard operativo

## Metadata

- **Tipo:** Mejora
- **Módulo:** Field (repartidores)
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-06-27
- **Autor:** Jose
- **Origen:** /audit-mobile Phase 4 — finding A6-M1

---

## Contexto y problema

Las reglas del proyecto permiten Framer Motion en vistas operativas únicamente para:
- `whileTap` — feedback táctil inmediato (< 150ms)
- Presets `feedbackPop` — animaciones de confirmación puntuales

Están **prohibidas** en pantallas operativas:
- Animaciones continuas o permanentes (`animate={{ scale: 1.05 }}` en el paso activo del stepper)
- `AnimatePresence` para transiciones de montaje/desmontaje (check mark animado)

En `FieldAutoventaWizard.jsx`, el stepper tiene dos animaciones decorativas prohibidas:

1. **`animate={{ scale: 1.05 }}`** en el paso activo del stepper — el icono del paso activo escala permanentemente, creando un movimiento continuo en pantalla operativa
2. **`AnimatePresence`** en el check mark de paso completado — transición de montaje/desmontaje del icono de completado

**Confirmado por Jose (Q3 respuesta b):** mantener `whileTap` y la transición de width de la barra de progreso (< 300ms, funcional). Eliminar solo el scale permanente y el AnimatePresence del check mark.

---

## Solución acordada

1. **Eliminar `animate={{ scale: 1.05 }}`** del paso activo del stepper → reemplazar por estado visual con clases CSS (`ring-2 ring-primary`, `bg-primary/10`, o similar) sin animación continua.

2. **Eliminar `AnimatePresence` del check mark** → reemplazar por `transition-opacity` o `transition-transform` de Tailwind CSS (sin Framer Motion) para la aparición del icono de completado.

**Mantener:**
- `whileTap={{ scale: 0.96 }}` en los botones — es feedback táctil correcto
- `useReducedMotion` — ya está implementado correctamente, mantenerlo
- Transición de width de la barra de progreso (si usa `motion.div` con `animate={{ width: ... }}` y duración < 300ms) — es funcional y no decorativa

---

## UI Brief

- **Vista de referencia:** `src/components/Admin/Layout/BottomNav/index.jsx` — usa `feedbackPop` y `whileTap` correctamente sin animaciones continuas
- **Tipo de layout:** Sin cambio de layout
- **Componentes clave:** Clases Tailwind `transition-*` para reemplazar las animaciones eliminadas
- **Estados requeridos:** Sin cambio en estados
- **Mobile:** aplica ahora

---

## Referencias

- `BottomNav/index.jsx` — uso correcto de `whileTap` y ausencia de animaciones continuas
- `design-context.md` — sección "Motion": reglas de Framer Motion en pantallas operativas
- Respuesta de Jose Q3: opción b — mantener feedback táctil + width de barra, eliminar decorativas

---

## Criterios de aceptación

- [ ] El paso activo del stepper en `FieldAutoventaWizard.jsx` no tiene `animate={{ scale }}` continuo — el estado activo se comunica solo con estilos CSS (color, ring, fondo)
- [ ] El check mark del paso completado no usa `AnimatePresence` — aparece/desaparece con `transition-opacity` o similar de Tailwind
- [ ] `whileTap` en botones se mantiene intacto
- [ ] `useReducedMotion` se mantiene intacto
- [ ] La barra de progreso (si usa Framer Motion para width) se mantiene si su duración es < 300ms
- [ ] No hay imports de `AnimatePresence` usados únicamente para el check mark (limpiar import si ya no se usa)
- [ ] El stepper visualmente comunica el estado activo y completado de forma clara sin animaciones continuas

---

## Archivos a crear o modificar

- `src/components/Field/FieldAutoventaWizard.jsx` — eliminar `animate={{ scale }}` del paso activo y `AnimatePresence` del check mark

---

## Restricciones

- NO eliminar `whileTap` — es correcto
- NO eliminar `useReducedMotion` — es correcto
- NO tocar la lógica del wizard (pasos, navegación, datos)
- Solo afectar las dos animaciones específicamente identificadas

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Field/FieldAutoventaWizard.jsx` — eliminado `animate={{ scale: isCurrent ? 1.05 : 1 }}` e `initial={false}` del `motion.button`; eliminado `AnimatePresence` y `motion.span` del check mark/número, reemplazados por `<span>` planos; eliminado `AnimatePresence` del import de framer-motion.

### Decisiones tomadas durante la implementación

El check mark y el número del stepper se reemplazan por spans planos sin animación CSS adicional. El estado activo/completado ya se comunica visualmente mediante las clases Tailwind existentes (`bg-primary`, `ring-2`, `bg-primary/20`). Se mantienen `whileTap={{ scale: 0.96 }}` (feedback táctil correcto) y la transición de width de la barra de progreso (`motion.div` con `animate={{ width }}`).

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
