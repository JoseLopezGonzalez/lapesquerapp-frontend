# GAP-039 — Eliminar @ts-nocheck de PalletView

## Metadata

- **Tipo:** Refactor
- **Módulo:** Stock
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-06-30
- **Autor:** Jose

---

## Contexto y problema

`PalletView/index.tsx` tiene `// @ts-nocheck` en la línea 1, que suprime TypeScript para todo el archivo. Esto viola las reglas de TypeScript del proyecto (strict mode) y oculta errores de tipos que podrían causar bugs en producción.

El archivo es un `.tsx` (correcto), lo que indica que fue migrado de `.jsx` en algún momento pero los errores de tipos se resolvieron con el suprimidor global en lugar de corregirse individualmente. El archivo además tiene el anti-patrón de token-as-parameter (PL-010) que genera muchos tipos `string | undefined` difíciles de manejar — eso probablemente fue el origen del `@ts-nocheck`.

---

## Solución acordada

1. Eliminar `// @ts-nocheck` de la línea 1.
2. Ejecutar TypeScript check para ver todos los errores que aparecen.
3. Corregir **todos** los errores del archivo en un único commit — aplicando el protocolo de cascada de PL-012.
4. No usar `any` sin justificación — usar `unknown` con narrowing o tipos concretos del proyecto.

**Estrategia anticipada para los errores más probables:**
- Parámetros de función/callback sin tipo → añadir tipos explícitos
- `useState([])` sin genérico → añadir `useState<Tipo[]>([])`
- Tokens `string | undefined` pasados a funciones que esperan `string` → habrá que decidir si el valor se garantiza antes de llamar o si la función acepta `undefined`

Nota: El token-as-parameter (líneas 231, 279, 313, 318, 321) se aborda en GAP-043. Sin embargo, para eliminar `@ts-nocheck` puede ser necesario añadir tipos temporales a esos parámetros. Si el orden de implementación importa, implementar GAP-043 primero para reducir la superficie de errores aquí.

---

## Criterios de aceptación

- [x] `PalletView/index.tsx` no tiene `// @ts-nocheck` en ninguna línea
- [x] `npm run type-check` termina sin errores en `PalletView/index.tsx`
- [x] No se introduce ningún `any` sin comentario justificativo
- [x] No se introduce ningún `@ts-ignore` sin comentario explicativo
- [x] El comportamiento funcional del componente no cambia
- [x] Los tests existentes (si los hay) siguen pasando

## Archivos a crear o modificar

- `src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx`

## Restricciones

- No refactorizar la lógica de negocio — solo añadir tipos y eliminar el suprimidor
- No tocar `src/hooks/usePallet.ts` (hook protegido)
- No tocar otros archivos de la carpeta PalletDialog salvo que sea imprescindible por dependencias de tipos

---

## Implementación

### Archivos modificados

- `src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx`

### Decisiones tomadas durante la implementación

GAP-043 se implementó antes que GAP-039, eliminando las extracciones de token de `useSession()` en este archivo. Esto redujo considerablemente la superficie de errores de TypeScript al quitar `@ts-nocheck`.

Correcciones aplicadas:
- Eliminado `// @ts-nocheck` de línea 1
- Añadido `import type { PalletBox } from '@/hooks/pallets/palletHelpers'`
- Tipados todos los `useState(null)` con genéricos explícitos: `useState<string | null>(null)`, `useState<number | string | null>(null)`
- Tipado `useRef<HTMLInputElement>(null)` para el ref del scanner
- Tipados explícitamente todos los parámetros de handlers: `handleOnClickBoxRow(boxId: number | string)`, `handleOnChangeBoxLot(boxId: number | string, lot: string)`, etc.
- Tipada la helper function `isBoxAvailable(box: PalletBox)`
- Tipada `getBoxProductionInfo(box: PalletBox)` con cast para el campo `production` que no está en la interfaz base: `(box as { production?: { id: number | null; lot: string | null } | null }).production`
- Tipado el parámetro de `renderBoxRow(box: PalletBox, isEditable = true)` en el JSX
- En `availableProductsInPallet` useMemo: cast para acceder a `alias` en product (`{ id: number | string; name: string; alias?: string } | null`) y null-guard explícito en el forEach
- `useSession()` se conserva porque el componente sigue necesitándolo para checks de rol (`session?.user?.role`, `isExternalActor`, `canDeletePallet`, `canManagePalletCostFields`)

### Desviaciones del plan

Ninguna.

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

Implementado y cerrado en commit junto con GAP-040, GAP-042 y GAP-043.
