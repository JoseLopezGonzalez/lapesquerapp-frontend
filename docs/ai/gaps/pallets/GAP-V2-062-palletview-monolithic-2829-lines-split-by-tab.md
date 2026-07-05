---
id: GAP-V2-062
title: PalletView/index.tsx has grown to 2829 lines — split into tab sub-components mirroring MobilePalletView
module: pallets
category: architecture-refactor
priority: P2
risk: high
size: XL
status: ready
dependencies:
  - GAP-V2-058
target_files:
  - src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
normalized_at: 2026-07-05
---

# GAP-V2-062 — `PalletView/index.tsx` monolítico (2829 líneas) sin dividir por pestaña

## Problema

`src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx` era el archivo
señalado en PL-016/PL-BUILD-05 (15 deployments ERROR al quitar `@ts-nocheck` en
GAP-039, cuando medía ~1100 líneas). Verificado en esta auditoría: **ya no tiene
`@ts-nocheck`** (correcto, resuelto), pero el archivo ha más que duplicado su
tamaño desde entonces — **2829 líneas** — sin ninguna división estructural nueva.

El componente concentra en un único archivo:

- 6 pestañas principales (`Tabs value={mainTab}`, línea 626 en adelante):
  Edición, Acciones masivas, Resumen, Etiqueta, Cajas/Etiquetas (`BoxesLabels`),
  Imágenes, Historial.
- Dentro de "Edición": sub-pestañas para 5 métodos de alta de caja (lector,
  manual, masiva, promedio, códigos — línea ~682 en adelante) y sub-pestañas de
  filtro de listado de cajas (disponibles/producción/todas — línea ~1445).
- 15+ `useState` locales, 16+ handlers, llamadas a servicio directas (ver
  GAP-V2-065).

Esto contrasta con el patrón ya establecido y correcto en el mismo módulo:
`MobilePalletView/index.tsx` (427 líneas) divide exactamente el mismo dominio de
datos en archivos dedicados por pantalla —
`HubScreen.tsx`, `AddManualScreen.tsx`, `TaraScreen.tsx`,
`ObservacionesScreen.tsx`, `PedidoScreen.tsx`, `BoxesTab.tsx`, `ResumenTab.tsx`,
`ImagenesTab.tsx`, `EliminarTab.tsx`, `HistorialTab.tsx` — cada uno entre 50 y 340
líneas. La versión desktop del mismo editor no sigue ese patrón pese a resolver
exactamente el mismo problema de dominio.

Un archivo de este tamaño es alto riesgo de repetir PL-BUILD-05 (cascada de
errores de TypeScript difíciles de aislar) en cualquier cambio futuro, y dificulta
la revisión de código y el testing dirigido.

## Objetivo

`PalletView/index.tsx` pasa a ser un orquestador delgado (Tabs + estado
compartido mínimo) que delega el contenido de cada pestaña principal a un
sub-componente propio en `PalletDialog/PalletView/tabs/` (o similar), replicando
la estructura ya usada por `MobilePalletView`.

## Contexto

Ver PL-016 y PL-BUILD-05 en `.claude/project-learnings.md`. Este GAP no repite el
trabajo de GAP-039 (que era solo quitar `@ts-nocheck`); aborda el crecimiento
posterior no controlado del mismo archivo.

## Solución propuesta

Dividir por pestaña principal, en este orden sugerido (de menor a mayor
acoplamiento con el estado compartido):

1. `SummaryPieChart`/Resumen ya está extraído — extraer el contenedor de la
   pestaña "Resumen" completo a un archivo propio.
2. Extraer la pestaña "Etiqueta" (impresión) a su propio componente.
3. Extraer "Acciones masivas" (bulk edit de cajas) a su propio componente —
   depende de `editPallet.bulkEdit`, ya expuesto por el hook.
4. Extraer "Edición" (alta de cajas + listado) — el más grande, dividir a su vez
   por sub-pestaña de método de alta (lector/manual/masiva/promedio/códigos),
   similar a como `MobilePalletView` ya separa `AddManualScreen`.
5. `BoxesLabels`, `PalletImagesTab`, `PalletTimeline` ya están extraídos — no
   requieren cambios adicionales.

Este GAP depende de GAP-V2-058 (migración de `usePallet` a TanStack Query) para
evitar dividir el componente dos veces si el hook cambia de forma en paralelo.

## Criterios de aceptación

- [ ] `PalletView/index.tsx` queda por debajo de ~400-500 líneas tras la división.
- [ ] Cada pestaña principal vive en su propio archivo bajo
      `PalletDialog/PalletView/tabs/` (o ubicación equivalente acordada).
- [ ] Sin regresión funcional en ninguna pestaña (edición, acciones masivas,
      resumen, etiqueta, cajas/etiquetas, imágenes, historial).
- [ ] Ningún sub-componente nuevo introduce `@ts-nocheck`.

## Plan de validación

```text
npm run type-check
npm run lint
npm run build
npm run test:run
# Manual: recorrer las 6 pestañas principales y sus sub-flujos en desktop.
```

## Notas de implementación

Dado el tamaño (XL) y el historial de PL-BUILD-05, este GAP debe implementarse
como PR aislado, sin mezclar con otros GAPs del módulo, y con lectura completa
símbolo por símbolo antes del primer push (protocolo reforzado de CLAUDE.md
§ "Eliminar @ts-nocheck de un archivo grande").

**Normalización (gap-normalizer, 2026-07-05):** marcado `blocked` por dos motivos
independientes: (1) `size: XL` no puede marcarse `ready` sin autorización
explícita de Jose (regla dura de `gap-normalizer.md`); (2) depende
funcionalmente de GAP-V2-058, que a su vez está `blocked` por la misma razón de
tamaño (L). GAP-V2-065 depende de este GAP y hereda el mismo bloqueo en cascada.

**Decisión de Jose (2026-07-05):** autorizado. Implementar después de
GAP-V2-058 (dependencia real, no solo de tamaño) — PR aislado, sin mezclar con
otros GAPs, lectura completa símbolo por símbolo antes del primer push.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-039 (eliminación previa de `@ts-nocheck` en este mismo
  archivo), GAP-V2-058, GAP-V2-065
