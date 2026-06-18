# QR Scanner — Arquitectura y decisiones de diseño

## El problema original

La primera implementación del escáner usaba `@yudiel/react-qr-scanner` v2.5.1. En la práctica apareció una limitación fundamental: la librería **deduplica los resultados por valor**. Su callback `onScan` se dispara **una sola vez por código único detectado**, no en cada frame. Esto provocaba tres síntomas concretos:

1. **El SVG no seguía al QR**: el overlay se pintaba en la posición inicial y se quedaba congelado aunque el usuario moviera la cámara.
2. **El botón desaparecía al instante**: el timeout de 800 ms que usábamos para detectar "QR fuera de encuadre" se disparaba inmediatamente porque la librería no volvía a llamar.
3. **Sin control real sobre el flujo**: la librería tenía su propio ciclo de vida que interfería con nuestra máquina de estados.

La causa raíz es que `@yudiel/react-qr-scanner` (y el `@zxing/library` subyacente) filtran detecciones repetidas. No hay workaround limpio sin tocar los internos de la librería.

---

## La solución: propietarios del stream de cámara

En lugar de ceder el control a la librería, **nos apropiamos del stream de cámara** con `getUserMedia` directamente. La librería pasa a ser solo el motor de decodificación, sin ninguna opinión sobre la UI.

```
Antes:
  <Scanner onScan={...} />   ← librería gestiona vídeo + UI + deduplicación

Después:
  <video ref={videoRef} />   ← nosotros gestionamos el vídeo
  useBarcodeScanner(...)     ← hook RAF que llama al motor cada 100 ms
  QrScannerWidget            ← máquina de estados y UI propias
```

Con esto conseguimos:
- **Callbacks cada 100 ms** independientemente de si el código es el mismo o no
- **Corner points en cada frame** → el SVG sigue al QR en tiempo real
- **Detección de "QR fuera de encuadre"**: si el loop devuelve array vacío durante 400 ms → resetear a `searching`
- **Cero interferencia**: la librería no tiene UI ni estado propio

---

## Dos motores WASM

Dado que ya eramos responsables del stream, elegir el motor de decodificación se convirtió en un parámetro. Implementamos dos para poder compararlos en producción:

| Backend | Librería | Motor | Nota |
|---|---|---|---|
| `'barcode-detector'` | `barcode-detector@3.2.0` | **ZXing C++ → WASM** | API W3C BarcodeDetector ponyfill. Acepta `HTMLVideoElement` directamente. |
| `'zbar'` | `@undecaf/zbar-wasm@0.11.0` | **ZBar C → WASM** | Necesita `ImageData` → requiere snapshot de canvas por frame. Históricamente superior en Code 128. |

Ambos motores funcionan en **iOS Safari y Android Chrome** (sin dependencia de API nativa del navegador).

### Por qué no el `BarcodeDetector` nativo del navegador

Chrome/Android tiene `BarcodeDetector` nativo (sin WASM). Safari iOS **no lo tiene** (a fecha de 2026). Como el perfil de usuario es repartidor autoventa con dispositivo móvil indeterminado, necesitábamos una solución que funcione en los dos sistemas operativos.

El ponyfill `barcode-detector` usa ZXing WASM como implementación, lo que lo hace consistente en todas las plataformas. En un futuro próximo, si Safari implementa la API nativa, el ponyfill podría ser reemplazado sin cambiar nada por encima de él.

---

## Arquitectura de componentes

```
Step2QRScan
├── Botón "Escanear (ZXing)"  → setScannerBackend('barcode-detector')
├── Botón "Escanear (ZBar)"   → setScannerBackend('zbar')
└── <QrScannerWidget backend={scannerBackend} />
        ├── useBarcodeScanner({ backend, formats, scanDelay: 100 })
        │       ├── Effect 1: init detector (dynamic import del WASM)
        │       ├── Effect 2: getUserMedia → videoRef.current.play()
        │       └── Effect 3: RAF loop → detectFn cada 100 ms → onDetect(codes[])
        ├── <video ref={videoRef} />          ← stream propio
        ├── <canvas ref={canvasRef} hidden />  ← solo para ZBar (ImageData)
        ├── CornerGuides                       ← guías de encuadre
        ├── ScanBeam                           ← barrido animado en fase 'searching'
        ├── DetectionOverlay (SVG)             ← polígono verde + dots, actualiza cada frame
        ├── ResultOverlay                      ← overlay de éxito/fallo
        └── BottomBar                          ← botón "Leer código" / estado de búsqueda
```

---

## Máquina de estados (`ScanPhase`)

```
                     ┌──────────────────────────────────────────┐
                     │             'searching'                  │
                     │  ScanBeam animado, botón cerrar          │
                     └────────────────────┬─────────────────────┘
                                          │ handleDetect(codes.length > 0)
                                          ▼
                     ┌──────────────────────────────────────────┐
                     │             'detected'                   │
                     │  SVG sigue al QR cada ~100 ms            │
                     │  Botón "Leer código" visible             │
                     └────┬──────────────────────┬─────────────┘
                          │                      │
          codes.length=0  │                      │ usuario pulsa "Leer código"
          durante 400 ms  │                      │ (handleConfirm)
                          ▼                      ▼
                     'searching'       validate(rawValue)
                                            │
                              ┌─────────────┴─────────────┐
                              │ ok: true                  │ ok: false
                              ▼                           ▼
              ┌───────────────────────┐   ┌───────────────────────┐
              │ 'result' / success    │   │ 'result' / fail       │
              │ onScan(rawValue)      │   │ botones Cerrar /      │
              │ → auto-reset 1500 ms  │   │ Volver a intentar     │
              │   → 'searching'       │   └───────────────────────┘
              └───────────────────────┘
```

**Puntos clave del flujo:**

- `phaseRef` se actualiza **síncronamente** antes de `setPhase` para evitar race conditions en el loop RAF.
- `onScan` se dispara inmediatamente al entrar en `result/success` (no espera al auto-reset).
- El auto-reset a `searching` (1500 ms) permite escanear múltiples cajas sin cerrar el escáner.
- El debounce de 400 ms en "lost detection" evita parpadeos: pequeñas pérdidas de tracking no resetean el estado.

---

## `useBarcodeScanner` — contrato del hook

```typescript
useBarcodeScanner({
  backend: 'barcode-detector' | 'zbar',
  formats?: string[],   // W3C BarcodeFormat names: 'qr_code', 'code_128', etc.
  scanDelay?: number,   // ms entre detecciones (default: 100)
  onDetect: (codes: ScannedCode[]) => void,  // [] = nada detectado en este frame
  onError: (error: Error) => void,
}) → { videoRef, canvasRef, isReady }
```

`onDetect` se llama en **cada ciclo de detección**, con array vacío si no hay nada en frame. El widget usa esto para:
- `codes.length > 0` → actualizar cornerPoints (SVG sigue al QR) + cancelar timer "lost"
- `codes.length === 0` + fase `detected` → iniciar timer de 400 ms → reset a `searching`

---

## Mapeo de coordenadas (video → display)

Los backends devuelven cornerPoints en **espacio de píxeles del vídeo** (0,0 en esquina superior izquierda del frame crudo). El elemento `<video>` se renderiza con `object-fit: cover`, lo que implica una escala y un offset.

`mapToDisplay()` calcula:
```
scale = max(displayWidth / videoWidth, displayHeight / videoHeight)
offsetX = (displayWidth  - videoWidth  * scale) / 2
offsetY = (displayHeight - videoHeight * scale) / 2
mapped.x = raw.x * scale + offsetX
mapped.y = raw.y * scale + offsetY
```

---

## Diferencias de API entre motores

| Aspecto | `barcode-detector` (ZXing) | `zbar-wasm` (ZBar) |
|---|---|---|
| Entrada de detección | `HTMLVideoElement` directo | `ImageData` (requiere canvas snapshot) |
| Corner points | `b.cornerPoints` — 4-tupla de `Point2D` | `s.points` — array de `{x,y}` |
| Valor del código | `b.rawValue` | `s.decode()` |
| Formato detectado | `b.format` (string W3C) | `s.typeName` (string ZBar, p.ej. `'CODE-128'`) |
| Filtro de formatos | Constructor `new BarcodeDetector({ formats })` | Post-filtro por `s.typeName` usando `ZBAR_TYPE_MAP` |

---

## Configuración necesaria en Next.js

Los dos paquetes cargan ficheros `.wasm` en runtime. Para que webpack los empaquete correctamente:

```javascript
// next.config.mjs
webpack: (config) => {
  config.experiments = { ...config.experiments, asyncWebAssembly: true };
  return config;
},
```

> **Nota**: Con Turbopack (modo dev por defecto en Next.js 15) el soporte WASM puede comportarse diferente. Si hay errores de carga WASM en dev, ejecutar con `next dev --no-turbopack` como diagnóstico.

---

## Posibles áreas de refinamiento

1. **Latencia de inicio**: el primer scan tarda ~200-400 ms más que los siguientes (WASM initialization). Se podría precargar el módulo en un `useEffect` de la página padre.

2. **Precisión de Code 128 en condiciones adversas**: comparar ZXing vs ZBar en cajas con códigos deteriorados o mala iluminación. ZBar históricamente es superior; ZXing puede ser suficiente en condiciones normales.

3. **Número de corner points**: ZBar puede devolver más de 4 puntos para algunos formatos. El SVG actual los dibuja todos, lo que funciona bien visualmente, pero se podría normalizar a 4 si hiciera falta.

4. **`scanDelay`**: 100 ms = máximo ~10 detecciones/s. En dispositivos potentes se podría bajar a 50 ms para tracking más fluido. En gama baja, subirlo a 150-200 ms para reducir carga.

5. **Precarga selectiva del motor**: si el usuario usa siempre el mismo botón, recordar la preferencia en `localStorage` y precargarlo al montar el componente padre.

6. **Formato del backend en el label del botón**: actualmente los botones dicen "ZXing" y "ZBar". Si se decide conservar un solo motor, simplificar a "Escanear con cámara" eliminando el otro.
