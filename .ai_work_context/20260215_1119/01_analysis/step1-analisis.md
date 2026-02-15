# STEP 1 — Análisis del bloque Stock/Inventario/Almacenes

**Fecha**: 2026-02-15  
**Bloque**: Stock/Inventario/Almacenes

---

## Rating antes: 4/10

**Justificación**: El bloque tiene una base funcional (shadcn/ui, react-hook-form + zod en formularios de entidad, servicios centralizados) pero acumula deuda crítica: componentes monolíticos (>900 líneas), data fetching manual sin React Query, ausencia de TypeScript en la mayoría de artefactos, tests casi inexistentes, y hook useStore de 766 líneas. El patrón useEffect + useState se repite en todos los flujos de datos.

---

## 1. Resumen por entidad

| Entidad | Estado | Calidad estructural | Oportunidades |
|---------|--------|---------------------|---------------|
| **Almacenes (Stores)** | Funcional | useStore 766 líneas (P0), Store 244 líneas (P1), StoreContext acopla todo | Dividir useStore, extraer lógica a hooks, React Query |
| **Cajas** | Funcional | EntityClient genérico, bajo impacto | Migrar a React Query cuando se refactorice Entity |
| **Palets** | Funcional | PalletDialog, usePallet; OrderPallets compartido con Pedidos | Tipar, tests, React Query |
| **Recepciones** | Funcional | CreateReceptionForm 1093 líneas (P0), OperarioCreateReceptionForm 928 (P0) | Dividir en subcomponentes, extraer hooks |
| **Warehouse** | Funcional | Página con lógica de permisos inline | Extraer lógica a hook/custom component |
| **Dashboard Stock** | Funcional | 3 cards con useEffect + useState idéntico | Extraer useStockStats, React Query |

---

## 2. Uso de patrones Next.js/React

| Patrón | Presencia | Estado |
|--------|-----------|--------|
| Server/Client Components | Parcial | Páginas "use client" o delegan en cliente; no hay fetch en servidor |
| Custom Hooks | Sí | useStore, useStores, usePallet, useReceptionForm; pero useStore es un monstruo |
| Data Fetching | Manual | useEffect + useState + servicios en todos los flujos; sin React Query |
| Formularios | Sí | react-hook-form + zod en entidades; recepciones usan validadores propios |
| State Management | Context API | StoreContext, RawMaterialReceptionsOptionsContext |
| API Layer | Sí | storeService, palletService, rawMaterialReceptionService; fetchWithTenant |
| TypeScript | Parcial | storeService.ts tipado; resto .js |
| Testing | Mínimo | Solo receptionCalculations, receptionTransformations |

---

## 3. Cumplimiento Tech Stack del proyecto

| Requisito | Cumplimiento |
|-----------|--------------|
| **React Query** para server state | ❌ No usado; todo manual useEffect |
| **Zod** en formularios | ⚠️ Parcial: entidades sí; CreateReceptionForm/OperarioCreateReceptionForm usan validadores custom (receptionValidators) |
| **TypeScript** | ⚠️ storeService.ts sí; hooks, componentes, resto de servicios en .js |
| **TenantContext / useTenant** | ❌ Usa getCurrentTenant() donde se necesita; sin TenantContext |
| **Tests** servicios/hooks | ❌ No hay tests para storeService, useStore, useStores, usePallet |
| **shadcn/ui** | ✅ Sí; algunos ScrollShadow de NextUI en StoresManager |
| **Componentes <150 líneas** | ❌ CreateReceptionForm 1093, OperarioCreateReceptionForm 928, useStore 766 |

---

## 4. UI/UX Design System

| Criterio | Estado |
|----------|--------|
| shadcn/ui consistente | ✅ Sí |
| Custom UI primitives | ❌ ScrollShadow de NextUI en StoresManager |
| NextUI / alternativas | ⚠️ ScrollShadow @nextui-org en StoresManager |
| Design system (colors, spacing) | ✅ Consistente |

---

## 5. Riesgos y deuda técnica

### P0 (Bloqueadores)

1. **CreateReceptionForm** 1093 líneas
2. **OperarioCreateReceptionForm** 928 líneas
3. **useStore** 766 líneas
4. **Sin tests** para storeService, useStore, useStores, palletService, usePallet
5. **Data fetching** sin React Query → sin caché, sin invalidación
6. **JavaScript** en rutas críticas (hooks, componentes)

### P1 (Alto impacto)

1. **Store/index.js** 244 líneas
2. **NextUI ScrollShadow** en StoresManager (debería ser shadcn ScrollArea)
3. **getCurrentTenant()** en lugar de useTenant()
4. **Formularios recepción** sin zodResolver explícito (receptionValidators custom)
5. **ReceptionsListCard, DispatchesListCard** sin React Query
6. **Dashboard Stock cards** patrón duplicado (useEffect + useState x3)

### P2 (Mejora)

1. **Prop drilling** en Store (passedStoreId, passedStoreName)
2. **useStores** podría beneficiarse de React Query
3. **storeService** domain vs storeService.ts: duplicación parcial
4. **Console.log** en StoresManager (debug)
5. **Comentarios de código muerto** en Store/index.js

---

## 6. Accesibilidad

| Aspecto | Estado |
|---------|--------|
| Semantic HTML | Aceptable |
| ARIA / roles | Parcial (Radix en shadcn aporta) |
| CreateReceptionForm | useAccessibilityAnnouncer presente |
| Keyboard navigation | No auditado en detalle |

---

## 7. Performance

| Aspecto | Estado |
|---------|--------|
| Bundle size | No analizado |
| Re-renders | Múltiples contextos; useStore con mucho estado |
| Lazy loading | PalletDialog dynamic import en CreateReceptionForm |
| Pagination | useStores paginado; ReceptionsListCard paginado |

---

## 8. Seguridad y multi-tenant

| Aspecto | Estado |
|---------|--------|
| Tenant en headers | ✅ fetchWithTenant |
| Aislamiento operario | ✅ assignedStoreId verificado en warehouse |
| Cache keys tenant-aware | N/A (no hay React Query) |
| Secrets en NEXT_PUBLIC | No detectado en este bloque |

---

## 9. Alineación con auditoría

| Hallazgo auditoría | Aplicable al bloque |
|--------------------|---------------------|
| Data fetching sin caché | ✅ useStores, useStore, ReceptionsListCard, DispatchesListCard, CurrentStockCard, etc. |
| Componentes monolíticos | ✅ CreateReceptionForm, OperarioCreateReceptionForm, useStore |
| Sin TypeScript | ✅ Mayoría de archivos .js |
| Tests insuficientes | ✅ Solo helpers de recepción |
| NextUI coexistencia | ✅ ScrollShadow en StoresManager |

---

## 10. Oportunidades de mejora (priorizadas)

### Fase 1 (Sub-bloque 1 — Fundación)

1. Migrar **CurrentStockCard, StockBySpeciesCard, StockByProductsCard** a React Query (useStockStats)
2. Añadir **tests** para storeService (getTotalStockStats, getStockBySpeciesStats, getStockByProducts)
3. Sustituir **ScrollShadow** (NextUI) por **ScrollArea** (shadcn) en StoresManager
4. Eliminar **console.log** en StoresManager

### Fase 2 (Sub-bloque 2 — useStore y Stores)

1. **Dividir useStore**: extraer useStoreData, useStoreDialogs, useStorePositions
2. Añadir tests para useStore (o para los hooks extraídos)
3. Migrar **useStores** a React Query
4. Tipar storeService (completar) y hooks (TypeScript)

### Fase 3 (Sub-bloque 3 — Recepciones)

1. **Dividir CreateReceptionForm**: Extraer CreateReceptionHeader, CreateReceptionDetails, CreateReceptionPallets, useReceptionFormData
2. **Dividir OperarioCreateReceptionForm**: Extraer por pasos (StepSpecies, StepSupplier, StepLines, useOperarioReceptionForm)
3. Unificar validación con **Zod** (receptionValidators → schemas)
4. Migrar creación de recepción a **useMutation** (React Query)
5. Tests para useReceptionForm y helpers

### Fase 4 (Sub-bloque 4 — Warehouse y ReceptionsListCard)

1. Migrar **ReceptionsListCard** y **DispatchesListCard** a React Query
2. Extraer lógica de permisos de warehouse page a hook **useWarehouseAccess**
3. Tests E2E para flujo operario (opcional P2)

---

## 11. Scope coverage check

Las entidades del alcance (Almacenes, Cajas, Palets, Recepciones, Warehouse, Dashboard Stock) han sido evaluadas. Cajas y Palets listado usan EntityClient genérico; la mejora principal para ellos será cuando se migre Entity a React Query. El foco inmediato debe estar en: Stores/useStore, Recepciones (formularios), Dashboard Stock cards, Warehouse page.

---

**Próximo**: STEP 2 — Proponer cambios (por sub-bloques) y solicitar aprobación.
