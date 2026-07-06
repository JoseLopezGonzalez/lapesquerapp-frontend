---
id: GAP-V2-153
title: OperarioDashboard no muestra ningún snapshot de stock actual del almacén asignado
module: dashboard-home
category: domain-business
priority: P3
risk: low
size: M
status: candidate
dependencies:
  - GAP-V2-151
target_files:
  - src/components/Warehouse/OperarioDashboard/index.tsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-153 — Falta un vistazo de stock actual del almacén en el panel operario

## Problema

`OperarioDashboard` recibe `storeId` (el almacén asignado al operario) desde sus 3 puntos de
entrada, pero el panel solo muestra 4 tarjetas de contexto genérico (hora, fecha, día,
calculadora — `OperarioDashboard/index.tsx:93-156`) y dos listados acotados a **hoy**
(recepciones y salidas de cebo del día). En ningún punto del panel aparece una foto del estado
actual del almacén: cuánto stock hay ahora mismo, cuántos palets, etc.

Ya existe precedente de este tipo de dato en la app — `useStockStats.ts` y el `StoreCard` de
`src/components/Admin/Stores/StoresManager/StoreCard` construyen vistas de stock por almacén
para Admin/Dirección — pero el operario, que trabaja físicamente en ese almacén y consulta
este panel muchas veces al día, no tiene ningún atajo a "qué hay ahora mismo en mi almacén".
Esto es una fricción operativa real: el operario que necesita saber el stock disponible antes
de una salida tiene que navegar fuera del dashboard a otra pantalla (si existe) en vez de
verlo de un vistazo en el panel que ya está diseñado para su turno de trabajo diario.

## Objetivo

El operario ve, sin salir de su panel, un resumen del stock actual de su almacén asignado
(p. ej. total kg en stock, nº de palets, o el desglose que el negocio considere más útil para
la operativa diaria de almacén).

## Contexto

Depende de que `storeId` filtre correctamente los datos del almacén (GAP-V2-151) — sin ese
filtro, cualquier resumen de stock añadido aquí heredaría el mismo problema de mezclar datos
de varios almacenes.

**Pregunta para Jose:** qué métrica de stock es la más útil para el operario en este punto
concreto del flujo — ¿total kg en stock?, ¿nº de palets disponibles?, ¿desglose por
especie/formato? — antes de diseñar la tarjeta, para no adivinar una métrica que en la
práctica el operario no usa.

## Solución propuesta

Añadir una tarjeta (o extender el grid de 4 tarjetas superiores) con un resumen de stock del
almacén, reutilizando `useStockStats` (o el service subyacente) filtrado por `storeId`, tras
resolver GAP-V2-151.

## Criterios de aceptación

- [ ] El panel operario muestra al menos una métrica de stock actual del almacén asignado.
- [ ] La métrica mostrada está confirmada por Jose como la más relevante para la operativa
      diaria del almacén (no una suposición del agente).

## Plan de validación

```text
npm run type-check
npm run lint
Verificación manual con un almacén con stock conocido, para confirmar que el número mostrado
coincide con el stock real de ese almacén.
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
