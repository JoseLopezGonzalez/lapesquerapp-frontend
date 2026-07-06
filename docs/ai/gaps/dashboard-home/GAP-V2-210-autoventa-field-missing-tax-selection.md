---
id: GAP-V2-210
title: "Nueva autoventa" en Field no permite seleccionar IVA por línea
module: dashboard-home
category: domain-business
priority: P1
risk: high
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Field/FieldAutoventaWizard.jsx
  - src/components/Comercial/Autoventa/Step3Pricing/index.js
  - src/hooks/useFieldAutoventa.js
  - src/hooks/useFieldTaxesOptions.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-210 — "Nueva autoventa" en Field no permite seleccionar IVA por línea

## Problema

El acceso directo "Nueva autoventa" del `FieldDashboard` (`FieldDashboard.jsx:201-206`,
`Link href="/field/autoventa"`) abre `FieldAutoventaWizard.jsx`, cuyo paso 3 de precios
renderiza `Step3Pricing` **sin** pasarle `taxOptions` ni `setItemTax`:

```jsx
// FieldAutoventaWizard.jsx:230
<Step3Pricing state={state} setItemPrice={setItemPrice} totalAmount={totalAmount} />
```

`Step3Pricing/index.js:14-22` solo muestra el `Select` de IVA cuando
`Array.isArray(taxOptions) && taxOptions.length > 0 && typeof setItemTax === 'function'`
(`showTaxSelect`). Como ninguno de los dos se pasa, el selector de IVA **nunca aparece**
en el flujo de autoventa en ruta.

`useFieldAutoventa.js:157-164` (`submitAutoventa`) construye cada línea con
`tax: item.tax != null ? Number(item.tax) : undefined` — como `item.tax` nunca se
establece (no existe ningún `setItemTax` conectado en este hook, y el campo real del
item es `taxId`, no `tax` — otro desajuste), **todas las líneas de una autoventa
creada en campo se envían sin impuesto explícito**.

Contraste directo: `FieldOrderExecutionPage.jsx:80-81,348-353` (ejecución de un pedido
operativo prefijado) sí obtiene `taxOptionsData` vía `useFieldTaxesOptions()` y pasa
`taxOptions`/`setItemTax` a `Step3Pricing`, permitiendo elegir IVA por producto. El
propio servicio `getFieldTaxesOptions` (`fieldOperatorService.ts:52-58`) y el hook
`useFieldTaxesOptions` ya existen y están operativos — simplemente no se conectan en
el wizard de autoventa.

## Por qué es un problema de negocio (no solo de código)

Una autoventa es una venta directa en el momento, en la furgoneta, frente al cliente —
no una revisión posterior de un pedido ya facturado por administración. Si el
repartidor marca "Requiere factura" en el paso de confirmación (`Step7Confirmation`,
`setInvoiceRequired`), el sistema genera una venta con importe pero sin tipo de IVA
capturado en el frontend, dejando el cálculo fiscal a un valor por defecto no visible
ni verificable por el propio operario en el momento de la venta. Para una empresa del
sector pesquero/congelados en España, el IVA aplicable puede variar por tipo de
producto (fresco, congelado, elaborado) — no es un valor único de empresa. Confiar en
un default de backend invisible en el momento de la venta es un riesgo fiscal real,
distinto y más grave que un simple bug de UI: la factura resultante podría llevar un
tipo de IVA incorrecto sin que nadie lo detecte hasta la contabilidad o una inspección.

## Objetivo

El paso de precios del wizard de "Nueva autoventa" en Field debe permitir seleccionar
el IVA por línea de producto, igual que ya ocurre en la ejecución de pedidos
operativos, y el payload enviado a `createFieldAutoventa` debe incluir el `taxId`
seleccionado por cada línea.

## Contexto

`useFieldTaxesOptions` y `getFieldTaxesOptions` ya existen y están probados en
producción vía `FieldOrderExecutionPage`. No se necesita nueva infraestructura de
datos — solo conectar la misma pieza en el wizard de autoventa.

## Solución propuesta

- Añadir `useFieldTaxesOptions()` en `FieldAutoventaWizard.jsx` y pasar
  `taxOptions={taxOptionsData ?? []}` a `Step3Pricing`.
- Añadir `setItemTax` a `useFieldAutoventa.js` (mismo patrón que el `setItemTax` local
  de `FieldOrderExecutionPage.jsx:157-165`), asegurando que el campo interno del item
  se llame de forma consistente (`taxId`, no `tax`) y que `submitAutoventa` lo mapee
  correctamente al payload.
- Confirmar con Jose si debe existir un IVA por defecto preseleccionado por especie/
  producto (para no añadir fricción en la venta rápida) o si debe ser obligatorio
  seleccionar antes de continuar — ver pregunta abierta.

## Criterios de aceptación

- [ ] El paso 3 ("Precios") de `FieldAutoventaWizard` muestra el selector de IVA por
      línea cuando hay opciones de impuesto disponibles.
- [ ] El payload enviado por `submitAutoventa` incluye `tax`/`taxId` con el valor
      seleccionado por el usuario para cada línea, no `undefined`.
- [ ] Comportamiento verificado también para el atajo "Nueva autoventa" lanzado desde
      `FieldDashboard` (sin `routeStopId`) y desde `StopDetailDrawer` (con
      `routeStopId`) — mismo componente, mismo fix.

## Plan de validación

```text
npm run type-check
npm run lint
Verificación manual: completar el wizard de autoventa hasta el paso 3 y confirmar que
aparece el selector de IVA; inspeccionar el payload de red al confirmar la autoventa.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: ninguno todavía en este módulo para esta superficie.
