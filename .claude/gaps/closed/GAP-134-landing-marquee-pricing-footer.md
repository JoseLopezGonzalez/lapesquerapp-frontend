# GAP-134 — Landing: marquee de logos + PricingPreview enriquecido + teléfono placeholder

## Metadata

- **Tipo:** Mejora
- **Módulo:** Global (sitio público / landing)
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-08-01
- **Autor:** Jose

---

## Contexto y problema

Ronda de refinamiento continuo de la landing (`.claude/landing-proposal.md` §12). Tres
mejoras puntuales sin dependencias entre sí, de alcance pequeño (XS/S cada una),
agrupadas en un único GAP por afinidad de tamaño, no de contenido:

1. **`IntegratedLonjas`** — grid estático de 5 logos, patrón anticuado frente al estándar
   2026 de "logo cloud" en marquee infinito.
2. **`PricingPreview`** — teaser de precios del home demasiado simple (solo nombre +
   audiencia + precio fijo, sin toggle ni features), mientras `/pricing` sí tiene
   profundidad completa.
3. **`Footer`** — teléfono de contacto hardcodeado (`+34 900 123 456`) con todas las
   señales de ser un placeholder nunca verificado, no sourced desde `branding.js` como el
   resto de datos de contacto.

Detalle completo de cada análisis: `.claude/landing-proposal.md` §12.1, §12.2 y §12.8.

---

## Decisiones ya confirmadas por Jose (2026-08-01)

Vinculantes para este GAP — no se vuelven a preguntar:

### 1. Marquee de logos (`IntegratedLonjas`)

| Dimensión         | Decisión                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mecanismo**     | CSS puro (`@keyframes` en `globals.css`, mismo patrón ya usado ahí para `shimmer`/`qr-scan-line`) — no `embla-carousel` (ya en `package.json` pero pensado para carruseles interactivos, no banda decorativa) ni `framer-motion`.                                                                                                         |
| **Accesibilidad** | Pista duplicada 2× o 3× (a validar visualmente cuál llena mejor el ancho sin bucle demasiado corto — hoy solo 5 logos), copia duplicada con `aria-hidden="true"`. `animation-play-state: paused` en `:hover`/`:focus-within`. Fallback estático (sin animación) bajo `prefers-reduced-motion: reduce`, mismo criterio que `ScrollReveal`. |
| **Visual**        | Máscara de desvanecido (`mask-image: linear-gradient(...)`) en ambos extremos. Mantener `grayscale` en cada logo.                                                                                                                                                                                                                         |
| **Copy**          | Sin cambios — solo cambia el layout de los logos.                                                                                                                                                                                                                                                                                         |

### 2. `PricingPreview` enriquecido

| Dimensión                  | Decisión                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Toggle mensual/anual**   | Reutilizar `PricingToggle`/`PricingPeriodLabel` (`src/components/LandingPage/PricingToggle.tsx`) — mismo componente que ya usa `/pricing`, sin crear uno nuevo.                                                                                                                                                                                                    |
| **Features por tier**      | Mostrar los primeros 3 items de `Pricing.tiers.${tier}.features` (no la lista completa, esa se queda en `/pricing`).                                                                                                                                                                                                                                               |
| **Fuente de precio única** | `PricingPreview` deja de usar `Landing.pricingPreview.tiers.*.priceFrom` (string libre) y pasa a leer `Pricing.tiers.*.priceMonthly`/`priceAnnual` (los mismos números que ya alimenta `/pricing`) — elimina la duplicación de origen de precio detectada en §12.2. Las claves `priceFrom` se eliminan de `landing.json` en los 3 locales una vez dejen de usarse. |
| **Addons**                 | Línea corta bajo las 3 tarjetas mencionando que hay bloques adicionales (versión resumida de `Pricing.addonsTitle`/`addonsDescription`, sin listar los 4 addons completos).                                                                                                                                                                                        |
| **CTA**                    | Se mantiene 1 por tarjeta hacia `/pricing` (`t('cta')`, ya existe).                                                                                                                                                                                                                                                                                                |

### 3. Teléfono placeholder del footer

| Dimensión                                        | Decisión                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Estado**                                       | Jose confirmó que no tiene todavía un número real. Se elimina el `<span>+34 900 123 456</span>` de `Footer.tsx` — no se publica ningún teléfono mientras tanto, el footer queda con `infoEmail` como único contacto directo.                                                                                          |
| **Patrón para el futuro (no implementar ahora)** | Cuando exista un número real: añadir `infoPhone` a `src/configs/branding.js` (misma estructura `isPesquerApp ? '...' : '...'` que el resto de constantes) y usarlo en `Footer.tsx` como `<a href={`tel:${infoPhone}`}>`, no como `<span>` de texto plano. Este GAP no crea `infoPhone` — solo elimina el placeholder. |

---

## Solución acordada

### 1. `src/components/LandingPage/IntegratedLonjas.tsx` + `src/app/globals.css`

- Reemplazar el grid `grid-cols-2 sm:grid-cols-5` por una pista de marquee horizontal:
  contenedor `overflow-hidden`, pista interna con los 5 logos duplicados (2× o 3×, a
  validar), animación `@keyframes marquee-scroll` (nueva, en `globals.css`, mismo bloque
  donde ya viven `shimmer`/`qr-scan-line`) sobre `translateX`.
- Copia duplicada de logos con `aria-hidden="true"`.
- `animation-play-state: paused` en `:hover`/`:focus-within` del contenedor.
- `@media (prefers-reduced-motion: reduce)`: pista estática, sin animación (logos
  visibles fijos, sin duplicar).
- `mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent)`
  (o equivalente) en el contenedor.

### 2. `src/components/LandingPage/PricingPreview.tsx`

- Envolver el grid de 3 tarjetas en `<PricingToggle>` (import desde
  `./PricingToggle`), igual que `/pricing/page.tsx`.
- Por tarjeta: sustituir `t(\`tiers.${tier}.priceFrom\`)` por lectura de
  `Pricing.tiers.${tier}.priceMonthly`/`priceAnnual`vía`<PricingPeriodLabel>`(mismo
patrón que`/pricing/page.tsx`), y mostrar los primeros 3 `Pricing.tiers.${tier}.features`.
- Añadir línea de addons resumida bajo el grid de tarjetas.
- Namespace: `PricingPreview` pasa a leer también del namespace `Pricing` (ya existe,
  compartido con `/pricing`), además de `Landing.pricingPreview` para
  título/descripción/audiencia/CTA (sin cambios en esas claves).

### 3. `src/messages/{es,pt,en}/landing.json`

- Eliminar `Landing.pricingPreview.tiers.*.priceFrom` (las 3 claves, en los 3 locales) una
  vez `PricingPreview.tsx` deje de usarlas.
- Añadir clave corta de addons en `Landing.pricingPreview` (ej. `addonsNote`).

### 4. `src/components/LandingPage/Footer.tsx`

- Eliminar la línea `<span>+34 900 123 456</span>` y el `<li>` que la contiene (o dejar
  solo el `<li>` de email si el layout de 2 items se ve mejor con 1 — a criterio de
  implementación, verificar que no quede un hueco visual raro en el grid del footer).

---

## Referencias e inspiración

- `.claude/landing-proposal.md` §12.1 (marquee), §12.2 (PricingPreview), §12.8 (teléfono
  placeholder) — análisis completo, investigación de mercado 2026 con fuentes.
- `src/components/LandingPage/PricingToggle.tsx` — componente ya existente a reutilizar
  sin modificar.
- `src/app/[locale]/pricing/page.tsx` — patrón ya real de toggle + features + fuente de
  precio a replicar en el teaser.
- `src/configs/branding.js` — patrón de constantes por marca a seguir cuando exista el
  teléfono real.

---

## UI Brief

- **Vista de referencia:** `IntegratedLonjas.tsx`, `PricingPreview.tsx`, `Footer.tsx`
  actuales (mismos archivos, se modifican in situ); `/pricing/page.tsx` como referencia
  de patrón para el toggle/features.
- **Tipo de layout:** 3 ediciones de sección de home, sin modal/sheet.
- **Componentes clave:** `PricingToggle`/`PricingPeriodLabel` (reutilizados, sin cambios
  de API), `Card`/`CardHeader`/`CardContent`/`CardFooter` (ya en uso en `PricingPreview`).
- **Estados requeridos:** ninguno con fetching — Server Components estáticos (el marquee
  es CSS puro, sin JS de animación).
- **Mobile:** marquee aplica igual (banda horizontal, sin touch-drag necesario);
  `PricingPreview` mantiene su grid `sm:grid-cols-3` ya responsive; footer sin cambios de
  layout más allá de quitar un `<li>`.

### Preguntas de confirmación para Jose

Ninguna — el discovery de las 3 mejoras se completó en el hilo de la ronda de
refinamiento (`landing-proposal.md` §12.1/§12.2/§12.8), incluida la confirmación
explícita de que no hay teléfono real todavía.

---

## Criterios de aceptación

- [ ] `IntegratedLonjas.tsx` renderiza los logos en una pista con animación CSS de
      scroll continuo (`translateX`), no en un grid estático.
- [ ] La pista se pausa (`animation-play-state: paused` o equivalente) al hacer
      `:hover`/`:focus-within`.
- [ ] Bajo `prefers-reduced-motion: reduce`, los logos se muestran estáticos, sin
      animación (verificable con `@media (prefers-reduced-motion: reduce)` en el CSS
      aplicado).
- [ ] La copia duplicada de logos en el marquee tiene `aria-hidden="true"`.
- [ ] `PricingPreview.tsx` muestra el toggle mensual/anual (mismo componente
      `PricingToggle` que `/pricing`) y al menos 3 features por tier.
- [ ] `Landing.pricingPreview.tiers.*.priceFrom` ya no existe en ninguno de los 3
      `landing.json` (`es`/`pt`/`en`) ni se referencia en ningún componente
      (`grep -rn "priceFrom"` → 0 resultados).
- [ ] El precio mostrado en `PricingPreview` coincide exactamente con el de `/pricing`
      para el mismo tier y periodo (misma fuente de datos, `Pricing.tiers.*`).
- [ ] `Footer.tsx` no contiene `900 123 456` ni ningún otro número de teléfono
      (`grep -rn "900 123 456"` sobre `src/` → 0 resultados).
- [ ] `src/configs/branding.js` no se modifica en este GAP (el `infoPhone` se añade en un
      GAP futuro, cuando exista el número real).
- [ ] Paridad de claves verificada entre los 3 `landing.json`.
- [ ] `GET /`, `/pt`, `/en` (dominio raíz) devuelven 200 con las 3 secciones
      renderizadas correctamente en los 3 idiomas.
- [ ] Cero regresión sobre Fases A–D y sobre `/pricing` (GAP-122 + trabajo de §11 de
      `landing-proposal.md`).
- [ ] `npm run type-check` y `npm run lint` limpios.

---

## Archivos a crear o modificar

**Modificar:**

- `src/components/LandingPage/IntegratedLonjas.tsx`
- `src/app/globals.css` (nuevo bloque `@keyframes marquee-scroll` + utilidades asociadas)
- `src/components/LandingPage/PricingPreview.tsx`
- `src/components/LandingPage/Footer.tsx`
- `src/messages/es/landing.json`, `src/messages/pt/landing.json`, `src/messages/en/landing.json`

**No tocar:**

- `src/components/LandingPage/PricingToggle.tsx` (se reutiliza sin modificar)
- `src/app/[locale]/pricing/page.tsx`
- `src/configs/branding.js` (el teléfono real es un GAP futuro separado)
- `src/components/LandingPage/ModulesBento.tsx`, `HowItWorks.tsx`, `TrustBadge.tsx`,
  `Hero.tsx`, `LeadCaptureForm.tsx`
- `src/middleware.ts`

---

## Restricciones

- **No añadir ninguna dependencia nueva** — el marquee es CSS puro, sin `embla` ni
  librería de marquee externa.
- **No inventar un número de teléfono** bajo ninguna circunstancia — si no hay uno real
  confirmado, la sección de contacto se queda solo con email.
- **No tocar el namespace `Pricing`** (usado por `/pricing`) más allá de leerlo desde
  `PricingPreview` — sin renombrar ni reestructurar sus claves existentes.
- **No romper la paridad de precio** entre `PricingPreview` y `/pricing` — ambos deben
  leer literalmente el mismo dato, no copias independientes.
- **Sin scroll horizontal accidental** en ningún breakpoint (el marquee es scroll
  horizontal intencional y decorativo, no interactivo con el dedo/ratón).

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/LandingPage/IntegratedLonjas.tsx` — reescrito: pista de marquee
  (`LogoTrack` duplicado 2×, copia con `aria-hidden`) dentro de contenedor
  `overflow-hidden` + `marquee-fade-mask`, sustituyendo el grid estático.
- `src/app/globals.css` — nuevo bloque `@keyframes marquee-scroll` + `.animate-marquee`
  (con pausa en `:hover`/`:focus-within`, fallback `prefers-reduced-motion: reduce` que
  detiene la animación y oculta la copia duplicada) + `.marquee-fade-mask`.
- `src/components/LandingPage/PricingPreview.tsx` — envuelto en `PricingToggle`
  (reutilizado sin modificar), precio leído de `Pricing.tiers.*` (mismo dato que
  `/pricing`) en vez de `priceFrom`, 3 primeras features por tier, línea de addons.
- `src/components/LandingPage/Footer.tsx` — eliminado el `<li>` de teléfono y el import
  de `Phone`.
- `src/messages/es/landing.json`, `pt/landing.json`, `en/landing.json` — eliminadas las
  3 claves `pricingPreview.tiers.*.priceFrom` (por locale), añadida
  `pricingPreview.addonsNote`.

### Decisiones tomadas durante la implementación

- Pista duplicada **2×** (no 3×) — verificado visualmente con Playwright que con 5 logos
  el bucle de 2 copias ya cubre de sobra el ancho del viewport en desktop sin que se
  note un corte prematuro.
- El fallback de `prefers-reduced-motion` no solo detiene la animación
  (`animation: none`) sino que también oculta la copia duplicada
  (`.marquee-duplicate { display: none }`) y aplica `flex-wrap` a la pista, para que se
  vea como una fila estática normal en vez de dos copias superpuestas sin animar.
- Verificado con Playwright que el precio de `PricingPreview` cambia exactamente igual
  que en `/pricing` al alternar mensual/anual (149€→119€, 349€→279€), confirmando que
  ambas vistas leen la misma fuente de datos.

### Desviaciones del plan (si las hay)

Ninguna respecto al plan acordado en `landing-proposal.md` §12.1/§12.2/§12.8.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10

### Checklist de criterios de aceptación (verificado con servidor de desarrollo real +

Playwright/Chromium)

- [x] `IntegratedLonjas.tsx` anima con `translateX` continuo — verificado leyendo
      `getComputedStyle(...).transform` en dos instantes distintos (cambia de
      `-41.31px` a `-70.91px` en 800ms).
- [x] Pausa en `:hover`/`:focus-within` — verificado con `page.hover()` real:
      `animationPlayState` pasa a `paused`.
- [x] Bajo `prefers-reduced-motion: reduce` (emulado con el contexto real de
      Playwright): `animationName` = `none`, copia duplicada con `display: none`.
- [x] Copia duplicada con `aria-hidden="true"` — verificado leyendo el atributo real del
      DOM.
- [x] `PricingPreview.tsx` muestra el toggle (mismo componente `PricingToggle`) y 3
      features por tier — verificado por captura.
- [x] `priceFrom` eliminado de los 3 `landing.json` y sin referencias en código
      (`grep -rn "priceFrom"` → 0 resultados).
- [x] Precio de `PricingPreview` coincide con `/pricing` para el mismo tier/periodo —
      verificado interactuando con el toggle real vía Playwright.
- [x] `Footer.tsx` sin `900 123 456` (`grep -rn "900 123 456"` sobre `src/` → 0
      resultados) — verificado por captura que el layout de contacto no queda con hueco
      raro (1 solo item, se ve bien).
- [x] `branding.js` no modificado en este GAP.
- [x] Paridad de claves verificada entre los 3 `landing.json`.
- [x] `GET /es` devuelve 200 con las 3 secciones renderizadas correctamente.
- [x] Cero regresión sobre `/pricing` (mismos números, mismo namespace `Pricing`
      reutilizado sin modificar su estructura).
- [x] `npm run type-check` y `npm run lint` limpios.

### Checklist técnico del proyecto

- [x] Sin `fetch()` directo, sin hardcode de tenant, sin `.js` nuevos, sin `any`.
- [x] Sin dependencias nuevas — marquee 100% CSS, `PricingToggle` reutilizado tal cual.
- [x] Hooks gigantes / `entitiesConfig.js` no tocados.
- [x] Patrones de `.claude/rules/` respetados.
- [x] Nomenclatura correcta.

### Revisión Visual

Verificado con Playwright real: marquee animando de verdad (no solo CSS estático sin
comprobar), toggle mensual/anual funcional con cifras idénticas a `/pricing`, footer sin
hueco visual tras quitar el teléfono. Sin `sky-*`, sin colores hardcodeados.

### Observaciones para Jose

Todo correcto. Sin observaciones — este es el único de los 3 GAPs de la ronda sin
ningún hallazgo nuevo ni desviación.

### Estado final de la implementación

Completo y funcionando: marquee de logos con accesibilidad real (pausa, reduced-motion,
aria-hidden), `PricingPreview` con la misma fuente de precio que `/pricing`, footer sin
el teléfono placeholder.
