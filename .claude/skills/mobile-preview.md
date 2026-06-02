# SKILL: mobile-preview — Preview Aislado de UI Mobile

## Propósito

Trabajar en UI mobile en una rama git separada, con ruta de preview directa,
sin contaminar el código de producción hasta confirmación explícita.
Integrado con el flujo GAP del proyecto.

---

## Flujo completo: GAP → rama → preview → merge

### Paso 1 — Siempre crear un GAP primero

Antes de crear una rama mobile, debe existir un GAP documentado en `.claude/gaps/open/`.
El GAP define el scope, los archivos a tocar y los criterios de aceptación.

Ver `.claude/agents/gap-discovery.md` para el proceso de creación de GAPs.

### Paso 2 — Crear rama de trabajo

```bash
git checkout -b mobile/[nombre-vista]
```

Nomenclatura: `mobile/orders-list`, `mobile/warehouse-manager`, `mobile/crud-species`, etc.

### Paso 3 — Estructura de componentes

```
src/components/[Módulo]/[Vista]/
  ├── index.js (o .tsx)          ← modificar MÍNIMO (solo añadir switch mobile/desktop)
  ├── [Vista]Desktop.tsx          ← opcional: extraer si el componente padre era monolítico
  └── [Vista]Mobile.tsx           ← componente mobile nuevo
```

El archivo de entrada (`index.js`) se modifica ÚNICAMENTE para añadir el switch:

```typescript
'use client';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { NombreVistaMobile } from './NombreVistaMobile';

export function NombreVista(props) {
  const { isMobile, mounted } = useIsMobileSafe();
  if (!mounted) return <NombreVistaSkeleton />;
  if (isMobile) return <NombreVistaMobile {...props} />;
  // resto del componente desktop original sin tocar
  return <NombreVistaDesktop {...props} />;
}
```

### Paso 4 — Ruta de preview (solo en rama mobile/*)

Crear `src/app/[ruta-existente]/preview/page.tsx` que renderiza directamente
el componente mobile sin layout, para ver en DevTools mobile o en el móvil real:

```typescript
// src/app/admin/orders-manager/preview/page.tsx
import { OrdersMobile } from '@/components/Admin/OrdersManager/OrdersMobile';

export default function MobilePreview() {
  // Sin layout, sin BottomNav — render directo para preview
  return <OrdersMobile />;
}
```

**Esta ruta SOLO existe en la rama `mobile/*` y nunca se mergea a main/develop.**

### Paso 5 — Ver en el móvil real

```bash
# Ver IP local (para acceder desde Android en la misma WiFi)
ip addr show | grep 'inet ' | grep -v '127.0.0.1'
# → Abrir en Chrome móvil: http://[IP]:3000/[ruta]/preview

# O usar DevTools de Chrome: Vista responsive → 390x844 (iPhone 14) o 375x667 (iPhone SE)
```

### Paso 6 — Iterar con confirmación

NO hacer merge hasta que:
1. Se haya probado en el móvil real (o DevTools 375px + 390px)
2. Se haya pasado el QA checklist del skill `mobile-ui`
3. Jose haya confirmado explícitamente: "merge [nombre-vista]"

### Paso 7 — Merge aprobado

```bash
# 1. Eliminar la ruta /preview antes del merge
rm src/app/[ruta]/preview/page.tsx
git add -A

# 2. Merge
git checkout develop   # o la rama base del proyecto
git merge mobile/[nombre-vista] --no-ff
git branch -d mobile/[nombre-vista]

# 3. Commit de cierre de GAP
# (el Agente Auditor cerrará el GAP y lo moverá a closed/)
```

---

## Gestión de ramas activas

```bash
git branch | grep mobile/    # ver todas las ramas mobile activas
```

Máximo 3 ramas `mobile/*` activas simultáneamente. Si hay más, resolver antes de abrir nuevas.

---

## Integración con el GAP workflow

| Acción | Quién | Cuándo |
|--------|-------|--------|
| Crear rama `mobile/[vista]` | Implementador | Al empezar la implementación del GAP |
| Crear ruta `/preview` | Implementador | Con los primeros componentes (para probar rápido) |
| Merge de rama | Implementador | Tras confirmación de Jose + QA checklist |
| Eliminar `/preview` | Implementador | Justo antes del merge |
| Cerrar GAP | Auditor | Tras el merge |

---

## Qué nunca mergear a main/develop

- Rutas `/preview` (son solo para desarrollo)
- Comentarios `// DEBUG` o `// TODO mobile`
- Componentes a medias (`// TODO: implementar sección X`)
- Cambios en el componente desktop (solo añadir el switch, no modificar el desktop)
