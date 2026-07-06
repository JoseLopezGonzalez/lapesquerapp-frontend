---
id: GAP-V2-056
title: "El `ToggleGroup` de Tipo/Resultado en `QuickInteractionModal` no expone su estado seleccionado a lectores de pantalla"
module: dashboard-home
category: a11y-responsive
priority: P2
risk: low
size: XS
status: candidate
dependencies: []
target_files:
  - src/components/Comercial/CRM/QuickInteractionModal.tsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-056 — Selección de una sola opción sin semántica accesible en `QuickInteractionModal`

## Problema

`QuickInteractionModal.tsx:36-52` define un `ToggleGroup` local que renderiza un grupo
de `<Button>` de selección única (Tipo: Llamada/Email/WhatsApp/Visita/Otro; Resultado:
Interesado/Sin respuesta/etc.):

```tsx
function ToggleGroup({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={value === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
```

El único indicador de "seleccionado" es visual (variante `default` vs `outline`). No
hay `role="radiogroup"`/`role="radio"` con `aria-checked`, ni `aria-pressed` en cada
botón, ni el contenedor tiene ningún `aria-label` que indique de qué grupo se trata.
Un usuario de lector de pantalla que recorra estos botones con Tab solo oirá "Llamada,
botón" / "Email, botón" — sin saber cuál está actualmente seleccionado ni que forman
un grupo de selección única. Este componente se usa dos veces en el mismo diálogo
(campo "Tipo" y campo "Resultado"), ambos invocados en el flujo de "Cerrar tarea" /
"Registrar seguimiento" que se abre directamente desde el dashboard Comercial
(`ComercialDashboard/index.js:655-665`).

## Objetivo

El estado seleccionado de cada opción debe ser perceptible para tecnología de
asistencia, no solo visualmente.

## Solución propuesta

Añadir `aria-pressed={value === option.value}` a cada `Button` del `ToggleGroup`
(patrón mínimo, sin cambiar el DOM ni el comportamiento visual), y opcionalmente
envolver el grupo en un `div role="group" aria-label="Tipo"` /
`aria-label="Resultado"` pasado como prop desde cada uso del componente.

## Criterios de aceptación

- [ ] Cada botón del `ToggleGroup` expone `aria-pressed` reflejando si está
      seleccionado.
- [ ] El contenedor del grupo tiene un `aria-label` descriptivo del campo que
      representa (Tipo / Resultado).
- [ ] Verificado con un lector de pantalla (o axe DevTools) que el estado
      seleccionado se anuncia correctamente.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: recorrer el diálogo "Registrar seguimiento" con lector de pantalla (o
# revisar con axe DevTools) y confirmar que se anuncia el estado seleccionado de
# Tipo y Resultado.
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
