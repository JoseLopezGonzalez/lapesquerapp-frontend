# Análisis de los 21 patrones ReUI Sonner

## Contexto

Este documento recopila y analiza los **21 patrones de Sonner** publicados por ReUI en la página:

- https://reui.io/patterns/sonner

La intención no es copiar masivamente código de terceros, sino dejar una **referencia interna útil para Brisapp**: qué enseña cada patrón, qué capacidad real de Sonner demuestra y cómo encaja o no con nuestro sistema de notificaciones basado en `notify`.

Este análisis se apoya en la variante `radix` del registry de ReUI, que es la más alineada con nuestra base actual (`radix-nova` en `components.json`).

## Fuente externa analizada

- Página: `https://reui.io/patterns/sonner`
- Serie fuente: `registry-reui/bases/radix/patterns/sonner/p-sonner-1.tsx` a `p-sonner-21.tsx`
- Referencias internas relacionadas:
  - [22-sistema-notificaciones-toast.md](/home/jose/brisapp-nextjs/docs/22-sistema-notificaciones-toast.md)
  - [23-migracion-sileo-a-reui-sonner.md](/home/jose/brisapp-nextjs/docs/23-migracion-sileo-a-reui-sonner.md)
  - [estandar-contenido-toasts.md](/home/jose/brisapp-nextjs/docs/estandar-contenido-toasts.md)

## Tabla resumen

| #   | Descripción original                        | Capacidad principal                           | Interés Brisapp | Enlace fuente                                                                                                         |
| --- | ------------------------------------------- | --------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | Basic toast notification                    | Toast básico con mensaje simple               | Medio           | [p-sonner-1](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-1.tsx)   |
| 2   | Toast notification with description         | Toast con descripción secundaria              | Alto            | [p-sonner-2](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-2.tsx)   |
| 3   | Toast positions                             | Posicionamiento por toast                     | Bajo            | [p-sonner-3](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-3.tsx)   |
| 4   | Toast variants with colored icons           | Variantes semánticas e iconos                 | Alto            | [p-sonner-4](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-4.tsx)   |
| 5   | Toast duration options                      | Duración y persistencia                       | Alto            | [p-sonner-5](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-5.tsx)   |
| 6   | Toast with action button                    | Acción principal tipo undo                    | Alto            | [p-sonner-6](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-6.tsx)   |
| 7   | Promise toast with loading state            | Flujo async loading -> success/error          | Muy alto        | [p-sonner-7](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-7.tsx)   |
| 8   | Toast with custom close and cancel buttons  | Confirmación con CTA y cancelación            | Alto            | [p-sonner-8](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-8.tsx)   |
| 9   | Toast with custom rich content              | Toast totalmente custom con avatar y CTAs     | Medio           | [p-sonner-9](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-9.tsx)   |
| 10  | Toast with upload progress simulation       | Progreso visual actualizable                  | Muy alto        | [p-sonner-10](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-10.tsx) |
| 11  | Toast with status alert markup              | Estado operativo rico                         | Medio           | [p-sonner-11](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-11.tsx) |
| 12  | Custom accent border toast                  | Styling con borde de acento                   | Medio           | [p-sonner-12](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-12.tsx) |
| 13  | Custom invert success toast                 | Toast invertido de éxito                      | Bajo            | [p-sonner-13](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-13.tsx) |
| 14  | Custom invert error toast with details      | Error rico con detalle técnico                | Alto            | [p-sonner-14](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-14.tsx) |
| 15  | Custom invert info toast with avatar        | Invitación/colaboración con avatar            | Bajo            | [p-sonner-15](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-15.tsx) |
| 16  | Custom invert warning toast with countdown  | Warning temporal con acción correctiva        | Alto            | [p-sonner-16](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-16.tsx) |
| 17  | Multi-action invert toast with avatar group | Workflow colaborativo con múltiples acciones  | Medio           | [p-sonner-17](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-17.tsx) |
| 18  | Toast with close button on top-right        | Reubicación del botón de cierre               | Bajo            | [p-sonner-18](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-18.tsx) |
| 19  | Toast with custom icon                      | Icono custom por caso de uso                  | Medio           | [p-sonner-19](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-19.tsx) |
| 20  | Custom integration toast                    | Integración conectada con estado y acciones   | Medio           | [p-sonner-20](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-20.tsx) |
| 21  | Updatable toast with ID                     | Actualización manual del mismo toast por `id` | Muy alto        | [p-sonner-21](https://github.com/keenthemes/reui/blob/main/registry-reui/bases/radix/patterns/sonner/p-sonner-21.tsx) |

## Patrones analizados

### Patrón 1

- **Orden**: 1
- **Nombre corto**: Basic toast notification
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-1.tsx`
- **Qué hace**: dispara un toast mínimo con un único mensaje, sin descripción ni controles adicionales.
- **Cómo dispara el toast**: `onClick={() => toast("Event has been created")}` desde un botón.
- **Qué componentes/UI usa**: `toast` de `sonner` y `Button`.
- **Qué variante o capacidad de Sonner demuestra**: caso base de `toast(message)`.
- **Notas de integración para nuestro sistema notify**: equivale al uso más simple de `notify.success/info` cuando solo hay título y no hace falta `description`.
- **Encaje en Brisapp**:
  - confirmaciones muy breves como "Sesión cerrada"
  - avisos informativos como "Sin cambios"
  - feedback simple de interacción no crítica

### Patrón 2

- **Orden**: 2
- **Nombre corto**: Toast notification with description
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-2.tsx`
- **Qué hace**: añade una segunda línea descriptiva para dar contexto adicional al toast.
- **Cómo dispara el toast**: `toast("Event has been created", { description: "..." })`.
- **Qué componentes/UI usa**: `toast` de `sonner` y `Button`.
- **Qué variante o capacidad de Sonner demuestra**: soporte de `description`.
- **Notas de integración para nuestro sistema notify**: encaja de forma directa con `NotifyMessage = { title, description }`, que es justo el estándar recomendado en el proyecto.
- **Encaje en Brisapp**:
  - éxito con detalle cuantitativo
  - error con explicación breve
  - feedback de guardado con siguiente paso

### Patrón 3

- **Orden**: 3
- **Nombre corto**: Toast positions
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-3.tsx`
- **Qué hace**: muestra las seis posiciones soportadas por Sonner en botones separados.
- **Cómo dispara el toast**: `toast(..., { position: "top-left" | ... })`.
- **Qué componentes/UI usa**: `toast` de `sonner`, varios `Button`.
- **Qué variante o capacidad de Sonner demuestra**: override de `position` por toast.
- **Notas de integración para nuestro sistema notify**: nuestra app ya tiene `top-center` como default; este patrón sirve más como referencia técnica que como recomendación de UX para uso diario.
- **Encaje en Brisapp**:
  - depuración puntual
  - experiencias aisladas muy específicas
  - no recomendable como patrón general del producto

### Patrón 4

- **Orden**: 4
- **Nombre corto**: Toast variants with colored icons
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-4.tsx`
- **Qué hace**: enseña `default`, `success`, `error`, `warning`, `info` y `loading`, con iconos coloreados por variante.
- **Cómo dispara el toast**: `toast.success/error/warning/info/loading(...)`.
- **Qué componentes/UI usa**: `toast` de `sonner`, `Button`.
- **Qué variante o capacidad de Sonner demuestra**: variantes semánticas y `classNames.icon`.
- **Notas de integración para nuestro sistema notify**: es la referencia más directa para validar que `notify.success/error/warning/info/loading` cubre el modelo base esperado.
- **Encaje en Brisapp**:
  - errores de fetch
  - confirmaciones de guardado
  - advertencias operativas

### Patrón 5

- **Orden**: 5
- **Nombre corto**: Toast duration options
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-5.tsx`
- **Qué hace**: compara duraciones de 2s, 5s, 10s y un toast persistente con `duration: Infinity`.
- **Cómo dispara el toast**: `toast(..., { duration })`.
- **Qué componentes/UI usa**: `toast` de `sonner`, `Button`.
- **Qué variante o capacidad de Sonner demuestra**: control fino de vida útil y persistencia.
- **Notas de integración para nuestro sistema notify**: encaja con nuestras duraciones por defecto y con `important: true` o `duration: null` cuando el toast no debe desaparecer solo.
- **Encaje en Brisapp**:
  - errores importantes que deben poder leerse completos
  - feedback corto de confirmación
  - estados que requieren cierre manual

### Patrón 6

- **Orden**: 6
- **Nombre corto**: Toast with action button
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-6.tsx`
- **Qué hace**: añade una acción principal tipo "Undo" tras una operación.
- **Cómo dispara el toast**: `toast("...", { action: { label, onClick } })`.
- **Qué componentes/UI usa**: `toast` de `sonner`, `Button`.
- **Qué variante o capacidad de Sonner demuestra**: CTA embebido en el toast.
- **Notas de integración para nuestro sistema notify**: encaja con `notify.action`, aunque nuestro wrapper hoy lo canaliza como warning con acción y cierre controlado.
- **Encaje en Brisapp**:
  - deshacer archivado o eliminación lógica
  - reintentar una acción
  - extender sesión o continuar un flujo

### Patrón 7

- **Orden**: 7
- **Nombre corto**: Promise toast with loading state
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-7.tsx`
- **Qué hace**: usa `toast.promise()` para mostrar `loading`, `success` y `error` desde una promesa.
- **Cómo dispara el toast**: `toast.promise(new Promise(...), { loading, success, error })`.
- **Qué componentes/UI usa**: `toast` de `sonner`, `Button`.
- **Qué variante o capacidad de Sonner demuestra**: patrón async declarativo.
- **Notas de integración para nuestro sistema notify**: es la referencia clave para `notify.promise`; valida el caso canónico que más usamos en mutaciones, exportaciones y submits.
- **Encaje en Brisapp**:
  - exportaciones
  - creación/edición de entidades
  - acciones async del CRM, rutas y almacén

### Patrón 8

- **Orden**: 8
- **Nombre corto**: Toast with custom close and cancel buttons
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-8.tsx`
- **Qué hace**: combina acción principal destructiva con cancelación explícita.
- **Cómo dispara el toast**: `toast("...", { action, cancel })`.
- **Qué componentes/UI usa**: `toast` de `sonner`, `Button`.
- **Qué variante o capacidad de Sonner demuestra**: doble CTA dentro del toast.
- **Notas de integración para nuestro sistema notify**: útil como inspiración, pero más delicado para UX; en Brisapp probablemente convenga reservarlo para acciones muy concretas y no sustituir dialogs reales.
- **Encaje en Brisapp**:
  - confirmación ligera de una acción reversible
  - cancelación rápida en procesos no críticos
  - menos recomendable para borrados verdaderamente peligrosos

### Patrón 9

- **Orden**: 9
- **Nombre corto**: Toast with custom rich content
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-9.tsx`
- **Qué hace**: usa `toast.custom()` para renderizar una tarjeta rica con avatar, texto y botones.
- **Cómo dispara el toast**: `toast.custom(() => <div>...</div>)`.
- **Qué componentes/UI usa**: `Avatar`, `Button`, layout custom.
- **Qué variante o capacidad de Sonner demuestra**: contenido completamente personalizado.
- **Notas de integración para nuestro sistema notify**: hoy `notify` no expone una API genérica de render custom; este patrón serviría solo si en el futuro decidimos abrir una variante avanzada o un canal interno separado.
- **Encaje en Brisapp**:
  - mensajes de colaboración o invitaciones
  - eventos sociales o conversacionales
  - bajo encaje para el núcleo operativo actual

### Patrón 10

- **Orden**: 10
- **Nombre corto**: Toast with upload progress simulation
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-10.tsx`
- **Qué hace**: simula un upload y actualiza un mismo toast custom con barra de progreso.
- **Cómo dispara el toast**: `toast.custom(..., { id, duration })` reutilizando el mismo `id`.
- **Qué componentes/UI usa**: `Button`, `Progress`, `IconPlaceholder`, `useRef`.
- **Qué variante o capacidad de Sonner demuestra**: actualización incremental y progreso visual.
- **Notas de integración para nuestro sistema notify**: es una referencia muy importante para ampliar `notify` cuando haya procesos largos con progreso real; enlaza directamente con nuestra introducción de actualización por `id`.
- **Encaje en Brisapp**:
  - subidas de ficheros
  - importaciones masivas
  - exportaciones o tareas largas con porcentaje real

### Patrón 11

- **Orden**: 11
- **Nombre corto**: Toast with status alert markup
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-11.tsx`
- **Qué hace**: presenta un toast de despliegue exitoso con pequeños pares clave-valor y CTAs.
- **Cómo dispara el toast**: `toast.custom(() => <div>...</div>)`.
- **Qué componentes/UI usa**: `Button`, `IconPlaceholder`, layout tipo status panel.
- **Qué variante o capacidad de Sonner demuestra**: toast con markup de estado operativo, más cercano a una mini tarjeta.
- **Notas de integración para nuestro sistema notify**: interesante para operaciones técnicas o de superadmin, pero puede ser excesivo para flujos corrientes del producto.
- **Encaje en Brisapp**:
  - onboarding de tenant
  - migraciones o jobs
  - estados de integración o tareas del panel superadmin

### Patrón 12

- **Orden**: 12
- **Nombre corto**: Custom accent border toast
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-12.tsx`
- **Qué hace**: construye un toast custom con borde lateral de acento y acciones secundarias.
- **Cómo dispara el toast**: `toast.custom(() => <div className=\"border-l-4 ...\">...</div>)`.
- **Qué componentes/UI usa**: `Button`, `IconPlaceholder`, layout custom.
- **Qué variante o capacidad de Sonner demuestra**: personalización visual fuerte sin cambiar la semántica.
- **Notas de integración para nuestro sistema notify**: útil como inspiración visual para el skin del toaster o para futuros custom toasts, no tanto como patrón funcional nuevo.
- **Encaje en Brisapp**:
  - aviso de nueva versión
  - alertas informativas persistentes y no críticas
  - upgrades o mejoras disponibles

### Patrón 13

- **Orden**: 13
- **Nombre corto**: Custom invert success toast
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-13.tsx`
- **Qué hace**: crea un toast invertido de éxito, oscuro y con CTA secundario.
- **Cómo dispara el toast**: `toast.custom(() => <div className=\"bg-invert ...\">...</div>)`.
- **Qué componentes/UI usa**: `Button`, `IconPlaceholder`.
- **Qué variante o capacidad de Sonner demuestra**: inversión visual completa del toast.
- **Notas de integración para nuestro sistema notify**: es sobre todo una decisión estética; no añade capacidad funcional nueva respecto a `notify.success`.
- **Encaje en Brisapp**:
  - éxito de pago o cobro
  - confirmaciones destacadas en contextos premium
  - interés bajo para el flujo operativo estándar

### Patrón 14

- **Orden**: 14
- **Nombre corto**: Custom invert error toast with details
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-14.tsx`
- **Qué hace**: muestra un error rico con resumen, separador, líneas técnicas y acción de retry.
- **Cómo dispara el toast**: `toast.custom(() => <div>...</div>)`.
- **Qué componentes/UI usa**: `Button`, `Separator`, `IconPlaceholder`.
- **Qué variante o capacidad de Sonner demuestra**: error complejo con detalle técnico embebido.
- **Notas de integración para nuestro sistema notify**: útil para áreas técnicas o de jobs, pero hay que evitar meter demasiado texto o trazas en toasts normales de usuario.
- **Encaje en Brisapp**:
  - fallos de migración o sincronización
  - errores batch con pocos items
  - monitorización de tareas técnicas en superadmin

### Patrón 15

- **Orden**: 15
- **Nombre corto**: Custom invert info toast with avatar
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-15.tsx`
- **Qué hace**: representa una invitación a colaborar con avatar y acciones de aceptar/declinar.
- **Cómo dispara el toast**: `toast.custom(() => <div>...</div>)`.
- **Qué componentes/UI usa**: `Avatar`, `Button`.
- **Qué variante o capacidad de Sonner demuestra**: notificación social enriquecida.
- **Notas de integración para nuestro sistema notify**: hoy tiene poco encaje en la app, salvo que aparezcan módulos colaborativos o invitaciones operativas.
- **Encaje en Brisapp**:
  - invitaciones de usuarios o accesos
  - avisos de colaboración en CRM
  - poco prioritario ahora mismo

### Patrón 16

- **Orden**: 16
- **Nombre corto**: Custom invert warning toast with countdown
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-16.tsx`
- **Qué hace**: avisa de expiración de sesión con CTA para extenderla y duración larga.
- **Cómo dispara el toast**: `toast.custom(..., { duration: 10000 })`, y la acción dispara `toast.success("Session extended")`.
- **Qué componentes/UI usa**: `Button`, `IconPlaceholder`.
- **Qué variante o capacidad de Sonner demuestra**: warning operativo temporal con acción correctiva inmediata.
- **Notas de integración para nuestro sistema notify**: es uno de los patrones más alineados con flujos reales de auth y sesión, aunque en algunos casos compite con pantallas de transición o banners persistentes.
- **Encaje en Brisapp**:
  - sesión a punto de expirar
  - token o credencial próxima a caducar
  - bloqueos temporales que el usuario puede resolver

### Patrón 17

- **Orden**: 17
- **Nombre corto**: Multi-action invert toast with avatar group
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-17.tsx`
- **Qué hace**: renderiza un toast de aprobación de PR con grupo de avatares y dos acciones.
- **Cómo dispara el toast**: `toast.custom(() => <div>...</div>)`, con `View` y `Merge`.
- **Qué componentes/UI usa**: `Avatar`, `Button`, `Separator`.
- **Qué variante o capacidad de Sonner demuestra**: toast muy rico, multiacción y con contexto colaborativo.
- **Notas de integración para nuestro sistema notify**: funcionalmente es más una micro tarjeta accionable que un toast clásico; conviene tratarlo como referencia conceptual, no como patrón a replicar tal cual.
- **Encaje en Brisapp**:
  - aprobaciones internas si surgieran
  - revisiones o tareas grupales
  - poca prioridad en el producto actual

### Patrón 18

- **Orden**: 18
- **Nombre corto**: Toast with close button on top-right
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-18.tsx`
- **Qué hace**: activa `closeButton` y recoloca visualmente el botón de cierre con `classNames`.
- **Cómo dispara el toast**: `toast("...", { closeButton: true, classNames: { closeButton: ... } })`.
- **Qué componentes/UI usa**: `Button`.
- **Qué variante o capacidad de Sonner demuestra**: ajuste fino del botón de cierre.
- **Notas de integración para nuestro sistema notify**: es un detalle de skin del toaster; útil para temas visuales, no para ampliar la API funcional.
- **Encaje en Brisapp**:
  - refinado visual del toaster
  - toasts persistentes con cierre claro
  - bajo valor como patrón de negocio

### Patrón 19

- **Orden**: 19
- **Nombre corto**: Toast with custom icon
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-19.tsx`
- **Qué hace**: permite usar un icono específico según el caso de uso, más allá de la variante semántica.
- **Cómo dispara el toast**: `toast("...", { icon: <IconPlaceholder ... /> })`.
- **Qué componentes/UI usa**: `Button`, `IconPlaceholder`.
- **Qué variante o capacidad de Sonner demuestra**: iconografía contextual custom.
- **Notas de integración para nuestro sistema notify**: interesante si en el futuro queremos iconos por dominio, pero hoy `notify` no lo necesita como capacidad pública principal.
- **Encaje en Brisapp**:
  - enviar, descargar, marcar favorito
  - acciones documentales o de exportación
  - mejora visual opcional, no prioritaria

### Patrón 20

- **Orden**: 20
- **Nombre corto**: Custom integration toast
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-20.tsx`
- **Qué hace**: muestra una integración conectada con estado, host, última sincronización y acciones.
- **Cómo dispara el toast**: `toast.custom(() => <div>...</div>)`.
- **Qué componentes/UI usa**: `Button`, `Separator`, `IconPlaceholder`.
- **Qué variante o capacidad de Sonner demuestra**: toast tipo integration card con estado.
- **Notas de integración para nuestro sistema notify**: encaja conceptualmente con superadmin e integraciones, pero probablemente sería mejor como panel persistente si el estado debe consultarse varias veces.
- **Encaje en Brisapp**:
  - integraciones externas
  - conexión de canales o servicios
  - notificaciones de sincronización recién completada

### Patrón 21

- **Orden**: 21
- **Nombre corto**: Updatable toast with ID
- **Archivo fuente ReUI**: `registry-reui/bases/radix/patterns/sonner/p-sonner-21.tsx`
- **Qué hace**: crea un toast custom con un `id` persistente y lo actualiza varias veces hasta cerrar con éxito final.
- **Cómo dispara el toast**: `toast.custom(..., { duration: Infinity })` y luego varias llamadas `toast.custom(..., { id: toastId.current })`.
- **Qué componentes/UI usa**: `Button`, `Spinner`, `IconPlaceholder`, `useRef`.
- **Qué variante o capacidad de Sonner demuestra**: actualización manual explícita del mismo toast por `id`.
- **Notas de integración para nuestro sistema notify**: es la referencia más directa para nuestra decisión de soportar actualización por `id`; junto con el patrón 10 es el patrón más importante para la evolución del wrapper.
- **Encaje en Brisapp**:
  - subidas o exportaciones por fases
  - procesos largos con varios hitos
  - reemplazo controlado de un loading por success/error sin apilar ruido

## Observaciones transversales para Brisapp

### Patrones que encajan directamente con `notify` actual

- `2` descripción secundaria
- `4` variantes semánticas
- `5` control de duración
- `6` acción principal
- `7` promesas
- `21` actualización por `id`

Estos son los que mejor validan el contrato actual de nuestro sistema de notificaciones.

### Patrones que justificarían ampliar `notify`

- `8` soporte más explícito para `cancel`
- `10` progreso visual con porcentaje
- `19` icono custom por caso de uso
- `9`, `11`, `12`, `14`, `20` si alguna vez queremos una API de `custom toast` controlada

Si se amplían, conviene hacerlo sin romper la regla de arquitectura: seguir disparando todo desde `notify`, no desde `toast` directo.

### Patrones más visuales o demo que probablemente no convenga replicar tal cual

- `13`, `15`, `17`, `18`

Son útiles para inspiración visual, pero tienen menos valor operativo inmediato para Brisapp.

### Qué enseñan en conjunto

- ReUI usa Sonner no solo para toasts cortos, sino también como **contenedor de microestados ricos**.
- Los patrones realmente más valiosos para nuestro proyecto no son los más vistosos, sino los que resuelven:
  - promesas
  - actualización por `id`
  - persistencia controlada
  - CTA simple
  - progreso
- En Brisapp hay que vigilar no convertir el toast en sustituto de:
  - validación inline
  - dialogs bloqueantes
  - pantallas de transición
  - paneles persistentes de estado

## Conclusión práctica

Si hubiera que priorizar qué patrones de ReUI Sonner estudiar primero para siguientes iteraciones del sistema, el orden más útil para Brisapp sería:

1. `p-sonner-7` para `notify.promise`
2. `p-sonner-21` para actualización por `id`
3. `p-sonner-10` para progreso
4. `p-sonner-6` y `p-sonner-8` para acciones
5. `p-sonner-4` y `p-sonner-5` para semántica y duración

El resto sirven sobre todo como catálogo visual y como referencia de hasta dónde puede escalar Sonner si más adelante el producto necesita notificaciones mucho más ricas.
