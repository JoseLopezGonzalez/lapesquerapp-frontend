# Splash Screens iOS

Este directorio contiene los splash screens (pantallas de inicio) para iOS cuando la PWA se instala y se abre.

## 📱 Splash Screens Requeridos

### iPhone Modernos (iPhone 14 y posteriores)

| Dispositivo | Tamaño | Media Query |
|------------|--------|-------------|
| iPhone 14 Pro Max | 1290x2796 | `(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)` |
| iPhone 14 Pro | 1179x2556 | `(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)` |
| iPhone 14 Plus | 1284x2778 | `(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)` |
| iPhone 14 | 1170x2532 | `(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)` |

### iPad

| Dispositivo | Tamaño | Media Query |
|------------|--------|-------------|
| iPad Pro 12.9" | 2048x2732 | `(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)` |
| iPad Pro 11" | 1668x2388 | `(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)` |
| iPad Air | 1640x2360 | `(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2)` |
| iPad Mini | 1488x2266 | `(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2)` |

### iPhone Clásicos (soporte adicional)

| Dispositivo | Tamaño | Media Query |
|------------|--------|-------------|
| iPhone 13/12 Pro Max | 1284x2778 | `(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)` |
| iPhone 13/12 Pro | 1170x2532 | `(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)` |
| iPhone SE (3ra gen) | 750x1334 | `(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)` |

## 🎨 Especificaciones de Diseño

**Recomendaciones**:
- **Fondo**: Usar el color `#ffffff` (blanco) o `#0E1E2A` (theme color) como fondo sólido
- **Logo/Contenido**: Centrar el logo de la aplicación
- **Formato**: PNG
- **Orientación**: Portrait (vertical)

**Estructura típica**:
```
┌─────────────────┐
│                 │
│                 │
│     [LOGO]      │ ← Logo centrado
│                 │
│                 │
│                 │
└─────────────────┘
```

## 🛠️ Generación de Splash Screens

### Opción 1: Herramienta Online (Recomendada)

**RealFaviconGenerator**: https://realfavicongenerator.net/
1. Sube tu logo/icono
2. Configura los colores (background, theme)
3. Genera todos los splash screens automáticamente
4. Descarga y coloca los archivos en este directorio

### Opción 2: PWA Builder Image Generator

**PWA Builder**: https://www.pwabuilder.com/imageGenerator
1. Sube tu icono 512x512
2. Configura colores
3. Genera splash screens para múltiples dispositivos

### Opción 3: Manual (Figma/Photoshop)

1. Crear un canvas con el tamaño requerido
2. Añadir fondo (color sólido)
3. Centrar el logo
4. Exportar como PNG
5. Guardar con nombre descriptivo: `iphone-14-pro-max.png`

## 📝 Naming Convention

**Formato recomendado**: `{dispositivo}-{tamaño}.png`

Ejemplos:
- `iphone-14-pro-max-430x932.png`
- `iphone-14-pro-393x852.png`
- `ipad-pro-12.9-1024x1366.png`

O más simple:
- `iphone-14-pro-max.png`
- `iphone-14-pro.png`
- `ipad-pro-12.9.png`

## ⚠️ Notas Importantes

1. **Mínimo recomendado**: Al menos crear splash screens para iPhone 14 Pro Max, iPhone 14, iPad Pro 12.9" y iPad Pro 11"
2. **Fallback**: iOS usará el `apple-touch-icon.png` si no encuentra un splash screen específico
3. **Actualización**: Los splash screens se pueden actualizar sin cambiar el código, solo reemplazando los archivos

## ✅ Checklist

Una vez creados los splash screens, verificar:

- [ ] Splash screens creados para dispositivos principales
- [ ] Archivos en formato PNG
- [ ] Meta tags añadidos en `src/app/layout.js`
- [ ] Probar en dispositivo iOS real (simulador también funciona)
- [ ] Verificar que aparecen correctamente al abrir la PWA instalada

