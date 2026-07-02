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
