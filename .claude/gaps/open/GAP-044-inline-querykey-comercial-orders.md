# GAP-044 — Inline queryKey literal en ComercialOrdersManager

## Metadata

- **Tipo:** Refactor
- **Módulo:** CRM / Ventas
- **Prioridad:** Media
- **Estado:** open
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

- [ ] `ComercialOrdersManager.jsx` no tiene ningún array literal en `queryKey` ni en `invalidateQueries`
- [ ] La invalidación usa una factory importada de `@/lib/routes/queryKeys`
- [ ] La factory en `queryKeys.ts` retorna un array que coincide con el patrón usado por `useOffersList`
- [ ] `npm run lint` no reporta errores `no-inline-query-keys` en los archivos modificados
- [ ] La invalidación de caché funciona igual que antes (las ofertas se recargan tras las acciones pertinentes)

## Archivos a crear o modificar

- `src/components/Comercial/CRM/ComercialOrdersManager.jsx`
- `src/lib/routes/queryKeys.ts` (solo si la factory no existe ya)

## Restricciones

- No modificar la lógica de negocio del componente
- No añadir nuevas factories que no correspondan a datos reales del proyecto
- No cambiar las factories existentes en `queryKeys.ts`

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
