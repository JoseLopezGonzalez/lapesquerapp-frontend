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
      `HowItWorks`, `IntegratedLonjas`, `TrustBadge`, `PricingPreview`, `Hero`) muestra su
      contenido con `opacity: 1` desde el primer render — sin esperar scroll, sin quedar
      nunca en `opacity: 0`.
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

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
