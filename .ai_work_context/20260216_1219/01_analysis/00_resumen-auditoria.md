# Resumen auditoría — Input para evolución

**Fuente**: `docs/audits/nextjs-frontend-global-audit.md`  
**Fecha**: 2026-02-16

## Top 5 riesgos sistémicos

1. **Data fetching sin caché**: Inconsistencia de datos entre pantallas, recargas innecesarias, dificultad para evolucionar a server-first.
2. **Exposición de clave de Google Maps** (y posiblemente otros secretos en NEXT_PUBLIC_): Riesgo de abuso y coste si el repo es accesible.
3. **Ausencia de TypeScript**: Refactors y cambios en API más costosos y propensos a regresiones.
4. **Componentes monolíticos**: EntityClient, PalletView, Order; dificultan pruebas, revisión y onboarding.
5. **Cobertura de tests mínima**: Cambios sin red de seguridad; riesgo en despliegues.

## Top 5 mejoras de mayor impacto

1. Introducir React Query para estado de servidor (caché, invalidación, menos código repetido).
2. Eliminar o externalizar API key de Google Maps; usar solo variable de entorno.
3. Aumentar uso de Server Components para shell y datos iniciales.
4. Tipado progresivo con TypeScript (API, modelos compartidos, componentes críticos).
5. Dividir componentes gigantes en subcomponentes o vistas por pestaña/paso.

## Puntuación madurez global

~4,7 / 10 (promedio aproximado auditoría global)

## Patrones estructurales (resumen)

| Patrón | Estado | Nota |
|--------|--------|------|
| Custom Hooks | Bien | useOrder, useStore, usePallet, useProductionRecord, etc. |
| Formularios | Bien | react-hook-form + zod consistente |
| API Layer | Bien | fetchWithTenant, servicios centralizados |
| Data Fetching | Débil | Manual, sin caché, sin React Query |
| Server/Client | Parcial | Predominio cliente, poco RSC para datos |
| TypeScript | Ausente | 100% JavaScript |
| Testing | Muy bajo | 3 archivos de test |
| UI | Bien | shadcn/ui consistente; coexistencia NextUI/Headless no documentada |
