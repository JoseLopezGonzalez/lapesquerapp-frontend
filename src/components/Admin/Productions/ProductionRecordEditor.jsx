'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useProductionRecord } from '@/hooks/useProductionRecord'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Loader from '@/components/Utilities/Loader'
import { AlertCircle } from 'lucide-react'
import { RecordHeader } from './ProductionRecordEditor/components/RecordHeader'
import { ProcessInfoForm } from './ProductionRecordEditor/components/ProcessInfoForm'
import { ProcessSummaryCard } from './ProductionRecordEditor/components/ProcessSummaryCard'
import { RecordContentSections } from './ProductionRecordEditor/components/RecordContentSections'
import { useRecordFormData } from './ProductionRecordEditor/hooks/useRecordFormData'
import { useRecordFormSubmission } from './ProductionRecordEditor/hooks/useRecordFormSubmission'

const ProductionRecordEditor = ({ productionId, recordId = null }) => {
    const router = useRouter()
    
    const {
        record,
        production,
        processes,
        existingRecords,
        loading,
        saving,
        error,
        isEditMode,
        saveRecord,
        refresh
    } = useProductionRecord(productionId, recordId)

    const {
        formData,
        setFormData
    } = useRecordFormData(record, processes, isEditMode)

    const { handleSubmit } = useRecordFormSubmission({
        productionId,
        recordId,
        saveRecord,
        formData
    })

    const handleRefresh = () => {
        refresh()
    }

    if (loading) {
        return (
            <div className="h-full w-full overflow-y-auto flex items-center justify-center">
                <Loader />
            </div>
        )
    }

    if (error && !record && isEditMode) {
        return (
            <div className="h-full w-full overflow-y-auto">
                <div className="p-6">
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Error
                            </CardTitle>
                            <CardDescription>{error}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => router.push(`/admin/productions/${productionId}`)}>Volver</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    const currentRecordId = record?.id || recordId
    const isCompleted = record?.finishedAt !== null
    const isRoot = !record?.parentRecordId && (!formData.parent_record_id || formData.parent_record_id === 'none')

    return (
        <div className="h-full w-full overflow-y-auto">
            <div className="p-6 space-y-6">
                {/* Header */}
                <RecordHeader
                    productionId={productionId}
                    isEditMode={isEditMode}
                    recordId={recordId}
                    processName={record?.process?.name}
                    productionLot={production?.lot}
                    isRoot={isRoot}
                    isCompleted={isCompleted}
                />

                {/* Mensaje de error si existe */}
                {error && (
                    <Card className="border-destructive">
                        <CardContent className="pt-6">
                            <p className="text-sm text-destructive">{error}</p>
                        </CardContent>
                    </Card>
                )}

                <div className="w-full columns-1 lg:columns-2 gap-6 space-y-6">
                    {/* Formulario de Información del Proceso */}
                    <div className="break-inside-avoid mb-6 max-w-full w-full">
                        <ProcessInfoForm
                            formData={formData}
                            onFormDataChange={setFormData}
                            processes={processes}
                            existingRecords={existingRecords}
                            currentRecordId={currentRecordId}
                            isEditMode={isEditMode}
                            saving={saving}
                            onSubmit={handleSubmit}
                        />
                    </div>

                    {/* Resumen del Proceso */}
                    {currentRecordId && record && (
                        <div className="break-inside-avoid mb-6 max-w-full w-full">
                            <ProcessSummaryCard record={record} />
                        </div>
                    )}

                    {/* Inputs, Outputs, Consumos e Imágenes */}
                    <RecordContentSections
                        recordId={currentRecordId}
                        onRefresh={handleRefresh}
                    />
                </div>
            </div>
        </div>
    )
}

export default ProductionRecordEditor
