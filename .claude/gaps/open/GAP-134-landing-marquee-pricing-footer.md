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

| Dimensión | Decisión |
|---|---|
| **Mecanismo** | CSS puro (`@keyframes` en `globals.css`, mismo patrón ya usado ahí para `shimmer`/`qr-scan-line`) — no `embla-carousel` (ya en `package.json` pero pensado para carruseles interactivos, no banda decorativa) ni `framer-motion`. |
| **Accesibilidad** | Pista duplicada 2× o 3× (a validar visualmente cuál llena mejor el ancho sin bucle demasiado corto — hoy solo 5 logos), copia duplicada con `aria-hidden="true"`. `animation-play-state: paused` en `:hover`/`:focus-within`. Fallback estático (sin animación) bajo `prefers-reduced-motion: reduce`, mismo criterio que `ScrollReveal`. |
| **Visual** | Máscara de desvanecido (`mask-image: linear-gradient(...)`) en ambos extremos. Mantener `grayscale` en cada logo. |
| **Copy** | Sin cambios — solo cambia el layout de los logos. |

### 2. `PricingPreview` enriquecido

| Dimensión | Decisión |
|---|---|
| **Toggle mensual/anual** | Reutilizar `PricingToggle`/`PricingPeriodLabel` (`src/components/LandingPage/PricingToggle.tsx`) — mismo componente que ya usa `/pricing`, sin crear uno nuevo. |
| **Features por tier** | Mostrar los primeros 3 items de `Pricing.tiers.${tier}.features` (no la lista completa, esa se queda en `/pricing`). |
| **Fuente de precio única** | `PricingPreview` deja de usar `Landing.pricingPreview.tiers.*.priceFrom` (string libre) y pasa a leer `Pricing.tiers.*.priceMonthly`/`priceAnnual` (los mismos números que ya alimenta `/pricing`) — elimina la duplicación de origen de precio detectada en §12.2. Las claves `priceFrom` se eliminan de `landing.json` en los 3 locales una vez dejen de usarse. |
| **Addons** | Línea corta bajo las 3 tarjetas mencionando que hay bloques adicionales (versión resumida de `Pricing.addonsTitle`/`addonsDescription`, sin listar los 4 addons completos). |
| **CTA** | Se mantiene 1 por tarjeta hacia `/pricing` (`t('cta')`, ya existe). |

### 3. Teléfono placeholder del footer

| Dimensión | Decisión |
|---|---|
| **Estado** | Jose confirmó que no tiene todavía un número real. Se elimina el `<span>+34 900 123 456</span>` de `Footer.tsx` — no se publica ningún teléfono mientras tanto, el footer queda con `infoEmail` como único contacto directo. |
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
  `Pricing.tiers.${tier}.priceMonthly`/`priceAnnual` vía `<PricingPeriodLabel>` (mismo
  patrón que `/pricing/page.tsx`), y mostrar los primeros 3 `Pricing.tiers.${tier}.features`.
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
