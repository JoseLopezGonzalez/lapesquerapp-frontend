# Patrón: Rutas por rol (role-based routing)

**Estado**: Aplicado  
**Última actualización**: 2025-02-17

---

## Objetivo

Separar la URL por **rol** de forma clara: cada rol tiene su propio segmento en la aplicación. Así se evita que rutas de administración (`/admin/...`) mezclen flujos que solo aplican a un rol (por ejemplo operario) y se facilita extender otros roles en el futuro.

---

## Segmentos por rol

| Rol           | Segmento base | Uso actual |
|---------------|---------------|------------|
| **operario**  | `/operator`   | Dashboard, Nueva recepción, Nueva salida de cebo |
| **administrador, dirección, técnico** | `/admin` | Resto de la aplicación (listados, CRUD, gestores, etc.) |

En el futuro se pueden añadir, por ejemplo:

- `/technician` para flujos exclusivos de técnico
- `/production` ya existe para producción

---

## Reglas

1. **Una sola entrada por rol**  
   El operario solo tiene tres vistas propias: dashboard, crear recepción y crear salida de cebo. Todas viven bajo `/operator`. No usa `/admin/home` ni `/admin/.../create` para esos flujos.

2. **Redirección en middleware**  
   Si un operario intenta acceder a cualquier ruta bajo `/admin`, el middleware lo redirige a `/operator`. Así no llega al layout ni al menú de administración.

3. **Config centralizada**  
   Las rutas del operario se definen en `src/configs/roleRoutesConfig.js` (`OPERATOR_BASE`, `operatorRoutes`). Los componentes usan esas constantes en lugar de strings sueltos para enlaces y redirecciones.

4. **Login**  
   Tras el login, el operario va a `/operator` y el resto de roles a `/admin/home` (o a la URL guardada en `from` si es segura). Ver `getRedirectUrl` en `src/utils/loginUtils.ts`.

5. **Gestores: rutas bajo `/operator`**  
   Para que el operario pueda usar Preparación de pedidos, Almacenes interactivos y Fichaje NFC sin entrar en `/admin`, existen rutas propias bajo `/operator` (p. ej. `/operator/stores-manager`) que **reutilizan el mismo componente** que la página de admin. En la navegación (`navigationManagerConfig`) hay una entrada por gestor para operario (href `/operator/...`) y otra para el resto de roles (href `/admin/...`). Es la opción elegida para mantener un solo layout y evitar que `AdminRouteProtection` bloquee al operario.

---

## Rutas del operario (`/operator`)

| Ruta | Descripción |
|------|-------------|
| `GET /operator` | Dashboard (resumen, accesos a Nueva recepción y Nueva salida de cebo) |
| `GET /operator/receptions/create` | Formulario de nueva recepción de materia prima (flujo operario) |
| `GET /operator/dispatches/create` | Formulario de nueva salida de cebo (flujo operario) |
| `GET /operator/orquestador` | Preparación de pedidos (mismo componente que `/admin/orquestador`) |
| `GET /operator/stores-manager` | Almacenes interactivos (mismo componente que `/admin/stores-manager`) |
| `GET /operator/nfc-punch-manager` | Fichaje automático NFC (mismo componente que `/admin/nfc-punch-manager`) |

El **mismo layout** que el área de administración (sidebar + TopBar + BottomNav en móvil) se reutiliza en `/operator`. La navegación se filtra por rol: el operario ve Inicio, Nueva recepción, Nueva salida de cebo y, en la sección **Gestores**, Preparación de pedidos, Almacenes interactivos y Fichaje automático NFC. Esas tres últimas tienen **rutas propias bajo `/operator`** que reutilizan exactamente el mismo componente que admin; así el operario nunca entra en `/admin` y se evita conflicto con `AdminRouteProtection`.

---

## Archivos implicados

| Archivo | Responsabilidad |
|---------|------------------|
| `src/configs/roleRoutesConfig.js` | Constantes de rutas por rol (`OPERATOR_BASE`, `operatorRoutes`, `adminRoutes`) |
| `src/configs/navgationConfig.js` | Tres ítems con `allowedRoles: ["operario"]` (Inicio /operator, Nueva recepción, Nueva salida de cebo) |
| `src/configs/roleConfig.ts` | Mapa ruta → roles permitidos (middleware) |
| `src/middleware.ts` | Redirige operario desde `/admin` a `/operator`; protege `/operator` solo para operario |
| `src/app/operator/layout.js` + `OperatorLayoutClient.jsx` | Mismo ResponsiveLayout que admin; nav filtrada por rol (solo 3 ítems para operario) |
| `src/app/operator/page.js` | Página dashboard operario |
| `src/app/operator/receptions/create/page.js` | Crear recepción (operario) |
| `src/app/operator/dispatches/create/page.js` | Crear salida de cebo (operario) |
| `src/app/operator/orquestador/page.js` | Preparación de pedidos (reutiliza `OrquestadorView`) |
| `src/app/operator/stores-manager/page.js` | Almacenes interactivos (reutiliza `StoresManager`) |
| `src/app/operator/nfc-punch-manager/page.js` | Fichaje NFC (reutiliza `NFCPunchManager`) |
| `src/utils/loginUtils.ts` | Redirección post-login (operario → `/operator`) |
| `src/components/AdminRouteProtection/index.tsx` | Redirige operario que llegue a admin hacia `/operator` |

Componentes que enlazan a flujos operario (usan `operatorRoutes`):

- `ReceptionsListCard`, `DispatchesListCard` (enlaces “Nueva recepción” / “Nueva salida de cebo”)
- `ReceptionSuccessActions` (prop `createCeboHref` para ir a crear salida de cebo desde éxito de recepción)

---

## Extender a nuevos roles

1. Añadir el segmento en `src/app/<rol>/` (por ejemplo `src/app/technician/`).
2. Definir las rutas en `roleRoutesConfig.js` (por ejemplo `technicianRoutes`).
3. Registrar en `roleConfig.ts` las rutas y el rol que puede acceder.
4. Añadir el segmento al `matcher` del middleware si debe estar protegido.
5. En `getRedirectUrl`, si aplica, redirigir ese rol a su segmento base tras el login.

---

## Referencias

- Middleware y RBAC: [Next.js middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware), buenas prácticas de RBAC con App Router.
- Rutas actuales operario: `operatorRoutes` en `src/configs/roleRoutesConfig.js`.
