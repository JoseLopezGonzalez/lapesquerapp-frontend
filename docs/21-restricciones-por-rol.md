# Restricciones por rol en el frontend

Este documento detalla **dónde** y **cómo** se aplican las restricciones por rol en la aplicación (middleware, menús, páginas y componentes). Los valores de rol son los de la API: `tecnico`, `administrador`, `direccion`, `administracion`, `comercial`, `operario`.

---

## 1. Middleware (acceso por ruta)

**Archivo:** `src/middleware.js`  
**Configuración:** `src/configs/roleConfig.js`

El middleware comprueba si el usuario tiene un rol permitido para la ruta solicitada. Si no, redirige a `/unauthorized` (o a `/warehouse/{assignedStoreId}` en el caso especial del operario).

| Ruta / prefijo   | Roles permitidos |
|------------------|------------------|
| `/admin`         | `administrador`, `direccion`, `tecnico` |
| `/production`    | `administrador`, `direccion`, `operario`, `tecnico` |
| `/admin/orders`  | `administrador`, `direccion`, `tecnico` |
| `/warehouse`     | `operario`, `administrador`, `tecnico` |

**Excepción:** Si el usuario tiene rol **`operario`** e intenta acceder a cualquier ruta bajo `/admin`, no se le muestra “no autorizado” directamente: se redirige a **`/warehouse/{assignedStoreId}`**. Si no tiene `assignedStoreId`, entonces sí se redirige a `/unauthorized`.

**Rutas afectadas:** Todas las que coinciden con el matcher del middleware: `/admin/*`, `/production/*`, `/warehouse/*`.

---

## 2. Menú y navegación (visibilidad de ítems)

**Archivos de configuración:**
- `src/configs/navgationConfig.js` (menú principal y ítems)
- Mismo archivo: `navigationManagerConfig` (gestores, bottom nav, etc.)

**Dónde se usa la restricción:**
- `src/utils/navigationUtils.js` → `filterNavigationByRoles()`
- `src/app/admin/layout.js` (menú filtrado para el layout admin)
- `src/components/Admin/Layout/SideBar/index.js`
- `src/components/Admin/Layout/Navbar/index.js`

Cada ítem del menú tiene `allowedRoles`. Solo se muestra si el rol del usuario está en ese array.

**Resumen por tipo de ítem:**

| Tipo de ítem | allowedRoles |
|---------------|--------------|
| Casi todo el menú (Inicio, Almacenes, Recepciones, Pedidos, Productos, Transportes, Usuarios, Sesiones, Gestión Horaria, gestores, etc.) | `["administrador", "direccion", "tecnico"]` |
| **Producciones** | `["administrador", "direccion", "operario", "tecnico"]` |
| Salidas de Cebo (dentro de `navigationManagerConfig`) | `["direccion", "tecnico"]` |

Si el rol del usuario no está en `allowedRoles`, ese ítem no se muestra (no puede hacer clic en él).

---

## 3. Protección del layout admin (redirección operario)

**Archivo:** `src/components/AdminRouteProtection/index.js`  
**Uso:** Envuelve todo el contenido en `src/app/admin/layout.js`.

- Si el usuario está autenticado y su rol es **`operario`**, no se muestra el contenido del admin: se muestra un loader y en el `useEffect` se redirige a **`/warehouse/{assignedStoreId}`**.
- En la práctica: **operario no puede “quedarse” en el área admin**; se le envía al warehouse.

---

## 4. Página de login / home (redirección tras login)

**Archivo:** `src/app/page.js`

Con subdominio y usuario autenticado:

- Si **`userRole === "operario"`** y tiene **`assignedStoreId`** → redirige a **`/warehouse/{assignedStoreId}`**.
- En cualquier otro caso → redirige a **`/admin/home`**.

Restricción: los **operarios** van siempre al warehouse; el resto al admin.

---

## 5. Página de warehouse (acceso y almacén permitido)

**Archivo:** `src/app/warehouse/[storeId]/page.js`

**Quién puede entrar a `/warehouse/*`:**
- Solo si **`userRole === "operario"`**, **`userRole === "administrador"`** o **`userRole === "tecnico"`**.
- Cualquier otro rol → `router.push("/unauthorized")`.

**Operario y almacén concreto:**
- Si **`role === "operario"`** y **`assignedStoreId !== storeId`** (el de la URL), no se muestra la app del almacén: se muestra pantalla de “no autorizado” con botón para ir al almacén correcto.

Resumen: **operario**, **administrador** y **tecnico** pueden usar warehouse; el **operario** solo su almacén asignado; **tecnico** y **administrador** pueden entrar en cualquier almacén.

---

## 6. UI condicional (operario no puede reubicar)

**Archivos:**
- `src/components/Admin/Stores/StoresManager/Store/PositionSlideover/PalletCard/index.js`
- `src/components/Admin/Stores/StoresManager/Store/PalletsListDialog/index.js`
- `src/components/Admin/Stores/StoresManager/Store/MapContainer/Map/Position/PositionPopover/index.js`

En los tres:
- `const isStoreOperator = session?.user?.role === 'operario'`
- Esa variable se usa para **ocultar o deshabilitar la acción “Reubicar”** (palets/posiciones).

Restricción: el rol **operario** no ve o no puede usar la opción de reubicar en esos componentes.

---

## 7. ProtectedRoute (componente genérico)

**Archivo:** `src/components/ProtectedRoute/index.js`

- Recibe **`allowedRoles`** y comprueba **`session?.user?.role`** con `allowedRoles?.includes(userRole)`.
- Si no tiene acceso → redirige a **`/unauthorized`**.

**Uso actual:** No se usa en ninguna página del código; solo se referencia en documentación. Las restricciones reales están en middleware, AdminRouteProtection, `page.js` y `warehouse/[storeId]/page.js`.

---

## Resumen por rol

| Rol                | Comportamiento |
|--------------------|----------------|
| **administrador**  | Acceso a `/admin`, `/warehouse`, `/production`. Ve todo el menú que incluye `administrador` en `allowedRoles`. |
| **direccion**      | Mismo acceso que administrador en rutas y menú. Un ítem (Salidas de Cebo en managers) solo para `direccion`. |
| **operario**       | No puede “quedarse” en `/admin` (redirección a warehouse). Solo `/warehouse` y solo su almacén. En menú admin solo vería Producciones si se le mostrara el menú. No puede reubicar en PalletCard / PalletsListDialog / PositionPopover. |
| **tecnico**        | Mismo acceso que administrador y direccion: `/admin`, `/warehouse`, `/production` y todo el menú. Puede entrar en cualquier almacén (sin restricción de `assignedStoreId`). |
| **administracion** | No está en `roleConfig` ni en `allowedRoles` del menú: no puede entrar en `/admin`, `/warehouse` ni `/production` por el middleware y no vería ítems del menú. |
| **comercial**      | Igual que administracion: sin acceso a esas rutas ni ítems de menú. |

---

## Referencia rápida de archivos

| Archivo | Qué restringe |
|--------|----------------|
| `src/configs/roleConfig.js` | Definición de roles por ruta (middleware). |
| `src/configs/navgationConfig.js` | `allowedRoles` por ítem de menú y por gestor. |
| `src/middleware.js` | Acceso a rutas según `roleConfig` y excepción operario → warehouse. |
| `src/utils/navigationUtils.js` | Filtrado del menú según `allowedRoles`. |
| `src/app/admin/layout.js` | Uso del menú filtrado y de AdminRouteProtection. |
| `src/components/AdminRouteProtection/index.js` | Operario no puede usar layout admin (redirección). |
| `src/app/page.js` | Redirección post-login (operario → warehouse, resto → admin). |
| `src/app/warehouse/[storeId]/page.js` | Solo operario/administrador; operario solo su almacén. |
| `src/components/Admin/Stores/.../PalletCard/index.js` | Operario: sin reubicar. |
| `src/components/Admin/Stores/.../PalletsListDialog/index.js` | Operario: sin reubicar. |
| `src/components/Admin/Stores/.../PositionPopover/index.js` | Operario: sin reubicar. |
| `src/components/ProtectedRoute/index.js` | Lógica genérica por `allowedRoles` (no usado en rutas actuales). |

---

*Documento generado a partir del análisis del codebase tras la implementación de roles (API Paso 2).*
