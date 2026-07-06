---
id: GAP-V2-030
title: AuxiliaryLinesByProductCard fuerza la unidad "kg" en artículos auxiliares que no se miden en peso
module: dashboard-home
category: domain-business
priority: P1
risk: low
size: XS
status: candidate
dependencies: []
target_files:
  - src/components/Admin/Dashboard/AuxiliaryLinesByProductCard/index.tsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-030 — AuxiliaryLinesByProductCard fuerza la unidad "kg" en artículos auxiliares que no se miden en peso

## Problema

`AuxiliaryLinesByProductCard` (widget "Otros Artículos — Ranking por Artículo") recibe del
backend, por cada línea auxiliar, tanto `quantity` como `unit` (`src/components/Admin/Dashboard/AuxiliaryLinesByProductCard/index.tsx:44`
— `unit: item.unit`), es decir, el propio backend ya modela que un artículo auxiliar (portes,
transporte, envases retornables, tasas de gestión, etc.) puede tener una unidad de medida
distinta a peso: por servicio, por trayecto, por unidad/caja, por hora.

Sin embargo, en el tooltip del gráfico (líneas 121-124):

```tsx
<span className="text-muted-foreground text-xs">
  {formatDecimalWeight(Number(payload?.quantity ?? 0))}{' '}
  {payload?.unit ?? ''}
</span>
```

`formatDecimalWeight` (`src/helpers/formats/numbers/formatNumbers.js:29-31`) devuelve siempre
`"{valor} kg"` de forma incondicional. El resultado es que para cualquier artículo auxiliar
cuya unidad real no sea peso, el tooltip muestra dos unidades pegadas y contradictorias entre
sí, p.ej. `"3,00 kg unidad"`, `"12,00 kg servicio"` o `"1,00 kg trayecto"` — un dato
directamente incorrecto e ilegible para el usuario que consulta rentabilidad/composición de
"otros artículos" del pedido.

Esto no es un problema de formato de números (eso sería code-quality): es un error de
dominio — el sistema ya sabe que la cantidad de una línea auxiliar no es necesariamente un
peso (lo dice su propio campo `unit`) pero el componente la fuerza a través de un formateador
exclusivo de peso, produciendo una etiqueta de unidad que no corresponde a la realidad del
artículo facturado.

## Objetivo

El tooltip de `AuxiliaryLinesByProductCard` muestra la cantidad de cada artículo auxiliar con
su propia unidad (`payload.unit`), sin forzar el sufijo "kg" cuando la unidad real es otra
(unidad, servicio, hora, trayecto, etc.). Si `unit` indica explícitamente un peso (p.ej. "kg"),
se sigue formateando como peso; en cualquier otro caso se muestra el número con la unidad que
el backend ya proporciona, sin duplicar sufijos.

## Contexto

Encontrado durante la auditoría domain-business de `dashboard-home` (carril
`domain-business-auditor`), superficie Admin/Dirección. `AuxiliaryLinesByCustomerCard` y
`AuxiliaryLinesChartCard` no presentan este problema porque no muestran `quantity`/`unit` en
absoluto (solo importes).

## Solución propuesta

En `src/components/Admin/Dashboard/AuxiliaryLinesByProductCard/index.tsx`, sustituir la línea
122-123 por una función de formato que decida el sufijo según `payload?.unit` en vez de asumir
peso siempre, por ejemplo:

```tsx
{formatDecimal(Number(payload?.quantity ?? 0))} {payload?.unit ?? ''}
```

usando `formatDecimal` (sin sufijo) y dejando que `unit` (ya provisto por el backend) sea la
única fuente de la etiqueta de unidad. Si el valor de `unit` que llega del backend para líneas
en kg ya es literalmente `"kg"`, no hace falta ninguna lógica condicional adicional — basta con
dejar de anteponer un sufijo fijo.

## Criterios de aceptación

- [ ] El tooltip de `AuxiliaryLinesByProductCard` nunca muestra dos unidades concatenadas
      (verificar con un artículo auxiliar cuya `unit` no sea peso, p.ej. "unidad" o "servicio").
- [ ] Un artículo auxiliar medido en peso sigue mostrando su cantidad correctamente.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Verificación manual: /admin/home con datos que incluyan al menos una línea auxiliar
# no medida en kg (p.ej. "portes" facturado por trayecto) y confirmar que el tooltip
# de "Otros Artículos — Ranking por Artículo" no concatena "kg" con la unidad real.
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
