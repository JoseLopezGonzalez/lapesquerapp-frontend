Activar accion para tecla enter en los logins tanto de tenants como de admin y que funcionen como el boton.

Además de enfocar directamente el campo otp para que el usuario meta el codigo directamente sin tener que pulsar sobre el primer input.

Ya en el dashboard quiero incluir el la info del card de otros inportes en el card de importe de ventas pero en un tooltip o algo asi o dentro del tooltip que ya hay y suprimir el card dedicado solo aa eso. Ademñas elimina el boton incluir - excluir auxiliares. (No funciona correctamente y no merece ese tipo de interfaz.)

Ya en el gestor de pedidos en desktop version, el scrollable con el listado de pedidos tiene fade (efecto que me encanta ) pero ya sin scrollear el fade tapa parcialmente al primer elemento de la lista.

Noto en los dropdowns nativos de shadcn que automaticamente opciones que tengan dos palabras o mas se dividen en varias lineas, cuando creo que de manera oficial no lo hace, será que hemos tocado el componente base?

---

Te paso varios fixes, mejoras, bugs ... que estoy viendo asi rtapidamente haciendo una navegacion de prueba. Soluciona los que puedas al instante y crea gaps para los que creas más complejos.


---



En el card de rentabilidad dentro del tab informacion en el editor de pedido suprime todo lo que sean lineas tipicas de ia o textos que diga sin tal o sin cual por numeros cuando esté empty los campos. Aplica esto de no usar lineas de ias tipicas en nuestro claude context en el proyecto para evitarlo a futuro o corregirlo segun nos los encontremos. Haz lo mismo con los cards y su tabla del tab de Análisis del mismo apartado, aprovecha tb para eliminar los iconos de esos cards de ese subapartado, no aportan nada y ensucian el diseño. ( o bien usa numeros como 0 o 0,00 o algo asi o usa lineas normales "-" no las típicas de IA.

En el apartado palets del editor de pedidos existe la posibilidad de seleccionar palets pero parece que la unica opcion posible al seleccionar es imprimir las etiquetas de expedición , deberiamos de poder hacer más cosas, todas las que se puedan hacer en comun, revisa esa ui para mejorarla y justo cuando se seleccionen palets que desaparezcan acciones que no corresponden y que se queden de algun modo visible las que cumplan con ese objetivo


Noto que en el apartado de envio de documentos del mismo editor de pedidos, enb el apartado de envio a multiples destinaterios los seleccionables parecen que no cumplen con shadcn nativo por sus curvas o sus colores al seleccionarse.

En el apartado de descargas del editor de pedidos , en las descargas rapidas necesito que el listado sea scrollable para no hacer overflow vertical y que se siga viendo el card completo y el boton de descargar todo.

En el apartado adjuntos necesito que cuando esta empty ese mismo empty sea receptor de archivos arrastrados al notar que llevamos arrastrado archivos, debe ser asi este empty y cuando haya ya algo adjunto tb.


---

El gestor de almacenes en desktop version al cargarse solo aparece el loader arriba y no está centrado verticalmente con toda la altura de la pantalla.

Necesito que en el gestor de almacenes hagamos que los cards del listado de almacenes aparezcan con apariencia como las del listado de pedidos en el orders managers, me refiero a quitarle el borde derecho de color, y a hacer que cuando se seleccionen tenga todo el borde del color simplemente. Ademas el listado deberia de no verse la barra scrol y tener fade como lo tiene la de gestor de pedidos.

Ahora una vez dentro de un almacen necesito que el filtro o el card del filtro se muestre y oculte pulsando en un boton de filtro para dejar mas espacio al mapa , con una transición acorde a nuestro proyecto.
