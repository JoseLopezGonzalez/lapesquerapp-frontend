# Auditoría: Product & Domain Agent
# Bloque: MarketDataExtractor — Extracción de datos de documentos de lonjas

**Fecha:** 2026-04-26
**Rol auditor:** Product & Domain Agent
**Scope:** Propiedad de los datos, multi-tenant, configurabilidad por el negocio, entidades del dominio, pantallas de administración ausentes

---

> **Pregunta central de este rol:** ¿Puede el negocio operar este bloque sin llamar a un desarrollador?
>
> **Respuesta directa:** No. Hoy, añadir un barco nuevo, un armador, una especie o cambiar un porcentaje de servicio requiere modificar código fuente y hacer un deploy.

---

## 1. Inventario de datos de negocio hardcodeados

### 1.1 AlbaranCofraWeb — `exportData.js`

**Archivo:** `src/components/Admin/MarketDataExtractor/AlbaranCofraWeb/exportData.js`

| Dato | Tipo | Ejemplo |
|---|---|---|
| `barcos[]` | Array de barcos con nombre, armador, CIF, codA3erp, codBrisapp | `{ barco: 'MAPE', armador: 'JOSE...', cif: 'B...', codA3erp: '...', codBrisapp: ... }` |
| `armadores[]` | Array de armadores con nombre, CIF, codA3erp | `{ nombre: 'ARMADORES REUNIDOS...', cif: 'B...', codA3erp: '...' }` |
| `lonjas[]` | Array de lonjas con nombre, CIF, codA3erp | `{ nombre: 'Cofradía...', cif: 'G21011432', codA3erp: 'A11432' }` |

**Total de entidades hardcodeadas:** ~55 objetos (31 barcos + 23 armadores + 1 lonja).

---

### 1.2 ListadoComprasAsocPuntaDelMoral — `exportData.js`

**Archivo:** `src/components/Admin/MarketDataExtractor/ListadoComprasAsocPuntaDelMoral/exportData.js`

| Dato | Tipo | Notas |
|---|---|---|
| `barcos[]` | Barcos con nombre, matrícula, CIF, codA3erp, codBrisapp | ~11 entradas |
| `asocArmadoresPuntaDelMoral` | Objeto único con nombre y codA3erp | Armador de la cooperativa |
| `serviciosAsocArmadoresPuntaDelMoral[]` | Servicios con descripción y porcentaje | 3 servicios: Tarifa G-4 (2%), Gastos Lonja (1%), Gastos Gestión Cobros (0.5%) |
| `servicioExtraAsocArmadoresPuntaDelMoral` | Servicio adicional con descripción y porcentaje | 3% Sostenibilidad |
| `productos[]` | Especies con código FAO y nombre | PULPO, ALISTAO, GAMBAS, CIGALAS, etc. |

**Puntos críticos:** los porcentajes de servicios (`2%`, `1%`, `0.5%`, `3%`) son **reglas financieras hardcodeadas**. Si la cooperativa cambia sus tarifas, hay que modificar el código.

---

### 1.3 ListadoComprasLonjaDeIsla — `exportData.js`

**Archivo:** `src/components/Admin/MarketDataExtractor/ListadoComprasLonjaDeIsla/exportData.js`

| Dato | Tipo | Notas |
|---|---|---|
| `barcos[]` | 200+ barcos con nombre, vendiduria asociada, códigos | El catálogo más grande |
| `barcosVentaDirecta[]` | Barcos de venta directa | Subconjunto separado |
| `datosVendidurias[]` | Vendedurías con nombre, CIF, codA3erp | 5+ entradas |
| `serviciosLonjaDeIsla[]` | Servicios con descripción, porcentaje, tipo | Tarifas de la lonja |
| `servicioExtraLonjaDeIsla` | Servicio extra con porcentaje | |
| `PORCENTAJE_SERVICIOS_VENDIDURIAS` | Constante numérica de porcentaje | Regla financiera hardcodeada |
| `productos[]` | Catálogo de especies con código A3ERP | |
| `lonjaDeIsla` | Datos de la lonja (nombre, CIF, codA3erp) | |

**Total estimado:** 200+ barcos + vendedurías + servicios + productos.

---

### 1.4 Reglas de negocio implícitas en el código

Además de los datos, hay **reglas de negocio hardcodeadas como lógica de código**:

| Regla | Archivo | Línea | Problema |
|---|---|---|---|
| Tipo de venta = SUBASTA si `descripcion.includes('cinta')` | `lonjaDeIslaExportHelper.js` | ~37 | Si Lonja de Isla cambia su nomenclatura, todos los documentos se clasifican mal |
| LINCODART = `95` para PULPO en Cofra | `ExportModal/index.js` (Cofra) | ~94 | Código de artículo A3ERP hardcodeado para una sola especie |
| LINCODART = `9998` para servicios en Cofra | `ExportModal/index.js` (Cofra) | ~125 | Código hardcodeado |
| LINTIPIVA = `'RED10'` para pesca | `ExportModal/index.js` (Cofra) | ~99 | Tipo de IVA hardcodeado |
| LINTIPIVA = `'ORD21'` para servicios | `ExportModal/index.js` (Cofra) | ~130 | Tipo de IVA hardcodeado |
| `CABSERIE = CF + año` | `ExportModal/index.js` (Cofra) | ~64 | Serie contable hardcodeada |
| CABNUMDOC types (5,6,7,8,9) | `lonjaDeIslaExportHelper.js` | ~22-28 | Tipos de documento A3ERP hardcodeados como constantes |

---

## 2. Clasificación de propiedad de los datos

| Dato | Propietario | Tenant-específico | Cambia con frecuencia | Quién debería cambiarlo |
|---|---|---|---|---|
| Catálogo de barcos | **Tenant** | Sí — cada empresa tiene su flota | Regularmente | Administrador de la empresa |
| Catálogo de armadores | **Tenant** | Sí | Raramente | Administrador de la empresa |
| Catálogo de especies/productos | **Sector** | Parcialmente — FAO es global, códigos A3ERP son del tenant | Raramente | Administrador de la empresa |
| Datos de la lonja (nombre, CIF) | **Global / sector** | No — la lonja es la misma para todos | Muy raramente | Solo equipo técnico |
| Porcentajes de servicios de lonja | **Lonja** | No — los fija la lonja, no el tenant | Raramente (cambio anual) | Administrador, con aviso de la lonja |
| Códigos A3ERP de entidades | **Tenant** | Sí — cada empresa tiene su propio A3ERP con sus propios códigos | Raramente | Administrador de la empresa |
| Códigos Brisapp (supplierId) | **Tenant** | Sí — son IDs del backend del tenant | Cuando se da de alta el proveedor | Automático (del backend) |
| Tipos de IVA (RED10, ORD21) | **Global / fiscal** | No — son tipos fiscales del sistema A3ERP | Nunca (cambio legal) | Solo equipo técnico |
| Tipos de documento A3ERP (5,6,7,8,9) | **Global / A3ERP** | No — son códigos del ERP externo | Nunca | Solo equipo técnico |
| Regla de clasificación subasta/contrato | **Lonja** | Sí — cada lonja puede tener su propia lógica | Raramente | Administrador técnico |

---

## 3. Impacto si los datos están incorrectos o desactualizados

| Dato | Impacto si está mal | Severidad |
|---|---|---|
| Barco no encontrado en catálogo | La línea aparece como "No enlazable" — la compra no se registra | **Alta** |
| Armador con CIF incorrecto | El albarán A3ERP se asigna al proveedor equivocado — error contable | **Crítica / Financiera** |
| Código A3ERP de armador incorrecto | Mismo impacto — asiento en el proveedor incorrecto en el ERP | **Crítica / Financiera** |
| Especie no en catálogo (ASOC) | La exportación falla completamente (throw) — bloqueo total | **Alta** |
| Especie no en catálogo (LonjaDeIsla) | Warning silencioso — la especie sale sin código A3ERP | **Alta** |
| Porcentaje de servicio incorrecto | Los cargos de lonja se calculan mal en el ERP | **Crítica / Financiera** |
| Regla de subasta/contrato incorrecta | Los documentos se registran con el tipo de compra equivocado | **Alta** |
| codBrisapp desactualizado | La recepción no se puede vincular con la compra correcta | **Alta** |

---

## 4. Entidades del dominio que deberían existir en el backend pero no existen

Las siguientes entidades son **objetos de dominio del negocio** que actualmente viven como arrays JavaScript en el frontend. Deberían tener su propia entidad en el backend de La PesquerApp, con API CRUD y pantalla de administración.

### 4.1 `Barco` (Vessel)

```
Campos mínimos:
- nombre (string)
- matrícula (string)
- armador_id (FK → Armador)
- lonja_id (FK → Lonja) — en qué lonja faena
- cif (string) — puede ser del armador
- cod_a3erp (string) — código en el ERP del tenant
- cod_brisapp (integer) — FK al proveedor en La PesquerApp
- activo (boolean)
- tenant_id (FK)
```

**Estado actual:** array estático en `exportData.js`. No existe como entidad en el backend.

### 4.2 `Armador` (Vessel Operator)

```
Campos mínimos:
- nombre (string)
- cif (string)
- cod_a3erp (string)
- tenant_id (FK)
```

**Estado actual:** array estático. Puede que exista parcialmente como `Supplier` en el backend (los armadores son proveedores), pero sin los campos específicos de integración A3ERP.

### 4.3 `ConfiguracionLonja` (Market Configuration per tenant)

```
Campos mínimos:
- lonja_id (FK → Lonja)
- tenant_id (FK)
- cod_a3erp (string) — código de la lonja en el ERP del tenant
- servicios[] (array) — servicios con descripción, porcentaje, tipo IVA, cod_a3erp
- reglas_clasificacion[] — reglas para determinar tipo de venta
- activo (boolean)
```

**Estado actual:** datos de la lonja hardcodeados, porcentajes de servicios hardcodeados, regla de clasificación hardcodeada.

### 4.4 `CatalogoEspecies` (Species Catalog per tenant/lonja)

```
Campos mínimos:
- especie (string) — nombre tal como lo devuelve el OCR de la lonja
- cod_fao (string)
- cod_a3erp (string) — código en el ERP del tenant
- lonja_id (FK) — puede variar el nombre por lonja
- tenant_id (FK)
```

**Estado actual:** array de productos en `exportData.js` por tipo de lonja.

### 4.5 `VendiduriaConfig` (LonjaDeIsla — Fish Seller Configuration)

Solo para LonjaDeIsla. Las vendedurías son intermediarios específicos de esa lonja.

```
Campos mínimos:
- nombre (string)
- cod_a3erp (string)
- cif (string)
- porcentaje_comision (decimal)
- tenant_id (FK)
```

**Estado actual:** array en `exportData.js`.

---

## 5. Pantallas de administración ausentes

Las siguientes pantallas no existen y deberían existir para que el negocio pueda autogestionar sus datos:

| Pantalla | Entidad | Quién la usa | Prioridad |
|---|---|---|---|
| Gestión de barcos por lonja | `Barco` | Jefe de compras / admin | **Alta** |
| Gestión de armadores | `Armador` | Admin | **Alta** |
| Configuración de lonjas (servicios, porcentajes) | `ConfiguracionLonja` | Admin | **Alta** |
| Catálogo de especies por lonja | `CatalogoEspecies` | Admin | **Media** |
| Gestión de vendedurías (LonjaDeIsla) | `VendiduriaConfig` | Admin | **Media** |

---

## 6. Violaciones multi-tenant

| Violación | Descripción | Riesgo |
|---|---|---|
| `exportData.js` compartido | Los catálogos de barcos, armadores y especies son de Brisamar, no de la aplicación. Si otro tenant usa La PesquerApp, tendría que tener su propio `exportData.js` — o compartir los datos de Brisamar. | **Crítico — el sistema es inoperable como SaaS real** |
| `codBrisapp` en `exportData.js` | Los `codBrisapp` son IDs de proveedores en la base de datos de Brisamar. Son imposibles de reutilizar para otro tenant. | Crítico |
| `codA3erp` en `exportData.js` | Los códigos A3ERP son del sistema contable de Brisamar. Otro tenant usaría otros códigos. | Crítico |
| Porcentajes de servicios de lonja | Los porcentajes (2%, 1%, 0.5%, 3%) pueden ser negociados individualmente por cada empresa con la lonja. | Alto |

---

## 7. Ruta de migración recomendada

La migración debe hacerse de forma incremental para no romper el sistema actual. El orden propuesto prioriza impacto de negocio y complejidad de implementación.

### Fase 1 — Backend (coordinación con equipo backend)

1. Crear entidad `Barco` con sus campos (incluyendo `cod_a3erp`, `cod_brisapp`, `lonja_id`)
2. Crear entidad `ConfiguracionLonja` con servicios y porcentajes
3. Crear catálogo de especies por lonja y tenant
4. Exponer endpoints: `GET /api/v2/barcos?lonja_type=cofra`, `GET /api/v2/lonjas/{id}/config`, etc.

### Fase 2 — Frontend: reemplazar exportData.js por fetch

1. Crear servicio `lonjaConfigService.ts` en `src/services/domain/lonja-config/`
2. Crear hook `useLonjaConfig(lonjaType)` que cargue la config al abrir el ExportModal
3. Reemplazar imports de `exportData.js` por los datos del hook
4. Mantener `exportData.js` como fallback temporal durante la migración

### Fase 3 — Pantallas de administración

1. Añadir pantalla de gestión de barcos en `/admin/barcos` usando EntityClient
2. Añadir pantalla de configuración de lonjas en `/admin/lonjas-config`
3. Añadir catálogo de especies en `/admin/especies-lonja`

### Fase 4 — Reglas de clasificación configurables

1. Mover la regla `includes('cinta')` a `ConfiguracionLonja.reglas_clasificacion`
2. Implementar evaluador de reglas genérico en el frontend

---

## 8. Ranking de problemas por impacto de negocio

| Prioridad | Problema | Impacto directo |
|---|---|---|
| **P0** | `codA3erp` de armadores incorrecto → asiento contable en proveedor equivocado | Financiero — error en ERP |
| **P0** | Barco no en catálogo → compra no registrada en el sistema | Operativo — trazabilidad rota |
| **P1** | Porcentaje de servicio de lonja incorrecto → cargos mal calculados | Financiero — descuadre con la lonja |
| **P1** | Sistema inoperable para un segundo tenant | SaaS — bloquea la expansión del producto |
| **P2** | Regla de clasificación subasta/contrato incorrecta → tipo de compra erróneo | Contable |
| **P2** | Añadir un barco nuevo requiere un developer y un deploy | Operativo — fricción para el negocio |
| **P3** | Especie no en catálogo bloquea la exportación ASOC completamente | Operativo |
| **P3** | `codBrisapp` desactualizado → vinculación de compra falla | Operativo |
| **P4** | Código de artículo A3ERP (95, 9998) hardcodeado | Técnico — frágil ante cambios en el ERP |

---

## 9. Conclusión

El bloque MarketDataExtractor tiene un diseño correcto **para un único tenant con datos estables**. Funciona para Brisamar hoy porque los datos del catálogo cambian poco y el equipo técnico puede actualizar `exportData.js` cuando es necesario.

Sin embargo, el bloque **no es operable como SaaS multi-tenant** y **no es autogestionable por el negocio**. Los datos de negocio (barcos, armadores, especies, porcentajes de servicios) pertenecen al backend y a una pantalla de administración, no a archivos JavaScript desplegados con el código fuente.

El riesgo más inmediato no es técnico — es financiero: si un `codA3erp` de un armador está mal en `exportData.js`, los albaranes se asignan al proveedor incorrecto en A3ERP sin ninguna alerta visible.
