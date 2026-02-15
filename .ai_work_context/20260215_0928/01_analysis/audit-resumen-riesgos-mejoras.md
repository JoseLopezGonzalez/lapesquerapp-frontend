# Resumen audit + riesgos y mejoras (input para evolución)

**Origen**: `docs/audits/nextjs-frontend-global-audit.md`  
**Última actualización**: 2026-02-15  
**Estado**: Referencia para elegir bloque y STEP 0a

---

## Top 5 riesgos sistémicos (audit)

1. **Data fetching sin caché**: Inconsistencia de datos entre pantallas, recargas innecesarias, dificultad para evolucionar a server-first.
2. **Exposición de clave de Google Maps** (y revisión de NEXT_PUBLIC_*): Riesgo de abuso y coste si el repo es accesible.
3. **Ausencia de TypeScript**: Refactors y cambios en API más costosos y propensos a regresiones.
4. **Componentes monolíticos**: EntityClient, PalletView, Order muy grandes; dificultan pruebas y mantenimiento.
5. **Cobertura de tests mínima**: Cambios sin red de seguridad; riesgo en despliegues.

---

## Top 5 mejoras de mayor impacto (audit)

1. **Introducir React Query** para estado de servidor: caché, invalidación, menos código repetido (alto impacto, esfuerzo medio).
2. **Eliminar o externalizar API key de Google Maps**; usar solo variable de entorno (alto impacto, bajo esfuerzo).
3. **Aumentar Server Components** para shell y datos iniciales de listados/detalle (alto impacto, esfuerzo medio-alto).
4. **Tipado progresivo con TypeScript**: API y modelos compartidos, luego componentes críticos (medio impacto, esfuerzo alto).
5. **Dividir componentes gigantes** (EntityClient, PalletView, Order) en subcomponentes/vistas (medio impacto, esfuerzo medio).

---

## Módulos CORE (plan consolidación)

| Módulo   | Notas (audit) |
|----------|----------------|
| **Auth** | NextAuth, middleware, tenant; bien integrado. |
| **Productos** | Entidades/EntityClient; componente muy grande. |
| **Clientes** | Parte de entidades/CRM. |
| **Ventas (Sales)** | Order, OrderDetails; componentes grandes, flujos complejos. |
| **Stock** | Almacenes, palés (PalletView muy grande), recepciones. |
| **Reportes** | Charts, datos; dangerouslySetInnerHTML en chart. |
| **Config** | Settings, Options, múltiples contextos. |

---

## Próximo paso

Usuario indica **qué módulo/bloque** abordar primero → STEP 0a (Scope & Entity Mapping) para ese bloque.
