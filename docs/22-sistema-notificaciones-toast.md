# Sistema de notificaciones toast

Documentación técnica del sistema de notificaciones del frontend. Esta guía describe la arquitectura vigente, el wrapper `notify`, el toaster global y las reglas de integración para que la app mantenga una sola puerta de entrada independientemente del proveedor visual.

La guía de migración desde Sileo a ReUI Sonner está en [23-migracion-sileo-a-reui-sonner.md](./23-migracion-sileo-a-reui-sonner.md).

---

## Resumen de arquitectura

- La API pública de notificaciones es `notify` en `src/lib/notifications.ts`.
- El runtime visual del toaster se monta una sola vez en `src/app/ClientLayout.js`.
- El provider visual vive separado en `src/components/ui/app-toaster.jsx`.
- Ningún componente de negocio debe importar `sonner` ni otro proveedor directamente.

Flujo actual:

```txt
Componente / hook
  -> notify.success / error / warning / info / loading / promise / action
  -> wrapper de dominio en src/lib/notifications.ts
  -> provider global AppToaster
  -> Sonner con skin y configuración alineadas con el design system
```

---

## API pública: `notify`

### Métodos disponibles

| Método | Uso |
|------|------|
| `notify.success(message, options?)` | Confirmaciones de éxito |
| `notify.error(message, options?)` | Errores recuperables o bloqueantes |
| `notify.warning(message, options?)` | Advertencias y confirmaciones suaves |
| `notify.info(message, options?)` | Información operativa no crítica |
| `notify.loading(message, options?)` | Carga manual sin promesa |
| `notify.promise(promise, messages, options?)` | Flujo `loading -> success/error` con el mismo toast |
| `notify.action(message, button, options?)` | Toast con CTA principal |
| `notify.dismiss(id)` | Cerrar un toast concreto |
| `notify.clear()` | Cerrar todos los toasts |

### Tipos principales

```ts
type NotifyMessage =
  | string
  | { title: string; description?: string };

interface NotifyOptions {
  id?: string | number;
  dedupeKey?: string;
  duration?: number | null;
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  dismissible?: boolean;
  important?: boolean;
  description?: ReactNode;
}
```

---

## Reglas de comportamiento

### 1. Stacking

- Los toasts normales se apilan.
- No se reemplazan entre sí por defecto.
- Solo se reutiliza un toast existente si se pasa `id` o `dedupeKey`.

### 2. Actualización explícita por `id`

Usar `id` cuando quieras abrir un toast y actualizarlo más tarde:

```js
const id = notify.loading({ title: "Exportando documento" });

notify.success(
  { title: "Exportacion completada" },
  { id, description: "El archivo ya esta listo" }
);
```

### 3. Dedupe opcional

Usar `dedupeKey` solo en escenarios donde varias fuentes puedan disparar el mismo aviso y se quiera mostrar una sola vez.

```js
notify.error(
  { title: "Error al sincronizar" },
  { dedupeKey: "sync-error" }
);
```

### 4. Promise toasts

- `notify.promise()` crea un `id` estable interno.
- El toast de `loading` permanece vivo hasta que la promesa termina.
- El mismo toast se actualiza a `success` o `error`.
- El método devuelve la promesa original para poder seguir encadenando lógica.

### 5. Toasts importantes

- `important: true` convierte el toast en persistente si no se define otra duración.
- Se usa solo para errores o estados que el usuario no debe perder.

---

## Runtime global

- El toaster se monta en portal a `document.body`.
- La posición por defecto es `top-center`.
- El offset por defecto es `16`.
- El tema visual se sincroniza con `next-themes`.
- El `z-index` del viewport se fuerza desde `src/app/globals.css`.

Esto permite que los toasts queden por encima de diálogos, sheets y overlays sin depender de estilos de proveedor anteriores.

---

## Qué no hacer

- No importar `toast` desde `sonner` en componentes de negocio.
- No acoplar textos o reglas de negocio al proveedor visual.
- No usar `dedupeKey` de forma global por defecto.
- No mostrar toast para errores `422` si el flujo ya tiene errores inline claros.
- No usar toast cuando una pantalla de transición o un estado bloqueante comunica mejor el proceso.

---

## Referencias relacionadas

- [estandar-contenido-toasts.md](./estandar-contenido-toasts.md)
- [23-migracion-sileo-a-reui-sonner.md](./23-migracion-sileo-a-reui-sonner.md)
