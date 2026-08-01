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
| B | Rediseño core de la home (componentización, sistema visual, `[locale]`) | ✅ B1 (GAP-120) y B2 (GAP-121) cerrados 2026-07-28 — ver §8 | L |
| C | Pricing + Legal + PT/EN | ✅ GAP-122 cerrado 2026-07-28 — ver §9 | M |
| D | Blog + GEO/AEO | ✅ GAP-123 cerrado 2026-07-28 (⚠️ aprobado con observaciones) — ver §10 | M |
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

---

## 8. Fase B — Decisiones confirmadas (2026-07-28)

Ronda de preguntas de clarificación previa a `gap-discovery`, respondida por Jose antes de
tocar ningún archivo. Vinculante para los GAPs de Fase B salvo que Jose las cambie
explícitamente — mismo estatus que las decisiones de `landing-context.md` §3.

| Dimensión | Decisión |
|---|---|
| **División en GAPs** | Dos GAPs secuenciales, no uno solo: **B1 (arquitectura)** — componentización real de `LandingPage`, infraestructura `[locale]`, convivencia con `src/app/page.js` (routing subdominio login vs landing pública), SEO/metadata por página vía Server Components. **B2 (sistema visual)** — monocromo + bento + assets, sobre la base ya componentizada de B1. B2 no arranca hasta que B1 esté cerrado y auditado. |
| **URL de idioma** | Español sin prefijo (`lapesquerapp.es/` sirve ES directamente); `/pt` y `/en` sí llevan prefijo. `next-intl` con `localePrefix: 'as-needed'`. |
| **Dependencia i18n** | Aprobado `next-intl` explícitamente (regla de CLAUDE.md "no añadir dependencias sin aprobación" — cubierta para esta librería, para esta fase). |
| **Copy nuevo** | `landing-content-writer` redacta el copy nuevo (titulares, tarjetas de módulo, CTA) en el mismo ciclo de B2, siguiendo `landing-context.md` §4.3 — no se maqueta con el copy actual y se reescribe después. |
| **Assets visuales (Tipo 1/2/3)** | B2 implementa el layout bento completo con placeholders explícitamente marcados con su clasificación (tipo 1/2/3, según `landing-context.md` §7b). Jose genera los prompts de IA (Tipo 3, ya redactados en §5) y captura las pantallas reales (Tipo 1) por su cuenta cuando el layout esté listo — no bloquea el cierre de B2. Un GAP corto de seguimiento inserta los assets finales. |
| **Testimonios / prueba social** | Jose aún no tiene testimonios reales confirmados (nombre/empresa/cita/logo). B2 construye la sección solo con logos de lonjas ya integradas si existen, o la deja fuera por completo — cero citas ni nombres inventados. Se añade en un GAP posterior cuando Jose los aporte. |
| **Pricing preview en home** | Incluida en B2, sin cifras — nombre de cada nivel + a quién va dirigido + CTA a `/pricing` (la página completa con cifras es Fase C). |

### B1 — cerrado (GAP-120, 2026-07-28)

`.claude/gaps/closed/GAP-120-landing-locale-arquitectura.md` — ✅ APROBADO, 9/10. Implementado:
`next-intl` (`locales: ['es']` únicamente), `src/app/[locale]/layout.tsx`+`page.tsx`,
`LandingPage` componentizado en 7 archivos (visual idéntico, cero reescritura de copy),
`middleware.ts` reescribe `/` → `/es` en dominio raíz sin tocar el resto de su lógica de
auth/RBAC, `page.js` simplificado, JSON-LD `Organization`+`SoftwareApplication`. Verificado con
servidor de desarrollo real (no solo lectura de código) en los tres escenarios de dominio
(root PesquerApp, subdominio de tenant, generic branding) — cero regresión sobre GAP-119.
Pendiente real heredado: verificación visual humana en navegador todavía no hecha (ni en
GAP-119 ni en este). **Próximo paso: GAP de B2 (sistema visual monocromo + bento + assets)
vía `gap-discovery`, sobre esta base ya componentizada.**

### B2 — Decisiones confirmadas (2026-07-28, ronda previa a `gap-discovery`)

Ronda de preguntas de clarificación específica de B2 (sistema visual), posterior al cierre de
B1. Vinculante para el/los GAP(s) de B2 salvo que Jose las cambie explícitamente — mismo
estatus que el resto de esta tabla.

| Dimensión | Decisión |
|---|---|
| **Imágenes reales actuales** (`home-mockup.png`, `mockup-label.png`, `mockup-ia-2.png`, `mockup-store.png`, `mockup-orders.png`) — hoy muestran la UI real en `sky-500`, no monocroma | No se tocan ni se reutilizan en B2. B2 monta el layout con placeholders explícitos marcados `[PLACEHOLDER: captura real — vista X]` (Tipo 1, según `landing-context.md` §7b). Un GAP corto de seguimiento captura de nuevo en tenant demo/seed y aplica el tratamiento visual (recorte, sombra, aislamiento) de §7b. |
| **`IntegratedLonjas`** (logos reales de lonjas ya integradas, sin riesgo de honestidad — a diferencia de los testimonios) | Se mantiene en B2, restyleada al sistema monocromo. No sigue el mismo destino que los testimonios (esos sí quedan fuera). |
| **Dark mode** | La landing soporta claro/oscuro vía los tokens OKLCH ya existentes (`--background`/`--foreground`/`--primary`/`--muted`/`--border`), igual que el resto de la app — no se fija a un único modo. |
| **`framer-motion` scroll-reveal** (§4.1/§4.9, librería ya instalada) | Entra en el alcance de B2 — scroll-reveal básico con intención en los bloques bento, no diferido a un GAP posterior. |

### B2 — Estructura de home confirmada (segunda ronda, 2026-07-28)

Ronda de preguntas sobre la estructura real de página (comparando los 7 componentes de B1
contra el home ideal de §4.2). Vinculante igual que el resto de esta tabla.

| Dimensión | Decisión |
|---|---|
| **Hero** | Un único CTA + un único mockup central estilizado (placeholder Tipo 1) — se eliminan el segundo CTA y las 3 tarjetas flotantes, siguiendo estrictamente la recomendación CRO de §4.2. |
| **`ModulesBento`** | Cada una de las 5 tarjetas añade su placeholder Tipo 3 (prompts ya redactados en §5) además del icono monocromo — no se queda solo en icono. |
| **`HowItWorks` (nuevo)** | Se crea en B2: 3 pasos (captura/lonja → producción/stock → venta), copy nuevo de `landing-content-writer` en el mismo ciclo. |
| **`ProductShowcase`** | Se retira como sección independiente. Decisión de Jose delegada al criterio del equipo: mantener 2 veces el mismo producto (bento + showcase apilado) contradice el objetivo de página limpia tipo Apple con "un elemento visual dominante por sección" (§4.2); sus 4 capturas actuales quedaban cubiertas por los mismos 5 mockups del bento. Se elimina el archivo, no se migra contenido 1:1. |
| **`PricingPreview` (nuevo)** | Se crea en B2: nombre de cada nivel + a quién va dirigido, sin cifras, CTA a `/pricing`. Como `/pricing` no existe hasta Fase C, el CTA apunta temporalmente al ancla del formulario de leads (`#lead-form` o equivalente) — señalado en el GAP como cambio de destino pendiente para cuando exista la página real. |
| **Orden final de secciones** | Hero → `ModulesBento` → `HowItWorks` → `IntegratedLonjas` → `TrustBadge` → `PricingPreview` → `LeadCaptureForm` → `Footer`. |

### B2 — cerrado (GAP-121, 2026-07-28)

`.claude/gaps/closed/GAP-121-landing-fase-b2-sistema-visual.md` — ✅ APROBADO, 9/10. Implementado:
sistema 100% monocromo (tokens OKLCH, cero `sky-*`), Hero simplificado a 1 CTA + 1 mockup
(placeholder Tipo 2), `ModulesBento` con placeholder Tipo 3 por tarjeta (los 5 prompts de §5),
2 secciones nuevas (`HowItWorks`, `PricingPreview` sin cifras), `ProductShowcase` eliminado
(evita duplicar el mismo producto dos veces en la página), `IntegratedLonjas`/`TrustBadge`/
`Footer`/`LeadCaptureForm` restyleados (footer y CTA final reutilizan el token `--invert` ya
existente para una banda de alto contraste en ambos temas), `ScrollReveal` con `framer-motion`
respetando `prefers-reduced-motion`, copy reescrito nombrando problemas reales del sector.
Verificado con servidor de desarrollo real (`curl`): cero clases `sky-*`, cero cifras/
certificaciones inventadas, cero regresión sobre GAP-119 (lógica de leads) ni GAP-120 (legal,
sitemap, robots, routing de tenant/dominio raíz). Pendiente real heredado: verificación visual
humana en navegador todavía no hecha (ninguno de los 3 GAPs de landing la ha tenido) — este es
el primer GAP que cambia lo que el usuario *ve* de verdad, recomendado antes de encargar el GAP
de assets de seguimiento (sustituir los 6 placeholders Tipo 2/Tipo 3 por los assets finales).

### Riesgo técnico señalado para B1 (no una decisión, un aviso para `gap-discovery`)

`src/app/page.js` es `'use client'` y decide landing-vs-login leyendo
`window.location.hostname` en runtime (incluye el caso `isGenericBranding`, que devuelve
página en blanco para marcas white-label distintas de PesquerApp). La elección de "ES sin
prefijo" implica que `next-intl` necesita reescribir internamente `/` → `/es` sin mostrarlo
en la URL, lo cual normalmente se resuelve en middleware — y `src/middleware.ts` ya es un
archivo protegido (auth + tenant + RBAC, 274 líneas, ver CLAUDE.md "Archivos protegidos").
Componer el middleware de `next-intl` con el middleware existente sin romper la detección de
tenant/subdominio es el punto de mayor riesgo técnico de B1 y debe tratarse como tal en la
fase de discovery — no asumir que es un cambio trivial de routing.

---

## 9. Fase C — Decisiones confirmadas (2026-07-28)

Ronda de preguntas de clarificación previa a `gap-discovery` de Fase C (pricing + legal + i18n
completo), respondida por Jose antes de tocar ningún archivo. Vinculante para el/los GAP(s) de
Fase C — mismo estatus que el resto de este documento.

| Dimensión | Decisión |
|---|---|
| **División en GAPs** | Un solo GAP cubre pricing + legal + i18n completo — no se divide en C1/C2. La página `/pricing` se construye con placeholders de cifras si aún no están confirmadas (mismo patrón de disciplina de placeholder que B2), sin bloquear el resto. |
| **Cifras de pricing** | Jose no las tiene confirmadas todavía — la página se monta con la estructura completa (3 niveles, toggle mensual/anual, comparativa, FAQ) y las cifras marcadas explícitamente como pendientes (mismo patrón `AssetPlaceholder`-like de B2, adaptado a texto en vez de imagen). |
| **Traducción PT/EN** | `landing-content-writer` traduce todo lo publicado (home + legal) en este ciclo; Jose revisa después sin que eso bloquee el cierre del GAP — el contenido vive en JSON, fácil de corregir en una pasada posterior si hace falta. |
| **Redirect de URLs legales viejas** | `/legal/privacy` y `/legal/terms` (fuera de `[locale]`, indexadas desde GAP-119) pasan a `/[locale]/legal/...`. Las URLs viejas quedan con redirect 301 a `/es/legal/...` vía `next.config.mjs` `redirects()` — preserva el SEO ya acumulado. |
| **`/legal/cookies`** | Sigue pospuesta — no hay cookies no esenciales todavía (sin analítica, eso es Fase E). Se crea cuando exista analítica real que la necesite, no antes. |

### Riesgo técnico señalado para Fase C (no una decisión, un aviso para `gap-discovery`)

`src/middleware.ts` hoy solo intercepta la ruta raíz exacta (`pathname === '/'`) para decidir
dominio-raíz-vs-subdominio-de-tenant y delegar en `intlMiddleware` (`next-intl`). Con
`localePrefix: 'as-needed'` (español sin prefijo), cualquier página nueva bajo `[locale]` que
deba ser accesible **sin prefijo** en español (`/pricing`, `/legal/privacy`, `/legal/terms`)
necesita que el middleware también la intercepte y delegue en `intlMiddleware` — igual que ya
hace hoy solo para `/`. Sin ampliar el `matcher`/la rama de detección más allá de la ruta raíz
exacta, una petición a `/pricing` en el dominio raíz no llegaría a resolverse (no hay
`src/app/pricing/page.tsx` fuera de `[locale]`, y el middleware no la reescribe a `/es/pricing`).

Esto es una ampliación real, no trivial, del cambio que ya se aprobó en B1 (GAP-120) — de
"interceptar solo `/`" a "interceptar `/`, `/pricing` y `/legal/:path*`". Sigue sin tocar la
lógica de auth/RBAC del resto del archivo, pero el `gap-discovery` de Fase C debe tratarlo como
un cambio explícito a confirmar con Jose antes de implementar, no asumir que es una extensión
trivial del patrón de B1.

### Fase C — cerrado (GAP-122, 2026-07-28)

`.claude/gaps/closed/GAP-122-landing-fase-c-pricing-legal-i18n.md` — ✅ APROBADO, 9/10.
Implementado: `next-intl` con `locales: ['es', 'pt', 'en']`; `/pricing` nuevo (3 niveles, toggle
mensual/anual sin descuento inventado, precio marcado "pendiente de confirmar", capacidades
comunes de plataforma sin tabla comparativa por nivel — confirmado con Jose no incluirla
todavía); páginas legales movidas a `[locale]/legal/*` con la MISMA URL en español que antes (se
detectó y corrigió durante el discovery que el redirect 301 inicialmente aprobado no hacía falta
— con `localePrefix: 'as-needed'` la URL en español nunca cambia); traducción completa de
`landing.json` (99 claves) a PT/EN por `landing-content-writer`, paridad de claves verificada;
`sitemap.xml` y cada página con `hreflang`/`canonical` correctos por idioma; `middleware.ts`
ampliado para interceptar también `/pricing` y `/legal/:path*` (además de `/`), resto de su
lógica de auth/RBAC intacta. El implementador encontró y corrigió 3 huecos reales no previstos
en el plan (título de home hardcodeado en español, `canonical` ausente en varias páginas, link
del footer no locale-aware) — los tres eran necesarios para que la traducción funcionara de
verdad, no alcance nuevo. Verificado con servidor real: 12 combinaciones página×locale, todas
200, cero regresión sobre Fases A/B1/B2, cero cifra/certificación inventada. Pendiente real
heredado: verificación visual humana en navegador todavía no hecha (ninguno de los 4 GAPs de
landing la ha tenido) — recomendado especialmente para revisar el matiz de las traducciones
PT/EN antes de dar Fase C por cerrada del todo. **Próximo paso: Fase D (blog + GEO/AEO) cuando
Jose quiera retomarlo, o el GAP corto de assets pendiente de B2.**

---

## 10. Fase D — Decisiones confirmadas (2026-07-28)

Ronda de preguntas de clarificación previa a `gap-discovery` de Fase D (blog + GEO/AEO),
respondida por Jose antes de escribir el GAP. Vinculante para GAP-123 — mismo estatus que el
resto de este documento. GAP completo:
`.claude/gaps/closed/GAP-123-landing-fase-d-blog-geo-aeo.md`.

| Dimensión | Decisión |
|---|---|
| **División en GAPs** | Un solo GAP cubre infraestructura + los 3 primeros artículos (mismo patrón que Fase C). |
| **Almacenamiento de contenido** | Markdown plano versionado en el repo (`src/content/blog/{slug}/{es,pt,en}.md` + `meta.ts` tipado) — publicar es añadir archivos y desplegar, sin CMS externo. Pivote técnico durante la implementación: de MDX (`next-mdx-remote`, dependencia nueva) a Markdown plano con `react-markdown`/`remark-gfm`, ya instalados y en uso real (`MarkdownRenderer.js` del chat IA) — cero dependencias nuevas, confirmado con Jose. |
| **Artículos de lanzamiento** | 3, uno por cada topic cluster ya definido en §4.6 (trazabilidad, gestión de lonjas/compras, etiquetado y cumplimiento normativo). Títulos/ángulos exactos delegados a `landing-content-writer` dentro de cada pilar, sin aprobación previa de cada título — mismo patrón que los nombres de tiers en B2. |
| **Autoría** | Founder-led, firma de Jose. Nombre/rol exacto **pendiente de confirmar** — se publica con placeholder de texto explícito mientras tanto, misma regla de honestidad que el precio pendiente de Fase C. |
| **Layout del índice `/blog`** | Mismo sistema monocromo de B2, sin layout alternativo. |
| **Portada por artículo** | Placeholder Tipo 3 (`AssetPlaceholder` reutilizado de B2) — no bloquea el cierre, GAP de assets de seguimiento las sustituye. |
| **Traducción PT/EN** | En el mismo GAP, a cargo de `landing-content-writer`, mismo patrón que Fase C. |
| **Pillar pages (topic cluster hubs)** | No se crean en este GAP — se revisan cuando haya 2–3 artículos por cluster. |
| **Workflow de publicación** | Vía repo/deploy — sin CMS ni panel de edición. |
| **RSS** | Sí, un feed por locale (`/blog/rss/{locale}`), fuera del árbol `[locale]` (no necesita tocar el middleware). |
| **Mobile** | Aplica ya. |
| **Dependencia nueva** | Ninguna — tras el pivote a Markdown plano, cero paquetes nuevos en `package.json`. |

**Decisiones técnicas del discovery** (no preguntas, derivadas de patrones ya establecidos en
Fase C): mismo slug en los 3 locales (`/blog/{slug}`, `/pt/blog/{slug}`, `/en/blog/{slug}`);
`src/middleware.ts` se amplía con el mismo patrón exacto ya usado para `/pricing`/`/legal/*`
(añadir `/blog` a `isPublicLocalePath()` y al `matcher`, resto del archivo intacto);
`sitemap.ts` se extiende con el mismo patrón de `alternates`/`hreflang` ya usado.

### Fase D — cerrado (GAP-123, 2026-07-28)

`.claude/gaps/closed/GAP-123-landing-fase-d-blog-geo-aeo.md` — ⚠️ APROBADO CON OBSERVACIONES,
9/10. Implementado: `/blog` + `/blog/{slug}` con 3 artículos reales (uno por topic cluster:
trazabilidad, gestión de lonjas y compras, etiquetado y normativa) en `es`/`pt`/`en`, contenido
en Markdown plano (`react-markdown`+`remark-gfm`, **pivote técnico desde MDX** — cero
dependencias nuevas, confirmado con Jose durante la implementación), RSS por locale, `sitemap.xml`
ampliado, enlace nuevo en el footer.

**Hallazgo importante durante la implementación (fuera del alcance original, corregido con
autorización explícita de Jose):** se descubrió que **todo el contenido de body en `/pt/*` y
`/en/*` se servía en español** desde que se activaron esos locales en Fase C — el `<title>` de
cada página sí estaba bien traducido (pasa el locale explícitamente), pero cualquier
`getTranslations()`/`useTranslations()` sin locale explícito (el patrón usado en casi todos los
componentes del sitio) caía al locale por defecto, porque `setRequestLocale()` de `next-intl`
nunca se llamaba en el proyecto y el middleware solo invoca `intlMiddleware` para rutas sin
prefijo. Afectaba a Hero, ModulesBento, HowItWorks, Footer, TrustBadge, PricingPreview,
LeadCaptureForm y las páginas legales — es decir, prácticamente todo el contenido visible de las
Fases B1/B2/C ya cerradas. Corregido añadiendo `setRequestLocale(locale)` en `[locale]/layout.tsx`
y en las 7 páginas bajo `[locale]` (home, pricing, legal/privacy, legal/terms, blog, blog/[slug]),
verificado con 7 rondas intercaladas es/pt/en para descartar inestabilidad. Detalle completo de la
causa raíz y la corrección en la sección "Implementación → Desviaciones del plan" de GAP-123.

**Pendiente nuevo, dejado fuera a propósito (decisión de Jose):** `<html lang="es">` sigue fijo en
`src/app/layout.js` (layout raíz, compartido con el ERP autenticado, no multiidioma) — no afecta
al contenido visible, solo al atributo que leen buscadores/lectores de pantalla. Corregirlo
requiere tocar un archivo `.js` legacy compartido con toda la app y migrarlo a `.tsx` en el mismo
commit (regla de CLAUDE.md) — candidato a GAP corto independiente, no bloquea nada.

Verificado con servidor de desarrollo real: 12 combinaciones página×locale del blog (200 todas),
RSS en los 3 idiomas, sitemap con hreflang, cero cifra/certificación inventada, cero clase
`sky-*`, cero regresión sobre Fases A/B1/B2/C (lead form, subdominio de tenant, generic branding).
Pendiente heredado: nombre/rol exacto del autor founder-led (placeholder en
`src/lib/blog/blogAuthor.ts`), y verificación visual humana en navegador — recomendada con
urgencia dado el bug descubierto en este GAP, para confirmar con los propios ojos de Jose que
`/pt` y `/en` ya se ven bien.

**Próximo paso:** verificación visual humana de Jose (más urgente que nunca tras el hallazgo de
este GAP), decidir si se abre el GAP corto del `<html lang>`, y el GAP corto de assets de B2
(pendiente desde hace dos fases) sigue disponible cuando Jose quiera retomarlo. Fase E (analítica
+ cadencia trimestral) es la única fase del roadmap original todavía sin empezar.

---

## 11. Cifras de pricing y estructura de bloques — implementado (2026-07-28)

Trabajo fuera de las fases A–E numeradas (no es un GAP formal, hecho directamente a petición de
Jose una vez cerrado `.claude/product-catalog.md`): sustituir el placeholder "precio a confirmar"
de `/pricing` (Fase C, GAP-122) por precios reales de ejemplo y la estructura de bloques/add-ons
que salió del catálogo funcional. Ver `.claude/product-catalog.md` → "Propuesta concreta de
niveles de plan" para el razonamiento completo de qué bloque va en qué nivel.

**Implementado:**
- `src/app/[locale]/pricing/page.tsx` — cada tier (`starter`/`pro`/`enterprise`) muestra ahora
  precio mensual/anual real (excepto `enterprise`, que muestra "A medida" + CTA "Hablar con
  ventas", sin cifra — mismo patrón de mercado ya documentado en §4.3, y coherente con que
  Producción/IA son "bajo consulta" en el catálogo), una nota de límite de usuarios por nivel, y
  una lista de features acumulativas por tier (`t.raw()` de next-intl sobre arrays JSON). Nueva
  sección "Bloques adicionales, para cualquier plan" (editor de etiquetas, fichaje NFC,
  repartidores/autoventa, producción bajo consulta). La sección "Incluido en todos los planes" se
  reescribió: antes listaba los 5 módulos como si estuvieran en todos los planes (ya no es cierto
  con el modelo por bloques); ahora lista únicamente garantías transversales reales
  (multi-tenant, actualizaciones incluidas, soporte, acceso multi-dispositivo, roles/permisos).
  FAQ ampliada con una cuarta pregunta sobre añadir bloques a un plan existente.
- `src/components/LandingPage/PricingPreview.tsx` (teaser de home) — añadido precio de partida
  por tier ("Desde 149 €/mes" / "Desde 349 €/mes" / "Precio a medida"), sin desglose de features
  (eso se queda en `/pricing`, la home mantiene la densidad baja de §4.2).
- `src/messages/{es,pt,en}/landing.json` — namespaces `Pricing` y `Landing.pricingPreview`
  reescritos con la nueva estructura (precios, `limitsNote`, `features[]`, `addons[]`). ES
  redactado directamente; PT/EN traducidos por `landing-content-writer` manteniendo paridad de
  claves. Clave `priceTbd` eliminada de los 3 archivos (ya no se usa en ningún componente).
- Verificado con servidor de desarrollo real (`curl`): `/es/pricing`, `/pt/pricing`,
  `/en/pricing` devuelven 200 con el contenido nuevo correctamente interpolado (precios, límites,
  features, CTA de enterprise) en los tres idiomas; teaser de home verificado igual en los 3
  locales.

**Cifras de ejemplo (NO validadas contra coste real ni competencia — marcadas así también en
`product-catalog.md`):** Esencial 149€/mes (119€/mes facturación anual), Profesional 349€/mes
(279€/mes anual), Empresas a medida. Jose las revisará junto con el resto del catálogo y puede
cambiarlas sin que eso implique tocar la estructura de bloques.

**Traducciones sin precedente previo en el proyecto, señaladas por `landing-content-writer` para
revisión de Jose:** "Fichaje y control horario por NFC" → PT *"Registo de ponto e controlo
horário por NFC"*, EN *"NFC time tracking and clock-in"*. "Repartidores y autoventa móvil" → PT
*"Distribuição e venda direta móvel"* (se evitó traducir "repartidor" literal por la connotación
de repartidor de comida a domicilio en PT-PT), EN *"Route sales and mobile van sales"*. Ninguna
de las dos tenía traducción previa fijada en `landing.json` ni en la navegación de la app — si
ya existe un naming preferido en otro sitio (ERP, materiales comerciales), debería sustituir a
este.

### ⚠️ Hallazgo no relacionado, descubierto durante la verificación — rutas públicas sin
### prefijo de idioma devuelven 404 en el servidor de desarrollo actual

Durante la verificación con `curl` se confirmó que **`/pricing`, `/legal/privacy` y `/blog`
(las variantes SIN prefijo `/es`, que es como se sirve el español por defecto con
`localePrefix: 'as-needed'`) devuelven 404** en este entorno — mientras que `/`, `/es`,
`/es/pricing`, `/pt/pricing` y `/en/pricing` sí devuelven 200 correctamente. Es decir: el
contenido nuevo de pricing funciona perfectamente vía `/es/pricing`, pero la URL "natural" en
español que un visitante real usaría (`lapesquerapp.es/pricing`, sin prefijo) parece rota.

**No es un efecto de este cambio de pricing** — se reproduce igual en `/legal/privacy` y
`/blog`, páginas de fases anteriores (C y D) que en su momento sí se verificaron en 200 sin
prefijo. La diferencia detectada: `node_modules` tiene instalado **Next.js 16.1.3**, ya fijado
también en `package-lock.json` (no es una desviación local no comprometida — `git status` no
marca cambios en `package.json`/`package-lock.json`), mientras que `CLAUDE.md` documenta la
versión bloqueada como **16.0.7**. El propio arranque del servidor de desarrollo muestra el aviso
`⚠ The "middleware" file convention is deprecated. Please use "proxy" instead` — coincide en
tiempo con que el rewrite de `src/middleware.ts` (que es lo único que resuelve `/pricing` →
`/es/pricing` a nivel de dominio raíz sin archivo literal fuera de `[locale]`) haya dejado de
aplicarse para estas rutas concretas en esta versión de Next.js, sin afectar a `/` (que si acaso
tiene su propio `src/app/page.js` literal fuera del árbol `[locale]`, no depende únicamente del
rewrite).

**No se ha tocado `src/middleware.ts` para investigar/corregir esto** — es un archivo protegido
(`CLAUDE.md` "Archivos protegidos") y el diagnóstico de causa raíz de arriba es una hipótesis
razonable, no una confirmación exhaustiva; requiere revisión explícita de Jose antes de tocarlo,
y probablemente conviene decidir primero si se fija Next.js en `16.0.7` exacto (sin `^`) o se
migra el archivo a la convención `proxy.ts` nueva. **Si esto también ocurre en producción, las
URLs sin prefijo de español (el idioma principal, sin prefijo por diseño) de pricing/legal/blog
podrían estar rotas ahora mismo para visitantes reales** — recomendación: verificarlo cuanto
antes en el dominio real, no solo en local.

---

## 12. Ronda de refinamiento continuo — {en curso, iniciada 2026-08-01}

Formato distinto a las fases A–E: no es un rediseño estructurado por fases, sino una lista
de mejoras puntuales que Jose va proponiendo una a una sobre la landing ya rediseñada
(Fases A–D cerradas + trabajo de pricing de §11). Cada entrada documenta idea → estado
actual del código → investigación de mercado (si aplica) → propuesta concreta. Se va
acumulando hasta que Jose decida cerrar la ronda; entonces se convierte en uno o varios
GAPs vía `gap-discovery` para implementación, igual que las fases anteriores.

### 12.1 Marquee infinito de logos de lonjas integradas

**Idea de Jose:** mostrar los logos de las lonjas que ya se anuncian como integración
(`IntegratedLonjas`) de forma más moderna, como un "infinite logo marquee" (banda que se
desplaza en scroll horizontal continuo), en vez de la grid estática actual.

**Estado actual del código** (`src/components/LandingPage/IntegratedLonjas.tsx`):
grid estática de 5 logos (`grid-cols-2` mobile / `grid-cols-5` desktop), cada uno en
escala de grises (`grayscale`), con fade-in una sola vez al entrar en viewport vía
`ScrollReveal` (ya existente, respeta `prefers-reduced-motion`). Assets ya en
`public/images/landingPage/logos/*-bn.png` (versiones en blanco y negro ya preparadas
para el sistema monocromo — Docapesca, Armadores Punta, Lonja Isla, Cofra Santo Cristo,
Cofra). Sección restyleada en B2 (GAP-121) pero manteniendo el layout de grid original.

**Investigación de mercado (2026):** el patrón dominante actual para "logo clouds" de
SaaS (Vercel, Linear y la mayoría de referencias del sector) es una animación CSS pura
por `transform: translateX` sobre GPU, no JavaScript ni librería de carrusel — el truco
es duplicar la lista de logos (segunda copia marcada `aria-hidden="true"`) para que el
bucle sea perfectamente continuo sin salto visible. Reglas de accesibilidad ya
consolidadas como estándar: pausar la animación en `:hover`/`:focus-within` (para que se
pueda inspeccionar un logo concreto), respetar `prefers-reduced-motion` (fallback a
estático, igual que ya hace `ScrollReveal` en el resto de la página), y máscara de
desvanecido (`mask-image` en gradiente) en ambos bordes para que los logos no aparezcan
ni desaparezcan de golpe. Ver fuentes al final de esta entrada.

**Propuesta concreta:**
- Reemplazar el grid de `IntegratedLonjas.tsx` por una banda de marquee horizontal de una
  sola fila: pista duplicada 2× (o 3× si 5 logos resultan visualmente escasos para llenar
  el ancho sin que se note el bucle demasiado pronto — a decidir en implementación viendo
  el resultado real), la copia duplicada con `aria-hidden="true"` para que un lector de
  pantalla no repita cada logo dos veces.
- Animación vía `@keyframes` CSS puro añadido a `src/app/globals.css` (mismo patrón ya
  usado ahí para `shimmer`/`qr-scan-line`/etc. — no hace falta ninguna librería nueva,
  ni siquiera `framer-motion`, que sí está instalado pero es innecesario para una
  translación lineal constante).
- `animation-play-state: paused` en `:hover` y `:focus-within` del contenedor.
- Fallback estático (sin animación, logos visibles fijos) bajo
  `@media (prefers-reduced-motion: reduce)` — mismo criterio que ya aplica `ScrollReveal`
  en el resto de la landing (regla ya establecida en B2/GAP-121, no una excepción nueva).
- Máscara de desvanecido en ambos extremos (`mask-image: linear-gradient(...)`) para que
  los logos entren/salgan con fundido, no de golpe — visualmente coherente con el fondo
  gris claro de la sección.
- Mantener `grayscale` en cada logo (encaja con el sistema monocromo ya bloqueado en
  `landing-context.md §2`); opcional a valorar en implementación: quitar el grayscale
  solo en el logo bajo hover como micro-interacción con propósito (no obligatorio,
  criterio de `landing-content-writer`/implementador al montarlo).
- Mobile: aplica igual (banda horizontal, no requiere touch-drag al ser puramente
  decorativa/no interactiva, a diferencia de un carrusel real); velocidad algo menor o
  igual que desktop, a calibrar visualmente.
- Copy (`t('title')`/`t('description')`, namespace `Landing.integratedLonjas`) no cambia
  — solo cambia el layout de los logos, no el texto de la sección.

**Por qué no usar `embla-carousel-react`/`embla-carousel-autoplay`** (ya están en
`package.json`, cero coste de dependencia nueva): están pensados para carruseles
interactivos con desplazamiento por el usuario (ya se usan en otras partes de la app
para ese caso de uso), no para una banda decorativa de scroll continuo — montar esto con
Embla añadiría JS/estado innecesario para un efecto que el patrón estándar del sector
resuelve con CSS puro y mejor rendimiento (animación en GPU, sin re-render de React).
Usar Embla aquí sería una sobre-ingeniería para el resultado buscado.

**Alcance estimado:** XS — un componente (`IntegratedLonjas.tsx`) + un bloque de
`@keyframes`/utilidades en `globals.css`. No toca i18n, no toca middleware, no añade
dependencias. Candidato claro a agruparse con otras ideas cortas de esta ronda en un
único GAP de "ronda de refinamiento" cuando Jose cierre la lista.

**Pendiente a resolver en implementación (no bloqueante para aprobar la idea):** número
de logos actual (5) es bajo para un marquee de una sola fila sin que el patrón de
repetición se note rápido — el implementador debe verificar visualmente si con 5 logos
(x2 o x3 duplicados) el efecto luce bien o si conviene esperar a tener más lonjas
integradas antes de lanzar el marquee. Si aún no está claro, hay valorar el criterio de
Jose sobre este punto (`AskUserQuestion` en el propio GAP, en vez de asumir).

Sources:
- [Infinite-Scrolling Logos In Flat HTML And Pure CSS — Smashing Magazine](https://www.smashingmagazine.com/2024/04/infinite-scrolling-logos-html-css/)
- [Infinite Marquee Animation using Modern CSS — Medium](https://medium.com/design-bootcamp/infinite-marquee-animation-using-modern-css-0d11d11fcc10)
- [Logo Cloud Marquee — Aceternity UI](https://ui.aceternity.com/blocks/logo-clouds/logo-cloud-marquee)
- [Create a Modern Infinite Marquee in Pure CSS — Effect.Labs](https://effect-labs.com/en/pages/blog/marquee-infinite-scroll.html)

### 12.2 Enriquecer la sección de precios del home (sin fusionar `/pricing` dentro)

**Idea de Jose:** la sección de precios que se ve en el home (`PricingPreview`) le parece
demasiado simple/sin contenido comparada con lo que ya existe en `/pricing`, y propuso
en primera instancia traer la sección de precios completa al home en vez de dejarla como
página aparte.

**Estado actual del código:**
- `src/components/LandingPage/PricingPreview.tsx` (teaser del home, namespace
  `Landing.pricingPreview`): 3 tarjetas con solo nombre + audiencia + un texto de precio
  fijo tipo "Desde 149 €/mes" (`tiers.*.priceFrom`, string ya formateado) + un único CTA
  "Ver planes" que enlaza a `/pricing`. Sin toggle mensual/anual, sin ni un solo feature
  listado, sin addons.
- `src/app/[locale]/pricing/page.tsx` (namespace `Pricing`): página completa —
  `PricingToggle` mensual/anual real (con descuento anual), lista de features por nivel
  (`tiers.*.features[]`), nota de límite de usuarios, bloque de "bloques adicionales"
  (`addons[]`), bloque de "incluido en todos los planes" (`capability1..5`), FAQ de 4
  preguntas (`Accordion`). Todo esto se construyó en el trabajo de §11 (cifras de
  pricing) y no tiene equivalente en el teaser del home.
- **Duplicación de origen de precio ya existente y relevante para esta idea:** el precio
  vive hoy en dos formatos distintos sin relación entre sí — `Landing.pricingPreview.
  tiers.*.priceFrom` como texto libre ("Desde 349 €/mes") y `Pricing.tiers.*.
  priceMonthly`/`priceAnnual` como números crudos que alimentan el toggle real. Si Jose
  cambia una cifra de precio hoy, hay que actualizarla a mano en dos sitios sin que nada
  avise de la inconsistencia.

**Investigación de mercado (2026):** la evidencia es consistente en un punto — las
páginas de pricing dedicadas convierten sensiblemente mejor que meter todo el contenido
de precios en el homepage (sirven a un visitante con intención de compra ya alta, sin la
fricción del resto de secciones de la home), y ese es justo el motivo por el que
`/pricing` ya existe como ruta propia con su propio SEO (`hreflang`/canonical) — es
también la URL que citaría una IA generativa si alguien pregunta "cuánto cuesta un ERP
para el sector pesquero". Al mismo tiempo, la recomendación específica para el bloque de
precios *dentro* del home es clara: mostrar precio (al menos "desde X") y dejar claro de
forma transparente en qué se diferencian los planes — no ocultar el precio, pero tampoco
hace falta la profundidad completa de una pricing page dedicada.

**Decisión (Jose confirmó esta propuesta, 2026-08-01):** no fusionar `/pricing` dentro
del home ni eliminar la ruta — en su lugar, enriquecer `PricingPreview` para que deje de
sentirse vacío, manteniendo `/pricing` como la página con la profundidad completa.

**Propuesta concreta para `PricingPreview.tsx`:**
- Añadir el toggle mensual/anual real reutilizando el componente ya existente
  `PricingToggle`/`PricingPeriodLabel` (mismo patrón que `/pricing`, cero componente
  nuevo) — hoy el teaser ni siquiera deja ver el ahorro anual.
- Mostrar un subconjunto de features por nivel (3–4, no la lista completa) debajo del
  precio de cada tarjeta — a decidir en implementación cuáles son los 3-4 más
  representativos por tier (probablemente los primeros del array ya redactado en
  `Pricing.tiers.*.features`, que ya está ordenado por relevancia).
- Añadir una línea corta bajo las 3 tarjetas mencionando que hay bloques adicionales
  disponibles (versión resumida de `Pricing.addonsTitle`/`addonsDescription`, sin listar
  los 4 addons completos — esos se quedan en `/pricing`).
- Mantener un único CTA por tarjeta hacia `/pricing` (`t('cta')`, ya existe) — el teaser
  gana contenido pero sigue funcionando como puerta de entrada a la página completa, no
  como sustituto.
- **Resolver la duplicación de precio antes o durante la implementación:** decidir una
  única fuente de verdad para el número de precio (recomendado: que `PricingPreview` lea
  directamente `Pricing.tiers.*.priceMonthly`/`priceAnnual` en vez de mantener el string
  separado `priceFrom`) para que actualizar un precio en el futuro sea un cambio en un
  solo sitio, no dos namespaces a mano. Esto implica revisar si `priceFrom` se elimina de
  `Landing.pricingPreview` en los 3 idiomas (`es`/`pt`/`en`) una vez deje de usarse.

**Alcance estimado:** S — un componente (`PricingPreview.tsx`), sin tocar `/pricing`
salvo quizás extraer alguna copy compartida, y edición de `landing.json` en `es`/`pt`/`en`
para los nuevos textos cortos (paridad de claves, traducción de `landing-content-writer`
igual que en fases anteriores). No toca middleware, no añade dependencias, reutiliza
componentes ya existentes.

Sources:
- [27 SaaS Pricing Pages That Actually Convert (Real Data, 2026)](https://www.925studios.co/blog/saas-pricing-page-examples-convert-2026)
- [B2B SaaS Landing Pages: Strategy for More Demos (2026)](https://www.apexure.com/blog/b2b-saas-marketing-the-right-landing-page-strategy/)
- [SaaS Pricing Page Best Practices in 2026 — Fungies.io](https://fungies.io/saas-pricing-page-best-practices-2026/)
