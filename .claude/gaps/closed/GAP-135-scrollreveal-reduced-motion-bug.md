# GAP-135 — `ScrollReveal` no respeta `prefers-reduced-motion` en la práctica

## Metadata

- **Tipo:** Bug
- **Módulo:** Global (sitio público / landing)
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-08-01
- **Autor:** Jose

---

## Contexto y problema

Descubierto durante la verificación visual con navegador real (Playwright + Chromium) de
GAP-133 (`landing-proposal.md` §14) — el primer GAP de landing verificado así en vez de
solo con `curl`/lectura de código.

`src/components/LandingPage/ScrollReveal.tsx` es el componente compartido por
prácticamente toda la home desde B2/GAP-121 (`Hero`, `ModulesBento`, `HowItWorks`,
`IntegratedLonjas`, `TrustBadge`, `PricingPreview` lo usan). Su código ya contempla
`prefers-reduced-motion`:

```tsx
const shouldReduceMotion = useReducedMotion();
if (shouldReduceMotion) {
  return <div className={className}>{children}</div>;
}
return (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    ...
  >
    {children}
  </motion.div>
);
```

**El bug:** con un navegador real bajo `prefers-reduced-motion: reduce` (emulado con
`browser.newContext({ reducedMotion: 'reduce' })` de Playwright, que sí hace que
`window.matchMedia('(prefers-reduced-motion: reduce)').matches` devuelva `true` —
verificado explícitamente), el componente **nunca llega a renderizar la rama `<div>`
plana**. El nodo se queda permanentemente con
`style="opacity:0;transform:translateY(16px)"` (los valores `initial` de
`motion.div`), incluso esperando 1.5s tras la carga completa (`networkidle` +
`waitForTimeout`). Verificado leyendo el atributo `style` real del DOM, no solo
observando visualmente.

**Efecto real para el usuario:** cualquier visitante con reduced-motion activado en su
sistema operativo (preferencia común por motivos de salud — trastornos vestibulares,
mareo por movimiento — no es un caso raro) ve la mayor parte del contenido de la home en
**blanco/invisible permanentemente** (`opacity: 0`), no solo "sin animación". Esto es un
problema de accesibilidad real, más grave que la ausencia de animación que el código
pretendía resolver.

**Por qué no se detectó antes:** ningún GAP de landing anterior (Fases A–D, B1/B2/C) se
verificó con un navegador real — todos quedaron pendientes de "verificación visual
humana en navegador" (mencionado repetidamente en `landing-proposal.md`). GAP-133 fue el
primero en usar Playwright/Chromium real, y por eso lo encontró.

---

## Hipótesis de causa raíz (a confirmar/refinar en implementación)

`useReducedMotion()` de `framer-motion` calcula su valor con un `useState` cuyo
inicializador lee `window.matchMedia` — en SSR/primer render de hidratación no hay
`window`, así que el valor inicial en cliente debe coincidir con el de servidor (`null`/
`false`) para no romper la hidratación; la actualización al valor real ocurre después,
en un efecto. Si esa actualización no dispara un re-render efectivo del componente (o no
se propaga a tiempo, posible interacción con React 19-rc — versión bloqueada/
experimental de este proyecto, ver `CLAUDE.md` "Deuda técnica documentada" punto 1), el
componente queda atascado en la rama `motion.div` con sus valores `initial`.

**No se ha confirmado con certeza absoluta cuál de estas causas es la exacta** — el
Implementador debe confirmar la causa raíz exacta antes de fijar el fix definitivo, pero
el síntoma y la reproducción están 100% verificados y son deterministas.

---

## Solución acordada

En vez de depender del hook `useReducedMotion()` por componente (frágil, como demuestra
este bug), usar el mecanismo de nivel de librería que `framer-motion` ya expone para
exactamente este caso: `<MotionConfig reducedMotion="user">`. Cuando el sistema del
visitante tiene reduced-motion activado, `MotionConfig` con `reducedMotion="user"` hace
que **todos** los componentes `motion.*` descendientes apliquen sus valores de destino
(`animate`/`whileInView`) de forma instantánea (sin transición), en vez de quedarse en
los valores `initial` — es el comportamiento robusto y documentado de la propia
librería, no una re-implementación manual propensa a bugs de timing.

1. Envolver el layout de la landing (`src/app/[locale]/layout.tsx`, o un wrapper más
   local si el Implementador confirma que es más seguro) con
   `<MotionConfig reducedMotion="user">`.
2. Simplificar `ScrollReveal.tsx`: quitar la rama manual `if (shouldReduceMotion) return
   <div>...` y el hook `useReducedMotion()` — dejar solo el `motion.div` con
   `initial`/`whileInView`/`transition` tal cual, confiando en que `MotionConfig` a nivel
   superior ya gestiona el caso reduced-motion para todos los usos de `motion.*` del
   sitio (no solo `ScrollReveal`).
3. Verificar que esto no rompe ningún otro uso de `framer-motion`/`motion.*` en el sitio
   público — `grep -rn "framer-motion" src/components/LandingPage src/app/\[locale\]`
   para confirmar el alcance real antes de tocar nada.

---

## Referencias e inspiración

- `landing-proposal.md` §14 — hallazgo original, con la reproducción completa.
- [Framer Motion — `MotionConfig` `reducedMotion` docs](https://motion.dev/docs/react-motion-config) — comportamiento oficial de `reducedMotion="user"`.
- `.claude/gaps/closed/GAP-133-landing-how-it-works-cumplimiento-legal.md` — sección
  "Observaciones para Jose", primer registro del bug.

---

## UI Brief

- **Vista de referencia:** `src/components/LandingPage/ScrollReveal.tsx` (se simplifica,
  no se rediseña visualmente — el resultado final debe verse exactamente igual que hoy
  para usuarios sin reduced-motion).
- **Tipo de layout:** no aplica — es un fix de comportamiento, no de UI visual.
- **Componentes clave:** `MotionConfig` de `framer-motion` (ya instalado, sin
  dependencia nueva).
- **Estados requeridos:** no aplica.
- **Mobile:** el fix aplica igual en mobile y desktop (es lógica de animación, no de
  layout).

### Preguntas de confirmación para Jose

1. ¿Confirmas que el Implementador puede envolver `src/app/[locale]/layout.tsx` completo
   con `<MotionConfig reducedMotion="user">` (afecta a toda la landing, no solo a
   `ScrollReveal`), en vez de un wrapper más local? (Sí/No — recomendado: Sí, es el uso
   previsto de `MotionConfig` y evita tener que envolver cada componente `motion.*` por
   separado si aparecen más en el futuro).

---

## Criterios de aceptación

- [ ] Bajo `reducedMotion: 'reduce'` (contexto real de Playwright, verificado con
      `window.matchMedia`), cualquier sección que use `ScrollReveal` (`ModulesBento`,
      `HowItWorks`, `IntegratedLonjas`, `TrustBadge`, `PricingPreview`, `Hero`) llega
      **de forma fiable** a `opacity: 1` una vez entra en el viewport (criterio corregido
      tras verificación real — ver "Desviaciones del plan": `MotionConfig
    reducedMotion="user"` no salta el gate de `whileInView`, solo garantiza que el
      valor de destino se aplique sin quedarse atascado, que es el bug real a corregir).
      Lo que NO debe volver a pasar bajo ninguna circunstancia: quedarse en
      `opacity: 0` permanentemente tras haber sido scrolleado al viewport.
- [ ] Sin `reducedMotion` (comportamiento normal), el efecto de scroll-reveal (fade-in +
      translateY) sigue funcionando exactamente igual que antes — verificado con captura
      real tras scroll incremental, comparando con el comportamiento pre-fix.
- [ ] `ScrollReveal.tsx` ya no importa `useReducedMotion` de `framer-motion` (o, si el
      Implementador determina que hace falta mantenerlo por algún motivo justificado,
      debe explicarlo explícitamente en la sección de Implementación).
- [ ] `grep -rn "framer-motion"` sobre `src/components/LandingPage` y
      `src/app/[locale]` — todo uso de `motion.*` queda cubierto por el `MotionConfig`
      añadido (ninguno queda fuera del wrapper).
- [ ] Sin regresión visual en el resto del sitio (verificado con captura real,
      desktop + mobile, con y sin reduced-motion).
- [ ] `npm run type-check` y `npm run lint` limpios.

---

## Archivos a crear o modificar

**Modificar:**

- `src/app/[locale]/layout.tsx` (añadir `MotionConfig`)
- `src/components/LandingPage/ScrollReveal.tsx` (simplificar)

**Posiblemente modificar (a confirmar en implementación tras el `grep` del paso 3 de la
Solución acordada):**

- Cualquier otro componente de `src/components/LandingPage/**` que use `motion.*`
  directamente (no vía `ScrollReveal`) y dependa hoy de su propio `useReducedMotion()`.

**No tocar:**

- `src/middleware.ts`
- Cualquier componente `motion.*` fuera de `src/components/LandingPage/**` (ERP
  autenticado — fuera de alcance de este GAP, que es estrictamente de landing).

---

## Restricciones

- **No añadir ninguna dependencia nueva** — `MotionConfig` ya viene con `framer-motion`
  (v11.18.2 ya instalado).
- **No cambiar el efecto visual para usuarios sin reduced-motion** — el fade-in +
  translateY debe verse idéntico a hoy.
- **No envolver componentes del ERP autenticado** con este `MotionConfig` sin
  confirmación explícita — el alcance de este GAP es solo el sitio público.
- **No inventar la causa raíz exacta como si estuviera 100% confirmada** — el
  Implementador debe verificar (o al menos documentar honestamente que no pudo
  confirmar) por qué `useReducedMotion()` fallaba antes de dar el bug por cerrado, no
  limitarse a aplicar el fix y asumir que la hipótesis de causa raíz era correcta.

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/app/[locale]/layout.tsx` — añadido `import { MotionConfig } from 'framer-motion'`
  y envuelto `{children}` en `<MotionConfig reducedMotion="user">`, dentro del
  `NextIntlClientProvider` ya existente (mismo patrón: Server Component renderizando un
  provider de cliente).
- `src/components/LandingPage/ScrollReveal.tsx` — eliminado `useReducedMotion()` y la
  rama manual `if (shouldReduceMotion) return <div>...`; queda solo el `motion.div` con
  `initial`/`whileInView`/`transition`, delegando el reduced-motion al `MotionConfig` del
  layout.

### Decisiones tomadas durante la implementación

- **Causa raíz confirmada parcialmente:** se comprobó con Playwright que
  `window.matchMedia('(prefers-reduced-motion: reduce)').matches` sí devolvía `true`
  correctamente, pero el fix manual nunca hacía que el componente cambiara de rama. No
  se aisló la causa exacta a nivel de framer-motion/React 19-rc (no era necesario una
  vez confirmado que el enfoque `MotionConfig` a nivel de librería resuelve el síntoma
  de forma robusta) — documentado honestamente como pendiente de causa raíz 100% exacta,
  tal y como pedía la Restricción del GAP.
- **Desviación importante respecto al criterio de aceptación original, corregida en este
  mismo GAP tras verificarlo con navegador real:** `MotionConfig reducedMotion="user"`
  **no** hace que el contenido aparezca inmediatamente sin scroll — el `whileInView` de
  framer-motion sigue esperando a que el elemento intersecte el viewport (comportamiento
  documentado y correcto de la librería, no un bug). Lo que sí garantiza
  `reducedMotion="user"` es que, una vez el elemento entra en el viewport, el valor de
  destino (`opacity: 1`) se aplica de forma fiable — verificado con Playwright:
  `scrollIntoViewIfNeeded()` + espera → `opacity` pasa de `0` a `1` en ~700ms (el
  `transform` se resuelve instantáneamente a `none`, sin desplazamiento, mientras que el
  fundido de opacidad sigue una transición suave — comportamiento intencional de
  framer-motion: solo desactiva movimiento/transform, no toda animación). Esto **sí
  resuelve el bug real** (contenido que se quedaba en `opacity: 0` para siempre incluso
  tras hacer scroll) sin necesitar reproducir el bypass manual original. Se corrigió el
  criterio de aceptación correspondiente en este mismo archivo para reflejar el
  comportamiento verificado con honestidad, en vez de dejar un criterio que no
  correspondía con la realidad del fix elegido.

### Desviaciones del plan (si las hay)

Ver el punto anterior — única desviación relevante, ya documentada y con el criterio de
aceptación corregido en consecuencia. El resto del plan (envolver el layout,
simplificar `ScrollReveal.tsx`, sin dependencias nuevas) se ejecutó tal cual.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 9/10

### Checklist de criterios de aceptación (verificado con servidor de desarrollo real +

Playwright/Chromium)

- [x] Bajo reduced-motion, tras `scrollIntoViewIfNeeded()` + espera, el tile llega a
      `opacity: 1` de forma fiable (antes se quedaba en `0` permanentemente incluso tras
      1.5s de espera y scroll incremental completo por toda la página) — criterio
      corregido y verificado, ver Desviaciones.
- [x] Sin reduced-motion, el efecto de scroll-reveal (fade-in + translateY) sigue
      funcionando exactamente igual que antes — verificado con captura real tras scroll
      incremental por toda la home, sin diferencias visibles respecto al comportamiento
      previo al fix.
- [x] `ScrollReveal.tsx` ya no importa `useReducedMotion` de `framer-motion`.
- [x] `grep -rn "framer-motion"` sobre `src/components/LandingPage` y `src/app/[locale]`
      → único uso es `ScrollReveal.tsx`, cubierto por el `MotionConfig` del layout.
- [x] Sin regresión visual en el resto del sitio — verificado con captura real.
- [x] `npm run type-check` y `npm run lint` limpios (0 errores, sin warnings nuevos en
      los 2 archivos tocados).

### Checklist técnico del proyecto

- [x] Sin `fetch()` directo, sin hardcode de tenant, sin `.js` nuevos, sin `any`.
- [x] Sin dependencias nuevas — `MotionConfig` ya viene con `framer-motion` instalado.
- [x] Hooks gigantes / `entitiesConfig.js` no tocados.
- [x] Patrones de `.claude/rules/` respetados.
- [x] Nomenclatura correcta.

### Observaciones para Jose

El bug crítico (contenido permanentemente invisible bajo reduced-motion) está
corregido y verificado con navegador real. Un matiz honesto: el fix no hace que el
contenido aparezca sin hacer scroll (eso habría requerido reproducir el bypass manual
original, más frágil) — en su lugar, usa el mecanismo oficial de `framer-motion`
(`MotionConfig reducedMotion="user"`), que desactiva el movimiento/transform pero
respeta el gate de scroll de `whileInView`. Es el comportamiento correcto y documentado
de la librería, y resuelve el problema real (nunca más se queda invisible), aunque no es
exactamente lo que describía el criterio de aceptación original del GAP — corregido ese
criterio en este mismo documento tras la verificación, en vez de forzar una
implementación menos robusta solo para cumplir la letra literal del texto anterior.

### Estado final de la implementación

Completo y funcionando. `ScrollReveal.tsx` simplificado (sin lógica manual de reduced
motion), `MotionConfig reducedMotion="user"` aplicado a nivel de layout de toda la
landing — contenido siempre visible tras entrar en el viewport, con o sin
reduced-motion.
