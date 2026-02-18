# Estándar: loading.js en rutas (Next.js App Router)

## Objetivo

- Dar **feedback inmediato** al usuario al navegar entre rutas (evitar la sensación de "no pasa nada" hasta que carga la página).
- Alinearse con la **convención oficial** de Next.js [loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading), que usa React Suspense para mostrar un estado de carga mientras el segmento carga.

## Regla

**Todo segmento de ruta que tenga `page.js` (o hijos con página) debe tener un archivo `loading.js` en ese segmento.**

- Next.js mostrará automáticamente el contenido de `loading.js` como fallback mientras se carga el segmento.
- El layout compartido sigue visible e interactivo; solo el contenido del segmento muestra el estado de carga.
- La navegación es interrumpible: el usuario puede cambiar de ruta sin esperar a que termine la carga.

## Contenido del loading

### Patrón por defecto (admin y operator)

Usar el componente **LogoutAwareLoader** para mantener el comportamiento correcto ante logout (diálogo y no mostrar loader genérico):

```js
import { LogoutAwareLoader } from "@/components/Utilities/LogoutAwareLoader";

export default function Loading() {
    return <LogoutAwareLoader />;
}
```

- **Admin**: Todas las rutas usan este patrón.
- **Operator**: Mismo patrón para consistencia y mismo comportamiento ante logout.

### Opcional: skeleton en listados

En segmentos que muestran listados o tablas (por ejemplo `admin/[entity]`), se puede usar un skeleton dentro de `LogoutAwareLoader` para mejorar la percepción de carga. El resto de rutas puede usar solo `<LogoutAwareLoader />`.

## Ubicación

- `loading.js` va en la **carpeta del segmento**: mismo nivel que el `page.js` de ese segmento, o en la carpeta que agrupa las rutas hijas.
- Un solo `loading.js` por segmento cubre todas las rutas hijas (p. ej. `admin/orders/loading.js` cubre `/admin/orders`, `/admin/orders/create`, `/admin/orders/[id]`).

## Referencia

- [Next.js: loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- Componente: `src/components/Utilities/LogoutAwareLoader.jsx`

## Lista de comprobación para nuevas rutas

Al añadir una nueva ruta con `page.js`:

1. [ ] Crear `loading.js` en la misma carpeta del segmento (o en la carpeta padre que agrupa las páginas).
2. [ ] Exportar por defecto un componente que renderice `<LogoutAwareLoader />` (o skeleton dentro de `LogoutAwareLoader` si aplica).
3. [ ] No dejar el segmento sin `loading.js` para cumplir el estándar.
