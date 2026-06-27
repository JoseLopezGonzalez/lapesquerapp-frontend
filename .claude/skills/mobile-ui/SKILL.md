# SKILL: mobile-ui — PesquerApp Mobile UI Patterns

## Cuándo usar este skill
Cualquier tarea que implique crear, mejorar o revisar una vista para mobile en PesquerApp.
Leer completo antes de escribir una sola línea de código.

---

## Stack y restricciones

- **Next.js 16, App Router** — Server Components por defecto, Client Components con `'use client'`
- **Archivos nuevos siempre en `.ts` / `.tsx`** — nunca `.js` nuevos (regla de oro CLAUDE.md)
- **Shadcn/UI + Tailwind CSS** — NUNCA instalar nuevas librerías de componentes sin aprobación
- **Animaciones:** `framer-motion` v11 + presets en `src/lib/motion-presets.js` (feedbackPop, etc.)
- **Iconos:** `lucide-react` únicamente
- **Imágenes:** `next/image` siempre

---

## Hooks mobile del proyecto — usar SIEMPRE estos, no inventar sustitutos

```typescript
// Detección de dispositivo — usar para render condicional (evita hydration mismatch)
import { useIsMobileSafe } from '@/hooks/use-mobile';
const { isMobile, mounted } = useIsMobileSafe();
if (!mounted) return null; // o render neutro
if (isMobile) return <MobileLayout />;

// Detección simple (sin protección SSR — solo para lógica, no para render condicional)
import { useIsMobile } from '@/hooks/use-mobile';
const isMobile = useIsMobile();

// Ocultar BottomNav en vistas de detalle/edición
import { useHideBottomNav } from '@/context/BottomNavContext';
useHideBottomNav(true); // en el componente — cleanup automático al desmontar
```

---

## Tokens de diseño mobile — usar en lugar de valores inline

```typescript
import {
  MOBILE_HEIGHTS,      // h-12 inputs, h-11 buttons, min-h-[44px] touch targets
  MOBILE_SPACING,      // px-4 screens, gap-3 cards, p-4 card padding
  MOBILE_RADIUS,       // rounded-2xl cards, rounded-lg buttons/inputs
  MOBILE_SAFE_AREAS,   // pb-[env(safe-area-inset-bottom)]
  MOBILE_TYPOGRAPHY,   // text-base para inputs (evita zoom iOS)
} from '@/lib/design-tokens-mobile';
```

---

## Breakpoints del proyecto

- **Mobile:** < 768px (`max-md` en Tailwind)
- **Desktop:** ≥ 768px (`md:` en Tailwind)

El trabajo mobile-first afecta solo a < 768px. **No romper desktop nunca.**

---

## Layout shell mobile — NO modificar su estructura

```
BottomNav (fijo, 5 slots: 2 izquierda + CenterActionButton + 2 derecha)
  → src/components/Admin/Layout/BottomNav/index.jsx

NavigationSheet (drawer vaul desde abajo — NO es Sheet de shadcn)
  → src/components/Admin/Layout/NavigationSheet/index.jsx

ResponsiveLayout (switch desktop AppSidebar / mobile BottomNav+NavigationSheet)
  → src/components/Admin/Layout/ResponsiveLayout/index.jsx

BottomNavContext (ocultar/mostrar BottomNav)
  → src/context/BottomNavContext.jsx
  → exporta: useBottomNav, useHideBottomNav
```

**Safe area inferior:** cualquier ScrollArea de contenido mobile debe tener padding-bottom
mínimo de 80px (`pb-20`) cuando el BottomNav está visible, o usar
`MOBILE_SAFE_AREAS.BOTTOM_WITH_NAV` del token.

---

## Patrones por tipo de vista

### CRUD genérico (Tipo B) — EntityClient con AccordionBody

El EntityClient ya convierte automáticamente a Accordion en mobile vía `AccordionBody.js`
y `getMobilePrimaryFields.js`. Para mejorar un EntityClient:

1. Editar `getMobilePrimaryFields.js` para mostrar los 3 campos más relevantes en el header
2. El formulario de creación/edición debe usar Sheet `side="bottom"` en mobile
3. No duplicar la tabla de desktop — solo mejorar el Accordion existente

```
Estructura de vista CRUD mobile:
1. Header sticky: título + botón de acción principal (FAB alternativo)
2. Barra de búsqueda/filtros: colapsable si hay más de 2 filtros
3. AccordionBody (ya existe) — mejorarlo con los campos correctos
4. FAB para crear: position bottom-right, encima del BottomNav (bottom-24)
```

### Master-detail complejo (Tipo A)

Estructura obligatoria (patrón establecido en OrdersManager):
1. Vista lista (pantalla completa en mobile) → `OrdersList` como referencia
2. Tap en ítem → navegar a vista detalle (pantalla completa, NO panel lateral)
3. Detalle con secciones:
   - Header con título + badge estado + botón de acciones (DropdownMenu)
   - Lista de secciones como botones seleccionables (patrón `OrderSectionList.jsx`)
   - Tap en sección → vista full-screen de esa sección
   - Botón back en header de sección
4. `useHideBottomNav(true)` activo en vista detalle y en sección
5. Formulario de edición: Sheet `side="bottom"` con max-height 90vh

**Referencia de implementación:** `src/components/Admin/OrdersManager/Order/components/`
- `OrderHeaderMobile.jsx` — header de detalle
- `OrderSectionList.jsx` — lista de secciones táctiles
- `OrderSectionContentMobile.jsx` — contenido de sección
- `OrderSummaryMobile.jsx` — resumen compacto

### Formularios en mobile

```typescript
// Sheet desde abajo (no lateral)
<Sheet>
  <SheetContent side="bottom" className="max-h-[90vh]">
    <ScrollArea className="h-full">
      {/* Campos apilados verticalmente */}
    </ScrollArea>
    <SheetFooter className="sticky bottom-0 bg-background pt-4 pb-safe">
      {/* Botones guardar/cancelar fijos */}
    </SheetFooter>
  </SheetContent>
</Sheet>

// Inputs mobile-friendly
<Input
  className={cn(MOBILE_HEIGHTS.INPUT, MOBILE_TYPOGRAPHY.INPUT)}
  inputMode="numeric"  // para campos de cantidad/precio
  autoFocus           // en el primer campo
/>
```

### Animaciones permitidas (mobile)

```typescript
import { feedbackPop } from '@/lib/motion-presets';
import { motion } from 'framer-motion';

// ✅ Feedback táctil en cards clickables
<motion.div
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.1 }}
>

// ✅ Usar presets del proyecto
<motion.div
  initial={feedbackPop.initial}
  animate={feedbackPop.animate}
  transition={feedbackPop.transition}
>

// ❌ NO: parallax, scroll-triggered, animaciones > 300ms en interacciones frecuentes
// ❌ NO: animar listas completas (solo el ítem tocado)
```

---

## Patrones de card mobile

```typescript
// Card mínimo viable — sin Badge shadcn para estados principales
<div
  className="flex items-start justify-between rounded-xl border bg-card p-4 gap-3 active:bg-muted/50 transition-colors"
  onClick={handleClick}
>
  <div className="flex-1 min-w-0">
    {/* Línea 1: identificador principal */}
    <p className="font-medium truncate">{nombre}</p>
    {/* Línea 2: metadata secundaria */}
    <p className="text-sm text-muted-foreground truncate">{metadata}</p>
  </div>
  {/* Badge de estado: inline-flex manual, NO Badge shadcn para estados primarios */}
  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/15 text-green-700 shrink-0">
    {estado}
  </span>
</div>
```

---

## Performance mobile obligatorio

- Virtualización si lista > 50 ítems — paginación si react-window no está instalado
- Skeleton en lugar de spinner para carga inicial de listas
- No fetch en cada render — usar hooks TanStack Query del proyecto (`useXxx`)
- `next/image` con `loading="lazy"` para imágenes en listas

---

## QA checklist antes de merge

- [ ] Funciona sin scroll horizontal en 375px (iPhone SE)
- [ ] Funciona en 390px (iPhone 14) y 412px (Android estándar)
- [ ] BottomNav no tapa contenido relevante (padding-bottom correcto)
- [ ] Todos los touch targets ≥ 44px de alto (`min-h-[44px]`)
- [ ] Formularios no se rompen con teclado virtual abierto
- [ ] Estados vacíos usan componente Empty existente
- [ ] No hay textos truncados sin tooltip o expand
- [ ] Dark mode funciona (variables semánticas CSS, no colores hardcodeados)
- [ ] Desktop no ha sido modificado (verificar en ≥ 768px)
- [ ] `useHideBottomNav` activo en vistas de detalle/edición
- [ ] Sin `fetch()` directo — todo vía hooks TanStack Query
- [ ] Sin `useMediaQuery` inventado — usar `useIsMobileSafe` del proyecto
