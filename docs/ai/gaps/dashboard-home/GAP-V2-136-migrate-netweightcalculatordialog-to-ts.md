---
id: GAP-V2-136
title: Migrar NetWeightCalculatorDialog/index.js a TypeScript (props sin tipar)
module: dashboard-home
category: code-quality
priority: P3
risk: low
size: XS
status: candidate
dependencies: []
target_files:
  - src/components/Warehouse/NetWeightCalculatorDialog/index.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-136 — `NetWeightCalculatorDialog` sigue en `.js` sin tipos

## Problema

`src/components/Warehouse/NetWeightCalculatorDialog/index.js` es un componente `.js` plano,
sin ninguna anotación de tipos:

```js
export default function NetWeightCalculatorDialog({ open, onOpenChange }) {
```

`open`/`onOpenChange` quedan como parámetros implícitos sin tipo (violación TYPESCRIPT: "no
implicit any"), y el archivo en sí es un candidato directo a migración por la regla CLAUDE.md
§3 ("todo código nuevo es `.ts`/`.tsx`; si tocas un `.js` legacy, migrarlo en el mismo commit").

Complejidad de migración: **BAJA** — es un componente de UI puro (formulario local +
`useMemo`), sin dependencias de tipos complejos ni genéricos, un único importador
(`OperarioDashboard/index.tsx:13`).

## Objetivo

`NetWeightCalculatorDialog.tsx` con props tipadas explícitamente (`open: boolean`,
`onOpenChange: (open: boolean) => void`).

## Contexto

Nota: este mismo archivo está señalado también en GAP-V2-150 (domain-business) por una razón
distinta — la fórmula de cálculo (`calcNetWeight`) diverge del cálculo real usado al crear
recepciones/salidas. Ambos GAPs son independientes (uno es tipado/migración, el otro es
corrección de lógica de negocio) y pueden resolverse en cualquier orden, pero si se abordan en
el mismo PR conviene coordinarlos para no pisarse los cambios.

## Solución propuesta

1. Renombrar `index.js` → `index.tsx`.
2. Tipar la interfaz de props:
   ```tsx
   interface NetWeightCalculatorDialogProps {
     open: boolean;
     onOpenChange: (open: boolean) => void;
   }
   ```
3. Tipar `calcNetWeight` y el estado local (`useState<string>`, etc.) según corresponda.
4. Si GAP-V2-150 se resuelve en paralelo, coordinar para que la firma de `calcNetWeight` quede
   alineada con la función unificada que proponga ese GAP.

## Criterios de aceptación

- [ ] `NetWeightCalculatorDialog.tsx` existe (migrado desde `.js`), con props tipadas.
- [ ] El archivo `.js` original no existe.
- [ ] `npm run type-check` y `npm run lint` limpios.
- [ ] La calculadora sigue funcionando igual visualmente (ver GAP-V2-150 para cambios de
      fórmula, fuera del alcance de este GAP).

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: abrir la calculadora desde /operator y probar los inputs (bruto, cajas, tara/caja,
# tara/palet) — el resultado no debe cambiar respecto al comportamiento actual.
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-150 (fórmula de peso neto diverge del cálculo real — mismo archivo,
  razón distinta)
