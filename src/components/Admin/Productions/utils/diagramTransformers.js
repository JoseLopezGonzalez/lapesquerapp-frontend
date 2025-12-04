import dagre from 'dagre';

/**
 * Calcula el nivel de profundidad de un nodo en el árbol
 */
function getNodeLevel(nodeId, edges, visited = new Set()) {
  if (visited.has(nodeId)) return 0;
  visited.add(nodeId);
  
  const incomingEdge = edges.find(e => e.target === nodeId);
  if (!incomingEdge) return 0;
  
  return 1 + getNodeLevel(incomingEdge.source, edges, visited);
}

/**
 * Extrae información de productos de inputs
 */
function extractInputProducts(inputs) {
  if (!inputs || !Array.isArray(inputs)) return [];
  
  const productsMap = {};
  inputs.forEach(input => {
    if (input.box?.product?.name) {
      const productName = input.box.product.name;
      if (!productsMap[productName]) {
        productsMap[productName] = {
          name: productName,
          boxes: 0,
          weight: 0
        };
      }
      productsMap[productName].boxes += 1;
      productsMap[productName].weight += parseFloat(input.box?.netWeight || 0);
    }
  });
  
  return Object.values(productsMap);
}

/**
 * Extrae información de productos de outputs
 */
function extractOutputProducts(outputs) {
  if (!outputs || !Array.isArray(outputs)) return [];
  
  const productsMap = {};
  outputs.forEach(output => {
    if (output.product?.name) {
      const productName = output.product.name;
      if (!productsMap[productName]) {
        productsMap[productName] = {
          name: productName,
          boxes: output.boxes || 0,
          weight: 0
        };
      } else {
        productsMap[productName].boxes += (output.boxes || 0);
      }
      productsMap[productName].weight += parseFloat(output.weight || 0);
    }
  });
  
  return Object.values(productsMap);
}

/**
 * Transforma el árbol de procesos del API a nodos y edges de React Flow
 * @param {Object} processTree - Árbol de procesos del API
 * @param {boolean} includeDetails - Si incluir información detallada de productos
 * @param {string} viewMode - Modo de visualización ('simple', 'detailed', 'accounting')
 */
export function transformProcessTreeToFlow(processTree, includeDetails = false, viewMode = 'simple') {
  if (!processTree || !processTree.processNodes || processTree.processNodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];
  const nodeMap = new Map();

  // Crear nodos y edges recursivamente
  function createNodesAndEdges(node, parentId = null) {
    const nodeId = node.id.toString();
    
    // Extraer información de productos si está en modo detallado
    const inputProducts = includeDetails ? extractInputProducts(node.inputs) : [];
    const outputProducts = includeDetails ? extractOutputProducts(node.outputs) : [];
    
    // Crear nodo
    const flowNode = {
      id: nodeId,
      type: 'processNode',
      position: { x: 0, y: 0 }, // Se calculará después
      data: {
        recordId: node.id,
        processName: node.process?.name || 'Sin nombre',
        isRoot: node.isRoot || false,
        isFinal: node.isFinal || false,
        // isCompleted: usar el valor del API si está definido, sino verificar finishedAt
        isCompleted: node.isCompleted !== undefined 
          ? node.isCompleted === true 
          : (node.finishedAt !== null && node.finishedAt !== undefined && node.finishedAt !== ''),
        totals: node.totals || {
          inputWeight: node.totalInputWeight || 0,
          outputWeight: node.totalOutputWeight || 0,
          inputBoxes: node.totalInputBoxes || 0,
          outputBoxes: node.totalOutputBoxes || 0,
          waste: node.waste || 0,
          wastePercentage: node.wastePercentage || 0,
          yield: node.yield || 0,
          yieldPercentage: node.yieldPercentage || 0
        },
        startedAt: node.startedAt,
        finishedAt: node.finishedAt,
        notes: node.notes,
        // Información detallada de productos (solo en modo detallado o accounting)
        inputProducts: includeDetails ? inputProducts : [],
        outputProducts: includeDetails ? outputProducts : [],
        viewMode: viewMode // Pasar el modo completo para futuras implementaciones
      }
    };
    
    nodes.push(flowNode);
    nodeMap.set(nodeId, { node, flowNode });
    
    // Crear edge si tiene padre y el padre existe
    if (parentId) {
      // Verificar que el nodo padre existe
      const parentExists = nodes.some(n => n.id === parentId);
      if (parentExists) {
        const edgeId = `e${parentId}-${nodeId}`;
        // Verificar que no exista ya el edge
        if (!edges.find(e => e.id === edgeId)) {
          const isCompleted = flowNode.data.isCompleted;
          edges.push({
            id: edgeId,
            source: parentId,
            target: nodeId,
            type: 'smoothstep',
            animated: !isCompleted,
            style: {
              stroke: isCompleted ? '#a1a1aa' : '#9ca3af', // gray-400 para completados, gray-400 para pendientes
              strokeWidth: 2,
              strokeDasharray: isCompleted ? '0' : '5,5' // dashed para pendientes, sólida para completados
            },
            markerEnd: {
              type: 'arrowclosed',
              color: isCompleted ? '#a1a1aa' : '#9ca3af'
            }
          });
        }
      } else {
        console.warn(`Nodo padre ${parentId} no encontrado para crear edge hacia ${nodeId}`);
      }
    }
    
    // Procesar hijos recursivamente y crear sus edges
    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      node.children.forEach(child => {
        createNodesAndEdges(child, nodeId);
      });
    }
  }

  // Crear todos los nodos y edges desde los nodos raíz
  if (Array.isArray(processTree.processNodes)) {
    processTree.processNodes.forEach(rootNode => {
      createNodesAndEdges(rootNode);
    });
  }

  return { nodes, edges };
}

/**
 * Calcula el layout automático usando dagre
 */
export function getLayoutedElements(nodes, edges, direction = 'LR') {
  if (nodes.length === 0) return { nodes, edges };

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Configuración del layout
  dagreGraph.setGraph({
    rankdir: direction, // LR = Left to Right, TB = Top to Bottom
    nodesep: 100,      // Separación horizontal entre nodos
    ranksep: 200,      // Separación vertical entre niveles
    edgesep: 50        // Separación entre edges paralelos
  });

  // Añadir nodos al grafo (tamaño variable según modo)
  nodes.forEach((node) => {
    const isDetailed = node.data?.viewMode === 'detailed';
    dagreGraph.setNode(node.id, {
      width: isDetailed ? 400 : 300,
      height: isDetailed ? 300 : 200
    });
  });

  // Añadir edges al grafo
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calcular layout
  dagre.layout(dagreGraph);

  // Aplicar posiciones calculadas
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const isDetailed = node.data?.viewMode === 'detailed';
    const nodeWidth = isDetailed ? 400 : 300;
    const nodeHeight = isDetailed ? 300 : 200;
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (nodeWidth / 2), // Centrar el nodo
        y: nodeWithPosition.y - (nodeHeight / 2)
      }
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Layout manual simple (fallback si dagre falla)
 */
export function getManualLayout(nodes, edges) {
  if (nodes.length === 0) return { nodes, edges };

  const levels = {};
  const nodeLevels = new Map();

  // Calcular nivel de cada nodo
  nodes.forEach(node => {
    const level = getNodeLevel(node.id, edges);
    nodeLevels.set(node.id, level);
    
    if (!levels[level]) levels[level] = [];
    levels[level].push(node);
  });

  // Posicionar nodos por nivel
  const layoutedNodes = nodes.map(node => {
    const level = nodeLevels.get(node.id);
    const nodesInLevel = levels[level];
    const indexInLevel = nodesInLevel.findIndex(n => n.id === node.id);
    const isDetailed = node.data?.viewMode === 'detailed';
    
    const x = level * (isDetailed ? 450 : 350); // Separación horizontal (más espacio si es detallado)
    const y = indexInLevel * (isDetailed ? 320 : 220); // Separación vertical (más espacio si es detallado)
    
    return {
      ...node,
      position: { x, y }
    };
  });

  return { nodes: layoutedNodes, edges };
}

