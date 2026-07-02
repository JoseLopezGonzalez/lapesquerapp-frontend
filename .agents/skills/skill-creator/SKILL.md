---
name: skill-creator
description: >
  Guides creation of new project skills and writes SKILL.md files in the project skill format.
---

# Skill: Skill Creator

## Categoría

Meta / Creación

## Cuándo se activa

Cuando el usuario dice: "crea una skill", "nueva skill", "make a skill", "necesito una skill para X", "skill creator", "quiero una skill que haga X", "añade una skill".

---

## Qué hace

Guía a Jose a través del diseño de una nueva skill y la crea como archivo `SKILL.md` en `.claude/skills/[nombre]/SKILL.md`. Hace las preguntas correctas para que la skill sea útil, bien definida y consistente con las demás del proyecto.

---

## Proceso

### 1. Entender qué se necesita

Preguntas obligatorias antes de escribir nada:

```
a) ¿Qué hace esta skill en una frase?
   ("Convierte código a X", "Genera Y", "Revisa Z")

b) ¿Cuándo se activa? ¿Qué dice el usuario para invocarla?
   (palabras clave, frases, contextos)

c) ¿Qué produce? ¿Cuál es el output exacto?
   (texto, código, archivo, diagrama, análisis, etc.)

d) ¿Es específica de PesquerApp o es general?
   (si es específica: ¿qué módulo? ¿qué patrones usa?)

e) ¿Hay alguna skill similar ya?
   (revisar .claude/skills/ antes de crear duplicados)
```

Solo hacer 2-3 preguntas a la vez, no un interrogatorio.

### 2. Proponer nombre y categoría

Categorías disponibles:

- **Escritura** — generación o transformación de texto
- **Desarrollo** — ayuda con código del proyecto
- **Descubrimiento** — exploración del proyecto o capacidades
- **Optimización de tokens** — reducción de contexto/prompts
- **Visualización** — diagramas, esquemas, renders
- **Meta / Creación** — skills sobre skills, configuración
- **Análisis** — auditorías, reviews, diagnósticos
- **Flujo de trabajo** — procesos multi-paso (como GAP workflow)

Nombre: lowercase, guiones, descriptivo. Ejemplos: `sql-generator`, `api-mock`, `changelog-writer`.

### 3. Diseñar la estructura de la skill

Template interno que usa Skill Creator:

```markdown
# Skill: [Nombre]

## Categoría

[Categoría]

## Cuándo se activa

[Frases exactas o contextos que disparan la skill]

## Qué hace

[Descripción clara en 2-4 líneas]

## Proceso

[Pasos concretos — qué hace el agente cuando se invoca]

## Output

[Formato exacto del resultado]

## Ejemplos

[Opcional — si ayuda a entender la skill]
```

### 4. Escribir el archivo

Ruta: `.claude/skills/[nombre-en-kebab-case]/SKILL.md`

### 5. Confirmar con Jose

Mostrar el archivo creado y preguntar:

- ¿El "cuándo se activa" captura los casos de uso que tenías en mente?
- ¿El output es lo que esperabas?
- ¿Falta algo?

### 6. Verificar que el skill aparece en FindSkills

Confirmar que el archivo existe en la ruta correcta. FindSkills lo detectará automáticamente la próxima vez que se invoque.

---

## Restricciones

- **No crear skills duplicadas** — siempre revisar `.claude/skills/` antes de empezar
- **No crear skills demasiado genéricas** — una skill que "hace todo" no activa bien
- **Un archivo por skill** — todo en el `SKILL.md`, no crear archivos auxiliares
- **Skills de PesquerApp** usan los patrones del proyecto — si la skill genera código, debe seguir `.claude/rules/`

---

## Ejemplo de sesión

```
Jose: "Crea una skill para generar changelogs a partir de los commits de git"

Skill Creator:
"Antes de crearla, dos preguntas:
1. ¿El changelog es para el usuario final (CHANGELOG.md en el repo) o
   para comunicación interna (Slack, Notion)?
2. ¿Quieres que la skill lea los commits automáticamente con git log,
   o le pegas tú el listado de commits?"

Jose: "Para el CHANGELOG.md del repo, y que lea los commits sola"

Skill Creator:
"Perfecto. La skill se llamará `changelog-writer`, categoría Escritura.
[Escribe el SKILL.md y lo muestra]
¿El formato de output es lo que esperabas?"
```
