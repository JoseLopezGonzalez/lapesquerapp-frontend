# GAP-039 — Eliminar @ts-nocheck de PalletView

## Metadata

- **Tipo:** Refactor
- **Módulo:** Stock
- **Prioridad:** Alta
- **Estado:** open
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

- [ ] `PalletView/index.tsx` no tiene `// @ts-nocheck` en ninguna línea
- [ ] `npm run type-check` termina sin errores en `PalletView/index.tsx`
- [ ] No se introduce ningún `any` sin comentario justificativo
- [ ] No se introduce ningún `@ts-ignore` sin comentario explicativo
- [ ] El comportamiento funcional del componente no cambia
- [ ] Los tests existentes (si los hay) siguen pasando

## Archivos a crear o modificar

- `src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx`

## Restricciones

- No refactorizar la lógica de negocio — solo añadir tipos y eliminar el suprimidor
- No tocar `src/hooks/usePallet.ts` (hook protegido)
- No tocar otros archivos de la carpeta PalletDialog salvo que sea imprescindible por dependencias de tipos

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
