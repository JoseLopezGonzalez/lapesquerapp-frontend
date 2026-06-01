# Skill: Caveman

## Categoría
Optimización de tokens

## Cuándo se activa

Cuando el usuario dice: "caveman", "comprime esto", "modo caverna", "hazlo más corto", "menos palabras", "compress", "caveman mode", "acorta", "resumelo al máximo".

También útil antes de pegar contexto grande en un prompt — comprimir primero para caber en el contexto.

---

## Qué hace

Reduce cualquier texto al mínimo absoluto de tokens preservando el significado. Sin sutileza — elimina todo lo que no sea esencial. Como hablaría un cavernícola: sustantivos, verbos, datos. Nada más.

No analiza estratégicamente qué cortar (eso es Token Optimizer). Simplemente corta.

---

## Reglas de compresión

```
ELIMINAR siempre:
- Artículos: el, la, los, las, un, una, the, a, an
- Conectores de relleno: "también", "además", "asimismo", "por otro lado"
- Frases de contexto innecesarias: "en este caso", "como mencioné antes", "cabe destacar"
- Redundancias: si ya se dijo, no repetir
- Hedging: "podría", "quizás", "en principio", "generalmente"
- Saludos y cierres
- Cualquier frase que no añada información nueva

MANTENER siempre:
- Nombres propios, entidades, IDs
- Verbos de acción
- Números y valores concretos
- Condiciones y restricciones
- Lo que cambia el significado si se quita
```

---

## Proceso

1. Leer el texto completo
2. Identificar la información core (qué, quién, cuándo, por qué, restricciones)
3. Reescribir en forma mínima
4. Verificar que el significado se preserva
5. Si el resultado es ambiguo, añadir la mínima palabra que lo clarifique

---

## Ejemplos

### Prompt largo → caveman

```
ORIGINAL (47 tokens):
"Necesito que revises este componente de React que hemos creado para 
gestionar el listado de pedidos. Hay un problema con la paginación que 
no funciona correctamente cuando se aplican filtros al mismo tiempo."

CAVEMAN (14 tokens):
"Revisar componente listado pedidos. Bug: paginación + filtros juntos falla."
```

### Documentación → caveman

```
ORIGINAL (52 tokens):
"Es importante que recuerdes que en este proyecto nunca debes usar fetch() 
directamente. Todo el tráfico HTTP debe pasar a través de fetchWithTenant, 
que se encarga automáticamente de añadir el header X-Tenant y el token 
de autorización."

CAVEMAN (15 tokens):
"No fetch() directo. Usar fetchWithTenant. Añade X-Tenant + auth token solo."
```

### Error de usuario → caveman (para contexto de debug)

```
ORIGINAL (38 tokens):
"Cuando el usuario hace clic en el botón de guardar después de haber 
modificado los datos del cliente, la aplicación muestra un error 500 
en la consola pero el formulario no muestra ningún mensaje de error."

CAVEMAN (13 tokens):
"Guardar cliente → error 500 consola. UI no muestra error. Formulario mudo."
```

---

## Output

Solo el texto comprimido. Sin explicaciones, sin "aquí tienes la versión comprimida". 

Si el input tiene partes con distinta importancia, caveman puede marcar secciones:
```
[CORE] Lo que no se puede quitar
[CONTEXT] Lo que ayuda pero no es crítico
[DROP] Lo que se puede eliminar
```
