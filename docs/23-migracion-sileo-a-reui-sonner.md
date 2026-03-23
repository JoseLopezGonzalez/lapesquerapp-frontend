# Migración de toasts: Sileo -> ReUI Sonner

**Fecha**: 2026-03-23  
**Alcance**: frontend web `brisapp-nextjs`  
**Referencia visual/técnica**: [ReUI Sonner](https://reui.io/patterns/sonner)

---

## Motivo del cambio

El sistema anterior basado en Sileo generaba problemas prácticos en el producto:

- algunos `promise toasts` podían cerrarse antes de que terminase la promesa real
- una notificación podía sobrescribirse al dispararse otra
- el comportamiento no daba suficiente control explícito sobre actualización por `id`
- la app quedaba acoplada a un proveedor todavía inmaduro

La migración busca mantener la API de negocio estable (`notify`) y sustituir solo el proveedor visual/runtime por Sonner, tomando ReUI como referencia de skin, patrón de integración y ergonomía.

---

## Objetivos de migración

- mantener `notify` como única puerta de entrada pública
- eliminar imports runtime de `sileo`
- adoptar `AppToaster` propio con Sonner y estilo alineado con el design system
- introducir control explícito con `id` y `dedupeKey`
- asegurar que `notify.promise()` mantenga vivo el mismo toast hasta resolver o fallar
- documentar el nuevo sistema sin vendor lock en la arquitectura principal

---

## Problemas verificados en el proyecto

### Acoplamiento técnico previo

- proveedor global en `src/app/ClientLayout.js`
- wrapper acoplado en `src/lib/notifications.ts`
- CSS específico de proveedor en `src/app/globals.css`

### Superficie real de uso

- el producto consume mayoritariamente `notify`, no `sileo` directo
- existe un uso real de `notify.action`
- existen múltiples usos de `notify.promise` en exportaciones, formularios y mutaciones

Esto permitía una migración por capas y con bajo riesgo: proveedor nuevo por dentro, consumidores estables por fuera.

---

## Estrategia de compatibilidad

### Compatibilidad mantenida

- `notify.success/error/warning/info/loading/promise/action/dismiss/clear`
- `NotifyMessage = string | { title, description? }`
- retorno de `id` en toasts manuales
- retorno de la promesa original en `notify.promise`

### Compatibilidad ampliada

- `id?: string | number`
- `dedupeKey?: string`
- `dismissible?: boolean`
- `important?: boolean`

### Decisión clave

No se permite que componentes de negocio importen `toast` de Sonner ni componentes ReUI directamente. Toda notificación sigue pasando por `notify`.

---

## Tabla de mapeo

| Antes | Capa estable | Ahora |
|------|------|------|
| `sileo.success(...)` | `notify.success(...)` | `toast.success(...)` |
| `sileo.error(...)` | `notify.error(...)` | `toast.error(...)` |
| `sileo.warning(...)` | `notify.warning(...)` | `toast.warning(...)` |
| `sileo.info(...)` | `notify.info(...)` | `toast.info(...)` |
| `sileo.show(...)` para loading | `notify.loading(...)` | `toast.loading(...)` |
| `sileo.promise(...)` | `notify.promise(...)` | `toast.loading(...)` + update por `id` |
| `sileo.dismiss(id)` | `notify.dismiss(id)` | `toast.dismiss(id)` |
| `sileo.clear()` | `notify.clear()` | `toast.dismiss()` |

---

## Cambios implementados

### 1. Runtime

- Se elimina `Toaster` de Sileo en `ClientLayout`.
- Se introduce `AppToaster` propio en `src/components/ui/app-toaster.jsx`.
- Se mantiene portal global a `document.body`, posición `top-center` y offset `16`.
- Se adapta el tema mediante `next-themes`.

### 2. Wrapper

- `src/lib/notifications.ts` se reimplementa sobre `sonner`.
- `notify.promise()` pasa a usar `loading -> success/error` con el mismo `id`.
- `notify.loading()` devuelve un `id` reutilizable para actualización manual.
- `dedupeKey` solo actúa si se pasa explícitamente.

### 3. Limpieza

- `sileo` sale de dependencias.
- `sonner` entra como runtime nuevo.
- el CSS específico cambia de `[data-sileo-viewport]` a `[data-sonner-toaster]`.

---

## Riesgos y decisiones operativas

### Riesgos controlados

- Los cambios masivos en consumidores se evitan porque la fachada `notify` se mantiene.
- El único punto delicado es la semántica de `promise`, resuelta mediante actualización manual del mismo `id`.

### Riesgos residuales

- algunos tests antiguos pueden asumir detalles del proveedor anterior
- documentación histórica puede seguir mencionando Sileo en análisis pasados
- si en el futuro aparece uso directo de `sonner`, se rompería la disciplina de arquitectura

---

## Rollout recomendado

1. Cambiar dependencias y runtime global.
2. Migrar el wrapper.
3. Ejecutar tests del wrapper y smoke tests del layout.
4. Validar manualmente flujos reales:
   - exportaciones
   - formularios con `notify.promise`
   - logout
   - `notify.action`
5. Limpiar referencias documentales principales a Sileo.

---

## Checklist de ejecución

- [x] Instalar `sonner`
- [x] Eliminar `sileo`
- [x] Crear `AppToaster`
- [x] Sustituir provider global en `ClientLayout`
- [x] Reimplementar `notify` sobre Sonner
- [x] Añadir `id` y `dedupeKey`
- [x] Mantener `notify.action`
- [x] Ajustar CSS del viewport global
- [x] Añadir tests unitarios del wrapper
- [x] Reescribir documentación técnica principal

---

## Criterios de aceptación

- ningún componente de negocio dispara toasts fuera de `notify`
- los toasts se apilan y no se pisan por defecto
- `notify.promise()` mantiene el toast vivo hasta el final
- `notify.loading()` permite actualización manual por `id`
- el runtime anterior queda fuera de dependencias y layout
