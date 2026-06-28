# GAP-031 — Limpiar authService.ts: path alias, Authorization redundante y console.*

## Metadata

- **Tipo:** Refactor
- **Módulo:** Auth / Global
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-28
- **Autor:** Jose

---

## Contexto y problema

`src/services/authService.ts` tiene tres violaciones menores que acumula desde su creación:

### 1. Path alias incorrecto (TypeScript bloqueante)

```ts
// Línea 1 — alias incorrecto
import { fetchWithTenant } from '@lib/fetchWithTenant';
//                                ^^ falta la barra inicial
```

El alias canónico del proyecto es `@/lib/fetchWithTenant`. El alias `@lib/` no existe en
`tsconfig.json` — solo existe `@/*` → `src/*`. Este import compila en desarrollo porque
Next.js lo resuelve de forma laxa, pero bloquea en build estricto y confunde al IDE.

### 2. Header `Authorization` manual y redundante

```ts
// Líneas 134-140 — función logout()
const response = await fetchWithTenant(`${API_URL_V2}logout`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,   // ← REDUNDANTE
    'Content-Type': 'application/json',
  },
});
```

`fetchWithTenant` ya inyecta `Authorization: Bearer ${token}` automáticamente en
**todas** las peticiones. Añadirlo manualmente en el `headers` objeto es redundante
y confuso (duplica el header). El token ya se obtiene correctamente con `getAuthToken()`
en la función `logout()` — este cleanup no cambia el patrón de autenticación.

### 3. `console.warn` y `console.error` en producción

```ts
// Línea 143
console.warn('Error al revocar token en backend:', response.status);

// Línea 148
console.error('Error en logout del backend:', error);
```

Logs de consola visibles en producción. La función `logout()` ya está diseñada para
degradar silenciosamente (devuelve `{ ok: false }` en vez de lanzar error). Quitar
los logs es suficiente; no es necesario sustituirlos por `notify.*` porque el logout
falla en background sin bloquear la UX.

## Solución acordada

En `src/services/authService.ts`:

1. Línea 1: `'@lib/fetchWithTenant'` → `'@/lib/fetchWithTenant'`

2. Líneas 136-138: eliminar el campo `Authorization` del objeto `headers` del
   `fetchWithTenant` call en `logout()`. Mantener `'Content-Type': 'application/json'`.
   O eliminar el objeto `headers` completamente si `Content-Type` tampoco es necesario
   (fetchWithTenant lo inyecta solo para peticiones con body, verificar).

3. Línea 143: eliminar `console.warn(...)` — el `if (!response.ok)` puede quedar
   vacío o eliminarse (el valor de retorno `response` ya propaga el estado).

4. Línea 148: eliminar `console.error(...)` — el catch devuelve `{ ok: false }` sin log.

## Adicionalmente — useFieldOperators.ts: eliminar `useQuery<any>`

`src/hooks/useFieldOperators.ts:19` tiene:

```ts
const query = useQuery<any>({
```

El tipo `any` es innecesario: el hook ya extrae `.data`, `.meta`, `.isLoading` con
guards explícitos. La firma correcta es inferida — eliminar `<any>`:

```ts
const query = useQuery({
```

Si se necesita tipado explícito, usar el tipo de retorno del service:
`useQuery<CatalogListResponse<FieldOperator>>`.

Nota: `useFieldOperators.ts` ya es modificado por GAP-030 (inline queryKey). Coordinar
para que ese GAP incluya este fix, o que GAP-031 se aplique primero.

## Referencias e inspiración

- `src/services/storeService.ts` — mismo problema de path alias (corregido en GAP-027)
- `fetchWithTenant.js` — inyecta Authorization automáticamente (documentado en api-client.md)
- PL-NEW-C: redundant auth token passing — no aplica aquí (token obtenido con getAuthToken),
  pero el header manual es igualmente incorrecto.

## Criterios de aceptación

- [ ] `authService.ts` importa desde `@/lib/fetchWithTenant` (con barra)
- [ ] La llamada a `fetchWithTenant` en `logout()` no incluye `Authorization` en headers
- [ ] No hay `console.warn` ni `console.error` en `authService.ts`
- [ ] `useFieldOperators.ts:19` no tiene `useQuery<any>`
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin warnings en los archivos modificados

## Archivos a crear o modificar

**Modificar:**
- `src/services/authService.ts` — path alias + Authorization header + console.*
- `src/hooks/useFieldOperators.ts` — eliminar `<any>` de useQuery (si no lo hace GAP-030 antes)

## Restricciones

- No cambiar la lógica de `logout()` — solo limpiar headers y console
- No cambiar la interfaz pública del hook `useFieldOperators`
- No tocar el resto de funciones de `authService.ts`
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
