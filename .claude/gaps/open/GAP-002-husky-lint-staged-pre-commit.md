# GAP-002 — Configurar Husky + lint-staged para pre-commit hooks

## Metadata

- **Tipo:** Mejora
- **Módulo:** Global
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-05-31
- **Autor:** Jose

---

## Contexto y problema

El proyecto no tiene pre-commit hooks. Nada impide hacer commit de código con errores de lint, imports rotos, o sin formatear. Detectado durante el análisis del setup inicial: ni `.husky/` ni `lint-staged` estaban configurados.

El efecto en el día a día: los errores de lint y de formato solo se descubren en CI (si existe) o en revisión de código — nunca en el momento en que se cometen. Cualquier agente IA que trabaje en el proyecto puede hacer commit de código que no pasa lint sin saberlo.

## Solución acordada

Instalar Husky y lint-staged. Configurar un hook `pre-commit` que ejecute sobre los archivos staged:

1. `prettier --write` — formatea los archivos antes del commit
2. `eslint --fix` — corrige errores de lint fixables automáticamente
3. Si eslint encuentra errores no fixables, bloquear el commit

El hook solo actúa sobre los archivos staged (no todo el proyecto), para que sea rápido.

## Referencias e inspiración

Stack: Husky v9 + lint-staged v15 (versiones actuales compatibles con Node 18+).

Patrón de configuración en `package.json`:

```json
"lint-staged": {
  "*.{ts,tsx,js,jsx}": ["prettier --write", "eslint --fix"],
  "*.{json,css,md}": ["prettier --write"]
}
```

## Criterios de aceptación

- [ ] `git commit` con un archivo con errores de ESLint bloqueantes falla el commit y muestra el error
- [ ] `git commit` con un archivo sin formatear lo formatea automáticamente y continúa el commit
- [ ] `git commit` con código correcto se completa normalmente sin interrupciones
- [ ] El hook solo actúa sobre los archivos staged, no sobre todo el proyecto (commit rápido)
- [ ] `npm run prepare` configura Husky automáticamente tras `npm install` (para otros devs)

## Archivos a crear o modificar

- `package.json` — añadir `husky` y `lint-staged` en devDependencies, añadir script `"prepare": "husky"`, añadir configuración `"lint-staged"`
- `.husky/pre-commit` — script del hook (creado por `npx husky init` o manualmente)

## Restricciones

- Usar Husky v9+ (usa `.husky/` sin `package.json` scripts adicionales de instalación)
- No bloquear commits por warnings de ESLint — solo por errores
- El hook debe ser rápido: si tarda más de 10 segundos en un archivo, revisar la configuración
- No configurar hooks para `commit-msg` ni `pre-push` en este GAP — solo `pre-commit`

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
