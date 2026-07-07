---
id: GAP-V2-099
title: Botones de confirmar traslado/ubicación no se deshabilitan durante el envío — riesgo de doble petición
module: pallets
category: ux-ui
priority: P2
risk: low
size: S
status: in_progress
dependencies: []
target_files:
  - src/components/Admin/Stores/StoresManager/Store/MovePalletToStoreDialog/index.tsx
  - src/components/Admin/Stores/StoresManager/Store/AddElementToPositionDialog/index.tsx
created_at: 2026-07-05
updated_at: 2026-07-07
normalized_at: 2026-07-05
---

# GAP-V2-099 — Submit sin estado `isSubmitting` en 2 diálogos de movimiento/ubicación

## Problema

`MovePalletToStoreDialog/index.tsx:48-73,150-154` y
`AddElementToPositionDialog/index.tsx:66-94,224-228` ejecutan su acción principal
(`movePalletToStore` / `assignPalletsToPosition`) mediante una promesa (`.then()/.catch()`)
sin ningún estado `isSubmitting`/`isPending`. El botón de confirmación
(`Confirmar traslado` / `Ubicar N pallets`) solo se deshabilita en función de si hay una
selección válida (`disabled={!selectedStoreValue}` / `disabled={selectedPalletIds.length === 0}`),
nunca en función de si la petición ya está en curso.

Esto contrasta con el patrón correcto ya implementado en la misma superficie de movimientos de
almacén, en `MoveMultiplePalletsToStoreDialog/index.tsx` (`isSubmitting` state, botón
`disabled={... || isSubmitting}`, texto "Moviendo..." con `Loader2` — ver líneas 58,628-637) y
en `CreateFromForecastDialog.tsx` (`isCreating`, línea 98). Sin ese guard, un doble clic o una
red lenta permiten disparar dos peticiones de traslado/ubicación del mismo palet, con riesgo
real de estado inconsistente en un almacén físico (dos traslados simultáneos del mismo palet a
almacenes/posiciones distintos).

## Objetivo

`MovePalletToStoreDialog` y `AddElementToPositionDialog` deshabilitan su botón de confirmación
mientras la petición está en curso y muestran feedback de carga (`Loader2` + texto), igual que
`MoveMultiplePalletsToStoreDialog` y `CreateFromForecastDialog` en la misma superficie.

## Contexto

Ver `design-context.md` § Forms → "Submit button placement... Disabled state" y el checklist
DESKTOP del propio auditor: "Submit button is last in footer, disabled during submission".
`MoveMultiplePalletsToStoreDialog` (mismo directorio, misma superficie) es la referencia
directa a seguir — implementa exactamente el patrón correcto que falta en estos 2 archivos.

## Solución propuesta

Añadir `const [isSubmitting, setIsSubmitting] = useState(false)` en ambos componentes,
envolver la llamada de servicio en `setIsSubmitting(true)` / `finally setIsSubmitting(false)`,
y añadir `disabled={... || isSubmitting}` + indicador `Loader2` + texto de progreso al botón
de confirmación, replicando el patrón de `MoveMultiplePalletsToStoreDialog/index.tsx:628-637`.

## Criterios de aceptación

- [ ] `MovePalletToStoreDialog` deshabilita "Confirmar traslado" mientras la petición está en
      curso y muestra un indicador de progreso.
- [ ] `AddElementToPositionDialog` deshabilita "Ubicar N pallets" mientras la petición está en
      curso y muestra un indicador de progreso.
- [ ] Un doble clic rápido en cualquiera de los dos botones no dispara una segunda petición.
- [ ] El cierre del diálogo (`handleClose`/`resetAndClose`) también respeta el estado de envío
      en curso (no cerrar mientras se está enviando), igual que ya hace
      `LinkPalletsDialog.handleClose` (línea 89-93).

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: en ambos diálogos, hacer doble clic rápido en el botón de confirmación con
# throttling de red y confirmar que solo se dispara una petición (verificar en Network tab).
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** este GAP absorbe el criterio de
`isSubmitting` que originalmente aparecía también en GAP-V2-085 (mismos 2
componentes) — se retiró de 085 para no duplicar. Si GAP-V2-085 se implementa
antes que este, el `isSubmitting` puede derivarse directamente de `isPending` de
la mutación resultante en vez de un `useState` manual nuevo; si se implementa
este GAP primero, usar `useState` local como está descrito aquí y dejar que
GAP-V2-085 lo simplifique después. Sin dependencia dura entre ambos — cualquier
orden es válido.

## Resultado

Añadido `isSubmitting` (`useState`) en ambos diálogos. `MovePalletToStoreDialog`:
`handleSubmit` async con try/finally, botón "Confirmar traslado" deshabilitado
durante el envío con `Loader2` + "Moviendo...", `onOpenChange` sustituido por
`handleClose` que no cierra mientras `isSubmitting`. `AddElementToPositionDialog`:
mismo patrón (`onSubmit` async, botón "Ubicar N pallets" deshabilitado +
"Ubicando...", `handleOnClose` respeta `isSubmitting`). `npm run type-check` y
`npm run lint` limpios.

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: GAP-V2-085 (mismos 2 componentes, capa de llamada — criterio
  de isSubmitting movido aquí durante la normalización); patrón de referencia ya
  correcto en `MoveMultiplePalletsToStoreDialog` y `CreateFromForecastDialog`
  (misma superficie)
