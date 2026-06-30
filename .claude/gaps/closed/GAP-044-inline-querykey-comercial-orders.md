# GAP-044 — Inline queryKey literal en ComercialOrdersManager

## Metadata

- **Tipo:** Refactor
- **Módulo:** CRM / Ventas
- **Prioridad:** Media
- **Estado:** closed
- **Fecha:** 2026-06-30
- **Autor:** Jose

---

## Contexto y problema

`ComercialOrdersManager.jsx:104` usa un array literal inline en `queryClient.invalidateQueries`:

```javascript
queryClient.invalidateQueries({ queryKey: ['crm', 'offers', 'list'] });
```

Esto viola la regla ESLint `no-inline-query-keys` del proyecto (ver `src/lib/routes/queryKeys.ts`). Todos los queryKeys deben ser factories importadas de `queryKeys.ts` — no pueden ser arrays literales definidos inline, ni siquiera en llamadas a `invalidateQueries`.

---

## Solución acordada

1. Revisar `src/lib/routes/queryKeys.ts` para encontrar la factory existente para las ofertas CRM.
2. Si existe: usarla en `ComercialOrdersManager.jsx`.
3. Si no existe: añadir la factory en `queryKeys.ts` y usarla en el componente.

La factory debe retornar el mismo array `['crm', 'offers', 'list']` (o el prefijo apropiado para invalidar toda la caché de ofertas). Revisar cómo `useOffersList` define su `queryKey` para asegurar consistencia.

---

## Criterios de aceptación

- [x] `ComercialOrdersManager.jsx` no tiene ningún array literal en `queryKey` ni en `invalidateQueries`
- [x] La invalidación usa una factory importada de `@/lib/routes/queryKeys`
- [x] La factory en `queryKeys.ts` retorna un array que coincide con el patrón usado por `useOffersList`
- [x] `npm run lint` no reporta errores `no-inline-query-keys` en los archivos modificados
- [x] La invalidación de caché funciona igual que antes

## Archivos a crear o modificar

- `src/components/Comercial/CRM/ComercialOrdersManager.jsx`
- `src/lib/routes/queryKeys.ts` (la factory `offerKeys.listPrefix` ya existía — no fue necesario modificar)

## Restricciones

- No modificar la lógica de negocio del componente
- No añadir nuevas factories que no correspondan a datos reales del proyecto
- No cambiar las factories existentes en `queryKeys.ts`

---

## Implementación

### Archivos modificados

- `src/components/Comercial/CRM/ComercialOrdersManager.jsx`:
  - Añadido `import { offerKeys } from '@/lib/routes/queryKeys'`
  - Añadido `import { getCurrentTenant } from '@/lib/utils/getCurrentTenant'`
  - Añadido `const tenantId = getCurrentTenant()` en el body del componente
  - Reemplazado `queryKey: ['crm', 'offers', 'list']` por `queryKey: offerKeys.listPrefix(tenantId)`

### Decisiones tomadas durante la implementación

- `offerKeys.listPrefix` ya existía en `queryKeys.ts` → no fue necesario crear ninguna factory nueva.
- Se añade `getCurrentTenant()` para obtener el tenantId necesario para la factory, siguiendo el patrón estándar del proyecto.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10

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

Commit `[GAP-041/044/045/046]` en rama `claude/pending-gaps-implementation-kaayio`.
