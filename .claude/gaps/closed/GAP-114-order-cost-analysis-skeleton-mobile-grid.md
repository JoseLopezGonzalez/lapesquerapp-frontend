# GAP-114 — Skeleton de análisis de costes no colapsa el grid en mobile ni refleja la altura real de las cards

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-02
- **Autor:** Jose (vía `/audit-skeletons orders manager`, hallazgo skeleton-fidelity-auditor)

---

## Contexto y problema

El skeleton de carga inicial de `OrderCostAnalysis/index.jsx:206-222` (introducido en
GAP-048, que corrigió `<Loader>` → `<Skeleton>`) usa un grid fijo:

```jsx
<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
  {Array.from({ length: 4 }).map((_, i) => (
    <Skeleton key={i} className="h-24 w-full rounded-lg" />
  ))}
</div>
```

El grid real de las mismas 4 métricas (línea 447) es:

```jsx
<div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 xl:grid-cols-4'}`}>
```

Es decir, en mobile el contenido real colapsa a **1 columna** (4 cards apiladas a ancho
completo), mientras que el skeleton siempre muestra 2 columnas. Además, cada card real
(`AnalysisMetricCard`) tiene icono + título + valor + detalle secundario + descripción (4
líneas de contenido con distinta jerarquía tipográfica), mientras que el skeleton usa un
bloque plano `h-24` (96px) sin sub-bloques — probablemente más bajo y sin jerarquía respecto
a la card real.

Detectado en `/audit-skeletons orders manager` (HEURISTIC sub-mode — sin captura visual,
comparación de código fuente). GAP-048 ya corrigió la ausencia de `Skeleton` (era `<Loader>`);
este GAP corrige la fidelidad del `Skeleton` ya existente, no su presencia.

## Solución acordada

1. Aplicar la misma regla responsive que el contenido real al grid del skeleton:
   `` `grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 xl:grid-cols-4'}` ``.
2. Sustituir el bloque plano `h-24` por un placeholder con jerarquía interna que se aproxime a
   `AnalysisMetricCard` (p.ej. icono pequeño + línea de título corta + línea de valor más
   ancha/alta + línea de detalle), manteniendo una altura total mayor que 96px si al medir
   `AnalysisMetricCard` renderizado resulta más alto (verificar en el propio componente,
   `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/` — buscar `AnalysisMetricCard`).

## Referencias e inspiración

- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx:447-486` — grid real y contenido de `AnalysisMetricCard`
- GAP-048 (closed) — introdujo este skeleton corrigiendo `<Loader>` → `<Skeleton>`, sin cubrir el colapso mobile ni la jerarquía interna de la card

## Skeleton Reference

- **Real component:** `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx:447-486` (`AnalysisMetricCard` × 4, grid `isMobile ? grid-cols-1 : grid-cols-2 xl:grid-cols-4`)
- **Skeleton component:** `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx:206-222`
- **Viewport afectado:** mobile (grid no colapsa); ambos (altura/jerarquía del bloque de card)
- **Medidas capturadas (heurístico):** skeleton actual `h-24` (96px) plano; `AnalysisMetricCard` real tiene 4 líneas de contenido (icono+título, valor, detalle, descripción) — probable altura real mayor, a confirmar visualmente cuando SCREENSHOT esté disponible

## Criterios de aceptación

- [ ] El grid de 4 cards del skeleton colapsa a `grid-cols-1` en mobile, igual que el contenido real
- [ ] En desktop, el grid mantiene `grid-cols-2 xl:grid-cols-4`
- [ ] Cada card del skeleton tiene al menos 2 sub-bloques de distinta altura (no un único rectángulo plano), reflejando la jerarquía título/valor/detalle de `AnalysisMetricCard`
- [ ] No se modifica la lógica de `costAnalysisLoading`/`costAnalysisError`

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx`

## Restricciones

- No tocar `AnalysisMetricCard` ni la lógica de cálculo de métricas — solo el bloque de skeleton
- No modificar el skeleton de la tabla inferior (`h-8 w-48` + 5× `h-10`) salvo que al revisar `AnalysisMetricCard` se detecte que también necesita ajuste — si es así, avisar antes de tocarlo (fuera del scope original de este GAP)

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx`:
  - El grid del skeleton de 4 métricas pasa de `grid-cols-2 gap-3 xl:grid-cols-4` (fijo) a `` `gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 xl:grid-cols-4'}` ``, igual que el grid real (línea 447).
  - Cada bloque plano `Skeleton className="h-24 w-full rounded-lg"` se sustituye por un nuevo sub-componente `AnalysisMetricCardSkeleton`, con la misma silueta que `AnalysisMetricCard`: `CardHeader` (título + icono) + `CardContent` (valor grande, detalle, descripción) — 4 sub-bloques de alturas distintas (`h-4`, `h-7`, `h-3`, `h-3.5`).

### Decisiones tomadas durante la implementación

- No se tocó el skeleton de la tabla inferior (`h-8 w-48` + 5× `h-10`) — no se detectó necesidad de ajustarlo al revisar `AnalysisMetricCard`, tal como indicaba la restricción del GAP.
- `AnalysisMetricCardSkeleton` se definió justo debajo de `AnalysisMetricCard` en el mismo archivo, siguiendo el patrón de sub-componentes locales colocados junto al componente que representan.
- No se verificó la altura real renderizada de `AnalysisMetricCard` con captura visual (no disponible en este entorno); el skeleton usa la misma estructura de bloques (título+icono, valor, detalle, descripción) en vez de una medida en px exacta, conforme a que el GAP no exige fidelidad pixel-perfect.

### Desviaciones del plan (si las hay)

Ninguna.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 9/10

### Checklist

**Criterios de aceptación del GAP:**

- [x] El grid de 4 cards del skeleton colapsa a `grid-cols-1` en mobile, igual que el contenido real — CUMPLIDO. `index.jsx:228` usa exactamente la misma expresión que el grid real (`index.jsx:466`): `` `grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 xl:grid-cols-4'}` ``.
- [x] En desktop, el grid mantiene `grid-cols-2 xl:grid-cols-4` — CUMPLIDO, misma expresión.
- [x] Cada card del skeleton tiene al menos 2 sub-bloques de distinta altura — CUMPLIDO y superado: `AnalysisMetricCardSkeleton` tiene 4 sub-bloques (`h-4 w-20` título, `h-4 w-4` icono, `h-7 w-24` valor, `h-3 w-16` detalle, `h-3.5 w-32` descripción), reflejando fielmente la jerarquía título+icono/valor/detalle/descripción de `AnalysisMetricCard`.
- [x] No se modifica la lógica de `costAnalysisLoading`/`costAnalysisError` — CUMPLIDO, verificado por diff línea a línea: ambas ramas (`index.jsx:225`, `:243`) intactas.

**Checklist técnico del proyecto:**

- [x] Sin fetch() directo — N/A, no hay HTTP en este cambio
- [x] Sin hardcode de tenant — N/A
- [x] Sin archivos .js nuevos — no se creó ningún archivo, solo se editó el `.jsx` existente
- [x] Sin `any` sin justificación — N/A, archivo JSX sin tipado TS
- [x] Hooks gigantes no tocados — N/A
- [x] entitiesConfig.js no tocado — confirmado
- [x] Patrones de `.claude/rules/components.md` respetados — sub-componente local (`AnalysisMetricCardSkeleton`) colocado junto al componente que representa, consistente con el patrón de `AnalysisMetricCard`/`ProductLineMobileCard`/`PalletMobileCard` ya existentes en el mismo archivo
- [x] Nomenclatura correcta — `AnalysisMetricCardSkeleton` sigue PascalCase y el sufijo `Skeleton` usado en el resto del proyecto (`OrderEditFormSkeleton`, etc., ver PL-027)

**Restricciones del GAP:**

- [x] No se tocó `AnalysisMetricCard` (líneas 39-63 intactas en el diff)
- [x] No se tocó el skeleton de la tabla inferior (`h-8 w-48` + 5× `h-10`, líneas 233-238 intactas)

**Verificación de build:**

- `npm run type-check` → limpio, exit 0, sin errores.
- `npm run lint` → 0 errores, 271 warnings preexistentes en archivos no relacionados (`useStore.ts`, `useStorePositions.ts`, etc.); ningún warning en `OrderCostAnalysis/index.jsx`.

### Revisión Visual

- [x] Color: solo `Skeleton` (tono `bg-muted`/animate-pulse del propio primitivo shadcn) — sin hex/rgb hardcodeados
- [x] Layout: estructura `Card` > `CardHeader` + `CardContent` replicada 1:1 respecto a `AnalysisMetricCard`
- [x] Componentes: reutiliza `Card`, `CardHeader`, `CardContent`, `Skeleton` de `@/components/ui/` — sin sustituciones
- [x] Paridad con referencia: grid responsive idéntico al real; jerarquía de alturas coherente
- [x] Mobile: usa `isMobile` (de `useIsMobile`, ya presente en el componente) para ramificar el grid — consistente con PL-027
- [x] Sin inline styles ni colores hardcodeados

**Veredicto visual:** ✅ APROBADO

Nota menor no bloqueante: `AnalysisMetricCardSkeleton` usa `CardContent className="space-y-1.5"` mientras que `AnalysisMetricCard` real usa `space-y-1` (diferencia de 2px en el gap vertical). No afecta a los criterios de aceptación del GAP (que no exige fidelidad pixel-perfect, ver "Decisiones tomadas" del propio GAP) ni es perceptible como ruptura visual.

### Revisión UX — Light

```
UX REVIEW — LIGHT
═════════════════
GAP: GAP-114 — Skeleton de análisis de costes, colapso mobile + jerarquía interna
Mode: Light (fix de fidelidad de un único elemento de loading state)

[x] El cambio es autoexplicativo para el usuario — el skeleton es un estado transitorio, no requiere instrucción
[x] No introduce una decisión nueva del usuario
[x] Consistente con la UI circundante — incluso mejora la consistencia respecto al estado anterior
[x] No aplica hover/focus/active — es un placeholder no interactivo
[x] No hay cambio de texto

VERDICT: ✅ APROBADO
```

### System Learner check

No se invoca al `system-learner`. El hallazgo que originó este GAP ya está registrado como PL-027 (patrón recurrente de skeletons sin rama `isMobile` en Orders Manager) y este GAP es exactamente uno de los 4 follow-ups (GAP-111 a GAP-114) ya previstos en esa entrada. No hay patrón nuevo ni corrección no cubierta por checklists existentes.

### Observaciones para Jose

Implementación limpia y ceñida exactamente al scope del GAP. El diff toca solo lo necesario: añade `AnalysisMetricCardSkeleton` (15 líneas) y cambia 2 líneas en el bloque de loading. La fórmula del grid responsive es una copia literal de la del contenido real, lo que garantiza que ambos se mantendrán sincronizados si algún día cambia el breakpoint. Resto en 1 punto solo por la diferencia cosmética `space-y-1.5` vs `space-y-1` frente a `AnalysisMetricCard` — no bloquea, y el propio GAP ya documentó que no se buscaba fidelidad pixel-perfect al no haber captura visual disponible en este entorno.

### Estado final de la implementación

`OrderCostAnalysis/index.jsx` ahora tiene un skeleton de carga inicial (`costAnalysisLoading && !costAnalysis`) que replica correctamente: (1) el colapso a 1 columna en mobile vía la misma expresión `isMobile` que el grid real, y (2) la jerarquía interna de `AnalysisMetricCard` mediante el nuevo sub-componente `AnalysisMetricCardSkeleton` (título+icono en `CardHeader`, valor/detalle/descripción en `CardContent`, 4 alturas distintas). El skeleton de la tabla inferior y `AnalysisMetricCard` permanecen sin cambios, conforme a las restricciones del GAP. `type-check` y `lint` limpios.
