'use client'

import React, { useState, useEffect } from 'react'
import { getCostBreakdown } from '@/services/costService'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { formatCostPerKg, formatTotalCost, getCostTypeColor, getCostTypeLabel } from '@/helpers/production/costFormatters'
import Loader from '@/components/Utilities/Loader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

/**
 * Componente para mostrar el desglose completo de costes de un output
 * @param {number} outputId - ID del output
 */
export default function CostBreakdownView({ outputId }) {
    const { data: session } = useSession();
    const [breakdown, setBreakdown] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        materials: true,
        processCosts: true,
        productionCosts: true,
    });

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
            setError(err.message || 'Error al cargar el desglose de costes');
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
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{title}</span>
                    <div className="flex gap-4">
                        <span>{formatTotalCost(typeBreakdown.totalCost)}</span>
                        <span className="text-gray-500">{formatCostPerKg(typeBreakdown.costPerKg)}</span>
                    </div>
                </div>
                {typeBreakdown.breakdown && typeBreakdown.breakdown.length > 0 && (
                    <Table>
                        <TableBody>
                            {typeBreakdown.breakdown.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="pl-8">{item.name}</TableCell>
                                    <TableCell>{formatTotalCost(item.totalCost)}</TableCell>
                                    <TableCell>{formatCostPerKg(item.costPerKg)}</TableCell>
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
                    <div className="flex items-center justify-between text-lg font-semibold">
                        <span>Coste Total</span>
                        <div className="flex gap-4">
                            <span>{formatTotalCost(breakdown.total.totalCost)}</span>
                            <span className="text-gray-600">{formatCostPerKg(breakdown.total.costPerKg)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Materias Primas */}
            <Card>
                <CardHeader>
                    <CardTitle>Materias Primas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-4">
                            <span>{formatTotalCost(breakdown.materials.totalCost)}</span>
                            <span className="text-gray-500">{formatCostPerKg(breakdown.materials.costPerKg)}</span>
                        </div>
                    </div>
                    {breakdown.materials.sources && breakdown.materials.sources.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Peso (kg)</TableHead>
                                    <TableHead>Porcentaje</TableHead>
                                    <TableHead>Coste por kg</TableHead>
                                    <TableHead>Coste Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {breakdown.materials.sources.map((source, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Badge>{source.sourceType}</Badge>
                                        </TableCell>
                                        <TableCell>{source.contributedWeightKg}</TableCell>
                                        <TableCell>{source.contributionPercentage}%</TableCell>
                                        <TableCell>{formatCostPerKg(source.sourceCostPerKg)}</TableCell>
                                        <TableCell>{formatTotalCost(source.sourceTotalCost)}</TableCell>
                                    </TableRow>
                                ))}
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
                                <div className="flex items-center justify-between p-2 bg-blue-50 rounded font-semibold">
                                    <span>Total Proceso</span>
                                    <div className="flex gap-4">
                                        <span>{formatTotalCost(breakdown.processCosts.total.totalCost)}</span>
                                        <span>{formatCostPerKg(breakdown.processCosts.total.costPerKg)}</span>
                                    </div>
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
                                <div className="flex items-center justify-between p-2 bg-green-50 rounded font-semibold">
                                    <span>Total Lote</span>
                                    <div className="flex gap-4">
                                        <span>{formatTotalCost(breakdown.productionCosts.total.totalCost)}</span>
                                        <span>{formatCostPerKg(breakdown.productionCosts.total.costPerKg)}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>
        </div>
    );
}

