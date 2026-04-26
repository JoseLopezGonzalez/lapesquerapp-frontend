# Auditoría: Documentation Agent
# Bloque: MarketDataExtractor — Extracción de datos de documentos de lonjas

**Fecha:** 2026-04-26
**Rol auditor:** Documentation Agent
**Scope:** Estado de la documentación existente, lagunas, decisiones sin ADR, documentos desactualizados

---

## 1. Archivos revisados

| Archivo | Estado |
|---|---|
| `docs/ai-context/00-project-brief.md` | No menciona MarketDataExtractor |
| `docs/ai-context/01-frontend-architecture.md` | No menciona el bloque ni sus patrones propios |
| `docs/ai-context/04-api-services.md` | No menciona el servicio Azure |
| `docs/ai-context/10-current-priorities.md` | Menciona "exportaciones de datos" vagamente |
| `docs/decisions/` | No existe ADR para ninguna decisión del bloque de lonjas |
| `AGENTS.md` | No menciona MarketDataExtractor como funcionalidad |
| `docs/agents/*.md` | 9 agentes definidos — ninguno específico para lonjas |

---

## 2. Documentos ausentes o incompletos

### 2.1 No existe doc `docs/ai-context/` para el bloque de lonjas

El bloque MarketDataExtractor es **el sistema más complejo y específico del dominio** del proyecto. Tiene:
- Su propio servicio externo (Azure Document AI)
- 3 tipos de documento con parsers y validadores propios
- Catálogos estáticos de datos de negocio
- Pipeline de 5 etapas (Azure → normalización → validación → parseo → exportación)
- Integración con A3ERP y backend propio para vinculación

A pesar de su complejidad, **no existe ningún archivo en `docs/ai-context/`** que lo documente. Cualquier agente IA que trabaje en este bloque deberá leer el código desde cero sin contexto.

**Archivo recomendado**: `docs/ai-context/12-market-data-extractor.md`

Contenido mínimo sugerido:
- Descripción del bloque y su propósito
- Los 3 tipos de documento soportados
- Pipeline de procesamiento paso a paso
- Catálogos estáticos: qué son, dónde están, cómo actualizarlos
- Patrones específicos: BaseParser, BaseValidator, DocumentProcessor
- Errores custom: ValidationError, ParsingError
- Integración con A3ERP: estructura de filas Excel (CABSERIE, CABNUMDOC, etc.)
- Advertencias: la API key de Azure debe ser privada

### 2.2 Decisiones sin ADR

Las siguientes decisiones arquitectónicas significativas **no tienen ADR**:

| Decisión | Impacto | ADR sugerido |
|---|---|---|
| Usar Azure Document AI (en lugar de Tesseract, Google Vision, etc.) | Coste, dependencia de proveedor, capacidad de los modelos | `ADR-001-azure-document-ai.md` |
| Catálogos estáticos en `exportData.js` (en lugar de API backend) | Mantenimiento manual, riesgo de desactualización | `ADR-002-exportdata-static-catalogs.md` |
| Pipeline en cliente (en lugar de procesamiento server-side) | Exposición de API key, carga en browser | `ADR-003-client-side-azure-pipeline.md` |
| Tres parsers con patrones distintos (Cofra en español, otros en inglés) | Inconsistencia, dificultad de mantenimiento | `ADR-004-parser-key-conventions.md` |
| `fetchWithTenant` para llamadas a Azure (servicio externo) | Acoplamiento innecesario, X-Tenant en requests externos | Puede documentarse en ADR-003 |

### 2.3 `10-current-priorities.md` desactualizada respecto al bloque

```markdown
### 3. Exportaciones de datos
- Integración con Facilcom, A3ERP y Excel.
- Actualización de catálogos de productos y barcos en `exportData.js`.
```

Esta sección menciona la actualización de `exportData.js` como prioridad activa, pero no documenta:
- Qué archivos `exportData.js` existen (hay 3, uno por tipo de lonja)
- Cómo añadir un nuevo barco o armador (no hay guía de mantenimiento)
- Qué campos son obligatorios en cada entrada del catálogo

### 2.4 `01-frontend-architecture.md` no menciona el servicio Azure

El documento de arquitectura lista los 31 servicios de dominio en `src/services/domain/` pero no menciona `src/services/azure/`, que es un servicio propio (no de dominio) de integración con Azure Document AI.

Tampoco menciona `src/parsers/`, `src/validators/`, `src/exportHelpers/` como capas arquitectónicas, aunque son directorios con propósito bien definido.

### 2.5 `AGENTS.md` no lista MarketDataExtractor como área funcional

La sección de responsabilidades del frontend en `AGENTS.md` lista: customers, suppliers, products, orders, logistics, warehouses, pallets, boxes, lots, production, traceability, incidents, time tracking, sector catalogs, business administration screens.

**No menciona la extracción de documentos de lonjas** como área funcional del frontend, a pesar de ser un bloque de funcionalidad completo con su propia arquitectura.

---

## 3. Cambios propuestos

### 3.1 Crear `docs/ai-context/12-market-data-extractor.md`

Documento que explique el bloque completo para agentes IA futuros.

### 3.2 Crear ADRs pendientes

En `docs/decisions/`:
- `ADR-001-azure-document-ai.md` — Por qué Azure Document AI, qué alternativas se evaluaron, coste estimado, cómo actualizar los modelos
- `ADR-002-exportdata-static-catalogs.md` — Por qué catálogos estáticos, cuándo migrar a backend, cómo mantenerlos
- `ADR-003-client-side-pipeline.md` — Por qué el pipeline corre en cliente, qué riesgos implica (API key), plan de migración a server-side

### 3.3 Actualizar `10-current-priorities.md`

Añadir referencia a los 3 archivos `exportData.js` y enlazar con el nuevo documento de arquitectura.

### 3.4 Actualizar `01-frontend-architecture.md`

Añadir `src/services/azure/`, `src/parsers/`, `src/validators/lonjas/`, `src/exportHelpers/` como capas relevantes.

### 3.5 Actualizar `AGENTS.md`

Añadir "extracción de documentos de lonjas (MarketDataExtractor)" a la lista de áreas funcionales del frontend.

### 3.6 Añadir guía de mantenimiento de catálogos

Dentro del nuevo doc de arquitectura o como documento independiente: cómo añadir un barco, un armador, un producto al catálogo correcto, qué campos son obligatorios, cómo verificar que la entrada es correcta.

---

## 4. Documentación existente que necesita revisión humana

| Archivo | Qué revisar |
|---|---|
| `docs/ai-context/10-current-priorities.md` | ¿Sigue siendo prioridad actualizar `exportData.js`? ¿Hay una hoja de ruta para Facilcom? |
| `AGENTS.md` | ¿Debe añadirse un agente específico de lonjas/MarketDataExtractor? |
| `docs/agents/` | ¿Se necesita un agente "MarketDataExtractor Agent" con reglas específicas de este bloque? |

---

## 5. ADR recomendado

Se recomienda comenzar por `ADR-001-azure-document-ai.md` ya que la decisión de usar Azure Document AI es la más fundamental y tiene las implicaciones más grandes (coste, seguridad, mantenimiento de modelos).

---

## 6. Checklist de calidad documental

- [ ] No hay información duplicada entre docs — **parcialmente cumplido** (el bloque no está documentado en ningún sitio, no puede haber duplicados)
- [ ] No hay contradicciones entre archivos — **cumplido** (por ausencia de documentación del bloque)
- [ ] No hay rutas o nombres de función obsoletos — **no aplica** (no hay documentación del bloque)
- [ ] `10-current-priorities.md` refleja el trabajo real — **parcialmente**: menciona exportData.js pero sin contexto suficiente
- [ ] Todos los patrones nuevos tienen mención en `docs/ai-context/` — **incumplido**: BaseParser, BaseValidator, DocumentProcessor no están documentados
- [ ] Todas las decisiones significativas tienen ADR — **incumplido**: ninguna decisión del bloque tiene ADR
- [ ] No hay documentación solo en chat/historial — **incumplido**: el contexto del bloque solo existe en el código
