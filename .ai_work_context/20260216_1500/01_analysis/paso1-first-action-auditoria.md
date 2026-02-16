# Paso 1 — First Action (auditoría)

**Fuente**: `docs/audits/nextjs-frontend-global-audit.md`

---

## Top 5 Riesgos Sistémicos

1. **Data fetching sin caché**: Inconsistencia de datos entre pantallas, recargas innecesarias y dificultad para evolucionar a server-first.
2. **Exposición de clave de Google Maps** (y posiblemente otros secretos en NEXT_PUBLIC_): Riesgo de abuso y coste si el repo es accesible.
3. **Ausencia de TypeScript**: Refactors y cambios en API más costosos y propensos a regresiones.
4. **Componentes monolíticos**: Dificultan pruebas, revisión y onboarding; acoplan UI y lógica.
5. **Cobertura de tests mínima**: Cambios sin red de seguridad automatizada; riesgo en despliegues y evolución.

---

## Top 5 Mejoras de Mayor Impacto

1. **Introducir React Query** (o similar) para estado de servidor: caché, invalidación y menos código repetido de loading/error (alto impacto, esfuerzo medio).
2. **Eliminar o externalizar la API key de Google Maps** del código; usar solo variable de entorno (alto impacto, bajo esfuerzo).
3. **Aumentar el uso de Server Components**: al menos para shell y datos iniciales de listados/detalle (alto impacto, esfuerzo medio-alto).
4. **Tipado progresivo con TypeScript**: empezar por API y modelos compartidos, luego componentes críticos (medio impacto, esfuerzo alto).
5. **Dividir componentes gigantes** (EntityClient, PalletView, Order) en subcomponentes o vistas por pestaña/paso (medio impacto, esfuerzo medio).

---

## Patrones estructurales Next.js/React (auditoría)

| Patrón | Presencia | Corrección | Consistencia |
|--------|-----------|------------|--------------|
| Server/Client Components | Parcial | Aceptable | Baja: predominio cliente |
| Custom Hooks | Sí | Correcta | Alta |
| Data Fetching | Manual | Sin caché/invalidación | Repetido |
| Formularios | react-hook-form + zod | Correcto | Alta |
| State Management | Context API | Correcto | Múltiples contextos |
| API Layer | fetchWithTenant + servicios | Correcto | Alta |
| TypeScript | No | N/A | N/A |
| UI Library | shadcn/ui | Consistente | Alta |
| Testing | Mínimo | 3 archivos | Muy baja |
