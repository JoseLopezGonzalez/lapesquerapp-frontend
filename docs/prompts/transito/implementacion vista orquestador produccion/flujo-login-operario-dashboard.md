# Flujo de login y acceso al dashboard (rol operario)

## Resumen del trazado

Se ha revisado el flujo completo desde el login hasta la visualización del Panel de Control. El flujo es correcto; se han aplicado pequeños ajustes para robustez y consistencia.

---

## 1. Rutas y middleware

| Ruta | ¿En matcher? | Comportamiento |
|------|----------------|----------------|
| `/` | No | No pasa por middleware. Operario autenticado es redirigido en cliente a `/warehouse/{assignedStoreId}`. |
| `/auth/verify` | No | No pasa por middleware. Tras canjear magic link, `signIn` + redirect a `/warehouse/{assignedStoreId}`. |
| `/warehouse/:path*` | Sí | Token requerido. `roleConfig["/warehouse"]` = operario, administrador, tecnico → acceso permitido. |
| `/admin/*` | Sí | Si operario intenta entrar → middleware redirige a `/warehouse/{assignedStoreId}` (o `/unauthorized` si no tiene assignedStoreId). |

Conclusión: no hace falta cambiar permisos en middleware para que el operario vea el dashboard.

---

## 2. Flujo de login (dos variantes)

### 2.1 Login por OTP (página principal `/`)

1. Usuario en subdominio (ej. `brisamar.lapesquerapp.es`) → se muestra `LoginPage`.
2. Introduce email → solicita acceso → recibe código → introduce código → `verifyOtp()` → `signIn("credentials", ...)`.
3. `getRedirectUrl(data.user)`: si `user.role === "operario"` y `user.assignedStoreId` → devuelve `/warehouse/{assignedStoreId}`.
4. `window.location.href = getRedirectUrl(...)` → navega a `/warehouse/X`.
5. Petición a `/warehouse/X`: middleware tiene token (cookie de sesión), `hasAccess` true → `NextResponse.next()`.
6. Página `warehouse/[storeId]/page.js`: comprueba sesión, carga almacén, si rol operario → renderiza `OperarioDashboard`.

### 2.2 Login por magic link (`/auth/verify`)

1. Usuario abre enlace con `?token=...` → carga `/auth/verify`.
2. `verifyMagicLinkToken(token)` → `signIn("credentials", ...)` → `getRedirectUrl(data.user)` → operario → `/warehouse/{assignedStoreId}`.
3. `window.location.href = redirectUrl` → misma secuencia que desde 4. del flujo OTP.

---

## 3. Página warehouse (`/warehouse/[storeId]/page.js`)

- **Sin sesión**: `router.push("/")` (login).
- **Rol no permitido** (distinto de operario, administrador, tecnico): `router.push("/unauthorized")`.
- **Operario sin `assignedStoreId`**: `router.replace("/unauthorized")` (ajuste aplicado).
- **Operario con `assignedStoreId` distinto del `storeId` de la URL**: pantalla “Acceso no autorizado” con botón “Ir a mi almacén asignado” → `router.push(/warehouse/{assignedId})`. Comparación hecha con `Number(assignedStoreId)` y `Number(storeId)` para evitar fallos si el backend envía string (ajuste aplicado).
- **Operario en su almacén** o admin/tecnico: se carga el almacén con `getStore(storeId, session.user.accessToken)`. Si falla (ej. 403) → `router.push("/unauthorized")`.
- **Render**: si operario → `OperarioDashboard`; si no → `Store` (mapa).

Sesión: `session.user` incluye `accessToken` (NextAuth lo guarda en JWT/session desde `credentials`), por lo que las llamadas a API (p. ej. `getStore`, listados del dashboard) tienen token.

---

## 4. Rutas anidadas (crear recepción / salida)

- **`/warehouse/[storeId]/receptions/create`**
- **`/warehouse/[storeId]/dispatches/create`**

Ambas están bajo el matcher `/warehouse/:path*`, así que requieren token y rol permitido. Se ha añadido comprobación explícita para operario:

- Si `role === "operario"` y no tiene `assignedStoreId` → `router.replace("/unauthorized")`.
- Si tiene `assignedStoreId` pero no coincide con `storeId` de la URL → `router.replace(/warehouse/{assignedId})`.

Así el operario solo puede usar “Nueva Recepción +” / “Nueva Salida +” en la URL de su propio almacén; si manipula la URL para otro almacén, se le redirige al suyo o a `/unauthorized`.

---

## 5. Cambios realizados en código

1. **`src/app/warehouse/[storeId]/page.js`**
   - Operario sin `assignedStoreId` → `router.replace("/unauthorized")` en lugar de mostrar pantalla de “otro almacén”.
   - Comparación de almacén con `Number(assignedStoreId)` y `Number(storeId)` para ser tolerante a string/number.

2. **`src/app/warehouse/[storeId]/receptions/create/page.js`**
   - Comprobación de rol operario y que `storeId` coincida con `assignedStoreId`; si no, redirección a su warehouse o a `/unauthorized`.

3. **`src/app/warehouse/[storeId]/dispatches/create/page.js`**
   - Misma comprobación que en receptions/create.

---

## 6. Conclusión

- Los usuarios con rol **operario** pueden iniciar sesión (OTP o magic link) y son redirigidos a `/warehouse/{assignedStoreId}`.
- El middleware ya permite `/warehouse` para operario y redirige a warehouse (o `/unauthorized`) si intentan acceder a `/admin`.
- La página warehouse muestra el dashboard para operario y carga datos con el token de sesión.
- No ha sido necesario cambiar permisos en `roleConfig` ni en el matcher del middleware; solo se han añadido validaciones en cliente para operario sin almacén y para rutas de creación en un almacén que no es el asignado.
