# Resumen: Riesgos sistémicos y mejoras (Auditoría Next.js)

**Fuente**: `docs/audits/nextjs-frontend-global-audit.md`

## Top 5 riesgos sistémicos
1. **Data fetching sin caché**: Inconsistencia de datos, recargas innecesarias (mitigado en Dashboard, Ventas, Stock).
2. **Exposición de clave Google Maps**: Fallback hardcodeado en OrderDetails; revisar NEXT_PUBLIC_*.
3. **Ausencia de TypeScript**: Refactors más costosos (parcialmente mitigado en Auth, Ventas).
4. **Componentes monolíticos**: EntityClient, PalletView, etc. (Ventas ya refactorizado).
5. **Cobertura de tests mínima**: Riesgo en despliegues (mejorado en Auth, orderService, Ventas hooks).

## Top 5 mejoras de alto impacto
1. React Query para estado de servidor (parcialmente aplicado).
2. Externalizar API key Google Maps.
3. Más Server Components para shell y datos iniciales.
4. Tipado progresivo TypeScript (en curso).
5. Dividir componentes gigantes (Ventas y Stock ya abordados).
