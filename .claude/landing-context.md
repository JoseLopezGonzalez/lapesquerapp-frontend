# La PesquerApp — Landing Context

> Lectura obligatoria antes de auditar, diseñar o implementar cualquier cosa en el sitio
> público de marketing (landing, pricing, blog, páginas legales). Análogo a
> `design-context.md` pero para el sitio público, no para el ERP autenticado.
> Última actualización: 2026-07-27.
> Mantenido por: `landing-auditor` (hallazgos) + Jose (decisiones estratégicas).

---

## 0b. Documento hermano — el plan de ejecución

`.claude/landing-proposal.md` contiene el diagnóstico detallado, la comparativa
de mercado 2026, la propuesta completa por área y el roadmap por fases (con
estado vivo, actualizado a medida que cada fase avanza). Este archivo
(`landing-context.md`) es la base estable (marca, decisiones, investigación);
`landing-proposal.md` es el plan que se ejecuta sobre esa base. Leer ambos
antes de trabajar en cualquier GAP de landing.

## 0. Qué es esto y qué NO es

Este documento cubre exclusivamente el **sitio público no autenticado**: la landing
(`/`), y las páginas nuevas planificadas (`/pricing`, `/about`, `/blog`, páginas legales).
No cubre el ERP autenticado (`/admin`, `/comercial`, `/operator`, etc.) — eso sigue
gobernado por `design-context.md` y `.claude/rules/`.

El sitio público y el ERP **comparten**: shadcn/ui, Tailwind 4, Next.js App Router,
TypeScript strict, tipografía Geist. **No comparten** necesariamente la misma densidad
visual ni el mismo tono — el ERP es una herramienta operativa densa; la landing es un
escaparate de conversión.

---

## 1. Estado actual — snapshot de auditoría (2026-07-27)

Baseline antes del rediseño. Referencia para medir progreso, no destino.

- **Una sola ruta pública real:** `/` (`src/app/page.js`, Client Component que decide
  landing vs login leyendo `window.location.hostname` en runtime). No hay
  `/pricing`, `/about`, `/blog`, `/legal/*` — los enlaces del footer a "Aviso Legal" y
  "Política de Privacidad" apuntan a `#` (rotos).
- **Todo el contenido vive en un único archivo:** `src/components/LandingPage/index.js`,
  501 líneas, sin componentización (Hero/Features/Pricing/Footer todo inline).
- **`page.js` es `'use client'`** → no puede exportar `metadata` propia. Toda la SEO
  depende del `layout.js` raíz, genérico y estático.
- **Sin `sitemap.ts`, sin `robots.ts`, sin JSON-LD** en ningún punto del proyecto.
- **CTAs rotos:** "Ver características" no hace nada (sin handler). El formulario
  "Solicitar acceso" del CTA final no tiene `onSubmit` — no envía a ningún sitio.
- **Cero analytics/conversion tracking** (solo `@vercel/speed-insights`, que es
  performance, no marketing).
- **Afirmaciones no verificadas:** "Certificación ISO 27001", "99.9% de disponibilidad",
  rating "4.9/5" — placeholders sin respaldo real (ver §5 Honestidad de contenido).
- **Imágenes:** PNG pesados sin optimizar (180–320 KB cada uno), sin `next.config.mjs`
  `images.formats` configurado, varios `<Image>` sobre-dimensionados respecto al render real.
- **`framer-motion` instalado pero no usado** en la landing — cero animaciones.
- **Sin `<nav>`**, sin navegación a secciones, sin login visible desde la landing raíz.
- **Copyright desactualizado** (`© 2025`), inconsistencias de copy (`{appName}` vs
  "pesquerapp" en minúscula en un CTA).

Detalle completo con líneas exactas: ver el hilo de la auditoría original (2026-07-27)
o relanzar `/audit-landing` para un snapshot actualizado.

---

## 2. Identidad de marca REAL (verificada en el repo, no inventada)

Antes de diseñar nada nuevo: la marca **ya está definida**, y no coincide con lo que usa
hoy la landing actual.

### Logo / isotipo
`public/pesquerapp/favicon.svg` — un icono circular de "escamas/olas" en dos colores
planos: fondo casi negro `#0F0F10` (`.st2`) y trazo blanco `#FFFFFF` (`.st3`). Hay un
gradiente azul-cian (`#0496F0` → `#27F4FC`) y una versión alternativa en `#071B41`
definidos en el SVG pero marcados `display:none` — variantes descartadas, no usarlas
como si fueran la marca activa.
Logo horizontal: `public/logos/blueapp-logo-horizontal.png` (nombre de archivo heredado,
no representa el naming actual).

### Sistema de color real (`src/app/globals.css`, tokens OKLCH — preset shadcn "Nova/Neutral")
- `--primary`: `oklch(0.205 0 0)` claro / `oklch(0.87 0 0)` oscuro → **negro/gris casi
  neutro**, no azul.
- Único azul en el sistema de tokens: `--ring` `oklch(0.62 0.19 250)` — reservado para
  focus rings, no para superficies ni CTAs.
- Semánticos: `--destructive` (rojo), `--success` (verde), `--warning` (ámbar), `--info`
  (violeta) — ver tabla completa en `design-context.md §1`.

### Conclusión obligatoria
El `bg-sky-500` que usa hoy la landing en el hero, CTAs y sección final **es un color
ad-hoc que no pertenece al sistema de marca documentado** — ni al token `--primary`
(negro neutro) ni a ningún semantic token. Es una desviación de marca, no una decisión
de marca. El rediseño **parte del sistema neutro real (negro/blanco + tipografía
Geist)** — ver decisión de dirección visual confirmada abajo, que cierra esta pregunta:
sin acento de color nuevo, monocromo puro.

### Dirección visual confirmada (2026-07-27, con referencia visual de Jose)

Jose aportó inspiración de Pinterest y la describe explícitamente como: **"diseño tipo
Apple muy limpio, aunándolo con diseño SaaS moderno, usando imágenes reales y un tipo de
ilustraciones modernas que son como mockups de componentes — se parecen a los
originales pero en otro contexto, aislados, mucho más visuales y estéticos. Todo en
tonos neutros (blancos y negros) como nuestra app."**

Referencia visual concreta (captura aportada): tarjetas tipo *bento grid* sobre fondo
gris muy claro, cada tarjeta con un titular corto en negrita + 1-2 líneas de
descripción, seguido de un "mockup" aislado y estilizado de un componente real de
producto (chrome de navegador simplificado, badges circulares/cuadrados negros con
iconografía blanca de trazo fino, tarjetas de checkout/dashboard recreadas de forma
idealizada, no capturas de pantalla literales). Paleta estrictamente monocroma: negro,
blanco, grises — sin azul, sin color de acento.

Esto **coincide directamente** con la tendencia de mercado 2026 documentada en §4.1
(bento grids, mostrar el producto en vez de abstracciones 3D) y con referencias reales
del mismo estilo: Linear, Vercel, Arc, Raycast — todas usan esta técnica de "mockup de
componente aislado y estilizado" en monocromo/alto contraste.

**Decisión bloqueada para Fase 2:**
- Paleta: 100% neutra (tokens `--background`/`--foreground`/`--primary`/`--muted`/
  `--border` ya documentados en `design-context.md §1`) — cero azul, cero acento de
  color nuevo. Los únicos colores no-neutros permitidos son los semantic tokens ya
  existentes (`--destructive`, `--success`, `--warning`) y solo para su uso semántico
  habitual (errores, confirmaciones), nunca como color decorativo de marca.
- Estilo de "mockup de producto": cada bloque de features debe mostrar una versión
  **estilizada y aislada** de un componente real de la app (no captura de pantalla
  cruda, no ilustración 3D abstracta genérica) — ej. una versión simplificada de una
  tarjeta de pedido, del editor de etiquetas, del mapa de almacén — reconocible pero
  tratada visualmente (fondo aislado, sombra suave, recorte a un fragmento concreto).
  Esto requiere trabajo de diseño dedicado, no es un simple screenshot pegado.
- Tipografía y espaciado: mantener Geist, generosidad de whitespace tipo Apple (más
  aire que la densidad operativa del ERP — la landing no compite con `design-context.md`
  §"Density is high, chrome is minimal", esa regla es del ERP, no de la landing).

### Tipografía
`Geist Sans` / `Geist Mono` vía `next/font/google` — coherente con el resto de la app,
mantener en la landing.

---

## 3. Decisiones estratégicas confirmadas por Jose (2026-07-27)

Estas son decisiones de producto, no sugerencias — vinculantes para Fase 2 salvo que
Jose las cambie explícitamente.

| Dimensión | Decisión |
|---|---|
| **Alcance** | Rediseño completo desde cero (no parche incremental) |
| **Dirección visual** | Minimalista SaaS moderno — "shadcn mejorado para landing", elegante, con imágenes/iconos/logos llamativos, mostrando bloques visuales reales de la app para promocionar el producto. **Refinado con referencia visual concreta (ver §2 "Dirección visual confirmada"):** estilo Apple limpio + bento grid + mockups de componentes reales aislados y estilizados, monocromo puro blanco/negro/gris, sin acento de color nuevo |
| **Contenido de confianza actual** (ISO 27001, 99.9%, 4.9/5) | No son reales → sustituir por alternativas honestas y verificables |
| **Idiomas** | Multiidioma completo ES/PT/EN desde ya — infraestructura i18n desde el inicio, no solo copy en español |
| **Pricing** | Mostrar precios/planes públicamente (transparencia total, no "contactar con ventas") |
| **Páginas nuevas** | Delegado al equipo — aplicar criterio de SaaS moderno (ver §6 Arquitectura de páginas propuesta) |
| **Autonomía del equipo de agentes** | Auditorías periódicas automáticas + Jose aprueba explícitamente antes de implementar ningún cambio |
| **Cadencia de auditoría** | Trimestral |
| **Assets de marca** | Marca definida y debe respetarse (ver §2) — sin fotos/vídeos reales del negocio disponibles todavía |
| **Inspiración de referencia** | Sin referencia única fija; libertad de investigar el mercado actual, pero con requisito explícito: nivel shadcn mejorado, mostrar mucho producto real (screenshots/bloques visuales de la app), no abstracción 3D genérica |
| **Blog/SEO** | Sí, incluir infraestructura + primeros artículos ya en la Fase 1 del rediseño (no pospuesto) |
| **Social proof / testimonios** | Jose tiene clientes reales dispuestos a dar testimonio — pedir nombre, empresa, cita y (si es posible) logo antes de escribir esa sección; nunca inventar citas ni nombres mientras tanto |

---

## 4. Investigación de mercado 2026 — síntesis aplicable

Resumen accionable de la investigación (fuentes completas en el hilo de la sesión que
generó este documento). Esto informa la Fase 2, no la reemplaza.

### 4.1 Tendencias de diseño SaaS 2026
- Los héroes están pasando de taglines estáticas a **demostrar el producto en 3–5
  segundos** (screenshots reales, mini-demos interactivas, no ilustraciones 3D
  abstractas) — encaja directamente con el requisito de Jose de "mostrar mucho de la
  app".
- **Bento grids** para productos con múltiples capacidades (encaja con los 5 módulos:
  Producción, Stock, Compras/Ventas, IA, Etiquetas).
- Micro-animaciones con propósito, no decorativas — `framer-motion` ya está instalado,
  usarlo con intención (scroll-reveal de bloques de producto, no parallax genérico).
- Navegación tratada como parte del funnel de conversión: sticky header, pocos enlaces,
  CTA siempre visible.
- Prueba social evolucionando hacia vídeo/casos reales — coherente con que Jose sí tiene
  clientes dispuestos a dar testimonio.

### 4.2 Conversión (CRO) — B2B SaaS vertical
- **Un solo CTA principal por página convierte más** que múltiples CTAs compitiendo
  (13.5% vs 10.5% en benchmarks citados) — la landing actual ya tiene dos CTAs en el
  hero, uno de los cuales ni siquiera funciona; resolver ambas cosas.
- Diseño a medida supera a plantillas genéricas en conversión — refuerza la decisión de
  "rediseño completo" sobre reutilizar un template shadcn sin adaptar.
- Regla de los 5 segundos: el visitante debe entender qué es, para quién y qué hacer sin
  esfuerzo.
- Mobile-first real: columna única, CTAs táctiles ≥44×44px, carga <3s.
- SaaS vertical de nicho suele convertir mejor que SaaS horizontal (3–7% vs 2–5%) por
  mayor ajuste de intención — relevante porque PesquerApp es explícitamente de nicho
  (pesca/congelados), no hay que "generalizar" el mensaje para sonar más grande.

### 4.3 Pricing page
- Patrón dominante: 3 niveles, toggle mensual/anual, tabla comparativa, FAQ, "Más
  popular" destacado, CTA con texto específico por plan, nivel enterprise en
  "contactar con ventas".
- Transparencia de precio en niveles self-serve/SMB genera más confianza que ocultarlo
  — coherente con la decisión de Jose de mostrar precios.
- Mobile: apilar verticalmente, nunca scroll horizontal de tabla de planes (58% del
  tráfico de pricing pages ya es mobile).

### 4.4 SEO técnico (Next.js App Router)
- `sitemap.ts` y `robots.ts` basados en archivo (convención de metadata de Next.js) —
  ambos ausentes hoy, prioridad alta.
- JSON-LD sembrado desde Server Components / Metadata API, no disperso en componentes
  cliente — para `Organization`, `SoftwareApplication` y, si hay blog, `Article`/
  `BlogPosting`.
- Validar structured data en desarrollo (Rich Results Test), no después de desplegar.

### 4.5 GEO/AEO — optimización para motores generativos (ChatGPT, Perplexity, Gemini, AI Overviews)
- Cada vez más descubrimiento B2B empieza en interfaces LLM, no en buscadores
  tradicionales — relevante para un ERP de nicho donde el comprador puede preguntarle a
  una IA "qué ERP hay para gestión de lonjas/pesca".
  GEO no sustituye al SEO clásico, lo complementa: los mismos fundamentos técnicos
  (contenido claro, structured data, autoridad) ayudan a ambos.
- Táctica concreta: las primeras ~200 palabras de cualquier artículo de blog deben
  responder la pregunta principal directamente, sin rodeos — los motores con
  recuperación en tiempo real puntúan sobre todo el contenido de apertura.

### 4.6 Estrategia de contenido — SaaS vertical de nicho
- Contenido "founder-led" (Jose como voz del sector) es el activo más fuerte para un
  SaaS vertical con recursos limitados.
- Estructura en **topic clusters**: páginas pilar amplias (ej. "Trazabilidad en la
  industria pesquera") enlazando a artículos específicos (ej. "Cómo cumplir la
  normativa de trazabilidad de lonjas en España").
- Prioriza profundidad de nicho sobre alcance genérico — no competir por keywords de
  "ERP" genérico, competir por keywords específicas del sector pesquero/congelados.

### 4.7 i18n (ES/PT/EN)
- Patrón recomendado: segmento de ruta `[locale]` a nivel raíz del App Router
  (`next-intl` es la librería de referencia para Next.js App Router en 2026, con
  soporte nativo de Server Components).
- Namespaces de traducción organizados por feature/sección, no un único fichero gigante.
- `hreflang` + URLs canónicas por idioma — obligatorio en cuanto haya más de un idioma
  indexable, para no autocompetir en buscadores entre versiones.
- Igual que con el resto de la landing: cero contenido inventado en PT/EN — traducción
  fiel del mensaje aprobado en ES, revisada antes de publicar.
- **Regla técnica obligatoria (PL-031):** toda página bajo `src/app/[locale]/**` DEBE llamar
  `setRequestLocale(locale)` como primera línea tras `const { locale } = await params;`, tanto
  en `layout.tsx` como en cada `page.tsx` de la ruta. `src/middleware.ts` solo invoca
  `intlMiddleware` para rutas sin prefijo de locale — las rutas ya prefijadas (`/pt/*`, `/en/*`)
  nunca pasan por el middleware, así que sin `setRequestLocale()` cualquier
  `getTranslations()`/`useTranslations()` sin locale explícito cae silenciosamente al locale
  por defecto (`es`). Bug real descubierto y corregido en GAP-123: afectó a todo el body de
  Fases B1/B2/C durante varias semanas, invisible porque `generateMetadata` (y por tanto
  `<title>`) sí recibe el locale explícito y parecía correcto.
- **Regla de verificación (PL-030):** ninguna comprobación de i18n se da por completa mirando
  solo `<title>`/metadata o el código de estado HTTP — hay que inspeccionar el body real
  (`<h1>`, texto visible, `href`) de al menos una ruta `/pt/*` o `/en/*`, idealmente con
  requests intercaladas entre locales para descartar bugs de caché/contexto compartido.

---

## 5. Honestidad de contenido — regla dura

Ninguna afirmación verificable (certificaciones, SLAs, ratings, número de clientes,
testimonios) se publica sin que Jose confirme que es cierta y aporte el dato exacto.
Mientras no haya dato confirmado:
- No inventar cifras ni certificaciones.
- Usar alternativas honestas y verificables si existen (años operando, número de lonjas
  integradas, funcionalidades reales) en vez de eliminar la sección de confianza por
  completo.
- Cualquier auditoría (`landing-auditor`) que encuentre una afirmación no verificable
  nueva la marca como hallazgo bloqueante, no como mejora opcional.

---

## 6. Arquitectura de páginas propuesta (borrador para Fase 2)

Basado en el patrón SaaS moderno investigado (§4) y en las decisiones de Jose (§3).
Esto es un borrador de partida para la propuesta de Fase 2, no una decisión cerrada:

```
/[locale]/                 Home (Hero + bento de producto + módulos + CTA)
/[locale]/pricing          Planes y precios (3 niveles + FAQ)
/[locale]/about            Sobre nosotros / equipo
/[locale]/blog             Índice de contenido SEO/GEO
/[locale]/blog/[slug]      Artículo individual
/[locale]/legal/privacy    Política de privacidad
/[locale]/legal/terms      Términos y condiciones
/[locale]/legal/cookies    Política de cookies
```

`locale` ∈ `{es, pt, en}`, con `es` como default/fallback. Ruta de login por subdominio
de tenant (`{tenant}.lapesquerapp.es`) se mantiene fuera de este árbol, sin cambios.

---

## 7b. Producción de assets visuales — flujo obligatorio en implementación

Para cada imagen/visual que necesite la landing, cualquier GAP o propuesta de
implementación debe clasificarla en uno de estos tres tipos y dar la información
correspondiente — nunca dejar "poner una imagen aquí" sin especificar cuál de los tres:

1. **Real (captura de pantalla de la app)** — indicar la vista/estado exacto a capturar,
   breakpoint (desktop/mobile), y con qué datos de ejemplo (siempre un tenant demo/seed,
   nunca datos de un cliente real sin permiso explícito).
2. **Mockup manual (retoque con IA de imagen o Photoshop)** — usar cuando se necesita una
   composición controlada con precisión que un prompt de texto no puede garantizar (p.ej.
   una captura real retocada/recortada). Describir el contenido exacto a representar.
3. **Bento-grid illustration (prompt de IA de imagen)** — para este tipo, entregar
   siempre un **prompt completo y listo para usar**, no una descripción vaga, para que
   Jose lo pase directamente a una IA de imagen y obtenga resultados armonizados entre sí.

**Bloque de estilo base — incluir textualmente en todo prompt de tipo 3** (para que todas
las imágenes generadas compartan estilo, derivado de la referencia visual de Jose en §2):

```
Minimalist monochrome UI mockup illustration, strictly black/white/neutral-gray
palette with no color accents, an isolated floating component on a soft
light-gray background, subtle soft shadow, thin clean white line-icon on a
solid black rounded-square badge, Apple-like clean aesthetic, high contrast,
flat design with soft depth, consistent soft lighting from top-left, no text
unless explicitly specified.
```

Cada prompt de tipo 3 = ese bloque de estilo base + una parte variable específica de
qué componente/feature representa esa tarjeta concreta (ej. "...depicting a simplified
warehouse pallet map card with grid cells and a location pin icon").

## 7. Cómo se mantiene este documento

- `landing-auditor` actualiza §1 (snapshot) en cada auditoría trimestral.
- Cualquier cambio a §2 (marca) o §3 (decisiones estratégicas) requiere confirmación
  explícita de Jose — igual que `design-context.md`.
- `system-learner` puede añadir patrones nuevos aquí si surgen de una auditoría de
  landing, igual que hace con `project-learnings.md` para el ERP.
