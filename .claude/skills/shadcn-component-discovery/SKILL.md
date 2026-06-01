# Skill: shadcn Component Discovery

## Categoría
Desarrollo

## Cuándo se activa

Cuando el usuario dice: "busca un componente para X", "hay algún componente de shadcn para", "existe algo en shadcn que haga", "component discovery", "buscar en el ecosistema shadcn", "hay una librería para", "qué componente uso para", "existe algún registry con".

También se activa implícitamente antes de construir cualquier UI personalizada — la skill verifica primero si el componente ya existe en el ecosistema shadcn antes de escribir código custom.

---

## Qué hace

Busca componentes existentes en el ecosistema shadcn/ui — incluyendo el registry oficial y 30+ registries comunitarios — antes de construir UI custom. Responde a la pregunta "¿ya existe esto en algún sitio?" para ahorrar tiempo de implementación.

> **Principio clave:** "Busca antes de construir. La mayoría de necesidades de UI ya están resueltas en el ecosistema shadcn. El coste de un check de 10 segundos es siempre menor que construir algo que ya existe."

---

## Proceso

### 1. Clarificar la necesidad

Confirmar antes de buscar:
- ¿Qué funcionalidad exacta se necesita?
- ¿Preferencias de estilo o animación?
- ¿Restricciones (tamaño de bundle, dependencias, accesibilidad)?

### 2. Buscar en el ecosistema

```bash
# Usar CLI de shadcn si MCP no está disponible
npx shadcn@latest add --help

# Buscar en registry oficial
# → https://ui.shadcn.com/docs/components
```

**Estrategia de búsqueda:** Usar términos cortos y concretos.

| Necesidad | Términos de búsqueda | Registry especializado |
|---|---|---|
| Tablas / grids avanzados | `data-grid`, `table`, `tanstack` | `@reui` |
| Animaciones | `animated`, `motion`, `transition` | `@animate-ui`, Magic UI |
| Formularios complejos | `form`, `multi-step`, `wizard` | Official + `shadcn-extension` |
| Calendario / fechas | `calendar`, `date-picker`, `range` | Official |
| Gráficos | `chart`, `recharts`, `area` | Official (Recharts) |
| Comandos / búsqueda | `command`, `cmdk`, `search` | Official |
| Upload de archivos | `upload`, `dropzone`, `file` | `shadcn-extension` |

### 3. Presentar hallazgos

Formato de respuesta:

```
## Búsqueda: [lo que se buscó]

### Opciones encontradas

1. **[Componente A]** — [descripción en una línea]
   - Instalar: `npx shadcn@latest add [nombre]`
   - Pros: [ventajas]
   
2. **[Componente B]** — [descripción en una línea]
   - Instalar: `npx shadcn@latest add [nombre]`
   - Pros: [ventajas]

### Recomendación
[Opción recomendada y motivo]

### Próximo paso
[ ] Instalar y usar  [ ] Ver código fuente  [ ] Construir custom
```

### 4. Ejecutar

- Ayudar a instalar con `npx shadcn@latest add`
- Mostrar código de uso básico
- Si no existe nada adecuado: construir custom usando componentes existentes como base

---

## Registries comunitarios conocidos

```
@animate-ui      — componentes con animaciones Framer Motion
Magic UI         — animaciones y efectos visuales avanzados  
@reui            — data grids y tablas avanzadas
shadcn-extension — extensiones del ecosistema oficial
originui         — componentes de formulario avanzados
```

---

## Reglas de este proyecto

- Verificar primero en `src/components/ui/` — el proyecto tiene 52 primitivos ya instalados
- Antes de instalar: confirmar que el componente no existe ya con `ls src/components/ui/`
- Instalar siempre via `npx shadcn@latest add [nombre]` — nunca via npm
- Si el componente de terceros tiene dependencias extra: aprobarlas antes de instalar

---

## Fuente

Basado en [mattbx/shadcn-skills](https://github.com/mattbx/shadcn-skills) · MIT License.
