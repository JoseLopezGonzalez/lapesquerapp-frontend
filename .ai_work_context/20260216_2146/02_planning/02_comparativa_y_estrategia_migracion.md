# Análisis técnico y estrategia de migración — Sileo vs react-hot-toast

**Estado**: Completado  
**Última actualización**: 2026-02-16  
**Referencia**: [Sileo Docs](https://sileo.aaryan.design/docs), [GitHub](https://github.com/hiaaryan/sileo)

---

## 1. API de Sileo (según documentación)

- **Instalación**: `npm install sileo`
- **Setup**: Importar `sileo` y `Toaster`; montar `<Toaster />` en la raíz; llamar `sileo` desde cualquier sitio.
- **Métodos**:
  - `sileo.success({ title, description?, ... })`
  - `sileo.error({ title, description?, ... })`
  - `sileo.warning({ ... })`
  - `sileo.info({ ... })`
  - **Action toast**: botón en el toast (acción de usuario).
  - **Promise toast**: encadena loading → success/error desde una promesa; devuelve la promesa para encadenar.
- **Posiciones**: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`. Configurable en `<Toaster>` por defecto o por toast.
- **Opciones por toast**: `position` (y las que exponga la API; la doc muestra objeto con `title` y opcionalmente `description`).

Inferido (por documentación y uso típico):
- No se menciona `dismiss(id)` explícitamente; en librerías tipo promise-toast el “dismiss” suele ser implícito al resolver/rechazar.
- API orientada a objeto: `sileo.success({ title: "Saved" })` más que `sileo.success("Saved")`.

---

## 2. Comparativa conceptual

| Aspecto | react-hot-toast | Sileo |
|--------|------------------|--------|
| API estilo | `toast.success(msg, options)` / `toast(msg, options)` | `sileo.success({ title, description?, ... })` |
| Contenido | String o ReactNode (JSX) | Objeto con `title` (y opcional `description`) |
| Loading | `toast.loading(msg, opts)` → devuelve id; luego `toast.success(msg, { id })` / `toast.error(msg, { id })` | Promise toast: una llamada con promesa; loading/success/error automáticos |
| Dismiss | `toast.dismiss(id)` | No documentado explícitamente; en flujo promise no suele hacer falta |
| Tipos | success, error, loading, custom, promise | success, error, warning, info, action, promise |
| Tema/estilo | Manual (style, className); en proyecto vía getToastTheme() | “Beautiful by default”; tema/clase no detallado en doc |
| Posición | Opciones en Toaster/toast | top/bottom × left/center/right |
| Duración | duration en options | No especificada en doc (asumir default o revisar API real) |

---

## 3. Estrategia de migración progresiva

### 3.1 Wrapper interno desacoplado: `lib/notifications.ts`

- **Objetivo**: Una sola API estable para la app (`notify.success()`, `notify.error()`, etc.) que por dentro use Sileo. Así el día de mañana se puede cambiar de librería sin tocar decenas de archivos.
- **API del wrapper** (estilo actual del proyecto):
  - `notify.success(message, options?)`
  - `notify.error(message, options?)`
  - `notify.warning(message, options?)`
  - `notify.info(message, options?)`
  - `notify.loading(message, options?)` → devuelve un **id** (o handle) que permita luego “actualizar” a success/error.
  - `notify.promise(promise, messages?)` cuando el flujo sea “una promesa” (recomendado donde haya loading→success/error).
  - `notify.dismiss(id)` si Sileo lo soporta; si no, documentar limitación.
- **Mapeo de mensajes**: Donde hoy se hace `toast.success(text)` → `notify.success(text)` que internamente llame `sileo.success({ title: text })` (y si en el futuro se quiere `description`, se puede extender options).
- **Tema**: Mantener coherencia con dark/light. Si Sileo no permite inyectar estilos fácilmente, usar posición y duración estándar y aceptar el look por defecto de Sileo en una primera iteración; tema fino en fase posterior si hace falta.

### 3.2 NotificationProvider global

- **No es estrictamente necesario** un Context solo para notificaciones: Sileo se llama por función (`sileo.success(...)`), igual que react-hot-toast. El “provider” es el `<Toaster />` de Sileo en el layout.
- Opcional: un `NotificationProvider` que solo monte `<Toaster />` y exporte el mismo wrapper `notify` para consistencia. La ventaja es un solo lugar donde configurar posición/por defecto.

### 3.3 Mapeo detallado

| Caso actual (hot-toast) | Acción en wrapper/Sileo |
|--------------------------|--------------------------|
| success / error / info (texto) | `notify.success(msg)` → `sileo.success({ title: msg })` (igual error, info, warning) |
| toast con getToastTheme() | Wrapper aplica opciones globales (posición, duración); tema dark/light si Sileo lo permite; si no, estándar |
| toast con duration custom (ej. 6000) | `notify.error(msg, { duration: 6000 })`; wrapper pasa duration a Sileo si está soportado |
| toast.loading("...") luego success/error con { id } | Opción A: `notify.promise(promise, { loading: "...", success: "...", error: "..." })` donde sea posible. Opción B: `notify.loading("...")` que devuelva id y `notify.success(msg, { id })` / `notify.error(msg, { id })` si Sileo permite actualizar por id |
| toast con JSX (iconos en loading) | Sileo suele usar title (string). Migrar a string descriptivo (ej. "Generando PDF...") y quitar iconos en toast; o usar description si la API lo permite |
| toast.dismiss(id) | Implementar `notify.dismiss(id)` si Sileo lo tiene; si no, documentar y en useStoreDialogs valorar usar promise toast en su lugar |
| toast.info | `notify.info(msg)` → `sileo.info({ title: msg })` |

### 3.4 Async states

- **Flujos “loading → success/error”**: Preferir `notify.promise(promise, { loading, success, error })` para que Sileo gestione estados. Donde ya exista try/catch con toast.loading + id, refactorizar a una promesa única y usar promise toast, o mantener flujo manual con notify.loading + notify.success/error con id si el wrapper lo soporta.

### 3.5 Colas y stacking

- Comportamiento por defecto de Sileo (varias toasts a la vez). No hacer cola custom salvo que se detecte necesidad; en ERP suele ser suficiente mostrar varias notificaciones apiladas.

### 3.6 Posicionamiento y estándares globales

- **Posición**: Elegir una por defecto (ej. `top-right` o `bottom-right`) y configurarla en `<Toaster>`; en el wrapper no sobrescribir salvo casos excepcionales.
- **Duración por tipo**: success/info corta (ej. 4s), error/warning más larga (ej. 6–7s); si la API de Sileo lo permite, aplicarlo en el wrapper.
- **Estilo unificado**: Misma posición y mismas duraciones en toda la app; textos existentes no cambiar.
- **Mobile**: Dejar por defecto de Sileo o elegir posición que no tape contenido crítico (ej. bottom-center o top-center).
- **Accesibilidad**: Sileo “opinionated”; revisar si anuncia live region; si hace falta, anotar como mejora posterior.

---

## 4. Riesgos y limitaciones

- **Duration y dismiss**: Sileo no documenta opciones explícitas de duration ni dismiss. Validar en código tras instalar; si no existen, usar duración por defecto y sustituir dismiss por promise toast o auto-cierre.
- **API de Sileo no documentada en detalle**: Actualización por id y tema pueden no estar en la doc. Habrá que probar en código o revisar tipos en node_modules tras `npm i sileo`.
- **Contenido JSX en toasts**: Si Sileo solo acepta title/description string, se pierden iconos en 2 sitios (EntityClient); impacto bajo si el texto es claro.
- **dismiss(id)**: Si Sileo no expone dismiss, los 2 usos en useStoreDialogs se sustituyen por promise toast o se deja el toast hasta que caduque.
- **getToastTheme()**: Si Sileo no permite inyectar background/color, el aspecto será el por defecto de Sileo (posible cambio visual ligero).

---

## 5. Orden de implementación sugerido

1. Instalar Sileo y montar `<Toaster />` en `ClientLayout.js` (junto al actual Toaster de hot-toast, sin quitarlo).
2. Crear `lib/notifications.ts` (o `src/lib/notifications.ts`) con el wrapper que use Sileo y exponga notify.success/error/warning/info/loading/promise/dismiss según capacidad.
3. Migrar primero archivos “simples” (solo success/error/info con texto) reemplazando toast por notify y eliminando import de react-hot-toast/getToastTheme en esos archivos.
4. Migrar flujos con toast.loading + id: preferir notify.promise donde haya promesa; donde no, usar notify.loading + notify.success/error con id si el wrapper lo implementa.
5. Migrar toast.dismiss a notify.dismiss (o alternativa) en useStoreDialogs.
6. Ajustar EntityClient (contenido JSX en loading) a texto plano o description.
7. Verificación: grep de imports y usos de react-hot-toast y getToastTheme; asegurar que no queden referencias activas ni Toaster de hot-toast en uso.
8. Solo entonces proponer eliminar la dependencia `react-hot-toast` y el archivo `customs/reactHotToast`.

No modificar lógica de negocio, ni textos existentes, ni simplificar condiciones sin justificación. Si algo no es mapeable 1:1 a Sileo, dejarlo documentado (ej. en este plan o en 04_logs) antes de decidir.
