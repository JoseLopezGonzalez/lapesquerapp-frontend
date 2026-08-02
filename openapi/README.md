# Contrato OpenAPI — copia local versionada

Este directorio contiene la copia local del contrato OpenAPI publicado por el
backend Laravel (`{APP_URL}/openapi/frontend.yaml`), usada como fuente de
verdad para generar los tipos TypeScript de API del frontend.

**Estado actual: sin adoptar todavía.** Este directorio está vacío hasta que
alguien con acceso de red al backend ejecute:

```bash
npm run contract:update
```

Eso descarga `frontend.yaml` (+ `meta.json` si el backend lo publica) y
regenera `src/types/generated/api.d.ts`. Revisa el diff de git resultante
antes de hacer commit — es el único momento en que el contrato cambia.

**Mecanismo endurecido, sin modo bootstrap**: mientras este directorio esté
vacío, `npm run contract:generate`, `npm run contract:verify` y
`postinstall` (por tanto `npm ci`/`npm install`) **fallan con código de
salida 1**, no continúan en silencio. El contrato adoptado es un requisito
del repo, no un paso opcional — la única forma de destrabar `npm ci`/CI es
ejecutar `npm run contract:fetch` (o `contract:update`) una vez, con red
real hacia el backend, y comprometer el resultado.

## Archivos (una vez adoptado)

| Archivo              | Contenido                                                                 | Versionado en git |
| -------------------- | ------------------------------------------------------------------------- | ----------------- |
| `frontend.yaml`      | Copia exacta del OpenAPI publicado por el backend                         | Sí                |
| `meta.json`          | Metadatos del backend sobre esa versión del contrato (si existe)          | Sí                |
| `contract-lock.json` | `sha256` de `frontend.yaml`, `sourceUrl`, `fetchedAt`, eco de `meta.json` | Sí                |

`contract-lock.json` es lo que responde a "¿de qué versión del contrato
backend salieron estos tipos?" — y lo que `npm run contract:verify` usa para
detectar si `frontend.yaml` fue editado a mano (el contrato es de solo
lectura; la única forma válida de cambiarlo es `npm run contract:fetch`).

## Por qué se versiona `frontend.yaml` pero no los tipos generados

Frontend y backend viven en repos separados. Si el build de producción
generase los tipos directamente contra la URL en cada deploy, un despliegue
dependería silenciosamente de que esa URL esté disponible en ese instante, y
un cambio de contrato entraría en producción sin pasar por revisión de PR.
Por eso:

- `frontend.yaml` se descarga una vez, de forma explícita
  (`npm run contract:fetch`), y se versiona — el cambio se revisa como
  cualquier otro diff.
- `src/types/generated/api.d.ts` NO se versiona (ver `.gitignore`): se
  deriva de forma determinista y sin red de `frontend.yaml` en
  `postinstall` (y en CI), así que comprometerlo sería redundante y solo
  añadiría ruido de diff en cada cambio de contrato.

Ver `.claude/api-contract-guide.md` para el flujo completo y
`.claude/rules/api-contract.md` para las reglas detalladas.
