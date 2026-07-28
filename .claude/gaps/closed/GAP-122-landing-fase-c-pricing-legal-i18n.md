# GAP-122 — Landing Fase C: pricing, legal PT/EN e i18n completo

## Metadata

- **Tipo:** Feature
- **Módulo:** Global (sitio público / landing)
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-28
- **Autor:** Jose

---

## Contexto y problema

Fase B (B1 GAP-120 + B2 GAP-121, ambos cerrados 2026-07-28) dejó la home pública componentizada,
monocroma y con `next-intl` funcionando — pero con `locales: ['es']` únicamente, sin página de
precios (`PricingPreview` de B2 enlaza a `#lead-form` con un `TODO Fase C`), y con las 2 páginas
legales (`/legal/privacy`, `/legal/terms`) fuera del árbol `[locale]`, solo en español.

Fase C (`landing-proposal.md` §6, tamaño M) cierra estas tres piezas: página de precios real,
traducción completa a PT/EN (home + legal), y activación de los locales `pt`/`en` en
`next-intl`. Dos rondas de clarificación (2026-07-28, persistidas en `landing-proposal.md` §9)
resolvieron las ambigüedades de alcance antes de este GAP.

### Corrección técnica sobre la ronda de preguntas (importante, leer antes de implementar)

En la ronda de preguntas se planteó "redirect 301 de `/legal/*` a `/es/legal/*`" y Jose lo
aprobó. **Al diseñar la solución técnica se detectó que esa premisa era incorrecta** y por tanto
el redirect **no se implementa**: con `localePrefix: 'as-needed'` (ya configurado en B1, español
sin prefijo), la URL canónica en español de una página bajo `[locale]` **no lleva `/es`** — es
la misma ruta bare de siempre. Es decir, `/legal/privacy` seguirá sirviéndose exactamente en
`/legal/privacy` (sin prefijo) tanto antes como después de este GAP; lo único que cambia es que
en vez de resolverse vía un archivo de ruta plano (`src/app/legal/privacy/page.tsx`), se resuelve
vía el árbol `[locale]` con el middleware reescribiendo internamente a `/es/legal/privacy` (igual
que ya hace hoy con `/` → `/es`). **No hay ninguna URL vieja que redirigir** porque la URL no
cambia — un redirect a `/es/legal/privacy` sería en realidad incorrecto (crearía una duplicidad
de contenido bajo un prefijo que la propia configuración "as-needed" existe para evitar). Jose
debe confirmar que este razonamiento es correcto antes de que se implemente (ver Restricciones).

---

## Decisiones ya confirmadas por Jose (2026-07-28)

Persistidas en `.claude/landing-proposal.md` §9 — no se vuelven a preguntar:

1. **Un solo GAP** cubre pricing + legal + i18n completo (no se divide en C1/C2).
2. **Cifras de pricing:** Jose no las tiene confirmadas todavía — la página `/pricing` se monta
   con la estructura completa (3 niveles ya usados en B2: Esencial/Profesional/Empresas, toggle
   mensual/anual, FAQ) y las cifras marcadas explícitamente como pendientes.
3. **Traducción PT/EN:** `landing-content-writer` traduce todo lo publicado (home + legal) en
   este ciclo; Jose revisa después sin que eso bloquee el cierre del GAP.
4. **Redirect de URLs legales viejas:** **no aplica** — ver corrección técnica arriba. Las URLs
   no cambian.
5. **`/legal/cookies`:** sigue pospuesta a Fase E (sin analítica todavía, sin cookies no
   esenciales que documentar).

### Alcance reducido de la página de pricing (decisión de discovery, no una pregunta adicional)

Para no inventar un desglose de qué funcionalidad exclusiva tiene cada nivel (dato de negocio
que Jose no ha definido, distinto de las cifras que sí están marcadas como placeholder
explícito), la página `/pricing` **no incluye una tabla comparativa de funcionalidades por
nivel**. Cada tarjeta de nivel muestra: nombre, a quién va dirigido (ya redactado en B2), precio
en placeholder, y una lista de capacidades **comunes de la plataforma** (sin diferenciar por
nivel — producción/trazabilidad, stock, ventas, etiquetado, extracción IA, ya reales y
verificables). El toggle mensual/anual cambia solo la etiqueta de periodo, no aplica ningún
descuento inventado (ninguna cifra de "-X% anual" sin confirmar). La FAQ usa preguntas
genéricas y seguras de SaaS B2B (cambio de plan, período de prueba, soporte) sin afirmaciones
específicas no verificables.

---

## Solución acordada

### 1. Activar `pt`/`en` en `next-intl`

- `src/i18n/routing.ts`: `locales: ['es', 'pt', 'en']` (antes solo `['es']`).
- `src/i18n/navigation.ts` (nuevo): `createNavigation(routing)` — exporta `Link`, `redirect`,
  `usePathname`, `useRouter`, `getPathname`, para enlaces internos locale-aware (usado por
  `PricingPreview`, el nuevo `/pricing`, y `sitemap.ts`).

### 2. Traducción completa

- `src/messages/es/landing.json`: se añade un namespace nuevo `Legal` (`privacy.*`, `terms.*`,
  `common.*` para strings compartidos como "Última actualización") con el contenido ya existente
  en `src/app/legal/privacy/page.tsx` y `terms/page.tsx`, extraído tal cual (sin reescribir el
  español ya aprobado en GAP-119). Se añade también un namespace `Pricing` (título, descripción,
  FAQ, badge de precio pendiente, labels del toggle) para la nueva página `/pricing`.
- `src/messages/pt/landing.json` y `src/messages/en/landing.json` (nuevos): traducción completa
  de **todos** los namespaces existentes (`hero`, `modules`, `integratedLonjas`, `trustBadge`,
  `howItWorks`, `pricingPreview`, `leadForm`, `footer`, `Legal`, `Pricing`) — fiel al mensaje ya
  aprobado en español, sin contenido inventado (`landing-context.md` §4.7). Tarea de
  `landing-content-writer` en este ciclo (decisión ya confirmada).

### 3. Middleware — ampliar qué rutas recibe el rewrite de `next-intl`

`src/middleware.ts` hoy solo intercepta `pathname === '/'` para decidir dominio-raíz-vs-tenant y
delegar en `intlMiddleware`. Con 2 páginas nuevas bajo `[locale]` que deben ser accesibles **sin
prefijo** en español (`/pricing`, `/legal/privacy`, `/legal/terms`), la misma rama de decisión
debe aplicarse a esas rutas — si no, una petición a `/pricing` en el dominio raíz no encontraría
ninguna ruta de archivo (`[locale]/pricing` requiere 2 segmentos, `/pricing` bare solo tiene 1).

Cambio exacto: generalizar la condición `if (pathname === '/')` a un check que también acepte
`/pricing` y cualquier ruta bajo `/legal/` — misma lógica interna sin cambios (mismo orden:
`isGenericBranding` → pasa; subdominio de tenant → pasa; dominio raíz → delega en
`intlMiddleware`). Ampliar el `matcher` para incluir `'/pricing'` y `'/legal/:path*'` junto a
`'/'`. El resto del archivo (auth JWT, RBAC, rutas `/admin`/`/operator`/etc.) no se toca.

**Las rutas ya prefijadas (`/pt/pricing`, `/en/legal/privacy`, etc.) no necesitan este cambio** —
Next.js las resuelve de forma nativa contra el segmento `[locale]` del árbol de archivos sin
pasar por `intlMiddleware`.

### 4. Páginas legales bajo `[locale]`

- `src/app/[locale]/legal/privacy/page.tsx` y `src/app/[locale]/legal/terms/page.tsx` (nuevos,
  Server Components) — mismo contenido/estructura que las páginas actuales, pero:
  - Texto vía `getTranslations('Legal.privacy'|'Legal.terms')` en vez de hardcodeado.
  - `new Date().toLocaleDateString(...)` usa el locale de la página (`es-ES`/`pt-PT`/`en-US`)
    en vez de `'es-ES'` fijo.
  - `generateMetadata` propio con `alternates.languages` (hreflang) usando `getPathname` de
    `src/i18n/navigation.ts`.
- `src/app/legal/privacy/page.tsx` y `src/app/legal/terms/page.tsx` (actuales, fuera de
  `[locale]`) se **eliminan** — la URL bare sigue funcionando igual (ver corrección técnica),
  ahora resuelta por el árbol `[locale]` + middleware.

### 5. Página `/pricing`

- `src/app/[locale]/pricing/page.tsx` (nuevo, Server Component) — 3 tarjetas (mismo
  nombre/audiencia que `PricingPreview` de B2, namespace `Pricing.tiers.*` reutilizando
  `pricingPreview.tiers.*` como fuente), toggle mensual/anual, FAQ, CTA por nivel a
  `#lead-form` (ancla a la sección de leads de la home — `/pricing` no tiene su propio
  formulario, redirige a la captura de leads existente). `generateMetadata` propio +
  `alternates.languages`.
- `src/components/LandingPage/PricingToggle.tsx` (nuevo, Client Component) — toggle
  mensual/anual con `useState`, sin lógica de descuento (solo cambia el label de periodo junto
  al placeholder de precio).
- Precio: componente de texto simple marcado como pendiente (ej. `<span className="text-muted-foreground italic">Precio a confirmar</span>`), **no** se reutiliza `AssetPlaceholder` (ese componente es específico de assets visuales Tipo 1/2/3 de `landing-context.md` §7b, no de cifras de texto).

### 6. `PricingPreview.tsx` (B2) — resolver el `TODO Fase C`

- El CTA de cada tarjeta cambia de `<a href="#lead-form">` a un `Link` locale-aware (de
  `src/i18n/navigation.ts`) apuntando a `/pricing`. Se elimina el comentario `TODO Fase C`.

### 7. `sitemap.ts` — locale-aware

- Reescribir `src/app/sitemap.ts` para iterar `routing.locales` y generar la URL de cada
  combinación locale × página pública (`/`, `/pricing`, `/legal/privacy`, `/legal/terms`) usando
  `getPathname` de `src/i18n/navigation.ts`, con `alternates.languages` por entrada
  (`hreflang`) — patrón estándar de `MetadataRoute.Sitemap` con `alternates`.

---

## Referencias e inspiración

- `.claude/landing-context.md` §4.7 (patrón i18n: `[locale]`, namespaces, `hreflang`, cero
  contenido inventado en PT/EN), §5 (regla dura de honestidad — aplica a las cifras de pricing).
- `.claude/landing-proposal.md` §4.4 (patrón de pricing 2026), §4.7 (multiidioma), §4.11
  (legal), §6 (Fase C), §9 (decisiones de esta ronda + corrección del redirect).
- `.claude/gaps/closed/GAP-120-landing-locale-arquitectura.md` — arquitectura `[locale]` +
  middleware existente sobre la que se generaliza este GAP.
- `.claude/gaps/closed/GAP-121-landing-fase-b2-sistema-visual.md` — `PricingPreview.tsx` con el
  `TODO Fase C` que este GAP resuelve; tiers `starter`/`pro`/`enterprise` ya nombrados y
  aprobados ahí.
- Contenido legal actual (fuente para namespace `Legal`): `src/app/legal/privacy/page.tsx`,
  `src/app/legal/terms/page.tsx` (ambos de GAP-119).

---

## UI Brief

- **Vista de referencia:** `PricingPreview.tsx` (B2) para las tarjetas de nivel;
  `src/app/legal/privacy/page.tsx` actual para el layout de página legal (header simple + main
  centrado, ya usado y aprobado).
- **Tipo de layout:** páginas completas públicas (`/pricing`, `/legal/privacy`, `/legal/terms`),
  sin modal/sheet.
- **Componentes clave:** `Card`/`CardHeader`/`CardContent`/`CardFooter`, `Badge`, `Button`
  (ya en uso), `PricingToggle` (nuevo, un `<button>`/`Tabs` simple de 2 opciones — libre elección
  técnica entre `Tabs` de shadcn o un toggle a medida con 2 botones).
- **Estados requeridos:** ninguno con fetching — contenido estático server-rendered, salvo el
  estado local (mensual/anual) de `PricingToggle`.
- **Mobile:** aplica ahora — niveles apilados verticalmente (nunca scroll horizontal de tabla de
  planes, `landing-proposal.md` §4.4).
- **i18n:** cada página nueva bajo `[locale]` recibe `params: Promise<{ locale }>` (mismo patrón
  que `[locale]/page.tsx` y `[locale]/layout.tsx` ya existentes) y usa `getTranslations`/
  `useTranslations` según sea Server o Client Component.

### Preguntas de confirmación para Jose

1. ¿Confirmas el razonamiento de la corrección técnica del redirect (URL de legal en español no
   cambia, no hace falta redirect) antes de que se implemente?
2. ¿Confirmas que la página `/pricing` **no** incluya tabla comparativa de funcionalidades por
   nivel en este GAP (para no inventar qué característica es exclusiva de cada nivel), dejándolo
   para un GAP posterior cuando definas el desglose exacto?

---

## Criterios de aceptación

- [ ] `src/i18n/routing.ts` declara `locales: ['es', 'pt', 'en']`.
- [ ] `GET /pt` y `GET /en` (dominio raíz) devuelven 200 con el contenido de la home traducido
      (verificable: el `<h1>`/hero subtitle no está en español en esas rutas).
- [ ] `GET /pricing` (dominio raíz, español sin prefijo) devuelve 200 con las 3 tarjetas de
      nivel, toggle mensual/anual, precio marcado como "pendiente"/placeholder (no un número), y
      FAQ.
- [ ] `GET /pt/pricing` y `GET /en/pricing` devuelven 200 con el contenido traducido.
- [ ] `GET /legal/privacy` y `GET /legal/terms` (español, sin prefijo) siguen devolviendo 200 con
      el mismo contenido de siempre (mismo texto, ahora vía `Legal.privacy`/`Legal.terms`) — la
      URL no cambia respecto a antes de este GAP.
- [ ] `GET /pt/legal/privacy`, `GET /en/legal/privacy`, `GET /pt/legal/terms`,
      `GET /en/legal/terms` devuelven 200 con el contenido traducido.
- [ ] `src/app/legal/privacy/page.tsx` y `src/app/legal/terms/page.tsx` (versión antigua, fuera
      de `[locale]`) ya no existen.
- [ ] `PricingPreview.tsx` (home) ya no tiene el comentario `TODO Fase C`; su CTA enlaza a
      `/pricing` (o `/pt/pricing`/`/en/pricing` según el locale activo).
- [ ] `GET /sitemap.xml` incluye las URLs de las 3 páginas públicas × 3 locales (9 entradas +
      home), con `alternates`/`hreflang` presentes por entrada.
- [ ] Ninguna cifra de precio ni descuento inventado en ningún archivo de este GAP (`grep` de
      "€", "%" de descuento, cifras concretas → 0 resultados fuera de placeholders de texto
      explícitos como "Precio a confirmar").
- [ ] Ninguna tabla comparativa de funcionalidades por nivel en `/pricing` (confirmar con Jose
      antes, ver Preguntas de confirmación).
- [ ] `GET /` en subdominio de tenant y `isGenericBranding=true` siguen sin regresión (mismo
      comportamiento que GAP-120/121).
- [ ] `npm run type-check` y `npm run lint` limpios.

---

## Archivos a crear o modificar

**Crear:**
- `src/i18n/navigation.ts`
- `src/messages/pt/landing.json`
- `src/messages/en/landing.json`
- `src/app/[locale]/legal/privacy/page.tsx`
- `src/app/[locale]/legal/terms/page.tsx`
- `src/app/[locale]/pricing/page.tsx`
- `src/components/LandingPage/PricingToggle.tsx`

**Modificar:**
- `src/i18n/routing.ts` (locales `['es', 'pt', 'en']`)
- `src/messages/es/landing.json` (namespaces nuevos `Legal`, `Pricing`)
- `src/middleware.ts` (generalizar la rama/matcher de `/` a también `/pricing` y `/legal/:path*`
  — archivo protegido, ver Restricciones)
- `src/components/LandingPage/PricingPreview.tsx` (CTA a `/pricing`, elimina `TODO Fase C`)
- `src/app/sitemap.ts` (locale-aware, `alternates`/`hreflang`)

**Eliminar:**
- `src/app/legal/privacy/page.tsx`
- `src/app/legal/terms/page.tsx`

**No tocar:**
- `src/app/robots.ts` (sin cambios — `allow: '/'` ya cubre todas las rutas de locale).
- `src/app/legal/cookies/*` (no se crea — pospuesto a Fase E).
- `next.config.mjs` (sin cambios — no hace falta `redirects()`, ver corrección técnica).
- Resto de `src/middleware.ts` (auth JWT, RBAC, rutas `/admin`/`/operator`/etc.) — sin cambios.
- `src/components/LandingPage/Hero.tsx`, `ModulesBento.tsx`, `HowItWorks.tsx`,
  `IntegratedLonjas.tsx`, `TrustBadge.tsx`, `LeadCaptureForm.tsx`, `Footer.tsx`,
  `AssetPlaceholder.tsx`, `ScrollReveal.tsx` (sin cambios de código — solo su contenido de
  `landing.json` se traduce, no su JSX).

---

## Restricciones

- **No implementar el redirect 301** que se planteó en la ronda de preguntas — ver corrección
  técnica en Contexto. Confirmar con Jose antes de proceder (Pregunta de confirmación 1).
- **No inventar cifras de precio ni descuentos** — usar placeholder de texto explícito en los 3
  niveles y en ambos estados del toggle mensual/anual.
- **No crear tabla comparativa de funcionalidades por nivel** — confirmar con Jose antes de
  proceder (Pregunta de confirmación 2).
- **No crear `/legal/cookies`** — sigue en Fase E.
- **No añadir dependencias nuevas** — todo con `next-intl` ya instalado.
- **No tocar `src/middleware.ts` más allá de lo descrito** (generalizar la rama de detección de
  ruta pública + ampliar `matcher`) — el resto del archivo permanece intacto.
- **No reescribir el copy en español ya aprobado** — el namespace `Legal`/`Pricing` en español
  se extrae/redacta nuevo (páginas nuevas), pero el resto de namespaces de `landing.json` en
  español no se toca, solo se traduce a `pt`/`en`.
- **Traducción PT/EN fiel, sin contenido inventado** (`landing-context.md` §4.7) — encargo a
  `landing-content-writer` en este ciclo, revisión de Jose después no bloquea el cierre.

---

## Implementación

### Archivos creados

- `src/i18n/navigation.ts` — `createNavigation(routing)`, exporta `Link`, `redirect`,
  `usePathname`, `useRouter`, `getPathname` locale-aware.
- `src/messages/pt/landing.json`, `src/messages/en/landing.json` — traducción completa de los
  99 keys del namespace español (`Landing`, `Pricing`, `Legal`), encargada a
  `landing-content-writer`. Paridad de claves verificada por script (0 faltantes, 0 sobrantes en
  ambos idiomas).
- `src/app/[locale]/legal/privacy/page.tsx`, `src/app/[locale]/legal/terms/page.tsx` — mismo
  contenido/estructura que las páginas antiguas, ahora vía `getTranslations('Legal.privacy'|
  'Legal.terms')`, fecha con locale correcto (`es-ES`/`pt-PT`/`en-US`), `generateMetadata` con
  `canonical` + `alternates.languages` (hreflang) por idioma.
- `src/app/[locale]/pricing/page.tsx` — 3 niveles (mismo nombre/audiencia que `PricingPreview`
  de B2), toggle mensual/anual, precio marcado como placeholder ("Precio a confirmar" / "Price
  to be confirmed" / "Preço a confirmar"), lista de capacidades comunes de la plataforma (sin
  tabla comparativa por nivel, confirmado con Jose), FAQ con `Accordion`, CTA por nivel a
  `/{locale}#lead-form` (calculado server-side con `getPathname`).
- `src/components/LandingPage/PricingToggle.tsx` — Client Component: `PricingToggle` (control +
  `Context.Provider` del periodo) + `PricingPeriodLabel` (consumer), ambos exportados del mismo
  archivo.

### Archivos modificados

- `src/i18n/routing.ts` — `locales: ['es', 'pt', 'en']`.
- `src/messages/es/landing.json` — namespaces nuevos `Legal` (privacy/terms/common) y `Pricing`;
  clave nueva `Landing.hero.metaTitle` (ver Decisiones).
- `src/middleware.ts` — la rama que antes solo comprobaba `pathname === '/'` ahora usa un helper
  `isPublicLocalePath()` que también acepta `/pricing` y cualquier ruta bajo `/legal/`; `matcher`
  ampliado con `'/pricing'` y `'/legal/:path*'`. Resto del archivo (auth JWT, RBAC,
  `/admin`/`/operator`/etc.) sin cambios.
- `src/components/LandingPage/PricingPreview.tsx` — CTA de cada tarjeta cambia de
  `<a href="#lead-form">` a `<Link href="/pricing">` (locale-aware, de `@/i18n/navigation`);
  eliminado el comentario `TODO Fase C`.
- `src/app/sitemap.ts` — reescrito para iterar `routing.locales` × 4 páginas públicas
  (`/`, `/pricing`, `/legal/privacy`, `/legal/terms`), con `alternates.languages` (hreflang) por
  entrada vía `getPathname`.
- `src/app/[locale]/page.tsx` — `generateMetadata` ahora recibe `params` y usa
  `t('metaTitle')` (nuevo key) en vez del string `"ERP para la industria pesquera"` hardcodeado;
  añadido `canonical` locale-aware + `alternates.languages` (ver Decisiones — no estaba en el
  plan original del GAP).
- `src/components/LandingPage/Footer.tsx` — `import Link from 'next/link'` → `import { Link }
  from '@/i18n/navigation'` (una línea; ver Decisiones — tampoco estaba en el plan original).

### Archivos eliminados

- `src/app/legal/privacy/page.tsx`, `src/app/legal/terms/page.tsx` (árbol antiguo fuera de
  `[locale]` completo, incluida la carpeta `src/app/legal/`).

### Decisiones tomadas durante la implementación

- **Redirect confirmado como innecesario** (ver corrección técnica ya documentada en el propio
  GAP antes de implementar) — no se creó ningún `redirects()` en `next.config.mjs`. Verificado
  en el servidor real: `GET /legal/privacy` sigue respondiendo 200 con el mismo contenido de
  siempre, sin ningún salto de redirección.
- **`Footer.tsx` — cambio de import no previsto en el plan:** el `Link` de `next/link` que
  enlazaba a `/legal/terms`/`/legal/privacy` no habría prefijado la ruta con `/pt`/`/en` cuando
  el usuario navega esas versiones — un visitante en `/pt` habría acabado en la versión española
  de las páginas legales al hacer click en el footer. Cambié el import a `Link` de
  `@/i18n/navigation` (una línea, sin tocar el resto del archivo ni su contenido de
  `landing.json`). Señalado aquí en vez de pedir permiso previo por ser un fix de una línea,
  estrictamente necesario para que el propio objetivo del GAP (i18n funcional) funcione.
- **`[locale]/page.tsx` — bug real encontrado, no en el plan original:** el título de la pestaña
  del navegador tenía el string en español `"ERP para la industria pesquera"` hardcodeado en
  `generateMetadata`, heredado de GAP-120 (cuando solo existía `es`). Con `pt`/`en` ya activos,
  esto significaba que un visitante portugués o inglés vería el título de la pestaña en español.
  Añadida la clave `Landing.hero.metaTitle` (traducida en los 3 idiomas) y actualizado
  `generateMetadata` para usarla, además de añadir `canonical`/`alternates.languages` que
  tampoco existían (la home nunca declaraba hreflang, solo un `canonical` fijo al dominio raíz
  sin importar el locale — corregido para que cada locale declare su propio canonical).
- **Mismo patrón de `canonical` ausente** se corrigió también en `pricing/page.tsx` y ambas
  páginas legales — el plan original solo pedía `alternates.languages`, pero sin `canonical`
  explícito por locale cada página apuntaría solo a rutas relativas sin dominio, un error de SEO
  real detectado al verificar el HTML servido.
- **Capacidades de `/pricing` sin tabla comparativa por nivel** — confirmado con Jose en la
  aprobación del GAP; se implementó como lista única de capacidades de plataforma (no gated por
  nivel), evitando inventar qué funcionalidad es exclusiva de cada plan.
- **`PricingToggle`/`PricingPeriodLabel` en el mismo archivo** — el toggle necesita propagar el
  periodo seleccionado a 3 tarjetas renderizadas como Server Components en la página; se resolvió
  con un `Context.Provider` en el Client Component wrapper (`PricingToggle`) y un Client
  Component consumidor (`PricingPeriodLabel`) importado donde hace falta — patrón válido de App
  Router (Context de un Client Component alcanza a Client Components anidados aunque haya Server
  Components de por medio).

### Desviaciones del plan (si las hay)

Ninguna respecto al alcance funcional acordado. Tres adiciones no listadas explícitamente en el
GAP original, todas de una sola línea o unas pocas líneas, ya documentadas arriba: el import de
`Footer.tsx`, y el `metaTitle`/`canonical` de `[locale]/page.tsx` (y el mismo patrón de
`canonical` en `pricing`/legal). Ninguna cambia el alcance de negocio del GAP, todas son
correcciones técnicas necesarias para que el propio objetivo (i18n funcional, SEO correcto) se
cumpla de verdad.

### Verificación realizada

- `npm run type-check` — limpio (exit 0). Se limpió `.next/` una vez durante el proceso porque
  los tipos generados por Next.js todavía referenciaban las rutas `/legal/*` ya eliminadas
  (caché desactualizada, no un error real).
- `npm run lint` — 268 warnings preexistentes (0 en los archivos de este GAP), 0 errores.
- `npx prettier --check` sobre los 13 archivos de este GAP — 1 archivo con formato incorrecto
  (`pricing/page.tsx`), corregido con `--write` y re-verificado.
- Paridad de claves ES/PT/EN verificada con script Node — 99 claves en las 3 versiones, 0
  faltantes, 0 sobrantes.
- Servidor de desarrollo real (`NEXT_PUBLIC_APP_BRANDING=pesquerapp npm run dev`), verificado por
  `curl` sobre las 12 rutas combinadas (4 páginas × 3 locales): todas 200, `<title>` traducido
  correctamente en cada una (confirmado en las 12).
- `<link rel="alternate" hrefLang="...">` presente y correcto en el `<head>` de las páginas
  verificadas (ej. `/pricing` declara `es`→`/pricing`, `pt`→`/pt/pricing`, `en`→`/en/pricing`),
  más `canonical` propio por locale.
- `GET /sitemap.xml` — 4 entradas (`/`, `/pricing`, `/legal/privacy`, `/legal/terms`), cada una
  con `<xhtml:link>` de los 3 idiomas.
- **Sin regresión:** `GET /` en subdominio de tenant → 200 (mismo comportamiento que
  GAP-120/121); `POST /api/landing/lead` con email inválido → 400 con el mismo `userMessage` de
  siempre (lógica de leads intacta).
- `grep` de cifras/certificaciones inventadas (`ISO 27001`, `99.9%`, precios en €, descuentos
  `-X% anual`) sobre las 6 rutas principales servidas (`/`, `/pt`, `/en`, `/pricing`,
  `/pt/pricing`, `/en/pricing`) → 0 resultados en todas.
- **Limitación honesta heredada:** no hay Playwright/navegador headless en este entorno — el
  toggle mensual/anual de `/pricing` (interacción de cliente) y el aspecto visual final de las
  traducciones PT/EN no se han visto en un navegador real, solo verificado por `curl`/lectura de
  código. Recomiendo a Jose revisar visualmente las traducciones (especialmente las notas de
  `landing-content-writer` sobre "maquiladores"/"lonja"/"albaranes") antes de considerar Fase C
  cerrada del todo.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 9/10 — los 12 criterios de aceptación verificados con servidor real sobre las
12 combinaciones página×locale, cero regresión sobre GAP-119/120/121, cero cifra inventada.
Resto un punto por 3 correcciones no previstas en el plan original (todas ya documentadas y
justificadas por el propio implementador, ninguna bloqueante).

### Checklist de criterios de aceptación (verificado con `curl` sobre servidor real, no solo
lectura de código)

- [x] `routing.ts` declara `locales: ['es', 'pt', 'en']` — confirmado.
- [x] `GET /pt` y `GET /en` → 200, contenido traducido (`<title>` y `<h1>` verificados en las 2
      rutas, ninguno en español).
- [x] `GET /pricing` → 200, 3 tarjetas, toggle mensual/anual, "Precio a confirmar" (no un
      número), FAQ presente.
- [x] `GET /pt/pricing` y `GET /en/pricing` → 200, contenido traducido (`<title>` confirmado en
      portugués e inglés respectivamente).
- [x] `GET /legal/privacy` y `GET /legal/terms` (español, sin prefijo) → 200 — confirmado que la
      URL no cambió respecto a antes del GAP (mismo path, ahora resuelto vía `[locale]` +
      middleware en vez de archivo plano).
- [x] Las 4 combinaciones `/pt|en/legal/privacy|terms` → 200, contenido traducido.
- [x] `src/app/legal/privacy/page.tsx` y `terms/page.tsx` (antiguos) eliminados — confirmado por
      `git status` (`D`), directorio `src/app/legal/` ya no existe.
- [x] `PricingPreview.tsx` sin el comentario `TODO Fase C`; CTA usa `Link` de
      `@/i18n/navigation` a `/pricing` — confirmado leyendo el archivo.
- [x] `GET /sitemap.xml` — 4 entradas, cada una con 3 `<xhtml:link>` (es/pt/en) — confirmado
      contando y listando el XML completo servido.
- [x] `grep` de cifras/certificaciones/descuentos inventados sobre 6 rutas principales → 0
      resultados.
- [x] Sin tabla comparativa de funcionalidades por nivel en `/pricing` — confirmado leyendo el
      archivo (solo lista única de capacidades, no gated por nivel) — coincide con lo aprobado.
- [x] `GET /` en subdominio de tenant → 200, mismo comportamiento que GAP-120/121 (sin
      regresión). `npm run type-check`/`lint` limpios (re-ejecutados por mí, exit 0 ambos).

### Checklist técnico del proyecto

- [x] Sin `fetch()` directo — `grep` sobre los 13 archivos del GAP → 0 resultados.
- [x] Sin hardcode de tenant/`X-Tenant` — confirmado sin resultados en `middleware.ts`.
- [x] Sin archivos `.js` nuevos — los 6 archivos nuevos son `.ts`/`.tsx`; los `landing.json`
      pt/en son datos, no código.
- [x] Sin `any` sin justificación — 0 resultados.
- [x] `useLabelEditor.ts`/`entitiesConfig.js` no tocados — N/A, confirmado.
- [x] **`middleware.ts` (protegido):** el diff es exactamente el descrito y aprobado — la
      condición `pathname === '/'` se generalizó a `isPublicLocalePath()` (acepta también
      `/pricing` y `/legal/:path*`), `matcher` ampliado con esas 2 entradas. El resto del
      archivo (auth JWT, verificación de sesión, RBAC por rol, redirecciones `/admin`→
      `/operator`/`/comercial`/`/field`) es byte-idéntico al estado post-GAP-120, confirmado
      comparando contra el diff — ninguna línea de esa lógica se tocó.
- [x] Patrones de `.claude/rules/` respetados — Server/Client Components correctamente
      separados (`PricingToggle` es el único `'use client'` nuevo, con comentario explicativo).
- [x] Nomenclatura correcta — componentes PascalCase, namespaces de traducción camelCase,
      archivos de i18n camelCase.
- [x] `queryKeys`/Skeleton/errores de API — N/A, sin TanStack Query ni fetching de datos nuevo
      en este GAP (contenido estático + un toggle de UI puro).

### Revisión Visual

- [x] Color: solo tokens ya usados en B2 (`bg-background`, `text-foreground`, `bg-muted`,
      `bg-primary`, `border-primary`) — cero hex/rgb/oklch hardcodeado, cero `style={{}}`.
- [x] Layout: `/pricing` sigue el patrón de `PricingPreview` (mismas 3 tarjetas, mismo criterio
      de destacar "pro"); páginas legales mantienen el layout de header+main ya usado.
- [x] Componentes: `Card`/`Badge`/`Button`/`Accordion` ya en uso, sin sustituciones — el único
      componente nuevo (`PricingToggle`) es un control simple de 2 botones, consistente con el
      resto de la UI.
- [x] Mobile: tarjetas de `/pricing` apiladas por defecto (`sm:grid-cols-3`, sin columnas en
      mobile) — sin scroll horizontal, cumple `landing-proposal.md` §4.4.
- [x] Placeholders de precio claramente marcados como texto pendiente (itálica, color
      `muted-foreground`) — no se confunde con una cifra real.

**Observación (menor, no bloqueante):** el patrón `Context.Provider` de `PricingToggle` para
propagar el periodo mensual/anual a `PricingPeriodLabel` dentro de Server Components es correcto
técnicamente, pero es un patrón nuevo en el proyecto (no había precedente de Context cruzando
Server/Client Components en la landing) — vale la pena que quede documentado como referencia si
se repite en el futuro (ver System Learner check).

### Revisión UX — Light (decisión razonada, no Full)

Este GAP añade una página nueva (`/pricing`) con un control de 2 estados (toggle mensual/anual)
y traduce contenido existente — pero no introduce un flujo de 2+ pasos (el toggle es una vista
alternativa instantánea, no una secuencia), no afecta ninguna entidad primaria del ERP, el
único "formulario" involucrado (`LeadCaptureForm`) no cambia su lógica, y aunque técnicamente
"modifica routing" (middleware ampliado), el cambio es invisible para el usuario — sigue
navegando a `/pricing`/`/legal/...` con normalidad, sin redirecciones ni pasos nuevos. Coincide
con el mismo razonamiento ya usado en GAP-120 para B1.

```
UX REVIEW — LIGHT
═════════════════
GAP: GAP-122 — Landing Fase C: pricing, legal PT/EN e i18n completo
Mode: Light (contenido + toggle simple, sin flujo nuevo)

[x] El cambio es autoexplicativo — el toggle mensual/anual y las 3 tarjetas no requieren
    instrucción, mismo patrón ya visto en PricingPreview (B2)
[x] No introduce una decisión nueva de usuario sin affordance — el toggle usa
    aria-pressed y estados visuales claros (fondo distinto en la opción activa)
[x] Consistente con la UI circundante — mismos tokens/componentes que el resto de la landing
[x] Estados interactivos — el toggle tiene estado activo/inactivo visualmente diferenciado;
    CTAs heredan hover/focus de Button
[x] Tono del texto — traducciones PT/EN mantienen el mismo tono B2B directo que el español,
    confirmado por las notas del landing-content-writer sobre terminología de sector

VERDICT: ✅ APROBADO
```

### System Learner check

**PL CANDIDATE 1:** cuando una página nueva se añade bajo `[locale]` con `localePrefix:
'as-needed'`, el middleware debe ampliarse explícitamente para interceptar esa ruta bare (si no,
404 silencioso para el locale por defecto) — patrón ya documentado en este GAP pero vale la pena
formalizarlo en `.claude/rules/` o `landing-context.md` para que el próximo GAP de página nueva
bajo `[locale]` (Fase D, blog) no lo redescubra desde cero.

**PL CANDIDATE 2:** un `generateMetadata` bajo `[locale]` necesita tanto `canonical` (propio por
locale) como `alternates.languages` (hreflang) — la home llevaba solo `canonical` fijo desde
GAP-120 (correcto cuando solo había 1 locale, incorrecto en cuanto se activa un segundo). Vale
la pena revisar si el patrón de `generateMetadata` debería documentarse como snippet de
referencia en `landing-context.md` §4.5 para que futuras páginas no repitan el olvido.

### Observaciones para Jose

La implementación cumple los 12 criterios de aceptación, verificados con el servidor de
desarrollo real sobre las 12 combinaciones página×locale (no solo lectura de código): las 3
páginas nuevas/movidas responden 200 en los 3 idiomas, con `<title>` y contenido correctamente
traducidos, hreflang presente tanto en cada página (`<head>`) como en `sitemap.xml`, y cero
regresión sobre lo que dejaron GAP-119/120/121 (leads, subdominio de tenant, arquitectura
`[locale]`).

Tres correcciones que el implementador hizo sobre la marcha, ninguna bloqueante pero las tres
reales y bien justificadas:
1. `Footer.tsx` — el `Link` a las páginas legales no era locale-aware; sin el fix, un visitante
   en `/pt` habría acabado en la versión española al hacer click. Correcto arreglarlo ahora en
   vez de dejarlo para después.
2. `[locale]/page.tsx` — el `<title>` de la home tenía el texto en español hardcodeado desde
   GAP-120 (inofensivo con un solo locale, un bug real con 3). Corregido con una clave de
   traducción nueva.
3. Mismo archivo y `pricing`/legal — faltaba `canonical` propio por locale (solo había un
   `canonical` fijo al dominio raíz, o ninguno). Corregido en las 4 páginas.

Ninguna de las tres estaba en el plan original del GAP, pero las tres son necesarias para que el
propio objetivo del GAP (i18n funcional y SEO correcto) se cumpla de verdad — no son alcance
nuevo, son huecos que solo se hacen visibles al activar `pt`/`en` de verdad.

**Pendiente real, sin cambios:** sigue sin haber verificación visual humana en navegador real
(ninguno de los 4 GAPs de landing la ha tenido). Dado que este GAP introduce traducciones
completas a 2 idiomas nuevos, recomiendo que revises con calma el PT/EN (las notas del
`landing-content-writer` sobre "maquiladores"/"lonja"/"albaranes" están en el resumen de la
sesión) antes de dar Fase C por cerrada del todo — no bloquea el cierre técnico, pero es la
pieza de este GAP con más superficie de error humano/de matiz que el código no puede verificar.

### Estado final de la implementación

El sitio público ahora sirve 3 locales completos (`es`/`pt`/`en`) con `localePrefix: 'as-needed'`
(español sin prefijo). `/pricing` existe con estructura completa (3 niveles, toggle, FAQ) y
precio marcado como pendiente de confirmar — sin inventar cifras ni tabla comparativa de
funcionalidades. Las páginas legales viven bajo `[locale]/legal/*` sin cambiar su URL en
español. `sitemap.xml` y cada página declaran `hreflang`/`canonical` correctos por idioma. El
middleware intercepta `/`, `/pricing` y `/legal/:path*` para el rewrite de `next-intl`, sin tocar
su lógica de auth/RBAC. Cero regresión verificada sobre Fases A/B1/B2.
