# STEP 2 — Cambios propuestos — Sub-bloque 1: Fundación

**Bloque**: Stock/Inventario/Almacenes  
**Sub-bloque**: 1 — Fundación (Dashboard Stock + limpieza StoresManager)  
**Rating antes**: 4/10

---

## Mejoras a aplicar

1. **Migrar CurrentStockCard, StockBySpeciesCard, StockByProductsCard a React Query**
   - Crear hook `useStockStats` (o hooks separados: useTotalStockStats, useStockBySpecies, useStockByProducts)
   - Reemplazar useEffect + useState por useQuery
   - Incluir tenantId en queryKey (desde getCurrentTenant() hasta exista TenantContext)
   - Mantener Skeleton/loading y error states

2. **Sustituir ScrollShadow (NextUI) por ScrollArea (shadcn) en StoresManager**
   - Eliminar dependencia de `@nextui-org/react` en StoresManager
   - Usar `ScrollArea` + `scrollbar-horizontal` o `overflow-x-auto` con estilos shadcn
   - Preservar comportamiento de scroll horizontal con rueda (si se usa)

3. **Eliminar console.log en StoresManager**
   - Eliminar logs de debug en useEffect

4. **Añadir tests para storeService**
   - Tests para getTotalStockStats, getStockBySpeciesStats, getStockByProducts
   - Mock de fetchWithTenant
   - Cobertura básica de éxito y error

---

## Impacto esperado

- **Consistencia**: Dashboard Stock alineado con requisito de React Query
- **Mantenibilidad**: Menos código repetitivo (useEffect x3 → useQuery)
- **Design system**: Eliminación de NextUI en StoresManager
- **Calidad**: Tests para storeService como base de regresión
- **Rating después estimado**: 5/10 (mejora incremental; los P0 de componentes grandes siguen pendientes)

---

## Evaluación de riesgos

| Riesgo | Nivel | Mitigación |
|--------|-------|------------|
| Cambio de ScrollShadow a ScrollArea altera UX | Bajo | Verificar scroll horizontal y comportamiento táctil |
| React Query sin TenantContext | Bajo | Usar getCurrentTenant() en queryKey como interim |
| Tests rompen por mocks incorrectos | Bajo | Verificar estructura de respuesta API en docs |

**Nivel global**: Bajo

---

## Estrategia de verificación

- [ ] Tests existentes pasan
- [ ] Nuevos tests de storeService pasan
- [ ] Dashboard home muestra correctamente CurrentStockCard, StockBySpeciesCard, StockByProductsCard
- [ ] StoresManager: scroll horizontal funciona igual
- [ ] No hay imports de @nextui-org en StoresManager
- [ ] TypeScript/ESLint sin errores
- [ ] Build exitoso

---

## Plan de rollback

```bash
git revert <commit-hash>
npm install  # Por si se eliminaron dependencias
npm run build
```

---

## Cambios que rompen (breaking)

Ninguno. Cambios internos sin alteración de props ni APIs públicas.

---

## Gap a 10/10 (pendiente tras este sub-bloque)

- useStore 766 líneas (dividir)
- CreateReceptionForm 1093 líneas (dividir)
- OperarioCreateReceptionForm 928 líneas (dividir)
- Store 244 líneas (P1)
- Migrar useStores a React Query
- TenantContext
- Tests para hooks y más servicios

---

**¿Apruebas este sub-bloque 1 para proceder con la implementación?**
