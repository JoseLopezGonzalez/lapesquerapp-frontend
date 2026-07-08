# SKILL: design-to-code — De Claude Design a Código PesquerApp

## Propósito

Convertir una pantalla/vista diseñada en Claude Design (claude.ai/design) en una
implementación real dentro de PesquerApp: **muy, muy fiel** al diseño en
composición, jerarquía visual, copy y flujo de interacción — pero **siempre**
adaptada a nuestro stack, nuestro sistema de tokens (`design-context.md`) y
nuestras reglas (`.claude/rules/`). Nunca un copy-paste literal del HTML/CSS
generado en Claude Design.

Diseñado para ser un circuito recurrente: cada vez que Jose diga "implementa
el diseño de [vista]" o ejecute `/design-to-code [vista]`, se sigue exactamente
este mismo protocolo, para que la calidad no dependa de recordar los detalles
cada vez.

## Cuándo se activa

- Comando explícito `/design-to-code [vista] [fuente]` (implementación nueva)
  o `/design-to-code refine [vista]` (afinar una vista ya implementada)
- Jose menciona "el diseño de Claude Design", "lo que diseñé en claude.ai/design",
  "envía a Claude Code Web", o pide implementar/mejorar una vista a partir de un
  mockup que ha creado en Claude Design
- Jose pide afinar, mejorar o aumentar la fidelidad de una vista **que ya
  existe en el proyecto** respecto a un diseño de Claude Design — incluso si
  esa vista se implementó en otra sesión sin usar este circuito. Esto activa
  el **Modo REFINAR** (ver más abajo), no un cambio de UI genérico sin
  referencia — la diferencia importa porque cambia el protocolo a seguir

## Skills relacionadas que debes cargar siempre

En este orden, antes de tocar nada:

1. `.claude/design-context.md` — sistema de diseño obligatorio (colores, tipografía,
   spacing, patrones de componente — ver CLAUDE.md, lectura obligatoria para
   cualquier UI)
2. `.claude/project-learnings.md` — correcciones y patrones acumulados
3. Si la vista es mobile o va a tener capa mobile: `.claude/skills/mobile-ui/SKILL.md`
   + `.claude/skills/mobile-preview/SKILL.md`
4. Si es un CRUD genérico simple: `.claude/skills/mobile-crud-generator/SKILL.md`
   (mobile) o `.claude/skills/new-page/SKILL.md` (desktop)

---

## PASO 0 — Localizar la fuente del diseño

Un diseño de Claude Design es un bundle HTML autocontenido (imágenes, fuentes
y estilos inlined — sin backend, sin dependencias externas). Hay tres formas
de recibirlo; probar en este orden:

### A. Archivos ya sembrados en el repo ("Send to Claude Code Web")

Claude Design tiene un botón **"Send to Claude Code Web"** que siembra el
bundle directamente en el workspace de la sesión. Buscar:

```bash
find . -maxdepth 4 -iname "*.html" -newer package.json -not -path "*/node_modules/*"
git status --porcelain | grep -i -E "\.html$|design"
```

Si Jose ya dio una ruta explícita como segundo argumento del comando, usar esa
directamente sin buscar.

### B. Proyecto claude.ai/design vía la tool `DesignSync` (solo contexto LOCAL)

Si estamos en contexto LOCAL (Cursor/VS Code, filesystem accesible) y Jose ya
ha corrido `/design-login`, se puede leer el proyecto directamente:

```
DesignSync method=list_projects
DesignSync method=list_files projectId=<uuid>
DesignSync method=get_file projectId=<uuid> path=<ruta>
```

En **contexto CLOUD** esto siempre falla con `needs design-system
authorization — /design-login requires an interactive terminal`. No
reintentar ni insistir: pasar directamente a informar a Jose que use la
opción A (Send to Claude Code Web) o la C.

### C. Archivo adjuntado o enlace pegado directamente por Jose

Si Jose adjunta el HTML exportado o pega una URL pública (`import-claude-design-from-url`
lo consume igual, self-contained), usarlo tal cual.

**Si ninguna de las tres opciones funciona, detente y pide a Jose el archivo o
el enlace antes de seguir. Nunca inventar el diseño a partir de una
descripción verbal — este workflow existe precisamente para trabajar sobre el
mockup real, no sobre una interpretación.**

Copiar (o guardar) la fuente cruda en una ubicación permanente del repo, para
que quede como referencia y para la auditoría de fidelidad del PASO D:

```
.claude/design-imports/[vista]/source.html
```

---

## PASO A — Extraer el Design Brief

Leer el HTML/diseño completo y producir `.claude/design-imports/[vista]/brief.md`:

```markdown
# Design Brief — [vista]
Fuente: [ruta local o proyecto claude.ai/design de origen]
Fecha de importación: [fecha]

## Estructura
[Jerarquía de regiones — header, secciones, listas, footer — una frase por región]

## Componentes detectados
| Elemento del diseño          | Equivalente shadcn/PesquerApp        | Notas |
|-------------------------------|---------------------------------------|-------|
| [ej. tarjeta de producto]     | `Card` + `CardContent className="py-0"` | ...   |
| [ej. botón primario]          | `<Button>` (variant default)          | ...   |
| [ej. selector con búsqueda]   | `Combobox` (si carga de API) / `Select` (si lista estática) | ... |

## Copy / textos
[Labels, títulos, placeholders, mensajes de estado vacío, tal como aparecen
en el diseño]

## Datos que necesita
[Qué entidad/hook/servicio de dominio alimenta esta vista. Si no existe
todavía el endpoint/hook, decirlo explícitamente: "vista nueva sin backend —
requiere GAP de API primero", no inventar el contrato de datos]

## Estados no cubiertos por el diseño (inferir del proyecto, no del mockup)
- Loading: Skeleton con forma [tabla / tarjetas / formulario]
- Empty state: `EmptyState` con icono lucide sugerido: [icono]
- Error: patrón estándar `text-red-500 text-sm p-4`
- Confirmación destructiva (si aplica): `AlertDialog`
```

---

## PASO B — Mapeo de fidelidad vs adaptación (obligatorio, con confirmación)

Esta es la decisión central de todo el circuito: qué se copia tal cual del
diseño y qué se adapta siempre, sin excepción, a nuestro sistema.

### SIEMPRE fiel al diseño (salvo que rompa una regla dura del proyecto)

- Composición y jerarquía visual — qué va arriba, qué se agrupa, qué destaca
- Densidad de información y ritmo de espaciado relativo entre elementos
- Copy / textos, si ya están en español y con la terminología correcta del
  proyecto (ver tabla de vocabulario en `.claude/agents/mobile-ui-agent.md`)
- Flujo de interacción propuesto — pasos, orden de campos, agrupación

### SIEMPRE adaptado a PesquerApp (nunca literal del mockup)

- Colores → siempre tokens OKLCH de `design-context.md`, nunca hex/rgb del HTML
- Tipografía → siempre la escala documentada (`text-xl font-medium`, etc.),
  nunca tamaños arbitrarios del mockup
- Todo componente de UI → siempre el primitivo shadcn existente en
  `src/components/ui/`, nunca HTML/CSS reescrito desde cero
- Iconos → siempre `lucide-react`
- Loading/empty/error/confirmación destructiva → siempre el patrón documentado
  en `design-context.md` §4, aunque el mockup no lo muestre o lo muestre distinto
- Datos → siempre vía hook → service → `fetchWithTenant` (nunca fetch directo,
  nunca datos hardcodeados del mockup salvo placeholders de desarrollo)
- Mobile → siempre `useIsMobileSafe`, nunca `useMediaQuery` ni CSS puro
  `hidden md:block` como estrategia principal

### Zona gris — presentar a Jose antes de codificar

Cualquier elemento que no encaje claramente en ninguna de las dos listas
anteriores (un patrón de interacción nuevo que no existe todavía en el
proyecto, una jerarquía de tabs distinta a la habitual, un layout de card no
visto antes) se presenta explícitamente, nunca se decide en silencio:

```
## Mapeo de fidelidad — [vista]

FIEL AL DISEÑO:
- [lista]

ADAPTADO AL SISTEMA:
- [lista, con el porqué en una frase]

ZONA GRIS — necesito tu confirmación:
- [elemento] → propuesta: [A] fiel al mockup / [B] patrón ya existente en
  [archivo:línea de referencia] — ¿cuál prefieres?

¿Procedemos con este mapeo?
```

**No escribir código hasta que Jose confirme el mapeo — igual que el PASO B
de `mobile-ui-agent`.**

---

## PASO C — Implementar

Delegar la implementación real al agente especializado según el tipo de vista
— este skill no reimplementa lo que esos agentes ya hacen bien:

- Vista mobile o con capa mobile → `mobile-ui-agent` (ya conoce
  `mobile-ui/SKILL.md` + `mobile-preview/SKILL.md`, flujo de ramas incluido)
- Vista desktop pura o CRUD genérico → `frontend-developer`, o si es un CRUD
  con EntityClient, seguir `new-page`/`new-component` skills

Al invocar al agente delegado, pasar siempre como contexto explícito en el
prompt (un subagente con contexto limpio no hereda esta conversación):

1. La ruta del Design Brief: `.claude/design-imports/[vista]/brief.md`
2. El mapeo de fidelidad ya confirmado por Jose (PASO B), palabra por palabra
3. Instrucción explícita: "Muy fiel en composición/copy/flujo, pero SIEMPRE
   con primitivos shadcn/tokens/hooks del proyecto — nunca CSS/HTML del
   mockup copiado literal"

Si la vista es CLOUD context y mobile, el flujo de ramas `mobile/[vista]` +
`/preview` de `mobile-preview/SKILL.md` sigue aplicando sin cambios.

Para vistas de cierta complejidad (multi-pantalla, entidad nueva, flujo con
varios pasos), crear un GAP primero vía `gap-discovery` — igual que exige
`mobile-preview/SKILL.md` para contexto CLOUD. Para una vista puntual (una
pantalla, mejora autocontenida sobre una vista existente), el GAP es
opcional, igual que en `/mobile`.

---

## PASO D — Auditoría de fidelidad

Al terminar la implementación, invocar el agente `design-fidelity-auditor`
pasándole:

- La ruta de la fuente original: `.claude/design-imports/[vista]/source.html`
- La ruta/URL de la vista implementada
- El mapeo de fidelidad confirmado en el PASO B (para que no marque como
  "drift" algo que ya fue una adaptación acordada)

El auditor devuelve un veredicto de tres categorías (✅ Fiel / ⚠️ Adaptado
acordado / ❌ Drift) — ver `.claude/agents/design-fidelity-auditor.md` para su
protocolo completo, no lo dupliques aquí.

Si hay hallazgos ❌ DRIFT (no acordados en el mapeo), volver al PASO C solo
para esos puntos concretos — no reabrir todo el mapeo ni re-implementar desde
cero.

---

## Modo REFINAR — afinar fidelidad de una vista YA implementada

Se activa cuando Jose pide mejorar/afinar/aumentar la fidelidad de una vista
que **ya existe en el proyecto** respecto a un diseño de Claude Design — tanto
si esa vista se implementó originalmente con este mismo circuito como si se
implementó en cualquier otra sesión sin pasar por `/design-to-code` (p. ej.
"ayer implementé esta pantalla a partir de lo que diseñé, hoy quiero que
quede más fiel"). Frases que activan este modo: "afina esta pantalla para que
se parezca más al diseño", "mejora la fidelidad de [vista]", "quiero que
[vista] quede más parecida a lo que diseñé en Claude Design". Se activa por
la intención de Jose, no solo por el comando explícito `/design-to-code refine`.

**Regla clave: nunca reconstruir el diseño de memoria ni de la descripción
verbal de Jose.** Si la fuente no está persistida todavía, se localiza y se
guarda — exactamente igual que en el PASO 0 — antes de tocar nada. El
objetivo de persistir `source.html` y `brief.md` en
`.claude/design-imports/[vista]/` en el PASO 0 del flujo normal es
precisamente que este modo pueda reutilizarlos sin volver a pedírselos a Jose
cada vez que se quiera afinar algo.

### PASO 0' — Localizar (o recuperar) la fuente

```bash
ls .claude/design-imports/[vista]/ 2>/dev/null
```

- Si `source.html` ya existe → reutilizar directamente, no volver a pedirlo a
  Jose.
- Si no existe → ejecutar el PASO 0 normal de este skill (repo sembrado por
  "Send to Claude Code Web" / `DesignSync` en contexto local / archivo o
  enlace que dé Jose) y guardarlo en esa ruta antes de continuar, para que
  quede disponible en la próxima sesión de afinado sin repetir la búsqueda.

### PASO A' — Localizar la implementación existente

A diferencia del flujo normal, aquí no se crea nada desde cero: hay que
encontrar el componente ya implementado en el codebase.

```bash
find . -path "*[vista]*" -name "index.*" -not -path "*/node_modules/*"
grep -r "useIsMobile\|isMobile\|Mobile\b" [ruta-encontrada] --include="*.tsx" --include="*.ts"
```

Si hay ambigüedad sobre qué archivo o ruta es "la vista" a la que Jose se
refiere, preguntar antes de seguir — nunca asumir.

### PASO B' — Mapeo de fidelidad (reutilizar o reconstruir)

- Si existe `.claude/design-imports/[vista]/brief.md` con un mapeo ya
  confirmado (de una ejecución previa del circuito completo) → reutilizarlo
  tal cual, sin volver a preguntar.
- Si no existe (la vista se implementó fuera de este circuito) → reconstruirlo
  ahora. Las listas "SIEMPRE fiel al diseño" / "SIEMPRE adaptado a
  PesquerApp" del PASO B de este skill son **reglas fijas del proyecto, no
  cambian por vista** — no hace falta volver a preguntarlas. Solo la "zona
  gris" es específica de esta vista concreta y sí requiere confirmación
  explícita de Jose, igual que en el PASO B normal. Generar y persistir el
  `brief.md` resultante para que quede disponible en la próxima sesión de
  afinado de esta misma vista.

### PASO C' — Auditar primero (no implementar primero)

A diferencia del flujo normal (donde la auditoría es el último paso), en modo
REFINAR la auditoría es el **punto de partida**: invocar
`design-fidelity-auditor` sobre el estado actual (fuente + implementación
existente + mapeo del PASO B') para obtener la lista priorizada de ❌ DRIFT
antes de tocar ningún archivo. Sin esta lista no hay forma fiable de saber
qué "afinar" — adivinarlo a ojo es exactamente lo que este circuito existe
para evitar.

### PASO D' — Afinar (cirugía dirigida, no reescritura)

Delegar a `mobile-ui-agent` / `frontend-developer` (según corresponda) **solo**
la lista de ❌ DRIFT obtenida en el PASO C', con instrucción explícita:

> "Ajuste quirúrgico de fidelidad — NO reescribir el componente, NO tocar
> nada fuera de esta lista de drift. Cada punto es un cambio localizado y
> mínimo sobre código que ya funciona en producción."

Esto es una pasada de refinamiento sobre código que ya funciona, no una
reimplementación — el riesgo de scope creep es alto si no se acota así de
explícito.

### PASO E' — Re-auditar

Repetir `design-fidelity-auditor` sobre el resultado. Iterar (D'→E') hasta
0 drift, o hasta que Jose decida que el nivel de fidelidad actual ya es
suficiente y detenga el ciclo explícitamente.

---

## PASO E — Entregar

```
✅ [vista] implementada desde Claude Design

**Fuente:** .claude/design-imports/[vista]/source.html
**Brief:** .claude/design-imports/[vista]/brief.md
**Implementación:** [ruta(s) de archivo]
**Rama:** [si aplica, mobile/[vista]]
**Auditoría de fidelidad:** [resumen del veredicto — FAITHFUL / FAITHFUL WITH
AGREED ADAPTATIONS / NEEDS FIXES]

Siguiente paso:
→ "merge [vista]" — si es mobile en rama propia (mobile-ui-agent hace el merge)
→ "ajustar [descripción]" — corrijo puntos concretos y repito el PASO D
```

---

## Lo que NUNCA hacer

- Nunca copiar CSS/HTML del mockup literal dentro de un componente React
- Nunca introducir un color, tamaño o componente fuera de lo documentado en
  `design-context.md` "porque así estaba en el diseño"
- Nunca saltarse el PASO B (mapeo con confirmación explícita) aunque el
  diseño parezca simple o autoexplicativo
- Nunca inventar el contenido del diseño si no se pudo localizar la fuente en
  el PASO 0 — detener el circuito y preguntar a Jose
- Nunca "afinar fidelidad" de memoria o a partir de la descripción verbal de
  Jose de cómo era el diseño — en Modo REFINAR, si `source.html` no está
  persistido, se localiza primero (PASO 0'), igual que en una vista nueva
- Nunca mezclar esta importación con GAPs no relacionados en el mismo commit
- Nunca saltarse el PASO D (auditoría de fidelidad) — es lo que hace que el
  circuito sea confiable de repetir, no solo la primera vez
