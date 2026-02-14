# Hallazgos: Multi-tenancy

**Documento de soporte a**: `docs/audits/nextjs-frontend-global-audit.md`  
**Fecha**: 2026-02-14

---

## Resumen

El proyecto implementa multi-tenancy por **subdominio**. El tenant se deriva del host (en cliente: `window.location.host`; en servidor: `headers().get('host')`) y se envía en todas las peticiones al backend mediante la cabecera **`X-Tenant`**. No existe un Context de React que exponga el tenant actual a la UI; la obtención es vía utilidad o implícita en `fetchWithTenant`.

---

## Implementación actual

### 1. Inyección de tenant en API

- **`src/lib/fetchWithTenant.js`**: Función central que:
  - En **servidor**: usa `reqHeaders` si se pasan (p. ej. desde middleware) o `headers()` de `next/headers` para leer `host` y extraer el subdominio.
  - En **cliente**: usa `window.location.host` y extrae el primer segmento (subdominio).
  - Añade `X-Tenant` a todas las peticiones.
  - Maneja errores 401/403 y coordina con el flag de logout en `sessionStorage` para no disparar redirecciones durante el cierre de sesión.

- **Servicios y API**: Los servicios en `src/services/` y `apiRequest` en `lib/api/apiHelpers.js` usan `fetchWithTenant`, por lo que todas las llamadas al backend llevan el tenant correcto.

### 2. Middleware

- **`src/middleware.js`**: Obtiene el tenant del `host` de la request, valida el token con el backend (`/api/v2/me`) usando `fetchWithTenant` y pasa `req.headers` para que el tenant en servidor sea correcto. Redirige a login si no hay token o está expirado/inválido.

### 3. Utilidad de tenant en cliente

- **`src/lib/utils/getCurrentTenant.js`**: Devuelve el tenant actual según `window.location.host` (con reglas para localhost). Documentado que debe usarse en momento de uso (p. ej. dentro de `useEffect`), no en render inicial, para reflejar la pestaña actual.

### 4. Rutas API Next.js

- **`api/submit-entity`**, **`api/chat`**: Reciben la request del cliente y reenvían al backend; el tenant se propaga si las llamadas desde el cliente usan `fetchWithTenant` o si la ruta vuelve a usar `fetchWithTenant` con los headers de la request (en submit-entity se pasa autorización y user-agent; el tenant en rutas API habría de inyectarse desde `headers().get('host')` si se usa `fetchWithTenant` sin pasar headers).

---

## Aislamiento de datos en UI

- **Estado y caché**: No hay React Query ni SWR. El estado de listados y detalles vive en estado local de componentes/hooks. No existe una “caché por tenant” explícita; el aislamiento se basa en que cada pestaña/origen tiene un host (y por tanto un tenant) y todas las peticiones llevan su `X-Tenant`. Si el usuario cambiara de subdominio en la misma app (p. ej. sin recargar), no hay mecanismo que invalide estado del tenant anterior; en la práctica, el cambio de tenant implica otra URL y típicamente otra carga de la app.
- **Contextos**: Ningún contexto almacena el tenant actual; componentes que lo necesiten deben usar `getCurrentTenant()` (o leer de `window`). No hay “tenant switching” en UI; el cambio de tenant es por URL/subdominio.

---

## Puntos fuertes

- Una sola función (`fetchWithTenant`) para inyección de tenant en servidor y cliente.
- Middleware valida sesión con el mismo tenant que usará la app.
- Servicios y `apiRequest` pasan por la misma capa, por lo que no hay llamadas “sin tenant” al backend desde el frontend.
- Reglas de localhost (subdominio opcional, default `dev`) bien definidas.

---

## Riesgos y mejoras

1. **Rutas API Next.js**: Confirmar que en todas las rutas que llaman al backend (submit-entity, chat, etc.) se use `fetchWithTenant` (o equivalente) y que el tenant se tome de los headers de la request en servidor, para que no se use siempre un tenant por defecto.
2. **Contexto de tenant (opcional)**: Un `TenantProvider` que exponga el tenant actual (y quizá `setTenant` si en el futuro hubiera cambio de tenant en UI) unificaría el acceso y permitiría mostrar el tenant en layout o en depuración.
3. **Cambio de tenant sin recarga**: Si en el futuro se permite cambiar de tenant sin cambiar de URL, habría que invalidar todo el estado (y cualquier caché futura) asociado al tenant anterior.

---

## Conclusión

La madurez multi-tenant es **alta (8/10)** en lo que respecta a identificación del tenant y envío correcto al backend. La principal mejora sería documentar explícitamente el flujo en rutas API y, si la UI necesita mostrar o depender del tenant en muchos sitios, centralizarlo en un contexto o hook único.
