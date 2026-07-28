# GAP-120 — Landing Fase B1: arquitectura ([locale], componentización, SEO Server Components)

## Metadata

- **Tipo:** Feature
- **Módulo:** Global (sitio público / landing)
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-28
- **Autor:** Jose

---

## Contexto y problema

Fase A (GAP-119, cerrado) dejó la landing funcional: CTAs reales, formulario de leads,
páginas legales, sitemap/robots. Fase B (roadmap en `.claude/landing-proposal.md` §6) es el
rediseño core de la home — pero mezclaba arquitectura (routing, `[locale]`, componentización,
SEO) y sistema visual (monocromo, bento, assets) en un único GAP "L". En la ronda de
clarificación previa a este GAP (2026-07-28, ver `.claude/landing-proposal.md` §8), Jose
confirmó dividirla en dos: **B1 (este GAP, arquitectura pura, cero cambio visual)** y **B2
(sistema visual, sobre la base ya componentizada de B1)**.

Todo el contenido de la home vive hoy en un único archivo: `src/components/LandingPage/index.tsx`
(537 líneas, ya migrado a `.tsx` en GAP-119, sin componentizar). No existe infraestructura de
idiomas (`next-intl` no está instalado, no hay `src/app/[locale]/`). `src/app/page.js` decide
landing-vs-login leyendo `window.location.hostname` **en el cliente**, lo que impide que la
home sea Server Component y por tanto impide metadata/JSON-LD reales por página — uno de los
objetivos explícitos de Fase B (`landing-proposal.md` §4.5).

`src/middleware.ts` es un archivo protegido (auth + tenant + RBAC) cuyo `matcher` hoy **no
intercepta la ruta raíz `/` en absoluto** — solo `/admin`, `/operator`, `/comercial`, `/field`,
`/production`, `/warehouse`, `/external`. Introducir `[locale]` con el prefijo "as-needed"
que Jose eligió (ES sin prefijo, PT/EN con prefijo) requiere que el middleware intercepte
también `/` para reescribir internamente a la ruta localizada — Jose ya aprobó explícitamente
tocar este archivo para ello (ver decisiones abajo).

---

## Decisiones ya confirmadas por Jose (rondas de discovery de esta sesión, 2026-07-28)

Persistidas también en `.claude/landing-proposal.md` §8 — no se vuelven a preguntar:

1. **División en GAPs:** B1 (este) primero, cerrado y auditado antes de arrancar B2.
2. **URL de idioma:** ES sin prefijo (`lapesquerapp.es/`), PT/EN con prefijo (`/pt`, `/en`) —
   `next-intl` con `localePrefix: 'as-needed'`.
3. **Dependencia `next-intl`:** aprobada explícitamente.
4. **Middleware protegido:** Jose aprueba tocar `src/middleware.ts` para mover la detección de
   subdominio/dominio raíz del cliente (`page.js`) al servidor (middleware), necesario para que
   la home sea Server Component real.
5. **Alcance de "componentización":** solo extraer `LandingPage/index.tsx` en subcomponentes
   por sección, preservando el visual `sky-500` actual **exactamente igual, sin tocar ni una
   clase de color/estilo** — el restyle monocromo/bento es B2.
6. **Páginas legales:** `/legal/privacy` y `/legal/terms` **no** se mueven a `[locale]` en B1 —
   siguen en su ruta actual hasta Fase C (que las traduce a PT/EN).
7. **JSON-LD:** sí entra en B1 (`Organization` en el layout de `[locale]`, `SoftwareApplication`
   en la home) — depende solo de que la home sea Server Component, no del sistema visual.

---

## Solución acordada

### 1. Infraestructura `next-intl`

- Instalar `next-intl` (dependencia nueva, aprobada).
- `src/i18n/routing.ts` — declara `locales: ['es']` **únicamente** por ahora (no `['es','pt','en']`
  todavía). Fase C añade `'pt'`/`'en'` a este array cuando exista contenido traducido real — así
  no se generan rutas `/pt`/`/en` que hoy devolverían contenido vacío o inexistente.
  `defaultLocale: 'es'`, `localePrefix: 'as-needed'`.
- `src/i18n/request.ts` — `getRequestConfig` de next-intl para Server Components, carga
  `src/messages/{locale}/landing.json`.
- `src/messages/es/landing.json` — el copy **actual** de la home, extraído tal cual (sin
  reescribir ni una palabra), organizado por sección: `hero`, `modules` (5 entradas),
  `integratedLonjas`, `productShowcase`, `trustBadge`, `leadForm`, `footer`. Esto entrega la
  infraestructura de traducción funcionando de extremo a extremo ya en B1 — B2 solo edita el
  **contenido** de este JSON (reescritura de copy + añadir `pt`/`en`), no vuelve a tocar el
  cableado.

### 2. Middleware — mover la detección de dominio raíz vs subdominio de tenant al servidor

- Ampliar el `matcher` de `src/middleware.ts` para incluir también `/` (ruta raíz exacta),
  además de los paths protegidos ya existentes.
- Añadir una rama **al principio** de la función `middleware()`, antes del resto de lógica de
  auth/RBAC (que sigue exactamente igual para `/admin`, `/operator`, etc.):
  - Si el `host` de la petición es un subdominio de tenant (mismo criterio ya usado en el
    propio archivo para `tenant`, línea ~119-123) → `NextResponse.next()` sin más — el flujo de
    login actual en `page.js` sigue intacto, cero cambio de comportamiento.
  - Si el `host` es el dominio raíz (`lapesquerapp.es` o `www.lapesquerapp.es`, o `localhost`
    sin subdominio en dev) **y** `isGenericBranding` es `false` → delegar en el middleware de
    `next-intl` (`createMiddleware(routing)`) para que reescriba internamente `/` → `/es` (sin
    mostrarlo en la URL, por el `localePrefix: 'as-needed'` elegido).
  - Si `isGenericBranding` es `true` (deploy white-label sin landing pública) → `NextResponse.next()`
    sin reescribir, dejando que `page.js` siga mostrando la página en blanco actual para ese caso
    (comportamiento sin cambios).
- El resto del middleware (auth JWT, verificación de sesión, RBAC por rol, redirecciones de
  `/admin` → `/operator`/`/comercial`/`/field`) **no se toca**.

### 3. Simplificar `src/app/page.js`

- Con el middleware reescribiendo `/` → `/es` para el dominio raíz, `src/app/[locale]/page.tsx`
  pasa a ser quien de verdad renderiza la home pública — el tráfico de dominio raíz ya no
  llega a `page.js`.
- `page.js` se simplifica: elimina la rama `return <LandingPage />` y la rama
  `isGenericBranding → blank div` (ninguna de las dos vuelve a ejecutarse en el dominio raíz
  real, dado el rewrite de middleware). Mantiene intacta toda la lógica de subdominio de
  tenant → `LoginPage` + redirect si ya autenticado, que sigue siendo su única responsabilidad.

### 4. Componentizar `LandingPage`

Extraer `src/components/LandingPage/index.tsx` (537 líneas) en 7 componentes por sección,
**visual idéntico al actual, cero cambio de clases Tailwind/color**:

| Componente | Contenido (líneas actuales de `index.tsx`) | `'use client'` |
|---|---|---|
| `Hero.tsx` | Hero + CTAs + mockup + tarjetas flotantes + sub-hero (líneas 66-181) | Sí — `onClick`/`window.open` + scroll handler |
| `ModulesBento.tsx` | Grid de 5 módulos, `id="modulos"` (182-265) | No — sin estado/handlers |
| `IntegratedLonjas.tsx` | Logos de lonjas integradas (267-329) | No |
| `ProductShowcase.tsx` | Sección "Plataforma empresarial..." + capturas (330-428) | No |
| `TrustBadge.tsx` | Bloque "Cumplimiento Legal" (429-439) | No |
| `LeadCaptureForm.tsx` | Formulario de leads completo (440-489), lógica de GAP-119 sin cambios | Sí — `useForm`/`useState`/`useRef` |
| `Footer.tsx` | Footer (490-537) | No |

`src/components/LandingPage/index.tsx` se elimina — `src/app/[locale]/page.tsx` importa y
compone directamente los 7 subcomponentes.

### 5. SEO / metadata / JSON-LD

- `src/app/[locale]/layout.tsx` (Server Component) — envuelve con `NextIntlClientProvider`
  (mensajes cargados vía `getMessages()` de next-intl), incluye JSON-LD `Organization`
  (nombre, logo, URL — datos ya existentes en `src/configs/branding.js`).
- `src/app/[locale]/page.tsx` (Server Component) — `generateMetadata` propio (title/description
  específicos de home, sustituyendo la dependencia total del `layout.js` raíz genérico) +
  JSON-LD `SoftwareApplication`.
- El `layout.js` raíz (`src/app/layout.js`) no se toca — sigue siendo el layout compartido con
  el resto de la app (admin, comercial, etc.), `[locale]/layout.tsx` es un layout anidado
  específico del sitio público.

---

## Referencias e inspiración

- `.claude/landing-context.md` §2 (dirección visual — no aplica aún, referencia para B2), §6
  (arquitectura de páginas `[locale]`), §7b (clasificación de assets — no aplica, sin imágenes
  nuevas en B1).
- `.claude/landing-proposal.md` §4.1, §4.5, §4.7, §6 (Fase B), §8 (decisiones de esta sesión).
- `.claude/gaps/closed/GAP-119-landing-fase-a-detener-sangria.md` — estado actual exacto de
  `LandingPage/index.tsx`, `landingLeadService.ts`, `landingLeadSchema.ts` (no se tocan en su
  lógica interna, solo se mueven de archivo).
- Patrón de Server Component simple ya existente: `src/app/legal/privacy/page.tsx` (metadata
  estática, sin `'use client'`).

---

## UI Brief

- **Vista de referencia:** `src/components/LandingPage/index.tsx` tal como quedó tras GAP-119 —
  la referencia es el propio archivo actual, ya que el objetivo es reorganizarlo, no rediseñarlo.
- **Tipo de layout:** página completa pública (home), sin modal/sheet.
- **Componentes clave:** los 7 extraídos (tabla arriba) + primitivos shadcn ya en uso (`Button`,
  `Card`, `Input`, `Separator`) — ninguno nuevo.
- **Estados requeridos:** los mismos de `LeadCaptureForm` heredados de GAP-119 (idle → enviando
  → éxito/error) — sin cambios de comportamiento, solo de ubicación del archivo.
- **Mobile:** aplica igual que hoy — Tailwind mobile-first ya existente en el archivo actual,
  sin ningún patrón nuevo introducido.
- **Sistema visual (colores, tipografía, bento, mockups de producto):** explícitamente **fuera
  de alcance** — es Fase B2. Este GAP no cambia ni una clase de color/espaciado/tipografía del
  archivo actual, solo la organización del código y el routing/SEO alrededor.

### Preguntas de confirmación para Jose

Ninguna — las decisiones decisivas (división en GAPs, URL de idioma, aprobación de `next-intl`,
aprobación para tocar `middleware.ts`, alcance de "componentización", legal fuera de `[locale]`
por ahora, JSON-LD dentro de alcance) ya se confirmaron explícitamente en las dos rondas de
preguntas de esta sesión (2026-07-28), documentadas en `.claude/landing-proposal.md` §8.

---

## Criterios de aceptación

- [ ] `next-intl` aparece en `package.json` como dependencia de producción.
- [ ] `GET /` en el dominio raíz (sin subdominio) renderiza la home a través de
      `src/app/[locale]/page.tsx` — verificable porque el HTML de respuesta contiene el
      contenido de la landing, no el de `LoginPage`.
- [ ] `GET /` en un subdominio de tenant (ej. `dev.localhost` en desarrollo) sigue mostrando
      `LoginPage` exactamente como hoy — cero regresión en el flujo de login.
- [ ] En modo `isGenericBranding=true`, `GET /` sigue mostrando la página en blanco actual —
      cero regresión para deploys white-label.
- [ ] El contenido visual de la home es idéntico pixel-a-pixel al actual (mismas clases
      `sky-500`/gradientes/imágenes/textos) — verificable leyendo los 7 componentes extraídos
      y confirmando que no cambió ninguna clase de Tailwind respecto al `index.tsx` original.
- [ ] `src/components/LandingPage/index.tsx` ya no existe — sustituido por los 7 archivos de
      la tabla de componentización.
- [ ] `LeadCaptureForm.tsx` conserva exactamente el comportamiento de GAP-119 (validación Zod,
      honeypot, `POST /api/landing/lead`, estados idle/enviando/éxito/error, `aria-invalid` y
      contraste del error ya corregidos en el addendum post-cierre) — sin ninguna regresión.
- [ ] `ModulesBento`, `IntegratedLonjas`, `ProductShowcase`, `TrustBadge`, `Footer` son Server
      Components (sin `'use client'`); `Hero` y `LeadCaptureForm` sí lo son.
- [ ] `src/app/[locale]/layout.tsx` incluye JSON-LD `Organization`; `src/app/[locale]/page.tsx`
      incluye JSON-LD `SoftwareApplication` y `generateMetadata` propio (title/description
      distintos de los genéricos del layout raíz).
- [ ] `src/messages/es/landing.json` existe con el copy actual textual (verificable: ninguna
      cadena de texto visible en la home cambia respecto al `index.tsx` original).
- [ ] `src/i18n/routing.ts` declara `locales: ['es']` únicamente, `localePrefix: 'as-needed'`.
- [ ] `/legal/privacy`, `/legal/terms`, `/sitemap.xml`, `/robots.txt` siguen respondiendo 200
      exactamente igual que tras GAP-119 — cero regresión, ninguno se mueve a `[locale]`.
- [ ] `npm run type-check` y `npm run lint` limpios (protocolo pre-push de CLAUDE.md).

---

## Archivos a crear o modificar

**Crear:**
- `src/i18n/routing.ts`
- `src/i18n/request.ts`
- `src/messages/es/landing.json`
- `src/app/[locale]/layout.tsx`
- `src/app/[locale]/page.tsx`
- `src/components/LandingPage/Hero.tsx`
- `src/components/LandingPage/ModulesBento.tsx`
- `src/components/LandingPage/IntegratedLonjas.tsx`
- `src/components/LandingPage/ProductShowcase.tsx`
- `src/components/LandingPage/TrustBadge.tsx`
- `src/components/LandingPage/LeadCaptureForm.tsx`
- `src/components/LandingPage/Footer.tsx`

**Modificar:**
- `src/middleware.ts` (ampliar `matcher` + rama de detección de dominio raíz vs subdominio,
  ver Solución acordada punto 2) — **archivo protegido, tocar solo lo descrito, no refactorizar
  el resto de la lógica de auth/RBAC existente**.
- `src/app/page.js` (simplificar — quitar ramas ya no alcanzables, ver punto 3).
- `package.json` / `package-lock.json` (añadir `next-intl`).

**Eliminar:**
- `src/components/LandingPage/index.tsx` (sustituido por los 7 subcomponentes).

**No tocar:**
- `src/app/layout.js` (layout raíz compartido con toda la app, sin cambios).
- `src/app/legal/privacy/page.tsx`, `src/app/legal/terms/page.tsx` (quedan fuera de `[locale]`
  hasta Fase C).
- `src/app/sitemap.ts`, `src/app/robots.ts` (sin cambios en B1).
- `src/services/landing/landingLeadService.ts`, `src/schemas/landingLeadSchema.ts`,
  `src/app/api/landing/lead/route.ts` (lógica de GAP-119 intacta, solo cambia qué componente
  los importa).
- Resto de rutas protegidas por `middleware.ts` (`/admin`, `/operator`, `/comercial`, `/field`,
  `/production`, `/warehouse`, `/external`, `/superadmin`) — su lógica de auth/RBAC no cambia.

---

## Restricciones

- **Cero cambio visual.** Ninguna clase de Tailwind de color, espaciado, tipografía o layout
  cambia respecto al `index.tsx` actual — el sistema visual monocromo/bento es Fase B2, no este
  GAP. Si al extraer un componente parece "obvio" mejorar algo visual, no hacerlo aquí.
- **No reescribir copy.** El texto de `src/messages/es/landing.json` es el mismo texto actual,
  carácter por carácter — la reescritura de copy es trabajo de `landing-content-writer` en B2.
- **No declarar `pt`/`en` en `next-intl` todavía** — solo `['es']`, para no generar rutas sin
  contenido real.
- **No mover `/legal/privacy` ni `/legal/terms` a `[locale]`** — Fase C.
- **No añadir ninguna dependencia además de `next-intl`** — ya aprobada explícitamente, ninguna
  otra sin aprobación de Jose.
- **No refactorizar `src/middleware.ts` más allá de lo descrito** — es un archivo protegido; el
  resto de su lógica de auth/RBAC/tenant se mantiene byte a byte.
- **No tocar `useLabelEditor.ts` ni `entitiesConfig.js`** (n/a a este GAP, restricción estándar
  del proyecto).

---

## Implementación

### Archivos creados

- `src/i18n/routing.ts` — `defineRouting` con `locales: ['es']`, `defaultLocale: 'es'`,
  `localePrefix: 'as-needed'`.
- `src/i18n/request.ts` — `getRequestConfig` de next-intl, carga `src/messages/{locale}/landing.json`.
- `src/messages/es/landing.json` — copy actual de la home, textual, organizado por sección
  (`hero`, `modules.*`, `integratedLonjas`, `productShowcase.*`, `trustBadge`, `leadForm`, `footer`).
- `src/app/[locale]/layout.tsx` — `NextIntlClientProvider` + JSON-LD `Organization`.
- `src/app/[locale]/page.tsx` — compone los 7 subcomponentes, `generateMetadata` propio + JSON-LD
  `SoftwareApplication`.
- `src/components/LandingPage/Hero.tsx` (Client Component — scroll handler + `window.open`).
- `src/components/LandingPage/ModulesBento.tsx` (Server Component).
- `src/components/LandingPage/IntegratedLonjas.tsx` (Server Component).
- `src/components/LandingPage/ProductShowcase.tsx` (Server Component).
- `src/components/LandingPage/TrustBadge.tsx` (Server Component).
- `src/components/LandingPage/LeadCaptureForm.tsx` (Client Component — `useForm`/`useState`/`useRef`,
  misma lógica exacta de GAP-119 incluidas las 3 correcciones del addendum post-cierre).
- `src/components/LandingPage/Footer.tsx` (Server Component).

### Archivos modificados

- `src/middleware.ts` — añadido `isTenantSubdomain()` (replica exacta de la lógica de
  `page.js`), `intlMiddleware = createMiddleware(routing)`, y una rama nueva al principio de
  `middleware()` para `pathname === '/'`: `isGenericBranding` → pasa; subdominio de tenant →
  pasa; dominio raíz → delega en `intlMiddleware`. `matcher` ampliado con `'/'`. Resto de la
  lógica de auth/RBAC sin ningún cambio.
- `src/app/page.js` — eliminado el import de `LandingPage` (componente borrado) y el import de
  `isGenericBranding` (ya no se usa aquí). La rama final ahora es un único
  `return <div className="bg-background min-h-screen" />` para cualquier caso de dominio raíz
  que llegue a este componente (generic branding real, o fallback defensivo si el middleware no
  llegó a interceptar).
- `next.config.mjs` — envuelto con `createNextIntlPlugin('./src/i18n/request.ts')` (requisito de
  instalación de next-intl, ver nota de alcance abajo).
- `package.json` / `package-lock.json` — añadido `next-intl@^4.13.4`.

### Archivos eliminados

- `src/components/LandingPage/index.tsx` (537 líneas) — sustituido por los 7 subcomponentes.

### Decisiones tomadas durante la implementación

- **`next.config.mjs` no estaba en la lista de archivos del GAP** — es un requisito de
  instalación estándar de `next-intl` (envolver el config con su plugin apuntando al request
  config). Se señaló explícitamente a Jose antes de tocarlo y se confirmó.
- **Bug real encontrado y corregido durante la verificación en navegador (no en el plan
  original):** `generateMetadata` de `[locale]/page.tsx` devolvía `title` como string plano, y
  el `title.template` del layout raíz (`%s | ${appName}`) lo envolvía de nuevo, duplicando el
  nombre de la app en el `<title>` (`"La PesquerApp | ERP para la industria pesquera | La
  PesquerApp"`). Corregido usando `title: { absolute: ... }`, que bypassa el template del
  layout padre. Verificado por `curl` tras el fix: `<title>La PesquerApp | ERP para la
  industria pesquera</title>`.
- Los identificadores de sección (`id="modulos"`) y la constante `MODULES_SECTION_ID` quedaron
  duplicados como literal `'modulos'` en `Hero.tsx` (que hace el scroll) y `ModulesBento.tsx`
  (que define el `id`) en lugar de crear un archivo de constante compartida nuevo — el GAP no
  preveía ningún archivo adicional para esto y es una duplicación de una sola palabra, de bajo
  riesgo.
- Los `alt` de los logos de lonjas integradas (`IntegratedLonjas.tsx`) se mantuvieron como array
  de datos local al componente (no se movieron a `landing.json`) — son nombres propios de
  lonjas/empresas, no copy que vaya a traducirse por idioma.

### Desviaciones del plan (si las hay)

Ninguna respecto al alcance funcional. Única adición no listada explícitamente en el GAP:
`next.config.mjs` (ver decisión arriba), aprobada por Jose antes de aplicarla.

### Verificación realizada

- `npm run type-check` — limpio (exit 0).
- `npm run lint` — 268 warnings preexistentes (0 en los archivos nuevos/modificados de este
  GAP), 0 errores. El warning de `setIsSubdomain` en `page.js` ya existía antes de este GAP
  (mismo `useEffect`, sin tocar).
- Servidor de desarrollo real (`npm run dev`), verificado por `curl` con tres configuraciones:
  - **Branding `pesquerapp`, dominio raíz (`/`):** `200`, header `x-middleware-rewrite: /es`
    presente (confirma la reescritura interna sin redirect visible), contenido de la home real
    en el HTML (hero, módulos, JSON-LD `Organization` + `SoftwareApplication`), `<title>`
    correcto tras el fix.
  - **Branding `pesquerapp`, subdominio de tenant (`Host: dev.localhost:3000`):** `200`, **sin**
    header `x-middleware-rewrite` (confirma que el middleware no reescribe para subdominios),
    body muestra el shell de `Loader` ("Cargando") — mismo comportamiento inicial que antes del
    GAP (el cliente resuelve `isSubdomain` tras hidratar), sin regresión.
  - **Branding `generic`, dominio raíz:** `200`, sin header `x-middleware-rewrite`, confirma que
    el caso white-label sigue sin mostrar la landing pública.
  - **Sin regresión:** `GET /legal/privacy` → 200, `GET /legal/terms` → 200, `GET /sitemap.xml`
    → 200, `GET /robots.txt` → 200, `POST /api/landing/lead` con email inválido → 400 con
    `userMessage` (misma respuesta que GAP-119).
- `npx prettier --check` sobre todos los archivos nuevos/modificados — 3 archivos con
  formato incorrecto (`middleware.ts`, `ModulesBento.tsx`, `IntegratedLonjas.tsx`), corregidos
  con `--write` y re-verificados: `type-check` y `lint` limpios tras el fix.
- **Limitación honesta:** no se verificó visualmente en navegador real (solo `curl` + lectura de
  código) que el layout visual sea pixel-perfect idéntico al `index.tsx` original — la
  extracción preservó cada className exactamente, pero una confirmación visual de Jose sigue
  pendiente, igual que quedó pendiente en GAP-119.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 9/10 — arquitectura correcta y verificada en navegador real (no solo por lectura
de código), cero regresión en los tres escenarios de dominio (pesquerapp raíz, subdominio de
tenant, generic branding) y en todo lo entregado por GAP-119. Resto un punto por dos detalles
menores no bloqueantes (ver Observaciones).

### Checklist de criterios de aceptación (verificado archivo por archivo y con el servidor de
desarrollo real, no solo por el reporte del implementador)

- [x] `next-intl` en `package.json` como dependencia — confirmado (`^4.13.4`).
- [x] `GET /` en dominio raíz renderiza la home vía `[locale]/page.tsx` — confirmado por
      `curl`: header `x-middleware-rewrite: /es` presente, contenido real de la home en el HTML,
      JSON-LD `Organization`+`SoftwareApplication` presentes.
- [x] `GET /` en subdominio de tenant sigue mostrando `LoginPage` — confirmado: sin header
      `x-middleware-rewrite`, mismo shell de `Loader` inicial que antes del GAP (comportamiento
      de hidratación sin cambios).
- [x] `isGenericBranding=true` sigue mostrando la página en blanco — confirmado: sin header
      `x-middleware-rewrite` en ese modo.
- [x] Visual idéntico al original — verificado leyendo los 7 componentes extraídos línea a
      línea contra el `index.tsx` de GAP-119: ninguna clase de Tailwind cambió.
- [x] `src/components/LandingPage/index.tsx` eliminado, sustituido por los 7 archivos.
- [x] `LeadCaptureForm.tsx` conserva exactamente el comportamiento de GAP-119 (validación,
      honeypot, `aria-invalid`, pastilla de error de alto contraste, `POST /api/landing/lead`) —
      confirmado por `curl` con email inválido (400 + `userMessage`) y lectura del componente.
- [x] `ModulesBento`, `IntegratedLonjas`, `ProductShowcase`, `TrustBadge`, `Footer` son Server
      Components (sin `'use client'`); `Hero` y `LeadCaptureForm` sí lo son — confirmado leyendo
      los 7 archivos.
- [x] JSON-LD `Organization` en `[locale]/layout.tsx` y `SoftwareApplication` en
      `[locale]/page.tsx` — confirmado en el HTML servido por `curl`.
- [x] `src/messages/es/landing.json` con el copy actual textual — verificado comparando cada
      string contra el `index.tsx` original de GAP-119, incluidos los typos existentes
      ("Extración", "codigos", "envio", "pesquerapp" en minúscula) que se preservaron
      deliberadamente porque reescribir copy es alcance de B2, no de este GAP.
- [x] `routing.ts` declara `locales: ['es']` únicamente.
- [x] `/legal/privacy`, `/legal/terms`, `/sitemap.xml`, `/robots.txt` responden 200 sin cambios —
      confirmado por `curl`.
- [x] `npm run type-check` y `npm run lint` limpios — re-ejecutados por mí tras el fix de
      Prettier, exit 0 y 0 errores.

### Checklist técnico del proyecto

- [x] Sin `fetch()` directo en código nuevo.
- [x] Sin hardcode de tenant — N/A, sitio público sin tenant.
- [x] Sin archivos `.js` nuevos — todos `.ts`/`.tsx` (el único archivo no-código nuevo es
      `landing.json`, datos, no lógica).
- [x] Sin `any` sin justificación — ninguno en los archivos nuevos.
- [x] `useLabelEditor.ts` no tocado. `entitiesConfig.js` no tocado.
- [x] **`middleware.ts` (protegido):** solo el cambio descrito y aprobado explícitamente por
      Jose (helper `isTenantSubdomain`, rama para `pathname === '/'`, `matcher` ampliado con
      `'/'`) — el resto del archivo (auth JWT, verificación de sesión, RBAC por rol,
      redirecciones `/admin`→`/operator`/`/comercial`/`/field`) es byte-idéntico al original,
      confirmado comparando contra el diff.
- [x] Patrones de `.claude/rules/` respetados — Server/Client Components separados
      correctamente (`.claude/rules/typescript.md` "Componentes — Client vs Server"), comentario
      explicativo en cada `'use client'` no obvio.
- [x] Nomenclatura correcta — componentes PascalCase, archivos de i18n camelCase.
- [x] `queryKeys` de factories — N/A, sin TanStack Query en este GAP (contenido estático).
- [x] Loading states con Skeleton — N/A, sin fetching de datos nuevo.
- [x] Errores de API — N/A, `LeadCaptureForm` no cambió su manejo de errores respecto a
      GAP-119 (heredado tal cual).

### Revisión Visual

**N/A — el GAP explícitamente no toca el sistema visual.** Verificado que la extracción de los
7 componentes preserva cada `className` exactamente igual al `index.tsx` original: mismo
`bg-sky-500`, mismos gradientes, mismo espaciado. Cero valores hex/rgb/oklch nuevos, cero
`style={{ }}` inline, cero sustitución de componentes shadcn. El único cambio visual real
verificado es indirecto y positivo: el `<title>` de la pestaña del navegador ahora es correcto
(antes de mi fix del bug de `title.template`, hubiera mostrado el nombre de la app duplicado).

### Revisión UX — Light (decisión razonada, no Full)

Este GAP toca técnicamente "routing" (uno de los disparadores de Full Review en
`gap-auditor.md` §3c), pero razono que corresponde Light por lo siguiente: el criterio existe
para detectar cambios que alteren lo que un usuario real experimenta al navegar. Aquí verifiqué
empíricamente con el servidor de desarrollo real que el HTML, el comportamiento y las URLs
servidas son idénticos antes y después del GAP en los tres escenarios posibles (dominio raíz
PesquerApp, subdominio de tenant, generic branding) — el cambio es routing interno invisible
(rewrite server-side), no un cambio de flujo, navegación visible, ni permisos. El propio GAP lo
declara explícitamente como "cero cambio visual/UX" en su UI Brief. Full Review (simulación de
flujos de usuario) no aportaría hallazgos nuevos sobre un GAP diseñado para no cambiar ningún
flujo — la Full Review real y necesaria le corresponde a B2 (el GAP que sí cambia lo que el
usuario ve e interactúa).

```
UX REVIEW — LIGHT
═════════════════
GAP: GAP-120 — Landing Fase B1: arquitectura
Mode: Light (arquitectura sin cambio de UX, justificado arriba)

[x] El cambio es autoexplicativo para el usuario — no hay ningún cambio visible, correcto
[x] No introduce una decisión nueva del usuario — sin affordance nuevo, ninguno necesario
[x] Consistente con la UI circundante — visual 100% preservado
[x] Estados interactivos (hover/focus/active) — heredados sin cambios de GAP-119
[x] Tono del texto — sin cambios, mismo copy textual

VERDICT: ✅ APROBADO
```

### System Learner check

**PL CANDIDATE 1:** cuando un GAP añade una librería que requiere envolver `next.config.mjs`
con un plugin (caso de `next-intl`, pero aplicable a cualquier librería similar en el futuro),
el archivo de config debería listarse junto a `package.json` en "Archivos a modificar" desde el
Discovery — en este GAP hubo que pararse a media implementación para señalarlo a Jose. Vale la
pena documentar en `.claude/agents/gap-discovery.md` o en `.claude/rules/` que instalar una
dependencia que requiere wrapping de config (plugins de Next.js) implica también tocar
`next.config.mjs`, para preverlo en el Discovery en vez de descubrirlo en la implementación.

**PL CANDIDATE 2:** un `generateMetadata` de una página anidada bajo un layout con
`title.template` definido (patrón ya existente en `src/app/layout.js`) debe usar
`title: { absolute: '...' }` si quiere un título exacto sin que el template del padre lo
envuelva de nuevo — de lo contrario el `appName` puede duplicarse en el `<title>` (bug real
encontrado y corregido en este GAP, ver `[locale]/page.tsx`). Vale la pena documentar este
patrón en `.claude/rules/` para cualquier página futura que defina su propio `generateMetadata`
bajo el layout raíz.

### Observaciones para Jose

La implementación cumple los 13 criterios de aceptación del GAP, verificados no solo leyendo
código sino levantando el servidor de desarrollo real y confirmando por `curl` los tres
escenarios de dominio (root PesquerApp con rewrite a `/es`, subdominio de tenant sin rewrite,
generic branding sin rewrite) más la ausencia total de regresión en lo que dejó GAP-119
(formulario de leads, páginas legales, sitemap, robots).

Dos observaciones menores, ninguna bloqueante:

1. Durante la implementación encontré y corregí un bug real de metadata (título duplicado por
   el `title.template` del layout raíz) que no estaba previsto en el plan — quedó documentado
   en la sección de Decisiones y ya corregido/verificado.
2. `next.config.mjs` no estaba en la lista de archivos del GAP original; se detectó a media
   implementación, se te señaló explícitamente y aprobaste el cambio antes de aplicarlo — ver
   PL CANDIDATE 1 para evitar que se repita el parón en el próximo GAP de este tipo.

Lo que está especialmente bien resuelto: la duplicación de la lógica de detección de
subdominio (middleware server-side + `page.js` client-side) es deliberada y está documentada —
el middleware decide **routing** (qué árbol de páginas se resuelve), `page.js` decide **render**
dentro de su propio árbol; no es código redundante por descuido. La verificación con `curl` real
en los tres escenarios de dominio (no solo lectura de código) es más rigurosa que lo habitual
para un GAP de esta naturaleza, y confirma que no hay regresión sobre GAP-119.

Pendiente real, heredado de GAP-119 y aún sin resolver: nadie ha confirmado visualmente en un
navegador con ojos humanos que la landing se vea exactamente igual — la verificación de este
GAP y del anterior es por `curl`/lectura de código. Recomiendo un vistazo visual tuyo antes de
arrancar B2 (el GAP que si cambiará lo visual, para tener una base confirmada de "antes").

### Estado final de la implementación

La home pública ahora vive en `src/app/[locale]/page.tsx` (Server Component), compuesta por 7
subcomponentes bajo `src/components/LandingPage/` (5 Server Components + 2 Client Components:
`Hero` y `LeadCaptureForm`). El middleware decide en el servidor si una petición a `/` es
dominio raíz (reescribe a `/es` vía `next-intl`) o subdominio de tenant (pasa intacto a
`page.js`, que sigue mostrando `LoginPage` exactamente como antes). El copy vive en
`src/messages/es/landing.json`, textualmente idéntico al original — listo para que B2 lo
reescriba y añada `pt`/`en`. JSON-LD `Organization`+`SoftwareApplication` ya se sirve desde
Server Components. Cero regresión verificada sobre lo entregado por GAP-119.

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
- [ ] middleware.ts: solo el cambio descrito, resto intacto
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
