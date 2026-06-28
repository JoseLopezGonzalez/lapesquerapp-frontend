# GAP-021 — Mobile: colores hardcodeados en vistas Admin, Field y Login

## Metadata

- **Tipo:** Mejora
- **Módulo:** Global (Stock, Ventas, Field, Login)
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-06-27
- **Autor:** Jose
- **Origen:** /audit-mobile Phase 4 — findings A1-I1, B1-M1, B2-I1, B3-I1, B3-I2, C2-M2

---

## Contexto y problema

El sistema de diseño usa exclusivamente variables CSS semánticas de Tailwind (`text-muted-foreground`, `bg-muted`, `text-foreground`, etc.). El uso de colores hardcodeados (`text-neutral-500`, `dark:text-white`, `bg-slate-*`, `bg-lime-*`) rompe el soporte de temas (dark mode) y produce inconsistencias visuales.

Archivos y colores afectados:

| Finding | Archivo | Color hardcodeado | Reemplazo |
|---|---|---|---|
| A1-I1 | `FieldDashboard.jsx` | `text-neutral-500` | `text-muted-foreground` |
| B1-M1 | `MobileStoreListView.tsx` | `dark:text-white` | Eliminar — `text-foreground` ya soporta dark |
| B2-I1 | `MobilePalletView/index.tsx` | `border-orange-200 bg-orange-50 text-orange-800 text-orange-600` en Alert de solo lectura | `Alert` con `variant="warning"` si existe, o `border-warning/20 bg-warning/10 text-warning-foreground` |
| B3-I1 | `OrderHeaderMobile.jsx` | `dark:text-white` en título de pedido | Eliminar — `text-foreground` ya soporta dark |
| B3-I2 | `OrderHeaderMobile.jsx` | `bg-slate-200 text-slate-800` en badge de autoventa | `bg-muted text-muted-foreground` |
| C2-M2 | `LoginFormMobile.tsx` | `bg-lime-100 text-lime-800` en badge DEMO | `bg-accent text-accent-foreground` o revisar si hay token de "demo/beta" en `design-context.md` |

---

## Solución acordada

Reemplazar cada ocurrencia por el token semántico equivalente:

### FieldDashboard.jsx
- `text-neutral-500` → `text-muted-foreground`

### MobileStoreListView.tsx
- `dark:text-white` → eliminar el modificador `dark:` (la variable `text-foreground` ya maneja dark mode)

### MobilePalletView/index.tsx (Alert de solo lectura)
```tsx
// Actual
<Alert className="... border-orange-200 bg-orange-50">
  <AlertCircle className="h-4 w-4 text-orange-600" />
  <AlertDescription className="text-sm text-orange-800">...</AlertDescription>
</Alert>

// Propuesto — verificar si Alert tiene variant="warning" en este proyecto
// Si no existe, usar tokens de Tailwind semánticos de warning/accent
// Como fallback seguro: usar la variante default del Alert (borde y fondo muted)
// y ajustar si hay una variante warning disponible
```

### OrderHeaderMobile.jsx (dark:text-white + badge autoventa)
- `dark:text-white` → eliminar modificador
- `bg-slate-200 text-slate-800` en badge autoventa → `bg-muted text-muted-foreground`

### LoginFormMobile.tsx (badge DEMO)
- `bg-lime-100 text-lime-800` → verificar en `design-context.md` si hay un token de beta/demo; si no, usar `bg-accent text-accent-foreground`

---

## UI Brief

- **Vista de referencia:** `src/components/Admin/Stores/Mobile/MobileStoreListView.tsx` — usa correctamente `text-muted-foreground`, `bg-muted`, variables semánticas
- **Tipo de layout:** Sin cambio de layout — solo sustitución de clases CSS
- **Componentes clave:** Sin componentes nuevos — cambios de clases Tailwind
- **Estados requeridos:** Sin cambio en estados
- **Mobile:** aplica ahora

---

## Referencias

- `design-context.md` — paleta de colores semánticos: `--muted-foreground`, `--muted`, `--foreground`, `--accent`, `--warning` (si existe)
- PL-006 en `project-learnings.md` — nunca hardcodear colores, usar variables semánticas

---

## Criterios de aceptación

- [ ] `FieldDashboard.jsx` no usa `text-neutral-500` — usa `text-muted-foreground`
- [ ] `MobileStoreListView.tsx` no usa `dark:text-white` — eliminado
- [ ] `MobilePalletView/index.tsx` Alert de solo lectura no usa colores `orange-*` hardcodeados — usa tokens semánticos o variant de Alert
- [ ] `OrderHeaderMobile.jsx` no usa `dark:text-white` — eliminado
- [ ] `OrderHeaderMobile.jsx` badge de autoventa no usa `bg-slate-200 text-slate-800` — usa `bg-muted text-muted-foreground`
- [ ] `LoginFormMobile.tsx` badge DEMO no usa `bg-lime-100 text-lime-800` — usa tokens semánticos
- [ ] El dark mode de todas las vistas afectadas funciona correctamente después del cambio (el texto sigue siendo legible en fondo oscuro)
- [ ] No quedan otros colores hardcodeados Tailwind (revisar `slate-*`, `neutral-*`, `lime-*`, `dark:text-white`) en los archivos listados

---

## Archivos a crear o modificar

- `src/components/Field/FieldDashboard.jsx` — `text-neutral-500` → `text-muted-foreground`
- `src/components/Admin/Stores/Mobile/MobileStoreListView.tsx` — eliminar `dark:text-white`
- `src/components/Admin/Pallets/PalletDialog/MobilePalletView/index.tsx` — Alert colores orange → tokens semánticos
- `src/components/Admin/OrdersManager/Order/components/OrderHeaderMobile.jsx` — `dark:text-white` + `bg-slate-200 text-slate-800`
- `src/components/LoginPage/LoginFormMobile.tsx` — badge DEMO `bg-lime-100 text-lime-800` → tokens semánticos

---

## Restricciones

- NO cambiar estructura JSX ni lógica — solo clases CSS
- NO cambiar los colores semánticos del sistema de status badges (naranja/verde/rojo con `/15` opacity) — esos son correctos y son parte del sistema de diseño
- El implementador debe verificar en `design-context.md` si existe un token `--warning` antes de decidir el reemplazo del Alert en `MobilePalletView`
- Si `Alert` tiene una variante `"warning"` en el proyecto, usarla en lugar de clases manuales

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Field/FieldDashboard.jsx` — `text-neutral-500 dark:text-neutral-400` → `text-muted-foreground`
- `src/components/Admin/Stores/Mobile/MobileStoreListView.tsx` — `dark:text-white` eliminado del título "Almacenes" (`text-xl font-normal` queda limpio)
- `src/components/Admin/Pallets/PalletDialog/MobilePalletView/index.tsx` — Alert de solo lectura: `border-orange-200 bg-orange-50 text-orange-600 text-orange-800` → `border-warning/20 bg-warning/10 text-warning-foreground`
- `src/components/Admin/OrdersManager/Order/components/OrderHeaderMobile.jsx` — `dark:text-white` eliminado del título; badge autoventa: `border-slate-400 bg-slate-200 text-slate-800 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-200` → `border-border bg-muted text-muted-foreground`
- `src/components/LoginPage/LoginFormMobile.tsx` — badge DEMO: `bg-lime-100 text-lime-800` → `bg-accent text-accent-foreground`

### Decisiones tomadas durante la implementación

El Alert de `MobilePalletView` usa `border-warning/20 bg-warning/10 text-warning-foreground` con el token `--warning` confirmado en `globals.css`. No existe variante `warning` en el componente Alert, por lo que se aplica via className. El badge DEMO usa `bg-accent text-accent-foreground` como token neutro semántico (no hay token de "demo/beta" en design-context.md).

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
