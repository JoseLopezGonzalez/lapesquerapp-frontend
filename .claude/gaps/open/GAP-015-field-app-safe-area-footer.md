# GAP-015 — Field App: botones de footer sin safe-area-inset-bottom

## Metadata

- **Tipo:** Mejora
- **Módulo:** Field (repartidores)
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-06-27
- **Autor:** Jose
- **Origen:** /audit-mobile Phase 4 — findings A5-M1, A6-M2

---

## Contexto y problema

En iPhones con home indicator (iPhone X y posteriores), `env(safe-area-inset-bottom)` añade el espacio necesario para que los botones de footer no queden debajo del home indicator. Sin este padding, los botones de acción principal son difíciles de pulsar en estos dispositivos.

Dos vistas del Field App tienen botones de footer con `pb-4` fijo en lugar de usar `env(safe-area-inset-bottom)`:

1. **`FieldOrderExecutionPage.jsx`** (A5-M1) — botones de navegación del wizard de ejecución de pedido usan `pb-4`
2. **`FieldAutoventaWizard.jsx`** (A6-M2) — botones de navegación del wizard de autoventa usan `pb-4`

Referencia correcta: `MobilePalletView/index.tsx` usa `style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}` en su barra de guardado (aunque usa inline style — ver GAP-022 para limpiarlo).

---

## Solución acordada

Reemplazar `pb-4` en los footers de acción por la clase equivalente con safe area:

```tsx
// Tailwind CSS 4 — con safe-area-inset-bottom
className="... pb-[calc(1rem+env(safe-area-inset-bottom))]"

// O con la variable CSS de MOBILE_SAFE_AREAS si está disponible en el proyecto
```

Verificar si el proyecto tiene definida una clase utilitaria para safe area padding bottom (revisar `MOBILE_SAFE_AREAS` en `skills/mobile-ui/SKILL.md` y el código de `BottomNav`).

---

## UI Brief

- **Vista de referencia:** `src/components/Admin/Layout/BottomNav/index.jsx` — usa `MOBILE_SAFE_AREAS.BOTTOM` para el padding inferior
- **Tipo de layout:** Sin cambio de layout — solo cambio de padding en el footer existente
- **Componentes clave:** Sin componentes nuevos — cambio de clases Tailwind
- **Estados requeridos:** Sin cambio en estados
- **Mobile:** aplica ahora — específico para iPhone X+

---

## Referencias

- `BottomNav/index.jsx` — uso de `MOBILE_SAFE_AREAS.BOTTOM`
- `MobilePalletView/index.tsx` — `env(safe-area-inset-bottom)` en inline style (patrón a mejorar en GAP-022)
- `.claude/skills/mobile-ui/SKILL.md` — sección `MOBILE_SAFE_AREAS`

---

## Criterios de aceptación

- [ ] `FieldOrderExecutionPage.jsx` — el footer de botones usa padding bottom con `env(safe-area-inset-bottom)` en lugar de `pb-4` fijo
- [ ] `FieldAutoventaWizard.jsx` — el footer de botones usa padding bottom con `env(safe-area-inset-bottom)` en lugar de `pb-4` fijo
- [ ] Los botones no quedan ocultos bajo el home indicator en iPhone X+ (mínimo: el padding total del footer es al menos `1rem + env(safe-area-inset-bottom)`)
- [ ] En dispositivos sin home indicator (Android, iPhone SE) el comportamiento es idéntico al actual (el safe-area-inset-bottom es 0 en estos dispositivos)

---

## Archivos a crear o modificar

- `src/components/Field/FieldOrderExecutionPage.jsx` — actualizar padding del footer de botones
- `src/components/Field/FieldAutoventaWizard.jsx` — actualizar padding del footer de botones

---

## Restricciones

- NO tocar la estructura del footer ni los botones — solo el padding inferior
- NO tocar `MobilePalletView/index.tsx` — se trata en GAP-022

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Field/FieldOrderExecutionPage.jsx` — `pb-4` → `pb-[calc(1rem+env(safe-area-inset-bottom))]` en el footer de botones de acción
- `src/components/Field/FieldAutoventaWizard.jsx` — `pb-4` → `pb-[calc(1rem+env(safe-area-inset-bottom))]` en el footer de botones de navegación

### Decisiones tomadas durante la implementación

Se usó la clase Tailwind arbitraria `pb-[calc(1rem+env(safe-area-inset-bottom))]` directamente (equivalente a `pb-4` + safe area), sin crear variable CSS adicional. Patrón consistente con `FieldRoutesListPage.jsx` y `FieldOrdersPage.jsx` que ya usan `pb-[calc(5rem+env(safe-area-inset-bottom))]` en sus scroll areas.

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
