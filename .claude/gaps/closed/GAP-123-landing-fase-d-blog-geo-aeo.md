# GAP-123 — Landing Fase D: blog + GEO/AEO (infraestructura + 3 artículos)

## Metadata

- **Tipo:** Feature
- **Módulo:** Global (sitio público / landing)
- **Prioridad:** Media
- **Estado:** closed
- **Fecha:** 2026-07-28
- **Autor:** Jose

---

## Contexto y problema

Fases A/B1/B2/C (GAP-119/120/121/122, todas cerradas) dejaron la home, `/pricing` y las
páginas legales componentizadas, monocromas, con `next-intl` sirviendo `es`/`pt`/`en`. Fase D
(`landing-proposal.md` §6, tamaño M) es la última pieza de contenido del roadmap: infraestructura
de blog + los primeros artículos, siguiendo la estrategia GEO/AEO ya documentada en
`landing-context.md` §4.5–§4.6 y `landing-proposal.md` §4.6 — cada vez más compradores B2B
preguntan directamente a ChatGPT/Perplexity/Gemini antes de buscar en Google, y el contenido
"founder-led" (Jose como voz del sector) es el activo más fuerte para un SaaS vertical de nicho
con recursos limitados.

Ronda de preguntas de clarificación (2026-07-28, este documento persiste las decisiones —
`landing-proposal.md` se actualizará con un resumen tras el cierre de este GAP, mismo patrón que
Fases B/C) resolvió alcance, arquitectura técnica y contenido de lanzamiento antes de escribir
código.

---

## Decisiones ya confirmadas por Jose (2026-07-28)

Vinculantes para este GAP — no se vuelven a preguntar:

| Dimensión | Decisión |
|---|---|
| **División en GAPs** | Un solo GAP cubre infraestructura + los 3 primeros artículos (mismo patrón que Fase C). |
| **Almacenamiento de contenido** | Markdown plano versionado en el repo (`src/content/blog/`), no JSON ni CMS externo. Publicar un artículo nuevo es añadir archivos y desplegar — consistente con que todo el contenido del proyecto vive en git. **Pivote técnico durante la implementación:** en vez de MDX (`next-mdx-remote`), se usa Markdown plano con `react-markdown`+`remark-gfm` — ambos ya instalados y en uso real en el proyecto (`src/components/AI/Chat/MarkdownRenderer.js`), descubierto al empezar a implementar. Los 3 artículos son prosa (títulos, listas, citas, enlaces) sin necesidad de JSX embebido, así que Markdown plano cubre el caso sin añadir ninguna dependencia nueva — confirmado con Jose antes de escribir código (ver Restricciones). |
| **Artículos de lanzamiento** | 3 artículos, uno por cada topic cluster ya definido en `landing-proposal.md` §4.6: **Trazabilidad en la industria pesquera**, **Gestión de lonjas y compras**, **Etiquetado y cumplimiento normativo**. Título y ángulo exacto de cada artículo los define `landing-content-writer` dentro de su pilar — mismo patrón de delegación que B2 con los nombres de los tiers de pricing. |
| **Autoría** | Founder-led: cada artículo lleva firma de Jose (nombre + rol breve). **El nombre completo/bio exacta a mostrar públicamente no está confirmado todavía** — ver Restricciones, es un caso de la misma regla de honestidad que ya bloqueó cifras/certificaciones inventadas. |
| **Layout del índice `/blog`** | Mismo sistema monocromo de tokens OKLCH que el resto del sitio (B2), sin layout alternativo. |
| **Imagen de portada por artículo** | Placeholder Tipo 3 (bento illustration IA) vía el componente `AssetPlaceholder` ya existente — no bloquea el cierre, se sustituye en un GAP de assets posterior (mismo patrón que los 6 placeholders de B2). |
| **Traducción PT/EN** | `landing-content-writer` traduce los 3 artículos en este mismo GAP, fiel al texto aprobado en ES — revisión de Jose después no bloquea el cierre (mismo patrón que Fase C). |
| **Pillar pages (topic cluster hubs)** | No se crean en este GAP — con solo 1 artículo por pilar no hay suficiente contenido hijo que enlazar todavía. Se revisan en un GAP posterior cuando haya 2–3 artículos por cluster. |
| **Workflow de publicación** | Vía repo/deploy — sin panel de edición ni CMS. |
| **RSS feed** | Sí, incluido en este GAP — un feed por locale. |
| **Mobile** | Aplica ya — mismo criterio mobile-first del resto de la landing. |
| **Dependencia nueva** | Ninguna — tras el pivote a `react-markdown`/`remark-gfm` (ya instalados), este GAP no añade ningún paquete nuevo a `package.json`. |

### Decisiones técnicas del discovery (no preguntas, derivadas de patrones ya establecidos)

- **Mismo slug en los 3 locales:** `/blog/{slug}` (es, sin prefijo), `/pt/blog/{slug}`,
  `/en/blog/{slug}` — el contenido se traduce, la URL no cambia de estructura entre idiomas,
  exactamente el mismo criterio ya aplicado a `/pricing` y `/legal/*` en Fase C.
- **Un artículo = una carpeta con 3 archivos Markdown** (`src/content/blog/{slug}/es.md`,
  `pt.md`, `en.md`, solo cuerpo del artículo) + un `meta.ts` único por carpeta (frontmatter
  tipado en TypeScript, por locale) — mantiene cada traducción como archivo independiente
  (igual razonamiento que separar `es/landing.json`, `pt/landing.json`, `en/landing.json`) y
  evita parsear frontmatter en runtime (sin `gray-matter`), coherente con "TypeScript first"
  de `.claude/rules/typescript.md`.
- **RSS fuera del árbol `[locale]`**, en `src/app/blog/rss/[locale]/route.ts` — no necesita
  el rewrite de `next-intl` (no es una página para humanos, es un feed de máquina con URL ya
  explícita por idioma), así que no requiere tocar `isPublicLocalePath()`/`matcher` de
  `src/middleware.ts` para esta pieza.

---

## Solución acordada

### 1. Dependencias

Ninguna nueva — se reutilizan `react-markdown`+`remark-gfm`, ya instalados y en uso en
`src/components/AI/Chat/MarkdownRenderer.js`. `package.json` no se modifica.

### 2. Tipos

- `src/types/blog.ts` — `BlogCluster = 'trazabilidad' | 'lonjas-compras' | 'etiquetado-normativa'`;
  `BlogFrontmatter` (`title`, `description`, `publishedAt: string` ISO, `cluster: BlogCluster`,
  `coverPlaceholderLabel: string` — el texto/prompt Tipo 3 específico de ese artículo); `BlogArticleSummary`
  (subset de frontmatter + `slug`, usado en el índice sin leer el cuerpo Markdown completo).

### 3. Contenido — 9 archivos Markdown + 3 archivos de metadata (3 artículos × 3 locales)

- `src/content/blog/{slug-trazabilidad}/{es,pt,en}.md` + `meta.ts`
- `src/content/blog/{slug-lonjas-compras}/{es,pt,en}.md` + `meta.ts`
- `src/content/blog/{slug-etiquetado-normativa}/{es,pt,en}.md` + `meta.ts`

Cada `.md` contiene solo el cuerpo del artículo (sin frontmatter). Cada `meta.ts` exporta un
`Record<'es' | 'pt' | 'en', BlogFrontmatter>` con el frontmatter tipado de los 3 idiomas de ese
artículo. Las primeras ~200 palabras del cuerpo responden la pregunta principal del artículo de
forma directa, sin introducción narrativa previa (regla GEO/AEO de `landing-context.md` §4.5).
Contenido y traducción a cargo de `landing-content-writer`, sin cifras/certificaciones/
testimonios inventados (regla dura de `landing-context.md` §5, aplica igual a blog que al resto
del sitio).

### 4. `src/lib/blog/blogRepository.ts`

Server-only (usa `fs`/`path` de Node — nunca importado desde un Client Component):

- `getAllBlogSlugs(): string[]` — lee los nombres de carpeta bajo `src/content/blog/`.
- `getArticleSummaries(locale: string): BlogArticleSummary[]` — lee `meta.ts` de cada carpeta
  (sin leer el `.md`), ordenado por `publishedAt` descendente.
- `getArticleBySlug(locale: string, slug: string)` — lee `meta.ts` (frontmatter) +
  `{slug}/{locale}.md` (cuerpo, como string) de la carpeta; `notFound()` de `next/navigation` si
  el archivo `.md` no existe para esa combinación locale/slug. El cuerpo se renderiza en la
  página con `<ReactMarkdown remarkPlugins={[remarkGfm]}>` (Server Component, sin `'use client'`
  — `react-markdown` no depende de APIs de navegador).

### 5. `src/lib/blog/blogAuthor.ts`

Constante única con los datos de firma (`name`, `role`) reutilizada en cada artículo — ver
Restricciones sobre el placeholder de nombre pendiente de confirmar.

### 6. Componentes nuevos (`src/components/LandingPage/blog/`)

- `ArticleCard.tsx` — tarjeta de artículo para el índice (título, descripción, fecha localizada,
  `ClusterBadge`, `AssetPlaceholder` tipo 3 de portada), envuelta en `ScrollReveal` (reutilizado
  de B2).
- `ClusterBadge.tsx` — `Badge` (shadcn) con el nombre del pilar, mapeado desde `BlogCluster`.
- `AuthorByline.tsx` — nombre + rol del autor (desde `blogAuthor.ts`), usado en la cabecera del
  artículo individual.

### 7. Rutas

- `src/app/[locale]/blog/page.tsx` (Server Component) — lista de `ArticleCard` (3 artículos,
  sin paginación), `generateMetadata` con `canonical`/`alternates.languages` (mismo patrón que
  `pricing/page.tsx`).
- `src/app/[locale]/blog/[slug]/page.tsx` (Server Component) — `generateStaticParams` (los 3
  slugs), render del cuerpo Markdown vía `react-markdown`+`remark-gfm`, `AuthorByline`,
  `ClusterBadge`, fecha localizada
  (`Intl.DateTimeFormat` con el mismo mapeo `es-ES`/`pt-PT`/`en-US` ya usado en las páginas
  legales), JSON-LD `BlogPosting` (headline, description, datePublished, author, `image`
  apuntando al OG image general del sitio hasta que existan portadas reales), `generateMetadata`
  con `canonical`/`alternates.languages`/`notFound()` si el slug no existe.
- `src/app/blog/rss/[locale]/route.ts` — feed RSS 2.0 construido a mano (XML string, sin
  dependencia nueva) a partir de `getArticleSummaries(locale)`, `generateStaticParams` para los 3
  locales, `Content-Type: application/rss+xml`.

### 8. `src/middleware.ts` (archivo protegido — ver Restricciones)

- `isPublicLocalePath()`: añadir `pathname === '/blog' || pathname.startsWith('/blog/')` a la
  condición existente (mismo patrón ya usado para `/pricing` y `/legal/`).
- `matcher`: añadir `'/blog'` y `'/blog/:path*'` al array existente.
- Ningún otro cambio al archivo.

### 9. `src/app/sitemap.ts`

- Añadir a `PUBLIC_PAGES` (o generar dinámicamente combinando `PUBLIC_PAGES` + los 3 slugs de
  `getAllBlogSlugs()`) la entrada `/blog` y las 3 entradas `/blog/{slug}`, cada una con
  `alternates.languages` vía `getPathname` — mismo patrón exacto que las entradas actuales.

### 10. `src/messages/{es,pt,en}/landing.json`

- Namespace nuevo `Blog`: título/descripción del índice, labels de los 3 `BlogCluster`, "Volver
  al blog", "Publicado el", label de autor genérico si hace falta. Traducido en el mismo ciclo
  por `landing-content-writer`.
- `Landing.footer`: nueva clave `blogLink` ("Blog"/"Blog"/"Blog").

### 11. `src/components/LandingPage/Footer.tsx`

- Añadir un `Link` (de `@/i18n/navigation`) a `/blog` junto a los 2 enlaces legales ya
  existentes, usando la nueva clave `t('blogLink')`.

---

## Referencias e inspiración

- `.claude/landing-context.md` §4.5 (GEO/AEO — primeras 200 palabras responden la pregunta
  directamente), §4.6 (estrategia de contenido founder-led, topic clusters), §5 (honestidad de
  contenido), §7b (clasificación de assets, bloque de estilo base Tipo 3).
- `.claude/landing-proposal.md` §4.6 (los 3 pilares/topic clusters ya definidos), §6 (Fase D en
  el roadmap).
- `.claude/gaps/closed/GAP-122-landing-fase-c-pricing-legal-i18n.md` — patrón exacto de
  `generateMetadata` con `canonical`+`alternates.languages`, extensión de
  `isPublicLocalePath()`/`matcher` en `middleware.ts`, `sitemap.ts` locale-aware.
- `.claude/gaps/closed/GAP-121-landing-fase-b2-sistema-visual.md` — `AssetPlaceholder` y
  `ScrollReveal`, reutilizados tal cual en este GAP.
- `src/app/[locale]/legal/privacy/page.tsx` — patrón de fecha localizada por `DATE_LOCALES`,
  reutilizado para `publishedAt` de cada artículo.
- `src/app/sitemap.ts` — estructura actual de `PUBLIC_PAGES`, extendida en este GAP.

---

## UI Brief

- **Vista de referencia:** `src/app/[locale]/pricing/page.tsx` (layout de página pública
  completa con `generateMetadata` locale-aware) para el índice; `ModulesBento.tsx`/B2 para el
  patrón de tarjeta con `AssetPlaceholder`.
- **Tipo de layout:** 2 páginas públicas completas (`/blog`, `/blog/[slug]`), sin modal/sheet.
- **Componentes clave:** `Card`, `Badge`, `Button` (shadcn, ya en uso) + `AssetPlaceholder` y
  `ScrollReveal` (reutilizados de B2, sin crear versiones nuevas) + 3 componentes nuevos
  (`ArticleCard`, `ClusterBadge`, `AuthorByline`).
- **Estados requeridos:** ninguno con fetching — contenido estático server-rendered vía MDX
  compilado en build/request time. `notFound()` si un slug no existe.
- **Mobile:** aplica ahora — índice en columna única en mobile, artículo individual con ancho de
  lectura limitado (`max-w-prose` o equivalente) en todos los breakpoints.
- **i18n:** mismo patrón `params: Promise<{ locale }>` + `getTranslations`/`generateMetadata`
  que el resto de páginas bajo `[locale]`.

### Preguntas de confirmación para Jose

1. ¿Confirmas que el nombre/rol exacto que se muestra como autor de los 3 artículos se define
   antes de publicar (placeholder de texto entre corchetes mientras tanto), en vez de que el
   equipo invente una bio? (Sí/No — recomendado: Sí, misma regla de honestidad que ya aplicó a
   pricing).
2. ¿Confirmas que los 3 títulos/ángulos exactos de artículo dentro de cada pilar quedan a
   criterio de `landing-content-writer` (sin que Jose apruebe cada título antes de escribir),
   igual que se delegaron los nombres de los tiers de pricing en B2? (Sí/No — recomendado: Sí).

---

## Criterios de aceptación

- [ ] `package.json` no tiene dependencias nuevas — `git diff package.json` sin cambios.
- [ ] Existen 9 archivos `.md` (3 slugs × 3 locales) + 3 `meta.ts` bajo `src/content/blog/`,
      cada `meta.ts` con frontmatter completo de los 3 idiomas (`title`, `description`,
      `publishedAt`, `cluster`, `coverPlaceholderLabel`).
- [ ] `GET /blog` (dominio raíz, español sin prefijo) devuelve 200 con las 3 tarjetas de
      artículo, cada una con su `ClusterBadge` y `AssetPlaceholder` tipo 3.
- [ ] `GET /pt/blog` y `GET /en/blog` devuelven 200 con el índice traducido.
- [ ] `GET /blog/{slug}` (los 3 slugs, español) devuelve 200 con el contenido Markdown
      renderizado, `AuthorByline`, fecha localizada, JSON-LD `BlogPosting` presente en el
      `<head>`/script.
- [ ] `GET /pt/blog/{slug}` y `GET /en/blog/{slug}` (los 3 slugs, ambos locales) devuelven 200
      con el contenido traducido.
- [ ] `GET /blog/no-existe` devuelve 404 (verificable con `notFound()` disparado).
- [ ] `GET /blog/rss/es`, `GET /blog/rss/pt`, `GET /blog/rss/en` devuelven 200 con
      `Content-Type: application/rss+xml` y 3 `<item>` cada uno.
- [ ] `GET /sitemap.xml` incluye `/blog` + los 3 slugs, cada entrada con `alternates`/`hreflang`
      de los 3 locales (16 entradas totales: 4 páginas previas + 4 nuevas × 3 locales, contando
      solo entradas base, mismo criterio que las ya existentes).
- [ ] `Footer.tsx` tiene un enlace a `/blog` (locale-aware) junto a los 2 enlaces legales.
- [ ] Primeras ~200 palabras de cada uno de los 3 artículos en español responden la pregunta
      principal del artículo de forma directa (verificable por lectura, criterio de
      `landing-context.md` §4.5).
- [ ] Ninguna cifra, certificación o testimonio inventado en ningún artículo (`grep` de "ISO",
      "99.9%", "4.9/5", cifras de clientes concretas → 0 resultados).
- [ ] `grep -rn "sky-"` sobre `src/components/LandingPage/blog/` y
      `src/app/[locale]/blog/` → sin resultados (mismo sistema monocromo del resto del sitio).
- [ ] Mobile: `/blog` en columna única, sin scroll horizontal de tarjetas.
- [ ] `GET /` en subdominio de tenant y `isGenericBranding=true` siguen sin regresión (mismo
      comportamiento que GAP-120/121/122).
- [ ] `npm run type-check` y `npm run lint` limpios.

---

## Archivos a crear o modificar

**Crear:**
- `src/types/blog.ts`
- `src/content/blog/{slug-trazabilidad}/es.md`, `pt.md`, `en.md`, `meta.ts`
- `src/content/blog/{slug-lonjas-compras}/es.md`, `pt.md`, `en.md`, `meta.ts`
- `src/content/blog/{slug-etiquetado-normativa}/es.md`, `pt.md`, `en.md`, `meta.ts`
- `src/lib/blog/blogRepository.ts`
- `src/lib/blog/blogAuthor.ts`
- `src/components/LandingPage/blog/ArticleCard.tsx`
- `src/components/LandingPage/blog/ClusterBadge.tsx`
- `src/components/LandingPage/blog/AuthorByline.tsx`
- `src/app/[locale]/blog/page.tsx`
- `src/app/[locale]/blog/[slug]/page.tsx`
- `src/app/blog/rss/[locale]/route.ts`

**Modificar:**
- `src/middleware.ts` (extender `isPublicLocalePath()` + `matcher` para `/blog`)
- `src/app/sitemap.ts` (añadir entradas de blog)
- `src/messages/es/landing.json`, `pt/landing.json`, `en/landing.json` (namespace `Blog` +
  clave `footer.blogLink`)
- `src/components/LandingPage/Footer.tsx` (enlace a `/blog`)

**No tocar:**
- `src/i18n/routing.ts`, `src/i18n/navigation.ts` (sin cambios — mismos 3 locales ya activos).
- Resto de `src/middleware.ts` (auth JWT, RBAC, rutas de rol) — sin cambios.
- `src/components/LandingPage/Hero.tsx`, `ModulesBento.tsx`, `HowItWorks.tsx`,
  `IntegratedLonjas.tsx`, `TrustBadge.tsx`, `PricingPreview.tsx`, `LeadCaptureForm.tsx`,
  `AssetPlaceholder.tsx`, `ScrollReveal.tsx` (reutilizados sin modificar su código).
- `src/app/[locale]/pricing/page.tsx`, `src/app/[locale]/legal/*` (sin cambios).

---

## Restricciones

- **No crear páginas pilar (topic cluster hubs)** en este GAP — decisión explícita, se
  revisan cuando haya más artículos por cluster.
- **No inventar el nombre/bio completo del autor** — usar placeholder de texto explícito
  (ej. `[Nombre completo a confirmar]`) si Jose no lo ha dado antes del cierre del GAP; no
  bloquea el cierre, mismo patrón que el precio pendiente de Fase C.
- **No inventar cifras, certificaciones, número de clientes ni testimonios** en ningún
  artículo — regla dura de `landing-context.md` §5, aplica igual a blog que al resto del sitio.
- **No añadir ninguna dependencia nueva** — se reutilizan `react-markdown`/`remark-gfm` ya
  instalados; sin `gray-matter` (el frontmatter vive en `meta.ts` tipado), sin `reading-time`,
  sin librería de sintaxis highlighting adicional.
- **No tocar `src/middleware.ts` más allá de lo descrito** (extender
  `isPublicLocalePath()`/`matcher` para `/blog`) — el resto del archivo permanece intacto,
  archivo protegido según CLAUDE.md.
- **No usar imágenes de portada reales ni retocadas** — placeholder Tipo 3 únicamente, un GAP
  de seguimiento las sustituye (mismo patrón que B2).
- **No paginar el índice de blog** — con 3 artículos no hace falta, se revisa cuando haya
  más contenido.
- **Sin scroll horizontal de tarjetas en mobile** (`landing-proposal.md` §4.4).

---

## Implementación

### Archivos creados

- `src/types/blog.ts` — `BlogLocale`, `BlogCluster`, `BlogFrontmatter`, `BlogArticleSummary`, `BlogArticle`.
- `src/lib/blog/blogRepository.ts` — `getAllBlogSlugs`/`getArticleSummaries`/`getArticleBySlug`, registro estático de los 3 artículos (mismo patrón `TIER_KEYS` de `pricing/page.tsx`), lee el cuerpo `.md` con `fs`/`path`.
- `src/lib/blog/blogAuthor.ts` — placeholder de firma founder-led.
- `src/content/blog/trazabilidad-industria-pesquera/{es,pt,en}.md` + `meta.ts`
- `src/content/blog/gestion-lonjas-compras/{es,pt,en}.md` + `meta.ts`
- `src/content/blog/etiquetado-normativa-pesca/{es,pt,en}.md` + `meta.ts`
- `src/components/LandingPage/blog/ArticleCard.tsx`, `ClusterBadge.tsx`, `AuthorByline.tsx`
- `src/app/[locale]/blog/page.tsx` — índice.
- `src/app/[locale]/blog/[slug]/page.tsx` — artículo, render Markdown vía `react-markdown`+`remark-gfm`, JSON-LD `BlogPosting`.
- `src/app/blog/rss/[locale]/route.ts` — feed RSS 2.0 por locale, XML construido a mano.

### Archivos modificados

- `src/middleware.ts` — `isPublicLocalePath()` amplía con `/blog` y un regex de un único segmento (`/^\/blog\/[^/]+$/`) para no capturar `/blog/rss/{locale}` (2 segmentos, fuera del árbol `[locale]`, no necesita el rewrite); `matcher` añade `'/blog'` y `'/blog/:slug'`.
- `src/app/sitemap.ts` — añadida entrada `/blog` + las 3 entradas `/blog/{slug}` vía `getAllBlogSlugs()`.
- `src/components/LandingPage/Footer.tsx` — enlace nuevo a `/blog` (`Link` locale-aware).
- `src/messages/{es,pt,en}/landing.json` — namespace `Blog` (`indexTitle`, `indexDescription`, `backToBlog`, `byLabel`, `clusters.*`) + `Landing.footer.blogLink`, en los 3 idiomas.
- `src/app/[locale]/layout.tsx`, `page.tsx`, `pricing/page.tsx`, `legal/privacy/page.tsx`, `legal/terms/page.tsx`, `blog/page.tsx`, `blog/[slug]/page.tsx` — **fuera del alcance original del GAP**, ver "Desviaciones del plan".

### Decisiones tomadas durante la implementación

- **Pivote MDX → Markdown plano** (confirmado con Jose antes de escribir código): en vez de `next-mdx-remote` (dependencia nueva aprobada inicialmente), se usa `react-markdown`+`remark-gfm`, ya instalados y en uso real en `src/components/AI/Chat/MarkdownRenderer.js`. Cero dependencias nuevas en `package.json`. El frontmatter vive en un `meta.ts` tipado por artículo en vez de parseado desde el propio Markdown (sin `gray-matter`).
- **Slugs técnicos elegidos por el implementador** (títulos/ángulo exacto delegados a `landing-content-writer`, como ya estaba acordado): `trazabilidad-industria-pesquera`, `gestion-lonjas-compras`, `etiquetado-normativa-pesca`.
- **RSS fuera del árbol `[locale]`**, en `src/app/blog/rss/[locale]/route.ts` — confirmado que no necesita cambios de middleware (ruta de 2 segmentos tras `/blog/`, excluida a propósito del regex de `isPublicLocalePath`).
- **`react-markdown` en Server Component**: `[slug]/page.tsx` no lleva `'use client'` — `react-markdown` no depende de APIs de navegador, se renderiza igual que cualquier otro Server Component async del proyecto.
- **Autoría delegada a `landing-content-writer`** vía subagente (`Agent` tool) para los 3 artículos (ES + traducción PT/EN) y las claves de `Blog`/`footer.blogLink` en `pt`/`en` — el implementador construyó la capa técnica primero con contenido placeholder verificado (`type-check`/`lint`/rutas 200), y delegó el contenido real una vez la infraestructura estaba probada.

### Desviaciones del plan (si las hay)

**Bug pre-existente descubierto y corregido (fuera del alcance original de GAP-123, aprobado explícitamente por Jose durante la implementación):**

Al verificar `/pt` y `/en` con el servidor real (no solo `curl -o /dev/null`, sino inspeccionando el HTML servido), se detectó que el `<h1>`/cuerpo visible de páginas ya cerradas (`/pt/pricing`, `/en/legal/privacy`, home en `/pt`) se servía en **español**, mientras que el `<title>` sí estaba correctamente traducido. Causa raíz: `src/middleware.ts` solo invoca `intlMiddleware` para rutas *sin prefijo* (`isPublicLocalePath`); las rutas ya prefijadas (`/pt/*`, `/en/*`) nunca pasan por el middleware (ni falta que les hace para el routing — Next.js resuelve `[locale]` por carpetas), pero `next-intl` necesita `setRequestLocale()` para fijar el locale ambiental que usan `getTranslations()`/`useTranslations()` **sin locale explícito**. Como `setRequestLocale` no se llamaba nunca en el proyecto, esas llamadas ambientales caían siempre al locale por defecto (`es`) bajo `/pt/*`/`/en/*` — afectaba a prácticamente todo el contenido visible de body de las Fases B1/B2/C ya cerradas (Hero, ModulesBento, HowItWorks, Footer, TrustBadge, PricingPreview, LeadCaptureForm, páginas legales), no solo al blog nuevo. Solo el `<title>` se libraba porque cada `generateMetadata` pasa el locale explícitamente.

Confirmado con Jose (ver transcript) y corregido en la misma sesión: `setRequestLocale(locale)` añadido en `[locale]/layout.tsx` y, tras comprobar que el fix solo en el layout era inestable entre requests intercaladas de distintos locales (comportamiento documentado por next-intl con `generateStaticParams` — cada página necesita su propia llamada, no solo el layout), también en `[locale]/page.tsx`, `pricing/page.tsx`, `legal/privacy/page.tsx`, `legal/terms/page.tsx`, `blog/page.tsx` y `blog/[slug]/page.tsx`. Verificado con 7 rondas intercaladas es/pt/en/pt/en/es/pt sobre `/pricing` y `/blog/etiquetado-normativa-pesca` — 100% estable, cada locale devuelve su propio texto y sus propios `href` (`/pt/legal/privacy`, `/en/legal/privacy`, `/legal/privacy`).

**Pendiente, dejado explícitamente fuera (decisión de Jose):** `<html lang="es">` sigue fijo en `src/app/layout.js` (layout raíz, compartido con el ERP autenticado — `/admin`, `/comercial`, etc. — que no es multiidioma). No afecta al contenido visible, solo al atributo de idioma que leen buscadores/lectores de pantalla. Corregirlo requiere tocar un archivo `.js` legacy compartido por toda la app (migración a `.tsx` en el mismo commit, por regla de CLAUDE.md) — se deja para un GAP aparte, no se resuelve aquí.

---

## Auditoría

### Resultado: ✅ APROBADO CON OBSERVACIONES

### Puntuación: 9/10 — 15 de 15 criterios de aceptación verificados con servidor de desarrollo
real (no solo lectura de código), incluidas 7 rondas intercaladas es/pt/en para descartar
inestabilidad tras el fix del bug site-wide. Resto un punto por la desviación real (aunque
aprobada y bien justificada) sobre el bug de `setRequestLocale` que amplía el alcance del GAP
más allá de lo listado originalmente.

### Checklist de criterios de aceptación (verificado con servidor real, curl + inspección de
HTML servido, no solo `-o /dev/null`)

- [x] `package.json` sin dependencias nuevas — `git diff package.json` sin cambios (pivote a
      `react-markdown`/`remark-gfm` ya instalados, confirmado con Jose).
- [x] 9 `.md` + 3 `meta.ts` en `src/content/blog/`, sin placeholders `[Pendiente]`/`[Pending]`/
      `[Pendente]` restantes (`grep` → 0 resultados).
- [x] `GET /blog` → 200, 3 tarjetas con `ClusterBadge` + `AssetPlaceholder` Tipo 3.
- [x] `GET /pt/blog` y `GET /en/blog` → 200, índice traducido (confirmado tras el fix de
      `setRequestLocale`, con verificación intercalada para descartar flakiness).
- [x] `GET /blog/{slug}` (los 3 slugs, es) → 200, Markdown renderizado, `AuthorByline`, fecha
      localizada, JSON-LD `BlogPosting` con `headline`/`description`/`datePublished`/`author`.
- [x] `GET /pt/blog/{slug}` y `GET /en/blog/{slug}` (los 3 slugs) → 200, contenido traducido —
      verificado con 7 rondas intercaladas, 100% estable.
- [x] `GET /blog/no-existe` → 404 (`notFound()` disparado desde `blogRepository`).
- [x] `GET /blog/rss/es|pt|en` → 200, `Content-Type: application/rss+xml`, 3 `<item>` cada uno
      con títulos ya traducidos.
- [x] `GET /sitemap.xml` incluye `/blog` + los 3 slugs, cada entrada con `alternates`/`hreflang`
      de los 3 locales — confirmado contando `<loc>` con "blog" (4 entradas nuevas) sobre las 4
      previas.
- [x] `Footer.tsx` enlaza a `/blog` (locale-aware) — confirmado `href="/pt/blog"` bajo `/pt` tras
      el fix.
- [x] Primeras ~200 palabras de cada artículo en español responden la pregunta principal
      directamente (verificado por lectura de los 3 `.md`, regla GEO/AEO cumplida).
- [x] Cero cifras/certificaciones/testimonios inventados (`grep` "ISO 27001"/"99.9%"/"4.9/5" → 0
      sobre el HTML servido de los 3 artículos).
- [x] `grep -rn "sky-"` sobre `src/components/LandingPage/blog/` y `src/app/[locale]/blog/` y
      sobre el HTML servido → 0 resultados.
- [x] Mobile: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` en el índice — columna única por
      defecto, sin scroll horizontal.
- [x] `GET /` en subdominio de tenant y `isGenericBranding` sin regresión; `npm run type-check`
      y `npm run lint` limpios (268 warnings preexistentes, 0 nuevos, 0 errores).

### Checklist técnico del proyecto

- [x] Sin `fetch()` directo — confirmado.
- [x] Sin hardcode de tenant/`X-Tenant` — N/A, landing pública.
- [x] Sin archivos `.js` nuevos — todos `.ts`/`.tsx`/`.md` (datos, no código).
- [x] Sin `any` sin justificación — confirmado.
- [x] **`middleware.ts` (protegido):** diff exactamente el descrito (regex de un segmento para
      `/blog/{slug}`, excluyendo a propósito `/blog/rss/{locale}`) + `matcher` ampliado. Resto
      del archivo (auth JWT, RBAC) intacto.
- [x] Server/Client Components correctamente separados — los 2 componentes nuevos que renderizan
      con `getTranslations` son Server async; ningún `'use client'` innecesario en el blog.
- [x] Nomenclatura correcta — PascalCase en componentes, camelCase en namespaces.
- [x] `queryKeys`/Skeleton — N/A, contenido estático sin TanStack Query.

### Revisión Visual

- [x] Color: solo tokens (`bg-background`, `text-foreground`, `text-muted-foreground`,
      `border-border`, `bg-secondary`) — cero `sky-*`, cero hex/rgb hardcodeado.
- [x] Layout: índice sigue el patrón de `pricing/page.tsx` (título centrado + grid de tarjetas);
      artículo sigue el patrón de `legal/privacy/page.tsx` (header con logo + `main` centrado,
      `max-w-prose` para el cuerpo).
- [x] Componentes: `Card`, `Badge`, `AssetPlaceholder`, `ScrollReveal` reutilizados sin
      modificar su código, tal como especificaba el UI Brief.
- [x] Placeholders de portada con su clasificación Tipo 3 visible (`AssetPlaceholder` ya
      garantiza esto).
- [x] Mobile: columna única en el índice, ancho de lectura limitado en el artículo.

**Observación (no bloqueante, ya corregida dentro de este mismo GAP):** el hallazgo del bug
`setRequestLocale` amplía el diff de este GAP más allá de los archivos originalmente listados
(toca `page.tsx` de home/pricing/legal, de Fases B1/C ya cerradas). Fue detectado durante la
verificación, confirmado explícitamente con Jose antes de tocar cualquier archivo, y resuelto con
el patrón oficial documentado por `next-intl` — no es una desviación de alcance de negocio, es
una corrección técnica necesaria para que el propio objetivo del GAP (blog visible correctamente
en PT/EN) se cumpliera de verdad. Señalo la puntuación en 9/10 solo por la amplitud del diff, no
por ningún defecto en la implementación.

### Revisión UX — Light (decisión razonada, no Full)

Este GAP añade contenido de lectura (blog + artículos) sin ningún flujo de 2+ pasos, sin formulario
nuevo, sin modal, sin entidad primaria del ERP y sin permisos por rol (landing pública). El único
control interactivo reutilizado (`Link` a `/blog`) usa el mismo patrón ya existente. Coincide con
el mismo razonamiento ya usado en GAP-121/GAP-122 para Fases B2/C.

```
UX REVIEW — LIGHT
═════════════════
GAP: GAP-123 — Landing Fase D: blog + GEO/AEO
Mode: Light (contenido de lectura, sin flujo nuevo de usuario)

[x] El cambio es autoexplicativo — índice de blog + artículo individual, patrón estándar
    reconocible sin instrucción
[x] No introduce una decisión nueva de usuario sin affordance — enlaces de navegación simples
[x] Consistente con la UI circundante — mismos tokens/componentes que el resto de la landing
[x] Estados interactivos — heredados de Card/Button/Link ya usados en el resto del sitio
[x] Tono del texto — artículos en tono B2B directo, vocabulario de sector correcto
    (lonjas, maquiladores/produção subcontratada, lotes, fresco/congelado)

VERDICT: ✅ APROBADO
```

### System Learner check

**PL CANDIDATE 1 (severidad alta):** `setRequestLocale()` de `next-intl` nunca se llamaba en el
proyecto. Con `generateStaticParams` declarado en `[locale]/layout.tsx`, cualquier
`getTranslations()`/`useTranslations()` **sin locale explícito** (el patrón usado en casi todos
los componentes del sitio público) caía silenciosamente al locale por defecto (`es`) bajo rutas
ya prefijadas (`/pt/*`, `/en/*`) — un bug invisible en cualquier verificación basada solo en
`<title>`/metadata (que sí pasa el locale explícito) o en `curl -o /dev/null -w "%{http_code}"`
(que no inspecciona el body). Afectaba a todo el contenido de Fases B1/B2/C ya cerradas. Regla a
formalizar: **toda página nueva bajo `[locale]` debe llamar `setRequestLocale(locale)` como
primera línea tras `await params`** (patrón ya aplicado en las 7 páginas existentes tras este
GAP) — y toda verificación de i18n futura debe inspeccionar contenido de **body** real (`<h1>`,
texto visible), no solo `<title>`/código de estado HTTP.

**PL CANDIDATE 2:** el patrón "registro estático + `meta.ts` tipado por carpeta" para contenido
versionado en git (usado aquí para los 3 artículos) es reutilizable para cualquier contenido
futuro similar (páginas pilar de Fase D, casos de estudio, etc.) — evita parsear frontmatter en
runtime y da autocompletado/type-safety completo. Vale la pena documentarlo como patrón de
referencia si Fase D se amplía.

### Observaciones para Jose

Implementación completa y verificada con servidor de desarrollo real: los 3 artículos (ES + PT +
EN) están publicados con contenido real (no placeholder), el RSS funciona en los 3 idiomas, el
sitemap incluye las nuevas páginas con `hreflang`, y cero regresión sobre lo que dejaron las
Fases A/B1/B2/C.

**Lo más importante de este GAP no estaba en el plan original:** durante la verificación se
descubrió que **todo el contenido de body de las páginas en `/pt/*` y `/en/*` se estaba sirviendo
en español** desde que se activaron esos locales en Fase C — un bug invisible sin abrir un
navegador real o inspeccionar el HTML servido más allá del `<title>`. Es exactamente el tipo de
problema que las 4 auditorías anteriores venían señalando como pendiente ("verificación visual
humana todavía no hecha"). Se pausó la implementación en cuanto se detectó, se explicó la
causa raíz y solo se continuó tras tu confirmación explícita. Ya está corregido y verificado con 7
rondas intercaladas de locales — recomiendo encarecidamente que le eches un vistazo tú mismo en
`npm run dev` a `/pt` y `/en` para confirmarlo con tus propios ojos antes de dar esto por cerrado
del todo.

**Pendiente, dejado fuera a propósito:** `<html lang="es">` sigue fijo en el layout raíz
(`src/app/layout.js`) — no afecta al contenido visible, solo al atributo que leen buscadores y
lectores de pantalla. Requiere tocar un archivo compartido con todo el ERP autenticado y
migrarlo de `.js` a `.tsx`; decidiste dejarlo para un GAP aparte en vez de resolverlo aquí.

**Pendiente heredado, sin cambios:** el nombre/rol exacto del autor founder-led sigue en
placeholder (`src/lib/blog/blogAuthor.ts`) hasta que lo confirmes — no bloquea el cierre, mismo
patrón que el precio pendiente de Fase C. Los 6 placeholders de assets Tipo 2/Tipo 3 de B2 y los
prompts de portada de estos 3 artículos nuevos siguen pendientes de sustitución por imágenes
reales (mismo GAP de assets de seguimiento ya identificado).

### Estado final de la implementación

El sitio público tiene ahora `/blog` (índice) y `/blog/{slug}` (3 artículos reales, uno por topic
cluster) en los 3 idiomas, RSS por locale, sitemap actualizado y enlace en el footer. Además,
esta sesión corrigió un bug pre-existente de severidad alta que impedía que el contenido de body
de todo el sitio se sirviera correctamente en portugués/inglés — confirmado y corregido con
autorización explícita de Jose, verificado de forma exhaustiva (rondas intercaladas, no solo
comprobación puntual). Pendiente real: verificación visual humana en navegador (recomendada con
urgencia esta vez, dado lo que se acaba de descubrir) y el nombre del autor founder-led.
