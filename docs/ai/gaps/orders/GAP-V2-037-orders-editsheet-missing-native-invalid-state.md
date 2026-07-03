---
id: GAP-V2-037
title: OrderEditSheet no usa el estado nativo aria-invalid de los campos shadcn
module: orders
category: a11y-responsive
priority: P2
risk: low
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Admin/OrdersManager/Order/OrderEditSheet/index.tsx
created_at: 2026-07-03
updated_at: 2026-07-03
---

# GAP-V2-037 — OrderEditSheet no usa el estado nativo aria-invalid de los campos shadcn

## Problema

`Input` (`src/components/ui/input.jsx:15`) ya soporta nativamente el estado de error vía atributo
ARIA: `aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20` (y su
variante dark). Este es el mecanismo documentado por shadcn para marcar visual y
semánticamente un campo inválido sin overrides manuales.

`OrderEditSheet/index.tsx` no lo utiliza. En `renderField` (líneas 196-306), `commonProps` para
`Input` no incluye `aria-invalid`, y ni `Select` ni `Combobox` lo reciben tampoco vía sus
`Controller`. En su lugar, el error se marca envolviendo el campo en un `<div>` con
`className={hasError ? 'rounded-md border-red-300' : ''}` (líneas 371 y 404), y el mensaje de
error usa `text-red-500` (línea 375/408) en vez de `text-red-400 text-xs pt-1` documentado en
`.claude/design-context.md` (§ Forms, "Error message style").

Consecuencias concretas:

- Sin `aria-invalid`, un lector de pantalla no anuncia que el campo es inválido — regresión de
  accesibilidad frente al comportamiento nativo que el propio `Input` ya ofrece gratis.
- El borde rojo se aplica al `<div>` contenedor, no al campo real — en `Select`/`Combobox` el
  wrapper no rodea visualmente el control real (el trigger tiene su propio borde), por lo que el
  indicador visual de error es inconsistente entre `Input` (funciona, envuelve el input) y
  `Select`/`Combobox` (el borde del div wrapper no coincide con el borde real del trigger).
- Es un color hardcodeado (`border-red-300`) fuera del patrón documentado, en vez de apoyarse en
  el token `destructive` que el proyecto ya usa en otros componentes (`aria-invalid:border-destructive`).

## Objetivo

Los campos de `OrderEditSheet` deben marcar su estado de error usando el mecanismo nativo
`aria-invalid` de los componentes shadcn del proyecto, igual que el resto de formularios RHF+Zod
documentados en `design-context.md`.

## Contexto

- `CreateOrderForm` (ya `audited` en GAP-V2-006 y superficies previas) no presentaba este patrón
  de wrapper manual — este GAP es específico de `OrderEditSheet`, superficie de "edición" marcada
  `pending` en la cobertura de este módulo.
- El patrón correcto ya existe en el design system del proyecto (`input.jsx`) — no requiere
  inventar nada nuevo, solo conectar `aria-invalid={!!hasError}` en el render de cada tipo de
  campo.

## Solución propuesta

En `renderField` (`OrderEditSheet/index.tsx`):

1. Calcular `hasError` antes de `commonProps` (ya se calcula en el JSX que envuelve cada campo,
   línea 362/397 — mover ese cálculo al propio `renderField` o pasarlo como parámetro).
2. Añadir `aria-invalid={!!hasError}` a `commonProps` para `Input`/`Textarea`.
3. Para `Select`/`Combobox`/`DatePicker` vía `Controller`, pasar `aria-invalid` al componente
   subyacente si lo soporta (verificar props de `SelectTrigger`, `Combobox`, `DatePicker`); si no
   lo soporta nativamente, evaluar añadir el prop en el propio componente `ui/` en vez de seguir
   envolviendo con un `<div>` de color hardcodeado.
4. Eliminar el wrapper `<div className={hasError ? 'rounded-md border-red-300' : ''}>` una vez
   que el estado de error se refleje nativamente en el propio control.
5. Alinear el texto de error a `text-red-400 text-xs pt-1` (patrón documentado) o confirmar con
   Jose si `text-red-500 text-sm` + icono `AlertTriangle` (patrón actual, usado también en otros
   sitios del módulo) debe ser el nuevo estándar documentado — no mezclar ambos sin decisión.

## Criterios de aceptación

- [ ] Los campos con error de validación en `OrderEditSheet` exponen `aria-invalid="true"`.
- [ ] El indicador visual de error usa el token `destructive` vía el propio componente (no un
      `<div>` wrapper con color hardcodeado).
- [ ] El estilo del mensaje de error queda alineado con el patrón documentado en
      `design-context.md`, o el documento se actualiza si Jose confirma un nuevo estándar.
- [ ] No se modifica el comportamiento de validación Zod existente, solo la presentación del error.

## Plan de validación

```text
npm run lint
npm run type-check
Verificación manual: abrir OrderEditSheet, dejar un campo requerido vacío, enviar el formulario
y confirmar (a) borde de error visible en el control real (no en un div contenedor) y
(b) aria-invalid presente en el DOM (DevTools) para el campo afectado.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: ninguno directo — primera vez que se audita la superficie "edición" de este módulo
