# Prompt: Crear apartado "Crear salidas de cebo" (frontend) — planificado

## Objetivo

Implementar de forma **planificada** el apartado de **crear salidas de cebo** en el frontend, con **dos variantes** basadas al **100%** en los apartados de creación de recepciones de materia prima:

1. **Flujo operario** → basado en creación de recepciones del operario.
2. **Flujo resto de roles** → basado en creación de recepciones para roles no operario.

**Diferencias** respecto a recepciones:

- **Operario**: No mostrar el mensaje "Algunas líneas no tienen cajas" / "¿Desea continuar?". No usar `notify.action` por líneas con 0 cajas; envío directo.
- **Resto de roles**: No permitir crear por **palets**; solo por **líneas**. Formulario equivalente a recepciones pero sin pestaña/modo palets.

---

## Referencias en el codebase

### Flujo operario (cebo)

- **Página create**  
  `src/app/admin/raw-material-receptions/create/page.js`  
  - Sesión, `role === 'operario'`, operario sin Card y estado de éxito/formulario; otros con Card.

- **Formulario**  
  `src/components/Warehouse/OperarioCreateReceptionForm/index.js`  
  - Stepper, diálogo de línea, empty state, "Añadir línea".

- **Hook**  
  `src/hooks/useOperarioReceptionForm.js`  
  - Pasos, validación, **aquí está el aviso "Algunas líneas no tienen cajas"** con `notify.action` y `someLinesWithoutBoxes`. En cebo operario **no** ejecutar esa rama.

- **Pantalla de éxito**  
  `src/components/Warehouse/ReceptionSuccessActions/index.js`  
  - Referencia para una pantalla de éxito de cebo si se desea.

### Flujo resto de roles (cebo)

- **Formulario admin**  
  `src/components/Admin/RawMaterialReceptions/CreateReceptionForm/index.js`  
  - Tabs "Por líneas" y "Por palets". Para cebo **solo** modo líneas: sin Tabs de palets, sin `PalletDialog`, sin `temporalPallets`.

- **Hook admin**  
  `src/hooks/useAdminReceptionForm.js`  
  - Modo `automatic`: `validateReceptionDetails`, `transformDetailsToApiFormat`, payload `supplier`, `date`, `notes`, `details`. En cebo usar solo esta rama; no `mode === 'manual'` ni payload con `pallets`.

### Servicios y rutas

- **Cebo**  
  `src/services/domain/cebo-dispatches/ceboDispatchService.js`  
  - Ya tiene `create(data)`. Definir payload según backend (solo líneas).

- **Ruta create**  
  Crear o usar: `src/app/admin/cebo-dispatches/create/page.js`.  
  Actualizar `entitiesConfig.js` (quitar `hideCreateButton: true` para cebo cuando exista create).

---

## Plan de implementación

1. **Backend**  
   Endpoints de cebo (create, getById) y contrato del body (solo líneas), alineado con recepciones.

2. **Servicio frontend**  
   `ceboDispatchService.create(data)` con payload tipo líneas (como recepciones).

3. **Página create cebo**  
   `src/app/admin/cebo-dispatches/create/page.js` como en recepciones: sesión, `isOperario`, operario sin Card + estado éxito/formulario; otros con Card + formulario admin.

4. **Formulario operario cebo**  
   Componente y hook basados en `OperarioCreateReceptionForm` y `useOperarioReceptionForm`. **Sin** la rama de `notify.action` por "Algunas líneas no tienen cajas".

5. **Formulario admin cebo (solo líneas)**  
   Componente y hook basados en `CreateReceptionForm` y `useAdminReceptionForm`. Sin Tabs, sin palets, solo tabla de líneas y payload `details`.

6. **Pantalla de éxito operario**  
   Opcional: componente tipo `CeboSuccessActions` con estado `createdDispatch`.

7. **Config**  
   Quitar `hideCreateButton: true` en `entitiesConfig.js` para `cebo-dispatches` y enlaces de creación.

8. **Pruebas**  
   Operario: nunca ver aviso de cajas. Otros roles: solo líneas, sin palets.

---

## Checklist diferencias

| Aspecto | Recepciones operario | Cebo operario |
|---------|----------------------|---------------|
| Aviso "Algunas líneas no tienen cajas" | Sí | **No** |
| Resto del flujo | Igual | Igual (API cebo) |

| Aspecto | Recepciones otros roles | Cebo otros roles |
|---------|------------------------|------------------|
| Modo líneas | Sí | Sí (único) |
| Modo palets | Sí | **No** |
| Payload create | details o pallets | Solo **details** |

---

## Entregables

- Código: página create cebo, formularios operario y admin, hooks, pantalla de éxito si aplica.
- Nota en docs: cebo operario sin aviso de cajas; cebo admin solo por líneas.
