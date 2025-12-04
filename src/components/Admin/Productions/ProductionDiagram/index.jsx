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
import Loader from '@/components/Utilities/Loader'
import { EmptyState } from '@/components/Utilities/EmptyState'
import { Package, Eye, EyeOff, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'

const nodeTypes = {
  processNode: ProcessNode
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
    // Por ahora solo 'detailed' incluye información extra, 'accounting' se implementará después
    const includeDetails = viewMode === 'detailed' || viewMode === 'accounting'
    const result = transformProcessTreeToFlow(processTree, includeDetails, viewMode)
    
    // Agregar función de navegación a cada nodo
    result.nodes = result.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onNavigate: () => navigateToRecord(node.data.recordId)
      }
    }))
    
    return result
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
        <Loader />
      </div>
    )
  }

  if (!processTree || !processTree.processNodes || processTree.processNodes.length === 0) {
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

// Definición de vistas disponibles
const VIEW_MODES = {
  simple: {
    id: 'simple',
    label: 'Vista Simple',
    icon: EyeOff,
    description: 'Información básica del proceso',
    enabled: true
  },
  detailed: {
    id: 'detailed',
    label: 'Vista Detallada',
    icon: Eye,
    description: 'Incluye productos y detalles',
    enabled: true
  },
  accounting: {
    id: 'accounting',
    label: 'Vista Contabilidad',
    icon: Calculator,
    description: 'Información contable y costos',
    enabled: false // Por ahora inoperativa
  }
}

// Definición de vistas disponibles (exportada para uso externo)
export const VIEW_MODES_CONFIG = {
  simple: {
    id: 'simple',
    label: 'Simple',
    icon: EyeOff,
    description: 'Información básica del proceso',
    enabled: true
  },
  detailed: {
    id: 'detailed',
    label: 'Detallada',
    icon: Eye,
    description: 'Incluye productos y detalles',
    enabled: true
  },
  accounting: {
    id: 'accounting',
    label: 'Contabilidad',
    icon: Calculator,
    description: 'Información contable y costos',
    enabled: false // Por ahora inoperativa
  }
}

// Componente del selector de vistas para usar en la cabecera (simula diseño de tabs sin usar Tabs)
export function ViewModeSelector({ viewMode, onViewModeChange }) {
  return (
    <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 gap-1">
      {Object.values(VIEW_MODES_CONFIG).map((mode) => {
        const Icon = mode.icon
        const isActive = viewMode === mode.id
        const isDisabled = !mode.enabled
        
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => {
              if (!isDisabled && mode.enabled) {
                onViewModeChange(mode.id)
              }
            }}
            disabled={isDisabled}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 px-3 py-1 text-sm font-medium',
              'transition-all duration-200 rounded-md',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isDisabled && 'opacity-50 cursor-not-allowed',
              !isDisabled && 'hover:bg-muted/80 cursor-pointer',
              isActive && 'bg-background text-foreground shadow-sm',
              !isActive && !isDisabled && 'text-muted-foreground'
            )}
            title={isDisabled ? 'Próximamente' : mode.description}
          >
            <Icon className={cn('h-3.5 w-3.5', isActive && 'text-primary')} />
            <span className="text-xs">{mode.label}</span>
          </button>
        )
      })}
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
        viewModes={VIEW_MODES_CONFIG}
      />
    </ReactFlowProvider>
  )
}

