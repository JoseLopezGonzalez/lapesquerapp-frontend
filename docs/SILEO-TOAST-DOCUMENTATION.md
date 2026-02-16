# Sileo — Documentación de Toasts para React

Documentación consolidada desde [sileo.aaryan.design](https://sileo.aaryan.design/docs/).  
Sileo es un componente de notificaciones toast para React: animaciones con morphing SVG y física tipo spring, minimal API y buen aspecto por defecto.

**Rutas documentadas:**

| Ruta | Contenido en este doc |
|------|------------------------|
| [/docs](https://sileo.aaryan.design/docs) | Getting Started, Fire a Toast, Action Toast, Promise Toast, Positions |
| [/docs/api](https://sileo.aaryan.design/docs/api) | Métodos de `sileo`, ToastOptions, ToastButton, ToastStyles, ToastPromiseOptions |
| [/docs/api/toaster](https://sileo.aaryan.design/docs/api/toaster) | Props de Toaster (position, offset, options), ToastPosition |
| [/docs/styling](https://sileo.aaryan.design/docs/styling) | Fill, styles, icon, description, global defaults, roundness, autopilot |

---

## Getting Started

### Descripción

Sileo es un componente de toast pequeño y opinado para React. Usa morphing SVG “gooey” y física tipo spring para crear notificaciones fluidas, con buen aspecto por defecto y sin configuración obligatoria.

### Instalación

```bash
npm install sileo
```

### Configuración rápida

Añade el componente `Toaster` en el layout raíz de tu app y llama a `sileo` desde cualquier parte:

```tsx
import { sileo, Toaster } from "sileo";

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <YourApp />
    </>
  );
}
```

---

## Fire a Toast

Puedes lanzar toasts por tipo:

- **Success** — `sileo.success({ title: "…", description: "…" })`
- **Error** — `sileo.error({ title: "…", description: "…" })`
- **Warning** — `sileo.warning({ title: "…", description: "…" })`
- **Info** — `sileo.info({ title: "…", description: "…" })`

Ejemplo:

```tsx
sileo.success({
  title: "Guardado",
  description: "Los cambios se han guardado correctamente.",
});
```

---

## Action Toast

Los toasts pueden incluir un botón para interacción del usuario. La API usa la prop **`button`** (objeto `ToastButton`):

```tsx
sileo.success({
  title: "Acción completada",
  description: "Puedes deshacer si lo necesitas.",
  button: {
    title: "Deshacer",
    onClick: () => { /* ... */ },
  },
});
```

También existe el método dedicado **`sileo.action(options)`** para toasts con botón de acción.

---

## Promise Toast

Encadena estados de carga, éxito y error a partir de una sola promesa. `loading` puede ser string o un objeto con `title` e `icon`; `success` y `error` pueden ser opciones estáticas o **callbacks** que reciben el valor resuelto/rechazado:

```tsx
// Forma simple (strings)
sileo.promise(
  fetch("/api/save").then((r) => r.json()),
  {
    loading: "Guardando…",
    success: "Guardado.",
    error: "Error al guardar.",
  }
);

// Con callbacks para mensajes dinámicos
sileo.promise(createUser(data), {
  loading: { title: "Creating account..." },
  success: (user) => ({
    title: `Welcome, ${user.name}!`,
  }),
  error: (err) => ({
    title: "Signup failed",
    description: err.message,
  }),
});
```

El método devuelve la **promesa original** (no el id del toast), así que puedes encadenar más lógica. El resto de métodos (`success`, `error`, etc.) devuelven el **id** del toast (string).

---

## Positions

Sileo soporta seis posiciones. Se puede definir por defecto en el `Toaster` o sobrescribir por toast:

```tsx
<Toaster position="top-right" />

// Override por toast:
sileo.success({
  title: "Saved",
  position: "bottom-center",
});
```

Posiciones disponibles:

- `top-left`
- `top-center`
- `top-right`
- `bottom-left`
- `bottom-center`
- `bottom-right`

Tipo TypeScript:

```ts
type ToastPosition =
  | "top-left" | "top-center" | "top-right"
  | "bottom-left" | "bottom-center" | "bottom-right";
```

---

## API: `sileo`

Controlador global de toasts. Importa `sileo` desde `"sileo"` y úsalo en cualquier sitio.

### Métodos

| Método | Descripción |
|--------|-------------|
| `sileo.success(options)` | Toast verde de éxito |
| `sileo.error(options)` | Toast rojo de error |
| `sileo.warning(options)` | Toast ámbar de advertencia |
| `sileo.info(options)` | Toast azul informativo |
| `sileo.action(options)` | Toast con botón de acción |
| `sileo.show(options)` | Toast genérico sin badge de estado |
| `sileo.promise(promise, opts)` | Flujo loading → success/error |

Todos los métodos devuelven el **id** del toast (string), excepto **`sileo.promise`**, que devuelve la promesa original.

---

### `ToastOptions`

Opciones que se pasan a cualquier `sileo.*()`.

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `title` | string | — | Título del toast |
| `description` | ReactNode \| string | — | Cuerpo; admite JSX |
| `position` | ToastPosition | del Toaster | Posición de este toast |
| `duration` | number \| null | 6000 | Auto-cierre en ms; `null` = no se cierra (sticky) |
| `icon` | ReactNode \| null | icono por estado | Icono custom en el badge |
| `fill` | string | — | Color del badge; `"black"` = toast oscuro completo |
| `styles` | ToastStyles | — | Clases para subelementos |
| `roundness` | number | 18 | Border radius en píxeles |
| `autopilot` | boolean \| object | true | Timing de expand/collapse automático |
| `button` | ToastButton | — | Config del botón de acción |

### `ToastButton`

```ts
interface ToastButton {
  title: string;
  onClick: () => void;
}
```

### `ToastStyles`

Clases para sobrescribir subelementos del toast:

```ts
interface ToastStyles {
  title?: string;
  description?: string;
  badge?: string;
  button?: string;
}
```

Ejemplo:

```tsx
sileo.success({
  title: "Custom styled",
  fill: "black",
  styles: {
    title: "text-white!",
    description: "text-white/75!",
    badge: "bg-white/20!",
    button: "bg-white/10!",
  },
});
```

### `ToastPromiseOptions<T>`

Segundo argumento de `sileo.promise(promise, opts)`:

```ts
interface ToastPromiseOptions<T = unknown> {
  loading: Pick<ToastOptions, "title" | "icon">;
  success: ToastOptions | ((data: T) => ToastOptions);
  error: ToastOptions | ((err: unknown) => ToastOptions);
}
```

`success` y `error` pueden ser opciones fijas o **callbacks** que reciben el valor resuelto/rechazado y devuelven `ToastOptions`.

---

## API: `Toaster`

Componente que renderiza los toasts. Añádelo **una vez** en el layout.

```tsx
import { Toaster } from "sileo";
```

### Props del Toaster

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `position` | ToastPosition | `"top-right"` | Posición por defecto de todos los toasts |
| `offset` | number \| string \| object | `16` | Distancia al borde del viewport |
| `options` | Partial&lt;ToastOptions&gt; | — | Opciones por defecto para cada toast |

### Offset

`offset` puede ser un número, un string (ej. `"1rem"`) o un objeto por lado:

```tsx
<Toaster offset={20} />

<Toaster offset={{ top: 20, right: 16 }} />
```

### Opciones por defecto

Opciones globales que se aplican a todos los toasts:

```tsx
<Toaster
  position="top-right"
  offset={16}
  options={{
    fill: "#171717",
    roundness: 18,
    styles: {
      description: "text-white/75!",
    },
  }}
/>
```

---

# Styling

Sileo está pensado para verse bien sin configuración. Cuando necesites personalizar, hay algunas opciones.

## Fill Color

La prop `fill` controla el color del badge/accent. Ponla en `"black"` para un toast completamente oscuro:

```tsx
sileo.success({
  title: "Dark accent",
  fill: "black",
});
```

## Style Overrides

La prop `styles` permite sobrescribir clases en subelementos. Usa el modificador `!` de Tailwind para asegurar especificidad:

```tsx
sileo.success({
  title: "Título",
  description: "Descripción",
  styles: {
    title: "!text-lg !font-bold",
    description: "!text-sm text-gray-600",
    badge: "!bg-indigo-500",
    button: "!bg-indigo-600 !text-white",
  },
});
```

### Claves disponibles en `styles`

| Key          | Elemento                    |
| ------------ | --------------------------- |
| `title`      | Texto del título            |
| `description`| Área de cuerpo/descripción  |
| `badge`      | Círculo del icono/badge     |
| `button`     | Botón de acción             |

## Custom Icons

Pasa cualquier nodo React en la prop `icon` para sustituir el icono por defecto del estado:

```tsx
sileo.success({
  title: "Con icono custom",
  icon: <MyCustomIcon />,
});
```

Pon `icon: null` para ocultar el badge por completo.

## Custom Description

La prop `description` acepta JSX para contenido rico:

```tsx
sileo.success({
  title: "Título",
  description: (
    <div>
      <p>Párrafo con <strong>formato</strong>.</p>
      <a href="#">Enlace</a>
    </div>
  ),
});
```

## Global Defaults

Usa la prop `options` del `Toaster` para definir valores por defecto de todos los toasts. Opcionalmente usa `offset` para la distancia al viewport:

```tsx
<Toaster
  position="top-right"
  offset={16}
  options={{
    fill: "#171717",
    roundness: 18,
    duration: 5000,
    styles: {
      description: "text-white/75!",
    },
  }}
/>
```

## Roundness

Controla el border radius con la prop `roundness` (por defecto `18`):

```tsx
sileo.success({
  title: "Más cuadrado",
  roundness: 8,
});
```

## Autopilot

Por defecto los toasts se expanden tras un breve retraso y se colapsan antes de cerrarse. Se controla con la prop `autopilot`:

```tsx
// Desactivar autopilot
sileo.success({
  title: "Sin autopilot",
  autopilot: false,
});

// Timing custom
sileo.success({
  title: "Custom timing",
  autopilot: {
    expandDelay: 500,
    collapseDelay: 200,
  },
});
```

---

## Resumen de API

**sileo** — Métodos: `success`, `error`, `warning`, `info`, `action`, `show`, `promise`. Retorno: `id` (string) en todos menos `promise` (devuelve la promesa).

**Toaster** — Props: `position`, `offset` (number | string | object), `options` (Partial&lt;ToastOptions&gt;).

**ToastOptions** — `title`, `description`, `position`, `duration`, `icon`, `fill`, `styles`, `roundness`, `autopilot`, `button` (ToastButton: `{ title, onClick }`).

**ToastPromiseOptions** — `loading` (title/icon), `success` y `error` (ToastOptions o callback que recibe data/err).

---

**Fuentes (doc oficial):**

- [Getting Started](https://sileo.aaryan.design/docs)
- [API: sileo](https://sileo.aaryan.design/docs/api)
- [API: Toaster](https://sileo.aaryan.design/docs/api/toaster)
- [Styling](https://sileo.aaryan.design/docs/styling)

[GitHub: hiaaryan/sileo](https://github.com/hiaaryan/sileo) · Licencia MIT
