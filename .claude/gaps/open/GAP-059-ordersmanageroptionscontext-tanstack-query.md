# GAP-059 — Migrar OrdersManagerOptionsContext a TanStack Query

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

`src/context/gestor-options/OrdersManagerOptionsContext.jsx` tiene tres problemas:

**Problema 1 — Token-as-parameter (PL-010, FND-007):**
El contexto extrae `session?.user?.accessToken` de `useSession()` (línea 17) y lo pasa
a `getProductOptions(token)` y `getTaxOptions(token)` (líneas 35 y 38) dentro de un
`useEffect`. Los providers/contexts no deben extraer ni reenviar el token de autenticación.

**Problema 2 — useState + useEffect para datos de catálogo (FND-010):**
Las opciones de productos e impuestos se cargan con `useState([])` + `Promise.all` +
`useEffect`. Sin cache, sin retry, sin deduplicación. Si el componente se desmonta y
remonta, los datos se vuelven a fetchear. El patrón correcto es `useQuery` con
`staleTime: 10 * 60 * 1000` (datos de catálogo que raramente cambian).

**Problema 3 — Riesgo PL-018 en taxOptions (FND-018):**
Los valores de `taxOptions` se mapean como `t.id` (probablemente `number`). Si estas
opciones se pasan a un componente `Select` de shadcn, se viola PL-018: los `Select`
esperan `value: string | undefined`, nunca `number`. Verificar y corregir el mapeo.

**Estado actual del contexto:**
```jsx
const [productOptions, setProductOptions] = useState([]);
const [taxOptions, setTaxOptions] = useState([]);

useEffect(() => {
  if (!token) return;
  Promise.all([getProductOptions(token), getTaxOptions(token)])
    .then(([products, taxes]) => {
      setProductOptions(products);
      setTaxOptions(taxes);
    });
}, [token]);
```

Adicionalmente, `useOrderOptions.ts` (sub-hook de `useOrder.ts`) ya importa de este
contexto vía `useOrdersManagerOptions()`. La solución debe mantener la API del contexto
para que `useOrderOptions.ts` no necesite cambios estructurales.

Detectado en auditoría quality orders manager (FND-007 + FND-010 + FND-018, audit 2026-07-01).

## Solución acordada

### Opción A (Recomendada): Mantener el contexto pero migrar a useQuery internamente

El contexto sigue existiendo para que los consumidores actuales no cambien.
Internamente reemplaza useState+useEffect por dos `useQuery`:

```tsx
// En el Provider
const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

const { data: productOptions = [], isLoading: productsLoading } = useQuery({
  queryKey: productOptionKeys.options(tenantId),
  queryFn: () => productService.getOptions(), // o getProductOptions() sin token
  staleTime: 10 * 60 * 1000,
  enabled: !!tenantId,
});

const { data: taxOptions = [], isLoading: taxOptionsLoading } = useQuery({
  queryKey: taxOptionKeys.options(tenantId),
  queryFn: () => taxService.getOptions(), // o getTaxOptions() sin token
  staleTime: 10 * 60 * 1000,
  enabled: !!tenantId,
});
```

> El implementador debe verificar si `getProductOptions` y `getTaxOptions` ya usan
> `getAuthToken()` internamente (como resultado de otros GAPs) o si aún necesitan token.
> Si aún necesitan token, incluir la migración en el scope de este GAP.

### Corrección PL-018 en taxOptions

Verificar el endpoint de `getTaxOptions`: si devuelve `{ id: number, name: string }`,
el mapeo al contexto debe convertir `value: String(t.id)` (string, no number).

```ts
// ✅ Correcto para shadcn Select
taxOptions: taxes.map(t => ({ value: String(t.id), label: t.name }))
// ❌ Incorrecto
taxOptions: taxes.map(t => ({ value: t.id, label: t.name }))
```

### Factories de queryKeys necesarias

Verificar en `src/lib/routes/queryKeys.ts` si ya existen `productOptionKeys` y
`taxOptionKeys`. Si no existen, añadirlos:

```ts
export const productOptionKeys = {
  options: (tenantId: string | null) =>
    ['products', 'options', tenantId ?? 'unknown'] as const,
};

export const taxOptionKeys = {
  options: (tenantId: string | null) =>
    ['taxes', 'options', tenantId ?? 'unknown'] as const,
};
```

## Referencias e inspiración

- PL-010 (project-learnings.md): token-as-parameter anti-patrón
- PL-018 (project-learnings.md): Select value debe ser string | undefined, nunca number
- rules/hooks.md: `staleTime: 10 * 60 * 1000` para catálogos de referencia
- rules/hooks.md: "TanStack Query para TODO el estado del servidor"

## Criterios de aceptación

- [ ] `OrdersManagerOptionsContext.jsx` no importa `useSession`
- [ ] `OrdersManagerOptionsContext.jsx` no tiene `useState` para `productOptions` ni `taxOptions`
- [ ] `OrdersManagerOptionsContext.jsx` no tiene `useEffect` para cargar opciones
- [ ] Los datos de producto e impuestos se cargan con `useQuery` con `staleTime: 10 * 60 * 1000`
- [ ] Los taxOptions tienen `value: string` (no `number`) en el contexto
- [ ] `productOptionKeys` y `taxOptionKeys` existen en `queryKeys.ts`
- [ ] `useOrderOptions.ts` sigue funcionando sin cambios (si la API del contexto no cambia)
- [ ] `npm run lint` pasa sin warnings en los archivos modificados

## Archivos a crear o modificar

**Modificar:**
- `src/context/gestor-options/OrdersManagerOptionsContext.jsx` — migrar a useQuery
- `src/lib/routes/queryKeys.ts` — añadir factories si no existen

**Verificar (modificar si necesario):**
- `src/services/productService.ts` o helper de productOptions — si aún acepta token
- `src/services/taxService.ts` o helper de taxOptions — si aún acepta token

**No tocar:**
- `src/hooks/orders/useOrderOptions.ts` — consume el contexto sin cambios si la API se mantiene

## Restricciones

- No eliminar el contexto — mantener la estructura del Provider y el hook `useOrdersManagerOptions`
  para que los consumidores existentes no necesiten cambiar
- No cambiar la estructura de las opciones (productOptions, taxOptions) que consume `useOrderOptions.ts`
- No renombrar `OrdersManagerOptionsContext.jsx` a `.tsx` en este GAP — es scope de GAP-061

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
