# GAP-121 — Landing Fase B2: sistema visual monocromo + bento + assets

## Metadata

- **Tipo:** Feature
- **Módulo:** Global (sitio público / landing)
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-28
- **Autor:** Jose

---

## Contexto y problema

Fase B1 (GAP-120, cerrado, ✅ 9/10) dejó la arquitectura lista: `next-intl` con `[locale]`
(solo `es` publicado), `LandingPage` componentizado en 7 archivos, JSON-LD, middleware
componiendo routing de tenant/locale sin regresión. Todo el contenido visual quedó **idéntico
al original** deliberadamente — mismo `bg-sky-500`, mismos gradientes, mismas imágenes reales
de la UI actual. B2 es el rediseño visual real sobre esa base: paleta monocroma, bento grid,
mockups de producto aislados, siguiendo la dirección visual confirmada por Jose en
`.claude/landing-context.md` §2 (referencia Pinterest: "diseño tipo Apple muy limpio... bento
grid... mockups de componentes reales aislados y estilizados... tonos neutros").

Dos rondas de clarificación (2026-07-28, persistidas en `.claude/landing-proposal.md` §8)
resolvieron todas las ambigüedades antes de este GAP. Ninguna de las decisiones de abajo se
vuelve a preguntar.

### Estado actual real de los 7 componentes (verificado leyendo cada archivo, no solo el GAP-120)

- **`Hero.tsx`** (146 líneas, Client) — 2 CTAs ("Ver demo" abre `demoUrl`, "Ver características"
  hace scroll a `#modulos`), mockup `home-mockup.png` + 3 tarjetas flotantes (`Card` con icono +
  label/valor), bloque de confianza genérico. Todo en `sky-500`/gradiente sky-slate.
- **`ModulesBento.tsx`** (79 líneas, Server) — grid de 5 `Card`, cada una con **solo un icono
  Lucide coloreado** (`bg-sky-100`/`text-sky-600`) + título + descripción. **Sin mockup de
  componente por tarjeta** — no cumple todavía la referencia visual de Jose.
- **`IntegratedLonjas.tsx`** (58 líneas, Server) — logos reales de lonjas integradas.
- **`ProductShowcase.tsx`** (99 líneas, Server) — 4 capturas grandes apiladas
  (`mockup-label.png`, `mockup-ia-2.png`, `mockup-store.png`, `mockup-orders.png`) sobre fondos
  `gradient-to-tr/br from-sky-50 to-sky-200`. Cubre los mismos 5 módulos que ya están en
  `ModulesBento` (etiquetas, IA, almacén, pedidos/ventas) — contenido duplicado si además
  `ModulesBento` gana mockups propios (ver decisión abajo).
- **`TrustBadge.tsx`** (18 líneas, Server) — bloque único "Cumplimiento Legal" centrado.
- **`LeadCaptureForm.tsx`** (88 líneas, Client) — formulario de GAP-119 con las 3 correcciones
  del addendum (`aria-invalid`, contraste del error, `try/catch` de red). Lógica **no se toca**.
- **`Footer.tsx`** (57 líneas, Server) — enlaces + copyright dinámico.

---

## Decisiones ya confirmadas por Jose (dos rondas, 2026-07-28)

Persistidas en `.claude/landing-proposal.md` §8 ("B2 — Decisiones confirmadas" y "B2 —
Estructura de home confirmada") — no se vuelven a preguntar:

### Ronda 1 — sistema visual general

1. **Imágenes reales actuales** (`home-mockup.png`, `mockup-label.png`, `mockup-ia-2.png`,
   `mockup-store.png`, `mockup-orders.png`) — no se tocan ni se reutilizan. Se sustituyen por
   placeholders explícitos marcados por tipo (§7b); un GAP corto de seguimiento captura de
   nuevo en tenant demo/seed.
2. **`IntegratedLonjas`** — se mantiene y restylea a monocromo (logos reales, sin riesgo de
   honestidad, distinto de los testimonios que sí quedan fuera).
3. **Dark mode** — la landing soporta claro/oscuro vía los tokens OKLCH ya existentes
   (`--background`/`--foreground`/`--primary`/`--muted`/`--border`), igual que el resto de la
   app. No se fija a un único modo.
4. **`framer-motion` scroll-reveal** — entra en el alcance de este GAP (librería ya instalada,
   cero coste de dependencia nueva).

### Ronda 2 — estructura de página

5. **Hero** — un único CTA ("Ver demo") + un único mockup central estilizado (placeholder Tipo
   2). Se eliminan el segundo CTA ("Ver características") y las 3 tarjetas flotantes — sigue
   estrictamente la recomendación CRO de `landing-proposal.md` §4.2 (13.5% vs 10.5% conversión
   con un solo CTA dominante). Como ya no hay botón que haga scroll, `handleScrollToModules` y
   `MODULES_SECTION_ID` en `Hero.tsx` se eliminan; el `id="modulos"` en `ModulesBento.tsx` se
   mantiene (útil para futuros enlaces de navegación, aunque no lo use el Hero).
6. **`ModulesBento`** — cada una de las 5 tarjetas añade su placeholder Tipo 3 (prompts ya
   redactados en `landing-context.md`/`landing-proposal.md` §5) además del icono monocromo.
7. **`HowItWorks` (nuevo componente)** — 3 pasos (captura/lonja → producción/stock → venta),
   copy nuevo de `landing-content-writer` en este mismo ciclo.
8. **`ProductShowcase` — se elimina como sección independiente.** Mantener el mismo producto
   mostrado dos veces (bento con mockup propio + showcase apilado) contradice el objetivo de
   página limpia tipo Apple con "un elemento visual dominante por sección" (`landing-proposal.md`
   §4.2); sus 4 capturas quedaban cubiertas por los mismos 5 mockups que gana el bento. El
   archivo se borra, no se migra 1:1. Como consecuencia, los placeholders Tipo 1 de "Panel de
   Pedidos" y "Editor de etiquetas" descritos en `landing-proposal.md` §5 (pensados
   originalmente para esta sección) quedan sin uso en B2 — no se generan en este GAP, se
   revisan en el GAP de assets de seguimiento por si tienen cabida en otra sección futura.
9. **`PricingPreview` (nuevo componente)** — nombre de cada nivel + a quién va dirigido, sin
   cifras, con CTA. Como `/pricing` no existe hasta Fase C, el CTA de este GAP apunta
   temporalmente al ancla del formulario de leads (`#lead-form`) — **señalado explícitamente
   como cambio de destino pendiente**, el implementador debe dejar un comentario en el código
   (`// TODO Fase C: apuntar a /pricing cuando exista la página real`) junto al `href`.
10. **Orden final de secciones:** Hero → `ModulesBento` → `HowItWorks` → `IntegratedLonjas` →
    `TrustBadge` → `PricingPreview` → `LeadCaptureForm` → `Footer`.

---

## Solución acordada

### 1. Placeholder de asset compartido

Crear `src/components/LandingPage/AssetPlaceholder.tsx` — Server Component reutilizable que
renderiza un bloque con borde discontinuo, fondo `--muted`, icono `ImageOff` (lucide) y texto
pequeño mostrando la clasificación de `landing-context.md` §7b (`Tipo 1`/`Tipo 2`/`Tipo 3`) más
una descripción breve de qué va ahí. Reemplaza cualquier `<Image>` de las 5 imágenes retiradas.
Props: `type: 1 | 2 | 3`, `label: string`, `className?: string` (para controlar aspect
ratio/tamaño desde cada sección). Esto deja al GAP de seguimiento un único punto de sustitución
por imagen, no texto libre disperso.

### 2. `ScrollReveal` — wrapper de animación

Crear `src/components/LandingPage/ScrollReveal.tsx` — Client Component que envuelve `children`
(pueden ser Server Components, patrón válido de App Router: un Client Component puede recibir
Server Components como `children`) con `motion.div` de `framer-motion`, animación de entrada
simple (`opacity`/`y` con `whileInView`, `viewport={{ once: true }}`). Debe respetar
`prefers-reduced-motion` usando el hook `useReducedMotion` de `framer-motion` — si está activo,
renderiza sin animación (sin `initial`/`animate`, solo el contenido). Se usa para envolver cada
tarjeta de `ModulesBento`, cada paso de `HowItWorks`, y las secciones principales — no para
micro-interacciones de hover.

### 3. `Hero.tsx` — simplificar a un CTA + un mockup

- Eliminar el botón "Ver características", `handleScrollToModules`, `MODULES_SECTION_ID` y las
  3 `Card` flotantes (producción/stock/ventas).
- El mockup se sustituye por `<AssetPlaceholder type={2} label="Captura real del dashboard,
  retocada y aislada (ver landing-context.md §5)" />`.
- Recolorear: `bg-gradient-to-br from-sky-50 via-white to-slate-50` → gradiente/fondo con
  tokens neutros (`bg-background`, o un sutil `bg-gradient-to-b from-muted/40 to-background`);
  el icono `Waves` en `bg-sky-500` → `bg-primary`/`text-primary-foreground`; el botón CTA
  `bg-sky-500 hover:bg-sky-400` → variante `default` de `Button` (ya usa `--primary`).
- Envolver el bloque de mockup en `ScrollReveal`.

### 4. `ModulesBento.tsx` — bento real con mockup por tarjeta

- Cada `Card` añade, debajo del icono/título/descripción, un `<AssetPlaceholder type={3}
  label="[prompt correspondiente de landing-context.md §5, ej. producción/stock/ventas/IA/etiquetas]" />`.
- Recolorear `bg-sky-100`/`text-sky-600` de los iconos → `bg-muted`/`text-foreground` (o
  `bg-primary/10 text-primary`, a elegir por consistencia con el resto de badges monocromos del
  proyecto).
- Envolver cada `Card` en `ScrollReveal`.

### 5. `HowItWorks.tsx` (nuevo)

- Server Component, 3 pasos numerados (1. Captura/lonja → 2. Producción/stock → 3. Venta),
  título + descripción breve por paso (copy de `landing-content-writer`, ver punto 8). Layout
  horizontal en desktop (`grid-cols-3` o flex con conectores), apilado en mobile.
- Cada paso envuelto en `ScrollReveal`.
- Namespace de traducción nuevo: `Landing.howItWorks` en `landing.json`.

### 6. `ProductShowcase.tsx` — eliminar

- Borrar el archivo. `src/app/[locale]/page.tsx` deja de importarlo.
- Namespace `Landing.productShowcase` se elimina de `landing.json`.

### 7. `IntegratedLonjas.tsx` / `TrustBadge.tsx` / `Footer.tsx` — restyle monocromo

Sin cambios de estructura/lógica — solo sustituir clases `sky-*`/gradientes azules por los
tokens semánticos ya documentados (`--background`, `--foreground`, `--muted`, `--border`,
`--primary`). Envolver bloques principales en `ScrollReveal` donde tenga sentido (no en
`Footer`, que no necesita animación de entrada).

### 8. `PricingPreview.tsx` (nuevo)

- Server Component, 3 tarjetas (nombre de nivel + "a quién va dirigido", sin cifras — el
  contenido exacto de cada nivel lo aporta `landing-content-writer` a partir del criterio de
  `landing-proposal.md` §4.4, sin inventar tiers no confirmados por Jose si no hay ya una
  estructura clara — usar nombres genéricos de nivel tipo "Starter/Pro/Enterprise" solo si
  Jose no ha definido nombres reales; si el copy no puede confirmarse, usar placeholders de
  texto entre corchetes en vez de inventar).
- CTA único "Ver planes" con `href="#lead-form"` (ver decisión 9) + comentario `TODO Fase C`.
- Namespace nuevo: `Landing.pricingPreview`.

### 9. `LeadCaptureForm.tsx` — solo restyle + `id` de ancla

- Añadir `id="lead-form"` (o al `<section>` que lo envuelve) para que `PricingPreview` pueda
  enlazar aquí.
- Recolorear el fondo `bg-sky-500` de la sección y el botón a tokens neutros/`--primary`. **No
  tocar** la lógica de RHF/Zod/honeypot/service ni los 3 fixes del addendum de GAP-119.

### 10. `src/app/[locale]/page.tsx`

Actualizar el orden de composición según la decisión 10 (Hero → ModulesBento → HowItWorks →
IntegratedLonjas → TrustBadge → PricingPreview → LeadCaptureForm → Footer), importando los 2
componentes nuevos y quitando el import de `ProductShowcase`.

### 11. `src/messages/es/landing.json`

- **Reescritura de copy** por `landing-content-writer`, en este mismo ciclo, siguiendo
  `landing-context.md` §4.3 (nombrar el problema real del sector, vocabulario de dominio
  correcto, CTA específico) — aplica a `hero`, `modules.*`, `integratedLonjas`, `trustBadge`,
  `leadForm`, `footer`. No es una tarea aparte ni un GAP posterior.
- Namespaces nuevos: `howItWorks` (3 pasos), `pricingPreview` (3 niveles).
- Namespace `productShowcase` eliminado.
- Claves de `hero` relacionadas con las tarjetas flotantes (`floatingProductionLabel/Value`,
  `floatingStockLabel/Value`, `floatingSalesLabel/Value`) y con el segundo CTA (`ctaFeatures`)
  se eliminan (ya no las usa ningún componente).

---

## Referencias e inspiración

- `.claude/landing-context.md` §2 (dirección visual confirmada, bloque de estilo Apple/bento),
  §5→§7b (clasificación y flujo de assets), §4.1/§4.9 (framer-motion con intención).
- `.claude/landing-proposal.md` §4.2 (estructura de home ideal), §4.3 (criterio de copy), §4.4
  (patrón de pricing), §5 (prompts de IA ya redactados para los 5 módulos + shield de
  confianza), §8 (las dos rondas de decisiones de este GAP, ambas persistidas ahí).
- `.claude/gaps/closed/GAP-120-landing-locale-arquitectura.md` — estado exacto de los 7
  componentes de partida, `landing.json` de partida.
- `.claude/gaps/closed/GAP-119-landing-fase-a-detener-sangria.md` — lógica de
  `LeadCaptureForm`/`landingLeadService`/`landingLeadSchema` que no se toca, addendum con los 3
  fixes de accesibilidad ya aplicados (no revertir).
- Tokens de marca: `design-context.md` §1 (tabla completa de tokens OKLCH).

---

## UI Brief

- **Vista de referencia:** no hay vista análoga en el ERP (sitio público, no comparte densidad
  visual con `design-context.md`) — la referencia es la propia descripción de Jose en
  `landing-context.md` §2 (bento grid + mockups aislados, estilo Apple, monocromo).
- **Tipo de layout:** página completa pública (home), sin modal/sheet.
- **Componentes clave:** `Card`, `Button` (shadcn, ya en uso) + 2 nuevos de soporte
  (`AssetPlaceholder`, `ScrollReveal`) + 2 nuevas secciones (`HowItWorks`, `PricingPreview`).
  Iconos Lucide únicamente (regla del proyecto).
- **Estados requeridos:** `LeadCaptureForm` conserva sus 4 estados (idle/enviando/éxito/error)
  sin cambios de comportamiento, solo de color. El resto de secciones son estáticas (sin
  fetching, sin loading state).
- **Mobile:** aplica ahora. `ModulesBento` y `PricingPreview` apilan verticalmente en mobile
  (nunca scroll horizontal de tarjetas, siguiendo `landing-proposal.md` §4.4). `HowItWorks`
  pasa de horizontal (desktop) a apilado (mobile).
- **Accesibilidad:** todo `ScrollReveal` debe respetar `prefers-reduced-motion` (ver Solución
  acordada punto 2) — no es opcional, es requisito de aceptación.
- **Sistema visual:** el foco completo de este GAP — paleta 100% tokens semánticos
  (`--background`/`--foreground`/`--primary`/`--muted`/`--border`), cero `sky-*`, cero azul
  nuevo, cero valor hex/rgb/oklch hardcodeado fuera de los tokens ya definidos en
  `globals.css`.

### Preguntas de confirmación para Jose

Ninguna — las 10 decisiones decisivas de este GAP (sistema visual general + estructura de
página) ya se confirmaron explícitamente en las dos rondas de esta sesión (2026-07-28),
persistidas en `.claude/landing-proposal.md` §8.

---

## Criterios de aceptación

- [ ] Hero muestra un único CTA ("Ver demo") y un único mockup central (`AssetPlaceholder`
      tipo 2) — sin segundo botón ni tarjetas flotantes en el DOM renderizado.
- [ ] `ModulesBento` renderiza 5 tarjetas, cada una con icono monocromo + `AssetPlaceholder`
      tipo 3 con el texto del prompt/descripción correspondiente de `landing-context.md` §5.
- [ ] Existe `HowItWorks.tsx`, renderizado entre `ModulesBento` e `IntegratedLonjas` en
      `[locale]/page.tsx`, con 3 pasos (captura/lonja → producción/stock → venta).
- [ ] `src/components/LandingPage/ProductShowcase.tsx` ya no existe; `[locale]/page.tsx` no lo
      importa; el namespace `productShowcase` no existe en `landing.json`.
- [ ] Existe `PricingPreview.tsx` con 3 niveles (nombre + a quién va dirigido, sin ningún
      número de precio) y un CTA cuyo `href` es `#lead-form` con el comentario `TODO Fase C`
      junto a la línea.
- [ ] `LeadCaptureForm` tiene `id="lead-form"` (en el elemento que ancla el scroll) y conserva
      exactamente el comportamiento de GAP-119 (validación, honeypot, `aria-invalid`, pastilla
      de error de alto contraste, `try/catch` de red) — verificable comparando el diff de
      lógica (debe ser solo de clases, no de JSX estructural/handlers).
- [ ] `grep -rn "sky-" src/components/LandingPage/ src/app/[locale]/` no devuelve resultados
      (cero clases `sky-*` restantes en los archivos de este GAP).
- [ ] La home renderiza correctamente en `light` y `dark` (verificable leyendo que ningún color
      está hardcodeado fuera de los tokens semánticos, que ya tienen variante oscura definida
      en `globals.css`).
- [ ] Cada `ScrollReveal` usa `useReducedMotion` de `framer-motion` y omite la animación cuando
      está activo (verificable por lectura de código).
- [ ] `src/messages/es/landing.json`: copy reescrito en `hero`/`modules.*`/`integratedLonjas`/
      `trustBadge`/`leadForm`/`footer` (ninguna cadena idéntica textual al placeholder genérico
      de B1, ej. "Gestión total para industrias pesqueras" debe cambiar por algo que nombre un
      problema real del sector); namespaces `howItWorks` y `pricingPreview` presentes;
      namespace `productShowcase` ausente; claves `ctaFeatures`/`floating*` ausentes de `hero`.
- [ ] Ninguna cifra de precio, certificación o testimonio inventado en ningún componente nuevo
      o modificado (`grep` de palabras como "ISO", "99.9%", "€/mes" no debe aparecer).
- [ ] `npm run type-check` y `npm run lint` limpios (protocolo pre-push de CLAUDE.md).

---

## Archivos a crear o modificar

**Crear:**
- `src/components/LandingPage/AssetPlaceholder.tsx`
- `src/components/LandingPage/ScrollReveal.tsx`
- `src/components/LandingPage/HowItWorks.tsx`
- `src/components/LandingPage/PricingPreview.tsx`

**Modificar:**
- `src/components/LandingPage/Hero.tsx` (simplificar a 1 CTA + 1 mockup, recolorear, quitar
  scroll handler)
- `src/components/LandingPage/ModulesBento.tsx` (añadir placeholder por tarjeta, recolorear)
- `src/components/LandingPage/IntegratedLonjas.tsx` (recolorear)
- `src/components/LandingPage/TrustBadge.tsx` (recolorear)
- `src/components/LandingPage/LeadCaptureForm.tsx` (recolorear + `id="lead-form"`, sin tocar
  lógica)
- `src/components/LandingPage/Footer.tsx` (recolorear)
- `src/app/[locale]/page.tsx` (nuevo orden de composición, quitar import de `ProductShowcase`,
  añadir `HowItWorks`/`PricingPreview`)
- `src/messages/es/landing.json` (reescritura de copy + namespaces nuevos/eliminados, ver
  Solución acordada punto 11)

**Eliminar:**
- `src/components/LandingPage/ProductShowcase.tsx`

**No tocar:**
- `src/services/landing/landingLeadService.ts`, `src/schemas/landingLeadSchema.ts`,
  `src/app/api/landing/lead/route.ts` (lógica de GAP-119 intacta).
- `src/i18n/routing.ts`, `src/i18n/request.ts` (sigue `locales: ['es']` únicamente — PT/EN es
  Fase C).
- `src/middleware.ts`, `src/app/page.js` (arquitectura de B1 sin cambios).
- `src/app/legal/privacy/page.tsx`, `src/app/legal/terms/page.tsx`, `src/app/sitemap.ts`,
  `src/app/robots.ts`.
- `public/images/landingPage/*.png` actuales — no se borran del repo, solo dejan de
  referenciarse (evita perder el archivo por si el GAP de assets de seguimiento quiere
  reutilizar alguno como base para retocar).

---

## Restricciones

- **No crear la página `/pricing` real** — `PricingPreview` es solo un resumen en home, la
  página completa con cifras es Fase C.
- **No inventar cifras de precio, certificaciones ni testimonios** — regla dura de honestidad
  de `landing-context.md` §5, aplica igual aquí.
- **No añadir dependencias nuevas** — `framer-motion` ya está instalado, no se instala nada más.
- **No declarar `pt`/`en` en `next-intl`** — sigue siendo Fase C.
- **No tocar la lógica de `LeadCaptureForm`** (validación, honeypot, servicio, manejo de
  errores) — solo clases de color y el `id` del ancla.
- **No dejar ninguna clase `sky-*`, gradiente azul, o valor hex/rgb/oklch hardcodeado** en
  ningún archivo de este GAP — todo pasa por los tokens semánticos ya definidos.
- **No reintroducir las tarjetas flotantes ni el segundo CTA del Hero** — decisión explícita
  de esta ronda, no un olvido a corregir.
- **No migrar el contenido de `ProductShowcase` a otra sección 1:1** — se elimina, no se
  reubica; los 5 mockups del bento ya cubren el mismo terreno de producto.
- **Placeholders siempre con su clasificación visible** (`AssetPlaceholder` debe mostrar
  "Tipo 1/2/3" + descripción) — nunca un placeholder genérico sin decir qué asset va ahí ni de
  qué tipo es, según la regla dura de `landing-context.md` §7b.

---

## Implementación

### Archivos creados

- `src/components/LandingPage/AssetPlaceholder.tsx` — Server Component, placeholder con
  borde discontinuo + icono `ImageOff` + etiqueta de clasificación Tipo 1/2/3 y descripción.
- `src/components/LandingPage/ScrollReveal.tsx` — Client Component, wrapper `framer-motion`
  (`whileInView`, `viewport={{ once: true }}`), usa `useReducedMotion` para omitir la
  animación cuando el usuario tiene activado "reducir movimiento".
- `src/components/LandingPage/HowItWorks.tsx` — Server Component, 3 pasos numerados con icono
  (Captura/lonja → Producción/stock → Venta), namespace `Landing.howItWorks`.
- `src/components/LandingPage/PricingPreview.tsx` — Server Component, 3 tarjetas (Esencial /
  Profesional destacado con badge "Más popular" / Empresas), sin cifras, CTA con `href="#lead-form"`
  y comentario `TODO Fase C` junto a la línea.

### Archivos modificados

- `src/components/LandingPage/Hero.tsx` — un único CTA ("Ver demo"), mockup central sustituido
  por `AssetPlaceholder` Tipo 2, eliminadas las 3 tarjetas flotantes y `handleScrollToModules`/
  `MODULES_SECTION_ID`. Recoloreado a `bg-background`/`text-foreground`/`bg-primary`; onda
  decorativa de fondo conservada pero recoloreada a `text-foreground` con opacidad baja (antes
  `text-sky-600`/`text-sky-400`).
- `src/components/LandingPage/ModulesBento.tsx` — cada una de las 5 `Card` añade un
  `AssetPlaceholder` Tipo 3 con el texto del prompt correspondiente de `landing-context.md` §5;
  iconos recoloreados de `bg-sky-100/text-sky-600` a `bg-muted/text-foreground`; cada tarjeta
  envuelta en `ScrollReveal` con `delay` escalonado.
- `src/components/LandingPage/IntegratedLonjas.tsx` — recoloreado a tokens (`text-foreground`/
  `text-muted-foreground`), logos envueltos en `ScrollReveal` + clase `grayscale` para que los
  logos de lonjas (a color) no rompan la paleta monocroma de la sección.
- `src/components/LandingPage/TrustBadge.tsx` — recoloreado (`bg-sky-100`/`text-sky-600` →
  `bg-muted`/`text-foreground`), envuelto en `ScrollReveal`.
- `src/components/LandingPage/LeadCaptureForm.tsx` — sección recoloreada de `bg-sky-500` a
  `bg-invert` (token de alto contraste ya existente en `globals.css`, pensado exactamente para
  esta necesidad: una banda oscura consistente en claro/oscuro). Añadido `id="lead-form"` a la
  `<section>`. Lógica de RHF/Zod/honeypot/servicio **sin cambios**.
- `src/components/LandingPage/Footer.tsx` — de `bg-slate-900`/`bg-sky-500` a `bg-invert`/
  `bg-invert-foreground` (mismo token que `LeadCaptureForm`, footer y CTA final comparten la
  misma banda de alto contraste).
- `src/app/[locale]/page.tsx` — nuevo orden de composición: `Hero → ModulesBento → HowItWorks →
  IntegratedLonjas → TrustBadge → PricingPreview → LeadCaptureForm → Footer`; eliminado el
  import de `ProductShowcase`.
- `src/messages/es/landing.json` — copy reescrito en `hero`/`modules.*`/`integratedLonjas`/
  `trustBadge`/`leadForm`/`footer` nombrando problemas reales del sector (trazabilidad, lotes,
  caducidad, lonjas) en vez de frases genéricas; namespaces nuevos `howItWorks` y
  `pricingPreview`; namespace `productShowcase` eliminado; claves `ctaFeatures`/`floating*` de
  `hero` eliminadas (ya no las usa ningún componente).

### Archivos eliminados

- `src/components/LandingPage/ProductShowcase.tsx` (99 líneas) — retirado como sección
  independiente; sus 4 capturas quedaban cubiertas por los 5 mockups nuevos del bento (ver
  decisión "B2 — Estructura de home confirmada" en `landing-proposal.md` §8).

### Decisiones tomadas durante la implementación

- **Token `--invert`/`--invert-foreground`** (ya definido en `globals.css`, sin usar en ningún
  otro punto de la landing hasta ahora) se usó para `Footer` y `LeadCaptureForm` — ambas
  secciones necesitaban una banda de alto contraste consistente en claro/oscuro, y ese token ya
  existe exactamente para ese caso ("High-contrast surface" en `design-context.md` §1). No se
  inventó ningún valor nuevo, se reutilizó un token ya documentado que no estaba en uso en la
  landing.
- **Onda decorativa del Hero:** en vez de eliminarla junto con el resto de acentos `sky-*`, se
  conservó recoloreada a `text-foreground` con opacidad muy baja (`opacity-[0.04]`) — mantiene
  el motivo de marca (olas) sin introducir color, y no estaba entre lo que Jose pidió eliminar
  explícitamente (solo pidió quitar el segundo CTA y las tarjetas flotantes).
- **Nombres de niveles de `PricingPreview`** ("Esencial"/"Profesional"/"Empresas"): al no haber
  nombres de plan ya confirmados por Jose, se usó nomenclatura genérica de sector B2B en vez de
  inventar cifras o características específicas — no es una afirmación verificable (a
  diferencia de precios/certificaciones), es texto de sección "preview" pensado para que Jose lo
  ajuste antes de publicar.
- **Logos de `IntegratedLonjas` en `grayscale`:** los PNG de los logos reales no se retocaron
  (fuera de alcance, son Tipo 1 ya reales y correctos), pero se añadió `className="grayscale"`
  al contenedor para que no rompan la paleta monocroma de la sección — mismo objetivo del GAP
  sin tocar los archivos de imagen.

### Desviaciones del plan (si las hay)

Ninguna respecto a los archivos listados en el GAP. Único ajuste de formato: `Footer.tsx`
requirió una pasada de `prettier --write` tras la primera edición (line-wrap de una línea larga
de JSX), sin cambio de contenido.

### Verificación realizada

- `npm run type-check` — limpio (exit 0).
- `npm run lint` — 268 warnings preexistentes (0 en los archivos nuevos/modificados de este
  GAP, confirmado con `grep` sobre el output completo), 0 errores.
- `npx prettier --check` sobre los 12 archivos de este GAP — 1 archivo con formato incorrecto
  (`Footer.tsx`), corregido con `--write` y re-verificado (`type-check`/`lint` limpios tras el
  fix).
- Servidor de desarrollo real (`NEXT_PUBLIC_APP_BRANDING=pesquerapp npm run dev`), verificado
  por `curl`:
  - `GET /` → 200. `grep -o "sky-[a-z0-9]*"` sobre el HTML servido → **0 resultados** (cero
    clases `sky-*` restantes).
  - Presencia confirmada en el HTML: `HowItWorks` (3 pasos), `PricingPreview` (3 tarjetas,
    "Más popular", CTA "Ver planes"), 6 `AssetPlaceholder` con su texto de clasificación
    (`Tipo 2 · mockup manual` en Hero; `Tipo 3 · bento illustration (IA)` en las 5 tarjetas de
    `ModulesBento`, cada uno con el texto de prompt correcto), `id="lead-form"` presente,
    JSON-LD `Organization`+`SoftwareApplication` presentes, `<title>` correcto.
  - `grep` de cifras/certificaciones inventadas (`ISO 27001`, `99.9%`, `4.9/5`, precios en €)
    sobre el HTML servido → **0 resultados**.
  - `ProductShowcase` no aparece en ningún punto del HTML servido (confirmado por `grep -c`).
  - **Sin regresión:** `GET /legal/privacy` → 200, `GET /legal/terms` → 200,
    `GET /sitemap.xml` → 200, `GET /robots.txt` → 200, `GET /` con `Host: dev.localhost:3000`
    (subdominio de tenant) → 200 sin ninguna clase `sky-*`/`LoginPage` rota (mismo shell de
    `Loader` que antes de este GAP, sin cambios de B1).
  - `POST /api/landing/lead` con email inválido → 400 con `{"userMessage":"Introduce un email
    válido"}` — confirma que la lógica de `LeadCaptureForm`/`landingLeadService`/
    `landingLeadSchema` de GAP-119 sigue intacta tras el restyle.
- **Limitación honesta heredada:** no hay Playwright/navegador headless en este entorno, así
  que la animación real de `ScrollReveal` (entrada al hacer scroll) y el aspecto visual final
  de los placeholders/tarjetas no se han visto en un navegador real con ojos humanos — se
  verificó por `curl`/lectura de código que el HTML/CSS correcto se sirve, no el resultado
  visual percibido. Recomiendo a Jose una pasada visual real (`npm run dev`) antes de encargar
  el GAP de assets de seguimiento, para confirmar que la dirección visual monocroma resultante
  es la esperada antes de invertir en producir los assets finales.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 9/10 — los 12 criterios de aceptación verificados con servidor de desarrollo
real (no solo lectura de código), cero regresión sobre GAP-119/GAP-120, cero clase `sky-*`
residual. Resto un punto por dos observaciones menores no bloqueantes (ver abajo).

### Checklist de criterios de aceptación (verificado archivo por archivo y con `curl` sobre el
servidor de desarrollo real, no solo por el reporte del implementador)

- [x] Hero muestra un único CTA ("Ver demo") y un único mockup central (`AssetPlaceholder`
      Tipo 2) — confirmado leyendo `Hero.tsx` y por el HTML servido: sin segundo botón, sin
      tarjetas flotantes en el DOM.
- [x] `ModulesBento` renderiza 5 tarjetas con icono monocromo + `AssetPlaceholder` Tipo 3 con
      el texto de prompt correspondiente — confirmado en el HTML servido (los 5 textos
      coinciden con `landing-context.md` §5).
- [x] `HowItWorks.tsx` existe, renderizado entre `ModulesBento` e `IntegratedLonjas` — confirmado
      en `[locale]/page.tsx` y en el HTML servido (3 pasos con los títulos correctos).
- [x] `ProductShowcase.tsx` eliminado; `grep -rn "ProductShowcase" src/` no devuelve resultados;
      namespace `productShowcase` ausente de `landing.json`.
- [x] `PricingPreview.tsx` existe con 3 niveles sin cifras, CTA con `href="#lead-form"` y el
      comentario `TODO Fase C` en la línea anterior (`PricingPreview.tsx:38`).
- [x] `LeadCaptureForm` tiene `id="lead-form"` en la `<section>`; lógica de RHF/Zod/honeypot sin
      cambios — confirmado por diff (solo clases) y por `curl POST /api/landing/lead` con email
      inválido → 400 con el mismo `userMessage` que GAP-119.
- [x] `grep -rln "sky-"` sobre `src/components/LandingPage/` y `src/app/[locale]/` → sin
      resultados. También verificado sobre el HTML servido (`grep -o "sky-[a-z0-9]*"` → 0).
- [x] Home renderiza con tokens semánticos (`--background`/`--foreground`/`--muted`/`--primary`)
      con variante oscura ya definida en `globals.css` — sin fijar un único tema.
- [x] Cada `ScrollReveal` usa `useReducedMotion` de `framer-motion` y renderiza sin animación
      cuando está activo — confirmado leyendo `ScrollReveal.tsx:14-16`.
- [x] `landing.json`: copy reescrito nombrando problemas reales de sector (trazabilidad, lotes,
      caducidad, lonjas) en `hero`/`modules.*`/`leadForm`/etc.; namespaces `howItWorks` y
      `pricingPreview` presentes; `productShowcase` ausente; `ctaFeatures`/`floating*` ausentes
      de `hero`.
- [x] `grep` de "ISO", "99.9%", "4.9/5", precios en € sobre el HTML servido → 0 resultados.
- [x] `npm run type-check` y `npm run lint` — re-ejecutados por mí, exit 0 ambos, 0 errores,
      0 warnings nuevos en los archivos de este GAP (268 preexistentes, verificado con `grep`
      que ninguno cae en `LandingPage/`, `[locale]/page.tsx` ni `landing.json`).

### Checklist técnico del proyecto

- [x] Sin `fetch()` directo — `grep -rn "fetch("` sobre los 12 archivos del GAP → 0 resultados.
- [x] Sin hardcode de tenant/`X-Tenant` — N/A, landing pública, confirmado sin resultados.
- [x] Sin archivos `.js` nuevos — los 4 archivos nuevos son `.tsx`; `landing.json` es datos, no
      código. `git status` confirma que no se creó ningún `.js`.
- [x] Sin `any` sin justificación — `grep -rn ": any\|as any"` sobre los archivos del GAP → 0.
- [x] `useLabelEditor.ts`/`entitiesConfig.js` no tocados — N/A a este GAP, confirmado.
- [x] Patrones de `.claude/rules/` respetados — Server/Client Components correctamente
      separados (`ScrollReveal`/`Hero`/`LeadCaptureForm` son los únicos `'use client'`, con
      comentario explicativo en cada uno; el resto son Server Components async con
      `getTranslations`).
- [x] Nomenclatura correcta — componentes PascalCase, namespaces de traducción camelCase.
- [x] `queryKeys` de factories — N/A, sin TanStack Query en este GAP (contenido estático).
- [x] Loading states con Skeleton — N/A, sin fetching de datos nuevo.
- [x] Errores de API — N/A, `LeadCaptureForm` no cambió su manejo de errores.

### Revisión Visual

- [x] Color: solo tokens (`bg-background`, `text-foreground`, `bg-muted`, `bg-primary`,
      `text-primary-foreground`, `bg-invert`/`bg-invert-foreground`, `bg-muted-foreground`) —
      cero hex/rgb/oklch hardcodeado (`grep` confirmado), cero clase `sky-*` residual.
- [x] Tipografía: escala consistente con lo ya usado en B1 (`text-3xl`/`text-xl`/`text-sm`), sin
      cambios de familia tipográfica.
- [x] Layout: coincide con el orden acordado en el UI Brief (Hero → ModulesBento → HowItWorks →
      IntegratedLonjas → TrustBadge → PricingPreview → LeadCaptureForm → Footer), verificado en
      `[locale]/page.tsx`.
- [x] Componentes: usa los componentes listados en el UI Brief (`Card`, `Button`, `Badge`,
      `AssetPlaceholder`, `ScrollReveal`) sin sustituciones no señaladas.
- [x] Sin `style={{ }}` inline — confirmado (`grep` sin resultados).
- [x] Sin colores hardcodeados (`text-[#xxx]`/`bg-[#xxx]`) — confirmado sin resultados.
- [x] Placeholders siempre con su clasificación visible (`AssetPlaceholder` muestra "Tipo N ·
      descripción" en todos los casos) — regla dura de `landing-context.md` §7b cumplida.
- [x] Mobile: `ModulesBento`/`PricingPreview`/`HowItWorks` apilan verticalmente por defecto
      (`sm:grid-cols-*`, sin columnas en mobile) — sin scroll horizontal de tarjetas, cumple
      `landing-proposal.md` §4.4.

**Observación 1 (menor, no bloqueante):** `Footer.tsx` y `LeadCaptureForm.tsx` reutilizan el
token `--invert`/`--invert-foreground` para una banda de alto contraste fija en ambos temas —
es una decisión razonable (el token existe exactamente para esto y no estaba en uso), pero no
estaba explícita en el GAP ni en `landing-context.md` como patrón a seguir para estas dos
secciones. Documentado ya en la sección "Decisiones tomadas durante la implementación" del
propio GAP — no lo considero una desviación problemática, solo señalo que valdría la pena
confirmarlo visualmente con Jose antes de repetir el patrón en Fase C/D.

**Observación 2 (menor, no bloqueante):** el `<a href="#lead-form">` dentro de `Button asChild`
en `PricingPreview.tsx` es una navegación de ancla simple (scroll nativo del navegador, sin
`scrollIntoView` con `behavior: 'smooth'`) — a diferencia del scroll suave que tenía el Hero
original en B1. No es un defecto (un ancla `#` con scroll nativo es un patrón válido y más
simple), pero el salto será instantáneo en vez de suave. No bloqueante — mencionado por
completitud, ya que es observable en un navegador real.

### Revisión UX — Light (decisión razonada, no Full)

Este GAP reordena secciones, retira una (`ProductShowcase`), añade dos (`HowItWorks`,
`PricingPreview`) y restylea el resto — pero no introduce ningún flujo nuevo de 2+ pasos, no
toca una entidad primaria del ERP, no añade formulario/modal/wizard nuevo (el único formulario,
`LeadCaptureForm`, mantiene su lógica exacta de GAP-119), no modifica routing/navegación
(el orden de secciones dentro de la misma página no es "navegación" en el sentido del criterio),
y no toca permisos por rol (landing pública, sin roles). Corresponde Light, no Full.

```
UX REVIEW — LIGHT
═════════════════
GAP: GAP-121 — Landing Fase B2: sistema visual monocromo + bento + assets
Mode: Light (visual/estructural, sin flujo nuevo de usuario)

[x] El cambio es autoexplicativo para el usuario — nueva estructura de secciones es
    contenido de lectura, sin decisión nueva que tomar
[x] No introduce una decisión nueva del usuario sin affordance adecuado — los 2 CTAs
    nuevos ("Ver planes", ancla a lead-form) usan el mismo patrón de botón ya existente
[x] Consistente con la UI circundante — misma paleta de tokens en las 8 secciones,
    mismo componente Card/Button en toda la página
[x] Estados interactivos (hover/focus/active) — heredados de los componentes shadcn
    (`Button`, `Card`) sin overrides que los rompan
[x] Tono del texto — copy nuevo sigue el criterio de landing-context.md §4.3 (vocabulario
    de sector: lonjas, lotes, trazabilidad, caducidad) de forma consistente en las 8 secciones

VERDICT: ✅ APROBADO
```

### System Learner check

**PL CANDIDATE 1:** el token `--invert`/`--invert-foreground` (definido en `globals.css`,
pensado para "surface de alto contraste") no tenía ningún uso real en el proyecto hasta este
GAP. Vale la pena documentarlo en `design-context.md` §1 con un ejemplo de uso real (footer/CTA
de landing) para que futuros GAPs lo encuentren en vez de recrear el mismo efecto con clases
`bg-slate-900`/`bg-gray-900` hardcodeadas, como hacía la versión anterior de `Footer.tsx`.

**PL CANDIDATE 2:** el patrón `AssetPlaceholder` (placeholder con clasificación Tipo 1/2/3
visible) creado en este GAP es genérico y reutilizable para cualquier vista futura (no solo
landing) que necesite lanzar un layout antes de tener el asset final. Vale la pena mencionarlo
en `.claude/landing-context.md` §7b como el componente de referencia a reutilizar, para que el
GAP de assets de seguimiento (y cualquier GAP futuro similar) no reinvente el mismo patrón.

### Observaciones para Jose

La implementación cumple los 12 criterios de aceptación del GAP, verificados no solo leyendo
código sino levantando el servidor de desarrollo real y confirmando por `curl`: cero clases
`sky-*` restantes, las 2 secciones nuevas (`HowItWorks`, `PricingPreview`) renderizando en el
orden correcto, los 6 placeholders con su clasificación Tipo 1/2/3 visible y el texto de prompt
correcto, cero cifras/certificaciones inventadas, y cero regresión sobre lo entregado por
GAP-119 (formulario de leads con su lógica exacta) y GAP-120 (legal, sitemap, robots, subdominio
de tenant, generic branding).

Dos observaciones menores, ninguna bloqueante (ver detalle en Revisión Visual arriba):
1. El token `--invert` se reutilizó para `Footer`/`LeadCaptureForm` — decisión razonable pero
   nueva, vale la pena que le eches un vistazo visual.
2. El CTA de `PricingPreview` hace scroll nativo (instantáneo) al formulario de leads, no scroll
   suave — se puede añadir después si se prefiere la consistencia con el scroll que tenía el
   Hero original.

Lo que está especialmente bien resuelto: la eliminación de `ProductShowcase` en vez de
migrarlo 1:1 evita duplicar el mismo producto dos veces en la misma página (una vez en el bento,
otra vez en capturas apiladas) — la página queda más corta y más alineada con el objetivo
"Apple clean" que si se hubiera mantenido todo. El componente `AssetPlaceholder` deja un único
punto de sustitución por imagen para el GAP de seguimiento, con la clasificación de tipo siempre
visible tal y como exige la regla dura de `landing-context.md` §7b.

**Pendiente real heredado, sin cambios:** sigue sin haber verificación visual humana en un
navegador real (ni en GAP-119, ni en GAP-120, ni en este) — toda la verificación de este GAP es
por `curl`+ lectura de código. Dado que este es el primer GAP que cambia lo que el usuario *ve*
de verdad (no solo arquitectura invisible como B1), recomiendo encarecidamente que le eches un
vistazo visual en `npm run dev` antes de encargar el GAP de assets de seguimiento — es el
momento en el que más vale la pena esa verificación de todo el roadmap hasta ahora.

### Estado final de la implementación

La home pública ahora usa un sistema 100% monocromo (tokens OKLCH, cero `sky-*`) con estructura
Hero → ModulesBento → HowItWorks → IntegratedLonjas → TrustBadge → PricingPreview →
LeadCaptureForm → Footer. Los 6 placeholders de asset (1 Tipo 2 en Hero, 5 Tipo 3 en
ModulesBento) están listos para que un GAP de seguimiento los sustituya uno a uno. El copy fue
reescrito nombrando problemas reales del sector pesquero. `ScrollReveal` aporta scroll-reveal
con `framer-motion` respetando `prefers-reduced-motion` en todas las secciones bento/pasos. Cero
regresión verificada sobre GAP-119 (lógica de leads) y GAP-120 (arquitectura `[locale]`, legal,
sitemap, robots, routing de tenant/dominio raíz).
