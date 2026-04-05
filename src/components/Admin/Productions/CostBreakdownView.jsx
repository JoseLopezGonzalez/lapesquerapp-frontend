'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { getCostBreakdown } from '@/services/costService'
import { getProductionRecord } from '@/services/productionService'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { formatCostPerKg, formatTotalCost, getCostTypeColor, getCostTypeLabel, getMaterialSourceDisplayLabel } from '@/helpers/production/costFormatters'
import Loader from '@/components/Utilities/Loader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Métrica principal: €/kg; total como referencia secundaria.
 */
function CostSummaryHero({ costPerKg, totalCost, className, size = 'lg' }) {
    const kgClass =
        size === 'lg'
            ? 'text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-3xl'
            : 'text-lg font-semibold tabular-nums text-foreground'

    return (
        <div
            className={cn(
                'flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-end sm:justify-between',
                className
            )}
        >
            <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Coste por kg
                </p>
                <p className={kgClass}>{formatCostPerKg(costPerKg)}</p>
            </div>
            <div className="min-w-0 space-y-0.5 sm:text-right">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Coste total
                </p>
                <p className="text-sm font-medium tabular-nums text-muted-foreground sm:text-base">
                    {formatTotalCost(totalCost)}
                </p>
            </div>
        </div>
    )
}

/**
 * Une la fila del desglose (suele ir sin consumo anidado) con `parentOutputConsumptions` del registro.
 * @param {object} source
 * @param {Map<number, object>} consumptionById
 */
function withConsumptionFromRecord(source, consumptionById) {
    if (!source || !consumptionById?.size) return source
    const cid =
        source.productionOutputConsumptionId ??
        source.production_output_consumption_id ??
        source.outputConsumptionId ??
        source.output_consumption_id ??
        null
    if (cid == null) return source
    const c = consumptionById.get(Number(cid))
    if (!c) return source
    return { ...source, productionOutputConsumption: c }
}

/**
 * Componente para mostrar el desglose completo de costes de un output
 * @param {number} outputId - ID del output
 * @param {number} [productionRecordId] - Registro actual; si no hay consumos en props, se recarga el registro para enlazar fuentes
 * @param {object[]|undefined} [parentOutputConsumptions] - Consumos del proceso padre (desde contexto o API)
 */
export default function CostBreakdownView({ outputId, productionRecordId, parentOutputConsumptions }) {
    const { data: session } = useSession();
    const [breakdown, setBreakdown] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fallbackConsumptions, setFallbackConsumptions] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        materials: true,
        processCosts: true,
        productionCosts: true,
    });

    const effectiveConsumptions = useMemo(() => {
        if (Array.isArray(parentOutputConsumptions) && parentOutputConsumptions.length > 0) {
            return parentOutputConsumptions
        }
        if (fallbackConsumptions != null) return fallbackConsumptions
        return []
    }, [parentOutputConsumptions, fallbackConsumptions])

    const consumptionById = useMemo(() => {
        const m = new Map()
        for (const c of effectiveConsumptions) {
            if (c?.id != null) m.set(Number(c.id), c)
        }
        return m
    }, [effectiveConsumptions])

    useEffect(() => {
        const hasProps =
            Array.isArray(parentOutputConsumptions) && parentOutputConsumptions.length > 0
        if (hasProps) {
            setFallbackConsumptions(null)
            return
        }
        if (!productionRecordId || !session?.user?.accessToken) {
            setFallbackConsumptions(null)
            return
        }
        let cancelled = false
        ;(async () => {
            try {
                const rec = await getProductionRecord(
                    productionRecordId,
                    session.user.accessToken
                )
                const list = rec?.parentOutputConsumptions ?? []
                if (!cancelled) setFallbackConsumptions(Array.isArray(list) ? list : [])
            } catch {
                if (!cancelled) setFallbackConsumptions([])
            }
        })()
        return () => {
            cancelled = true
        }
    }, [outputId, productionRecordId, session?.user?.accessToken, parentOutputConsumptions])

    useEffect(() => {
        if (session?.user?.accessToken && outputId) {
            loadBreakdown();
        }
    }, [session?.user?.accessToken, outputId]);

    const loadBreakdown = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = session.user.accessToken;
            const response = await getCostBreakdown(outputId, token);
            // El servicio ya normaliza y estructura los datos
            const breakdown = response.data?.costBreakdown || response.data?.data?.costBreakdown || null;
            if (!breakdown) {
                throw new Error('No se pudo obtener el desglose de costes');
            }
            setBreakdown(breakdown);
        } catch (err) {
            console.error('Error loading cost breakdown:', err);
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al cargar el desglose de costes';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (loading) return <Loader />;
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    if (!breakdown) return null;

    const renderCostTypeBreakdown = (typeBreakdown, title) => {
        if (!typeBreakdown || typeBreakdown.totalCost === 0) return null;

        return (
            <div className="space-y-2">
                <div className="flex flex-col gap-2 rounded-md border border-border/50 bg-muted/25 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="shrink-0 font-medium text-foreground">{title}</span>
                    <div className="flex flex-col gap-3 sm:items-end">
                        <div className="sm:text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Coste / kg
                            </p>
                            <p className="text-base font-semibold tabular-nums text-foreground">
                                {formatCostPerKg(typeBreakdown.costPerKg)}
                            </p>
                        </div>
                        <div className="sm:text-right">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
                            <p className="text-sm tabular-nums text-muted-foreground">
                                {formatTotalCost(typeBreakdown.totalCost)}
                            </p>
                        </div>
                    </div>
                </div>
                {typeBreakdown.breakdown && typeBreakdown.breakdown.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-8">Concepto</TableHead>
                                <TableHead className="text-right font-semibold">€/kg</TableHead>
                                <TableHead className="text-right text-muted-foreground">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {typeBreakdown.breakdown.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="pl-8">{item.name}</TableCell>
                                    <TableCell className="text-right font-semibold tabular-nums">
                                        {formatCostPerKg(item.costPerKg)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">
                                        {formatTotalCost(item.totalCost)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Resumen Total */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumen de Costes</CardTitle>
                </CardHeader>
                <CardContent>
                    <CostSummaryHero
                        costPerKg={breakdown.total.costPerKg}
                        totalCost={breakdown.total.totalCost}
                    />
                </CardContent>
            </Card>

            {/* Materias Primas */}
            <Card>
                <CardHeader>
                    <CardTitle>Materias Primas</CardTitle>
                </CardHeader>
                <CardContent>
                    {breakdown.materials.sources && breakdown.materials.sources.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fuente</TableHead>
                                    <TableHead>Peso (kg)</TableHead>
                                    <TableHead>Porcentaje</TableHead>
                                    <TableHead className="text-right font-semibold">Coste / kg</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Coste total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {breakdown.materials.sources.map((source, index) => {
                                    const sourceForLabel = withConsumptionFromRecord(source, consumptionById)
                                    return (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Badge>{getMaterialSourceDisplayLabel(sourceForLabel)}</Badge>
                                        </TableCell>
                                        <TableCell>{source.contributedWeightKg}</TableCell>
                                        <TableCell>{source.contributionPercentage}%</TableCell>
                                        <TableCell className="text-right font-semibold tabular-nums">
                                            {formatCostPerKg(source.sourceCostPerKg)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-muted-foreground">
                                            {formatTotalCost(source.sourceTotalCost)}
                                        </TableCell>
                                    </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Costes del Proceso */}
            <Card>
                <Collapsible 
                    open={expandedSections.processCosts}
                    onOpenChange={() => toggleSection('processCosts')}
                >
                    <CardHeader>
                        <CollapsibleTrigger className="flex items-center justify-between w-full">
                            <CardTitle>Costes del Proceso</CardTitle>
                            {expandedSections.processCosts ? (
                                <ChevronDown className="h-5 w-5" />
                            ) : (
                                <ChevronRight className="h-5 w-5" />
                            )}
                        </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                        <CardContent className="space-y-4">
                            {renderCostTypeBreakdown(breakdown.processCosts.production, 'Producción')}
                            {renderCostTypeBreakdown(breakdown.processCosts.labor, 'Personal')}
                            {renderCostTypeBreakdown(breakdown.processCosts.operational, 'Operativos')}
                            {renderCostTypeBreakdown(breakdown.processCosts.packaging, 'Envases')}
                            {breakdown.processCosts.total && (
                                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                                        Total proceso
                                    </p>
                                    <CostSummaryHero
                                        size="sm"
                                        costPerKg={breakdown.processCosts.total.costPerKg}
                                        totalCost={breakdown.processCosts.total.totalCost}
                                        className="border-0 bg-transparent p-0"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

            {/* Costes del Lote */}
            <Card>
                <Collapsible 
                    open={expandedSections.productionCosts}
                    onOpenChange={() => toggleSection('productionCosts')}
                >
                    <CardHeader>
                        <CollapsibleTrigger className="flex items-center justify-between w-full">
                            <CardTitle>Costes del Lote</CardTitle>
                            {expandedSections.productionCosts ? (
                                <ChevronDown className="h-5 w-5" />
                            ) : (
                                <ChevronRight className="h-5 w-5" />
                            )}
                        </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                        <CardContent className="space-y-4">
                            {renderCostTypeBreakdown(breakdown.productionCosts.production, 'Producción')}
                            {renderCostTypeBreakdown(breakdown.productionCosts.labor, 'Personal')}
                            {renderCostTypeBreakdown(breakdown.productionCosts.operational, 'Operativos')}
                            {renderCostTypeBreakdown(breakdown.productionCosts.packaging, 'Envases')}
                            {breakdown.productionCosts.total && (
                                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                                        Total lote
                                    </p>
                                    <CostSummaryHero
                                        size="sm"
                                        costPerKg={breakdown.productionCosts.total.costPerKg}
                                        totalCost={breakdown.productionCosts.total.totalCost}
                                        className="border-0 bg-transparent p-0"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>
        </div>
    );
}

