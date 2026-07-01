# GAP-063 — Corregir 'use client' mal ubicado en páginas comercial/orders

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Pedidos (vista Comercial)
- **Prioridad:** Alta
- **Estado:** open
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

- [ ] `src/app/comercial/orders/page.tsx` existe, sin `'use client'`, sin contrapartida `.js`
- [ ] `src/app/comercial/orders/[id]/page.tsx` existe, es Server Component asíncrono, sin
      `'use client'`, sin contrapartida `.js`
- [ ] `src/app/comercial/orders/[id]/page.tsx` no usa `useParams()` — recibe `params` como prop
- [ ] `ComercialOrderDetailClient.tsx` existe con `'use client'`, recibe `orderId` como prop
- [ ] El listado de pedidos comercial (`/comercial/orders`) sigue funcionando igual
- [ ] El detalle de pedido comercial (`/comercial/orders/[id]`) sigue funcionando en modo
      solo lectura (`readOnly`)
- [ ] `npm run type-check` y `npm run lint` pasan sin errores

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
