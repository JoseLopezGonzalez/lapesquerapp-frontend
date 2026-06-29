# GAP-022 — Mobile: cleanup menor — código muerto, inline style, touch target

## Metadata

- **Tipo:** Mejora
- **Módulo:** Stock / Almacén / Login
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-06-27
- **Autor:** Jose
- **Origen:** /audit-mobile Phase 4 — findings B1-M2, B2-M1, C2-M1

---

## Contexto y problema

Tres mejoras menores agrupadas por su bajo impacto y simplicidad de fix:

### B1-M2 — Código muerto en `MobileStoreCard` (`MobileStoreListView.tsx`)

Las variables `iconBg` e `iconColor` se calculan al inicio de `MobileStoreCard` pero **nunca se usan en el JSX**. Son dead code:

```tsx
const iconBg = isGhostStore ? 'bg-slate-100...' : ...;  // ← nunca usada
const iconColor = isGhostStore ? 'text-slate-500' : ...; // ← nunca usada
```

El ícono de Warehouse/Sparkles que aparecería en la tarjeta no se renderiza en la implementación actual (la tarjeta solo muestra nombre, peso, temperatura y barra de progreso). Estas variables deben eliminarse.

### B2-M1 — Inline style en `MobilePalletView/index.tsx`

El footer de guardado usa un inline style para el padding bottom:

```tsx
style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
```

El proyecto usa Tailwind CSS 4, que soporta directamente `pb-[calc(0.75rem+env(safe-area-inset-bottom))]` como clase. Los inline styles deben evitarse cuando hay equivalente en Tailwind.

### C2-M1 — Touch target por debajo de 44px en `LoginFormMobile.tsx`

El botón de volver en el formulario de login usa `<Button size="icon">` que resulta en 36px × 36px. El mínimo es 44px × 44px para touch targets en mobile.

```tsx
// Actual
<Button size="icon" ...>

// Corrección
<Button size="icon" className="h-11 w-11" ...>
// o usar la clase h-12 w-12 que usa MobileStoreListView (más generoso)
```

---

## Solución acordada

### Fix B1-M2
Eliminar las variables `iconBg` e `iconColor` de `MobileStoreCard`. Si en el futuro se quiere mostrar el ícono de almacén, se añade en ese momento.

### Fix B2-M1
Reemplazar el `style={{ paddingBottom: ... }}` por clase Tailwind:
```tsx
// Antes
<div className="shrink-0 bg-background/95 px-3 py-3 backdrop-blur-sm"
     style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>

// Después
<div className="shrink-0 bg-background/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm">
```

### Fix C2-M1
Añadir `className="h-11 w-11"` al `<Button size="icon">` del botón de volver en `LoginFormMobile.tsx`, asegurando mínimo 44px × 44px.

---

## UI Brief

- **Vista de referencia:** `src/components/Admin/Stores/Mobile/MobileStoreListView.tsx` — botones de header usan `h-12 min-h-12 w-12 min-w-12`
- **Tipo de layout:** Sin cambio de layout
- **Componentes clave:** Sin componentes nuevos
- **Estados requeridos:** Sin cambio en estados
- **Mobile:** aplica ahora

---

## Referencias

- `MobileStoreListView.tsx` líneas 240–258 — botones `h-12 min-h-12 w-12 min-w-12` como referencia de touch target
- `.claude/skills/mobile-ui/SKILL.md` — `MOBILE_TOUCH_TARGETS.MIN: 44px`
- `design-context.md` — inline styles prohibidos; usar clases Tailwind

---

## Criterios de aceptación

- [ ] `MobileStoreCard` en `MobileStoreListView.tsx` no tiene las variables `iconBg` ni `iconColor` (código muerto eliminado)
- [ ] `MobilePalletView/index.tsx` no usa `style={{ paddingBottom: ... }}` — usa clase Tailwind `pb-[calc(...)]`
- [ ] El comportamiento del safe area padding en `MobilePalletView` es idéntico al actual (solo cambia la forma de expresarlo)
- [ ] El botón de volver en `LoginFormMobile.tsx` tiene al menos 44px × 44px de área táctil
- [ ] No hay nuevos inline styles introducidos en ninguno de los archivos modificados

---

## Archivos a crear o modificar

- `src/components/Admin/Stores/Mobile/MobileStoreListView.tsx` — eliminar `iconBg` e `iconColor` de `MobileStoreCard`
- `src/components/Admin/Pallets/PalletDialog/MobilePalletView/index.tsx` — reemplazar inline style por clase Tailwind
- `src/components/LoginPage/LoginFormMobile.tsx` — añadir `className="h-11 w-11"` al botón de volver

---

## Restricciones

- NO tocar la lógica de negocio ni los hooks
- NO cambiar el comportamiento visual de las vistas — solo los tres puntos específicos
- Si al eliminar `iconBg`/`iconColor` hay un TypeScript error por imports no usados (ej. `Sparkles`, `Warehouse` de lucide), limpiar esos imports también

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/Stores/Mobile/MobileStoreListView.tsx` — eliminadas variables `iconBg` e `iconColor` de `MobileStoreCard`; eliminado import `Sparkles` (nunca usado en JSX).
- `src/components/Admin/Pallets/PalletDialog/MobilePalletView/index.tsx` — `style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}` eliminado; clase dividida: `py-3` → `pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]`.
- `src/components/LoginPage/LoginFormMobile.tsx` — añadido `h-11 w-11` al botón de volver (44px × 44px touch target mínimo).

### Decisiones tomadas durante la implementación

`Sparkles` también se elimina del import ya que era la única razón por la que se importaba (referenciada solo en `iconColor`, que ahora se elimina). `Warehouse` se mantiene porque se usa en el `EmptyState` añadido en GAP-020.

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
