# GAP-060 — Quick fixes: alias, Heroicons, console.log, imports muertos, useCurrentUserRole

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Media
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Batch de 5 findings de baja complejidad detectados en la auditoría quality del módulo
orders manager (audit 2026-07-01). Ninguno requiere lógica nueva — son correcciones de
limpieza y cumplimiento de reglas documentadas.

### FND-008 — Alias `@lib/` incorrecto (PL-BUILD-02)

`src/services/orderService.ts` y `src/services/palletService.ts` importan:
```ts
import { fetchWithTenant } from '@lib/fetchWithTenant';
```
El alias correcto documentado en CLAUDE.md y `tsconfig.json paths` es `@/lib/`:
```ts
import { fetchWithTenant } from '@/lib/fetchWithTenant'; // ✅
```
El alias `@lib/` funciona en local pero puede fallar en Vercel (PL-BUILD-02, precedente
documentado). Se corrige en `orderService.ts`; el implementador verifica si `palletService.ts`
también lo necesita (puede que ya esté corregido por GAP-057 o no).

### FND-009 — Import de Heroicons en LinkPalletsDialog (PL-015)

`src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/LinkPalletsDialog.jsx:16`:
```js
import { XMarkIcon } from '@heroicons/react/20/solid';
```
La librería de iconos estándar de PesquerApp es **Lucide** (ya instalada). El equivalente es:
```ts
import { X } from 'lucide-react';
```
El uso en JSX: `<XMarkIcon className="h-5 w-5" />` → `<X className="h-5 w-5" />`.

### FND-011 — console.log en producción en ProductionView

`src/components/Admin/OrdersManager/ProductionView/index.js:53`:
```js
console.log('ProductionView: Datos obtenidos:', data)
```
Se ejecuta en producción en cada ciclo del polling (~20 veces/hora por sesión activa).
Se elimina. El `console.error` de manejo de errores en el mismo archivo puede mantenerse.

> **Nota:** Este archivo se refactoriza completamente en GAP-058. Si GAP-058 se implementa
> antes que este GAP, FND-011 queda implícitamente corregido (el useEffect se elimina).
> El implementador verifica si ya está corregido antes de tocar el archivo.

### FND-016 — Import muerto de `use` en OrderExport

`src/components/Admin/OrdersManager/Order/OrderExport/index.js:3`:
```js
import React, { use, useEffect, useState } from 'react';
```
`use` es un hook experimental de React 19 que no se usa en este archivo. Se elimina:
```js
import React, { useEffect, useState } from 'react';
```

### FND-006 — useSession para extracción de role en OrderAttachments (PL-010 pattern)

`src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx:20`:
```ts
import { useSession } from 'next-auth/react';
// ...línea 522-524:
const { data: session } = useSession();
const canDelete = session?.user?.role === 'administrador' || session?.user?.role === 'tecnico';
```
Usar `useSession` en un componente solo para extraer el rol es inconsistente con el patrón
del proyecto. El proyecto tiene `useMe` hook (`src/hooks/useMe.ts`) que abstrae el usuario
actual. Verificar si `useMe` expone el `role` del usuario — si lo hace, reemplazar `useSession`
por `useMe` en `OrderAttachments`.

Si `useMe` no expone `role`, no modificar `OrderAttachments` en este GAP — documentarlo
en las observaciones.

Detectado en auditoría quality orders manager (FND-006/008/009/011/016, audit 2026-07-01).

## Solución acordada

Corregir los 5 findings en un único commit, agrupados por archivo:

1. `orderService.ts`: `@lib/fetchWithTenant` → `@/lib/fetchWithTenant`
2. `LinkPalletsDialog.jsx`: quitar import Heroicons, añadir import Lucide, actualizar JSX
3. `ProductionView/index.js`: quitar el `console.log` (si no fue ya corregido por GAP-058)
4. `OrderExport/index.js`: quitar `use` del import de React
5. `OrderAttachments/index.tsx`: reemplazar `useSession` por `useMe` (si `useMe` expone role)

## Referencias e inspiración

- PL-015 (project-learnings.md): Heroicons → Lucide, equivalente `X` para `XMarkIcon`
- PL-BUILD-02 (project-learnings.md): alias `@lib/` causa fallos silenciosos en Vercel
- GAP-041: precedente de corrección Heroicons → Lucide en el mismo codebase

## Criterios de aceptación

- [ ] `orderService.ts` usa `@/lib/fetchWithTenant` en todos sus imports (no `@lib/`)
- [ ] `LinkPalletsDialog.jsx` no importa de `@heroicons/react`
- [ ] `LinkPalletsDialog.jsx` importa `X` de `lucide-react` y lo usa en lugar de `XMarkIcon`
- [ ] `ProductionView/index.js` no tiene `console.log` (o ya fue eliminado por GAP-058)
- [ ] `OrderExport/index.js` no importa `use` de React
- [ ] `OrderAttachments/index.tsx` no usa `useSession` para extracción de role (si useMe expone role)
- [ ] `npm run lint` pasa sin warnings en los archivos modificados

## Archivos a crear o modificar

**Modificar:**
- `src/services/orderService.ts` — fix alias import
- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/LinkPalletsDialog.jsx` — Heroicons → Lucide
- `src/components/Admin/OrdersManager/Order/OrderExport/index.js` — quitar import `use`
- `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx` — quitar useSession (condicional)

**Verificar antes de modificar (puede ya estar corregido):**
- `src/components/Admin/OrdersManager/ProductionView/index.js` — console.log (si GAP-058 ya se implementó)
- `src/services/palletService.ts` — alias `@lib/` (si GAP-057 ya lo corrigió)

## Restricciones

- Un único commit con todos los fixes — no dividir en commits separados
- No refactorizar más allá del fix puntual en cada archivo
- No renombrar archivos `.jsx`/`.js` a `.tsx`/`.ts` en este GAP — es scope de GAP-061
- Si `useMe` no expone `role`, dejar `OrderAttachments` sin cambios y documentarlo

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/services/orderService.ts` — `@lib/fetchWithTenant` → `@/lib/fetchWithTenant`
- `src/services/palletService.ts` — `@lib/fetchWithTenant` → `@/lib/fetchWithTenant`
- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/LinkPalletsDialog.jsx` — eliminado import `XMarkIcon` de `@heroicons/react/20/solid`; añadido `X` a import de `lucide-react`; `<XMarkIcon>` → `<X>` en JSX
- `src/components/Admin/OrdersManager/ProductionView/index.js` — eliminada línea `console.log('ProductionView: Datos obtenidos:', data)`
- `src/components/Admin/OrdersManager/Order/OrderExport/index.js` — eliminado `use` del import de React
- `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx` — reemplazado `import { useSession }` por `import { useMe }`; role obtenido como `const { data: me } = useMe(); const canDelete = me?.role === 'administrador' || me?.role === 'tecnico'`

### Decisiones tomadas durante la implementación

`useMe` expone `role: string` via `AuthUser`. La nueva expresión de `canDelete` es más simple (sin el array intermediario) porque la API devuelve un único string de rol, no un array. `palletService.ts` también tenía el alias incorrecto, igual que `orderService.ts` — ambos corregidos.

### Desviaciones del plan (si las hay)

Ninguna.

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
