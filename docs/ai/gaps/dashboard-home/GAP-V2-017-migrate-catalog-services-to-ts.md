---
id: GAP-V2-017
title: Migrar a TypeScript los 3 servicios de catálogo legacy usados por el dashboard (LOW complexity)
module: dashboard-home
category: architecture-refactor
priority: P3
risk: low
size: M
status: ready
dependencies:
  - GAP-V2-016
target_files:
  - src/services/speciesService.js
  - src/services/productCategoryService.js
  - src/services/productFamilyService.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-017 — Migración JS→TS por lotes: speciesService, productCategoryService, productFamilyService

## Problema

`CLAUDE.md` regla de oro 3: *"NUNCA crear archivos .js nuevos... Si tocas un .js legacy por
cualquier motivo, migrarlo a .ts en ese mismo commit"*. Estos 3 servicios usados por el
dashboard siguen en `.js`:

- `src/services/speciesService.js` (31 líneas — funciones puras de fetch, sin generics ni
  dependencias externas de tipos)
- `src/services/productCategoryService.js` (121 líneas)
- `src/services/productFamilyService.js` (129 líneas)

**Complejidad de migración: LOW** en los 3 casos — son wrappers directos de
`fetchWithTenant` con `.then/.catch`, sin lógica de negocio compleja. El propio
`productService.ts` (ya migrado, mismo dominio de "opciones para selects") sirve de
plantilla directa de patrón a seguir.

**Ficheros que los importan (efecto ripple a revisar al migrar):**
- `speciesService.js` → `src/hooks/useSpeciesOptions.js` (único importador dentro de este
  módulo; verificar otros usos fuera de dashboard-home antes de migrar)
- `productCategoryService.js` → `src/hooks/useProductOptions.js`
  (`useProductCategoryOptions`)
- `productFamilyService.js` → `src/hooks/useProductOptions.js` (`useProductFamilyOptions`)

No existe ya una versión `.ts` de ninguno de los 3 (se verificó — no hay duplicados).

## Objetivo

Los 3 archivos pasan a `.ts` con tipos explícitos de parámetros y retorno, sin `any`
implícito, siguiendo el patrón de `productService.ts`.

## Contexto

Buen candidato para GAP batch de migración (mismo dominio: opciones de catálogo para
selects). Compartir PR con `GAP-V2-016` (mismo diff de archivos) y opcionalmente
`GAP-V2-015` (alias `@lib/`) para evitar 3 PRs superpuestos sobre los mismos 3 archivos.

## Solución propuesta

1. Renombrar `.js` → `.ts` para los 3 archivos.
2. Tipar retorno como `Promise<CatalogOption[]>` (reusar tipo existente de `@/types/catalog`
   si aplica) para las funciones `*Options`, y el tipo de entidad correspondiente para
   `getProductCategory(s)`/`getProductFamily(ies)`.
3. Aplicar en el mismo commit el fix de `GAP-V2-016` (token vía `getAuthToken()`) ya que se
   está tocando el archivo de todas formas.
4. Eliminar la función local `removeDuplicateOptions` duplicada entre
   `productCategoryService` y `productFamilyService` — mover a un helper compartido si se
   mantiene necesaria, o confirmar si el backend ya deduplica (evaluar en la
   implementación).
5. Ejecutar `npm run type-check` tras cada archivo migrado, no migrar los 3 de una vez sin
   revisar errores en cascada (protocolo de CLAUDE.md para migraciones .js→.ts).

## Criterios de aceptación

- [ ] Los 3 archivos son `.ts` sin `any` implícito
- [ ] Los hooks consumidores (`useSpeciesOptions`, `useProductCategoryOptions`,
      `useProductFamilyOptions`) siguen funcionando igual
- [ ] `npm run type-check` limpio

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
npm run build
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-016
