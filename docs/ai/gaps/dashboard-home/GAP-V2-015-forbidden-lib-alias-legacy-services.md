---
id: GAP-V2-015
title: Alias de import prohibido `@lib/` (sin barra) en servicios legacy usados por el dashboard
module: dashboard-home
category: code-quality
priority: P3
risk: low
size: XS
status: candidate
dependencies: []
target_files:
  - src/services/speciesService.js
  - src/services/productCategoryService.js
  - src/services/productFamilyService.js
  - src/services/punchService.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-015 — Import con alias `@lib/` prohibido por convención del proyecto

## Problema

`CLAUDE.md` establece explícitamente: *"El alias correcto en este proyecto es siempre `@/`
(con barra)... ❌ `import { X } from '@lib/utils'`"*. Cuatro servicios usados por
`dashboard-home` violan esta regla:

```js
// src/services/speciesService.js:4
import { fetchWithTenant } from '@lib/fetchWithTenant';

// src/services/productCategoryService.js:1
import { fetchWithTenant } from '@lib/fetchWithTenant';

// src/services/productFamilyService.js:1
import { fetchWithTenant } from '@lib/fetchWithTenant';

// src/services/punchService.js:1
import { fetchWithTenant } from '@lib/fetchWithTenant';
```

Todos los demás servicios ya migrados o creados recientemente en este mismo módulo
(`storeService.ts`, `productService.ts`, `getReceptionChartData.ts`, `getDispatchChartData.ts`)
usan correctamente `@/lib/fetchWithTenant`.

## Objetivo

Los 4 archivos importan `fetchWithTenant` (y cualquier otro import de `@/lib/*`) usando
siempre el alias `@/`.

## Contexto

Fix mecánico y de bajísimo riesgo — no requiere migrar estos archivos a `.ts` para
corregirlo (aunque 3 de los 4 son también candidatos de migración, ver GAP-V2-017).

## Solución propuesta

```diff
- import { fetchWithTenant } from '@lib/fetchWithTenant';
+ import { fetchWithTenant } from '@/lib/fetchWithTenant';
```

Aplicar en los 4 archivos. Confirmar en `tsconfig.json` que ambos alias (`@lib/*` y `@/*`)
siguen resolviendo igual antes/después (no debería cambiar nada en runtime, solo la
convención de import).

## Criterios de aceptación

- [ ] Ningún archivo del módulo dashboard-home importa con `@lib/`
- [ ] `npm run type-check` y `npm run lint` limpios

## Plan de validación

```text
npm run type-check
npm run lint
npm run test:run
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
