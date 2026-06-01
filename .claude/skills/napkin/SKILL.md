# Skill: Napkin

## Categoría
Visualización

## Cuándo se activa

Cuando el usuario dice: "dibuja", "diagrama", "visualiza", "sketch", "napkin", "muéstrame el flujo", "diagram this", "cómo se relacionan", "esquema", "arquitectura visual", "flowchart", "sequence diagram".

---

## Qué hace

Genera diagramas rápidos — como un sketch en una servilleta. No son diagramas de arquitectura empresarial perfectos; son esquemas claros y útiles que comunican la idea en segundos.

Usa **Mermaid** por defecto (se renderiza en GitHub, Notion, VS Code, GitLab). Si el contexto no soporta Mermaid, usa ASCII.

---

## Tipos de diagrama disponibles

| Tipo | Cuándo usarlo | Sintaxis Mermaid |
|---|---|---|
| Flowchart | Flujos de datos, decisiones, procesos | `flowchart TD` |
| Sequence | Comunicación entre sistemas/componentes | `sequenceDiagram` |
| Component | Relaciones entre módulos | `graph LR` |
| State machine | Estados de UI, ciclo de vida | `stateDiagram-v2` |
| ER | Modelos de datos | `erDiagram` |
| Timeline | Roadmap, fases | `timeline` |

---

## Proceso

### 1. Identificar qué dibujar

Preguntar si no está claro: ¿flujo de datos? ¿arquitectura de componentes? ¿secuencia de llamadas? ¿estados de UI?

### 2. Elegir el tipo

Para este proyecto, los más útiles:
- **Flujo de datos** → flowchart (Componente → Hook → Service → fetchWithTenant → API)
- **Llamadas entre sistemas** → sequenceDiagram (Frontend ↔ Laravel ↔ BD)
- **Relaciones entre módulos** → graph LR
- **Estados de un formulario/proceso** → stateDiagram-v2

### 3. Dibujar en Mermaid

Mantener simple: máximo 10-12 nodos. Si es más complejo, dividir en dos diagramas.

### 4. Añadir contexto mínimo

Una línea antes del diagrama explicando qué representa.

---

## Ejemplos reales del proyecto

### Flujo de datos de PesquerApp

```mermaid
flowchart TD
    C[Componente] --> H[Hook useX]
    H --> S[Service xService]
    S --> G[Helper genérico\nfetchEntitiesGeneric]
    G --> F[fetchWithTenant]
    F -->|X-Tenant + Auth| API[API Laravel /v2/]
```

### Ciclo GAP

```mermaid
stateDiagram-v2
    [*] --> open: Discovery crea GAP
    open --> in_progress: Jose confirma\nImplementador actúa
    in_progress --> closed: Auditor aprueba
    in_progress --> in_progress: Auditor rechaza\nImplementador corrige
    closed --> [*]
```

### Autenticación NextAuth

```mermaid
sequenceDiagram
    participant U as Usuario
    participant MW as middleware.ts
    participant NA as NextAuth
    participant API as Laravel API

    U->>MW: Request a /admin/*
    MW->>NA: getToken(req)
    NA-->>MW: JWT token
    MW->>MW: Verificar rol en roleConfig
    MW-->>U: Redirigir o continuar
    U->>API: Request con Bearer token
    API-->>U: Response
```

### Estructura de hooks gigantes (problema actual)

```mermaid
graph LR
    subgraph AHORA
        UO[useOrder.js\n40KB] --> C1[Componente A]
        UO --> C2[Componente B]
        UO --> C3[Componente C]
    end

    subgraph GAP-004
        UO2[useOrder.ts\norquestador] --> SUB1[hooks/orders/\nuseOrderCreate.ts]
        UO2 --> SUB2[hooks/orders/\nuseOrderClose.ts]
        UO2 --> SUB3[hooks/orders/\nuseOrderLines.ts]
        UO2 --> C1
        UO2 --> C2
        UO2 --> C3
    end
```

---

## Output

```
[Línea de contexto: qué representa el diagrama]

\`\`\`mermaid
[código del diagrama]
\`\`\`

[Opcional: nota de 1 línea si algo del diagrama necesita aclaración]
```

Si el diagrama es ASCII (porque Mermaid no aplica):
```
[contexto]

┌──────────┐     ┌──────────┐
│ Módulo A │────▶│ Módulo B │
└──────────┘     └──────────┘
```
