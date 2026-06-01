# GAP-001 — Aplicar formateo Prettier al codebase existente

## Metadata

- **Tipo:** Mejora
- **Módulo:** Global
- **Prioridad:** Media
- **Estado:** open
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
