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

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo (excepción: Route Handler server-side llamando a Resend, documentada
      arriba)
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

[Texto claro — qué está bien, qué hay que revisar, sin tecnicismos innecesarios]

### Estado final de la implementación

[Descripción del estado real del código tras la implementación]
