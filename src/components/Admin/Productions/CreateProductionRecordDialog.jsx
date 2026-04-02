'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { ProductionRecordProvider, useProductionRecordContext } from '@/context/ProductionRecordContext'
import { ProcessInfoForm } from '@/components/Admin/Productions/ProductionRecordEditor/components/ProcessInfoForm'
import { useRecordFormData } from '@/components/Admin/Productions/ProductionRecordEditor/hooks/useRecordFormData'
import { useRecordFormSubmission } from '@/components/Admin/Productions/ProductionRecordEditor/hooks/useRecordFormSubmission'
import Loader from '@/components/Utilities/Loader'

const CreateProductionRecordDialogBody = ({ productionId }) => {
    const {
        record,
        processes,
        existingRecords,
        loading,
        saving,
        error,
        isEditMode,
        saveRecord
    } = useProductionRecordContext()

    const { formData, setFormData } = useRecordFormData(record, processes, isEditMode)

    const { handleSubmit, isNavigatePending } = useRecordFormSubmission({
        productionId,
        recordId: null,
        saveRecord,
        formData
    })

    const blocking = saving || isNavigatePending

    if (loading) {
        return (
            <div className="flex min-h-[200px] items-center justify-center py-8">
                <Loader text="Cargando formulario..." />
            </div>
        )
    }

    return (
        <div className="relative min-h-[200px]">
            {blocking ? (
                <div
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/90 backdrop-blur-[1px]"
                    aria-busy="true"
                    aria-live="polite"
                >
                    <Loader
                        text={
                            isNavigatePending
                                ? 'Abriendo el proceso...'
                                : 'Creando proceso...'
                        }
                    />
                </div>
            ) : null}

            {error ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            <ProcessInfoForm
                layout="embedded"
                formData={formData}
                onFormDataChange={setFormData}
                processes={processes}
                existingRecords={existingRecords}
                currentRecordId={null}
                isEditMode={isEditMode}
                saving={blocking}
                onSubmit={handleSubmit}
            />
        </div>
    )
}

/**
 * Diálogo con el formulario de creación de proceso (antes en /records/create).
 */
const CreateProductionRecordDialog = ({ open, onOpenChange, productionId, onRefresh }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="2xl" className="max-h-[min(90vh,840px)] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nuevo proceso</DialogTitle>
                    <DialogDescription>
                        Elige el tipo de proceso y, si aplica, el proceso padre. Al crear, irás al detalle para
                        registrar entradas y salidas.
                    </DialogDescription>
                </DialogHeader>
                {open ? (
                    <ProductionRecordProvider
                        productionId={productionId}
                        recordId={null}
                        onRefresh={onRefresh}
                    >
                        <CreateProductionRecordDialogBody productionId={productionId} />
                    </ProductionRecordProvider>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}

export default CreateProductionRecordDialog
