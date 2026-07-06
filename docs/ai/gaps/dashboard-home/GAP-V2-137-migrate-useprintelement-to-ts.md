---
id: GAP-V2-137
title: Migrar usePrintElement.js a TypeScript — hook compartido sin tipos usado por 14+ archivos
module: dashboard-home
category: code-quality
priority: P3
risk: medium
size: S
status: candidate
dependencies: []
target_files:
  - src/hooks/usePrintElement.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-137 — `usePrintElement` sin tipos, usado transversalmente por 14+ archivos

## Problema

`src/hooks/usePrintElement.js` es un hook de utilidad (`use[Utility]`, nomenclatura correcta)
totalmente sin tipar:

```js
export function usePrintElement({ id, width = 100, height = 150, freeSize = false }) {
```

`id`, `width`, `height`, `freeSize` son parámetros implícitos sin tipo, y el hook manipula
directamente el DOM (`document.getElementById`, `iframe.contentWindow`) sin ningún tipo
(`unknown`/`HTMLIFrameElement`/`Document` implícitos como `any`).

Este hook es usado por `ReceptionsListCard` (dentro del alcance de esta auditoría) y por al
menos 13 archivos más fuera de `dashboard-home` (Labels, Pallets, Production, Field,
Comercial, CmrManual) — es decir, cualquier migración debe tratarse con cuidado por el efecto
ripple, pero es justamente el tipo de hook (una única responsabilidad, sin lógica de negocio
específica de un módulo) donde la migración es de complejidad **BAJA-MEDIA**: la lógica en sí
es simple, el riesgo está en typar correctamente las interacciones con el DOM/iframe sin
introducir `any`.

## Objetivo

`usePrintElement.ts` con parámetros y retorno tipados, sin cambiar su comportamiento para
ninguno de sus 14+ consumidores.

## Contexto

Regla CLAUDE.md §3 (archivos `.js` nuevos prohibidos, migrar legacy al tocar) y protocolo
CLOUD de migración `.jsx`→`.tsx` (`CLAUDE.md` § Workflow pre-push): por el número de
consumidores, este GAP debe implementarse como **PR aislado**, sin mezclar con otros cambios de
`dashboard-home`, y verificar `npm run type-check` limpio antes de dar por cerrado.

## Solución propuesta

1. Renombrar `usePrintElement.js` → `usePrintElement.ts`.
2. Tipar los parámetros:
   ```ts
   interface UsePrintElementParams {
     id: string;
     width?: number;
     height?: number;
     freeSize?: boolean;
   }
   export function usePrintElement({
     id,
     width = 100,
     height = 150,
     freeSize = false,
   }: UsePrintElementParams): { onPrint: () => void } { ... }
   ```
3. Revisar los 14+ archivos importadores tras la migración con `npm run type-check` completo
   (no solo el primer error) — varios de ellos también son `.js`/`.jsx`, por lo que TypeScript
   puede no marcar nada nuevo en ellos, pero conviene confirmar.

## Criterios de aceptación

- [ ] `usePrintElement.ts` existe (migrado desde `.js`), parámetros y retorno tipados sin `any`.
- [ ] El archivo `.js` original no existe.
- [ ] `npm run type-check` limpio en todo el proyecto (no solo en el hook).
- [ ] `npm run lint` limpio.
- [ ] La impresión de etiquetas de lote en `ReceptionsListCard` sigue funcionando igual.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: probar impresión de etiquetas de lote desde ReceptionsListCard (/operator) y,
# si es viable, al menos un consumidor más fuera de dashboard-home (p.ej. PalletLabelDialog).
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
