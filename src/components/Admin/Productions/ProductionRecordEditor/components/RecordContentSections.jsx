'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ProductionInputsManager from '../../ProductionInputsManager'
import ProductionOutputsManager from '../../ProductionOutputsManager'
import ProductionOutputConsumptionsManager from '../../ProductionOutputConsumptionsManager'
import ProductionRecordImagesManager from '../../ProductionRecordImagesManager'
import ProductionCostsManager from '../../ProductionCostsManager'
import { useProductionRecordContext } from '@/context/ProductionRecordContext'
import { ChevronDown, ChevronRight } from 'lucide-react'

/**
 * Secciones de contenido del record (inputs, outputs, consumos, imágenes)
 */
export const RecordContentSections = ({
    recordId,
    onRefresh
}) => {
    // Obtener datos del contexto
    const {
        record,
        recordInputs,
        recordOutputs,
        recordConsumptions,
        hasParent,
        updateRecord
    } = useProductionRecordContext()
    const [sectionState, setSectionState] = useState({
        inputsOpen: false,
        inputsLoaded: false,
        consumptionsOpen: false,
        consumptionsLoaded: false,
        outputsOpen: false,
        outputsLoaded: false,
    })

    // Usar updateRecord como onRefresh si está disponible
    const handleRefresh = onRefresh || (() => updateRecord?.())

    const openSection = (sectionKey) => {
        setSectionState((prev) => ({
            ...prev,
            [`${sectionKey}Open`]: !prev[`${sectionKey}Open`],
            [`${sectionKey}Loaded`]: true,
        }))
    }

    const LazyManagerSection = ({
        sectionKey,
        title,
        description,
        children,
    }) => {
        const isOpen = sectionState[`${sectionKey}Open`]
        const isLoaded = sectionState[`${sectionKey}Loaded`]

        return (
            <div className="break-inside-avoid mb-6 max-w-full w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                        <div>
                            <CardTitle>{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => openSection(sectionKey)}
                        >
                            {isOpen ? (
                                <>
                                    <ChevronDown className="h-4 w-4 mr-2" />
                                    Ocultar
                                </>
                            ) : (
                                <>
                                    <ChevronRight className="h-4 w-4 mr-2" />
                                    {isLoaded ? 'Mostrar' : 'Cargar'}
                                </>
                            )}
                        </Button>
                    </CardHeader>
                    {isLoaded ? (
                        <CardContent className={isOpen ? 'pt-0' : 'hidden'}>
                            {children}
                        </CardContent>
                    ) : null}
                </Card>
            </div>
        )
    }

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

            <LazyManagerSection
                sectionKey="inputs"
                title="Consumo de materia prima desde stock"
                description="Materia prima consumida desde el stock"
            >
                <ProductionInputsManager
                    productionRecordId={recordId}
                    initialInputs={recordInputs}
                    onRefresh={handleRefresh}
                    hideTitle={true}
                    renderInCard={false}
                />
            </LazyManagerSection>

            <LazyManagerSection
                sectionKey="consumptions"
                title="Consumos de proceso anterior"
                description="Productos consumidos del proceso anterior"
            >
                <ProductionOutputConsumptionsManager
                    productionRecordId={recordId}
                    initialConsumptions={recordConsumptions}
                    hasParent={hasParent}
                    onRefresh={handleRefresh}
                    hideTitle={true}
                    renderInCard={false}
                />
            </LazyManagerSection>

            <LazyManagerSection
                sectionKey="outputs"
                title="Productos resultantes"
                description="Productos resultantes de este proceso"
            >
                <ProductionOutputsManager
                    productionRecordId={recordId}
                    initialOutputs={recordOutputs}
                    onRefresh={handleRefresh}
                    hideTitle={true}
                    renderInCard={false}
                />
            </LazyManagerSection>

            {/* Costes del Proceso */}
            <div className="break-inside-avoid mb-6 max-w-full w-full">
                <ProductionCostsManager
                    productionRecordId={recordId}
                    productionId={null}
                />
            </div>
        </>
    )
}
