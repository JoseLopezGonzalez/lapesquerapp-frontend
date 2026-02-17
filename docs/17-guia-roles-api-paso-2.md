# Guía de implementación — Cambios de Roles en la API (Paso 2)

Este documento sirve como **guía de ejecución** para actualizar el frontend cuando se apruebe la implementación. Incluye el resumen de cambios en la API, el **análisis de impacto en el codebase** y los pasos concretos por archivo.

El backend ya está desplegado con estos cambios.

---

## 1. Resumen en una frase

**Cada usuario tiene un solo rol (string).** Ya no hay varios roles por usuario ni CRUD de roles; solo existe el endpoint de opciones para rellenar el desplegable de “Rol” al crear/editar usuarios.

---

## 2. Valores de rol (lista fija)

El rol es siempre uno de estos **strings**:

| Valor (en API y BD) | Etiqueta para mostrar |
| ------------------- | --------------------- |
| `tecnico`           | Técnico               |
| `administrador`     | Administrador         |
| `direccion`         | Dirección             |
| `administracion`     | Administración        |
| `comercial`         | Comercial             |
| `operario`          | Operario              |

Usar exactamente estos valores al enviar `role` en requests. Para mostrar en UI, usar la etiqueta (o la que devuelve `GET /v2/roles/options`).

---

## 3. Cambios por endpoint (referencia API)

- **Login (`POST /v2/login`)**: respuesta con `user.role` (string), ya no `user.roles` (array).
- **Usuario actual (`GET /v2/me`)**: `role: string`.
- **Listado usuarios (`GET /v2/users`)**: query `role` (string); cada item con `role: string`.
- **Crear usuario (`POST /v2/users`)**: body con `role` (string obligatorio), ya no `role_ids`.
- **Actualizar usuario (`PUT /v2/users/{id}`)**: body con `role?: string` opcional, ya no `role_ids`.
- **Opciones de roles**: solo **`GET /v2/roles/options`** (sigue existiendo). Respuesta `[{ id: string, name: string }]`.
- **Eliminados**: `GET/POST/GET/PUT/DELETE` sobre `/v2/roles` y `/v2/roles/{id}`.

---

## 4. Análisis de impacto en el frontend

A continuación se listan **todos los archivos afectados** y los cambios concretos a realizar.

### 4.1 Autenticación y sesión (rol en token/sesión)

| Archivo | Uso actual | Cambio requerido |
| --------|------------|-------------------|
| `src/app/api/auth/[...nextauth]/route.js` | Normaliza `user.roles` / `user.role` a array y guarda en `token.role`. En refresh lee `currentUser.roles \|\| currentUser.role`. | Guardar **solo** `user.role` (string) en `token.role`. En el callback de refresh usar `currentUser.role` (string). Dejar de normalizar a array; el resto del frontend debe usar `session.user.role` como string. |

**Detalle en `route.js`:**
- En `jwt()` cuando `user`: asignar `token.role = user.role` (string). Eliminar la línea que hace `token.role = Array.isArray(user.roles) ? ...`.
- En el bloque de refresh (`/v2/me`): asignar `token.role = currentUser.role ?? token.role`. Eliminar uso de `currentUser.roles` y la normalización a array.

---

### 4.2 Middleware (protección por rol)

| Archivo | Uso actual | Cambio requerido |
| --------|------------|-------------------|
| `src/middleware.js` | Obtiene `userRoles` como array desde `token.role` y hace `userRoles.some((role) => rolesAllowed.includes(role))`. Usa `rolesAllowed` de `roleConfig`: `admin`, `manager`, `superuser`, `store_operator`, `worker`. | Tratar `token.role` como **string único**. Comparar con `rolesAllowed`: `hasAccess = rolesAllowed.includes(token.role)`. **Importante:** actualizar `roleConfig` para usar los **nuevos valores** (ver sección 4.8). |

---

### 4.3 Configuración de rutas permitidas por rol

| Archivo | Uso actual | Cambio requerido |
| --------|------------|-------------------|
| `src/configs/roleConfig.js` | Valores: `admin`, `manager`, `superuser`, `store_operator`, `worker`. | Sustituir por los **6 valores de la API** según criterio de negocio. Ejemplo de mapeo a definir con producto: `/admin` → `['administrador', 'direccion']`, `/warehouse` → `['operario', 'administrador']`, etc. No usar ya `admin`, `manager`, `superuser`, `store_operator`, `worker`. |

---

### 4.4 Navegación (menús por rol)

| Archivo | Uso actual | Cambio requerido |
| --------|------------|-------------------|
| `src/configs/navgationConfig.js` | `allowedRoles` con valores antiguos: `["admin", "manager", "superuser"]`, `["store_operator"]`, etc. Incluye entrada "Roles" → `/admin/roles`. | 1) Reemplazar todos los `allowedRoles` por los nuevos valores (ej. `administrador`, `direccion`, `operario`, etc.) según quién deba ver cada ítem. 2) **Eliminar** el ítem de menú que enlaza a "Roles" (`/admin/roles`). |
| `src/utils/navigationUtils.js` | `filterNavigationByRoles(items, userRoles)` normaliza `userRoles` a array y usa `roles.includes(role)`. | Aceptar `userRole` (string) o mantener compatibilidad: `const roles = typeof userRoles === 'string' ? [userRoles] : (Array.isArray(userRoles) ? userRoles : [userRoles])`. Así sigue funcionando cuando se pase `session.user.role` (string). |
| `src/app/admin/layout.js` | `session?.user?.role` lo normaliza a array `roles`. | Pasar `session?.user?.role` (string) al filtro; en `navigationUtils` ya se normaliza a array internamente si se desea, o usar directamente un array de un elemento `[session?.user?.role]`. |
| `src/components/Admin/Layout/SideBar/index.js` | Igual: normaliza `session?.user?.role` a array `roles`. | Usar `session?.user?.role` como string y pasar `[session.user.role]` (o el string) a `filterNavigationByRoles` según cómo se deje la utilidad. |
| `src/components/Admin/Layout/Navbar/index.js` | Igual: `userRoles`/`roles` y `allowedRoles?.some((role) => roles.includes(role))`. | Misma idea: origen del rol sea `session.user.role` (string) y comparación con `allowedRoles` (array de nuevos valores). |

---

### 4.5 Protección de rutas y páginas

| Archivo | Uso actual | Cambio requerido |
| --------|------------|-------------------|
| `src/components/AdminRouteProtection/index.js` | Normaliza `session.user.role` a array `userRoles`. | Usar `session.user.role` (string) y comprobar con los roles permitidos (nuevos valores), ej. `allowedRoles.includes(session.user.role)`. |
| `src/components/ProtectedRoute/index.js` | Normaliza `session.user.role` a array y comprueba si algún rol está en `allowedRoles`. | Misma lógica con un solo rol: `allowedRoles.includes(session.user.role)`. |
| `src/app/page.js` | Normaliza `session.user.role` a array. | Usar `session.user.role` (string) para redirección/lógica por rol. |
| `src/app/warehouse/[storeId]/page.js` | Normaliza `session.user.role` a array. | Usar `session.user.role` (string) y comparar con rol(es) permitidos (ej. `operario`). |

---

### 4.6 Permisos por rol en componentes (store_operator / operario)

| Archivo | Uso actual | Cambio requerido |
| --------|------------|-------------------|
| `src/components/Admin/Stores/StoresManager/Store/PositionSlideover/PalletCard/index.js` | `session?.user?.role?.includes('store_operator')`. | Con un solo rol: `session?.user?.role === 'operario'` (o el valor que se asigne a “operario de almacén” en la nueva API). |
| `src/components/Admin/Stores/StoresManager/Store/PalletsListDialog/index.js` | `session?.user?.role?.includes('store_operator')`. | `session?.user?.role === 'operario'` (o el valor acordado). |
| `src/components/Admin/Stores/StoresManager/Store/MapContainer/Map/Position/PositionPopover/index.js` | `session?.user?.role?.includes('store_operator')`. | `session?.user?.role === 'operario'` (o el valor acordado). |

---

### 4.7 Entidad Usuarios (listado, filtros, formularios)

| Archivo | Uso actual | Cambio requerido |
| --------|------------|-------------------|
| `src/configs/entitiesConfig.js` (sección `users`) | Filtro por `roles` (autocomplete, endpoint `roles`). Tabla con columna `roles` (path `roles`). Create form ya tiene campo `role` con `endpoint: "roles/options"`. | 1) **Filtro:** nombre `roles` → `role`; tipo puede seguir siendo autocomplete pero endpoint **`roles/options`**; el valor enviado debe ser un **único** string (ver 4.9). 2) **Tabla:** header `name`/`path` de `roles` → **`role`** (y label "Rol"). 3) Formulario de creación: ya envía `role` (string) si el Autocomplete usa el `id` de las opciones; confirmar que no se envíe `role_ids`. |

**Cambios concretos en `entitiesConfig.js` (users):**
- En `filtersGroup.groups.generals.filters`: cambiar el filtro de `name: "roles"`, `endpoint: "roles"` a `name: "role"`, `endpoint: "roles/options"`. Label "Rol" y placeholder "Seleccionar rol".
- En `table.headers`: cambiar `{ name: "roles", label: "Rol", type: "text", path: "roles", ... }` a `{ name: "role", label: "Rol", type: "text", path: "role", ... }`.

---

### 4.8 Filtros genéricos (query param `role` vs `roles[]`)

| Archivo | Uso actual | Cambio requerido |
| --------|------------|-------------------|
| `src/lib/entity/filtersHelper.js` | Para arrays hace `queryParams.append(\`${key}[]\`, item.id \|\| item)`. El filtro de usuarios se llama `roles` y puede enviar array. | Para el filtro **`role`** (usuarios), el backend espera **un solo** query param `role=<string>`. Si el filtro de listado de usuarios pasa a ser un único valor (select), el helper ya trata valores primitivos con `queryParams.append(key, value)`. Asegurar que en la UI del filtro de usuarios se envíe un solo valor (string) en la clave `role`, no array (o si se envía array de un elemento, que el helper o el servicio envíe solo `role=valor`). Revisar cómo el componente de filtros construye el objeto de filtros para la entidad users. |

---

### 4.9 Entidad Roles (CRUD eliminado en API)

| Archivo | Uso actual | Cambio requerido |
| --------|------------|-------------------|
| `src/configs/navgationConfig.js` | Enlace "Roles" → `/admin/roles`. | Quitar el ítem de menú "Roles" dentro de Usuarios (mantener "Todos los Usuarios"). |
| `src/configs/entitiesConfig.js` | Sección `roles` con endpoint, viewRoute, createRedirect, table, createForm, editForm, etc. | Opción A: eliminar por completo la clave `roles` del config y cualquier referencia a ella (rutas dinámicas `/admin/[entity]` dejarían de tener datos para "roles"). Opción B: mantener la clave pero ocultar la ruta desde el menú; si alguien entra en `/admin/roles`, la lista fallará porque GET /v2/roles ya no existe. **Recomendación:** eliminar la entrada de menú y, si se usa una lista de entidades dinámicas, excluir `roles` de la lista de entidades accesibles (o eliminar `roles` del config). |
| `src/services/domain/roles/roleService.js` | Métodos: `list`, `getById`, `create`, `update`, `delete`, `deleteMultiple`, `getOptions`. | **Mantener solo `getOptions()`** que llama a `GET .../roles/options`. Eliminar o no usar: `list`, `getById`, `create`, `update`, `delete`, `deleteMultiple`. Si el mapper sigue exponiendo `roles` para algo más que opciones, se puede dejar el servicio con solo `getOptions` y que el resto no se invoque. |
| `src/services/domain/entityServiceMapper.js` | Mapea `'roles': roleService`. | Mantener el mapeo para que `getEntityService('roles')` exista y se use solo para cargar opciones (p. ej. desde entidad `users` con endpoint `roles/options`). El `getOptions` del roleService debe apuntar a `roles/options`. |
| `src/lib/ai/tools/entityTools.js` | `AVAILABLE_ENTITIES` incluye `'roles'`. | **Quitar** `'roles'` de `AVAILABLE_ENTITIES` para que el AI no intente listar/crear/editar roles. |

---

### 4.10 Documentación y referencias

| Archivo | Uso actual | Cambio requerido |
| --------|------------|-------------------|
| `docs/API-references/sistema/README.md` | Documenta endpoints de roles (GET/POST/PUT/DELETE) y usuarios con `role_ids`. | Actualizar para reflejar: solo `GET /v2/roles/options`; usuarios con `role` (string); eliminar documentación de CRUD de roles. |
| `docs/11-AUTENTICACION-AUTORIZACION.md` | Ejemplos con `session.user.role` (incluye `store_operator`, `superuser`). | Actualizar ejemplos a `user.role` (string) y a los nuevos valores de rol si se citan. |

---

## 5. Tipos / TypeScript (si se usan)

Si en el proyecto se añaden o se usan tipos para usuario y roles:

```ts
export type RoleValue =
  | 'tecnico'
  | 'administrador'
  | 'direccion'
  | 'administracion'
  | 'comercial'
  | 'operario';

export interface User {
  id: number;
  name: string;
  email: string;
  assignedStoreId?: number;
  companyName?: string | null;
  companyLogoUrl?: string | null;
  role: RoleValue;
  created_at?: string;
  updated_at?: string;
  active?: boolean;
}

export interface RoleOption {
  id: RoleValue;
  name: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: RoleValue;
  active?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: RoleValue;
  active?: boolean;
}
```

---

## 6. Comprobar permisos en UI

Sustituir cualquier comprobación sobre array de roles por una sobre el rol único:

- **Antes:** `user.roles.includes('admin')`, `user.roles.some(r => ['admin', 'manager'].includes(r))`, `session?.user?.role?.includes('store_operator')`.
- **Ahora:** `user.role === 'administrador'`, `['tecnico', 'administrador'].includes(user.role)`, `session?.user?.role === 'operario'`.

Aplicar en todos los archivos listados en 4.4, 4.5 y 4.6.

---

## 7. Mapeo de roles antiguos → nuevos (a definir con producto)

El frontend actual usa roles como `admin`, `manager`, `superuser`, `store_operator`, `worker`. La API nueva solo devuelve: `tecnico`, `administrador`, `direccion`, `administracion`, `comercial`, `operario`.

Hay que definir **qué rol(es) nuevo(s) pueden acceder a cada ruta/menú**:

| Uso actual | Sugerencia (ejemplo) | Nota |
| ----------|---------------------|------|
| `/admin` (admin, manager, superuser) | p. ej. `administrador`, `direccion` | Definir con negocio. |
| `/warehouse` (store_operator, superuser) | p. ej. `operario`, `administrador` | `operario` como equivalente a “operario de almacén”. |
| `/production` (admin, worker, superuser) | p. ej. `operario`, `tecnico`, `administrador` | Definir con negocio. |
| Menús “admin/manager/superuser” | Sustituir por los nuevos que correspondan. | Actualizar `roleConfig.js` y `navgationConfig.js`. |

Hasta que no se fije este mapeo, no se pueden reemplazar de forma definitiva los valores en `roleConfig.js` y en `allowedRoles` de la navegación.

---

## 8. Orden sugerido de implementación

1. **Token y sesión:** `src/app/api/auth/[...nextauth]/route.js` — guardar `user.role` (string) y usarlo en refresh.
2. **Configuración de roles por ruta:** `src/configs/roleConfig.js` — pasar a los 6 valores nuevos según mapeo acordado.
3. **Navegación:** `src/configs/navgationConfig.js` — actualizar `allowedRoles` y quitar enlace "Roles"; `src/utils/navigationUtils.js` si hace falta aceptar rol string.
4. **Layouts y barras:** `src/app/admin/layout.js`, `src/components/Admin/Layout/SideBar/index.js`, `src/components/Admin/Layout/Navbar/index.js` — usar `session.user.role` (string) y comparar con los nuevos `allowedRoles`.
5. **Middleware:** `src/middleware.js` — tratar `token.role` como string y usar `roleConfig` ya actualizado.
6. **Protección de rutas:** `AdminRouteProtection`, `ProtectedRoute`, `src/app/page.js`, `src/app/warehouse/[storeId]/page.js` — mismo criterio con rol único.
7. **Componentes con “store_operator”:** PalletCard, PalletsListDialog, PositionPopover — cambiar a `session?.user?.role === 'operario'` (o valor acordado).
8. **Entidad usuarios:** `entitiesConfig.js` (users) — filtro `role` con `roles/options`, tabla con columna `role`.
9. **Filtros:** asegurar que el filtro de listado de usuarios envíe `role` (string) en query.
10. **CRUD roles:** quitar menú "Roles"; en `entityTools.js` quitar `'roles'` de entidades; en `roleService.js` dejar solo `getOptions`; en `entitiesConfig.js` eliminar o no exponer la entidad `roles`.
11. **Docs:** actualizar `docs/API-references/sistema/README.md` y `docs/11-AUTENTICACION-AUTORIZACION.md`.

---

## 9. Checklist de verificación

- [ ] Login y `/v2/me`: frontend usa `user.role` (string); token/sesión guardan un solo rol.
- [ ] `roleConfig.js` y `allowedRoles` usan solo los 6 valores nuevos.
- [ ] Menú: sin enlace a "Roles"; ítems filtrados por `session.user.role` (string).
- [ ] Middleware y protecciones de ruta usan `token.role` / `session.user.role` como string.
- [ ] Listado usuarios: columna "Rol" con `path: "role"`; filtro por `role` (string) con opciones desde `GET /v2/roles/options`.
- [ ] Crear usuario: body con `role` (string); sin `role_ids`.
- [ ] Editar usuario (si existe): enviar `role` (string) si se cambia.
- [ ] No hay pantallas ni llamadas a GET/POST/PUT/DELETE sobre `/v2/roles` ni `/v2/roles/{id}`.
- [ ] AI tools: `roles` no está en `AVAILABLE_ENTITIES`.
- [ ] Componentes que comprobaban `store_operator` usan el nuevo valor (ej. `operario`).
- [ ] Tests/E2E: actualizar datos y aserciones que usen `roles` o `role_ids`.

---

## 10. Errores frecuentes si no se actualiza

- **401/403 o datos raros en login/me:** Si el frontend sigue esperando `user.roles` (array), ese campo ya no existe; hay que usar `user.role`.
- **422 al crear usuario:** Enviar `role` (string) obligatorio; no enviar `role_ids`.
- **Select de rol vacío o con IDs numéricos:** Las opciones deben venir de `GET /v2/roles/options`; el valor enviado en el body es el `id` (string, ej. `"tecnico"`).
- **Pantallas de "Roles" rotas:** Esos endpoints ya no existen; quitar menú y uso de CRUD roles; usar solo `roles/options` para el select en usuarios.

---

## 11. Resumen de archivos a tocar

Lista única de rutas para localizar todos los cambios:

```
src/app/api/auth/[...nextauth]/route.js
src/app/admin/layout.js
src/app/page.js
src/app/warehouse/[storeId]/page.js
src/configs/roleConfig.js
src/configs/navgationConfig.js
src/configs/entitiesConfig.js
src/middleware.js
src/utils/navigationUtils.js
src/components/Admin/Layout/SideBar/index.js
src/components/Admin/Layout/Navbar/index.js
src/components/AdminRouteProtection/index.js
src/components/ProtectedRoute/index.js
src/components/Admin/Stores/StoresManager/Store/PositionSlideover/PalletCard/index.js
src/components/Admin/Stores/StoresManager/Store/PalletsListDialog/index.js
src/components/Admin/Stores/StoresManager/Store/MapContainer/Map/Position/PositionPopover/index.js
src/lib/entity/filtersHelper.js
src/services/domain/roles/roleService.js
src/lib/ai/tools/entityTools.js
docs/API-references/sistema/README.md
docs/11-AUTENTICACION-AUTORIZACION.md
```

---

## 12. Referencias

- Contrato detallado de usuarios y roles: `docs/API-references/sistema/README.md`.
- Autenticación (login, me): `docs/API-references/autenticacion/README.md`.
