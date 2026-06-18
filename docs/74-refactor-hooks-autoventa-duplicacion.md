# Refactor pendiente: unificación de hooks de autoventa

> **Estado:** Pendiente  
> **Prioridad:** Baja — código funcional, sin impacto en UX  
> **Detectado:** 2026-06-18 durante análisis de lógica de añadir cajas por rol  

---

## Contexto

Durante la sesión de investigación del QR de palets se realizó un análisis cruzado de toda la lógica para añadir cajas en los distintos roles de la aplicación. Se detectó duplicación evitable entre dos hooks de autoventa.

---

## Duplicación detectada

### `useFieldAutoventa.js` y `useAutoventa.js`

Los dos hooks comparten lógica idéntica línea a línea:

**`addBox` — mismo código en ambos archivos:**
```javascript
const addBox = useCallback((box) => {
  setState((s) => ({
    ...s,
    boxes: [...(s.boxes || []), { ...box, productId: Number(box.productId), netWeight: Number(box.netWeight) || 0 }],
  }));
}, []);
```

**`aggregateItemsFromBoxes` — misma función (24 líneas) duplicada:**
Presente en:
- `src/hooks/useFieldAutoventa.js` (líneas 26–49 aprox.)
- `src/hooks/useAutoventa.js` (líneas 23–46 aprox.)
- Posiblemente también en `src/lib/field/fieldOrderExecution` (revisar al abordar el refactor)

**Tamaño estimado de la duplicación:** ~170 líneas entre ambos hooks.

**Única diferencia real:** `useFieldAutoventa` acepta `routeId`, `routeStopId` y `customerId` como parámetros; `useAutoventa` no.

---

## Lo que está bien y NO se debe tocar

- `Step2QRScan` — ya está correctamente compartido entre Autoventa Comercial, Field y Field Order Execution.
- `usePalletBoxCreation.ts` / `usePalletBoxOperations.ts` — separación justificada, el dominio de palets es mucho más rico (6 métodos de entrada, edición masiva, soporte libras/kg, GS1-128 completo). No tienen duplicación real con los hooks de autoventa.

---

## Plan de refactor

### Paso 1 — Centralizar `aggregateItemsFromBoxes`

Crear `src/lib/common/boxHelpers.ts` con la función compartida:

```typescript
export function aggregateItemsFromBoxes(boxes: ParsedBox[]): AggregatedItem[] {
  // lógica actual duplicada en useFieldAutoventa y useAutoventa
}
```

Importar desde los tres puntos que actualmente la duplican.

**Ganancia:** ~50 líneas eliminadas.

### Paso 2 — Unificar los dos hooks

Crear `src/hooks/autoventa/useAutoventaBase.ts` con toda la lógica compartida, parametrizable:

```typescript
export function useAutoventaBase(options?: {
  routeId?: string | number;
  routeStopId?: string | number;
  customerId?: string | number;
  createAutoventa?: (...args: unknown[]) => Promise<unknown>;
}) {
  // lógica unificada
}
```

Mantener los hooks actuales como wrappers delgados de compatibilidad:
- `useFieldAutoventa.js` → migrar a `.ts`, delegar a `useAutoventaBase`
- `useAutoventa.js` → ídem

**Ganancia:** ~120 líneas eliminadas.

### Paso 3 — Migrar a TypeScript

Ambos hooks son `.js` legacy. Al abordar el refactor, migrarlos a `.ts` en el mismo commit (regla de oro 3 del proyecto).

---

## Archivos implicados

| Archivo | Acción |
|---|---|
| `src/hooks/useFieldAutoventa.js` | Refactorizar + migrar a `.ts` |
| `src/hooks/useAutoventa.js` | Refactorizar + migrar a `.ts` |
| `src/lib/field/fieldOrderExecution` | Revisar si tiene tercera copia de `aggregateItemsFromBoxes` |
| `src/lib/common/boxHelpers.ts` | Crear nuevo |
| `src/hooks/autoventa/useAutoventaBase.ts` | Crear nuevo |

---

## Criterios de éxito

- `aggregateItemsFromBoxes` existe en un único lugar
- `useFieldAutoventa` y `useAutoventa` no comparten código inline
- Ambos hooks en TypeScript
- Tests existentes siguen pasando (`npm run test:run`)
- Ningún cambio de comportamiento observable en autoventa comercial ni field
