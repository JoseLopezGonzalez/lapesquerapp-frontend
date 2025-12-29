'use client'

import React from 'react'
import { formatCostPerKg, formatTotalCost } from '@/helpers/production/costFormatters'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

/**
 * Componente para mostrar costes de un output
 * @param {Object} output - Production output con costes
 * @param {boolean} showDetails - Mostrar detalles adicionales
 * @param {string} size - Tamaño del display ('sm' | 'md' | 'lg')
 */
export default function CostDisplay({ output, showDetails = false, size = 'md' }) {
    if (!output) return null;

    const hasCost = output.costPerKg !== null && output.costPerKg !== undefined;
    
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    if (!hasCost) {
        return (
            <Badge variant="outline" className="text-gray-500">
                Sin coste calculado
            </Badge>
        );
    }

    return (
        <div className={`flex flex-col gap-1 ${sizeClasses[size]}`}>
            <div className="flex items-center gap-2">
                <span className="font-semibold">{formatCostPerKg(output.costPerKg)}</span>
                {showDetails && output.totalCost && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Coste total: {formatTotalCost(output.totalCost)}</p>
                                {output.weightKg && (
                                    <p>Peso: {output.weightKg} kg</p>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            {showDetails && output.totalCost && (
                <span className="text-sm text-gray-600">
                    Total: {formatTotalCost(output.totalCost)}
                </span>
            )}
        </div>
    );
}

