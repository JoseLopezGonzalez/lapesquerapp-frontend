---
id: GAP-V2-012
title: parseTaxRate degrada silenciosamente IVA inválido o negativo a 0% sin avisar
module: orders
category: domain-business
priority: P1
risk: medium
size: S
status: done
dependencies: []
target_files:
  - src/hooks/orders/useOrderPlannedDetails.ts
  - src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.tsx
  - src/__tests__/hooks/useOrderPlannedDetails.test.ts
created_at: 2026-07-02
updated_at: 2026-07-02
---

# GAP-V2-012 — `parseTaxRate` degrada silenciosamente IVA inválido o negativo a 0% sin avisar

## Problema

`src/hooks/orders/useOrderPlannedDetails.ts:16-23`:

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

Este parser se usa en `normalizePlannedProductDetail` (línea 43-44) para calcular el
`tax.rate` que se aplica a cada línea planificada de un pedido — el campo que determina qué
IVA se factura al cliente en las líneas de venta de producto pesquero/congelado.

Dos problemas de negocio concretos:

1. **Fallback silencioso a 0% ante cualquier dato roto o ausente.** Si el backend no
   devuelve `tax.rate` (relación no cargada), envía un valor no numérico, o el matching por
   `taxOptions` falla (`matchedTax` no encontrado, línea 42), la línea se factura con **0% de
   IVA** sin ningún error, warning, o indicador visual de que el dato es un fallback y no una
   confirmación real de "exento". En el sector pesquero español, el pescado fresco no
   elaborado tributa al 4% (superreducido) y el producto elaborado/congelado al 10% — nunca
   0% salvo excepciones explícitas (exportación, etc.). Un 0% silencioso en una línea de
   pedido normal es casi con toda seguridad un error de datos, no una decisión de negocio, y
   hoy no hay forma de distinguir ambos casos en la UI.
2. **La regex `/-?\d+(\.\d+)?/` acepta tipos de IVA negativos** (el `-?` inicial) sin
   ninguna validación posterior que los rechace. Un IVA negativo no existe en el dominio
   fiscal español — si ese valor llega a persistirse o a un documento de venta, es un error
   silencioso que debería bloquearse en el momento de la normalización, no propagarse.

## Objetivo

Un tipo de IVA ausente, no numérico, o negativo debe ser detectable — vía error visible,
warning en consola en desarrollo, o un valor sentinela distinto de `0` que la UI pueda
distinguir de un 0% real — en vez de indistinguirse silenciosamente de una línea
correctamente exenta.

## Contexto

Esta normalización alimenta directamente el cálculo de importes de la línea (visible en
`OrderPlannedProductDetails`) y, según el flujo documentado en `useOrderDocuments.ts`, los
documentos de venta exportables (packing list, nota de carga) que llegan al cliente. Un 0%
de IVA no detectado en una línea de pedido real es un riesgo de facturación incorrecta.

## Solución propuesta

1. En `parseTaxRate`, distinguir "sin dato" de "0% válido": devolver `null` (o lanzar/loggear)
   cuando `value == null || value === ''` o cuando el parseo falla, en vez de coercionar a
   `0`.
2. Rechazar valores negativos — clamp a `null`/error, nunca dejarlos pasar como tasa válida.
3. Propagar el caso "sin IVA determinado" hasta la UI de la línea de pedido para que se
   muestre como un estado que requiere corrección manual, no como un `0%` visualmente
   idéntico a una exención real.
4. Mantener soporte explícito para casos legítimos de pedidos con líneas a IVA 0%,
   confirmado por Jose el 2026-07-02. El 0% fiscal válido debe distinguirse del fallback por
   dato ausente/no parseable.

## Criterios de aceptación

- [x] Un `tax.rate` ausente o no parseable ya no se convierte silenciosamente en `0` sin
      ninguna señal distinguible en la UI o en logs.
- [x] Un valor de IVA negativo nunca llega a usarse como tasa aplicada a una línea.
- [x] Los casos legítimos de IVA 0% confirmados por Jose siguen funcionando sin generar
      falsos avisos.

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run -- useOrderPlannedDetails
Verificación manual: crear/editar una línea planificada con un producto cuyo impuesto no
tenga `rate` cargado y confirmar que la UI señala el problema en vez de mostrar 0% sin más.
```

## Notas de implementación

- `parseTaxRate` ahora devuelve `number | null`: conserva `0` como IVA 0% explícito
  válido, pero devuelve `null` para datos ausentes, no parseables, infinitos o negativos.
- Los valores inválidos emiten `console.warn` solo en desarrollo, con motivo (`missing`,
  `not_parseable`, `not_finite`, `negative`) para que el fallback no sea silencioso.
- `normalizePlannedProductDetail` ya no aplica `?? 0` cuando falta `tax.rate` y no existe
  `matchedTax`; el estado queda como `null`.
- `OrderPlannedProductDetails` reutiliza el parser seguro y muestra `IVA pendiente` cuando
  la tasa es `null`, distinguiéndolo de `0%`.
- Se añadieron pruebas para IVA 0% legítimo, dato ausente/no parseable, valores negativos y
  línea con impuesto no matcheado.

## Resultado

Implementado y auditado como `done`.

Validaciones ejecutadas:

```text
npm run test:run -- useOrderPlannedDetails
npm run type-check
npm run lint
npx eslint src/hooks/orders/useOrderPlannedDetails.ts src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.tsx src/__tests__/hooks/useOrderPlannedDetails.test.ts
npm run build
```

Resultado: todas pasan. `npm run lint` conserva warnings existentes del repo (0 errores);
`package.json` emite un warning preexistente por clave duplicada `type-check`.

## Resultado de auditoría

Veredicto `done` por subagente `gap-auditor` el 2026-07-02.

- `parseTaxRate` devuelve `number | null`, mantiene `0` como válido y rechaza ausente/no
  parseable/no finito/negativo.
- Eliminado el fallback silencioso `?? 0` en la normalización.
- La UI muestra `IVA pendiente` para `null` y `0%` para IVA 0% explícito.
- La selección de impuesto inválido/no parseable cae a `null`, no a tasa aplicada numérica.
- Tests focalizados cubren los casos críticos.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- Evidencia: `src/hooks/orders/useOrderPlannedDetails.ts:16-51`
