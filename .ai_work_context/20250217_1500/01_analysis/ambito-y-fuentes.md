# Análisis — Ámbito y fuentes

**Estado**: Completado  
**Última actualización**: 2025-02-17

## Ámbito del rastreo

- **Nombre directo**: "La PesquerApp", "PesquerApp", variantes de mayúsculas.
- **Referencias indirectas**: Dominios (lapesquerapp.es, pesquerapp.com), metadatos (og:site_name), emails.
- **Derivados/identificadores**: Fallbacks en config (api.lapesquerapp.es), baseDomain en código, package name (brisapp-nextjs como repo; manifest con "La PesquerApp ERP").
- **Branding**: Layout metadata, manifest, PWA, textos en login/landing/footer, comentarios en código.

## Fuentes rastreadas

- `src/` (JS/TS/JSX/TSX)
- `public/` (manifest, íconos)
- `docs/` (excluyendo solo sesiones `.ai_work_context`)
- Configuración: `package.json`, `.env.example`, `next.config.*`, `src/configs/`
- Layout raíz y metadatos: `src/app/layout.js`

## Criterio

Ante duda, incluir en el reporte (evitar falsos negativos).
