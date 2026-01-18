# Iconos PWA

Este directorio contiene los iconos necesarios para la PWA.

## Iconos Requeridos

### Para Android/Chrome PWA

- **icon-192x192.png** - Icono 192x192px (requerido)
- **icon-512x512.png** - Icono 512x512px (requerido)

**Recomendaciones**:
- Formato: PNG
- Fondo: Preferiblemente sin fondo o con fondo sólido
- Contenido: Logo de la aplicación centrado
- Maskable: Los iconos deben funcionar bien con propósito "maskable" (evitar elementos críticos cerca de los bordes)

### Para iOS

- **apple-touch-icon.png** (180x180) - Ya existe en `/public/apple-touch-icon.png`

## Creación de Iconos

**Pendiente**: Crear los iconos 192x192 y 512x512 basándose en el logo de la aplicación.

**Herramientas recomendadas**:
- Figma / Sketch / Photoshop
- Online: https://realfavicongenerator.net/ (genera todos los tamaños)
- Online: https://www.pwabuilder.com/imageGenerator

## Verificación

Una vez creados los iconos, verificar que:
- Se cargan correctamente en el manifest
- Se muestran bien al instalar la PWA
- Los iconos maskable funcionan correctamente (Android)
- El icono de iOS se muestra correctamente

