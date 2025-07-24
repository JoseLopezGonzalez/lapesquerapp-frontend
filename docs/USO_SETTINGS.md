# Uso de Settings Globales en BrisApp

Este documento explica cómo acceder, actualizar y reaccionar a los cambios de configuración (settings) globales obtenidos del backend en cualquier parte del proyecto.

---

## 1. Acceso a Settings en Componentes React

Utiliza el hook `useSettings` para acceder a los settings y su estado de carga en cualquier componente React:

```js
import { useSettings } from '@/context/SettingsContext';

function MiComponente() {
  const { settings, loading } = useSettings();
  if (loading) return <div>Cargando...</div>;
  return <div>El valor de X es: {settings?.X}</div>;
}
```

---

## 2. Acceso a Settings desde Helpers o Servicios (fuera de React)

Utiliza el helper asíncrono `getSettingValue` para obtener el valor de un setting por clave:

```js
import { getSettingValue } from '@/helpers/getSettingValue';

async function hacerAlgo() {
  const valor = await getSettingValue('nombre_setting');
  // ... usar valor
}
```

- El helper cachea los settings para evitar llamadas repetidas.
- Si necesitas forzar la recarga, pasa `true` como segundo argumento: `getSettingValue('clave', true)`.

---

## 3. Actualización de Settings y Notificación Global

Cuando actualices los settings (por ejemplo, desde la UI de administración), **debes notificar al Contexto** para que todos los consumidores se actualicen automáticamente:

```js
import { useSettings } from '@/context/SettingsContext';
import { updateSettings } from '@/services/settingsService';

const { setSettings } = useSettings();

async function guardarSettings(nuevosSettings) {
  await updateSettings(nuevosSettings);
  setSettings(nuevosSettings); // Notifica a todos los consumidores y borra el caché global
}
```

Esto asegura que:

- Todos los componentes React que usan `useSettings` se actualizan automáticamente.
- El helper `getSettingValue` invalidará su caché y obtendrá los valores frescos en la próxima llamada.

---

## 4. Ejemplo de Integración en el Layout Principal

Asegúrate de envolver tu app con el `SettingsProvider` en el layout principal:

```js
import { SettingsProvider } from '@/context/SettingsContext';

export default function RootLayout({ children }) {
  return (
    <SettingsProvider>
      {children}
    </SettingsProvider>
  );
}
```

---

## 5. Advertencias y Buenas Prácticas

- **No modifiques los settings directamente**: Usa siempre el flujo `updateSettings` + `setSettings`.
- **No asumas que los settings están disponibles inmediatamente**: Comprueba siempre el estado `loading`.
- **Si usas el helper fuera de React**, recuerda que el caché solo se actualiza tras llamar a `setSettings` en el Context.

---

## 6. Referencias

- `src/context/SettingsContext.js`
- `src/helpers/getSettingValue.js`
- `src/services/settingsService.js`
