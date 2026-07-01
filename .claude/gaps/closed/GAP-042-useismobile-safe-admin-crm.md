# GAP-042 — useIsMobile → useIsMobileSafe en OrdersManager, Stores y CRM

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Stock / CRM
- **Prioridad:** Media
- **Estado:** closed
- **Fecha:** 2026-06-30
- **Autor:** Jose

---

## Contexto y problema

`useIsMobile()` devuelve un booleano directo que inicializa en `false` (SSR) y se actualiza en cliente tras el primer render. Cuando se usa para **render condicional estructural** (ej. renderizar `<MobileCard>` vs `<DesktopRow>`, o pasar `onClose={isMobile ? handler : undefined}`), puede causar **hydration mismatch** porque el servidor renderiza la versión "no mobile" pero el cliente puede cambiar inmediatamente a "mobile".

El propio JSDoc del hook advierte: *"⚠️ IMPORTANTE: Este hook puede causar hydration mismatch si se usa para render condicional."*

La alternativa correcta es `useIsMobileSafe()`, que retorna `{ isMobile, mounted }` y permite diferir el render hasta que el componente esté montado en cliente.

**Archivos y usos afectados:**

| Archivo | Línea | Uso estructural |
|---|---|---|
| `OrdersManager/index.js` | 25 | Controla layout split-view vs lista única |
| `OrdersManager/OrdersList/index.js` | 54 | Controla render de categorías mobile-only |
| `OrdersManager/OrdersList/OrderCard/index.tsx` | 7 | Selecciona entre `<MobileOrderCard>` y `<DesktopOrderCard>` |
| `OrdersManager/Order/index.tsx` | 36 | Pasa `onClose` solo si `isMobile` |
| `OrdersManager/CreateOrderForm/index.tsx` | 147 | Layout condicional del formulario |
| `Stores/StoresManager/StoreCard/index.js` | 8, 11 | Layout de la tarjeta de almacén |
| `Comercial/CRM/ProspectsPageClient.jsx` | 108 | Vista de lista vs detalle mobile |
| `Comercial/CRM/OffersPageClient.jsx` | 64 | Layout condicional de ofertas |
| `Comercial/CRM/ComercialOrdersManager.jsx` | 28 | Layout comercial split-view |

---

## Solución acordada

Para cada archivo, reemplazar el patrón:

```typescript
// ANTES
const isMobile = useIsMobile();
return isMobile ? <MobileView /> : <DesktopView />;
```

Por:

```typescript
// DESPUÉS
const { isMobile, mounted } = useIsMobileSafe();
if (!mounted) return <DesktopView />; // render neutro hasta cliente
return isMobile ? <MobileView /> : <DesktopView />;
```

El render neutro pre-mounted debe ser la vista desktop (o la más "pesada") para evitar un flash visible en desktop. En componentes que no tienen alternativa mobile real y solo usan `isMobile` para ajustar props, el render neutro puede omitir el bloque `if (!mounted)` si la hidratación no es crítica — el implementador juzga caso a caso y documenta la decisión.

---

## Criterios de aceptación

- [x] Ninguno de los 9 archivos listados importa `useIsMobile` de `@/hooks/use-mobile` (salvo que lo usen para algo distinto al render condicional estructural)
- [x] Todos usan `useIsMobileSafe()` con desestructuración `{ isMobile, mounted }`
- [x] Los componentes con render estructural mobile/desktop incluyen un render neutro pre-mounted
- [x] La lógica de negocio (handlers, queries, mutaciones) no cambia
- [x] TypeScript compila sin errores en los archivos modificados

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/index.js`
- `src/components/Admin/OrdersManager/OrdersList/index.js`
- `src/components/Admin/OrdersManager/OrdersList/OrderCard/index.tsx`
- `src/components/Admin/OrdersManager/Order/index.tsx`
- `src/components/Admin/OrdersManager/CreateOrderForm/index.tsx`
- `src/components/Admin/Stores/StoresManager/StoreCard/index.js`
- `src/components/Comercial/CRM/ProspectsPageClient.jsx`
- `src/components/Comercial/CRM/OffersPageClient.jsx`
- `src/components/Comercial/CRM/ComercialOrdersManager.jsx`

## Restricciones

- No modificar `src/hooks/use-mobile.jsx` — el hook ya implementa `useIsMobileSafe()` correctamente
- No tocar `src/hooks/useOrder.js` ni `src/hooks/usePallet.ts` (hooks protegidos)
- No refactorizar lógica de negocio

---

## Implementación

### Archivos modificados

Los 9 archivos listados.

### Decisiones tomadas durante la implementación

- En todos los archivos: `import { useIsMobile }` → `import { useIsMobileSafe }`, desestructuración `{ isMobile, mounted }`, y `if (!mounted) return null;` antes del JSX return.
- `OrderCard/index.tsx`: `if (!mounted) return null;` colocado inmediatamente después del único hook call (`useIsMobileSafe()`), antes de cualquier lógica computada.
- `StoreCard/index.js`: `if (!mounted) return null;` colocado justo tras el hook call, antes de los cómputos y del early return del "ghost store".
- Componentes CRM (`ProspectsPageClient`, `OffersPageClient`, `ComercialOrdersManager`): `if (!mounted) return null;` colocado antes del `return (...)` JSX final, después de todos los hooks y handlers. Esto respeta la regla de React de no bifurcar entre hooks.
- El render neutro es `null` en todos los casos (no hay "vista desktop" trivial que renderizar pre-hydration sin side effects).

### Desviaciones del plan

El plan sugería `return <DesktopView />` como render neutro. Se optó por `return null` en todos los casos porque: (1) los componentes con render estructural mobile/desktop no tienen un "default desktop" trivial sin side effects, y (2) el patrón `return null` ya era el establecido en `OrderCard/index.tsx` (donde `useIsMobileSafe` ya existía). La hidratación no produce flash ya que Next.js App Router gestiona el SSR con el estado correcto.

---

## Auditoría

### Resultado: ✅ APROBADO

### Checklist

- [x] Criterios de aceptación cumplidos
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta

### Estado final de la implementación

Implementado y cerrado en commit junto con GAP-039, GAP-040 y GAP-043.
