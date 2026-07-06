---
id: GAP-V2-138
title: Imports muertos de helpers genéricos en rawMaterialReceptionService.js y ceboDispatchService.js
module: dashboard-home
category: code-quality
priority: P4
risk: low
size: XS
status: later
dependencies: []
target_files:
  - src/services/domain/raw-material-receptions/rawMaterialReceptionService.js
  - src/services/domain/cebo-dispatches/ceboDispatchService.js
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-138 — Imports sin usar en los services de recepciones y salidas de cebo

## Problema

Ambos services importan helpers genéricos que nunca llaman:

```js
// src/services/domain/raw-material-receptions/rawMaterialReceptionService.js:16-25
import {
  fetchEntitiesGeneric,
  deleteEntityGeneric,
  performActionGeneric,       // ← nunca usado en el archivo
} from '@/services/generic/entityService';
...
import {
  fetchEntityDataGeneric,
  submitEntityFormGeneric,
  fetchAutocompleteOptionsGeneric,  // ← nunca usado; el service no tiene método getOptions()
} from '@/services/generic/editEntityService';
```

```js
// src/services/domain/cebo-dispatches/ceboDispatchService.js:13-18
import {
  fetchEntitiesGeneric,
  deleteEntityGeneric,
  performActionGeneric,     // ← nunca usado
  downloadFileGeneric,      // ← nunca usado
} from '@/services/generic/entityService';
```

Son imports muertos — no afectan el runtime (tree-shaking los elimina del bundle), pero
generan ruido de lectura y sugieren funcionalidad (acciones custom, descarga de archivos,
opciones de autocompletado) que en realidad no está implementada en estos services.

## Objetivo

Ambos services importan únicamente lo que usan.

## Contexto

Encontrado en la auditoría de code-quality de `dashboard-home`. Cambio trivial, sin riesgo.

## Solución propuesta

1. En `rawMaterialReceptionService.js`, quitar `performActionGeneric` del primer import y
   `fetchAutocompleteOptionsGeneric` del segundo (a menos que se planee añadir un método
   `getOptions()` a corto plazo — en ese caso, mantenerlo y añadir el método en el mismo
   commit).
2. En `ceboDispatchService.js`, quitar `performActionGeneric` y `downloadFileGeneric` del
   import de `entityService`.
3. Ejecutar `npm run lint` para confirmar que no quedan más imports sin usar en ninguno de los
   dos archivos.

## Criterios de aceptación

- [ ] Ningún import sin usar en `rawMaterialReceptionService.js` ni en `ceboDispatchService.js`.
- [ ] `npm run lint` limpio para ambos archivos.
- [ ] `npm run type-check` limpio.

## Plan de validación

```text
npm run lint
npm run type-check
npm run test:run
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
