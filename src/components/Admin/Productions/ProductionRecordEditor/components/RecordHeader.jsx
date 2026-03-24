'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, Clock, Loader2 } from 'lucide-react'

/**
 * Header del editor de record de producción
 */
export const RecordHeader = ({ 
    productionId, 
    isEditMode, 
    recordId, 
    processName,
    productionLot,
    isRoot,
    isCompleted 
}) => {
    const router = useRouter()
    const [isNavigating, setIsNavigating] = useState(false)

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Button
                    variant="icon"
                    disabled={isNavigating}
                    onClick={() => {
                        setIsNavigating(true)
                        router.push(`/admin/productions/${productionId}`)
                    }}
                    className="gap-2 -ml-2"
                >
                    {isNavigating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
                </Button>
                <div className="h-6 w-px bg-border" />
                <div className="space-y-1">
                    <h1 className="text-3xl font-medium">
                        {isEditMode 
                            ? processName || `Proceso #${recordId}`
                            : 'Crear Nuevo Proceso'}
                    </h1>
                    {productionLot && (
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>Lote: <span className="font-medium text-foreground">{productionLot}</span></span>
                        </div>
                    )}
                </div>
            </div>
            {isEditMode && (
                <div className="flex items-center gap-2">
                    {isRoot && (
                        <Badge variant="outline">Proceso Raíz</Badge>
                    )}
                    {isCompleted ? (
                        <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completado
                        </Badge>
                    ) : (
                        <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            En progreso
                        </Badge>
                    )}
                </div>
            )}
        </div>
    )
}

