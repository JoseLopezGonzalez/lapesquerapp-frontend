---
id: GAP-V2-116
title: "NetWeightCalculatorDialog: Label \"Cajas\" no está asociado al input vía htmlFor/id"
module: dashboard-home
category: a11y-responsive
priority: P2
risk: low
size: XS
status: candidate
dependencies: []
target_files:
  - src/components/Warehouse/NetWeightCalculatorDialog/index.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-116 — Label "Cajas" sin `htmlFor`, input sin `id`

## Problema

En `NetWeightCalculatorDialog/index.js:93-115`, el campo "Cajas" usa un
`<Label>` sin `htmlFor` y el `<Input>` correspondiente no tiene `id`:

```jsx
<Label className="text-lg">Cajas</Label>
<div className="flex items-center gap-3">
  <Button ... aria-label="Menos cajas">−</Button>
  <Input
    type="number"
    min="0"
    className="..."
    value={boxes}
    onChange={...}
  />
  <Button ... aria-label="Más cajas">+</Button>
</div>
```

Todos los demás campos del diálogo (`calc-gross`, `calc-tare-box`,
`calc-tare-pallet`) sí tienen `id` + `Label htmlFor` correctamente asociados.
Este es el único campo del formulario que rompe el checklist de a11y del
proyecto ("Validar correctamente los estados `data-invalid`... etiquetas
asociadas a inputs").

## Objetivo

El input numérico de "Cajas" debe tener un `id` explícito y el `Label` debe
referenciarlo vía `htmlFor`, igual que el resto de campos del diálogo.

## Contexto

Los botones +/- ya tienen `aria-label` correcto ("Menos cajas"/"Más cajas"),
solo falta la asociación del `Label` con el `Input` central.

## Solución propuesta

```jsx
<Label htmlFor="calc-boxes" className="text-lg">Cajas</Label>
...
<Input
  id="calc-boxes"
  type="number"
  min="0"
  ...
/>
```

## Criterios de aceptación

- [ ] `Label` de "Cajas" tiene `htmlFor="calc-boxes"`.
- [ ] `Input` de cajas tiene `id="calc-boxes"`.
- [ ] `npm run lint` limpio.

## Plan de validación

```text
npm run lint
# Manual: verificar con lector de pantalla (o axe devtools) que "Cajas" se
# anuncia correctamente al enfocar el input.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: ninguno
