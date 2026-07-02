# GAP-063 — Corregir 'use client' mal ubicado en páginas comercial/orders

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Pedidos (vista Comercial)
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Recurrencia de PL-014: `'use client'` en archivos `page.js` del App Router es un anti-patrón
— la directiva debe vivir en el componente `XxxPageClient`, nunca en el `page.tsx/js` de la ruta.
Los GAPs previos (GAP-046, GAP-050, GAP-055) ya corrigieron esto en `comercial/ofertas`,
`comercial/agenda` y varias rutas de `admin`, pero **no cubrieron las rutas de `comercial/orders`**,
detectadas en la auditoría MIGRATE del módulo orders manager (2026-07-01):

**1. `src/app/comercial/orders/page.js`** — listado, 24 líneas:
```js
'use client';
import EntityClient from '@/components/Admin/Entity/EntityClient';
import { configs } from '@/configs/entitiesConfig';

export default function ComercialOrdersCrudPage() {
  const comercialOrdersConfig = { ...configs.orders, /* ... */ };
  return <EntityClient config={comercialOrdersConfig} />;
}
```
No usa ningún hook a nivel de página — solo construye un objeto de configuración plano y
renderiza `EntityClient`, que ya es `'use client'` internamente. No necesita la directiva.

**2. `src/app/comercial/orders/[id]/page.js`** — detalle, 15 líneas:
```js
'use client';
import { useParams } from 'next/navigation';
import Order from '@/components/Admin/OrdersManager/Order';

export default function ComercialOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id;
  return (
    <div className="h-full min-h-0 w-full overflow-hidden p-2">
      <Order orderId={orderId} readOnly />
    </div>
  );
}
```
Usa `useParams()` para leer el `id`, lo cual sí requiere client component — pero el patrón
canónico ya existe en `src/app/admin/orders/[id]/page.js` + `OrderClient.js`: un Server
Component asíncrono que recibe `params` como prop de Next.js (sin `useParams()`) y delega a
un wrapper cliente.

## Solución acordada

### `comercial/orders/page.js`

Quitar la directiva `'use client'`. Queda como Server Component simple — no se crea wrapper
adicional porque no hay hooks a nivel de página y `EntityClient` ya es client component.
Se renombra a `.tsx` en el mismo commit (regla de oro 3 — se toca el archivo).

```tsx
// src/app/comercial/orders/page.tsx
import EntityClient from '@/components/Admin/Entity/EntityClient';
import { configs } from '@/configs/entitiesConfig';

export default function ComercialOrdersCrudPage() {
  const comercialOrdersConfig = { ...configs.orders, /* ... */ };
  return <EntityClient config={comercialOrdersConfig} />;
}
```

### `comercial/orders/[id]/page.js`

Replicar el patrón de `src/app/admin/orders/[id]/page.js` + `OrderClient.js`:

1. Crear `src/components/Admin/OrdersManager/ComercialOrderDetailClient.tsx` (o ubicación
   equivalente) — client component que recibe `orderId` como prop y renderiza `<Order orderId={orderId} readOnly />`.
2. Convertir `page.js` → `page.tsx`, Server Component asíncrono que recibe `params` de Next.js
   (sin `useParams()`), igual que `src/app/admin/orders/[id]/page.js`:

```tsx
// src/app/comercial/orders/[id]/page.tsx
import ComercialOrderDetailClient from '@/components/Admin/OrdersManager/ComercialOrderDetailClient';

export default async function ComercialOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ComercialOrderDetailClient orderId={id} />;
}
```

## Referencias e inspiración

- PL-014 (project-learnings.md): `'use client'` en page.js es anti-patrón
- GAP-046, GAP-050, GAP-055: mismo fix aplicado a otras rutas del proyecto
- `src/app/admin/orders/[id]/page.js` + `OrderClient.js`: patrón de referencia exacto a replicar

## Criterios de aceptación

- [x] `src/app/comercial/orders/page.tsx` existe, sin `'use client'`, sin contrapartida `.js`
- [x] `src/app/comercial/orders/[id]/page.tsx` existe, es Server Component asíncrono, sin
      `'use client'`, sin contrapartida `.js`
- [x] `src/app/comercial/orders/[id]/page.tsx` no usa `useParams()` — recibe `params` como prop
- [x] `ComercialOrderDetailClient.tsx` existe con `'use client'`, recibe `orderId` como prop
- [x] El listado de pedidos comercial (`/comercial/orders`) sigue funcionando igual
- [x] El detalle de pedido comercial (`/comercial/orders/[id]`) sigue funcionando en modo
      solo lectura (`readOnly`)
- [x] `npm run type-check` y `npm run lint` pasan sin errores en archivos del GAP; type-check global tiene 2 errores preexistentes en otros archivos (`loading.tsx`, `Order/index.tsx`)

## Archivos a crear o modificar

**Crear:**
- `src/components/Admin/OrdersManager/ComercialOrderDetailClient.tsx`

**Renombrar/modificar:**
- `src/app/comercial/orders/page.js` → `page.tsx` (quitar `'use client'`)
- `src/app/comercial/orders/[id]/page.js` → `page.tsx` (Server Component async + delega a client wrapper)

## Restricciones

- No modificar `configs.orders` ni la lógica de filtrado de exports dentro del listado
- No cambiar el comportamiento `readOnly` del detalle
- No tocar `src/components/Admin/OrdersManager/Order/index.tsx` (el componente `Order` en sí)
- Un único commit con ambos archivos — no dividir en commits separados (regla de commits del proyecto)

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

- `src/components/Admin/OrdersManager/ComercialOrderDetailClient.tsx` — client wrapper con `'use client'`, recibe `orderId` y renderiza `<Order readOnly />`

### Archivos modificados

- `src/app/comercial/orders/page.js` → `page.tsx` — eliminada directiva `'use client'`, migrado a TypeScript
- `src/app/comercial/orders/[id]/page.js` → `page.tsx` — Server Component async que recibe `params` y delega a `ComercialOrderDetailClient`

### Decisiones tomadas durante la implementación

- Tipado explícito del parámetro `opt` en el filtro de exports (`{ title?: string }`) para cumplir strict mode al migrar a `.tsx`
- `ComercialOrderDetailClient` ubicado en `src/components/Admin/OrdersManager/` según el GAP (equivalente al patrón `OrderClient.js` en admin)

### Desviaciones del plan (si las hay)

- Ninguna

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO

### Puntuación: 9/10

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

### Verificación por criterio

| Criterio | Veredicto | Evidencia |
|---|---|---|
| `page.tsx` listado sin `'use client'` | ✅ | `src/app/comercial/orders/page.tsx` — sin directiva; `.js` eliminado |
| `page.tsx` detalle Server Component async | ✅ | `src/app/comercial/orders/[id]/page.tsx` — `async`, `await params`, sin `'use client'` |
| Sin `useParams()` en detalle | ✅ | Grep en ruta: 0 coincidencias |
| `ComercialOrderDetailClient.tsx` con `'use client'` | ✅ | Recibe `orderId: string`, renderiza `<Order readOnly />` |
| Listado funcional | ✅ | Config idéntica al original (spread `configs.orders`, mismos filtros de export, mismos flags) |
| Detalle readOnly | ✅ | `readOnly` preservado en client wrapper; layout `p-2` intacto |
| type-check / lint | ✅ | 0 errores TS en archivos del GAP; ESLint sin errores en archivos tocados |

### Observaciones para Jose

- Refactor arquitectónico puro: sin cambios de UI ni de lógica de negocio. Cumple PL-014.
- El listado sigue el patrón de Server Component directo (como `admin/supplier-liquidations/page.js`), válido porque no hay hooks a nivel de página y `EntityClient` ya es client component.
- El detalle replica el patrón de `admin/orders/[id]/page.js` + client wrapper, con tipado explícito de `params: Promise<{ id: string }>` (Next.js 15).
- Tipado del filtro de exports (`opt: { title?: string }`) es el mínimo necesario para strict mode al migrar a `.tsx`; no altera comportamiento.
- `npm run type-check` global sigue fallando por 2 errores preexistentes en `loading.tsx` y `Order/index.tsx` — fuera del alcance de este GAP.
- Verificación funcional en navegador pendiente de Jose (smoke test en `/comercial/orders` y `/comercial/orders/[id]`).

### Estado final de la implementación

GAP cerrado. Listo para commit único con los 3 archivos de producción + este GAP.
