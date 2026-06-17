# 74 — QrScannerWidget: Rediseño del Lector de QR

> **Estado:** Implementado  
> **Rama:** `claude/qr-reader-enhancement-rbq3t1`  
> **Afecta a:** módulos Almacén, Palets, Autoventa (Field + Comercial)

---

## Problema resuelto

El lector de QR anterior operaba en modo **always-on**: desde que se abría, la cámara procesaba frames continuamente y el único mecanismo anti-duplicados era un debounce de 1800–3000 ms. Sin distinción visual entre "apuntando", "leyendo" y "código detectado". Dos componentes scanner paralelos con lógica idéntica sin unificar.

---

## Diseño: Detect → Highlight → Confirm

La cámara siempre está activa y buscando. Cuando detecta un QR en el encuadre:
1. Se dibuja un polígono SVG (con glow verde) sobre el código detectado en tiempo real
2. Aparece el botón **"Leer código"** con efecto shimmer en la barra inferior
3. El usuario pulsa para confirmar — a partir de ese momento se procesa el valor

Este modelo es análogo al de un lector físico de pistola: el operario apunta, ve el código marcado, y pulsa el gatillo. Elimina lecturas accidentales sin añadir pasos extra.

---

## State machine: 3 fases

```
SEARCHING ──[QR entra en encuadre]──▶ DETECTED ──[usuario pulsa "Leer"]──▶ RESULT
    ◀──[QR sale del encuadre (~800ms)]──              ◀──[reintentar / fail]──┘
```

### SEARCHING
- Cámara activa, escaneo continuo
- Corner guides blancos/sutiles
- Scan line animada (gradiente primary, traversal 1.8s)
- Barra inferior: texto de instrucción + botón "Cerrar"

### DETECTED
- Polígono SVG sobre el QR detectado con `drop-shadow` verde → actualiza en tiempo real si el código se mueve
- Círculos verdes en los 4 cornerPoints
- Corner guides se ponen en `--primary`
- Barra inferior: botón **"Leer código"** con shimmer animado
- Si el QR sale del encuadre → vuelve a SEARCHING a los 800 ms

### RESULT (success)
- Overlay fijo `z-[120]`, cubre toda la pantalla sobre el vídeo
- `radial-gradient` verde desde centro → transparente
- QR generado del valor leído (react-qr-code) con ring verde + badge checkmark
- Texto de éxito contextual (prop `successText`)
- Auto-cierra a los 1800 ms → dispara `onScan(rawValue)` + `onClose()`
- Botón "Cerrar ahora" disponible (cierra inmediatamente)

### RESULT (fail)
- Mismo overlay con `radial-gradient` rojo
- QR generado + badge X rojo
- Mensaje de error (devuelto por la función `validate`)
- Botones "Cerrar" y "Volver a intentar" → vuelve a SEARCHING

---

## Feedback sensorial

### Sonido (`src/lib/scannerSound.ts`)
Síntesis vía Web Audio API — sin dependencias, sin archivos de audio.

| Evento | Tipo | Frecuencia | Sensación |
|---|---|---|---|
| Success | `sine` | 880 → 1320 Hz + 1100 → 1600 Hz (delay 140ms) | Ding ascendente limpio |
| Fail | `sawtooth` | 380 → 170 Hz | Buzz descendente grave |

### Vibración (`navigator.vibrate`)
| Evento | Patrón | Sensación |
|---|---|---|
| Success | `[40, 60, 40]` | Dos pulsos cortos — confirmación |
| Fail | `[200]` | Un pulso largo — alerta |

---

## Coordinate mapping: video → pantalla

Los `cornerPoints` del BarcodeDetector vienen en el espacio intrínseco del vídeo (ej. 1280×960). El vídeo se renderiza con `object-fit: cover` en el contenedor. La transformación:

```
scale  = max(displayW / videoW, displayH / videoH)
offsetX = (displayW - videoW × scale) / 2
offsetY = (displayH - videoH × scale) / 2
displayX = cornerPoint.x × scale + offsetX
displayY = cornerPoint.y × scale + offsetY
```

Implementado en la función `mapToDisplay()` dentro del componente.

---

## API del componente

```typescript
// src/components/Shared/QrScannerWidget/index.tsx

export type QrValidateResult = { ok: true } | { ok: false; message: string };

export interface QrScannerWidgetProps {
  onScan: (rawValue: string) => void;       // llamado solo en éxito, tras cerrar
  onClose: () => void;
  onError?: (message: string) => void;      // error de cámara
  statusText?: string;                       // texto barra inferior en SEARCHING
  successText?: string;                      // mensaje en pantalla de éxito (default: "Código leído correctamente")
  formats?: string[];                        // default: ['qr_code']
  validate?: (rawValue: string) => QrValidateResult; // si no se pasa, siempre success
}
```

### Prop `validate`
Función **síncrona** que recibe el valor raw y decide si es válido. Si falla → pantalla RESULT fail con el mensaje devuelto. Si no se proporciona → siempre success.

---

## Uso por contexto

| Contexto | `formats` | `validate` | `statusText` | `successText` |
|---|---|---|---|---|
| Almacén → localizar palet | `['qr_code']` | ✅ `validatePalletQr` | "Apunta al QR del palet" | "Palet localizado" |
| Almacén detalle → localizar palet | `['qr_code']` | ✅ `validatePalletQr` | "Apunta al QR del palet" | "Palet localizado" |
| Palets → añadir caja | `['qr_code']` | — | "Apunta al código GS1-128 de la caja" | "Caja registrada" |
| Palets → eliminar caja | `['qr_code']` | — | "Apunta al código GS1-128 de la caja a eliminar" | "Código leído" |
| Autoventa → añadir caja | `['code_128','qr_code']` | ✅ `validateGs1128` | "Apunta al código de la caja" | "Caja añadida" |

---

## Componentes eliminados

| Archivo eliminado | Reemplazado por |
|---|---|
| `src/components/Comercial/Autoventa/Step2CameraScanner.js` | `QrScannerWidget` |
| `src/components/Admin/Stores/Mobile/MobilePalletQrScanner.tsx` | `QrScannerWidget` |
| `src/components/Comercial/Autoventa/Step2QRScan/index.js` | `Step2QRScan/index.tsx` (migrado a TS) |

---

## Animaciones CSS (`src/app/globals.css`)

```css
@keyframes qr-scan-line   { 0%→100%: traversal top 11%→89%, fade in/out }
@keyframes qr-shimmer     { shimmer horizontal en el botón "Leer" }
@keyframes qr-result-in   { fade in del overlay de resultado }
@keyframes qr-result-scale { scale+translateY del QR card en resultado }
@keyframes qr-badge-pop   { pop del badge checkmark/X }
```

---

## Archivos relacionados

- `src/lib/scannerSound.ts` — síntesis de sonido + vibración
- `src/lib/qr/parseQrPayload.ts` — parser de payloads QR internos
- `src/lib/gs1128Parser.js` — parser de códigos GS1-128 de cajas
- `docs/73-sistema-payloads-qr.md` — especificación del formato de payload QR
