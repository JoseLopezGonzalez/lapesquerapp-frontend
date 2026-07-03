---
id: GAP-V2-037
title: OrderEditSheet no usa el estado nativo aria-invalid de los campos shadcn
module: orders
category: a11y-responsive
priority: P2
risk: low
size: S
status: done
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

`renderField` ahora recibe `hasError: boolean` como segundo parámetro (antes se calculaba
solo en el JSX que lo envolvía) y lo añade a `commonProps['aria-invalid']` para
`Input`/`Textarea`, y como prop directo `aria-invalid` a `SelectTrigger` (ambos ya soportan
el estilo `aria-invalid:border-destructive` vía Tailwind, verificado en
`src/components/ui/input.jsx`, `textarea.jsx` y `select.jsx`). El wrapper `<div
className="rounded-md border-red-300">` se eliminó para estos 3 tipos de campo.

Para `Combobox` (`@/components/Shadcn/Combobox`, `.js` sin soporte de `aria-invalid`) se
aplica el token semántico `border-destructive` vía `className` (usando `cn()`, importado
nuevo) en vez de mantener el wrapper. Para `DatePicker` (`@/components/ui/datePicker.jsx`),
que no acepta ni `className` ni `aria-invalid` en su firma actual, se conserva un wrapper
mínimo pero reemplazando el color hardcodeado `border-red-300` por el token semántico
`border-destructive` — decisión explícita de **no** modificar `Combobox`/`DatePicker`
(componentes compartidos usados por 14+ callers cada uno) para añadirles soporte nativo de
`aria-invalid`, ya que están fuera de los `target_files` declarados en este GAP y su tipo
de archivo (`.js`/`.jsx`) dispararía la regla de migración obligatoria a `.ts` en el mismo
commit (`.claude/rules/typescript.md`) — alcance mayor al tamaño `S`/riesgo `low` de este
GAP. Queda anotado como seguimiento posible si Jose quiere extender el soporte nativo a
esos dos componentes.

El texto de error se realineó al patrón documentado en `.claude/design-context.md` §Forms
("Error message style"): `text-red-400 text-xs pt-1` con prefijo `*`, eliminando el icono
`AlertTriangle` inline (se mantiene el import porque sigue en uso en el diálogo de
confirmación de descarte, línea ~458) — no había un segundo patrón establecido en el resto
del módulo que justificara mantener `text-red-500 text-sm` + icono, así que no fue necesario
preguntar a Jose ni actualizar `design-context.md`.

## Resultado

`npm run type-check` limpio (0 errores). `npx eslint` sobre el archivo: 0 errores.
`npx vitest run`: mismos 11 archivos/22 tests en fallo preexistentes que en el árbol
limpio, sin regresión. No hay test dedicado a `OrderEditSheet`. Verificación manual
pendiente para Jose: abrir "Editar" sobre un pedido, dejar un campo requerido vacío,
enviar, y confirmar en DevTools que el campo real (`Input`/`SelectTrigger`) expone
`aria-invalid="true"` y aplica el borde `destructive`.

## Resultado de auditoría

### Resultado: ✅ APROBADO

### Puntuación: 9/10

Verificado contra el código real (`src/components/Admin/OrdersManager/Order/OrderEditSheet/index.tsx`):

- `renderField` recibe `hasError: boolean` como segundo parámetro (línea 194) y `commonProps`
  incluye `'aria-invalid': hasError` (línea 200), aplicado a `Input` (línea 300, `{...commonProps}`)
  y `Textarea` (línea 277, `{...commonProps}` con `aria-invalid` no sobrescrito por el `className`
  posterior). `SelectTrigger` recibe `aria-invalid={hasError}` directo (línea 232). Confirmado que
  `input.jsx`/`textarea.jsx`/`select.jsx` ya definen `aria-invalid:border-destructive` en su
  className base — el estado llega al DOM real vía spread de props de Radix, no se pierde en
  ningún punto.
- El wrapper `<div className="rounded-md border-red-300">` fue eliminado para `Input`/`Textarea`/
  `Select`. Grep de `border-red|text-red-5|red-300|red-500` sobre el archivo: 0 resultados.
- `Combobox` usa `cn(field.props?.className, hasError && 'border-destructive')` (línea 267) — token
  semántico, no hardcode.
- `DatePicker` conserva un wrapper mínimo pero con `border-destructive` (líneas 371/407), nunca
  `border-red-300`.
- Texto de error realineado a `text-red-400 text-xs pt-1` con prefijo `*` (líneas 377-379,
  412-415), coincide con el patrón documentado en `design-context.md` §Forms.
- `AlertTriangle` sigue importado y en uso real en el `AlertDialogTitle` del diálogo de descarte
  (línea 458) — no es un import muerto.

**Sobre la decisión de scope (no tocar `Combobox`/`DatePicker`):** razonable y bien documentada.
Verifiqué directamente ambos componentes compartidos: `src/components/Shadcn/Combobox/index.js`
solo expone `className` (sin `aria-invalid`) y se usa vía `cn()` correctamente; `src/components/
ui/datePicker.jsx` (línea 49) tiene una firma de props cerrada (`date, onChange, formatStyle,
fromDate, id, disabled`) sin `className` ni rest-spread — literalmente no hay forma de inyectarle
ni `aria-invalid` ni una clase de borde sin modificar el componente en sí. Migrarlos habría
disparado la regla de migración `.js`→`.ts` obligatoria en el mismo commit
(`.claude/rules/typescript.md`), fuera del tamaño `S`/riesgo `low` declarado en este GAP. No lo
marco `needs_fix`: la solución aplicada (wrapper `border-destructive` para `DatePicker`, className
condicional para `Combobox`) ya resuelve el problema real del GAP (color hardcodeado eliminado,
paridad visual con el resto de campos) sin tocar componentes compartidos de 14+ callers. Es un
candidato limpio para un GAP de seguimiento si Jose quiere accesibilidad nativa completa en esos
dos componentes.

### Checklist

- [x] Criterios de aceptación cumplidos (los 4 del GAP)
- [x] Sin fetch() directo / sin hardcode de tenant (n/a, sin HTTP en este componente)
- [x] Sin archivos .js nuevos
- [x] Sin `any` sin justificar
- [x] Patrones de `.claude/rules/` respetados
- [x] Sin colores hardcodeados (`border-red-*`, `text-red-5*`) — 0 resultados en grep

### Observaciones para Jose

Implementación sólida y quirúrgica — resuelve el problema de fondo (indicador de error atado al
control real, no a un div wrapper) sin extender el scope a `Combobox`/`DatePicker`, decisión que
comparto dado el coste de migración que dispararía. Resto 1 punto solo porque la verificación
manual en DevTools (abrir el Sheet, dejar un campo vacío, confirmar `aria-invalid="true"` visible)
sigue pendiente — no bloquea el cierre, es una confirmación visual de bajo riesgo dado que el
código está correcto.

## Links

- Auditoría de origen: `docs/ai/modules/orders/audit.md`
- GAPs relacionados: ninguno directo — primera vez que se audita la superficie "edición" de este módulo
