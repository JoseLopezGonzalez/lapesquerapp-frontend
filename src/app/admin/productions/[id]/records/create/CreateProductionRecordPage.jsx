'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getProductionRecords, getProductionRecord } from '@/services/productionService'
import CreateProductionRecordForm from '@/components/Admin/Productions/CreateProductionRecordForm'
import ProductionInputsManager from '@/components/Admin/Productions/ProductionInputsManager'
import ProductionOutputsManager from '@/components/Admin/Productions/ProductionOutputsManager'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

const CreateProductionRecordPage = ({ productionId }) => {
    const { data: session } = useSession()
    const router = useRouter()
    const [records, setRecords] = useState([])
    const [createdRecordId, setCreatedRecordId] = useState(null)
    const [createdRecord, setCreatedRecord] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadingRecord, setLoadingRecord] = useState(false)

    useEffect(() => {
        if (session?.user?.accessToken && productionId) {
            loadRecords()
        }
    }, [session, productionId])

    useEffect(() => {
        if (createdRecordId && session?.user?.accessToken) {
            loadCreatedRecord()
        }
    }, [createdRecordId, session])

    const loadRecords = async () => {
        try {
            const token = session.user.accessToken
            const response = await getProductionRecords(token, { production_id: productionId })
            setRecords(response.data || [])
        } catch (err) {
            console.error('Error loading records:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadCreatedRecord = async () => {
        try {
            setLoadingRecord(true)
            const token = session.user.accessToken
            const recordData = await getProductionRecord(createdRecordId, token)
            setCreatedRecord(recordData)
        } catch (err) {
            console.error('Error loading created record:', err)
        } finally {
            setLoadingRecord(false)
        }
    }

    const handleSuccess = (createdId) => {
        // Guardar el ID del proceso creado
        if (createdId) {
            setCreatedRecordId(createdId)
        }
    }

    const handleRefresh = () => {
        if (createdRecordId) {
            loadCreatedRecord()
        }
    }

    if (loading) {
        return (
            <div className="h-full w-full overflow-y-auto">
                <div className="p-6 space-y-6">
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="h-full w-full overflow-y-auto">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push(`/admin/productions/${productionId}`)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">
                            {createdRecordId ? `Proceso #${createdRecordId}` : 'Crear Nuevo Proceso'}
                        </h1>
                        <p className="text-muted-foreground">
                            Producción #{productionId}
                        </p>
                    </div>
                </div>

                {/* Formulario de creación o información del proceso creado */}
                {!createdRecordId ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Crear Nuevo Proceso</CardTitle>
                            <CardDescription>
                                Completa el formulario para crear un nuevo proceso en esta producción
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CreateProductionRecordForm
                                productionId={productionId}
                                existingRecords={records}
                                onSuccess={(createdId) => handleSuccess(createdId)}
                                mode="page"
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Información del proceso creado */}
                        {createdRecord && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Proceso Creado Exitosamente</CardTitle>
                                    <CardDescription>
                                        Ahora puedes agregar entradas y salidas al proceso
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <p className="text-sm">
                                            <span className="font-medium">ID del Proceso:</span> {createdRecord.id}
                                        </p>
                                        {createdRecord.process && (
                                            <p className="text-sm">
                                                <span className="font-medium">Tipo:</span> {createdRecord.process.name}
                                            </p>
                                        )}
                                        {createdRecord.notes && (
                                            <p className="text-sm">
                                                <span className="font-medium">Notas:</span> {createdRecord.notes}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Inputs y Outputs en dos columnas */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Inputs */}
                            <Card className="h-fit">
                                <CardHeader>
                                    <CardTitle>Entradas de Cajas</CardTitle>
                                    <CardDescription>
                                        Cajas consumidas en este proceso
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loadingRecord ? (
                                        <Skeleton className="h-64 w-full" />
                                    ) : (
                                        <ProductionInputsManager
                                            productionRecordId={createdRecordId}
                                            onRefresh={handleRefresh}
                                            hideTitle={true}
                                        />
                                    )}
                                </CardContent>
                            </Card>

                            {/* Outputs */}
                            <Card className="h-fit">
                                <CardHeader>
                                    <CardTitle>Salidas Lógicas</CardTitle>
                                    <CardDescription>
                                        Productos producidos en este proceso
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loadingRecord ? (
                                        <Skeleton className="h-64 w-full" />
                                    ) : (
                                        <ProductionOutputsManager
                                            productionRecordId={createdRecordId}
                                            onRefresh={handleRefresh}
                                            hideTitle={true}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Botón para ir al detalle completo */}
                        <div className="flex justify-end">
                            <Button
                                onClick={() => router.push(`/admin/productions/${productionId}/records/${createdRecordId}`)}
                            >
                                Ver Detalle Completo del Proceso
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default CreateProductionRecordPage

