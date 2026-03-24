'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { transformProcessTreeToFlow, getLayoutedElements, getManualLayout } from '../utils/diagramTransformers'
import ProcessNode from './components/ProcessNode'
import SalesNode from './components/SalesNode'
import StockNode from './components/StockNode'
import ReprocessedNode from './components/ReprocessedNode'
import RestantesNode from './components/RestantesNode'
import Loader from '@/components/Utilities/Loader'
import { EmptyState } from '@/components/Utilities/EmptyState'
import { Package, AlertCircle } from 'lucide-react'

const nodeTypes = {
  processNode: ProcessNode,
  salesNode: SalesNode,
  stockNode: StockNode,
  reprocessedNode: ReprocessedNode,
  restantesNode: RestantesNode
}

function FlowContent({ processTree, productionId, loading, viewMode, onViewModeChange, viewModes }) {
  const router = useRouter()
  const { fitView } = useReactFlow()

  // Función para navegar a un record (definida antes de usarse en useMemo)
  const navigateToRecord = useCallback((recordId) => {
    router.push(`/admin/productions/${productionId}/records/${recordId}`)
  }, [router, productionId])

  // Transformar datos del API a formato React Flow
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!processTree || !processTree.processNodes) {
      return { nodes: [], edges: [] }
    }
    try {
      // Por ahora solo 'detailed' incluye información extra, 'accounting' se implementará después
      const includeDetails = viewMode === 'detailed' || viewMode === 'accounting'
      const result = transformProcessTreeToFlow(processTree, includeDetails, viewMode)
      
      // Agregar función de navegación a cada nodo (solo para nodos de proceso)
      result.nodes = result.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          // Solo agregar onNavigate si es un nodo de proceso con recordId
          onNavigate: node.type === 'processNode' && node.data.recordId
            ? () => navigateToRecord(node.data.recordId)
            : undefined
        }
      }))
      
      return result
    } catch (error) {
      console.error('Error al transformar el árbol de procesos:', error)
      return { nodes: [], edges: [] }
    }
  }, [processTree, viewMode, navigateToRecord])

  // Aplicar layout automático
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (initialNodes.length === 0) {
      return { nodes: [], edges: [] }
    }
    try {
      return getLayoutedElements(initialNodes, initialEdges, 'LR')
    } catch (error) {
      console.warn('Error en layout automático, usando layout manual:', error)
      return getManualLayout(initialNodes, initialEdges)
    }
  }, [initialNodes, initialEdges])

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  // Actualizar nodos y edges cuando cambian los datos
  useEffect(() => {
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges])

  // Ajustar vista cuando se cargan los nodos
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 })
      }, 100)
    }
  }, [nodes.length, fitView])

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <Loader text="Cargando diagrama de procesos..." />
      </div>
    )
  }

  // Verificar si hay datos y si se crearon nodos después de la transformación
  const hasProcessTreeData = processTree && processTree.processNodes && processTree.processNodes.length > 0
  const hasTransformedNodes = nodes.length > 0 || initialNodes.length > 0

  // Si processTree es null, probablemente hubo un error al cargar los datos
  if (processTree === null) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <EmptyState
          icon={<AlertCircle className="h-12 w-12 text-destructive" />}
          title="Error al cargar el diagrama"
          description="No se pudo cargar el árbol de procesos. Esto puede deberse a un error en el servidor. Por favor, verifica la consola para más detalles o contacta al administrador."
        />
      </div>
    )
  }

  if (!hasProcessTreeData) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <EmptyState
          icon={<Package className="h-12 w-12 text-muted-foreground" />}
          title="No hay procesos registrados"
          description="Crea procesos de producción para visualizar el diagrama"
        />
      </div>
    )
  }

  // Si hay datos en el árbol pero no se crearon nodos, puede haber un error en la transformación
  if (hasProcessTreeData && !hasTransformedNodes) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <EmptyState
          icon={<Package className="h-12 w-12 text-muted-foreground" />}
          title="Error al procesar el diagrama"
          description="Hay procesos registrados pero no se pudieron visualizar. Por favor, recarga la página."
        />
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Diagrama */}
      <div className="h-[600px] w-full border rounded-lg bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          attributionPosition="bottom-left"
          className="bg-background"
        >
          <Controls className="bg-background border rounded-md shadow-sm" />
          <Background
            variant="dots"
            gap={16}
            size={1}
            color="hsl(var(--muted))"
          />
        </ReactFlow>
      </div>
    </div>
  )
}

export default function ProductionDiagram({ processTree, productionId, loading = false, viewMode: externalViewMode, onViewModeChange: externalOnViewModeChange }) {
  const [internalViewMode, setInternalViewMode] = useState('simple')
  
  // Usar viewMode externo si se proporciona, sino usar el interno
  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode
  const onViewModeChange = externalOnViewModeChange || setInternalViewMode

  return (
    <ReactFlowProvider>
      <FlowContent
        processTree={processTree}
        productionId={productionId}
        loading={loading}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />
    </ReactFlowProvider>
  )
}
