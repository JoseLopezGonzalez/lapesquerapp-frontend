# La PesquerApp — Landing: Diagnóstico, Comparativa y Propuesta (Fase 2)

> Documento vivo. Estado de la iniciativa de rediseño de la landing pública:
> diagnóstico, comparativa de mercado 2026, propuesta completa por área,
> producción de assets y roadmap con estado por fase.
> Complementa a `.claude/landing-context.md` (marca, decisiones bloqueadas,
> investigación) — este archivo es el plan de ejecución sobre esa base.
> Última actualización: 2026-07-27. Retomable desde cualquier sesión de
> Claude Code en este repo — no depende de ningún link externo.

---

## Estado de la iniciativa

| Fase | Nombre | Estado | Tamaño |
|---|---|---|---|
| 0 | Contexto + equipo de agentes | ✅ Completada 2026-07-27 | — |
| 1 | Diagnóstico + comparativa + propuesta (este documento) | ✅ Completada 2026-07-27 | — |
| A | Detener la sangría (CTAs rotos, claims falsos, sitemap/robots) | ✅ GAP-119 cerrado (2026-07-28, ⚠️ aprobado con observaciones ya resueltas) | S |
| B | Rediseño core de la home (componentización, sistema visual, `[locale]`) | ⬜ Pendiente | L |
| C | Pricing + Legal + PT/EN | ⬜ Pendiente (páginas legales mínimas ya adelantadas en GAP-119, ver nota) | M |
| D | Blog + GEO/AEO | ⬜ Pendiente | M |
| E | Analítica + cadencia trimestral continua | ⬜ Pendiente | S |

**Estado de la Fase A:** implementada y auditada. `.claude/gaps/closed/GAP-119-landing-fase-a-detener-sangria.md`
cubre CTAs rotos, badges de confianza falsos, formulario de leads funcional (email vía
Resend, con capa de servicio dedicada), `/legal/privacy` + `/legal/terms` mínimas
(adelantadas desde Fase C por el riesgo RGPD del formulario), `sitemap.ts`/`robots.ts`
y copyright dinámico. Veredicto: técnico ✅, visual ✅, UX ⚠️ (7/10, fricciones de
accesibilidad en el formulario ya corregidas post-cierre). Pendiente real: sin
Playwright/navegador headless en este entorno, nadie ha podido confirmar visualmente el
resultado en un navegador real — Jose debería darle un vistazo antes de considerar la
Fase A 100% cerrada. `/legal/cookies` y la traducción PT/EN de las páginas legales
siguen en Fase C.

**Próxima acción recomendada:** verificación visual manual de la Fase A por parte de
Jose, y luego decidir si se arranca el diseño de la Fase B (rediseño visual completo,
componentización real) vía `gap-discovery`.

---

## 1. Resumen ejecutivo

La landing actual es funcionalmente una demo interna que nunca se terminó: dos de
sus botones no hacen nada, no existe página de precios ni legales, no hay forma de
que Google ni una IA generativa entiendan qué es el producto, y tres de sus
afirmaciones de confianza (certificación ISO 27001, 99.9% de disponibilidad,
valoración 4.9/5) no están respaldadas por nada verificable. Al mismo tiempo, la
base es sana: hay cinco módulos de producto reales y diferenciados, una identidad
de marca coherente sin explotar (icono monocromo, tipografía Geist), y una
dirección visual concreta y validada por Jose (referencia Pinterest: bento grid +
mockups de componentes aislados, estilo Apple, monocromo puro).

La propuesta no es "más landing" — es una landing que **muestra el producto real**
en vez de describirlo, que **no afirma nada que no se pueda defender**, y que está
construida para que tanto Google como ChatGPT/Perplexity puedan encontrarla y
citarla ante quien busque un ERP para el sector pesquero.

---

## 2. Diagnóstico actual (auditoría 2026-07-27)

### Bloqueante

- El CTA "Ver características" no tiene `onClick` — no hace nada.
  (`src/components/LandingPage/index.js`)
- El formulario "Solicitar acceso" no tiene `onSubmit` — captura cero leads pese a
  ser el CTA de conversión final. (`src/components/LandingPage/index.js`)
- "Certificación ISO 27001", "99.9% de disponibilidad" y rating "4.9/5" se muestran
  como hechos sin ningún respaldo verificable. (`src/components/LandingPage/index.js`)
- "Aviso Legal" y "Política de Privacidad" enlazan a `#` — no existen las páginas,
  riesgo de cumplimiento RGPD. (Footer)
- Cero `sitemap.ts`, `robots.ts` o JSON-LD en todo el proyecto — Google indexa a
  ciegas, ninguna IA generativa puede citar la marca con datos estructurados.

### Importante

- `page.js` es Client Component — no puede exportar `metadata` propia, toda la SEO
  depende del layout raíz genérico.
- Imágenes PNG de 180–320KB sin AVIF/WebP configurado; varios `<Image>` piden
  resoluciones muy superiores al tamaño real renderizado.
- Cero analítica de conversión — no hay forma de saber qué funciona hoy ni de medir
  el impacto del rediseño.
- Todo el contenido vive en un único componente de 501 líneas sin descomponer —
  cualquier cambio futuro es más lento y arriesgado de lo necesario.
- Input de email del CTA final sin `<label>` asociado; iconos decorativos sin
  `aria-hidden`.

### Aprovechable — no partimos de cero

- **Cinco módulos reales y diferenciados**: producción/trazabilidad, stock/almacén,
  compras/ventas, extracción IA de documentos de lonja, editor de etiquetas —
  material de sobra para un bento grid sin inventar nada.
- **Marca ya coherente**: icono monocromo propio, tipografía Geist ya integrada vía
  `next/font`, sistema de tokens OKLCH neutro ya en producción en el resto de la app.
- **`next/image` ya en uso**: todas las imágenes actuales usan `next/image` con
  `alt` — falta configuración, no falta adopción.
- **`framer-motion` ya instalado**: cero peso adicional para introducir
  micro-animaciones con propósito en el rediseño.

---

## 3. Comparativa con el mercado 2026

Referencias: Linear, Vercel, Stripe, Notion, Airtable (pricing y diseño);
benchmarks de conversión de investigación de mercado 2026 sobre B2B SaaS.

| Dimensión | PesquerApp hoy | Estándar 2026 | Propuesta |
|---|---|---|---|
| Hero | Mockup estático + 2 CTAs, uno roto | Producto legible en 3–5s; un solo CTA dominante (13.5% vs 10.5% de conversión frente a multi-CTA) | Bento hero con mockup real estilizado del dashboard + un único CTA "Ver demo" |
| Prueba social | 5 logos sin contexto + rating no verificado (comentado en el propio código) | Casos reales, cifras verificables, vídeo o cita nominal | Testimonios reales que aporte Jose; sin rating hasta tener reseñas reales |
| Pricing | Inexistente — solo "solicitar acceso" | Transparencia en tiers self-serve; "contactar ventas" reservado a enterprise | Página `/pricing`, 3 niveles + FAQ — cifras pendientes de confirmar con Jose |
| SEO técnico | Sin sitemap/robots/JSON-LD, metadata genérica | `sitemap.ts` + `robots.ts` + JSON-LD desde Server Components | Los tres implementados; `Organization` + `SoftwareApplication` schema |
| GEO/AEO | Sin blog, sin contenido citable | Respuesta directa en las primeras ~200 palabras; contenido estructurado para extracción por IA | Blog con clusters de nicho pesquero |
| Multiidioma | Solo español, sin infraestructura | Segmento `[locale]`, `hreflang`, namespaces de traducción | `next-intl` + `[locale]` desde el día uno — ES/PT/EN |
| Analítica | Ninguna (solo Speed Insights, que mide performance no conversión) | Cookieless o consent-gated — GA4 pierde ~44% del tráfico real por rechazos de consentimiento en estudios independientes | Analítica cookieless sin banner |
| Performance imágenes | PNG 180–320KB, sin AVIF/WebP, sobre-dimensionadas | AVIF/WebP automático, dimensiones ajustadas al render real | `next.config.mjs images.formats` + auditoría de tamaños con `landing-auditor` |

---

## 4. Propuesta por área

### 4.1 Arquitectura de páginas

```
/[locale]/                 Home
/[locale]/pricing          Planes y precios
/[locale]/about            Sobre nosotros
/[locale]/blog             Índice de contenido
/[locale]/blog/[slug]      Artículo
/[locale]/legal/privacy    Política de privacidad
/[locale]/legal/terms      Términos y condiciones
/[locale]/legal/cookies    Política de cookies
```

El login por subdominio de tenant (`{tenant}.lapesquerapp.es`) queda exactamente
igual — no forma parte de este árbol.

### 4.2 Sistema visual — monocromo, bento, producto real

Paleta estrictamente neutra (los tokens ya existentes en `design-context.md`:
`--background`, `--foreground`, `--primary`, `--muted`, `--border`), cero acento
de color nuevo. Los únicos colores no neutros permitidos son los semantic tokens
ya existentes, y solo para su uso semántico (nunca decorativo).

Estructura de la home:
1. **Hero** — titular + subtítulo + un único CTA + mockup real estilizado del
   dashboard, sin segundo CTA compitiendo.
2. **Bento de módulos** — 5 tarjetas (una por módulo real), cada una con un mockup
   aislado de un componente real de la app, no descripciones abstractas.
3. **Bloque "cómo funciona"** — 3 pasos concretos del flujo real (captura/lonja →
   producción/stock → venta), no genérico.
4. **Prueba social** — testimonios reales (pendiente de que Jose pase
   nombre/empresa/cita) + logos de lonjas ya integradas.
5. **Pricing preview** — resumen de 3 niveles con link a `/pricing` completo.
6. **CTA final** — un único formulario funcional, con `onSubmit` real conectado a
   un endpoint de leads.
7. **Footer** — enlaces reales a legal, blog, contacto; copyright dinámico (año
   actual, no hardcodeado).

La landing no hereda la densidad operativa del ERP (`design-context.md`: "chrome
mínimo, densidad alta" es una regla del ERP, no de aquí). Aquí el espacio en
blanco es una herramienta de conversión: cada sección respira, la tipografía Geist
gana peso y tamaño, y el mockup de producto siempre es el elemento con más
presencia visual de su sección.

### 4.3 Copy y mensajería

El copy actual mezcla un producto real y concreto ("Producción ∷ Compras ∷ Ventas
∷ Etiquetado ∷ Trazabilidad") con frases de relleno genérico ("el futuro de la
gestión pesquerapp", con minúscula inconsistente). La propuesta es ir hacia lo
primero en toda la página:

- **Titular**: nombrar el problema real del sector (trazabilidad, lotes,
  caducidad, lonjas) en vez de "gestión total" genérico.
- **Cada tarjeta de módulo**: una frase de resultado concreto ("controla stock por
  lote y caducidad", no "gestión de almacén de nivel profesional").
- **CTA final**: texto específico de la acción ("Solicitar demo", "Ver planes") en
  vez de "Solicitar acceso" genérico.
- **Vocabulario de sector correcto**: lonjas, maquiladores, fresco/congelado,
  lotes — verificado contra el conocimiento de dominio del proyecto.

Esta reescritura es trabajo de `landing-content-writer` una vez arranque la
implementación — aquí se define el criterio, no el texto final.

### 4.4 Pricing

Patrón dominante 2026 (Linear, Stripe, Airtable): 3 niveles, toggle
mensual/anual, "más popular" destacado, tabla comparativa de funcionalidades,
FAQ, nivel enterprise en "contactar ventas". Mobile: niveles apilados
verticalmente, nunca scroll horizontal.

> Ninguna cifra de precio se publica sin que Jose la confirme explícitamente — es
> la misma regla de honestidad que ya bloqueó el rating falso y el ISO 27001. La
> estructura de la página se puede construir ya; los números, no.

### 4.5 SEO técnico

- `src/app/[locale]/sitemap.ts` — generado dinámicamente, incluye todas las
  páginas públicas por idioma.
- `src/app/robots.ts` — permite indexar el sitio público, bloquea explícitamente
  cualquier ruta de tenant/admin si llegara a ser alcanzable.
- JSON-LD `Organization` en el layout raíz del sitio público; `SoftwareApplication`
  en home/pricing; `BlogPosting` en cada artículo — sembrado desde Server
  Components, no disperso en componentes cliente.
- `generateMetadata` por página (posible en cuanto cada página sea Server
  Component) — title/description/OG específicos, no heredados del layout genérico.
- Canonical + `hreflang` alternates entre `es`/`pt`/`en` en cuanto exista el árbol
  `[locale]`.

### 4.6 Blog y GEO/AEO

Cada vez más compradores B2B preguntan directamente a ChatGPT/Perplexity/Gemini
antes de buscar en Google. Optimizar para esto (GEO/AEO) no sustituye al SEO
clásico — lo complementa con la misma base técnica.

**Páginas pilar propuestas (topic clusters):**
- Trazabilidad en la industria pesquera → artículos de normativa, lotes,
  fresco/congelado.
- Gestión de lonjas y compras → extracción de documentos, integración con
  lonjas, control de proveedores.
- Etiquetado y cumplimiento normativo → requisitos legales de etiquetado, casos
  de maquila.

**Regla de redacción:** las primeras ~200 palabras de cada artículo responden la
pregunta principal directamente, sin introducción narrativa previa. Encargado:
`landing-content-writer`.

### 4.7 Multiidioma

- `next-intl` con segmento de ruta `[locale]` a nivel raíz — soporte nativo de
  Server Components en Next.js App Router.
- Namespaces de traducción por sección (hero, pricing, blog...), nunca un fichero
  único gigante.
- `es` como idioma fuente y fallback; `pt`/`en` siempre traducción revisada del
  texto aprobado en español, nunca contenido inventado en el idioma destino.
- `hreflang` + canonical por idioma para no autocompetir en buscadores entre
  versiones.

### 4.8 Analítica y consentimiento

Con sede en España y páginas legales nuevas, cualquier analítica que use cookies
no esenciales necesita consentimiento previo bajo RGPD. Un estudio independiente
citado en la investigación de mercado encontró que GA4 pierde cerca del 44% del
tráfico real por rechazos de consentimiento, además de la fricción del propio
banner.

**Recomendación:** una herramienta cookieless (p. ej. Plausible, hosting en la UE)
que no requiere banner de consentimiento bajo la interpretación habitual del
RGPD/ePrivacy. Si en el futuro se necesita algo más completo (session replay,
feature flags), la alternativa es GA4/PostHog con Consent Mode v2 y banner — pero
implica aceptar la pérdida de precisión de datos.

### 4.9 Performance

- `next.config.mjs` → añadir `images: { formats: ['image/avif', 'image/webp'] }`.
- Cada `<Image>` con `width`/`height` ajustado al tamaño real de render, no a la
  resolución original del archivo fuente.
- Auditoría de peso de imagen como parte fija del checklist de `landing-auditor`.
- `framer-motion`: usarlo con intención (scroll-reveal de los bloques bento) ya
  que está instalado y hoy no aporta nada a la landing.

### 4.10 Accesibilidad

- `<label>` real en el input de email del CTA (hoy solo tiene `placeholder`).
- `aria-hidden="true"` en todos los iconos decorativos de Lucide usados en la
  landing.
- Verificar contraste real de `text-gray-400`/`text-sky-200` sobre sus fondos —
  probablemente insuficiente en WCAG AA, a confirmar con herramienta de contraste
  durante la implementación.
- `<nav>` semántico y landmark `<main>` — hoy la landing no tiene ninguno de los
  dos.

### 4.11 Legal

`/legal/privacy`, `/legal/terms`, `/legal/cookies` — obligatorias en cuanto haya
un formulario que capture datos personales (el CTA de "solicitar demo") y,
doblemente si se opta por analítica con cookies. Contenido a redactar con
criterio legal real, no una plantilla genérica — requiere revisión de Jose antes
de publicar.

---

## 5. Producción de assets visuales

Clasificación real / mockup / prompt de IA, tal y como pidió Jose. Regla completa
en `.claude/landing-context.md §7b`.

### Bloque de estilo base (incluido en todo prompt tipo 3 — bento illustration)

```
Minimalist monochrome UI mockup illustration, strictly black/white/neutral-gray
palette with no color accents, an isolated floating component on a soft
light-gray background, subtle soft shadow, thin clean white line-icon on a
solid black rounded-square badge, Apple-like clean aesthetic, high contrast,
flat design with soft depth, consistent soft lighting from top-left, no text
unless explicitly specified.
```

### Hero — mockup del dashboard (Tipo 2 · mockup manual)

Captura real del dashboard/pedidos con datos de un tenant demo, retocada:
aislada sobre fondo, recortada a la ventana del navegador, sombra suave añadida.
No es una captura cruda pegada — es una captura real tratada visualmente para
que combine con el resto del sistema monocromo.

### Bento de los 5 módulos (Tipo 3 · prompt IA)

**Producción y Trazabilidad**
```
[bloque de estilo base] + depicting a simplified production tracking card with
a fish icon, a batch/lot number tag, and a small progress bar, evoking
traceability from catch to final product.
```

**Almacén y Stock**
```
[bloque de estilo base] + depicting a simplified isometric warehouse grid map
with a few highlighted storage cells and a location pin icon.
```

**Compras y Ventas**
```
[bloque de estilo base] + depicting a simplified invoice/order card with a
checkmark badge and an upward trend arrow icon.
```

**Extracción de PDF con IA**
```
[bloque de estilo base] + depicting a simplified document icon with scan lines
transforming into a structured data table, a small sparkle icon indicating AI
processing.
```

**Editor de Etiquetas**
```
[bloque de estilo base] + depicting a simplified product label mockup with a
barcode and a small printer icon.
```

### Confianza y capturas reales

**Tarjeta de seguridad/confianza** (Tipo 3 · prompt IA)
```
[bloque de estilo base] + depicting a shield icon with a checkmark, evoking
data security — no certification badges, no unverifiable claims depicted.
```

**Panel de Pedidos** (Tipo 1 · captura real) — vista desktop, tenant demo/seed,
6–8 pedidos de ejemplo en estados variados (pendiente, en producción,
finalizado) para que la captura muestre variedad real de estados.

**Editor de etiquetas** (Tipo 1 · captura real) — vista desktop, con una
etiqueta de ejemplo ya diseñada y cargada, no el lienzo vacío.

> Esta lista es representativa de las secciones principales de la home — cada
> GAP de implementación debe incluir la clasificación completa de sus propias
> imágenes siguiendo esta misma regla.

---

## 6. Roadmap priorizado

### Fase A — Detener la sangría (S)
Arreglar los CTAs rotos, quitar las afirmaciones no verificadas, actualizar el
copyright, crear `sitemap.ts`/`robots.ts` básicos. Ninguna de estas piezas
depende del rediseño visual — se pueden cerrar en días, no en semanas, y
detienen el daño activo (leads perdidos, afirmaciones falsas publicadas, cero
indexación).

### Fase B — Rediseño core de la home (L)
Componentización real (Hero/Bento/Footer separados), sistema visual monocromo +
bento, primeros assets tipo 1/2/3, infraestructura `[locale]` con ES como único
idioma publicado todavía.

### Fase C — Pricing + Legal + PT/EN (M)
Página de precios (estructura ya, cifras cuando Jose las confirme), las tres
páginas legales, traducción de todo lo publicado a portugués e inglés,
`hreflang`.

### Fase D — Blog + GEO/AEO (M)
Infraestructura de blog + los primeros artículos de los tres pilares de
contenido, siguiendo la estructura GEO-aware de §4.6.

### Fase E — Analítica + cadencia continua (S)
Analítica cookieless conectada, primera ejecución de `/audit-landing` sobre el
sitio ya rediseñado para fijar el baseline real, y arranque del ciclo trimestral.

---

## 7. Equipo y siguiente paso

`landing-auditor` — auditoría trimestral vía `/audit-landing`, convierte
hallazgos en GAPs, nunca implementa sin aprobación de Jose. `landing-content-writer`
— blog y copy en ES con traducción a PT/EN. Implementación de código vía el
flujo `gap-discovery` → `gap-implementor` ya existente en el proyecto.

**Siguiente acción concreta:** confirmar con Jose el orden de fases (recomendación:
A primero, en paralelo con el diseño de B) y abrir el primer lote de GAPs vía
`gap-discovery`.
