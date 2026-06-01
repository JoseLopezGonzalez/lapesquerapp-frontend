# Cursor Agent Prompt — Limpieza REAL de /docs (orden invertido) — Next.js Frontend PesquerApp

Eres un Staff/Principal Engineer experto en Next.js y documentación técnica. Tu misión es **arreglar /docs de verdad** en el frontend PesquerApp, pero con este orden obligatorio:

✅ **ORDEN OBLIGATORIO**

1. Primero: **procesa archivo por archivo** (uno a uno) y déjalo perfecto **en su ubicación actual**.
2. Segundo: cuando TODOS los archivos estén "curados" y renombrados, entonces:
   - haces una **auditoría global**
   - decides **reubicaciones / reestructura / merges** basándote en los NUEVOS nombres y contenidos.

No hagas inventarios iniciales ni reorganices carpetas al principio. No empieces por "estructura ideal". Empieza por el primer archivo y sigue hasta el último.

---

## Fase 1 — Operación quirúrgica (archivo por archivo)

Recorre `/docs` **en orden determinista** (alfabético por ruta completa). Para CADA archivo:

### 1) Leer y entender

- Resume en 1–2 líneas qué pretende hacer el doc.
- Identifica si es: guía, how-to, runbook, referencia, notas, ADR, borrador, etc.

### 2) Verificar contra el repo (obligatorio)

Comprueba que lo que afirma el doc sea cierto mirando el proyecto:

- `README.md`, `package.json`, `package-lock.json` o `yarn.lock` / `pnpm-lock.yaml`
- `next.config.*`, `tsconfig.json`, `tailwind.config.*` (si aplica)
- `.env.example`, `.env.local.example`
- `docker-compose*`, `Dockerfile*`, `.github/*`
- `app/` (App Router) o `pages/` (Pages Router), `components/`, `lib/`, `hooks/`, `styles/`
- `public/`, configuración de API (base URL, tenant header, auth)

Regla: **NO inventes**. Si algo no se puede verificar, debes:

- o reescribirlo como "esto depende de X / pendiente de validar"
- o eliminarlo si es humo/ruido

### 3) Decidir y ejecutar la acción en ese mismo momento

Para ese archivo, elige y ejecuta lo necesario (sin esperar a la fase global):

- ✍️ REWRITE: reescribir desde cero si está mal estructurado/obsoleto
- 🛠️ UPDATE: corregir y actualizar
- ♻️ MERGE-TODO: si detectas duplicidad, no reorganices aún: deja una nota mínima tipo "se fusionará con X en fase 2" y ajusta el contenido para que no se contradiga
- 🗑️ DELETE: si es incorrecto, redundante, o peligroso
- ✅ KEEP: si está perfecto

### 4) Renombrado inmediato (obligatorio) — método genérico

Renombra el archivo **en ese momento** (aunque aún no lo muevas de carpeta).

**Formato final de nombre**
`NN-topic[-scope].md`

- `NN` = orden (00–99) dentro de _su categoría conceptual_, aunque aún no exista la carpeta final
- `topic` = kebab-case corto y descriptivo
- `scope` opcional = local | staging | production | docker | ci | auth | api | tenant | ui | components

Ejemplos:

- `01-local-setup.md`
- `03-deploy-docker.md`
- `10-multi-tenant-frontend.md`
- `20-api-consumption-auth.md`
- `30-components-conventions.md`

**Reglas**

- Sin espacios, sin mayúsculas.
- El H1 del documento debe quedar alineado con el nuevo nombre (no literal, pero sí equivalente).
- Si un archivo mezcla 2 objetivos, divídelo en 2 archivos (crea el segundo ya con nombre correcto).

### 5) Normalización del contenido (mínimo obligatorio)

Deja cada doc con esta estructura mínima (si aplica):

- H1
- Objetivo
- Alcance (a quién aplica / qué partes del proyecto)
- Pasos / Procedimiento
- Validación (cómo comprobar que funciona)
- Problemas comunes
- Relacionado (enlaces a otros docs que existan)

### 6) Registro de decisiones (sin crear "auditoría" al principio)

Solo mantén un log mínimo, incremental, conforme vas tocando archivos:

Crea/actualiza:

- `/docs/_worklog/CHANGES.md` (una línea por archivo: ruta original → nuevo nombre, acción, motivo)
- `/docs/_worklog/VERIFY.md` (si algo queda como "no verificable", anótalo aquí con lo que faltó para verificar)

> Importante: En Fase 1 NO reestructures carpetas. Solo renombra y limpia contenido, y como mucho creas `_worklog`.

---

## Fase 2 — Auditoría global (solo al final)

Cuando ya hayas pasado por TODOS los archivos:

1. Analiza el conjunto final ya "curado" (nombres + contenido).
2. Identifica duplicidades reales y ejecuta merges finales.
3. Propón (y ejecuta) una reestructura limpia de carpetas si aporta valor:
   - reubicar documentos
   - crear índices por carpeta
   - crear un mapa general de documentación

### Estructura objetivo (si decide aplicarla)

No es obligatoria, solo si realmente mejora:

/docs
/00-overview
/01-getting-started
/02-development
/03-deployment
/04-architecture
/05-api-integrations
/06-components-ui
/07-operations-runbooks
/08-troubleshooting
/09-decisions-adr
/\_worklog

4. Genera:

- `/docs/00-overview/00-docs-map.md` (mapa general con enlaces)
- índices `README.md` o `index.md` por carpeta (si reestructuras)

---

## Instrucción explícita sobre "skills"

Apóyate en "skills" si lo necesitas: plantillas, consistencia editorial, checklists, buenas prácticas de documentación. Úsalas como guía para **actuar**, no para hacer primero una auditoría teórica.

---

## Modo de ejecución (muy importante)

- Actúa **sin pedir confirmación por cada archivo**.
- Pregunta SOLO si hay una duda crítica que impida validar (ej: si el deploy real es Vercel vs Docker y el repo no lo deja claro).
- Prioriza dejar **cada archivo** perfecto antes de pasar al siguiente.
