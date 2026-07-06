---
id: GAP-V2-072
title: ComercialDashboard vive bajo Admin/Dashboard/ pese a ser una vista exclusiva del rol Comercial
module: dashboard-home
category: architecture-refactor
priority: P2
risk: medium
size: S
status: candidate
dependencies: []
target_files:
  - src/components/Admin/Dashboard/ComercialDashboard/index.js
  - src/app/comercial/page.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-072 — Ubicación de carpeta incorrecta para `ComercialDashboard`

## Problema

`.claude/rules/components.md` § "Localización del componente en la estructura
de carpetas" establece:

```
Componente de comercial/field/warehouse:
→ src/components/[Rol]/[ComponentName].tsx
```

Sin embargo `ComercialDashboard` — el dashboard exclusivo del rol `comercial`,
consumido únicamente desde `src/app/comercial/page.js` — vive en
`src/components/Admin/Dashboard/ComercialDashboard/index.js`, dentro del árbol
de `Admin/`. Ningún otro archivo bajo `Admin/Dashboard/` es específico de un
rol no-admin; el resto de widgets en esa carpeta (`TotalQuantitySoldCard`,
`OrderRanking`, `TransportRadarChart`, etc.) son componentes de presentación
puros y reutilizables sin conocimiento de rol, que `ComercialDashboard` sí
importa y reutiliza legítimamente — pero el propio orquestador de la vista de
Comercial no debería vivir ahí.

Esto genera dos problemas concretos:
1. Cualquier futura auditoría o desarrollador que busque "todo lo que ve un
   comercial" bajo `src/components/Comercial/` no encontrará su dashboard.
2. Reduce la señal de "qué es específico de rol" vs. "qué es un widget
   compartido" dentro de la carpeta `Admin/Dashboard/`.

## Objetivo

`ComercialDashboard` vive en `src/components/Comercial/Dashboard/index.tsx` (o
ruta equivalente bajo `Comercial/`), manteniendo el import de los widgets
compartidos de `Admin/Dashboard/*` (esos sí permanecen donde están, al ser
presentación pura reutilizada por ambos roles).

## Contexto

Señalado explícitamente como punto a evaluar en el brief de esta auditoría.
Riesgo `medium` porque aunque el cambio es mecánico (mover carpeta + actualizar
1 import), toca el punto de entrada de una ruta en producción
(`src/app/comercial/page.js`) — cualquier error de ruta de import rompe la
carga de todo el dashboard Comercial.

## Solución propuesta

1. Crear `src/components/Comercial/Dashboard/index.tsx` (aprovechar el
   traslado para resolver también GAP-V2-073, migración a TypeScript, en el
   mismo movimiento si Jose lo aprueba — o mantenerlo `.js` en esta carpeta
   nueva y migrar en un PR separado, evitando mezclar mover + migrar tipos en
   el mismo commit según el protocolo de migraciones de `CLAUDE.md`).
2. Actualizar el único import externo:
   `src/app/comercial/page.js:3` — cambiar
   `@/components/Admin/Dashboard/ComercialDashboard` por
   `@/components/Comercial/Dashboard`.
3. Eliminar la carpeta vacía `src/components/Admin/Dashboard/ComercialDashboard/`.
4. Verificar con grep que no queda ninguna referencia a la ruta antigua.

## Criterios de aceptación

- [ ] `src/components/Admin/Dashboard/ComercialDashboard/` no existe.
- [ ] El dashboard de Comercial se sirve desde `src/components/Comercial/Dashboard/`.
- [ ] `grep -rn "Admin/Dashboard/ComercialDashboard" src/` devuelve 0 resultados.
- [ ] `npm run type-check` y `npm run lint` limpios.
- [ ] Manual: `/comercial` carga sin errores y con el mismo contenido visual.

## Plan de validación

```text
grep -rn "Admin/Dashboard/ComercialDashboard" src/
npm run type-check
npm run lint
npm run build
# Manual: navegar a /comercial con sesión de rol comercial y confirmar que
# el dashboard carga igual que antes del movimiento.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-073
