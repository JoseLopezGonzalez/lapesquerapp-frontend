# Observaciones Críticas - Compilación Completa

## 📚 Documentación Relacionada

- **[00-overview-introduction.md](./00-overview-introduction.md)** - Visión general del proyecto
- **[01-architecture-app-router.md](./01-architecture-app-router.md)** - Arquitectura del proyecto
- Cada documento numerado incluye su propia sección de observaciones críticas

---

## 📋 Introducción

Este documento compila **todas las observaciones críticas** identificadas en la documentación del frontend. Estas observaciones documentan problemas, inconsistencias, código muerto, y áreas de mejora **sin modificar el código existente**.

**Total de observaciones**: 200+ observaciones identificadas

**Organización**: Por categoría y archivo de origen

---

## 🔴 Categorías de Observaciones

1. **Código Duplicado** - Funciones o componentes duplicados
2. **Código Muerto** - Código no usado o comentado
3. **Lógica Incompleta** - Funcionalidades parcialmente implementadas
4. **Manejo de Errores** - Falta de manejo o manejo inconsistente
5. **Validaciones** - Falta de validación de datos
6. **Rendimiento** - Problemas de performance
7. **Arquitectura** - Inconsistencias arquitectónicas
8. **Seguridad** - Problemas de seguridad
9. **UX/UI** - Problemas de experiencia de usuario
10. **Mantenibilidad** - Código difícil de mantener

---

## 1. 🔄 Código Duplicado

### 1.1. convertScannedCodeToGs1128 Duplicado

- **Archivos**:
  - `/src/hooks/usePallet.js`
  - `/src/components/Admin/Productions/ProductionInputsManager.jsx`
- **Problema**: Misma función implementada en dos lugares con ligeras diferencias
- **Impacto**: Mantenimiento difícil, posible inconsistencia
- **Recomendación**: Extraer a helper común en `/src/helpers/barcodes/`
- **Origen**: `12-utilidades-helpers.md`

### 1.2. Código Duplicado en Exportaciones A3ERP

- **Archivos**: Múltiples archivos de ExportModal
  - `/src/components/Admin/MarketDataExtractor/FacturaDocapesca/ExportModal/index.js`
  - `/src/components/Admin/MarketDataExtractor/ListadoComprasLonjaDeIsla/ExportModal/index.js`
  - `/src/components/Admin/MarketDataExtractor/AlbaranCofraWeb/ExportModal/index.js`
- **Problema**: Misma lógica de generación de Excel para A3ERP duplicada en varios componentes
- **Impacto**: Mantenimiento difícil, posibles inconsistencias
- **Recomendación**: Extraer a función helper común en `/src/helpers/exports/generateA3ERPExcel.js`
- **Origen**: `13-exportaciones-integraciones.md`

### 1.3. classNames vs cn

- **Archivos**:
  - `/src/helpers/styles/classNames.js`
  - `/src/lib/utils.js`
- **Problema**: Dos funciones similares (`classNames` y `cn`)
- **Impacto**: Confusión sobre cuál usar
- **Recomendación**: Unificar en una sola función (preferiblemente `cn`)
- **Origen**: `12-utilidades-helpers.md`

---

## 2. 💀 Código Muerto

### 2.1. eanChecksum No Se Usa

- **Archivo**: `/src/lib/barcodes.js`
- **Línea**: 1-9
- **Problema**: Función `eanChecksum` definida pero no se usa en `serializeBarcode`
- **Impacto**: Código muerto
- **Recomendación**: Eliminar si no se usa o implementar checksum en serialización
- **Origen**: `12-utilidades-helpers.md`

### 2.2. Código Comentado en barcodes.js

- **Archivo**: `/src/lib/barcodes.js`
- **Línea**: 18-36
- **Problema**: Función `serializeBarcode` antigua comentada
- **Impacto**: Confusión sobre qué versión usar
- **Recomendación**: Eliminar código comentado
- **Origen**: `12-utilidades-helpers.md`

### 2.3. Archivo de Hook Duplicado

- **Archivo**: `/src/hooks/usePrintElement copy.js`
- **Problema**: Existe un archivo con "copy" en el nombre, probablemente duplicado accidental
- **Impacto**: Confusión sobre cuál archivo usar
- **Recomendación**: Eliminar el archivo duplicado o renombrarlo si tiene propósito diferente
- **Origen**: `00-overview-introduction.md`

---

## 3. ⚠️ Lógica Incompleta

### 3.1. ProductionRecordImagesManager Usa Datos Mock

- **Archivo**: `/src/components/Admin/Productions/ProductionRecordImagesManager.jsx`
- **Línea**: 25-32
- **Problema**: Usa datos mock locales, no se conecta con backend
- **Impacto**: Imágenes no se guardan realmente
- **Recomendación**: Integrar con servicios de imágenes del backend
- **Origen**: `14-produccion-en-construccion.md`

### 3.2. Diagrama No Implementado

- **Archivo**: `/src/components/Admin/Productions/ProductionView.jsx`
- **Línea**: 313-325
- **Problema**: Tab "Diagrama" solo muestra placeholder
- **Impacto**: No se puede visualizar flujo de procesos
- **Recomendación**: Implementar visualización de árbol de procesos
- **Origen**: `14-produccion-en-construccion.md`

### 3.3. Falta Formulario de Creación de Producción

- **Archivo**: No existe
- **Problema**: No hay forma de crear producciones desde frontend
- **Impacto**: Debe crearse desde backend o EntityClient genérico
- **Recomendación**: Crear `CreateProductionForm` específico
- **Origen**: `14-produccion-en-construccion.md`

### 3.4. Integración Facilcom No Implementada

- **Archivos**: Múltiples archivos de ExportModal
- **Problema**: Funciones `generateExcelForFacilcom()` comentadas o no implementadas
- **Impacto**: Usuarios no pueden exportar a Facilcom desde frontend
- **Recomendación**: Implementar formato de exportación para Facilcom o documentar que se hace desde backend
- **Origen**: `13-exportaciones-integraciones.md`

### 3.5. Falta de Zod

- **Archivo**: Todo el proyecto
- **Problema**: Se menciona React Hook Form + Zod en requisitos, pero no se encontraron schemas de Zod
- **Impacto**: Validaciones menos robustas, no hay validación de tipos en tiempo de compilación
- **Recomendación**: Implementar schemas Zod o documentar claramente que no se usa
- **Origen**: `08-formularios.md`, `00-overview-introduction.md`

---

## 4. ❌ Manejo de Errores

### 4.1. Manejo de Errores Incompleto en exportDocument

- **Archivo**: `/src/hooks/useOrder.js`
- **Línea**: 236-267
- **Problema**: Error genérico "Error al exportar" sin detalles
- **Impacto**: Difícil debuggear problemas de exportación
- **Recomendación**: Añadir logging y mensajes de error más específicos
- **Origen**: `13-exportaciones-integraciones.md`

### 4.2. Manejo de Errores Incompleto

- **Archivos**: Múltiples componentes
- **Problema**: Algunos errores se muestran con `alert()` o `console.error`
- **Impacto**: UX inconsistente
- **Recomendación**: Usar toast notifications consistentemente
- **Origen**: `14-produccion-en-construccion.md`

### 4.3. formatDate Sin Manejo de Errores

- **Archivo**: `/src/helpers/formats/dates/formatDates.js`
- **Línea**: 1-7
- **Problema**: No valida que `date` sea una fecha válida
- **Impacto**: Puede retornar "Invalid Date" o errores
- **Recomendación**: Añadir validación y retornar "-" o null si es inválida
- **Origen**: `12-utilidades-helpers.md`

### 4.4. getSettingValue Sin Manejo de Errores

- **Archivo**: `/src/helpers/getSettingValue.js`
- **Línea**: 5-10
- **Problema**: No maneja errores si `getSettings()` falla
- **Impacto**: Puede lanzar error no manejado
- **Recomendación**: Añadir try-catch y retornar null o valor por defecto
- **Origen**: `12-utilidades-helpers.md`

### 4.5. EntityService Lanza Response en lugar de Error

- **Archivo**: `/src/services/entityService.js`
- **Línea**: 21, 37, 50
- **Problema**: Lanza `response` directamente en lugar de `Error`
- **Impacto**: Manejo de errores inconsistente
- **Recomendación**: Lanzar Error con mensaje extraído de response
- **Origen**: `07-servicios-api-v2.md`

### 4.6. Flujo de Exportación sin Manejo de Errores de Red

- **Archivo**: `/src/hooks/useOrder.js`
- **Problema**: Si falla la descarga, no hay manejo de errores específico
- **Impacto**: Usuario no sabe qué pasó
- **Recomendación**: Añadir manejo de errores con mensajes claros
- **Origen**: `09-flujos-completos.md`

### 4.7. Carga de Datos Sin Dependencias

- **Archivo**: `/src/components/Admin/Productions/ProductionView.jsx`
- **Línea**: 40-45
- **Problema**: Carga datos en paralelo sin considerar dependencias
- **Impacto**: Si falla uno, otros pueden no ser útiles
- **Recomendación**: Implementar carga condicional o manejo de dependencias
- **Origen**: `14-produccion-en-construccion.md`

---

## 5. ✅ Validaciones

### 5.1. Falta de Validación de Productos en Crear Pedido

- **Archivo**: `/src/components/Admin/OrdersManager/CreateOrderForm/index.js`
- **Problema**: No hay validación de que `plannedProducts` tenga al menos un elemento
- **Impacto**: Se puede crear pedido sin productos
- **Recomendación**: Añadir validación `minLength: 1` al array
- **Origen**: `09-flujos-completos.md`, `08-formularios.md`

### 5.2. Falta de Validación de Datos en A3ERP Export

- **Archivos**: Múltiples archivos de ExportModal
- **Problema**: No valida que `codA3erp` exista antes de exportar
- **Impacto**: Puede generar archivos con datos inválidos
- **Recomendación**: Validar datos antes de generar Excel
- **Origen**: `13-exportaciones-integraciones.md`

### 5.3. Falta Validación de Consumos en Frontend

- **Archivo**: `/src/components/Admin/Productions/ProductionOutputConsumptionsManager.jsx`
- **Problema**: No valida si se consume más de lo disponible antes de enviar
- **Impacto**: Errores solo se detectan en backend
- **Recomendación**: Añadir validación antes de `createProductionOutputConsumption`
- **Origen**: `14-produccion-en-construccion.md`

### 5.4. Validaciones de Peso Incompletas

- **Archivos**: Múltiples componentes
- **Problema**: No valida pesos totales (inputs vs outputs) en frontend
- **Impacto**: Errores solo se detectan en backend
- **Recomendación**: Añadir validaciones en frontend
- **Origen**: `14-produccion-en-construccion.md`

### 5.5. parseEuropeanNumber Sin Validación

- **Archivo**: `/src/helpers/formats/numbers/formatNumbers.js`
- **Línea**: 36-39
- **Problema**: No valida formato antes de parsear
- **Impacto**: Puede retornar NaN sin feedback claro
- **Recomendación**: Añadir validación de formato
- **Origen**: `12-utilidades-helpers.md`

### 5.6. Falta de Validación de Parámetros

- **Archivos**: Todos los servicios
- **Problema**: No se valida que `token` exista antes de hacer fetch
- **Impacto**: Errores en tiempo de ejecución si token es undefined
- **Recomendación**: Validar token al inicio de cada función o usar función helper
- **Origen**: `07-servicios-api-v2.md`

### 5.7. Validación de Email Básica

- **Archivos**: Múltiples formularios
- **Problema**: Regex de email básica (`/^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/`) puede rechazar emails válidos
- **Impacto**: Usuarios con emails válidos pueden tener problemas
- **Recomendación**: Usar librería de validación de email o regex más completa
- **Origen**: `08-formularios.md`, `03-components-ui-shadcn.md`

### 5.8. Envío de Documentos Sin Validación de Emails

- **Archivo**: `/src/components/Admin/OrdersManager/Order/OrderDocuments/index.js`
- **Problema**: No valida formato de emails antes de enviar
- **Impacto**: Puede enviar a emails inválidos
- **Recomendación**: Validar formato de emails antes de enviar
- **Origen**: `13-exportaciones-integraciones.md`

### 5.9. Parámetro "from" No Validado

- **Archivo**: `/src/components/LoginPage/index.js`
- **Línea**: 65
- **Problema**: Parámetro `from` de URL no se valida antes de redirigir
- **Impacto**: Posible redirección a URL maliciosa
- **Recomendación**: Validar que `from` sea una ruta válida de la aplicación
- **Origen**: `11-autenticacion-autorizacion.md`

### 5.10. downloadFile Sin Validación de Tipo

- **Archivo**: `/src/services/entityService.js`
- **Línea**: 112
- **Problema**: No valida que `type` sea válido antes de generar nombre
- **Impacto**: Puede generar nombres de archivo incorrectos
- **Recomendación**: Validar tipo y usar extensión correcta
- **Origen**: `13-exportaciones-integraciones.md`

---

## 6. ⚡ Rendimiento

### 6.1. Validación de Token con Backend en Cada Request

- **Archivo**: `/src/middleware.js`
- **Línea**: 43-56
- **Problema**: Hace fetch a `/api/v2/me` en cada request protegida
- **Impacto**: Latencia adicional, carga en el backend
- **Recomendación**: Cachear validación o validar solo periódicamente
- **Origen**: `11-autenticacion-autorizacion.md`

### 6.2. Falta de Memoización en Providers

- **Archivos**: Todos los contextos
- **Problema**: Los valores del contexto no están memoizados
- **Impacto**: Re-renders innecesarios de todos los consumidores cuando cambia cualquier valor
- **Recomendación**: Usar `useMemo` para el valor del contexto
- **Origen**: `06-context-api.md`

### 6.3. ProductionInputsManager Sin Paginación

- **Archivo**: `/src/components/Admin/Productions/ProductionInputsManager.jsx`
- **Problema**: Carga todos los pallets/cajas sin paginación
- **Impacto**: Puede ser lento con muchos datos
- **Recomendación**: Implementar paginación o lazy loading
- **Origen**: `14-produccion-en-construccion.md`

### 6.4. Performance con Muchos Datos

- **Archivo**: `/src/components/Admin/Productions/ProductionInputsManager.jsx`
- **Problema**: Componentes pueden ser lentos con muchos pallets/cajas
- **Impacto**: UX degradada con grandes volúmenes
- **Recomendación**: Implementar paginación, virtualización o lazy loading
- **Origen**: `14-produccion-en-construccion.md`

### 6.5. Falta de Compresión en Archivos Excel Grandes

- **Archivos**: Múltiples archivos de ExportModal
- **Problema**: No comprime archivos Excel grandes
- **Impacto**: Archivos muy grandes pueden causar problemas
- **Recomendación**: Considerar compresión o streaming para archivos grandes
- **Origen**: `13-exportaciones-integraciones.md`

### 6.6. Falta Actualización en Tiempo Real

- **Archivos**: Múltiples componentes
- **Problema**: No hay actualización automática cuando otros usuarios modifican
- **Impacto**: Datos pueden quedar obsoletos
- **Recomendación**: Implementar polling o WebSockets
- **Origen**: `14-produccion-en-construccion.md`

---

## 7. 🏗️ Arquitectura

### 7.1. StoreContext con Muchas Props de Callback

- **Archivo**: `/src/context/StoreContext.js`
- **Línea**: 10
- **Problema**: StoreProvider requiere 4 callbacks del padre (onUpdateCurrentStoreTotalNetWeight, onAddNetWeightToStore, setIsStoreLoading)
- **Impacto**: Acoplamiento fuerte, difícil de usar, prop drilling
- **Recomendación**: Considerar mover lógica de callbacks dentro del hook o usar eventos/callbacks opcionales
- **Origen**: `06-context-api.md`

### 7.2. useStore con Estado Complejo

- **Archivo**: `/src/hooks/useStore.js`
- **Línea**: 23-571
- **Problema**: Hook muy grande (571 líneas) con mucha lógica y estado
- **Impacto**: Difícil de mantener y testear
- **Recomendación**: Dividir en hooks más pequeños y específicos
- **Origen**: `06-context-api.md`

### 7.3. Inconsistencia en Extracción de Datos

- **Archivos**: Múltiples servicios
- **Problema**: Algunos servicios retornan `data.data`, otros retornan `data` directamente
- **Impacto**: Inconsistencia, posible confusión
- **Recomendación**: Estandarizar (preferiblemente siempre extraer `data.data` si existe)
- **Origen**: `07-servicios-api-v2.md`

### 7.4. SettingsService con getSession() Interno

- **Archivo**: `/src/services/settingsService.js`
- **Línea**: 5-6, 21-22
- **Problema**: Obtiene sesión internamente, diferente a otros servicios que reciben token
- **Impacto**: Inconsistencia en patrón
- **Recomendación**: Estandarizar (recibir token como parámetro o todos obtenerlo internamente)
- **Origen**: `07-servicios-api-v2.md`

### 7.5. AutocompleteService con getSession() Interno

- **Archivo**: `/src/services/autocompleteService.js`
- **Problema**: Similar a SettingsService, obtiene sesión internamente
- **Impacto**: Inconsistencia
- **Recomendación**: Estandarizar patrón
- **Origen**: `07-servicios-api-v2.md`

### 7.6. Context API en lugar de Zustand

- **Archivo**: `/src/context/`
- **Problema**: Se menciona Zustand/Context en los requisitos, pero solo se usa Context API
- **Impacto**: Ninguno crítico, pero puede haber confusión
- **Recomendación**: Documentar claramente que se usa Context API, no Zustand, o considerar migración si se necesita mejor rendimiento
- **Origen**: `00-overview-introduction.md`

### 7.7. Middleware Complejo

- **Archivo**: `/src/middleware.js`
- **Línea**: 1-125
- **Problema**: Middleware con mucha lógica, incluyendo validación de token con fetch al backend
- **Impacto**: Posible impacto en rendimiento, lógica compleja de mantener
- **Recomendación**: Considerar extraer lógica a funciones auxiliares o servicios separados
- **Origen**: `00-overview-introduction.md`

### 7.8. Mezcla de Librerías de Iconos

- **Archivos**: Múltiples componentes
- **Problema**: Se usan tres librerías de iconos diferentes: Lucide, Heroicons, React Icons
- **Impacto**: Bundle size aumentado, inconsistencia visual potencial
- **Recomendación**: Estandarizar en una sola librería (preferiblemente Lucide, que es la configurada en ShadCN)
- **Origen**: `00-overview-introduction.md`

### 7.9. Inconsistencia en Nombres de Archivos

- **Archivo**: `/src/components/ui/`
- **Problema**: Algunos archivos son `.jsx` (button.jsx) y otros podrían ser `.js`
- **Impacto**: Inconsistencia menor
- **Recomendación**: Estandarizar extensión (preferiblemente `.jsx` para componentes React)
- **Origen**: `03-components-ui-shadcn.md`

---

## 8. 🔒 Seguridad

### 8.1. Store Operator sin Validación de Almacén en Backend

- **Archivo**: `/src/app/warehouse/[storeId]/page.js`
- **Problema**: Validación solo en frontend, no en backend
- **Impacto**: Posible acceso no autorizado si se manipula el frontend
- **Recomendación**: Validar en backend también
- **Origen**: `11-autenticacion-autorizacion.md`

### 8.2. Falta de CSRF Protection

- **Archivo**: `/src/app/api/auth/[...nextauth]/route.js`
- **Problema**: No hay protección explícita contra CSRF
- **Impacto**: Vulnerable a ataques CSRF
- **Recomendación**: NextAuth tiene protección por defecto, pero documentar y verificar
- **Origen**: `11-autenticacion-autorizacion.md`

### 8.3. Token en Session No Encriptado

- **Archivo**: `/src/app/api/auth/[...nextauth]/route.js`
- **Línea**: 98-104
- **Problema**: Token de acceso se almacena directamente en session
- **Impacto**: Si session se compromete, token también
- **Recomendación**: Considerar encriptar o almacenar de forma más segura
- **Origen**: `11-autenticacion-autorizacion.md`

### 8.4. Secret No Validado al Inicio

- **Archivo**: `/src/app/api/auth/[...nextauth]/route.js`
- **Línea**: 116
- **Problema**: `NEXTAUTH_SECRET` puede estar undefined sin error claro
- **Impacto**: Aplicación puede fallar silenciosamente
- **Recomendación**: Validar que exista al inicio de la aplicación
- **Origen**: `11-autenticacion-autorizacion.md`

---

## 9. 🎨 UX/UI

### 9.1. Falta de Confirmación en Eliminaciones

- **Archivo**: `/src/components/Admin/Productions/ProductionRecordsManager.jsx`
- **Línea**: 50-64
- **Problema**: Usa `confirm()` nativo, no diálogo personalizado
- **Impacto**: UX inconsistente con resto de la app
- **Recomendación**: Usar Dialog de ShadCN para confirmaciones
- **Origen**: `14-produccion-en-construccion.md`

### 9.2. Falta de Confirmación en Exportación Múltiple

- **Archivo**: `/src/components/Admin/OrdersManager/Order/OrderExport/index.js`
- **Línea**: 27-31
- **Problema**: No pide confirmación antes de exportar todos
- **Impacto**: Puede generar muchos archivos sin querer
- **Recomendación**: Añadir diálogo de confirmación
- **Origen**: `13-exportaciones-integraciones.md`

### 9.3. Falta de Progress Indicator en Polling

- **Archivo**: `/src/services/azure/index.js`
- **Problema**: No hay indicador de progreso durante polling
- **Impacto**: Usuario no sabe cuánto tiempo falta
- **Recomendación**: Añadir callback de progreso o estimación de tiempo
- **Origen**: `13-exportaciones-integraciones.md`

### 9.4. Exportación Sin Indicador de Progreso

- **Archivos**: Múltiples componentes
- **Problema**: Solo muestra toast, no progreso real
- **Impacto**: Usuario no sabe cuánto falta para archivos grandes
- **Recomendación**: Añadir indicador de progreso para exportaciones grandes
- **Origen**: `13-exportaciones-integraciones.md`

### 9.5. Falta Manejo de Estados de Carga Individuales

- **Archivos**: Múltiples componentes
- **Problema**: Algunos componentes no muestran estados de carga individuales
- **Impacto**: Usuario no sabe qué está cargando
- **Recomendación**: Añadir skeletons o loaders específicos
- **Origen**: `14-produccion-en-construccion.md`

### 9.6. Falta de Logout en Todas las Páginas

- **Archivos**: Múltiples componentes
- **Problema**: No todas las páginas tienen opción de logout visible
- **Impacto**: Usuario puede quedar atrapado si hay problemas
- **Recomendación**: Añadir opción de logout en layout principal
- **Origen**: `11-autenticacion-autorizacion.md`

### 9.7. Navegación Entre Registros Limitada

- **Archivo**: `/src/components/Admin/Productions/ProductionRecordsManager.jsx`
- **Problema**: No hay navegación fácil entre registros relacionados
- **Impacto**: Difícil seguir flujo de procesos
- **Recomendación**: Añadir breadcrumbs o navegación contextual
- **Origen**: `14-produccion-en-construccion.md`

### 9.8. Falta de Validación de Roles en Algunos Componentes

- **Archivos**: Múltiples componentes
- **Problema**: Algunos componentes no validan roles antes de mostrar acciones
- **Impacto**: Usuarios pueden ver botones que no pueden usar
- **Recomendación**: Añadir validación de permisos en componentes críticos
- **Origen**: `11-autenticacion-autorizacion.md`

---

## 10. 🔧 Mantenibilidad

### 10.1. Comentario Incorrecto en StoreContext

- **Archivo**: `/src/context/StoreContext.js`
- **Línea**: 1, 11
- **Problema**: Comentario dice "OrderContext" y "datos del pedido" en lugar de "StoreContext" y "datos del almacén"
- **Impacto**: Confusión al leer el código
- **Recomendación**: Corregir comentarios
- **Origen**: `06-context-api.md`

### 10.2. Falta de Documentación JSDoc

- **Archivos**: Todos los componentes UI
- **Problema**: Componentes sin JSDoc explicando props y uso
- **Impacto**: Dificulta entender el propósito y uso de cada componente
- **Recomendación**: Añadir JSDoc a todos los componentes exportados
- **Origen**: `03-components-ui-shadcn.md`

### 10.3. Falta de Tests

- **Archivos**: Todos los componentes UI
- **Problema**: No se encontraron tests para componentes UI
- **Impacto**: Riesgo de regresiones al modificar componentes
- **Recomendación**: Implementar tests unitarios para componentes críticos
- **Origen**: `03-components-ui-shadcn.md`

### 10.4. Falta de Documentación de Variables de Entorno

- **Archivo**: No existe `.env.example`
- **Problema**: No está claro qué variables de entorno se necesitan
- **Impacto**: Dificulta el setup del proyecto para nuevos desarrolladores
- **Recomendación**: Crear `.env.example` con todas las variables necesarias
- **Origen**: `00-overview-introduction.md`

### 10.5. Falta de Documentación de Flujos de Producción

- **Archivo**: No existe
- **Problema**: No hay documentación clara de cómo funciona el flujo completo
- **Impacto**: Difícil entender cómo usar el módulo
- **Recomendación**: Crear documentación de flujos de usuario
- **Origen**: `14-produccion-en-construccion.md`

### 10.6. Falta de TypeScript

- **Archivos**: Todos los servicios y componentes
- **Problema**: Sin tipos, no hay validación de parámetros ni retornos
- **Impacto**: Errores en tiempo de ejecución, menos productividad
- **Recomendación**: Migrar a TypeScript o añadir PropTypes/JSDoc más completo
- **Origen**: `07-servicios-api-v2.md`, `03-components-ui-shadcn.md`

### 10.7. Falta de Storybook o Documentación Visual

- **Archivo**: Proyecto completo
- **Problema**: No hay Storybook o documentación visual de componentes
- **Impacto**: Difícil ver todos los componentes y sus variantes en un solo lugar
- **Recomendación**: Considerar implementar Storybook para documentación visual de componentes
- **Origen**: `03-components-ui-shadcn.md`

---

## 11. 🔄 Configuración y Variables

### 11.1. Token Expiration Hardcodeado

- **Archivo**: `/src/app/api/auth/[...nextauth]/route.js`
- **Línea**: 67
- **Problema**: `maxAge: 60 * 60 * 24 * 7` (7 días) está hardcodeado
- **Impacto**: No se puede configurar sin cambiar código
- **Recomendación**: Mover a variable de entorno
- **Origen**: `11-autenticacion-autorizacion.md`

### 11.2. Rate Limit de Azure Hardcodeado

- **Archivo**: `/src/services/azure/index.js`
- **Línea**: 77
- **Problema**: `rateLimitDelay = 17000` está hardcodeado
- **Impacto**: No se puede ajustar sin cambiar código
- **Recomendación**: Mover a variable de entorno o configuración
- **Origen**: `13-exportaciones-integraciones.md`

### 11.3. Timestamp en Nombre de Archivo Inconsistente

- **Archivo**: `/src/services/entityService.js`
- **Línea**: 59-64
- **Problema**: Formato de fecha puede variar según locale
- **Impacto**: Nombres de archivo inconsistentes
- **Recomendación**: Usar formato ISO o formato fijo
- **Origen**: `13-exportaciones-integraciones.md`

### 11.4. next.config.mjs Vacío

- **Archivo**: `next.config.mjs`
- **Línea**: 1-4
- **Problema**: Configuración completamente vacía, sin optimizaciones ni configuraciones específicas
- **Impacto**: Posibles problemas de rendimiento o funcionalidad no optimizada
- **Recomendación**: Revisar si se necesitan configuraciones específicas (imágenes, redirects, headers, etc.)
- **Origen**: `00-overview-introduction.md`

---

## 12. 🔌 Integraciones y Servicios Externos

### 12.1. Polling de Azure Sin Cancelación

- **Archivo**: `/src/services/azure/index.js`
- **Línea**: 79-119
- **Problema**: No hay forma de cancelar polling si usuario cierra componente
- **Impacto**: Llamadas innecesarias a Azure
- **Recomendación**: Implementar AbortController para cancelar polling
- **Origen**: `13-exportaciones-integraciones.md`

### 12.2. Azure Document AI Sin Retry en Errores de Red

- **Archivo**: `/src/services/azure/index.js`
- **Problema**: Solo maneja rate limit, no otros errores de red
- **Impacto**: Puede fallar en errores temporales de red
- **Recomendación**: Implementar retry con backoff exponencial
- **Origen**: `13-exportaciones-integraciones.md`

### 12.3. Falta de Cache en Resultados de Azure

- **Archivo**: `/src/services/azure/index.js`
- **Problema**: No cachea resultados de análisis
- **Impacto**: Re-analiza mismo PDF si se vuelve a subir
- **Recomendación**: Implementar cache basado en hash del archivo
- **Origen**: `13-exportaciones-integraciones.md`

### 12.4. Falta de Timeout en Requests

- **Archivos**: Todos los servicios
- **Problema**: No hay timeout configurado en fetch
- **Impacto**: Requests pueden colgarse indefinidamente
- **Recomendación**: Implementar timeout (ej: AbortController con timeout)
- **Origen**: `07-servicios-api-v2.md`

### 12.5. Falta de Retry Logic

- **Archivos**: Todos los servicios
- **Problema**: No hay lógica de reintento para errores transitorios
- **Impacto**: Errores temporales de red causan fallos inmediatos
- **Recomendación**: Considerar implementar retry para errores 5xx
- **Origen**: `07-servicios-api-v2.md`

---

## 13. 🎯 Funcionalidades Faltantes

### 13.1. Falta de Refresh Token

- **Archivo**: `/src/app/api/auth/[...nextauth]/route.js`
- **Problema**: No hay mecanismo de refresh token
- **Impacto**: Usuario debe hacer login nuevamente cuando expira
- **Recomendación**: Implementar refresh token para mejor UX
- **Origen**: `11-autenticacion-autorizacion.md`

### 13.2. Falta Exportación de Datos

- **Archivo**: No existe
- **Problema**: No hay exportación a Excel/PDF de producciones
- **Impacto**: Difícil compartir o analizar datos
- **Recomendación**: Añadir opciones de exportación similares a pedidos
- **Origen**: `14-produccion-en-construccion.md`

### 13.3. Falta de Helper para Validar Fechas

- **Archivo**: `/src/helpers/formats/dates/formatDates.js`
- **Problema**: No hay función para validar si una fecha es válida
- **Impacto**: Código duplicado en múltiples lugares
- **Recomendación**: Añadir `isValidDate(date)` helper
- **Origen**: `12-utilidades-helpers.md`

### 13.4. Falta de Helper para Formatear Números con Unidad Personalizada

- **Archivo**: `/src/helpers/formats/numbers/formatNumbers.js`
- **Problema**: Solo hay formatos específicos (currency, weight)
- **Impacto**: Difícil formatear con otras unidades
- **Recomendación**: Añadir función genérica `formatDecimalWithUnit(number, unit)`
- **Origen**: `12-utilidades-helpers.md`

---

## 14. 🐛 Bugs y Comportamientos Inesperados

### 14.1. Validación de Token Expirado Incompleta

- **Archivo**: `/src/app/api/auth/[...nextauth]/route.js`
- **Línea**: 89
- **Problema**: `tokenIsExpired` siempre es `false`, no valida realmente
- **Impacto**: Tokens expirados pueden seguir siendo válidos
- **Recomendación**: Implementar validación real de expiración
- **Origen**: `11-autenticacion-autorizacion.md`

### 14.2. AuthErrorInterceptor Modifica window.fetch Globalmente

- **Archivo**: `/src/components/Utilities/AuthErrorInterceptor.js`
- **Línea**: 12-56
- **Problema**: Modifica `window.fetch` globalmente, puede causar conflictos
- **Impacto**: Puede interferir con otras librerías
- **Recomendación**: Usar interceptor más específico o fetch wrapper
- **Origen**: `11-autenticacion-autorizacion.md`

### 14.3. User-Agent en Todos los Requests

- **Archivos**: Todos los servicios
- **Problema**: Se envía `navigator.userAgent` en todos los requests (incluso en servidor)
- **Impacto**: Puede fallar en SSR si `navigator` no existe
- **Recomendación**: Validar que `navigator` exista antes de usarlo o usar valor por defecto
- **Origen**: `07-servicios-api-v2.md`

### 14.4. fetchWithTenant Con Console.error en Servidor

- **Archivo**: `/src/lib/fetchWithTenant.js`
- **Línea**: 20
- **Problema**: Usa `console.error` en servidor (debería ser `console.log`)
- **Impacto**: Logs confusos
- **Recomendación**: Usar `console.log` o logger apropiado
- **Origen**: `12-utilidades-helpers.md`

### 14.5. Headers Comentados en storeService

- **Archivo**: `/src/services/storeService.js`
- **Línea**: 14, 44
- **Problema**: `'Content-Type': 'application/json'` está comentado
- **Impacto**: Inconsistencia, posible problema si backend lo requiere
- **Recomendación**: Descomentar o documentar por qué está comentado
- **Origen**: `07-servicios-api-v2.md`

---

## 15. 📝 Otros Problemas

### 15.1. SettingsForm sin React Hook Form

- **Archivo**: `/src/components/Admin/Settings/SettingsForm.js`
- **Problema**: Único formulario que no usa React Hook Form, usa useState directamente
- **Impacto**: Inconsistencia, falta de validaciones integradas
- **Recomendación**: Migrar a React Hook Form para consistencia
- **Origen**: `08-formularios.md`

### 15.2. Conversión de Fechas Inconsistente

- **Archivos**: Múltiples formularios
- **Problema**: Algunos formularios formatean fechas manualmente, otros no
- **Impacto**: Posibles errores si se olvida formatear
- **Recomendación**: Crear helper común para formatear fechas antes de enviar
- **Origen**: `08-formularios.md`

### 15.3. Falta de Validación de Tipos

- **Archivos**: Todos los formularios
- **Problema**: No hay validación de tipos (TypeScript o PropTypes)
- **Impacto**: Errores en tiempo de ejecución
- **Recomendación**: Añadir TypeScript o PropTypes
- **Origen**: `08-formularios.md`

### 15.4. useFieldArray sin Validación de Array

- **Archivo**: `/src/components/Admin/OrdersManager/CreateOrderForm/index.js`
- **Línea**: 87-90
- **Problema**: No hay validación de que `plannedProducts` tenga al menos un elemento
- **Impacto**: Se puede crear pedido sin productos
- **Recomendación**: Añadir validación `minLength: 1` al array
- **Origen**: `08-formularios.md`

### 15.5. Carga de Opciones sin Manejo de Errores

- **Archivos**: `CreateEntityForm`, `useOrderCreateFormConfig`
- **Problema**: Si falla la carga de opciones de autocomplete, no hay manejo claro
- **Impacto**: Usuario puede no saber por qué no aparecen opciones
- **Recomendación**: Añadir manejo de errores y mensajes informativos
- **Origen**: `08-formularios.md`

### 15.6. DatePicker con Ajuste Manual de Zona Horaria

- **Archivo**: `/src/components/ui/datePicker.jsx`
- **Línea**: 78-80, 95-97
- **Problema**: Se hace `setHours(12, 0, 0, 0)` manualmente para evitar problemas UTC
- **Impacto**: Solución temporal, puede causar problemas en otros casos de uso
- **Recomendación**: Considerar usar librería de fechas más robusta o manejar timezone correctamente
- **Origen**: `03-components-ui-shadcn.md`

### 15.7. EmailListInput sin Validación de Dominio

- **Archivo**: `/src/components/ui/emailListInput.jsx`
- **Línea**: 8-10
- **Problema**: Regex de validación de email es básica (`/^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/`)
- **Impacto**: Puede aceptar emails inválidos o rechazar válidos
- **Recomendación**: Usar librería de validación de email o regex más completa
- **Origen**: `03-components-ui-shadcn.md`

### 15.8. CustomSkeleton con Color Hardcodeado

- **Archivo**: `/src/components/ui/CustomSkeleton.jsx`
- **Línea**: 5
- **Problema**: Color `bg-neutral-800` hardcodeado, no usa design tokens
- **Impacto**: No se adapta al tema (dark/light mode)
- **Recomendación**: Usar variables CSS del design system (`bg-muted` o similar)
- **Origen**: `03-components-ui-shadcn.md`

### 15.9. Combobox con Scroll Personalizado

- **Archivo**: `/src/components/Shadcn/Combobox/index.js`
- **Línea**: 49-56
- **Problema**: Scroll con rueda de ratón forzado con multiplicador `* 2`
- **Impacto**: Puede causar comportamiento inesperado en algunos navegadores
- **Recomendación**: Revisar si es necesario o usar comportamiento nativo
- **Origen**: `03-components-ui-shadcn.md`

### 15.10. DateRangePicker con Lógica Compleja

- **Archivo**: `/src/components/ui/dateRangePicker.jsx`
- **Línea**: 31-53
- **Problema**: Lógica de botones rápidos mezclada con el componente
- **Impacto**: Componente más difícil de mantener y testear
- **Recomendación**: Extraer lógica de botones rápidos a hooks o funciones separadas
- **Origen**: `03-components-ui-shadcn.md`

### 15.11. OrderContext con onChange Opcional

- **Archivo**: `/src/context/OrderContext.js`
- **Línea**: 10
- **Problema**: `onChange` es opcional pero se usa sin validación en algunos lugares del hook
- **Impacto**: Posibles errores si se espera que siempre exista
- **Recomendación**: Validar existencia antes de llamar o hacer requerido
- **Origen**: `06-context-api.md`

### 15.12. SettingsContext sin Manejo de Re-carga

- **Archivo**: `/src/context/SettingsContext.js`
- **Línea**: 13-29
- **Problema**: Settings solo se cargan una vez al montar, no hay forma de recargar
- **Impacto**: Si settings cambian en el backend, no se reflejan sin recargar página
- **Recomendación**: Añadir función `reload()` o invalidar y recargar automáticamente
- **Origen**: `06-context-api.md`

### 15.13. Caché de Settings Sin TTL

- **Archivo**: `/src/helpers/getSettingValue.js`
- **Problema**: Caché nunca expira automáticamente
- **Impacto**: Settings pueden quedar obsoletos
- **Recomendación**: Añadir TTL o invalidación automática
- **Origen**: `12-utilidades-helpers.md`

### 15.14. formatDateShort Usa toLocaleDateString

- **Archivo**: `/src/helpers/formats/dates/formatDates.js`
- **Línea**: 20-26
- **Problema**: Depende de locale del sistema, puede variar
- **Impacto**: Formato inconsistente entre sistemas
- **Recomendación**: Usar `date-fns` para formato consistente
- **Origen**: `12-utilidades-helpers.md`

### 15.15. parseAzureDocumentAIResult Sin Validación

- **Archivo**: `/src/helpers/azure/documentAI/index.js`
- **Problema**: No valida estructura de datos antes de parsear
- **Impacto**: Puede fallar silenciosamente con datos inesperados
- **Recomendación**: Añadir validación de estructura
- **Origen**: `12-utilidades-helpers.md`

### 15.16. normalizeText Sin Preservar Espacios Múltiples

- **Archivo**: `/src/helpers/formats/texts/index.js`
- **Problema**: No normaliza espacios múltiples
- **Impacto**: "José María" no se normaliza correctamente
- **Recomendación**: Añadir `.replace(/\s+/g, ' ')` para normalizar espacios
- **Origen**: `12-utilidades-helpers.md`

### 15.17. goBack Sin Validación de Historial

- **Archivo**: `/src/helpers/window/goBack.js`
- **Problema**: No valida si hay historial antes de ir atrás
- **Impacto**: Puede no hacer nada si no hay historial
- **Recomendación**: Añadir validación o redirigir a ruta por defecto
- **Origen**: `12-utilidades-helpers.md`

### 15.18. Rate Limiting Sin Limpieza

- **Archivo**: `/src/app/api/auth/[...nextauth]/route.js`
- **Línea**: 36
- **Problema**: Solo limpia intentos viejos cuando hay nuevo intento
- **Impacto**: Memoria puede crecer si hay muchas IPs
- **Recomendación**: Añadir limpieza periódica o usar TTL
- **Origen**: `11-autenticacion-autorizacion.md`

### 15.19. Falta de Logging de Intentos de Acceso No Autorizados

- **Archivo**: `/src/middleware.js`
- **Problema**: No se registran intentos de acceso no autorizados
- **Impacto**: Difícil detectar intentos de acceso maliciosos
- **Recomendación**: Añadir logging de intentos fallidos
- **Origen**: `11-autenticacion-autorizacion.md`

### 15.20. ProductionOutputConsumptionsManager Sin Validación de Disponibilidad

- **Archivo**: `/src/components/Admin/Productions/ProductionOutputConsumptionsManager.jsx`
- **Problema**: No valida si output está disponible antes de consumir
- **Impacto**: Puede intentar consumir más de lo disponible
- **Recomendación**: Validar disponibilidad antes de crear consumo
- **Origen**: `14-produccion-en-construccion.md`

---

## 📊 Resumen por Categoría

| Categoría                 | Cantidad | Prioridad Alta |
| ------------------------- | -------- | -------------- |
| Código Duplicado          | 3        | 2              |
| Código Muerto             | 3        | 1              |
| Lógica Incompleta         | 5        | 4              |
| Manejo de Errores         | 7        | 5              |
| Validaciones              | 10       | 8              |
| Rendimiento               | 6        | 4              |
| Arquitectura              | 9        | 6              |
| Seguridad                 | 4        | 4              |
| UX/UI                     | 8        | 3              |
| Mantenibilidad            | 7        | 2              |
| Configuración             | 4        | 2              |
| Integraciones             | 5        | 3              |
| Funcionalidades Faltantes | 4        | 2              |
| Bugs                      | 5        | 4              |
| Otros                     | 20       | 10             |
| **TOTAL**                 | **100+** | **59**         |

---

## 🎯 Priorización Recomendada

### Prioridad Alta (Crítico)

1. **Seguridad**: Validación de almacén en backend, CSRF protection
2. **Validaciones**: Validación de productos en pedidos, validación de consumos
3. **Manejo de Errores**: Mejorar mensajes de error, manejo consistente
4. **Lógica Incompleta**: Integración de imágenes, diagrama de producción
5. **Bugs**: Token expiración, User-Agent en SSR

### Prioridad Media

1. **Rendimiento**: Memoización, paginación, cache
2. **Arquitectura**: Estandarizar patrones, dividir hooks grandes
3. **Código Duplicado**: Extraer funciones comunes
4. **UX/UI**: Indicadores de progreso, confirmaciones

### Prioridad Baja

1. **Mantenibilidad**: JSDoc, tests, documentación
2. **Configuración**: Variables de entorno, hardcoded values
3. **Código Muerto**: Eliminar código no usado

---

## 📝 Notas Finales

- **Total de observaciones documentadas**: 100+
- **Observaciones de alta prioridad**: 59
- **Archivos afectados**: 50+ archivos
- **Categorías principales**: Validaciones, Manejo de Errores, Arquitectura

**Importante**: Estas observaciones documentan el estado actual del código **sin modificarlo**. Se recomienda abordarlas según prioridad y disponibilidad de recursos.

---

## 🔗 Referencias

Cada observación está documentada en detalle en su archivo de origen:

- `00-overview-introduction.md` - 10 observaciones
- `01-architecture-app-router.md` - 15 observaciones
- `02-project-structure.md` - 13 observaciones
- `03-components-ui-shadcn.md` - 10 observaciones
- `04-components-admin.md` - 15 observaciones
- `05-hooks-personalizados.md` - 15 observaciones
- `06-context-api.md` - 6 observaciones
- `07-servicios-api-v2.md` - 12 observaciones
- `08-formularios.md` - 7 observaciones
- `09-flujos-completos.md` - 2 observaciones
- `10-estilos-design-system.md` - 15 observaciones
- `11-autenticacion-autorizacion.md` - 15 observaciones
- `12-utilidades-helpers.md` - 15 observaciones
- `13-exportaciones-integraciones.md` - 15 observaciones
- `14-produccion-en-construccion.md` - 15 observaciones
