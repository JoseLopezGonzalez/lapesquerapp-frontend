# GAP-123 — Landing Fase D: blog + GEO/AEO (infraestructura + 3 artículos)

## Metadata

- **Tipo:** Feature
- **Módulo:** Global (sitio público / landing)
- **Prioridad:** Media
- **Estado:** open
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
| **Almacenamiento de contenido** | MDX versionado en el repo (`src/content/blog/`), no JSON ni CMS externo. Publicar un artículo nuevo es añadir archivos y desplegar — consistente con que todo el contenido del proyecto vive en git. |
| **Artículos de lanzamiento** | 3 artículos, uno por cada topic cluster ya definido en `landing-proposal.md` §4.6: **Trazabilidad en la industria pesquera**, **Gestión de lonjas y compras**, **Etiquetado y cumplimiento normativo**. Título y ángulo exacto de cada artículo los define `landing-content-writer` dentro de su pilar — mismo patrón de delegación que B2 con los nombres de los tiers de pricing. |
| **Autoría** | Founder-led: cada artículo lleva firma de Jose (nombre + rol breve). **El nombre completo/bio exacta a mostrar públicamente no está confirmado todavía** — ver Restricciones, es un caso de la misma regla de honestidad que ya bloqueó cifras/certificaciones inventadas. |
| **Layout del índice `/blog`** | Mismo sistema monocromo de tokens OKLCH que el resto del sitio (B2), sin layout alternativo. |
| **Imagen de portada por artículo** | Placeholder Tipo 3 (bento illustration IA) vía el componente `AssetPlaceholder` ya existente — no bloquea el cierre, se sustituye en un GAP de assets posterior (mismo patrón que los 6 placeholders de B2). |
| **Traducción PT/EN** | `landing-content-writer` traduce los 3 artículos en este mismo GAP, fiel al texto aprobado en ES — revisión de Jose después no bloquea el cierre (mismo patrón que Fase C). |
| **Pillar pages (topic cluster hubs)** | No se crean en este GAP — con solo 1 artículo por pilar no hay suficiente contenido hijo que enlazar todavía. Se revisan en un GAP posterior cuando haya 2–3 artículos por cluster. |
| **Workflow de publicación** | Vía repo/deploy — sin panel de edición ni CMS. |
| **RSS feed** | Sí, incluido en este GAP — un feed por locale. |
| **Mobile** | Aplica ya — mismo criterio mobile-first del resto de la landing. |
| **Dependencia nueva** | Aprobado `next-mdx-remote` (variante `/rsc`) — único paquete nuevo necesario, compila MDX en Server Components y parsea el frontmatter sin necesitar `gray-matter` aparte. |

### Decisiones técnicas del discovery (no preguntas, derivadas de patrones ya establecidos)

- **Mismo slug en los 3 locales:** `/blog/{slug}` (es, sin prefijo), `/pt/blog/{slug}`,
  `/en/blog/{slug}` — el contenido se traduce, la URL no cambia de estructura entre idiomas,
  exactamente el mismo criterio ya aplicado a `/pricing` y `/legal/*` en Fase C.
- **Un artículo = una carpeta con 3 archivos MDX** (`src/content/blog/{slug}/es.mdx`,
  `pt.mdx`, `en.mdx`) en vez de un único archivo con secciones por idioma — mantiene cada
  traducción como archivo independiente, más fácil de revisar/corregir por separado (igual
  razonamiento que separar `es/landing.json`, `pt/landing.json`, `en/landing.json`).
- **RSS fuera del árbol `[locale]`**, en `src/app/blog/rss/[locale]/route.ts` — no necesita
  el rewrite de `next-intl` (no es una página para humanos, es un feed de máquina con URL ya
  explícita por idioma), así que no requiere tocar `isPublicLocalePath()`/`matcher` de
  `src/middleware.ts` para esta pieza.

---

## Solución acordada

### 1. Dependencia nueva

- `package.json`: añadir `next-mdx-remote`.

### 2. Tipos

- `src/types/blog.ts` — `BlogCluster = 'trazabilidad' | 'lonjas-compras' | 'etiquetado-normativa'`;
  `BlogFrontmatter` (`title`, `description`, `publishedAt: string` ISO, `cluster: BlogCluster`,
  `coverPlaceholderLabel: string` — el texto/prompt Tipo 3 específico de ese artículo); `BlogArticleSummary`
  (subset de frontmatter + `slug`, usado en el índice sin compilar el MDX completo).

### 3. Contenido — 9 archivos MDX (3 artículos × 3 locales)

- `src/content/blog/{slug-trazabilidad}/{es,pt,en}.mdx`
- `src/content/blog/{slug-lonjas-compras}/{es,pt,en}.mdx`
- `src/content/blog/{slug-etiquetado-normativa}/{es,pt,en}.mdx`

Cada archivo con frontmatter (`title`, `description`, `publishedAt`, `cluster`,
`coverPlaceholderLabel`) + cuerpo en Markdown/MDX. Las primeras ~200 palabras del cuerpo
responden la pregunta principal del artículo de forma directa, sin introducción narrativa previa
(regla GEO/AEO de `landing-context.md` §4.5). Contenido y traducción a cargo de
`landing-content-writer`, sin cifras/certificaciones/testimonios inventados (regla dura de
`landing-context.md` §5, aplica igual a blog que al resto del sitio).

### 4. `src/lib/blog/blogRepository.ts`

Server-only (usa `fs`/`path` de Node — nunca importado desde un Client Component):

- `getAllBlogSlugs(): string[]` — lee los nombres de carpeta bajo `src/content/blog/`.
- `getArticleSummaries(locale: string): BlogArticleSummary[]` — lee el frontmatter (sin compilar
  el cuerpo) de cada `{slug}/{locale}.mdx`, ordenado por `publishedAt` descendente.
- `getArticleBySlug(locale: string, slug: string)` — lee `{slug}/{locale}.mdx`, compila con
  `compileMDX` de `next-mdx-remote/rsc` (devuelve `{ content, frontmatter }`); `notFound()` de
  `next/navigation` si el archivo no existe para esa combinación locale/slug.

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
  slugs), render del MDX compilado, `AuthorByline`, `ClusterBadge`, fecha localizada
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

- [ ] `package.json` incluye `next-mdx-remote`; `npm run type-check`/`lint` limpios tras
      instalarlo.
- [ ] Existen 9 archivos MDX (3 slugs × 3 locales) bajo `src/content/blog/`, cada uno con
      frontmatter completo (`title`, `description`, `publishedAt`, `cluster`,
      `coverPlaceholderLabel`).
- [ ] `GET /blog` (dominio raíz, español sin prefijo) devuelve 200 con las 3 tarjetas de
      artículo, cada una con su `ClusterBadge` y `AssetPlaceholder` tipo 3.
- [ ] `GET /pt/blog` y `GET /en/blog` devuelven 200 con el índice traducido.
- [ ] `GET /blog/{slug}` (los 3 slugs, español) devuelve 200 con el contenido MDX renderizado,
      `AuthorByline`, fecha localizada, JSON-LD `BlogPosting` presente en el `<head>`/script.
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
- `src/content/blog/{slug-trazabilidad}/es.mdx`, `pt.mdx`, `en.mdx`
- `src/content/blog/{slug-lonjas-compras}/es.mdx`, `pt.mdx`, `en.mdx`
- `src/content/blog/{slug-etiquetado-normativa}/es.mdx`, `pt.mdx`, `en.mdx`
- `src/lib/blog/blogRepository.ts`
- `src/lib/blog/blogAuthor.ts`
- `src/components/LandingPage/blog/ArticleCard.tsx`
- `src/components/LandingPage/blog/ClusterBadge.tsx`
- `src/components/LandingPage/blog/AuthorByline.tsx`
- `src/app/[locale]/blog/page.tsx`
- `src/app/[locale]/blog/[slug]/page.tsx`
- `src/app/blog/rss/[locale]/route.ts`

**Modificar:**
- `package.json` / `package-lock.json` (añadir `next-mdx-remote`)
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
- **No añadir ninguna dependencia además de `next-mdx-remote`** — sin `gray-matter`, sin
  `reading-time`, sin librería de sintaxis highlighting adicional (MDX ya soporta bloques de
  código básicos sin plugin extra si no se usan en estos 3 artículos).
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
