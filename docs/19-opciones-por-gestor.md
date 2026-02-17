# Opciones rápidas por contexto de gestor

## Objetivo

Cargar opciones (productos, proveedores, impuestos, etc.) **solo cuando el usuario entra en un gestor o apartado concreto**, en lugar de cargarlas a nivel de toda la aplicación. Así se evitan peticiones innecesarias en cada carga y cada gestor “posee” sus propios datos.

## Patrón: contexto por gestor

1. **Un provider por gestor/apartado** que envuelve solo las páginas de ese gestor.
2. El provider carga **solo las opciones que ese gestor usa** (productOptions, supplierOptions, taxOptions, etc.) cuando monta y hay sesión.
3. Los hooks (`useProductOptions`, `useSupplierOptions`, `useTaxOptions`) intentan leer primero del contexto del gestor actual; si no hay provider (porque estás en otra sección), hacen **fetch directo** a la API.

Así, por ejemplo, el **Gestor de almacenes** puede seguir usando `useProductOptions()` sin tener un provider específico: el hook hará la petición directa cuando monte el componente que lo use.

## Implementación actual

### Gestores que tienen contexto de opciones

| Gestor / apartado | Provider | Opciones que carga | Dónde se envuelve |
|-------------------|----------|--------------------|-------------------|
| **Gestor de pedidos** | `OrdersManagerOptionsProvider` | `productOptions`, `taxOptions` | `src/app/admin/orders-manager/page.js` |
| **Recepciones de materia prima** | `RawMaterialReceptionsOptionsProvider` | `productOptions`, `supplierOptions` | `src/app/admin/raw-material-receptions/layout.js` |

### Hooks que consumen contexto o hacen fallback

- **useProductOptions()**: intenta `OrdersManagerOptionsContext` y `RawMaterialReceptionsOptionsContext`; si no hay datos, fetch directo a `getProductOptions`. Usado en Gestor de pedidos, Recepciones y otros (ej. Gestor de almacenes).
- **useSupplierOptions()**: intenta `RawMaterialReceptionsOptionsContext`; si no, fetch directo. Usado en Recepciones.
- **useTaxOptions()**: intenta `OrdersManagerOptionsContext`; si no, fetch directo. Usado en Gestor de pedidos.

### Ubicación del código

- Contextos de gestor: `src/context/gestor-options/`
  - `OrdersManagerOptionsContext.js` – provider + `useOrdersManagerOptions()`
  - `RawMaterialReceptionsOptionsContext.js` – provider + `useRawMaterialReceptionsOptions()`
- Hooks que usan contexto o API: `src/hooks/useProductOptions.js`, `useSupplierOptions.js`, `useTaxOptions.js`

## Cómo añadir un nuevo gestor con opciones

1. **Crear el contexto** en `src/context/gestor-options/`, por ejemplo `StoresManagerOptionsContext.js`:
   - `createContext(null)`.
   - Provider que con `useSession()` y `token` cargue solo las opciones que ese gestor necesite (p. ej. `getProductOptions`, o un futuro `getStoreOptions`).
   - Exportar el provider, el hook (p. ej. `useStoresManagerOptions`) y el context.

2. **Envolver la página o el layout del gestor** con ese provider:
   - Opción A: en la página, p. ej. `src/app/admin/stores-manager/page.js`: `<StoresManagerOptionsProvider><StoresManager /></StoresManagerOptionsProvider>`.
   - Opción B: si el gestor tiene varias rutas, crear `src/app/admin/stores-manager/layout.js` y envolver `{children}` con el provider.

3. **Actualizar el hook existente** (p. ej. `useProductOptions`) para que intente primero el nuevo contexto:
   - `const storesOptions = useStoresManagerOptions();`
   - Al inicio del hook, si `storesOptions?.productOptions?.length > 0` (o loading), usar esos datos y devolverlos; si no, seguir con el resto de contextos y finalmente fetch directo.

Con esto, el nuevo gestor tendrá opciones rápidas desde contexto solo cuando el usuario esté en esa sección, y el resto de la app puede seguir usando el mismo hook con fallback a API.

## Resumen

- **Opciones por gestor** = un provider por sección que carga solo lo que esa sección usa.
- Los hooks reutilizables leen primero del contexto del gestor (si existe) y, si no, hacen fetch directo.
- Para añadir más opciones o más gestores: nuevo archivo en `context/gestor-options/`, envolver la ruta correspondiente y, si hace falta, conectar el hook existente al nuevo contexto.
