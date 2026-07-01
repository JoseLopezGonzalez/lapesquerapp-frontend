# GAP-058 — Refactorizar ProductionView: eliminar token + migrar a useQuery con polling

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

`src/components/Admin/OrdersManager/ProductionView/index.js` tiene dos problemas combinados:

**Problema 1 — Token-as-parameter (PL-010, FND-004):**
El componente importa `useSession()` en la línea 26, extrae `session?.user?.accessToken`
en la línea 35, y lo pasa a `getProductionViewData(token)` en la línea 49.
Los componentes no deben extraer ni reenviar el token de autenticación.

**Problema 2 — useState + useEffect para datos del servidor (FND-005):**
La vista gestiona `productionData`, `loading` y `error` con `useState` (líneas 37-40) y
ejecuta el fetch con `useCallback` + `useEffect` incluyendo un polling con `setInterval`
(línea ~80+). Este patrón manual viola la regla del proyecto: TanStack Query gestiona
todo el estado del servidor.

Código actual (esquema):
```js
const [productionData, setProductionData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

const fetchData = useCallback(async () => {
  const data = await getProductionViewData(token);
  setProductionData(data);
  console.log('ProductionView: Datos obtenidos:', data); // FND-011: console.log en producción
}, [token]);

useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 3 * 60 * 1000); // polling manual
  return () => clearInterval(interval);
}, [fetchData]);
```

El patrón correcto es `useQuery` con `refetchInterval`. Adicionalmente hay un
`console.log` que se ejecuta en producción en cada ciclo del polling (~20 veces/hora).

**Dependencia:** Este GAP requiere que GAP-056 esté cerrado primero — `getProductionViewData`
debe aceptar 0 parámetros (obtiene el token internamente con `getAuthToken()`).

Detectado en auditoría quality orders manager (FND-004 + FND-005 + FND-011, audit 2026-07-01).

## Solución acordada

### 1. Crear `useProductionViewData` hook

Crear `src/hooks/orders/useProductionViewData.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { productionViewKeys } from '@/lib/routes/queryKeys';
import { getProductionViewData } from '@/services/orderService';

export function useProductionViewData(enabled = true) {
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  return useQuery({
    queryKey: productionViewKeys.data(tenantId),
    queryFn: getProductionViewData,
    enabled: !!tenantId && enabled,
    refetchInterval: 3 * 60 * 1000, // 3 minutos — igual al polling manual actual
    staleTime: 60 * 1000,           // 1 minuto — dato volátil
  });
}
```

### 2. Añadir factory `productionViewKeys` a queryKeys.ts

```ts
export const productionViewKeys = {
  data: (tenantId: string | null) =>
    ['productionView', 'data', tenantId ?? 'unknown'] as const,
};
```

### 3. Refactorizar `ProductionView/index.js`

- Eliminar `useSession` import y extracción de token
- Eliminar los 3 `useState` (`productionData`, `loading`, `error`)
- Eliminar `useCallback` + `useEffect` con el polling manual
- Eliminar el `console.log` (línea ~53)
- Añadir `const { data: productionData, isLoading, error } = useProductionViewData()`
- Simplificar el render: usar `isLoading` y `error` del hook

## Referencias e inspiración

- PL-010 (project-learnings.md): token-as-parameter anti-patrón
- rules/hooks.md: "TanStack Query para TODO el estado del servidor — nunca useState + useEffect"
- Patrón de hooks de listado del proyecto (useCustomersList, etc.) para refetchInterval
- `getProductionViewData` en `orderService.ts`: función que se migra en GAP-056

## Criterios de aceptación

- [ ] `src/hooks/orders/useProductionViewData.ts` existe con `useQuery` y `refetchInterval: 3 * 60 * 1000`
- [ ] `productionViewKeys` factory existe en `src/lib/routes/queryKeys.ts`
- [ ] `ProductionView/index.js` no importa `useSession`
- [ ] `ProductionView/index.js` no tiene `useState` para datos del servidor
- [ ] `ProductionView/index.js` no tiene `useEffect` / `setInterval` para polling
- [ ] El `console.log` de la línea ~53 eliminado
- [ ] El polling de 3 minutos sigue funcionando (via `refetchInterval`)
- [ ] Estados de loading y error se muestran correctamente en la UI
- [ ] `npm run lint` pasa sin warnings en los archivos modificados

## Archivos a crear o modificar

**Crear:**
- `src/hooks/orders/useProductionViewData.ts`

**Modificar:**
- `src/lib/routes/queryKeys.ts` — añadir `productionViewKeys`
- `src/components/Admin/OrdersManager/ProductionView/index.js` — refactorizar al nuevo hook

## Restricciones

- **Dependencia obligatoria:** GAP-056 debe estar cerrado antes de implementar este GAP
  (`getProductionViewData` debe aceptar 0 parámetros)
- No cambiar el intervalo de refresco — mantener 3 minutos
- No renombrar `ProductionView/index.js` a `.tsx` en este GAP — es scope de GAP-061
- No modificar la estructura visual del componente ni su lógica de render

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
