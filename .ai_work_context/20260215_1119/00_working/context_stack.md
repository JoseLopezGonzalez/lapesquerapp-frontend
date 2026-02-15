# Context stack

Resumen del contexto cargado en esta sesión.

## Documentos base

- `PROTOCOLO_PARA_CHAT.md` — Reglas de memoria de trabajo
- `docs/prompts/02_Nextjs frontend evolution prompt.md` — Workflow de evolución frontend
- `docs/audits/nextjs-frontend-global-audit.md` — Auditoría global

## Top 5 riesgos sistémicos (auditoría)

1. Data fetching sin caché (inconsistencia, recargas, dificultad server-first)
2. Exposición de clave Google Maps (riesgo de abuso)
3. Ausencia de TypeScript (refactors costosos)
4. Componentes monolíticos (EntityClient, PalletView, Order)
5. Cobertura de tests mínima

## Top 5 mejoras de alto impacto (auditoría)

1. Introducir React Query para estado de servidor
2. Eliminar/externalizar API key de Google Maps
3. Aumentar uso de Server Components
4. Tipado progresivo con TypeScript
5. Dividir componentes gigantes

## Sesión anterior

- `.ai_work_context/20260215_0928/` — Bloque Auth en progreso
