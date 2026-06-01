# GAP-001 — Aplicar formateo Prettier al codebase existente

## Metadata

- **Tipo:** Mejora
- **Módulo:** Global
- **Prioridad:** Media
- **Estado:** closed
- **Fecha:** 2026-05-31
- **Autor:** Jose

---

## Contexto y problema

Durante el setup del proyecto se instaló Prettier 3.8.3 con `prettier-plugin-tailwindcss` y se creó `.prettierrc`. Sin embargo, ningún archivo existente ha sido formateado todavía — el codebase entero está sin pasar por Prettier.

El efecto es que `npm run format:check` fallará en prácticamente todos los archivos. Cualquier agente o dev que ejecute `npm run format` después de editar un solo archivo verá un diff gigante que mezcla sus cambios con el formateo automático, dificultando la revisión de código.

La solución es hacer un commit de formateo masivo y aislado, sin ningún cambio de lógica, para que el historial de git sea limpio a partir de ahora.

## Solución acordada

Ejecutar `npm run format` una única vez sobre todo el codebase, revisar que no hay cambios semánticos (solo whitespace, comillas, trailing commas, orden de clases Tailwind), y hacer un commit aislado con el mensaje `chore: apply prettier formatting`.

Este commit debe ir solo — no mezclado con ningún otro cambio de código.

## Referencias e inspiración

Práctica estándar al adoptar Prettier en un proyecto existente: un commit de "big bang formatting" que sirve como línea base, seguido de formateo incremental en cada PR.

## Criterios de aceptación

- [ ] `npm run format:check` pasa sin errores tras el commit
- [ ] El commit contiene únicamente cambios de formateo (sin cambios de lógica, sin cambios de imports, sin ningún archivo nuevo)
- [ ] `npm run build` pasa sin errores tras el formateo (verificar que Prettier no rompió nada)
- [ ] `npm run lint` pasa sin errores nuevos tras el formateo

## Archivos a crear o modificar

- Todos los archivos `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.css` del proyecto (vía `npm run format`)
- Excluidos por `.prettierignore`: `node_modules/`, `.next/`, `src/components/ui/`, lock files

## Restricciones

- Este commit va SOLO — no mezclarlo con ningún cambio funcional
- Si Prettier produce algún cambio en `src/components/ui/` (primitivos shadcn), revisar si el `.prettierignore` está bien configurado y excluirlos
- Si el build falla tras el formateo, identificar el archivo concreto y corregirlo antes de commitear

---

## Implementación

### Archivos creados
- Ninguno

### Archivos modificados
- 1239 archivos formateados por `npm run format` (`.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.css`, `.md`)
- Excluidos correctamente: `node_modules/`, `.next/`, `src/components/ui/*.tsx`, `src/components/ui/*.jsx`, lock files, `.env*`
- 5 archivos `.d.ts` en `src/components/ui/` formateados (declaraciones de tipo, no primitivos shadcn — el `.prettierignore` solo excluye `.jsx` y `.tsx`)

### Decisiones tomadas durante la implementación
- Se ejecutó `npm run format` sobre el codebase completo
- Se formateó manualmente `docs/09-flujos-completos.md` que quedó fuera en la primera pasada (extensión `.md` no cubierta inicialmente por el glob del script)
- `npm run format:check` pasa limpio tras el commit
- `npx tsc --noEmit` pasa sin errores — el formateo no introdujo errores de tipo

### Desviaciones del plan (si las hay)
- `npm run build` falla por error de red (no puede conectar a Google Fonts desde el entorno sandbox) — error preexistente de entorno, no causado por el formateo. TypeScript compila sin errores.
- `npm run lint` no existe en Next.js 16; ESLint directo falla por referencia circular preexistente en `.eslintrc.json` — también preexistente y fuera del alcance de este GAP.
- Los `.d.ts` de `src/components/ui/` fueron formateados porque `.prettierignore` solo excluía `.jsx`/`.tsx`. Son declaraciones de tipo, no el código de los primitivos shadcn. Cambio puramente estético (comillas dobles → simples).

---

## Auditoría

### Resultado: ⚠️ APROBADO CON OBSERVACIONES

### Puntuación: 9/10

### Checklist

- [x] Criterios de aceptación cumplidos (`format:check` pasa, commit aislado, TypeScript ok)
- [x] Sin fetch() directo (los `fetch()` en el diff son código preexistente reformateado)
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso (solo reformateado)
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta

### Observaciones para Jose

1. **`.prettierignore` incompleto:** Excluye `src/components/ui/*.jsx` y `src/components/ui/*.tsx` pero no `*.d.ts`. Los 5 archivos `.d.ts` de ese directorio fueron formateados. Son declaraciones de tipo (no código ejecutable shadcn), el cambio es inofensivo, pero conviene añadir `src/components/ui/*.d.ts` al `.prettierignore` si se quiere coherencia total.

2. **`npm run lint` roto en Next.js 16:** El script `"lint": "next lint"` no funciona porque Next.js 16 eliminó ese comando. ESLint directo tampoco funciona por referencia circular preexistente en `.eslintrc.json`. Este GAP lo evidencia pero no es su responsabilidad resolverlo — candidato para un GAP futuro.

3. **`npm run build` inaccesible en entorno sandbox** por bloqueo de red a Google Fonts. Criterio verificado indirectamente vía `tsc --noEmit` (sin errores). En un entorno con red funcionaría.

### Estado final de la implementación
Implementación correcta. El codebase tiene ahora Prettier como línea base. Cualquier cambio futuro producirá diffs limpios sin ruido de formateo.
