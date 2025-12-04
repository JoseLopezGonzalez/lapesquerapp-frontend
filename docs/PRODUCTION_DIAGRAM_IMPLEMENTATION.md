# Documentación: Implementación del Diagrama de Producción con React Flow

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Estructura de Datos](#estructura-de-datos)
4. [Mapeo a React Flow](#mapeo-a-react-flow)
5. [Diseño de Nodos](#diseño-de-nodos)
6. [Layout y Posicionamiento](#layout-y-posicionamiento)
7. [Interactividad](#interactividad)
8. [Estilos y Temas](#estilos-y-temas)
9. [Plan de Implementación](#plan-de-implementación)

---

## 🎯 Visión General

El diagrama de producción visualizará el flujo de procesos de producción usando **React Flow** ([reactflow.dev](https://reactflow.dev/)), mostrando:

- **Nodos**: Cada proceso de producción con su información
- **Edges (Conexiones)**: Relaciones padre-hijo entre procesos
- **Información visual**: Pesos, cajas, merma/rendimiento, estados
- **Interactividad**: Navegación, zoom, pan, selección

### Objetivos de Diseño

- ✅ UI consistente con el resto de la aplicación
- ✅ Diseño limpio y profesional
- ✅ Información clara y legible
- ✅ Interactividad fluida
- ✅ Responsive y accesible

---

## 🏗️ Arquitectura

### Componentes Principales

```
ProductionView
└── ProductionDiagram (nuevo componente)
    ├── ReactFlow (componente principal)
    ├── ProcessNode (nodo personalizado)
    ├── ProcessEdge (edge personalizado opcional)
    ├── Controls (controles de React Flow)
    └── MiniMap (minimapa opcional)
```

### Flujo de Datos

```
API Response (processTree)
    ↓
Transformación de datos
    ↓
React Flow Nodes & Edges
    ↓
Renderizado visual
```

---

## 📊 Estructura de Datos

### Respuesta del API

```json
{
  "data": {
    "processNodes": [
      {
        "id": 1,
        "processId": 3,
        "process": { "id": 3, "name": "Eviscerado" },
        "isRoot": true,
        "isFinal": false,
        "isCompleted": true,
        "parentRecordId": null,
        "children": [
          {
            "id": 2,
            "parentRecordId": 1,
            "process": { "name": "Fileteado" },
            "isFinal": true,
            ...
          }
        ],
        "totals": {
          "inputWeight": 150.50,
          "outputWeight": 120.30,
          "inputBoxes": 5,
          "outputBoxes": 8,
          "waste": 30.20,
          "wastePercentage": 20.07,
          "yield": 0,
          "yieldPercentage": 0
        },
        "startedAt": "2024-01-15T10:35:00Z",
        "finishedAt": "2024-01-15T12:00:00Z"
      }
    ],
    "totals": { ... }
  }
}
```

### Campos Clave para el Diagrama

- **Relaciones**: `parentRecordId` y `children[]` definen la jerarquía
- **Estado**: `isRoot`, `isFinal`, `isCompleted`
- **Métricas**: `totals` (pesos, cajas, merma/rendimiento)
- **Fechas**: `startedAt`, `finishedAt`

---

## 🔄 Mapeo a React Flow

### Transformación de Datos

#### 1. Nodos (Nodes)

Cada `processNode` se convierte en un nodo de React Flow:

```typescript
interface ProcessNode {
  id: string;              // ID del record (ej: "1")
  type: 'processNode';     // Tipo personalizado
  position: { x: number, y: number }; // Calculado por layout
  data: {
    recordId: number;
    processName: string;
    isRoot: boolean;
    isFinal: boolean;
    isCompleted: boolean;
    totals: {
      inputWeight: number;
      outputWeight: number;
      inputBoxes: number;
      outputBoxes: number;
      waste: number;
      wastePercentage: number;
      yield: number;
      yieldPercentage: number;
    };
    startedAt: string | null;
    finishedAt: string | null;
    notes: string | null;
  };
}
```

#### 2. Edges (Conexiones)

Las relaciones padre-hijo se convierten en edges:

```typescript
interface ProcessEdge {
  id: string;              // "e1-2" (edge del nodo 1 al 2)
  source: string;          // ID del nodo padre
  target: string;          // ID del nodo hijo
  type: 'smoothstep';     // Tipo de edge (suave)
  animated: boolean;       // Animación opcional
  style?: {
    stroke: string;       // Color según estado
    strokeWidth: number;
  };
}
```

### Algoritmo de Transformación

```javascript
function transformProcessTreeToFlow(processTree) {
  const nodes = [];
  const edges = [];
  let xPosition = 0;
  let yPosition = 0;
  
  // Recorrer recursivamente los nodos
  function processNode(node, parentId = null, level = 0) {
    const nodeId = node.id.toString();
    
    // Crear nodo
    nodes.push({
      id: nodeId,
      type: 'processNode',
      position: {
        x: level * 300,  // Separación horizontal por nivel
        y: yPosition     // Posición vertical (ajustar según hijos)
      },
      data: {
        recordId: node.id,
        processName: node.process?.name || 'Sin nombre',
        isRoot: node.isRoot,
        isFinal: node.isFinal,
        isCompleted: node.isCompleted,
        totals: node.totals,
        startedAt: node.startedAt,
        finishedAt: node.finishedAt,
        notes: node.notes
      }
    });
    
    // Crear edge si tiene padre
    if (parentId) {
      edges.push({
        id: `e${parentId}-${nodeId}`,
        source: parentId.toString(),
        target: nodeId,
        type: 'smoothstep',
        animated: false
      });
    }
    
    // Procesar hijos recursivamente
    if (node.children && node.children.length > 0) {
      node.children.forEach((child, index) => {
        yPosition += 150; // Espaciado vertical
        processNode(child, nodeId, level + 1);
      });
    }
  }
  
  // Procesar todos los nodos raíz
  processTree.processNodes.forEach(rootNode => {
    processNode(rootNode);
    yPosition += 200; // Espacio entre árboles
  });
  
  return { nodes, edges };
}
```

---

## 🎨 Diseño de Nodos

### Estructura Visual del Nodo

```
┌─────────────────────────────────────┐
│  [Icono] Nombre del Proceso         │
│  ─────────────────────────────────  │
│  Estado: [Badge]                    │
│  ─────────────────────────────────  │
│  Entrada: 150.50 kg (5 cajas)      │
│  Salida:  120.30 kg (8 cajas)      │
│  ─────────────────────────────────  │
│  Merma: -30.20 kg (-20.07%)        │
│  ─────────────────────────────────  │
│  Fechas: Inicio | Fin               │
└─────────────────────────────────────┘
```

### Componente ProcessNode

```jsx
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, TrendingDown, TrendingUp } from 'lucide-react';

function ProcessNode({ data }) {
  const {
    processName,
    isRoot,
    isFinal,
    isCompleted,
    totals,
    startedAt,
    finishedAt
  } = data;
  
  const hasWaste = totals.waste > 0;
  const hasYield = totals.yield > 0;
  
  return (
    <div className="bg-card border rounded-lg shadow-sm p-4 min-w-[280px] max-w-[320px]">
      {/* Handles para conexiones */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-primary"
        />
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b">
        <h3 className="font-semibold text-sm">{processName}</h3>
        <Badge
          variant={isCompleted ? 'default' : 'outline'}
          className={isCompleted ? 'bg-green-500' : ''}
        >
          {isCompleted ? (
            <><CheckCircle className="h-3 w-3 mr-1" /> Completado</>
          ) : (
            <><Clock className="h-3 w-3 mr-1" /> En progreso</>
          )}
        </Badge>
      </div>
      
      {/* Métricas */}
      <div className="space-y-2 text-xs">
        {/* Entrada */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Entrada:</span>
          <span className="font-medium">
            {formatWeight(totals.inputWeight)} ({totals.inputBoxes} cajas)
          </span>
        </div>
        
        {/* Salida */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Salida:</span>
          <span className="font-medium">
            {formatWeight(totals.outputWeight)} ({totals.outputBoxes} cajas)
          </span>
        </div>
        
        {/* Merma o Rendimiento */}
        {(hasWaste || hasYield) && (
          <div className={`pt-2 border-t flex items-center justify-between ${
            hasWaste ? 'text-destructive' : 'text-green-600'
          }`}>
            <div className="flex items-center gap-1">
              {hasWaste ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <TrendingUp className="h-3 w-3" />
              )}
              <span className="text-xs font-medium">
                {hasWaste ? 'Merma' : 'Rendimiento'}:
              </span>
            </div>
            <span className="font-bold text-sm">
              {hasWaste 
                ? `-${formatDecimalWeight(totals.waste)} (-${formatDecimal(totals.wastePercentage)}%)`
                : `+${formatDecimalWeight(totals.yield)} (+${formatDecimal(totals.yieldPercentage)}%)`
              }
            </span>
          </div>
        )}
      </div>
      
      {/* Handles para conexiones salientes */}
      {!isFinal && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-primary"
        />
      )}
    </div>
  );
}
```

### Características del Nodo

- **Handles**: Puntos de conexión arriba (entrada) y abajo (salida)
- **Badges de estado**: Verde si completado, outline si en progreso
- **Métricas compactas**: Entrada, salida, merma/rendimiento
- **Colores consistentes**: Misma paleta que el resto de la app
- **Responsive**: Tamaño mínimo y máximo definido

---

## 📐 Layout y Posicionamiento

### Estrategia de Layout

#### Opción 1: Layout Manual (Recomendado para inicio)

- **Horizontal**: Cada nivel de profundidad se posiciona en una columna
- **Vertical**: Los nodos del mismo nivel se distribuyen verticalmente
- **Espaciado**: 300px horizontal, 150px vertical entre nodos

```javascript
function calculateLayout(nodes, edges) {
  // Agrupar por nivel de profundidad
  const levels = {};
  
  nodes.forEach(node => {
    const level = getNodeLevel(node.id, edges);
    if (!levels[level]) levels[level] = [];
    levels[level].push(node);
  });
  
  // Posicionar por nivel
  Object.keys(levels).forEach((level, levelIndex) => {
    const nodesInLevel = levels[level];
    const x = levelIndex * 350; // Separación horizontal
    
    nodesInLevel.forEach((node, nodeIndex) => {
      const y = nodeIndex * 180; // Separación vertical
      node.position = { x, y };
    });
  });
  
  return nodes;
}
```

#### Opción 2: Layout Automático (dagre)

Usar la librería `dagre` para layout automático:

```bash
npm install dagre @types/dagre
```

```javascript
import dagre from 'dagre';

function getLayoutedElements(nodes, edges) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 200 });
  
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 300, height: 200 });
  });
  
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  
  dagre.layout(dagreGraph);
  
  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - 150,
      y: nodeWithPosition.y - 100,
    };
  });
  
  return { nodes, edges };
}
```

### Centrado Automático

```javascript
function fitViewToNodes(reactFlowInstance, nodes) {
  if (nodes.length === 0) return;
  
  reactFlowInstance.fitView({
    padding: 0.2,
    duration: 400
  });
}
```

---

## 🖱️ Interactividad

### Funcionalidades

1. **Navegación**
   - Click en nodo → Navegar a edición del record
   - Tooltip con información adicional

2. **Zoom y Pan**
   - Controles integrados de React Flow
   - Zoom con rueda del mouse
   - Pan arrastrando el fondo

3. **Selección**
   - Click para seleccionar nodo
   - Visual feedback al seleccionar

4. **MiniMap** (Opcional)
   - Vista general del diagrama
   - Navegación rápida

### Implementación de Navegación

```jsx
const onNodeClick = (event, node) => {
  const recordId = node.data.recordId;
  router.push(`/admin/productions/${productionId}/records/${recordId}`);
};

<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodeClick={onNodeClick}
  // ... otras props
/>
```

---

## 🎨 Estilos y Temas

### Consistencia con la App

#### Colores

- **Fondo**: `bg-background` (tema de la app)
- **Cards/Nodos**: `bg-card border rounded-lg`
- **Texto**: `text-foreground`, `text-muted-foreground`
- **Estados**:
  - Completado: `bg-green-500`
  - En progreso: `border outline`
- **Merma**: `text-destructive`
- **Rendimiento**: `text-green-600`

#### Tipografía

- **Títulos**: `font-semibold text-sm`
- **Valores**: `font-bold text-base`
- **Labels**: `text-xs text-muted-foreground`

#### Espaciado

- **Padding interno**: `p-4`
- **Gaps**: `gap-2`, `gap-3`
- **Bordes**: `border rounded-lg`

### Tema de React Flow

```jsx
const flowTheme = {
  background: 'var(--background)',
  primary: 'var(--primary)',
  text: 'var(--foreground)',
  border: 'var(--border)',
};

<ReactFlow
  style={{ background: flowTheme.background }}
  // ...
/>
```

---

## 📦 Plan de Implementación

### Fase 1: Setup Básico

1. **Instalar dependencias**
   ```bash
   npm install @xyflow/react
   ```

2. **Crear componente base**
   - `ProductionDiagram.jsx`
   - Estructura básica con ReactFlow

3. **Integrar en ProductionView**
   - Reemplazar placeholder en el tab "Diagrama"

### Fase 2: Transformación de Datos

1. **Función de transformación**
   - `transformProcessTreeToFlow()`
   - Mapeo de nodos y edges

2. **Layout básico**
   - Posicionamiento manual inicial
   - Ajuste de espaciado

### Fase 3: Nodo Personalizado

1. **Componente ProcessNode**
   - Diseño visual
   - Handles de conexión
   - Badges y estados

2. **Registro de tipo de nodo**
   ```jsx
   const nodeTypes = {
     processNode: ProcessNode
   };
   ```

### Fase 4: Interactividad

1. **Navegación**
   - Click en nodos
   - Routing a edición

2. **Controles**
   - Zoom in/out
   - Fit view
   - Pan

3. **MiniMap** (opcional)

### Fase 5: Refinamiento

1. **Layout mejorado**
   - Implementar dagre para layout automático
   - Ajustar espaciado

2. **Animaciones**
   - Transiciones suaves
   - Edge animations (opcional)

3. **Optimización**
   - Memoización de componentes
   - Lazy loading si es necesario

### Fase 6: Testing y Ajustes

1. **Testing**
   - Diferentes estructuras de árbol
   - Múltiples niveles
   - Estados edge cases

2. **Ajustes de UX**
   - Feedback visual
   - Mensajes de error
   - Loading states

---

## 📝 Estructura de Archivos

```
src/components/Admin/Productions/
├── ProductionView.jsx (ya existe)
├── ProductionDiagram.jsx (nuevo)
│   └── components/
│       ├── ProcessNode.jsx (nodo personalizado)
│       └── ProcessEdge.jsx (edge personalizado, opcional)
└── utils/
    └── diagramTransformers.js (utilidades de transformación)
```

---

## 🔧 Configuración de React Flow

### Props Principales

```jsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes} // opcional
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect} // si se permite crear conexiones
  fitView
  minZoom={0.1}
  maxZoom={2}
  defaultViewport={{ x: 0, y: 0, zoom: 1 }}
  attributionPosition="bottom-left"
>
  <Controls />
  <MiniMap />
  <Background variant="dots" gap={12} size={1} />
</ReactFlow>
```

### Hooks Necesarios

```jsx
import { useReactFlow, useNodesState, useEdgesState } from '@xyflow/react';

const { fitView } = useReactFlow();
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
```

---

## 🎯 Consideraciones Especiales

### Estados Edge Cases

1. **Sin procesos**: Mostrar mensaje "No hay procesos registrados"
2. **Un solo proceso**: Centrar y mostrar claramente
3. **Procesos sin completar**: Diferencia visual clara
4. **Árboles grandes**: Virtualización o paginación si es necesario

### Performance

- **Memoización**: Usar `React.memo` en ProcessNode
- **Lazy rendering**: Cargar nodos visibles primero
- **Debounce**: En operaciones de layout si es necesario

### Accesibilidad

- **ARIA labels**: En nodos y controles
- **Keyboard navigation**: Soporte de teclado
- **Screen readers**: Textos descriptivos

---

## 📚 Referencias

- [React Flow Documentation](https://reactflow.dev/)
- [React Flow Examples](https://reactflow.dev/examples)
- [Dagre Layout](https://github.com/dagrejs/dagre)

---

## ✅ Checklist de Implementación

- [ ] Instalar `@xyflow/react`
- [ ] Crear componente `ProductionDiagram`
- [ ] Implementar función de transformación de datos
- [ ] Crear componente `ProcessNode` personalizado
- [ ] Implementar layout básico
- [ ] Añadir navegación al hacer click
- [ ] Integrar controles de React Flow
- [ ] Aplicar estilos consistentes
- [ ] Testing con diferentes estructuras
- [ ] Optimización y refinamiento

---

**Última actualización**: 2025-01-XX
**Autor**: Documentación generada para implementación de diagrama de producción

