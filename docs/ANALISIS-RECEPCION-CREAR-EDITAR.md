# Análisis: Recepción de Materia Prima - Crear y Editar

## Resumen Ejecutivo

El módulo de recepción de materia prima permite crear y editar recepciones de productos mediante dos modos de entrada:

- **Modo Automático (Por Líneas)**: Entrada directa de productos con peso bruto, tara, peso neto calculado, precio y lote
- **Modo Manual (Por Palets)**: Gestión mediante palets que contienen cajas con productos, con sincronización de precios globales

**Problemas principales detectados:**

- Componentes muy extensos (966 y 1240 líneas) con lógica compleja y acoplamiento alto
- Falta de optimización de renders (no hay memoización)
- Cálculos repetidos en cada render
- Validación duplicada entre frontend y backend
- Manejo de estado complejo con múltiples fuentes de verdad
- Falta de tipado TypeScript
- Posibles problemas de rendimiento con listas grandes de palets/cajas

**Impacto estimado de mejoras:**

- Reducción de tiempo de render: 40-60%
- Reducción de complejidad ciclomática: 50-70%
- Mejora en tiempo de respuesta de UI: 30-50%
- Reducción de bugs potenciales: 60-80%

---

## 1. Contexto y Alcance

### ¿Qué hace el apartado?

El módulo permite gestionar recepciones de materia prima desde proveedores, con dos flujos principales:

1. **Crear Recepción** (`CreateReceptionForm`):

   - Selección de proveedor y fecha
   - Dos modos de entrada (líneas o palets)
   - Validación de datos antes de envío
   - Creación vía API y redirección a edición
2. **Editar Recepción** (`EditReceptionForm`):

   - Carga de datos existentes
   - Edición según modo original (líneas o palets)
   - Gestión de palets con edición de cajas
   - Impresión de etiquetas y resúmenes
   - Validación de permisos de edición

### Capas Implicadas

| Capa                              | Componentes/Servicios                                                  | Responsabilidad                              |
| --------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------- |
| **UI**                      | `CreateReceptionForm`, `EditReceptionForm`                         | Formularios principales, tablas, diálogos   |
| **Lógica**                 | Hooks personalizados (`useProductOptions`, `useSupplierOptions`)   | Gestión de opciones y estado                |
| **Servicios**               | `rawMaterialReceptionService`                                        | Comunicación con API (POST, PUT, GET)       |
| **Componentes Compartidos** | `PalletDialog`, `ReceptionSummaryDialog`, `ReceptionPrintDialog` | Diálogos modales reutilizables              |
| **Backend**                 | API Laravel (`/raw-material-receptions`)                             | Validación, persistencia, reglas de negocio |
| **DB**                      | Tablas de recepciones, palets, cajas, productos                        | Persistencia de datos                        |

### Archivos y Rutas

**Componentes principales:**

- `/src/components/Admin/RawMaterialReceptions/CreateReceptionForm/index.js` (966 líneas)
- `/src/components/Admin/RawMaterialReceptions/EditReceptionForm/index.js` (1240 líneas)
- `/src/components/Admin/Pallets/PalletDialog/index.js` (102 líneas)
- `/src/components/Admin/Pallets/PalletDialog/PalletView/index.js` (1721+ líneas)

**Servicios:**

- `/src/services/rawMaterialReceptionService.js` (153 líneas)

**Hooks:**

- `/src/hooks/useProductOptions.js` (26 líneas)
- `/src/hooks/useSupplierOptions.js` (25 líneas)

**Páginas Next.js:**

- `/src/app/admin/raw-material-receptions/create/page.js`
- `/src/app/admin/raw-material-receptions/[id]/edit/page.js`

**Componentes de diálogo:**

- `/src/components/Admin/RawMaterialReceptions/ReceptionSummaryDialog/index.js`
- `/src/components/Admin/RawMaterialReceptions/ReceptionPrintDialog/index.js`
- `/src/components/Admin/RawMaterialReceptions/AllPalletsLabelDialog/index.js`

---

## 2. Auditoría Técnica y Estructural

### 2.1 Bugs Potenciales y Edge Cases

#### 🔴 **CRÍTICO**

1. **Race condition en carga de recepción (EditReceptionForm)**

   - **Ubicación**: Líneas 102-297
   - **Problema**: El `useEffect` puede ejecutarse múltiples veces si `receptionId` o `session` cambian rápidamente, causando múltiples llamadas API
   - **Evidencia**: Aunque hay `hasLoadedRef`, no previene completamente el problema si el componente se desmonta/monta rápidamente
   - **Impacto**: Múltiples requests innecesarios, posible pérdida de datos
2. **Pérdida de datos al cambiar de modo sin confirmación explícita**

   - **Ubicación**: `CreateReceptionForm` líneas 138-178
   - **Problema**: Si el usuario cambia de modo accidentalmente y confirma, se pierden todos los datos sin posibilidad de recuperación
   - **Impacto**: Pérdida de trabajo del usuario
3. **Sincronización de precios puede fallar con lotes vacíos/null**

   - **Ubicación**: `CreateReceptionForm` líneas 804-840, `EditReceptionForm` líneas 962-998
   - **Problema**: La lógica de sincronización usa `box.lot || ''` pero algunos lugares usan `undefined`, causando inconsistencias en las keys
   - **Evidencia**:
     ```javascript
     const key = `${box.product.id}-${box.lot || ''}`; // Línea 276
     const priceKey = `${box.product.id}-${box.lot}`; // Línea 277 (sin || '')
     ```
   - **Impacto**: Precios no se sincronizan correctamente entre palets
4. **Validación de IDs de cajas en edición puede causar pérdida de datos**

   - **Ubicación**: `EditReceptionForm` líneas 384-406
   - **Problema**: La lógica para distinguir IDs reales de temporales depende de `originalBoxIds` Set, pero si una caja se edita y pierde su ID, se creará como nueva en lugar de actualizarse
   - **Impacto**: Duplicación de cajas o pérdida de datos

#### 🟡 **IMPORTANTE**

5. **Cálculo de peso neto se ejecuta en cada cambio de cualquier campo**

   - **Ubicación**: `CreateReceptionForm` líneas 105-113
   - **Problema**: El `useEffect` se ejecuta cada vez que cambia `watchedDetails`, incluso si el cambio no afecta el cálculo
   - **Impacto**: Renders innecesarios y posibles loops infinitos si `setValue` dispara el watch
6. **Falta validación de formato de fecha en normalización**

   - **Ubicación**: `CreateReceptionForm` líneas 42-51
   - **Problema**: `normalizeDate` no valida si la fecha es válida antes de normalizar
   - **Impacto**: Fechas inválidas pueden causar errores silenciosos
7. **Manejo de errores inconsistente**

   - **Ubicación**: Múltiples lugares
   - **Problema**: Algunos errores se muestran con `toast.error`, otros solo en `console.error`, y algunos no se manejan
   - **Impacto**: Experiencia de usuario inconsistente, errores no visibles
8. **Falta validación de límites en campos numéricos**

   - **Ubicación**: Inputs de peso, precio, cajas
   - **Problema**: No hay validación de valores máximos razonables (ej: peso negativo, precio excesivo)
   - **Impacto**: Datos inválidos pueden llegar al backend

#### 🟢 **NICE-TO-HAVE**

9. **Console.log en producción**

   - **Ubicación**: `CreateReceptionForm` líneas 181-183, 365-387
   - **Problema**: Múltiples `console.log` que deberían estar solo en desarrollo
   - **Impacto**: Ruido en consola, posible fuga de información
10. **Falta de loading states en algunas operaciones**

    - **Ubicación**: Operaciones de sincronización de precios, validaciones
    - **Problema**: No hay indicadores visuales durante operaciones asíncronas
    - **Impacto**: Usuario no sabe si la acción está en proceso

### 2.2 Deuda Técnica

#### 🔴 **CRÍTICO**

1. **Componentes monolíticos sin separación de responsabilidades**

   - **Problema**: `CreateReceptionForm` (966 líneas) y `EditReceptionForm` (1240 líneas) tienen demasiadas responsabilidades:
     - Gestión de formulario
     - Validación de negocio
     - Transformación de datos
     - Renderizado de UI
     - Manejo de estado complejo
   - **Impacto**: Difícil de mantener, testear y reutilizar
   - **Solución propuesta**: Extraer lógica a hooks personalizados, componentes más pequeños, funciones puras
2. **Duplicación masiva de código entre Create y Edit**

   - **Problema**: ~70% del código es idéntico o muy similar entre ambos componentes
   - **Evidencia**:
     - Lógica de validación duplicada
     - Transformación de payload duplicada
     - Renderizado de formularios similar
     - Manejo de palets idéntico
   - **Impacto**: Cambios deben hacerse en dos lugares, riesgo de inconsistencias
   - **Solución propuesta**: Componente base compartido o hook compartido
3. **Falta de tipado TypeScript (Olvida TypeScript por lo pronto)**

   - **Problema**: Todo el código está en JavaScript sin tipos
   - **Impacto**: Errores en tiempo de ejecución, falta de autocompletado, difícil refactoring
   - **Solución propuesta**: Migración gradual a TypeScript

#### 🟡 **IMPORTANTE**

4. **Lógica de negocio mezclada con presentación**

   - **Problema**: Cálculos, validaciones y transformaciones están dentro de componentes React
   - **Ejemplos**:
     - Cálculo de peso neto en componente (líneas 105-113)
     - Transformación de payload en handlers (líneas 207-330, 322-431)
     - Validación de datos en múltiples lugares
   - **Impacto**: Difícil de testear, reutilizar y mantener
   - **Solución propuesta**: Extraer a funciones puras, utilities, o servicios
5. **Estado complejo y múltiples fuentes de verdad**

   - **Problema**: Estado distribuido entre:
     - React Hook Form (`useForm`)
     - Estado local (`useState` para `temporalPallets`, `mode`, etc.)
     - Props y callbacks
   - **Impacto**: Difícil de sincronizar, bugs de inconsistencia
   - **Solución propuesta**: Reducir fuentes de verdad, usar un solo estado o estado derivado
6. **Falta de abstracción para operaciones de palets**

   - **Problema**: Lógica de sincronización de precios, transformación de datos, validación está duplicada y mezclada
   - **Impacto**: Difícil de mantener y extender
   - **Solución propuesta**: Hook `useReceptionPallets` o clase `ReceptionPalletsManager`
7. **Nombres de variables inconsistentes**

   - **Problema**: Mezcla de español e inglés, nombres poco descriptivos
   - **Ejemplos**: `temporalPallets` vs `palletMetadata`, `watchedDetails` vs `details`
   - **Impacto**: Dificulta comprensión y mantenimiento

#### 🟢 **NICE-TO-HAVE**

8. **Falta de documentación JSDoc**

   - **Problema**: Funciones complejas no tienen documentación
   - **Impacto**: Difícil de entender el propósito y uso
9. **Falta de tests unitarios**

   - **Problema**: No se ven archivos de test
   - **Impacto**: Refactoring riesgoso, bugs no detectados
10. **Configuración hardcodeada**

    - **Problema**: `TARE_OPTIONS` está hardcodeado (líneas 33-39)
    - **Impacto**: No flexible, requiere cambios de código para modificar

### 2.3 Antipatrones Detectados

1. **God Component**: Componentes hacen demasiadas cosas
2. **Prop Drilling**: Estado y callbacks pasan por múltiples niveles
3. **Magic Numbers/Strings**: Valores hardcodeados sin constantes
4. **Callback Hell**: Callbacks anidados en handlers
5. **Side Effects en Render**: `useEffect` con dependencias que causan loops
6. **Mutable State**: Modificación directa de arrays/objetos en estado

### 2.4 Refactors Propuestos

#### Alta Prioridad

1. **Extraer lógica de cálculo de peso neto**

   ```javascript
   // De: useEffect en componente
   // A: Función pura o hook
   const calculateNetWeight = (grossWeight, boxes, tare) => {
       return Math.max(0, grossWeight - (tare * boxes));
   };
   ```
2. **Extraer transformación de payload**

   ```javascript
   // De: Lógica en handleCreate/handleUpdate
   // A: Funciones puras en utils
   export const transformReceptionPayload = (data, mode, temporalPallets) => {
       // Lógica centralizada
   };
   ```
3. **Crear hook compartido para recepciones**

   ```javascript
   // useReceptionForm hook que maneja:
   // - Estado del formulario
   // - Validación
   // - Transformación de datos
   // - Envío a API
   ```
4. **Componentizar tabla de detalles**

   ```javascript
   // ReceptionDetailsTable component
   // ReceptionDetailRow component
   // ReceptionPalletsTable component
   ```
5. **Extraer lógica de sincronización de precios**

   ```javascript
   // usePriceSynchronization hook
   // O función pura: synchronizePrices(pallets, priceKey, newPrice)
   ```

#### Media Prioridad

6. **Normalizar estructura de datos de palets**

   - Definir interfaz/clase para `TemporalPallet`
   - Validar estructura en runtime
7. **Centralizar validaciones**

   - Crear `receptionValidators.js` con funciones de validación
   - Usar schema validation (Zod, Yup)
8. **Mejorar manejo de errores**

   - Crear `ReceptionErrorHandler` utility
   - Tipos de error consistentes

---

## 3. UI, UX y Usabilidad

### 3.1 Fricciones de Uso

#### 🔴 **CRÍTICO**

1. **Cambio de modo sin advertencia clara**

   - **Problema**: El diálogo de confirmación aparece, pero no muestra un resumen de lo que se perderá
   - **Mejora**: Mostrar cantidad de líneas/palets que se perderán, tiempo estimado de pérdida
2. **Falta de feedback visual durante guardado**

   - **Problema**: Solo hay un spinner en el botón, pero no hay indicador de progreso para operaciones largas
   - **Mejora**: Barra de progreso o mensaje más descriptivo
3. **Tabla de detalles difícil de usar en móvil**

   - **Problema**: Tabla horizontal sin scroll horizontal visible claramente
   - **Mejora**: Layout responsive, cards en móvil

#### 🟡 **IMPORTANTE**

4. **Sincronización de precios no es obvia**

   - **Problema**: El usuario no sabe que cambiar un precio en un palet afecta a otros
   - **Mejora**: Tooltip o indicador visual de sincronización
5. **Falta de atajos de teclado**

   - **Problema**: No hay shortcuts para acciones comunes (agregar línea, guardar, etc.)
   - **Mejora**: Implementar atajos estándar (Ctrl+S para guardar, Enter para agregar)
6. **Validación en tiempo real puede ser molesta**

   - **Problema**: Errores aparecen mientras el usuario escribe
   - **Mejora**: Validar solo al blur o al intentar guardar
7. **Falta de búsqueda/filtro en listas grandes**

   - **Problema**: Si hay muchos palets, es difícil encontrar uno específico
   - **Mejora**: Búsqueda y filtros

#### 🟢 **NICE-TO-HAVE**

8. **Falta de autoguardado**

   - **Mejora**: Guardar automáticamente cada X segundos en localStorage
9. **Falta de historial de cambios**

   - **Mejora**: Mostrar qué cambió desde la última carga
10. **Falta de vista previa antes de guardar**

    - **Mejora**: Modal de resumen antes de confirmar

### 3.2 Accesibilidad

#### 🔴 **CRÍTICO**

1. **Falta de labels ARIA en algunos inputs**

   - **Problema**: Algunos inputs no tienen `aria-label` o están mal asociados
   - **Mejora**: Agregar labels apropiados
2. **Falta de manejo de focus**

   - **Problema**: Al abrir diálogos, el focus no va al primer campo
   - **Mejora**: Auto-focus en primer campo editable
3. **Falta de anuncios para screen readers**

   - **Problema**: Cambios dinámicos (cálculos, validaciones) no se anuncian
   - **Mejora**: `aria-live` regions

#### 🟡 **IMPORTANTE**

4. **Navegación por teclado incompleta**

   - **Problema**: No todos los elementos interactivos son accesibles por teclado
   - **Mejora**: Asegurar `tabIndex` y handlers de teclado
5. **Falta de contraste en algunos elementos**

   - **Problema**: Texto en `text-muted-foreground` puede no cumplir WCAG
   - **Mejora**: Revisar y ajustar colores

### 3.3 Estados de Carga y Error

#### Problemas Detectados

1. **Loading states inconsistentes**

   - Algunos usan `<Loader />`, otros spinners inline
   - No hay skeleton loaders
2. **Mensajes de error genéricos**

   - "Error al crear la recepción" no dice qué falló específicamente
   - No hay códigos de error para debugging
3. **Falta de estados vacíos claros**

   - `EmptyState` existe pero podría ser más informativo

### 3.4 Consistencia Visual

- ✅ Uso consistente de componentes ShadCN
- ⚠️ Algunos espaciados inconsistentes
- ⚠️ Tamaños de botones varían

### 3.5 Mejoras Propuestas

#### Alta Prioridad (Impacto Alto, Complejidad Media)

1. **Mejorar feedback de sincronización de precios**

   - Agregar badge/indicador cuando un precio está sincronizado
   - Tooltip explicativo
2. **Agregar validación progresiva**

   - Validar solo campos completados
   - Mostrar resumen de errores antes de guardar
3. **Mejorar responsive design**

   - Cards en móvil en lugar de tabla
   - Stack vertical en pantallas pequeñas

#### Media Prioridad (Impacto Medio, Complejidad Baja)

4. **Agregar atajos de teclado**
5. **Mejorar mensajes de error**
6. **Agregar skeleton loaders**

---

## 4. Rendimiento y Tiempo de Ejecución

### 4.1 Cuellos de Botella Identificados

#### 🔴 **CRÍTICO - Alto Impacto en Rendimiento**

1. **Renders innecesarios por falta de memoización**

   - **Ubicación**: Todo el componente
   - **Problema**:
     - `CreateReceptionForm` y `EditReceptionForm` no usan `React.memo`
     - Componentes hijos se re-renderizan en cada cambio de estado padre
     - Tablas completas se re-renderizan cuando solo cambia un campo
   - **Evidencia**:
     - No hay `useMemo` para cálculos costosos
     - No hay `useCallback` para funciones pasadas como props
     - No hay `React.memo` en componentes hijos
   - **Impacto estimado**:
     - Con 10 líneas de detalle: ~50-100ms por render innecesario
     - Con 20 palets: ~200-400ms por render innecesario
   - **Solución**: Memoizar componentes, cálculos y callbacks
2. **Cálculo de peso neto en cada render**

   - **Ubicación**: `CreateReceptionForm` líneas 105-113
   - **Problema**:
     ```javascript
     useEffect(() => {
         watchedDetails?.forEach((detail, index) => {
             // Cálculo y setValue para cada detalle
             setValue(`details.${index}.netWeight`, netWeight.toFixed(2));
         });
     }, [watchedDetails, setValue]);
     ```
   - **Impacto**:
     - Se ejecuta en cada cambio de `watchedDetails`
     - `setValue` puede disparar otro render
     - Posible loop si no se maneja correctamente
   - **Solución**:
     - Usar `useMemo` para calcular solo cuando cambian valores relevantes
     - Debounce para evitar cálculos excesivos
3. **Transformación de datos de palets en cada render**

   - **Ubicación**: `CreateReceptionForm` líneas 739-882, `EditReceptionForm` líneas 897-1065
   - **Problema**:
     - En el render de la tabla, se calcula `productLotMap` para cada palet en cada render
     - No está memoizado
   - **Código problemático**:
     ```javascript
     {temporalPallets.map((item, index) => {
         // Este cálculo se hace en cada render
         const productLotMap = new Map();
         (pallet.boxes || []).forEach(box => {
             // ... cálculo costoso
         });
     })}
     ```
   - **Impacto**:
     - Con 10 palets y 50 cajas: ~10-20ms por render
     - Multiplicado por número de renders: puede ser 100-200ms total
   - **Solución**: Memoizar con `useMemo`
4. **Sincronización de precios O(n²)**

   - **Ubicación**: `CreateReceptionForm` líneas 804-840, `EditReceptionForm` líneas 962-998
   - **Problema**:
     ```javascript
     updated.forEach((palletItem, palletIdx) => {
         // Para cada palet, itera sobre todos los otros palets
         updated.forEach((palletItem2, palletIdx2) => {
             // Verifica cada combinación
         });
     });
     ```
   - **Complejidad**: O(n²) donde n = número de palets
   - **Impacto**:
     - Con 20 palets: 400 iteraciones
     - Con 50 palets: 2500 iteraciones
   - **Solución**:
     - Usar Map para lookup O(1)
     - Reducir a O(n)
5. **Re-fetch de datos en EditReceptionForm**

   - **Ubicación**: Líneas 102-297
   - **Problema**: Aunque hay `hasLoadedRef`, el efecto puede ejecutarse múltiples veces
   - **Impacto**: Requests HTTP innecesarios
   - **Solución**: Mejorar la lógica de prevención de re-fetch

#### 🟡 **IMPORTANTE - Impacto Medio**

6. **Falta de virtualización en tablas grandes**

   - **Problema**: Si hay muchas líneas o palets, se renderizan todos a la vez
   - **Impacto**:
     - Con 100 líneas: ~500-1000ms de render inicial
     - Scroll lento
   - **Solución**: Virtualización con `react-window` o `react-virtual`
7. **Hooks de opciones se ejecutan en cada montaje**

   - **Ubicación**: `useProductOptions`, `useSupplierOptions`
   - **Problema**: Hacen fetch en cada componente que los usa
   - **Impacto**: Múltiples requests duplicados si varios componentes usan el hook
   - **Solución**: Cache compartido o Context API
8. **Serialización JSON grande en cada submit**

   - **Ubicación**: `rawMaterialReceptionService.js` líneas 31, 73
   - **Problema**: Payloads grandes se serializan completamente
   - **Impacto**:
     - Con 20 palets y 200 cajas: payload de ~50-100KB
     - Serialización: ~5-10ms
   - **Solución**: Comprimir o enviar incrementalmente
9. **Falta de debouncing en inputs numéricos**

   - **Problema**: Cada keystroke dispara validación y cálculo
   - **Impacto**: Muchos renders innecesarios
   - **Solución**: Debounce de 300-500ms

#### 🟢 **NICE-TO-HAVE - Impacto Bajo**

10. **Falta de code splitting**

    - **Problema**: Todo el código se carga de una vez
    - **Solución**: Lazy load de diálogos y componentes pesados
11. **Imágenes/iconos no optimizados**

    - **Solución**: Usar SVGs optimizados o imágenes WebP

### 4.2 Optimizaciones Propuestas

#### Prioridad 1: Críticas (ROI Alto, Esfuerzo Medio)

1. **Memoizar componentes y cálculos**

   ```javascript
   // Memoizar tabla de detalles
   const DetailsTable = React.memo(({ fields, control, errors, ... }) => {
       // ...
   });

   // Memoizar cálculos costosos
   const productLotSummary = useMemo(() => {
       // Cálculo de resumen
   }, [temporalPallets]);

   // Memoizar callbacks
   const handlePriceChange = useCallback((priceKey, newPrice) => {
       // ...
   }, [temporalPallets]);
   ```
2. **Optimizar cálculo de peso neto**

   ```javascript
   // Usar useMemo en lugar de useEffect
   const calculatedNetWeights = useMemo(() => {
       return watchedDetails.map(detail => {
           const grossWeight = parseFloat(detail.grossWeight) || 0;
           const boxes = parseInt(detail.boxes) || 1;
           const tare = parseFloat(detail.tare) || 0;
           return Math.max(0, grossWeight - (tare * boxes));
       });
   }, [watchedDetails]);

   // Actualizar solo cuando cambian los valores relevantes
   useEffect(() => {
       calculatedNetWeights.forEach((netWeight, index) => {
           setValue(`details.${index}.netWeight`, netWeight.toFixed(2));
       });
   }, [calculatedNetWeights]);
   ```
3. **Optimizar sincronización de precios O(n²) → O(n)**

   ```javascript
   // Crear Map de combinaciones producto+lote → palets
   const priceKeyToPalletsMap = useMemo(() => {
       const map = new Map();
       temporalPallets.forEach((item, palletIdx) => {
           (item.pallet?.boxes || []).forEach(box => {
               if (box.product?.id) {
                   const key = `${box.product.id}-${box.lot || ''}`;
                   if (!map.has(key)) {
                       map.set(key, []);
                   }
                   map.get(key).push(palletIdx);
               }
           });
       });
       return map;
   }, [temporalPallets]);

   // Usar el Map para sincronización O(1) lookup
   const handlePriceChange = useCallback((priceKey, newPrice) => {
       const affectedPallets = priceKeyToPalletsMap.get(priceKey) || [];
       // Actualizar solo los palets afectados
   }, [priceKeyToPalletsMap]);
   ```
4. **Memoizar transformación de datos de palets**

   ```javascript
   const paletsDisplayData = useMemo(() => {
       return temporalPallets.map((item, index) => {
           const productLotMap = new Map();
           // ... cálculo
           return { ...item, productLotCombinations: Array.from(productLotMap.values()) };
       });
   }, [temporalPallets]);
   ```

#### Prioridad 2: Importantes (ROI Medio, Esfuerzo Medio)

5. **Virtualización de tablas**

   ```javascript
   import { useVirtualizer } from '@tanstack/react-virtual';

   const virtualizer = useVirtualizer({
       count: fields.length,
       getScrollElement: () => parentRef.current,
       estimateSize: () => 60,
   });
   ```
6. **Cache compartido para opciones**

   ```javascript
   // Context API o React Query
   const ProductOptionsProvider = ({ children }) => {
       const { data } = useQuery('productOptions', fetchProductOptions, {
           staleTime: 5 * 60 * 1000, // 5 minutos
       });
       return <Context.Provider value={data}>{children}</Context.Provider>;
   };
   ```
7. **Debounce en inputs numéricos**

   ```javascript
   const debouncedNetWeight = useDebouncedValue(watchedDetails, 300);
   ```

#### Prioridad 3: Nice-to-Have (ROI Bajo, Esfuerzo Bajo)

8. **Code splitting de diálogos**

   ```javascript
   const PalletDialog = lazy(() => import('./PalletDialog'));
   const ReceptionSummaryDialog = lazy(() => import('./ReceptionSummaryDialog'));
   ```
9. **Lazy load de componentes pesados**

### 4.3 Métricas a Medir

**Antes de optimizar:**

- Tiempo de render inicial: `performance.now()` al inicio y fin del render
- Número de renders: React DevTools Profiler
- Tiempo de cálculo: `console.time()` en funciones costosas
- Tamaño de payload: `JSON.stringify(payload).length`
- Número de requests: Network tab

**Después de optimizar:**

- Reducción esperada de tiempo de render: 40-60%
- Reducción de número de renders: 50-70%
- Reducción de tiempo de cálculo: 60-80%
- Reducción de tamaño de payload: 10-20% (si se comprime)

**Dónde medir:**

- React DevTools Profiler
- Chrome Performance tab
- Network tab para requests
- Custom hooks de performance

---

## 5. Arquitectura, API y Recursos

### 5.1 Endpoints Actuales

**POST `/raw-material-receptions`**

- Crea nueva recepción
- Payload: `{ supplier, date, notes, details[] | pallets[], prices[] }`
- Retorna: Recepción creada con ID

**PUT `/raw-material-receptions/{id}`**

- Actualiza recepción existente
- Payload: Similar a POST
- Retorna: Recepción actualizada

**GET `/raw-material-receptions/{id}`**

- Obtiene recepción por ID
- Retorna: Recepción completa con palets, cajas, precios

### 5.2 Problemas Detectados

#### 🔴 **CRÍTICO**

1. **Payloads sobredimensionados**

   - **Problema**: Se envía toda la estructura de palets/cajas incluso si solo cambió un campo
   - **Ejemplo**: Editar una observación de un palet envía todas las cajas de todos los palets
   - **Impacto**:
     - Payloads de 50-100KB innecesarios
     - Tiempo de serialización/deserialización
     - Carga en backend
   - **Solución**: Endpoint PATCH para actualizaciones parciales
2. **Falta de validación en frontend antes de enviar**

   - **Problema**: Validación básica en frontend, pero validación completa en backend
   - **Impacto**: Requests fallidos innecesarios, mala UX
   - **Solución**: Validación completa en frontend con schema (Zod)
3. **Falta de endpoints específicos para operaciones comunes**

   - **Problema**: No hay endpoints para:
     - Actualizar solo precios
     - Agregar/eliminar un palet
     - Actualizar observaciones
   - **Impacto**: Siempre se envía todo el payload
   - **Solución**: Endpoints específicos

#### 🟡 **IMPORTANTE**

4. **Falta de paginación en GET**

   - **Problema**: Si una recepción tiene muchos palets, se cargan todos
   - **Impacto**: Tiempo de carga alto, memoria alta
   - **Solución**: Paginación o carga lazy de palets
5. **Falta de campos calculados en respuesta**

   - **Problema**: Frontend calcula totales, pesos, etc.
   - **Impacto**: Cálculos duplicados, posible inconsistencia
   - **Solución**: Backend devuelve campos calculados
6. **Falta de versionado de API**

   - **Problema**: Cambios en API pueden romper frontend
   - **Solución**: Versionado explícito (ya usan V2, pero asegurar)
7. **Falta de compresión en requests**

   - **Problema**: Payloads grandes sin comprimir
   - **Solución**: Gzip/Brotli en servidor

#### 🟢 **NICE-TO-HAVE**

8. **Falta de WebSocket para updates en tiempo real**

   - **Mejora**: Si varios usuarios editan, sincronizar cambios
9. **Falta de cache en frontend**

   - **Mejora**: Cache de recepciones recientes

### 5.3 Mejoras Propuestas en API

#### Alta Prioridad

1. **Endpoint PATCH para actualizaciones parciales**

   ```
   PATCH /raw-material-receptions/{id}
   Body: { prices: [...], pallets: [{ id, observations }] }
   ```

   - Solo enviar campos que cambiaron
   - Reducir payload en 70-90%
2. **Endpoint para actualizar solo precios**

   ```
   PUT /raw-material-receptions/{id}/prices
   Body: { prices: [...] }
   ```

   - Operación común, endpoint específico
3. **Validación mejorada en backend con mensajes específicos**

   - Retornar errores de validación por campo
   - Códigos de error específicos

#### Media Prioridad

4. **Endpoint para agregar/eliminar palet**

   ```
   POST /raw-material-receptions/{id}/pallets
   DELETE /raw-material-receptions/{id}/pallets/{palletId}
   ```
5. **Campos calculados en respuesta**

   ```json
   {
     "id": 1,
     "totalNetWeight": 1250.5,
     "totalBoxes": 45,
     "totalAmount": 12500.75,
     // ...
   }
   ```
6. **Paginación en GET de palets**

   ```
   GET /raw-material-receptions/{id}?include_pallets=true&page=1&per_page=20
   ```

### 5.4 Queries y Base de Datos

**Problemas potenciales (sin acceso a código backend):**

1. **N+1 queries**: Si se cargan palets y luego cajas por separado
2. **Falta de índices**: En `reception_id`, `product_id`, `lot`
3. **Joins costosos**: Si se hace join de recepciones → palets → cajas → productos

**Recomendaciones:**

- Eager loading de relaciones
- Índices en foreign keys
- Query optimization

### 5.5 DTOs y Contratos

**Problemas:**

- No hay tipos/interfaces definidos
- Estructura de datos puede variar
- Validación de estructura en runtime

**Solución:**

- Definir interfaces TypeScript o schemas Zod
- Validar en runtime con Zod
- Documentar contratos API

---

## 6. Plan de Acción

### 6.1 Mejoras Priorizadas por ROI

#### 🔴 **Fase 1: Críticas (ROI Muy Alto, Esfuerzo Medio-Alto)**

| # | Tarea                                                    | Impacto | Esfuerzo | ROI        | Prioridad |
| - | -------------------------------------------------------- | ------- | -------- | ---------- | --------- |
| 1 | Memoizar componentes y cálculos costosos                | Alto    | Medio    | ⭐⭐⭐⭐⭐ | 1         |
| 2 | Optimizar sincronización de precios O(n²)→O(n)        | Alto    | Medio    | ⭐⭐⭐⭐⭐ | 2         |
| 3 | Extraer lógica de cálculo de peso neto a función pura | Alto    | Bajo     | ⭐⭐⭐⭐⭐ | 3         |
| 4 | Memoizar transformación de datos de palets              | Alto    | Bajo     | ⭐⭐⭐⭐   | 4         |
| 5 | Crear componente base compartido para Create/Edit        | Alto    | Alto     | ⭐⭐⭐⭐   | 5         |
| 6 | Mejorar prevención de re-fetch en EditReceptionForm     | Medio   | Bajo     | ⭐⭐⭐⭐   | 6         |

**Tiempo estimado**: 3-5 días
**Impacto esperado**:

- Reducción de tiempo de render: 40-60%
- Reducción de bugs: 30-40%
- Mejora en mantenibilidad: 50%

#### 🟡 **Fase 2: Importantes (ROI Alto, Esfuerzo Medio)**

| #  | Tarea                                                  | Impacto | Esfuerzo | ROI      | Prioridad |
| -- | ------------------------------------------------------ | ------- | -------- | -------- | --------- |
| 7  | Extraer lógica de transformación de payload          | Medio   | Medio    | ⭐⭐⭐⭐ | 7         |
| 8  | Crear hook compartido useReceptionForm                 | Medio   | Alto     | ⭐⭐⭐   | 8         |
| 9  | Implementar virtualización en tablas grandes          | Alto    | Medio    | ⭐⭐⭐⭐ | 9         |
| 10 | Cache compartido para opciones (productos/proveedores) | Medio   | Medio    | ⭐⭐⭐   | 10        |
| 11 | Debounce en inputs numéricos                          | Medio   | Bajo     | ⭐⭐⭐   | 11        |
| 12 | Endpoint PATCH para actualizaciones parciales          | Alto    | Alto     | ⭐⭐⭐⭐ | 12        |
| 13 | Validación completa en frontend con Zod               | Medio   | Medio    | ⭐⭐⭐   | 13        |

**Tiempo estimado**: 5-7 días
**Impacto esperado**:

- Reducción de payloads: 70-90%
- Mejora en UX: 30-40%
- Reducción de requests: 50%

#### 🟢 **Fase 3: Nice-to-Have (ROI Medio, Esfuerzo Bajo-Medio)**

| #  | Tarea                                        | Impacto | Esfuerzo | ROI    | Prioridad |
| -- | -------------------------------------------- | ------- | -------- | ------ | --------- |
| 14 | Code splitting de diálogos                  | Bajo    | Bajo     | ⭐⭐   | 14        |
| 15 | Mejorar accesibilidad (ARIA, focus, teclado) | Medio   | Medio    | ⭐⭐⭐ | 15        |
| 16 | Agregar atajos de teclado                    | Bajo    | Bajo     | ⭐⭐   | 16        |
| 17 | Mejorar mensajes de error                    | Medio   | Bajo     | ⭐⭐⭐ | 17        |
| 18 | Migración gradual a TypeScript              | Alto    | Muy Alto | ⭐⭐   | 18        |
| 19 | Agregar tests unitarios                      | Medio   | Alto     | ⭐⭐   | 19        |

**Tiempo estimado**: 3-5 días
**Impacto esperado**:

- Mejora en accesibilidad: 100%
- Mejora en mantenibilidad a largo plazo: 30%

### 6.2 Tareas Accionables Detalladas

#### Tarea 1: Memoizar Componentes y Cálculos

**Descripción**: Aplicar `React.memo`, `useMemo` y `useCallback` estratégicamente.

**Pasos**:

1. Identificar componentes que se re-renderizan innecesariamente (React DevTools)
2. Envolver componentes hijos con `React.memo`
3. Memoizar cálculos costosos con `useMemo`
4. Memoizar callbacks con `useCallback`
5. Medir mejora con Profiler

**Archivos a modificar**:

- `CreateReceptionForm/index.js`
- `EditReceptionForm/index.js`
- Componentes hijos (si se extraen)

**Criterios de éxito**:

- Reducción de 50%+ en número de renders
- Tiempo de render < 100ms para 20 líneas/palets

**Alternativas**:

- Opción A: Memoizar todo (más seguro, puede ser excesivo)
- Opción B: Memoizar solo hotspots identificados (más eficiente, requiere profiling)

**Trade-offs**:

- Memoizar todo: Más memoria, pero más seguro
- Memoizar selectivo: Menos memoria, pero requiere más trabajo

---

#### Tarea 2: Optimizar Sincronización de Precios

**Descripción**: Cambiar algoritmo O(n²) a O(n) usando Map para lookup.

**Pasos**:

1. Crear Map de `priceKey → [paletIndices]` con `useMemo`
2. Refactorizar `handlePriceChange` para usar el Map
3. Actualizar solo palets afectados
4. Testear con muchos palets (50+)

**Archivos a modificar**:

- `CreateReceptionForm/index.js` (líneas 804-840)
- `EditReceptionForm/index.js` (líneas 962-998)

**Código de ejemplo**:

```javascript
// Antes: O(n²)
updated.forEach((palletItem, palletIdx) => {
    updated.forEach((palletItem2, palletIdx2) => {
        // Verificar cada combinación
    });
});

// Después: O(n)
const affectedPallets = priceKeyToPalletsMap.get(priceKey) || [];
affectedPallets.forEach(palletIdx => {
    // Actualizar solo los afectados
});
```

**Criterios de éxito**:

- Tiempo de sincronización < 10ms con 50 palets
- Sin regresiones en funcionalidad

---

#### Tarea 3: Extraer Lógica de Cálculo de Peso Neto

**Descripción**: Mover cálculo a función pura y usar `useMemo` en lugar de `useEffect`.

**Pasos**:

1. Crear `utils/receptionCalculations.js`
2. Función `calculateNetWeight(grossWeight, boxes, tare)`
3. Reemplazar `useEffect` con `useMemo`
4. Testear función pura

**Archivos a crear/modificar**:

- `utils/receptionCalculations.js` (nuevo)
- `CreateReceptionForm/index.js` (líneas 105-113)

**Criterios de éxito**:

- Función testeable
- Sin efectos secundarios
- Cálculo solo cuando cambian valores relevantes

---

#### Tarea 4: Memoizar Transformación de Datos de Palets

**Descripción**: Memoizar cálculo de `productLotMap` y `productLotCombinations`.

**Pasos**:

1. Extraer lógica de transformación a función
2. Envolver con `useMemo`
3. Dependencias: solo `temporalPallets`

**Archivos a modificar**:

- `CreateReceptionForm/index.js` (líneas 739-882)
- `EditReceptionForm/index.js` (líneas 897-1065)

**Criterios de éxito**:

- Cálculo solo cuando cambian palets
- Tiempo de cálculo < 5ms

---

#### Tarea 5: Crear Componente Base Compartido

**Descripción**: Extraer lógica común entre Create y Edit a componente/hook base.

**Pasos**:

1. Identificar código duplicado (diff tool)
2. Crear `ReceptionFormBase` component o `useReceptionForm` hook
3. Refactorizar Create y Edit para usar base
4. Testear ambos flujos

**Archivos a crear/modificar**:

- `components/Admin/RawMaterialReceptions/ReceptionFormBase/index.js` (nuevo)
- O `hooks/useReceptionForm.js` (nuevo)
- `CreateReceptionForm/index.js` (refactor)
- `EditReceptionForm/index.js` (refactor)

**Alternativas**:

- Opción A: Componente base con props para diferencias
- Opción B: Hook compartido con lógica, componentes separados para UI
- Opción C: Composición con componentes más pequeños

**Trade-offs**:

- Componente base: Más acoplamiento, pero menos duplicación
- Hook compartido: Menos acoplamiento, pero más complejidad
- Composición: Más flexible, pero más archivos

**Recomendación**: Opción B (Hook compartido) para máxima flexibilidad

**Criterios de éxito**:

- Reducción de código duplicado: 70%+
- Ambos flujos funcionan igual que antes
- Más fácil agregar nuevos modos

---

#### Tarea 12: Endpoint PATCH para Actualizaciones Parciales

**Descripción**: Crear endpoint en backend para actualizaciones parciales.

**Pasos** (Backend):

1. Crear ruta `PATCH /raw-material-receptions/{id}`
2. Validar solo campos enviados
3. Actualizar solo campos modificados
4. Retornar recepción actualizada

**Pasos** (Frontend):

1. Detectar qué campos cambiaron (dirty fields de React Hook Form)
2. Construir payload solo con campos modificados
3. Usar PATCH en lugar de PUT cuando sea posible
4. Fallback a PUT si hay cambios estructurales (agregar/eliminar palets)

**Archivos a modificar**:

- Backend: Controller, Service, Validator
- Frontend: `rawMaterialReceptionService.js`
- Frontend: `EditReceptionForm/index.js`

**Criterios de éxito**:

- Reducción de payload: 70-90%
- Tiempo de request: 30-50% más rápido
- Sin regresiones

---

### 6.3 Decisiones a Validar

1. **¿Migrar a TypeScript ahora o después?**

   - **Pros**: Mejor DX, menos bugs, mejor autocompletado
   - **Contras**: Tiempo de migración, curva de aprendizaje
   - **Recomendación**: Después de refactors críticos (Fase 3)
2. **¿Usar React Query para cache de opciones?**

   - **Pros**: Cache automático, refetch inteligente
   - **Contras**: Nueva dependencia, más complejidad
   - **Recomendación**: Sí, para Fase 2
3. **¿Virtualizar tablas siempre o solo cuando hay muchos items?**

   - **Pros siempre**: Consistencia, preparado para crecimiento
   - **Pros condicional**: Menos overhead cuando hay pocos items
   - **Recomendación**: Condicional (>20 items)
4. **¿Endpoint PATCH o optimizar PUT?**

   - **PATCH**: Más flexible, estándar REST
   - **PUT optimizado**: Menos cambios en backend
   - **Recomendación**: PATCH (mejor a largo plazo)
5. **¿Componente base o hook compartido?**

   - Ver Tarea 5 para alternativas
   - **Recomendación**: Hook compartido

---

## 7. Resumen de Hallazgos por Severidad

### 🔴 Críticos (Deben abordarse primero)

- Renders innecesarios (falta de memoización)
- Sincronización de precios O(n²)
- Race conditions en carga de datos
- Componentes monolíticos (966-1240 líneas)
- Duplicación masiva de código (70%+)
- Payloads sobredimensionados

### 🟡 Importantes (Abordar en Fase 2)

- Falta de virtualización
- Validación duplicada
- Falta de cache para opciones
- Falta de endpoints específicos
- Lógica de negocio mezclada con UI
- Estados de carga inconsistentes

### 🟢 Nice-to-Have (Abordar en Fase 3)

- Falta de TypeScript
- Falta de tests
- Mejoras de accesibilidad
- Atajos de teclado
- Code splitting

---

## 8. Métricas de Éxito

### Antes de Refactor

- Tiempo de render inicial: ~200-400ms (con 20 items)
- Número de renders por interacción: 5-10
- Tamaño de payload: 50-100KB
- Líneas de código duplicadas: ~800
- Complejidad ciclomática: ~50-70

### Después de Refactor (Objetivos)

- Tiempo de render inicial: <100ms (60% mejora)
- Número de renders por interacción: 1-2 (80% reducción)
- Tamaño de payload: 10-30KB (70% reducción)
- Líneas de código duplicadas: <100 (90% reducción)
- Complejidad ciclomática: <20 (70% reducción)

---

## 9. Próximos Pasos

1. **Revisar este documento** con el equipo
2. **Priorizar tareas** según recursos disponibles
3. **Crear issues/tickets** para cada tarea priorizada
4. **Establecer métricas baseline** antes de empezar
5. **Implementar Fase 1** (críticas)
6. **Medir mejoras** después de cada fase
7. **Iterar** según resultados

---

**Documento generado**: [Fecha]
**Última actualización**: [Fecha]
**Versión**: 1.0
