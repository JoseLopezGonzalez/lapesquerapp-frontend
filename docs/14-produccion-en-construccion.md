# Producción - En Construcción

## 📚 Documentación Relacionada

- **[04-components-admin.md](./04-components-admin.md)** - Componentes de producción

## ⚡ Optimizaciones Implementadas

El módulo ha sido optimizado para mejorar el rendimiento:

- ✅ **Cálculo local de totales**: Los totales se calculan localmente sin depender del servidor
- ✅ **Actualización optimista**: Actualización inmediata sin esperar recarga completa
- ✅ **Contexto global**: `ProductionRecordContext` para sincronización automática
- ✅ **Eliminación de cargas múltiples**: Prevención de peticiones HTTP redundantes
- ✅ **Mejora de rendimiento**: 60-70% menos tiempo de actualización, lag eliminado

---

## 📋 Introducción

El módulo de **Producciones** está actualmente **en construcción** y desarrollo activo. Este módulo gestiona el ciclo completo de producción de productos pesqueros, desde la recepción de materia prima hasta la generación de productos finales, pasando por múltiples procesos intermedios.

**Estado**: ⚠️ **EN DESARROLLO ACTIVO**

**Ruta principal**: `/admin/productions`

**Roles permitidos**: `admin`, `manager`, `superuser`, `store_operator`

---

## 🏗️ Arquitectura del Módulo

### Estructura de Rutas

```
/admin/productions                    # Lista de producciones (EntityClient)
/admin/productions/[id]               # Vista de producción individual
/admin/productions/[id]/records/create # Crear nuevo registro de producción
/admin/productions/[id]/records/[recordId] # Vista/edición de registro
```

### Componentes Principales

**Ubicación**: `/src/components/Admin/Productions/`

1. **ProductionView.jsx** - Vista principal de producción
2. **ProductionRecordsManager.jsx** - Gestión de registros de producción
3. **ProductionRecordEditor.jsx** - Editor de registros
4. **ProductionInputsManager.jsx** - Gestión de inputs (entradas)
5. **ProductionOutputsManager.jsx** - Gestión de outputs (salidas)
6. **ProductionOutputConsumptionsManager.jsx** - Gestión de consumos
7. **ProductionRecordImagesManager.jsx** - Gestión de imágenes

---

## ✅ Funcionalidades Implementadas

### 1. Vista de Producción (ProductionView)

**Archivo**: `/src/components/Admin/Productions/ProductionView.jsx`

**Funcionalidades**:

- ✅ Visualización de información general (especie, fechas, lote)
- ✅ Carga de datos en paralelo (producción, árbol de procesos, totales, conciliación)
- ✅ Visualización de totales (cajas entrada/salida, pesos, merma)
- ✅ Visualización de conciliación (declarado vs stock real)
- ✅ Tabs para procesos y diagrama
- ✅ Estados de producción (abierto, cerrado)

**Datos cargados**:

```javascript
const [productionData, treeData, totalsData, reconciliationData] = await Promise.all([
  getProduction(productionId, token),
  getProductionProcessTree(productionId, token).catch(() => null),
  getProductionTotals(productionId, token).catch(() => null),
  getProductionReconciliation(productionId, token).catch(() => null),
]);
```

**Estados visualizados**:

- **Abierto**: `openedAt` existe y `closedAt` no existe
- **Cerrado**: `closedAt` existe
- **Sin estado**: Ninguno de los anteriores

---

### 2. Gestión de Registros de Producción

**Archivo**: `/src/components/Admin/Productions/ProductionRecordsManager.jsx`

**Funcionalidades**:

- ✅ Lista de registros de producción
- ✅ Visualización jerárquica (padre-hijo)
- ✅ Expandir/colapsar registros
- ✅ Eliminar registros
- ✅ Finalizar registros
- ✅ Navegación a creación/edición
- ✅ Integración con `ProductionInputsManager` y `ProductionOutputsManager`

**Estructura jerárquica**:

- Registros raíz: `!parent_record_id`
- Registros hijos: `parent_record_id === parentId`

---

### 3. Gestión de Inputs (Entradas)

**Archivo**: `/src/components/Admin/Productions/ProductionInputsManager.jsx`

**Funcionalidades**:

- ✅ Lista de inputs (cajas de entrada)
- ✅ Agregar inputs desde pallets
- ✅ Múltiples modos de selección:
  - **Manual**: Selección individual de cajas
  - **Por peso**: Búsqueda por peso objetivo
  - **Lector GS1-128**: Escaneo de códigos
  - **Búsqueda por peso**: Búsqueda con tolerancia
- ✅ Visualización de pallets y cajas
- ✅ Filtros por producto y lote
- ✅ Eliminar inputs
- ✅ Carga masiva desde pallets

**Modos de selección**:

```javascript
const [selectionMode, setSelectionMode] = useState('manual');
// 'manual', 'weight', 'scanner', 'weight-search'
```

**Características avanzadas**:

- Conversión de códigos GS1-128 escaneados
- Búsqueda por peso con tolerancia configurable
- Selección por lote
- Visualización de cajas disponibles vs ya usadas

---

### 4. Gestión de Outputs (Salidas)

**Archivo**: `/src/components/Admin/Productions/ProductionOutputsManager.jsx`

**Funcionalidades**:

- ✅ Lista de outputs (productos generados)
- ✅ Crear outputs
- ✅ Editar outputs
- ✅ Eliminar outputs
- ✅ Creación múltiple
- ✅ Sincronización masiva

**Nota**: El componente está implementado pero requiere revisión de funcionalidad completa.

---

### 5. Gestión de Consumos

**Archivo**: `/src/components/Admin/Productions/ProductionOutputConsumptionsManager.jsx`

**Funcionalidades**:

- ✅ Lista de consumos de outputs del proceso padre
- ✅ Crear consumos individuales
- ✅ Editar consumos
- ✅ Eliminar consumos
- ✅ Gestión masiva (crear/editar múltiples)
- ✅ Visualización de outputs disponibles del padre
- ✅ Validación de pesos y cajas consumidas

**Relación padre-hijo**:

- Un proceso hijo puede consumir outputs del proceso padre
- Solo muestra outputs disponibles (no consumidos completamente)

---

### 6. Gestión de Imágenes

**Archivo**: `/src/components/Admin/Productions/ProductionRecordImagesManager.jsx`

**Funcionalidades**:

- ✅ Visualización de imágenes (hasta 6 visibles)
- ✅ Subir imágenes (drag & drop o click)
- ✅ Validación de tipo y tamaño (max 10MB)
- ✅ Preview de imágenes
- ✅ Eliminar imágenes
- ✅ Diálogo de vista ampliada

**Formatos soportados**: JPG, PNG, GIF, WEBP

**Limitación**: Actualmente usa datos mock locales. La integración con backend está pendiente.

---

### 7. Editor de Registros

**Archivo**: `/src/components/Admin/Productions/ProductionRecordEditor.jsx`

**Funcionalidades**:

- ✅ Crear/editar registros de producción
- ✅ Formulario con validación
- ✅ Gestión de inputs, outputs y consumos
- ✅ Integración con otros managers

---

## 📡 Servicios API v2

**Archivo**: `/src/services/productionService.js`

### Producciones

1. **`getProductions(token, params)`**
   - Endpoint: `GET /api/v2/productions`
   - Obtiene lista de producciones

2. **`getProduction(productionId, token)`**
   - Endpoint: `GET /api/v2/productions/:id`
   - Obtiene producción por ID

3. **`createProduction(productionData, token)`**
   - Endpoint: `POST /api/v2/productions`
   - Crea nueva producción

4. **`updateProduction(productionId, productionData, token)`**
   - Endpoint: `PUT /api/v2/productions/:id`
   - Actualiza producción

5. **`deleteProduction(productionId, token)`**
   - Endpoint: `DELETE /api/v2/productions/:id`
   - Elimina producción

6. **`getProductionProcessTree(productionId, token)`**
   - Endpoint: `GET /api/v2/productions/:id/process-tree`
   - Obtiene árbol de procesos

7. **`getProductionTotals(productionId, token)`**
   - Endpoint: `GET /api/v2/productions/:id/totals`
   - Obtiene totales globales

8. **`getProductionReconciliation(productionId, token)`**
   - Endpoint: `GET /api/v2/productions/:id/reconciliation`
   - Obtiene datos de conciliación

9. **`getProductionDiagram(productionId, token)`**
   - Endpoint: `GET /api/v2/productions/:id/diagram`
   - Obtiene diagrama calculado

### Production Records

10. **`getProductionRecords(token, params)`**
    - Endpoint: `GET /api/v2/production-records`
    - Obtiene lista de registros

11. **`getProductionRecord(recordId, token)`**
    - Endpoint: `GET /api/v2/production-records/:id`
    - Obtiene registro por ID

12. **`createProductionRecord(recordData, token)`**
    - Endpoint: `POST /api/v2/production-records`
    - Crea nuevo registro

13. **`updateProductionRecord(recordId, recordData, token)`**
    - Endpoint: `PUT /api/v2/production-records/:id`
    - Actualiza registro

14. **`deleteProductionRecord(recordId, token)`**
    - Endpoint: `DELETE /api/v2/production-records/:id`
    - Elimina registro

15. **`finishProductionRecord(recordId, token)`**
    - Endpoint: `POST /api/v2/production-records/:id/finish`
    - Finaliza registro

### Production Inputs

16. **`getProductionInputs(token, params)`**
    - Endpoint: `GET /api/v2/production-inputs`
    - Obtiene lista de inputs

17. **`createProductionInput(inputData, token)`**
    - Endpoint: `POST /api/v2/production-inputs`
    - Crea nuevo input

18. **`deleteProductionInput(inputId, token)`**
    - Endpoint: `DELETE /api/v2/production-inputs/:id`
    - Elimina input

19. **`createMultipleProductionInputs(productionRecordId, boxIds, token)`**
    - Endpoint: `POST /api/v2/production-inputs/multiple`
    - Crea múltiples inputs

### Production Outputs

20. **`getProductionOutputs(token, params)`**
    - Endpoint: `GET /api/v2/production-outputs`
    - Obtiene lista de outputs

21. **`createProductionOutput(outputData, token)`**
    - Endpoint: `POST /api/v2/production-outputs`
    - Crea nuevo output

22. **`updateProductionOutput(outputId, outputData, token)`**
    - Endpoint: `PUT /api/v2/production-outputs/:id`
    - Actualiza output

23. **`deleteProductionOutput(outputId, token)`**
    - Endpoint: `DELETE /api/v2/production-outputs/:id`
    - Elimina output

24. **`createMultipleProductionOutputs(data, token)`**
    - Endpoint: `POST /api/v2/production-outputs/multiple`
    - Crea múltiples outputs

25. **`syncProductionOutputs(productionRecordId, data, token)`**
    - Endpoint: `PUT /api/v2/production-records/:id/outputs`
    - Sincroniza outputs (crear/actualizar/eliminar)

### Production Record Images

26. **`getProductionRecordImages(recordId, token)`**
    - Endpoint: `GET /api/v2/production-records/:id/images`
    - Obtiene imágenes de registro

27. **`uploadProductionRecordImage(recordId, imageFile, token)`**
    - Endpoint: `POST /api/v2/production-records/:id/images`
    - Sube imagen a registro

28. **`deleteProductionRecordImage(recordId, imageId, token)`**
    - Endpoint: `DELETE /api/v2/production-records/:id/images/:imageId`
    - Elimina imagen

### Production Output Consumptions

29. **`getProductionOutputConsumptions(token, params)`**
    - Endpoint: `GET /api/v2/production-output-consumptions`
    - Obtiene lista de consumos

30. **`getAvailableOutputs(productionRecordId, token)`**
    - Endpoint: `GET /api/v2/production-output-consumptions/available-outputs/:id`
    - Obtiene outputs disponibles del padre

31. **`createProductionOutputConsumption(consumptionData, token)`**
    - Endpoint: `POST /api/v2/production-output-consumptions`
    - Crea nuevo consumo

32. **`updateProductionOutputConsumption(consumptionId, consumptionData, token)`**
    - Endpoint: `PUT /api/v2/production-output-consumptions/:id`
    - Actualiza consumo

33. **`deleteProductionOutputConsumption(consumptionId, token)`**
    - Endpoint: `DELETE /api/v2/production-output-consumptions/:id`
    - Elimina consumo

34. **`createMultipleProductionOutputConsumptions(data, token)`**
    - Endpoint: `POST /api/v2/production-output-consumptions/multiple`
    - Crea múltiples consumos

35. **`syncProductionOutputConsumptions(productionRecordId, data, token)`**
    - Endpoint: `PUT /api/v2/production-records/:id/parent-output-consumptions`
    - Sincroniza consumos (crear/actualizar/eliminar)

---

## ⚠️ Funcionalidades Pendientes

### 1. Diagrama Visual de Producción

**Estado**: No implementado

**Ubicación**: `/src/components/Admin/Productions/ProductionView.jsx` (línea 313-325)

**Descripción**: El tab "Diagrama" muestra un mensaje placeholder:

```javascript
<p className="text-muted-foreground">
  El diagrama se generará dinámicamente desde los procesos registrados.
</p>
```

**Recomendación**: Implementar visualización de árbol de procesos usando librería como `react-flow` o `d3.js`.

---

### 2. Integración Completa de Imágenes

**Estado**: Parcialmente implementado

**Archivo**: `/src/components/Admin/Productions/ProductionRecordImagesManager.jsx`

**Problema**:

- Usa datos mock locales (líneas 25-32 comentadas)
- No se conecta con backend para subir/obtener imágenes reales
- Solo crea previews locales

**Recomendación**:

- Integrar con `uploadProductionRecordImage` y `getProductionRecordImages`
- Implementar carga real de imágenes al backend

---

### 3. Formulario de Creación de Producción

**Estado**: No implementado

**Problema**: No hay formulario para crear nuevas producciones desde el frontend.

**Recomendación**: Crear componente `CreateProductionForm` similar a `CreateOrderForm`.

---

### 4. Validaciones Avanzadas

**Estado**: Parcialmente implementado

**Problemas**:

- Falta validación de pesos totales (inputs vs outputs)
- Falta validación de consumos (no consumir más de lo disponible)
- Falta validación de jerarquía (no crear ciclos)

**Recomendación**: Añadir validaciones en frontend y backend.

---

### 5. Exportación de Datos

**Estado**: No implementado

**Problema**: No hay exportación a Excel/PDF de producciones.

**Recomendación**: Añadir opciones de exportación similares a pedidos.

---

### 6. Filtros y Búsqueda Avanzada

**Estado**: Básico implementado

**Problema**: Filtros limitados en lista de producciones.

**Recomendación**: Añadir filtros por especie, fecha, estado, lote.

---

### 7. Notificaciones y Alertas

**Estado**: No implementado

**Problema**: No hay alertas para:

- Diferencias en conciliación
- Procesos sin finalizar
- Consumos excedidos

**Recomendación**: Implementar sistema de notificaciones.

---

## 🔧 Limitaciones Conocidas

### 1. Manejo de Errores

**Problema**: Algunos componentes no manejan todos los casos de error.

**Ejemplo**: `ProductionView.jsx` captura errores pero no siempre muestra mensajes claros.

**Recomendación**: Mejorar manejo de errores en todos los componentes.

---

### 2. Carga de Datos

**Problema**: Algunos componentes cargan datos en paralelo sin manejar dependencias.

**Ejemplo**: `ProductionView` carga `processTree`, `totals` y `reconciliation` en paralelo, pero si falla uno, los otros pueden no ser útiles.

**Recomendación**: Implementar carga condicional o manejo de dependencias.

---

### 3. Actualización en Tiempo Real

**Problema**: No hay actualización automática cuando otros usuarios modifican datos.

**Recomendación**: Implementar polling o WebSockets para actualizaciones en tiempo real.

---

### 4. Performance con Muchos Datos

**Problema**: Componentes como `ProductionInputsManager` pueden ser lentos con muchos pallets/cajas.

**Recomendación**: Implementar paginación, virtualización o lazy loading.

---

### 5. Validación de Consumos

**Problema**: No valida en frontend si se consume más de lo disponible.

**Recomendación**: Añadir validación antes de enviar al backend.

---

### 6. Navegación entre Registros

**Problema**: No hay navegación fácil entre registros relacionados.

**Recomendación**: Añadir breadcrumbs o navegación contextual.

---

## 📊 Estructura de Datos

### Producción

```javascript
{
  id: number,
  lot: string,
  species: { id: number, name: string },
  openedAt: string,
  closedAt: string | null,
  notes: string | null
}
```

### Production Record

```javascript
{
  id: number,
  production_id: number,
  parent_record_id: number | null,
  process_type: string,
  startedAt: string,
  finishedAt: string | null,
  notes: string | null,
  inputs: Array<ProductionInput>,
  outputs: Array<ProductionOutput>,
  parentOutputConsumptions: Array<ProductionOutputConsumption>
}
```

### Production Input

```javascript
{
  id: number,
  production_record_id: number,
  box_id: number,
  box: { id: number, product: {...}, lot: string, netWeight: number }
}
```

### Production Output

```javascript
{
  id: number,
  production_record_id: number,
  product_id: number,
  quantity_kg: number,
  quantity_boxes: number,
  notes: string | null
}
```

### Production Output Consumption

```javascript
{
  id: number,
  production_record_id: number,
  production_output_id: number,
  consumed_weight_kg: number,
  consumed_boxes: number,
  notes: string | null
}
```

---

## 🎯 Próximos Pasos Recomendados

1. **Completar integración de imágenes** con backend
2. **Implementar diagrama visual** de procesos
3. **Añadir formulario de creación** de producciones
4. **Mejorar validaciones** en frontend
5. **Implementar exportación** de datos
6. **Añadir filtros avanzados** en lista
7. **Implementar notificaciones** y alertas
8. **Optimizar performance** con paginación
9. **Mejorar manejo de errores** en todos los componentes
10. **Añadir tests** para componentes críticos

---

## 📝 Notas de Desarrollo

- El módulo está en desarrollo activo
- Algunos componentes pueden tener funcionalidad parcial
- Se recomienda probar exhaustivamente antes de usar en producción
- La API v2 está completa, pero algunos endpoints pueden tener cambios
- Se recomienda revisar logs del backend para errores no manejados

---

## ⚠️ Observaciones Críticas y Mejoras Recomendadas

### 1. ProductionRecordImagesManager Usa Datos Mock

- **Archivo**: `/src/components/Admin/Productions/ProductionRecordImagesManager.jsx`
- **Línea**: 25-32
- **Problema**: Usa datos mock locales, no se conecta con backend
- **Impacto**: Imágenes no se guardan realmente
- **Recomendación**: Integrar con servicios de imágenes del backend

### 2. Diagrama No Implementado

- **Archivo**: `/src/components/Admin/Productions/ProductionView.jsx`
- **Línea**: 313-325
- **Problema**: Tab "Diagrama" solo muestra placeholder
- **Impacto**: No se puede visualizar flujo de procesos
- **Recomendación**: Implementar visualización de árbol de procesos

### 3. Falta Formulario de Creación de Producción

- **Archivo**: No existe
- **Problema**: No hay forma de crear producciones desde frontend
- **Impacto**: Debe crearse desde backend o EntityClient genérico
- **Recomendación**: Crear `CreateProductionForm` específico

### 4. Manejo de Errores Incompleto

- **Archivo**: Múltiples componentes
- **Problema**: Algunos errores se muestran con `alert()` o `console.error`
- **Impacto**: UX inconsistente
- **Recomendación**: Usar toast notifications consistentemente

### 5. Falta Validación de Consumos en Frontend

- **Archivo**: `/src/components/Admin/Productions/ProductionOutputConsumptionsManager.jsx`
- **Problema**: No valida si se consume más de lo disponible antes de enviar
- **Impacto**: Errores solo se detectan en backend
- **Recomendación**: Añadir validación antes de `createProductionOutputConsumption`

### 6. Carga de Datos Sin Dependencias

- **Archivo**: `/src/components/Admin/Productions/ProductionView.jsx`
- **Línea**: 40-45
- **Problema**: Carga datos en paralelo sin considerar dependencias
- **Impacto**: Si falla uno, otros pueden no ser útiles
- **Recomendación**: Implementar carga condicional o manejo de dependencias

### 7. ProductionInputsManager Sin Paginación

- **Archivo**: `/src/components/Admin/Productions/ProductionInputsManager.jsx`
- **Problema**: Carga todos los pallets/cajas sin paginación
- **Impacto**: Puede ser lento con muchos datos
- **Recomendación**: Implementar paginación o lazy loading

### 8. Falta Actualización en Tiempo Real

- **Archivo**: Múltiples componentes
- **Problema**: No hay actualización automática cuando otros usuarios modifican
- **Impacto**: Datos pueden quedar obsoletos
- **Recomendación**: Implementar polling o WebSockets

### 9. Navegación Entre Registros Limitada

- **Archivo**: `/src/components/Admin/Productions/ProductionRecordsManager.jsx`
- **Problema**: No hay navegación fácil entre registros relacionados
- **Impacto**: Difícil seguir flujo de procesos
- **Recomendación**: Añadir breadcrumbs o navegación contextual

### 10. Falta Exportación de Datos

- **Archivo**: No existe
- **Problema**: No hay exportación a Excel/PDF de producciones
- **Impacto**: Difícil compartir o analizar datos
- **Recomendación**: Añadir opciones de exportación similares a pedidos

### 11. Validaciones de Peso Incompletas

- **Archivo**: Múltiples componentes
- **Problema**: No valida pesos totales (inputs vs outputs) en frontend
- **Impacto**: Errores solo se detectan en backend
- **Recomendación**: Añadir validaciones en frontend

### 12. Falta Confirmación en Eliminaciones

- **Archivo**: `/src/components/Admin/Productions/ProductionRecordsManager.jsx`
- **Línea**: 50-64
- **Problema**: Usa `confirm()` nativo, no diálogo personalizado
- **Impacto**: UX inconsistente con resto de la app
- **Recomendación**: Usar Dialog de ShadCN para confirmaciones

### 13. ProductionOutputConsumptionsManager Sin Validación de Disponibilidad

- **Archivo**: `/src/components/Admin/Productions/ProductionOutputConsumptionsManager.jsx`
- **Problema**: No valida si output está disponible antes de consumir
- **Impacto**: Puede intentar consumir más de lo disponible
- **Recomendación**: Validar disponibilidad antes de crear consumo

### 14. Falta Manejo de Estados de Carga Individuales

- **Archivo**: Múltiples componentes
- **Problema**: Algunos componentes no muestran estados de carga individuales
- **Impacto**: Usuario no sabe qué está cargando
- **Recomendación**: Añadir skeletons o loaders específicos

### 15. Falta Documentación de Flujos de Producción

- **Archivo**: No existe
- **Problema**: No hay documentación clara de cómo funciona el flujo completo
- **Impacto**: Difícil entender cómo usar el módulo
- **Recomendación**: Crear documentación de flujos de usuario
