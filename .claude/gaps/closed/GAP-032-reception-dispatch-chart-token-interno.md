# GAP-032 — Eliminar token-as-parameter de getReceptionChartData y getDispatchChartData

## Metadata

- **Tipo:** Refactor
- **Módulo:** Stock / Despachos (Dashboard Charts)
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-28
- **Autor:** Jose

---

## Contexto y problema

`getReceptionChartData.ts` y `getDispatchChartData.ts` son dos service files que siguen
el anti-patrón PL-NEW-C: aceptan `token: string` como parámetro y construyen el header
`Authorization: Bearer ${token}` manualmente. Los hooks `useReceptionChartData` y
`useDispatchChartData` en `useDashboardCharts.ts` extraen el token de `useSession()` y lo
pasan manualmente a estos servicios.

Este es exactamente el mismo patrón que GAP-027 (storeService) y GAP-028 (orderService),
ahora en los servicios de charts de recepciones y despachos. Fueron excluidos del scope
de GAP-028 porque pertenecen a módulos distintos.

**`src/services/rawMaterialReception/getReceptionChartData.ts`:**
- Línea 6: `@lib/fetchWithTenant` — alias incorrecto (falta `/`)
- `ReceptionChartDataParams` incluye `token: string`
- `fetchWithTenant` llamado con `Authorization: Bearer ${token}` manual

**`src/services/ceboDispatch/getDispatchChartData.ts`:**
- Línea 6: `@lib/fetchWithTenant` — alias incorrecto (falta `/`)
- `DispatchChartDataParams` incluye `token: string`
- `fetchWithTenant` llamado con `Authorization: Bearer ${token}` manual

**`src/hooks/useDashboardCharts.ts` — `useReceptionChartData` (líneas 86-119):**
```ts
const { data: session } = useSession();
const token = session?.user?.accessToken;
// ...
getReceptionChartData({ token: token as string, ... })
// enabled: !!token && !!tenantId && !!from && !!to
```

**`src/hooks/useDashboardCharts.ts` — `useDispatchChartData` (líneas 125-158):**
```ts
const { data: session } = useSession();
const token = session?.user?.accessToken;
// ...
getDispatchChartData({ token: token as string, ... })
// enabled: !!token && !!tenantId && !!from && !!to
```

Adicionalmente, el helper interno `useChartData` acepta `queryKey: unknown[]`, lo que
permite arrays inline de forma indirecta. Este aspecto (y los inline arrays en
`useReceptionChartData`/`useDispatchChartData`) está cubierto por **GAP-030**.

## Solución acordada

1. En `getReceptionChartData.ts`:
   - Corregir alias: `'@lib/fetchWithTenant'` → `'@/lib/fetchWithTenant'`
   - Añadir `import { getAuthToken } from '@/lib/auth/getAuthToken'`
   - Eliminar `token` de `ReceptionChartDataParams`
   - Añadir `const token = await getAuthToken()` al inicio de la función
   - Eliminar `Authorization: Bearer ${token}` del objeto `headers`
     (`fetchWithTenant` lo inyecta automáticamente)
   - Mantener `'User-Agent': getUserAgent()` si sigue siendo necesario

2. En `getDispatchChartData.ts`:
   - Mismo conjunto de cambios que en el punto anterior

3. En `useDashboardCharts.ts` — para `useReceptionChartData` y `useDispatchChartData`:
   - Eliminar `const { data: session } = useSession()` y `const token = ...`
   - Eliminar el campo `token: token as string` de las llamadas al service
   - Actualizar `enabled`: `!!token && !!tenantId && ...` → `!!tenantId && !!from && !!to`
   - Si después de este GAP `useSession` ya no se usa en ningún hook del archivo,
     eliminar también `import { useSession }` y `import type { Session }` si existe

   Nota: los inline `queryKey` arrays en estos dos hooks los reemplaza **GAP-030**
   (con factories `receptionChartKeys` y `dispatchChartKeys`). Implementar GAP-032
   antes o coordinar para no generar conflictos.

## Diagrama del cambio en el service

```ts
// ANTES
export async function getReceptionChartData(
  params: ReceptionChartDataParams  // { token: string, from, to, ... }
): Promise<ChartDataPoint[]> {
  const { token, ... } = params;
  await fetchWithTenant(url, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': getUserAgent() }
  });
}

// DESPUÉS
export async function getReceptionChartData(
  params: Omit<ReceptionChartDataParams, 'token'>
): Promise<ChartDataPoint[]> {
  const token = await getAuthToken();
  const { ... } = params;
  await fetchWithTenant(url, {
    headers: { 'User-Agent': getUserAgent() }  // Authorization lo inyecta fetchWithTenant
  });
}
```

## Referencias e inspiración

- PL-NEW-C (project-learnings.md): anti-patrón token-as-parameter.
- GAP-027 como precedente exacto (storeService.ts, 7 funciones, mismo patrón).
- GAP-028 como precedente (orderService.ts, 9 funciones, mismo patrón).
- rules/api-client.md: `fetchWithTenant` inyecta `Authorization` automáticamente.
- GAP-030 cubre las factories `receptionChartKeys` y `dispatchChartKeys` — coordinar orden
  de implementación.

## Criterios de aceptación

- [ ] `getReceptionChartData.ts` no tiene `token` en `ReceptionChartDataParams`
- [ ] `getReceptionChartData.ts` llama a `getAuthToken()` internamente
- [ ] `getReceptionChartData.ts` no pasa `Authorization` manualmente a `fetchWithTenant`
- [ ] `getReceptionChartData.ts` importa desde `@/lib/fetchWithTenant` (con barra)
- [ ] `getDispatchChartData.ts` — mismos 4 criterios anteriores
- [ ] `useReceptionChartData` en `useDashboardCharts.ts` no extrae token de `useSession`
- [ ] `useDispatchChartData` en `useDashboardCharts.ts` no extrae token de `useSession`
- [ ] `enabled` en ambos hooks es `!!tenantId && !!from && !!to` (sin `!!token`)
- [ ] Las llamadas a `getReceptionChartData` y `getDispatchChartData` no incluyen `token`
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin warnings en los archivos modificados

## Archivos a crear o modificar

**Modificar:**
- `src/services/rawMaterialReception/getReceptionChartData.ts`
- `src/services/ceboDispatch/getDispatchChartData.ts`
- `src/hooks/useDashboardCharts.ts` — solo `useReceptionChartData` y `useDispatchChartData`

## Restricciones

- No cambiar la lógica de construcción de query params ni el endpoint URL
- No cambiar la interfaz pública de los hooks (mismos parámetros de entrada, mismo retorno)
- No tocar `useSalesChartData` ni `useTransportChartData` (cubiertos por GAP-028)
- `useChartData` helper: no cambiar su firma en este GAP — GAP-030 lo aborda
- No añadir tests en este GAP

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
