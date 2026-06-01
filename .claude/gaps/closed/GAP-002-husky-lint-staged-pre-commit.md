# GAP-002 — Configurar Husky + lint-staged para pre-commit hooks

## Metadata

- **Tipo:** Mejora
- **Módulo:** Global
- **Prioridad:** Alta
- **Estado:** closed
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

- [x] `git commit` con un archivo con errores de ESLint bloqueantes falla el commit y muestra el error
- [x] `git commit` con un archivo sin formatear lo formatea automáticamente y continúa el commit
- [x] `git commit` con código correcto se completa normalmente sin interrupciones
- [x] El hook solo actúa sobre los archivos staged, no sobre todo el proyecto (commit rápido)
- [x] `npm run prepare` configura Husky automáticamente tras `npm install` (para otros devs)

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

### Archivos creados

- `eslint.config.mjs` — flat config para ESLint 9, importa `eslint-config-next/core-web-vitals` directamente y conserva la regla custom `no-restricted-syntax` para queryKeys
- `.husky/pre-commit` — hook que ejecuta `npx lint-staged`

### Archivos modificados

- `package.json` — actualiza `eslint` a `^9.39.4`, añade `husky` v9 y `lint-staged` v17, añade scripts `lint:fix` y `prepare`, añade sección `lint-staged`
- `package-lock.json` — actualizado automáticamente

### Archivos eliminados

- `.eslintrc.json` — sustituido por `eslint.config.mjs` (formato flat config de ESLint 9)

### Decisiones tomadas durante la implementación

- **Scope ampliado:** ESLint estaba roto (ESLint 8 incompatible con `eslint-config-next` v16 que requiere ESLint ≥9). Se corrigió dentro de este GAP con autorización explícita de Jose.
- **Flat config directo:** En lugar de usar `FlatCompat` (que también falla), se importa `eslint-config-next/core-web-vitals` directamente como array flat config — es la forma nativa de ESLint 9.
- **`npm run lint` corregido:** `next lint` fue eliminado en Next.js 16. El script ahora llama a `eslint src`.
- **Verificación en vivo:** El hook pre-commit se ejecutó durante el propio commit final y pasó correctamente.

### Desviaciones del plan (si las hay)

- Se actualizó ESLint de v8 a v9 (scope extra respecto al GAP original, autorizado por Jose)
- Se migró `.eslintrc.json` a `eslint.config.mjs` (necesario para ESLint 9)
- `npm run lint` ahora llama a `eslint src` en vez de `next lint`

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10

### Checklist

- [x] Criterios de aceptación cumplidos — hook ejecutado y verificado en commit real
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos (el flat config se creó como `.mjs`)
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta

### Observaciones para Jose

1. **149 errores ESLint preexistentes en el codebase.** El hook de pre-commit correrá `eslint --fix` sobre los archivos que toques. Si el archivo tiene errores preexistentes no fixables, el commit se bloqueará. Esto puede sorprender la primera vez — es el comportamiento correcto (boy scout rule). Se puede usar `// eslint-disable-next-line` puntualmente si es necesario en código legacy.

2. **`npm run lint` ya funciona** correctamente con `eslint src`. Antes devolvía error porque `next lint` no existe en Next.js 16.

3. **`npm run prepare`** instalará Husky automáticamente para cualquier desarrollador que haga `npm install`.

### Estado final de la implementación

Implementación completa y verificada. El hook pre-commit formatea y lintea automáticamente los archivos staged antes de cada commit.
