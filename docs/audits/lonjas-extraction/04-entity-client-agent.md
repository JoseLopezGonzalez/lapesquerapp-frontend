# Auditoría: EntityClient Agent
# Bloque: MarketDataExtractor — Extracción de datos de documentos de lonjas

**Fecha:** 2026-04-26
**Rol auditor:** EntityClient Agent
**Scope:** Uso de EntityClient, configuración de entidades, tablas, filtros, acciones de fila, rutas

---

## 1. Archivos inspeccionados

| Archivo | Relevancia |
|---|---|
| `src/components/Admin/Entity/EntityClient/index.js` | Componente EntityClient (referencia) |
| `src/configs/entitiesConfig.js` | Configuración de todas las entidades |
| `src/components/Admin/MarketDataExtractor/index.js` | Entry point del bloque auditado |
| `src/components/Admin/MarketDataExtractor/AlbaranCofraWeb/index.js` | Vista de resultado de extracción |
| `src/components/Admin/MarketDataExtractor/shared/DocumentProcessor.js` | Orquestador |

---

## 2. Resumen de configuración de entidad

**El bloque MarketDataExtractor NO usa EntityClient.** No existe ninguna entrada en `entitiesConfig.js` para este bloque. Es una pantalla completamente custom.

Esta decisión es **correcta y justificada** por las siguientes razones:

1. El flujo principal no es un CRUD de entidad, sino un pipeline de procesamiento de documentos (upload → extracción OCR → validación → parseo → exportación).
2. No hay un endpoint de listado estándar (`GET /api/v2/market-data-extractions`) que poblar en una tabla.
3. Los datos mostrados son transitorios — viven en estado de React, no en base de datos (actualmente).
4. El resultado visual es una recreación del documento original, no una tabla de entidades.

---

## 3. Acciones de tabla y fila

El bloque tiene sus propias tablas (`<Table>` de shadcn) para mostrar:
- Subastas agrupadas por barco
- Servicios de lonja
- Líneas de compra (LonjaDeIsla)
- Resumen vinculado de compras

Estas tablas **no tienen acciones de fila estándar** (editar, ver, eliminar). Las únicas acciones son:
- Checkbox de selección para vinculación
- Badge de estado de exportabilidad

No hay acciones destructivas en este bloque.

---

## 4. Rutas afectadas

No existe una ruta en `src/app/admin/[entity]/` para este bloque. La ruta es probablemente una ruta estática en `src/app/admin/` (ej. `src/app/admin/market-data-extractor/page.js`). No se ha podido verificar la ruta exacta en esta auditoría.

**Recomendación**: verificar que la ruta existe y que tiene protección de rol adecuada (solo admin/dirección/técnico).

---

## 5. Evaluación de uso de EntityClient

### ¿Podría EntityClient cubrir alguna parte de este bloque en el futuro?

**Potencial caso de uso — historial de extracciones:**

Si el backend implementara un endpoint para guardar el historial de extracciones de lonjas (`GET /api/v2/lonja-extractions`), ese listado de historial SÍ podría implementarse con EntityClient:

```javascript
// Hipotético config futuro
configs['lonja-extractions'] = {
  title: "Historial de extracciones de lonjas",
  endpoint: "lonja-extractions",
  hideCreateButton: true,       // No se crea desde UI
  hideEditButton: true,
  table: {
    headers: [
      { name: "id", label: "ID", type: "id", path: "id" },
      { name: "documentType", label: "Tipo", type: "badge", path: "document_type" },
      { name: "fileName", label: "Archivo", type: "text", path: "file_name" },
      { name: "processedAt", label: "Procesado", type: "datetime", path: "processed_at" },
      { name: "status", label: "Estado", type: "badge", path: "status" },
    ]
  }
}
```

Sin embargo, **no se debe implementar esto** hasta que:
1. El backend tenga el endpoint
2. Haya una necesidad real de auditoría o trazabilidad
3. El usuario lo solicite explícitamente

---

## 6. Filtros

No hay filtros de EntityClient en este bloque. El bloque no tiene estado persistente de filtrado — el "filtro" es el tipo de documento seleccionado antes de cargar el PDF.

---

## 7. Estado vacío

No se ha observado un componente de estado vacío explícito en el bloque (equivalente al `emptyState` de EntityClient). Cuando no hay documentos procesados, la pantalla simplemente no muestra resultados. Se recomienda añadir un estado vacío descriptivo con instrucciones de uso para usuarios nuevos.

---

## 8. Archivos cambiados

Ninguno — esta es una auditoría de solo lectura.

---

## 9. Comprobaciones manuales sugeridas

- [ ] Verificar que existe la ruta `src/app/admin/market-data-extractor/` (o equivalente) y que tiene protección de rol
- [ ] Confirmar que la ruta está en `navigationConfig.js` con el rol correcto
- [ ] Verificar que cuando no hay documentos procesados hay un estado visual claro con instrucciones
- [ ] Si en el futuro se añade historial, crear config en `entitiesConfig.js` siguiendo el patrón estándar
