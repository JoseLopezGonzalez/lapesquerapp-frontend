# Cuestionario de validación de implementación frontend

> Documento de contraste centrado solo en frontend UI/UX para validar si la implementación visual y funcional descrita en [73-modelo-logico-comercial-reparto-autoventa.md](/home/jose/brisapp-nextjs/docs/to%20do/73-modelo-logico-comercial-reparto-autoventa.md) coincide con la experiencia que realmente tienes en mente.

## 1. Objetivo

Este cuestionario no vuelve a discutir la lógica de negocio ni el backend.

La lógica general, los actores y el contrato backend ya se dan por afinados.

Aquí solo queremos comprobar si el **frontend** planteado encaja en:

- estructura de pantallas
- navegación
- densidad de información
- experiencia móvil vs escritorio
- uso del mapa
- interacción de rutas
- acciones rápidas del repartidor
- encaje con layouts y `shadcn/ui`

## 2. Cómo responder

Lo ideal es responder cada punto con una de estas fórmulas:

- `Sí`
- `No`
- `Sí, pero...`
- `No, debería ser...`

Si varias respuestas son `No` o `Sí, pero cambia bastante`, entonces habrá que ajustar la parte frontend del documento principal antes de diseñar o implementar.

## 3. Preguntas sobre estructura general del frontend

### 3.1. Separación de superficies

1. ¿Te encaja que en frontend se perciban dos superficies distintas:
  - una más de planificación/comercial
  - otra más de ejecución/calle
  - Claro tiene que haber una vista para comercial tal como la que tenemos ahora pero sin la autoventa y añadiendo todo lo que queremos implementar y luego para el repartidor una vista con la autoventa y con el relleno de pedidos prefijados, las rutas.. pero sin lo demas del comercial (la parte CRM)
2. ¿Quieres que esa diferencia se note visualmente en la navegación y la estructura de pantallas, o te basta con que cambie el contenido interno?
3. El layout debe ser el mismo para toda la app, lo que cambiaran seran los apartados que ven o acceden , hay que mantener el mismo ui en toda la app con shadcn nativo
4. ¿Te parece bien que, aunque algunas piezas convivan temporalmente bajo el layout actual, la experiencia del repartidor ya se diseñe como algo claramente distinto al CRM?
  1. Te conteste con la otra pregunta
5. ¿Esperas que la parte de rutas se sienta como un módulo propio dentro del producto, o más bien como una extensión ligera de pedidos/autoventa?
  1. Se debe sentir como un apartado mas como cualquier otro (orders manager , stores manager ...)

### 3.2. Encaje con layouts actuales

1. ¿Te parece correcto aprovechar los layouts existentes de la app y no crear un shell visual nuevo solo para rutas? Claro
2. ¿La planificación de rutas debería vivir en el universo visual actual de `/comercial`? Claro
3. ¿La ejecución de rutas debería tener una entrada claramente separada para el repartidor, aunque por debajo reutilice partes del layout actual? me parece bien
4. ¿Quieres que el acceso a rutas se note mucho en la navegación principal o prefieres una integración más discreta al principio? no te entiendo, claro que se tiene que sentir, no entiendo que dices.

## 4. Preguntas sobre estilo visual y sistema UI

1. ¿Confirmas que quieres mantener `shadcn/ui` como base principal también en este módulo? Claro e intentar respetar el shadcn nativo sin sobreescribir clases a no ser cosas puntuales.
2. ¿Te encaja que el mapa sea importante, pero que no se coma la interfaz ni rompa el lenguaje visual del producto? Ok
3. ¿Prefieres una estética sobria y funcional para rutas, o quieres que la UI tenga un punto más moderno y protagonista visualmente? moderno y protagonista
4. ¿Te parece bien que el sistema siga apoyándose en patrones ya existentes como:
  - `Card`
  - `Sheet`
  - `Dialog`
  - `Tabs`
  - `Badge`
  - `ScrollArea`
    - Si
5. ¿Quieres que la experiencia se sienta más “herramienta interna clara y rápida” o más “planner geográfico potente y vistoso”? potente y vistoso 

## 5. Preguntas sobre la pantalla de planificación de rutas

### 5.1. Composición de pantalla

1. ¿Te encaja que la vista principal de planificación sea desktop/tablet first? si
2. ¿Te parece correcta la composición propuesta:
  - lista de paradas a la izquierda
  - mapa a la derecha
  - OK
3. ¿Quieres que la lista sea el centro operativo principal y que el mapa sirva sobre todo como apoyo espacial? ok
4. ¿O prefieres un planner donde el mapa tenga más protagonismo que la lista? OK, me parece bien que haya muchas integraciones en el mapa y la lista no tenga un papel principal
5. ¿Te encaja que desde esa misma vista se pueda:
  - crear plantilla
  - crear ruta programada
  - editar ruta
  - asignar repartidor
  - ok

### 5.2. Nivel de información

1. ¿Te parece bien que cada parada en la lista muestre solo lo esencial:
  - orden
  - tipo
  - objetivo
  - etiqueta principal
  - contexto breve
  - referencia de pedido si existe
  - ok
2. ¿Quieres que la información de cada parada sea muy compacta para poder trabajar rápido con muchas paradas? ok
3. ¿O prefieres que cada parada tenga más detalle visible sin necesidad de abrir paneles o modales? no lo veo necesario
4. ¿Te encaja que la edición fina de una parada ocurra en `Dialog` o `Sheet`, y no directamente en la lista? ok, en un dialog esta bien

### 5.3. Interacción

1. ¿Te parece correcta la idea de reordenar paradas con drag & drop?  ok
2. ¿Quieres que también se puedan añadir paradas pinchando directamente sobre el mapa? ok
3. ¿Te encaja que el buscador geográfico sea pieza central de esta pantalla? ok
4. ¿Te parece importante ver el trazado de la ruta en el mapa antes de guardar o asignar?  si
5. ¿Quieres que la planificación permita trabajar bien con:
  - cliente
  - prospecto
  - zona o calle
  - OK

sin que la UI se vuelva confusa?OK

## 6. Preguntas sobre el papel del mapa en frontend

1. ¿Te encaja Mapbox como herramienta de frontend para la parte de planificación?
2. ¿El valor principal del mapa para ti está en:
  - buscar
  - ubicar
  - visualizar
  - ordenar mentalmente la ruta
3. ¿O esperas además algún comportamiento más avanzado desde la primera fase?
4. ¿Te parece bien que en Fase 1 el mapa esté muy orientado a configuración y no a navegación en tiempo real?
5. ¿Quieres que el mapa del planner sea “rico” y agradable visualmente, aunque la lógica principal siga en la lista?

## 7. Preguntas sobre la vista de ejecución del repartidor

### 7.1. Composición general

1. ¿Confirmas que esta vista debe ser claramente móvil-first? si
2. ¿Te parece correcta la composición:
  - mapa de apoyo
  - bottom sheet como centro de trabajo 
  - OK
3. ¿Quieres que el elemento principal de la vista sea la “siguiente parada” y no la ruta completa entera?  ok
4. ¿Te encaja que la ruta completa siga estando accesible, pero no ocupe el foco principal? ok

### 7.2. Densidad y simplicidad

1. ¿Confirmas que esta vista debe ser muy poco administrativa? ok
2. ¿Te encaja que el repartidor trabaje con acciones rápidas y no con formularios largos? ok
3. ¿Quieres que la interfaz reduzca al máximo textos largos, tablas y detalles secundarios? ok
4. ¿Te parece bien que desde aquí no se vea una ficha rica de cliente, aunque exista pedido asociado? claro que no se debe ver , solo lo basico del pedido.
5. ¿Te encaja que la pantalla priorice:
  - navegar
  - ver siguiente parada
  - abrir pedido
  - marcar resultado
  - abrir autoventa
  - SI

## 8. Preguntas sobre navegación externa

1. ¿Te parece correcta la estrategia de Fase 1 de abrir Google Maps o Waze desde la app?   si
2. ¿Prefieres que el botón principal sea solo Google Maps para simplificar? si
3. ¿O quieres ofrecer desde el primer momento Google Maps y Waze como opciones visibles? ambos visibles pero principal google
4. ¿Te encaja navegar parada a parada y no intentar mandar toda la ruta compleja al navegador externo? claro
5. ¿Sientes que para el uso real del repartidor eso ya resuelve bien la necesidad principal? no te entiendo
6. ¿Te parecería un problema tener que volver a vuestra app después de cada navegación, o lo ves natural dentro del flujo?  lo veo bien

## 9. Preguntas sobre acciones del repartidor en pantalla

1. ¿Te encaja que las acciones principales del repartidor sean pocas y muy visibles? si
2. ¿Cuáles sientes que deben estar siempre a mano en la pantalla principal? lo que consideres
3. ¿Te parece bien que estén siempre cerca acciones como:
  - navegar
  - abrir pedido prefijado
  - marcar resultado
  - crear autoventa
  - añadir parada
  - OK
4. ¿Te parece correcto que la creación de autoventa desde ruta se abra como flujo guiado y no como formulario abierto? claro
5. ¿Quieres que añadir una nueva parada durante la ejecución sea algo muy rápido, aunque luego el detalle sea mínimo? si

## 10. Preguntas sobre la UI del pedido operativo

1. ¿Te encaja que el pedido operativo tenga una UI distinta a la del gestor de pedidos comercial/general? vale
2. ¿Quieres que el repartidor vea solo lo necesario para servir o ajustar contenido, sin detalles comerciales accesorios? si, basate en la parte de rellenar el pedido del autoventa para inspirarte
3. ¿Te parece correcta una edición muy guiada de las líneas del pedido? si, inspirate en la autoventa, se leeran las cajas con el lector qr.
4. ¿Te encaja que el frontend trate la actualización del contenido como una operación cerrada y controlada, en vez de como edición libre tipo backoffice? claro un flujo como autoventa
5. ¿Quieres que el pedido se entienda visualmente como “previsión que el repartidor adapta”, y no como documento rígido? basate en lo que se rellena del autoventa para esto.

## 11. Preguntas sobre resultados de parada

1. ¿Te parece bien que el cierre de parada sea muy ligero? si
2. ¿Te encaja que el repartidor marque un resultado rápido en vez de rellenar formularios largos? si
3. ¿Quieres que las incidencias permitan una nota corta, pero no un reporte detallado desde móvil? si
4. ¿Te parece correcta una UI basada en botones de resultado más que en campos abiertos? si
5. ¿Quieres que el sistema intente inferir parte del resultado cuando ya sabe lo que ha ocurrido, para evitar pasos manuales? si

## 12. Preguntas sobre MVP de frontend

1. ¿Te parece correcto que el MVP incluya:
  - listado de rutas
  - creación y edición de rutas
  - mapa con buscador
  - alta de paradas
  - reordenación manual
  - vista móvil de ejecución
  - navegación externa
  - cierre ligero
  - OK
2. ¿Te parece correcto dejar fuera del MVP:
  - navegación integrada propia
  - optimización automática avanzada
  - analítica geográfica compleja
  - UI de navegación tipo GPS
  - OK
3. ¿Te encaja construir primero una experiencia muy sólida de planificación y ejecución ligera antes de intentar enriquecer el mapa? ok

## 13. Preguntas sobre realismo de uso

1. ¿La propuesta frontend te parece cómoda para alguien que planifica en oficina y para alguien que trabaja desde el coche o en calle? si
2. ¿Ves alguna pantalla propuesta demasiado densa o demasiado “de oficina” para el repartidor? no
3. ¿Ves alguna parte del planner de rutas demasiado pobre para un comercial que realmente tenga que organizar rutas de verdad? no
4. ¿Hay alguna interacción que te parezca teóricamente correcta pero poco realista en vuestro día a día? no
5. ¿Hay alguna pantalla o acción rápida que eches en falta en la propuesta frontend? no

## 14. Validación final

1. Si vieras el frontend terminado, ¿esperarías sentir una experiencia clara, rápida y diferenciada entre:
  - planificar rutas
  - ejecutar rutas
  - Si
2. ¿Te parece que el documento principal representa bien esa implementación frontend? no lo he leido al completo
3. ¿Qué 3 puntos del frontend son, para ti, los más delicados y donde más probable es que el documento no refleje exactamente lo que tienes en mente? los que tu me has ido diciendo, estoy de acuerdo

## 15. Criterio de cierre

Si la mayoría de respuestas son:

- `Sí`
- `Sí, pero con matiz pequeño`

entonces la parte frontend del documento principal está razonablemente alineada.

Si aparecen varios:

- `No`
- `No del todo`
- `Sí, pero cambia bastante`

entonces conviene ajustar primero la definición frontend antes de empezar diseño detallado o implementación.