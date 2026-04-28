'use client'

import React from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { formatWeight, getWeight, formatAverageWeight, getConsumedWeight, getConsumedBoxes, getProductName } from '@/helpers/production/formatters'
import { formatDecimal } from '@/helpers/formats/numbers/formatNumbers'
import CostDisplay from './CostDisplay'
import CostBreakdownView from './CostBreakdownView'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Plus, Trash2, Package, Edit, Save, X, Loader2, ArrowUp, Sparkles, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import { EmptyState } from '@/components/Utilities/EmptyState'
import Loader from '@/components/Utilities/Loader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/Shadcn/Combobox'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useProductionOutputsManager } from '@/hooks/production/useProductionOutputsManager'
import { useProductionRecordContextOptional } from '@/context/ProductionRecordContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const roundToTwo = (value) => Math.round((parseFloat(value || 0) + Number.EPSILON) * 100) / 100

const getSourceKey = (source) => {
    if (!source) return null
    if (source.source_type === 'stock_product' && source.product_id != null) {
        return `stock_product:${source.product_id}`
    }
    if (source.source_type === 'parent_output' && source.production_output_consumption_id != null) {
        return `parent_output:${source.production_output_consumption_id}`
    }
    return null
}

const getSourceKeyFromValue = (value) => {
    if (!value) return null
    const [type, id] = value.split('-')
    if (!type || !id) return null
    return `${type}:${id}`
}

const parseSourceValue = (value) => {
    const [type, id] = (value || '').split('-')
    if (!type || !id) return null

    return {
        source_type: type,
        product_id: type === 'stock_product' ? parseInt(id, 10) : null,
        production_output_consumption_id: type === 'parent_output' ? parseInt(id, 10) : null,
    }
}

const buildSourceOptions = (availableInputs, availableConsumptions) => [
    ...availableInputs.map((input) => ({
        key: `stock_product:${input.productId ?? input.id}`,
        value: `stock_product-${input.productId ?? input.id}`,
        source_type: 'stock_product',
        product_id: input.productId ?? input.id,
        matched_product_id: input.productId ?? input.product?.id ?? input.id,
        production_output_consumption_id: null,
        typeLabel: 'Stock',
        label: input.product?.name || `Producto #${input.productId ?? input.id}`,
        secondaryLabel: `${formatWeight(input.totalWeight)} consumidos desde stock`,
        totalBoxes: parseFloat(input.totalBoxes || 0) || 0,
        totalWeight: parseFloat(input.totalWeight || 0),
    })),
    ...availableConsumptions.map((consumption) => ({
        key: `parent_output:${consumption.id}`,
        value: `parent_output-${consumption.id}`,
        source_type: 'parent_output',
        product_id: null,
        matched_product_id: consumption.product?.id ?? null,
        production_output_consumption_id: consumption.id,
        typeLabel: 'Padre',
        label: consumption.product?.name || `Consumo #${consumption.id}`,
        secondaryLabel: `Consumo #${consumption.id} · ${formatWeight(consumption.consumedWeightKg)}`,
        totalBoxes: parseFloat(consumption.totalBoxes ?? consumption.consumedBoxes ?? 0) || 0,
        totalWeight: parseFloat(consumption.consumedWeightKg || 0),
    })),
]

function SortablePriorityItem({ item, usage, disabled = false }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.key,
        disabled,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-xs ${
                isDragging ? 'shadow-md ring-1 ring-primary/30' : ''
            }`}
        >
            <button
                type="button"
                className="cursor-grab text-muted-foreground active:cursor-grabbing disabled:cursor-default"
                {...attributes}
                {...listeners}
                disabled={disabled}
                aria-label={`Mover prioridad de ${item.label}`}
            >
                ::
            </button>
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                    {item.typeLabel} · {item.label}
                </p>
                <p className="truncate text-muted-foreground">
                    Restante: {formatWeight(usage?.remainingSourceWeight || 0)} / {formatWeight(item.totalWeight)}
                </p>
            </div>
        </div>
    )
}

function SortableOutputPriorityItem({ item, disabled = false }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
        disabled,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-xs ${
                isDragging ? 'shadow-md ring-1 ring-primary/30' : ''
            }`}
        >
            <button
                type="button"
                className="cursor-grab text-muted-foreground active:cursor-grabbing disabled:cursor-default"
                {...attributes}
                {...listeners}
                disabled={disabled}
                aria-label={`Mover prioridad de ${item.label}`}
            >
                ::
            </button>
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{item.label}</p>
                <p className="truncate text-muted-foreground">
                    Peso objetivo: {formatWeight(item.weight)}
                </p>
            </div>
        </div>
    )
}

const ProductionOutputsManager = ({ productionRecordId, initialOutputs: initialOutputsProp = [], onRefresh, hideTitle = false, renderInCard = false, cardTitle, cardDescription }) => {
    const api = useProductionOutputsManager({ productionRecordId, initialOutputsProp, onRefresh })
    const recordContext = useProductionRecordContextOptional()
    const record = recordContext?.record
    /** Misma lista que `record.parentOutputConsumptions`, memoizada en contexto (mejor que leer solo `record`). */
    const recordConsumptions = recordContext?.recordConsumptions ?? record?.parentOutputConsumptions
    const {
        outputs,
        products,
        productsLoading,
        loading,
        error,
        formData,
        setFormData,
        breakdownOutputId,
        setBreakdownOutputId,
        breakdownDialogOpen,
        setBreakdownDialogOpen,
        expandedSourceRowId,
        setExpandedSourceRowId,
        availableInputs,
        availableConsumptions,
        sourcesLoading,
        sourcesData,
        manageDialogOpen,
        setManageDialogOpen,
        editableOutputs,
        setEditableOutputs,
        newRows,
        setNewRows,
        saving,
        isManageDialogDirty,
        manageDialogDataReady,
        copyingFromConsumption,
        sourceSelectionDialogOpen,
        setSourceSelectionDialogOpen,
        fromParentConsumption,
        setFromParentConsumption,
        fromRawMaterialStock,
        setFromRawMaterialStock,
        availableProductsDialogOpen,
        setAvailableProductsDialogOpen,
        availableProducts,
        loadingAvailableProducts,
        selectedProducts,
        setSelectedProducts,
        showBoxes,
        handleToggleBoxes,
        loadOutputsOnly,
        handleCreateOutput,
        handleDeleteOutput,
        deleteOutputConfirm,
        setDeleteOutputConfirm,
        confirmDeleteOutput,
        handleEditClick,
        resetForm,
        openManageDialog,
        addNewRow,
        handleOpenSourceSelectionDialog,
        handleConfirmSourceSelection,
        removeRow,
        updateRow,
        handleSaveAll,
        getAllRows,
        loadAvailableProducts,
        handleOpenAvailableProductsDialog,
        toggleProductSelection,
        handleAddSelectedProducts
    } = api

    const persistedTotalInputWeight = parseFloat(record?.totalInputWeight || 0)
    const persistedTotalOutputWeight = parseFloat(record?.totalOutputWeight || 0)
    const [priorityDialogRowId, setPriorityDialogRowId] = React.useState(null)
    const [globalPriorityDialogOpen, setGlobalPriorityDialogOpen] = React.useState(false)
    const [globalOutputPriorityIds, setGlobalOutputPriorityIds] = React.useState([])
    const [globalSourcePriorityKeys, setGlobalSourcePriorityKeys] = React.useState([])
    const [manageDialogActiveTab, setManageDialogActiveTab] = React.useState('outputs')
    const [manageDialogSession, setManageDialogSession] = React.useState(0)
    const prevManageDialogOpenRef = React.useRef(false)

    React.useEffect(() => {
        if (manageDialogOpen && !prevManageDialogOpenRef.current) {
            setManageDialogSession((s) => s + 1)
        }
        prevManageDialogOpenRef.current = manageDialogOpen
    }, [manageDialogOpen])

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
    const allRows = getAllRows()
    const draftTotalOutputWeight = React.useMemo(
        () => allRows.reduce((sum, row) => sum + (parseFloat(row.weight_kg || 0) || 0), 0),
        [allRows]
    )
    const processTransformationFactor = React.useMemo(() => {
        if (persistedTotalInputWeight <= 0) return 1
        if (draftTotalOutputWeight > 0) {
            return draftTotalOutputWeight / persistedTotalInputWeight
        }
        if (persistedTotalOutputWeight > 0) {
            return persistedTotalOutputWeight / persistedTotalInputWeight
        }
        return 1
    }, [draftTotalOutputWeight, persistedTotalInputWeight, persistedTotalOutputWeight])
    const getAdjustedOutputWeightFromSource = React.useCallback((sourceWeight) => {
        const parsedSourceWeight = parseFloat(sourceWeight || 0)
        return parsedSourceWeight * processTransformationFactor
    }, [processTransformationFactor])
    const getSourceWeightFromAdjustedOutputWeight = React.useCallback((adjustedOutputWeight) => {
        const parsedAdjustedOutputWeight = parseFloat(adjustedOutputWeight || 0)
        if (processTransformationFactor <= 0) return 0
        return parsedAdjustedOutputWeight / processTransformationFactor
    }, [processTransformationFactor])
    const validOutputRows = React.useMemo(
        () => allRows.filter((row) => row.product_id && parseFloat(row.weight_kg || 0) > 0),
        [allRows]
    )
    const validOutputRowMap = React.useMemo(
        () => new Map(validOutputRows.map((row) => [String(row.id), row])),
        [validOutputRows]
    )
    const hasAnyAssignedSources = React.useMemo(
        () => allRows.some((row) => Array.isArray(row.sources) && row.sources.length > 0),
        [allRows]
    )

    const sourceOptions = React.useMemo(
        () => buildSourceOptions(availableInputs, availableConsumptions),
        [availableInputs, availableConsumptions]
    )

    const sourceOptionsMap = React.useMemo(
        () => new Map(sourceOptions.map((option) => [option.key, option])),
        [sourceOptions]
    )

    const sourceUsageMap = React.useMemo(() => {
        const usage = new Map(
            sourceOptions.map((option) => [
                option.key,
                {
                    ...option,
                    assignedSourceWeight: 0,
                    assignedTransformedWeight: 0,
                    assignedLines: 0,
                }
            ])
        )

        allRows.forEach((row) => {
            if (!Array.isArray(row.sources)) return
            row.sources.forEach((source) => {
                const key = getSourceKey(source)
                if (!key || !usage.has(key)) return
                const weight = parseFloat(source.contributed_weight_kg || 0) || 0
                const current = usage.get(key)
                current.assignedSourceWeight += weight
                current.assignedTransformedWeight += getAdjustedOutputWeightFromSource(weight)
                current.assignedLines += 1
            })
        })

        usage.forEach((entry) => {
            entry.totalSourceWeight = roundToTwo(entry.totalWeight)
            entry.totalTransformedWeight = roundToTwo(getAdjustedOutputWeightFromSource(entry.totalWeight))
            entry.assignedSourceWeight = roundToTwo(entry.assignedSourceWeight)
            entry.assignedTransformedWeight = roundToTwo(entry.assignedTransformedWeight)
            entry.remainingSourceWeight = roundToTwo(Math.max(0, entry.totalWeight - entry.assignedSourceWeight))
            entry.remainingTransformedWeight = roundToTwo(getAdjustedOutputWeightFromSource(entry.remainingSourceWeight))
            entry.usagePercentage = entry.totalWeight > 0 ? roundToTwo((entry.assignedSourceWeight / entry.totalWeight) * 100) : 0
        })

        return usage
    }, [allRows, sourceOptions, getAdjustedOutputWeightFromSource])

    const getLineAssignedWeight = React.useCallback((row, sourceIndex) => {
        if (!Array.isArray(row?.sources)) return 0
        return parseFloat(row.sources[sourceIndex]?.contributed_weight_kg || 0) || 0
    }, [])

    const getAvailableSourceWeightForLine = React.useCallback((row, sourceIndex, sourceKey) => {
        if (!sourceKey) return 0
        const usage = sourceUsageMap.get(sourceKey)
        if (!usage) return 0
        return roundToTwo(usage.remainingSourceWeight + getLineAssignedWeight(row, sourceIndex))
    }, [getLineAssignedWeight, sourceUsageMap])

    const getOrderedPriorityKeys = React.useCallback((row) => {
        const explicit = Array.isArray(row?.source_priority) ? row.source_priority.filter((key) => sourceOptionsMap.has(key)) : []
        const existing = Array.isArray(row?.sources)
            ? row.sources.map((source) => getSourceKey(source)).filter((key) => key && sourceOptionsMap.has(key))
            : []
        const remaining = sourceOptions.map((option) => option.key).filter((key) => !explicit.includes(key) && !existing.includes(key))
        return [...explicit, ...existing.filter((key) => !explicit.includes(key)), ...remaining]
    }, [sourceOptions, sourceOptionsMap])

    const setRowSourcePriority = React.useCallback((rowId, orderedKeys) => {
        updateRow(rowId, 'source_priority', orderedKeys)
    }, [updateRow])

    const recalculateSourcesForRow = React.useCallback((row, sources) => {
        const outputWeight = parseFloat(row.weight_kg || 0) || 0
        return (sources || []).map((source) => {
            const sourceWeight = parseFloat(source.contributed_weight_kg || 0) || 0
            const transformedWeight = getAdjustedOutputWeightFromSource(sourceWeight)
            return {
                ...source,
                contributed_weight_kg: source.contributed_weight_kg === null || source.contributed_weight_kg === undefined || source.contributed_weight_kg === ''
                    ? null
                    : roundToTwo(sourceWeight),
                contribution_percentage: outputWeight > 0
                    ? roundToTwo((transformedWeight / outputWeight) * 100)
                    : null,
            }
        })
    }, [getAdjustedOutputWeightFromSource])

    const clearRowSources = React.useCallback((rowId) => {
        updateRow(rowId, 'sources', [])
    }, [updateRow])
    const clearAllSources = React.useCallback(() => {
        setEditableOutputs((prev) =>
            prev.map((row) => ({
                ...row,
                sources: [],
                source_priority: [],
            }))
        )
        setNewRows((prev) =>
            prev.map((row) => ({
                ...row,
                sources: [],
                source_priority: [],
            }))
        )
    }, [setEditableOutputs, setNewRows])

    const distributeSourcesProportionally = React.useCallback(() => {
        const validRows = allRows.filter((row) => parseFloat(row.weight_kg || 0) > 0)
        const availableSources = sourceOptions.filter((option) => option.totalWeight > 0)

        if (validRows.length === 0 || availableSources.length === 0) {
            return
        }

        allRows.forEach((row) => {
            updateRow(row.id, 'sources', [])
            updateRow(row.id, 'source_priority', availableSources.map((option) => option.key))
        })

        const totalAvailableSourceWeight = availableSources.reduce((sum, source) => sum + source.totalWeight, 0)
        const totalRequiredSourceWeight = validRows.reduce(
            (sum, row) => sum + getSourceWeightFromAdjustedOutputWeight(parseFloat(row.weight_kg || 0) || 0),
            0
        )
        const coverageRatio = totalRequiredSourceWeight > 0
            ? Math.min(1, totalAvailableSourceWeight / totalRequiredSourceWeight)
            : 0

        validRows.forEach((row) => {
            const requiredSourceWeight = getSourceWeightFromAdjustedOutputWeight(parseFloat(row.weight_kg || 0) || 0)
            const targetSourceWeight = requiredSourceWeight * coverageRatio
            const nextSources = availableSources
                .map((option) => {
                    const sourceWeight = roundToTwo(targetSourceWeight * (option.totalWeight / totalAvailableSourceWeight))
                    if (sourceWeight <= 0) return null
                    return {
                        source_type: option.source_type,
                        product_id: option.product_id,
                        production_output_consumption_id: option.production_output_consumption_id,
                        contributed_weight_kg: sourceWeight,
                        contribution_percentage: null,
                    }
                })
                .filter(Boolean)

            updateRow(row.id, 'sources', recalculateSourcesForRow(row, nextSources))
        })
    }, [allRows, getSourceWeightFromAdjustedOutputWeight, recalculateSourcesForRow, sourceOptions, updateRow])

    const distributeMatchingSourcesByProduct = React.useCallback(() => {
        const validRows = allRows.filter((row) => row.product_id && parseFloat(row.weight_kg || 0) > 0)
        const availableSources = sourceOptions.filter((option) => option.totalWeight > 0)

        if (validRows.length === 0 || availableSources.length === 0) {
            return
        }

        if (Math.abs(roundToTwo(processTransformationFactor) - 1) > 0.01) {
            toast.error('La distribución 1:1 solo está disponible cuando entrada y salida del nodo tienen la misma cantidad total.')
            return
        }

        const groupedOutputs = new Map()
        validRows.forEach((row) => {
            const productId = String(row.product_id)
            if (!groupedOutputs.has(productId)) {
                groupedOutputs.set(productId, {
                    rows: [],
                    totalWeight: 0,
                })
            }
            const group = groupedOutputs.get(productId)
            group.rows.push(row)
            group.totalWeight += parseFloat(row.weight_kg || 0) || 0
        })

        const groupedSources = new Map()
        availableSources.forEach((option) => {
            const productId = String(option.matched_product_id || '')
            if (!productId) return
            if (!groupedSources.has(productId)) {
                groupedSources.set(productId, {
                    totalSourceWeight: 0,
                    options: [],
                })
            }
            const group = groupedSources.get(productId)
            group.totalSourceWeight += option.totalWeight
            group.options.push(option)
        })

        const allProductIds = new Set([...groupedOutputs.keys(), ...groupedSources.keys()])
        const mismatchMessages = []

        allProductIds.forEach((productId) => {
            const outputGroup = groupedOutputs.get(productId)
            const sourceGroup = groupedSources.get(productId)

            if (!outputGroup || !sourceGroup) {
                mismatchMessages.push('No coinciden los productos entre entradas y salidas.')
                return
            }

            const weightDifference = Math.abs(roundToTwo(outputGroup.totalWeight) - roundToTwo(sourceGroup.totalSourceWeight))
            if (weightDifference > 0.01) {
                mismatchMessages.push('No coinciden los pesos entre entradas y salidas del mismo producto.')
            }
        })

        if (mismatchMessages.length > 0) {
            toast.error('La distribución 1:1 requiere que entradas y salidas coincidan en productos y cantidades.')
            return
        }

        validRows.forEach((row) => {
            const matchingSources = availableSources.filter(
                (option) => String(option.matched_product_id || '') === String(row.product_id || '')
            )

            if (matchingSources.length === 0) {
                return
            }

            const totalMatchingWeight = matchingSources.reduce((sum, source) => sum + source.totalWeight, 0)
            if (totalMatchingWeight <= 0) {
                return
            }

            const targetSourceWeight = Math.min(parseFloat(row.weight_kg || 0) || 0, totalMatchingWeight)

            const nextSources = matchingSources
                .map((option) => {
                    const sourceWeight = roundToTwo(targetSourceWeight * (option.totalWeight / totalMatchingWeight))
                    if (sourceWeight <= 0) return null
                    return {
                        source_type: option.source_type,
                        product_id: option.product_id,
                        production_output_consumption_id: option.production_output_consumption_id,
                        contributed_weight_kg: sourceWeight,
                        contribution_percentage: null,
                    }
                })
                .filter(Boolean)

            updateRow(row.id, 'source_priority', matchingSources.map((option) => option.key))
            updateRow(row.id, 'sources', recalculateSourcesForRow(row, nextSources))
        })
    }, [allRows, processTransformationFactor, recalculateSourcesForRow, sourceOptions, updateRow])

    const addOutputsFromConsumptionsAndDistributeMatchingSources = React.useCallback(() => {
        const availableSources = sourceOptions.filter(
            (option) => option.totalWeight > 0 && option.matched_product_id !== null && option.matched_product_id !== undefined
        )

        if (availableSources.length === 0) {
            return
        }

        const groupedByProduct = new Map()
        availableSources.forEach((option) => {
            const productId = String(option.matched_product_id)
            if (!groupedByProduct.has(productId)) {
                groupedByProduct.set(productId, {
                    productId,
                    totalSourceWeight: 0,
                    totalBoxes: 0,
                    options: [],
                })
            }
            const group = groupedByProduct.get(productId)
            group.totalSourceWeight += option.totalWeight
            group.totalBoxes += option.totalBoxes || 0
            group.options.push(option)
        })

        const existingRowsByProduct = new Map()
        allRows.forEach((row) => {
            if (!row.product_id) return
            existingRowsByProduct.set(String(row.product_id), row)
        })

        const buildSourcesForRow = (row, options) => {
            const totalMatchingWeight = options.reduce((sum, option) => sum + option.totalWeight, 0)
            if (totalMatchingWeight <= 0) return []

            const requiredSourceWeight = getSourceWeightFromAdjustedOutputWeight(parseFloat(row.weight_kg || 0) || 0)
            const targetSourceWeight = Math.min(requiredSourceWeight, totalMatchingWeight)

            return recalculateSourcesForRow(
                row,
                options
                    .map((option) => {
                        const sourceWeight = roundToTwo(targetSourceWeight * (option.totalWeight / totalMatchingWeight))
                        if (sourceWeight <= 0) return null
                        return {
                            source_type: option.source_type,
                            product_id: option.product_id,
                            production_output_consumption_id: option.production_output_consumption_id,
                            contributed_weight_kg: sourceWeight,
                            contribution_percentage: null,
                        }
                    })
                    .filter(Boolean)
            )
        }

        setEditableOutputs((prev) =>
            prev.map((row) => {
                const group = groupedByProduct.get(String(row.product_id || ''))
                if (!group || !(parseFloat(row.weight_kg || 0) > 0)) return row
                return {
                    ...row,
                    source_priority: group.options.map((option) => option.key),
                    sources: buildSourcesForRow(row, group.options),
                }
            })
        )

        const timestamp = Date.now()
        setNewRows((prev) => {
            const nextRows = [...prev]
            const knownProductIds = new Set([
                ...allRows.map((row) => (row.product_id ? String(row.product_id) : null)).filter(Boolean),
                ...prev.map((row) => (row.product_id ? String(row.product_id) : null)).filter(Boolean),
            ])

            groupedByProduct.forEach((group) => {
                if (knownProductIds.has(group.productId)) return

                const weightKg = roundToTwo(getAdjustedOutputWeightFromSource(group.totalSourceWeight))
                const newRow = {
                    id: `new-matching-source-${timestamp}-${group.productId}`,
                    product_id: group.productId,
                    boxes: group.totalBoxes > 0 ? String(group.totalBoxes) : '',
                    weight_kg: weightKg > 0 ? weightKg.toFixed(2) : '',
                    source_priority: group.options.map((option) => option.key),
                    sources: [],
                    isNew: true,
                }

                newRow.sources = buildSourcesForRow(newRow, group.options)
                nextRows.push(newRow)
                knownProductIds.add(group.productId)
            })

            return nextRows
        })
    }, [allRows, getAdjustedOutputWeightFromSource, getSourceWeightFromAdjustedOutputWeight, recalculateSourcesForRow, setEditableOutputs, sourceOptions])

    const completeRowWithPriority = React.useCallback((row) => {
        const outputWeight = parseFloat(row.weight_kg || 0) || 0
        if (outputWeight <= 0) return

        const orderedKeys = getOrderedPriorityKeys(row)
        const currentSources = Array.isArray(row.sources) ? [...row.sources] : []
        const currentTransformedWeight = currentSources.reduce(
            (sum, source) => sum + getAdjustedOutputWeightFromSource(parseFloat(source.contributed_weight_kg || 0) || 0),
            0
        )
        let remainingTransformedWeight = Math.max(0, outputWeight - currentTransformedWeight)

        if (remainingTransformedWeight <= 0) {
            updateRow(row.id, 'sources', recalculateSourcesForRow(row, currentSources))
            return
        }

        const nextSources = [...currentSources]

        orderedKeys.forEach((sourceKey) => {
            if (remainingTransformedWeight <= 0) return
            const option = sourceOptionsMap.get(sourceKey)
            if (!option) return

            const existingIndex = nextSources.findIndex((source) => getSourceKey(source) === sourceKey)
            const lineReferenceIndex = existingIndex >= 0 ? existingIndex : nextSources.length
            const availableSourceWeight = getAvailableSourceWeightForLine(
                { ...row, sources: nextSources },
                lineReferenceIndex,
                sourceKey
            )

            if (availableSourceWeight <= 0) return

            const requiredSourceWeight = getSourceWeightFromAdjustedOutputWeight(remainingTransformedWeight)
            const sourceWeightToApply = roundToTwo(Math.min(availableSourceWeight, requiredSourceWeight))
            if (sourceWeightToApply <= 0) return

            if (existingIndex >= 0) {
                const currentWeight = parseFloat(nextSources[existingIndex].contributed_weight_kg || 0) || 0
                nextSources[existingIndex] = {
                    ...nextSources[existingIndex],
                    contributed_weight_kg: roundToTwo(currentWeight + sourceWeightToApply),
                }
            } else {
                nextSources.push({
                    source_type: option.source_type,
                    product_id: option.product_id,
                    production_output_consumption_id: option.production_output_consumption_id,
                    contributed_weight_kg: sourceWeightToApply,
                    contribution_percentage: null,
                })
            }

            remainingTransformedWeight = Math.max(
                0,
                remainingTransformedWeight - getAdjustedOutputWeightFromSource(sourceWeightToApply)
            )
        })

        updateRow(row.id, 'sources', recalculateSourcesForRow(row, nextSources))
    }, [
        getAdjustedOutputWeightFromSource,
        getAvailableSourceWeightForLine,
        getOrderedPriorityKeys,
        getSourceWeightFromAdjustedOutputWeight,
        recalculateSourcesForRow,
        sourceOptionsMap,
        updateRow,
    ])

    const openGlobalPriorityDialog = React.useCallback(() => {
        setGlobalOutputPriorityIds(validOutputRows.map((row) => String(row.id)))
        setGlobalSourcePriorityKeys(sourceOptions.map((option) => option.key))
        setGlobalPriorityDialogOpen(true)
    }, [sourceOptions, validOutputRows])

    const autoAssignSourcesByDoublePriority = React.useCallback(() => {
        const orderedRows = globalOutputPriorityIds
            .map((rowId) => validOutputRowMap.get(String(rowId)))
            .filter(Boolean)

        if (orderedRows.length === 0 || globalSourcePriorityKeys.length === 0) return

        const remainingSourceWeights = new Map(
            globalSourcePriorityKeys.map((sourceKey) => [
                sourceKey,
                roundToTwo(sourceOptionsMap.get(sourceKey)?.totalWeight || 0),
            ])
        )
        const nextSourcesByRowId = new Map()

        orderedRows.forEach((row) => {
            let remainingAdjustedWeight = parseFloat(row.weight_kg || 0) || 0
            const nextSources = []

            globalSourcePriorityKeys.forEach((sourceKey) => {
                if (remainingAdjustedWeight <= 0) return

                const option = sourceOptionsMap.get(sourceKey)
                if (!option) return

                const remainingSourceWeight = remainingSourceWeights.get(sourceKey) || 0
                if (remainingSourceWeight <= 0) return

                const requiredSourceWeight = getSourceWeightFromAdjustedOutputWeight(remainingAdjustedWeight)
                const sourceWeightToApply = roundToTwo(Math.min(remainingSourceWeight, requiredSourceWeight))
                if (sourceWeightToApply <= 0) return

                nextSources.push({
                    source_type: option.source_type,
                    product_id: option.product_id,
                    production_output_consumption_id: option.production_output_consumption_id,
                    contributed_weight_kg: sourceWeightToApply,
                    contribution_percentage: null,
                })

                remainingSourceWeights.set(
                    sourceKey,
                    roundToTwo(Math.max(0, remainingSourceWeight - sourceWeightToApply))
                )
                remainingAdjustedWeight = Math.max(
                    0,
                    remainingAdjustedWeight - getAdjustedOutputWeightFromSource(sourceWeightToApply)
                )
            })

            nextSourcesByRowId.set(String(row.id), recalculateSourcesForRow(row, nextSources))
        })

        setEditableOutputs((prev) =>
            prev.map((row) => {
                const hasPriority = globalOutputPriorityIds.includes(String(row.id))
                if (!hasPriority) return row
                return {
                    ...row,
                    source_priority: [...globalSourcePriorityKeys],
                    sources: nextSourcesByRowId.get(String(row.id)) || [],
                }
            })
        )
        setNewRows((prev) =>
            prev.map((row) => {
                const hasPriority = globalOutputPriorityIds.includes(String(row.id))
                if (!hasPriority) return row
                return {
                    ...row,
                    source_priority: [...globalSourcePriorityKeys],
                    sources: nextSourcesByRowId.get(String(row.id)) || [],
                }
            })
        )
        setGlobalPriorityDialogOpen(false)
    }, [
        getAdjustedOutputWeightFromSource,
        getSourceWeightFromAdjustedOutputWeight,
        globalOutputPriorityIds,
        globalSourcePriorityKeys,
        recalculateSourcesForRow,
        setEditableOutputs,
        setNewRows,
        sourceOptionsMap,
        validOutputRowMap,
    ])

    const globalSourceSummary = React.useMemo(
        () => Array.from(sourceUsageMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
        [sourceUsageMap]
    )
    const groupedGlobalSourceSummary = React.useMemo(() => ({
        stock: globalSourceSummary.filter((source) => source.source_type === 'stock_product'),
        parent: globalSourceSummary.filter((source) => source.source_type === 'parent_output'),
    }), [globalSourceSummary])
    const globalSourcesChartData = React.useMemo(
        () => globalSourceSummary.map((source) => ({
            shortName: source.label,
            name: source.label,
            fullName: `${source.typeLabel} · ${source.label}`,
            total: roundToTwo(source.totalSourceWeight),
            used: roundToTwo(source.assignedSourceWeight),
            remaining: roundToTwo(source.remainingSourceWeight),
            usagePercentage: roundToTwo(source.usagePercentage),
        })),
        [globalSourceSummary]
    )
    const globalSourcesChartConfig = React.useMemo(() => ({
        total: {
            label: 'Disponible',
            color: 'var(--chart-1)',
        },
        used: {
            label: 'Usado',
            color: 'var(--chart-3)',
        },
    }), [])
    const priorityDialogRow = allRows.find((row) => row.id === priorityDialogRowId) || null
    const globalOutputPriorityItems = React.useMemo(
        () =>
            globalOutputPriorityIds
                .map((rowId) => validOutputRowMap.get(String(rowId)))
                .filter(Boolean)
                .map((row) => ({
                    id: String(row.id),
                    label:
                        products.find((product) => String(product.value ?? product.id) === String(row.product_id))?.label ||
                        `Salida ${row.id}`,
                    weight: parseFloat(row.weight_kg || 0) || 0,
                })),
        [globalOutputPriorityIds, products, validOutputRowMap]
    )

    if (loading) {
        return (
            <div className="space-y-4 flex items-center justify-center py-12">
                <Loader />
            </div>
        )
    }

    if (error) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Error</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    // Diálogo simple eliminado - ya no se usa

    // Diálogo de selección de fuente
    const sourceSelectionDialog = (
        <Dialog open={sourceSelectionDialogOpen} onOpenChange={setSourceSelectionDialogOpen}>
            <DialogContent size="md">
                <DialogHeader>
                    <DialogTitle>Seleccionar Fuente de Datos</DialogTitle>
                    <DialogDescription>
                        Selecciona desde dónde deseas añadir automáticamente las salidas
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                        <Checkbox
                            id="from-parent-consumption"
                            checked={fromParentConsumption}
                            onCheckedChange={setFromParentConsumption}
                        />
                        <div className="flex-1 space-y-1">
                            <label
                                htmlFor="from-parent-consumption"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Consumo de proceso padre
                            </label>
                            <p className="text-xs text-muted-foreground">
                                Añade productos, pesos y cajas desde los consumos del proceso padre
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                        <Checkbox
                            id="from-raw-material-stock"
                            checked={fromRawMaterialStock}
                            onCheckedChange={setFromRawMaterialStock}
                        />
                        <div className="flex-1 space-y-1">
                            <label
                                htmlFor="from-raw-material-stock"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Consumo de materia prima desde stock
                            </label>
                            <p className="text-xs text-muted-foreground">
                                Añade productos desde los consumos de materia prima registrados en este proceso
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button
                        variant="outline"
                        onClick={() => setSourceSelectionDialogOpen(false)}
                        disabled={copyingFromConsumption}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmSourceSelection}
                        disabled={copyingFromConsumption || (!fromParentConsumption && !fromRawMaterialStock)}
                    >
                        {copyingFromConsumption ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Añadiendo...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Añadir
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )

    // Diálogo de productos disponibles
    const availableProductsDialog = (
        <Dialog open={availableProductsDialogOpen} onOpenChange={(open) => {
            setAvailableProductsDialogOpen(open)
            if (!open) {
                setSelectedProducts(new Set())
            }
        }}>
            <DialogContent size="4xl" className="max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Productos Disponibles para Salidas</DialogTitle>
                    <DialogDescription>
                        Selecciona los productos que deseas agregar automáticamente. Estos productos tienen cajas y pesos registrados en ventas, stock y reprocesados.
                    </DialogDescription>
                </DialogHeader>
                
                {loadingAvailableProducts ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : availableProducts.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-muted-foreground">
                            No hay productos disponibles para agregar como salidas.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <ScrollArea className="h-[500px] border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={selectedProducts.size === availableProducts.length && availableProducts.length > 0}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedProducts(new Set(availableProducts.map(p => p.product.id)))
                                                    } else {
                                                        setSelectedProducts(new Set())
                                                    }
                                                }}
                                            />
                                        </TableHead>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="text-right">Cajas Totales</TableHead>
                                        <TableHead className="text-right">Peso Total (kg)</TableHead>
                                        <TableHead>Fuentes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {availableProducts.map((item) => {
                                        const isSelected = selectedProducts.has(item.product.id)
                                        return (
                                            <TableRow 
                                                key={item.product.id}
                                                className={isSelected ? 'bg-muted/50' : ''}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleProductSelection(item.product.id)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {item.product.name}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.totalBoxes || 0}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatWeight(item.totalWeight || 0)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                        {item.sources?.sales && (item.sources.sales.boxes > 0 || item.sources.sales.weight > 0) && (
                                                            <span>Ventas: {item.sources.sales.boxes} cajas, {formatWeight(item.sources.sales.weight)}</span>
                                                        )}
                                                        {item.sources?.stock && (item.sources.stock.boxes > 0 || item.sources.stock.weight > 0) && (
                                                            <span>Stock: {item.sources.stock.boxes} cajas, {formatWeight(item.sources.stock.weight)}</span>
                                                        )}
                                                        {item.sources?.reprocessed && (item.sources.reprocessed.boxes > 0 || item.sources.reprocessed.weight > 0) && (
                                                            <span>Reprocesados: {item.sources.reprocessed.boxes} cajas, {formatWeight(item.sources.reprocessed.weight)}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        
                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button
                                variant="outline"
                                onClick={() => setAvailableProductsDialogOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleAddSelectedProducts}
                                disabled={selectedProducts.size === 0}
                                data-icon="inline-start"
                            >
                                <Plus />
                                Agregar {selectedProducts.size > 0 ? `${selectedProducts.size} ` : ''}Producto{selectedProducts.size !== 1 ? 's' : ''}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )

    // Diálogo de edición eliminado - toda la edición se hace desde el diálogo de gestión múltiple

    // Botón para el header (sin Dialog wrapper)
    const hasOutputs = outputs.length > 0
    const headerButton = (
        <Button onClick={openManageDialog} data-icon="inline-start">
            {hasOutputs ? (
                <>
                    <Edit />
                    Editar Salidas
                </>
            ) : (
                <>
                    <Plus />
                    Agregar Salidas
                </>
            )}
        </Button>
    )

    const mainContent = (
        <>
            {!hideTitle && !renderInCard && (
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Salidas Lógicas</h3>
                        <p className="text-sm text-muted-foreground">
                            Productos producidos en este proceso
                        </p>
                    </div>
                </div>
            )}
            {!renderInCard && (
                <div className={`flex items-center ${hideTitle ? 'justify-end' : 'justify-between'}`}>
                    {headerButton}
                </div>
            )}

            {/* Lista de outputs existentes */}
            <div
                className={cn(
                    renderInCard && outputs.length === 0 && 'flex min-h-0 flex-1 flex-col'
                )}
            >
            {outputs.length === 0 ? (
                <div
                    className={cn(
                        'text-center border-2 border-dashed rounded-lg bg-muted/30',
                        renderInCard
                            ? 'flex min-h-0 flex-1 flex-col items-center justify-center py-12'
                            : 'py-12'
                    )}
                >
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="rounded-full bg-primary/10 p-4">
                            <Package className="h-10 w-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-foreground">
                                No hay salidas registradas
                            </h4>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Agrega una salida para registrar los productos producidos en este proceso
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {!hideTitle && !renderInCard && (
                        <div>
                            <h4 className="text-sm font-semibold">Salidas Registradas ({outputs.length})</h4>
                            <p className="text-xs text-muted-foreground">
                                Productos producidos en este proceso
                            </p>
                        </div>
                    )}
                    <ScrollArea className={hideTitle ? 'h-64' : 'h-96'}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    {showBoxes && <TableHead>Cajas</TableHead>}
                                    <TableHead>Peso Total</TableHead>
                                    {showBoxes && <TableHead>Peso Promedio</TableHead>}
                                    <TableHead>Coste</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {outputs.map((output) => {
                                    const weight = getWeight(output)
                                    const avgWeight = formatAverageWeight(weight, output.boxes)
                                    return (
                                        <TableRow key={output.id}>
                                            <TableCell className="font-medium">
                                                {output.product?.name || 'N/A'}
                                            </TableCell>
                                            {showBoxes && <TableCell>{output.boxes || 0}</TableCell>}
                                            <TableCell>{formatWeight(weight)}</TableCell>
                                            {showBoxes && <TableCell>{avgWeight}</TableCell>}
                                            <TableCell>
                                                <CostDisplay output={output} showDetails={false} size="sm" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setBreakdownOutputId(output.id)
                                                            setBreakdownDialogOpen(true)
                                                        }}
                                                    >
                                                        Ver Desglose
                                                    </Button>
                                                    {!renderInCard && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEditClick(output)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteOutput(output.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            )}
            </div>
        </>
    )

    const priorityDialog = (
        <Dialog open={priorityDialogRowId !== null} onOpenChange={(open) => {
            if (!open) {
                setPriorityDialogRowId(null)
            }
        }}>
            <DialogContent size="4xl" className="max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Prioridad de fuentes</DialogTitle>
                    <DialogDescription>
                        Ordena las fuentes para completar esta salida al 100%. Se consumirán en este orden y siempre respetando la disponibilidad global restante.
                    </DialogDescription>
                </DialogHeader>

                {priorityDialogRow ? (
                    <div className="space-y-4 overflow-hidden">
                        <div className="rounded-lg border bg-muted/20 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {products.find((product) => String(product.value ?? product.id) === String(priorityDialogRow.product_id))?.label || 'Salida seleccionada'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Peso objetivo: {formatWeight(priorityDialogRow.weight_kg || 0)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Cobertura actual</p>
                                    <p className="text-sm font-semibold text-foreground">
                                        {formatDecimal(
                                            (priorityDialogRow.sources || []).reduce((sum, source) => sum + (parseFloat(source.contribution_percentage) || 0), 0)
                                        )}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        <ScrollArea className="h-[50vh] rounded-md border">
                            <div className="p-4">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={({ active, over }) => {
                                        if (!over || active.id === over.id || !priorityDialogRow) return
                                        const orderedKeys = getOrderedPriorityKeys(priorityDialogRow)
                                        const oldIndex = orderedKeys.indexOf(active.id)
                                        const newIndex = orderedKeys.indexOf(over.id)
                                        if (oldIndex === -1 || newIndex === -1) return
                                        setRowSourcePriority(priorityDialogRow.id, arrayMove(orderedKeys, oldIndex, newIndex))
                                    }}
                                >
                                    <SortableContext
                                        items={getOrderedPriorityKeys(priorityDialogRow)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="grid gap-2">
                                            {getOrderedPriorityKeys(priorityDialogRow).map((priorityKey) => {
                                                const option = sourceOptionsMap.get(priorityKey)
                                                if (!option) return null
                                                return (
                                                    <SortablePriorityItem
                                                        key={priorityKey}
                                                        item={option}
                                                        usage={sourceUsageMap.get(priorityKey)}
                                                        disabled={sourceOptions.length <= 1}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        </ScrollArea>
                    </div>
                ) : null}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setPriorityDialogRowId(null)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => {
                            if (priorityDialogRow) {
                                completeRowWithPriority(priorityDialogRow)
                            }
                            setPriorityDialogRowId(null)
                        }}
                        disabled={!priorityDialogRow || sourceOptions.length === 0}
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Completar al 100%
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )

    const globalPriorityDialog = (
        <Dialog
            open={globalPriorityDialogOpen}
            onOpenChange={(open) => {
                setGlobalPriorityDialogOpen(open)
                if (!open) {
                    setGlobalOutputPriorityIds([])
                    setGlobalSourcePriorityKeys([])
                }
            }}
        >
            <DialogContent size="4xl" className="max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Asignación automática por doble prioridad</DialogTitle>
                    <DialogDescription>
                        Primero se atenderán las salidas en el orden que elijas y, dentro de cada una, se consumirán las fuentes según su propio orden. Esta acción sobrescribe las fuentes de las salidas válidas.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-3">
                        <div className="rounded-lg border bg-muted/20 p-4">
                            <p className="text-sm font-semibold text-foreground">1. Prioridad de productos de salida</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Las primeras salidas consumirán antes la disponibilidad global.
                            </p>
                        </div>
                        <ScrollArea className="h-[45vh] rounded-md border">
                            <div className="p-4">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={({ active, over }) => {
                                        if (!over || active.id === over.id) return
                                        const oldIndex = globalOutputPriorityIds.indexOf(String(active.id))
                                        const newIndex = globalOutputPriorityIds.indexOf(String(over.id))
                                        if (oldIndex === -1 || newIndex === -1) return
                                        setGlobalOutputPriorityIds((prev) => arrayMove(prev, oldIndex, newIndex))
                                    }}
                                >
                                    <SortableContext
                                        items={globalOutputPriorityIds}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="grid gap-2">
                                            {globalOutputPriorityItems.map((item) => (
                                                <SortableOutputPriorityItem
                                                    key={item.id}
                                                    item={item}
                                                    disabled={globalOutputPriorityItems.length <= 1}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="space-y-3">
                        <div className="rounded-lg border bg-muted/20 p-4">
                            <p className="text-sm font-semibold text-foreground">2. Prioridad de fuentes</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Cada salida intentará completarse siguiendo este orden de fuentes.
                            </p>
                        </div>
                        <ScrollArea className="h-[45vh] rounded-md border">
                            <div className="p-4">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={({ active, over }) => {
                                        if (!over || active.id === over.id) return
                                        const oldIndex = globalSourcePriorityKeys.indexOf(String(active.id))
                                        const newIndex = globalSourcePriorityKeys.indexOf(String(over.id))
                                        if (oldIndex === -1 || newIndex === -1) return
                                        setGlobalSourcePriorityKeys((prev) => arrayMove(prev, oldIndex, newIndex))
                                    }}
                                >
                                    <SortableContext
                                        items={globalSourcePriorityKeys}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="grid gap-2">
                                            {globalSourcePriorityKeys.map((priorityKey) => {
                                                const option = sourceOptionsMap.get(priorityKey)
                                                if (!option) return null
                                                return (
                                                    <SortablePriorityItem
                                                        key={priorityKey}
                                                        item={option}
                                                        usage={sourceUsageMap.get(priorityKey)}
                                                        disabled={globalSourcePriorityKeys.length <= 1}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setGlobalPriorityDialogOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={autoAssignSourcesByDoublePriority}
                        disabled={globalOutputPriorityIds.length === 0 || globalSourcePriorityKeys.length === 0}
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Asignar consumos
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )

    const globalSourcesSummaryContent = globalSourceSummary.length > 0 ? (
        <div className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h4 className="text-sm font-semibold">Resumen global de fuentes</h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                            El consumo total de cada source se controla globalmente en todo el diálogo.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{globalSourceSummary.length} fuentes</Badge>
                        <Badge variant="outline">
                            {formatWeight(globalSourceSummary.reduce((sum, source) => sum + (source.assignedSourceWeight || 0), 0))} usadas
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="min-h-0 rounded-lg border bg-background">
                    <div className="border-b px-4 py-3">
                        <h5 className="text-sm font-semibold text-foreground">Uso por fuente</h5>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Comparativa del peso total disponible frente al peso ya asignado en salidas.
                        </p>
                    </div>
                    <div className="p-4">
                        <Card className="overflow-visible border-0 shadow-none">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-sm">Disponible vs usado</CardTitle>
                                <CardDescription>
                                    Visualización global del reparto actual de fuentes.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-0">
                                <ChartContainer config={globalSourcesChartConfig} className="h-[240px] w-full">
                                    <BarChart accessibilityLayer data={globalSourcesChartData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="shortName"
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false}
                                            interval={0}
                                            tickFormatter={(value) => String(value).slice(0, 10)}
                                        />
                                        <ChartTooltip
                                            cursor={false}
                                            content={
                                                <ChartTooltipContent
                                                    indicator="dashed"
                                                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                                                    formatter={(value, name) => (
                                                        <div className="flex flex-1 items-center justify-between gap-3 leading-none">
                                                            <span className="text-muted-foreground">{name === 'total' ? 'Disponible' : 'Usado'}</span>
                                                            <span className="font-mono font-medium tabular-nums text-foreground">
                                                                {formatWeight(value || 0)}
                                                            </span>
                                                        </div>
                                                    )}
                                                />
                                            }
                                        />
                                        <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                                        <Bar dataKey="used" fill="var(--color-used)" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                            <CardFooter className="flex-col items-start gap-2 px-0 pt-3 pb-3 text-sm">
                                <div className="min-w-0 font-medium leading-snug">
                                    {formatWeight(globalSourceSummary.reduce((sum, source) => sum + (source.assignedSourceWeight || 0), 0))} usados de {formatWeight(globalSourceSummary.reduce((sum, source) => sum + (source.totalSourceWeight || 0), 0))}
                                </div>
                                <div className="min-w-0 text-pretty text-muted-foreground leading-snug">
                                    A la derecha tienes el detalle agrupado por origen con su disponibilidad y porcentaje de uso.
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>

                <div className="min-h-0 space-y-4">
                    {[
                        { key: 'stock', title: 'Fuentes desde stock', items: groupedGlobalSourceSummary.stock },
                        { key: 'parent', title: 'Fuentes desde proceso padre', items: groupedGlobalSourceSummary.parent },
                    ].map((group) => (
                        group.items.length > 0 ? (
                            <div key={group.key} className="overflow-hidden rounded-lg border bg-background">
                                <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                                    <div>
                                        <h5 className="text-sm font-semibold text-foreground">{group.title}</h5>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Disponibilidad y consumo agregado de este grupo de fuentes.
                                        </p>
                                    </div>
                                    <Badge variant="secondary">{group.items.length}</Badge>
                                </div>
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead>Fuente</TableHead>
                                            <TableHead className="text-right">Disponible</TableHead>
                                            <TableHead className="text-right">Usado</TableHead>
                                            <TableHead className="text-right">Restante</TableHead>
                                            <TableHead className="text-right">% uso</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.items.map((source) => {
                                            const sourceFullyConsumed = source.usagePercentage >= 100
                                            return (
                                                <TableRow key={source.key}>
                                                    <TableCell>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-medium">{source.label}</p>
                                                            <p className="truncate text-xs text-muted-foreground">{source.secondaryLabel}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatWeight(source.totalSourceWeight)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatWeight(source.assignedSourceWeight)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatWeight(source.remainingSourceWeight)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge
                                                            variant="outline"
                                                            className={sourceFullyConsumed ? 'border-green-200 text-green-700' : 'border-amber-200 text-amber-700'}
                                                        >
                                                            {formatDecimal(source.usagePercentage)}%
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : null
                    ))}
                </div>
            </div>
        </div>
    ) : (
        <div className="rounded-lg border border-dashed bg-muted/10 p-8 text-center">
            <p className="text-sm font-medium text-foreground">No hay fuentes globales disponibles</p>
            <p className="mt-1 text-xs text-muted-foreground">
                Cuando existan consumos desde stock o desde procesos anteriores, aparecerán aquí.
            </p>
        </div>
    )

    const manageDialogBusy =
        sourcesLoading ||
        saving ||
        copyingFromConsumption ||
        (productsLoading && products.length === 0)

    // Dialog de gestión múltiple
    const manageDialog = (
        <Dialog open={manageDialogOpen} onOpenChange={(open) => {
            if (!open) {
                setExpandedSourceRowId(null)
                setPriorityDialogRowId(null)
                setGlobalPriorityDialogOpen(false)
                setGlobalOutputPriorityIds([])
                setGlobalSourcePriorityKeys([])
                setManageDialogActiveTab('outputs')
                if (!saving) {
                    setEditableOutputs([])
                    setNewRows([])
                }
            }
            setManageDialogOpen(open)
        }}>
            <DialogContent
                size="full"
                className="flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] min-h-0 flex-col overflow-hidden"
            >
                <DialogHeader>
                    <DialogTitle>Gestionar Salidas</DialogTitle>
                    <DialogDescription>
                        Agrega, edita o elimina múltiples salidas de forma rápida
                    </DialogDescription>
                </DialogHeader>

                <div className="relative isolate z-0 flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden">
                    {manageDialogBusy ? (
                        <div
                            role="status"
                            aria-live="polite"
                            aria-busy="true"
                            className="absolute inset-0 z-100 flex flex-col items-center justify-center bg-white dark:bg-background"
                        >
                            <Loader text="Cargando" />
                        </div>
                    ) : null}

                <Tabs
                    key={manageDialogSession}
                    value={manageDialogActiveTab}
                    onValueChange={setManageDialogActiveTab}
                    className="flex min-h-0 flex-1 flex-col overflow-hidden"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <TabsList>
                            <TabsTrigger value="outputs">Salidas</TabsTrigger>
                            <TabsTrigger value="sources">Fuentes globales</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="outputs" className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">
                        <div className="flex h-full min-h-0 flex-col gap-4">
                            <div className="shrink-0 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="show-boxes-outputs-dialog"
                                        checked={showBoxes}
                                        onCheckedChange={handleToggleBoxes}
                                    />
                                    <label
                                        htmlFor="show-boxes-outputs-dialog"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        Mostrar Cajas
                                    </label>
                                </div>
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <Sparkles data-icon="inline-start" />
                                            Acciones automáticas
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-80">
                                        <DropdownMenuLabel>Agregar salidas</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={handleOpenAvailableProductsDialog}>
                                            <Zap className="mr-2 h-4 w-4" />
                                            <div className="flex flex-col gap-0.5">
                                                <span>Agregar desde productos disponibles</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Añade productos con cajas y pesos registrados en ventas, stock y reprocesados.
                                                </span>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={handleOpenSourceSelectionDialog}
                                            disabled={copyingFromConsumption}
                                        >
                                            {copyingFromConsumption ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Sparkles className="mr-2 h-4 w-4" />
                                            )}
                                            <div className="flex flex-col gap-0.5">
                                                <span>
                                                    {copyingFromConsumption
                                                        ? 'Añadiendo desde consumo...'
                                                        : 'Añadir automáticamente desde consumo'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    Añade líneas de salida desde consumos del padre o materia prima desde stock.
                                                </span>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Agregar y asignar</DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={addOutputsFromConsumptionsAndDistributeMatchingSources}
                                            disabled={sourceOptions.length === 0}
                                        >
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            <div className="flex flex-col gap-0.5">
                                                <span>Añadir salidas y distribuir por mismo producto</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Crea las salidas faltantes desde los consumos y les asigna sus fuentes del mismo producto.
                                                </span>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Asignar fuentes</DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={distributeSourcesProportionally}
                                            disabled={allRows.filter((row) => parseFloat(row.weight_kg || 0) > 0).length === 0 || sourceOptions.length === 0}
                                        >
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            <div className="flex flex-col gap-0.5">
                                                <span>Distribuir fuentes</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Reparte proporcionalmente cada fuente según su disponibilidad.
                                                </span>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={distributeMatchingSourcesByProduct}
                                            disabled={allRows.filter((row) => row.product_id && parseFloat(row.weight_kg || 0) > 0).length === 0 || sourceOptions.length === 0}
                                        >
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            <div className="flex flex-col gap-0.5">
                                                <span>Distribuir fuentes por mismo producto</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Asigna a cada salida solo las fuentes del mismo producto, priorizando una correspondencia 1:1.
                                                </span>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={openGlobalPriorityDialog}
                                            disabled={validOutputRows.length === 0 || sourceOptions.length === 0}
                                        >
                                            <ArrowUp className="mr-2 h-4 w-4" />
                                            <div className="flex flex-col gap-0.5">
                                                <span>Asignar por prioridades</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Usa el orden de salidas y el orden de fuentes para asignar consumos.
                                                </span>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Limpiar</DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={clearAllSources}
                                            disabled={!hasAnyAssignedSources}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <div className="flex flex-col gap-0.5">
                                                <span>Limpiar todas las fuentes</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Elimina todas las asignaciones de fuentes en la tabla actual.
                                                </span>
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                    onClick={addNewRow}
                                    variant="default"
                                    size="sm"
                                >
                                    <Plus data-icon="inline-start" />
                                    Agregar salida
                                </Button>
                                </div>
                            </div>

                            <ScrollArea className="min-h-0 flex-1 rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[16rem]">Producto</TableHead>
                                            {showBoxes && <TableHead>Cajas</TableHead>}
                                            <TableHead>Peso (kg)</TableHead>
                                            {showBoxes && <TableHead>Peso prom.</TableHead>}
                                            <TableHead>Fuentes</TableHead>
                                            <TableHead>
                                                <span className="sr-only">Eliminar fila</span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allRows.map((row) => {
                                    const avgWeight = row.boxes && parseFloat(row.boxes) > 0 && row.weight_kg
                                        ? formatDecimal(parseFloat(row.weight_kg) / parseFloat(row.boxes))
                                        : '0,00'
                                    const sourcesTotalPercentage = Array.isArray(row.sources)
                                        ? row.sources.reduce((sum, source) => sum + (parseFloat(source.contribution_percentage) || 0), 0)
                                        : 0
                                    const sourcesFullyConfigured = Array.isArray(row.sources)
                                        && row.sources.length > 0
                                        && Math.abs(sourcesTotalPercentage - 100) < 0.01
                                    
                                    const isValid = row.product_id && row.boxes && parseFloat(row.boxes) > 0 && row.weight_kg && parseFloat(row.weight_kg) > 0
                                    
                                    return (
                                        <React.Fragment key={row.id}>
                                            <TableRow 
                                                className={!isValid && (row.product_id || row.boxes || row.weight_kg) ? 'bg-muted/50' : ''}
                                            >
                                                <TableCell>
                                                    <div className={!row.product_id ? '[&_button]:border-destructive' : ''}>
                                                        <Combobox
                                                            options={products}
                                                            value={row.product_id}
                                                            onChange={(value) => updateRow(row.id, 'product_id', value)}
                                                            placeholder="Buscar producto..."
                                                            searchPlaceholder="Buscar producto..."
                                                            notFoundMessage="No se encontraron productos"
                                                            loading={productsLoading}
                                                        />
                                                    </div>
                                                </TableCell>
                                                {showBoxes && (
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={row.boxes}
                                                        onChange={(e) => updateRow(row.id, 'boxes', e.target.value)}
                                                        placeholder="0"
                                                    />
                                                </TableCell>
                                                )}
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={row.weight_kg}
                                                        onChange={(e) => {
                                                            const nextWeight = e.target.value
                                                            updateRow(row.id, 'weight_kg', nextWeight)
                                                            if (Array.isArray(row.sources) && row.sources.length > 0) {
                                                                updateRow(
                                                                    row.id,
                                                                    'sources',
                                                                    recalculateSourcesForRow(
                                                                        { ...row, weight_kg: nextWeight },
                                                                        row.sources
                                                                    )
                                                                )
                                                            }
                                                        }}
                                                        placeholder="0.00"
                                                        className={
                                                            !row.weight_kg || parseFloat(row.weight_kg) <= 0
                                                                ? 'border-destructive'
                                                                : undefined
                                                        }
                                                    />
                                                </TableCell>
                                                {showBoxes && (
                                                <TableCell>
                                                    <span className="text-muted-foreground">
                                                        {formatWeight(avgWeight)}
                                                    </span>
                                                </TableCell>
                                                )}
                                                <TableCell>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setExpandedSourceRowId((current) =>
                                                                current === row.id ? null : row.id
                                                            )
                                                        }}
                                                    >
                                                        {row.sources && Array.isArray(row.sources) && row.sources.length > 0 ? (
                                                            <>
                                                                <span
                                                                    className={`h-2 w-2 shrink-0 rounded-full ${sourcesFullyConfigured ? 'bg-green-500' : 'bg-amber-500'}`}
                                                                    aria-hidden
                                                                />
                                                                <span>
                                                                    {row.sources.length} fuente{row.sources.length !== 1 ? 's' : ''}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span>Configurar</span>
                                                        )}
                                                        {expandedSourceRowId === row.id ? (
                                                            <ChevronDown data-icon="inline-end" />
                                                        ) : (
                                                            <ChevronRight data-icon="inline-end" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeRow(row.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {expandedSourceRowId === row.id && (
                                                <TableRow className="bg-muted/40">
                                                    <TableCell colSpan={showBoxes ? 6 : 5} className="align-top">
                                                    <div className="space-y-4">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div>
                                                                <p className="text-xs font-semibold text-foreground">Orígenes de esta salida</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Establece desde qué stock o salidas del proceso padre deriva el peso de esta salida y reparte kilos y porcentajes hasta el 100 %.
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button type="button" variant="outline" size="sm">
                                                                            Acciones
                                                                            <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-56">
                                                                        <DropdownMenuItem
                                                                            disabled={sourcesLoading || sourceOptions.length === 0}
                                                                            onClick={() => setPriorityDialogRowId(row.id)}
                                                                        >
                                                                            <Sparkles className="mr-2 h-4 w-4" />
                                                                            Completar al 100%
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            disabled={!row.sources || row.sources.length === 0}
                                                                            onClick={() => clearRowSources(row.id)}
                                                                        >
                                                                            <X className="mr-2 h-4 w-4" />
                                                                            Limpiar fuentes
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                                <Button
                                                                    type="button"
                                                                    variant="default"
                                                                    size="sm"
                                                                    disabled={sourcesLoading || sourceOptions.length === 0}
                                                                    onClick={() => {
                                                                        const updated = [
                                                                            ...(row.sources || []),
                                                                            {
                                                                                source_type: null,
                                                                                product_id: null,
                                                                                production_output_consumption_id: null,
                                                                                contributed_weight_kg: null,
                                                                                contribution_percentage: null,
                                                                            }
                                                                        ]
                                                                        updateRow(row.id, 'sources', updated)
                                                                    }}
                                                                >
                                                                    <Plus className="h-3.5 w-3.5 mr-2" />
                                                                    Agregar fuente
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {row.sources && Array.isArray(row.sources) && row.sources.length > 0 ? (
                                                            <div className="space-y-0 overflow-hidden rounded-md border bg-card">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow className="hover:bg-transparent">
                                                                            <TableHead className="min-w-[220px] text-muted-foreground">
                                                                                Origen
                                                                            </TableHead>
                                                                            <TableHead className="w-[128px] text-muted-foreground">
                                                                                Peso fuente (kg)
                                                                            </TableHead>
                                                                            <TableHead className="w-[128px] text-muted-foreground">
                                                                                Peso transformado (kg)
                                                                            </TableHead>
                                                                            <TableHead className="w-[96px] text-muted-foreground">%</TableHead>
                                                                            <TableHead className="w-12 p-2">
                                                                                <span className="sr-only">Eliminar</span>
                                                                            </TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {row.sources.map((source, sourceIndex) => {
                                                                            const currentSourceKey = getSourceKey(source)
                                                                            const currentSourceValue = source.source_type === 'stock_product'
                                                                                ? `stock_product-${source.product_id}`
                                                                                : source.source_type === 'parent_output'
                                                                                    ? `parent_output-${source.production_output_consumption_id}`
                                                                                    : undefined
                                                                            const sourceAvailableWeight = getAvailableSourceWeightForLine(row, sourceIndex, currentSourceKey)
                                                                            const currentSourceWeight = parseFloat(source.contributed_weight_kg || 0) || 0
                                                                            const additionalSourceWeight = roundToTwo(Math.max(0, sourceAvailableWeight - currentSourceWeight))
                                                                            const currentAdjustedWeight = getAdjustedOutputWeightFromSource(currentSourceWeight)

                                                                            return (
                                                                                <TableRow key={sourceIndex}>
                                                                                    <TableCell className="align-top">
                                                                                        <div className="flex flex-col gap-1.5">
                                                                                            <Select
                                                                                                value={currentSourceValue}
                                                                                                onValueChange={(value) => {
                                                                                                    const parsed = parseSourceValue(value)
                                                                                                    if (!parsed) return
                                                                                                    const updated = [...(row.sources || [])]
                                                                                                    updated[sourceIndex] = {
                                                                                                        ...updated[sourceIndex],
                                                                                                        ...parsed,
                                                                                                        contributed_weight_kg: null,
                                                                                                        contribution_percentage: null,
                                                                                                    }
                                                                                                    updateRow(row.id, 'sources', updated)
                                                                                                }}
                                                                                            >
                                                                                                <SelectTrigger className="w-full max-w-md">
                                                                                                    <SelectValue placeholder="Seleccionar origen" />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    {sourceOptions.length > 0 ? sourceOptions.map((option) => {
                                                                                                        const isUsed = (row.sources || []).some((candidate, candidateIndex) => (
                                                                                                            candidateIndex !== sourceIndex && getSourceKey(candidate) === option.key
                                                                                                        ))
                                                                                                        return (
                                                                                                            <SelectItem
                                                                                                                key={option.key}
                                                                                                                value={option.value}
                                                                                                                disabled={isUsed}
                                                                                                            >
                                                                                                                {option.typeLabel} · {option.label}
                                                                                                            </SelectItem>
                                                                                                        )
                                                                                                    }) : (
                                                                                                        <SelectItem value="no-options" disabled>
                                                                                                            No hay orígenes disponibles
                                                                                                        </SelectItem>
                                                                                                    )}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                            {currentSourceKey ? (
                                                                                                <p className="text-xs text-muted-foreground">
                                                                                                    Disponible: {formatWeight(additionalSourceWeight)}
                                                                                                </p>
                                                                                            ) : null}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            value={source.contributed_weight_kg || ''}
                                                                                            onChange={(e) => {
                                                                                                const updated = [...(row.sources || [])]
                                                                                                let weight = parseFloat(e.target.value) || 0
                                                                                                if (weight > sourceAvailableWeight) {
                                                                                                    weight = sourceAvailableWeight
                                                                                                }
                                                                                                const outputWeight = parseFloat(row.weight_kg || 0) || 0
                                                                                                const adjustedOutputWeight = getAdjustedOutputWeightFromSource(weight)
                                                                                                updated[sourceIndex] = {
                                                                                                    ...updated[sourceIndex],
                                                                                                    contributed_weight_kg: e.target.value === '' ? null : roundToTwo(weight),
                                                                                                    contribution_percentage: outputWeight > 0 ? roundToTwo((adjustedOutputWeight / outputWeight) * 100) : null,
                                                                                                }
                                                                                                updateRow(row.id, 'sources', updated)
                                                                                            }}
                                                                                            className="max-w-32"
                                                                                            placeholder="0.00"
                                                                                        />
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            value={source.contributed_weight_kg === null || source.contributed_weight_kg === undefined || source.contributed_weight_kg === ''
                                                                                                ? ''
                                                                                                : currentAdjustedWeight.toFixed(2)}
                                                                                            onChange={(e) => {
                                                                                                const updated = [...(row.sources || [])]
                                                                                                const inputValue = e.target.value
                                                                                                if (inputValue === '') {
                                                                                                    updated[sourceIndex] = {
                                                                                                        ...updated[sourceIndex],
                                                                                                        contributed_weight_kg: null,
                                                                                                        contribution_percentage: null,
                                                                                                    }
                                                                                                    updateRow(row.id, 'sources', updated)
                                                                                                    return
                                                                                                }
                                                                                                let adjustedWeight = parseFloat(inputValue) || 0
                                                                                                let sourceWeight = getSourceWeightFromAdjustedOutputWeight(adjustedWeight)
                                                                                                if (sourceWeight > sourceAvailableWeight) {
                                                                                                    sourceWeight = sourceAvailableWeight
                                                                                                    adjustedWeight = getAdjustedOutputWeightFromSource(sourceWeight)
                                                                                                }
                                                                                                const outputWeight = parseFloat(row.weight_kg || 0) || 0
                                                                                                updated[sourceIndex] = {
                                                                                                    ...updated[sourceIndex],
                                                                                                    contributed_weight_kg: roundToTwo(sourceWeight),
                                                                                                    contribution_percentage: outputWeight > 0
                                                                                                        ? roundToTwo((adjustedWeight / outputWeight) * 100)
                                                                                                        : null,
                                                                                                }
                                                                                                updateRow(row.id, 'sources', updated)
                                                                                            }}
                                                                                            className="max-w-32"
                                                                                            placeholder="0.00"
                                                                                        />
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            min="0"
                                                                                            max="100"
                                                                                            value={source.contribution_percentage !== null && source.contribution_percentage !== undefined
                                                                                                ? source.contribution_percentage
                                                                                                : ''}
                                                                                            onChange={(e) => {
                                                                                                const updated = [...(row.sources || [])]
                                                                                                const inputValue = e.target.value
                                                                                                if (inputValue === '') {
                                                                                                    updated[sourceIndex] = {
                                                                                                        ...updated[sourceIndex],
                                                                                                        contribution_percentage: null,
                                                                                                        contributed_weight_kg: null,
                                                                                                    }
                                                                                                    updateRow(row.id, 'sources', updated)
                                                                                                    return
                                                                                                }
                                                                                                let percentage = parseFloat(inputValue) || 0
                                                                                                const outputWeight = parseFloat(row.weight_kg || 0) || 0
                                                                                                let calculatedAdjustedOutputWeight = outputWeight > 0 ? (percentage / 100) * outputWeight : 0
                                                                                                let calculatedWeightFromOutput = getSourceWeightFromAdjustedOutputWeight(calculatedAdjustedOutputWeight)
                                                                                                if (calculatedWeightFromOutput > sourceAvailableWeight) {
                                                                                                    calculatedWeightFromOutput = sourceAvailableWeight
                                                                                                    calculatedAdjustedOutputWeight = getAdjustedOutputWeightFromSource(calculatedWeightFromOutput)
                                                                                                    percentage = outputWeight > 0 ? roundToTwo((calculatedAdjustedOutputWeight / outputWeight) * 100) : 0
                                                                                                }
                                                                                                updated[sourceIndex] = {
                                                                                                    ...updated[sourceIndex],
                                                                                                    contribution_percentage: percentage,
                                                                                                    contributed_weight_kg: roundToTwo(calculatedWeightFromOutput),
                                                                                                }
                                                                                                updateRow(row.id, 'sources', updated)
                                                                                            }}
                                                                                            className="max-w-28"
                                                                                            placeholder="0.00"
                                                                                        />
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            onClick={() => {
                                                                                                const updated = row.sources.filter((_, i) => i !== sourceIndex)
                                                                                                updateRow(row.id, 'sources', updated)
                                                                                            }}
                                                                                        >
                                                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                                                        </Button>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            )
                                                                        })}
                                                                    </TableBody>
                                                                </Table>
                                                                {(() => {
                                                                    const totalPercentage = row.sources.reduce((sum, s) => sum + (parseFloat(s.contribution_percentage) || 0), 0)
                                                                    const isComplete = Math.abs(totalPercentage - 100) < 0.01
                                                                    const progressValue = Math.max(0, Math.min(totalPercentage, 100))
                                                                    return (
                                                                        <div className="space-y-2 border-t bg-muted/30 px-4 py-3">
                                                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                                                <span className="font-medium text-muted-foreground">
                                                                                    Total fuentes
                                                                                </span>
                                                                                <span className={`font-medium tabular-nums ${isComplete ? 'text-green-600' : 'text-amber-600'}`}>
                                                                                    {formatDecimal(totalPercentage)}% / 100%
                                                                                </span>
                                                                            </div>
                                                                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                                                <div
                                                                                    className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-amber-500'}`}
                                                                                    style={{ width: `${progressValue}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })()}
                                                            </div>
                                                        ) : (
                                                            <div className="rounded-md border border-dashed bg-background/80 px-3 py-4 text-xs text-muted-foreground">
                                                                No hay fuentes configuradas todavía para esta salida.
                                                            </div>
                                                        )}
                                                    </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    )
                                })}
                                {allRows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={showBoxes ? 6 : 5} className="p-0">
                                            <div className="py-12">
                                                <EmptyState
                                                    icon={<Package className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                                    title="No hay salidas agregadas"
                                                    description="Haz clic en 'Agregar salida' para comenzar a añadir salidas al proceso"
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </TabsContent>

                    <TabsContent value="sources" className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">
                        <ScrollArea className="min-h-0 flex-1 rounded-md border">
                            <div className="p-4">
                                {globalSourcesSummaryContent}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setManageDialogOpen(false)}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSaveAll}
                        disabled={
                            saving ||
                            !manageDialogDataReady ||
                            !isManageDialogDirty ||
                            allRows.some(
                                (row) =>
                                    (row.product_id || row.boxes || row.weight_kg) &&
                                    (!row.product_id || !row.weight_kg || parseFloat(row.weight_kg) <= 0)
                            )
                        }
                    >
                        {saving ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                <Save data-icon="inline-start" />
                                Guardar
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )

    // Dialog de desglose de costes
    const breakdownDialog = (
        <Dialog open={breakdownDialogOpen} onOpenChange={setBreakdownDialogOpen}>
            <DialogContent size="4xl" className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Desglose de Costes</DialogTitle>
                    <DialogDescription>
                        Desglose detallado de todos los costes asociados a esta salida
                    </DialogDescription>
                </DialogHeader>
                {breakdownOutputId && (
                    <CostBreakdownView
                        outputId={breakdownOutputId}
                        productionRecordId={productionRecordId}
                        parentOutputConsumptions={recordConsumptions}
                    />
                )}
            </DialogContent>
        </Dialog>
    )

    const deleteConfirmDialog = (
        <AlertDialog
            open={deleteOutputConfirm.open}
            onOpenChange={(open) => setDeleteOutputConfirm(prev => ({ ...prev, open }))}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar salida</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. ¿Deseas eliminar esta salida?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteOutput}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )

    // Si renderInCard es true, envolver en Card con botón en header
    if (renderInCard) {
        return (
            <>
                {manageDialog}
                {priorityDialog}
                {globalPriorityDialog}
                {sourceSelectionDialog}
                {availableProductsDialog}
                {breakdownDialog}
                {deleteConfirmDialog}
                <Card
                    className={cn(
                        outputs.length === 0 ? 'min-h-[min(22rem,55vh)]' : 'h-fit'
                    )}
                >
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <ArrowUp className="h-5 w-5 text-primary" />
                                    {cardTitle || 'Salidas Lógicas'}
                                </CardTitle>
                                <CardDescription>
                                    {cardDescription || 'Productos producidos en este proceso'}
                                </CardDescription>
                            </div>
                            {headerButton}
                        </div>
                    </CardHeader>
                    <CardContent
                        className={cn(
                            outputs.length === 0 && 'flex min-h-0 flex-1 flex-col'
                        )}
                    >
                        {mainContent}
                    </CardContent>
                </Card>
            </>
        )
    }

    // Render normal
    return (
        <div className="space-y-4">
            {manageDialog}
            {priorityDialog}
            {globalPriorityDialog}
            {sourceSelectionDialog}
            {availableProductsDialog}
            {breakdownDialog}
            {deleteConfirmDialog}
            {mainContent}
        </div>
    )
}

export default ProductionOutputsManager
