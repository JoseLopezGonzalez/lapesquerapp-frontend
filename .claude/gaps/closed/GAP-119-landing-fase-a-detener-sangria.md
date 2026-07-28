# GAP-119 — Landing Fase A: detener la sangría (CTAs rotos, claims falsos, SEO básico)

## Metadata

- **Tipo:** Bug
- **Módulo:** Global (sitio público / landing)
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-27
- **Autor:** Jose

---

## Contexto y problema

Auditoría de la landing pública (`.claude/landing-context.md` §1, `.claude/landing-proposal.md`
§2) detectó una serie de defectos activos, no cosméticos: leads que se pierden, afirmaciones
falsas publicadas, y cero indexación SEO. Ninguna de estas piezas depende del rediseño visual
completo (Fase B) — es el punto de partida acordado con Jose antes de tocar el sistema visual.

Todo el contenido de la landing vive en `src/components/LandingPage/index.js` (501 líneas,
legacy `.js`). Por Regla de oro 3 (CLAUDE.md), al tocar este archivo se migra a `.tsx` en el
mismo commit — solo renombrado + tipado, **sin** descomponer en subcomponentes (esa
componentización real es explícitamente Fase B, ver `landing-proposal.md` §6 Fase B).

### FND-01 — CTA "Ver características" sin acción (Bloqueante)

`src/components/LandingPage/index.js:70-72`. El botón no tiene `onClick` — no hace nada.

**Decisión acordada con Jose:** scroll suave a la sección de módulos ("Todo lo que necesita tu
industria", `src/components/LandingPage/index.js:140-223`), no rediseño del hero ni eliminación
del botón — eso queda para Fase B.

### FND-02 — Formulario "Solicitar acceso" sin `onSubmit` (Bloqueante)

`src/components/LandingPage/index.js:439-449`. El CTA final de conversión de toda la landing no
envía a ningún sitio — captura cero leads.

**Decisión acordada con Jose:** conectar a un envío de email real ("email simple") en vez de
esperar a un backend de leads dedicado.

### FND-03 — Afirmaciones no verificadas (Bloqueante — regla dura de honestidad)

`src/components/LandingPage/index.js:404-428`. Tres badges de confianza:
1. Shield + "Seguridad Empresarial" + **"Certificación ISO 27001"** — falso, sin respaldo.
2. Globe + "Acceso Global" + **"99.9% de disponibilidad"** — falso, sin respaldo.
3. FileText + "Cumplimiento Legal" + "Normativas internacionales" — afirmación genérica, no
   una certificación específica, defendible tal cual.

También hay un bloque de rating "4.9/5" ya comentado/muerto en
`src/components/LandingPage/index.js:225-240` (dead code con la misma afirmación falsa).

**Decisión acordada con Jose:** eliminar los badges 1 y 2 completos (icono + título +
afirmación falsa). Mantener el badge 3 (Cumplimiento Legal) tal cual. Eliminar el bloque
comentado de rating (dead code). No inventar ninguna cifra ni certificación de reemplazo.

No tocar el bloque separado de la sub-hero (`src/components/LandingPage/index.js:127-136`,
"Seguro y confiable" / "Acceso desde cualquier lugar") — es lenguaje genérico sin cifra ni
certificación específica, no está en el alcance de este hallazgo.

### FND-04 — Enlaces legales rotos + riesgo RGPD (Bloqueante — se agrava con FND-02)

`src/components/LandingPage/index.js:489-494`. "Aviso Legal" y "Política de Privacidad" enlazan
a `#`. Al activar un formulario real que envía el email del visitante a un servicio externo
(FND-02), la ausencia de una política de privacidad accesible deja de ser solo un enlace roto y
pasa a ser un riesgo de cumplimiento RGPD inmediato.

**Decisión acordada con Jose:** crear `/legal/privacy` y `/legal/terms` ahora con contenido
mínimo honesto (quién trata los datos, para qué se usa el email del formulario, que no se
comparte con terceros) — texto de partida que Jose revisa/ajusta después, no redacción legal
definitiva. `/legal/cookies` queda para Fase C (no hay cookies no esenciales todavía — sin
analítica, ver `landing-proposal.md` §4.8, Fase E).

### FND-05 — Sin `sitemap.ts`, `robots.ts` ni JSON-LD (Importante)

Google indexa a ciegas; ninguna IA generativa puede citar la marca con datos estructurados
(`landing-context.md` §4.4). JSON-LD completo (`Organization`, `SoftwareApplication`) requiere
`generateMetadata` por página y queda para Fase B/C cuando `page.js` deje de ser Client
Component raíz — fuera de alcance de este GAP.

### FND-06 — Copyright hardcodeado (Menor)

`src/components/LandingPage/index.js:486`: `© 2025 {appName}`. Año fijo, quedará desactualizado
cada enero.

---

## Solución acordada

1. **Migrar** `src/components/LandingPage/index.js` → `src/components/LandingPage/index.tsx`
   (renombrado + tipado del componente y sus datos; **sin** dividir en subcomponentes).
2. **FND-01:** añadir `id="modulos"` a la sección de módulos; el botón "Ver características"
   hace scroll suave (`element.scrollIntoView({ behavior: 'smooth' })` o equivalente) a esa
   sección.
3. **FND-02:** convertir el bloque de captura de email en un formulario controlado
   (React Hook Form + Zod, coherente con `.claude/rules/components.md` /
   "Reglas importantes" de CLAUDE.md) que:
   - Valida el email en cliente (Zod) y servidor.
   - Incluye un campo honeypot oculto (anti-spam básico, sin librería nueva).
   - Hace `POST` a una nueva Route Handler `src/app/api/landing/lead/route.ts`.
   - Mientras envía: botón en estado `disabled` con texto de carga.
   - Éxito: `notify.success(...)` (Sonner ya está montado globalmente vía `AppToaster` en
     `ClientLayout.js`, funciona en la landing pública sin cambios adicionales) + limpia el
     input.
   - Error: `notify.error(...)` con el mensaje de la API.
4. **Route Handler `/api/landing/lead`:** valida el payload con Zod (email + honeypot vacío),
   y si es válido envía el email vía la **API REST de Resend con `fetch` nativo** (sin instalar
   el SDK `resend` — evita añadir una dependencia nueva sin aprobación explícita, ver
   `CLAUDE.md` "No añadir dependencias sin aprobación"). Requiere dos variables de entorno
   nuevas, ambas solo server-side (sin prefijo `NEXT_PUBLIC_`):
   - `RESEND_API_KEY` — Jose debe crear una cuenta en Resend (tiene capa gratuita) y generar
     la clave; **prerequisito de despliegue, no bloquea escribir el código**.
   - `LANDING_LEAD_TO_EMAIL` — email de destino; si no está definida, usar `infoEmail` de
     `src/configs/branding.js` como fallback.
   Documentar ambas en `.env.example` siguiendo el patrón de comentarios ya usado ahí (ver
   bloque `OPENAI_API_KEY` como referencia de var opcional server-side).
5. **FND-03:** eliminar los badges "Seguridad Empresarial"/ISO 27001 y "Acceso Global"/99.9%
   completos (icono + título + texto) de `src/components/LandingPage/index.tsx:404-428`.
   Mantener el badge "Cumplimiento Legal"/"Normativas internacionales" tal cual, reajustando el
   layout flex a 1 único badge centrado (ya no 3 en fila). Eliminar el bloque JSX comentado del
   rating 4.9/5 (dead code, líneas 225-240 del archivo original).
6. **FND-04:** crear `src/app/legal/privacy/page.tsx` y `src/app/legal/terms/page.tsx` —
   Server Components simples (sin `'use client'`), contenido estático mínimo y honesto, mismo
   layout general que el resto del sitio (header simple con logo + link a inicio, contenido en
   `container mx-auto`, footer reutilizado o simplificado). Actualizar los `href` del footer en
   `index.tsx` de `#` a `/legal/privacy` y `/legal/terms` respectivamente.
7. **FND-05:** crear `src/app/sitemap.ts` (incluye `/`, `/legal/privacy`, `/legal/terms`, usando
   `metadataBaseUrl` de `src/configs/branding.js`) y `src/app/robots.ts` (permite indexar el
   sitio público; `disallow` explícito de `/admin`, `/comercial`, `/operator`, `/field`,
   `/production`, `/warehouse`, `/api`, `/superadmin` como capa defensiva aunque hoy no sean
   alcanzables por el crawler debido al enrutamiento por subdominio). JSON-LD queda fuera de
   este GAP (ver FND-05 arriba).
8. **FND-06:** reemplazar `© 2025 {appName}` por `© {new Date().getFullYear()} {appName}`.

---

## UI Brief

- **Vista de referencia:** no hay una vista análoga en el ERP para el layout de las páginas
  legales (contenido estático público) ni para el formulario de un solo campo del CTA final —
  son piezas nuevas del sitio público, no un patrón existente en `src/components/Admin/`. Los
  patrones que **sí** se reutilizan del sistema compartido (`design-context.md`, aplicable
  porque errores/formularios/toasts son compartidos entre ERP y landing según
  `landing-context.md` §0, aunque la densidad visual no lo sea):
  - Formularios: React Hook Form + Zod (`design-context.md` §4 Forms).
  - Mensaje de error de campo: `text-red-400 text-xs pt-1` con prefijo `*`.
  - Toasts de éxito/error: `notify.success` / `notify.error(getErrorMessage(...))` vía Sonner
    (ya montado globalmente en `ClientLayout.js`, cubre rutas públicas).
  - Jerarquía de botones: `Button` variant `secondary` ya usado en el CTA final actual, se
    mantiene — no se introduce un botón nuevo, solo se le añade estado `disabled` mientras
    envía.
- **Tipo de layout:** inline dentro de la sección existente (formulario del CTA final, sin
  modal/sheet); páginas legales = página completa simple, sin sidebar ni chrome operativo.
- **Componentes clave:** `Input`, `Button` (ya usados hoy), `Form`/`FormField` de shadcn si el
  implementador lo prefiere sobre RHF “a mano” para un único campo — libre elección técnica,
  ambos son válidos para un caso de un solo campo.
- **Estados requeridos:** idle → enviando (`disabled` + texto de carga) → éxito (`notify.success`
  + limpia el input) → error (`notify.error` con mensaje de la API). Sin estado "loading" de
  carga inicial (no hay datos que traer, es solo un formulario de escritura).
- **Mobile:** aplica ahora — la landing ya es responsive de fábrica (Tailwind `sm:`/mobile-first
  en todo el archivo); no se introduce ningún patrón mobile-specific nuevo (no es una vista del
  ERP, no usa `useIsMobileSafe` ni `BottomNav`).
- **Sistema visual (colores, tipografía, hero, bento):** explícitamente **fuera de alcance** —
  `landing-context.md` §2/§3 ya fija la dirección visual monocroma para Fase B; este GAP no la
  toca, solo corrige comportamiento y contenido dentro del sistema visual actual (`sky-500`
  incluido, aunque ya está señalado como desviación a corregir en Fase B).

### Preguntas de confirmación para Jose

Ninguna — las decisiones decisivas de esta UI (comportamiento del CTA "Ver características",
qué badges se eliminan/mantienen, enfoque de las páginas legales) ya se confirmaron
explícitamente en la ronda de preguntas de Discovery (2026-07-27, ver Contexto arriba).

---

## Referencias e inspiración

- `.claude/landing-context.md` §1 (snapshot de auditoría), §5 (regla dura de honestidad), §7b
  (producción de assets — no aplica a este GAP, no hay imágenes nuevas).
- `.claude/landing-proposal.md` §2 (diagnóstico con líneas exactas), §6 Fase A.
- Patrón de Route Handler server-side existente: `src/app/api/crm/improve-text/route.js`
  (`export const runtime = 'nodejs'`, validación de payload antes de la llamada externa).
- `AppToaster` montado globalmente en `src/app/ClientLayout.js:14` — confirmado que cubre rutas
  públicas, no solo autenticadas.

---

## Criterios de aceptación

- [ ] `src/components/LandingPage/index.js` ya no existe; existe `index.tsx` sin errores de
      `npm run type-check`.
- [ ] Click en "Ver características" hace scroll suave hasta la sección de módulos.
- [ ] Enviar el formulario final con un email válido dispara una petición a
      `/api/landing/lead`, que responde 200 y el email llega a `LANDING_LEAD_TO_EMAIL` (o
      `infoEmail` si la env var no está definida) vía Resend.
- [ ] Enviar el formulario con email inválido bloquea el envío con un error de validación
      visible (RHF + Zod), sin llegar a golpear la API.
- [ ] El campo honeypot, si viene relleno, hace que la API responda éxito aparente sin enviar
      el email real (no delatar al bot).
- [ ] Los badges "Certificación ISO 27001" y "99.9% de disponibilidad" ya no existen en el DOM
      renderizado. El badge "Cumplimiento Legal" sigue presente.
- [ ] No queda ningún bloque JSX comentado con el rating 4.9/5.
- [ ] "Aviso Legal" enlaza a `/legal/terms` y "Política de Privacidad" a `/legal/privacy`; ambas
      rutas devuelven 200 con contenido real (no placeholder vacío).
- [ ] `GET /sitemap.xml` devuelve XML válido incluyendo `/`, `/legal/privacy`, `/legal/terms`.
- [ ] `GET /robots.txt` permite indexar `/` y referencia el sitemap; bloquea explícitamente las
      rutas internas listadas en el punto 7 de la Solución acordada.
- [ ] El footer muestra el año actual dinámicamente (verificable cambiando la fecha del sistema
      o revisando que no hay un literal `2025`/`2026` hardcodeado).
- [ ] `npm run type-check` y `npm run lint` limpios (protocolo pre-push de CLAUDE.md).

---

## Archivos a crear o modificar

**Crear:**
- `src/app/api/landing/lead/route.ts`
- `src/app/legal/privacy/page.tsx`
- `src/app/legal/terms/page.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`

**Modificar:**
- `src/components/LandingPage/index.js` → renombrar a `src/components/LandingPage/index.tsx`
  (migración + todos los cambios de FND-01 a FND-06 y FND-08)
- `.env.example` (documentar `RESEND_API_KEY` y `LANDING_LEAD_TO_EMAIL`)

**No tocar:**
- `src/app/page.js` (ya es `'use client'`, sigue decidiendo landing vs login — no forma parte
  de este GAP)
- `src/configs/branding.js` (solo lectura de `infoEmail`/`metadataBaseUrl`, sin añadir exports
  nuevos ahí — las env vars de Resend se leen directamente en el Route Handler)

---

## Restricciones

- No añadir el SDK npm `resend` ni ninguna otra dependencia nueva — usar `fetch` nativo contra
  la API REST de Resend.
- No crear `/legal/cookies` (Fase C, no hay cookies no esenciales todavía).
- No implementar JSON-LD, `next-intl`/`[locale]`, ni tocar el sistema visual (colores, hero,
  bento) — eso es Fase B/C, fuera de alcance.
- No dividir `LandingPage/index.tsx` en subcomponentes — solo migración `.js` → `.tsx` con
  tipado, la componentización real es Fase B.
- No inventar ninguna cifra, certificación o testimonio de reemplazo para los badges
  eliminados — si no hay dato verificable, se elimina, no se sustituye por otro placeholder.
- El texto de `/legal/privacy` y `/legal/terms` es un borrador honesto de partida, no
  redacción legal definitiva — dejarlo señalado como tal si se documenta en el propio GAP tras
  implementar.

---

## Implementación

### Archivos creados

- `src/schemas/landingLeadSchema.ts` — schema Zod solo del email (el honeypot se valida aparte,
  fuera del schema, para poder devolver éxito silencioso sin revelarlo).
- `src/app/api/landing/lead/route.ts` — Route Handler POST, valida email + honeypot, envía el
  lead vía la API REST de Resend con `fetch` nativo (sin SDK nuevo).
- `src/app/legal/privacy/page.tsx` — página estática, Server Component.
- `src/app/legal/terms/page.tsx` — página estática, Server Component.
- `src/app/sitemap.ts` — incluye `/`, `/legal/privacy`, `/legal/terms`.
- `src/app/robots.ts` — permite `/`, bloquea rutas internas listadas en el GAP, referencia el
  sitemap.
- `src/components/LandingPage/index.tsx` (reemplaza a `index.js`, eliminado).
- `src/services/landing/landingLeadService.ts` — extraído tras el hallazgo del `gap-auditor`
  (coincide con PL-008/PL-NEW-A): el `fetch()` al Route Handler interno no puede vivir inline en
  el componente, debe estar en un service, aunque use `fetch` nativo (no `fetchWithTenant`,
  correcto porque es una ruta interna de Next.js, no el backend Laravel) — mismo patrón que
  `src/services/chatgpt/extractionService.js`.

### Archivos modificados

- `.env.example` — documentadas `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `LANDING_LEAD_TO_EMAIL`.

### Decisiones tomadas durante la implementación

- El honeypot (`company`) se registra con un `useRef` y se lee manualmente al construir el
  payload del POST, en vez de con `register()` de React Hook Form — así no forma parte del tipo
  `LandingLeadForm` ni de su validación Zod visible, y el servidor puede devolver éxito
  silencioso sin que un error de validación delate el check al bot.
- El componente `LandingPage` pasa a `'use client'` explícito (antes lo heredaba implícitamente
  de `page.js`) porque ahora usa `useForm`/`useState`/`useRef` directamente — más claro y
  alineado con la regla de `.claude/rules/typescript.md` de anotar `'use client'` con comentario
  cuando no es obvio.
- `RESEND_FROM_EMAIL` añadida como env var opcional (no estaba en el GAP original) con fallback
  al sandbox `onboarding@resend.dev` de Resend, porque enviar sin dominio verificado requiere
  igualmente indicar un remitente — es necesaria para que el código funcione antes de que Jose
  configure un dominio propio en Resend.
- El sub-bloque de trust badges pasó de una fila flex de 3 columnas a un único bloque centrado
  (se eliminó el `flex-row`/`gap-20` de 3 elementos, queda 1 elemento centrado) al quedar solo el
  badge "Cumplimiento Legal".

### Desviaciones del plan (si las hay)

- Ninguna respecto a los archivos listados. Única adición no listada explícitamente en el GAP:
  la env var `RESEND_FROM_EMAIL` (ver decisión arriba) — cambio menor de config, no de alcance.

### Verificación realizada

- `npm run type-check` — limpio (exit 0).
- `npm run lint` — limpio, 0 errores (los 266 warnings preexistentes en el repo son de archivos
  no tocados por este GAP).
- Servidor de desarrollo local (`NEXT_PUBLIC_APP_BRANDING=pesquerapp npm run dev`) +
  verificación por `curl`:
  - `GET /` → 200.
  - `GET /sitemap.xml` → 200, XML válido con las 3 URLs esperadas.
  - `GET /robots.txt` → 200, permite `/`, bloquea las rutas internas, referencia el sitemap.
  - `GET /legal/privacy` y `GET /legal/terms` → 200, contenido real presente (verificado por
    `curl`, son Server Components sin gate de cliente).
  - `POST /api/landing/lead` con email inválido → 400 con mensaje de validación.
  - `POST /api/landing/lead` con honeypot relleno → 200 `{"ok":true}` sin intentar llamar a
    Resend (verificado leyendo el código: el `return` ocurre antes de la llamada a la API).
  - `POST /api/landing/lead` con email válido y sin `RESEND_API_KEY` configurada (esperado en
    este entorno, es un prerequisito de Jose) → 500 con mensaje de error entendible, sin
    filtrar detalles internos.
- **Limitación honesta:** no hay Playwright ni ningún navegador headless disponible en este
  entorno, así que el comportamiento client-side de `LandingPage` (scroll suave al hacer click
  en "Ver características", envío real del formulario con feedback visual, estados de error de
  React Hook Form renderizados) **no se ha podido verificar visualmente en un navegador real**.
  Se verificó por lectura completa del código y por `type-check`/`lint` limpios, pero Jose
  debería darle un vistazo visual rápido (`npm run dev` sin el override de branding, o con
  `NEXT_PUBLIC_APP_BRANDING=pesquerapp`) antes de dar la Fase A por cerrada del todo, y
  especialmente antes de confiar en el envío real de leads (requiere `RESEND_API_KEY` real).

---

## Auditoría

### Resultado: ⚠️ APROBADO CON OBSERVACIONES

### Puntuación: 8/10 — implementación técnica sólida, todos los criterios de aceptación
verificados por lectura de código y ejecución local de `type-check`/`lint`; penalizo 2 puntos
por las fricciones reales del `ux-reviewer` en el CTA de leads (falta `aria-invalid`, contraste
del error por debajo de WCAG AA, mensaje de red sin traducir) — ninguna bloquea el flujo, pero
las tres caen exactamente en la pieza que este GAP existe para arreglar (captación de leads).

### Checklist de criterios de aceptación (verificado archivo por archivo, no solo por el reporte
del implementador)

- [x] `src/components/LandingPage/index.js` ya no existe; solo `index.tsx` — confirmado por
      `ls src/components/LandingPage/`. `npm run type-check` re-ejecutado por mí, exit 0.
- [x] "Ver características" hace scroll suave a `#modulos` — `handleScrollToModules`
      (`index.tsx:47-49`) llama `scrollIntoView({ behavior: 'smooth' })`, el `id="modulos"`
      existe en la sección (`index.tsx:182`).
- [x] Envío válido dispara `POST /api/landing/lead` vía `submitLandingLead` (service extraído,
      ver más abajo), la Route Handler valida con Zod, llama a Resend con `fromEmail`/`toEmail`
      resueltos correctamente (env vars con fallback a `infoEmail`/sandbox de Resend).
- [x] Email inválido se bloquea en cliente por `zodResolver(landingLeadSchema)` antes de que
      `onSubmitLead` se ejecute — no llega a tocar la API.
- [x] Honeypot relleno (`route.ts:24-27`) responde `200 {ok:true}` sin construir la llamada a
      Resend — verificado leyendo el código, el `return` está antes del `fetch` a Resend.
- [x] Badges ISO 27001 y 99.9% eliminados; solo queda "Cumplimiento Legal" centrado
      (`index.tsx:429-439`), ya no en fila de 3.
- [x] Sin rastro de bloque JSX comentado del rating 4.9/5 en el archivo final.
- [x] Footer: "Aviso Legal" → `/legal/terms`, "Política de Privacidad" → `/legal/privacy`
      (`index.tsx:522-527`); ambas páginas son Server Components con contenido real, no
      placeholders — confirmado leyendo ambos archivos completos.
- [x] `src/app/sitemap.ts` incluye `/`, `/legal/privacy`, `/legal/terms` con `metadataBaseUrl`.
- [x] `src/app/robots.ts` permite `/`, referencia `sitemap.xml`, bloquea `/api/`, `/admin`,
      `/comercial`, `/operator`, `/field`, `/production`, `/warehouse`, `/superadmin` — coincide
      con la lista pactada en la Solución acordada punto 7.
- [x] Footer usa `© {new Date().getFullYear()}` — ya no hay literal `2025`/`2026` hardcodeado.
- [x] `npm run type-check` y `npm run lint` — re-ejecutados por mí sobre los 8 archivos
      creados/modificados, ambos limpios (exit 0, sin warnings ni errores).

### Checklist técnico del proyecto

- [x] Criterios de aceptación cumplidos (todos, ver arriba)
- [x] Sin fetch() directo indebido — hay dos usos legítimos y documentados de `fetch()` nativo:
      `landingLeadService.ts` (llama a la Route Handler interna de Next.js, no al backend
      Laravel — no hay tenant/token que inyectar, mismo patrón que
      `services/chatgpt/extractionService.js`) y `api/landing/lead/route.ts` (server-side,
      llamando a la API REST de Resend — mismo patrón que
      `api/crm/improve-text/route.js`). Ambos casos son la excepción explícita ya prevista en
      el propio GAP, no una violación de la Regla de oro 1.
- [x] Sin hardcode de tenant — N/A, landing pública sin tenant.
- [x] Sin archivos .js nuevos — los 8 archivos nuevos son `.ts`/`.tsx`.
- [x] Sin `any` sin justificación — `LandingLeadPayload` en la Route Handler tipa los campos de
      entrada como `unknown` (correcto, valida antes de confiar en el shape), sin ningún `any`
      en los archivos tocados.
- [x] `useLabelEditor.ts` no tocado.
- [x] `entitiesConfig.js` no tocado.
- [x] Patrones de `.claude/rules/` respetados en general — con una excepción real y ya señalada
      por `ux-reviewer`: `index.tsx:457-463` no pasa `aria-invalid={!!errors.email}` al `Input`
      pese a que `components.md`/CLAUDE.md ("UI Stack") piden explícitamente validar los
      estados `data-invalid` en campos de formulario, y el primitivo `Input` ya tiene los
      estilos `aria-invalid:*` preparados y sin usar. No es motivo de rechazo (no rompe el
      flujo, el error sigue siendo visible como texto), pero es una desviación real de una
      regla escrita, no solo una sugerencia de estilo — la dejo como observación para Jose, no
      la doy por aprobada sin más.
- [x] Nomenclatura correcta — `submitLandingLead` (camelCase, service), `landingLeadSchema`
      (camelCase, schema), `LandingLeadForm`/`LandingLeadPayload` (PascalCase, tipos),
      `LandingPage` (PascalCase, componente). Consistente con `.claude/rules/typescript.md`.
- [x] `queryKeys` de factories — N/A: no es un dato de servidor cacheable con TanStack Query,
      es un envío puntual de formulario (consistente con el propio `ux-reviewer`, principio 3
      del checklist de `design-context.md` — el principio habla de datos de servidor, no de
      flags de envío de una mutación de un solo uso).
- [x] Loading states con Skeleton — N/A, sin carga inicial de datos (confirmado en el UI Brief
      del propio GAP).
- [~] Errores de API con `notify.error(getErrorMessage(...))` — parcial: el componente usa
      `notify.error(error instanceof Error ? error.message : '...')` en vez de
      `getErrorMessage(error)`. Es una adaptación razonable (el service ya normaliza el error a
      un `Error` con `.message` = `userMessage` de la API, y esta ruta no pasa por el sistema
      `ApiError`/`apiHelpers.js` porque no es una llamada al backend Laravel), pero tiene un
      efecto colateral real: si `fetch()` lanza antes de completarse (fallo de red genuino), el
      `catch` recibe un `TypeError` nativo del navegador cuyo `.message` es texto técnico en
      inglés ("Failed to fetch") y eso llega tal cual al toast. Confirmo el hallazgo del
      `ux-reviewer` — `landingLeadService.ts:18-28` no envuelve el `fetch()` en su propio
      `try/catch` para normalizar ese caso a un mensaje en español. No bloqueante, pero real.
- [x] Errores 422 con `setErrorsFrom422` — N/A, no aplica: un único campo de email validado por
      Zod en cliente, no hay formulario con múltiples campos mapeados desde errores 422 del
      backend Laravel.

### Revisión Visual — N/A parcial

Este GAP no toca el sistema visual (colores, tipografía, hero, bento están explícitamente fuera
de alcance según el propio UI Brief). Verificado que no se introdujeron valores hex/rgb/oklch
hardcodeados nuevos, ni `style={{ }}` inline, ni sustituciones de componentes shadcn — el
formulario reutiliza `Input`/`Button` existentes tal cual. El único punto real de esta sección
es el contraste señalado por `ux-reviewer` (ver Revisión UX abajo), que sí es un hallazgo válido
de esta capa aunque el GAP no tocara el sistema visual en general.

### Revisión UX — Full (subagente `ux-reviewer`)

Sección `## Revisión UX` ya completa en este GAP.md (ver abajo). Concuerdo con el veredicto y la
clasificación de bloqueante/no bloqueante del `ux-reviewer`: ningún hallazgo rompe el flujo, dos
son reales y accionables (falta de `aria-invalid` + contraste del error, y el mensaje de red sin
traducir), el resto son mejoras menores o no verificables sin navegador. Yo mismo confirmé por
lectura de código los tres hallazgos técnicos más concretos (`aria-invalid` ausente, contraste
calculable en el código, falta de `try/catch` interno en el service) — no son solo inferencia
del `ux-reviewer`, los veo directamente en las líneas citadas. **Veredicto UX: ⚠️ APROBADO CON
OBSERVACIONES, 7/10** (no bloquea el cierre).

### Observaciones para Jose

La implementación cumple los 12 criterios de aceptación tal cual estaban escritos, y la
migración `.js` → `.tsx` quedó limpia (`type-check`/`lint` verificados por mí, no solo por el
reporte del implementador). El hallazgo de la primera pasada (fetch inline en el componente,
PL-008) está correctamente resuelto: `landingLeadService.ts` sigue el mismo patrón que
`extractionService.js` para llamar a una ruta interna de Next.js sin pasar por
`fetchWithTenant` (correcto, porque no hay backend Laravel ni tenant de por medio aquí).

Quedan tres cosas reales que recomiendo resolver en un ciclo rápido antes de dar la Fase A por
cerrada del todo — ninguna bloquea, pero las tres tocan justo el CTA que este GAP existe para
arreglar:

1. **`src/components/LandingPage/index.tsx:457-463`** — añade `aria-invalid={!!errors.email}`
   al `Input` del email. El componente base ya tiene los estilos preparados
   (`aria-invalid:border-destructive aria-invalid:ring-3...` en `src/components/ui/input.jsx`)
   y hoy nunca se activan porque falta el atributo. Es una línea, y es una regla explícita de
   CLAUDE.md ("Validar correctamente los estados `data-invalid` en campos de formulario").
2. **`src/components/LandingPage/index.tsx:465`** — el texto de error (`text-red-100` sobre
   `bg-sky-500`) tiene un contraste de ~2.27:1, muy por debajo del mínimo WCAG AA (4.5:1) para
   texto pequeño. Cambialo a un color con más contraste sobre ese fondo azul (blanco puro con
   peso de fuente, o un chip con fondo sólido).
3. **`src/services/landing/landingLeadService.ts:18-28`** — envuelve el `fetch()` en su propio
   `try/catch` para que un fallo de red genuino (offline, DNS, ad-blocker) no propague el
   `TypeError` nativo del navegador ("Failed to fetch", en inglés) directamente al toast. Un
   mensaje fijo tipo "No se pudo enviar la solicitud. Comprueba tu conexión." es suficiente.

Lo que está bien y vale la pena decir explícitamente: el honeypot está construido de manual de
estilo (invisible, no enfocable, no delata al bot, éxito silencioso exactamente como pedía el
criterio de aceptación), las páginas legales tienen contenido real y honesto (no placeholders,
y señalan correctamente que son un borrador pendiente de revisión legal), y `robots.ts`/
`sitemap.ts` están bien resueltos con la lista completa de rutas internas bloqueadas.

**PL CANDIDATE 1:** el patrón "`Input` de RHF sin `aria-invalid`" ya se ha visto controlado en
otros formularios del ERP gracias a los componentes de formulario compartidos, pero aquí, al
construirse "a mano" con `register()` en vez del wrapper `Form`/`FormField` de shadcn, se perdió
ese comportamiento por defecto. Vale la pena documentar en `.claude/rules/components.md` que
cualquier `Input` fuera del wrapper `FormField` debe pasar `aria-invalid` explícitamente.

**PL CANDIDATE 2:** servicios que usan `fetch()` nativo (la excepción documentada de rutas
internas de Next.js o Superadmin) deberían envolver siempre la llamada en `try/catch` propio
para normalizar errores de red a un mensaje en español — el patrón actual de
`extractionService.js` (referencia usada para justificar este service) tiene el mismo riesgo,
vale la pena revisarlo también.

### Estado final de la implementación

`src/components/LandingPage/index.tsx` es ahora un Client Component tipado que resuelve los 6
hallazgos del GAP: scroll suave a módulos, formulario de leads funcional con RHF+Zod+honeypot
contra `POST /api/landing/lead` (Route Handler que llama a Resend vía `fetch` nativo, sin SDK
nuevo), badges falsos eliminados, enlaces legales apuntando a páginas reales
(`/legal/privacy`, `/legal/terms`), `sitemap.ts`/`robots.ts` nuevos, y copyright con año
dinámico. La arquitectura de la capa de leads (`landingLeadSchema.ts` → `LandingPage` →
`landingLeadService.ts` → `api/landing/lead/route.ts` → Resend) sigue el flujo de capas del
proyecto y ya no tiene el `fetch()` inline que señalé en la primera pasada. El único trabajo
pendiente real son los tres puntos de accesibilidad/calidad de error listados arriba, ninguno
bloqueante para el cierre de este GAP.

---

## Revisión UX

UX REVIEW — FULL
════════════════
GAP: GAP-119 — Landing Fase A: detener la sangría
Reviewer: ux-reviewer agent
Mode: Full

**Limitación honesta heredada del entorno:** no hay Playwright ni navegador headless
disponible en esta sesión, igual que le ocurrió al implementador y al `gap-auditor`. Toda
esta simulación se hizo por lectura completa de `src/components/LandingPage/index.tsx`,
`landingLeadService.ts`, `api/landing/lead/route.ts` y `landingLeadSchema.ts`, más cálculo
manual de contraste de color (fórmula WCAG de luminancia relativa) donde era relevante. No
se pudo confirmar visualmente cómo se ve/comporta el formulario en un navegador real. Dos
hallazgos de abajo (ancho del input en mobile, aspecto real del texto de error) dependen de
render real y se marcan explícitamente como "no verificado, solo inferido por código" —
recomiendo a Jose una pasada visual rápida (`npm run dev`) antes de dar la Fase A por
cerrada del todo, en línea con lo que ya pidió el implementador.

### FLOW SIMULATION SUMMARY

Steps simulated: 6 (llegada a landing → click "Ver características" → llegada al CTA final →
email inválido → email válido con éxito → fallos de red/servidor → honeypot)
User roles covered: visitante anónimo (tráfico público, sin sesión, sin rol de la app)
Edge cases covered: email vacío/inválido, fallo de red (`fetch` lanza antes de respuesta),
fallo de servidor (sin `RESEND_API_KEY`, fallo de Resend), honeypot relleno, doble click en
enviar, enlaces legales rotos (ahora corregidos), mobile (inferido, no verificado)

---

### FLOW SIMULATION

**Role:** Visitante anónimo (SEO, ads, enlace directo) — tráfico público no autenticado.
**Entry point:** `/` — landing pública servida por `LandingPage` (vía `page.js`, fuera de
alcance de este GAP).

**Step 1 — Hero.** El usuario ve el hero con dos CTAs: "Ver demo" (abre `demoUrl` en pestaña
nueva) y "Ver características".
→ Acción: click en "Ver características".
→ Resultado: `handleScrollToModules` hace `scrollIntoView({ behavior: 'smooth' })` al
`id="modulos"` (`index.tsx:47-49`, `182`). Comportamiento correcto y verificable por lectura
— el `id` referenciado existe y coincide con la constante `MODULES_SECTION_ID`.
→ Fricción potencial: ninguna funcional. Nota menor de accesibilidad: no hay gestión de foco
tras el scroll (el foco del teclado no se mueve a la sección de módulos), así que un usuario
de teclado/lector de pantalla no recibe ningún anuncio de "llegaste a una nueva sección" —
solo ve el scroll visual. Es una omisión común y no bloqueante, pero queda documentada.

**Step 2 — Sección de módulos.** Usuario revisa las 5 tarjetas de características. Sin
interacción compleja, solo lectura. Sin fricción.

**Step 3 — Trust badge único.** Tras el fix de FND-03, solo queda "Cumplimiento Legal" /
"Normativas internacionales" centrado (`index.tsx:429-439`). Verificado: no queda ningún
rastro de "ISO 27001" ni "99.9%" ni el bloque comentado del rating 4.9/5 en el archivo — el
hallazgo de honestidad está resuelto en el flujo visible.

**Step 4 — CTA final: formulario de leads.** Usuario llega a "¿Listo para transformar tu
empresa?" con el input de email y el botón "Solicitar acceso" (`index.tsx:450-482`).
→ Acción: escribe un email y pulsa enviar (o Enter, ya que `type="submit"` dentro de un
`<form>` con un solo campo de texto dispara submit con Enter de forma nativa — correcto).
→ Resultado (feliz): `onSubmitLead` pone `isSubmittingLead=true` → botón queda `disabled` con
texto "Enviando..." → `submitLandingLead` hace `POST /api/landing/lead` → 200 → `notify.success`
+ `reset({ email: '' })` → botón vuelve a "Solicitar acceso" habilitado.
→ Fricción potencial (real, verificada por código): el único input del formulario **no
recibe `aria-invalid`/`data-invalid`** cuando hay error — se hace `{...register('email')}`
sin añadir `aria-invalid={!!errors.email}` (`index.tsx:457-463`). El `Input` base
(`src/components/ui/input.jsx:15`) sí tiene estilos `aria-invalid:border-destructive
aria-invalid:ring-3 aria-invalid:ring-destructive/20` preparados, pero nunca se activan
porque el atributo no se pasa. Esto contradice una regla explícita de `CLAUDE.md` ("UI
Stack": *"Validar correctamente los estados `data-invalid` en campos de formulario"*). En la
práctica: cuando el email es inválido, la caja del input **no cambia visualmente** (ni borde
rojo, ni ring) — la única señal de error es el texto pequeño debajo.
→ Fricción potencial (real, calculada): ese texto de error usa `text-red-100` sobre un fondo
`bg-sky-500` sólido (`index.tsx:464-466`), una desviación deliberada del patrón documentado
(`text-red-400` en `design-context.md § Error States`, pensado para fondo claro) adaptada
para el fondo azul de esta sección. Calculado el contraste WCAG (luminancia relativa):
`#fee2e2` sobre `#0ea5e9` ≈ **2.27:1**. El mínimo AA para texto pequeño (12px, `text-xs`) es
4.5:1 — el texto de error queda muy por debajo del umbral de accesibilidad. Combinado con la
falta de `aria-invalid` en el input, el único feedback de "tu email no es válido" en el CTA
de conversión más importante de toda la landing es un texto pequeño y de bajo contraste, sin
ningún refuerzo visual en el propio campo.
→ Fricción potencial (no verificada, solo inferida): el `<Input>` base tiene `w-full`
integrado (`input.jsx:15`), pero sus contenedores (`div.text-left` → `div.flex flex-col
gap-2 sm:flex-row sm:items-start` → `form.flex flex-col items-center ... sm:flex-row
sm:justify-center`) no fijan ningún ancho explícito, y el `form` usa `items-center` (que
en `flex-col` evita el `stretch` por defecto). A diferencia de los botones del hero, que sí
declaran explícitamente `w-full sm:w-fit` para garantizar un ancho correcto en mobile
(`index.tsx:102`, `110`), el formulario del CTA final no tiene un equivalente. Es plausible
que en mobile el input no ocupe el ancho esperado (podría quedar más estrecho de lo que un
usuario esperaría de un campo de email en una pantalla de móvil). No lo puedo confirmar sin
navegador — lo marco como riesgo a verificar visualmente, no como hallazgo confirmado.

**Step 5 — Footer.** "Aviso Legal" → `/legal/terms`, "Política de Privacidad" →
`/legal/privacy`. Ambos son Server Components simples, contenido real (no placeholder),
enlace de vuelta a inicio en el header de cada página. Flujo correcto, sin fricción. El año
del copyright es dinámico (`new Date().getFullYear()`), verificado.

**Step 6 — Salida.** No hay más pasos; el usuario termina en la landing o en una página
legal, sin dead-ends ni loops.

---

### EDGE CASES SIMULADOS

**Empty state:** N/A — no hay listados ni datos que traer en este GAP (formulario de
escritura pura, confirmado en el UI Brief: "Sin estado loading de carga inicial").

**Error state — email vacío/inválido:** Bloqueado en cliente por Zod antes de llegar a la
API (`landingLeadSchema.ts:10`, `handleSubmit` de RHF). Cumple el criterio de aceptación.
Ver fricción de contraste/`aria-invalid` arriba — el bloqueo funciona, pero la señal visual
es débil.

**Error state — fallo de red genuino (offline, DNS, ad-blocker bloqueando el `fetch`):**
Este es el hallazgo más concreto de la revisión. `submitLandingLead` (
`landingLeadService.ts:18-28`) no envuelve la llamada `fetch()` en un `try/catch` propio —
si `fetch()` lanza antes de recibir respuesta (típico `TypeError: Failed to fetch` en
Chrome, o "NetworkError when attempting to fetch resource" en Firefox), ese error se
propaga tal cual hasta `onSubmitLead` en el componente:
```tsx
} catch (error) {
  notify.error(error instanceof Error ? error.message : 'No se pudo enviar la solicitud');
}
```
Como `TypeError` es instancia de `Error`, `error.message` es el string técnico y en inglés
del navegador ("Failed to fetch"), no un mensaje en español ni de la API. En este caso
concreto (fallo de red, no fallo de servidor) el usuario vería literalmente **"Failed to
fetch"** en el toast — un mensaje técnico, en inglés, en una landing en español, en el
CTA que es la razón de ser de este GAP (recuperar leads perdidos). No rompe el flujo (el
botón se reactiva vía `finally`, el usuario puede reintentar), pero es una fuga de calidad
justo en el punto de fricción más sensible de la página. Fix sugerido (no soy quien lo
implementa): envolver el `fetch()` interno en `try/catch` y lanzar siempre un `Error` con un
mensaje en español ("No se pudo enviar la solicitud. Comprueba tu conexión.") cuando la
llamada falla antes de obtener respuesta.

**Error state — servidor (sin `RESEND_API_KEY`, o Resend devuelve error):** Verificado por
código y por las pruebas `curl` documentadas en el GAP: la API responde 400/500/502 con
`userMessage` en español, que sí llega correctamente al toast (`result.userMessage` se lee
en `landingLeadService.ts:27`). Este camino funciona bien — el problema de arriba es
específicamente cuando `fetch()` ni siquiera llega a completarse.

**Partial data:** N/A, un único campo de texto.

**Permission edge:** N/A, no hay roles en tráfico público.

**Concurrent action:** Doble click en "Solicitar acceso" — `setIsSubmittingLead(true)` se
llama de forma síncrona al inicio del handler, antes del `await`, y el botón queda
`disabled`. Protección suficiente para el caso realista (un segundo click ocurre después del
primer render con el botón ya deshabilitado). No hay protección de idempotencia en servidor,
pero no es necesaria para un formulario de captación de este tamaño — no lo considero un
hallazgo.

**Honeypot relleno (bot, o colisión accidental con un gestor de contraseñas):** El
Route Handler devuelve `{ok:true}` con 200 sin enviar el email
(`api/landing/lead/route.ts:24-27`), y el cliente lo trata como éxito genuino: toast de
éxito + input limpiado (`landingLeadService.ts` no distingue este caso, ni podría, por
diseño — es la esencia de un honeypot silencioso). Esto es exactamente lo que pide el
criterio de aceptación y está bien implementado (`tabIndex={-1}`, `aria-hidden="true"`,
`h-0 w-0 opacity-0`, no enfocable, invisible). Riesgo residual aceptado de la técnica en sí
(no específico de esta implementación): si algún gestor de contraseñas o extensión rellena
campos ocultos de forma agresiva, un usuario real perdería su lead de forma
**completamente silenciosa** — ni él ni Jose se enterarían, porque ve el toast de éxito y el
servidor no deja ningún rastro de que el honeypot se disparó (no hay `console.log` en esa
rama de `route.ts:24-27`, a diferencia de las ramas de error que sí loguean). Es un
trade-off estándar y aceptado de esta técnica anti-spam (decisión ya tomada en el GAP), no
lo considero motivo de rechazo, pero recomiendo una mejora barata y no bloqueante: añadir un
`console.log` server-side cuando se dispara el honeypot, para poder correlacionar si alguna
vez el volumen de leads reales cae de forma sospechosa.

**Mobile:** Aplica (UI Brief lo marca como "aplica ahora"). Ver fricción no verificada del
ancho del input arriba. El resto del mobile (grid de tarjetas, botones del hero con
`w-full sm:w-fit`, footer en columna) sigue el patrón mobile-first estándar de Tailwind y no
presenta hallazgos nuevos por lectura de código.

---

### FINDINGS

✅ **Funcionando bien:**
- Scroll suave a "Ver características" correctamente cableado y verificable (`index.tsx:47-49`).
- Validación cliente con Zod bloquea envíos inválidos antes de tocar la API — cumple el
  criterio de aceptación tal cual.
- Estados idle → enviando → éxito/error implementados según el UI Brief: botón `disabled` +
  texto de carga, `notify.success` + limpieza del input en éxito, `notify.error` en error.
- Honeypot invisible, no enfocable, no delata al bot — implementación de manual de estilo.
- `noValidate` en el `<form>` evita el doble aviso nativo del navegador + RHF.
- Enlaces legales apuntan a páginas reales con contenido honesto, no placeholders.
- Año de copyright dinámico, ya no hardcodeado.
- Mensajes de error de servidor (`userMessage`) sí llegan correctamente al toast cuando la
  API responde (aunque sea con error 400/500/502).

⚠️ **Fricciones (no bloqueantes, pero recomiendo resolver antes de dar la Fase A por
cerrada del todo):**
1. `Input` del email no recibe `aria-invalid={!!errors.email}` — el campo no muestra ninguna
   señal visual (borde/ring) cuando el email es inválido, pese a que el componente base ya
   tiene los estilos preparados. Contradice la regla explícita de `CLAUDE.md` sobre validar
   estados `data-invalid`. Fix: una línea en `index.tsx:457-463`.
2. Contraste del texto de error (`text-red-100` sobre `bg-sky-500`) ≈ 2.27:1, muy por debajo
   del mínimo WCAG AA (4.5:1) para texto pequeño. Es el único refuerzo visual del error
   (dado el punto 1), así que el problema se compone. Fix: usar un color con más contraste
   (p. ej. blanco con peso de fuente, o un chip con fondo sólido) — `index.tsx:465`.
3. Fallo de red genuino (`fetch()` lanza antes de respuesta) propaga el mensaje técnico del
   navegador ("Failed to fetch") directamente al toast, en inglés, sin pasar por
   `userMessage` de la API. Fix: `try/catch` interno en `landingLeadService.ts:18-28` con un
   mensaje de fallback en español.
4. Sin gestión de foco tras el scroll suave a "Ver características" — omisión menor de
   accesibilidad de teclado, no bloqueante.
5. Ancho del `Input` de email en mobile no verificable sin navegador — los contenedores del
   formulario no replican el patrón explícito `w-full sm:w-fit` que sí usan los botones del
   hero. Recomiendo una comprobación visual rápida en un móvil real o el dev server antes de
   cerrar la Fase A del todo.
6. El honeypot, si se dispara, no deja ningún rastro server-side (`route.ts:24-27` no
   loguea) — trade-off aceptado de la técnica, pero una línea de `console.log` ahí daría
   visibilidad si algún día hay una caída sospechosa de leads reales.

❌ **Bloqueantes:** Ninguno. Ningún hallazgo rompe el flujo, deja al usuario sin salida, o
hace que una acción crítica falle silenciosamente de forma no intencionada (el único caso de
"éxito silencioso sin envío real" es el honeypot, que es el comportamiento pedido
explícitamente por el criterio de aceptación, no un defecto).

---

### UX PRINCIPLES CHECK (design-context.md § 8, principios aplicables a la landing pública)

1. Destructive actions always require confirmation: N/A — no hay acciones destructivas en
   este GAP.
2. Mobile is a separate render path, not CSS hide/show: N/A — la landing usa Tailwind
   mobile-first ya existente, no aplica el patrón `useIsMobileSafe` del ERP (confirmado
   fuera de alcance por el contexto de esta revisión).
3. Data always from TanStack Query hooks: N/A para este GAP — `isSubmittingLead` es estado
   de UI de una mutación puntual, no datos de servidor cacheables; no es una violación del
   principio (el principio habla de *datos de servidor*, no de flags de envío).
4. Loading states match content shape: N/A — sin carga inicial de datos, confirmado en el UI
   Brief.
5. Entity configuration declarative: N/A — landing pública, no es una vista de EntityClient.
6. Errors surface at the right level: ⚠️ — el nivel es correcto (campo → RHF, acción → toast),
   pero la *calidad* de la señal falla en dos puntos (contraste + falta de `aria-invalid` en
   el campo; mensaje técnico en el fallo de red). Ver hallazgos 1-3 arriba.
7. Density high, chrome minimal: N/A — explícitamente fuera de alcance (sistema visual de la
   landing es Fase B).
8. Icons Lucide-only: ✅ — todos los iconos usados (`Fish`, `Package`, `ShoppingCart`,
   `FileText`, `Waves`, `Shield`, `Globe`, `Mail`, `Phone`, `Sparkle`, `Ticket`,
   `ArrowUpRight`) son de `lucide-react`.

---

### VERDICT: ⚠️ APROBADO CON OBSERVACIONES

El flujo funcional del formulario de leads (la pieza más crítica de este GAP) está bien
resuelto: los cuatro estados pedidos en el UI Brief existen y se comportan como se espera
por lectura de código, la validación cliente/servidor funciona, el honeypot está bien
construido, y los hallazgos de honestidad (FND-03) y enlaces rotos (FND-04) quedan
verificablemente resueltos. No hay ningún hallazgo que rompa el flujo o deje al usuario sin
salida — por eso no rechazo el GAP.

Sí hay una fricción real y concreta que vale la pena resolver antes de cerrar la Fase A del
todo: el feedback de error del único campo del formulario es más débil de lo que debería
(sin `aria-invalid`, con un contraste de texto muy por debajo de WCAG AA), y el caso de
fallo de red genuino escapa al mensaje en español de la API. Ninguno de los dos es
bloqueante, pero ambos apuntan exactamente al punto que este GAP existe para arreglar
(captación de leads) — recomiendo a Jose decidir si los resuelve ahora (cambios pequeños,
localizados) o los deja anotados como deuda de Fase A para una iteración rápida siguiente.

También recomiendo, antes de dar la Fase A por cerrada del todo, una verificación visual
rápida en navegador real (aunque sea sin `RESEND_API_KEY` configurada) — ni esta revisión ni
las anteriores (implementador, `gap-auditor`) pudieron confirmar visualmente el ancho del
input en mobile ni el aspecto real del texto de error de bajo contraste calculado arriba.

---

### Addendum post-cierre (2026-07-28)

Las 3 observaciones no bloqueantes de esta revisión se corrigieron en el mismo ciclo, después
del cierre formal del GAP (`npm run type-check` y `npm run lint` limpios tras el cambio):

1. `src/components/LandingPage/index.tsx` — añadido `aria-invalid={!!errors.email}` al `Input`
   del email.
2. `src/components/LandingPage/index.tsx` — el mensaje de error del campo pasó de
   `text-red-100` sobre `bg-sky-500` (contraste ~2.27:1) a una pastilla `bg-white/95
   text-red-600` (contraste muy por encima de WCAG AA).
3. `src/services/landing/landingLeadService.ts` — el `fetch()` ahora está envuelto en su
   propio `try/catch`; un fallo de red genuino ("Failed to fetch") se traduce a un mensaje en
   español ("No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.") en vez de
   propagar el `TypeError` nativo del navegador al toast.

Pendiente real que sigue en pie: no hay Playwright/navegador headless en este entorno, así que
el aspecto visual final (ancho del input en mobile, la pastilla de error nueva) sigue sin
confirmarse en un navegador real — recomendación de la revisión anterior, sin cambios.

Score: 7/10
