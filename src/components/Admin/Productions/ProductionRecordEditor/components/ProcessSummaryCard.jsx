'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Scale, Calculator, TrendingDown, TrendingUp } from 'lucide-react'
import { formatDecimalWeight, formatDecimal, formatInteger } from '@/helpers/formats/numbers/formatNumbers'
import { useProductionRecordContext } from '@/context/ProductionRecordContext'

/**
 * Tarjeta de resumen del proceso con estadísticas
 * Usa el contexto para obtener el record automáticamente
 */
export const ProcessSummaryCard = ({ record: recordProp = null }) => {
    // Intentar obtener del contexto, si no está disponible usar la prop
    let record = recordProp
    try {
        const context = useProductionRecordContext()
        record = context.record || recordProp
    } catch (err) {
        // Contexto no disponible, usar prop
        record = recordProp
    }
    if (!record || (record.totalInputWeight === undefined && record.totalOutputWeight === undefined)) {
        return null
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Resumen del Proceso
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
                    <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Package className="h-3 w-3" />
                            Cajas entrada
                        </p>
                        <p className="text-lg font-bold">{formatInteger(record.totalInputBoxes || 0)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Scale className="h-3 w-3" />
                            Peso entrada
                        </p>
                        <p className="text-lg font-bold">{formatDecimalWeight(record.totalInputWeight || 0)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Package className="h-3 w-3" />
                            Cajas salida
                        </p>
                        <p className="text-lg font-bold">{formatInteger(record.totalOutputBoxes || 0)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Scale className="h-3 w-3" />
                            Peso salida
                        </p>
                        <p className="text-lg font-bold">{formatDecimalWeight(record.totalOutputWeight || 0)}</p>
                    </div>
                    {(record.waste !== undefined && record.waste > 0) || (record.yield !== undefined && record.yield > 0) ? (
                        <div className={record.waste > 0 ? "bg-destructive/10 border border-destructive/20 rounded-lg p-2" : "bg-green-500/10 border border-green-500/20 rounded-lg p-2"}>
                            <div className="flex items-center gap-1.5 mb-1">
                                {record.waste > 0 ? (
                                    <TrendingDown className="h-3 w-3 text-destructive" />
                                ) : (
                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                )}
                                <p className="text-xs font-medium text-muted-foreground">
                                    {record.waste > 0 ? 'Merma' : 'Rendimiento'}
                                </p>
                            </div>
                            <p className="text-base font-bold">
                                {record.waste > 0 
                                    ? formatDecimalWeight(record.waste)
                                    : formatDecimalWeight(record.yield)
                                }
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {record.waste > 0 
                                    ? `${formatDecimal(record.wastePercentage || 0)}%`
                                    : `${formatDecimal(record.yieldPercentage || 0)}%`
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="bg-muted/30 border border-dashed rounded-lg p-2 flex items-center justify-center">
                            <p className="text-xs text-muted-foreground">Sin datos</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

