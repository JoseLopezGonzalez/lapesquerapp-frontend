'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import ProductionInputsManager from '../../ProductionInputsManager'
import ProductionOutputsManager from '../../ProductionOutputsManager'
import ProductionOutputConsumptionsManager from '../../ProductionOutputConsumptionsManager'
import ProductionRecordImagesManager from '../../ProductionRecordImagesManager'

/**
 * Secciones de contenido del record (inputs, outputs, consumos, imágenes)
 */
export const RecordContentSections = ({
    recordId,
    onRefresh
}) => {
    if (!recordId) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                        Crea el proceso primero para poder agregar entradas y salidas
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            {/* Imágenes */}
            <div className="break-inside-avoid mb-6 max-w-full w-full">
                <ProductionRecordImagesManager
                    productionRecordId={recordId}
                    onRefresh={onRefresh}
                    hideTitle={true}
                    renderInCard={true}
                    cardTitle="Imágenes del Proceso"
                    cardDescription="Imágenes asociadas a este proceso de producción"
                />
            </div>

            {/* Inputs */}
            <div className="break-inside-avoid mb-6 max-w-full w-full">
                <ProductionInputsManager
                    productionRecordId={recordId}
                    onRefresh={onRefresh}
                    hideTitle={true}
                    renderInCard={true}
                    cardTitle="Consumo de materia prima desde stock"
                    cardDescription="Materia prima consumida desde el stock"
                />
            </div>

            {/* Consumos del Padre */}
            <div className="break-inside-avoid mb-6 max-w-full w-full">
                <ProductionOutputConsumptionsManager
                    productionRecordId={recordId}
                    onRefresh={onRefresh}
                    hideTitle={true}
                    renderInCard={true}
                    cardTitle="Consumos de proceso anterior"
                    cardDescription="Productos consumidos del proceso anterior"
                />
            </div>

            {/* Outputs */}
            <div className="break-inside-avoid mb-6 max-w-full w-full">
                <ProductionOutputsManager
                    productionRecordId={recordId}
                    onRefresh={onRefresh}
                    hideTitle={true}
                    renderInCard={true}
                    cardTitle="Productos resultantes"
                    cardDescription="Productos resultantes de este proceso"
                />
            </div>
        </>
    )
}

