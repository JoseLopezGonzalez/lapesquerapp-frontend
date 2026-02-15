# Síntesis de auditoría — Riesgos y mejoras

**Origen**: `docs/audits/nextjs-frontend-global-audit.md` + `docs/audits/findings/structural-patterns-usage.md`  
**Última actualización**: 2026-02-15

---

## Top 5 riesgos sistémicos (auditoría)

1. **Data fetching sin caché**  
   Inconsistencia de datos entre pantallas, recargas innecesarias y dificultad para evolucionar a un modelo server-first.

2. **Exposición de clave de Google Maps** (y posiblemente otros secretos en `NEXT_PUBLIC_*`)  
   Riesgo de abuso y coste si el repositorio es accesible.

3. **Ausencia de TypeScript**  
   Refactors y cambios en API más costosos y propensos a regresiones.

4. **Componentes monolíticos**  
   Dificultan pruebas, revisión y onboarding; acoplan UI y lógica (EntityClient, PalletView, Order en 1000–1800 líneas).

5. **Cobertura de tests mínima**  
   Cambios sin red de seguridad automatizada; riesgo en despliegues y evolución (solo 3 archivos de test).

---

## Top 5 mejoras de mayor impacto (auditoría, sección 15)

1. **Introducir React Query (o similar)** para estado de servidor: caché, invalidación y menos código repetido de loading/error (alto impacto, esfuerzo medio).
2. **Eliminar o externalizar la API key de Google Maps** del código; usar solo variable de entorno (alto impacto, bajo esfuerzo).
3. **Aumentar el uso de Server Components** para shell y datos iniciales de listados/detalle donde no haga falta interactividad inmediata (alto impacto, esfuerzo medio-alto).
4. **Tipado progresivo con TypeScript**: empezar por API y modelos compartidos, luego componentes críticos (medio impacto, esfuerzo alto).
5. **Dividir componentes gigantes** (EntityClient, PalletView, Order) en subcomponentes o vistas por pestaña/paso (medio impacto, esfuerzo medio).

---

## Mapeo a módulos CORE (PesquerApp)

| Módulo CORE   | Relación con riesgos/mejoras |
|---------------|------------------------------|
| **Auth**      | Seguridad (NEXT_PUBLIC_*, secrets), TypeScript en flujos de login/tenant. |
| **Productos** | Data fetching (listados), componentes grandes si los hay, tipos de API. |
| **Clientes**  | Data fetching, formularios (Zod ya usado), tipos. |
| **Ventas (Pedidos)** | Componente Order muy grande, data fetching, React Query, tipos; clave Google Maps en OrderDetails. |
| **Stock**     | EntityClient, PalletView muy grandes; data fetching, hooks (useStore, usePallet). |
| **Reportes**  | Data fetching, posibles componentes pesados, tipos. |
| **Config**    | Settings/Options contexts, posible consolidación; tipos y tests. |

**Nota**: El prompt de evolución pide **no** empezar de forma arbitraria; el usuario debe indicar qué módulo abordar primero.
