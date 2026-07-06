---
id: GAP-V2-117
title: "ReceptionsListCard: style={{ pageBreakAfter }} inline en el bloque de impresión de etiquetas de lote"
module: dashboard-home
category: code-quality
priority: P3
risk: low
size: XS
status: ready
dependencies: []
target_files:
  - src/components/Warehouse/ReceptionsListCard/index.tsx
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-117 — Único `style={{}}` del componente, en el bloque de impresión

## Problema

`src/components/Warehouse/ReceptionsListCard/index.tsx:504`:

```tsx
<div
  key={`lot-${lot}-${i}`}
  className="flex min-h-[80px] items-center justify-center p-6"
  style={{ pageBreakAfter: i < lotLabelsToPrint.length - 1 ? 'always' : 'auto' }}
>
```

Es el único `style={{}}` de todo el archivo (verificado con grep en los 4
archivos de esta superficie) y contradice `.claude/design-context.md` § 7:
"Never use `style={{ }}` inline styles in new or modified components".

## Objetivo

Reemplazar el inline style por clases Tailwind equivalentes, sin cambiar el
comportamiento de salto de página al imprimir etiquetas de lote.

## Contexto

Tailwind CSS incluye utilidades de `break-after` (`break-after-page`,
`break-after-auto`) que cubren exactamente este caso de impresión.

## Solución propuesta

```tsx
import { cn } from '@/lib/utils';
...
<div
  key={`lot-${lot}-${i}`}
  className={cn(
    'flex min-h-[80px] items-center justify-center p-6',
    i < lotLabelsToPrint.length - 1 ? 'break-after-page' : 'break-after-auto'
  )}
>
```

Verificar en `tailwind.config`/build que la utilidad `break-after-page` está
disponible en la versión de Tailwind 4.2.1 del proyecto antes de aplicar (si no
lo está, es la única excepción documentable como `style={{}}` justificado por
comentario explícito).

## Criterios de aceptación

- [ ] Sin `style={{}}` en el archivo, o excepción documentada con comentario si
      Tailwind no soporta la utilidad necesaria.
- [ ] El salto de página entre etiquetas de lote impresas se comporta igual
      que antes del cambio.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: imprimir (o vista previa de impresión) varias etiquetas de lote y
# confirmar que cada una queda en su propia página.
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
