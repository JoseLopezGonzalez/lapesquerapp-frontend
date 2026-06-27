# GAP-019 — MobileStoresManager: `MobileStoreListSkeleton` inalcanzable por condición compuesta

## Metadata

- **Tipo:** Bug
- **Módulo:** Stock / Almacén
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-06-27
- **Autor:** Jose
- **Origen:** /audit-mobile Phase 4 — finding B1-I1

---

## Contexto y problema

En `MobileStoresManager.tsx`, la condición de loading es:

```tsx
const showLoader = !sessionReady || isInitialLoading;
if (showLoader) return <Loader />;
```

Esta condición combina dos casos distintos:
1. `!sessionReady` — la sesión no está lista (gate de auth → `<Loader>` correcto)
2. `isInitialLoading` — los datos de almacenes están cargando (datos → debería ser `Skeleton`)

El resultado es que `MobileStoreListSkeleton` (que existe y está correctamente implementado en `MobileStoreListView.tsx`) **nunca se puede renderizar**: cuando `isInitialLoading` es `true`, la condición compuesta devuelve `<Loader>` en lugar de pasar el control a la lista con el Skeleton.

---

## Solución acordada

Separar las dos condiciones:

```tsx
// 1. Gate de sesión — Loader correcto
if (!sessionReady) return <Loader />;

// 2. Primera carga de datos — mostrar la vista de lista con isStoreLoading=true
//    MobileStoreListView ya recibe isStoreLoading y puede mostrar el Skeleton
return (
  <MobileStoreListView
    stores={stores}
    isStoreLoading={isInitialLoading || isStoreLoading}
    // ...resto de props
  />
);
```

Con este cambio, la sesión usa `<Loader>`, y la carga inicial de datos pasa a `MobileStoreListView` que ya tiene `MobileStoreListSkeleton` implementado y puede renderizarlo cuando `isStoreLoading` es `true`.

Verificar si `MobileStoreListView` ya maneja el prop `isStoreLoading` para mostrar el Skeleton, o si hay que ajustarlo para que use `MobileStoreListSkeleton` cuando `isStoreLoading && stores.length === 0`.

---

## UI Brief

- **Vista de referencia:** `src/components/Admin/Stores/Mobile/MobileStoreListView.tsx` — `MobileStoreListSkeleton` ya existe y está correctamente implementado
- **Tipo de layout:** Sin cambio visual — solo corrección del flujo de condiciones
- **Componentes clave:** `MobileStoreListSkeleton` (ya existe), `<Loader>` (solo para sesión)
- **Estados requeridos:** sesión cargando (Loader) / datos cargando (MobileStoreListSkeleton) / datos listos (lista normal)
- **Mobile:** aplica ahora

---

## Referencias

- `MobileStoreListView.tsx` — `MobileStoreListSkeleton` ya implementado y correcto
- `FieldLayoutClient.jsx` — patrón correcto de separar gate de sesión del loading de datos

---

## Criterios de aceptación

- [ ] `MobileStoresManager.tsx` separa la condición de sesión (`!sessionReady`) de la condición de datos (`isInitialLoading`)
- [ ] `!sessionReady` sigue mostrando `<Loader>` — gate de auth correcto
- [ ] Cuando la sesión está lista pero los datos cargan (`isInitialLoading === true`), se muestra `MobileStoreListSkeleton` (no `<Loader>`)
- [ ] `MobileStoreListSkeleton` es alcanzable y se renderiza durante la primera carga de datos
- [ ] Cuando hay datos, la lista se muestra normalmente
- [ ] El componente `<Loader>` no se usa para la carga de datos de almacenes

---

## Archivos a crear o modificar

- `src/components/Admin/Stores/Mobile/MobileStoresManager.tsx` — separar condiciones de loading
- `src/components/Admin/Stores/Mobile/MobileStoreListView.tsx` — verificar y ajustar si necesario para usar `MobileStoreListSkeleton` cuando `isStoreLoading && stores.length === 0`

---

## Restricciones

- NO tocar la lógica de fetching ni los hooks de datos
- NO modificar el comportamiento del gate de sesión
- `MobileStoreListSkeleton` ya existe — no crearlo de nuevo, usarlo
- El implementador debe verificar cómo `isStoreLoading` fluye a `MobileStoreListView` antes de cambiar

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
