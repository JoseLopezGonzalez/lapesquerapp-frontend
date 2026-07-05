---
id: GAP-V2-061
title: Pallet image deletion permission hardcoded and duplicated instead of centralized in lib/auth/actor
module: pallets
category: code-quality
priority: P2
risk: medium
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/Pallets/PalletDialog/PalletView/PalletImagesTab/index.tsx
  - src/components/Admin/Pallets/PalletDialog/MobilePalletView/ImagenesTab.tsx
  - src/lib/auth/actor.ts
created_at: 2026-07-05
updated_at: 2026-07-05
normalized_at: 2026-07-05
---

# GAP-V2-061 — Lógica de permiso para borrar imágenes de palet duplicada y no centralizada

## Problema

`src/lib/auth/actor.ts` ya centraliza las reglas de permisos del módulo Pallets:

- `canDeletePallet(user)` → `isInternalActor(user)` (cualquier usuario interno,
  cualquier rol).
- `canManagePalletCostFields(user)` → interno **y** rol en
  `{administrador, direccion, tecnico}`.

Sin embargo, el permiso para **eliminar una imagen adjunta del palet** no usa
ninguno de estos helpers ni añade uno nuevo — está hardcodeado de forma idéntica
en dos archivos distintos, con un tercer conjunto de roles que no coincide con
ninguno de los dos anteriores:

- `src/components/Admin/Pallets/PalletDialog/PalletView/PalletImagesTab/index.tsx:602-604`:
  ```ts
  const rawRole = session?.user?.role;
  const roles: string[] = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];
  const canDelete = roles.some((r) => r === 'administrador' || r === 'tecnico');
  ```
- `src/components/Admin/Pallets/PalletDialog/MobilePalletView/ImagenesTab.tsx:241`:
  la misma expresión, copiada literalmente.

Esto son **tres** conjuntos de permisos distintos para tres acciones relacionadas
del mismo palet: borrar el palet completo (cualquier interno), gestionar costes
(admin+dirección+técnico), borrar una imagen (solo admin+técnico, sin dirección).
No hay evidencia de que esta tercera regla sea intencional — parece una copia
manual que quedó desalineada con `canManagePalletCostFields` (le falta
`direccion`) y con `canDeletePallet` (no usa `isInternalActor`, así que un actor
externo con `role` vacío/indefinido pasaría por `roles.some(...)` = `false`, lo
cual da el resultado correcto por casualidad, no por diseño).

## Objetivo

Existe un único helper en `@/lib/auth/actor.ts` (p.ej.
`canDeletePalletAttachment(user)`) que encapsula la regla de negocio real, y ambos
archivos (`PalletImagesTab` desktop y `ImagenesTab` mobile) lo importan y usan —
sin lógica de roles inline duplicada.

## Contexto

Detectado en el carril code-quality/architecture-refactor de la auditoría profunda
del editor de palets. Puede tener implicación de seguridad/permisos real (el
carril `permissions-multitenant-auditor` debería confirmar cuál es la regla de
negocio correcta — ¿dirección puede borrar imágenes o no?) pero el problema de
arquitectura (duplicación + no uso del helper centralizado) es independiente de
cuál sea la regla correcta.

## Solución propuesta

1. Añadir `canDeletePalletAttachment(user)` en `src/lib/auth/actor.ts` con el
   mismo conjunto de roles que `canManagePalletCostFields`
   (`administrador`/`direccion`/`tecnico`, confirmado por Jose el 2026-07-05 —
   borrar una imagen es gestión de datos sensibles del palet, coherente con
   quién gestiona costes).
2. Reemplazar la lógica inline en ambos archivos (`PalletImagesTab/index.tsx` y
   `MobilePalletView/ImagenesTab.tsx`) por una llamada al nuevo helper.

## Criterios de aceptación

- [ ] Ningún archivo de Pallets calcula permisos de rol con `roles.some(...)`
      inline — todo pasa por helpers de `@/lib/auth/actor.ts`.
- [ ] El mismo helper se usa en desktop y mobile — imposible que diverjan de nuevo.
- [ ] `canDeletePalletAttachment` devuelve `true` para
      `administrador`/`direccion`/`tecnico` y `false` para el resto (incluye
      dirección, que el código actual excluía incorrectamente).

## Plan de validación

```text
npm run type-check
npm run lint
grep -rn "roles.some" src/components/Admin/Pallets/   # debe devolver 0 tras el fix
```

## Notas de implementación

**Normalización (gap-normalizer, 2026-07-05):** marcado `blocked` — el propio GAP
requiere como paso 1 de su solución "confirmar con Jose/negocio cuál es el
conjunto de roles correcto para borrar imágenes" antes de fijar el helper en
`lib/auth/actor.ts`. La parte de arquitectura (centralizar en un helper, eliminar
duplicación) es clara y no depende de nada, pero implementarla sin la decisión de
negocio arriesga fijar una regla de permisos incorrecta con más autoridad
(centralizada) que el bug actual. No implementar hasta tener respuesta de Jose.

**Decisión de Jose (2026-07-05):** el rol correcto es el mismo que
`canManagePalletCostFields` (`administrador`/`direccion`/`tecnico`). Esto amplía
el acceso actual (que excluía `direccion`) — verificar que no rompe ningún test
o expectativa de UI que asumiera lo contrario.

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/pallets/audit.md`
- GAPs relacionados: posible dependencia del carril permissions-multitenant-auditor
