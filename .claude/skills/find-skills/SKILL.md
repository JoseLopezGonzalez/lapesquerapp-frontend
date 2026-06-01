# Skill: FindSkills

## Categoría
Descubrimiento

## Cuándo se activa

Cuando el usuario dice: "qué skills hay", "lista las skills", "qué puedes hacer", "skills disponibles", "find skills", "muéstrame las skills", "/skills", "qué agentes tienes", "qué herramientas tienes".

---

## Qué hace

Escanea `.claude/skills/` y `.claude/agents/` y presenta un catálogo organizado de todo lo disponible en este proyecto, con una descripción de cuándo usar cada cosa.

---

## Proceso

### 1. Leer la estructura disponible

```bash
find .claude/skills -name "SKILL.md" | sort
find .claude/agents -name "*.md" | sort
```

### 2. Extraer nombre y descripción de cada archivo

Para cada SKILL.md: leer la primera línea del "Qué hace" o "Cuándo se activa".
Para cada agent .md: leer la primera línea del "Rol".

### 3. Presentar el catálogo agrupado

---

## Formato de output

```
## Skills disponibles en PesquerApp

### Escritura
| Skill | Cuándo usarla |
|---|---|
| **Humanizer** | Texto que suena a IA — lo convierte en lenguaje natural |

### Descubrimiento
| Skill | Cuándo usarla |
|---|---|
| **FindSkills** | Esta misma — lista todo lo disponible |

### Optimización de tokens
| Skill | Cuándo usarla |
|---|---|
| **Caveman** | Comprime texto/prompts al mínimo posible |
| **Token Optimizer** | Analiza qué cortar estratégicamente para reducir contexto |

### Visualización
| Skill | Cuándo usarla |
|---|---|
| **Napkin** | Dibuja diagramas de flujo, arquitectura, secuencias |

### Meta / Creación
| Skill | Cuándo usarla |
|---|---|
| **Skill Creator** | Crea una nueva skill paso a paso |

---

## Agentes disponibles

### Desarrollo
| Agente | Rol |
|---|---|
| **frontend-developer** | Implementa features completas siguiendo los patrones del proyecto |
| **code-reviewer** | Revisa diffs con checklist bloqueante |
| **db-architect** | Diseña queryKeys y estrategias de cache TanStack Query |

### Flujo GAP
| Agente | Cuándo actúa |
|---|---|
| **gap-discovery** | Jose describe un problema o feature → genera el GAP.md |
| **gap-implementor** | Jose confirma el GAP → lo implementa |
| **gap-auditor** | Tras implementación → audita y cierra o rechaza |

---

## Skills de flujo de trabajo

| Skill | Cuándo usarla |
|---|---|
| **new-page** | Crear una página completa nueva (page + PageClient + hook + service) |
| **new-component** | Crear un componente reutilizable TypeScript |
| **new-service** | Crear un service de dominio con los 5 métodos base |
| **task-workflow** | Contexto del flujo GAP completo |

---

💡 Para activar cualquier skill: simplemente descríbela o dí su nombre.
```

---

## Nota de mantenimiento

Este skill es dinámico — siempre lee los archivos reales en el momento de la invocación. Si se añaden skills o agentes nuevos, aparecerán automáticamente la próxima vez que se invoque FindSkills.
