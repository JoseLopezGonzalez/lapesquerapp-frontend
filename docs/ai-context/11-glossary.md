# Glossary — La PesquerApp Frontend

## EntityClient

Componente React en `src/components/Admin/Entity/EntityClient/index.js` (769 líneas) que genera pantallas CRUD completas a partir de un objeto de configuración. Recibe un `config` de `entitiesConfig.js` y renderiza tabla, filtros, modales de creación/edición, exportaciones y paginación.

## entitiesConfig.js

Archivo de configuración en `src/configs/entitiesConfig.js` (117KB). Define el comportamiento de cada entidad de admin: columnas, filtros, formularios, rutas, exportaciones. Es el archivo de configuración más importante del proyecto — modificar con precaución.

## Tenant

Empresa/cliente en el sistema multi-tenant. Cada tenant tiene sus propios datos aislados en el backend.

## X-Tenant

Cabecera HTTP que el frontend añade en cada petición para indicar al backend qué tenant está activo. Se detecta automáticamente del subdominio del Host. Nunca hardcodear.

## fetchWithTenant

Función en `src/lib/fetchWithTenant.js`. Es el único punto de salida HTTP del frontend. Añade automáticamente `X-Tenant`, `Authorization: Bearer` y gestiona errores 401/403.

## getAuthToken

Función en `src/lib/auth/getAuthToken.ts`. Obtiene el JWT de la sesión NextAuth. Usada por todos los servicios antes de cada petición.

## Service layer

Capa de servicios de dominio en `src/services/domain/`. 31 servicios, uno por entidad de negocio. Encapsulan toda la comunicación con la API del backend.

## fetchEntitiesGeneric / helpers genéricos

Funciones en `src/services/generic/`. Son los helpers privados que usan los servicios de dominio para hacer peticiones HTTP. Llaman a `fetchWithTenant` internamente.

## actorType

Campo de la sesión JWT: `'internal_user'` (empleados) o `'external_user'` (clientes del portal externo). Determina qué rutas puede acceder el usuario.

## roleConfig

Objeto en `src/configs/roleConfig.ts` que mapea roles a rutas permitidas. Usado por el middleware para control de acceso.

## Roles del sistema

- `administrador` — acceso total (admin, production, warehouse)
- `direccion` — dirección (admin, production, warehouse)
- `tecnico` — técnico (admin, production, warehouse)
- `operario` — operario de almacén (operator, production)
- `comercial` — equipo de ventas (comercial)
- `repartidor_autoventa` — reparto y autoventa en campo (field)
- `external_user` — cliente externo (external)

## Entity

Recurso de negocio gestionado por la aplicación: customer, supplier, product, order, pallet, box, lot, store, production, employee, etc.

## Operational screen

Pantalla de uso real por usuarios de negocio. Prioriza densidad de información, velocidad y fiabilidad sobre estética. Ejemplos: listado de pedidos, registro de producción, recepción de materia prima.

## TanStack Query (React Query)

Librería de data fetching y caché. Todos los hooks de datos usan `useQuery()` y `useMutation()`. Las query keys están centralizadas en `src/lib/routes/`.

## Query keys

Identificadores únicos de cada query en TanStack Query. Centralizados en `src/lib/routes/` para evitar duplicados e inconsistencias de caché.

## useFieldArray

Hook de React Hook Form para gestionar arrays dinámicos de campos en un formulario (e.g., líneas de un pedido, productos de una recepción).

## Controller (React Hook Form)

Componente de React Hook Form para integrar inputs custom (DatePicker, Combobox, Select, InputOTP) con el sistema de formulario. Alternativa a `register()` para componentes no-nativos.

## setErrorsFrom422

Helper que mapea los errores de validación de la respuesta HTTP 422 del backend a los campos del formulario usando `setError()` de React Hook Form.

## notify

Wrapper de `sonner` para mostrar toasts. Uso: `notify.success("msg")`, `notify.error("msg")`.

## getErrorMessage

Helper que extrae el mensaje de error más apropiado de la respuesta del backend. Prioriza `userMessage` sobre `message`.

## Pallet / Palets

Unidad de agrupación de cajas de producto. Entidad central en el sistema de trazabilidad y almacén.

## Barco

Embarcación pesquera. Entidad del catálogo sectorial. Los datos de barcos se gestionan parcialmente en `exportData.js`.

## CMR

Documento de transporte internacional. La PesquerApp genera y gestiona CMRs digitales.

## Facilcom / A3ERP

Sistemas externos de integración. El frontend puede exportar datos a estos sistemas (Facilcom XLS, A3ERP) desde las pantallas de EntityClient.

## exportData.js

Archivo de datos estáticos con el catálogo de productos y barcos para exportaciones. Se actualiza frecuentemente con nuevas entradas.

## AUTH_SESSION_EXPIRED_EVENT

Evento custom disparado por `fetchWithTenant` cuando el backend devuelve un 401 de JWT inválido/expirado. El listener de este evento desencadena el logout automático.

## \_\_session_verified

Cookie con TTL de 60 segundos usada por el middleware para cachear la verificación de sesión y evitar llamar a `/api/v2/me` en cada request.

## useIsMobile

Hook en `src/hooks/` que detecta si el dispositivo es móvil. Usado en componentes que necesitan comportamiento diferente en móvil/escritorio.
