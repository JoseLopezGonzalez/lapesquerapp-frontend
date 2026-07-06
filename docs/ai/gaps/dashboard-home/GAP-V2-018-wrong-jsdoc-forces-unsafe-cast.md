---
id: GAP-V2-018
title: JSDoc incorrecto en useSettingsData.js obliga a un cast `as unknown as` inseguro en useCompanySetupCheck.ts
module: dashboard-home
category: code-quality
priority: P4
risk: low
size: XS
status: candidate
dependencies: []
target_files:
  - src/hooks/useSettingsData.js
  - src/hooks/useCompanySetupCheck.ts
created_at: 2026-07-06
updated_at: 2026-07-06
---

# GAP-V2-018 — JSDoc de useSettingsData.js no coincide con el retorno real

## Problema

```js
// src/hooks/useSettingsData.js:13-17
/**
 * React Query hook for tenant settings.
 * Replaces manual fetch in SettingsContext.
 * @returns {{ data, isLoading, error, refetch, setSettings }}
 */
export function useSettingsData() {
  ...
  return {
    settings: query.data ?? {},   // ← no es "data"
    loading: query.isLoading,     // ← no es "isLoading"
    error: query.error,
    refetch: query.refetch,
    setSettings,
  };
}
```

El JSDoc declara `data`/`isLoading` pero el objeto devuelto realmente expone
`settings`/`loading`. El propio consumidor de este módulo ya detectó la discrepancia y la
documentó con un comentario duplicado (dos líneas idénticas seguidas) en vez de corregir el
JSDoc en origen:

```ts
// src/hooks/useCompanySetupCheck.ts:21-26
// useSettingsData.js has a wrong JSDoc (@returns data/isLoading) but actual return is settings/loading
// useSettingsData.js has a wrong JSDoc (@returns data/isLoading) but actual return is settings/loading
const { settings, loading } = useSettingsData() as unknown as {
  settings: Record<string, unknown>;
  loading: boolean;
};
```

El cast `as unknown as` es la señal de un problema de tipado real: como `useSettingsData.js`
es `.js` sin tipos fuertes, TypeScript no puede verificar la forma del objeto devuelto, y en
vez de corregir la fuente, el consumidor tuvo que forzar un doble cast (pasando por
`unknown`) para silenciar el error — exactamente el patrón que
`.claude/rules/typescript.md` señala como prohibido salvo justificación explícita (aquí sí
hay un comentario explicando el motivo, pero la causa raíz — el JSDoc incorrecto — sigue sin
arreglarse, y el comentario está duplicado por error de copia).

## Objetivo

`useSettingsData.js` documenta correctamente su retorno real, y `useCompanySetupCheck.ts` ya
no necesita el cast `as unknown as` (idealmente tipando `useSettingsData` en TS directamente,
o al menos corrigiendo el JSDoc para que el cast único sea explícito y justificado sin
duplicar el comentario).

## Contexto

Encontrado en la auditoría de code-quality de `dashboard-home`. Bajo impacto, arreglo
rápido.

## Solución propuesta

1. Corregir el JSDoc de `useSettingsData.js` para reflejar el retorno real
   (`{ settings, loading, error, refetch, setSettings }`).
2. Eliminar el comentario duplicado en `useCompanySetupCheck.ts` (líneas 21-22, idénticas).
3. Si se aborda junto con una migración de `useSettingsData.js` a `.ts` (fuera del alcance
   estricto de este módulo, ya que se usa ampliamente fuera de dashboard-home), el cast
   `as unknown as` podría eliminarse por completo — dejarlo como nota de seguimiento, no
   como criterio de aceptación obligatorio de este GAP.

## Criterios de aceptación

- [ ] El JSDoc de `useSettingsData.js` coincide con su retorno real
- [ ] Comentario duplicado eliminado en `useCompanySetupCheck.ts`
- [ ] `npm run type-check` limpio

## Plan de validación

```text
npm run type-check
npm run lint
```

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
