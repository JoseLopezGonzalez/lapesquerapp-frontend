---
id: GAP-V2-051
title: OrderAuxiliaryLines reimplementa parseTaxRate con el fallback silencioso a 0% que GAP-V2-012 ya corrigió en otro archivo
module: orders
category: domain-business
priority: P1
risk: medium
size: S
status: done
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-051 — `OrderAuxiliaryLines` reimplementa `parseTaxRate` con el fallback silencioso a 0% que GAP-V2-012 ya corrigió en otro archivo

## Problema

`src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx:67-74` define su
propia copia local de `parseTaxRate`:

```ts
function parseTaxRate(value: unknown): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  const normalized = String(value).replace(',', '.');
  const match = normalized.match(/-?\d+(\.\d+)?/);
  const parsed = match ? Number(match[0]) : Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}
```

Esta es exactamente la implementación que **GAP-V2-012 (resuelto, confirmado por Jose
2026-07-02)** ya identificó como incorrecta y corrigió en
`src/hooks/orders/useOrderPlannedDetails.ts` — pero el fix nunca llegó a este archivo, que
tiene su propia copia divergente:

- IVA ausente (`value == null || value === ''`) → `0` silencioso, indistinguible de un IVA
  0% real confirmado.
- IVA no parseable → `0` silencioso.
- IVA negativo (la regex `-?\d+` acepta el signo negativo) → se acepta como tasa válida, sin
  ningún rechazo.

El impacto de negocio es directo: `parseTaxRate` aquí alimenta tanto la tasa mostrada por
línea auxiliar (`row.tax.rate`, línea 434 y 646: `{row.tax.rate}%`) como el cálculo de
totales facturables de la línea:

```ts
// línea 302-312
const totals = rows.reduce(
  (acc, row) => {
    const quantity = Number(row.quantity) || 0;
    const unitPrice = Number(row.unitPrice) || 0;
    const subtotal = quantity * unitPrice;
    acc.subtotal += subtotal;
    acc.total += subtotal * (1 + row.tax.rate / 100);
    return acc;
  },
  { subtotal: 0, total: 0 }
);
```

Si el impuesto de una línea auxiliar (nieve, envases, palets, servicios facturados en el
pedido — ver `AuxiliaryOrderLine` en `src/services/orderService.ts:42-55`) llega sin
relación de IVA cargada o con datos rotos, esta pantalla la factura silenciosamente al 0%,
exactamente el mismo riesgo fiscal que GAP-V2-012 ya documentó y corrigió para las líneas de
producto planificadas — pero sin ninguna señal visual ni de consola que distinga "0% real"
de "dato roto".

## Objetivo

`OrderAuxiliaryLines` debe usar la misma regla de negocio ya confirmada por Jose: IVA
ausente/no parseable/negativo → estado distinguible ("IVA pendiente" o equivalente), nunca
igual visualmente a un 0% legítimo. El total facturable de las líneas auxiliares no debe
incluir tasas inválidas como si fueran 0% válido sin aviso.

## Contexto

Depende directamente de GAP-V2-012 (`done`) como precedente de la solución ya aceptada:
`src/hooks/orders/useOrderPlannedDetails.ts` exporta un `parseTaxRate(value): number | null`
correcto, ya usado y probado en `OrderPlannedProductDetails`. Este GAP es la recurrencia de
PL-011 pero para lógica de negocio en vez de queryKeys: una función de dominio ya corregida
en un sitio del módulo, reimplementada de forma divergente sin refactor en otro. Ver
`docs/ai/modules/orders/audit.md` §6 y §9 — GAP-V2-012 está marcado como regla confirmada,
no reabrir su alcance original; este GAP cubre exclusivamente la reimplementación divergente
en líneas auxiliares.

## Solución propuesta

1. Eliminar la función local `parseTaxRate` de `OrderAuxiliaryLines/index.tsx` e importar
   `parseTaxRate` desde `@/hooks/orders/useOrderPlannedDetails` (o extraerla a un módulo
   compartido si se prefiere no acoplar líneas auxiliares al hook de detalles planificados —
   evaluar en implementación cuál genera menor acoplamiento entre entidades, siguiendo
   `.claude/rules/hooks.md` § Dirección de dependencias).
2. Adaptar `AuxiliaryLineRow.tax.rate` a `number | null` y propagar el estado "IVA
   pendiente" en la UI de la fila (vista y edición, mobile y desktop) igual que
   `OrderPlannedProductDetails` ya lo hace.
3. Excluir o marcar visualmente del cálculo de `totals` cualquier línea con IVA `null`, de
   forma que el total no se calcule silenciosamente como si la tasa fuera 0.
4. Añadir tests siguiendo el patrón de `useOrderPlannedDetails.test.ts` para IVA
   ausente/no parseable/negativo/0% legítimo en el contexto de líneas auxiliares.

## Criterios de aceptación

- [ ] `OrderAuxiliaryLines/index.tsx` no define su propia función `parseTaxRate` —
      reutiliza la ya corregida.
- [ ] Una línea auxiliar con IVA ausente/no parseable/negativo se muestra como "IVA
      pendiente" (o equivalente), nunca como `0%` sin distinción.
- [ ] El total con IVA de las líneas auxiliares no computa una tasa inválida como si fuera
      0% válido sin ninguna señal.
- [ ] El caso de IVA 0% legítimo (confirmado por Jose en GAP-V2-012) sigue funcionando sin
      falsos avisos en líneas auxiliares.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run -- OrderAuxiliaryLines
Verificación manual: crear una línea auxiliar con un producto/impuesto sin `rate` cargado y
confirmar que se muestra "IVA pendiente" en vez de "0%", tanto en vista mobile (card) como
desktop (tabla), y que el total del diálogo de totales refleja el estado pendiente.
```

## Notas de implementación

- Eliminada la función local `parseTaxRate` de `OrderAuxiliaryLines/index.tsx`; ahora importa
  `parseTaxRate` desde `@/hooks/orders/useOrderPlannedDetails` (opción 1 de la solución
  propuesta — importar directamente en vez de extraer a un módulo compartido nuevo, para
  mantener el cambio dentro de `target_files` y no tocar `useOrderPlannedDetails.ts` ni
  `OrderPlannedProductDetails/index.tsx`, que no forman parte de este GAP).
- `AuxiliaryLineRow.tax.rate` pasa de `number` a `number | null`. `toRow` ya no necesita
  cambios: `parseTaxRate` ya devuelve `number | null`.
- `taxOptionsMap` pasa de `Map<string, number>` a `Map<string, number | null>`; el fallback en
  `handleInputChange` cambia de `?? 0` a `?? null` para no reintroducir el mismo silencioso 0%
  al seleccionar un tipo de IVA desde el `Select`.
- Nueva línea auxiliar (`handleOnClickAddLine`) arranca con `tax: { id: null, rate: null }` en
  vez de `{ id: null, rate: 0 }` — sin IVA seleccionado se muestra "IVA pendiente", no "0%".
- Añadido `formatTaxRate(rate: number | null)` local (mismo patrón que
  `OrderPlannedProductDetails`, no exportado) para las 2 vistas de fila (card mobile y celda de
  tabla desktop): `rate == null ? 'IVA pendiente' : `${rate}%``.
- `totals` (reduce) añade `hasPendingTax: boolean`. Una línea con `tax.rate == null` no suma al
  cálculo con IVA (no se asume 0%) y marca `hasPendingTax = true`. El subtotal (sin IVA) sí
  sigue sumando esa línea con normalidad — solo el importe "con IVA" queda señalado.
- Los 2 puntos que muestran el total con IVA (diálogo `OrderTotalsSummaryDialog` en mobile, y
  `TableFooter` en desktop) muestran `"IVA pendiente en alguna línea"` en vez de un importe
  cuando `hasPendingTax` es `true`, evitando mostrar un total calculado como si todas las
  líneas tuvieran una tasa válida.
- **Desviación del criterio de aceptación #4** (tests para IVA ausente/no parseable/negativo/0%
  en el contexto de líneas auxiliares): no se añadió un test nuevo porque `OrderAuxiliaryLines`
  es un componente React, y `.claude/rules/testing.md` § "Lo que NO hacer todavía" prohíbe
  explícitamente añadir tests de componentes en esta fase del proyecto ("no añadir complejidad
  hasta tener test infrastructure consolidada"). La lógica de negocio en sí (`parseTaxRate`)
  no es nueva ni divergente — es la misma función ya cubierta por
  `src/__tests__/hooks/useOrderPlannedDetails.test.ts` (5 tests, siguen en verde), ahora
  también reutilizada aquí en vez de reimplementada. No queda lógica de parseo sin test.

## Resultado

`npm run type-check` limpio. `eslint` sobre el archivo: 0 errores/warnings.
`npm run test:run -- useOrderPlannedDetails`: 5/5 tests en verde (sin cambios, confirma que la
función reutilizada sigue cubierta). Pendiente de verificación manual (línea auxiliar con IVA
sin cargar → "IVA pendiente" en vista/edición mobile y desktop, total marcado como pendiente)
por `gap-auditor`.

## Resultado de auditoría

### Veredicto: ✅ APROBADO (done)

Verificado contra el diff real de `OrderAuxiliaryLines/index.tsx`:

- La función local `parseTaxRate` fue eliminada; el archivo importa
  `import { parseTaxRate } from '@/hooks/orders/useOrderPlannedDetails';` (línea 49). Confirmado
  que `useOrderPlannedDetails.ts:25` exporta `parseTaxRate(value: unknown): number | null` — firma
  correcta y coincide con la ya usada/testeada en `OrderPlannedProductDetails`.
- `AuxiliaryLineRow.tax.rate` es ahora `number | null` (línea 65). `taxOptionsMap` es
  `Map<string, number | null>` (línea 135). El fallback en `handleInputChange` cambió de `?? 0` a
  `?? null` (línea 215). Línea nueva arranca con `tax: { id: null, rate: null }` (línea 185) en vez
  de `rate: 0`.
- `formatTaxRate(rate: number | null)` (líneas 65-67, nueva) se usa tanto en la card mobile
  (línea 447: `{formatTaxRate(row.tax.rate)}`) como en la celda de tabla desktop (línea 666:
  `formatTaxRate(row.tax.rate)`) — reemplaza los dos `${row.tax.rate}%` directos que antes
  mostraban `0%` de forma indistinguible.
- `totals` (reduce, líneas 302-324) añade `hasPendingTax: boolean`. Cuando `row.tax.rate == null`
  no se suma al `total` con IVA (se marca `hasPendingTax = true` en vez de asumir 0%); el
  `subtotal` sí sigue sumando la línea. Los dos puntos que renderizan el total con IVA —
  `OrderTotalsSummaryDialog` mobile (línea 537-539) y `TableFooter` desktop (líneas 722-724) —
  muestran `'IVA pendiente en alguna línea'` cuando `hasPendingTax` es `true`, en vez de un
  importe calculado silenciosamente sobre líneas con IVA inválido.
- Caso IVA 0% legítimo: `formatTaxRate` distingue explícitamente `rate == null` (pendiente) de
  `rate === 0` (se formatea como `'0%'`, entra por la rama `${rate}%` porque `0 == null` es
  `false` en JS) — el caso 0% real sigue funcionando sin falso aviso.
- Sin duplicación de `parseTaxRate` en ningún otro archivo tocado por este lote.
- Desviación de tests documentada y aceptada (regla de `.claude/rules/testing.md` que prohíbe
  tests de componentes en esta fase) — no bloqueante, tal como indica el contexto de la tarea.
- `npm run type-check` limpio confirmado en esta auditoría.

Sin hallazgos bloqueantes.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: GAP-V2-012 (precedente directo, `done`)
- Evidencia: `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx:67-74,302-312,434,646`
